/**
 * MCP Module Exports
 * Main entry point for the Model Context Protocol implementation
 */

// Server
export { MCPServer, MCPHTTPServer, mcpServer, mcpHttpServer } from './server';

// Tools
export { mcpTools, getToolByName, listTools } from './tools';
export type { MCPTool } from './tools';

// Resources
export { mcpResources } from './resources';
export type { MCPResource } from './resources';

// Providers
export { modelProviders } from './providers';
export type { ModelProvider, ModelInfo } from './providers';

// Webhooks
export { webhookManager, createWebhookSignature, verifyWebhookSignature } from './webhooks';
export type { Webhook } from './webhooks';

// Skills
export { skillsManager } from './skills';
export type { Skill } from './skills';

// Configuration
export {
  defaultConfig,
  getConfig,
  updateConfig,
  getResourcePack,
  listResourcePacks,
  resourcePacks,
} from './config';
export type { MCPConfig, ResourcePack } from './config';

// Version
export const MCP_VERSION = '1.0.0';
export const MCP_NAME = 'ai-chatbot-mcp-server';

// Initialize function
export async function initializeMCP() {
  console.log(`Initializing ${MCP_NAME} v${MCP_VERSION}...`);
  
  // Check for configured providers
  const configured = modelProviders.getConfiguredProviders();
  console.log(`Found ${configured.length} configured AI providers`);
  
  if (configured.length === 0) {
    console.warn('⚠️  No AI providers configured!');
    console.warn('Add API keys to .env for: Google Gemini (free), Groq (free), OpenRouter (free)');
  }
  
  // List free models
  const freeModels = modelProviders.getFreeModels();
  console.log(`Found ${freeModels.length} free AI models available`);
  
  return {
    version: MCP_VERSION,
    name: MCP_NAME,
    configured,
    freeModels,
    tools: mcpTools.length,
    skills: skillsManager.listSkills().length,
    webhooks: webhookManager.listWebhooks().length,
    resources: mcpResources.length,
  };
}
