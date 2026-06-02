# BrowserOS Agent Guide
## Understanding Your Needs, Extending Capabilities, Maximizing Potential

---

## Table of Contents
1. [How to Communicate Your Preferences](#how-to-communicate-your-preferences)
2. [What the Agent Can Do For You](#what-the-agent-can-do-for-you)
3. [Extending Capabilities](#extending-capabilities)
4. [Understanding Limits](#understanding-limits)
5. [Maximizing Your Experience](#maximizing-your-experience)

---

## How to Communicate Your Preferences

### 1. Core Memory (Permanent)
Store facts about yourself that should persist forever:
- **Use case**: Name, job title, location, recurring projects, important preferences
- **How**: Tell me directly: "Remember that I prefer..." or "Save to core memory that I..."
- **Examples**:
  - "I prefer bullet points over paragraphs"
  - "I'm a software engineer working on React projects"
  - "Always use dark mode when available"
  - "I live in Pacific Time"

### 2. Daily Memory (30-day context)
Store temporary, session-specific context:
- **Use case**: Today's tasks, current projects, one-off details
- **How**: "Today's priority is..." or "For this session, remember..."
- **Example**: "I'm researching cloud providers today – focus on pricing comparisons"

### 3. Personality/Persona (SOUL.md)
Define how the agent should behave and communicate:
- **Use case**: Tone, formality level, response style, boundaries
- **How**: Request changes: "Speak more casually" or "Be more concise"
- **Your current style**: Formal but polished professional tone, thorough but not verbose

### 4. Project Context
Share context at the start of multi-step tasks:
- What you're working on
- Why it matters
- What success looks like
- Any constraints or requirements

---

## What the Agent Can Do For You

### Web Browsing & Automation
| Task | Capability |
|------|------------|
| Research | Open multiple tabs simultaneously, extract content, compare sources |
| Data Extraction | Pull tables, lists, pricing from any page into CSV/JSON |
| Form Filling | Complete web forms intelligently (signup, checkout, applications) |
| Monitoring | Track page changes, price drops, stock availability |
| Screenshots | Capture full pages or specific elements |
| PDF Generation | Save pages as PDF for offline reading |
| Downloads | Download files, save them to your workspace |

### Tab & Window Management
- Group related tabs automatically
- Organize cluttered tabs by topic
- Close duplicates
- Compare pages side-by-side

### Filesystem & Code
- Read, write, and edit files
- Execute shell commands and scripts
- Search files by content or name
- Process data (CSV, JSON, text)

### Memory & Context
- **Search across all memories**: "What did I ask about last week?"
- **Recall preferences**: Agent remembers your style across sessions
- **Project continuity**: "Continue where we left off on the pricing research"

### External Integrations (Strata)
When connected, direct API access to:
- **Productivity**: Gmail, Calendar, Docs, Sheets, Notion, Confluence
- **Development**: GitHub, GitLab, Vercel, Supabase, Postman
- **Project Management**: Linear, Jira, Asana, Monday, ClickUp
- **Communication**: Slack, Teams, Discord, WhatsApp
- **Business**: Salesforce, HubSpot, Stripe, Zendesk
- **Storage**: Drive, Dropbox, OneDrive, Box
- **And more**: 40+ services available

### Built-in Skills
- **Compare Prices**: Search across retailers, find best deals
- **Deep Research**: Multi-source research with HTML reports
- **Find Alternatives**: Discover similar products/tools
- **Fill Form**: Intelligent form completion
- **Monitor Page**: Track changes over time
- **Organize Tabs**: Clean up tab clutter
- **Read Later**: Bookmark + PDF for offline reading
- **Save Page**: Archive pages as PDF
- **Screenshot Walkthrough**: Document step-by-step processes
- **Summarize Page**: Extract key content quickly
- **Manage Bookmarks**: Organize and clean bookmarks

---

## Extending Capabilities

### 1. Connect External Services
Each connected service adds native API capabilities:
- Set up once, use forever
- Faster than browser automation
- Works in background without navigating away
- How: "Connect my Gmail" or "I want to use Notion"

### 2. Use Skills System
Request specialized tasks by name:
- "Compare prices for [product]"
- "Research [topic] deeply"
- "Organize my tabs"
- "Monitor this page for changes"

### 3. File-Based Workflows
Store data, scripts, or configurations in your workspace:
- Data files the agent can reference
- Scripts the agent can run
- Templates for repeated tasks
- Output from previous sessions

### 4. Memory as Extension
Teach the agent about your domain:
- Industry terminology
- Recurring workflows
- Preferred tools and vendors
- Decision-making criteria

### 5. Scheduled Tasks
Automate recurring work:
- Daily news briefings
- Price monitoring
- Data gathering reports
- System checks

---

## Understanding Limits

### What the Agent Cannot Do

| Category | Limitation |
|----------|------------|
| **Real-time browsing** | Cannot watch live streams or real-time dashboards continuously |
| **Phone/SMS** | No phone calling or SMS capabilities (unless via connected apps like WhatsApp) |
| **Physical devices** | Cannot control IoT, smart home, or local hardware directly |
| **System-level OS** | Limited to browser + workspace; no deep system access |
| **Authentication** | Cannot solve CAPTCHAs, handle 2FA for you, or store your passwords |
| **Legal/Compliance** | Cannot sign contracts, submit legal documents, or make binding commitments |

### Operational Limits
- **Session duration**: Tasks have timeout limits (typically 120s for shell commands)
- **File size**: Large downloads and file operations have size constraints
- **Rate limits**: External services may throttle API calls
- **Concurrent tasks**: Limited number of parallel operations at once
- **JavaScript execution**: Can read page state but not modify pages unless you ask

### Security Boundaries
- **Credentials**: Won't type passwords into pages I navigated to myself
- **Sensitive data**: Won't copy sensitive info between sites unless you explicitly instruct
- **External actions**: Confirms before sending messages, creating resources, or deleting data
- **Credit/financial**: Confirms before purchases, subscriptions, or payment actions

### Accuracy Limits
- **Web content**: Depends on page structure; dynamic/JavaScript-heavy sites may be harder
- **Live data**: Prices/inventory may change between extraction and your action
- **Interpretation**: May misunderstand ambiguous instructions - be specific
- **Memory recall**: Searches fuzzy-match; very old or niche memories may not surface

---

## Maximizing Your Experience

### Best Practices

1. **Be Specific**
   - ❌ "Research this"
   - ✅ "Research cloud storage pricing for enterprise use, compare AWS, Azure, and Google Cloud, focus on egress costs"

2. **Provide Context**
   - Why you need something
   - What you'll do with it
   - Who else needs to see it
   - Any constraints or requirements

3. **Reference Memory**
   - "Check what I saved about the React project"
   - "Last week you found pricing for X – update that"

4. **Iterate**
   - Start broad, then narrow
   - Request corrections: "Make it more concise" or "Add technical details"
   - Build on previous work

5. **Use the Right Tool**
   - One-page lookup → stay in current tab
   - Comparison → open background tabs + grouping
   - Data extraction → use skills or direct DOM access
   - External service → connect first, then use native API

### Communication Patterns That Work

**For complex tasks:**
```
"I need to [goal]. Context: [why it matters]. 
Constraints: [time/budget/requirements]. 
Preferred format: [report/summary/raw data]."
```

**For preferences:**
```
"Update my preferences: [specific change]. 
Scope: [this session/forever/for project X]."
```

**For clarifications:**
```
"Focus on [specific aspect]" or 
"Exclude [specific thing]" or
"Prioritize [criterion]"
```

### Quick Reference: Tell Me To Remember

| Type | Command Example |
|------|-----------------|
| Personal fact | "Save to core memory: I'm a product manager at TechCorp" |
| Communication style | "Respond more casually from now on" |
| Today's context | "Today I'm evaluating CRMs for a 50-person team" |
| Project details | "For the Acme project, we need to stay under $10k" |
| Preferences | "I prefer JSON over CSV for data exports" |

---

## Summary: Your Agent's Potential

**What makes this powerful:**
- Multi-source research in minutes instead of hours
- Data extraction without copy-paste
- Memory that persists across sessions
- API integrations that bypass browser automation
- Skills that solve common workflows

**The partnership model:**
- You provide direction, context, and preferences
- I provide execution, research, organization, and memory
- Together we scale what you can accomplish

**The more you share:**
- ✓ What you're working on
- ✓ Why it matters
- ✓ How you like results formatted
- ✓ What's worked or hasn't before

**The better I become at:**
- Anticipating what you need
- Formatting outputs to your taste
- Remembering relevant context
- Recommaging useful next steps

---

*This guide evolves. As we work together, update it with new discoveries, preferences, and workflows that work for you.*
