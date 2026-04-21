# Auth0 Configuration Reference

## Overview

Complete reference for all Auth0 configuration options and environment variables.

## Environment Variables

### Required Variables (Server-Side)

#### `AUTH_SECRET`
- **Type:** String
- **Required:** Yes (for all NextAuth.js)
- **Description:** Secret key for encrypting session tokens
- **Generation:** 
  ```bash
  openssl rand -base64 32
  ```
  Or visit: https://generate-secret.vercel.app/32
- **Example:** `AUTH_SECRET=dGhpc2lzYXNlY3JldGtleWZvcm5leHRhdXRo`
- **Security:** Keep secret, never commit to git

#### `AUTH_AUTH0_ID`
- **Type:** String
- **Required:** For Auth0 to work
- **Description:** Auth0 Application Client ID
- **Where to find:** Auth0 Dashboard → Applications → Your App → Settings
- **Example:** `AUTH_AUTH0_ID=a1b2c3d4e5f6g7h8i9j0`
- **Notes:** Public identifier, specific to your Auth0 application

#### `AUTH_AUTH0_SECRET`
- **Type:** String
- **Required:** For Auth0 to work
- **Description:** Auth0 Application Client Secret
- **Where to find:** Auth0 Dashboard → Applications → Your App → Settings
- **Example:** `AUTH_AUTH0_SECRET=xYz123AbC456DeF789GhI012JkL345MnO678PqR901`
- **Security:** Keep secret, never expose in client-side code

#### `AUTH_AUTH0_ISSUER`
- **Type:** URL
- **Required:** For Auth0 to work
- **Description:** Your Auth0 tenant domain
- **Format:** `https://{your-domain}.auth0.com` or `https://{your-domain}.{region}.auth0.com`
- **Example:** `AUTH_AUTH0_ISSUER=https://my-app.us.auth0.com`
- **Notes:** Must match your Auth0 tenant exactly

### Required Variables (Client-Side)

#### `NEXT_PUBLIC_AUTH0_ENABLED`
- **Type:** String (boolean)
- **Required:** To show Auth0 UI
- **Description:** Feature flag to enable/disable Auth0 buttons
- **Accepted values:** `"true"`, `"false"`, or undefined
- **Example:** `NEXT_PUBLIC_AUTH0_ENABLED=true`
- **Default:** Auth0 buttons hidden if not set
- **Notes:** Must prefix with `NEXT_PUBLIC_` to be accessible in browser

### Optional Variables

#### `NEXTAUTH_URL`
- **Type:** URL
- **Required:** No (auto-detected in development)
- **Description:** Full URL of your application
- **Example:** `NEXTAUTH_URL=https://myapp.com`
- **When needed:** Production deployments, custom domains
- **Default:** `http://localhost:3000` in development

## Auth0 Dashboard Configuration

### Application Settings

#### Basic Information

**Application Type:** Regular Web Application
- Why: Next.js is a server-rendered web application
- Other options: Single Page Application, Native, Machine to Machine

**Name:** Your choice
- Example: "AI Chatbot - Production"
- Recommendation: Include environment (Dev, Staging, Production)

**Domain:** Assigned by Auth0
- Example: `my-app.us.auth0.com`
- Cannot be changed without creating new tenant

#### Application URIs

**Allowed Callback URLs:** (Required)
```
http://localhost:3000/api/auth/callback/auth0
https://yourdomain.com/api/auth/callback/auth0
```
- Format: `{APP_URL}/api/auth/callback/auth0`
- Multiple URLs: Comma-separated
- Must be exact match (no wildcards)
- Include all environments (dev, staging, production)

**Allowed Logout URLs:** (Required)
```
http://localhost:3000
https://yourdomain.com
```
- Where users are redirected after logout
- Should be your home page or login page
- Multiple URLs: Comma-separated

**Allowed Web Origins:** (Recommended)
```
http://localhost:3000
https://yourdomain.com
```
- For CORS when using Auth0.js (optional for NextAuth)
- Include if you use Auth0 SDK directly

**Allowed Origins (CORS):** (Optional)
```
http://localhost:3000
https://yourdomain.com
```
- For cross-origin requests
- Usually not needed for NextAuth.js

#### Advanced Settings

**Grant Types:** (Auto-configured)
- ✅ Authorization Code
- ✅ Refresh Token
- ❌ Implicit (not needed)
- ❌ Password (not used)

**Token Endpoint Authentication Method:**
- Recommended: `Post`
- Alternative: `Basic`

**ID Token Expiration:**
- Default: 36000 seconds (10 hours)
- Recommendation: Keep default or reduce for higher security

**Refresh Token Rotation:**
- ✅ Enable (recommended)
- Provides better security

