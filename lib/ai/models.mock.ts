/**
 * Test models for AI providers
 * Used in test environment to mock AI model responses
 */

import type { LanguageModelV1 } from 'ai';

// Mock language model implementation for testing
// Note: This is a simplified mock that only implements the methods needed for testing
function createMockLanguageModel(config: {
  doGenerate: (params: any) => Promise<any>;
}): any {
  return {
    specificationVersion: 'v1',
    provider: 'mock',
    modelId: 'mock-model',
    defaultObjectGenerationMode: 'json' as const,
    doGenerate: config.doGenerate,
    doStream: async (params: any) => {
      const result = await config.doGenerate(params);
      return {
        stream: new ReadableStream({
          async start(controller) {
            controller.enqueue({
              type: 'text-delta' as const,
              textDelta: result.text,
            });
            controller.enqueue({
              type: 'finish' as const,
              finishReason: result.finishReason,
              usage: result.usage,
            });
            controller.close();
          },
        }),
        rawCall: { rawPrompt: null, rawSettings: {} },
        rawResponse: { headers: undefined },
        warnings: undefined,
      };
    },
  };
}

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