/**
 * Integration tests for application components
 * These tests verify the interaction between multiple components
 */

import { describe, it, expect } from '@jest/globals';

describe('Application Integration Tests', () => {
  describe('Environment Setup', () => {
    it('should have a valid test environment', () => {
      expect(process.env.NODE_ENV).toBe('test');
    });

    it('should be able to import core utilities', async () => {
      const { sanitizeHtml } = await import('@/lib/security');
      expect(typeof sanitizeHtml).toBe('function');
    });
  });

  describe('Security & Sanitization Integration', () => {
    it('should sanitize HTML content to prevent XSS', async () => {
      const { sanitizeHtml } = await import('@/lib/security');
      
      const maliciousHtml = '<script>alert("xss")</script><p>Safe content</p>';
      const sanitized = sanitizeHtml(maliciousHtml);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Safe content');
    });

    it('should sanitize text content', async () => {
      const { sanitizeText } = await import('@/lib/security');
      
      const unsafeText = '<script>malicious</script>Hello world';
      const sanitized = sanitizeText(unsafeText);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Hello world');
    });

    it('should generate secure tokens', async () => {
      const { generateSecureToken } = await import('@/lib/security');
      
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();

      expect(token1).toBeTruthy();
      expect(token2).toBeTruthy();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBeGreaterThan(0);
    });
  });

  describe('AI Model Configuration', () => {
    it('should have enhanced chat models available', async () => {
      const { enhancedChatModels } = await import('@/lib/ai/enhanced-models');

      expect(enhancedChatModels.length).toBeGreaterThan(0);
      expect(enhancedChatModels[0]).toHaveProperty('id');
      expect(enhancedChatModels[0]).toHaveProperty('capabilities');
      expect(enhancedChatModels[0]).toHaveProperty('pricing');
    });

    it('should initialize model manager', async () => {
      const { ModelManager } = await import('@/lib/ai/enhanced-models');
      
      const modelManager = new ModelManager();
      const models = modelManager.getAllModels();

      expect(models.length).toBeGreaterThan(0);
      expect(models[0]).toHaveProperty('id');
      expect(models[0]).toHaveProperty('capabilities');
    });

    it('should retrieve specific models by ID', async () => {
      const { ModelManager } = await import('@/lib/ai/enhanced-models');
      
      const modelManager = new ModelManager();
      const model = modelManager.getModel('grok-2-1212');
      
      expect(model).toBeTruthy();
      expect(model?.id).toBe('grok-2-1212');
      expect(model?.capabilities).toBeDefined();
    });
  });

  describe('Prompt Analysis', () => {
    it('should analyze prompts for quality', async () => {
      const { PromptOptimizer } = await import('@/lib/ai/prompt-optimizer');
      
      const optimizer = new PromptOptimizer();
      const prompt = 'Tell me about AI';
      
      const analysis = optimizer.analyzePrompt(prompt);
      
      expect(analysis).toHaveProperty('clarity');
      expect(analysis).toHaveProperty('specificity');
      expect(analysis).toHaveProperty('structure');
      expect(analysis).toHaveProperty('overall');
      expect(typeof analysis.overall).toBe('number');
    });

    it('should provide optimization suggestions', async () => {
      const { PromptOptimizer } = await import('@/lib/ai/prompt-optimizer');
      
      const optimizer = new PromptOptimizer();
      const prompt = 'write code';
      
      const optimized = optimizer.optimizePrompt(prompt, 'code');
      
      expect(optimized).toHaveProperty('original');
      expect(optimized).toHaveProperty('optimized');
      expect(optimized.improvements.length).toBeGreaterThan(0);
    });
  });

  describe('Conversation Context Management', () => {
    it('should create context manager instances', async () => {
      const { ConversationContextManager } = await import('@/lib/ai/context-manager');
      
      const contextManager = new ConversationContextManager();
      
      expect(contextManager).toBeDefined();
      expect(contextManager).toBeInstanceOf(ConversationContextManager);
    });
  });

  describe('Utility Functions', () => {
    it('should combine class names correctly', async () => {
      const { cn } = await import('@/lib/utils');
      
      const result = cn('base-class', 'additional-class', { 
        'conditional-class': true,
        'skipped-class': false,
      });
      
      expect(result).toContain('base-class');
      expect(result).toContain('additional-class');
      expect(result).toContain('conditional-class');
      expect(result).not.toContain('skipped-class');
    });

    it('should handle local storage safely', async () => {
      const { getLocalStorage } = await import('@/lib/utils');
      
      // Should not throw error even when localStorage is not available in test env
      const result = getLocalStorage('test-key');
      // Returns empty array when localStorage is not available
      expect(result).toBeDefined();
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should check rate limits', async () => {
      const { checkRateLimit } = await import('@/lib/security');
      
      const config = { windowMs: 60000, max: 5 };
      const result = checkRateLimit('test-ip', 'test-endpoint', config);
      
      expect(result).toHaveProperty('allowed');
      expect(result).toHaveProperty('remaining');
      expect(result).toHaveProperty('resetTime');
      expect(result.allowed).toBe(true);
    });

    it('should enforce rate limits across multiple requests', async () => {
      const { checkRateLimit, cleanupRateLimiter } = await import('@/lib/security');
      
      // Clean up first
      cleanupRateLimiter();
      
      const config = { windowMs: 60000, max: 2 };
      
      const result1 = checkRateLimit('test-ip-2', 'test-endpoint-2', config);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(1);
      
      const result2 = checkRateLimit('test-ip-2', 'test-endpoint-2', config);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(0);
      
      const result3 = checkRateLimit('test-ip-2', 'test-endpoint-2', config);
      expect(result3.allowed).toBe(false);
    });
  });
});
