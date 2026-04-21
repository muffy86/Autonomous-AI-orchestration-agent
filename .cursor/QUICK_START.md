# Composio MCP Quick Start Guide

## 🚀 You're All Set!

The Composio MCP server is now configured and ready to use in Cursor IDE. You have access to 1000+ tools and integrations!

## 📍 Current Status

✅ MCP server configured at `https://connect.composio.dev/mcp`  
✅ Composio CLI installed and authenticated  
✅ Organization: `ac_workspace` (ac@elysiumaiapp.com)  
✅ OpenClaw skill installed  
✅ All verification checks passed

## 🎯 Using Composio in Cursor IDE

### Step 1: Verify Connection in Cursor

1. Open **Cursor Settings** (Cmd/Ctrl + ,)
2. Navigate to **Tools & MCP**
3. Look for the "composio" server in the list
4. Check that it shows as "Connected" with a green indicator

### Step 2: View MCP Logs (If Needed)

If you encounter any issues:
1. Press **Cmd/Ctrl + Shift + U** to open the Output panel
2. Select **"MCP"** from the dropdown menu
3. View connection status and any error messages

## 🛠️ Using the Composio CLI

The Composio CLI is installed at `~/.composio/composio`. Here are common commands:

### Search for Tools

```bash
# Search for specific functionality
~/.composio/composio search "send email"
~/.composio/composio search "create github issue"
~/.composio/composio search "schedule meeting"

# Search with filters
~/.composio/composio search "pull request" --toolkits github --limit 5
```

### Link Your Accounts

Before using tools, you need to connect your accounts:

```bash
# Link GitHub
~/.composio/composio link github

# Link Gmail
~/.composio/composio link gmail

# Link Slack
~/.composio/composio link slack
```

### Execute Tools Directly

```bash
# Get GitHub user info
~/.composio/composio execute GITHUB_GET_THE_AUTHENTICATED_USER

# Create a GitHub issue
~/.composio/composio execute GITHUB_CREATE_ISSUE -d '{
  "owner": "your-username",
  "repo": "your-repo",
  "title": "Bug Report",
  "body": "Description of the issue"
}'

# Send an email (after linking Gmail)
~/.composio/composio execute GMAIL_SEND_EMAIL -d '{
  "recipient_email": "example@example.com",
  "subject": "Hello from Composio",
  "body": "This email was sent using Composio!"
}'
```

### Get Tool Information

```bash
# List all GitHub tools
~/.composio/composio tools list github

# Get detailed info about a specific tool
~/.composio/composio tools info GITHUB_CREATE_ISSUE

# Get the schema for a tool
~/.composio/composio execute GITHUB_CREATE_ISSUE --get-schema
```

### Run Custom Scripts

```bash
# Execute inline code with Composio helpers
~/.composio/composio run '
  const user = await execute("GITHUB_GET_THE_AUTHENTICATED_USER");
  console.log("Logged in as:", user.login);
'

# Run from a file
~/.composio/composio run -f my-script.js
```

### Manage Connections

```bash
# View your account info
~/.composio/composio whoami

# Manage organizations
~/.composio/composio orgs

# View current configuration
~/.composio/composio config
```

## 🔍 Example Use Cases

### 1. GitHub Automation

```bash
# Find PR-related tools
~/.composio/composio search "pull request review"

# Link GitHub account
~/.composio/composio link github

# Create a PR
~/.composio/composio execute GITHUB_CREATE_PULL_REQUEST -d '{
  "owner": "username",
  "repo": "repo-name",
  "title": "Feature: Add new functionality",
  "head": "feature-branch",
  "base": "main",
  "body": "Description of changes"
}'
```

### 2. Email Management

```bash
# Search email tools
~/.composio/composio search "send email" "fetch emails"

# Link Gmail
~/.composio/composio link gmail

# Fetch recent emails
~/.composio/composio execute GMAIL_FETCH_EMAILS -d '{"max_results": 10}'
```

### 3. Slack Integration

```bash
# Find Slack tools
~/.composio/composio search "slack message"

# Link Slack
~/.composio/composio link slack

# Send a message
~/.composio/composio execute SLACK_SEND_A_MESSAGE_TO_A_SLACK_CHANNEL -d '{
  "channel": "general",
  "text": "Hello from Composio!"
}'
```

## 🔐 Security Best Practices

- **OAuth Authentication**: All connections use OAuth - no need to store API keys
- **Account Linking**: Each tool requires you to link your account first
- **Local Storage**: Authentication tokens are stored in `~/.composio/user_data.json`
- **Secure by Default**: No credentials are committed to the repository

## 🆘 Troubleshooting

### Verify Your Setup

Run the verification script anytime:

```bash
./.cursor/verify-composio-setup.sh
```

### Common Issues

**MCP Server Not Connecting in Cursor:**
- Restart Cursor IDE
- Check the MCP logs (Cmd/Ctrl + Shift + U → MCP)
- Verify internet connectivity

**CLI Authentication Failed:**
```bash
~/.composio/composio logout
~/.composio/composio login --user-api-key "your-key" --org "ac_workspace"
```

**Tool Execution Errors:**
- Ensure you've linked the required account: `composio link <toolkit>`
- Check the tool schema: `composio execute <TOOL_SLUG> --get-schema`
- Validate your input data matches the required format

## 📚 Additional Resources

- **Full Documentation**: See [COMPOSIO_MCP_SETUP.md](./COMPOSIO_MCP_SETUP.md)
- **Composio Docs**: https://docs.composio.dev
- **Cursor MCP Docs**: https://cursor.com/docs/mcp
- **MCP Protocol**: https://modelcontextprotocol.io

## 🎉 Next Steps

1. **Explore Available Tools**: Run `~/.composio/composio search <query>` to discover capabilities
2. **Link Your Accounts**: Connect the services you use most
3. **Test in Cursor**: Open Cursor IDE and start using Composio tools through the AI
4. **Build Workflows**: Combine multiple tools to automate complex tasks

---

**Need Help?** Check the full setup guide at [.cursor/COMPOSIO_MCP_SETUP.md](./.cursor/COMPOSIO_MCP_SETUP.md)
