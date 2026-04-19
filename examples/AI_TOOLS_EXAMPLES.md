# AI Tools - Usage Examples

This document provides practical examples of how to use the AI tools integrated into the chatbot.

## GitHub Integration Examples

### Example 1: Search for Popular Repositories

**User Query:**
```
Find the most popular JavaScript frameworks on GitHub
```

**What the AI will do:**
1. Use `githubIntegration` tool with action `search_repos`
2. Query: "javascript framework language:JavaScript"
3. Sort by stars
4. Return top repositories with details

**Expected Response:**
- List of popular frameworks (React, Vue, Angular, etc.)
- Star counts, descriptions, and GitHub URLs
- Language and topic information

---

### Example 2: Get Repository Details

**User Query:**
```
Tell me about the facebook/react repository
```

**What the AI will do:**
1. Use `githubIntegration` with action `get_repo`
2. Owner: "facebook", Repo: "react"
3. Fetch comprehensive repository data

**Expected Response:**
- Repository description
- Stars, forks, watchers counts
- Primary language
- Open issues count
- License information
- Recent activity

---

### Example 3: Browse Repository Issues

**User Query:**
```
Show me the open issues in vercel/next.js
```

**What the AI will do:**
1. Use `githubIntegration` with action `list_issues`
2. Owner: "vercel", Repo: "next.js"
3. State: "open"
4. Return recent issues

**Expected Response:**
- List of open issues with titles
- Issue numbers and labels
- Creation dates
- Comment counts
- Links to GitHub

---

### Example 4: Read File Contents

**User Query:**
```
Get the README from torvalds/linux
```

**What the AI will do:**
1. Use `githubIntegration` with action `get_file`
2. Owner: "torvalds", Repo: "linux"
3. Path: "README"
4. Decode and return file content

**Expected Response:**
- Full README content
- File size and path
- Download URL

---

### Example 5: Search Code

**User Query:**
```
Find authentication code examples in rails/rails
```

**What the AI will do:**
1. Use `githubIntegration` with action `search_code`
2. Query: "authentication repo:rails/rails"
3. Return code search results

**Expected Response:**
- List of files containing authentication code
- File paths and names
- Repository information
- Links to view code on GitHub

---

## Web Fetch Examples

### Example 1: Fetch Web Page Content

**User Query:**
```
Get the content from https://example.com
```

**What the AI will do:**
1. Use `webFetch` tool
2. Fetch HTML from the URL
3. Extract plain text
4. Parse metadata (title, description)

**Expected Response:**
- Page title
- Meta description
- Main content text (cleaned of HTML tags)
- URL and content type

---

### Example 2: Extract Documentation

**User Query:**
```
What does the React documentation say about useState?
```

**What the AI will do:**
1. Use `webFetch` to get React docs page
2. Extract relevant text about useState
3. Parse and summarize the content

**Expected Response:**
- Explanation of useState hook
- Usage examples (if present in content)
- Key points from the documentation

---

### Example 3: Fetch JSON API

**User Query:**
```
Get data from https://api.github.com/users/octocat
```

**What the AI will do:**
1. Use `webFetch` tool
2. Recognize JSON content type
3. Return formatted JSON

**Expected Response:**
- Formatted JSON data
- User profile information
- Content type indicator

---

## Web Search Examples

### Example 1: General Search

**User Query:**
```
Search the web for React 19 new features
```

**What the AI will do:**
1. Use `webSearch` tool
2. Query DuckDuckGo for "React 19 new features"
3. Return top results

**Expected Response:**
- 3-5 search results
- Titles and URLs
- Result snippets/descriptions
- Relevant websites

---

### Example 2: Technical Search

**User Query:**
```
Find tutorials about TypeScript generics
```

**What the AI will do:**
1. Use `webSearch` tool
2. Search for "TypeScript generics tutorial"
3. Filter and return relevant results

**Expected Response:**
- Tutorial links
- Documentation pages
- Blog posts
- Code examples

---

## Weather Examples

### Example 1: Current Weather

