# Zapier Quick Start Guide

Get your Zapier integration up and running in 5 minutes!

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Your Zapier Webhook URL (2 min)

1. Go to [Zapier.com](https://zapier.com/app/zaps) and sign in
2. Click **Create Zap**
3. For the trigger, search for **Webhooks by Zapier**
4. Select **Catch Hook**
5. Click **Continue**
6. Copy the webhook URL (looks like: `https://hooks.zapier.com/hooks/catch/xxxxx/yyyyy/`)

### Step 2: Configure Your App (1 min)

Create a `.env.local` file in your project root (if it doesn't exist):

```bash
# Enable Zapier
ZAPIER_ENABLED=true

# Paste your webhook URL from Step 1
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/xxxxx/yyyyy/

# Optional: Add a secret for security (recommended)
ZAPIER_WEBHOOK_SECRET=my-secret-key-12345
```

### Step 3: Start Your App (1 min)

```bash
pnpm install
pnpm dev
```

### Step 4: Test It! (1 min)

1. Open your app at [http://localhost:3000](http://localhost:3000)
2. Create a new chat
3. Go back to Zapier and click **Test trigger**
4. You should see your chat creation event! 🎉

## ✅ What Just Happened?

Your app now automatically sends events to Zapier when:

- ✨ A new chat is created
- 💬 A message is sent
- 📄 A document is created
- 🎯 Custom actions occur

## 🎯 Next Steps

### Connect to Your Favorite Apps

Now that Zapier is receiving events, connect them to other apps:

#### Option 1: Send to Slack
1. In Zapier, add an action step
2. Choose **Slack**
3. Select **Send Channel Message**
4. Map the event data to your Slack message

#### Option 2: Log to Google Sheets
1. Add **Google Sheets** action
2. Select **Create Spreadsheet Row**
3. Map event fields to columns

#### Option 3: Email Notifications
1. Add **Gmail** or **Email** action
2. Select **Send Email**
3. Customize the email with event data

### Receive Data from Zapier

You can also send data TO your app from Zapier:

```bash
curl -X POST http://localhost:3000/api/zapier/webhook \
  -H "Content-Type: application/json" \
  -H "X-Zapier-Signature: my-secret-key-12345" \
  -d '{
    "type": "create_message",
    "data": {
      "chatId": "your-chat-id",
      "content": "Hello from Zapier!"
    }
  }'
```

## 📖 Example Workflows

### 1. Slack Notifications (Most Popular)
**Notify your team when important chats are created**

```
Webhook Trigger → Filter (chat.created) → Slack (Send Message)
```

### 2. Email Summaries
**Daily digest of all chat activity**

```
Webhook Trigger → Delay (24 hours) → Gmail (Send Summary)
```

### 3. Google Sheets Logger
**Track all events in a spreadsheet**

```
Webhook Trigger → Google Sheets (Create Row)
```

### 4. Notion Database
**Archive important messages to Notion**

```
Webhook Trigger → Filter (important keywords) → Notion (Create Page)
```

### 5. Gmail to Chat
**Turn emails into chat messages**

```
Gmail (New Email) → Webhook (POST to your app)
```

## 🔧 Available Events

Your app automatically triggers these events:

| Event | When It Fires | Data Included |
|-------|---------------|---------------|
| `chat.created` | New chat | `chatId`, `title`, `userId` |
| `message.created` | New message | `messageId`, `content`, `role` |
| `document.created` | Document made | `documentId`, `title`, `kind` |
| `user.action` | Custom action | Custom data |

## 🎨 Customize Events

Add custom Zapier triggers anywhere in your code:

```typescript
import { zapierClient } from '@/lib/zapier';

// Send a custom event
await zapierClient.notifyUserAction(
  userId,
  'custom-event-name',
  { 
    customField: 'value',
    anotherField: 123
  }
);
```

## 🔒 Security Tips

1. **Always use a webhook secret** in production:
   ```bash
   ZAPIER_WEBHOOK_SECRET=use-a-strong-random-secret-here
   ```

2. **Verify the secret** in Zapier when sending data to your app:
   - Add header: `X-Zapier-Signature: your-secret-here`

3. **Use HTTPS** in production (automatic on Vercel)

## 🐛 Troubleshooting

### Events Not Showing Up in Zapier?

**Check 1: Is Zapier enabled?**
```bash
# In your .env.local
ZAPIER_ENABLED=true
```

**Check 2: Is the webhook URL correct?**
```bash
# Should look like this
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/xxxxx/yyyyy/
```

**Check 3: Is your Zap turned on?**
- Go to Zapier dashboard
- Make sure your Zap is toggled ON

**Check 4: Look at the console logs**
```bash
# You should see:
[Zapier] Webhook triggered: chat.created
```

### Getting 401 Unauthorized?

Your webhook secret doesn't match. Make sure:
- `ZAPIER_WEBHOOK_SECRET` is set in `.env.local`
- `X-Zapier-Signature` header matches the secret
- No extra spaces or quotes

### Still Having Issues?

1. Check the [full documentation](ZAPIER_INTEGRATION.md)
2. Look at [example workflows](zapier-examples/)
3. View Zap History in Zapier for error details
4. Check your app's console logs

## 📚 More Resources

- **[Full Integration Guide](ZAPIER_INTEGRATION.md)** - Complete documentation
- **[Example Workflows](zapier-examples/)** - Ready-to-use Zap templates
- **[API Reference](lib/zapier/README.md)** - Developer documentation
- **[Zapier Help Center](https://zapier.com/help)** - Official Zapier docs

## 💡 Pro Tips

1. **Start Simple:** Begin with one Zap (like Slack notifications)
2. **Use Filters:** Only trigger for important events
3. **Test Thoroughly:** Use test chats before going live
4. **Monitor Usage:** Check Zap History regularly
5. **Error Handling:** Set up error notifications in Zapier

## 🎉 Success!

You now have:
- ✅ Zapier integration configured
- ✅ Events flowing to Zapier
- ✅ Ability to connect to 5000+ apps
- ✅ Foundation for powerful automations

**What's next?** Explore the [example workflows](zapier-examples/) or build your own custom automation!

---

Need help? Check the [full documentation](ZAPIER_INTEGRATION.md) or reach out to support.
