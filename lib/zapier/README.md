# Zapier Integration - Quick Start

This directory contains the Zapier integration for the AI Chatbot application.

## Quick Setup

### 1. Enable Zapier

Add to your `.env.local`:

```bash
ZAPIER_ENABLED=true
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/xxxxx/yyyyy/
```

### 2. Get Your Webhook URL

1. Go to [Zapier.com](https://zapier.com)
2. Create a new Zap
3. Choose "Webhooks by Zapier" as trigger
4. Select "Catch Hook"
5. Copy the webhook URL

### 3. Test It

Create a new chat in your app - you should see the event in Zapier!

## Files Overview

- **`client.ts`** - Zapier client for sending webhooks to Zapier
- **`types.ts`** - TypeScript types and schemas for Zapier integration
- **`index.ts`** - Main export file

## API Endpoints

- **`POST /api/zapier/webhook`** - Receives webhooks FROM Zapier
- **`GET /api/zapier/webhook`** - Returns webhook configuration

## Usage Examples

### Send Events to Zapier

```typescript
import { zapierClient } from '@/lib/zapier';

// Notify chat created
await zapierClient.notifyChatCreated(userId, chatId, title);

// Notify message created
await zapierClient.notifyMessageCreated(userId, chatId, messageId, content, 'user');

// Custom event
await zapierClient.notifyUserAction(userId, 'custom-action', { data: 'value' });
```

### Receive Webhooks from Zapier

Send POST request to `/api/zapier/webhook`:

```json
{
  "type": "create_message",
  "data": {
    "chatId": "your-chat-id",
    "content": "Message from Zapier"
  }
}
```

## Available Events

Events automatically sent to Zapier:

- `chat.created` - New chat created
- `message.created` - New message sent
- `document.created` - Document created
- `document.updated` - Document updated
- `user.action` - Custom user action

## Security

Optional webhook secret for incoming webhooks:

```bash
ZAPIER_WEBHOOK_SECRET=your-secret-key
```

Add `X-Zapier-Signature` header with the secret when calling the webhook endpoint.

## Full Documentation

See [ZAPIER_INTEGRATION.md](../../ZAPIER_INTEGRATION.md) in the root directory for complete documentation.

## Support

- [Zapier Documentation](https://zapier.com/help)
- [Zapier Webhooks Guide](https://zapier.com/help/create/code-webhooks/trigger-zaps-with-webhooks)