**User Query:**
```
What's the weather in San Francisco?
```

**What the AI will do:**
1. Use `getWeather` tool
2. Get coordinates for San Francisco
3. Fetch weather data from Open-Meteo

**Expected Response:**
- Current temperature
- Weather conditions
- Hourly forecast
- Sunrise/sunset times

---

### Example 2: Weather Forecast

**User Query:**
```
Will it rain tomorrow in London?
```

**What the AI will do:**
1. Use `getWeather` for London
2. Check hourly forecast
3. Analyze precipitation data

**Expected Response:**
- Tomorrow's forecast
- Chance of rain
- Temperature range
- Weather trends

---

## Document Creation Examples

### Example 1: Create Code Tutorial

**User Query:**
```
Create a document explaining how to use React hooks
```

**What the AI will do:**
1. Use `createDocument` tool
2. Generate comprehensive tutorial
3. Include code examples
4. Format with syntax highlighting

**Expected Response:**
- Interactive document artifact
- Explanation of hooks
- Code examples (useState, useEffect, etc.)
- Best practices

---

### Example 2: Generate Code Example

**User Query:**
```
Make a code example for JWT authentication in Node.js
```

**What the AI will do:**
1. Use `createDocument` tool
2. Create code artifact
3. Include complete example with comments

**Expected Response:**
- Editable code artifact
- JWT authentication implementation
- Comments explaining each step
- Usage examples

---

## Combined Tool Usage

### Example: Research and Document

**User Query:**
```
Research the Next.js App Router on GitHub and create a tutorial document
```

**What the AI will do:**
1. Use `githubIntegration` to get Next.js repository info
2. Use `webFetch` to read Next.js documentation
3. Use `createDocument` to create comprehensive tutorial
4. Combine information from multiple sources

**Expected Response:**
- Researched information from GitHub
- Documentation content
- Complete tutorial document
- Code examples and best practices

---

### Example: Code Search and Analysis

**User Query:**
```
Find error handling patterns in express/express and explain them
```

**What the AI will do:**
1. Use `githubIntegration` to search code in express/express
2. Use `webFetch` to get related documentation
3. Analyze patterns found
4. Provide explanation

**Expected Response:**
- Found code examples
- Pattern analysis
- Best practices explanation
- Links to source files

---

## Tips for Best Results

### Be Specific
- **Good:** "Get the README from facebook/react"
- **Better:** "Get the README from facebook/react and summarize the main features"

### Provide Context
- **Good:** "Search for React tutorials"
- **Better:** "Search for React tutorials focusing on hooks and state management"

### Chain Requests
- **Good:** "Find Python projects on GitHub"
- **Better:** "Find popular Python machine learning projects on GitHub, then get details about the top result"

### Verify Information
- Always check important information from the original source
- Use multiple tools to cross-reference data
- Be aware of when data was last updated

---

## Limitations

### GitHub Integration
- Rate limited to 60 requests/hour without token
- Private repositories require authentication
- Very large files may be truncated

### Web Fetch
- 15-second timeout for slow websites
- Cannot access pages requiring authentication
- Content limited to 10,000 characters by default

### Web Search
- Results may vary based on DuckDuckGo availability
- Limited to public web content
- No image search (text only)

### Weather
- Requires valid coordinates (latitude/longitude)
- Limited to data available from Open-Meteo API
- Historical data may be limited

---

## Troubleshooting

### "API rate limit exceeded"
**Solution:** Add a `GITHUB_TOKEN` environment variable

### "Request timeout"
**Solution:** Try again or use a different URL

### "No results found"
**Solution:** Refine your search query or try different keywords

### "Invalid URL"
**Solution:** Check that the URL is properly formatted with https://

---

## Additional Resources

- [Complete AI Tools Documentation](../docs/AI_TOOLS.md)
- [GitHub API Documentation](https://docs.github.com/en/rest)
- [Open-Meteo API](https://open-meteo.com/)
- [DuckDuckGo](https://duckduckgo.com/)
