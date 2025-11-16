# Zapier Example Workflows

This directory contains example Zapier workflows (Zaps) that you can import and customize for your AI Chatbot application.

## Available Examples

### 1. Slack Notification on Chat Created
**File:** `slack-notification.json`

Sends a Slack message to a channel whenever a new chat is created.

**Use Cases:**
- Team notifications for new chat activity
- Monitoring chat creation patterns
- Real-time awareness of user engagement

### 2. Google Sheets Event Logger
**File:** `google-sheets-logger.json`

Logs all events from your AI Chatbot to a Google Sheet for analysis.

**Use Cases:**
- Event tracking and analytics
- Audit trail for compliance
- Data export for reporting

### 3. Gmail to Chat Message
**File:** `email-to-chat.json`

Automatically creates chat messages from incoming Gmail emails.

**Use Cases:**
- Email-to-chat bridge
- Customer support workflows
- Centralized communication hub

### 4. Notion Database Sync
**File:** `notion-database.json`

Syncs important chat messages to a Notion database.

**Use Cases:**
- Knowledge management
- Important message archival
- Cross-platform documentation

## How to Use These Examples

### Option 1: Manual Setup

1. Open the JSON file for the workflow you want to create
2. Follow the steps described in the file
3. Configure each step in Zapier's web interface
4. Replace placeholder values with your actual data

### Option 2: Import (if supported by Zapier)

Some Zapier plans support importing Zaps from JSON:

1. Go to Zapier dashboard
2. Click "Create Zap"
3. Look for import option (if available)
4. Upload the JSON file
5. Review and customize settings

## Customization Tips

### Changing Event Filters

To filter for specific events, modify the filter step:

```json
{
  "type": "filter",
  "conditions": [
    {
      "field": "event",
      "operator": "equals",
      "value": "chat.created"  // Change this to your desired event
    }
  ]
}
```

### Available Event Types

- `chat.created` - New chat created
- `chat.updated` - Chat updated
- `chat.deleted` - Chat deleted
- `message.created` - New message sent
- `message.updated` - Message edited
- `document.created` - Document created
- `document.updated` - Document edited
- `user.action` - Custom user action

### Adding Custom Metadata

You can pass custom metadata in the webhook payload:

```json
{
  "type": "create_message",
  "data": {
    "chatId": "chat-123",
    "content": "Your message",
    "metadata": {
      "priority": "high",
      "category": "support",
      "customField": "value"
    }
  }
}
```

## Security Best Practices

1. **Use Webhook Secrets:** Always set `ZAPIER_WEBHOOK_SECRET` and include it in the `X-Zapier-Signature` header
2. **Limit Permissions:** Only give Zapier access to the channels/resources it needs
3. **Monitor Activity:** Regularly check Zap History for unusual activity
4. **Rotate Secrets:** Change your webhook secret every 90 days

## Testing Workflows

Before deploying to production:

1. **Use Test Data:** Create test chats and messages
2. **Check Zap History:** Verify events are being captured
3. **Validate Output:** Ensure data is formatted correctly in target apps
4. **Error Handling:** Test what happens when things fail

## Common Issues

### Events Not Triggering

**Problem:** Zap doesn't fire when expected

**Solutions:**
- Verify `ZAPIER_ENABLED=true` in your environment
- Check `ZAPIER_WEBHOOK_URL` is set correctly
- Ensure Zap is turned ON in Zapier dashboard
- Check Zap History for errors

### Authentication Errors

**Problem:** Webhook returns 401 Unauthorized

**Solutions:**
- Verify `X-Zapier-Signature` header matches `ZAPIER_WEBHOOK_SECRET`
- Check user session is valid
- Ensure proper authentication headers are included

### Data Not Appearing Correctly

**Problem:** Data fields are empty or malformed

**Solutions:**
- Check field mapping in Zapier
- Verify webhook payload structure
- Use Zapier's "Test" feature to see actual data
- Check for typos in field names (use `{{data__fieldName}}` format)

## Advanced Workflows

### Multi-Step Workflows

Combine multiple actions in sequence:

1. Receive webhook (trigger)
2. Filter for specific conditions
3. Format/transform data
4. Send to multiple destinations (Slack + Email + Google Sheets)

### Error Recovery

Add error handling steps:

1. Try primary action
2. If fails, send error notification
3. Retry with exponential backoff
4. Log failure for manual review

### Conditional Logic

Use Zapier's Paths feature:

- Path A: If message contains "urgent" → Send SMS
- Path B: If message contains "feedback" → Create Trello card
- Path C: Otherwise → Log to Google Sheets

## Support and Resources

- [Zapier Help Center](https://zapier.com/help)
- [Webhooks by Zapier Documentation](https://zapier.com/apps/webhook/integrations)
- [Main Integration Guide](../ZAPIER_INTEGRATION.md)
- [Quick Start Guide](../lib/zapier/README.md)

## Contributing

Have a useful Zapier workflow? Share it!

1. Create a JSON file with your workflow configuration
2. Add clear documentation
3. Test thoroughly
4. Submit as a pull request

## Next Steps

1. Choose a workflow to start with
2. Set up the corresponding Zapier app integrations
3. Configure environment variables
4. Test with sample data
5. Deploy to production
6. Monitor and iterate
