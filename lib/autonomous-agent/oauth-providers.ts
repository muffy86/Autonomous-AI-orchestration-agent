/**
 * OAuth & API Integration Hub
 * Support for major OAuth providers and API platforms
 */

import { z } from 'zod';
import { nanoid } from 'nanoid';

// ============================================================================
// OAuth Provider Types
// ============================================================================

export const OAuthProviderSchema = z.enum([
  'github',
  'google',
  'microsoft',
  'slack',
  'discord',
  'twitter',
  'linkedin',
  'notion',
  'airtable',
  'dropbox',
  'box',
  'salesforce',
  'hubspot',
  'stripe',
  'shopify',
  'custom',
]);

export const OAuthConfigSchema = z.object({
  provider: OAuthProviderSchema,
  clientId: z.string(),
  clientSecret: z.string(),
  redirectUri: z.string().url(),
  scopes: z.array(z.string()),
  authorizationURL: z.string().url(),
  tokenURL: z.string().url(),
  userInfoURL: z.string().url().optional(),
});

export const TokenSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.number().optional(),
  tokenType: z.string().default('Bearer'),
  scope: z.string().optional(),
});

export type OAuthProvider = z.infer<typeof OAuthProviderSchema>;
export type OAuthConfig = z.infer<typeof OAuthConfigSchema>;
export type Token = z.infer<typeof TokenSchema>;

// ============================================================================
// OAuth Manager
// ============================================================================

export class OAuthManager {
  private providers: Map<string, OAuthConfig> = new Map();
  private tokens: Map<string, Token> = new Map();

  registerProvider(id: string, config: OAuthConfig): void {
    this.providers.set(id, config);
    console.log(`🔐 Registered OAuth provider: ${config.provider}`);
  }

  getAuthorizationURL(providerId: string, state?: string): string {
    const config = this.providers.get(providerId);
    if (!config) {
      throw new Error(`Provider not found: ${providerId}`);
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(' '),
      response_type: 'code',
      state: state || nanoid(),
    });

    return `${config.authorizationURL}?${params.toString()}`;
  }

  async exchangeCodeForToken(
    providerId: string,
    code: string
  ): Promise<Token> {
    const config = this.providers.get(providerId);
    if (!config) {
      throw new Error(`Provider not found: ${providerId}`);
    }

    // In production: Make actual token exchange request
    // const response = await fetch(config.tokenURL, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    //   body: new URLSearchParams({
    //     grant_type: 'authorization_code',
    //     code,
    //     client_id: config.clientId,
    //     client_secret: config.clientSecret,
    //     redirect_uri: config.redirectUri,
    //   }),
    // });

    console.log(`🔑 Exchanging code for token: ${config.provider}`);

    const token: Token = {
      accessToken: `${config.provider}_${nanoid()}`,
      refreshToken: `refresh_${nanoid()}`,
      expiresAt: Date.now() + 3600000, // 1 hour
      tokenType: 'Bearer',
      scope: config.scopes.join(' '),
    };

    this.tokens.set(providerId, token);
    return token;
  }

  async refreshToken(providerId: string): Promise<Token> {
    const config = this.providers.get(providerId);
    const currentToken = this.tokens.get(providerId);

    if (!config || !currentToken?.refreshToken) {
      throw new Error('Cannot refresh token');
    }

    console.log(`🔄 Refreshing token: ${config.provider}`);

    // In production: Make refresh request
    const newToken: Token = {
      accessToken: `${config.provider}_${nanoid()}`,
      refreshToken: currentToken.refreshToken,
      expiresAt: Date.now() + 3600000,
      tokenType: 'Bearer',
    };

    this.tokens.set(providerId, newToken);
    return newToken;
  }

  getToken(providerId: string): Token | undefined {
    const token = this.tokens.get(providerId);
    
    // Auto-refresh if expired
    if (token?.expiresAt && token.expiresAt < Date.now()) {
      this.refreshToken(providerId).catch(console.error);
    }

    return token;
  }

  async revokeToken(providerId: string): Promise<void> {
    this.tokens.delete(providerId);
    console.log(`🗑️  Revoked token: ${providerId}`);
  }
}

// ============================================================================
// Pre-configured OAuth Providers
// ============================================================================

