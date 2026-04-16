import type { ZapierEvent, ZapierEventType, ZapierTriggerResponse } from './types';

/**
 * Zapier Client for triggering webhooks and managing integrations
 */
export class ZapierClient {
  private webhookUrl: string | undefined;
  private apiKey: string | undefined;
  private enabled: boolean;

  constructor() {
    this.webhookUrl = process.env.ZAPIER_WEBHOOK_URL;
    this.apiKey = process.env.ZAPIER_API_KEY;
    this.enabled = process.env.ZAPIER_ENABLED === 'true';
  }

  /**
   * Triggers a Zapier webhook with event data
   */
  async triggerWebhook(
    event: ZapierEventType,
    userId: string,
    data: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<ZapierTriggerResponse> {
    if (!this.enabled || !this.webhookUrl) {
      console.log('[Zapier] Webhooks disabled or not configured');
      return {
        success: false,
        eventId: '',
        timestamp: new Date().toISOString(),
        error: 'Zapier integration not enabled',
      };
    }

    const payload: ZapierEvent = {
      event,
      timestamp: new Date().toISOString(),
      userId,
      data,
      metadata,
    };

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'X-Zapier-API-Key': this.apiKey }),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Zapier webhook failed: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        success: true,
        eventId: result.id || payload.timestamp,
        timestamp: payload.timestamp,
      };
    } catch (error) {
      console.error('[Zapier] Webhook trigger failed:', error);
      return {
        success: false,
        eventId: '',
        timestamp: new Date().toISOString(),
        error: String(error),
      };
    }
  }

  /**
   * Triggers a chat created event
   */
  async notifyChatCreated(
    userId: string,
    chatId: string,
    title: string,
    metadata?: Record<string, any>
  ) {
    return this.triggerWebhook(
      'chat.created',
      userId,
      { chatId, title },
      metadata
    );
  }

  /**
   * Triggers a message created event
   */
  async notifyMessageCreated(
    userId: string,
    chatId: string,
    messageId: string,
    content: string,
    role: 'user' | 'assistant',
    metadata?: Record<string, any>
  ) {
    return this.triggerWebhook(
      'message.created',
      userId,
      { chatId, messageId, content, role },
      metadata
    );
  }

  /**
   * Triggers a document created event
   */
  async notifyDocumentCreated(
    userId: string,
    documentId: string,
    title: string,
    metadata?: Record<string, any>
  ) {
    return this.triggerWebhook(
      'document.created',
      userId,
      { documentId, title },
      metadata
    );
  }

  /**
   * Triggers a custom user action event
   */
  async notifyUserAction(
    userId: string,
    action: string,
    data: Record<string, any>,
    metadata?: Record<string, any>
  ) {
    return this.triggerWebhook(
      'user.action',
      userId,
      { action, ...data },
      metadata
    );
  }

  /**
   * Checks if Zapier integration is enabled
   */
  isEnabled(): boolean {
    return this.enabled && !!this.webhookUrl;
  }
}

/**
 * Singleton instance of ZapierClient
 */
export const zapierClient = new ZapierClient();
