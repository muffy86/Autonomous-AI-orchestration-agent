import type { Context } from 'telegraf';
import { streamText } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { systemPrompt } from '@/lib/ai/prompts';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { generateUUID } from '@/lib/utils';
import {
  saveChat,
  saveMessages,
  getChatByTelegramId,
  getMessagesByChatId,
} from '@/lib/db/queries';
import type { Message as UIMessage } from 'ai';

// Map to track user sessions
const userSessions = new Map<
  string,
  {
    chatId: string;
    userId: string;
    messages: UIMessage[];
  }
>();

/**
 * Get or create a chat session for a Telegram user
 */
async function getOrCreateSession(telegramUserId: string, botToken: string) {
  const sessionKey = `${botToken}:${telegramUserId}`;
  
  if (userSessions.has(sessionKey)) {
    return userSessions.get(sessionKey)!;
  }

  // Try to get existing chat from database
  let chat = await getChatByTelegramId({ telegramUserId, botToken });

  if (!chat) {
    // Create new chat
    const chatId = generateUUID();
    await saveChat({
      id: chatId,
      userId: `telegram_${telegramUserId}`,
      title: 'Telegram Chat',
      visibility: 'private',
      telegramUserId,
      botToken,
    });

    const session = {
      chatId,
      userId: `telegram_${telegramUserId}`,
      messages: [] as UIMessage[],
    };

    userSessions.set(sessionKey, session);
    return session;
  }

  // Load existing messages
  const previousMessages = await getMessagesByChatId({ id: chat.id });

  const session = {
    chatId: chat.id,
    userId: `telegram_${telegramUserId}`,
    messages: previousMessages.map((msg) => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: Array.isArray(msg.parts) 
        ? msg.parts.map((part: any) => part.text || '').join('')
        : '',
      createdAt: msg.createdAt,
    })) as UIMessage[],
  };

  userSessions.set(sessionKey, session);
  return session;
}

/**
 * Handle incoming Telegram messages
 */
export async function handleTelegramMessage(ctx: Context, botToken: string) {
  if (!ctx.message || !('text' in ctx.message)) {
    return;
  }

  const telegramUserId = ctx.from?.id.toString();
  if (!telegramUserId) {
    await ctx.reply('Unable to identify user.');
    return;
  }

  const userMessage = ctx.message.text;

  // Get or create session
  const session = await getOrCreateSession(telegramUserId, botToken);

  // Create user message
  const userMessageId = generateUUID();
  const userMsg: UIMessage = {
    id: userMessageId,
    role: 'user',
    content: userMessage,
    createdAt: new Date(),
  };

  session.messages.push(userMsg);

  // Save user message to database
  await saveMessages({
    messages: [
      {
        chatId: session.chatId,
        id: userMessageId,
        role: 'user',
        parts: [{ type: 'text', text: userMessage }],
        attachments: [],
        createdAt: new Date(),
      },
    ],
  });

  // Send typing indicator
  await ctx.sendChatAction('typing');

  try {
    // Generate AI response
    const result = streamText({
      model: myProvider.languageModel('chat-model-fast'),
      system: systemPrompt({
        selectedChatModel: 'chat-model-fast',
        requestHints: {
          latitude: undefined,
          longitude: undefined,
          city: undefined,
          country: undefined,
        },
      }),
      messages: session.messages,
      maxSteps: 5,
      experimental_activeTools: [
        'getWeather',
        'createDocument',
        'updateDocument',
        'requestSuggestions',
      ],
      experimental_generateMessageId: generateUUID,
      tools: {
        getWeather,
        // Note: createDocument and updateDocument need session context
        // For Telegram, we'll disable these for now
        createDocument: createDocument({
          session: {
            user: {
              id: session.userId,
              email: `telegram_${telegramUserId}@telegram.user`,
              type: 'guest',
            },
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
          dataStream: null as any,
        }),
        updateDocument: updateDocument({
          session: {
            user: {
              id: session.userId,
              email: `telegram_${telegramUserId}@telegram.user`,
              type: 'guest',
            },
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
          dataStream: null as any,
        }),
        requestSuggestions: requestSuggestions({
          session: {
            user: {
              id: session.userId,
              email: `telegram_${telegramUserId}@telegram.user`,
              type: 'guest',
            },
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
          dataStream: null as any,
        }),
      },
    });

    // Collect the response
    let fullResponse = '';
    let messageToEdit: any = null;
    let lastUpdateTime = Date.now();

    for await (const chunk of result.textStream) {
      fullResponse += chunk;

      // Update message every 500ms to avoid rate limits
      const now = Date.now();
      if (now - lastUpdateTime > 500) {
        if (messageToEdit) {
          try {
            await ctx.telegram.editMessageText(
              ctx.chat!.id,
              messageToEdit.message_id,
              undefined,
              fullResponse.slice(0, 4096), // Telegram message limit
            );
          } catch (error: any) {
            // Ignore if message hasn't changed
            if (!error.message.includes('message is not modified')) {
              console.error('Error editing message:', error);
            }
          }
        } else {
          messageToEdit = await ctx.reply(fullResponse.slice(0, 4096));
        }
        lastUpdateTime = now;
      }
    }

    // Send final message if not sent yet
    if (!messageToEdit) {
      messageToEdit = await ctx.reply(fullResponse.slice(0, 4096));
    } else {
      // Final update
      try {
        await ctx.telegram.editMessageText(
          ctx.chat!.id,
          messageToEdit.message_id,
          undefined,
          fullResponse.slice(0, 4096),
        );
      } catch (error: any) {
        if (!error.message.includes('message is not modified')) {
          console.error('Error editing final message:', error);
        }
      }
    }

    // Save assistant message
    const assistantMessageId = generateUUID();
    const assistantMsg: UIMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: fullResponse,
      createdAt: new Date(),
    };

    session.messages.push(assistantMsg);

    await saveMessages({
      messages: [
        {
          chatId: session.chatId,
          id: assistantMessageId,
          role: 'assistant',
          parts: [{ type: 'text', text: fullResponse }],
          attachments: [],
          createdAt: new Date(),
        },
      ],
    });
  } catch (error: any) {
    console.error('Error generating response:', error);
    await ctx.reply(
      'Sorry, I encountered an error while processing your request. Please try again.',
    );
  }
}

/**
 * Clear session cache (useful for testing)
 */
export function clearSession(telegramUserId: string, botToken: string) {
  const sessionKey = `${botToken}:${telegramUserId}`;
  userSessions.delete(sessionKey);
}
