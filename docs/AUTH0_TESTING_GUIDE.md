# Auth0 Testing Guide

## Overview

This guide provides comprehensive testing procedures for the Auth0 authentication integration.

## Prerequisites

Before testing, ensure:
- [ ] Auth0 application created and configured
- [ ] Environment variables set in `.env`
- [ ] Callback URLs configured in Auth0 Dashboard
- [ ] Development server can start without errors

## Testing Environments

### Local Development

```bash
# Required environment variables
AUTH_SECRET=your_secret_here
AUTH_AUTH0_ID=your_client_id
AUTH_AUTH0_SECRET=your_client_secret
AUTH_AUTH0_ISSUER=https://your-domain.auth0.com
NEXT_PUBLIC_AUTH0_ENABLED=true
POSTGRES_URL=your_postgres_connection_string
```

### Test Auth0 Application

For testing, create a separate Auth0 application:
- Name: "AI Chatbot - Development"
- Callback URLs: `http://localhost:3000/api/auth/callback/auth0`
- Keep it separate from production

## Test Cases

### 1. Basic Auth0 Login Flow

**Objective:** Verify Auth0 authentication works end-to-end

**Steps:**
1. Start dev server: `pnpm dev`
2. Navigate to `http://localhost:3000/login`
3. Verify "Sign in with Auth0" button is visible
4. Click the button
5. Redirected to Auth0 login page
6. Enter credentials (or use social login)
7. Complete authentication
8. Redirected back to application

**Expected Results:**
- ✅ Redirect to Auth0 successful
- ✅ Auth0 login page loads
- ✅ After login, redirected to `http://localhost:3000`
- ✅ User is logged in (check session)
- ✅ Can access chat interface

**Failure Indicators:**
- ❌ "Callback URL mismatch" error
- ❌ "Invalid state" error
- ❌ Stuck on loading screen
- ❌ Not redirected after login

### 2. New User Registration

**Objective:** Verify automatic user creation for new Auth0 users

**Setup:**
- Use an email that doesn't exist in your database
- Or use a new social account

**Steps:**
1. Click "Sign in with Auth0"
2. Log in with new email/social account
3. Complete Auth0 authentication
4. Check database for new user record

**Expected Results:**
- ✅ New user record created in database
- ✅ User email matches Auth0 profile email
- ✅ User type is 'regular'
- ✅ User can immediately use chatbot features
- ✅ Chat history saves correctly

**Database Verification:**
```sql
SELECT id, email, password FROM "User" WHERE email = 'test@example.com';
```

Should show new user with:
- Valid UUID as password (not used for Auth0 login)
- Email from Auth0 profile

### 3. Existing User Account Linking

**Objective:** Verify Auth0 links with existing email/password accounts

**Setup:**
1. Create account with email/password:
   - Go to `/register`
   - Register with `test@example.com`
   - Log out

**Steps:**
1. Go to `/login`
2. Click "Sign in with Auth0"
3. Use Auth0 with same email (`test@example.com`)
4. Complete authentication
5. Check that you're logged into the **existing** account
6. Verify chat history from previous sessions is accessible

**Expected Results:**
- ✅ Logged into existing account (not new account)
- ✅ User ID matches previous account
- ✅ Previous chat history visible
- ✅ No duplicate accounts in database

**Database Verification:**
```sql
SELECT COUNT(*) FROM "User" WHERE email = 'test@example.com';
```

Should return `1` (only one account, not duplicates)

### 4. Session Persistence

**Objective:** Verify sessions persist across page refreshes

**Steps:**
1. Log in via Auth0
2. Refresh the page
3. Navigate to different pages
4. Close and reopen browser
5. Return to application

**Expected Results:**
- ✅ Session persists after refresh
- ✅ Session persists across navigation
- ✅ Session persists after browser restart (if cookies saved)
- ✅ User doesn't need to log in again

### 5. Logout Flow

**Objective:** Verify logout works correctly

**Steps:**
1. Log in via Auth0
2. Find and click logout button
3. Verify session cleared
4. Try to access protected pages

