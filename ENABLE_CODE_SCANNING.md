# Enabling Code Scanning in GitHub

This document explains how to enable code scanning for this repository.

## Steps to Enable Code Scanning

### 1. Enable Code Scanning in Repository Settings

1. Navigate to your repository on GitHub
2. Click on **Settings** tab
3. In the left sidebar, click on **Code security and analysis**
4. Under **Code scanning**, click **Set up** next to "CodeQL analysis"
5. Choose **Advanced** setup
6. This will use the existing `.github/workflows/codeql.yml` file

### 2. Enable Security Features

While in the Code security and analysis settings, also enable:

- **Dependabot alerts** - Alerts for vulnerable dependencies
- **Dependabot security updates** - Automatic PRs for security updates
- **Secret scanning** - Detects secrets committed to the repository

### 3. Verify CodeQL Workflow

The repository already has a CodeQL workflow configured at `.github/workflows/codeql.yml` which:

- Runs on pushes to main branch
- Runs on pull requests to main branch  
- Runs weekly on a schedule
- Analyzes JavaScript/TypeScript code
- Uses security-and-quality query suite

### 4. Grant Required Permissions

The workflow needs these permissions (already configured):
- `security-events: write` - To upload SARIF results
- `contents: read` - To checkout code
- `actions: read` - For private repositories
- `packages: read` - For CodeQL packs

## Security Improvements Implemented

This PR includes the following security improvements:

### 1. HTML Sanitization with DOMPurify

- Installed `dompurify` package for HTML sanitization
- All `innerHTML` assignments now use `DOMPurifyLib.sanitize()`
- Files updated:
  - `lib/editor/functions.tsx`
  - `components/diffview.tsx`

### 2. Security Headers

Added comprehensive security headers in `next.config.ts`:

- `X-DNS-Prefetch-Control` - Controls DNS prefetching
- `Strict-Transport-Security` - Enforces HTTPS
- `X-XSS-Protection` - Enables browser XSS protection
- `X-Frame-Options` - Prevents clickjacking
- `X-Content-Type-Options` - Prevents MIME sniffing
- `Referrer-Policy` - Controls referrer information
- `Content-Security-Policy` - Restricts resource loading

### 3. Content Security Policy (CSP)

Implemented CSP header with:
- `default-src 'self'` - Only allow resources from same origin
- `script-src 'self' 'unsafe-eval' 'unsafe-inline'` - Script sources
- `style-src 'self' 'unsafe-inline'` - Style sources
- `img-src 'self' data: https:` - Image sources
- `font-src 'self'` - Font sources
- `connect-src 'self' https:` - Connection sources
- `frame-src 'none'` - No frames allowed

## Next Steps

1. **Enable code scanning** in repository settings as described above
2. **Wait for the workflow to complete** - The first run may take 5-10 minutes
3. **Review any findings** in the Security tab under "Code scanning alerts"
4. **Address any remaining issues** that CodeQL identifies

## Testing

The security improvements have been validated:

- ✅ Linting passes with no errors
- ✅ DOMPurify correctly sanitizes HTML content
- ✅ Security headers are properly configured
- ✅ CSP policy is implemented

## Documentation

Security practices are documented in:
- `SECURITY.md` - Complete security policy and best practices
- `CONTRIBUTING.md` - Contributing guidelines including security
- `DEPLOYMENT.md` - Deployment security considerations

## Support

If you need help enabling code scanning:
1. Check GitHub's documentation: https://docs.github.com/en/code-security/code-scanning
2. Review the CodeQL workflow logs for any errors
3. Ensure you have admin access to the repository settings
