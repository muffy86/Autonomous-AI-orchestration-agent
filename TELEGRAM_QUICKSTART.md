# Telegram Bot Quick Start Guide

This is a quick reference guide to get your Telegram bots working. For detailed information, see [TELEGRAM_BOT_SETUP.md](TELEGRAM_BOT_SETUP.md).

## Quick Setup (5 minutes)

### 1. Get Your Bot Token(s)

1. Open Telegram and message [@BotFather](https://t.me/BotFather)
2. Send `/newbot` and follow the prompts
3. Copy the bot token (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Configure Environment

Add your bot token(s) to your environment:

```bash
# For multiple bots, separate with commas
TELEGRAM_BOT_TOKENS=your_token_1,your_token_2,your_token_3
```

### 3. Run Database Migration

```bash
pnpm db:migrate
```

### 4. Deploy Your Application

Deploy to Vercel, or run locally:

```bash
pnpm dev
```

### 5. Set Up Webhook

Replace `<YOUR_DOMAIN>` and `<YOUR_BOT_TOKEN>`:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://<YOUR_DOMAIN>/api/telegram-webhook?token=<YOUR_BOT_TOKEN>",
    "allowed_updates": ["message"]
  }'
```

Or use the automated script:

```bash
node scripts/setup-telegram-webhooks.js https://your-domain.com
```

### 6. Test Your Bot

1. Open your bot on Telegram
2. Send a message
3. Get an AI-powered response!

## Troubleshooting

### Bot not responding?

Check webhook status:
```bash
curl "https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo"
```

### Need local testing?

Use ngrok for local development:
```bash
ngrok http 3000
# Then use the ngrok URL for your webhook
```

## What's Working

Based on your screenshot, you have these bots:
- wyatte (@wyatt_fun_bot)
- Adam (@Adam_Ant1_bot)
- muffs-auto-bot (@muffs_auto_bot)
- AshleyRose12 (@AshleyRose12_bot)
- Ashley Rose (@AshleyRose1_bot)
- GravityClaw (@DotTe1_bot)
- auto_bot (@Owen12123_bot)
- BotTMore<3 (@BotTMorebot)
- Amber Rose (@muffyo_bot)
- Muffs_bot_telegram (@Muffs_telegram_bot)

All of these can now be powered by your AI chatbot! Just follow the steps above for each bot token.

## Common Issues

**"Forbidden: bot was blocked by the user"**
- The user blocked your bot. They need to unblock it first.

**"Bad Request: wrong file identifier/HTTP URL specified"**
- Check your webhook URL is correct and accessible.

**"Conflict: terminated by other getUpdates request"**
- Only one webhook OR polling can be active. Use webhook for production.

## Next Steps

- Read the [full setup guide](TELEGRAM_BOT_SETUP.md)
- Customize bot behavior in `lib/telegram/bot-service.ts`
- Check application logs for debugging
- Consider rate limiting for production use