**Expected Results:**
- ✅ User logged out successfully
- ✅ Redirected to login page
- ✅ Session cookie cleared
- ✅ Cannot access chat without re-authenticating

### 6. Multiple Auth0 Providers (Social Login)

**Objective:** Verify multiple social providers access same account

**Setup:**
- Enable multiple social connections in Auth0 (e.g., Google, GitHub)
- Use accounts with same email

**Steps:**
1. Log in with Google (email: `user@example.com`)
2. Use chatbot, create some content
3. Log out
4. Log in with GitHub (same email: `user@example.com`)
5. Verify you see the same content

**Expected Results:**
- ✅ Both social providers access same account
- ✅ Chat history consistent across providers
- ✅ Only one user record in database
- ✅ User ID remains consistent

### 7. Error Handling

**Objective:** Verify graceful error handling

**Test Cases:**

#### A. Invalid Callback URL
1. Temporarily change callback URL in Auth0
2. Try to log in
3. Expected: Auth0 error page with helpful message

#### B. Network Interruption
1. Start login process
2. Disconnect internet during OAuth flow
3. Expected: Timeout error with retry option

#### C. Missing Environment Variables
1. Remove `AUTH_AUTH0_ID` from `.env`
2. Restart server
3. Expected: Auth0 button hidden, no errors

#### D. Database Connection Failure
1. Use invalid `POSTGRES_URL`
2. Try to log in with Auth0
3. Expected: Error handled, user sees error message

### 8. Concurrent Authentication Methods

**Objective:** Verify email/password still works when Auth0 enabled

**Steps:**
1. Verify Auth0 button visible
2. Also verify email/password form visible
3. Try logging in with email/password
4. Log out
5. Try logging in with Auth0
6. Both should work independently

**Expected Results:**
- ✅ Both authentication methods visible
- ✅ Email/password login works
- ✅ Auth0 login works
- ✅ Guest login still works
- ✅ No conflicts between methods

### 9. Guest to Auth0 Migration

**Objective:** Document behavior when guest user wants permanent account

**Current Behavior:**
- Guest accounts and Auth0 accounts are separate
- Guests cannot currently migrate to Auth0 accounts

**Future Enhancement:**
- Could implement guest data migration

### 10. Email Verification

**Objective:** Verify email verification requirements work

**Setup:**
1. Enable email verification in Auth0
2. Create rule to block unverified emails

