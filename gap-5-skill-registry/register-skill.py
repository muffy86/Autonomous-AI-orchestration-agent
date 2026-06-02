#!/usr/bin/env python3
"""
Gap 5: Skill Registry + Auto-Registration
Agents load registry at boot and self-query available capabilities
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict

REPO_ROOT = Path(__file__).parent.parent.resolve()
SKILLS_DIR = REPO_ROOT / "gap-5-skill-registry" / "skills"
REGISTRY_FILE = SKILLS_DIR / "registry.json"


@dataclass
class Skill:
    id: str
    name: str
    description: str
    path: str
    entry_point: str
    commands: List[str]
    dependencies: List[str]
    env_vars: List[str]
    tags: List[str]
    status: str = "beta"
    
    @classmethod
    def from_dict(cls, skill_id: str, data: dict) -> "Skill":
        return cls(
            id=skill_id,
            name=data.get("name", ""),
            description=data.get("description", ""),
            path=data.get("path", ""),
            entry_point=data.get("entry_point", ""),
            commands=data.get("commands", []),
            dependencies=data.get("dependencies", []),
            env_vars=data.get("env_vars", []),
            tags=data.get("tags", []),
            status=data.get("status", "beta")
        )


class SkillRegistry:
    def __init__(self, registry_file: Path = REGISTRY_FILE):
        self.registry_file = registry_file
        self.skills = {}
        self.aliases = {}
        self._load()
    
    def _load(self):
        """Load registry from disk"""
        if self.registry_file.exists():
            with open(self.registry_file, 'r') as f:
                data = json.load(f)
                for skill_id, skill_data in data.get("skills", {}).items():
                    self.skills[skill_id] = Skill.from_dict(skill_id, skill_data)
                self.aliases = data.get("aliases", {})
    
    def _save(self):
        """Save registry to disk"""
        data = {
            "version": "1.0.0",
            "last_updated": __import__('datetime').datetime.utcnow().isoformat(),
            "skills": {},
            "aliases": self.aliases
        }
        
        for skill_id, skill in self.skills.items():
            data["skills"][skill_id] = {
                "name": skill.name,
                "description": skill.description,
                "path": skill.path,
                "entry_point": skill.entry_point,
                "commands": skill.commands,
                "dependencies": skill.dependencies,
                "env_vars": skill.env_vars,
                "tags": skill.tags,
                "status": skill.status
            }
        
        self.registry_file.parent.mkdir(parents=True, exist_ok=True)
        with open(self.registry_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    def get(self, skill_id: str) -> Optional[Skill]:
        """Get skill by ID or alias"""
        # Check aliases first
        if skill_id in self.aliases:
            skill_id = self.aliases[skill_id]
        return self.skills.get(skill_id)
    
    def list_all(self) -> List[Skill]:
        """List all registered skills"""
        return list(self.skills.values())
    
    def search(self, query: str) -> List[Skill]:
        """Search skills by name, description, or tags"""
        query_lower = query.lower()
        results = []
        
        for skill in self.skills.values():
            if (query_lower in skill.name.lower() or
                query_lower in skill.description.lower() or
                any(query_lower in tag.lower() for tag in skill.tags)):
                results.append(skill)
        
        return results
    
    def register(self, skill: Skill) -> bool:
        """Register a new skill"""
        self.skills[skill.id] = skill
        self._save()
        return True
    
    def discover_from_directory(self, directory: Path) -> List[Skill]:
        """Auto-discover skills from a directory"""
        discovered = []
        
        for item in directory.iterdir():
            if item.is_dir():
                # Look for skill manifest
                manifest = item / "skill.json"
                if manifest.exists():
                    with open(manifest, 'r') as f:
                        data = json.load(f)
                    
                    skill_id = item.name
                    skill = Skill.from_dict(skill_id, data)
                    skill.path = str(item.relative_to(REPO_ROOT))
                    discovered.append(skill)
        
        return discovered
    
    def check_dependencies(self, skill_id: str) -> Dict[str, bool]:
        """Check if skill dependencies are satisfied"""
        skill = self.get(skill_id)
        if not skill:
            return {"error": "Skill not found"}
        
        status = {
            "python_packages": {},
            "env_vars": {},
            "system_commands": {}
        }
        
        # Check Python packages
        for dep in skill.dependencies:
            try:
                __import__(dep.replace('-', '_'))
                status["python_packages"][dep] = True
            except ImportError:
                status["python_packages"][dep] = False
        
        # Check env vars
        for env in skill.env_vars:
            status["env_vars"][env] = os.getenv(env, "") != ""
        
        return status
    
    def get_executable_path(self, skill_id: str) -> Optional[Path]:
        """Get full path to skill entry point"""
        skill = self.get(skill_id)
        if not skill:
            return None
        
        return REPO_ROOT / skill.path / skill.entry_point
    
    def agent_context(self) -> str:
        """Generate context string for agent loading"""
        lines = [
            f"Available Skills ({len(self.skills)}):",
            ""
        ]
        
        for skill_id, skill in sorted(self.skills.items()):
            status_icon = "✓" if skill.status == "production" else "β"
            lines.append(f"{status_icon} {skill_id}: {skill.name}")
            lines.append(f"   {skill.description[:60]}...")
            lines.append(f"   Commands: {', '.join(skill.commands[:5])}")
            if len(skill.commands) > 5:
                lines.append(f"             (and {len(skill.commands) - 5} more)")
            lines.append("")
        
        if self.aliases:
            lines.append("Aliases:")
            for alias, target in sorted(self.aliases.items()):
                lines.append(f"  {alias} → {target}")
        
        return '\n'.join(lines)
    
    def boot_check(self) -> Dict:
        """Full environment check at agent boot"""
        results = {
            "skills_total": len(self.skills),
            "skills_ready": 0,
            "skills_missing_deps": [],
            "missing_env": set()
        }
        
        for skill_id, skill in self.skills.items():
            deps = self.check_dependencies(skill_id)
            
            all_good = all(deps.get("python_packages", {}).values())
            
            if all_good:
                results["skills_ready"] += 1
            else:
                results["skills_missing_deps"].append(skill_id)
            
            for env, present in deps.get("env_vars", {}).items():
                if not present:
                    results["missing_env"].add(env)
        
        results["missing_env"] = list(results["missing_env"])
        return results


# CLI interface
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Skill Registry")
    parser.add_argument("action", choices=[
        "list", "search", "get", "check", "boot", "context",
        "register", "discover", "run"
    ])
    parser.add_argument("--skill-id")
    parser.add_argument("--query")
    parser.add_argument("--directory", default=".")
    
    args = parser.parse_args()
    
    registry = SkillRegistry()
    
    if args.action == "list":
        for skill in registry.list_all():
            print(f"{skill.id:20} [{skill.status:10}] {skill.name}")
    
    elif args.action == "search":
        if args.query:
            for skill in registry.search(args.query):
                print(f"{skill.id}: {skill.name}")
                print(f"  {skill.description}")
                print(f"  Tags: {', '.join(skill.tags)}")
    
    elif args.action == "get":
        if args.skill_id:
            skill = registry.get(args.skill_id)
            if skill:
                print(json.dumps({
                    "id": skill.id,
                    "name": skill.name,
                    "description": skill.description,
                    "path": skill.path,
                    "entry_point": skill.entry_point,
                    "commands": skill.commands,
                    "dependencies": skill.dependencies,
                    "env_vars": skill.env_vars,
                    "status": skill.status,
                    "executable": str(registry.get_executable_path(args.skill_id))
                }, indent=2))
    
    elif args.action == "check":
        if args.skill_id:
            status = registry.check_dependencies(args.skill_id)
            print(json.dumps(status, indent=2))
    
    elif args.action == "boot":
        results = registry.boot_check()
        print(json.dumps(results, indent=2))
        
        if results["missing_env"]:
            print("\n[!] Missing environment variables:")
            for env in results["missing_env"]:
                print(f"    export {env}=your_value")
    
    elif args.action == "context":
        print(registry.agent_context())
    
    elif args.action == "discover":
        discovered = registry.discover_from_directory(Path(args.directory))
        for skill in discovered:
            print(f"Discovered: {skill.id} - {skill.name}")
            registry.register(skill)
    
    elif args.action == "run":
        if args.skill_id:
            exec_path = registry.get_executable_path(args.skill_id)
            if exec_path:
                print(f"[+] Executing: {exec_path}")
                os.system(f"python3 {exec_path}")
            else:
                print(f"[!] Skill not found: {args.skill_id}")
