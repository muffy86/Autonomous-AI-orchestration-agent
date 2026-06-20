/**
 * Settings & Configuration Manager
 * User-configurable system preferences
 */

export class SettingsManager {
  private dataLayer: any;
  private settings: any = {};
  private listeners: Map<string, Function[]> = new Map();

  constructor(dataLayer: any) {
    this.dataLayer = dataLayer;
  }

  async init() {
    // Load saved settings
    this.settings = await this.dataLayer.load('system-settings') || this.getDefaults();
    console.log('✅ Settings loaded');
  }

  getDefaults() {
    return {
      // LLM Settings
      llm: {
        defaultProvider: 'ollama',
        defaultModel: 'llama3.1:8b',
        temperature: 0.7,
        maxTokens: 4096,
        streaming: true,
        fallbackEnabled: true,
        fallbackOrder: ['ollama', 'groq', 'together', 'openrouter']
      },

      // Agent Settings
      agents: {
        maxConcurrent: 3,
        autoRetry: true,
        maxRetries: 3,
        timeout: 300000, // 5 minutes
        defaultMaxIterations: 10,
        logging: true
      },

      // Search Settings
      search: {
        defaultEngines: ['brave', 'duckduckgo'],
        cacheEnabled: true,
        cacheTTL: 3600000, // 1 hour
        maxResults: 10,
        usePerplexity: false
      },

      // Browser Automation
      automation: {
        headless: false,
        blockImages: false,
        blockCSS: false,
        blockFonts: false,
        timeout: 30000,
        userAgent: 'default'
      },

      // Knowledge Graph
      knowledge: {
        autoLearn: true,
        semanticSearch: true,
        autoOptimize: true,
        optimizeInterval: 86400000, // 24 hours
        exportFormat: 'json'
      },

      // Data & Privacy
      privacy: {
        encryption: true,
        autoBackup: true,
        backupInterval: 86400000, // 24 hours
        p2pSync: false,
        telemetry: false,
        crashReports: false
      },

      // UI Settings
      ui: {
        theme: 'dark',
        accentColor: 'sovereign',
        commandPaletteKey: 'k',
        commandPaletteModifier: 'meta', // 'meta' or 'ctrl'
        showHints: true,
        animations: true,
        compactMode: false
      },

      // Notifications
      notifications: {
        enabled: true,
        taskComplete: true,
        taskFailed: true,
        agentStatus: false,
        sound: false
      },

      // Advanced
      advanced: {
        developerMode: false,
        debugLogging: false,
        experimentalFeatures: false,
        maxMemoryMB: 2048,
        workerThreads: 4
      }
    };
  }

  // ===== Get/Set =====

  get(path: string, defaultValue?: any) {
    const keys = path.split('.');
    let value = this.settings;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }

