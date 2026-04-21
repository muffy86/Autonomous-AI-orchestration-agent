# 🌐 Public AI Integration Guide

Complete guide for integrating Public AI's sovereign, open-source AI infrastructure with your Autonomous Agent OS.

## What is Public AI?

**Public AI Inference Utility** is a **nonprofit, open-source platform** that provides public access to sovereign and open-source AI models. It functions as a "public utility" for AI—similar to infrastructure like electricity or water—making AI models from national labs, research institutions, and governments accessible to everyone.

### Core Philosophy

- **Public Infrastructure**: AI as a public utility, not a private commodity
- **Sovereign Models**: Models developed by national labs and research institutions
- **Transparency**: Full transparency in model development and deployment
- **Privacy-First**: User prompts aren't used for training by default
- **Open Source**: Frontend and deployment configurations are fully open-source
- **GDPR-Compliant**: EU-hosted options available

## Platform Components

### 1. Chat Interface
**URL**: https://chat.publicai.co

Consumer-facing web application based on OpenWebUI for interactive conversations with sovereign AI models.

**Features**:
- Clean, intuitive interface
- Multiple model selection
- Conversation history
- Advanced features (RAG, web search, tools)

### 2. Developer API
**URL**: https://api.publicai.co/v1

OpenAI-compatible API for programmatic access to sovereign AI models.

**Features**:
- OpenAI-compatible endpoints
- `/v1/chat/completions` for chat
- `/v1/models` for model listing
- Standard authentication with API keys

### 3. Developer Portal
**URL**: https://platform.publicai.co

Documentation, API key management, and model information.

**Features**:
- API key generation
- Model documentation
- Usage examples
- Interactive playground

## Technical Specifications

### Model: Apertus (Swiss AI Initiative)

**Apertus** is a fully open foundation model for sovereign AI developed by the Swiss AI Initiative.

**Capabilities**:
- **Context Window**: 65,536 tokens (64K context)
- **Max Output Tokens**: 8,192 tokens
- **Model ID**: `swiss-ai/apertus-8b-instruct`
- **Parameters**: 8 billion
- **License**: Apache 2.0 (commercial use allowed)
- **Languages**: Multilingual support
- **EU AI Act**: Fully compliant

**Recommended Settings**:
- **Temperature**: 0.8 (as recommended by swiss-ai)
- **Top-p**: 0.9 (as recommended by swiss-ai)

### Additional Models

- **SEA-LION v4**: Southeast Asian language model
- More models being added from national labs and research institutions

## Advanced Features

### 1. RAG (Retrieval-Augmented Generation)
Access to national knowledgebases and custom document collections.

### 2. Web Search
Integrated web search capabilities for real-time information.

### 3. Tool Plugins
Support for custom tools and function calling.

### 4. Privacy-First
- User prompts NOT used for training by default
- Optional "Data Flywheel" for contributing to public research
- Transparent data handling policies

## Getting Started with Public AI

### Step 1: Sign Up

1. Visit https://platform.publicai.co
2. Click "Login" in the top right
3. Sign up using single sign-on (SSO)

### Step 2: Generate API Key

