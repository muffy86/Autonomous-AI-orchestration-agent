/**
 * Cost Tracking System
 * Calculates and tracks LLM costs per request
 */

import { MODEL_PRICING, type LLMTrace, type CostMetrics } from './types';

export class CostTracker {
  /**
   * Calculate cost for a single LLM request
   */
  static calculateCost(params: {
    model: string;
    inputTokens: number;
    outputTokens: number;
  }): { inputCost: number; outputCost: number; totalCost: number } {
    const pricing = MODEL_PRICING[params.model];
    
    if (!pricing) {
      console.warn(`No pricing found for model: ${params.model}`);
      return { inputCost: 0, outputCost: 0, totalCost: 0 };
    }

    const inputCost = (params.inputTokens / 1_000_000) * pricing.inputCostPer1M;
    const outputCost = (params.outputTokens / 1_000_000) * pricing.outputCostPer1M;
    const totalCost = inputCost + outputCost;

    return {
      inputCost: Number(inputCost.toFixed(6)),
      outputCost: Number(outputCost.toFixed(6)),
      totalCost: Number(totalCost.toFixed(6)),
    };
  }

  /**
   * Estimate cost before making request
   */
  static estimateCost(params: {
    model: string;
    estimatedInputTokens: number;
    estimatedOutputTokens: number;
  }): number {
    const { totalCost } = this.calculateCost({
      model: params.model,
      inputTokens: params.estimatedInputTokens,
      outputTokens: params.estimatedOutputTokens,
    });
    return totalCost;
  }

  /**
   * Calculate total costs from multiple traces
   */
  static aggregateCosts(traces: LLMTrace[]): CostMetrics {
    const costByModel: Record<string, number> = {};
    const costByUser: Record<string, number> = {};
    let totalCost = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    for (const trace of traces) {
      totalCost += trace.costUSD;
      totalInputTokens += trace.inputTokens;
      totalOutputTokens += trace.outputTokens;

      // By model
      costByModel[trace.model] = (costByModel[trace.model] || 0) + trace.costUSD;

      // By user
      costByUser[trace.userId] = (costByUser[trace.userId] || 0) + trace.costUSD;
    }

    const period = {
      start: traces[0]?.startedAt || new Date(),
      end: traces[traces.length - 1]?.completedAt || new Date(),
    };

    return {
      totalCostUSD: Number(totalCost.toFixed(6)),
      costByModel,
      costByUser,
      tokenUsage: {
        input: totalInputTokens,
        output: totalOutputTokens,
        total: totalInputTokens + totalOutputTokens,
      },
      requestCount: traces.length,
      period,
    };
  }

  /**
   * Check if cost exceeds threshold
   */
  static exceedsThreshold(currentCost: number, thresholdUSD: number): boolean {
    return currentCost >= thresholdUSD;
  }

  /**
   * Format cost for display
   */
  static formatCost(costUSD: number): string {
    if (costUSD < 0.01) {
      return `$${(costUSD * 1000).toFixed(3)}k`; // Show in thousandths
    }
    return `$${costUSD.toFixed(4)}`;
  }

  /**
   * Get pricing info for a model
   */
  static getPricing(model: string) {
    return MODEL_PRICING[model];
  }

  /**
   * List all supported models with pricing
   */
  static getAllPricing() {
    return MODEL_PRICING;
  }

  /**
   * Compare costs between models for same input/output
   */
  static compareCosts(params: {
    models: string[];
    inputTokens: number;
    outputTokens: number;
  }): Array<{ model: string; cost: number; savings?: number }> {
    const results = params.models.map((model) => {
      const { totalCost } = this.calculateCost({
        model,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
      });
      return { model, cost: totalCost };
    });

    // Calculate savings compared to most expensive
    const maxCost = Math.max(...results.map((r) => r.cost));
    return results.map((r) => ({
      ...r,
      savings: r.cost < maxCost ? maxCost - r.cost : undefined,
    }));
  }
}

/**
 * Budget Manager
 * Tracks spending against budgets
 */
export class BudgetManager {
  private budgets: Map<string, { limit: number; spent: number; period: string }> = new Map();

  /**
   * Set budget for a user or team
   */
  setBudget(id: string, limitUSD: number, period: 'day' | 'week' | 'month') {
    this.budgets.set(id, { limit: limitUSD, spent: 0, period });
  }

  /**
   * Track spending
   */
  trackSpending(id: string, costUSD: number): {
    allowed: boolean;
    remaining: number;
    percentUsed: number;
  } {
    const budget = this.budgets.get(id);
    if (!budget) {
      return { allowed: true, remaining: Infinity, percentUsed: 0 };
    }

    budget.spent += costUSD;
    const remaining = budget.limit - budget.spent;
    const percentUsed = (budget.spent / budget.limit) * 100;

    return {
      allowed: remaining >= 0,
      remaining: Math.max(0, remaining),
      percentUsed: Math.min(100, percentUsed),
    };
  }

  /**
   * Reset budget (e.g., at start of new period)
   */
  resetBudget(id: string) {
    const budget = this.budgets.get(id);
    if (budget) {
      budget.spent = 0;
    }
  }

  /**
   * Get budget status
   */
  getBudgetStatus(id: string) {
    return this.budgets.get(id);
  }
}
