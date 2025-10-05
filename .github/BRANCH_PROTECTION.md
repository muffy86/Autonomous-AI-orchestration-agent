# Branch Protection Rules Setup

To ensure the Dependabot auto-merge workflow functions correctly and maintains code quality, please configure the following branch protection rules for the `main` branch in your GitHub repository settings.

## How to Configure

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Branches**
3. Click **Add rule** or edit the existing rule for `main`
4. Configure the following settings:

## Recommended Branch Protection Settings

### Basic Protection
- ✅ **Restrict pushes that create files larger than 100MB**
- ✅ **Require a pull request before merging**
  - ✅ **Require approvals**: 1 (can be 0 for personal repos)
  - ✅ **Dismiss stale PR approvals when new commits are pushed**
  - ✅ **Require review from code owners** (if you have a CODEOWNERS file)

### Status Checks
- ✅ **Require status checks to pass before merging**
- ✅ **Require branches to be up to date before merging**
- **Required status checks:**
  - `build` (from lint.yml workflow)
  - `test` (from playwright.yml workflow)

### Additional Restrictions
- ✅ **Restrict pushes that create files larger than 100MB**
- ✅ **Do not allow bypassing the above settings**
- ❌ **Allow force pushes** (keep disabled for safety)
- ❌ **Allow deletions** (keep disabled for safety)

## For Dependabot Auto-merge

These settings ensure that:
1. Dependabot PRs must pass all required checks before auto-merging
2. The auto-merge workflow can only merge when tests pass
3. Manual intervention is required for any failures

## Admin Override

As a repository admin, you can still:
- Merge PRs that don't meet requirements (emergency situations)
- Push directly to main (not recommended)
- Modify these rules as needed

## Testing the Setup

After configuring these rules:
1. Create a test PR to verify status checks are required
2. Wait for Dependabot to create a PR (or trigger manually)
3. Verify the auto-merge workflow respects the branch protection rules