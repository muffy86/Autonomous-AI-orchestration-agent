# Sovereign AI Orchestration Stack

Zero-fluff, agent-native infrastructure for autonomous operation. Replaces Make.com with deterministic, self-hosted orchestration.

## Quick Start

```bash
# 1. Setup secret vault (run once)
chmod +x gap-4-vault/vault-setup.sh
./gap-4-vault/vault-setup.sh

# 2. Add your keys
~/.vault/vault-add.sh ai openrouter sk-or-xxx
~/.vault/vault-add.sh ai telegram YOUR_BOT_TOKEN

# 3. Bootstrap agent
python3 bootstrap.py --context
```

## Architecture

```
gap-1-echo-nexus/     # Mobile↔Desktop context bridge (Telegram + WSL2)
gap-2-orchestrator/   # FastAPI event router (replaces Make.com)
gap-3-memory/         # Notion/GitHub → canonical memory sync
gap-4-vault/          # Secrets management (Infisical + pass)
gap-5-skill-registry/ # Auto-discoverable skill manifest
gap-6-research-memory/# Playwright capture + LLM summaries
gap-7-acc-deploy/     # Vercel deploy for AI Command Center
gap-8-handoff/        # Session continuity protocol
```

## Usage

### Task Management (ECHO Nexus)
```bash
# Telegram bot receives tasks, surfaces at desktop login
python3 gap-1-echo-nexus/echo-nexus.py add --text "Review PR" --priority high
python3 gap-1-echo-nexus/echo-nexus.py list
python3 gap-1-echo-nexus/echo-nexus.py watcher  # Run at login
```

### Secret Management
```bash
~/.vault/vault-add.sh github token ghp_xxx
~/.vault/vault-get.sh github token
~/.vault/vault-run.sh python3 script.py  # Inject env vars
```

### Memory Sync
```bash
# Pull from Notion, consolidate, push to GitHub
python3 gap-3-memory/memory-sync.py quick

# Search memory
python3 gap-3-memory/memory-sync.py search --query "API keys"
```

### Skill Registry
```bash
# List available skills
python3 gap-5-skill-registry/register-skill.py context

# Check skill dependencies
python3 gap-5-skill-registry/register-skill.py boot

# Execute skill
python3 gap-5-skill-registry/register-skill.py run --skill-id gap-1-echo-nexus
```

### Session Handoff
```bash
# Start session
python3 gap-8-handoff/handoff.py create --agent BrowserOS --context "Building gap 2"

# Add task
python3 gap-8-handoff/handoff.py finalize --description "Complete orchestrator" --instructions "Continue with deployment"

# Next agent reads summary
python3 gap-8-handoff/handoff.py summary
```

### Orchestrator
```bash
# Start server
python3 gap-2-orchestrator/orchestrator.py serve --port 8000

# Enqueue job
python3 gap-2-orchestrator/orchestrator.py enqueue --webhook-id github-webhook --payload '{"action":"push"}'

# Check DLQ
python3 gap-2-orchestrator/orchestrator.py dlq
```

### Deploy ACC
```bash
export VERCEL_TOKEN=your_token
./gap-7-acc-deploy/deploy.sh
```

## Agent Boot Protocol

Every session starts with:

```python
python3 bootstrap.py
```

This loads:
1. `agent-guide.md` - Your preferences and instructions
2. Environment verification - What skills are available
3. Canonical memory - Recent context
4. Previous handoff - What last agent left

No confirmation loops. Autonomous execution.

## Environment Variables

Required for full functionality:

```bash
# AI Providers
OPENROUTER_API_KEY=sk-or-xxx
ANTHROPIC_API_KEY=sk-ant-xxx

# Services
TELEGRAM_BOT_TOKEN=xxx
GITHUB_TOKEN=ghp_xxx
NOTION_TOKEN=secret_xxx

# Deployment
VERCEL_TOKEN=xxx

# Infisical (optional)
INFISICAL_TOKEN=xxx
INFISICAL_WORKSPACE_ID=xxx
```

Set via vault: `~/.vault/vault-add.sh <service> <key> <value>`

## Requirements

- Python 3.10+
- bash (for vault scripts)
- Optional: Docker (for Infisical)

Install Python deps:
```bash
pip install -r requirements.txt
playwright install chromium
```

## Design Principles

1. **Zero-fluff** - No confirmation loops, no optional parameters
2. **Autonomous** - Handle end-to-end, infer what's needed
3. **Copy-paste ready** - Working code, not concepts
4. **Hardened** - Fully tested, no breaking changes
5. **Self-hosted** - BYOK, no third-party inference
6. **Context persistence** - Mobile↔Desktop continuity

## License

Sovereign. Operate under your own keys, your own infrastructure.
