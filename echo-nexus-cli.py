#!/usr/bin/env python3
"""
echo-nexus-cli.py - Desktop CLI for managing ECHO queue
Shell integration, desktop-to-mobile feedback loop
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Dict, Optional

TASKS_FILE = Path.home() / ".echo-nexus" / "tasks.jsonl"
ARCHIVE_FILE = Path.home() / ".echo-nexus" / "archive.jsonl"


def load_tasks(status: str = None) -> List[Dict]:
    """Load tasks, optionally filtered."""
    if not TASKS_FILE.exists():
        return []
    
    tasks = []
    with open(TASKS_FILE) as f:
        for line in f:
            try:
                task = json.loads(line)
                if status is None or task.get("status") == status:
                    tasks.append(task)
            except:
                continue
    return tasks


def save_tasks(tasks: List[Dict]):
    """Overwrite tasks file."""
    TASKS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(TASKS_FILE, 'w') as f:
        for task in tasks:
            f.write(json.dumps(task) + "\n")


def archive_task(task: Dict):
    """Move task to archive."""
    task["archived_at"] = datetime.now(timezone.utc).isoformat()
    ARCHIVE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(ARCHIVE_FILE, 'a') as f:
        f.write(json.dumps(task) + "\n")


def complete(task_id: str) -> bool:
    """Mark task complete."""
    tasks = load_tasks()
    found = False
    for task in tasks:
        if task["id"].startswith(task_id) or task["id"] == task_id:
            task["status"] = "completed"
            task["completed_at"] = datetime.now(timezone.utc).isoformat()
            archive_task(task)
            found = True
            print(f"✓ Completed: {task['text'][:60]}")
    
    if found:
        # Remove completed from active
        active = [t for t in tasks if t.get("status") != "completed"]
        save_tasks(active)
    
    return found


def add_task(text: str, category: str = "general", priority: int = 1):
    """Add desktop-originated task."""
    task = {
        "id": datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S") + "_desktop",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "user_id": "desktop",
        "user_name": "desktop",
        "text": text,
        "status": "pending",
        "captured_from": "desktop",
        "category": category,
        "priority": priority,
        "context": {}
    }
    
    with open(TASKS_FILE, 'a') as f:
        f.write(json.dumps(task) + "\n")
    
    print(f"✓ Added [{task['id'][:12]}]: {text[:50]}")


def list_tasks(category: str = None, limit: int = 20):
    """Show pending tasks."""
    tasks = load_tasks(status="pending")
    
    if category:
        tasks = [t for t in tasks if t.get("category") == category]
    
    # Sort by priority desc, time desc
    tasks.sort(key=lambda t: (-t.get("priority", 0), t["timestamp"]), reverse=True)
    
    if not tasks:
        print("No pending tasks")
        return
    
    print(f"\n📋 {len(tasks)} pending task(s)\n" + "="*60)
    
    for i, task in enumerate(tasks[:limit], 1):
        p = task.get("priority", 1)
        p_icon = "🔴" if p >= 4 else "🟡" if p >= 2 else "⚪"
        cat = task.get("category", "general")
        text = task["text"][:55] + "..." if len(task["text"]) > 55 else task["text"]
        short_id = task["id"][:12]
        
        print(f"{i:2}. {p_icon} [{cat:8}] {text}")
        print(f"    ID: {short_id} | {task['timestamp'][:16]}")
    
    print()


def backlog():
    """Show task statistics."""
    all_tasks = load_tasks()
    pending = [t for t in all_tasks if t.get("status") == "pending"]
    by_cat = {}
    by_prio = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    
    for t in pending:
        cat = t.get("category", "general")
        by_cat[cat] = by_cat.get(cat, 0) + 1
        by_prio[min(t.get("priority", 1), 5)] += 1
    
    print(f"\n📊 ECHO Nexus Backlog\n" + "="*40)
    print(f"Total pending: {len(pending)}")
    print(f"\nBy category:")
    for cat, count in sorted(by_cat.items(), key=lambda x: -x[1]):
        print(f"  {cat:12}: {count}")
    print(f"\nBy priority:")
    for p in [5, 4, 3, 2, 1]:
        icon = "🔴" if p >= 4 else "🟡" if p >= 2 else "⚪"
        if by_prio[p] > 0:
            print(f"  {icon} P{p}: {by_prio[p]}")
    print()


def next_task():
    """Show highest priority pending task."""
    pending = load_tasks(status="pending")
    if not pending:
        print("No pending tasks")
        return
    
    # Sort by priority
    pending.sort(key=lambda t: (-t.get("priority", 0), t["timestamp"]))
    top = pending[0]
    
    print(f"\n🎯 Next Task\n" + "="*40)
    print(f"ID:       {top['id']}")
    print(f"Category: {top.get('category', 'general')}")
    print(f"Priority: {'🔴' * top.get('priority', 1)}")
    print(f"Time:     {top['timestamp']}")
    print(f"\n{top['text']}\n")
    print(f"Mark done: echo-nexus --done {top['id'][:8]}")


def cli():
    import argparse
    parser = argparse.ArgumentParser(description="ECHO Nexus CLI")
    parser.add_argument("--add", "-a", help="Add new task")
    parser.add_argument("--category", "-c", default="general", help="Task category")
    parser.add_argument("--priority", "-p", type=int, default=1, help="Priority 1-5")
    parser.add_argument("--done", "-d", help="Complete task by ID prefix")
    parser.add_argument("--list", "-l", action="store_true", help="List pending")
    parser.add_argument("--next", "-n", action="store_true", help="Show next task")
    parser.add_argument("--backlog", "-b", action="store_true", help="Show stats")
    args = parser.parse_args()
    
    if args.add:
        add_task(args.add, args.category, args.priority)
    elif args.done:
        if not complete(args.done):
            print(f"Task not found: {args.done}")
            sys.exit(1)
    elif args.list:
        list_tasks(category=args.category)
    elif args.next:
        next_task()
    elif args.backlog:
        backlog()
    else:
        # Default: list
        list_tasks(category=args.category)


if __name__ == "__main__":
    cli()