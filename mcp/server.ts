/**
 * MCP (Model Context Protocol) Server Implementation
 * Provides standardized AI model context management and orchestration
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import { readFile, writeFile, readdir, stat } from "fs/promises";
import { join } from "path";

const execAsync = promisify(exec);

interface MCPConfig {
  name: string;
  version: string;
  tools: Tool[];
  resources: Resource[];
  prompts: Prompt[];
}

interface Tool {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  handler: (input: any) => Promise<any>;
}

interface Resource {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
}

interface Prompt {
  name: string;
  description: string;
  arguments: Array<{ name: string; description: string; required: boolean }>;
}

class MCPServer {
  private server: Server;
  private config: MCPConfig;

  constructor(config: MCPConfig) {
    this.config = config;
    this.server = new Server(
      {
        name: config.name,
        version: config.version,
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
      tools: this.config.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    }));

    // Execute tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const tool = this.config.tools.find((t) => t.name === request.params.name);
      if (!tool) {
        throw new Error(`Tool not found: ${request.params.name}`);
      }

      try {
        const result = await tool.handler(request.params.arguments);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });

    // List resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: this.config.resources,
    }));

    // Read resource
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const resource = this.config.resources.find((r) => r.uri === request.params.uri);
      if (!resource) {
        throw new Error(`Resource not found: ${request.params.uri}`);
      }

      const content = await this.readResourceContent(resource);
      return {
        contents: [
          {
            uri: resource.uri,
            mimeType: resource.mimeType || "text/plain",
            text: content,
          },
        ],
      };
    });

    // List prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: this.config.prompts,
    }));

    // Get prompt
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const prompt = this.config.prompts.find((p) => p.name === request.params.name);
      if (!prompt) {
        throw new Error(`Prompt not found: ${request.params.name}`);
      }

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: this.buildPromptText(prompt, request.params.arguments),
            },
          },
        ],
      };
    });
  }

  private async readResourceContent(resource: Resource): Promise<string> {
    if (resource.uri.startsWith("file://")) {
      const path = resource.uri.replace("file://", "");
      return await readFile(path, "utf-8");
    }
    throw new Error(`Unsupported resource URI scheme: ${resource.uri}`);
  }

  private buildPromptText(prompt: Prompt, args?: Record<string, string>): string {
    let text = `Prompt: ${prompt.name}\n\n${prompt.description}\n\n`;
    if (args) {
      text += "Arguments:\n";
      for (const [key, value] of Object.entries(args)) {
        text += `- ${key}: ${value}\n`;
      }
    }
    return text;
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`MCP Server ${this.config.name} started`);
  }
}

// Define tools for autonomous orchestration
const tools: Tool[] = [
  {
    name: "execute_command",
    description: "Execute a shell command in the workspace",
    inputSchema: z.object({
      command: z.string().describe("The command to execute"),
      workingDir: z.string().optional().describe("Working directory"),
    }),
    handler: async (input) => {
      const { stdout, stderr } = await execAsync(input.command, {
        cwd: input.workingDir || process.cwd(),
      });
      return { stdout, stderr };
    },
  },
  {
    name: "read_file",
    description: "Read file contents from the workspace",
    inputSchema: z.object({
      path: z.string().describe("File path relative to workspace"),
    }),
    handler: async (input) => {
      const content = await readFile(input.path, "utf-8");
      return { content };
    },
  },
  {
    name: "write_file",
    description: "Write content to a file in the workspace",
    inputSchema: z.object({
      path: z.string().describe("File path relative to workspace"),
      content: z.string().describe("Content to write"),
    }),
    handler: async (input) => {
      await writeFile(input.path, input.content, "utf-8");
      return { success: true, path: input.path };
    },
  },
  {
    name: "list_directory",
    description: "List files and directories",
    inputSchema: z.object({
      path: z.string().describe("Directory path"),
    }),
    handler: async (input) => {
      const entries = await readdir(input.path, { withFileTypes: true });
      return {
        entries: entries.map((e) => ({
          name: e.name,
          type: e.isDirectory() ? "directory" : "file",
        })),
      };
    },
  },
  {
    name: "analyze_code",
    description: "Analyze code quality and suggest improvements",
    inputSchema: z.object({
      path: z.string().describe("File or directory to analyze"),
    }),
    handler: async (input) => {
      const { stdout } = await execAsync(`npx biome check ${input.path}`);
      return { analysis: stdout };
    },
  },
  {
    name: "run_tests",
    description: "Execute test suite",
    inputSchema: z.object({
      type: z.enum(["unit", "integration", "e2e", "all"]).describe("Test type"),
      pattern: z.string().optional().describe("Test file pattern"),
    }),
    handler: async (input) => {
      const command =
        input.type === "unit"
          ? "pnpm test:unit"
          : input.type === "e2e"
            ? "pnpm test"
            : "pnpm test:all";
      const { stdout, stderr } = await execAsync(command);
      return { stdout, stderr };
    },
  },
  {
    name: "git_status",
    description: "Get git repository status",
    inputSchema: z.object({}),
    handler: async () => {
      const { stdout } = await execAsync("git status --porcelain");
      return { status: stdout };
    },
  },
  {
    name: "deploy_preview",
    description: "Deploy a preview environment",
    inputSchema: z.object({
      branch: z.string().optional().describe("Branch to deploy"),
    }),
    handler: async (input) => {
      const branch = input.branch || (await execAsync("git branch --show-current")).stdout.trim();
      const { stdout } = await execAsync(`vercel deploy --yes`);
      return { deployment: stdout, branch };
    },
  },
];

// Define resources
const resources: Resource[] = [
  {
    uri: "file://package.json",
    name: "Package Configuration",
    description: "NPM package configuration and dependencies",
    mimeType: "application/json",
  },
  {
    uri: "file://README.md",
    name: "Project README",
    description: "Project documentation and setup instructions",
    mimeType: "text/markdown",
  },
  {
    uri: "file://.env.example",
    name: "Environment Variables Template",
    description: "Required environment variables",
    mimeType: "text/plain",
  },
];

// Define prompts
const prompts: Prompt[] = [
  {
    name: "code_review",
    description: "Review code changes and provide feedback",
    arguments: [
      { name: "files", description: "Files to review", required: true },
      { name: "context", description: "Additional context", required: false },
    ],
  },
  {
    name: "bug_fix",
    description: "Analyze and suggest fixes for bugs",
    arguments: [
      { name: "error", description: "Error message or description", required: true },
      { name: "file", description: "File where error occurs", required: false },
    ],
  },
  {
    name: "feature_implementation",
    description: "Plan and implement a new feature",
    arguments: [
      { name: "feature", description: "Feature description", required: true },
      { name: "requirements", description: "Specific requirements", required: false },
    ],
  },
  {
    name: "refactor",
    description: "Suggest refactoring improvements",
    arguments: [
      { name: "target", description: "Code to refactor", required: true },
      { name: "goals", description: "Refactoring goals", required: false },
    ],
  },
];

// Create and start MCP server
const config: MCPConfig = {
  name: "autonomous-orchestration-mcp",
  version: "1.0.0",
  tools,
  resources,
  prompts,
};

const mcpServer = new MCPServer(config);
mcpServer.start().catch(console.error);

export { MCPServer, MCPConfig };
