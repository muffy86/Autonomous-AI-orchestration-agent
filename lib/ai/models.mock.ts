/**
 * Test models for AI providers
 * Used in test environment to mock AI model responses
 */

import { createMockLanguageModel } from 'ai/test';

export const chatModel = createMockLanguageModel({
  doGenerate: async ({ prompt }) => ({
    text: `Mock response for: ${prompt}`,
    finishReason: 'stop',
    usage: { promptTokens: 10, completionTokens: 20 },
  }),
});

export const reasoningModel = createMockLanguageModel({
  doGenerate: async ({ prompt }) => ({
    text: `<think>Mock reasoning process</think>Mock reasoning response for: ${prompt}`,
    finishReason: 'stop',
    usage: { promptTokens: 15, completionTokens: 30 },
  }),
});

export const titleModel = createMockLanguageModel({
  doGenerate: async ({ prompt }) => ({
    text: `Mock Title`,
    finishReason: 'stop',
    usage: { promptTokens: 5, completionTokens: 10 },
  }),
});

export const artifactModel = createMockLanguageModel({
  doGenerate: async ({ prompt }) => ({
    text: `Mock artifact response for: ${prompt}`,
    finishReason: 'stop',
    usage: { promptTokens: 12, completionTokens: 25 },
  }),
});