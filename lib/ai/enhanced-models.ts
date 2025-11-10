/**
 * Enhanced AI Model Management System
 * Provides comprehensive model configuration, capabilities, and management
 */

import { z } from 'zod';

export interface ModelCapabilities {
  textGeneration: boolean;
  codeGeneration: boolean;
  reasoning: boolean;
  vision: boolean;
  functionCalling: boolean;
  streaming: boolean;
  contextLength: number;
  maxTokens: number;
  multimodal: boolean;
  languages: string[];
  specialties: string[];
}

export interface ModelPricing {
  inputTokens: number; // per 1M tokens
  outputTokens: number; // per 1M tokens
  currency: string;
}

export interface ModelLimits {
  requestsPerMinute: number;
  requestsPerDay: number;
  tokensPerMinute: number;
  tokensPerDay: number;
}

export interface EnhancedChatModel {
  id: string;
  name: string;
  description: string;
  provider: string;
  version: string;
  capabilities: ModelCapabilities;
  pricing: ModelPricing;
  limits: ModelLimits;
  isAvailable: boolean;
  isRecommended: boolean;
  category: 'general' | 'coding' | 'reasoning' | 'creative' | 'analysis';
  tags: string[];
  releaseDate: string;
  deprecated?: boolean;
  replacedBy?: string;
}

export const enhancedChatModels: EnhancedChatModel[] = [
  {
    id: 'grok-2-vision-1212',
    name: 'Grok 2 Vision',
    description: 'Advanced multimodal model with vision capabilities and real-time information',
    provider: 'xAI',
    version: '1212',
    capabilities: {
      textGeneration: true,
      codeGeneration: true,
      reasoning: true,
      vision: true,
      functionCalling: true,
      streaming: true,
      contextLength: 131072,
      maxTokens: 4096,
      multimodal: true,
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
      specialties: ['real-time-data', 'image-analysis', 'web-search', 'current-events']
    },
    pricing: {
      inputTokens: 2.0,
      outputTokens: 10.0,
      currency: 'USD'
    },
    limits: {
      requestsPerMinute: 60,
      requestsPerDay: 1000,
      tokensPerMinute: 100000,
      tokensPerDay: 1000000
    },
    isAvailable: true,
    isRecommended: true,
    category: 'general',
    tags: ['multimodal', 'vision', 'real-time', 'recommended'],
    releaseDate: '2024-12-12'
  },
  {
    id: 'grok-3-mini-beta',
    name: 'Grok 3 Mini (Beta)',
    description: 'Compact reasoning model optimized for logical thinking and problem-solving',
    provider: 'xAI',
    version: 'beta',
    capabilities: {
      textGeneration: true,
      codeGeneration: true,
      reasoning: true,
      vision: false,
      functionCalling: true,
      streaming: true,
      contextLength: 65536,
      maxTokens: 2048,
      multimodal: false,
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
      specialties: ['reasoning', 'logic', 'mathematics', 'problem-solving']
    },
    pricing: {
      inputTokens: 0.5,
      outputTokens: 2.0,
      currency: 'USD'
    },
    limits: {
      requestsPerMinute: 120,
      requestsPerDay: 2000,
      tokensPerMinute: 200000,
      tokensPerDay: 2000000
    },
    isAvailable: true,
    isRecommended: false,
    category: 'reasoning',
    tags: ['reasoning', 'compact', 'beta', 'fast'],
    releaseDate: '2024-11-01'
  },
  {
    id: 'grok-2-1212',
    name: 'Grok 2',
    description: 'High-performance general-purpose model for complex tasks',
    provider: 'xAI',
    version: '1212',
    capabilities: {
      textGeneration: true,
      codeGeneration: true,
      reasoning: true,
      vision: false,
      functionCalling: true,
      streaming: true,
      contextLength: 131072,
      maxTokens: 4096,
      multimodal: false,
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
      specialties: ['general-purpose', 'coding', 'analysis', 'writing']
    },
    pricing: {
      inputTokens: 1.5,
      outputTokens: 7.5,
      currency: 'USD'
    },
    limits: {
      requestsPerMinute: 80,
      requestsPerDay: 1500,
      tokensPerMinute: 150000,
      tokensPerDay: 1500000
    },
    isAvailable: true,
    isRecommended: false,
    category: 'general',
    tags: ['general-purpose', 'coding', 'stable'],
    releaseDate: '2024-12-12'
  }
];

