# Auth0 Architecture & Flow Diagrams

## Authentication Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                            │
│  ┌──────────────────────┐      ┌──────────────────────┐        │
│  │   Login Page         │      │   Register Page      │        │
│  │  (/login)            │      │  (/register)         │        │
│  │                      │      │                      │        │
│  │  • Email/Password    │      │  • Email/Password    │        │
│  │  • Auth0 Button      │      │  • Auth0 Button      │        │
│  │  • Guest Login       │      │  • Guest Login       │        │
│  └──────────────────────┘      └──────────────────────┘        │
└────────────────┬────────────────────────┬───────────────────────┘
                 │                        │
                 ▼                        ▼
┌────────────────────────────────────────────────────────────────┐
│                    NextAuth.js Layer                            │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │           Authentication Providers                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │ │
│  │  │ Credentials  │  │    Auth0     │  │    Guest     │   │ │
│  │  │   Provider   │  │   Provider   │  │   Provider   │   │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              Session Management                            │ │
│  │  • JWT Token Creation                                     │ │
│  │  • Session Cookie Handling                                │ │
│  │  • User Type Assignment                                   │ │
│  └───────────────────────────────────────────────────────────┘ │
└────────────────┬───────────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────────┐
│                    Database Layer                               │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  PostgreSQL Database (Vercel Postgres)                    │ │
│  │  • User Records                                           │ │
│  │  • Chat History                                           │ │
│  │  • Session Data                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                    External Services                            │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Auth0 (Optional OAuth Provider)                          │ │
│  │  • User Authentication                                    │ │
│  │  • OAuth 2.0 Flow                                        │ │
│  │  • Social Connections                                     │ │
│  │  • MFA Support                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

## Auth0 Authentication Flow

### Step-by-Step Flow Diagram

```
┌──────────┐
│  User    │
└────┬─────┘
     │
     │ 1. Navigates to /login
     ▼
┌──────────────────────────┐
│   Login Page             │
│  [Sign in with Auth0]    │
└────┬─────────────────────┘
     │
     │ 2. Clicks Auth0 Button
     ▼
┌──────────────────────────┐
│  signInWithAuth0()       │
│  Server Action           │
└────┬─────────────────────┘
     │
     │ 3. Calls NextAuth signIn('auth0')
     ▼
┌──────────────────────────┐
│  NextAuth.js             │
│  • Generates state       │
│  • Creates redirect URL  │
└────┬─────────────────────┘
     │
     │ 4. Redirects to Auth0
     ▼
┌──────────────────────────────────┐
│  Auth0 Login Page                │
│  https://domain.auth0.com        │
│  • Shows login form              │
│  • Social connection options     │
│  • MFA if enabled                │
└────┬─────────────────────────────┘
     │
     │ 5. User enters credentials
     ▼
┌──────────────────────────────────┐
│  Auth0 Processing                │
│  • Validates credentials         │
│  • Generates tokens              │
│  • Creates authorization code    │
└────┬─────────────────────────────┘
     │
     │ 6. Redirects with auth code
     ▼
┌──────────────────────────────────┐
│  /api/auth/callback/auth0        │
│  NextAuth Callback Handler       │
└────┬─────────────────────────────┘
     │
     │ 7. Exchanges code for tokens
     ▼
┌──────────────────────────────────┐
│  NextAuth.js                     │
│  • Validates tokens              │
│  • Calls JWT callback            │
│  • Creates session               │
└────┬─────────────────────────────┘
     │
     │ 8. JWT Callback
     ▼
┌──────────────────────────────────┐
│  JWT Callback (auth.ts)          │
│  • Sets user.id                  │
│  • Sets user.type = 'regular'    │
│  • Stores in JWT token           │
└────┬─────────────────────────────┘
     │
     │ 9. Session Callback
     ▼
┌──────────────────────────────────┐
│  Session Callback (auth.ts)      │
│  • Adds id to session.user       │
│  • Adds type to session.user     │
└────┬─────────────────────────────┘
     │
     │ 10. Redirects to home
     ▼
┌──────────────────────────────────┐
│  Home Page (/)                   │
│  • User is authenticated         │
│  • Session cookie set            │
│  • Access to chat interface      │
└──────────────────────────────────┘
```

## Environment Configuration Flow

### Development Environment

```
.env.local
├── AUTH_SECRET=************
├── AUTH_AUTH0_ID=your_client_id
├── AUTH_AUTH0_SECRET=your_client_secret
├── AUTH_AUTH0_ISSUER=https://your-domain.auth0.com
└── NEXT_PUBLIC_AUTH0_ENABLED=true
     │
     ├─→ Server Side (auth.ts)
     │   • Loads Auth0 provider if credentials exist
     │   • Configures OAuth endpoints
     │   • Sets up callbacks
     │
     └─→ Client Side (login/register pages)
         • Shows/hides Auth0 button
         • Conditional rendering based on flag
```

### Production Environment (Vercel)

```
Vercel Dashboard
├── Environment Variables
│   ├── AUTH_SECRET (Production)
│   ├── AUTH_AUTH0_ID (Production)
│   ├── AUTH_AUTH0_SECRET (Production)
│   ├── AUTH_AUTH0_ISSUER (Production)
│   └── NEXT_PUBLIC_AUTH0_ENABLED (Production)
│
└── Build Process
    ├── Next.js build
    ├── Environment variables injected
    └── Static pages generated with flags
```

## Provider Selection Logic

