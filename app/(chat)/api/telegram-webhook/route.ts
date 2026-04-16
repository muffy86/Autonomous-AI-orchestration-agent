import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { handleTelegramMessage } from '@/lib/telegram/bot-service';

export const maxDuration = 60;

// Initialize bots with tokens from environment variables
const bots = new Map<string, Telegraf>();

function initializeBot(token: string): Telegraf {
  if (bots.has(token)) {
    return bots.get(token)!;
  }

  const bot = new Telegraf(token);

  // Handle text messages
  bot.on(message('text'), async (ctx) => {
    try {
      await handleTelegramMessage(ctx, token);
    } catch (error) {
      console.error('Error handling message:', error);
      await ctx.reply('Sorry, I encountered an error processing your message.');
    }
  });

  bots.set(token, bot);
  return bot;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Get the bot token from query parameter or header
    const url = new URL(request.url);
    const botToken = url.searchParams.get('token') || request.headers.get('X-Telegram-Bot-Token');

    if (!botToken) {
      return new Response(JSON.stringify({ error: 'Bot token is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Initialize or get existing bot
    const bot = initializeBot(botToken);

    // Handle the update
    await bot.handleUpdate(body);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Telegram webhook error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Health check endpoint
export async function GET() {
  return new Response(
    JSON.stringify({ 
      status: 'ok',
      message: 'Telegram webhook endpoint is active',
      activeBots: bots.size
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
