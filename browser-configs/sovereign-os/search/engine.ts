/**
 * Advanced Search Integration
 * Multi-engine search with Perplexity-like capabilities
 */

export class SearchEngine {
  private config: any;
  private cache: Map<string, any> = new Map();

  constructor(config: any = {}) {
    this.config = {
      cacheEnabled: true,
      cacheTTL: 3600000, // 1 hour
      maxResults: 10,
      ...config
    };
  }

  // ===== Brave Search API (Privacy-focused) =====

  async searchBrave(query: string, options: any = {}) {
    const apiKey = await this.getAPIKey('BRAVE_API_KEY');
    if (!apiKey) {
      console.warn('Brave API key not configured');
      return [];
    }

    const cacheKey = `brave:${query}`;
    if (this.config.cacheEnabled && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.config.cacheTTL) {
        return cached.results;
      }
    }

    try {
      const url = new URL('https://api.search.brave.com/res/v1/web/search');
      url.searchParams.set('q', query);
      url.searchParams.set('count', String(options.count || this.config.maxResults));

      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': apiKey
        }
      });

      const data = await response.json();
      const results = this.parseBraveResults(data);

      if (this.config.cacheEnabled) {
        this.cache.set(cacheKey, { results, timestamp: Date.now() });
      }

      return results;
    } catch (error: any) {
      console.error('Brave search failed:', error.message);
      return [];
    }
  }

  private parseBraveResults(data: any) {
    if (!data.web?.results) return [];

    return data.web.results.map((result: any) => ({
      title: result.title,
      url: result.url,
      description: result.description,
      snippet: result.description,
      source: 'brave',
      timestamp: Date.now()
    }));
  }

  // ===== DuckDuckGo Search (No API key needed) =====

  async searchDuckDuckGo(query: string, options: any = {}) {
    const cacheKey = `ddg:${query}`;
    if (this.config.cacheEnabled && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.config.cacheTTL) {
        return cached.results;
      }
    }

    try {
      // Use DuckDuckGo's instant answer API
      const url = new URL('https://api.duckduckgo.com/');
      url.searchParams.set('q', query);
      url.searchParams.set('format', 'json');
      url.searchParams.set('no_html', '1');
      url.searchParams.set('skip_disambig', '1');

      const response = await fetch(url.toString());
      const data = await response.json();
      const results = this.parseDDGResults(data);

      if (this.config.cacheEnabled) {
        this.cache.set(cacheKey, { results, timestamp: Date.now() });
      }

      return results;
    } catch (error: any) {
      console.error('DuckDuckGo search failed:', error.message);
      return [];
    }
  }

  private parseDDGResults(data: any) {
    const results = [];

    // Instant answer
    if (data.Abstract) {
      results.push({
        title: data.Heading,
        url: data.AbstractURL,
        description: data.Abstract,
        snippet: data.Abstract,
        source: 'duckduckgo-instant',
        timestamp: Date.now()
      });
    }

    // Related topics
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0],
            url: topic.FirstURL,
            description: topic.Text,
            snippet: topic.Text,
            source: 'duckduckgo-related',
            timestamp: Date.now()
          });
        }
      }
    }

    return results.slice(0, this.config.maxResults);
  }

  // ===== SearXNG (Self-hosted metasearch) =====

  async searchSearXNG(query: string, options: any = {}) {
    const instance = options.instance || 'https://searx.be';

    try {
      const url = new URL(`${instance}/search`);
      url.searchParams.set('q', query);
      url.searchParams.set('format', 'json');
      url.searchParams.set('language', 'en');

      const response = await fetch(url.toString());
      const data = await response.json();

      return data.results.slice(0, this.config.maxResults).map((result: any) => ({
        title: result.title,
        url: result.url,
        description: result.content,
        snippet: result.content,
        source: 'searxng',
        timestamp: Date.now()
      }));
    } catch (error: any) {
      console.error('SearXNG search failed:', error.message);
      return [];
    }
  }

  // ===== Perplexity API =====

  async searchPerplexity(query: string, options: any = {}) {
    const apiKey = await this.getAPIKey('PERPLEXITY_API_KEY');
    if (!apiKey) {
      console.warn('Perplexity API key not configured');
      return null;
    }

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: options.model || 'llama-3.1-sonar-large-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful research assistant. Provide comprehensive answers with sources.'
            },
            {
              role: 'user',
              content: query
            }
          ],
          temperature: 0.2,
          max_tokens: options.maxTokens || 2048
        })
      });

      const data = await response.json();
      
      return {
        answer: data.choices[0].message.content,
        sources: this.extractSources(data.choices[0].message.content),
        model: data.model,
        timestamp: Date.now()
      };
    } catch (error: any) {
      console.error('Perplexity search failed:', error.message);
      return null;
    }
  }

  // ===== Multi-Engine Search =====

  async searchAll(query: string, options: any = {}) {
    console.log(`🔍 Searching: "${query}"`);

    const engines = options.engines || ['brave', 'duckduckgo', 'searxng'];
    const results = await Promise.allSettled([
      engines.includes('brave') ? this.searchBrave(query, options) : Promise.resolve([]),
      engines.includes('duckduckgo') ? this.searchDuckDuckGo(query, options) : Promise.resolve([]),
      engines.includes('searxng') ? this.searchSearXNG(query, options) : Promise.resolve([]),
      engines.includes('perplexity') ? this.searchPerplexity(query, options) : Promise.resolve(null)
    ]);

    // Combine and deduplicate results
    const combined: any[] = [];
    const seen = new Set();

    for (const result of results) {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        for (const item of result.value) {
          if (!seen.has(item.url)) {
            seen.add(item.url);
            combined.push(item);
          }
        }
      }
    }

    // Add Perplexity answer if available
    const perplexityResult = results[3];
    const perplexityAnswer = perplexityResult.status === 'fulfilled' ? perplexityResult.value : null;

    return {
      query,
      results: combined,
      perplexity: perplexityAnswer,
      totalResults: combined.length,
      timestamp: Date.now()
    };
  }

  // ===== Smart Search (AI-enhanced) =====

  async smartSearch(query: string, llm: any, options: any = {}) {
    // Step 1: Get raw search results
    const searchResults = await this.searchAll(query, options);

    // Step 2: If Perplexity available, use that as primary answer
    if (searchResults.perplexity) {
      return {
        type: 'perplexity-direct',
        answer: searchResults.perplexity.answer,
        sources: searchResults.perplexity.sources,
        additionalResults: searchResults.results.slice(0, 5)
      };
    }

    // Step 3: Use local LLM to synthesize results
    const prompt = `You are a research assistant. Synthesize these search results into a comprehensive answer.

Query: "${query}"

Search Results:
${searchResults.results.slice(0, 10).map((r: any, i: number) => 
  `${i + 1}. ${r.title}\n   URL: ${r.url}\n   ${r.description}`
).join('\n\n')}

Provide a comprehensive answer with citations [1], [2], etc.`;

    const response = await llm.generate({
      model: options.model || 'llama3.1:8b',
      prompt,
      options: { temperature: 0.3 }
    });

    return {
      type: 'synthesized',
      answer: response.response,
      sources: searchResults.results.slice(0, 10),
      totalSources: searchResults.totalResults
    };
  }

  // ===== Specialized Searches =====

  async searchCode(query: string) {
    // Search GitHub, Stack Overflow, etc.
    const results = await Promise.allSettled([
      this.searchGitHub(query),
      this.searchStackOverflow(query)
    ]);

    const combined: any[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        combined.push(...result.value);
      }
    }

    return combined;
  }

  async searchGitHub(query: string) {
    try {
      const url = new URL('https://api.github.com/search/code');
      url.searchParams.set('q', query);
      url.searchParams.set('per_page', '10');

      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Sovereign-Browser-OS'
        }
      });

      const data = await response.json();

      return data.items?.map((item: any) => ({
        title: item.name,
        url: item.html_url,
        description: item.repository.description,
        snippet: `${item.repository.full_name} - ${item.path}`,
        source: 'github',
        repository: item.repository.full_name
      })) || [];
    } catch (error: any) {
      console.error('GitHub search failed:', error.message);
      return [];
    }
  }

  async searchStackOverflow(query: string) {
    try {
      const url = new URL('https://api.stackexchange.com/2.3/search/advanced');
      url.searchParams.set('order', 'desc');
      url.searchParams.set('sort', 'relevance');
      url.searchParams.set('q', query);
      url.searchParams.set('site', 'stackoverflow');

      const response = await fetch(url.toString());
      const data = await response.json();

      return data.items?.map((item: any) => ({
        title: item.title,
        url: item.link,
        description: `Score: ${item.score}, Answers: ${item.answer_count}`,
        snippet: item.title,
        source: 'stackoverflow',
        score: item.score,
        answered: item.is_answered
      })) || [];
    } catch (error: any) {
      console.error('StackOverflow search failed:', error.message);
      return [];
    }
  }

  async searchAcademic(query: string) {
    // Search arXiv, Semantic Scholar, etc.
    return await this.searchArxiv(query);
  }

  async searchArxiv(query: string) {
    try {
      const url = new URL('http://export.arxiv.org/api/query');
      url.searchParams.set('search_query', `all:${query}`);
      url.searchParams.set('start', '0');
      url.searchParams.set('max_results', '10');

      const response = await fetch(url.toString());
      const xml = await response.text();

      // Parse XML (simplified)
      const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];

      return entries.map(entry => {
        const title = entry.match(/<title>(.*?)<\/title>/)?.[1]?.trim();
        const summary = entry.match(/<summary>(.*?)<\/summary>/)?.[1]?.trim();
        const link = entry.match(/<id>(.*?)<\/id>/)?.[1]?.trim();

        return {
          title,
          url: link,
          description: summary,
          snippet: summary?.slice(0, 200),
          source: 'arxiv'
        };
      });
    } catch (error: any) {
      console.error('arXiv search failed:', error.message);
      return [];
    }
  }

  // ===== Utilities =====

  private extractSources(text: string) {
    // Extract URLs from text
    const urlRegex = /https?:\/\/[^\s\)]+/g;
    const urls = text.match(urlRegex) || [];
    return [...new Set(urls)];
  }

  private async getAPIKey(key: string) {
    // Get from environment or data layer
    return Deno.env.get(key) || null;
  }

  clearCache() {
    this.cache.clear();
  }
}

export default SearchEngine;
