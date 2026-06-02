#!/usr/bin/env python3
"""
Gap 3: Memory Sync Pipeline
Pulls from Notion → writes structured JSONL → pushes to GitHub
Any agent runs `git pull` and has full context in <5 seconds
"""

import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

REPO_ROOT = Path(__file__).parent.parent.resolve()
MIND_WEAVER_DIR = REPO_ROOT / "mind-weaver"
MEMORY_DIR = MIND_WEAVER_DIR / "memory"
SOURCES_DIR = MEMORY_DIR / "sources"
NOTION_CACHE = MEMORY_DIR / "notion-cache.jsonl"
CANONICAL_STORE = MEMORY_DIR / "canonical-memory.jsonl"


class MemorySync:
    def __init__(self):
        self.notion_token = os.getenv("NOTION_TOKEN", "")
        self.github_token = os.getenv("GITHUB_TOKEN", "")
        self.memory_dir = MEMORY_DIR
        self.memory_dir.mkdir(parents=True, exist_ok=True)
        SOURCES_DIR.mkdir(exist_ok=True)
        
    def sync_notion(self, database_id: Optional[str] = None) -> int:
        """Pull from Notion database and cache locally"""
        if not self.notion_token:
            print("[!] NOTION_TOKEN not set. Skipping Notion sync.")
            return 0
        
        try:
            import requests
        except ImportError:
            print("[!] requests not installed. Run: pip install requests")
            return 0
        
        print(f"[+] Fetching from Notion...")
        
        headers = {
            "Authorization": f"Bearer {self.notion_token}",
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28"
        }
        
        entries = []
        
        # Query database or search pages
        if database_id:
            url = f"https://api.notion.com/v1/databases/{database_id}/query"
            response = requests.post(url, headers=headers, json={"page_size": 100})
        else:
            # Search all pages
            url = "https://api.notion.com/v1/search"
            response = requests.post(url, headers=headers, json={
                "query": "",
                "filter": {"value": "page", "property": "object"},
                "page_size": 100
            })
        
        if response.status_code != 200:
            print(f"[!] Notion API error: {response.status_code}")
            return 0
        
        data = response.json()
        
        # Convert to canonical format
        for item in data.get("results", []):
            entry = {
                "id": item["id"],
                "source": "notion",
                "type": item["object"],
                "title": self._extract_title(item),
                "url": item.get("url", ""),
                "created": item.get("created_time", ""),
                "modified": item.get("last_edited_time", ""),
                "synced": datetime.utcnow().isoformat(),
                "raw": item
            }
            entries.append(entry)
        
        # Append to cache
        with open(NOTION_CACHE, 'a') as f:
            for entry in entries:
                f.write(json.dumps(entry) + '\n')
        
        print(f"[+] Synced {len(entries)} entries from Notion")
        return len(entries)
    
    def _extract_title(self, item: dict) -> str:
        """Extract title from Notion page properties"""
        props = item.get("properties", {})
        
        # Try title property
        if "title" in props and props["title"]["title"]:
            return props["title"]["title"][0]["text"]["content"]
        
        # Try Name property
        if "Name" in props and props["Name"]["title"]:
            return props["Name"]["title"][0]["text"]["content"]
        
        return "Untitled"
    
    def consolidate(self) -> int:
        """Merge all sources into canonical memory store"""
        print("[+] Consolidating memory sources...")
        
        all_entries = []
        
        # Load Notion cache
        if NOTION_CACHE.exists():
            with open(NOTION_CACHE, 'r') as f:
                for line in f:
                    try:
                        all_entries.append(json.loads(line))
                    except json.JSONDecodeError:
                        continue
        
        # Load any other source files
        for source_file in SOURCES_DIR.glob("*.jsonl"):
            with open(source_file, 'r') as f:
                for line in f:
                    try:
                        all_entries.append(json.loads(line))
                    except json.JSONDecodeError:
                        continue
        
        # Deduplicate by ID
        seen = set()
        unique = []
        for entry in all_entries:
            if entry["id"] not in seen:
                seen.add(entry["id"])
                unique.append(entry)
        
        # Sort by modified time (newest first)
        unique.sort(key=lambda x: x.get("modified", ""), reverse=True)
        
        # Write canonical store
        with open(CANONICAL_STORE, 'w') as f:
            for entry in unique:
                f.write(json.dumps(entry) + '\n')
        
        print(f"[+] Canonical memory: {len(unique)} entries")
        return len(unique)
    
    def add_local_memory(self, entry_type: str, content: str, 
                         metadata: Optional[dict] = None) -> str:
        """Add a local memory entry"""
        entry = {
            "id": f"local-{datetime.utcnow().strftime('%Y%m%d-%H%M%S-%f')}",
            "source": "local",
            "type": entry_type,
            "content": content,
            "created": datetime.utcnow().isoformat(),
            "modified": datetime.utcnow().isoformat(),
            "metadata": metadata or {}
        }
        
        with open(CANONICAL_STORE, 'a') as f:
            f.write(json.dumps(entry) + '\n')
        
        return entry["id"]
    
    def search(self, query: str, limit: int = 10) -> List[dict]:
        """Search canonical memory"""
        if not CANONICAL_STORE.exists():
            return []
        
        results = []
        query_lower = query.lower()
        
        with open(CANONICAL_STORE, 'r') as f:
            for line in f:
                try:
                    entry = json.loads(line)
                    # Simple text search in title and content
                    text = json.dumps(entry).lower()
                    if query_lower in text:
                        results.append(entry)
                        if len(results) >= limit:
                            break
                except json.JSONDecodeError:
                    continue
        
        return results
    
    def push_to_github(self) -> bool:
        """Push memory updates to GitHub"""
        print("[+] Pushing to GitHub...")
        
        os.chdir(REPO_ROOT)
        
        try:
            # Check if there are changes
            result = subprocess.run(
                ["git", "status", "--porcelain"],
                capture_output=True,
                text=True
            )
            
            if not result.stdout.strip():
                print("[i] No changes to push")
                return True
            
            # Add, commit, push
            subprocess.run(["git", "add", "mind-weaver/memory/"], check=True)
            subprocess.run([
                "git", "commit", "-m", 
                f"[memory-sync] {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}"
            ], check=True)
            subprocess.run(["git", "push"], check=True)
            
            print("[+] Pushed to GitHub")
            return True
            
        except subprocess.CalledProcessError as e:
            print(f"[!] Git error: {e}")
            return False
    
    def quick_sync(self) -> bool:
        """Full sync: Notion → consolidate → GitHub"""
        self.sync_notion()
        self.consolidate()
        return self.push_to_github()
    
    def context_for_agent(self) -> str:
        """Generate context summary for next agent"""
        if not CANONICAL_STORE.exists():
            return "No memory data available."
        
        # Get last 50 entries
        entries = []
        with open(CANONICAL_STORE, 'r') as f:
            for line in f:
                try:
                    entries.append(json.loads(line))
                except:
                    continue
        
        recent = entries[-50:]
        
        lines = [f"Memory Context: {len(recent)} recent entries from {len(entries)} total", ""]
        
        # Group by source
        by_source = {}
        for e in recent:
            src = e.get("source", "unknown")
            by_source[src] = by_source.get(src, 0) + 1
        
        lines.append("Sources:")
        for src, count in by_source.items():
            lines.append(f"  • {src}: {count}")
        
        lines.append("")
        lines.append("Recent entries:")
        for e in recent[-10:]:
            title = e.get("title", e.get("content", "")[:50])
            lines.append(f"  • {e.get('type', 'unknown')}: {title}")
        
        return '\n'.join(lines)


# CLI interface
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Memory Sync Pipeline")
    parser.add_argument("action", choices=[
        "sync", "consolidate", "push", "search", "add", 
        "quick", "context"
    ])
    parser.add_argument("--notion-db")
    parser.add_argument("--query")
    parser.add_argument("--type", default="note")
    parser.add_argument("--content")
    parser.add_argument("--limit", type=int, default=10)
    
    args = parser.parse_args()
    
    sync = MemorySync()
    
    if args.action == "sync":
        sync.sync_notion(args.notion_db)
    
    elif args.action == "consolidate":
        sync.consolidate()
    
    elif args.action == "push":
        sync.push_to_github()
    
    elif args.action == "quick":
        sync.quick_sync()
    
    elif args.action == "search":
        if args.query:
            results = sync.search(args.query, args.limit)
            print(json.dumps(results, indent=2))
        else:
            print("[!] Provide --query for search")
    
    elif args.action == "add":
        if args.content:
            entry_id = sync.add_local_memory(args.type, args.content)
            print(f"[+] Added entry: {entry_id}")
        else:
            print("[!] Provide --content to add")
    
    elif args.action == "context":
        print(sync.context_for_agent())
