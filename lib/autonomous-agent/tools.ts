/**
 * Extensible Tool Ecosystem for Autonomous Agents
 * Plugin architecture supporting custom tools and integrations
 */

import { z } from 'zod';
import { nanoid } from 'nanoid';

// ============================================================================
// Tool Types & Schemas
// ============================================================================

export const ToolParameterSchema = z.object({
  name: z.string(),
  type: z.enum([
    'string',
    'number',
    'boolean',
    'object',
    'array',
    'file',
    'image',
  ]),
  description: z.string(),
  required: z.boolean().default(false),
  default: z.any().optional(),
  enum: z.array(z.any()).optional(),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
    })
    .optional(),
});

export const ToolSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum([
    'web',
    'file',
    'code',
    'data',
    'api',
    'blockchain',
    'vision',
    'communication',
    'system',
    'custom',
  ]),
  parameters: z.array(ToolParameterSchema),
  returns: z
    .object({
      type: z.string(),
      description: z.string(),
    })
    .optional(),
  examples: z
    .array(
      z.object({
        input: z.record(z.any()),
        output: z.any(),
      })
    )
    .optional(),
  enabled: z.boolean().default(true),
  version: z.string().default('1.0.0'),
});

export const ToolExecutionSchema = z.object({
  toolId: z.string(),
  parameters: z.record(z.any()),
  timestamp: z.number(),
  status: z.enum(['pending', 'running', 'success', 'error']),
  result: z.any().optional(),
  error: z.string().optional(),
  executionTime: z.number().optional(),
});

export type ToolParameter = z.infer<typeof ToolParameterSchema>;
export type Tool = z.infer<typeof ToolSchema>;
export type ToolExecution = z.infer<typeof ToolExecutionSchema>;

// ============================================================================
// Tool Base Class
// ============================================================================

export abstract class BaseTool {
  public metadata: Tool;

  constructor(metadata: Partial<Tool>) {
    this.metadata = ToolSchema.parse({
      id: metadata.id || nanoid(),
      name: metadata.name || 'Unnamed Tool',
      description: metadata.description || '',
      category: metadata.category || 'custom',
      parameters: metadata.parameters || [],
      returns: metadata.returns,
      examples: metadata.examples,
      enabled: metadata.enabled ?? true,
      version: metadata.version || '1.0.0',
    });
  }

  abstract execute(parameters: Record<string, any>): Promise<any>;

  async run(parameters: Record<string, any>): Promise<ToolExecution> {
    const execution: ToolExecution = {
      toolId: this.metadata.id,
      parameters,
      timestamp: Date.now(),
      status: 'running',
    };

    const startTime = Date.now();

    try {
      // Validate parameters
      this.validateParameters(parameters);

      // Execute tool
      execution.result = await this.execute(parameters);
      execution.status = 'success';
      execution.executionTime = Date.now() - startTime;
    } catch (error) {
      execution.status = 'error';
      execution.error = error instanceof Error ? error.message : String(error);
      execution.executionTime = Date.now() - startTime;
    }

    return execution;
  }

  private validateParameters(parameters: Record<string, any>): void {
    for (const param of this.metadata.parameters) {
      if (param.required && !(param.name in parameters)) {
        throw new Error(`Missing required parameter: ${param.name}`);
      }

      if (param.name in parameters) {
        const value = parameters[param.name];

        // Type validation
        if (param.validation) {
          if (
            param.validation.min !== undefined &&
            typeof value === 'number' &&
            value < param.validation.min
          ) {
            throw new Error(
              `Parameter ${param.name} must be >= ${param.validation.min}`
            );
          }

          if (
            param.validation.max !== undefined &&
            typeof value === 'number' &&
            value > param.validation.max
          ) {
            throw new Error(
              `Parameter ${param.name} must be <= ${param.validation.max}`
            );
          }

          if (
            param.validation.pattern &&
            typeof value === 'string' &&
            !new RegExp(param.validation.pattern).test(value)
          ) {
            throw new Error(
              `Parameter ${param.name} must match pattern ${param.validation.pattern}`
            );
          }
        }

        // Enum validation
        if (param.enum && !param.enum.includes(value)) {
          throw new Error(
            `Parameter ${param.name} must be one of: ${param.enum.join(', ')}`
          );
        }
      }
    }
  }

