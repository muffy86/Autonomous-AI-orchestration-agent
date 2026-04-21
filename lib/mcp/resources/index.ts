/**
 * MCP Resources
 * Provide context and data resources to AI models
 */

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  read: () => Promise<string | object>;
}

export const mcpResources: MCPResource[] = [
  {
    uri: 'resource://system/info',
    name: 'System Information',
    description: 'Current system and environment information',
    mimeType: 'application/json',
    read: async () => {
      return {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        env: {
          NODE_ENV: process.env.NODE_ENV,
          hasOpenAI: !!process.env.OPENAI_API_KEY,
          hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
          hasGoogle: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
          hasXAI: !!process.env.XAI_API_KEY,
          hasGroq: !!process.env.GROQ_API_KEY,
          hasOpenRouter: !!process.env.OPENROUTER_API_KEY,
          hasTogether: !!process.env.TOGETHER_API_KEY,
        },
      };
    },
  },
  {
    uri: 'resource://models/available',
    name: 'Available Models',
    description: 'List of all available AI models and their capabilities',
    mimeType: 'application/json',
    read: async () => {
      const { modelProviders } = await import('../providers');
      return {
        providers: modelProviders.listProviders(),
        freeModels: modelProviders.getFreeModels(),
        configuredProviders: modelProviders.getConfiguredProviders().map(p => p.id),
      };
    },
  },
  {
    uri: 'resource://tools/available',
    name: 'Available Tools',
    description: 'List of all available MCP tools',
    mimeType: 'application/json',
    read: async () => {
      return {
        tools: mcpTools.map(tool => ({
          name: tool.name,
          description: tool.description,
          parameters: Object.keys(tool.inputSchema.properties),
          required: tool.inputSchema.required || [],
        })),
        count: mcpTools.length,
      };
    },
  },
  {
    uri: 'resource://skills/available',
    name: 'Available Skills',
    description: 'List of all available autonomous skills',
    mimeType: 'application/json',
    read: async () => {
      const { skillsManager } = await import('../skills');
      return {
        skills: skillsManager.listSkills(),
      };
    },
  },
  {
    uri: 'resource://webhooks/registered',
    name: 'Registered Webhooks',
    description: 'List of all registered webhooks',
    mimeType: 'application/json',
    read: async () => {
      const { webhookManager } = await import('../webhooks');
      return {
        webhooks: webhookManager.listWebhooks(),
      };
    },
  },
  {
    uri: 'resource://config/mcp',
    name: 'MCP Configuration',
    description: 'Current MCP server configuration',
    mimeType: 'application/json',
    read: async () => {
      return {
        version: '1.0.0',
        features: {
          tools: true,
          resources: true,
          prompts: true,
          webhooks: true,
          skills: true,
          multiModel: true,
        },
        capabilities: [
          'code-execution',
          'web-search',
          'file-operations',
          'git-operations',
          'database-access',
          'notifications',
          'image-generation',
          'data-analysis',
          'task-scheduling',
        ],
      };
    },
  },
  {
    uri: 'resource://docs/api',
    name: 'API Documentation',
    description: 'Complete API documentation',
    mimeType: 'text/markdown',
    read: async () => {
      return `# MCP Server API Documentation

## Overview
This MCP server provides autonomous AI capabilities with multi-model support.

## Available Tools
- execute_code: Run code in various languages
- web_search: Search the web
- fetch_url: Fetch content from URLs
- database_query: Query databases
- file_operations: File system operations
- git_operations: Git version control
- send_notification: Send notifications
- image_generation: Generate AI images
- data_analysis: Analyze data
- schedule_task: Schedule tasks

## Available Resources
- system/info: System information
- models/available: Available AI models
- tools/available: Available tools
- skills/available: Available skills
- webhooks/registered: Registered webhooks
- config/mcp: MCP configuration

## Webhooks
POST /api/webhooks/:hookId - Trigger webhook

## Skills
GET /api/skills - List skills
POST /api/skills/:skillName/execute - Execute skill

## Model Providers
- OpenAI (GPT models)
- Anthropic (Claude models)
- Google (Gemini models - FREE TIER)
- xAI (Grok models)
- Groq (Ultra-fast inference - FREE)
- OpenRouter (Multiple providers - FREE options)
- Together AI (Open source models - FREE credits)
`;
    },
  },
];

// Import mcpTools for the resources that need it
import { mcpTools } from '../tools';
