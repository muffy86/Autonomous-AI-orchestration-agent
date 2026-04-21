/**
 * Multi-Model Provider Support
 * Integrates multiple AI providers with free tier support
 */

import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { xai } from '@ai-sdk/xai';
import { createOpenAI } from '@ai-sdk/openai';

export interface ModelProvider {
  id: string;
  name: string;
  description: string;
  models: ModelInfo[];
  apiKeyEnv: string;
  free: boolean;
  apiKeyConfigured: boolean;
  provider: any;
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  contextWindow: number;
  maxOutput: number;
  pricing?: {
    input: number;
    output: number;
  };
}

class ModelProviderManager {
  private providers: Map<string, ModelProvider> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // OpenAI (has free tier via some platforms)
    this.providers.set('openai', {
      id: 'openai',
      name: 'OpenAI',
      description: 'GPT models from OpenAI',
      apiKeyEnv: 'OPENAI_API_KEY',
      free: false,
      apiKeyConfigured: !!process.env.OPENAI_API_KEY,
      provider: openai,
      models: [
        {
          id: 'gpt-4o',
          name: 'GPT-4o',
          description: 'Most capable GPT-4 model',
          capabilities: ['text', 'vision', 'function-calling', 'json-mode'],
          contextWindow: 128000,
          maxOutput: 16384,
          pricing: { input: 2.5, output: 10.0 },
        },
        {
          id: 'gpt-4o-mini',
          name: 'GPT-4o Mini',
          description: 'Faster, cheaper GPT-4 variant',
          capabilities: ['text', 'vision', 'function-calling', 'json-mode'],
          contextWindow: 128000,
          maxOutput: 16384,
          pricing: { input: 0.15, output: 0.6 },
        },
        {
          id: 'gpt-3.5-turbo',
          name: 'GPT-3.5 Turbo',
          description: 'Fast and efficient model',
          capabilities: ['text', 'function-calling', 'json-mode'],
          contextWindow: 16385,
          maxOutput: 4096,
          pricing: { input: 0.5, output: 1.5 },
        },
      ],
    });

    // Anthropic Claude
    this.providers.set('anthropic', {
      id: 'anthropic',
      name: 'Anthropic',
      description: 'Claude models from Anthropic',
      apiKeyEnv: 'ANTHROPIC_API_KEY',
      free: false,
      apiKeyConfigured: !!process.env.ANTHROPIC_API_KEY,
      provider: anthropic,
      models: [
        {
          id: 'claude-3-5-sonnet-20241022',
          name: 'Claude 3.5 Sonnet',
          description: 'Most capable Claude model',
          capabilities: ['text', 'vision', 'function-calling', 'thinking'],
          contextWindow: 200000,
          maxOutput: 8192,
          pricing: { input: 3.0, output: 15.0 },
        },
        {
          id: 'claude-3-5-haiku-20241022',
          name: 'Claude 3.5 Haiku',
          description: 'Fast and efficient Claude model',
          capabilities: ['text', 'vision', 'function-calling'],
          contextWindow: 200000,
          maxOutput: 8192,
          pricing: { input: 0.8, output: 4.0 },
        },
      ],
    });

    // Google Gemini (has free tier)
    this.providers.set('google', {
      id: 'google',
      name: 'Google',
      description: 'Gemini models from Google',
      apiKeyEnv: 'GOOGLE_GENERATIVE_AI_API_KEY',
      free: true,
      apiKeyConfigured: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      provider: google,
      models: [
        {
          id: 'gemini-2.0-flash-exp',
          name: 'Gemini 2.0 Flash',
          description: 'Latest Gemini model with multimodal capabilities',
          capabilities: ['text', 'vision', 'audio', 'function-calling', 'thinking'],
          contextWindow: 1000000,
          maxOutput: 8192,
          pricing: { input: 0, output: 0 },
        },
        {
          id: 'gemini-1.5-pro',
          name: 'Gemini 1.5 Pro',
          description: 'Advanced Gemini model',
          capabilities: ['text', 'vision', 'function-calling'],
          contextWindow: 2000000,
          maxOutput: 8192,
          pricing: { input: 1.25, output: 5.0 },
        },
        {
          id: 'gemini-1.5-flash',
          name: 'Gemini 1.5 Flash',
          description: 'Fast Gemini model with free tier',
          capabilities: ['text', 'vision', 'function-calling'],
          contextWindow: 1000000,
          maxOutput: 8192,
          pricing: { input: 0, output: 0 },
        },
      ],
    });