1. Navigate to [API Keys](https://platform.publicai.co/settings/api-keys)
2. Click "Create API Key"
3. Enter a name and set expiration
4. Click "Generate Key"
5. **Save your API key securely**

### Step 3: Test Your Connection

```bash
# List available models
curl -X GET https://api.publicai.co/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "User-Agent: MyApp/1.0"

# Make a chat completion request
curl -X POST https://api.publicai.co/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "User-Agent: MyApp/1.0" \
  -d '{
    "model": "swiss-ai/apertus-8b-instruct",
    "messages": [
      {
        "role": "user",
        "content": "What are the benefits of sovereign AI?"
      }
    ],
    "temperature": 0.8,
    "top_p": 0.9,
    "max_tokens": 8192
  }'
```

## Integration with Autonomous Agent OS

### Quick Setup

```bash
# Add to .env file
PUBLIC_AI_API_KEY=your_api_key_here
PUBLIC_AI_BASE_URL=https://api.publicai.co/v1
```

### Basic Usage

```typescript
import { createFullFeaturedAgentOS } from '@/lib/autonomous-agent';

// Initialize with Public AI
const agentOS = await createFullFeaturedAgentOS(
  process.env.PUBLIC_AI_API_KEY
);

// The Public AI agent is automatically registered
// Execute tasks that will be routed to sovereign AI
const taskId = await agentOS.executeTask({
  type: 'analysis',
  description: 'Analyze the benefits of sovereign AI infrastructure',
  input: {
    focus: ['transparency', 'privacy', 'governance'],
  },
});
```

### Custom Public AI Agent

```typescript
import { createPublicAIAgent } from '@/lib/autonomous-agent';

// Create a specialized Public AI agent
const sovereignAgent = createPublicAIAgent({
  name: 'Sovereign Research Agent',
  description: 'Specializes in transparent, privacy-first AI research',
  modelName: 'swiss-ai/apertus-8b-instruct',
  systemPrompt: `You are a sovereign AI agent focused on transparency, 
    privacy, and public interest. You prioritize GDPR compliance and 
    ethical AI practices.`,
  temperature: 0.8,
  maxTokens: 8192,
  autonomous: true,
  priority: 8,
});

// Register with orchestrator
agentOS.orchestrator.registerAgent(sovereignAgent);
```

### Advanced Configuration

```typescript
import { AutonomousAgentOS } from '@/lib/autonomous-agent';

const agentOS = new AutonomousAgentOS({
  publicAI: {
    enabled: true,
    apiKey: process.env.PUBLIC_AI_API_KEY,
    baseUrl: 'https://api.publicai.co/v1',
    model: 'swiss-ai/apertus-8b-instruct',
    config: {
      temperature: 0.8,
      topP: 0.9,
      maxTokens: 8192,
      contextWindow: 65536,
    },
  },
  orchestration: {
    strategy: 'autonomous',
    enableAutoExecution: true,
  },
});

await agentOS.initialize();
```

## Use Cases

### 1. Research & Education

```typescript
// Academic research with transparent AI
await agentOS.executeTask({
  type: 'analysis',
  description: 'Research the impact of sovereign AI on digital sovereignty',
  input: {
    sources: ['academic_papers', 'policy_documents'],
    regions: ['EU', 'Switzerland'],
  },
});
```

### 2. GDPR-Compliant Applications

```typescript
// EU-compliant data processing
await agentOS.executeTask({
  type: 'execution',
  description: 'Process user data with GDPR compliance',
  input: {
    data: userData,
    privacy: 'gdpr_strict',
    dataResidency: 'EU',
  },
});
```

### 3. Multilingual Support

```typescript
// Multilingual content generation
await agentOS.executeTask({
  type: 'execution',
  description: 'Translate and localize content for European markets',
  input: {
    content: 'Product description...',
    languages: ['de', 'fr', 'it', 'es'],
  },
});
```

### 4. Transparent AI Decision Making

```typescript
// Explainable AI decisions
await agentOS.executeTask({
  type: 'analysis',
  description: 'Analyze loan application with full transparency',
  input: {
    application: loanData,
    explainDecision: true,
    complianceCheck: true,
  },
});
```

### 5. Public Sector Applications

```typescript
// Government service chatbot
await agentOS.executeTask({
  type: 'execution',
  description: 'Create a citizen service chatbot for tax information',
  input: {
    domain: 'taxation',
    country: 'Switzerland',
    languages: ['de', 'fr', 'it', 'en'],
  },
});
```

## API Integration Examples

### Direct API Calls

```typescript
// Using fetch with Public AI
async function callPublicAI(prompt: string) {
  const response = await fetch('https://api.publicai.co/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.PUBLIC_AI_API_KEY}`,
      'User-Agent': 'AutonomousAgentOS/1.0',
    },
    body: JSON.stringify({
      model: 'swiss-ai/apertus-8b-instruct',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      top_p: 0.9,
      max_tokens: 8192,
    }),
  });

  return await response.json();
}
```

### Using with AI SDK

```typescript
import { createOpenAI } from '@ai-sdk/openai';

// Configure Public AI as OpenAI-compatible provider
const publicAI = createOpenAI({
  baseURL: 'https://api.publicai.co/v1',
  apiKey: process.env.PUBLIC_AI_API_KEY,
});

