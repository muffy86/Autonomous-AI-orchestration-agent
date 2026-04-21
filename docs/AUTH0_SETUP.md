# Auth0 Integration Setup Guide

This guide will help you set up Auth0 authentication for the AI Chatbot application.

## Prerequisites

- An Auth0 account (sign up at [https://auth0.com/signup](https://auth0.com/signup))
- Access to your Auth0 Dashboard

## Step 1: Create an Auth0 Application

1. Go to the [Auth0 Dashboard](https://manage.auth0.com/)
2. Navigate to **Applications** → **Applications** in the sidebar
3. Click **Create Application**
4. Choose a name for your application (e.g., "AI Chatbot")
5. Select **Regular Web Applications** as the application type
6. Click **Create**

## Step 2: Configure Application Settings

After creating the application, configure the following settings:

### Application URIs

In your application settings, add the following URLs:

**For Local Development:**
- **Allowed Callback URLs**: `http://localhost:3000/api/auth/callback/auth0`
- **Allowed Logout URLs**: `http://localhost:3000`
- **Allowed Web Origins**: `http://localhost:3000`

**For Production:**
- **Allowed Callback URLs**: `https://yourdomain.com/api/auth/callback/auth0`
- **Allowed Logout URLs**: `https://yourdomain.com`
- **Allowed Web Origins**: `https://yourdomain.com`

You can add multiple URLs separated by commas for different environments.

### Save Changes

Click **Save Changes** at the bottom of the page.

## Step 3: Get Your Credentials

In your Auth0 application settings, you'll find:

1. **Domain** (e.g., `your-tenant.auth0.com`)
2. **Client ID** (a long string of characters)
3. **Client Secret** (click "Show" to reveal it)

## Step 4: Configure Environment Variables

Add the following environment variables to your `.env` file (or `.env.local`):

```bash
# Auth0 Configuration
AUTH_AUTH0_ID=your_client_id_here
AUTH_AUTH0_SECRET=your_client_secret_here
AUTH_AUTH0_ISSUER=https://your-tenant.auth0.com
NEXT_PUBLIC_AUTH0_ENABLED=true
```

Replace:
- `your_client_id_here` with your **Client ID**
- `your_client_secret_here` with your **Client Secret**
- `your-tenant.auth0.com` with your **Domain**

## Step 5: Verify Installation

1. Start your development server:
   ```bash
   pnpm dev
   ```

2. Navigate to the login page at `http://localhost:3000/login`

3. You should now see a "Sign in with Auth0" button below the traditional email/password form

4. Click the button to test the Auth0 authentication flow

## Optional: Customize Auth0 Login Experience

### Enable Social Connections

1. In the Auth0 Dashboard, go to **Authentication** → **Social**
2. Enable social providers like Google, GitHub, Facebook, etc.
3. Configure each provider with the required credentials
4. Go back to your Application settings
5. Under the **Connections** tab, enable the social connections you want to use

### Customize Login Page

1. Go to **Branding** → **Universal Login**
2. Customize the appearance of your login page
3. You can add your logo, change colors, and modify the template

### Add Custom Claims

To add custom user data to the session, you can create an Auth0 Action:

1. Go to **Actions** → **Flows**
2. Select **Login**
3. Create a new Action to add custom claims to the token
4. Update the `jwt` callback in `app/(auth)/auth.ts` to handle the custom claims

## Deployment

### Vercel

When deploying to Vercel:

1. Add the environment variables in your Vercel project settings
2. Make sure to update the **Allowed Callback URLs** and **Allowed Logout URLs** in Auth0 to include your production domain
3. Deploy your application

### Other Platforms

For other platforms:
1. Set the environment variables in your platform's configuration
2. Update the Auth0 application URLs accordingly
3. Ensure `AUTH_SECRET` is set to a secure random string

## Troubleshooting

### "Callback URL mismatch" error

- Verify that the callback URL in Auth0 exactly matches your application URL
- Check for trailing slashes and http vs https
- Make sure the Auth0 application has the callback URL configured

### "Invalid state" error

- Clear your browser cookies and try again
- Verify that `AUTH_SECRET` is set in your environment variables
- Make sure the domain in `AUTH_AUTH0_ISSUER` is correct

### Auth0 button not showing

- Verify that `NEXT_PUBLIC_AUTH0_ENABLED=true` is set
- Check that all Auth0 environment variables are correctly set
- Restart your development server after adding environment variables

## Security Best Practices

1. **Never commit** your `.env` file to version control
2. Use different Auth0 applications for development and production
3. Regularly rotate your `AUTH_SECRET`
4. Enable MFA in Auth0 for additional security
5. Monitor your Auth0 logs for suspicious activity

## Additional Resources

- [Auth0 Documentation](https://auth0.com/docs)
- [NextAuth.js Auth0 Provider](https://next-auth.js.org/providers/auth0)
- [Auth0 Quickstart for Next.js](https://auth0.com/docs/quickstart/webapp/nextjs)

## Support

If you encounter any issues, please:
1. Check the troubleshooting section above
2. Review the Auth0 Dashboard logs
3. Check the browser console for errors
4. Open an issue in the repository with detailed error messages
