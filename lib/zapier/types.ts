import { z } from 'zod';

/**
 * Zapier Webhook Payload Schema
 */
export const zapierWebhookSchema = z.object({
  type: z.enum(['create_message', 'trigger_action', 'custom']),
  data: z.record(z.any()),
  timestamp: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type ZapierWebhookPayload = z.infer<typeof zapierWebhookSchema>;

/**
 * Zapier Event Types for outgoing webhooks
 */
export type ZapierEventType =
  | 'chat.created'
  | 'chat.updated'
  | 'chat.deleted'
  | 'message.created'
  | 'message.updated'
  | 'document.created'
  | 'document.updated'
  | 'user.action';

/**
 * Zapier Event Payload
 */
export interface ZapierEvent {
  event: ZapierEventType;
  timestamp: string;
  userId: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Zapier Configuration
 */
export interface ZapierConfig {
  webhookUrl?: string;
  apiKey?: string;
  secret?: string;
  enabled: boolean;
  events: ZapierEventType[];
}

/**
 * Zapier Trigger Response
 */
export interface ZapierTriggerResponse {
  success: boolean;
  eventId: string;
  timestamp: string;
  error?: string;
}
