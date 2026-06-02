#!/usr/bin/env python3
"""
Gap 6: Research Memory Capture
Playwright wrapper: HTML + screenshot per iteration → LLM summary → saved to mind-weaver/research/
Weekly consolidation digest
"""

import hashlib
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, List
from dataclasses import dataclass, asdict

REPO_ROOT = Path(__file__).parent.parent.resolve()
RESEARCH_DIR = REPO_ROOT / "mind-weaver" / "research"
SCREENSHOT_DIR = RESEARCH_DIR / "screenshots"
HTML_DIR = RESEARCH_DIR / "html"
SUMMARY_DIR = RESEARCH_DIR / "summaries"


@dataclass
class ResearchSession:
    session_id: str
    query: str
    started_at: str
    completed_at: Optional[str] = None
    pages: List[Dict] = None
    
    def __post_init__(self):
        if self.pages is None:
            self.pages = []


class ResearchCapture:
    """Capture and summarize research sessions"""
    
    def __init__(self):
        RESEARCH_DIR.mkdir(parents=True, exist_ok=True)
        SCREENSHOT_DIR.mkdir(exist_ok=True)
        HTML_DIR.mkdir(exist_ok=True)
        SUMMARY_DIR.mkdir(exist_ok=True)
        
        self.current_session: Optional[ResearchSession] = None
    
    def start_session(self, query: str) -> str:
        """Start a new research session"""
        session_id = hashlib.sha256(
            f"{query}-{datetime.utcnow().isoformat()}".encode()
        ).hexdigest()[:12]
        
        self.current_session = ResearchSession(
            session_id=session_id,
            query=query,
            started_at=datetime.utcnow().isoformat()
        )
        
        return session_id
    
    def capture(self, url: str, html: str, screenshot_path: Optional[str] = None) -> Dict:
        """Capture a page iteration"""
        if not self.current_session:
            raise RuntimeError("No active session. Call start_session() first.")
        
        timestamp = datetime.utcnow().isoformat()
        page_id = hashlib.sha256(f"{url}-{timestamp}".encode()).hexdigest()[:8]
        
        # Save HTML
        html_file = HTML_DIR / f"{page_id}.html"
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(html)
        
        # Save screenshot reference or copy
        screenshot_dest = None
        if screenshot_path and Path(screenshot_path).exists():
            ext = Path(screenshot_path).suffix
            screenshot_dest = SCREENSHOT_DIR / f"{page_id}{ext}"
            import shutil
            shutil.copy(screenshot_path, screenshot_dest)
        
        page_data = {
            "id": page_id,
            "url": url,
            "timestamp": timestamp,
            "html_file": str(html_file.relative_to(RESEARCH_DIR)),
            "screenshot": str(screenshot_dest.relative_to(RESEARCH_DIR)) if screenshot_dest else None
        }
        
        self.current_session.pages.append(page_data)
        
        return page_data
    
    def summarize(self, llm_provider: Optional[str] = None) -> str:
        """Generate LLM summary of session"""
        if not self.current_session:
            raise RuntimeError("No active session.")
        
        # Build summary prompt
        pages_summary = []
        for page in self.current_session.pages:
            # Extract key content from HTML (simple heuristic)
            html_file = RESEARCH_DIR / page["html_file"]
            title = ""
            if html_file.exists():
                content = html_file.read_text(encoding='utf-8', errors='ignore')
                # Extract title
                if "<title>" in content:
                    title = content.split("<title>")[1].split("</title>")[0][:200]
            
            pages_summary.append({
                "url": page["url"],
                "title": title
            })
        
        # Create summary entry
        summary_data = {
            "session_id": self.current_session.session_id,
            "query": self.current_session.query,
            "started": self.current_session.started_at,
            "completed": datetime.utcnow().isoformat(),
            "page_count": len(self.current_session.pages),
            "pages": pages_summary,
            "llm_summary": None,  # To be filled by LLM
            "key_findings": [],
            "sources": [p["url"] for p in self.current_session.pages]
        }
        
        # Save summary
        summary_file = SUMMARY_DIR / f"{self.current_session.session_id}.json"
        with open(summary_file, 'w') as f:
            json.dump(summary_data, f, indent=2)
        
        # Generate LLM prompt for manual processing
        prompt = self._generate_summary_prompt(summary_data)
        prompt_file = SUMMARY_DIR / f"{self.current_session.session_id}.prompt.txt"
        with open(prompt_file, 'w') as f:
            f.write(prompt)
        
        self.current_session.completed_at = datetime.utcnow().isoformat()
        
        return str(summary_file)
    
    def _generate_summary_prompt(self, summary_data: dict) -> str:
        """Generate LLM prompt for session summary"""
        lines = [
            "Research Session Summary Request",
            "=" * 50,
            "",
            f"Query: {summary_data['query']}",
            f"Pages visited: {summary_data['page_count']}",
            f"Date: {summary_data['started']}",
            "",
            "Sources:",
        ]
        
        for page in summary_data['pages']:
            lines.append(f"  • {page['url']}")
            if page['title']:
                lines.append(f"    Title: {page['title']}")
        
        lines.extend([
            "",
            "Task: Provide a 3-sentence summary of key findings from this research session.",
            "Focus on actionable insights relevant to the original query.",
            "",
            "Output format (JSON):",
            json.dumps({
                "summary": "3-sentence summary here",
                "key_findings": ["finding 1", "finding 2"],
                "next_steps": ["action 1"]
            }, indent=2)
        ])
        
        return '\n'.join(lines)
    
    def weekly_digest(self) -> str:
        """Generate weekly consolidation digest"""
        # Get all summaries from last 7 days
        now = datetime.utcnow()
        week_ago = now.timestamp() - (7 * 24 * 60 * 60)
        
        recent_summaries = []
        for summary_file in SUMMARY_DIR.glob("*.json"):
            try:
                mtime = summary_file.stat().st_mtime
                if mtime > week_ago:
                    with open(summary_file, 'r') as f:
                        data = json.load(f)
                        recent_summaries.append(data)
            except:
                continue
        
        # Sort by date
        recent_summaries.sort(key=lambda x: x.get("started", ""))
        
        # Generate digest
        digest_file = RESEARCH_DIR / "weekly-digest" / f"digest-{now.strftime('%Y-%W')}.md"
        digest_file.parent.mkdir(exist_ok=True)
        
        with open(digest_file, 'w') as f:
            f.write(f"# Research Digest: Week {now.strftime('%Y-%W')}\n\n")
            f.write(f"Generated: {now.isoformat()}\n\n")
            f.write(f"Sessions: {len(recent_summaries)}\n\n")
            
            for session in recent_summaries:
                f.write(f"## {session['query']}\n\n")
                f.write(f"- Session ID: `{session['session_id']}`\n")
                f.write(f"- Pages: {session['page_count']}\n")
                f.write(f"- Sources: {', '.join(session['sources'][:3])}\n")
                if session.get('llm_summary'):
                    f.write(f"\n**Summary:** {session['llm_summary']}\n")
                f.write("\n")
        
        return str(digest_file)
    
    def search(self, query: str) -> List[dict]:
        """Search across all research sessions"""
        results = []
        query_lower = query.lower()
        
        for summary_file in SUMMARY_DIR.glob("*.json"):
            with open(summary_file, 'r') as f:
                try:
                    data = json.load(f)
                    text = json.dumps(data).lower()
                    if query_lower in text:
                        results.append(data)
                except:
                    continue
        
        return results


