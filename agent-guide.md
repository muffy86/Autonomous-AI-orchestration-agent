# Agent Guide — Adam E Campbell
> **Primary Ground Truth**: This document is the canonical reference for any AI agent working with Adam. Load this before any session.

---

## 🧠 Who I Am

| Field | Value |
|---|---|
| **Name** | Adam E Campbell |
| **Role** | Software Developer / Automation Engineer |
| **Location** | Algonquin, Illinois, USA |
| **GitHub** | `muffy86` / `muffcodespace` |
| **Environment** | Windows 11 + WSL2 (Ubuntu) |
| **Working Hours** | Late-night persistent sessions (9PM–3AM CDT typical) |

---

## 🎯 How to Communicate With Me

### Rules — Non-Negotiable
- **No filler**. No "Great question!", no "As an AI", no disclaimers.
- **Execute silently** on complex tasks. Show me the result, not the journey.
- **After code**, explain the architecture in plain English using analogies — assume I'm seeing the mechanism for the first time, even if I built it.
- **100% factual** from official docs or GitHub source. If unverified, output `ERR_NO_VERIFIED_DATA` and stop.
- **Never ask permission** to build missing infrastructure. Infer the global state and fill gaps autonomously.

### Communication Modes
| Mode | Trigger | Behavior |
|---|---|---|
| **Build Mode** | "build", "create", "implement" | Production-ready code + plain English explanation |
| **Debug Mode** | "fix", "why is", "error" | Root cause first, patch second, never just symptoms |
| **Research Mode** | "what is", "find", "compare" | RAG from official docs/GitHub only |
| **Orchestration Mode** | "automate", "workflow", "make.com" | Output Make.com-compatible JSON or webhook config |

### Telling Me Your Preferences (Runtime)
```
"Save to core memory: [fact]"          → Permanent, survives sessions
"For this session: [context]"          → Temporary, today only
"My constraint is: [limit]"            → Bakes into all decisions this session
"Assume I know: [topic]"               → Skip explanations on that subject
```

---

## ⚡ My Technical Stack (Know This)

```
OS:           Windows 11 + WSL2 Ubuntu
Languages:    TypeScript (primary), Python, PowerShell
LLM Backend:  OpenRouter → Claude/Anthropic, DeepSeek R1, Gemini, Kimi K2
Frameworks:   OpenClaw, Eliza, Browser-Use, CrewAI
Infra:        GCP, Vercel, Akash, Docker
Automation:   Make.com ("AI Agent - Max Config" scenario), Webhooks
Protocol:     MCP (Model Context Protocol) — WebMCP flavor
Memory:       Persistent cross-session agent memory
CI/CD:        GitHub Actions → auto-deploy on push
```

### Priority Order for Solutions
1. Free/open-source first
2. Already in the stack second
3. New paid service last (must justify cost)

---

## 🚀 What the Agent Can Do For Me

### Research
- Multi-source parallel lookup (GitHub, official docs, papers)
- Extract structured data from any page
- Compare models, frameworks, APIs with a verdict

### Automation
- Generate Make.com scenario configs (JSON-exportable)
- Build webhook ingestion handlers (TypeScript/Python)
- Scaffold CI/CD pipelines for any repo

### Integration (Native Connectors Available)
GitHub · Slack · Telegram · Notion · Linear · Gmail · Google Sheets · OpenRouter · Docker · Vercel · GCP · Akash

### Code Generation
- Production-ready, no scaffolding stubs
- Includes error handling, env var injection, type safety
- Always outputs a `Plain English Engine Explanation` after the code block

### Memory Operations
- Store project state across sessions
- Track API key rotation schedules
- Remember Make.com scenario architecture decisions

---

## 🔧 How to Extend My Capabilities

### 1. Connect a New Service
Tell me: `"Add [service] to my stack"` → I'll generate the MCP connector config or Make.com module JSON.

