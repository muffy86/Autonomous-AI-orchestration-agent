/**
 * Enhanced AI Providers with MCP Integration
 * Extends the base provider system with multi-model support
 */

import { modelProviders } from '../mcp/providers';
import { customProvider } from 'ai';

/**
 * Get an AI model from any configured provider
 */
export function getModel(providerId?: string, modelId?: string) {
  // Use defaults if not specified
  const defaultProvider = process.env.DEFAULT_PROVIDER || 'google';
  const defaultModel = process.env.DEFAULT_MODEL || 'gemini-2.0-flash-exp';
  
  const targetProvider = providerId || defaultProvider;
  const targetModel = modelId || defaultModel;
  
  const model = modelProviders.getModel(targetProvider, targetModel);
  
  if (!model) {
    // Fallback to configured providers
    const configured = modelProviders.getConfiguredProviders();
    if (configured.length === 0) {
      throw new Error('No AI providers configured. Please add API keys to .env');
    }
    
    // Use first configured provider's first model
    const fallback = configured[0];
    const fallbackModel = fallback.models[0];
    console.warn(`Model ${targetProvider}/${targetModel} not found, using ${fallback.id}/${fallbackModel.id}`);
    
    return modelProviders.getModel(fallback.id, fallbackModel.id);
  }
  
  return model;
}

/**
 * Get the best model for a specific task
 */
export function getBestModelForTask(task: 'coding' | 'reasoning' | 'vision' | 'general' | 'fast') {
  const configured = modelProviders.getConfiguredProviders();
  
  if (configured.length === 0) {
    throw new Error('No AI providers configured');
  }
  
  // Task-specific model preferences
  const preferences: Record<string, Array<{ provider: string; model: string }>> = {
    coding: [
      { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
      { provider: 'openai', model: 'gpt-4o' },
      { provider: 'google', model: 'gemini-2.0-flash-exp' },
    ],
    reasoning: [
      { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
      { provider: 'xai', model: 'grok-3-mini-beta' },
      { provider: 'openai', model: 'gpt-4o' },
    ],
    vision: [
      { provider: 'openai', model: 'gpt-4o' },
      { provider: 'xai', model: 'grok-2-vision-1212' },
      { provider: 'google', model: 'gemini-2.0-flash-exp' },
    ],
    fast: [
      { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      { provider: 'google', model: 'gemini-1.5-flash' },
      { provider: 'openai', model: 'gpt-4o-mini' },
    ],
    general: [
      { provider: 'google', model: 'gemini-2.0-flash-exp' },
      { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
    ],
  };
  
  const preferred = preferences[task] || preferences.general;
  
  // Find first available preference
  for (const pref of preferred) {
    const model = modelProviders.getModel(pref.provider, pref.model);
    if (model) {
      return model;
    }
  }
  
  // Fallback to first available model
  const fallback = configured[0];
  return modelProviders.getModel(fallback.id, fallback.models[0].id);
}

/**
 * Create a custom provider with all configured models
 */
export function createMultiModelProvider() {
  const configured = modelProviders.getConfiguredProviders();
  const languageModels: Record<string, any> = {};
  const imageModels: Record<string, any> = {};
  
  for (const provider of configured) {
    for (const modelInfo of provider.models) {
      const model = modelProviders.getModel(provider.id, modelInfo.id);
      if (model) {
        const key = `${provider.id}/${modelInfo.id}`;
        
        if (modelInfo.capabilities.includes('vision') || modelInfo.capabilities.includes('text')) {
          languageModels[key] = model.model;
        }
      }
    }
  }
  
  return customProvider({
    languageModels,
    imageModels,
  });
}

/**
 * Get all available models grouped by capability
 */
export function getModelsByCapability(capability: string) {
  const allModels = modelProviders.getAllModels();
  return allModels.filter(({ model }) => 
    model.capabilities.includes(capability)
  );
}

/**
 * Get cost-optimized model selection
 */
export function getCostOptimizedModel(
  requiresVision = false,
  requiresReasoning = false,
  preferFree = true
) {
  if (preferFree) {
    const freeModels = modelProviders.getFreeModels();
    
    for (const { provider, model } of freeModels) {
      const meetsRequirements = 
        (!requiresVision || model.capabilities.includes('vision')) &&
        (!requiresReasoning || model.capabilities.includes('thinking'));
      
      if (meetsRequirements) {
        const providerInfo = modelProviders.getProvider(provider.toLowerCase());
        if (providerInfo) {
          return modelProviders.getModel(providerInfo.id, model.id);
        }
      }
    }
  }
  
  // Fallback to cheapest paid model
  const allModels = modelProviders.getAllModels();
  const suitable = allModels.filter(({ model }) => {
    const meetsRequirements = 
      (!requiresVision || model.capabilities.includes('vision')) &&
      (!requiresReasoning || model.capabilities.includes('thinking'));
    
    return meetsRequirements && model.pricing;
  });
  
  if (suitable.length === 0) {
    return getModel(); // Use default
  }
  
  // Sort by cost (input + output price)
  suitable.sort((a, b) => {
    const costA = (a.model.pricing?.input || 0) + (a.model.pricing?.output || 0);
    const costB = (b.model.pricing?.input || 0) + (b.model.pricing?.output || 0);
    return costA - costB;
  });
  
  const cheapest = suitable[0];
  const provider = modelProviders.listProviders().find(p => p.name === cheapest.provider);
  if (provider) {
    return modelProviders.getModel(provider.id, cheapest.model.id);
  }
  
  return getModel(); // Final fallback
}
