# Composio MCP Server Setup

This directory contains the configuration for the Composio Model Context Protocol (MCP) server integration with Cursor IDE.

## Overview

The Composio MCP server allows Cursor to connect to 1000+ external tools and services through a unified API. This setup uses OAuth for authentication, enabling seamless integration without hardcoded credentials.

## Configuration

### MCP Server Configuration (`mcp.json`)

The MCP server is configured in `.cursor/mcp.json` with the following settings:

- **Server Name**: `composio`
- **Transport Type**: HTTP (Streamable HTTP)
- **URL**: `https://connect.composio.dev/mcp`
- **Authentication**: OAuth (automatic, no headers required)

### File Structure

```
.cursor/
├── mcp.json                    # MCP server configuration
└── COMPOSIO_MCP_SETUP.md      # This documentation file
```

## Installation

The Composio CLI has been installed and configured:

1. **CLI Installation**: Installed via `curl -fsSL https://composio.dev/install | bash`
   - Location: `~/.composio/composio`
   - Version: 0.2.24+

2. **Authentication**: Logged in to organization `ac_workspace`
   - Email: ac@elysiumaiapp.com
   - Organization ID: ok_yZ3lpCCItM_8

3. **Skills**: OpenClaw skill has been installed

## Usage

### Using Composio in Cursor

Once configured, Cursor will automatically connect to the Composio MCP server. You can access Composio tools through Cursor's AI features.

### Composio CLI Commands

The Composio CLI is available at `~/.composio/composio`. Here are some useful commands:

#### Core Commands

```bash
# Search for tools by use case
~/.composio/composio search "send an email" "create github issue"

# Execute a tool
~/.composio/composio execute GITHUB_CREATE_ISSUE -d '{ owner: "acme", repo: "app", title: "Bug" }'

# Link your account for a toolkit/app
~/.composio/composio link github

# Call an API directly through proxy
~/.composio/composio proxy https://gmail.googleapis.com/gmail/v1/users/me/profile --toolkit gmail

# Run inline code with Composio helpers
~/.composio/composio run 'const me = await execute("GITHUB_GET_THE_AUTHENTICATED_USER"); console.log(me)'
```

#### Information Commands

```bash
# Check who is logged in
~/.composio/composio whoami

# Get CLI version
~/.composio/composio version

# List tools for a specific toolkit
~/.composio/composio tools list github

# Get info about a specific tool
~/.composio/composio tools info GITHUB_CREATE_ISSUE
```

#### Management Commands

```bash
# View available organizations
~/.composio/composio orgs

# View CLI configuration
~/.composio/composio config

# Upgrade CLI
~/.composio/composio upgrade
```

## How It Works

1. **MCP Server**: The `mcp.json` configuration tells Cursor to connect to the Composio MCP server at `https://connect.composio.dev/mcp`

2. **OAuth Authentication**: Composio uses OAuth for authentication, so no API keys need to be stored in the configuration file

3. **Tool Access**: Through the MCP server, Cursor can access any of the 1000+ tools and services supported by Composio

4. **OpenClaw Skill**: The OpenClaw skill has been installed, enabling advanced agent capabilities

## Troubleshooting

### Viewing MCP Logs in Cursor

1. Open the Output panel: `Cmd/Ctrl + Shift + U`
2. Select "MCP" from the dropdown
3. View connection status and error messages

### Common Issues

- **Connection Failed**: Ensure you have an active internet connection and the Composio service is accessible
- **Authentication Error**: Run `~/.composio/composio whoami` to verify you're logged in
- **Tool Not Found**: Use `~/.composio/composio search <query>` to find available tools

### Re-authentication

If you need to re-authenticate:

```bash
# Logout
~/.composio/composio logout

# Login again
~/.composio/composio login --user-api-key "your-api-key" --org "ac_workspace"
```

## Configuration Files Location

- **Project-specific**: `.cursor/mcp.json` (this repository)
- **Global**: `~/.cursor/mcp.json` (applies to all projects)
- **Composio CLI**: `~/.composio/` (CLI config and cache)

## Security Notes

- The MCP configuration uses OAuth, so no sensitive credentials are stored in the repository
- The Composio CLI stores authentication in `~/.composio/user_data.json`
- Never commit API keys or tokens to version control

## Resources

- [Composio Documentation](https://docs.composio.dev)
- [Cursor MCP Documentation](https://cursor.com/docs/mcp)
- [Model Context Protocol](https://modelcontextprotocol.io)

## Support

For issues with:
- **Composio**: Visit https://docs.composio.dev or contact Composio support
- **Cursor MCP**: Check https://cursor.com/docs/mcp
- **This Setup**: Refer to this documentation or check the repository issues
