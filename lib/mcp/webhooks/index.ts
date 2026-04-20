/**
 * Webhook Management System
 * Enables real-time integrations and event-driven automation
 */

export interface Webhook {
  id: string;
  name: string;
  description: string;
  url?: string;
  events: string[];
  enabled: boolean;
  secret?: string;
  handler: (payload: any) => Promise<any>;
  retry?: {
    maxAttempts: number;
    backoff: number;
  };
}

class WebhookManager {
  private webhooks: Map<string, Webhook> = new Map();
  private eventListeners: Map<string, Set<string>> = new Map();

  constructor() {
    this.initializeWebhooks();
  }

  private initializeWebhooks() {
    // GitHub webhook
    this.register({
      id: 'github',
      name: 'GitHub Webhook',
      description: 'Handle GitHub events (push, PR, issues)',
      events: ['push', 'pull_request', 'issues', 'release'],
      enabled: true,
      handler: async (payload) => {
        console.log('GitHub event received:', payload.event);
        
        // Process different GitHub events
        switch (payload.event) {
          case 'push':
            return await this.handleGitHubPush(payload);
          case 'pull_request':
            return await this.handleGitHubPR(payload);
          case 'issues':
            return await this.handleGitHubIssue(payload);
          default:
            return { success: true, event: payload.event };
        }
      },
      retry: {
        maxAttempts: 3,
        backoff: 1000,
      },
    });

    // Slack webhook
    this.register({
      id: 'slack',
      name: 'Slack Webhook',
      description: 'Handle Slack events and commands',
      events: ['message', 'command', 'interaction'],
      enabled: true,
      handler: async (payload) => {
        console.log('Slack event received:', payload);
        
        if (payload.type === 'command') {
          return await this.handleSlackCommand(payload);
        }
        
        return {
          success: true,
          response: 'Event processed',
        };
      },
    });

    // Discord webhook
    this.register({
      id: 'discord',
      name: 'Discord Webhook',
      description: 'Handle Discord events',
      events: ['message', 'command'],
      enabled: true,
      handler: async (payload) => {
        console.log('Discord event received:', payload);
        return {
          success: true,
          response: 'Event processed',
        };
      },
    });

    // Custom API webhook
    this.register({
      id: 'api',
      name: 'Custom API Webhook',
      description: 'Generic webhook for custom integrations',
      events: ['custom'],
      enabled: true,
      handler: async (payload) => {
        console.log('Custom API event received:', payload);
        return {
          success: true,
          data: payload,
        };
      },
    });

    // Task completion webhook
    this.register({
      id: 'task_complete',
      name: 'Task Completion Webhook',
      description: 'Triggered when autonomous tasks complete',
      events: ['task.complete', 'task.error'],
      enabled: true,
      handler: async (payload) => {
        console.log('Task completed:', payload.taskId);
        
        // Could send notifications, update databases, etc.
        return {
          success: true,
          taskId: payload.taskId,
          status: payload.status,
        };
      },
    });

    // AI model response webhook
    this.register({
      id: 'ai_response',
      name: 'AI Response Webhook',
      description: 'Triggered for AI model responses',
      events: ['ai.response', 'ai.error'],
      enabled: true,
      handler: async (payload) => {
        console.log('AI response:', payload.model);
        
        // Log, analyze, or forward AI responses
        return {
          success: true,
          model: payload.model,
          tokens: payload.tokens,
        };
      },
    });
  }

  register(webhook: Webhook) {
    this.webhooks.set(webhook.id, webhook);
    
    // Register event listeners
    for (const event of webhook.events) {
      if (!this.eventListeners.has(event)) {
        this.eventListeners.set(event, new Set());
      }
      this.eventListeners.get(event)!.add(webhook.id);
    }
  }

  async trigger(hookId: string, payload: any): Promise<any> {
    const webhook = this.webhooks.get(hookId);
    if (!webhook) {
      throw new Error(`Webhook not found: ${hookId}`);
    }

    if (!webhook.enabled) {
      throw new Error(`Webhook disabled: ${hookId}`);
    }

    try {
      const result = await webhook.handler(payload);
      return result;
    } catch (error) {
      if (webhook.retry) {
        return await this.retryWebhook(webhook, payload, 0);
      }
      throw error;
    }
  }

  private async retryWebhook(webhook: Webhook, payload: any, attempt: number): Promise<any> {
    if (!webhook.retry || attempt >= webhook.retry.maxAttempts) {
      throw new Error(`Webhook failed after ${attempt} attempts`);
    }

    await new Promise(resolve => setTimeout(resolve, webhook.retry!.backoff * Math.pow(2, attempt)));

    try {
      return await webhook.handler(payload);
    } catch (error) {
      return await this.retryWebhook(webhook, payload, attempt + 1);
    }
  }

  async emitEvent(event: string, payload: any) {
    const listeners = this.eventListeners.get(event);
    if (!listeners) return;

    const results = [];
    for (const hookId of listeners) {
      try {
        const result = await this.trigger(hookId, { event, ...payload });
        results.push({ hookId, success: true, result });
      } catch (error) {
        results.push({
          hookId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  listWebhooks() {
    return Array.from(this.webhooks.values()).map(w => ({
      id: w.id,
      name: w.name,
      description: w.description,
      events: w.events,
      enabled: w.enabled,
    }));
  }

  getWebhook(id: string) {
    return this.webhooks.get(id);
  }

  enableWebhook(id: string) {
    const webhook = this.webhooks.get(id);
    if (webhook) {
      webhook.enabled = true;
    }
  }

  disableWebhook(id: string) {
    const webhook = this.webhooks.get(id);
    if (webhook) {
      webhook.enabled = false;
    }
  }

  // Handler implementations
  private async handleGitHubPush(payload: any) {
    const { repository, commits, ref } = payload;
    
    return {
      success: true,
      action: 'github_push_processed',
      repository: repository?.name,
      branch: ref,
      commits: commits?.length || 0,
      message: 'GitHub push event processed',
    };
  }

  private async handleGitHubPR(payload: any) {
    const { action, pull_request } = payload;
    
    return {
      success: true,
      action: 'github_pr_processed',
      pr_action: action,
      pr_number: pull_request?.number,
      message: 'GitHub PR event processed',
    };
  }

  private async handleGitHubIssue(payload: any) {
    const { action, issue } = payload;
    
    return {
      success: true,
      action: 'github_issue_processed',
      issue_action: action,
      issue_number: issue?.number,
      message: 'GitHub issue event processed',
    };
  }

  private async handleSlackCommand(payload: any) {
    const { command, text } = payload;
    
    // Process Slack commands
    const commands: Record<string, () => any> = {
      '/ai': () => ({
        text: 'AI assistant ready! How can I help?',
      }),
      '/models': () => ({
        text: 'Available models: GPT-4, Claude, Gemini, Grok',
      }),
      '/status': () => ({
        text: 'All systems operational',
      }),
    };

    const handler = commands[command];
    if (handler) {
      return {
        success: true,
        ...handler(),
      };
    }

    return {
      success: true,
      text: `Command ${command} received: ${text}`,
    };
  }
}

export const webhookManager = new WebhookManager();

// Webhook utilities
export function createWebhookSignature(payload: any, secret: string): string {
  const crypto = require('crypto');
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
}

export function verifyWebhookSignature(
  payload: any,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = createWebhookSignature(payload, secret);
  return signature === expectedSignature;
}
