# 🚀 Getting Started with Composio MCP

**Quick guide to complete your Composio MCP setup and start using 1000+ tools!**

## ✅ What's Already Done

Your Composio MCP integration is **95% complete**:

- ✅ MCP server configured at `https://connect.composio.dev/mcp`
- ✅ Composio CLI v0.2.27 installed at `~/.composio/composio`
- ✅ Network connectivity verified
- ✅ Documentation in place
- ⚠️ **Authentication needed** (final step!)

## 🔑 Step 1: Get Your Composio API Key

1. Go to [composio.dev](https://composio.dev/) and sign up/login
2. Navigate to **Settings**
3. Go to **Project Settings** → **API Keys**
4. Copy your API key

## 🎯 Step 2: Choose Your Setup Method

### Method A: For Cloud Agents (Recommended)

Perfect for autonomous agents that run in the cloud:

1. Go to [Cursor Dashboard](https://cursor.com/) → **Cloud Agents** → **Secrets**
2. Click **Add Secret**
3. Configure:
   - **Name**: `COMPOSIO_API_KEY`
   - **Value**: Your API key from composio.dev
   - **Scope**: Choose repository or user level
4. Save the secret
5. Next time a Cloud Agent runs, it will automatically authenticate!

**Optional**: Add organization ID
- **Name**: `COMPOSIO_ORG`
- **Value**: Your organization ID from composio.dev

### Method B: For Local Development

Perfect for local testing and development:

```bash
# Interactive login (opens browser)
~/.composio/composio login

# Or with API key directly
~/.composio/composio login --user-api-key "your-api-key-here"
```

### Method C: Using the Helper Script

Run the auto-authentication script:

```bash
# With environment variable
export COMPOSIO_API_KEY="your-api-key-here"
./.cursor/authenticate-composio.sh

# Or if you've added it as a Cloud Agent secret, it will auto-detect
./.cursor/authenticate-composio.sh
```

## ✨ Step 3: Verify Authentication

```bash
# Check who's logged in
~/.composio/composio whoami

# Test searching for tools
~/.composio/composio search "github" --limit 3

# List available toolkits
~/.composio/composio tools list github
```

Expected output:
```
Email: your-email@example.com
Organization: your-org-name
```

## 🎮 Step 4: Start Using Composio!

### In Cursor IDE

1. Open Cursor IDE
2. Go to **Settings** → **Tools & MCP**
3. Verify "composio" server shows as connected
4. Start using! Example prompts:
   - "Use Composio to create a GitHub issue in my repo"
   - "Search my Gmail for emails from last week"
   - "List my Slack channels"

### Via CLI

```bash
# Link your GitHub account
~/.composio/composio link github

# Create a GitHub issue
~/.composio/composio execute GITHUB_CREATE_ISSUE -d '{
  "owner": "your-username",
  "repo": "your-repo",
  "title": "New feature request",
  "body": "Description here"
}'

# Search for email tools
~/.composio/composio search "send email" --limit 5

# Run inline code
~/.composio/composio run '
  const user = await execute("GITHUB_GET_THE_AUTHENTICATED_USER");
  console.log("Logged in as:", user.login);
'
```

## 📚 Common Use Cases

### 1. GitHub Integration

```bash
# Link GitHub
~/.composio/composio link github

# Useful tools
~/.composio/composio search "github pull request" "github issue"

# Examples
~/.composio/composio execute GITHUB_GET_THE_AUTHENTICATED_USER
~/.composio/composio execute GITHUB_LIST_REPOSITORY_ISSUES -d '{
  "owner": "your-username",
  "repo": "your-repo"
}'
```

### 2. Email (Gmail)

```bash
# Link Gmail
~/.composio/composio link gmail

# Search email tools
~/.composio/composio search "gmail send" "gmail fetch"

# Send an email
~/.composio/composio execute GMAIL_SEND_EMAIL -d '{
  "to": "recipient@example.com",
  "subject": "Hello from Composio",
  "body": "This is automated!"
}'
```

### 3. Slack Integration

```bash
# Link Slack
~/.composio/composio link slack

# Search Slack tools
~/.composio/composio search "slack message" "slack channel"

# Send a message
~/.composio/composio execute SLACK_SEND_A_MESSAGE_TO_A_SLACK_CHANNEL -d '{
  "channel": "general",
  "text": "Hello from Composio CLI!"
}'
```

### 4. Calendar (Google Calendar)

```bash
# Link Google Calendar
~/.composio/composio link google_calendar

# List events
~/.composio/composio search "calendar events" "create meeting"
```

## 🔧 Troubleshooting

### "Not authenticated" error

```bash
# Check authentication status
~/.composio/composio whoami

# If empty, re-authenticate
~/.composio/composio login

# Or use the helper script
./.cursor/authenticate-composio.sh
```

### "Account not connected" error

```bash
# Link the required service
~/.composio/composio link <service-name>

# Example:
~/.composio/composio link github
~/.composio/composio link gmail
```

### MCP server not connecting in Cursor

1. Open Cursor Output panel: `Cmd/Ctrl + Shift + U`
2. Select **MCP** from dropdown
3. Check for connection errors
4. Verify `.cursor/mcp.json` is valid:
   ```bash
   cat .cursor/mcp.json | jq .
   ```

### Tool execution fails

```bash
# Check tool schema
~/.composio/composio execute TOOL_SLUG --get-schema

# Dry run to validate inputs
~/.composio/composio execute TOOL_SLUG -d '{...}' --dry-run
```

## 📖 Additional Resources

### Documentation
- **Setup Status**: [.cursor/SETUP_STATUS.md](./.cursor/SETUP_STATUS.md)
- **Full Setup Guide**: [.cursor/COMPOSIO_MCP_SETUP.md](./.cursor/COMPOSIO_MCP_SETUP.md)
- **Quick Start**: [.cursor/QUICK_START.md](./.cursor/QUICK_START.md)
- **Composio Docs**: https://docs.composio.dev
- **Cursor MCP Docs**: https://cursor.com/docs/mcp

### Scripts
- **Verification**: `./.cursor/verify-composio-setup.sh`
- **Authentication**: `./.cursor/authenticate-composio.sh`

### CLI Help
```bash
# General help
~/.composio/composio --help

# Command-specific help
~/.composio/composio search --help
~/.composio/composio execute --help
~/.composio/composio link --help
```

## 🎉 What You Get

Once authenticated, you have access to **1000+ integrations** including:

### Development & DevOps
- GitHub, GitLab, Bitbucket
- Docker, Kubernetes
- Jenkins, CircleCI, Travis CI

### Communication
- Slack, Discord, Microsoft Teams
- Gmail, Outlook
- Zoom, Google Meet

### Project Management
- Jira, Linear, Asana
- Trello, Monday.com
- ClickUp, Notion

### Productivity
- Google Calendar, Outlook Calendar
- Google Drive, Dropbox, OneDrive
- Airtable, Coda

### Cloud Services
- AWS, Google Cloud, Azure
- Vercel, Netlify, Heroku
- And many more!

## 🚦 Next Steps

1. ✅ **Authenticate** using one of the methods above
2. ✅ **Link accounts** for services you want to use (`composio link <service>`)
3. ✅ **Explore tools** with `composio search <query>`
4. ✅ **Test execution** with simple commands
5. ✅ **Use in Cursor IDE** through the MCP integration
6. ✅ **Build agents** that use these tools automatically!

---

**Need Help?** 
- Check [SETUP_STATUS.md](./.cursor/SETUP_STATUS.md) for detailed troubleshooting
- Visit https://docs.composio.dev for Composio documentation
- Check https://cursor.com/docs/mcp for Cursor MCP guides

**Ready to go?** Run `./.cursor/authenticate-composio.sh` to complete setup! 🚀
