#!/usr/bin/env python3
"""
deploy-acc.py - One-command Vercel deploy for AI Command Center
Moves from Downloads/_Clutter to permanent URL
"""

import os
import sys
import shutil
import subprocess
import tempfile
from pathlib import Path

# Config
SOURCE_FILE = Path("C:/Users/Owner/Downloads/_Clutter/ai-command-center.html")
PROJECT_NAME = "ai-command-center"
VERCEL_TEAM = os.getenv("VERCEL_TEAM")  # Optional: for team deploys


def check_vercel_cli():
    """Ensure vercel CLI is installed and logged in."""
    try:
        result = subprocess.run(
            ["vercel", "--version"],
            capture_output=True,
            text=True
        )
        print(f"[deploy] Vercel CLI: {result.stdout.strip()}")
        return True
    except FileNotFoundError:
        print("[deploy] Vercel CLI not found. Install: npm i -g vercel")
        return False


def verify_login():
    """Check if authenticated to Vercel."""
    result = subprocess.run(
        ["vercel", "whoami"],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        print("[deploy] Not logged in. Run: vercel login")
        return False
    print(f"[deploy] Authenticated as: {result.stdout.strip()}")
    return True


def deploy():
    """Deploy ACC to Vercel."""
    
    if not SOURCE_FILE.exists():
        print(f"[deploy] Error: Source not found: {SOURCE_FILE}")
        sys.exit(1)
    
    # Create temp build directory
    with tempfile.TemporaryDirectory() as tmpdir:
        build_dir = Path(tmpdir)
        
        # Copy files
        shutil.copy(SOURCE_FILE, build_dir / "ai-command-center.html")
        
        # Write vercel.json
        vercel_config = build_dir / "vercel.json"
        vercel_config.write_text('''
{
  "version": 2,
  "name": "ai-command-center",
  "builds": [{"src": "ai-command-center.html", "use": "@vercel/static"}],
  "routes": [{"src": "/(.*)", "dest": "/ai-command-center.html"}],
  "headers": [{
    "source": "/(.*)",
    "headers": [
      {"key": "X-Frame-Options", "value": "DENY"},
      {"key": "X-Content-Type-Options", "value": "nosniff"},
      {"key": "Referrer-Policy", "value": "strict-origin-when-cross-origin"}
    ]
  }]
}
'''.strip())
        
        print(f"[deploy] Build directory prepared: {build_dir}")
        
        # Deploy
        cmd = ["vercel", "--yes", "--prod"]
        if VERCEL_TEAM:
            cmd.extend(["--scope", VERCEL_TEAM])
        
        result = subprocess.run(
            cmd,
            cwd=str(build_dir),
            capture_output=False,  # Stream to terminal
            text=True
        )
        
        if result.returncode == 0:
            print(f"[deploy] ✓ Deployed successfully")
            print(f"[deploy] Source: {SOURCE_FILE}")
            
            # Get deployment URL
            url_result = subprocess.run(
                ["vercel", "ls", "--meta", f"{PROJECT_NAME}", "-1"],
                cwd=str(build_dir),
                capture_output=True,
                text=True
            )
            if url_result.returncode == 0:
                print(f"[deploy] URL: {url_result.stdout.strip()}")
            
            return True
        else:
            print(f"[deploy] ✗ Deploy failed")
            return False


def update_telegram_bot():
    """Notify Telegram bot to return deploy URL on /start."""
    # This would be an env var or config update for echo-nexus-bot
    bot_config = Path.home() / ".echo-nexus" / "bot.conf"
    config = {}
    if bot_config.exists():
        config = json.loads(bot_config.read_text())
    
    config["acc_deployed"] = True
    config["acc_url"] = f"https://{PROJECT_NAME}.vercel.app"
    bot_config.write_text(json.dumps(config, indent=2))
    print(f"[deploy] Bot config updated with ACC URL")


def cli():
    import argparse
    parser = argparse.ArgumentParser(description="Deploy ACC to Vercel")
    parser.add_argument("--source", "-s", help="Override source HTML path")
    parser.add_argument("--preview", action="store_true", help="Preview deploy only")
    args = parser.parse_args()
    
    global SOURCE_FILE
    if args.source:
        SOURCE_FILE = Path(args.source)
    
    print("[deploy] AI Command Center Deployer")
    print(f"[deploy] Source: {SOURCE_FILE}")
    
    if not check_vercel_cli():
        sys.exit(1)
    
    if not verify_login():
        sys.exit(1)
    
    if deploy():
        update_telegram_bot()
        print("[deploy] Complete. Add to Telegram bot with /start")
    else:
        sys.exit(1)


if __name__ == "__main__":
    cli()