export const OAUTH_PROVIDERS = {
  github: {
    provider: 'github' as const,
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    redirectUri: process.env.GITHUB_REDIRECT_URI || '',
    scopes: ['user', 'repo', 'workflow'],
    authorizationURL: 'https://github.com/login/oauth/authorize',
    tokenURL: 'https://github.com/login/oauth/access_token',
    userInfoURL: 'https://api.github.com/user',
  },

  google: {
    provider: 'google' as const,
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
    scopes: ['openid', 'profile', 'email'],
    authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenURL: 'https://oauth2.googleapis.com/token',
    userInfoURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
  },

  slack: {
    provider: 'slack' as const,
    clientId: process.env.SLACK_CLIENT_ID || '',
    clientSecret: process.env.SLACK_CLIENT_SECRET || '',
    redirectUri: process.env.SLACK_REDIRECT_URI || '',
    scopes: ['channels:read', 'chat:write', 'users:read'],
    authorizationURL: 'https://slack.com/oauth/v2/authorize',
    tokenURL: 'https://slack.com/api/oauth.v2.access',
  },

  notion: {
    provider: 'notion' as const,
    clientId: process.env.NOTION_CLIENT_ID || '',
    clientSecret: process.env.NOTION_CLIENT_SECRET || '',
    redirectUri: process.env.NOTION_REDIRECT_URI || '',
    scopes: [],
    authorizationURL: 'https://api.notion.com/v1/oauth/authorize',
    tokenURL: 'https://api.notion.com/v1/oauth/token',
  },
};

// ============================================================================
// API Integration Manager
// ============================================================================

export class APIIntegrationManager {
  private integrations: Map<string, {
    name: string;
    baseURL: string;
    apiKey?: string;
    headers?: Record<string, string>;
    rateLimit?: number;
  }> = new Map();

  registerIntegration(
    id: string,
    config: {
      name: string;
      baseURL: string;
      apiKey?: string;
      headers?: Record<string, string>;
      rateLimit?: number;
    }
  ): void {
    this.integrations.set(id, config);
    console.log(`🔌 Registered API integration: ${config.name}`);
  }

  async makeRequest(
    integrationId: string,
    endpoint: string,
    options?: {
      method?: string;
      body?: any;
      headers?: Record<string, string>;
      queryParams?: Record<string, string>;
    }
  ): Promise<any> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration not found: ${integrationId}`);
    }

    const url = new URL(endpoint, integration.baseURL);
    
    if (options?.queryParams) {
      Object.entries(options.queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...integration.headers,
      ...options?.headers,
    };

    if (integration.apiKey) {
      headers['Authorization'] = `Bearer ${integration.apiKey}`;
    }

    console.log(`📡 API Request: ${integration.name} ${endpoint}`);

    // In production: Make actual request
    // const response = await fetch(url.toString(), {
    //   method: options?.method || 'GET',
    //   headers,
    //   body: options?.body ? JSON.stringify(options.body) : undefined,
    // });

    return {
      success: true,
      data: {},
    };
  }

  getIntegration(id: string) {
    return this.integrations.get(id);
  }

  listIntegrations(): Array<{ id: string; name: string }> {
    return Array.from(this.integrations.entries()).map(([id, config]) => ({
      id,
      name: config.name,
    }));
  }
}

// ============================================================================
// Pre-configured API Integrations
// ============================================================================

export async function setupAPIIntegrations(manager: APIIntegrationManager): Promise<void> {
  // GitHub API
  manager.registerIntegration('github', {
    name: 'GitHub API',
    baseURL: 'https://api.github.com',
    apiKey: process.env.GITHUB_TOKEN,
    headers: {
      'Accept': 'application/vnd.github.v3+json',
    },
    rateLimit: 5000,
  });

  // Notion API
  manager.registerIntegration('notion', {
    name: 'Notion API',
    baseURL: 'https://api.notion.com/v1',
    apiKey: process.env.NOTION_API_KEY,
    headers: {
      'Notion-Version': '2022-06-28',
    },
  });

  // Slack API
  manager.registerIntegration('slack', {
    name: 'Slack API',
    baseURL: 'https://slack.com/api',
    apiKey: process.env.SLACK_BOT_TOKEN,
  });

  // Airtable API
  manager.registerIntegration('airtable', {
    name: 'Airtable API',
    baseURL: 'https://api.airtable.com/v0',
    apiKey: process.env.AIRTABLE_API_KEY,
  });

  // Stripe API
  manager.registerIntegration('stripe', {
    name: 'Stripe API',
    baseURL: 'https://api.stripe.com/v1',
    apiKey: process.env.STRIPE_SECRET_KEY,
  });

  // HubSpot API
  manager.registerIntegration('hubspot', {
    name: 'HubSpot API',
    baseURL: 'https://api.hubapi.com',
    apiKey: process.env.HUBSPOT_API_KEY,
  });

  // Salesforce API
  manager.registerIntegration('salesforce', {
    name: 'Salesforce API',
    baseURL: process.env.SALESFORCE_INSTANCE_URL || 'https://login.salesforce.com',
    apiKey: process.env.SALESFORCE_ACCESS_TOKEN,
  });

  // Linear API
  manager.registerIntegration('linear', {
    name: 'Linear API',
    baseURL: 'https://api.linear.app/graphql',
    apiKey: process.env.LINEAR_API_KEY,
  });

  // Jira API
  manager.registerIntegration('jira', {
    name: 'Jira API',
    baseURL: process.env.JIRA_BASE_URL || 'https://your-domain.atlassian.net',
    apiKey: process.env.JIRA_API_TOKEN,
    headers: {
      'Accept': 'application/json',
    },
  });

  console.log('✅ API integrations configured');
}
