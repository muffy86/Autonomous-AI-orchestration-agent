/**
 * Tests for Enhanced AI Models system
 */

import { ModelManager, enhancedChatModels, modelManager } from '@/lib/ai/enhanced-models';

describe('Enhanced AI Models', () => {
  describe('ModelManager', () => {
    let manager: ModelManager;

    beforeEach(() => {
      manager = ModelManager.getInstance();
    });

    it('should be a singleton', () => {
      const manager1 = ModelManager.getInstance();
      const manager2 = ModelManager.getInstance();
      expect(manager1).toBe(manager2);
    });

    it('should return all available models', () => {
      const models = manager.getAllModels();
      expect(models).toHaveLength(enhancedChatModels.length);
      expect(models[0]).toHaveProperty('id');
      expect(models[0]).toHaveProperty('name');
      expect(models[0]).toHaveProperty('capabilities');
    });

    it('should filter available models correctly', () => {
      const availableModels = manager.getAvailableModels();
      availableModels.forEach(model => {
        expect(model.isAvailable).toBe(true);
        expect(model.deprecated).toBeFalsy();
      });
    });

    it('should get models by category', () => {
      const generalModels = manager.getModelsByCategory('general');
      generalModels.forEach(model => {
        expect(model.category).toBe('general');
      });
    });

    it('should get recommended models', () => {
      const recommendedModels = manager.getRecommendedModels();
      recommendedModels.forEach(model => {
        expect(model.isRecommended).toBe(true);
      });
    });

    it('should get models by capability', () => {
      const visionModels = manager.getModelsByCapability('vision');
      visionModels.forEach(model => {
        expect(model.capabilities.vision).toBe(true);
      });

      const codingModels = manager.getModelsByCapability('codeGeneration');
      codingModels.forEach(model => {
        expect(model.capabilities.codeGeneration).toBe(true);
      });
    });

    it('should get best model for specific tasks', () => {
      const codingModel = manager.getBestModelForTask('coding');
      expect(codingModel).toBeTruthy();
      if (codingModel) {
        expect(codingModel.capabilities.codeGeneration).toBe(true);
      }

      const visionModel = manager.getBestModelForTask('vision');
      expect(visionModel).toBeTruthy();
      if (visionModel) {
        expect(visionModel.capabilities.vision).toBe(true);
      }

      const reasoningModel = manager.getBestModelForTask('reasoning');
      expect(reasoningModel).toBeTruthy();
      if (reasoningModel) {
        expect(reasoningModel.capabilities.reasoning).toBe(true);
      }
    });

    it('should check rate limits correctly', () => {
      const modelId = enhancedChatModels[0].id;
      const rateLimitCheck = manager.checkRateLimit(modelId, 1000);
      
      expect(rateLimitCheck).toHaveProperty('allowed');
      expect(rateLimitCheck).toHaveProperty('remaining');
      expect(rateLimitCheck).toHaveProperty('resetTime');
      expect(typeof rateLimitCheck.allowed).toBe('boolean');
    });

    it('should record usage correctly', () => {
      const modelId = enhancedChatModels[0].id;
      const initialStats = manager.getUsageStats(modelId);
      const initialRequests = initialStats ? initialStats.requests : 0;
      const initialTokens = initialStats ? initialStats.tokens : 0;
      
      manager.recordUsage(modelId, 1000);
      
      const updatedStats = manager.getUsageStats(modelId);
      expect(updatedStats).toBeTruthy();
      if (updatedStats) {
        expect(updatedStats.requests).toBe(initialRequests + 1);
        expect(updatedStats.tokens).toBe(initialTokens + 1000);
      }
    });

    it('should estimate costs correctly', () => {
      const modelId = enhancedChatModels[0].id;
      const cost = manager.estimateCost(modelId, 1000, 500);
      
      expect(typeof cost).toBe('number');
      expect(cost).toBeGreaterThanOrEqual(0);
    });

    it('should compare models correctly', () => {
      const modelIds = enhancedChatModels.slice(0, 2).map(m => m.id);
      const comparison = manager.compareModels(modelIds);
      
      expect(comparison).toHaveProperty('models');
      expect(comparison).toHaveProperty('comparison');
      expect(comparison.models).toHaveLength(2);
      expect(comparison.comparison).toHaveProperty('capabilities');
      expect(comparison.comparison).toHaveProperty('pricing');
      expect(comparison.comparison).toHaveProperty('limits');
    });

    it('should handle invalid model IDs gracefully', () => {
      const invalidModel = manager.getModel('invalid-id');
      expect(invalidModel).toBeUndefined();

      const rateLimitCheck = manager.checkRateLimit('invalid-id');
      expect(rateLimitCheck.allowed).toBe(false);

      const usageStats = manager.getUsageStats('invalid-id');
      expect(usageStats).toBeNull();
    });
  });

  describe('Enhanced Chat Models Data', () => {
    it('should have valid model structure', () => {
      enhancedChatModels.forEach(model => {
        expect(model).toHaveProperty('id');
        expect(model).toHaveProperty('name');
        expect(model).toHaveProperty('description');
        expect(model).toHaveProperty('provider');
        expect(model).toHaveProperty('capabilities');
        expect(model).toHaveProperty('pricing');
        expect(model).toHaveProperty('limits');
        expect(model).toHaveProperty('category');
        
        // Validate capabilities
        expect(typeof model.capabilities.textGeneration).toBe('boolean');
        expect(typeof model.capabilities.codeGeneration).toBe('boolean');
        expect(typeof model.capabilities.reasoning).toBe('boolean');
        expect(typeof model.capabilities.vision).toBe('boolean');
        expect(typeof model.capabilities.contextLength).toBe('number');
        expect(model.capabilities.contextLength).toBeGreaterThan(0);
        
        // Validate pricing
        expect(typeof model.pricing.inputTokens).toBe('number');
        expect(typeof model.pricing.outputTokens).toBe('number');
        expect(model.pricing.inputTokens).toBeGreaterThanOrEqual(0);
        expect(model.pricing.outputTokens).toBeGreaterThanOrEqual(0);
        
        // Validate limits
        expect(typeof model.limits.requestsPerMinute).toBe('number');
        expect(typeof model.limits.requestsPerDay).toBe('number');
        expect(model.limits.requestsPerMinute).toBeGreaterThan(0);
        expect(model.limits.requestsPerDay).toBeGreaterThan(0);
      });
    });

    it('should have unique model IDs', () => {
      const ids = enhancedChatModels.map(model => model.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have at least one recommended model', () => {
      const recommendedModels = enhancedChatModels.filter(model => model.isRecommended);
      expect(recommendedModels.length).toBeGreaterThan(0);
    });

    it('should have models with different capabilities', () => {
      const hasVision = enhancedChatModels.some(model => model.capabilities.vision);
      const hasReasoning = enhancedChatModels.some(model => model.capabilities.reasoning);
      const hasCoding = enhancedChatModels.some(model => model.capabilities.codeGeneration);
      
      expect(hasVision).toBe(true);
      expect(hasReasoning).toBe(true);
      expect(hasCoding).toBe(true);
    });
  });

  describe('Singleton Instance', () => {
    it('should export a singleton instance', () => {
      expect(modelManager).toBeDefined();
      expect(modelManager).toBeInstanceOf(ModelManager);
    });

    it('should maintain state across calls', () => {
      const modelId = enhancedChatModels[0].id;
      
      // Record usage
      modelManager.recordUsage(modelId, 100);
      
      // Get stats
      const stats = modelManager.getUsageStats(modelId);
      expect(stats).toBeTruthy();
      expect(stats!.tokens).toBeGreaterThanOrEqual(100);
    });
  });
});