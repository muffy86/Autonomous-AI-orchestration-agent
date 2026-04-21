/**
 * MCP Configuration and Resource Packs
 */

export interface MCPConfig {
  server: {
    name: string;
    version: string;
    port: number;
  };
  providers: {
    enabled: string[];
    default: string;
    fallback: string[];
  };
  features: {
    tools: boolean;
    resources: boolean;
    prompts: boolean;
    webhooks: boolean;
    skills: boolean;
  };
  security: {
    apiKeys: {
      required: boolean;
      validation: boolean;
    };
    rateLimit: {
      enabled: boolean;
      requests: number;
      window: number;
    };
  };
  logging: {
    level: string;
    format: string;
  };
}

export const defaultConfig: MCPConfig = {
  server: {
    name: 'ai-chatbot-mcp-server',
    version: '1.0.0',
    port: 3001,
  },
  providers: {
    enabled: ['openai', 'anthropic', 'google', 'xai', 'groq', 'openrouter', 'together'],
    default: 'google',
    fallback: ['groq', 'google', 'openrouter'],
  },
  features: {
    tools: true,
    resources: true,
    prompts: true,
    webhooks: true,
    skills: true,
  },
  security: {
    apiKeys: {
      required: false,
      validation: true,
    },
    rateLimit: {
      enabled: true,
      requests: 100,
      window: 60000,
    },
  },
  logging: {
    level: 'info',
    format: 'json',
  },
};

// Resource Pack Definitions
export interface ResourcePack {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  dependencies: string[];
  config: any;
  install: () => Promise<void>;
  uninstall: () => Promise<void>;
}

export const resourcePacks: ResourcePack[] = [
  {
    id: 'development-pack',
    name: 'Development Resource Pack',
    description: 'Complete development tools and AI models',
    version: '1.0.0',
    author: 'AI Chatbot Team',
    dependencies: [],
    config: {
      tools: ['code_analysis', 'testing', 'documentation', 'git_operations'],
      skills: ['code_analysis', 'testing', 'documentation'],
      models: {
        primary: 'claude-3-5-sonnet-20241022',
        fallback: 'gpt-4o',
      },
    },
    install: async () => {
      console.log('Installing Development Pack...');
    },
    uninstall: async () => {
      console.log('Uninstalling Development Pack...');
    },
  },
  {
    id: 'research-pack',
    name: 'Research Resource Pack',
    description: 'Research and analysis tools',
    version: '1.0.0',
    author: 'AI Chatbot Team',
    dependencies: [],
    config: {
      tools: ['web_search', 'fetch_url', 'data_analysis'],
      skills: ['research', 'data_processing'],
      models: {
        primary: 'gemini-2.0-flash-exp',
        fallback: 'gpt-4o-mini',
      },
    },
    install: async () => {
      console.log('Installing Research Pack...');
    },
    uninstall: async () => {
      console.log('Uninstalling Research Pack...');
    },
  },
  {
    id: 'automation-pack',
    name: 'Automation Resource Pack',
    description: 'Task automation and scheduling',
    version: '1.0.0',
    author: 'AI Chatbot Team',
    dependencies: [],
    config: {
      tools: ['schedule_task', 'send_notification', 'database_query'],
      skills: ['automation', 'monitoring'],
      webhooks: ['task_complete', 'api'],
    },
    install: async () => {
      console.log('Installing Automation Pack...');
    },
    uninstall: async () => {
      console.log('Uninstalling Automation Pack...');
    },
  },
  {
    id: 'content-pack',
    name: 'Content Creation Resource Pack',
    description: 'Content generation and image tools',
    version: '1.0.0',
    author: 'AI Chatbot Team',
    dependencies: [],
    config: {
      tools: ['image_generation'],
      skills: ['content_generation', 'documentation'],
      models: {
        text: 'gpt-4o',
        image: 'grok-2-image',
      },
    },
    install: async () => {
      console.log('Installing Content Pack...');
    },
    uninstall: async () => {
      console.log('Uninstalling Content Pack...');
    },
  },
  {
    id: 'free-tier-pack',
    name: 'Free Tier Resource Pack',
    description: 'All free-tier AI models and tools',
    version: '1.0.0',
    author: 'AI Chatbot Team',
    dependencies: [],
    config: {
      providers: ['google', 'groq', 'openrouter'],
      models: [
        'gemini-2.0-flash-exp',
        'gemini-1.5-flash',
        'llama-3.3-70b-versatile',
        'mixtral-8x7b-32768',
        'google/gemini-flash-1.5',
        'meta-llama/llama-3.2-3b-instruct:free',
        'mistralai/mistral-7b-instruct:free',
      ],
      note: 'All models in this pack are completely free to use',
    },
    install: async () => {
      console.log('Installing Free Tier Pack...');
    },
    uninstall: async () => {
      console.log('Uninstalling Free Tier Pack...');
    },
  },
];

export function getConfig(): MCPConfig {
  // Load from environment or file
  return defaultConfig;
}

export function updateConfig(updates: Partial<MCPConfig>): void {
  Object.assign(defaultConfig, updates);
}

export function getResourcePack(id: string): ResourcePack | undefined {
  return resourcePacks.find(pack => pack.id === id);
}

export function listResourcePacks() {
  return resourcePacks.map(pack => ({
    id: pack.id,
    name: pack.name,
    description: pack.description,
    version: pack.version,
  }));
}
