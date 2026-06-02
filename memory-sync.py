#!/usr/bin/env python3
"""
memory-sync.py - Canonical memory pipeline for mind-weaver
Pulls from Notion/GitHub, writes structured JSONL, runtime < 5s
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Dict, Any
import urllib.request
import urllib.error
import subprocess

# Config
MIND_WEAVER_DIR = Path.home() / "mind-weaver"
MEMORY_FILE = MIND_WEAVER_DIR / "memory.jsonl"
RESEARCH_DIR = MIND_WEAVER_DIR / "research"
NOTION_TOKEN = os.getenv("NOTION_TOKEN")
NOTION_DB_ID = os.getenv("NOTION_MEMORY_DB")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_REPO = os.getenv("GITHUB_MEMORY_REPO")

MIND_WEAVER_DIR.mkdir(parents=True, exist_ok=True)
RESEARCH_DIR.mkdir(exist_ok=True, exist_ok=True)


class MemoryEntry:
    """Single memory record with strict schema."""
    
    def __init__(
        self,
        source: str,
        content: str,
        tags: List[str] = None,
        refs: List[str] = None,
        priority: int = 0
    ):
        self.id = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S") + "_" + str(hash(content))[:8]
        self.timestamp = datetime.now(timezone.utc).isoformat()
        self.source = source  # 'notion', 'github', 'research', 'agent'
        self.content = content
        self.tags = tags or []
        self.refs = refs or []  # File paths, URLs
        self.priority = priority  # 0-10, higher = more important
        self.embedding = None  # Reserved for vector search
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "source": self.source,
            "content": self.content,
            "tags": self.tags,
            "refs": self.refs,
            "priority": self.priority,
            "embedding": self.embedding
        }


class MemorySync:
    """Sync memories from all sources to canonical JSONL."""
    
    def __init__(self):
        self.entries: List[MemoryEntry] = []
    
    def fetch_notion(self) -> List[MemoryEntry]:
        """Pull from Notion database."""
        if not NOTION_TOKEN or not NOTION_DB_ID:
            print("[memory-sync] Skipping Notion (no token/db)")
            return []
        
        entries = []
        url = f"https://api.notion.com/v1/databases/{NOTION_DB_ID}/query"
        req = urllib.request.Request(
            url,
            headers={
                "Authorization": f"Bearer {NOTION_TOKEN}",
                "Notion-Version": "2022-06-28",
                "Content-Type": "application/json"
            },
            data=json.dumps({"page_size": 100}).encode()
        )
        
        try:
            with urllib.request.urlopen(req, timeout=30) as res:
                data = json.loads(res.read())
                for page in data.get("results", []):
                    props = page.get("properties", {})
                    content = self._extract_notion_content(props)
                    tags = [t["name"] for t in props.get("Tags", {}).get("multi_select", [])]
                    priority = props.get("Priority", {}).get("number", 0)
                    
                    entries.append(MemoryEntry(
                        source="notion",
                        content=content,
                        tags=tags,
                        priority=priority
                    ))
        except urllib.error.HTTPError as e:
            print(f"[memory-sync] Notion error: {e.code}")
        
        return entries
    
    def _extract_notion_content(self, props: Dict) -> str:
        """Extract text from Notion page properties."""
        title = props.get("Name", {}).get("title", [{}])[0].get("text", {}).get("content", "")
        rich = props.get("Content", {}).get("rich_text", [])
        content = "".join(r.get("text", {}).get("content", "") for r in rich)
        return f"{title}\n{content}".strip()
    
    def fetch_github_issues(self) -> List[MemoryEntry]:
        """Pull from GitHub repo issues as memory items."""
        if not GITHUB_TOKEN or not GITHUB_REPO:
            print("[memory-sync] Skipping GitHub (no token/repo)")
            return []
        
        entries = []
        url = f"https://api.github.com/repos/{GITHUB_REPO}/issues?state=all&per_page=50"
        req = urllib.request.Request(
            url,
            headers={
                "Authorization": f"token {GITHUB_TOKEN}",
                "Accept": "application/vnd.github.v3+json"
            }
        )
        
        try:
            with urllib.request.urlopen(req, timeout=30) as res:
                issues = json.loads(res.read())
                for issue in issues:
                    labels = [l["name"] for l in issue.get("labels", [])]
                    entries.append(MemoryEntry(
                        source="github",
                        content=f"{issue['title']}\n{issue.get('body', '')}",
                        tags=labels + ["github-issue"],
                        refs=[issue["html_url"]],
                        priority=5 if issue.get("state") == "open" else 3
                    ))
        except urllib.error.HTTPError as e:
            print(f"[memory-sync] GitHub error: {e.code}")
        
        return entries
    
    def load_research(self) -> List[MemoryEntry]:
        """Load research summaries from disk."""
        entries = []
        for f in sorted(RESEARCH_DIR.glob("*.json")):
            try:
                data = json.loads(f.read_text())
                entries.append(MemoryEntry(
                    source="research",
                    content=data.get("summary", ""),
                    tags=["research", data.get("topic", "unknown")],
                    refs=data.get("sources", []),
                    priority=data.get("priority", 0)
                ))
            except Exception as e:
                print(f"[memory-sync] Skipping {f}: {e}")
        return entries
    
    def sync(self):
        """Full sync: fetch all sources, merge, write JSONL, push to GitHub."""
        print("[memory-sync] Starting sync...")
        
        # Fetch from all sources
        self.entries = []
        self.entries.extend(self.fetch_notion())
        self.entries.extend(self.fetch_github_issues())
        self.entries.extend(self.load_research())
        
        # Sort by priority desc, then timestamp desc
        self.entries.sort(key=lambda e: (-e.priority, e.timestamp), reverse=False)
        
        # Write JSONL
        with open(MEMORY_FILE, 'w') as f:
            for entry in self.entries:
                f.write(json.dumps(entry.to_dict()) + "\n")
        
        print(f"[memory-sync] Wrote {len(self.entries)} entries to {MEMORY_FILE}")
        
        # Push to GitHub if configured
        self._push_to_github()
        
        return len(self.entries)
    
    def _push_to_github(self):
        """Commit and push mind-weaver to GitHub."""
        if not GITHUB_REPO:
            return
        
        try:
            os.chdir(MIND_WEAVER_DIR)
            
            # Init if needed
            if not (MIND_WEAVER_DIR / ".git").exists():
                subprocess.run(["git", "init"], check=True, capture_output=True)
                subprocess.run(
                    ["git", "remote", "add", "origin", 
                     f"https://{GITHUB_TOKEN}@github.com/{GITHUB_REPO}.git"],
                    check=True, capture_output=True
                )
            
            subprocess.run(["git", "add", "-A"], check=True, capture_output=True)
            subprocess.run(
                ["git", "commit", "-m", f"[memory-sync] {datetime.now().isoformat()}"],
                check=False, capture_output=True  # Don't fail if nothing to commit
            )
            subprocess.run(
                ["git", "push", "origin", "main", "--force"],
                check=True, capture_output=True
            )
            print(f"[memory-sync] Pushed to {GITHUB_REPO}")
        except subprocess.CalledProcessError as e:
            print(f"[memory-sync] Git push failed: {e}")


def load_memory(query: str = None, limit: int = 50) -> List[Dict]:
    """Read memory file, optionally filter by query."""
    if not MEMORY_FILE.exists():
        return []
    
    entries = []
    with open(MEMORY_FILE) as f:
        for line in f:
            entries.append(json.loads(line))
    
    if query:
        query_lower = query.lower()
        entries = [
            e for e in entries 
            if query_lower in e["content"].lower() 
            or any(query_lower in t.lower() for t in e["tags"])
        ]
    
    return entries[:limit]


def cli():
    import argparse
    parser = argparse.ArgumentParser(description="Memory sync pipeline")
    parser.add_argument("--sync", action="store_true", help="Run full sync")
    parser.add_argument("--query", help="Search memory")
    parser.add_argument("--limit", type=int, default=50)
    args = parser.parse_args()
    
    if args.sync:
        count = MemorySync().sync()
        print(f"[memory-sync] Complete: {count} entries")
    elif args.query:
        results = load_memory(args.query, args.limit)
        print(json.dumps(results, indent=2))
    else:
        # Read latest
        results = load_memory(limit=args.limit)
        print(json.dumps(results, indent=2))


if __name__ == "__main__":
    cli()