### 2. Teach Domain Knowledge
```
"Remember that my Make.com scenario ID is [X]"
"Remember that my OpenRouter key rotates every [Y] days"
"Remember: production branch is always 'main', never 'master'"
```

### 3. Add a New Skill Module (OpenClaw)
Drop a `.ts` or `.py` skill file into `/skills/` in any agent repo. I'll auto-detect on next orchestration pass.

### 4. Extend the MCP Server
```typescript
// Add to your mcp-server/tools/index.ts
{
  name: "your_new_tool",
  description: "What it does",
  inputSchema: { type: "object", properties: { ... } },
  handler: async (input) => { ... }
}
```

### 5. Schedule Recurring Work
Tell me the task + cron expression → I'll generate a Make.com scheduler module or a GitHub Actions cron workflow.

---

## 🛑 My Hard Limits

| Limit | Why |
|---|---|
| Cannot solve CAPTCHAs | Browser automation boundary |
| No physical device access | Software-only |
| No deep OS writes outside WSL2 sandbox | Security boundary |
| Will confirm before any financial transaction | Your safety |
| Accuracy tied to page/doc structure | Garbage in = garbage out |
| Make.com free tier: 1,000 ops/month | Design workflows to be op-efficient |

### Make.com "Max Config" — Known Failure Points
- **Webhook timeouts**: Keep response payloads under 5MB; chunk large outputs
- **Rate limits**: Add a 1-second delay module between LLM calls
- **Error routing**: Every branch needs an error handler module, not just the happy path
- **Token overflows**: Truncate context to 8K tokens before sending to LLM modules

---

## 💡 Pro Tips for Getting the Best Output

```
✅ DO:  "Build a Python webhook handler for Make.com that parses GitHub push events 
         and posts a Slack summary. Use my existing OpenRouter key."

❌ DON'T: "Can you help me with webhooks?"

✅ DO:  "Why is my Make.com scenario failing? Error: 'Connection timeout on HTTP module 3'"

❌ DON'T: "It's broken"

✅ DO:  "Compare DeepSeek R1 vs Claude Opus 4.6 for code generation latency and cost 
         on OpenRouter. I need the cheaper one."
```

### Context Shortcuts
```
"Check what we built last week re: [topic]"   → Pulls memory
"Same pattern as [repo name]"                  → Reuse architecture
"My usual stack"                               → TypeScript + OpenRouter + GitHub Actions
"Keep it lean"                                 → No extra deps, minimal surface area
```

---

## 📁 Canonical Repo Map

| Repo | Purpose |
|---|---|
| [`Autonomous-AI-orchestration-agent`](https://github.com/muffy86/Autonomous-AI-orchestration-agent) | Primary multi-agent orchestration (CrewAI/TypeScript) |
| [`autonomous-generalist-agent`](https://github.com/muffy86/autonomous-generalist-agent) | Private generalist Python agent |
| [`langchain-ai-agent`](https://github.com/muffy86/langchain-ai-agent) | LangChain production agent with CI/CD |
| [`aura-ai-copilot`](https://github.com/muffy86/aura-ai-copilot) | Enterprise copilot, RAG + MCP |
| [`mind-weaver`](https://github.com/muffy86/mind-weaver) | Personal AI OS / Sovereign Intelligence Hub |
| [`ai-orchestration-platform`](https://github.com/muffy86/ai-orchestration-platform) | Multi-agent workflow execution engine |
| [`.agents`](https://github.com/muffy86/.agents) | Private agent configs (PowerShell) |

---

## 🔄 Session Startup Checklist (For the Agent)

```
1. Load this file (agent-guide.md)
2. Check active branch on target repo
3. Confirm Make.com "AI Agent - Max Config" scenario is healthy
4. Pull latest memory context for Adam
5. Infer current task from last commit message or open issues
6. Begin — no check-in required
```

---

*Last updated: 2026-06-02 | Maintained by: Perplexity AI agent session*
