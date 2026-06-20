/**
 * Sovereign OS Client SDK
 * JavaScript/TypeScript library for interacting with Sovereign Browser OS
 */

export class SovereignClient {
  private baseURL: string;
  private wsURL: string;
  private ws: WebSocket | null = null;
  private eventHandlers: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(config: { baseURL?: string; wsURL?: string } = {}) {
    this.baseURL = config.baseURL || 'http://localhost:8000';
    this.wsURL = config.wsURL || 'ws://localhost:8000/ws';
  }

  // ===== Connection Management =====

  async connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsURL);

        this.ws.onopen = () => {
          console.log('✅ Connected to Sovereign OS');
          this.reconnectAttempts = 0;
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('🔌 Disconnected from Sovereign OS');
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('error', new Error('Failed to reconnect'));
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  private handleMessage(data: any) {
    const { type, ...payload } = data;
    this.emit(type, payload);
    this.emit('message', data);
  }

  // ===== Event System =====

  on(event: string, handler: Function) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);

    return () => this.off(event, handler);
  }

  off(event: string, handler: Function) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  emit(event: string, data: any) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in ${event} handler:`, error);
        }
      }
    }
  }

  // ===== Chat API =====

  async chat(message: string, options: any = {}) {
    const response = await this.request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        provider: options.provider || 'ollama',
        model: options.model || 'llama3.1:8b',
        ...options
      })
    });

    return response;
  }

  async chatStream(message: string, onChunk: Function, options: any = {}) {
    // Streaming chat via WebSocket or SSE
    return new Promise((resolve, reject) => {
      const requestId = this.generateId();

      this.on(`chat:chunk:${requestId}`, (data: any) => {
        onChunk(data.chunk);
      });

      this.on(`chat:complete:${requestId}`, (data: any) => {
        resolve(data);
      });

      this.send({
        type: 'chat:stream',
        requestId,
        message,
        ...options
      });
    });
  }

  // ===== Command API =====

  async executeCommand(command: string, options: any = {}) {
    const response = await this.request('/api/command', {
      method: 'POST',
      body: JSON.stringify({ command, options })
    });

    return response;
  }

  async getCommandStatus(commandId: string) {
    return await this.request(`/api/command/${commandId}`);
  }

  // ===== Agent API =====

  async listAgents() {
    return await this.request('/api/agents');
  }

  async getAgent(agentId: string) {
    return await this.request(`/api/agents/${agentId}`);
  }

  async executeAgent(agentId: string, task: any) {
    return await this.request(`/api/agents/${agentId}/execute`, {
      method: 'POST',
      body: JSON.stringify({ task })
    });
  }

  // ===== Search API =====

  async search(query: string, options: any = {}) {
    return await this.request('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query, ...options })
    });
  }

  async smartSearch(query: string, options: any = {}) {
    return await this.request('/api/search/smart', {
      method: 'POST',
      body: JSON.stringify({ query, ...options })
    });
  }

  async searchCode(query: string) {
    return await this.search(query, { type: 'code' });
  }

  async searchAcademic(query: string) {
    return await this.search(query, { type: 'academic' });
  }

  // ===== Knowledge Graph API =====

  async addNode(node: any) {
    return await this.request('/api/knowledge', {
      method: 'POST',
      body: JSON.stringify({ action: 'addNode', node })
    });
  }

  async queryKnowledge(query: string, options: any = {}) {
    return await this.request('/api/knowledge/query', {
      method: 'POST',
      body: JSON.stringify({ query, ...options })
    });
  }

  async exportKnowledge(format = 'json') {
    return await this.request(`/api/knowledge/export?format=${format}`);
  }

  async getKnowledgeStats() {
    return await this.request('/api/knowledge/stats');
  }

  // ===== Workflow API =====

  async listWorkflows() {
    return await this.request('/api/workflows');
  }

  async createWorkflow(workflow: any) {
    return await this.request('/api/workflows', {
      method: 'POST',
      body: JSON.stringify({ workflow })
    });
  }

  async executeWorkflow(workflowId: string, context: any = {}) {
    return await this.request(`/api/workflows/${workflowId}/execute`, {
      method: 'POST',
      body: JSON.stringify({ context })
    });
  }

  async startWorkflow(workflowId: string) {
    return await this.request(`/api/workflows/${workflowId}/start`, {
      method: 'POST'
    });
  }

  async stopWorkflow(workflowId: string) {
    return await this.request(`/api/workflows/${workflowId}/stop`, {
      method: 'POST'
    });
  }

  // ===== Settings API =====

  async getSettings(path?: string) {
    const url = path ? `/api/settings?path=${path}` : '/api/settings';
    return await this.request(url);
  }

  async setSetting(path: string, value: any) {
    return await this.request('/api/settings', {
      method: 'POST',
      body: JSON.stringify({ path, value })
    });
  }

  async applyPreset(preset: string) {
    return await this.request('/api/settings/preset', {
      method: 'POST',
      body: JSON.stringify({ preset })
    });
  }

  // ===== Plugin API =====

  async listPlugins() {
    return await this.request('/api/plugins');
  }

  async installPlugin(code: string, metadata: any = {}) {
    return await this.request('/api/plugins', {
      method: 'POST',
      body: JSON.stringify({ code, metadata })
    });
  }

  async enablePlugin(pluginId: string) {
    return await this.request(`/api/plugins/${pluginId}/enable`, {
      method: 'POST'
    });
  }

  async disablePlugin(pluginId: string) {
    return await this.request(`/api/plugins/${pluginId}/disable`, {
      method: 'POST'
    });
  }

  // ===== Browser Automation API =====

  async browse(url: string, actions: any[] = []) {
    return await this.request('/api/browser/automate', {
      method: 'POST',
      body: JSON.stringify({ url, actions })
    });
  }

  async scrape(url: string, selector: string) {
    return await this.request('/api/browser/scrape', {
      method: 'POST',
      body: JSON.stringify({ url, selector })
    });
  }

  async screenshot(url: string, options: any = {}) {
    return await this.request('/api/browser/screenshot', {
      method: 'POST',
      body: JSON.stringify({ url, ...options })
    });
  }

  // ===== System API =====

  async getHealth() {
    return await this.request('/api/health');
  }

  async getStats() {
    return await this.request('/api/stats');
  }

  // ===== Utilities =====

  private async request(path: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${path}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `Request failed: ${response.status}`);
    }

    return await response.json();
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected');
    }
  }

  private generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ===== Browser-friendly export =====

if (typeof window !== 'undefined') {
  (window as any).SovereignClient = SovereignClient;
}

export default SovereignClient;

// ===== Usage Examples =====

/*

// Initialize client
const client = new SovereignClient();
await client.connect();

// Chat
const response = await client.chat('Hello, how are you?');
console.log(response.response);

// Streaming chat
await client.chatStream('Write a poem', (chunk) => {
  console.log(chunk);
});

// Execute command
const result = await client.executeCommand('Research quantum computing');

// Search
const searchResults = await client.smartSearch('AI safety');

// Knowledge graph
await client.addNode({
  type: 'concept',
  content: { name: 'AI Safety', importance: 'high' }
});

const knowledge = await client.queryKnowledge('AI Safety');

// Workflows
const workflows = await client.listWorkflows();
await client.executeWorkflow('daily-summary');

// Settings
await client.applyPreset('privacy-focused');
await client.setSetting('llm.temperature', 0.8);

// Plugins
await client.installPlugin(pluginCode);

// Browser automation
await client.scrape('https://example.com', 'table');

// Real-time events
client.on('agent:started', (data) => {
  console.log('Agent started:', data.agent);
});

client.on('search:completed', (data) => {
  console.log('Search done:', data.results);
});

*/
