/**
 * Plugin System - Extensible Agent Framework
 * Allow users to create and install custom agents and tools
 */

export class PluginManager {
  private plugins: Map<string, any> = new Map();
  private hooks: Map<string, Function[]> = new Map();
  private dataLayer: any;

  constructor(dataLayer: any) {
    this.dataLayer = dataLayer;
  }

  async init() {
    // Load installed plugins
    const installed = await this.dataLayer.load('installed-plugins') || [];
    
    for (const pluginData of installed) {
      try {
        await this.loadPlugin(pluginData);
      } catch (error: any) {
        console.error(`Failed to load plugin ${pluginData.id}:`, error.message);
      }
    }

    console.log(`✅ Plugin system ready (${this.plugins.size} plugins)`);
  }

  // ===== Plugin Management =====

  async installPlugin(pluginCode: string, metadata: any = {}) {
    try {
      // Create plugin sandbox
      const plugin = await this.createPlugin(pluginCode, metadata);

      // Validate plugin
      if (!plugin.id || !plugin.name) {
        throw new Error('Plugin must have id and name');
      }

      // Check for conflicts
      if (this.plugins.has(plugin.id)) {
        throw new Error(`Plugin ${plugin.id} already installed`);
      }

      // Register plugin
      this.plugins.set(plugin.id, plugin);

      // Save to storage
      await this.saveInstalledPlugins();

      // Trigger hooks
      await this.triggerHook('plugin:installed', plugin);

      console.log(`✅ Plugin installed: ${plugin.name} (${plugin.id})`);

      return { success: true, plugin };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async uninstallPlugin(pluginId: string) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return { success: false, error: 'Plugin not found' };
    }

    // Call cleanup if available
    if (plugin.cleanup) {
      try {
        await plugin.cleanup();
      } catch (error: any) {
        console.error('Plugin cleanup failed:', error.message);
      }
    }

    // Remove plugin
    this.plugins.delete(pluginId);

    // Save
    await this.saveInstalledPlugins();

    // Trigger hooks
    await this.triggerHook('plugin:uninstalled', plugin);

    return { success: true };
  }

  async enablePlugin(pluginId: string) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return { success: false, error: 'Plugin not found' };

    plugin.enabled = true;
    await this.saveInstalledPlugins();

    if (plugin.onEnable) {
      await plugin.onEnable();
    }

