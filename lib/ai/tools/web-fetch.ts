import { tool } from 'ai';
import { z } from 'zod';

/**
 * Web Fetch Tool
 * Fetches and extracts content from web pages
 */

interface FetchOptions {
  url: string;
  headers?: Record<string, string>;
  timeout?: number;
}

async function fetchWebContent({ url, headers = {}, timeout = 10000 }: FetchOptions) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const defaultHeaders = {
      'User-Agent': 'Mozilla/5.0 (compatible; AI-Chatbot/1.0)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      ...headers,
    };

    const response = await fetch(url, {
      headers: defaultHeaders,
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    
    // Handle different content types
    if (contentType.includes('application/json')) {
      const json = await response.json();
      return {
        type: 'json',
        content: JSON.stringify(json, null, 2),
        contentType,
        url: response.url,
        status: response.status,
      };
    } else if (contentType.includes('text/') || contentType.includes('html')) {
      const text = await response.text();
      return {
        type: 'text',
        content: text,
        contentType,
        url: response.url,
        status: response.status,
      };
    } else {
      return {
        type: 'binary',
        content: `Binary content (${contentType})`,
        contentType,
        url: response.url,
        status: response.status,
      };
    }
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

function extractTextFromHTML(html: string): string {
  // Basic HTML text extraction - strips tags and extracts meaningful content
  // This is a simple implementation; for production, you might want to use a proper HTML parser
  
  // Remove script and style elements
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove HTML comments
  text = text.replace(/<!--.*?-->/gs, '');
  
  // Replace common block elements with newlines
  text = text.replace(/<\/?(p|div|br|h[1-6]|li|tr)[^>]*>/gi, '\n');
  
  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  
  // Clean up whitespace
  text = text.replace(/\n\s*\n/g, '\n\n'); // Multiple newlines to double newline
  text = text.replace(/[ \t]+/g, ' '); // Multiple spaces to single space
  text = text.trim();
  
  return text;
}

function extractMetadata(html: string): Record<string, string> {
  const metadata: Record<string, string> = {};
  
  // Extract title
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch) {
    metadata.title = titleMatch[1].trim();
  }
  
  // Extract meta description
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
  if (descMatch) {
    metadata.description = descMatch[1].trim();
  }
  
  // Extract Open Graph title
  const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i);
  if (ogTitleMatch) {
    metadata.og_title = ogTitleMatch[1].trim();
  }
  
  // Extract Open Graph description
  const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i);
  if (ogDescMatch) {
    metadata.og_description = ogDescMatch[1].trim();
  }
  
  return metadata;
}

export const webFetch = tool({
  description: 'Fetch and extract content from web pages. Can retrieve HTML content, extract text, parse JSON APIs, and gather metadata from URLs.',
  parameters: z.object({
    url: z.string().url().describe('The URL to fetch'),
    extract_text: z.boolean().default(true).describe('Extract plain text from HTML (removes tags)'),
    include_metadata: z.boolean().default(true).describe('Include page metadata (title, description, etc.)'),
    max_length: z.number().min(100).max(50000).default(10000).describe('Maximum content length to return'),
    custom_headers: z.record(z.string()).optional().describe('Custom HTTP headers to include in the request'),
  }),
  execute: async ({ url, extract_text, include_metadata, max_length, custom_headers }) => {
    try {
      // Validate URL
      try {
        new URL(url);
      } catch {
        return { success: false, error: 'Invalid URL format' };
      }

      const result = await fetchWebContent({ 
        url, 
        headers: custom_headers,
        timeout: 15000,
      });

      let content = result.content;
      let metadata: Record<string, string> = {};

      // Process HTML content
      if (result.type === 'text' && result.contentType.includes('html')) {
        if (include_metadata) {
          metadata = extractMetadata(content);
        }
        
        if (extract_text) {
          content = extractTextFromHTML(content);
        }
      }

      // Truncate content if needed
      if (content.length > max_length) {
        content = `${content.substring(0, max_length)}\n\n... (content truncated)`;
      }

      return {
        success: true,
        url: result.url,
        content,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        content_type: result.contentType,
        status: result.status,
        content_length: content.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch web content',
      };
    }
  },
});

/**
 * Web Search Tool (using DuckDuckGo HTML)
 * Simple web search without requiring API keys
 */
export const webSearch = tool({
  description: 'Search the web for information using DuckDuckGo. Returns search results with titles, URLs, and snippets.',
  parameters: z.object({
    query: z.string().min(1).describe('Search query'),
    max_results: z.number().min(1).max(10).default(5).describe('Maximum number of results to return'),
  }),
  execute: async ({ query, max_results }) => {
    try {
      // Use DuckDuckGo HTML interface (no API key required)
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      
      const result = await fetchWebContent({ 
        url: searchUrl,
        timeout: 10000,
      });

      // Parse search results from HTML
      const html = result.content;
      const results: Array<{title: string; url: string; snippet: string}> = [];
      
      // Extract results using regex (simple approach)
      const resultRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>(.*?)<\/a>/g;
      
      let match = resultRegex.exec(html);
      while (match !== null && results.length < max_results) {
        const url = match[1].replace(/^\/\/duckduckgo\.com\/l\/\?uddg=/, '').replace(/&amp;/g, '&');
        const title = match[2].replace(/<[^>]+>/g, '').trim();
        const snippet = match[3].replace(/<[^>]+>/g, '').trim();
        
        // Decode URL
        let decodedUrl = '';
        try {
          decodedUrl = decodeURIComponent(url);
        } catch {
          decodedUrl = url;
        }
        
        if (decodedUrl && title && snippet) {
          results.push({
            title,
            url: decodedUrl,
            snippet,
          });
        }
        
        match = resultRegex.exec(html);
      }

      return {
        success: true,
        query,
        results,
        total_results: results.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Web search failed',
        query,
        results: [],
      };
    }
  },
});
