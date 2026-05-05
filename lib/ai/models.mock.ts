/**
 * Test models for AI providers
 * Used in test environment to mock AI model responses
 */

import { MockLanguageModelV1 } from 'ai/test';

export const chatModel = new MockLanguageModelV1({
  doGenerate: async ({ prompt }: any) => ({
    rawCall: { rawPrompt: null, rawSettings: {} },
    text: `Mock response for: ${prompt}`,
    finishReason: 'stop',
    usage: { promptTokens: 10, completionTokens: 20 },
  }),
});

export const reasoningModel = new MockLanguageModelV1({
  doGenerate: async ({ prompt }: any) => ({
    rawCall: { rawPrompt: null, rawSettings: {} },
    text: `<think>Mock reasoning process</think>Mock reasoning response for: ${prompt}`,
    finishReason: 'stop',
    usage: { promptTokens: 15, completionTokens: 30 },
  }),
});

export const titleModel = new MockLanguageModelV1({
  doGenerate: async ({ prompt }: any) => ({
    rawCall: { rawPrompt: null, rawSettings: {} },
    text: `Mock Title`,
    finishReason: 'stop',
    usage: { promptTokens: 5, completionTokens: 10 },
  }),
});

export const artifactModel = new MockLanguageModelV1({
  doGenerate: async ({ prompt }: any) => ({
    rawCall: { rawPrompt: null, rawSettings: {} },
    text: `Mock artifact response for: ${prompt}`,
    finishReason: 'stop',
    usage: { promptTokens: 12, completionTokens: 25 },
  }),
});