  isEnabled(): boolean {
    return this.metadata.enabled;
  }

  enable(): void {
    this.metadata.enabled = true;
  }

  disable(): void {
    this.metadata.enabled = false;
  }
}

// ============================================================================
// Built-in Tools
// ============================================================================

export class WebSearchTool extends BaseTool {
  constructor() {
    super({
      name: 'web_search',
      description: 'Search the web for information using various search engines',
      category: 'web',
      parameters: [
        {
          name: 'query',
          type: 'string',
          description: 'Search query',
          required: true,
        },
        {
          name: 'engine',
          type: 'string',
          description: 'Search engine to use',
          required: false,
          enum: ['google', 'bing', 'duckduckgo'],
          default: 'google',
        },
        {
          name: 'limit',
          type: 'number',
          description: 'Maximum number of results',
          required: false,
          default: 10,
          validation: { min: 1, max: 100 },
        },
      ],
      returns: {
        type: 'array',
        description: 'Array of search results with title, url, and snippet',
      },
    });
  }

  async execute(params: Record<string, any>): Promise<any> {
    const { query, engine = 'google', limit = 10 } = params;
    
    console.log(`🔍 Searching ${engine} for: ${query}`);

    // In production: Integrate with search APIs
    // - Google Custom Search API
    // - Bing Search API
    // - SerpAPI
    
    return [
      {
        title: `Result for ${query}`,
        url: 'https://example.com',
        snippet: 'Search result snippet...',
      },
    ].slice(0, limit);
  }
}

export class FileSystemTool extends BaseTool {
  constructor() {
    super({
      name: 'file_system',
      description: 'Read, write, and manage files on the file system',
      category: 'file',
      parameters: [
        {
          name: 'action',
          type: 'string',
          description: 'File system action to perform',
          required: true,
          enum: ['read', 'write', 'delete', 'list', 'exists'],
        },
        {
          name: 'path',
          type: 'string',
          description: 'File or directory path',
          required: true,
        },
        {
          name: 'content',
          type: 'string',
          description: 'Content to write (for write action)',
          required: false,
        },
      ],
    });
  }

