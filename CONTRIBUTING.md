# Contributing to AI Chatbot

Thank you for your interest in contributing to the AI Chatbot project! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js 20 or higher
- pnpm 9.12.3 or higher
- PostgreSQL database
- Redis instance

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/muffy86/Autonomous-AI-orchestration-agent.git
   cd Autonomous-AI-orchestration-agent
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Set up the database**
   ```bash
   pnpm db:push
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

## 📋 Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates
- `refactor/*` - Code refactoring

### Making Changes

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the coding standards
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   pnpm test:all
   pnpm lint
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

5. **Push and create a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test:all

# Run unit tests only
pnpm test:unit

# Run unit tests with coverage
pnpm test:unit:coverage

# Run integration tests
pnpm test:integration

# Run E2E tests
pnpm test

# Watch mode for unit tests
pnpm test:unit:watch
```

### Writing Tests

- **Unit tests**: Test individual functions and components
- **Integration tests**: Test API endpoints and database interactions
- **E2E tests**: Test complete user workflows

#### Test File Naming

- Unit tests: `*.test.ts` or `*.test.tsx`
- Integration tests: `*.integration.test.ts`
- E2E tests: `*.e2e.test.ts`

#### Test Structure

```typescript
import { describe, it, expect } from '@jest/globals'

describe('Component/Function Name', () => {
  it('should do something specific', () => {
    // Arrange
    const input = 'test input'
    
    // Act
    const result = functionUnderTest(input)
    
    // Assert
    expect(result).toBe('expected output')
  })
})
```

## 🎨 Code Style

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid `any` type when possible

### React Components

- Use functional components with hooks
- Follow the component structure:
  ```tsx
  import React from 'react'
  import { ComponentProps } from './types'
  
  export function Component({ prop1, prop2 }: ComponentProps) {
    // Component logic
    
    return (
      <div>
        {/* JSX */}
      </div>
    )
  }
  ```

### Styling

- Use Tailwind CSS for styling
- Follow the utility-first approach
- Use the `cn()` utility for conditional classes

### Linting and Formatting

```bash
# Run linter
pnpm lint

# Fix linting issues
pnpm lint --fix

# Format code
pnpm format
```

## 📁 Project Structure

```
├── app/                    # Next.js app directory
├── components/             # React components
│   ├── ui/                # Reusable UI components
│   └── ...                # Feature-specific components
├── lib/                   # Utility functions and configurations
│   ├── ai/               # AI-related utilities
│   ├── db/               # Database utilities
│   └── ...               # Other utilities
├── hooks/                 # Custom React hooks
├── tests/                 # E2E tests
├── __tests__/            # Unit and integration tests
├── public/               # Static assets
└── ...
```

## 🔧 Environment Variables

Required environment variables:

```bash
# Authentication
AUTH_SECRET=your-auth-secret

# Database
POSTGRES_URL=postgresql://user:password@localhost:5432/dbname

# Storage
BLOB_READ_WRITE_TOKEN=your-blob-token

# Cache
REDIS_URL=redis://localhost:6379

# AI Providers (optional)
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
```

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Description**: Clear description of the issue
2. **Steps to reproduce**: Detailed steps to reproduce the bug
3. **Expected behavior**: What you expected to happen
4. **Actual behavior**: What actually happened
5. **Environment**: OS, browser, Node.js version, etc.
6. **Screenshots**: If applicable

## ✨ Feature Requests

When requesting features, please include:

1. **Problem**: What problem does this solve?
2. **Solution**: Describe your proposed solution
3. **Alternatives**: Any alternative solutions considered
4. **Use cases**: Specific use cases for this feature

## 📝 Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add user authentication
fix: resolve chat message rendering issue
docs: update API documentation
test: add unit tests for message component
```

## 🔍 Code Review Process

1. **Automated checks**: All PRs must pass CI/CD checks
2. **Code review**: At least one maintainer review required
3. **Testing**: Ensure adequate test coverage
4. **Documentation**: Update docs if needed

### Review Checklist

- [ ] Code follows project standards
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No breaking changes (or properly documented)
- [ ] Performance impact considered
- [ ] Security implications reviewed

## 🤖 Auto-merge Workflow

This repository uses an automated pull request merging workflow to streamline the development process.

### How It Works

1. **Create a PR**: Submit your pull request with your changes
2. **Automated Checks**: The following checks run automatically:
   - Lint and Type Check
   - Unit and Integration Tests
   - Playwright E2E Tests
3. **Get Approval**: At least one approval from a maintainer is required
4. **Auto-merge**: Once approved and all checks pass, the PR is automatically merged

### Opting Out of Auto-merge

If you want to prevent auto-merging for a specific PR:
- Add the `no-merge` label to your PR
- Mark the PR as a draft

### Manual Merge

Maintainers can still manually merge PRs at any time, even if auto-merge is enabled.

## 🚀 Deployment

The project uses automated deployment:

- **Staging**: Deployed on every push to `main`
- **Production**: Deployed on release tags

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Discord**: [Join our community](https://discord.gg/your-discord)

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project.

## 🙏 Recognition

Contributors are recognized in:
- GitHub contributors list
- Release notes for significant contributions
- Project documentation

Thank you for contributing to make this project better! 🎉