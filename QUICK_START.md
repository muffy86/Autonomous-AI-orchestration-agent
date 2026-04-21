# 🚀 Quick Start - Autonomous Agent OS

Get your personal autonomous agentic operating system running in under 5 minutes.

## Prerequisites

- Node.js 18+ installed
- pnpm (or npm) installed
- API key from OpenAI, Anthropic, or Public AI

## Installation

```bash
# 1. Clone the repository (if you haven't already)
git clone <your-repo-url>
cd <repo-name>

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env
```

## Configuration

Edit `.env` and add at minimum one AI provider API key:

```bash
# Option 1: Use OpenAI
OPENAI_API_KEY=sk-...

# Option 2: Use Public AI (Sovereign AI)
PUBLIC_AI_API_KEY=...

# Option 3: Use Anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

**Optional**: Add blockchain credentials if you want to use blockchain features:

```bash
ETHEREUM_PRIVATE_KEY=0x...
POLYGON_PRIVATE_KEY=0x...
```

## Run It

### Option 1: Run the Demo (Recommended)

```bash
pnpm tsx examples/autonomous-agent-demo.ts
```

This runs 7 comprehensive demos showing all capabilities.

### Option 2: Start the Web Server

```bash
pnpm dev
```

Then visit: `http://localhost:3000/api/autonomous-agent?action=status`

### Option 3: Use in Your Code

```typescript
import { createFullFeaturedAgentOS } from '@/lib/autonomous-agent';

async function main() {
  // Initialize the agent OS
  const agentOS = await createFullFeaturedAgentOS(
    process.env.PUBLIC_AI_API_KEY
  );

  // Execute a task
  const taskId = await agentOS.executeTask({
    type: 'execution',
    description: 'Research the latest trends in autonomous AI agents',
    input: { sources: ['web', 'research_papers'] },
  });

  console.log('Task submitted:', taskId);

  // Get results
  const task = await agentOS.orchestrator.getTask(taskId);
  console.log('Task status:', task?.status);
  console.log('Task result:', task?.result);

  // Get system status
  const status = agentOS.getSystemStatus();
  console.log('System:', status);

  // Shutdown
  await agentOS.shutdown();
}

main();
```

## What You Can Do

### 1. Execute Autonomous Tasks

```typescript
// Let AI agents handle complex workflows
await agentOS.executeTask({
  type: 'execution',
  description: 'Build a trading bot with momentum strategy',
});
```

### 2. Use Blockchain Features

```typescript
// Swap tokens on Polygon
await agentOS.defiAgent?.swap(
  'polygon',
  'USDC',
  'WMATIC',
  '1000',  // Amount
  0.5      // Slippage %
);

// Mint an NFT
await agentOS.nftAgent?.mintNFT('ethereum', contractAddress, {
  name: 'My NFT',
  description: 'Created by autonomous agent',
  image: 'ipfs://...',
});
```

### 3. Execute Code

```typescript
// Run Python code
const toolRegistry = agentOS.toolRegistry;
const codeToolId = toolRegistry.getToolByName('code_executor')!.metadata.id;

await toolRegistry.executeTool(codeToolId, {
  code: 'print("Hello from autonomous agent!")',
  language: 'python',
});
```

### 4. Search the Web

```typescript
// Search for information
const searchToolId = toolRegistry.getToolByName('web_search')!.metadata.id;

const results = await toolRegistry.executeTool(searchToolId, {
  query: 'latest DeFi protocols 2026',
  limit: 10,
});
```

### 5. Use Vision Capabilities

```typescript
// Monitor screen
if (agentOS.visionAgent) {
  await agentOS.visionAgent.startMonitoring(
    ['Find all buttons', 'Detect errors'],
    (result) => {
      console.log('Vision detected:', result);
    }
  );
}
```

### 6. Deploy with CI/CD

```typescript
// Execute deployment pipeline
await agentOS.executePipeline({
  id: 'deploy',
  name: 'Deploy App',
  stages: [
    { id: 'build', type: 'build', command: 'npm run build' },
    { id: 'test', type: 'test', command: 'npm test' },
    { id: 'deploy', type: 'deploy', command: 'npm run deploy' },
  ],
});
```

## REST API Usage

Start the server with `pnpm dev`, then:

```bash
# Submit a task
curl -X POST http://localhost:3000/api/autonomous-agent/task \
  -H "Content-Type: application/json" \
  -d '{
    "type": "execution",
    "description": "Analyze cryptocurrency market trends"
  }'

# Get system status
curl http://localhost:3000/api/autonomous-agent?action=status

# List all agents
curl http://localhost:3000/api/autonomous-agent?action=agents

# List available tools
curl http://localhost:3000/api/autonomous-agent?action=tools

# Execute a tool
curl -X PUT http://localhost:3000/api/autonomous-agent/tool \
  -H "Content-Type: application/json" \
  -d '{
    "toolId": "web_search",
    "parameters": {
      "query": "autonomous agents",
      "limit": 5
    }
  }'
```

