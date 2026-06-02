# Sovereign AI OS

Complete gap closure build. Hardened, autonomous, agent-native.

## Quick Start

```bash
# 1. Bootstrap everything
bash bootstrap.sh

# 2. Configure .env with your keys
nano .env

# 3. Start core services (run each in separate terminal or systemd)
python orchestrator-api.py        # Event router (replaces Make.com)
python echo-nexus-bot.py          # Telegram capture (Galaxy Fold → desktop)
python echo-nexus-cli.py --daemon # Desktop notification watcher

# 4. Deploy ACC to permanent URL
python deploy-acc.py
```

## Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌──────────────────┐
│  Galaxy Fold    │───▶│ ECHO Nexus   │───▶│  tasks.jsonl     │
│  (Telegram)     │    │  Bot         │    │  Queue           │
└─────────────────┘    └──────────────┘    └────────┬─────────┘
                                                    │
┌─────────────────┐    ┌──────────────┐            │
│  Desktop/Linux  │◀───│ WSL2 Watcher │◀───────────┘
│  Notification   │    │  (daemon)    │
└────────┬────────┘    └──────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│                   Orchestrator                        │
│  FastAPI Event Router ◀── No Make.com bottleneck    │
│  Retry/Backoff/DLQ ◀─── No timeout/rate limit issues │
└────────┬────────────────────────────────────────────┘
         │
    ┌────┴────┬────────────┬──────────┐
    ▼         ▼            ▼          ▼
┌──────┐  ┌──────┐   ┌────────┐  ┌────────┐
│Agent │  │Skills│   │Memory  │  │ Vault  │
│Queue │  │Reg   │   │Sync    │  │Secrets │
└──┬───┘  └──────┘   └────────┘  └────────┘
   │
   ▼
┌─────────────────────────────────────┐
│         mind-weaver (GitHub)         │
│  Canonical memory store (JSONL)      │
│  Research summaries                  │
│  Vector-ready (embedding field)      │
└─────────────────────────────────────┘
```

## File Inventory

| File | Purpose | Gap |
|------|---------|-----|
| `bootstrap.sh` | One-command initialization | Setup |
| `vault-setup.sh` | Infisical secrets vault deploy | Gap 4 |
| `memory-sync.py` | Sync Notion/GitHub → canonical JSONL | Gap 3 |
| `echo-nexus-bot.py` | Telegram bot for mobile capture | Gap 1 |
| `wsl2-watcher.py` | Desktop notification daemon | Gap 1 |
| `echo-nexus-cli.py` | Desktop task management CLI | Gap 1 |
| `handoff-write.py` | Agent session state export | Gap 8 |
| `handoff-schema.json` | State transfer schema | Gap 8 |
| `skill-registry.py` | Auto-discovery skill manager | Gap 5 |
| `skills-registry.json` | Skill manifest | Gap 5 |
| `orchestrator-api.py` | FastAPI event router | Gap 2 |
| `deploy-acc.py` | Vercel deploy for ACC | Gap 7 |
| `vercel.json` | Static site config | Gap 7 |

## Boot Protocol

Every agent session:

1. Load `skills-registry.json` → verify capabilities
2. Read `~/.agent-handoffs/latest.json` if exists
3. Load `~/.echo-nexus/tasks.jsonl` for context
4. Pull `mind-weaver/memory.jsonl` for long-term context
5. Execute current task
6. Write `handoff-write.py` on close

Zero confirmation loops. No questions on optional params.

## CLI Commands

```bash
# Task Management
echo-nexus --list           # View pending tasks
echo-nexus --next           # Show highest priority task
echo-nexus --done <id>      # Mark complete
echo-nexus -a "new task" -p 3  # Add task

# Memory
memory-sync --sync          # Full sync from sources
memory-sync --query "topic" # Search memory

# Skills
skill-registry -l           # List all skills
skill-registry -f "keyword" # Find skill
skill-registry -r skill_id  # Run skill
skill-registry --auto-load  # List boot skills

# Orchestrator
curl http://localhost:8000/v1/health
curl -X POST http://localhost:8000/v1/events \
  -H "Content-Type: application/json" \
  -d '{"source":"manual","event_type":"test","payload":{}}'
```

## Environment Variables

See `.env` file created by bootstrap. Required:

- `ECHO_NEXUS_BOT_TOKEN` - Telegram bot token
- `GITHUB_TOKEN` - For memory sync
- `OPENROUTER_API_KEY` - For LLM calls
- `ORCH_SECRET` - Webhook signing

## Security

- Secrets in Infisical vault (Docker, localhost:8080)
- Webhook HMAC signatures (`X-Orch-Signature`)
- Agent sandboxed in Firejail + WSL2 namespaces
- Zero-trust: API keys never in code, only in vault

## Status

- [x] Gap 4: Secrets Vault
- [x] Gap 8: Agent Handoff Protocol
- [x] Gap 3: Memory Sync Pipeline
- [x] Gap 1: ECHO Nexus Queue + WSL2 Watcher
- [x] Gap 5: Skill Registry + Auto-Registration
- [x] Gap 2: Local FastAPI Orchestrator
- [x] Gap 7: Vercel Deploy for ACC

All gaps closed. Production-ready.