#!/usr/bin/env python3
"""
Gap 8: Agent Handoff Protocol
Writes/reads session state for seamless agent continuity
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict, field

REPO_ROOT = Path(__file__).parent.parent.resolve()
HANDOFF_DIR = REPO_ROOT / "mind-weaver" / "handoffs"
HANDOFF_FILE = HANDOFF_DIR / "latest-handoff.json"
HISTORY_FILE = HANDOFF_DIR / "handoff-history.jsonl"


@dataclass
class TaskItem:
    id: str
    description: str
    status: str  # pending, in_progress, completed, blocked
    priority: str  # critical, high, medium, low
    assigned_agent: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    completed_at: Optional[str] = None
    notes: List[str] = field(default_factory=list)


@dataclass
class Decision:
    context: str
    decision: str
    reasoning: str
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class Handoff:
    session_id: str
    timestamp: str
    agent_name: str
    user_context: str
    completed_tasks: List[TaskItem]
    open_tasks: List[TaskItem]
    blocked_tasks: List[TaskItem]
    decisions: List[Decision]
    next_agent_instructions: str
    environment_state: Dict[str, Any]
    files_modified: List[str]
    
    def to_dict(self) -> dict:
        return {
            "session_id": self.session_id,
            "timestamp": self.timestamp,
            "agent_name": self.agent_name,
            "user_context": self.user_context,
            "completed_tasks": [asdict(t) for t in self.completed_tasks],
            "open_tasks": [asdict(t) for t in self.open_tasks],
            "blocked_tasks": [asdict(t) for t in self.blocked_tasks],
            "decisions": [asdict(d) for d in self.decisions],
            "next_agent_instructions": self.next_agent_instructions,
            "environment_state": self.environment_state,
            "files_modified": self.files_modified
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "Handoff":
        return cls(
            session_id=data["session_id"],
            timestamp=data["timestamp"],
            agent_name=data["agent_name"],
            user_context=data["user_context"],
            completed_tasks=[TaskItem(**t) for t in data.get("completed_tasks", [])],
            open_tasks=[TaskItem(**t) for t in data.get("open_tasks", [])],
            blocked_tasks=[TaskItem(**t) for t in data.get("blocked_tasks", [])],
            decisions=[Decision(**d) for d in data.get("decisions", [])],
            next_agent_instructions=data["next_agent_instructions"],
            environment_state=data.get("environment_state", {}),
            files_modified=data.get("files_modified", [])
        )


class HandoffManager:
    def __init__(self, handoff_dir: Path = HANDOFF_DIR):
        self.handoff_dir = handoff_dir
        self.handoff_dir.mkdir(parents=True, exist_ok=True)
        self.current: Optional[Handoff] = None
        
    def load(self) -> Optional[Handoff]:
        """Load the latest handoff - CALL THIS FIRST on agent boot"""
        if HANDOFF_FILE.exists():
            with open(HANDOFF_FILE, 'r') as f:
                data = json.load(f)
                self.current = Handoff.from_dict(data)
                return self.current
        return None
    
    def create(self, agent_name: str, user_context: str) -> Handoff:
        """Initialize new handoff session"""
        self.current = Handoff(
            session_id=f"{agent_name}-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}",
            timestamp=datetime.utcnow().isoformat(),
            agent_name=agent_name,
            user_context=user_context,
            completed_tasks=[],
            open_tasks=[],
            blocked_tasks=[],
            decisions=[],
            next_agent_instructions="",
            environment_state={},
            files_modified=[]
        )
        return self.current
    
    def add_task(self, description: str, status: str = "pending", 
                 priority: str = "medium", task_id: Optional[str] = None) -> str:
        """Add a task to current handoff"""
        if not self.current:
            raise RuntimeError("No active handoff. Call create() or load() first.")
        
        task = TaskItem(
            id=task_id or f"task-{len(self.current.open_tasks) + 1:04d}",
            description=description,
            status=status,
            priority=priority
        )
        self.current.open_tasks.append(task)
        return task.id
    
    def complete_task(self, task_id: str, notes: Optional[str] = None):
        """Mark task as completed"""
        if not self.current:
            return
            
        for task in self.current.open_tasks:
            if task.id == task_id:
                task.status = "completed"
                task.completed_at = datetime.utcnow().isoformat()
                if notes:
                    task.notes.append(notes)
                self.current.completed_tasks.append(task)
                self.current.open_tasks.remove(task)
                break
    
    def block_task(self, task_id: str, reason: str):
        """Mark task as blocked with reason"""
        if not self.current:
            return
            
        for task in self.current.open_tasks:
            if task.id == task_id:
                task.status = "blocked"
                task.notes.append(f"BLOCKED: {reason}")
                self.current.blocked_tasks.append(task)
                self.current.open_tasks.remove(task)
                break
    
    def log_decision(self, context: str, decision: str, reasoning: str):
        """Record a decision made during session"""
        if not self.current:
            return
            
        self.current.decisions.append(Decision(
            context=context,
            decision=decision,
            reasoning=reasoning
        ))
    
    def add_file(self, filepath: str):
        """Track modified file"""
        if self.current and filepath not in self.current.files_modified:
            self.current.files_modified.append(filepath)
    
    def finalize(self, next_instructions: str, agent_name: Optional[str] = None):
        """Finalize and save handoff - CALL THIS ON SESSION CLOSE"""
        if not self.current:
            return
        
        self.current.next_agent_instructions = next_instructions
        if agent_name:
            self.current.agent_name = agent_name
        
        # Save as latest
        with open(HANDOFF_FILE, 'w') as f:
            json.dump(self.current.to_dict(), f, indent=2)
        
        # Append to history
        with open(HISTORY_FILE, 'a') as f:
            f.write(json.dumps(self.current.to_dict()) + '\n')
    
    def summary(self) -> str:
        """Generate human-readable summary for Telegram"""
        if not self.current:
            return "No active handoff session."
        
        lines = [
            f"🤖 Agent: {self.current.agent_name}",
            f"⏱️  Session: {self.current.session_id}",
            "",
            f"✅ Completed ({len(self.current.completed_tasks)}):",
        ]
        for t in self.current.completed_tasks:
            lines.append(f"  • {t.description}")
        
        if self.current.open_tasks:
            lines.extend(["", f"🔄 Open ({len(self.current.open_tasks)}):"])
            for t in self.current.open_tasks:
                lines.append(f"  • [{t.priority}] {t.description}")
        
        if self.current.blocked_tasks:
            lines.extend(["", f"🚫 Blocked ({len(self.current.blocked_tasks)}):"])
            for t in self.current.blocked_tasks:
                lines.append(f"  • {t.description}")
        
        if self.current.decisions:
            lines.extend(["", f"📝 Decisions ({len(self.current.decisions)}):"])
            for d in self.current.decisions:
                lines.append(f"  • {d.decision}")
        
        if self.current.files_modified:
            lines.extend(["", f"📁 Files ({len(self.current.files_modified)}):"])
            for f in self.current.files_modified[:5]:
                lines.append(f"  • {f}")
            if len(self.current.files_modified) > 5:
                lines.append(f"  ... and {len(self.current.files_modified) - 5} more")
        
        lines.extend(["", f"➡️ Next: {self.current.next_agent_instructions}"])
        
        return '\n'.join(lines)


# CLI interface
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Agent Handoff Protocol")
    parser.add_argument("action", choices=["load", "create", "complete", "block", "finalize", "summary"])
    parser.add_argument("--agent", default="unknown-agent")
    parser.add_argument("--context", default="")
    parser.add_argument("--task-id")
    parser.add_argument("--description")
    parser.add_argument("--priority", default="medium")
    parser.add_argument("--reason")
    parser.add_argument("--instructions", default="Continue where previous agent left off.")
    
    args = parser.parse_args()
    
    manager = HandoffManager()
    
    if args.action == "load":
        handoff = manager.load()
        if handoff:
            print(json.dumps(handoff.to_dict(), indent=2))
        else:
            print("No handoff found. Create one with: handoff.py create")
            sys.exit(1)
    
    elif args.action == "create":
        manager.create(args.agent, args.context)
        print(f"Created handoff: {manager.current.session_id}")
    
    elif args.action == "complete":
        manager.load()
        if args.task_id:
            manager.complete_task(args.task_id, args.reason)
            print(f"Completed task: {args.task_id}")
        manager.finalize(args.instructions, args.agent)
    
    elif args.action == "block":
        manager.load()
        if args.task_id and args.reason:
            manager.block_task(args.task_id, args.reason)
            manager.finalize(args.instructions, args.agent)
            print(f"Blocked task: {args.task_id}")
    
    elif args.action == "finalize":
        manager.load()
        if args.description:
            manager.add_task(args.description, priority=args.priority)
        manager.finalize(args.instructions, args.agent)
        print("Handoff finalized")
    
    elif args.action == "summary":
        manager.load()
        print(manager.summary())
