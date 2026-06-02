#!/usr/bin/env python3
"""
skill-registry.py - Skill management and auto-registration
Agents load this at boot, self-query capabilities
"""

import json
import os
import sys
import subprocess
from pathlib import Path
from typing import List, Dict, Optional, Any

REGISTRY_FILE = Path(__file__).parent / "skills-registry.json"
SKILL_DIR = Path.home() / ".agent-skills"


class SkillRegistry:
    """Central skill registry - loaded by agents at boot."""
    
    def __init__(self, registry_path: Path = None):
        self.registry_path = registry_path or REGISTRY_FILE
        self.skills: Dict[str, Dict] = {}
        self._load()
    
    def _load(self):
        """Load registry from disk."""
        if self.registry_path.exists():
            data = json.loads(self.registry_path.read_text())
            self.skills = {s["id"]: s for s in data.get("skills", [])}
    
    def save(self):
        """Persist registry."""
        data = {
            "$schema": "skill-registry-v1",
            "version": "1.0.0",
            "last_updated": self._now(),
            "skills": list(self.skills.values()),
            "categories": self._get_categories()
        }
        self.registry_path.write_text(json.dumps(data, indent=2))
    
    def _now(self) -> str:
        from datetime import datetime, timezone
        return datetime.now(timezone.utc).isoformat()
    
    def _get_categories(self) -> Dict[str, List[str]]:
        """Build category -> skill_ids mapping."""
        cats = {}
        for skill_id, skill in self.skills.items():
            for tag in skill.get("tags", []):
                if tag not in cats:
                    cats[tag] = []
                cats[tag].append(skill_id)
        return cats
    
    def register(self, skill_def: Dict) -> str:
        """Register new skill.
        
        Args:
            skill_def: {
                "id": "unique-id",
                "name": "Human Name",
                "description": "What it does",
                "entry": "filename.py",
                "cmd": "python filename.py",
                "type": "python|bash|python-daemon",
                "tags": ["tag1", "tag2"],
                "inputs": [],
                "outputs": [],
                "health_check": "optional check command",
                "auto_load": true
            }
        """
        skill_id = skill_def["id"]
        self.skills[skill_id] = skill_def
        self.save()
        return skill_id
    
    def unregister(self, skill_id: str) -> bool:
        """Remove skill from registry."""
        if skill_id in self.skills:
            del self.skills[skill_id]
            self.save()
            return True
        return False
    
    def get(self, skill_id: str) -> Optional[Dict]:
        """Get skill by ID."""
        return self.skills.get(skill_id)
    
    def find(self, query: str) -> List[Dict]:
        """Search skills by name, description, or tags."""
        query_lower = query.lower()
        results = []
        for skill in self.skills.values():
            text = f"{skill.get('name', '')} {skill.get('description', '')} {' '.join(skill.get('tags', []))}"
            if query_lower in text.lower():
                results.append(skill)
        return results
    
    def by_tag(self, tag: str) -> List[Dict]:
        """Get all skills with tag."""
        return [s for s in self.skills.values() if tag in s.get("tags", [])]
    
    def auto_load_skills(self) -> List[str]:
        """Get list of auto_load=true skills for agent boot."""
        return [sid for sid, s in self.skills.items() if s.get("auto_load", False)]
    
    def health_check(self, skill_id: str) -> bool:
        """Run health check for skill."""
        skill = self.get(skill_id)
        if not skill or "health_check" not in skill:
            return True
        
        try:
            result = subprocess.run(
                skill["health_check"],
                shell=True,
                timeout=30,
                capture_output=True
            )
            return result.returncode == 0
        except:
            return False
    
    def run(self, skill_id: str, **kwargs) -> subprocess.CompletedProcess:
        """Execute skill with optional parameter injection."""
        skill = self.get(skill_id)
        if not skill:
            raise ValueError(f"Unknown skill: {skill_id}")
        
        cmd = skill["cmd"]
        
        # Simple env injection for params
        env = os.environ.copy()
        for key, val in kwargs.items():
            env[f"SKILL_PARAM_{key.upper()}"] = str(val)
        
        return subprocess.run(cmd, shell=True, env=env)
    
    def manifest(self) -> str:
        """Human-readable skill listing."""
        lines = ["\n📦 Skill Registry\n" + "="*50]
        
        for sid in sorted(self.skills.keys()):
            s = self.skills[sid]
            status = "🟢" if s.get("auto_load") else "⚪"
            lines.append(f"{status} {sid}")
            lines.append(f"   {s.get('name')}")
            lines.append(f"   {s.get('description', '')[:60]}")
            if s.get("health_check"):
                healthy = "✓" if self.health_check(sid) else "✗"
                lines.append(f"   Health: {healthy}")
            lines.append("")
        
        return "\n".join(lines)


def register_skill_file(filepath: Path, registry: SkillRegistry = None) -> str:
    """Auto-register skill from Python/bash file with embedded metadata."""
    content = filepath.read_text()
    
    # Extract SKILL_META comment block
    meta = {}
    for line in content.split('\n'):
        if 'SKILL_META:' in line:
            key_val = line.split('SKILL_META:')[1].strip()
            if '=' in key_val:
                k, v = key_val.split('=', 1)
                meta[k.strip()] = v.strip().strip('"\'')
    
    if not meta.get('id'):
        # Infer from filename
        meta['id'] = filepath.stem.replace('-', '_')
    
    skill_def = {
        "id": meta['id'],
        "name": meta.get('name', meta['id']),
        "description": meta.get('description', ''),
        "entry": filepath.name,
        "cmd": meta.get('cmd', f"python {filepath.name}"),
        "type": meta.get('type', 'python'),
        "tags": meta.get('tags', '').split(',') if meta.get('tags') else [],
        "inputs": [],
        "outputs": [],
        "auto_load": meta.get('auto_load', 'false').lower() == 'true'
    }
    
    reg = registry or SkillRegistry()
    reg.register(skill_def)
    return meta['id']


def cli():
    import argparse
    parser = argparse.ArgumentParser(description="Skill registry management")
    parser.add_argument("--list", "-l", action="store_true", help="Show all skills")
    parser.add_argument("--find", "-f", help="Search skills")
    parser.add_argument("--tag", "-t", help="Filter by tag")
    parser.add_argument("--run", "-r", help="Run skill by ID")
    parser.add_argument("--health", "-c", help="Check skill health")
    parser.add_argument("--register", help="Register file")
    parser.add_argument("--unregister", help="Unregister skill ID")
    parser.add_argument("--auto-load", action="store_true", help="List auto-load skills")
    args = parser.parse_args()
    
    reg = SkillRegistry()
    
    if args.list:
        print(reg.manifest())
    elif args.find:
        results = reg.find(args.find)
        print(json.dumps(results, indent=2))
    elif args.tag:
        results = reg.by_tag(args.tag)
        for s in results:
            print(f"{s['id']}: {s['name']}")
    elif args.run:
        result = reg.run(args.run)
        sys.exit(result.returncode)
    elif args.health:
        ok = reg.health_check(args.health)
        print(f"{'✓' if ok else '✗'} {args.health}")
        sys.exit(0 if ok else 1)
    elif args.register:
        sid = register_skill_file(Path(args.register), reg)
        print(f"[registry] Registered: {sid}")
    elif args.unregister:
        if reg.unregister(args.unregister):
            print(f"[registry] Unregistered: {args.unregister}")
        else:
            print(f"[registry] Not found: {args.unregister}")
    elif args.auto_load:
        skills = reg.auto_load_skills()
        print(json.dumps(skills))
    else:
        print(reg.manifest())


if __name__ == "__main__":
    cli()