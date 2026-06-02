#!/usr/bin/env python3
"""
Gap 1: ECHO Nexus - Mobile ↔ Desktop Context Bridge
LLM-powered task capture bot (Telegram) + WSL2 watcher daemon
Solves mobile→desktop context loss problem
"""

import asyncio
import json
import os
import sys
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict

REPO_ROOT = Path(__file__).parent.parent.resolve()
ECHO_DIR = REPO_ROOT / "mind-weaver" / "echo-nexus"
QUEUE_FILE = ECHO_DIR / "tasks.jsonl"
STATE_FILE = ECHO_DIR / "state.json"


@dataclass
class Task:
    id: str
    user_id: str
    text: str
    source: str  # telegram, termux, desktop
    priority: str
    created_at: str
    captured_at: str
    status: str = "pending"  # pending, surfaced, completed, archived
    context: Dict = None
    
    def __post_init__(self):
        if self.context is None:
            self.context = {}


class ECHONexus:
    def __init__(self):
        self.echo_dir = ECHO_DIR
        self.echo_dir.mkdir(parents=True, exist_ok=True)
        self.telegram_token = os.getenv("TELEGRAM_BOT_TOKEN", "")
        
    def add_task(self, text: str, source: str = "unknown", 
                 user_id: str = "solo", priority: str = "medium") -> str:
        """Add a task to the queue"""
        task = Task(
            id=f"echo-{datetime.utcnow().strftime('%Y%m%d-%H%M%S-%f')}",
            user_id=user_id,
            text=text,
            source=source,
            priority=priority,
            created_at=datetime.utcnow().isoformat(),
            captured_at=datetime.utcnow().isoformat(),
            context={"raw_input": text}
        )
        
        with open(QUEUE_FILE, 'a') as f:
            f.write(json.dumps(asdict(task)) + '\n')
        
        return task.id
    
    def get_pending(self) -> List[Task]:
        """Get all pending tasks"""
        tasks = []
        
        if not QUEUE_FILE.exists():
            return tasks
        
        with open(QUEUE_FILE, 'r') as f:
            for line in f:
                try:
                    data = json.loads(line)
                    if data.get("status") == "pending":
                        tasks.append(Task(**data))
                except:
                    continue
        
        # Sort by priority (critical > high > medium > low)
        priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        tasks.sort(key=lambda t: priority_order.get(t.priority, 2))
        
        return tasks
    
    def mark_surfaced(self, task_id: str):
        """Mark task as surfaced to desktop"""
        return self._update_task(task_id, {"status": "surfaced"})
    
    def mark_completed(self, task_id: str):
        """Mark task as completed"""
        return self._update_task(task_id, {"status": "completed"})
    
    def mark_archived(self, task_id: str):
        """Archive a task"""
        return self._update_task(task_id, {"status": "archived"})
    
    def _update_task(self, task_id: str, updates: dict) -> bool:
        """Update task fields atomically"""
        if not QUEUE_FILE.exists():
            return False
        
        tasks = []
        found = False
        
        with open(QUEUE_FILE, 'r') as f:
            for line in f:
                try:
                    task = json.loads(line)
                    if task.get("id") == task_id:
                        task.update(updates)
                        found = True
                    tasks.append(task)
                except:
                    continue
        
        if found:
            with open(QUEUE_FILE, 'w') as f:
                for task in tasks:
                    f.write(json.dumps(task) + '\n')
        
        return found
    
    def telegram_handler(self, update: dict):
        """Handle incoming Telegram message"""
        message = update.get("message", {})
        text = message.get("text", "")
        chat_id = str(message.get("chat", {}).get("id", ""))
        
        # Parse priority tags
        priority = "medium"
        if text.startswith("!crit"):
            priority = "critical"
            text = text[5:].strip()
        elif text.startswith("!high"):
            priority = "high"
            text = text[5:].strip()
        elif text.startswith("!low"):
            priority = "low"
            text = text[4:].strip()
        
        task_id = self.add_task(text, source="telegram", user_id=chat_id, priority=priority)
        
        return {
            "chat_id": chat_id,
            "text": f"✅ Captured: {text[:50]}{'...' if len(text) > 50 else ''}\nID: {task_id}"
        }
    
    def surface_to_desktop(self) -> List[Task]:
        """Surface pending tasks to desktop - called by WSL2 watcher"""
        pending = self.get_pending()
        
        if not pending:
            print("[i] No pending tasks")
            return []
        
        print(f"[+] Surfacing {len(pending)} pending tasks:")
        
        for task in pending:
            print(f"  • [{task.priority.upper()}] {task.text[:60]}")
            self.mark_surfaced(task.id)
        
        return pending
    
    def start_telegram_bot(self):
        """Start Telegram bot polling"""
        if not self.telegram_token:
            print("[!] TELEGRAM_BOT_TOKEN not set")
            return
        
        try:
            import aiohttp
        except ImportError:
            print("[!] aiohttp not installed. Run: pip install aiohttp")
            return
        
        async def poll():
            offset = 0
            api_url = f"https://api.telegram.org/bot{self.telegram_token}"
            
            print("[+] Starting Telegram bot...")
            
            async with aiohttp.ClientSession() as session:
                while True:
                    try:
                        async with session.get(
                            f"{api_url}/getUpdates",
                            params={"offset": offset, "timeout": 30}
                        ) as resp:
                            data = await resp.json()
                            
                            for update in data.get("result", []):
                                offset = max(offset, update["update_id"] + 1)
                                
                                if "message" in update:
                                    response = self.telegram_handler(update)
                                    
                                    # Send response
                                    await session.post(
                                        f"{api_url}/sendMessage",
                                        json=response
                                    )
                    except Exception as e:
                        print(f"[!] Bot error: {e}")
                        await asyncio.sleep(5)
        
        asyncio.run(poll())


