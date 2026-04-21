# Pipedream Connect Integration

This document describes how to integrate Pipedream Connect into the AI Chatbot application.

## Overview

Pipedream Connect enables your users to connect to 2,500+ APIs directly from your application. This integration provides secure authentication and access to external services through Pipedream's managed OAuth infrastructure.

## Setup Instructions

### 1. Create a Pipedream Account and Project

1. Visit [https://pipedream.com](https://pipedream.com) and create a free account
2. Navigate to [https://pipedream.com/projects](https://pipedream.com/projects)
3. Create a new project or select an existing one
4. Click the **Settings** tab
5. Copy your **Project ID** (starts with `proj_`)

### 2. Create an OAuth Client

1. Visit [https://pipedream.com/settings/api](https://pipedream.com/settings/api) (your workspace API settings)
2. Click the **New OAuth Client** button
3. Give your OAuth client a name (e.g., "AI Chatbot Development")
4. Click **Create**
5. Copy the **Client ID** and **Client Secret** 
   - ⚠️ **Important**: The Client Secret is only shown once. Store it securely!

### 3. Configure Environment Variables

Add the following environment variables to your `.env` file:

```env
# Pipedream Connect credentials
PIPEDREAM_CLIENT_ID=your_client_id_here
PIPEDREAM_CLIENT_SECRET=your_client_secret_here
PIPEDREAM_PROJECT_ID=proj_xxxxx
PIPEDREAM_ENVIRONMENT=development
```

For production deployments:
- Use a separate OAuth client for production
- Set `PIPEDREAM_ENVIRONMENT=production`
- Store credentials securely (e.g., Vercel Environment Variables)

## API Endpoints

### Create Connect Token

**POST** `/api/pipedream/token`

Creates a short-lived Connect token for the authenticated user to initiate account connections.

**Request Body:**
```json
{
  "expiresIn": 14400,
  "scope": "connect:*",
  "allowedOrigins": ["https://yourdomain.com"],
  "errorRedirectUri": "https://yourdomain.com/error"
}
```

**Response:**
```json
{
  "token": "ctok_abc123...",
  "expiresAt": "2026-04-07T12:00:00Z",
  "connectLinkUrl": "https://connect.pipedream.com/..."
}
```

### List Connected Accounts

**GET** `/api/pipedream/accounts`

Lists all connected accounts for the authenticated user.

**Response:**
```json
{
  "data": [
    {
      "id": "acc_123",
      "app": "github",
      "name": "GitHub Account",
      "created_at": "2026-04-07T10:00:00Z"
    }
  ]
}
```

### Delete Connected Account

**DELETE** `/api/pipedream/accounts?account_id=acc_123`

Deletes a connected account for the authenticated user.

**Response:**
```json
{
  "success": true
}
```

## Frontend Integration

### Using the Pipedream SDK

Install the Pipedream frontend SDK:

```bash
npm install @pipedream/sdk-react
```

Example React component:

```typescript
import { usePipedream } from '@pipedream/sdk-react';
import { useState } from 'react';

export function ConnectAccount() {
  const [token, setToken] = useState<string>('');
  
  // Fetch token from your backend
  async function getConnectToken() {
    const response = await fetch('/api/pipedream/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expiresIn: 3600,
        scope: 'connect:accounts:read connect:accounts:write'
      })
    });
    const data = await response.json();
    setToken(data.token);
  }
  
  const pd = usePipedream({
    token,
    onSuccess: (account) => {
      console.log('Account connected:', account);
    },
    onError: (error) => {
      console.error('Connection error:', error);
    }
  });
  
  return (
    <div>
      <button onClick={getConnectToken}>Get Token</button>
      <button onClick={() => pd.connectAccount({ app: 'github' })}>
        Connect GitHub
      </button>
    </div>
  );
}
```

### Using Connect Link (No-Code)

Alternatively, use the Connect Link URL for a hosted connection flow:

```typescript
async function initiateConnection() {
  const response = await fetch('/api/pipedream/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const { connectLinkUrl } = await response.json();
  
  // Redirect user to Pipedream-hosted connection flow
  window.location.href = connectLinkUrl;
}
```

## Security Considerations

1. **Client Secret**: Never expose your Client Secret in client-side code
2. **Token Scope**: Use the minimal required scopes for your use case
3. **Token Expiry**: Connect tokens expire after 4 hours (or custom `expiresIn`)
4. **CORS**: Configure `allowedOrigins` to restrict token usage to your domain
5. **Environment Variables**: Use separate credentials for development and production

## Available Scopes

| Scope | Description |
|-------|-------------|
| `connect:*` | Full access to all Connect API endpoints |
| `connect:accounts:read` | List and fetch Connect accounts |
| `connect:accounts:write` | Create or remove Connect accounts |
| `connect:actions:*` | Full access to Connect actions |
| `connect:triggers:*` | Full access to Connect triggers |
| `connect:deployed_triggers:read` | Read deployed triggers |
| `connect:deployed_triggers:write` | Modify or delete deployed triggers |
| `connect:proxy` | Invoke the Connect proxy |
| `connect:workflow:invoke` | Invoke Connect workflows |

## Resources

- [Pipedream Connect Documentation](https://pipedream.com/docs/connect)
- [Pipedream Connect API Reference](https://pipedream.com/docs/connect/api-reference)
- [Pipedream TypeScript SDK](https://www.npmjs.com/package/@pipedream/sdk)
- [Available Apps](https://pipedream.com/apps)

## Troubleshooting

### "Client ID not found" error
- Verify your `PIPEDREAM_CLIENT_ID` is correct
- Ensure you're using the OAuth client from the correct workspace

### "Invalid project ID" error
- Verify your `PIPEDREAM_PROJECT_ID` starts with `proj_`
- Ensure the project exists and is accessible to your workspace

### Token expired
- Connect tokens expire after 4 hours by default
- Generate a new token when needed

### CORS errors
- Add your domain to `allowedOrigins` when creating the token
- For development, include `http://localhost:3000`

## Example: Full Integration

See the implementation in:
- `/lib/pipedream/client.ts` - Pipedream client initialization
- `/lib/pipedream/types.ts` - TypeScript types
- `/app/(chat)/api/pipedream/token/route.ts` - Token generation endpoint
- `/app/(chat)/api/pipedream/accounts/route.ts` - Account management endpoints