**Refresh Token Expiration:**
- Default: 2592000 seconds (30 days)
- Adjust based on security requirements

### Connections

Enable authentication methods:

**Database Connections:**
- ✅ Username-Password-Authentication (default)
- Configure password policies
- Enable email verification

**Social Connections:**
- ☐ Google
- ☐ GitHub  
- ☐ Microsoft
- ☐ Facebook
- ☐ Twitter
- And many more...

**Enterprise Connections:**
- SAML
- OpenID Connect
- Active Directory
- Azure AD

### Rules & Actions (Optional)

**Email Verification Rule:**
```javascript
function emailVerification(user, context, callback) {
  if (!user.email_verified) {
    return callback(
      new UnauthorizedError('Please verify your email before logging in.')
    );
  }
  callback(null, user, context);
}
```

**Add Custom Claims:**
```javascript
function addClaims(user, context, callback) {
  const namespace = 'https://myapp.com/';
  context.idToken[namespace + 'user_metadata'] = user.user_metadata;
  callback(null, user, context);
}
```

### Branding

**Universal Login:**
- Customize login page
- Add logo
- Change colors
- Custom CSS

**Email Templates:**
- Verification email
- Welcome email
- Password reset
- Blocked account

## NextAuth.js Configuration

### Provider Configuration

Location: `app/(auth)/auth.ts`

```typescript
Auth0({
  clientId: process.env.AUTH_AUTH0_ID,
  clientSecret: process.env.AUTH_AUTH0_SECRET,
  issuer: process.env.AUTH_AUTH0_ISSUER,
  // Optional additional configuration:
  authorization: {
    params: {
      scope: 'openid email profile',
      // Add custom scopes
    },
  },
  // Request specific profile fields
  profile(profile) {
    return {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      image: profile.picture,
    };
  },
})
```

### Callback Configuration

**JWT Callback:**
```typescript
async jwt({ token, user, account, profile }) {
  if (account?.provider === 'auth0' && profile?.email) {
    // Handle Auth0 login
    // Create/link user account
    // Set token properties
  }
  return token;
}
```

**Session Callback:**
```typescript
async session({ session, token }) {
  if (session.user) {
    session.user.id = token.id;
    session.user.type = token.type;
  }
  return session;
}
```

## Feature Flags

### `NEXT_PUBLIC_AUTH0_ENABLED`

**Purpose:** Control Auth0 UI visibility without code changes

**How it works:**
```tsx
{process.env.NEXT_PUBLIC_AUTH0_ENABLED === 'true' && (
  <Button onClick={signInWithAuth0}>
    Sign in with Auth0
  </Button>
)}
```

**Use cases:**
- Gradual rollout
- A/B testing
- Temporary disable
- Environment-specific features

## Security Configuration

### HTTPS Requirements

**Development:**
- HTTP allowed: `http://localhost:3000`

**Production:**
- HTTPS required: `https://yourdomain.com`
- Auth0 enforces HTTPS for production

### Cookie Settings

**NextAuth.js cookies (auto-configured):**
```typescript
cookies: {
  sessionToken: {
    name: '__Secure-next-auth.session-token',
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    },
  },
}
```

### CORS Settings

If needed, configure in `next.config.ts`:
```typescript
async headers() {
  return [
    {
      source: '/api/auth/:path*',
      headers: [
        { key: 'Access-Control-Allow-Credentials', value: 'true' },
        { key: 'Access-Control-Allow-Origin', value: 'https://yourdomain.com' },
      ],
    },
  ];
}
```

## Database Configuration

### User Table Schema

Required fields for Auth0 users:

```sql
CREATE TABLE "User" (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),  -- Nullable for Auth0 users
  created_at TIMESTAMP DEFAULT NOW()
);
```

### User Creation Logic

When Auth0 user logs in:
1. Check if user exists by email
2. If not, create user with:
   - Email from Auth0 profile
   - Random UUID as password (not used)
   - User type: 'regular'

## Deployment Configurations

### Vercel Deployment

**Environment Variables:**
1. Go to Vercel Dashboard
2. Select your project
3. Settings → Environment Variables
4. Add all required variables
5. Select environments (Production, Preview, Development)

**Automatic Detection:**
- Vercel auto-detects Next.js
- NextAuth.js works out of the box
- No special configuration needed

### Docker Deployment

**Dockerfile considerations:**
```dockerfile
ENV AUTH_SECRET=${AUTH_SECRET}
ENV AUTH_AUTH0_ID=${AUTH_AUTH0_ID}
ENV AUTH_AUTH0_SECRET=${AUTH_AUTH0_SECRET}
ENV AUTH_AUTH0_ISSUER=${AUTH_AUTH0_ISSUER}
ENV NEXT_PUBLIC_AUTH0_ENABLED=true
```