export const modelCategories = {
  general: {
    name: 'General Purpose',
    description: 'Versatile models for everyday tasks',
    icon: '🤖'
  },
  coding: {
    name: 'Code Generation',
    description: 'Specialized for programming tasks',
    icon: '💻'
  },
  reasoning: {
    name: 'Reasoning',
    description: 'Advanced logical thinking and problem-solving',
    icon: '🧠'
  },
  creative: {
    name: 'Creative',
    description: 'Content creation and artistic tasks',
    icon: '🎨'
  },
  analysis: {
    name: 'Analysis',
    description: 'Data analysis and research tasks',
    icon: '📊'
  }
} as const;

export class ModelManager {
  private static instance: ModelManager;
  private models: Map<string, EnhancedChatModel>;
  private usage: Map<string, { requests: number; tokens: number; lastReset: Date }>;

  private constructor() {
    this.models = new Map();
    this.usage = new Map();
    this.initializeModels();
  }

  static getInstance(): ModelManager {
    if (!ModelManager.instance) {
      ModelManager.instance = new ModelManager();
    }
    return ModelManager.instance;
  }

  private initializeModels(): void {
    enhancedChatModels.forEach(model => {
      this.models.set(model.id, model);
      this.usage.set(model.id, {
        requests: 0,
        tokens: 0,
        lastReset: new Date()
      });
    });
  }

  getModel(id: string): EnhancedChatModel | undefined {
    return this.models.get(id);
  }

  getAllModels(): EnhancedChatModel[] {
    return Array.from(this.models.values());
  }

  getAvailableModels(): EnhancedChatModel[] {
    return this.getAllModels().filter(model => model.isAvailable && !model.deprecated);
  }

  getModelsByCategory(category: keyof typeof modelCategories): EnhancedChatModel[] {
    return this.getAvailableModels().filter(model => model.category === category);
  }

  getRecommendedModels(): EnhancedChatModel[] {
    return this.getAvailableModels().filter(model => model.isRecommended);
  }

  getModelsByCapability(capability: keyof ModelCapabilities): EnhancedChatModel[] {
    return this.getAvailableModels().filter(model => model.capabilities[capability]);
  }

  getBestModelForTask(task: 'coding' | 'reasoning' | 'vision' | 'general'): EnhancedChatModel | null {
    const models = this.getAvailableModels();
    
    switch (task) {
      case 'coding':
        return models
          .filter(m => m.capabilities.codeGeneration)
          .sort((a, b) => b.capabilities.contextLength - a.capabilities.contextLength)[0] || null;
      
      case 'reasoning':
        return models
          .filter(m => m.capabilities.reasoning)
          .sort((a, b) => {
            if (a.category === 'reasoning' && b.category !== 'reasoning') return -1;
            if (b.category === 'reasoning' && a.category !== 'reasoning') return 1;
            return b.capabilities.contextLength - a.capabilities.contextLength;
          })[0] || null;
      
      case 'vision':
        return models
          .filter(m => m.capabilities.vision)
          .sort((a, b) => b.capabilities.contextLength - a.capabilities.contextLength)[0] || null;
      
      case 'general':
      default:
        return models
          .filter(m => m.isRecommended)
          .sort((a, b) => b.capabilities.contextLength - a.capabilities.contextLength)[0] || null;
    }
  }

