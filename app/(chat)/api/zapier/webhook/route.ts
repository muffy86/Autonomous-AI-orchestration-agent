import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { saveMessages, getChatById } from '@/lib/db/queries';
import { generateUUID } from '@/lib/utils';
import { ChatSDKError } from '@/lib/errors';
import { zapierWebhookSchema, type ZapierWebhookPayload } from '@/lib/zapier/types';

export const maxDuration = 60;

/**
 * POST /api/zapier/webhook
 * 
 * Receives webhooks from Zapier and processes them
 * Supports creating messages, triggering actions, or custom workflows
 */
export async function POST(request: Request) {
  try {
    // Verify authentication
    const session = await auth();
    
    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    // Verify Zapier webhook signature if configured
    const zapierSignature = request.headers.get('x-zapier-signature');
    const expectedSignature = process.env.ZAPIER_WEBHOOK_SECRET;
    
    if (expectedSignature && zapierSignature !== expectedSignature) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const json = await request.json();
    const payload = zapierWebhookSchema.parse(json);

    // Handle different webhook types
    switch (payload.type) {
      case 'create_message':
        return await handleCreateMessage(payload, session.user.id);
      
      case 'trigger_action':
        return await handleTriggerAction(payload, session.user.id);
      
      case 'custom':
        return await handleCustomAction(payload, session.user.id);
      
      default:
        return NextResponse.json(
          { error: 'Unknown webhook type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Zapier webhook error:', error);
    
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    
    return NextResponse.json(
      { error: 'Failed to process webhook', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Handles creating a new message in a chat from Zapier
 */
async function handleCreateMessage(
  payload: ZapierWebhookPayload,
  userId: string
) {
  const { chatId, content, metadata } = payload.data;

  if (!chatId || !content) {
    return NextResponse.json(
      { error: 'chatId and content are required' },
      { status: 400 }
    );
  }

  // Verify chat exists and user has access
  const chat = await getChatById({ id: chatId });
  
  if (!chat || chat.userId !== userId) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  // Create message
  const messageId = generateUUID();
  await saveMessages({
    messages: [
      {
        id: messageId,
        chatId,
        role: 'user',
        parts: [{ type: 'text', text: content }],
        attachments: [],
        createdAt: new Date(),
      },
    ],
  });

  return NextResponse.json({
    success: true,
    messageId,
    chatId,
    metadata,
  });
}

/**
 * Handles triggering a custom action from Zapier
 */
async function handleTriggerAction(
  payload: ZapierWebhookPayload,
  userId: string
) {
  const { action, parameters } = payload.data;

  if (!action) {
    return NextResponse.json(
      { error: 'action is required' },
      { status: 400 }
    );
  }

  // Process the action based on type
  // This is extensible for different action types
  return NextResponse.json({
    success: true,
    action,
    parameters,
    userId,
    processedAt: new Date().toISOString(),
  });
}

/**
 * Handles custom webhook payloads from Zapier
 */
async function handleCustomAction(
  payload: ZapierWebhookPayload,
  userId: string
) {
  // Process custom payload
  // This allows for flexible integration with any Zapier workflow
  return NextResponse.json({
    success: true,
    data: payload.data,
    userId,
    processedAt: new Date().toISOString(),
  });
}

/**
 * GET /api/zapier/webhook
 * 
 * Returns webhook configuration and status
 */
export async function GET(request: Request) {
  const session = await auth();
  
  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  return NextResponse.json({
    status: 'active',
    webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/zapier/webhook`,
    supportedTypes: ['create_message', 'trigger_action', 'custom'],
    version: '1.0.0',
  });
}
