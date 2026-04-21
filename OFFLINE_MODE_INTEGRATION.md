# Offline Mode Integration Guide

## Integrating ONNX Runtime into the Next.js AI Chatbot

This guide shows how to add offline inference capabilities to the current Next.js chatbot, inspired by the Pocket LLM APK architecture.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js AI Chatbot                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐                  ┌──────────────┐        │
│  │   Online     │                  │   Offline    │        │
│  │   Mode       │                  │   Mode       │        │
│  ├──────────────┤                  ├──────────────┤        │
│  │ xAI/OpenAI   │                  │ ONNX Runtime │        │
│  │ Anthropic    │◄────Switch────►  │ Web          │        │
│  │ Cloud APIs   │                  │ Local Models │        │
│  └──────────────┘                  └──────────────┘        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│              Unified Chat Interface                         │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Strategy

### Phase 1: Core Infrastructure

#### 1.1 Install Dependencies

```bash
# ONNX Runtime Web for browser-based inference
pnpm add onnxruntime-web

# Tokenizers for model preprocessing
pnpm add @xenova/transformers

# Local storage management
pnpm add idb-keyval

# Worker threads for non-blocking inference
pnpm add comlink
```

#### 1.2 Create Model Manager

Create `lib/offline/model-manager.ts`:

```typescript
import * as ort from 'onnxruntime-web';
import { get, set } from 'idb-keyval';

export interface ModelConfig {
  name: string;
  path: string;
  size: number;
  quantization: 'fp32' | 'fp16' | 'int8';
  maxTokens: number;
}

export class OfflineModelManager {
  private session: ort.InferenceSession | null = null;
  private config: ModelConfig | null = null;

  async downloadModel(modelUrl: string, config: ModelConfig): Promise<void> {
    const response = await fetch(modelUrl);
    const blob = await response.blob();
    
    // Store in IndexedDB for persistence
    await set(`model:${config.name}`, blob);
    await set(`model-config:${config.name}`, config);
  }

  async loadModel(modelName: string): Promise<void> {
    const blob = await get<Blob>(`model:${modelName}`);
    const config = await get<ModelConfig>(`model-config:${modelName}`);
    
    if (!blob || !config) {
      throw new Error(`Model ${modelName} not found`);
    }

    const arrayBuffer = await blob.arrayBuffer();
    
    this.session = await ort.InferenceSession.create(arrayBuffer, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    });
    
    this.config = config;
  }

  async generateText(
    prompt: string,
    options: {
      maxTokens?: number;
      temperature?: number;
      topP?: number;
    } = {}
  ): Promise<AsyncGenerator<string>> {
    if (!this.session || !this.config) {
      throw new Error('Model not loaded');
    }

    // This will be implemented with actual tokenization and inference
    // For now, return a generator that yields tokens
    return this.streamInference(prompt, options);
  }

  private async *streamInference(
    prompt: string,
    options: any
  ): AsyncGenerator<string> {
    // Tokenization happens here
    // ONNX inference in loop
    // Yield tokens as they're generated
    yield 'Example implementation';
  }

  isLoaded(): boolean {
    return this.session !== null;
  }

  unload(): void {
    this.session = null;
    this.config = null;
  }
}
```

### Phase 2: Worker Integration

#### 2.1 Create Inference Worker

Create `lib/offline/inference.worker.ts`:

```typescript
import { wrap } from 'comlink';
import { OfflineModelManager } from './model-manager';

const manager = new OfflineModelManager();

export const workerAPI = {
  loadModel: (modelName: string) => manager.loadModel(modelName),
  generateText: (prompt: string, options: any) => 
    manager.generateText(prompt, options),
  isLoaded: () => manager.isLoaded(),
  unload: () => manager.unload(),
};

export type InferenceWorker = typeof workerAPI;
```

#### 2.2 Worker Hook

Create `lib/offline/use-offline-model.ts`:

```typescript
import { useEffect, useRef, useState } from 'react';
import { wrap, Remote } from 'comlink';
import type { InferenceWorker } from './inference.worker';

export function useOfflineModel() {
  const workerRef = useRef<Worker>();
  const apiRef = useRef<Remote<InferenceWorker>>();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('./inference.worker.ts', import.meta.url)
    );
    apiRef.current = wrap<InferenceWorker>(workerRef.current);

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const loadModel = async (modelName: string) => {
    if (!apiRef.current) return;
    
    setIsLoading(true);
    try {
      await apiRef.current.loadModel(modelName);
      setIsLoaded(true);
    } catch (error) {
      console.error('Failed to load model:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const generateText = async (
    prompt: string,
    options: any
  ): Promise<AsyncGenerator<string>> => {
    if (!apiRef.current) {
      throw new Error('Worker not initialized');
    }
    return apiRef.current.generateText(prompt, options);
  };

  return {
    loadModel,
    generateText,
    isLoaded,
    isLoading,
    unload: () => apiRef.current?.unload(),
  };
}
```

