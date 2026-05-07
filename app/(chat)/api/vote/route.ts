import { auth } from '@/app/(auth)/auth';
import { getChatById, getVotesByChatId, voteMessage } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { securitySchemas, validateAndSanitize } from '@/lib/security';
import { applyRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await applyRateLimit(request, 'read');
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return new ChatSDKError(
      'bad_request:api',
      'Parameter chatId is required.',
    ).toResponse();
  }

  // Validate the chatId parameter
  const validationResult = validateAndSanitize(chatId, securitySchemas.uuid, false);
  if (!validationResult.success) {
    return new ChatSDKError(
      'bad_request:api',
      `Invalid chatId format: ${validationResult.error}`,
    ).toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:vote').toResponse();
  }

  const chat = await getChatById({ id: chatId });

  if (!chat) {
    return new ChatSDKError('not_found:chat').toResponse();
  }

  if (chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:vote').toResponse();
  }

  const votes = await getVotesByChatId({ id: chatId });

  return Response.json(votes, { status: 200 });
}

const voteSchema = z.object({
  chatId: securitySchemas.uuid,
  messageId: securitySchemas.uuid,
  type: z.enum(['up', 'down']),
});

export async function PATCH(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await applyRateLimit(request, 'write');
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  let chatId: string;
  let messageId: string;
  let type: 'up' | 'down';
  
  try {
    const body = await request.json();
    
    // Validate the request body
    const validationResult = validateAndSanitize(body, voteSchema, false);
    if (!validationResult.success) {
      return new ChatSDKError(
        'bad_request:api',
        `Invalid request data: ${validationResult.error}`,
      ).toResponse();
    }

    ({ chatId, messageId, type } = validationResult.data);
  } catch (error) {
    return new ChatSDKError(
      'bad_request:api',
      'Invalid JSON in request body',
    ).toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:vote').toResponse();
  }

  const chat = await getChatById({ id: chatId });

  if (!chat) {
    return new ChatSDKError('not_found:vote').toResponse();
  }

  if (chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:vote').toResponse();
  }

  await voteMessage({
    chatId,
    messageId,
    type: type,
  });

  return new Response('Message voted', { status: 200 });
}
