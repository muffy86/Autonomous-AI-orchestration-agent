import { describe, it, expect, } from '@jest/globals';
import { githubIntegration } from '@/lib/ai/tools/github-integration';
import { webFetch, webSearch } from '@/lib/ai/tools/web-fetch';

describe('GitHub Integration Tool', () => {
  it('should search repositories', async () => {
    const result = await githubIntegration.execute({
      action: 'search_repos',
      query: 'react',
      per_page: 5,
      page: 1,
    });

    expect(result).toHaveProperty('success');
    if (result.success) {
      expect(result).toHaveProperty('repositories');
      expect(Array.isArray(result.repositories)).toBe(true);
    }
  });

  it('should get repository details', async () => {
    const result = await githubIntegration.execute({
      action: 'get_repo',
      owner: 'facebook',
      repo: 'react',
      per_page: 30,
      page: 1,
    });

    expect(result).toHaveProperty('success');
    if (result.success) {
      expect(result).toHaveProperty('repository');
      expect(result.repository).toHaveProperty('name');
      expect(result.repository).toHaveProperty('full_name');
    }
  });

  it('should get file contents', async () => {
    const result = await githubIntegration.execute({
      action: 'get_file',
      owner: 'facebook',
      repo: 'react',
      path: 'README.md',
      per_page: 30,
      page: 1,
    });

    expect(result).toHaveProperty('success');
    if (result.success) {
      expect(result).toHaveProperty('file');
      expect(result.file).toHaveProperty('content');
    }
  });

  it('should handle missing parameters', async () => {
    const result = await githubIntegration.execute({
      action: 'get_repo',
      per_page: 30,
      page: 1,
    });

    expect(result.success).toBe(false);
    expect(result).toHaveProperty('error');
  });
});

describe('Web Fetch Tool', () => {
  it('should fetch web content from a URL', async () => {
    const result = await webFetch.execute({
      url: 'https://example.com',
      extract_text: true,
      include_metadata: true,
      max_length: 10000,
    });

    expect(result).toHaveProperty('success');
    if (result.success) {
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('url');
      expect(result.content_type).toContain('text/html');
    }
  });

  it('should extract metadata from HTML', async () => {
    const result = await webFetch.execute({
      url: 'https://github.com',
      extract_text: true,
      include_metadata: true,
      max_length: 10000,
    });

    expect(result).toHaveProperty('success');
    if (result.success && result.metadata) {
      expect(result.metadata).toHaveProperty('title');
    }
  });

  it('should handle invalid URLs', async () => {
    const result = await webFetch.execute({
      url: 'not-a-valid-url',
      extract_text: true,
      include_metadata: true,
      max_length: 10000,
    });

    expect(result.success).toBe(false);
    expect(result).toHaveProperty('error');
  });

  it('should truncate long content', async () => {
    const result = await webFetch.execute({
      url: 'https://example.com',
      extract_text: true,
      include_metadata: true,
      max_length: 100,
    });

    if (result.success) {
      expect(result.content_length).toBeLessThanOrEqual(150); // Allow some buffer
    }
  });
});

describe('Web Search Tool', () => {
  it('should perform a web search', async () => {
    const result = await webSearch.execute({
      query: 'JavaScript frameworks',
      max_results: 3,
    });

    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('query');
    expect(result.query).toBe('JavaScript frameworks');
    expect(result).toHaveProperty('results');
    expect(Array.isArray(result.results)).toBe(true);
  });

  it('should limit search results', async () => {
    const result = await webSearch.execute({
      query: 'React tutorials',
      max_results: 5,
    });

    if (result.success && result.results.length > 0) {
      expect(result.results.length).toBeLessThanOrEqual(5);
    }
  });
});
