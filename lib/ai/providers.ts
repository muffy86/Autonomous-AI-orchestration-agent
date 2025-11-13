import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { xai } from '@ai-sdk/xai';
import { isTestEnvironment } from '../constants';

// Conditionally import mock models only in test environment
let mockModels: any;
if (isTestEnvironment) {
  mockModels = require('./models.mock');
}

export const myProvider = isTestEnvironment && mockModels
  ? customProvider({
      languageModels: {
        'chat-model': mockModels.chatModel,
        'chat-model-reasoning': mockModels.reasoningModel,
        'title-model': mockModels.titleModel,
        'artifact-model': mockModels.artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': xai('grok-2-vision-1212'),
        'chat-model-reasoning': wrapLanguageModel({
          model: xai('grok-3-mini-beta'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': xai('grok-2-1212'),
        'artifact-model': xai('grok-2-1212'),
      },
      imageModels: {
        'small-model': xai.image('grok-2-image'),
      },
    });