## UI Component

Add to any Next.js page:

```typescript
import { AutonomousAgentUI } from '@/components/autonomous-agent-ui';

export default function Dashboard() {
  return (
    <div className="container mx-auto p-4">
      <h1>My Autonomous Agent Dashboard</h1>
      <AutonomousAgentUI />
    </div>
  );
}
```

Features:
- Real-time system metrics
- Agent performance tracking
- Task submission interface
- Blockchain status
- Auto-refreshing (every 5 seconds)

## Available Agents

Your system comes with 5 pre-configured agents:

1. **Reasoning Agent** (Priority 8)
   - Complex problem-solving
   - Strategic planning
   - Decision making

2. **Vision Agent** (Priority 7)
   - Screen capture and analysis
   - OCR text extraction
   - Object detection

3. **Coding Agent** (Priority 9)
   - Code generation
   - Multi-language execution
   - Software development

4. **Blockchain Agent** (Priority 7)
   - Smart contract interaction
   - DeFi operations
   - NFT management

5. **Public AI Agent** (Priority 6)
   - Sovereign AI using Apertus
   - Privacy-first processing
   - EU-compliant

## Available Tools

Your system includes 7 built-in tools:

1. **web_search** - Search the internet
2. **file_system** - File operations (read, write, delete)
3. **code_executor** - Execute code in 6 languages
4. **api_call** - Make HTTP requests
5. **database** - Database operations
6. **email** - Send emails
7. **image_generator** - Generate AI images

## Blockchain Networks

Supports 13+ blockchain networks:

**EVM Chains:**
- Ethereum
- Polygon
- Arbitrum
- Optimism
- Base
- Avalanche
- BSC
- Fantom

**Other Chains:**
- Solana
- Cosmos
- NEAR
- Aptos
- Sui

## System Status

Check system health:

```typescript
const status = agentOS.getSystemStatus();

console.log('Agents:', status.orchestration.totalAgents);
console.log('Tasks:', status.orchestration.totalTasks);
console.log('Completed:', status.orchestration.completedTasks);
console.log('Tools:', status.tools?.total);
console.log('Chains:', status.blockchain?.chains);
```

## Next Steps

1. ✅ **Run the demo**: `pnpm tsx examples/autonomous-agent-demo.ts`
2. 📖 **Read full docs**: See `AUTONOMOUS_AGENT_OS.md`
3. 🚀 **Deploy**: See `DEPLOYMENT_GUIDE.md`
4. 🛠️ **Customize**: Add your own agents and tools
5. 🌐 **Integrate**: Use the REST API or React UI

## Common Use Cases

### Trading Bot
```typescript
await agentOS.executeTask({
  type: 'blockchain',
  description: 'Monitor DEX prices and execute arbitrage opportunities',
  input: {
    chains: ['ethereum', 'polygon'],
    minProfit: '100',
  },
});
```

### Code Generation
```typescript
await agentOS.executeTask({
  type: 'execution',
  description: 'Create a REST API with authentication',
  input: {
    language: 'typescript',
    framework: 'express',
  },
});
```

### Data Analysis
```typescript
await agentOS.executeTask({
  type: 'analysis',
  description: 'Analyze user behavior patterns from the database',
  input: {
    timeframe: '30_days',
    metrics: ['engagement', 'retention'],
  },
});
```

### Web Automation
```typescript
if (agentOS.screenInteraction) {
  await agentOS.screenInteraction.executeSequence([
    { type: 'navigate', value: 'https://example.com' },
    { type: 'wait', duration: 2000 },
    { type: 'click', target: '#login-button' },
    { type: 'type', target: '#username', value: 'user' },
    { type: 'type', target: '#password', value: 'pass' },
    { type: 'click', target: '#submit' },
  ]);
}
```

## Troubleshooting

**"No agents found"**
- Make sure you've called `await agentOS.initialize()`
- Check that API keys are set in `.env`

**"Blockchain connection failed"**
- Verify RPC URLs in `.env`
- Check network connectivity
- Try alternative RPC providers

**"Screen capture not working"**
- Grant browser permissions
- Check if running in browser environment
- Verify capture configuration

**"Task stuck in pending"**
- Check orchestration strategy
- Verify agent capabilities match task type
- Look for dependency issues

## Documentation

- **Complete API**: `AUTONOMOUS_AGENT_OS.md`
- **Deployment**: `DEPLOYMENT_GUIDE.md`
- **Overview**: `README_AUTONOMOUS_AGENT.md`
- **Examples**: `examples/autonomous-agent-demo.ts`

## Support

- 📖 Full documentation included
- 💻 Working examples provided
- 🔧 Production-ready code
- 🚀 Deploy anywhere

---

**You're ready to build with autonomous agents!** 🎉

Start with `pnpm tsx examples/autonomous-agent-demo.ts` to see everything in action.
