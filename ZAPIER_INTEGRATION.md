# Zapier Integration Guide

This guide explains how to integrate Zapier with your AI Chatbot application to automate workflows and connect with thousands of other apps.

## Table of Contents

1. [Overview](#overview)
2. [Setup](#setup)
3. [Configuration](#configuration)
4. [Available Webhooks](#available-webhooks)
5. [Incoming Webhooks](#incoming-webhooks)
6. [Outgoing Webhooks](#outgoing-webhooks)
7. [Example Workflows](#example-workflows)
8. [Troubleshooting](#troubleshooting)

## Overview

The Zapier integration allows you to:
- **Receive data from Zapier** into your chats (incoming webhooks)
- **Send events to Zapier** when actions occur in your app (outgoing webhooks)
- **Connect with 5000+ apps** including Slack, Gmail, Google Sheets, Notion, and more

## Setup

### 1. Get Your Zapier Webhook URL

1. Go to [Zapier](https://zapier.com) and create a new Zap
2. Choose **Webhooks by Zapier** as the trigger
3. Select **Catch Hook** trigger event
4. Copy the provided webhook URL (looks like: `https://hooks.zapier.com/hooks/catch/xxxxx/yyyyy/`)

### 2. Configure Environment Variables

Add the following variables to your `.env.local` file:

```bash
# Enable Zapier integration
ZAPIER_ENABLED=true

# Your Zapier webhook URL (for outgoing events)
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/xxxxx/yyyyy/

# Optional: API key for additional authentication
ZAPIER_API_KEY=your-secret-api-key

# Optional: Secret for verifying incoming webhooks
ZAPIER_WEBHOOK_SECRET=your-webhook-secret

# Your app's public URL
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 3. Test the Connection

After configuration, create a new chat to trigger a webhook and verify it appears in your Zapier Zap history.

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ZAPIER_ENABLED` | Yes | Set to `true` to enable Zapier integration |
| `ZAPIER_WEBHOOK_URL` | Yes* | Your Zapier webhook URL for outgoing events |
| `ZAPIER_API_KEY` | No | Optional API key for authentication |
| `ZAPIER_WEBHOOK_SECRET` | No | Secret for verifying incoming webhooks |
| `NEXT_PUBLIC_APP_URL` | No | Your app's public URL for webhook callbacks |

*Required only if you want to send events to Zapier

## Available Webhooks

### Incoming Webhooks (Receive from Zapier)

**Endpoint:** `POST /api/zapier/webhook`

Your app can receive webhooks from Zapier to trigger actions:

#### 1. Create Message

Send a message to an existing chat:

```json
{
  "type": "create_message",
  "data": {
    "chatId": "chat-id-here",
    "content": "Message content from Zapier",
    "metadata": {
      "source": "zapier",
      "customField": "value"
    }
  }
}
```

#### 2. Trigger Action

Trigger a custom action:

```json
{
  "type": "trigger_action",
  "data": {
    "action": "custom-action-name",
    "parameters": {
      "param1": "value1",
      "param2": "value2"
    }
  }
}
```

#### 3. Custom Payload

Send any custom data:

```json
{
  "type": "custom",
  "data": {
    "anyField": "anyValue",
    "nested": {
      "data": "supported"
    }
  }
}
```

### Outgoing Webhooks (Send to Zapier)

Your app automatically sends events to Zapier when certain actions occur:

| Event | Trigger | Data Included |
|-------|---------|---------------|
| `chat.created` | New chat created | `chatId`, `title`, `visibility` |
| `message.created` | New message sent | `chatId`, `messageId`, `content`, `role` |
| `document.created` | Document created | `documentId`, `title` |
| `document.updated` | Document updated | `documentId`, `changes` |
| `user.action` | Custom user action | Custom data |

## Incoming Webhooks

### Setup in Zapier

1. Create a Zap with any trigger (e.g., "New Email in Gmail")
2. Add a **Webhooks by Zapier** action
3. Choose **POST** as the method
4. Set URL to: `https://your-app.vercel.app/api/zapier/webhook`
5. Set the payload according to the examples above
6. Add authentication header if using `ZAPIER_WEBHOOK_SECRET`:
   ```
   Header: X-Zapier-Signature
   Value: your-webhook-secret
   ```

### Example: Gmail to Chat

Automatically create a chat message from Gmail:

```javascript
// Zapier Action Setup
POST https://your-app.vercel.app/api/zapier/webhook
Headers: {
  "Content-Type": "application/json",
  "X-Zapier-Signature": "your-webhook-secret"
}
Body: {
  "type": "create_message",
  "data": {
    "chatId": "{{chat_id}}",
    "content": "New email from {{sender}}: {{subject}}",
    "metadata": {
      "source": "gmail",
      "emailId": "{{email_id}}"
    }
  }
}
```

## Outgoing Webhooks

### Using the Zapier Client

You can trigger custom webhooks from anywhere in your code:

```typescript
import { zapierClient } from '@/lib/zapier';

// Notify when a chat is created
await zapierClient.notifyChatCreated(
  userId,
  chatId,
  title,
  { visibility: 'public' }
);

// Notify when a message is created
await zapierClient.notifyMessageCreated(
  userId,
  chatId,
  messageId,
  content,
  'user',
  { hasAttachments: true }
);

// Notify when a document is created
await zapierClient.notifyDocumentCreated(
  userId,
  documentId,
  title,
  { type: 'code' }
);

// Send a custom event
await zapierClient.notifyUserAction(
  userId,
  'custom-action',
  { customData: 'value' },
  { timestamp: new Date().toISOString() }
);
```

### Checking if Zapier is Enabled

```typescript
if (zapierClient.isEnabled()) {
  // Zapier is configured and enabled
  await zapierClient.notifyUserAction(userId, 'action', data);
}
```

## Example Workflows

### 1. Slack Notification on New Chat

**Setup:**
1. Create a Zap with **Webhooks by Zapier** trigger (Catch Hook)
2. Use your `ZAPIER_WEBHOOK_URL`
3. Add filter: `event` equals `chat.created`
4. Add **Slack** action to send a message
5. Use webhook data in the Slack message:
   ```
   New chat created by {{userId}}: {{data__title}}
   Chat ID: {{data__chatId}}
   ```

### 2. Google Sheets Logger

**Setup:**
1. Webhooks trigger catches all events
2. Add **Google Sheets** action to create a row
3. Map fields:
   - Column A: `{{event}}`
   - Column B: `{{timestamp}}`
   - Column C: `{{userId}}`
   - Column D: `{{data}}`

### 3. Email Summary of Chats

**Setup:**
1. Webhooks trigger for `chat.created`
2. Add **Delay** action (wait 1 day)
3. Add **Gmail** action to send summary email
4. Include chat details from webhook data

### 4. Notion Database Integration

**Setup:**
1. Webhooks trigger for `message.created`
2. Add filter for important keywords
3. Add **Notion** action to create database entry
4. Map message content to Notion properties

### 5. SMS Alert for Urgent Messages

**Setup:**
1. Webhooks trigger for `message.created`
2. Add filter: `data__content` contains `urgent`
3. Add **SMS by Zapier** action
4. Send SMS with message content

## Troubleshooting

### Webhooks Not Triggering

1. **Check Environment Variables**
   - Verify `ZAPIER_ENABLED=true`
   - Verify `ZAPIER_WEBHOOK_URL` is set correctly

2. **Check Zapier Zap Status**
   - Ensure your Zap is turned ON
   - Check Zap History for errors

3. **Check Application Logs**
   - Look for `[Zapier]` prefix in logs
   - Check for error messages

### Authentication Errors

1. **Incoming Webhooks**
   - Verify `ZAPIER_WEBHOOK_SECRET` matches in both places
   - Check `X-Zapier-Signature` header is included

2. **Outgoing Webhooks**
   - Verify Zapier webhook URL is accessible
   - Check for CORS issues

### Testing Webhooks

Use the test endpoint to verify configuration:

```bash
curl -X GET https://your-app.vercel.app/api/zapier/webhook \
  -H "Authorization: Bearer your-session-token"
```

Expected response:
```json
{
  "status": "active",
  "webhookUrl": "https://your-app.vercel.app/api/zapier/webhook",
  "supportedTypes": ["create_message", "trigger_action", "custom"],
  "version": "1.0.0"
}
```

### Common Issues

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check authentication headers and session |
| 403 Forbidden | Verify user has access to the chat/resource |
| 400 Bad Request | Check webhook payload format |
| 500 Server Error | Check application logs for details |

## Security Best Practices

1. **Always use HTTPS** in production
2. **Set `ZAPIER_WEBHOOK_SECRET`** to verify incoming webhooks
3. **Rotate secrets regularly** (every 90 days)
4. **Monitor webhook activity** in logs
5. **Rate limit webhooks** if needed
6. **Validate all incoming data** before processing

## Advanced Usage

### Custom Event Types

You can create custom event types by using the `notifyUserAction` method:

```typescript
await zapierClient.notifyUserAction(
  userId,
  'custom-event-type',
  {
    // Your custom data
    field1: 'value1',
    field2: 'value2',
  },
  {
    // Optional metadata
    source: 'custom-integration',
    timestamp: new Date().toISOString(),
  }
);
```

### Batch Operations

For multiple events, trigger them without awaiting:

```typescript
const notifications = [
  zapierClient.notifyChatCreated(userId, chatId1, title1),
  zapierClient.notifyChatCreated(userId, chatId2, title2),
  zapierClient.notifyChatCreated(userId, chatId3, title3),
];

// Wait for all to complete
await Promise.allSettled(notifications);
```

### Error Handling

The Zapier client handles errors gracefully:

```typescript
const result = await zapierClient.notifyChatCreated(
  userId,
  chatId,
  title
);

if (!result.success) {
  console.error('Zapier notification failed:', result.error);
  // Handle failure (e.g., retry, log, notify admin)
}
```

## Support

For issues or questions:
- Check [Zapier's Documentation](https://zapier.com/help)
- Review application logs
- Open an issue on GitHub
- Contact support team

## Next Steps

1. Explore more integrations in the [Zapier App Directory](https://zapier.com/apps)
2. Create multi-step Zaps for complex workflows
3. Use Zapier's filters and formatting tools
4. Set up error notifications
5. Monitor webhook usage and performance