  checkRateLimit(modelId: string, tokensRequested: number = 0): {
    allowed: boolean;
    remaining: { requests: number; tokens: number };
    resetTime: Date;
  } {
    const model = this.getModel(modelId);
    if (!model) {
      return { allowed: false, remaining: { requests: 0, tokens: 0 }, resetTime: new Date() };
    }

    const usage = this.usage.get(modelId)!;
    const now = new Date();
    const minutesSinceReset = (now.getTime() - usage.lastReset.getTime()) / (1000 * 60);

    // Reset usage if it's been more than a day
    if (minutesSinceReset >= 1440) { // 24 hours
      usage.requests = 0;
      usage.tokens = 0;
      usage.lastReset = now;
    }

    const requestsRemaining = Math.max(0, model.limits.requestsPerDay - usage.requests);
    const tokensRemaining = Math.max(0, model.limits.tokensPerDay - usage.tokens);

    const allowed = requestsRemaining > 0 && tokensRemaining >= tokensRequested;

    return {
      allowed,
      remaining: {
        requests: requestsRemaining,
        tokens: tokensRemaining
      },
      resetTime: new Date(usage.lastReset.getTime() + 24 * 60 * 60 * 1000)
    };
  }

  recordUsage(modelId: string, tokens: number): void {
    const usage = this.usage.get(modelId);
    if (usage) {
      usage.requests += 1;
      usage.tokens += tokens;
    }
  }

  getUsageStats(modelId: string): { requests: number; tokens: number; lastReset: Date } | null {
    return this.usage.get(modelId) || null;
  }

  estimateCost(modelId: string, inputTokens: number, outputTokens: number): number {
    const model = this.getModel(modelId);
    if (!model) return 0;

    const inputCost = (inputTokens / 1000000) * model.pricing.inputTokens;
    const outputCost = (outputTokens / 1000000) * model.pricing.outputTokens;
    
    return inputCost + outputCost;
  }

  compareModels(modelIds: string[]): {
    models: EnhancedChatModel[];
    comparison: {
      capabilities: Record<keyof ModelCapabilities, boolean[]>;
      pricing: { input: number[]; output: number[] };
      limits: Record<keyof ModelLimits, number[]>;
    };
  } {
    const models = modelIds.map(id => this.getModel(id)).filter(Boolean) as EnhancedChatModel[];
    
    const capabilities = {} as Record<keyof ModelCapabilities, boolean[]>;
    const capabilityKeys = Object.keys(models[0]?.capabilities || {}) as (keyof ModelCapabilities)[];
    
    capabilityKeys.forEach(key => {
      capabilities[key] = models.map(model => {
        const value = model.capabilities[key];
        return typeof value === 'boolean' ? value : Boolean(value);
      });
    });

    const pricing = {
      input: models.map(model => model.pricing.inputTokens),
      output: models.map(model => model.pricing.outputTokens)
    };

    const limits = {} as Record<keyof ModelLimits, number[]>;
    const limitKeys = Object.keys(models[0]?.limits || {}) as (keyof ModelLimits)[];
    
    limitKeys.forEach(key => {
      limits[key] = models.map(model => model.limits[key]);
    });

    return {
      models,
      comparison: {
        capabilities,
        pricing,
        limits
      }
    };
  }
}

// Validation schemas
export const modelSelectionSchema = z.object({
  modelId: z.string().min(1, 'Model ID is required'),
  task: z.enum(['general', 'coding', 'reasoning', 'vision', 'creative', 'analysis']).optional(),
  maxTokens: z.number().min(1).max(8192).optional(),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
});

export const modelComparisonSchema = z.object({
  modelIds: z.array(z.string()).min(2, 'At least 2 models required for comparison').max(5, 'Maximum 5 models for comparison'),
  criteria: z.array(z.enum(['capabilities', 'pricing', 'performance', 'limits'])).optional(),
});

export type ModelSelectionRequest = z.infer<typeof modelSelectionSchema>;
export type ModelComparisonRequest = z.infer<typeof modelComparisonSchema>;

// Export singleton instance
export const modelManager = ModelManager.getInstance();