### Phase 3: Chat Integration

#### 3.1 Update Chat Component

Create `components/offline-chat-provider.tsx`:

```typescript
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useOfflineModel } from '@/lib/offline/use-offline-model';

interface OfflineChatContextType {
  isOfflineMode: boolean;
  toggleOfflineMode: () => void;
  isModelReady: boolean;
  generateOfflineResponse: (prompt: string) => AsyncGenerator<string>;
}

const OfflineChatContext = createContext<OfflineChatContextType | null>(null);

export function OfflineChatProvider({ children }: { children: ReactNode }) {
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const { loadModel, generateText, isLoaded, isLoading } = useOfflineModel();

  const toggleOfflineMode = async () => {
    if (!isOfflineMode && !isLoaded && !isLoading) {
      // Load default model when switching to offline mode
      await loadModel('qwen-0.5b-q4');
    }
    setIsOfflineMode(!isOfflineMode);
  };

  const generateOfflineResponse = async function* (
    prompt: string
  ): AsyncGenerator<string> {
    if (!isLoaded) {
      throw new Error('Offline model not loaded');
    }
    
    const generator = await generateText(prompt, {
      maxTokens: 512,
      temperature: 0.7,
    });
    
    for await (const token of generator) {
      yield token;
    }
  };

  return (
    <OfflineChatContext.Provider
      value={{
        isOfflineMode,
        toggleOfflineMode,
        isModelReady: isLoaded,
        generateOfflineResponse,
      }}
    >
      {children}
    </OfflineChatContext.Provider>
  );
}

export function useOfflineChat() {
  const context = useContext(OfflineChatContext);
  if (!context) {
    throw new Error('useOfflineChat must be used within OfflineChatProvider');
  }
  return context;
}
```

#### 3.2 Modify Chat Route Handler

Update `app/api/chat/route.ts` to support offline fallback:

```typescript
import { streamText } from 'ai';
import { customModel } from '@/lib/ai';

export async function POST(req: Request) {
  const { messages, useOffline } = await req.json();

  // Check if offline mode is requested
  if (useOffline) {
    return new Response('Offline mode not supported in API route', {
      status: 400,
    });
  }

  // Regular cloud-based inference
  const result = streamText({
    model: customModel(/* ... */),
    messages,
    // ... other options
  });

  return result.toDataStreamResponse();
}
```

#### 3.3 Client-Side Chat Handler

Update `app/(chat)/page.tsx`:

```typescript
'use client';

import { useChat } from 'ai/react';
import { useOfflineChat } from '@/components/offline-chat-provider';
import { useState } from 'react';

export default function ChatPage() {
  const { messages, input, handleInputChange, append } = useChat();
  const { isOfflineMode, isModelReady, generateOfflineResponse } = useOfflineChat();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isOfflineMode && isModelReady) {
      // Use offline inference
      setIsGenerating(true);
      
      const generator = generateOfflineResponse(input);
      let fullResponse = '';
      
      for await (const token of generator) {
        fullResponse += token;
        // Update UI with streaming token
      }
      
      await append({
        role: 'assistant',
        content: fullResponse,
      });
      
      setIsGenerating(false);
    } else {
      // Use regular cloud API
      // ... existing chat logic
    }
  };

  return (
    <div>
      {/* Chat UI */}
    </div>
  );
}
```

### Phase 4: Model Management UI

#### 4.1 Model Settings Component