// Use in your application
const model = publicAI('swiss-ai/apertus-8b-instruct');
```

### Streaming Responses

```typescript
async function streamPublicAI(prompt: string) {
  const response = await fetch('https://api.publicai.co/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.PUBLIC_AI_API_KEY}`,
      'User-Agent': 'AutonomousAgentOS/1.0',
    },
    body: JSON.stringify({
      model: 'swiss-ai/apertus-8b-instruct',
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      temperature: 0.8,
      max_tokens: 8192,
    }),
  });

  // Process stream
  const reader = response.body?.getReader();
  if (!reader) return;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = new TextDecoder().decode(value);
    console.log(chunk);
  }
}
```

## Benefits of Using Public AI

### 1. **Sovereignty**
- Models developed by public institutions
- No vendor lock-in
- National and regional control

### 2. **Transparency**
- Open-source deployments
- Full transparency in model development
- Public governance

### 3. **Privacy**
- Privacy-first by default
- GDPR-compliant
- EU-hosted options
- No training on user data (by default)

### 4. **Cost-Effective**
- Nonprofit pricing model
- Public infrastructure approach
- No hidden costs

### 5. **Commercial Use**
- Apache 2.0 licensed (Apertus)
- Commercial applications allowed
- No usage restrictions

### 6. **Compliance**
- EU AI Act compliant
- GDPR ready
- Regulatory transparency

### 7. **Quality**
- Research-grade models
- Multilingual capabilities
- Continuous improvements

## Rate Limits

During Swiss AI Weeks: **20 requests per minute**

Check the [Public AI platform](https://platform.publicai.co) for current rate limits.

## Best Practices

### 1. User-Agent Header
Always include a descriptive User-Agent header:

```javascript
headers: {
  'User-Agent': 'AutonomousAgentOS/1.0 (your-app-name)'
}
```

### 2. Error Handling

```typescript
try {
  const result = await callPublicAI(prompt);
  return result;
} catch (error) {
  if (error.status === 429) {
    // Rate limit - implement backoff
    await sleep(60000);
    return callPublicAI(prompt);
  }
  throw error;
}
```

### 3. Token Management

```typescript
// Monitor token usage
const response = await callPublicAI(prompt);
console.log('Tokens used:', response.usage);

// Respect context window limit
if (conversationTokens > 60000) {
  // Summarize or truncate conversation
}
```

### 4. Privacy Compliance

```typescript
// Don't send sensitive data without user consent
const sanitizedData = removePII(userData);
await agentOS.executeTask({
  type: 'analysis',
  input: sanitizedData,
});
```

## Comparison: Public AI vs Commercial Providers

| Feature | Public AI | OpenAI | Anthropic |
|---------|-----------|--------|-----------|
| **Pricing** | Nonprofit | Commercial | Commercial |
| **Data Privacy** | Privacy-first | Training opt-out | Training opt-out |
| **Sovereignty** | Public/National | Private | Private |
| **Transparency** | Full | Limited | Limited |
| **Open Source** | Yes | No | No |
| **EU Hosting** | Available | Limited | Limited |
| **GDPR** | Compliant | Compliant | Compliant |
| **Commercial Use** | Apache 2.0 | Paid | Paid |
| **Context Window** | 65K | 128K | 200K |
| **Governance** | Public | Private | Private |

## Resources

### Official Links
- **Platform**: https://platform.publicai.co
- **Chat Interface**: https://chat.publicai.co
- **API Base**: https://api.publicai.co/v1
- **GitHub**: https://github.com/forpublicai
- **Main Site**: https://publicai.co

### Documentation
- [API Reference](https://platform.publicai.co/api)
- [Model Partners](https://publicai.co/contributing/model-partners)
- [About Public AI](https://publicai.co/about)
- [Terms of Service](https://publicai.co/tc)

### Community
- GitHub Discussions: https://github.com/forpublicai
- OpenWebUI Chat: https://github.com/forpublicai/chat.publicai.co

## Support

For issues or questions:
1. Check [platform.publicai.co](https://platform.publicai.co) documentation
2. GitHub Issues: [forpublicai repositories](https://github.com/forpublicai)
3. Community discussions

## Feedback

Public AI actively seeks feedback from users:
- **Apertus Feedback**: https://forms.gle/9TGSfTK1RfKj2b6X9
- **General Feedback**: Through GitHub or platform

---

## Why Public AI Matters

Public AI represents a paradigm shift in AI infrastructure:

1. **Democratic Access**: AI as a public utility, not a private commodity
2. **Sovereign Control**: Nations and institutions control their AI
3. **Transparency**: Full visibility into model development and deployment
4. **Privacy**: User data protection by design
5. **Research**: Enables open AI research and development
6. **Compliance**: Built for regulatory compliance (EU AI Act, GDPR)
7. **Sustainability**: Nonprofit model focused on public benefit

By integrating Public AI into your Autonomous Agent OS, you're contributing to a more transparent, privacy-respecting, and democratically controlled AI ecosystem.

---

**Build with sovereign AI. Build for the public good. Build with Public AI.** 🌐
