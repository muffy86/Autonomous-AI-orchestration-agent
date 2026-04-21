/**
 * Ollama Integration - Local Model Support
 * Run sovereign, uncensored AI models locally
 */

import { createOpenAI } from '@ai-sdk/openai';

export interface OllamaModel {
  name: string;
  model: string;
  size: string;
  digest: string;
  modified: string;
  details: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaConfig {
  baseURL: string;
  timeout?: number;
}

class OllamaManager {
  private baseURL: string;
  private timeout: number;
  private provider: any;

  constructor(config?: OllamaConfig) {
    this.baseURL = config?.baseURL || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.timeout = config?.timeout || 60000;
    
    // Create OpenAI-compatible provider for Ollama
    this.provider = createOpenAI({
      baseURL: `${this.baseURL}/v1`,
      apiKey: 'ollama', // Ollama doesn't need API key
    });
  }

  /**
   * Check if Ollama is running
   */
  async isRunning(): Promise<boolean> {
    try {
      const response = await fetch(this.baseURL, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.baseURL}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.timeout),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Failed to list Ollama models:', error);
      return [];
    }
  }

  /**
   * Pull (download) a model
   */
  async pullModel(modelName: string, onProgress?: (progress: any) => void): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName }),
      });

      if (!response.ok) {
        throw new Error(`Failed to pull model: ${response.statusText}`);
      }

      // Stream progress
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n').filter(l => l.trim());
        
        for (const line of lines) {
          try {
            const progress = JSON.parse(line);
            onProgress?.(progress);
            
            if (progress.status === 'success') {
              return true;
            }
          } catch {
            // Ignore parse errors
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to pull model:', error);
      return false;
    }
  }

  /**
   * Delete a model
   */
  async deleteModel(modelName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to delete model:', error);
      return false;
    }
  }

  /**
   * Get model instance for AI SDK
   */
  getModel(modelName: string) {
    return this.provider(modelName);
  }

  /**
   * Generate completion
   */
  async generate(modelName: string, prompt: string, options?: {
    stream?: boolean;
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
  }) {
    try {
      const response = await fetch(`${this.baseURL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          prompt,
          stream: options?.stream ?? false,
          options: {
            temperature: options?.temperature,
            top_p: options?.top_p,
            num_predict: options?.max_tokens,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        text: data.response,
        done: data.done,
        context: data.context,
        total_duration: data.total_duration,
        load_duration: data.load_duration,
        prompt_eval_duration: data.prompt_eval_duration,
        eval_duration: data.eval_duration,
      };
    } catch (error) {
      throw new Error(`Generation error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  /**
   * Chat completion
   */
  async chat(modelName: string, messages: Array<{ role: string; content: string }>, options?: {
    stream?: boolean;
    temperature?: number;
  }) {
    try {
      const response = await fetch(`${this.baseURL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          messages,
          stream: options?.stream ?? false,
          options: {
            temperature: options?.temperature,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        message: data.message,
        done: data.done,
        total_duration: data.total_duration,
      };
    } catch (error) {
      throw new Error(`Chat error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  /**
   * Get recommended models
   */
  getRecommendedModels() {
    return {
      uncensored: [
        {
          name: 'dolphin-mixtral',
          model: 'dolphin-mixtral:8x7b',
          description: 'Uncensored Mixtral 8x7B - excellent for unrestricted tasks',
          size: '26GB',
          capabilities: ['chat', 'code', 'uncensored'],
        },
        {
          name: 'wizard-vicuna-uncensored',
          model: 'wizard-vicuna-uncensored:13b',
          description: 'Uncensored Wizard Vicuna 13B',
          size: '7.4GB',
          capabilities: ['chat', 'uncensored'],
        },
        {
          name: 'nous-hermes-2',
          model: 'nous-hermes2:latest',
          description: 'Nous Hermes 2 - Uncensored and highly capable',
          size: '4.1GB',
          capabilities: ['chat', 'code', 'reasoning', 'uncensored'],
        },
      ],
      general: [
        {
          name: 'llama3.2',
          model: 'llama3.2:latest',
          description: 'Meta Llama 3.2 - Latest from Meta',
          size: '2GB',
          capabilities: ['chat', 'multilingual'],
        },
        {
          name: 'mistral',
          model: 'mistral:latest',
          description: 'Mistral 7B - Fast and capable',
          size: '4.1GB',
          capabilities: ['chat', 'code'],
        },
        {
          name: 'codellama',
          model: 'codellama:latest',
          description: 'Code Llama - Specialized for coding',
          size: '3.8GB',
          capabilities: ['code', 'chat'],
        },
      ],
      vision: [
        {
          name: 'llava',
          model: 'llava:latest',
          description: 'LLaVA - Vision and language model',
          size: '4.7GB',
          capabilities: ['vision', 'chat'],
        },
        {
          name: 'bakllava',
          model: 'bakllava:latest',
          description: 'BakLLaVA - Vision model',
          size: '4.7GB',
          capabilities: ['vision', 'chat'],
        },
      ],
    };
  }

  /**
   * Get provider for AI SDK integration
   */
  getProvider() {
    return this.provider;
  }

  /**
   * Quick setup guide
   */
  getSetupInstructions() {
    return {
      install: {
        mac: 'brew install ollama',
        linux: 'curl https://ollama.ai/install.sh | sh',
        windows: 'Download from https://ollama.ai/download',
      },
      start: 'ollama serve',
      pullModel: 'ollama pull <model-name>',
      listModels: 'ollama list',
      exampleModels: [
        'dolphin-mixtral:8x7b  # Uncensored',
        'nous-hermes2:latest    # Uncensored',
        'llama3.2:latest        # Latest Meta model',
        'mistral:latest         # Fast general model',
      ],
    };
  }
}

export const ollamaManager = new OllamaManager();
export default ollamaManager;