Create `components/model-settings.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface ModelInfo {
  name: string;
  size: string;
  description: string;
  url: string;
}

const AVAILABLE_MODELS: ModelInfo[] = [
  {
    name: 'qwen-0.5b-q4',
    size: '300 MB',
    description: 'Qwen2.5 0.5B (INT8 quantized, fastest)',
    url: '/models/qwen-0.5b-int8.onnx',
  },
  {
    name: 'qwen-0.5b-fp16',
    size: '500 MB',
    description: 'Qwen2.5 0.5B (FP16, balanced)',
    url: '/models/qwen-0.5b-fp16.onnx',
  },
  {
    name: 'phi-1.5b-q4',
    size: '800 MB',
    description: 'Phi-2 1.5B (INT8 quantized, higher quality)',
    url: '/models/phi-1.5b-int8.onnx',
  },
];

export function ModelSettings() {
  const [downloadProgress, setDownloadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [installedModels, setInstalledModels] = useState<Set<string>>(
    new Set()
  );

  const downloadModel = async (model: ModelInfo) => {
    const response = await fetch(model.url);
    const reader = response.body?.getReader();
    const contentLength = Number(response.headers.get('Content-Length'));
    
    let receivedLength = 0;
    const chunks: Uint8Array[] = [];
    
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      
      chunks.push(value);
      receivedLength += value.length;
      
      setDownloadProgress((prev) => ({
        ...prev,
        [model.name]: (receivedLength / contentLength) * 100,
      }));
    }
    
    // Model downloaded, save to IndexedDB via ModelManager
    const blob = new Blob(chunks);
    // ... save logic
    
    setInstalledModels((prev) => new Set([...prev, model.name]));
    setDownloadProgress((prev) => {
      const { [model.name]: _, ...rest } = prev;
      return rest;
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Offline Models</h2>
      
      {AVAILABLE_MODELS.map((model) => {
        const isInstalled = installedModels.has(model.name);
        const progress = downloadProgress[model.name];
        
        return (
          <div key={model.name} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{model.description}</h3>
                <p className="text-sm text-muted-foreground">
                  Size: {model.size}
                </p>
              </div>
              
              {isInstalled ? (
                <Button variant="outline" disabled>
                  Installed
                </Button>
              ) : progress !== undefined ? (
                <div className="w-32">
                  <Progress value={progress} />
                </div>
              ) : (
                <Button onClick={() => downloadModel(model)}>
                  Download
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

### Phase 5: Offline Mode Toggle

#### 5.1 Add Toggle to Header

Update `components/chat-header.tsx`:

```typescript
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useOfflineChat } from '@/components/offline-chat-provider';
import { WifiOff, Wifi } from 'lucide-react';

export function ChatHeader() {
  const { isOfflineMode, toggleOfflineMode, isModelReady } = useOfflineChat();

  return (
    <header className="border-b">
      <div className="flex items-center justify-between p-4">
        <h1>AI Chatbot</h1>
        
        <div className="flex items-center gap-2">
          {isOfflineMode ? (
            <WifiOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Wifi className="h-4 w-4 text-muted-foreground" />
          )}
          
          <Switch
            id="offline-mode"
            checked={isOfflineMode}
            onCheckedChange={toggleOfflineMode}
            disabled={isOfflineMode && !isModelReady}
          />
          
          <Label htmlFor="offline-mode">
            Offline Mode
            {isOfflineMode && !isModelReady && ' (Loading...)'}
          </Label>
        </div>
      </div>
    </header>
  );
}
```

## Model Preparation

### Converting Models to ONNX

#### Using Optimum (Hugging Face)

```bash
# Install tools
pip install optimum[onnxruntime] transformers

# Export model to ONNX with quantization
optimum-cli export onnx \
  --model Qwen/Qwen2.5-0.5B-Instruct \
  --task text-generation-with-past \
  --quantize int8 \
  qwen-0.5b-int8/

# Output: model.onnx, tokenizer.json, config.json
```

#### Hosting Models

```typescript
// next.config.ts
export default {
  // ...
  async headers() {
    return [
      {
        source: '/models/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
};
```

Store models in:
- `public/models/` for small models (<100MB)
- Vercel Blob for larger models (with streaming download)
- CDN for production deployment

## Performance Optimization

### 1. Web Workers

Always run inference in Web Workers to avoid blocking the main thread:

```typescript
// Inference runs in worker
// Main thread remains responsive
// Tokens streamed back via postMessage
```

### 2. WASM Optimization

Configure ONNX Runtime for optimal WASM performance:

```typescript
ort.env.wasm.numThreads = navigator.hardwareConcurrency || 4;
ort.env.wasm.simd = true;
ort.env.wasm.wasmPaths = '/onnx-wasm/';
```

### 3. Model Caching

Use aggressive caching strategies:

```typescript
// IndexedDB for model persistence
// Service Worker for offline support
// Cache API for assets

// sw.ts
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('onnx-models').then((cache) => {
      return cache.addAll([
        '/models/qwen-0.5b-int8.onnx',
        '/onnx-wasm/ort-wasm-simd.wasm',
      ]);
    })
  );
});
```

### 4. Lazy Loading

Only load models when needed:

```typescript
// Don't load on page load
// Load when user switches to offline mode
// Or preload in background when idle

const { loadModel } = useOfflineModel();

useEffect(() => {
  // Preload after 5 seconds if user is idle
  const timer = setTimeout(() => {
    loadModel('qwen-0.5b-q4');
  }, 5000);
  
  return () => clearTimeout(timer);
}, []);
```

## Testing Strategy

### Unit Tests

```typescript
// __tests__/offline/model-manager.test.ts
import { OfflineModelManager } from '@/lib/offline/model-manager';

describe('OfflineModelManager', () => {
  it('should load model successfully', async () => {
    const manager = new OfflineModelManager();
    await manager.loadModel('test-model');
    expect(manager.isLoaded()).toBe(true);
  });

  it('should generate text', async () => {
    const manager = new OfflineModelManager();
    await manager.loadModel('test-model');
    
    const generator = await manager.generateText('Hello');
    const result = await generator.next();
    
    expect(result.value).toBeTruthy();
  });
});
```

### Integration Tests

```typescript
// __tests__/integration/offline-chat.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { OfflineChatProvider } from '@/components/offline-chat-provider';
import ChatPage from '@/app/(chat)/page';

