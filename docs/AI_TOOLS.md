# AI Tools Documentation

This document describes the AI tools available in the chatbot and how to use them.

## Overview

The chatbot includes several built-in tools that allow it to access external data sources and perform various tasks. These tools are automatically available to the AI model during conversations.

## Available Tools

### GitHub Integration

Access GitHub data including repositories, issues, pull requests, and code.

**Tool Name:** `githubIntegration`

**Capabilities:**
- Search repositories by keywords, language, topics
- Get detailed repository information
- List and view issues
- List and view pull requests
- Read file contents from repositories
- Search code across GitHub
- List commits
- Get user profiles and their repositories

**Example Queries:**
- "Find the most popular React libraries on GitHub"
- "Show me the open issues in facebook/react"
- "Get the README from vercel/next.js"
- "Search for authentication code in rails/rails"
- "What are the latest commits in torvalds/linux?"

**Environment Variables:**
```bash
# Optional: Increases rate limits from 60 to 5000 requests/hour
# Also enables access to private repositories
GITHUB_TOKEN=your_github_token_here
# or
GITHUB_API_KEY=your_github_token_here
```

**Rate Limits:**
- Without token: 60 requests per hour
- With token: 5,000 requests per hour

### Web Fetch

Fetch and extract content from any web page.

**Tool Name:** `webFetch`

**Capabilities:**
- Fetch HTML content from URLs
- Extract plain text from web pages
- Parse page metadata (title, description, Open Graph data)
- Handle JSON APIs
- Custom HTTP headers support

**Example Queries:**
- "Get the content from https://example.com"
- "What does the React documentation say about hooks?"
- "Fetch the latest blog post from https://blog.example.com"
- "Extract the main text from this article: [URL]"

**Parameters:**
- `url`: The URL to fetch (required)
- `extract_text`: Remove HTML tags and extract plain text (default: true)
- `include_metadata`: Include page metadata (default: true)
- `max_length`: Maximum content length in characters (default: 10,000)
- `custom_headers`: Custom HTTP headers as key-value pairs

**Content Types Supported:**
- HTML pages
- JSON APIs
- Plain text

### Web Search

Search the web using DuckDuckGo (no API key required).

**Tool Name:** `webSearch`

**Capabilities:**
- Search the web for current information
- Returns titles, URLs, and snippets
- No API key or authentication required

**Example Queries:**
- "Search the web for latest TypeScript tutorials"
- "Find information about climate change"
- "What are the latest AI developments?"

**Parameters:**
- `query`: Search query (required)
- `max_results`: Maximum number of results (1-10, default: 5)

**Note:** This tool uses DuckDuckGo's HTML interface, which doesn't require authentication but may have rate limiting during heavy usage.

### Weather

Get real-time weather information for any location.

**Tool Name:** `getWeather`

**Capabilities:**
- Current weather conditions
- Hourly forecasts
- Daily sunrise/sunset times
- Temperature data

**Example Queries:**
- "What's the weather like in San Francisco?"
- "Will it rain tomorrow in London?"

**API:** Uses [Open-Meteo](https://open-meteo.com/) (no API key required)

### Document Management

Create and update rich documents with code, charts, and artifacts.

**Tool Names:** `createDocument`, `updateDocument`

**Capabilities:**
- Create interactive documents
- Add code snippets with syntax highlighting
- Embed charts and visualizations
- Version control for documents

**Example Queries:**
- "Create a document explaining React hooks"
- "Make a tutorial about Python functions"
- "Generate a code example for API authentication"

### Suggestions

Get AI-powered suggestions for continuing the conversation.

**Tool Name:** `requestSuggestions`

**Capabilities:**
- Generate contextual follow-up questions
- Suggest relevant topics to explore
- Help users discover features

## Tool Configuration

### Enabling/Disabling Tools

Tools are configured in `app/(chat)/api/chat/route.ts`:

```typescript
experimental_activeTools: [
  'getWeather',
  'createDocument',
  'updateDocument',
  'requestSuggestions',
  'githubIntegration',
  'webFetch',
  'webSearch',
]
```

To disable a tool, remove it from this array.

### Adding New Tools

1. Create a new tool file in `lib/ai/tools/`
2. Define the tool using the `tool()` function from `ai`
3. Export the tool in `lib/ai/tools/index.ts`
4. Register the tool in `app/(chat)/api/chat/route.ts`

Example:

```typescript
import { tool } from 'ai';
import { z } from 'zod';

export const myTool = tool({
  description: 'Description of what the tool does',
  parameters: z.object({
    param1: z.string().describe('Description'),
    param2: z.number().optional(),
  }),
  execute: async ({ param1, param2 }) => {
    // Tool implementation
    return {
      success: true,
      result: 'Tool result',
    };
  },
});
```

## Best Practices

### For Users

1. **Be specific** - Provide clear, detailed requests
2. **Include context** - Mention repository names, URLs, or specific information you need
3. **Chain queries** - Break complex tasks into smaller steps
4. **Verify results** - Always check important information from external sources

### For Developers

1. **Error handling** - Tools should always return a `success` boolean and handle errors gracefully
2. **Rate limiting** - Be aware of API rate limits and implement appropriate handling
3. **Security** - Never expose API keys or sensitive data in tool responses
4. **Testing** - Write tests for all tools (see `__tests__/ai/tools/integrations.test.ts`)

## Troubleshooting

### GitHub API Rate Limiting

**Error:** "API rate limit exceeded"

**Solution:** Add a `GITHUB_TOKEN` to your environment variables to increase the rate limit from 60 to 5,000 requests per hour.

### Web Fetch Timeouts

**Error:** "Request timeout"

**Solution:** The tool has a 15-second timeout. If a website is slow, the request may fail. Try again or use a different source.

### Web Search No Results

**Error:** No search results returned

**Solution:** DuckDuckGo may be rate limiting. Wait a moment and try again with a different query.

## Privacy & Security

- **GitHub Token:** Stored securely in environment variables, never exposed in responses
- **Web Fetch:** Only fetches publicly accessible content
- **Data Storage:** Tool results are not permanently stored
- **User Privacy:** No user data is sent to third-party services beyond the API calls

## Additional Resources

- [AI SDK Documentation](https://sdk.vercel.ai/docs)
- [GitHub API Documentation](https://docs.github.com/en/rest)
- [Open-Meteo API](https://open-meteo.com/en/docs)
- [DuckDuckGo](https://duckduckgo.com/)