    return value;
  }

  async set(path: string, value: any) {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    let obj = this.settings;

    // Navigate to the parent object
    for (const key of keys) {
      if (!(key in obj)) {
        obj[key] = {};
      }
      obj = obj[key];
    }

    // Set value
    const oldValue = obj[lastKey];
    obj[lastKey] = value;

    // Save
    await this.save();

    // Notify listeners
    this.notifyListeners(path, value, oldValue);

    return true;
  }

  async update(updates: any) {
    for (const [path, value] of Object.entries(updates)) {
      await this.set(path, value);
    }
  }

  async reset(path?: string) {
    if (path) {
      const defaultValue = this.get(path, this.getDefaults());
      await this.set(path, defaultValue);
    } else {
      this.settings = this.getDefaults();
      await this.save();
    }
  }

  // ===== Persistence =====

  async save() {
    await this.dataLayer.save('system-settings', this.settings);
  }

  async export() {
    return JSON.stringify(this.settings, null, 2);
  }

  async import(json: string) {
    try {
      const imported = JSON.parse(json);
      this.settings = { ...this.getDefaults(), ...imported };
      await this.save();
      return true;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  }

  // ===== Listeners =====

  onChange(path: string, callback: Function) {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, []);
    }
    this.listeners.get(path)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(path);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  private notifyListeners(path: string, newValue: any, oldValue: any) {
    // Notify exact path listeners
    const callbacks = this.listeners.get(path);
    if (callbacks) {
      for (const callback of callbacks) {
        callback(newValue, oldValue, path);
      }
    }

    // Notify wildcard listeners (e.g., "llm.*")
    const pathParts = path.split('.');
    for (let i = 0; i < pathParts.length; i++) {
      const wildcardPath = pathParts.slice(0, i).join('.') + '.*';
      const wildcardCallbacks = this.listeners.get(wildcardPath);
      if (wildcardCallbacks) {
        for (const callback of wildcardCallbacks) {
          callback(newValue, oldValue, path);
        }
      }
    }
  }

  // ===== Validation =====

  validate(path: string, value: any): { valid: boolean; error?: string } {
    // Add validation rules
    const rules: any = {
      'llm.temperature': (v: number) => v >= 0 && v <= 2,
      'llm.maxTokens': (v: number) => v > 0 && v <= 128000,
      'agents.maxConcurrent': (v: number) => v > 0 && v <= 10,
      'agents.timeout': (v: number) => v > 0,
      'ui.theme': (v: string) => ['dark', 'light'].includes(v)
    };

    const rule = rules[path];
    if (rule && !rule(value)) {
      return { valid: false, error: `Invalid value for ${path}` };
    }

    return { valid: true };
  }

  // ===== Presets =====

  async applyPreset(preset: string) {
    const presets: any = {
      'privacy-focused': {
        'llm.defaultProvider': 'ollama',
        'privacy.encryption': true,
        'privacy.p2pSync': false,
        'privacy.telemetry': false,
        'search.defaultEngines': ['duckduckgo'],
        'automation.headless': true
      },

      'performance': {
        'llm.defaultProvider': 'groq',
        'llm.streaming': true,
        'automation.blockImages': true,
        'automation.blockCSS': true,
        'search.cacheEnabled': true,
        'ui.animations': false
      },

      'research': {
        'search.defaultEngines': ['brave', 'duckduckgo', 'searxng'],
        'search.usePerplexity': true,
        'search.maxResults': 20,
        'agents.defaultMaxIterations': 20,
        'knowledge.autoLearn': true
      },

      'development': {
        'advanced.developerMode': true,
        'advanced.debugLogging': true,
        'agents.logging': true,
        'ui.compactMode': false
      }
    };

    const presetSettings = presets[preset];
    if (presetSettings) {
      await this.update(presetSettings);
      return true;
    }

    return false;
  }

  listPresets() {
    return ['privacy-focused', 'performance', 'research', 'development'];
  }

  // ===== UI Helpers =====

  getUIConfig() {
    return {
      theme: this.get('ui.theme'),
      accentColor: this.get('ui.accentColor'),
      animations: this.get('ui.animations'),
      compactMode: this.get('ui.compactMode'),
      showHints: this.get('ui.showHints')
    };
  }

  getLLMConfig() {
    return {
      provider: this.get('llm.defaultProvider'),
      model: this.get('llm.defaultModel'),
      temperature: this.get('llm.temperature'),
      maxTokens: this.get('llm.maxTokens'),
      streaming: this.get('llm.streaming')
    };
  }

  // ===== Statistics =====

  getStats() {
    return {
      totalSettings: this.countSettings(this.settings),
      customized: this.countCustomized(),
      lastModified: this.settings._lastModified || null
    };
  }

  private countSettings(obj: any, count = 0): number {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        count = this.countSettings(obj[key], count);
      } else {
        count++;
      }
    }
    return count;
  }

  private countCustomized(): number {
    const defaults = this.getDefaults();
    let count = 0;

    const compare = (current: any, def: any, path = '') => {
      for (const key in current) {
        const currentValue = current[key];
        const defaultValue = def[key];
        const fullPath = path ? `${path}.${key}` : key;

        if (typeof currentValue === 'object' && !Array.isArray(currentValue)) {
          compare(currentValue, defaultValue || {}, fullPath);
        } else if (currentValue !== defaultValue) {
          count++;
        }
      }
    };

    compare(this.settings, defaults);
    return count;
  }
}

export default SettingsManager;
