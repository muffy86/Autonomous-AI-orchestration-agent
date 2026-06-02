#!/usr/bin/env python3
"""
echo-nexus-bot.py - Telegram bot for task capture
Receives mobile tasks, writes to tasks.jsonl queue
"""

import json
import os
import asyncio
from datetime import datetime, timezone
from pathlib import Path
from telegram import Update
from telegram.ext import Application, MessageHandler, filters, ContextTypes

# Config
TASKS_FILE = Path.home() / ".echo-nexus" / "tasks.jsonl"
ALLOWED_USERS = os.getenv("ECHO_NEXUS_USERS", "").split(",")
BOT_TOKEN = os.getenv("ECHO_NEXUS_BOT_TOKEN")

TASKS_FILE.parent.mkdir(parents=True, exist_ok=True)


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Capture any message as a task queue entry."""
    
    user_id = str(update.effective_user.id)
    if ALLOWED_USERS and user_id not in ALLOWED_USERS:
        await update.message.reply_text("Unauthorized")
        return
    
    text = update.message.text or update.message.caption or ""
    
    task = {
        "id": datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S_") + user_id[-4:],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "user_id": user_id,
        "user_name": update.effective_user.username or "unknown",
        "text": text,
        "status": "pending",
        "captured_from": "telegram",
        "category": infer_category(text),
        "priority": infer_priority(text),
        "context": {}  # Reserved for desktop enrichment
    }
    
    # Append to queue
    with open(TASKS_FILE, 'a') as f:
        f.write(json.dumps(task) + "\n")
    
    # Acknowledge
    await update.message.reply_text(f"✓ Captured [{task['id']}]")


def infer_category(text: str) -> str:
    """Simple keyword-based categorization."""
    text_lower = text.lower()
    if any(k in text_lower for k in ["code", "bug", "fix", "repo", "git"]):
        return "dev"
    if any(k in text_lower for k in ["research", "look up", "find", "compare"]):
        return "research"
    if any(k in text_lower for k in ["meet", "call", "sync", "discuss"]):
        return "meeting"
    if any(k in text_lower for k in ["buy", "order", "price", "cost"]):
        return "purchase"
    return "general"


def infer_priority(text: str) -> int:
    """Simple priority extraction."""
    text_lower = text.lower()
    if any(k in text_lower for k in ["urgent", "asap", "critical", "blocking"]):
        return 5
    if any(k in text_lower for k in ["today", "important", "needed"]):
        return 3
    return 1


async def status_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Report pending task count."""
    if not TASKS_FILE.exists():
        await update.message.reply_text("0 tasks pending")
        return
    
    pending = 0
    with open(TASKS_FILE) as f:
        for line in f:
            task = json.loads(line)
            if task.get("status") == "pending":
                pending += 1
    
    await update.message.reply_text(f"📋 {pending} task(s) pending")


async def list_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show recent pending tasks."""
    if not TASKS_FILE.exists():
        await update.message.reply_text("No tasks")
        return
    
    tasks = []
    with open(TASKS_FILE) as f:
        for line in f:
            task = json.loads(line)
            if task.get("status") == "pending":
                tasks.append(task)
    
    if not tasks:
        await update.message.reply_text("No pending tasks")
        return
    
    # Last 5
    recent = tasks[-5:]
    lines = [f"{t['id'][:12]}: {t['text'][:60]}" for t in recent]
    await update.message.reply_text("Recent tasks:\n" + "\n".join(lines))


def main():
    if not BOT_TOKEN:
        print("[echo-nexus] Error: ECHO_NEXUS_BOT_TOKEN not set")
        sys.exit(1)
    
    app = Application.builder().token(BOT_TOKEN).build()
    
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    app.add_handler(MessageHandler(filters.PHOTO, handle_message))  # Captions
    
    print("[echo-nexus] Bot running...")
    app.run_polling()


if __name__ == "__main__":
    main()