  async execute(params: Record<string, any>): Promise<any> {
    const { action, path, content } = params;

    console.log(`📁 File system ${action}: ${path}`);

    // In production: Use fs/promises
    switch (action) {
      case 'read':
        return { content: 'File content...' };
      case 'write':
        return { success: true, bytesWritten: content?.length || 0 };
      case 'delete':
        return { success: true };
      case 'list':
        return { files: [] };
      case 'exists':
        return { exists: true };
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
}

export class CodeExecutorTool extends BaseTool {
  constructor() {
    super({
      name: 'code_executor',
      description: 'Execute code in various programming languages',
      category: 'code',
      parameters: [
        {
          name: 'code',
          type: 'string',
          description: 'Code to execute',
          required: true,
        },
        {
          name: 'language',
          type: 'string',
          description: 'Programming language',
          required: true,
          enum: ['python', 'javascript', 'typescript', 'bash', 'rust', 'go'],
        },
        {
          name: 'timeout',
          type: 'number',
          description: 'Execution timeout in milliseconds',
          required: false,
          default: 30000,
        },
      ],
      returns: {
        type: 'object',
        description: 'Execution result with stdout, stderr, and exit code',
      },
    });
  }

  async execute(params: Record<string, any>): Promise<any> {
    const { code, language, timeout = 30000 } = params;

    console.log(`⚙️ Executing ${language} code...`);

    // In production: Use sandboxed execution environment
    // - Docker containers
    // - VM isolation
    // - Code execution APIs (e.g., Judge0, Piston)

    return {
      stdout: 'Execution output...',
      stderr: '',
      exitCode: 0,
      executionTime: 100,
    };
  }
}

export class APICallTool extends BaseTool {
  constructor() {
    super({
      name: 'api_call',
      description: 'Make HTTP requests to external APIs',
      category: 'api',
      parameters: [
        {
          name: 'url',
          type: 'string',
          description: 'API endpoint URL',
          required: true,
        },
        {
          name: 'method',
          type: 'string',
          description: 'HTTP method',
          required: false,
          enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
          default: 'GET',
        },
        {
          name: 'headers',
          type: 'object',
          description: 'Request headers',
          required: false,
        },
        {
          name: 'body',
          type: 'object',
          description: 'Request body',
          required: false,
        },
      ],
    });
  }

  async execute(params: Record<string, any>): Promise<any> {
    const { url, method = 'GET', headers = {}, body } = params;

    console.log(`🌐 ${method} ${url}`);

    // In production: Use fetch or axios
    // const response = await fetch(url, {
    //   method,
    //   headers,
    //   body: body ? JSON.stringify(body) : undefined,
    // });
    // return await response.json();

    return { success: true, data: {} };
  }
}

export class DatabaseTool extends BaseTool {
  constructor() {
    super({
      name: 'database',
      description: 'Query and manipulate database records',
      category: 'data',
      parameters: [
        {
          name: 'action',
          type: 'string',
          description: 'Database action',
          required: true,
          enum: ['query', 'insert', 'update', 'delete'],
        },
        {
          name: 'query',
          type: 'string',
          description: 'SQL query or operation',
          required: true,
        },
        {
          name: 'parameters',
          type: 'array',
          description: 'Query parameters',
          required: false,
        },
      ],
    });
  }

  async execute(params: Record<string, any>): Promise<any> {
    const { action, query, parameters = [] } = params;

    console.log(`🗄️ Database ${action}: ${query}`);

    // In production: Connect to database and execute query
    return { rows: [], affected: 0 };
  }
}

export class EmailTool extends BaseTool {
  constructor() {
    super({
      name: 'email',
      description: 'Send emails via SMTP or email service APIs',
      category: 'communication',
      parameters: [
        {
          name: 'to',
          type: 'string',
          description: 'Recipient email address',
          required: true,
        },
        {
          name: 'subject',
          type: 'string',
          description: 'Email subject',
          required: true,
        },
        {
          name: 'body',
          type: 'string',
          description: 'Email body content',
          required: true,
        },
        {
          name: 'attachments',
          type: 'array',
          description: 'File attachments',
          required: false,
        },
      ],
    });
  }

  async execute(params: Record<string, any>): Promise<any> {
    const { to, subject, body, attachments = [] } = params;

    console.log(`📧 Sending email to ${to}: ${subject}`);

    // In production: Use nodemailer or email service API
    return { messageId: nanoid(), sent: true };
  }
}

export class ImageGeneratorTool extends BaseTool {
  constructor() {
    super({
      name: 'image_generator',
      description: 'Generate images using AI models',
      category: 'vision',
      parameters: [
        {
          name: 'prompt',
          type: 'string',
          description: 'Image generation prompt',
          required: true,
        },
        {
          name: 'model',
          type: 'string',
          description: 'Image generation model',
          required: false,
          enum: ['dall-e-3', 'stable-diffusion', 'midjourney'],
          default: 'dall-e-3',
        },
        {
          name: 'size',
          type: 'string',
          description: 'Image size',
          required: false,
          enum: ['256x256', '512x512', '1024x1024'],
          default: '1024x1024',
        },
      ],
    });
  }

  async execute(params: Record<string, any>): Promise<any> {
    const { prompt, model = 'dall-e-3', size = '1024x1024' } = params;

    console.log(`🎨 Generating image with ${model}: ${prompt}`);

    // In production: Call image generation API
    return {
      url: 'https://example.com/generated-image.png',
      prompt,
      model,
      size,
    };
  }
}

// ============================================================================
// Tool Registry
// ============================================================================

export class ToolRegistry {
  private tools: Map<string, BaseTool> = new Map();
  private executionHistory: ToolExecution[] = [];
  private maxHistorySize = 1000;

  registerTool(tool: BaseTool): void {
    this.tools.set(tool.metadata.id, tool);
    console.log(`🔧 Registered tool: ${tool.metadata.name}`);
  }

  unregisterTool(toolId: string): void {
    this.tools.delete(toolId);
  }

  getTool(toolId: string): BaseTool | undefined {
    return this.tools.get(toolId);
  }

  getToolByName(name: string): BaseTool | undefined {
    return Array.from(this.tools.values()).find(
      (tool) => tool.metadata.name === name
    );
  }

  getAllTools(): BaseTool[] {
    return Array.from(this.tools.values());
  }

  getToolsByCategory(category: Tool['category']): BaseTool[] {
    return Array.from(this.tools.values()).filter(
      (tool) => tool.metadata.category === category
    );
  }

  getEnabledTools(): BaseTool[] {
    return Array.from(this.tools.values()).filter((tool) => tool.isEnabled());
  }

  async executeTool(
    toolId: string,
    parameters: Record<string, any>
  ): Promise<ToolExecution> {
    const tool = this.tools.get(toolId);
    if (!tool) {
      throw new Error(`Tool not found: ${toolId}`);
    }

    if (!tool.isEnabled()) {
      throw new Error(`Tool is disabled: ${toolId}`);
    }

    const execution = await tool.run(parameters);
    
    this.executionHistory.push(execution);
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory.shift();
    }

    return execution;
  }

  getExecutionHistory(limit?: number): ToolExecution[] {
    const history = [...this.executionHistory].reverse();
    return limit ? history.slice(0, limit) : history;
  }

  getToolMetrics() {
    const toolMetrics = new Map<string, {
      executions: number;
      successes: number;
      failures: number;
      averageTime: number;
    }>();

    for (const execution of this.executionHistory) {
      const existing = toolMetrics.get(execution.toolId) || {
        executions: 0,
        successes: 0,
        failures: 0,
        averageTime: 0,
      };

      existing.executions++;
      if (execution.status === 'success') existing.successes++;
      if (execution.status === 'error') existing.failures++;
      if (execution.executionTime) {
        existing.averageTime =
          (existing.averageTime * (existing.executions - 1) +
            execution.executionTime) /
          existing.executions;
      }

      toolMetrics.set(execution.toolId, existing);
    }

    return Array.from(toolMetrics.entries()).map(([toolId, metrics]) => {
      const tool = this.tools.get(toolId);
      return {
        toolId,
        toolName: tool?.metadata.name || 'Unknown',
        ...metrics,
        successRate: (metrics.successes / metrics.executions) * 100,
      };
    });
  }
}

// ============================================================================
// Tool Factory
// ============================================================================

export class ToolFactory {
  static createStandardToolset(): ToolRegistry {
    const registry = new ToolRegistry();

    // Register all built-in tools
    registry.registerTool(new WebSearchTool());
    registry.registerTool(new FileSystemTool());
    registry.registerTool(new CodeExecutorTool());
    registry.registerTool(new APICallTool());
    registry.registerTool(new DatabaseTool());
    registry.registerTool(new EmailTool());
    registry.registerTool(new ImageGeneratorTool());

    return registry;
  }

  static createCustomTool(
    name: string,
    description: string,
    category: Tool['category'],
    parameters: ToolParameter[],
    executor: (params: Record<string, any>) => Promise<any>
  ): BaseTool {
    return new (class extends BaseTool {
      constructor() {
        super({ name, description, category, parameters });
      }

      async execute(params: Record<string, any>): Promise<any> {
        return executor(params);
      }
    })();
  }
}
