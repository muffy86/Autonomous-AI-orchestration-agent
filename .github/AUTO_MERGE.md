# Auto-merge Pull Requests

This repository uses an automated pull request merging workflow that streamlines the review and merge process for all pull requests.

## Overview

The auto-merge workflow automatically merges pull requests once they meet all the required criteria:
- ✅ At least one approval from a maintainer
- ✅ All required status checks pass (lint, tests, E2E)
- ✅ PR is not in draft mode
- ✅ PR does not have the `no-merge` label

## How It Works

### 1. PR Creation
When you create a pull request, the auto-merge workflow starts monitoring it.

### 2. Automated Checks
The following checks run automatically:
- **Lint and Type Check** - Ensures code style and type safety
- **Unit and Integration Tests** - Validates functionality
- **Playwright E2E Tests** - Tests complete user workflows

### 3. Approval Requirement
At least one maintainer must approve your PR before it can be auto-merged.

### 4. Auto-merge Activation
Once approved and all checks pass, the workflow:
1. Waits for all required checks to complete successfully
2. Enables GitHub's auto-merge feature
3. Adds a comment notifying about the auto-merge
4. Merges the PR using the squash merge strategy

## Opting Out

### Option 1: Use the `no-merge` Label
Add the `no-merge` label to your PR to prevent auto-merging:
```bash
gh pr edit <PR-NUMBER> --add-label "no-merge"
```

### Option 2: Mark as Draft
Convert your PR to a draft to disable auto-merge:
```bash
gh pr ready <PR-NUMBER> --draft
```

## Manual Merge

Maintainers can still manually merge PRs at any time, even if auto-merge is enabled. This is useful for:
- Emergency fixes
- PRs that need special handling
- Overriding the auto-merge process

## Workflow Triggers

The auto-merge workflow runs on:
- PR opened, synchronized, reopened, or labeled
- PR review submitted
- Check suite completed
- Other workflows (lint, test, E2E) completed

## Benefits

- **Faster Merge Times** - No need to wait for manual merging
- **Consistent Process** - All PRs follow the same merge criteria
- **Reduced Manual Work** - Maintainers don't need to manually merge approved PRs
- **Safety** - All checks must pass before merging

## Comparison with Dependabot Auto-merge

| Feature | Auto-merge PR | Dependabot Auto-merge |
|---------|---------------|----------------------|
| Scope | All PRs | Only Dependabot PRs |
| Approval Required | Yes | No (for patch/minor) |
| Check Requirements | Lint, Tests, E2E | Build, Tests |
| Merge Strategy | Squash | Merge |
| Can Opt Out | Yes (label/draft) | No (major updates only) |

## Troubleshooting

### PR Not Auto-merging?

Check the following:
1. ✅ PR has at least one approval
2. ✅ All required checks are passing
3. ✅ PR is not in draft mode
4. ✅ PR does not have `no-merge` label
5. ✅ Branch protection rules are configured correctly

### Workflow Not Running?

- Ensure the workflow file is in `.github/workflows/`
- Check GitHub Actions permissions in repository settings
- Verify the workflow is enabled in the Actions tab

## Configuration

The workflow is configured in `.github/workflows/auto-merge-pr.yml`. To modify:

### Change Required Checks
Edit the `check-regexp` parameter:
```yaml
check-regexp: 'Lint and Type Check|Unit and Integration Tests|Playwright E2E Tests'
```

### Change Merge Strategy
Modify the `gh pr merge` command:
- `--squash` - Squash and merge (current)
- `--merge` - Create a merge commit
- `--rebase` - Rebase and merge

### Adjust Wait Interval
Change the `wait-interval` parameter (in seconds):
```yaml
wait-interval: 10  # Check every 10 seconds
```

## Security Considerations

- Only approved PRs are auto-merged
- All status checks must pass
- Workflow uses standard GitHub permissions
- Manual override always available
- Branch protection rules are respected

## Getting Help

If you have questions or issues with the auto-merge workflow:
- Check the [GitHub Actions logs](../../actions)
- Review the [Contributing Guide](../../CONTRIBUTING.md)
- Open an [issue](../../issues/new)