```
User Action → NextAuth Provider Selection

┌─────────────────────────────────────────┐
│  User on Login Page                     │
└────┬────────────────────────────────────┘
     │
     ├─→ Enters Email/Password + Submit
     │   │
     │   └─→ Credentials Provider
     │       • Validates against database
     │       • Checks bcrypt hash
     │       • Creates session
     │
     ├─→ Clicks "Continue as Guest"
     │   │
     │   └─→ Guest Provider (Credentials)
     │       • Creates temporary user
     │       • Assigns guest type
     │       • Limited session
     │
     └─→ Clicks "Sign in with Auth0"
         │
         └─→ Auth0 Provider
             • OAuth 2.0 flow
             • External authentication
             • Returns user profile
             • Creates/updates user
```

## Session Data Structure

### After Successful Auth0 Login

```javascript
// JWT Token (Encrypted)
{
  id: "user_id_from_auth0",
  type: "regular",
  email: "user@example.com",
  name: "John Doe",
  picture: "https://...",
  iat: 1234567890,
  exp: 1234567890,
  jti: "..."
}

// Session Object (Available in Client)
{
  user: {
    id: "user_id_from_auth0",
    type: "regular",
    email: "user@example.com",
    name: "John Doe",
    image: "https://..."
  },
  expires: "2024-..."
}
```

## Security Flow

```
┌─────────────────────────────────────────────────────────┐
│  Security Layers                                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Client Side                                         │
│     • HTTPS Only (Production)                           │
│     • Secure Cookies (httpOnly, sameSite)              │
│     • CSRF Token Validation                            │
│                                                         │
│  2. NextAuth.js                                        │
│     • State Parameter Validation                       │
│     • Callback URL Verification                        │
│     • Token Signature Verification                     │
│     • Session Token Encryption                         │
│                                                         │
│  3. Auth0                                              │
│     • OAuth 2.0 Protocol                               │
│     • Callback URL Whitelist                           │
│     • Token Expiration                                 │
│     • Optional MFA                                     │
│     • Rate Limiting                                    │
│                                                         │
│  4. Database                                           │
│     • SQL Injection Prevention (Drizzle ORM)           │
│     • Password Hashing (bcrypt)                        │
│     • Secure Connection (SSL)                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
Authentication Error Occurs
│
├─→ Callback URL Mismatch
│   └─→ Auth0 Error Page
│       • User sees error
│       • Admin checks Auth0 config
│       • Fix callback URL in Auth0 Dashboard
│
├─→ Invalid State Parameter
│   └─→ NextAuth Validation Fails
│       • User redirected to login
│       • Error toast shown
│       • User can retry
│
├─→ Token Validation Failure
│   └─→ NextAuth Rejects Token
│       • Session not created
│       • User redirected to login
│       • Check AUTH_SECRET matches
│
└─→ Network Error
    └─→ Timeout/Connection Failed
        • Error caught by client
        • Retry option shown
        • Fallback to credentials login
```

## Feature Flag Logic

```
NEXT_PUBLIC_AUTH0_ENABLED Environment Variable
│
├─→ true or "true"
│   └─→ Show Auth0 UI Components
│       • "Sign in with Auth0" button visible
│       • "Sign up with Auth0" button visible
│       • Visual separator shown
│
├─→ false or "false" or undefined
│   └─→ Hide Auth0 UI Components
│       • Only credentials form shown
│       • No visual separator
│       • Auth0 backend still works if configured
│
└─→ Backend Configuration (Separate)
    │
    └─→ AUTH_AUTH0_ID + AUTH_AUTH0_SECRET + AUTH_AUTH0_ISSUER
        │
        ├─→ All Set: Auth0 provider loaded
        └─→ Missing: Auth0 provider skipped
```

## Database Interaction

```
Auth0 Login Success
│
└─→ Check if user exists in database
    │
    ├─→ User Exists
    │   └─→ Load existing user record
    │       • Return user ID
    │       • Create session
    │
    └─→ User Doesn't Exist
        └─→ Create new user record
            • Insert into users table
            • Store email from Auth0
            • Set type = 'regular'
            • Return new user ID
            • Create session
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Production Deployment (Vercel)                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Edge Network                                          │
│  ├─→ Next.js Application                              │
│  │   ├─→ Server Components                            │
│  │   ├─→ API Routes                                   │
│  │   └─→ Middleware                                   │
│  │                                                     │
│  └─→ Environment Variables (Encrypted)                │
│      ├─→ AUTH_SECRET                                  │
│      ├─→ AUTH_AUTH0_ID                                │
│      ├─→ AUTH_AUTH0_SECRET                            │
│      ├─→ AUTH_AUTH0_ISSUER                            │
│      └─→ NEXT_PUBLIC_AUTH0_ENABLED                    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  External Services                                      │
│  ├─→ Auth0 (auth.your-domain.com)                     │
│  ├─→ PostgreSQL (Vercel/Neon)                         │
│  └─→ Blob Storage (Vercel)                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Monitoring & Logging

```
Authentication Events
│
├─→ Successful Login
│   └─→ Logged in Auth0 Dashboard
│       • Timestamp
│       • User email
│       • Connection type
│       • IP address
│       • User agent
│
├─→ Failed Login
│   └─→ Logged in Auth0 Dashboard
│       • Failure reason
│       • Timestamp
│       • IP address
│       • Attempt count
│
└─→ Session Activity
    └─→ Tracked in Application
        • Session creation
        • Session expiration
        • User actions
```

This architecture ensures secure, scalable, and maintainable authentication with Auth0 integration.
