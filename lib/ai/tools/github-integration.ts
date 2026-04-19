import { tool } from 'ai';
import { z } from 'zod';

/**
 * GitHub Integration Tool
 * Provides access to GitHub data including repositories, issues, pull requests, and code
 */

interface GitHubAPIOptions {
  endpoint: string;
  token?: string;
  accept?: string;
}

async function githubAPI({ endpoint, token, accept = 'application/vnd.github+json' }: GitHubAPIOptions) {
  const headers: Record<string, string> = {
    'Accept': accept,
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`https://api.github.com${endpoint}`, {
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`GitHub API error: ${error.message || response.statusText}`);
  }

  return response.json();
}

export const githubIntegration = tool({
  description: 'Access GitHub data including repositories, issues, pull requests, commits, and code. Can search repositories, get repository details, list issues/PRs, fetch file contents, and more.',
  parameters: z.object({
    action: z.enum([
      'search_repos',
      'get_repo',
      'list_issues',
      'get_issue',
      'list_prs',
      'get_pr',
      'get_file',
      'search_code',
      'list_commits',
      'get_user',
      'list_user_repos',
    ]).describe('The action to perform'),
    
    // Common parameters
    owner: z.string().optional().describe('Repository owner (username or organization)'),
    repo: z.string().optional().describe('Repository name'),
    
    // Search parameters
    query: z.string().optional().describe('Search query for repositories or code'),
    sort: z.enum(['stars', 'forks', 'updated', 'created']).optional().describe('Sort order for search results'),
    order: z.enum(['asc', 'desc']).optional().describe('Order direction'),
    per_page: z.number().min(1).max(100).default(30).describe('Results per page'),
    page: z.number().min(1).default(1).describe('Page number'),
    
    // Issue/PR parameters
    state: z.enum(['open', 'closed', 'all']).optional().describe('State filter for issues/PRs'),
    issue_number: z.number().optional().describe('Issue or PR number'),
    
    // File/code parameters
    path: z.string().optional().describe('File path in repository'),
    ref: z.string().optional().describe('Git reference (branch, tag, or commit SHA)'),
    
    // User parameters
    username: z.string().optional().describe('GitHub username'),
  }),
  execute: async ({ action, owner, repo, query, sort, order, per_page, page, state, issue_number, path, ref, username }) => {
    try {
      const token = process.env.GITHUB_TOKEN || process.env.GITHUB_API_KEY;
      
      switch (action) {
        case 'search_repos': {
          if (!query) {
            return { success: false, error: 'Query is required for repository search' };
          }
          
          let endpoint = `/search/repositories?q=${encodeURIComponent(query)}&per_page=${per_page}&page=${page}`;
          if (sort) endpoint += `&sort=${sort}`;
          if (order) endpoint += `&order=${order}`;
          
          const data = await githubAPI({ endpoint, token });
          
          return {
            success: true,
            total_count: data.total_count,
            repositories: data.items.map((item: any) => ({
              name: item.name,
              full_name: item.full_name,
              description: item.description,
              url: item.html_url,
              stars: item.stargazers_count,
              forks: item.forks_count,
              language: item.language,
              updated_at: item.updated_at,
              topics: item.topics || [],
            })),
          };
        }
        
        case 'get_repo': {
          if (!owner || !repo) {
            return { success: false, error: 'Owner and repo are required' };
          }
          
          const data = await githubAPI({ endpoint: `/repos/${owner}/${repo}`, token });
          
          return {
            success: true,
            repository: {
              name: data.name,
              full_name: data.full_name,
              description: data.description,
              url: data.html_url,
              stars: data.stargazers_count,
              forks: data.forks_count,
              watchers: data.watchers_count,
              language: data.language,
              open_issues: data.open_issues_count,
              default_branch: data.default_branch,
              created_at: data.created_at,
              updated_at: data.updated_at,
              topics: data.topics || [],
              license: data.license?.name,
            },
          };
        }
        
        case 'list_issues': {
          if (!owner || !repo) {
            return { success: false, error: 'Owner and repo are required' };
          }
          
          let endpoint = `/repos/${owner}/${repo}/issues?per_page=${per_page}&page=${page}`;
          if (state) endpoint += `&state=${state}`;
          
          const data = await githubAPI({ endpoint, token });
          
          return {
            success: true,
            issues: data.map((item: any) => ({
              number: item.number,
              title: item.title,
              state: item.state,
              user: item.user.login,
              labels: item.labels.map((l: any) => l.name),
              created_at: item.created_at,
              updated_at: item.updated_at,
              comments: item.comments,
              url: item.html_url,
              body: item.body?.substring(0, 500), // Truncate for brevity
            })),
          };
        }
        
        case 'get_issue': {
          if (!owner || !repo || !issue_number) {
            return { success: false, error: 'Owner, repo, and issue_number are required' };
          }
          
          const data = await githubAPI({ endpoint: `/repos/${owner}/${repo}/issues/${issue_number}`, token });
          
          return {
            success: true,
            issue: {
              number: data.number,
              title: data.title,
              state: data.state,
              user: data.user.login,
              labels: data.labels.map((l: any) => l.name),
              created_at: data.created_at,
              updated_at: data.updated_at,
              comments: data.comments,
              url: data.html_url,
              body: data.body,
            },
          };
        }
        
        case 'list_prs': {
          if (!owner || !repo) {
            return { success: false, error: 'Owner and repo are required' };
          }
          
          let endpoint = `/repos/${owner}/${repo}/pulls?per_page=${per_page}&page=${page}`;
          if (state) endpoint += `&state=${state}`;
          
          const data = await githubAPI({ endpoint, token });
          
          return {
            success: true,
            pull_requests: data.map((item: any) => ({
              number: item.number,
              title: item.title,
              state: item.state,
              user: item.user.login,
              created_at: item.created_at,
              updated_at: item.updated_at,
              url: item.html_url,
              draft: item.draft,
              mergeable_state: item.mergeable_state,
              head: {
                ref: item.head.ref,
                sha: item.head.sha,
              },
              base: {
                ref: item.base.ref,
                sha: item.base.sha,
              },
            })),
          };
        }
        
        case 'get_pr': {
          if (!owner || !repo || !issue_number) {
            return { success: false, error: 'Owner, repo, and issue_number (PR number) are required' };
          }
          
          const data = await githubAPI({ endpoint: `/repos/${owner}/${repo}/pulls/${issue_number}`, token });
          
          return {
            success: true,
            pull_request: {
              number: data.number,
              title: data.title,
              state: data.state,
              user: data.user.login,
              created_at: data.created_at,
              updated_at: data.updated_at,
              merged_at: data.merged_at,
              url: data.html_url,
              body: data.body,
              draft: data.draft,
              mergeable: data.mergeable,
              mergeable_state: data.mergeable_state,
              additions: data.additions,
              deletions: data.deletions,
              changed_files: data.changed_files,
              head: {
                ref: data.head.ref,
                sha: data.head.sha,
              },
              base: {
                ref: data.base.ref,
                sha: data.base.sha,
              },
            },
          };
        }
        
        case 'get_file': {
          if (!owner || !repo || !path) {
            return { success: false, error: 'Owner, repo, and path are required' };
          }
          
          let endpoint = `/repos/${owner}/${repo}/contents/${path}`;
          if (ref) endpoint += `?ref=${ref}`;
          
          const data = await githubAPI({ endpoint, token });
          
          // Decode base64 content if it's a file
          if (data.type === 'file' && data.content) {
            const content = Buffer.from(data.content, 'base64').toString('utf-8');
            return {
              success: true,
              file: {
                name: data.name,
                path: data.path,
                size: data.size,
                type: data.type,
                content: content,
                url: data.html_url,
                download_url: data.download_url,
              },
            };
          } else if (data.type === 'dir') {
            return {
              success: true,
              directory: {
                path: data.path,
                items: Array.isArray(data) ? data.map((item: any) => ({
                  name: item.name,
                  path: item.path,
                  type: item.type,
                  size: item.size,
                })) : [],
              },
            };
          }
          
          return { success: false, error: 'Unexpected file type' };
        }
        
        case 'search_code': {
          if (!query) {
            return { success: false, error: 'Query is required for code search' };
          }
          
          let endpoint = `/search/code?q=${encodeURIComponent(query)}&per_page=${per_page}&page=${page}`;
          if (sort) endpoint += `&sort=${sort}`;
          if (order) endpoint += `&order=${order}`;
          
          const data = await githubAPI({ endpoint, token });
          
          return {
            success: true,
            total_count: data.total_count,
            results: data.items.map((item: any) => ({
              name: item.name,
              path: item.path,
              repository: item.repository.full_name,
              url: item.html_url,
              score: item.score,
            })),
          };
        }
        
        case 'list_commits': {
          if (!owner || !repo) {
            return { success: false, error: 'Owner and repo are required' };
          }
          
          let endpoint = `/repos/${owner}/${repo}/commits?per_page=${per_page}&page=${page}`;
          if (ref) endpoint += `&sha=${ref}`;
          
          const data = await githubAPI({ endpoint, token });
          
          return {
            success: true,
            commits: data.map((item: any) => ({
              sha: item.sha,
              message: item.commit.message,
              author: {
                name: item.commit.author.name,
                email: item.commit.author.email,
                date: item.commit.author.date,
              },
              url: item.html_url,
            })),
          };
        }
        
        case 'get_user': {
          if (!username) {
            return { success: false, error: 'Username is required' };
          }
          
          const data = await githubAPI({ endpoint: `/users/${username}`, token });
          
          return {
            success: true,
            user: {
              login: data.login,
              name: data.name,
              bio: data.bio,
              company: data.company,
              location: data.location,
              email: data.email,
              blog: data.blog,
              twitter_username: data.twitter_username,
              public_repos: data.public_repos,
              followers: data.followers,
              following: data.following,
              created_at: data.created_at,
              updated_at: data.updated_at,
              url: data.html_url,
            },
          };
        }
        
        case 'list_user_repos': {
          if (!username) {
            return { success: false, error: 'Username is required' };
          }
          
          let endpoint = `/users/${username}/repos?per_page=${per_page}&page=${page}`;
          if (sort) endpoint += `&sort=${sort}`;
          if (order) endpoint += `&order=${order}`;
          
          const data = await githubAPI({ endpoint, token });
          
          return {
            success: true,
            repositories: data.map((item: any) => ({
              name: item.name,
              full_name: item.full_name,
              description: item.description,
              url: item.html_url,
              stars: item.stargazers_count,
              forks: item.forks_count,
              language: item.language,
              updated_at: item.updated_at,
              topics: item.topics || [],
            })),
          };
        }
        
        default:
          return { success: false, error: 'Invalid action' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});