    // xAI Grok
    this.providers.set('xai', {
      id: 'xai',
      name: 'xAI',
      description: 'Grok models from xAI',
      apiKeyEnv: 'XAI_API_KEY',
      free: false,
      apiKeyConfigured: !!process.env.XAI_API_KEY,
      provider: xai,
      models: [
        {
          id: 'grok-2-vision-1212',
          name: 'Grok 2 Vision',
          description: 'Grok model with vision capabilities',
          capabilities: ['text', 'vision', 'function-calling'],
          contextWindow: 128000,
          maxOutput: 16384,
        },
        {
          id: 'grok-3-mini-beta',
          name: 'Grok 3 Mini',
          description: 'Fast Grok model',
          capabilities: ['text', 'function-calling', 'thinking'],
          contextWindow: 128000,
          maxOutput: 16384,
        },
      ],
    });

    // OpenRouter (aggregates many providers, some free)
    const openrouter = createOpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    this.providers.set('openrouter', {
      id: 'openrouter',
      name: 'OpenRouter',
      description: 'Access to multiple models via OpenRouter',
      apiKeyEnv: 'OPENROUTER_API_KEY',
      free: true,
      apiKeyConfigured: !!process.env.OPENROUTER_API_KEY,
      provider: openrouter,
      models: [
        {
          id: 'google/gemini-flash-1.5',
          name: 'Gemini Flash 1.5 (via OpenRouter)',
          description: 'Free Gemini model via OpenRouter',
          capabilities: ['text', 'vision', 'function-calling'],
          contextWindow: 1000000,
          maxOutput: 8192,
          pricing: { input: 0, output: 0 },
        },
        {
          id: 'meta-llama/llama-3.2-3b-instruct:free',
          name: 'Llama 3.2 3B (Free)',
          description: 'Free Llama model',
          capabilities: ['text'],
          contextWindow: 131072,
          maxOutput: 4096,
          pricing: { input: 0, output: 0 },
        },
        {
          id: 'mistralai/mistral-7b-instruct:free',
          name: 'Mistral 7B (Free)',
          description: 'Free Mistral model',
          capabilities: ['text', 'function-calling'],
          contextWindow: 32768,
          maxOutput: 4096,
          pricing: { input: 0, output: 0 },
        },
      ],
    });

    // Groq (very fast, free tier)
    const groq = createOpenAI({
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: process.env.GROQ_API_KEY,
    });

    this.providers.set('groq', {
      id: 'groq',
      name: 'Groq',
      description: 'Ultra-fast inference with Groq LPU',
      apiKeyEnv: 'GROQ_API_KEY',
      free: true,
      apiKeyConfigured: !!process.env.GROQ_API_KEY,
      provider: groq,
      models: [
        {
          id: 'llama-3.3-70b-versatile',
          name: 'Llama 3.3 70B',
          description: 'Latest Llama model on Groq',
          capabilities: ['text', 'function-calling'],
          contextWindow: 128000,
          maxOutput: 32768,
          pricing: { input: 0, output: 0 },
        },
        {
          id: 'mixtral-8x7b-32768',
          name: 'Mixtral 8x7B',
          description: 'Fast mixture-of-experts model',
          capabilities: ['text', 'function-calling'],
          contextWindow: 32768,
          maxOutput: 32768,
          pricing: { input: 0, output: 0 },
        },
      ],
    });

    // Together AI (free credits)
    const together = createOpenAI({
      baseURL: 'https://api.together.xyz/v1',
      apiKey: process.env.TOGETHER_API_KEY,
    });

    this.providers.set('together', {
      id: 'together',
      name: 'Together AI',
      description: 'Open source models on Together AI',
      apiKeyEnv: 'TOGETHER_API_KEY',
      free: true,
      apiKeyConfigured: !!process.env.TOGETHER_API_KEY,
      provider: together,
      models: [
        {
          id: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
          name: 'Llama 3.1 70B Turbo',
          description: 'Fast Llama 3.1 model',
          capabilities: ['text', 'function-calling'],
          contextWindow: 131072,
          maxOutput: 4096,
          pricing: { input: 0.88, output: 0.88 },
        },
      ],
    });

    // Public AI (SOVEREIGN, FREE, OPEN-SOURCE!)
    const publicai = createOpenAI({
      baseURL: 'https://api.publicai.co/v1',
      apiKey: process.env.PUBLICAI_API_KEY || 'public',
    });

