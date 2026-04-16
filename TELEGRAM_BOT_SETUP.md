# Telegram Bot Setup Guide

This guide will help you set up your Telegram bots to work with the AI Chatbot application.

## Overview

The AI Chatbot application now supports Telegram bot integration, allowing you to interact with the chatbot through Telegram. Each bot can operate independently with its own conversation history.

## Prerequisites

1. A deployed instance of the AI Chatbot (Vercel, Docker, or local)
2. Telegram bot tokens from [@BotFather](https://t.me/BotFather)
3. Database access (PostgreSQL)
4. Access to environment variables configuration

## Step 1: Create Your Telegram Bots

If you don't already have bot tokens, you need to create bots using BotFather:

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow the instructions to choose a name and username for your bot
4. BotFather will provide you with a token like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
5. Save this token securely
6. Repeat for each bot you want to create

## Step 2: Configure Environment Variables

### For Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add a new environment variable:
   - Name: `TELEGRAM_BOT_TOKENS`
   - Value: Your bot tokens separated by commas (e.g., `token1,token2,token3`)
4. Redeploy your application

### For Local Development

1. Create a `.env` file in the root directory (if not exists)
2. Add the following line:
   ```
   TELEGRAM_BOT_TOKENS=your_bot_token_1,your_bot_token_2,your_bot_token_3
   ```
3. Make sure `.env` is in your `.gitignore`

### For Docker Deployment

Add the environment variable to your `docker-compose.yml` or pass it via `-e` flag:

```yaml
environment:
  - TELEGRAM_BOT_TOKENS=token1,token2,token3
```

## Step 3: Run Database Migrations

The Telegram integration requires additional database columns. Run the migration:

```bash
pnpm db:migrate
```

Or if using Docker:

```bash
docker-compose exec app pnpm db:migrate
```

## Step 4: Set Up Webhooks

You need to configure each bot to send updates to your application's webhook endpoint.

### Webhook URL Format

```
https://your-domain.com/api/telegram-webhook?token=YOUR_BOT_TOKEN
```

### Setting Up Webhooks

For each bot, send a request to Telegram's API:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/api/telegram-webhook?token=<YOUR_BOT_TOKEN>",
    "allowed_updates": ["message"]
  }'
```

Replace:
- `<YOUR_BOT_TOKEN>` with your actual bot token
- `https://your-domain.com` with your deployed application URL

### Verify Webhook Setup

Check if the webhook is set correctly:

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

You should see a response showing your webhook URL is set.

## Step 5: Test Your Bots

1. Open Telegram and search for your bot by username
2. Send `/start` or any message
3. The bot should respond using the AI chatbot

## Troubleshooting

### Bot Not Responding

1. **Check webhook status:**
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
   ```

2. **Check application logs:**
   - Vercel: Check the Functions logs in your Vercel dashboard
   - Docker: `docker-compose logs -f app`
   - Local: Check your console output

3. **Verify environment variables:**
   Make sure `TELEGRAM_BOT_TOKENS` is set correctly

4. **Test webhook endpoint:**
   ```bash
   curl "https://your-domain.com/api/telegram-webhook"
   ```
   Should return: `{"status":"ok","message":"Telegram webhook endpoint is active"}`

### Database Errors

If you see database errors, make sure:
1. Migrations have been run: `pnpm db:migrate`
2. Database connection is working
3. `POSTGRES_URL` environment variable is set correctly

### Webhook SSL Errors

Telegram requires HTTPS for webhooks. Make sure:
1. Your domain has a valid SSL certificate
2. You're not using self-signed certificates (Telegram doesn't accept them)
3. For local testing, use a tunnel service like ngrok:
   ```bash
   ngrok http 3000
   ```
   Then use the ngrok URL for your webhook

### Rate Limiting

Telegram has rate limits for bot messages:
- 30 messages per second per bot
- 1 message per second per chat

The bot service automatically handles message editing to avoid hitting these limits.

## Features

### Conversation History

Each Telegram user has a persistent conversation history stored in the database. Messages are preserved across sessions.

### AI Capabilities

All AI features from the web chatbot are available:
- Natural language processing
- Tool usage (weather, etc.)
- Multi-step reasoning
- Context-aware responses

### Multiple Bot Support

You can run multiple bots simultaneously, each with independent:
- Conversation histories
- User sessions
- Configurations

## Advanced Configuration

### Custom System Prompts

To customize the bot's behavior, modify the system prompt in:
`lib/telegram/bot-service.ts`

### Model Selection

By default, bots use the `chat-model-fast` model. To change this, edit:
```typescript
model: myProvider.languageModel('chat-model-fast')
```

### Tool Customization

Enable or disable specific tools by modifying the `experimental_activeTools` array in `lib/telegram/bot-service.ts`.

## Security Considerations

1. **Never commit bot tokens** to version control
2. **Use environment variables** for all sensitive data
3. **Validate webhook requests** - The application validates incoming requests
4. **Rate limiting** - Consider implementing additional rate limiting for production
5. **User authentication** - Currently, anyone with your bot username can use it

## API Reference

### Webhook Endpoint

**URL:** `/api/telegram-webhook`

**Method:** `POST`

**Query Parameters:**
- `token` (required): The bot token for the specific bot

**Headers:**
- `X-Telegram-Bot-Token` (alternative to query param): The bot token

**Response:**
```json
{
  "ok": true
}
```

### Health Check

**URL:** `/api/telegram-webhook`

**Method:** `GET`

**Response:**
```json
{
  "status": "ok",
  "message": "Telegram webhook endpoint is active",
  "activeBots": 0
}
```

## Support

For issues or questions:
1. Check the [main README](README.md)
2. Review [CONTRIBUTING.md](CONTRIBUTING.md)
3. Open an issue on GitHub

## License

This Telegram integration is part of the AI Chatbot project and follows the same MIT License.