# Playwright integration helper
class PlaywrightResearchCapture(ResearchCapture):
    """Research capture with Playwright integration"""
    
    def __init__(self):
        super().__init__()
        self._ playwright_available = False
        try:
            from playwright.sync_api import sync_playwright
            self._playwright_available = True
        except ImportError:
            pass
    
    async def capture_live(self, url: str, wait_for: Optional[str] = None):
        """Capture a live page using Playwright"""
        if not self._playwright_available:
            print("[!] Playwright not installed. Run: pip install playwright")
            print("    Then: playwright install chromium")
            return None
        
        from playwright.async_api import async_playwright
        
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            
            await page.goto(url)
            
            if wait_for:
                await page.wait_for_selector(wait_for)
            
            # Get HTML
            html = await page.content()
            
            # Take screenshot
            screenshot_path = SCREENSHOT_DIR / f"temp-{hash(url) % 10000}.png"
            await page.screenshot(path=str(screenshot_path))
            
            await browser.close()
            
            return self.capture(url, html, str(screenshot_path))


# CLI interface
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Research Memory Capture")
    parser.add_argument("action", choices=[
        "start", "capture", "summarize", "digest", "search", "list"
    ])
    parser.add_argument("--query")
    parser.add_argument("--url")
    parser.add_argument("--html-file")
    parser.add_argument("--screenshot")
    
    args = parser.parse_args()
    
    capture = ResearchCapture()
    
    if args.action == "start":
        if args.query:
            session_id = capture.start_session(args.query)
            print(f"[+] Session started: {session_id}")
    
    elif args.action == "capture":
        if args.url and args.html_file:
            with open(args.html_file, 'r') as f:
                html = f.read()
            page = capture.capture(args.url, html, args.screenshot)
            print(f"[+] Captured: {page['id']}")
    
    elif args.action == "summarize":
        summary_file = capture.summarize()
        print(f"[+] Summary saved: {summary_file}")
    
    elif args.action == "digest":
        digest = capture.weekly_digest()
        print(f"[+] Digest: {digest}")
    
    elif args.action == "search":
        if args.query:
            results = capture.search(args.query)
            for r in results[:5]:
                print(f"Session: {r['query']}")
                print(f"  Sources: {len(r.get('sources', []))}")
