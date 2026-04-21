# Auth0 Account Linking Guide

## Overview

This guide explains how Auth0 authentication interacts with existing email/password accounts in the AI Chatbot application.

## Current Behavior

### Scenario 1: New Auth0 User

**User logs in with Auth0 for the first time:**
1. Auth0 authenticates the user (e.g., via Google, GitHub, or Auth0 database)
2. Application receives user email from Auth0
3. System checks if email exists in database
4. If **not found**: New user account is created automatically
5. User is logged in and can use the chatbot

**Result:** New user account created, no conflicts.

### Scenario 2: Existing Email/Password User

**User has existing account with email/password, then logs in with Auth0:**
1. User previously registered with `user@example.com` using email/password
2. User clicks "Sign in with Auth0"
3. User authenticates via Auth0 (e.g., Google) using same email `user@example.com`
4. System finds existing user with that email
5. User is logged into their **existing account**

**Result:** Auth0 login works with existing account - accounts are automatically linked by email!

### Scenario 3: Different Auth0 Providers

**User logs in with different Auth0 social providers:**
1. User logs in with Google (`user@example.com`)
2. Account created/linked
3. Later, user logs in with GitHub (same email `user@example.com`)
4. System finds existing account by email
5. User accesses same account

**Result:** Multiple Auth0 providers can access the same account if they share an email.

## Email as Primary Identifier

The application uses **email as the unique identifier** for users. This means:

✅ **Benefits:**
- Seamless account linking
- Users can switch between authentication methods
- No duplicate accounts for same email
- Simple user experience

⚠️ **Considerations:**
- Email must be verified by Auth0 (see security section)
- Users with unverified emails could potentially access others' accounts
- Recommended to enable email verification in Auth0

## Security Best Practices

### 1. Enable Email Verification in Auth0

**Why:** Ensures users actually own the email address they're using.

**How to enable:**
1. Go to Auth0 Dashboard
2. Navigate to **Authentication** → **Database**
3. Select your database connection
4. Enable **Requires Email Verification**
5. Save changes

### 2. Configure Email Verification Rule

Create an Auth0 Rule to block unverified emails:

1. Go to **Auth Pipeline** → **Rules** (or **Actions**)
2. Create new rule: "Block Unverified Emails"
3. Add this code:

```javascript
function blockUnverifiedEmail(user, context, callback) {
  if (!user.email_verified) {
    return callback(
      new UnauthorizedError('Please verify your email before logging in.')
    );
  }
  return callback(null, user, context);
}
```

4. Save and enable the rule

### 3. Update Auth.ts for Email Verification (Optional)

For additional security, you can check email verification in the JWT callback:

```typescript
if (account?.provider === 'auth0' && profile?.email) {
  // Check if email is verified
  if (profile.email_verified === false) {
    throw new Error('Email not verified');
  }
  
  // Existing user creation/lookup logic...
}
```

## Preventing Account Conflicts

### Current Implementation

The current implementation **automatically links accounts by email**. This is generally safe when:
- Email verification is enabled in Auth0
- Social providers (Google, GitHub) already verify emails
- Users trust that their email is secure

### Alternative: Manual Account Linking

If you prefer users to explicitly link accounts, you can:

1. **Check if user exists before auto-linking**
2. **Prompt user to confirm account linking**
3. **Require password verification before linking**

Example implementation:

```typescript
// In auth.ts JWT callback
if (account?.provider === 'auth0' && profile?.email) {
  const email = profile.email as string;
  const existingUsers = await getUser(email);
  
  if (existingUsers.length > 0) {
    // User already exists with this email
    // Check if they have a password (email/password account)
    if (existingUsers[0].password) {
      // This is an existing email/password account
      // You could:
      // 1. Redirect to a linking confirmation page
      // 2. Send email notification
      // 3. Require additional verification
      
      // For now, we auto-link (current behavior)
      token.id = existingUsers[0].id;
    } else {
      // Existing Auth0 account, normal flow
      token.id = existingUsers[0].id;
    }
  } else {
    // New user, create account
    await createUser(email, generateUUID());
    const [newUser] = await getUser(email);
    token.id = newUser.id;
  }
  
  token.type = 'regular';
}
```

## Migration Scenarios

### Migrating from Email/Password to Auth0

**User wants to switch from email/password to Auth0:**

1. User has account with email/password
2. User clicks "Sign in with Auth0"
3. Uses same email via Auth0 (e.g., Google)
4. Automatically logged into existing account
5. User can now use Auth0 or email/password interchangeably

**No data loss** - all chat history, documents, etc. are preserved.

### Migrating from Guest to Auth0

**Guest user wants to create permanent account:**

Currently, guest accounts are separate. Future enhancement could include:
1. Guest user creates content
2. Guest user clicks "Sign in with Auth0"
3. System could migrate guest data to new Auth0 account
4. Guest session data transferred

This would require additional implementation.

## Account Security Matrix

| Scenario | Security Level | Notes |
|----------|---------------|-------|
| Auth0 with verified email | ✅ High | Email verified by Auth0/provider |
| Auth0 with unverified email | ⚠️ Medium | Enable email verification |
| Email/password | ✅ High | Password required, user-controlled |
| Guest account | ⚠️ Low | Temporary, no persistent auth |
| Linked accounts (same email) | ✅ High | If all emails verified |

## Frequently Asked Questions

### Q: Can a user have both email/password AND Auth0 login?

**A:** Yes! If they use the same email address, they access the same account. They can switch between authentication methods freely.

### Q: What happens if I change my email in Auth0?

**A:** The next time you log in, the system will use your new email. If an account with that email exists, you'll access that account. If not, a new account will be created.

### Q: Can I unlink my Auth0 account?

**A:** Currently, accounts are linked by email automatically. To "unlink", you would need to change the email address in either Auth0 or your email/password account to make them different.

### Q: What if I don't want automatic account linking?

**A:** You can modify the JWT callback in `app/(auth)/auth.ts` to implement custom linking logic, such as requiring confirmation before linking accounts.

### Q: Is my data secure when linking accounts?

**A:** Yes, as long as email verification is enabled in Auth0. This ensures only the actual email owner can access the account.

## Recommended Configuration

For production deployments, we recommend:

1. ✅ Enable email verification in Auth0
2. ✅ Use Auth0 Rules/Actions to block unverified emails
3. ✅ Configure social connections (Google, GitHub) which verify emails
4. ✅ Monitor Auth0 logs for suspicious activity
5. ✅ Enable MFA for additional security
6. ✅ Set up breach detection in Auth0

## Support

For questions about account linking:
1. Check this guide
2. Review Auth0 Dashboard logs
3. Test with a non-production email first
4. Contact support with specific scenarios

## Future Enhancements

Potential improvements for account linking:

- [ ] Explicit account linking confirmation page
- [ ] Email notification when account is accessed via new method
- [ ] Account settings page to view linked authentication methods
- [ ] Option to unlink authentication methods
- [ ] Guest account migration to permanent accounts
- [ ] Account merge functionality for users with multiple emails