    this.providers.set('publicai', {
      id: 'publicai',
      name: 'Public AI',
      description: 'Sovereign, open-source AI models from public institutions (FREE)',
      apiKeyEnv: 'PUBLICAI_API_KEY',
      free: true,
      apiKeyConfigured: true, // Works without API key!
      provider: publicai,
      models: [
        {
          id: 'apertus',
          name: 'Apertus (Swiss AI)',
          description: 'Swiss AI Initiative foundation model - sovereign, transparent, GDPR-compliant',
          capabilities: ['text', 'multilingual', 'translation', 'rag', 'web-search'],
          contextWindow: 65536,
          maxOutput: 8192,
          pricing: { input: 0, output: 0 },
        },
        {
          id: 'sea-lion-v4',
          name: 'SEA-LION v4',
          description: 'Southeast Asian multilingual model',
          capabilities: ['text', 'multilingual', 'translation'],
          contextWindow: 65536,
          maxOutput: 8192,
          pricing: { input: 0, output: 0 },
        },
      ],
    });

    // Ollama (LOCAL, SOVEREIGN, UNCENSORED!)
    const ollama = createOpenAI({
      baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
      apiKey: 'ollama',
    });

    this.providers.set('ollama', {
      id: 'ollama',
      name: 'Ollama',
      description: 'Local AI models - fully sovereign, uncensored, runs on your machine',
      apiKeyEnv: 'OLLAMA_BASE_URL',
      free: true,
      apiKeyConfigured: true,
      provider: ollama,
      models: [
        {
          id: 'dolphin-mixtral:8x7b',
          name: 'Dolphin Mixtral 8x7B (UNCENSORED)',
          description: 'Uncensored Mixtral - no restrictions, runs locally',
          capabilities: ['text', 'code', 'uncensored', 'local'],
          contextWindow: 32768,
          maxOutput: 8192,
          pricing: { input: 0, output: 0 },
        },
        {
          id: 'nous-hermes2:latest',
          name: 'Nous Hermes 2 (UNCENSORED)',
          description: 'Uncensored and highly capable - runs locally',
          capabilities: ['text', 'code', 'reasoning', 'uncensored', 'local'],
          contextWindow: 8192,
          maxOutput: 4096,
          pricing: { input: 0, output: 0 },
        },
        {
          id: 'llama3.2:latest',
          name: 'Llama 3.2 (LOCAL)',
          description: 'Latest Meta model - runs locally',
          capabilities: ['text', 'multilingual', 'local'],
          contextWindow: 8192,
          maxOutput: 4096,
          pricing: { input: 0, output: 0 },
        },
        {
          id: 'llava:latest',
          name: 'LLaVA (VISION + LOCAL)',
          description: 'Vision and language model - runs locally',
          capabilities: ['vision', 'text', 'local'],
          contextWindow: 4096,
          maxOutput: 2048,
          pricing: { input: 0, output: 0 },
        },
      ],
    });
  }

  listProviders() {
    return Array.from(this.providers.values()).map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      free: p.free,
      apiKeyConfigured: p.apiKeyConfigured,
      apiKeyEnv: p.apiKeyEnv,
      models: p.models.map(m => ({
        id: m.id,
        name: m.name,
        description: m.description,
        capabilities: m.capabilities,
      })),
    }));
  }

  getProvider(id: string) {
    return this.providers.get(id);
  }

  getModel(providerId: string, modelId: string) {
    const provider = this.providers.get(providerId);
    if (!provider) return null;
    
    const model = provider.models.find(m => m.id === modelId);
    if (!model) return null;

    return {
      provider: provider.provider,
      model: provider.provider(modelId),
      info: model,
    };
  }

  getFreeProviders() {
    return Array.from(this.providers.values()).filter(p => p.free);
  }

  getConfiguredProviders() {
    return Array.from(this.providers.values()).filter(p => p.apiKeyConfigured);
  }

  getAllModels() {
    const models: Array<{ provider: string; model: ModelInfo }> = [];
    for (const provider of this.providers.values()) {
      for (const model of provider.models) {
        models.push({
          provider: provider.name,
          model,
        });
      }
    }
    return models;
  }

  getFreeModels() {
    const models: Array<{ provider: string; model: ModelInfo }> = [];
    for (const provider of this.providers.values()) {
      if (provider.free) {
        for (const model of provider.models) {
          if (!model.pricing || (model.pricing.input === 0 && model.pricing.output === 0)) {
            models.push({
              provider: provider.name,
              model,
            });
          }
        }
      }
    }
    return models;
  }
}

export const modelProviders = new ModelProviderManager();
