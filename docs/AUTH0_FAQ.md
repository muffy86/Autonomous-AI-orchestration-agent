# Auth0 Integration - Frequently Asked Questions (FAQ)

## General Questions

### Q: What is Auth0?

**A:** Auth0 is a flexible, drop-in solution to add authentication and authorization services to your applications. It allows users to log in using various methods including social logins (Google, GitHub, etc.), enterprise connections, or traditional username/password.

### Q: Why should I use Auth0 with this chatbot?

**A:** Auth0 provides several benefits:
- **Easy social login**: Users can sign in with Google, GitHub, etc.
- **Security**: Enterprise-grade security managed by Auth0
- **MFA support**: Add multi-factor authentication easily
- **User management**: Centralized user management dashboard
- **No password management**: Offload password security to Auth0
- **Scalability**: Handle millions of users

### Q: Is Auth0 required to use the chatbot?

**A:** No, Auth0 is completely optional. The chatbot works fine with the built-in email/password authentication and guest mode. Auth0 just provides additional login options.

### Q: Is Auth0 free?

**A:** Auth0 offers a free tier that includes:
- Up to 7,000 active users
- Unlimited logins
- 2 social identity providers
- Basic authentication features

For more users or features, paid plans are available. Check [Auth0 Pricing](https://auth0.com/pricing).

## Setup & Configuration

### Q: How long does Auth0 setup take?

**A:** Approximately 5-10 minutes for basic setup:
- 2 minutes to create Auth0 account
- 3 minutes to configure application
- 2 minutes to set environment variables
- 3 minutes to test

See [Quick Start Guide](AUTH0_QUICK_START.md) for step-by-step instructions.

### Q: Can I use Auth0 in development without deploying?

**A:** Yes! Auth0 works perfectly in local development. Just use `http://localhost:3000/api/auth/callback/auth0` as your callback URL in Auth0 Dashboard.

### Q: Do I need separate Auth0 applications for dev and production?

**A:** It's recommended but not required. Best practice:
- Development: "My App - Dev" with localhost callback URLs
- Production: "My App - Prod" with production callback URLs

This keeps environments isolated and prevents confusion.

### Q: What if I don't set environment variables?

**A:** If Auth0 environment variables are missing:
- Auth0 provider won't load (safe fallback)
- Auth0 buttons won't show (if `NEXT_PUBLIC_AUTH0_ENABLED` not set)
- Email/password and guest login still work normally
- No errors or crashes

## Authentication

### Q: Can users log in with both email/password AND Auth0?

**A:** Yes! If they use the same email address, they'll access the same account. The system automatically links accounts by email.

Example:
1. User registers with `user@example.com` + password
2. Later, user logs in with Google (same email)
3. They access the same account with all their chat history

### Q: What happens when a user logs in with Auth0 for the first time?

**A:** The system automatically:
1. Receives user email from Auth0
2. Checks if an account with that email exists
3. If not, creates a new account
4. Logs the user in
5. User can immediately use the chatbot

No separate registration needed!

### Q: Can I use multiple social logins (Google, GitHub, etc.)?

**A:** Yes! Enable multiple social connections in Auth0 Dashboard. Users can log in with any enabled provider. If they use the same email across providers, they'll access the same account.

### Q: What if a user has different emails on Google vs GitHub?

**A:** They would create/access different accounts for each email. The system treats each unique email as a separate user.

### Q: Can guest users convert to Auth0 users?

**A:** Currently, guest accounts and Auth0 accounts are separate. Guest data is not automatically migrated. This could be a future enhancement.

### Q: How do I logout?

**A:** Use the logout button in the application. This:
1. Clears your session in the app
2. Logs you out of Auth0
3. Redirects you to the login page

Note: You may still be logged into Google/GitHub/etc. separately.

## Security

### Q: Is Auth0 login secure?

**A:** Yes, Auth0 uses industry-standard OAuth 2.0 protocol with:
- Encrypted tokens
- Secure callback validation
- HTTPS-only in production
- State parameter for CSRF protection
- Industry best practices

### Q: Should I enable email verification?

**A:** Highly recommended for production! Email verification ensures users actually own the email address they're using. Without it, someone could potentially create an account with an email they don't own.

Enable in: Auth0 Dashboard → Authentication → Database → Requires Email Verification

### Q: Can I add multi-factor authentication (MFA)?

**A:** Yes! Auth0 supports MFA out of the box:
1. Go to Auth0 Dashboard → Security → Multi-factor Auth
2. Enable MFA
3. Choose factors: SMS, Email, Authenticator App
4. Users will be prompted for MFA during login

No code changes needed in the chatbot!

### Q: Are passwords stored securely?

**A:** For Auth0 users, passwords are NOT stored in the chatbot database. Auth0 handles all password storage securely. For email/password users, passwords are hashed with bcrypt before storage.

### Q: What data does Auth0 share with the app?

**A:** By default, Auth0 shares:
- Email address
- Name (if available)
- Profile picture (if available)
- Email verification status

You can request additional scopes if needed.

### Q: Can I customize what user data is stored?

**A:** Yes, you can modify the JWT callback in `app/(auth)/auth.ts` to store additional profile data from Auth0.

## Troubleshooting

### Q: I see "Callback URL mismatch" error. What do I do?

**A:** This means the callback URL in your Auth0 Dashboard doesn't match where you're redirecting:

1. Check Auth0 Dashboard → Applications → Your App → Settings
2. In "Allowed Callback URLs", verify you have exactly:
   - Development: `http://localhost:3000/api/auth/callback/auth0`
   - Production: `https://yourdomain.com/api/auth/callback/auth0`
3. No trailing slashes
4. Check http vs https
5. Save changes and try again

### Q: The Auth0 button doesn't show. Why?

**A:** Checklist:
- [ ] Is `NEXT_PUBLIC_AUTH0_ENABLED=true` set?
- [ ] Did you restart the dev server after setting it?
- [ ] Check browser console for errors
- [ ] Verify you're on the login or register page

Remember: Environment variable changes require a server restart!

### Q: I get "Invalid state parameter" error.

**A:** Solutions:
1. Clear browser cookies
2. Verify `AUTH_SECRET` is set in `.env`
3. Restart development server
4. Try in incognito/private browsing mode
5. Check for browser extensions that might interfere

### Q: "User not created in database" - what's wrong?

**A:** Check:
- Database connection working? (verify `POSTGRES_URL`)
- Auth0 provides email in profile? (some providers might not)
- Check server logs for detailed error messages
- Ensure database migrations have run

### Q: Can't log in after changing Auth0 settings.

**A:** Try:
1. Clear all browser cookies
2. Restart development server
3. Log out of Auth0 completely
4. Try again in incognito mode
5. Check Auth0 Dashboard logs for specific errors

## Features & Functionality

### Q: Can I customize the Auth0 login page?

**A:** Yes! Auth0 provides customization:
1. Go to Auth0 Dashboard → Branding → Universal Login
2. Customize:
   - Logo
   - Colors
   - Background
   - Custom CSS
   - Custom HTML (advanced)

### Q: Can I add more social login providers?

**A:** Absolutely! Auth0 supports 30+ providers:
- Google
- GitHub
- Microsoft
- Facebook
- Twitter/X
- LinkedIn
- Apple
- And many more...

Enable in: Auth0 Dashboard → Authentication → Social

### Q: How do I disable Auth0 temporarily?

**A:** Two options:

**Option 1: Hide UI only** (keep backend functional)
```bash
NEXT_PUBLIC_AUTH0_ENABLED=false
```

**Option 2: Completely disable**
- Remove all `AUTH_AUTH0_*` environment variables
- Restart server

### Q: Can I use Auth0 with custom domains?

**A:** Yes! Auth0 supports custom domains (paid feature):
- Instead of `your-tenant.auth0.com`
- Use `auth.yourdomain.com`
- Better branding and user trust

Configure in: Auth0 Dashboard → Branding → Custom Domains

### Q: Does Auth0 work with mobile apps?

**A:** The web chatbot works in mobile browsers. For native mobile apps, Auth0 has dedicated SDKs for iOS and Android, but that would require separate integration.

## Performance & Scalability

### Q: Does Auth0 slow down login?

**A:** There's minimal overhead:
- Redirect to Auth0: < 200ms
- Auth0 login page: < 2s (depends on Auth0 infrastructure)
- Callback processing: < 500ms
- Total: Usually under 5 seconds

Users only notice the Auth0 login page load time.

### Q: How many users can Auth0 handle?

**A:** Auth0 is designed for scale:
- Free tier: 7,000 active users
- Paid tiers: Millions of users
- Used by companies like Atlassian, Mazda, AMD

Your database and application might become the bottleneck before Auth0 does.

### Q: Will Auth0 affect my app's performance?

**A:** Minimal impact:
- OAuth flow only happens during login
- Session managed by NextAuth.js locally
- No Auth0 API calls for regular requests
- Tokens cached in browser cookies

## Billing & Pricing

### Q: What counts as an "active user" in Auth0?

**A:** A user who logs in at least once per month. If a user logs in multiple times in a month, they only count as one active user.

### Q: What happens if I exceed the free tier limit?

**A:** Auth0 will notify you. Options:
- Upgrade to paid plan
- Some grace period may be provided
- In extreme cases, new logins might be blocked

Check [Auth0 Pricing](https://auth0.com/pricing) for details.

### Q: Can I use Auth0 for free forever?

**A:** Yes, if you stay under 7,000 active users per month. The free tier is permanent and fully functional.

## Migration & Integration

### Q: I already have users with email/password. Can I add Auth0?

**A:** Yes! Existing users can continue using email/password. They can also start using Auth0 with the same email to access their account. Completely backwards compatible.

### Q: How do I migrate from another auth provider to Auth0?

**A:** Two approaches:

**Gradual migration:**
- Add Auth0 alongside current auth
- Users can switch voluntarily
- Accounts linked by email automatically

**Bulk migration:**
- Export users from current provider
- Import to Auth0 (Auth0 provides import tools)
- Update environment variables
- Test thoroughly

### Q: Can I use Auth0 with other Next.js authentication solutions?

**A:** This integration uses NextAuth.js which manages all authentication. You could theoretically use Auth0 SDK directly, but it would require significant changes and isn't recommended.

## Development & Testing

### Q: How do I test Auth0 without affecting production?

**A:** Best practices:
1. Create separate Auth0 application for testing
2. Use different callback URLs (localhost vs production)
3. Use test social accounts
4. Test with disposable email addresses

### Q: Can I automate Auth0 login testing?

**A:** Yes, with some limitations:
- Use Playwright/Cypress for E2E tests
- May need test credentials
- Social login automation can be complex
- Auth0 provides test tenants for automation

See [Testing Guide](AUTH0_TESTING_GUIDE.md) for examples.

### Q: How do I debug Auth0 issues?

**A:** Debugging checklist:
1. Check Auth0 Dashboard → Monitoring → Logs
2. Enable browser console (look for errors)
3. Check server logs (for JWT callback errors)
4. Use Auth0 Debugger extension
5. Review [Troubleshooting section](AUTH0_SETUP.md#troubleshooting)

## Compliance & Legal

### Q: Is Auth0 GDPR compliant?

**A:** Yes, Auth0 is GDPR compliant and provides:
- Data processing agreements
- User data export/deletion
- Privacy controls
- EU data centers

See [Auth0 GDPR](https://auth0.com/gdpr) for details.

### Q: Where is user data stored?

**A:** Auth0 allows choosing data region:
- US (default)
- EU
- Australia
- Other regions

User data in the chatbot database is stored wherever your PostgreSQL database is hosted (e.g., Vercel Postgres, Neon, etc.).

### Q: Can users delete their Auth0 data?

**A:** Yes, users can:
- Delete their account in your app (removes from your database)
- Contact Auth0 directly for Auth0-stored data
- You can implement user deletion via Auth0 Management API

## Advanced Topics

### Q: Can I use Auth0's Management API?

**A:** Yes! You can use Auth0's API to:
- Manage users programmatically
- Update user profiles
- Block/unblock users
- Get analytics
- And much more

Requires creating a Machine-to-Machine application in Auth0.

### Q: Can I add custom fields to user profiles?

**A:** Yes, two ways:

**In your database:**
- Add columns to User table
- Store additional data on login

**In Auth0:**
- Use user_metadata or app_metadata
- Access via Management API

### Q: How do I handle user roles/permissions?

**A:** Options:

**In your app:**
- Store roles in your database
- Check permissions in your code

**In Auth0:**
- Use Auth0 Authorization Extension
- Configure role-based access control (RBAC)
- Receive roles in ID token

### Q: Can I customize the OAuth flow?

**A:** Advanced customization is possible via:
- Auth0 Rules (JavaScript hooks)
- Auth0 Actions (modern replacement for Rules)
- Customize redirect flows
- Add custom claims to tokens

## Getting Help

### Q: Where can I get help with Auth0 integration?

**A:** Multiple resources:

1. **Documentation:**
   - [Quick Start](AUTH0_QUICK_START.md)
   - [Setup Guide](AUTH0_SETUP.md)
   - [Configuration Reference](AUTH0_CONFIGURATION_REFERENCE.md)

2. **Auth0 Resources:**
   - [Auth0 Documentation](https://auth0.com/docs)
   - [Auth0 Community Forum](https://community.auth0.com/)
   - Auth0 Support (paid plans)

3. **Project Resources:**
   - GitHub Issues
   - This FAQ
   - Testing Guide

### Q: I have a question not answered here. What do I do?

**A:** Please:
1. Check other documentation files in `docs/` folder
2. Search Auth0 documentation
3. Open a GitHub issue with your question
4. We'll update this FAQ with common questions

## Common Scenarios

### Q: User forgot their password (Auth0 login)

**A:** Auth0 handles password reset:
1. User clicks "Forgot Password" on Auth0 login page
2. Auth0 sends password reset email
3. User resets password through Auth0
4. No action needed in your app

### Q: User wants to change email address

**A:** Currently:
- Email/password users: Would need custom implementation
- Auth0 users: Can update in Auth0 account
- Note: Changing email creates/links to different account

Future enhancement: Allow email changes in user settings.

### Q: User wants to switch from email/password to Auth0

**A:** Simple! Just log in with Auth0 using the same email:
1. User has account with `user@example.com` + password
2. User clicks "Sign in with Auth0"
3. Logs in with Google (email: `user@example.com`)
4. Automatically accesses same account
5. Can now use either method to log in

### Q: User accidentally created duplicate accounts

**A:** If different emails were used:
- Two separate accounts exist
- Would need manual account merging (custom implementation)
- Future enhancement: Account merging tool

Prevention: Enable email verification to ensure users use their actual email.

---

## Still have questions?

1. Check other [documentation files](README.md)
2. Review [Auth0 documentation](https://auth0.com/docs)
3. Open a [GitHub issue](../../issues)
4. Contact support

This FAQ is updated regularly based on common questions. If your question helped improve this FAQ, thank you! 🙏
