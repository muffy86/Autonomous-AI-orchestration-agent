#!/usr/bin/env python3
"""
handoff-write.py - Write agent handoff.json on session close
Single-file, zero-deps, hardened output
"""

import json
import sys
import os
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4
from typing import Any

HANDOFF_DIR = Path.home() / ".agent-handoffs"
HANDOFF_DIR.mkdir(exist_ok=True)


def create_handoff(
    agent_id: str = "browseros",
    status: str = "completed",
    completed_tasks: list = None,
    open_tasks: list = None,
    decisions: list = None,
    context: str = "",
    next_instructions: str = "",
    references: dict = None,
    runtime: dict = None
) -> dict:
    """Build validated handoff object."""
    
    handoff = {
        "session_id": str(uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "agent": agent_id,
        "status": status,
        "completed_tasks": completed_tasks or [],
        "open_tasks": open_tasks or [],
        "decisions_made": decisions or [],
        "context_summary": context,
        "next_agent_instructions": next_instructions,
        "references": references or {
            "repos_modified": [],
            "files_created": [],
            "external_links": [],
            "memory_keys": []
        },
        "runtime_state": runtime or {}
    }
    
    # Validate against schema constraints
    valid_statuses = ["completed", "paused", "error", "delegated"]
    if handoff["status"] not in valid_statuses:
        raise ValueError(f"status must be one of {valid_statuses}")
    
    return handoff


def save_handoff(handoff: dict, name: str = None) -> Path:
    """Write handoff to disk, return path."""
    
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"{name or 'handoff'}_{ts}_{handoff['session_id'][:8]}.json"
    filepath = HANDOFF_DIR / filename
    
    with open(filepath, 'w') as f:
        json.dump(handoff, f, indent=2)
    
    # Also write latest.json symlink equivalent
    latest = HANDOFF_DIR / "latest.json"
    latest.write_text(json.dumps(handoff, indent=2))
    
    return filepath


def load_latest() -> dict:
    """Read most recent handoff."""
    latest = HANDOFF_DIR / "latest.json"
    if not latest.exists():
        return {}
    return json.loads(latest.read_text())


def cli():
    """CLI for integration with agent shutdown hooks."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Write agent handoff")
    parser.add_argument("--agent", default="browseros")
    parser.add_argument("--status", default="completed")
    parser.add_argument("--context", default="")
    parser.add_argument("--next", default="", dest="next_instructions")
    parser.add_argument("--file", "-f", help="JSON file with full handoff data")
    parser.add_argument("--read-latest", action="store_true", help="Output latest handoff")
    
    args = parser.parse_args()
    
    if args.read_latest:
        print(json.dumps(load_latest(), indent=2))
        return
    
    if args.file:
        data = json.loads(Path(args.file).read_text())
        handoff = create_handoff(**data)
    else:
        handoff = create_handoff(
            agent_id=args.agent,
            status=args.status,
            context=args.context,
            next_instructions=args.next_instructions
        )
    
    path = save_handoff(handoff)
    print(f"[handoff] Written: {path}")


if __name__ == "__main__":
    cli()