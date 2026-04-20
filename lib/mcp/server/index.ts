/**
 * MCP (Model Context Protocol) Server Implementation
 * Provides autonomous AI capabilities with multi-model support
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { mcpTools } from '../tools';
import { mcpResources } from '../resources';
import { webhookManager } from '../webhooks';
import { skillsManager } from '../skills';
import { modelProviders } from '../providers';

export class MCPServer {
  private server: Server;
  private name: string;
  private version: string;

  constructor(name = 'ai-chatbot-mcp-server', version = '1.0.0') {
    this.name = name;
    this.version = version;
    this.server = new Server(
      {
        name: this.name,
        version: this.version,
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: mcpTools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    }));

    // Execute tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const tool = mcpTools.find(t => t.name === request.params.name);
      if (!tool) {
        throw new Error(`Tool not found: ${request.params.name}`);
      }

      try {
        const result = await tool.execute(request.params.arguments);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: error instanceof Error ? error.message : 'Unknown error',
              }),
            },
          ],
          isError: true,
        };
      }
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: mcpResources.map(resource => ({
        uri: resource.uri,
        name: resource.name,
        description: resource.description,
        mimeType: resource.mimeType,
      })),
    }));

    // Read resource
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const resource = mcpResources.find(r => r.uri === request.params.uri);
      if (!resource) {
        throw new Error(`Resource not found: ${request.params.uri}`);
      }

      const content = await resource.read();
      return {
        contents: [
          {
            uri: request.params.uri,
            mimeType: resource.mimeType,
            text: typeof content === 'string' ? content : JSON.stringify(content, null, 2),
          },
        ],
      };
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`${this.name} v${this.version} started`);
  }

  async stop() {
    await this.server.close();
  }

  getServer() {
    return this.server;
  }
}

// HTTP Server for webhooks and API access
export class MCPHTTPServer {
  private port: number;
  private app: any;

  constructor(port = 3001) {
    this.port = port;
  }

  async start() {
    const express = (await import('express')).default;
    this.app = express();
    
    this.app.use(express.json());
    
    // Health check
    this.app.get('/health', (req: any, res: any) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      });
    });

    // MCP tools API
    this.app.get('/api/mcp/tools', (req: any, res: any) => {
      res.json({
        tools: mcpTools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      });
    });

    // Execute MCP tool
    this.app.post('/api/mcp/tools/:toolName', async (req: any, res: any) => {
      const tool = mcpTools.find(t => t.name === req.params.toolName);
      if (!tool) {
        return res.status(404).json({ error: 'Tool not found' });
      }

      try {
        const result = await tool.execute(req.body);
        res.json(result);
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Webhook endpoints
    this.app.post('/api/webhooks/:hookId', async (req: any, res: any) => {
      try {
        const result = await webhookManager.trigger(req.params.hookId, req.body);
        res.json(result);
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Skills API
    this.app.get('/api/skills', (req: any, res: any) => {
      res.json({
        skills: skillsManager.listSkills(),
      });
    });

    this.app.post('/api/skills/:skillName/execute', async (req: any, res: any) => {
      try {
        const result = await skillsManager.executeSkill(req.params.skillName, req.body);
        res.json(result);
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Model providers API
    this.app.get('/api/providers', (req: any, res: any) => {
      res.json({
        providers: modelProviders.listProviders(),
      });
    });

    this.app.listen(this.port, () => {
      console.log(`MCP HTTP Server running on port ${this.port}`);
    });
  }
}

export const mcpServer = new MCPServer();
export const mcpHttpServer = new MCPHTTPServer();
