/**
 * Observability Types
 * Type definitions for LLM tracing, cost tracking, and monitoring
 */

export interface LLMTrace {
  id: string;
  chatId: string;
  userId: string;
  model: string;
  provider: 'xai' | 'openai' | 'anthropic' | 'gemini';
  
  // Token usage
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  
  // Cost
  costUSD: number;
  inputCostUSD: number;
  outputCostUSD: number;
  
  // Performance
  latencyMs: number;
  timeToFirstToken?: number;
  tokensPerSecond?: number;
  
  // Request/Response
  input: string | object;
  output?: string | object;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  
  // Tool usage
  toolCalls?: ToolCall[];
  
  // Metadata
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
  error?: string;
  status: 'success' | 'error' | 'pending';
  
  // Timestamps
  startedAt: Date;
  completedAt?: Date;
}

export interface ToolCall {
  id: string;
  name: string;
  parameters: Record<string, any>;
  result?: any;
  error?: string;
  durationMs: number;
  requiresApproval?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

export interface CostMetrics {
  totalCostUSD: number;
  costByModel: Record<string, number>;
  costByUser: Record<string, number>;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  requestCount: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface PerformanceMetrics {
  averageLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  averageTokensPerSecond: number;
  requestsPerMinute: number;
  errorRate: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface ModelPricing {
  provider: string;
  model: string;
  inputCostPer1M: number;  // Cost per 1M input tokens
  outputCostPer1M: number; // Cost per 1M output tokens
  contextWindow: number;
  trainingDataCutoff?: string;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  // xAI (Grok)
  'grok-2-vision-1212': {
    provider: 'xai',
    model: 'grok-2-vision-1212',
    inputCostPer1M: 2.00,
    outputCostPer1M: 10.00,
    contextWindow: 32768,
  },
  'grok-3-mini-beta': {
    provider: 'xai',
    model: 'grok-3-mini-beta',
    inputCostPer1M: 1.00,
    outputCostPer1M: 5.00,
    contextWindow: 16384,
  },
  'grok-2-1212': {
    provider: 'xai',
    model: 'grok-2-1212',
    inputCostPer1M: 2.00,
    outputCostPer1M: 10.00,
    contextWindow: 131072,
  },
  'grok-2-image': {
    provider: 'xai',
    model: 'grok-2-image',
    inputCostPer1M: 0,
    outputCostPer1M: 0, // Image generation pricing different
    contextWindow: 0,
  },
  
  // OpenAI (for future use)
  'gpt-4o': {
    provider: 'openai',
    model: 'gpt-4o',
    inputCostPer1M: 2.50,
    outputCostPer1M: 10.00,
    contextWindow: 128000,
    trainingDataCutoff: 'Oct 2023',
  },
  'gpt-4o-mini': {
    provider: 'openai',
    model: 'gpt-4o-mini',
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60,
    contextWindow: 128000,
    trainingDataCutoff: 'Oct 2023',
  },
  'o1-preview': {
    provider: 'openai',
    model: 'o1-preview',
    inputCostPer1M: 15.00,
    outputCostPer1M: 60.00,
    contextWindow: 128000,
    trainingDataCutoff: 'Oct 2023',
  },
  
  // Anthropic (for future use)
  'claude-opus-4-20250514': {
    provider: 'anthropic',
    model: 'claude-opus-4-20250514',
    inputCostPer1M: 15.00,
    outputCostPer1M: 75.00,
    contextWindow: 200000,
    trainingDataCutoff: 'Apr 2024',
  },
  'claude-sonnet-4.5-20250219': {
    provider: 'anthropic',
    model: 'claude-sonnet-4.5-20250219',
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    contextWindow: 200000,
    trainingDataCutoff: 'Apr 2024',
  },
};

export interface ObservabilityConfig {
  enabled: boolean;
  langfuseEnabled: boolean;
  costTrackingEnabled: boolean;
  performanceTrackingEnabled: boolean;
  sampleRate: number; // 0.0 to 1.0 (1.0 = 100% of requests)
  
  // Alert thresholds
  alerts?: {
    costThresholdUSD?: number;
    errorRateThreshold?: number;
    latencyThresholdMs?: number;
  };
}

export interface TraceContext {
  traceId: string;
  spanId?: string;
  parentSpanId?: string;
  userId?: string;
  sessionId?: string;
  tags?: Record<string, string>;
}
