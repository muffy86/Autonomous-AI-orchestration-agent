import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ZapierClient } from '@/lib/zapier/client';

// Mock environment variables
const mockEnv = {
  ZAPIER_ENABLED: 'true',
  ZAPIER_WEBHOOK_URL: 'https://hooks.zapier.com/hooks/catch/test/webhook',
  ZAPIER_API_KEY: 'test-api-key',
};

describe('ZapierClient', () => {
  let zapierClient: ZapierClient;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original env
    originalEnv = process.env;

    // Set mock env
    process.env = { ...originalEnv, ...mockEnv };

    // Create new client instance
    zapierClient = new ZapierClient();

    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 'test-event-id' }),
      })
    ) as jest.Mock;
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('isEnabled', () => {
    it('should return true when enabled and webhook URL is set', () => {
      expect(zapierClient.isEnabled()).toBe(true);
    });

    it('should return false when disabled', () => {
      process.env.ZAPIER_ENABLED = 'false';
      const client = new ZapierClient();
      expect(client.isEnabled()).toBe(false);
    });

    it('should return false when webhook URL is not set', () => {
      delete process.env.ZAPIER_WEBHOOK_URL;
      const client = new ZapierClient();
      expect(client.isEnabled()).toBe(false);
    });
  });

  describe('triggerWebhook', () => {
    it('should send webhook with correct payload', async () => {
      const result = await zapierClient.triggerWebhook(
        'chat.created',
        'user-123',
        { chatId: 'chat-123', title: 'Test Chat' },
        { source: 'test' }
      );

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        mockEnv.ZAPIER_WEBHOOK_URL,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Zapier-API-Key': mockEnv.ZAPIER_API_KEY,
          }),
          body: expect.stringContaining('chat.created'),
        })
      );
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await zapierClient.triggerWebhook(
        'chat.created',
        'user-123',
        { chatId: 'chat-123' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should not send webhook when disabled', async () => {
      process.env.ZAPIER_ENABLED = 'false';
      const client = new ZapierClient();

      const result = await client.triggerWebhook(
        'chat.created',
        'user-123',
        { chatId: 'chat-123' }
      );

      expect(result.success).toBe(false);
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('notifyChatCreated', () => {
    it('should trigger chat.created event', async () => {
      const result = await zapierClient.notifyChatCreated(
        'user-123',
        'chat-123',
        'Test Chat',
        { visibility: 'public' }
      );

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        mockEnv.ZAPIER_WEBHOOK_URL,
        expect.objectContaining({
          body: expect.stringContaining('chat.created'),
        })
      );
    });
  });

  describe('notifyMessageCreated', () => {
    it('should trigger message.created event', async () => {
      const result = await zapierClient.notifyMessageCreated(
        'user-123',
        'chat-123',
        'message-123',
        'Test message',
        'user',
        { hasAttachments: false }
      );

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        mockEnv.ZAPIER_WEBHOOK_URL,
        expect.objectContaining({
          body: expect.stringContaining('message.created'),
        })
      );
    });
  });

  describe('notifyDocumentCreated', () => {
    it('should trigger document.created event', async () => {
      const result = await zapierClient.notifyDocumentCreated(
        'user-123',
        'doc-123',
        'Test Document',
        { type: 'code' }
      );

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        mockEnv.ZAPIER_WEBHOOK_URL,
        expect.objectContaining({
          body: expect.stringContaining('document.created'),
        })
      );
    });
  });

  describe('notifyUserAction', () => {
    it('should trigger user.action event with custom data', async () => {
      const result = await zapierClient.notifyUserAction(
        'user-123',
        'custom-action',
        { customField: 'value' },
        { source: 'test' }
      );

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        mockEnv.ZAPIER_WEBHOOK_URL,
        expect.objectContaining({
          body: expect.stringContaining('user.action'),
        })
      );
    });
  });
});