**Docker Compose:**
```yaml
environment:
  - AUTH_SECRET=${AUTH_SECRET}
  - AUTH_AUTH0_ID=${AUTH_AUTH0_ID}
  - AUTH_AUTH0_SECRET=${AUTH_AUTH0_SECRET}
  - AUTH_AUTH0_ISSUER=${AUTH_AUTH0_ISSUER}
  - NEXT_PUBLIC_AUTH0_ENABLED=true
```

### Other Platforms

**Netlify, Railway, Render:**
- Add environment variables in platform dashboard
- Ensure HTTPS callback URLs
- Set `NEXTAUTH_URL` explicitly

## Monitoring Configuration

### Auth0 Logs

**Enable in Auth0 Dashboard:**
1. Monitoring → Logs
2. View real-time authentication events
3. Filter by success/failure
4. Export logs if needed

**Log Retention:**
- Free: 2 days
- Developer: 10 days  
- Professional: 30 days
- Enterprise: Custom

### Auth0 Extensions

**Useful extensions:**
- Auth0 Logs to External Services
- Real-time Webtask Logs
- User Import/Export

## Advanced Configuration

### Custom Domain (Auth0 Feature)

**Setup:**
1. Auth0 Dashboard → Branding → Custom Domains
2. Add your domain: `auth.yourdomain.com`
3. Configure DNS (CNAME)
4. Verify domain
5. Update `AUTH_AUTH0_ISSUER` to custom domain

**Benefits:**
- Branded login experience
- No "auth0.com" in URL
- Better user trust

### Multi-Factor Authentication (MFA)

**Enable:**
1. Security → Multi-factor Auth
2. Choose factors (SMS, Email, Authenticator)
3. Configure policies (Always, Never, Adaptive)

**Integration:**
- Works automatically with Auth0 provider
- No code changes needed
- Users prompted for MFA during login

### Session Configuration

**NextAuth.js session options:**
```typescript
session: {
  strategy: 'jwt',  // Use JWT tokens
  maxAge: 30 * 24 * 60 * 60,  // 30 days
  updateAge: 24 * 60 * 60,  // Update every 24 hours
}
```

## Configuration Checklist

### Development Setup
- [ ] `AUTH_SECRET` generated and set
- [ ] Auth0 application created
- [ ] `AUTH_AUTH0_ID` copied from Auth0
- [ ] `AUTH_AUTH0_SECRET` copied from Auth0
- [ ] `AUTH_AUTH0_ISSUER` set correctly
- [ ] `NEXT_PUBLIC_AUTH0_ENABLED=true`
- [ ] Callback URL: `http://localhost:3000/api/auth/callback/auth0`
- [ ] Database configured
- [ ] Dev server starts without errors

### Production Setup
- [ ] Separate Auth0 application for production
- [ ] Production callback URLs configured
- [ ] All env vars set in hosting platform
- [ ] `NEXTAUTH_URL` set to production URL
- [ ] HTTPS enabled
- [ ] Email verification enabled (recommended)
- [ ] MFA configured (recommended)
- [ ] Custom domain configured (optional)
- [ ] Monitoring set up
- [ ] Tested end-to-end

## Troubleshooting Configuration Issues

### "Callback URL mismatch"
**Check:**
- Exact URL match in Auth0 Dashboard
- No trailing slash differences
- HTTP vs HTTPS
- Port number (in development)

### "Invalid issuer"
**Check:**
- `AUTH_AUTH0_ISSUER` format: `https://{domain}.auth0.com`
- Matches your Auth0 tenant
- No typos
- Region included if applicable (e.g., `.us.auth0.com`)

### "Client authentication failed"
**Check:**
- `AUTH_AUTH0_SECRET` is correct
- Not using Client ID instead of Secret
- Secret hasn't been rotated in Auth0

### Environment variables not loading
**Solutions:**
- Restart dev server after changes
- Check `.env` file location (project root)
- Verify file is named exactly `.env`
- Check for syntax errors in `.env`
- Use `NEXT_PUBLIC_` prefix for client-side vars

## Reference Links

- [Auth0 Dashboard](https://manage.auth0.com/)
- [Auth0 Documentation](https://auth0.com/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [NextAuth.js Auth0 Provider](https://next-auth.js.org/providers/auth0)
- [Environment Variables in Next.js](https://nextjs.org/docs/basic-features/environment-variables)

## Support

For configuration questions:
1. Review this reference guide
2. Check Auth0 Dashboard settings
3. Verify all environment variables
4. Test with minimal configuration first
5. Add features incrementally