test('offline mode generates responses', async () => {
  render(
    <OfflineChatProvider>
      <ChatPage />
    </OfflineChatProvider>
  );

  // Switch to offline mode
  const toggle = screen.getByRole('switch', { name: /offline/i });
  await userEvent.click(toggle);

  // Wait for model to load
  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });

  // Send message
  const input = screen.getByRole('textbox');
  await userEvent.type(input, 'Hello{Enter}');

  // Expect offline response
  await waitFor(() => {
    expect(screen.getByText(/generated offline/i)).toBeInTheDocument();
  });
});
```

### Performance Tests

```typescript
// __tests__/performance/inference-speed.test.ts
test('inference completes within acceptable time', async () => {
  const manager = new OfflineModelManager();
  await manager.loadModel('qwen-0.5b-q4');
  
  const start = performance.now();
  const generator = await manager.generateText('Test prompt', {
    maxTokens: 100,
  });
  
  let tokenCount = 0;
  for await (const token of generator) {
    tokenCount++;
  }
  
  const duration = performance.now() - start;
  const tokensPerSecond = (tokenCount / duration) * 1000;
  
  // Expect at least 10 tokens/second on average hardware
  expect(tokensPerSecond).toBeGreaterThan(10);
});
```

## Deployment Checklist

- [ ] Models converted to ONNX format
- [ ] Models uploaded to CDN/Blob storage
- [ ] WASM files properly configured
- [ ] Service worker registered
- [ ] IndexedDB quota checked (ask for persistent storage)
- [ ] Cross-origin headers configured
- [ ] Offline mode UI tested
- [ ] Fallback to cloud API on errors
- [ ] Performance benchmarked on target devices
- [ ] Error handling for model loading failures
- [ ] Analytics for offline usage tracking

## Browser Compatibility

| Browser | ONNX Runtime Web | Web Workers | IndexedDB | Notes |
|---------|-----------------|-------------|-----------|-------|
| Chrome 90+ | ✅ | ✅ | ✅ | Full support |
| Firefox 88+ | ✅ | ✅ | ✅ | Full support |
| Safari 15+ | ⚠️ | ✅ | ✅ | SIMD support limited |
| Edge 90+ | ✅ | ✅ | ✅ | Full support |
| Mobile Chrome | ✅ | ✅ | ✅ | May be slow on low-end devices |
| Mobile Safari | ⚠️ | ✅ | ✅ | Limited WASM performance |

## Cost-Benefit Analysis

### Benefits

**User Experience:**
- Works completely offline
- No API rate limits
- Instant responses (no network latency)
- Privacy-preserving (data never leaves device)

**Development:**
- Testing without API costs
- Development without API keys
- Prototype features quickly

**Business:**
- Reduced API costs (for basic queries)
- Freemium model (offline free, cloud premium)
- Edge deployment possibilities

### Costs

**Technical:**
- Initial load time (model download)
- Storage requirements (300MB - 2GB)
- Limited model quality (vs GPT-4, Claude)
- Browser compatibility challenges

**Development:**
- Additional complexity
- More testing required
- Model maintenance overhead

**User:**
- Increased bandwidth on first use
- Device storage consumption
- Battery usage during inference

## Recommended Implementation Path

1. **Week 1**: Core infrastructure
   - Install dependencies
   - Create model manager
   - Set up worker system

2. **Week 2**: Basic integration
   - Integrate with existing chat
   - Add model download UI
   - Implement offline toggle

3. **Week 3**: Model preparation
   - Convert models to ONNX
   - Upload to hosting
   - Test on various devices

4. **Week 4**: Polish & testing
   - Error handling
   - Performance optimization
   - User documentation

5. **Week 5**: Deployment
   - Production testing
   - Analytics integration
   - User onboarding flow

## Conclusion

Integrating offline inference capabilities inspired by the Pocket LLM architecture can significantly enhance the Next.js AI chatbot by:

1. Providing a privacy-focused offline mode
2. Reducing API costs for basic queries
3. Enabling development/testing without API dependencies
4. Offering a unique competitive advantage

The implementation is technically feasible using ONNX Runtime Web and follows modern web standards for PWA capabilities.

**Next Steps:**
1. Review this architecture with the team
2. Choose initial models to support
3. Set up model conversion pipeline
4. Begin Phase 1 implementation

---

*For questions or implementation support, refer to:*
- ONNX Runtime Web docs: https://onnxruntime.ai/docs/tutorials/web/
- Transformers.js: https://huggingface.co/docs/transformers.js
- Web Workers API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API