**Steps:**
1. Sign up with new email (don't verify)
2. Try to log in via Auth0
3. Should be blocked

**Expected Results:**
- ✅ Unverified emails blocked (if rule enabled)
- ✅ Error message shown to user
- ✅ User directed to verify email

## Security Testing

### Test 1: Session Token Security

**Verify:**
- [ ] Session tokens are httpOnly
- [ ] Session tokens are secure (HTTPS in production)
- [ ] Session tokens have sameSite attribute
- [ ] Tokens expire appropriately

**How to check:**
```javascript
// In browser console
document.cookie
```

Should **not** see session token (httpOnly protects it)

### Test 2: CSRF Protection

**Verify:**
- [ ] State parameter used in OAuth flow
- [ ] State validated on callback
- [ ] CSRF tokens in forms

### Test 3: Callback URL Validation

**Try:**
1. Modify callback URL in Auth0 redirect
2. Should be rejected by Auth0

## Performance Testing

### Load Time Testing

**Measure:**
- Time to Auth0 redirect
- Auth0 login page load time
- Callback processing time
- Total login flow time

**Target:**
- < 200ms to redirect to Auth0
- < 2s for Auth0 page load
- < 500ms callback processing
- < 5s total login flow

### Database Performance

**Test:**
- User lookup speed
- User creation speed
- Session creation speed

**Monitor:**
```javascript
console.time('getUserByEmail');
await getUser('test@example.com');
console.timeEnd('getUserByEmail');
```

## Browser Compatibility Testing

Test in:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile browsers (iOS Safari, Chrome)

**Check:**
- OAuth flow works
- Redirects work
- Session cookies work
- UI displays correctly

## Integration Testing Checklist

- [ ] Auth0 login creates session
- [ ] Session includes correct user data
- [ ] Chat functionality works after Auth0 login
- [ ] File uploads work
- [ ] Document creation works
- [ ] User settings accessible
- [ ] Logout works correctly
- [ ] Re-login works after logout

## Automated Testing

### Unit Tests

Create tests for:

```typescript
// Example test structure
describe('Auth0 Integration', () => {
  it('should create user when logging in for first time', async () => {
    // Test user creation logic
  });

  it('should link to existing account by email', async () => {
    // Test account linking
  });

  it('should set user type to regular for Auth0 users', async () => {
    // Test user type assignment
  });
});
```

### E2E Tests

Example with Playwright:

```typescript
test('Auth0 login flow', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  
  // Click Auth0 button
  await page.click('text=Sign in with Auth0');
  
  // Wait for Auth0 page
  await page.waitForURL(/auth0.com/);
  
  // Enter credentials (test account)
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'testPassword123!');
  await page.click('button[type="submit"]');
  
  // Wait for redirect back
  await page.waitForURL('http://localhost:3000');
  
  // Verify logged in
  expect(await page.textContent('body')).toContain('Chat');
});
```

## Common Issues & Solutions

### Issue: "Callback URL mismatch"

**Solution:**
- Check Auth0 Dashboard → Application → Settings
- Verify callback URL exactly matches: `http://localhost:3000/api/auth/callback/auth0`
- No trailing slashes
- Check http vs https

### Issue: "Invalid state parameter"

**Solution:**
- Clear browser cookies
- Verify `AUTH_SECRET` is set
- Restart dev server
- Check for browser extensions interfering

### Issue: Auth0 button not showing

**Solution:**
- Verify `NEXT_PUBLIC_AUTH0_ENABLED=true`
- Restart dev server (required after env var changes)
- Check browser console for errors

### Issue: User not created in database

**Solution:**
- Check database connection (`POSTGRES_URL`)
- Verify email is in Auth0 profile
- Check server logs for errors
- Ensure database migrations ran

### Issue: "Access Denied"

**Solution:**
- Check Auth0 application settings
- Verify user has access to application
- Check Auth0 rules/actions aren't blocking

## Monitoring & Logging

### What to Monitor

1. **Auth0 Dashboard:**
   - Login attempts
   - Failed logins
   - Social connection usage
   - API usage

2. **Application Logs:**
   - User creation events
   - Login successes/failures
   - Database errors
   - Session creation

3. **Database:**
   - User count growth
   - Duplicate accounts (should be none)
   - Orphaned records

### Logging Example

Add logging to auth callbacks:

```typescript
async jwt({ token, user, account, profile }) {
  if (account?.provider === 'auth0') {
    console.log('[Auth0] User logging in:', profile?.email);
    console.log('[Auth0] Account:', account);
    
    // ... rest of logic
    
    console.log('[Auth0] User ID:', token.id);
  }
  return token;
}
```

## Testing Checklist Summary

### Before Deployment

- [ ] All test cases pass
- [ ] No console errors
- [ ] Session persistence works
- [ ] Logout works
- [ ] Email verification configured (if desired)
- [ ] Social connections tested
- [ ] Error handling verified
- [ ] Documentation reviewed
- [ ] Production callback URLs configured
- [ ] Environment variables set in production
- [ ] Database migrations applied
- [ ] Monitoring set up

### Post-Deployment

- [ ] Test login in production
- [ ] Verify SSL works
- [ ] Check Auth0 logs
- [ ] Monitor error rates
- [ ] Test from different locations
- [ ] Verify performance metrics

## Support

For testing issues:
1. Check this guide for relevant test case
2. Review Auth0 Dashboard logs
3. Check application server logs
4. Verify environment variables
5. Test with different accounts
6. Open issue with test results

## Additional Resources

- [Auth0 Testing Documentation](https://auth0.com/docs/get-started/auth0-overview/test-your-application)
- [NextAuth.js Testing](https://next-auth.js.org/configuration/testing)
- [Playwright Auth Testing](https://playwright.dev/docs/auth)