class WSL2Watcher:
    """WSL2 daemon that surfaces tasks at desktop login"""
    
    def __init__(self):
        self.nexus = ECHONexus()
        self.state_file = STATE_FILE
    
    def is_first_login_today(self) -> bool:
        """Check if this is first desktop session today"""
        if not self.state_file.exists():
            return True
        
        with open(self.state_file, 'r') as f:
            state = json.load(f)
        
        last_check = state.get("last_login_check", "")
        today = datetime.utcnow().strftime("%Y-%m-%d")
        
        return not last_check.startswith(today)
    
    def mark_checked(self):
        """Mark that we've checked today"""
        state = {"last_login_check": datetime.utcnow().isoformat()}
        with open(self.state_file, 'w') as f:
            json.dump(state, f)
    
    def surface_tasks(self):
        """Main entry point - call at desktop login"""
        if not self.is_first_login_today():
            return
        
        self.mark_checked()
        
        tasks = self.nexus.surface_to_desktop()
        
        if tasks:
            # Create desktop notification
            self._notify(f"{len(tasks)} tasks from ECHO Nexus", 
                        "Check terminal for details")
            
            # Log to handoff system if available
            handoff_path = REPO_ROOT / "mind-weaver" / "handoffs"
            if handoff_path.exists():
                print(f"\n🔄 Also check: python3 gap-8-handoff/handoff.py summary")
    
    def _notify(self, title: str, message: str):
        """Send desktop notification"""
        try:
            # Try PowerShell notification (WSL2 can call Windows)
            ps_cmd = f"""
            Add-Type -AssemblyName System.Windows.Forms
            [System.Windows.Forms.MessageBox]::Show("{message}", "{title}")
            """
            subprocess.run([
                "powershell.exe", "-Command", ps_cmd
            ], capture_output=True)
        except:
            # Fallback to console
            print(f"\n [{title}] {message}")


# CLI interface
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="ECHO Nexus - Mobile/Desktop Context Bridge")
    parser.add_argument("action", choices=[
        "add", "list", "surface", "complete", "archive",
        "bot", "watcher"
    ])
    parser.add_argument("--text")
    parser.add_argument("--task-id")
    parser.add_argument("--priority", default="medium")
    parser.add_argument("--source", default="cli")
    
    args = parser.parse_args()
    
    nexus = ECHONexus()
    watcher = WSL2Watcher()
    
    if args.action == "add":
        if args.text:
            task_id = nexus.add_task(args.text, args.source, priority=args.priority)
            print(f"[+] Task added: {task_id}")
        else:
            print("[!] Provide --text to add task")
    
    elif args.action == "list":
        tasks = nexus.get_pending()
        print(f"Pending tasks ({len(tasks)}):")
        for t in tasks:
            print(f"  • [{t.priority:8}] {t.text[:50]}")
    
    elif args.action == "surface":
        watcher.surface_tasks()
    
    elif args.action == "complete":
        if args.task_id:
            if nexus.mark_completed(args.task_id):
                print(f"[+] Completed: {args.task_id}")
    
    elif args.action == "archive":
        if args.task_id:
            if nexus.mark_archived(args.task_id):
                print(f"[+] Archived: {args.task_id}")
    
    elif args.action == "bot":
        nexus.start_telegram_bot()
    
    elif args.action == "watcher":
        watcher.surface_tasks()
