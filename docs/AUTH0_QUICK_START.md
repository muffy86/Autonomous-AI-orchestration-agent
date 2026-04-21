# Auth0 Quick Start Guide

This is a condensed version of the Auth0 setup. For detailed instructions, see [AUTH0_SETUP.md](AUTH0_SETUP.md).

## Quick Setup (5 Minutes)

### 1. Create Auth0 Application

Visit: https://manage.auth0.com/dashboard

1. Applications → Create Application
2. Name: "AI Chatbot" 
3. Type: Regular Web Application

### 2. Configure URLs

In your Auth0 application settings:

```
Allowed Callback URLs:
http://localhost:3000/api/auth/callback/auth0

Allowed Logout URLs:
http://localhost:3000
```

### 3. Copy Credentials

From Auth0 application settings, copy:
- Domain
- Client ID  
- Client Secret

### 4. Set Environment Variables

Create/update `.env` file:

```bash
AUTH_AUTH0_ID=your_client_id_here
AUTH_AUTH0_SECRET=your_client_secret_here
AUTH_AUTH0_ISSUER=https://your-domain.auth0.com
NEXT_PUBLIC_AUTH0_ENABLED=true
```

### 5. Test It

```bash
pnpm dev
```

Visit http://localhost:3000/login and click "Sign in with Auth0"

## Production Deployment

Add these callback URLs in Auth0:

```
https://yourdomain.com/api/auth/callback/auth0
https://yourdomain.com
```

Set the same environment variables in your deployment platform.

## Disable Auth0

To disable Auth0 UI (keep credentials auth only):

```bash
NEXT_PUBLIC_AUTH0_ENABLED=false
# or remove the variable entirely
```

## Common Issues

**"Callback URL mismatch"**
- Verify callback URL in Auth0 matches exactly: `http://localhost:3000/api/auth/callback/auth0`

**Auth0 button not showing**
- Ensure `NEXT_PUBLIC_AUTH0_ENABLED=true` is set
- Restart your dev server after adding env vars

**Need help?**
See the full guide: [AUTH0_SETUP.md](AUTH0_SETUP.md)
