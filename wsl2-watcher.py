#!/usr/bin/env python3
"""
wsl2-watcher.py - Desktop daemon that surfaces ECHO Nexus tasks at login
No missed context when switching mobile -> desktop
"""

import json
import os
import sys
import time
import subprocess
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Dict

# Config
TASKS_FILE = Path.home() / ".echo-nexus" / "tasks.jsonl"
STATE_FILE = Path.home() / ".echo-nexus" / "watcher.state"
CHECK_INTERVAL = 30  # seconds
NOTIFY_CMD = "notify-send"  # Linux/WSL notification

# Windows notification fallback (if in WSL, notify Windows)
POWERSHELL_NOTIFY = """
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.MessageBox]::Show('{}', 'ECHO Nexus Tasks')
"""


def load_pending_tasks() -> List[Dict]:
    """Read all pending tasks from queue."""
    if not TASKS_FILE.exists():
        return []
    
    tasks = []
    with open(TASKS_FILE) as f:
        for line in f:
            try:
                task = json.loads(line)
                if task.get("status") == "pending":
                    tasks.append(task)
            except json.JSONDecodeError:
                continue
    return tasks


def mark_task_complete(task_id: str):
    """Mark a task as done in the JSONL file."""
    if not TASKS_FILE.exists():
        return
    
    lines = []
    with open(TASKS_FILE) as f:
        for line in f:
            task = json.loads(line)
            if task["id"] == task_id:
                task["status"] = "completed"
                task["completed_at"] = datetime.now(timezone.utc).isoformat()
            lines.append(json.dumps(task))
    
    with open(TASKS_FILE, 'w') as f:
        f.write("\n".join(lines) + "\n")


def notify(tasks: List[Dict]):
    """Show desktop notification with task count."""
    if not tasks:
        return
    
    msg = f"You have {len(tasks)} pending task(s) from ECHO Nexus"
    
    # Try native Linux notification
    try:
        subprocess.run([NOTIFY_CMD, "ECHO Nexus", msg], check=True, capture_output=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        # Fall back to Windows via PowerShell (WSL)
        try:
            ps_msg = msg.replace("'", "''")
            cmd = POWERSHELL_NOTIFY.format(ps_msg)
            subprocess.run(
                ["powershell.exe", "-Command", cmd],
                capture_output=True,
                timeout=10
            )
        except:
            # Silent fail - at least we tried
            pass


def get_last_notified_count() -> int:
    """Get count from last notification to avoid spam."""
    if not STATE_FILE.exists():
        return 0
    try:
        return int(STATE_FILE.read_text().strip())
    except:
        return 0


def save_notified_count(count: int):
    """Save last notified count."""
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(str(count))


def format_task_list(tasks: List[Dict], limit: int = 10) -> str:
    """Format tasks for terminal output."""
    lines = ["\n🔔 ECHO Nexus: Pending Tasks\n" + "="*50]
    
    # Sort by priority desc, then timestamp
    sorted_tasks = sorted(tasks, key=lambda t: (-t.get("priority", 0), t["timestamp"]))
    
    for i, task in enumerate(sorted_tasks[:limit], 1):
        prio_icon = "🔴" if task.get("priority", 0) > 3 else "🟡" if task.get("priority", 0) > 1 else "⚪"
        cat_tag = f"[{task.get('category', 'general')}]"
        text = task["text"][:50] + "..." if len(task["text"]) > 50 else task["text"]
        lines.append(f"{i}. {prio_icon} {cat_tag} {text}")
        lines.append(f"   ID: {task['id'][:16]}\n")
    
    if len(sorted_tasks) > limit:
        lines.append(f"... and {len(sorted_tasks) - limit} more task(s)")
    
    lines.append(f"\nRun: echo-nexus-cli --list")
    return "\n".join(lines)


def check_once():
    """Single check, output to stdout (for shell integration)."""
    tasks = load_pending_tasks()
    last_count = get_lastified_count()
    
    if tasks and len(tasks) != last_count:
        print(format_task_list(tasks))
        notify(tasks)
        save_notified_count(len(tasks))
    
    return tasks


def daemon_loop():
    """Continuous monitoring (run with &)."""
    print(f"[wsl2-watcher] Starting daemon, checking every {CHECK_INTERVAL}s...")
    print(f"[wsl2-watcher] Watching: {TASKS_FILE}")
    
    while True:
        try:
            check_once()
        except Exception as e:
            print(f"[wsl2-watcher] Error: {e}", file=sys.stderr)
        
        time.sleep(CHECK_INTERVAL)


def cli():
    import argparse
    parser = argparse.ArgumentParser(description="ECHO Nexus WSL2 watcher")
    parser.add_argument("--daemon", "-d", action="store_true", help="Run continuous daemon")
    parser.add_argument("--once", action="store_true", help="Check once and exit")
    parser.add_argument("--complete", help="Mark task complete by ID")
    parser.add_argument("--list", "-l", action="store_true", help="List pending tasks")
    args = parser.parse_args()
    
    if args.daemon:
        daemon_loop()
    elif args.once:
        tasks = check_once()
        sys.exit(0 if not tasks else 1)
    elif args.complete:
        mark_task_complete(args.complete)
        print(f"[wsl2-watcher] Marked {args.complete} complete")
    elif args.list:
        tasks = load_pending_tasks()
        print(format_task_list(tasks))
    else:
        # Default: check once
        check_once()


if __name__ == "__main__":
    cli()