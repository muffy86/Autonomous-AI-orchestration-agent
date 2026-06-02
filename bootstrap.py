#!/usr/bin/env python3
"""
Agent Boot Protocol
Loads agent-guide.md → verifies environment → infers current task → executes
No confirmation loops, no questions on optional params
"""

import json
import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).parent.resolve()

# Add all gap directories to Python path
sys.path.insert(0, str(REPO_ROOT / "gap-1-echo-nexus"))
sys.path.insert(0, str(REPO_ROOT / "gap-3-memory"))
sys.path.insert(0, str(REPO_ROOT / "gap-4-vault"))
sys.path.insert(0, str(REPO_ROOT / "gap-5-skill-registry"))
sys.path.insert(0, str(REPO_ROOT / "gap-8-handoff"))
sys.path.insert(0, str(REPO_ROOT / "gap-2-orchestrator"))


def load_guide():
    """Load agent-guide.md if exists"""
    guide_file = REPO_ROOT / "agent-guide.md"
    if guide_file.exists():
        return guide_file.read_text()
    return ""


def verify_environment():
    """Verify all gaps are functional"""
    from gap_5_skill_registry.register_skill import SkillRegistry
    
    registry = SkillRegistry()
    results = registry.boot_check()
    
    return results, registry


def load_memory_context():
    """Load canonical memory for context"""
    memory_file = REPO_ROOT / "mind-weaver" / "memory" / "canonical-memory.jsonl"
    
    if not memory_file.exists():
        return ""
    
    # Get last 20 entries
    entries = []
    with open(memory_file, 'r') as f:
        for line in f:
            try:
                entries.append(json.loads(line))
            except:
                continue
    
    recent = entries[-20:] if len(entries) > 20 else entries
    
    context = ["Recent Memory Context:", ""]
    for e in recent:
        title = e.get("title", e.get("content", "")[:50])
        context.append(f"• {e.get('type', 'note')}: {title}")
    
    return '\n'.join(context)


def load_handoff():
    """Load previous agent handoff"""
    handoff_file = REPO_ROOT / "mind-weaver" / "handoffs" / "latest-handoff.json"
    
    if handoff_file.exists():
        import subprocess
        result = subprocess.run(
            ["python3", str(REPO_ROOT / "gap-8-handoff/handoff.py"), "summary"],
            capture_output=True, text=True
        )
        return result.stdout
    
    return "No previous handoff."


class AgentBoot:
    """Agent bootstrap and environment setup"""
    
    def __init__(self):
        self.guide = load_guide()
        self.env_results = None
        self.registry = None
        self.memory_context = ""
        self.handoff = ""
        
    def boot(self):
        """Execute full boot sequence"""
        print("=" * 60)
        print("AGENT BOOT PROTOCOL")
        print("=" * 60)
        
        # 1. Load guide
        print("\n[1/5] Loading agent guide...")
        if self.guide:
            print("  ✓ agent-guide.md loaded")
        else:
            print("  ! agent-guide.md not found")
        
        # 2. Verify environment
        print("\n[2/5] Verifying environment...")
        try:
            self.env_results, self.registry = verify_environment()
            print(f"  ✓ Skills: {self.env_results['skills_ready']}/{self.env_results['skills_total']} ready")
            if self.env_results['missing_env']:
                print(f"  ! Missing env vars: {', '.join(self.env_results['missing_env'][:3])}")
        except Exception as e:
            print(f"  ✗ Error: {e}")
        
        # 3. Load memory
        print("\n[3/5] Loading memory context...")
        self.memory_context = load_memory_context()
        if self.memory_context:
            print(f"  ✓ Memory loaded")
        else:
            print("  ! No memory available")
        
        # 4. Load handoff
        print("\n[4/5] Loading previous handoff...")
        self.handoff = load_handoff()
        print(f"  ✓ Handoff loaded")
        
        # 5. Display status
        print("\n[5/5] System Ready")
        print("=" * 60)
        
        return self
    
    def context_string(self) -> str:
        """Generate full context for prompt"""
        lines = [
            "=" * 60,
            "AGENT CONTEXT",
            "=" * 60,
            "",
            "## Handoff from Previous Agent",
            self.handoff,
            "",
            "## Available Skills",
        ]
        
        if self.registry:
            lines.append(self.registry.agent_context())
        
        lines.extend([
            "",
            "## Recent Memory",
            self.memory_context if self.memory_context else "No recent memory.",
            "",
            "=" * 60,
        ])
        
        return '\n'.join(lines)


# Auto-run boot if imported
def boot_agent():
    """Quick boot function"""
    agent = AgentBoot()
    return agent.boot()


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Agent Bootstrap")
    parser.add_argument("--context", action="store_true", help="Print full context")
    
    args = parser.parse_args()
    
    agent = boot_agent()
    
    if args.context:
        print(agent.context_string())
    else:
        print("\nBoot complete. Use --context for full environment details.")