    return { success: true };
  }

  async disablePlugin(pluginId: string) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return { success: false, error: 'Plugin not found' };

    plugin.enabled = false;
    await this.saveInstalledPlugins();

    if (plugin.onDisable) {
      await plugin.onDisable();
    }

    return { success: true };
  }

  // ===== Plugin Creation =====

  private async createPlugin(code: string, metadata: any) {
    // Create sandboxed environment
    const sandbox = this.createSandbox();

    // Evaluate plugin code
    const pluginFactory = new Function('sandbox', `
      'use strict';
      ${code}
      return createPlugin(sandbox);
    `);

    const plugin = pluginFactory(sandbox);

    // Merge metadata
    return {
      ...metadata,
      ...plugin,
      enabled: true,
      installedAt: Date.now()
    };
  }

  private createSandbox() {
    return {
      // Safe APIs
      console: {
        log: (...args: any[]) => console.log('[Plugin]', ...args),
        error: (...args: any[]) => console.error('[Plugin]', ...args),
        warn: (...args: any[]) => console.warn('[Plugin]', ...args)
      },

      // Plugin utilities
      registerCommand: this.registerCommand.bind(this),
      registerHook: this.registerHook.bind(this),
      fetch: fetch.bind(globalThis),
      
      // Limited storage access
      storage: {
        get: async (key: string) => {
          return await this.dataLayer.load(`plugin:${key}`);
        },
        set: async (key: string, value: any) => {
          return await this.dataLayer.save(`plugin:${key}`, value);
        }
      }
    };
  }

  // ===== Plugin API =====

  registerCommand(command: any) {
    // Register a new command that appears in command palette
    console.log('Registered command:', command.name);
    // This would integrate with the UI command system
  }

  registerHook(hookName: string, callback: Function) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }
    this.hooks.get(hookName)!.push(callback);
  }

  async triggerHook(hookName: string, ...args: any[]) {
    const callbacks = this.hooks.get(hookName);
    if (!callbacks) return;

    for (const callback of callbacks) {
      try {
        await callback(...args);
      } catch (error: any) {
        console.error(`Hook ${hookName} failed:`, error.message);
      }
    }
  }

  // ===== Agent Plugins =====

  async registerAgent(agentDefinition: any) {
    // Allow plugins to register new agents
    return {
      id: agentDefinition.id,
      name: agentDefinition.name,
      capabilities: agentDefinition.capabilities || [],
      
      async execute(task: any, context: any) {
        return await agentDefinition.execute(task, context);
      }
    };
  }

  getRegisteredAgents() {
    const agents = [];
    
    for (const plugin of this.plugins.values()) {
      if (plugin.enabled && plugin.agents) {
        agents.push(...plugin.agents);
      }
    }

    return agents;
  }

  // ===== LLM Provider Plugins =====

  async registerLLMProvider(providerDefinition: any) {
    // Allow plugins to add new LLM providers
    return {
      name: providerDefinition.name,
      
      async query(prompt: string, options: any) {
        return await providerDefinition.query(prompt, options);
      },
      
      async stream(prompt: string, options: any) {
        return providerDefinition.stream ? 
          await providerDefinition.stream(prompt, options) : 
          null;
      }
    };
  }

  // ===== Plugin Discovery =====

  listPlugins() {
    return Array.from(this.plugins.values()).map(plugin => ({
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      author: plugin.author,
      description: plugin.description,
      enabled: plugin.enabled,
      installedAt: plugin.installedAt
    }));
  }

  getPlugin(pluginId: string) {
    return this.plugins.get(pluginId);
  }

  searchPlugins(query: string) {
    const results = [];
    
    for (const plugin of this.plugins.values()) {
      const searchText = `${plugin.name} ${plugin.description}`.toLowerCase();
      if (searchText.includes(query.toLowerCase())) {
        results.push(plugin);
      }
    }

    return results;
  }

  // ===== Marketplace =====

  async fetchMarketplace() {
    // Fetch available plugins from a marketplace
    // This would connect to a plugin registry
    return [
      {
        id: 'example-translator',
        name: 'Translation Agent',
        description: 'Translate text between languages',
        version: '1.0.0',
        author: 'Community',
        downloads: 1234,
        rating: 4.5
      }
    ];
  }

  async installFromMarketplace(pluginId: string) {
    // Download and install plugin from marketplace
    try {
      const response = await fetch(`https://plugins.sovereign-os.dev/${pluginId}`);
      const pluginCode = await response.text();
      
      return await this.installPlugin(pluginCode, { id: pluginId });
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ===== Examples =====

  getExamplePlugin() {
    return `
// Example Plugin: Custom Agent
function createPlugin(sandbox) {
  return {
    id: 'example-plugin',
    name: 'Example Plugin',
    version: '1.0.0',
    author: 'You',
    description: 'An example plugin',
    
    // Plugin lifecycle
    async onEnable() {
      sandbox.console.log('Plugin enabled!');
    },
    
    async onDisable() {
      sandbox.console.log('Plugin disabled!');
    },
    
    async cleanup() {
      // Cleanup resources
    },
    
    // Register custom agents
    agents: [
      {
        id: 'custom-agent',
        name: 'Custom Agent',
        capabilities: ['custom-action'],
        
        async execute(task, context) {
          sandbox.console.log('Executing custom task:', task);
          
          // Your agent logic here
          return {
            success: true,
            result: 'Task completed!'
          };
        }
      }
    ],
    
    // Register commands
    commands: [
      {
        id: 'custom-command',
        name: 'Custom Command',
        description: 'Does something custom',
        icon: '🎨',
        
        async execute() {
          sandbox.console.log('Custom command executed!');
        }
      }
    ]
  };
}
`;
  }

  // ===== Persistence =====

  private async saveInstalledPlugins() {
    const pluginsData = Array.from(this.plugins.values()).map(plugin => ({
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      author: plugin.author,
      description: plugin.description,
      enabled: plugin.enabled,
      installedAt: plugin.installedAt,
      code: plugin._code // Store original code
    }));

    await this.dataLayer.save('installed-plugins', pluginsData);
  }

  private async loadPlugin(pluginData: any) {
    if (pluginData.code) {
      await this.installPlugin(pluginData.code, pluginData);
    }
  }

  // ===== Security =====

  async validatePlugin(code: string) {
    // Basic security checks
    const dangerous = [
      'eval(',
      'Function(',
      'require(',
      'import(',
      'process.exit',
      '__dirname',
      '__filename'
    ];

    for (const pattern of dangerous) {
      if (code.includes(pattern)) {
        return {
          valid: false,
          error: `Plugin contains dangerous code: ${pattern}`
        };
      }
    }

    return { valid: true };
  }
}

export default PluginManager;
