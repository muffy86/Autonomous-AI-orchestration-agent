/**
 * Autonomous Agent Orchestration System
 * Multi-model, multi-chain agentic OS with real-time execution
 */

import { z } from 'zod';
import { nanoid } from 'nanoid';

// ============================================================================
// Core Types & Schemas
// ============================================================================

export const AgentCapabilitySchema = z.enum([
  'reasoning',
  'vision',
  'coding',
  'planning',
  'execution',
  'blockchain',
  'tool_use',
  'multimodal',
  'autonomous',
]);

export const ModelProviderSchema = z.enum([
  'openai',
  'anthropic',
  'xai',
  'publicai',
  'google',
  'cohere',
  'mistral',
  'local',
]);

export const AgentConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  capabilities: z.array(AgentCapabilitySchema),
  modelProvider: ModelProviderSchema,
  modelName: z.string(),
  systemPrompt: z.string(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().default(4096),
  tools: z.array(z.string()).default([]),
  autonomous: z.boolean().default(false),
  priority: z.number().min(0).max(10).default(5),
});

export const TaskSchema = z.object({
  id: z.string(),
  type: z.enum(['analysis', 'execution', 'planning', 'vision', 'blockchain']),
  description: z.string(),
  input: z.any(),
  assignedAgent: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed']),
  result: z.any().optional(),
  error: z.string().optional(),
  startTime: z.number().optional(),
  endTime: z.number().optional(),
  dependencies: z.array(z.string()).default([]),
});

export const OrchestrationStrategySchema = z.enum([
  'sequential',
  'parallel',
  'pipeline',
  'hierarchical',
  'collaborative',
  'autonomous',
]);

export type AgentCapability = z.infer<typeof AgentCapabilitySchema>;
export type ModelProvider = z.infer<typeof ModelProviderSchema>;
export type AgentConfig = z.infer<typeof AgentConfigSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type OrchestrationStrategy = z.infer<typeof OrchestrationStrategySchema>;

// ============================================================================
// Agent Base Class
// ============================================================================

export class AutonomousAgent {
  public config: AgentConfig;
  private executionHistory: Array<{ task: Task; timestamp: number }> = [];

  constructor(config: Partial<AgentConfig>) {
    this.config = AgentConfigSchema.parse({
      id: config.id || nanoid(),
      name: config.name || 'Agent',
      description: config.description || '',
      capabilities: config.capabilities || [],
      modelProvider: config.modelProvider || 'openai',
      modelName: config.modelName || 'gpt-4',
      systemPrompt: config.systemPrompt || 'You are a helpful AI agent.',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 4096,
      tools: config.tools || [],
      autonomous: config.autonomous ?? false,
      priority: config.priority ?? 5,
    });
  }

  async execute(task: Task): Promise<Task> {
    const startTime = Date.now();
    
    try {
      task.status = 'in_progress';
      task.assignedAgent = this.config.id;
      task.startTime = startTime;

      // Execute based on task type
      const result = await this.processTask(task);

      task.status = 'completed';
      task.result = result;
      task.endTime = Date.now();

      this.executionHistory.push({ task, timestamp: Date.now() });
      
      return task;
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : String(error);
      task.endTime = Date.now();
      throw error;
    }
  }

  protected async processTask(task: Task): Promise<any> {
    // Override in subclasses for specific task processing
    return { message: 'Task processed by base agent' };
  }

  canHandle(task: Task): boolean {
    // Check if agent has required capabilities
    const requiredCapabilities = this.getRequiredCapabilities(task.type);
    return requiredCapabilities.every((cap) =>
      this.config.capabilities.includes(cap)
    );
  }

  private getRequiredCapabilities(taskType: Task['type']): AgentCapability[] {
    const capabilityMap: Record<Task['type'], AgentCapability[]> = {
      analysis: ['reasoning'],
      execution: ['execution', 'tool_use'],
      planning: ['planning', 'reasoning'],
      vision: ['vision', 'multimodal'],
      blockchain: ['blockchain', 'execution'],
    };
    return capabilityMap[taskType] || [];
  }

  getMetrics() {
    return {
      id: this.config.id,
      name: this.config.name,
      tasksExecuted: this.executionHistory.length,
      averageExecutionTime:
        this.executionHistory.length > 0
          ? this.executionHistory.reduce((sum, { task }) => {
              return sum + ((task.endTime || 0) - (task.startTime || 0));
            }, 0) / this.executionHistory.length
          : 0,
      successRate:
        this.executionHistory.length > 0
          ? (this.executionHistory.filter(({ task }) => task.status === 'completed')
              .length /
              this.executionHistory.length) *
            100
          : 0,
    };
  }
}

// ============================================================================
// Agent Orchestrator
// ============================================================================

export class AgentOrchestrator {
  private agents: Map<string, AutonomousAgent> = new Map();
  private tasks: Map<string, Task> = new Map();
  private executionQueue: Task[] = [];
  private strategy: OrchestrationStrategy = 'autonomous';

  constructor(strategy: OrchestrationStrategy = 'autonomous') {
    this.strategy = strategy;
  }

  registerAgent(agent: AutonomousAgent): void {
    this.agents.set(agent.config.id, agent);
    console.log(`✓ Registered agent: ${agent.config.name} (${agent.config.id})`);
  }

  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
  }

  async submitTask(taskData: Partial<Task>): Promise<string> {
    const task: Task = TaskSchema.parse({
      id: taskData.id || nanoid(),
      type: taskData.type || 'execution',
      description: taskData.description || '',
      input: taskData.input,
      status: 'pending',
      dependencies: taskData.dependencies || [],
    });

    this.tasks.set(task.id, task);
    this.executionQueue.push(task);

    // Auto-execute if in autonomous mode
    if (this.strategy === 'autonomous') {
      this.processQueue().catch(console.error);
    }

    return task.id;
  }

  async processQueue(): Promise<void> {
    while (this.executionQueue.length > 0) {
      switch (this.strategy) {
        case 'sequential':
          await this.processSequential();
          break;
        case 'parallel':
          await this.processParallel();
          break;
        case 'pipeline':
          await this.processPipeline();
          break;
        case 'autonomous':
          await this.processAutonomous();
          break;
        default:
          await this.processSequential();
      }
    }
  }

  private async processSequential(): Promise<void> {
    const task = this.executionQueue.shift();
    if (!task) return;

    await this.executeTask(task);
  }

  private async processParallel(): Promise<void> {
    const tasksToExecute = [...this.executionQueue];
    this.executionQueue = [];

    await Promise.allSettled(
      tasksToExecute.map((task) => this.executeTask(task))
    );
  }

  private async processPipeline(): Promise<void> {
    // Execute tasks in dependency order
    const task = this.findReadyTask();
    if (task) {
      const index = this.executionQueue.indexOf(task);
      this.executionQueue.splice(index, 1);
      await this.executeTask(task);
    }
  }

  private async processAutonomous(): Promise<void> {
    // Intelligent task distribution based on agent capabilities and load
    const task = this.findReadyTask();
    if (!task) return;

    const bestAgent = this.findBestAgent(task);
    if (bestAgent) {
      const index = this.executionQueue.indexOf(task);
      this.executionQueue.splice(index, 1);
      await this.executeTaskWithAgent(task, bestAgent);
    }
  }

  private findReadyTask(): Task | undefined {
    return this.executionQueue.find((task) => {
      return task.dependencies.every((depId) => {
        const depTask = this.tasks.get(depId);
        return depTask?.status === 'completed';
      });
    });
  }

  private findBestAgent(task: Task): AutonomousAgent | undefined {
    const capableAgents = Array.from(this.agents.values()).filter((agent) =>
      agent.canHandle(task)
    );

    if (capableAgents.length === 0) return undefined;

    // Sort by priority and success rate
    return capableAgents.sort((a, b) => {
      const aMetrics = a.getMetrics();
      const bMetrics = b.getMetrics();
      
      // Higher priority and higher success rate is better
      const aScore = a.config.priority * 10 + aMetrics.successRate;
      const bScore = b.config.priority * 10 + bMetrics.successRate;
      
      return bScore - aScore;
    })[0];
  }

  private async executeTask(task: Task): Promise<void> {
    const agent = this.findBestAgent(task);
    if (!agent) {
      task.status = 'failed';
      task.error = 'No capable agent found';
      return;
    }

    await this.executeTaskWithAgent(task, agent);
  }

  private async executeTaskWithAgent(
    task: Task,
    agent: AutonomousAgent
  ): Promise<void> {
    try {
      const updatedTask = await agent.execute(task);
      this.tasks.set(task.id, updatedTask);
    } catch (error) {
      console.error(`Task ${task.id} failed:`, error);
    }
  }

  async getTask(taskId: string): Promise<Task | undefined> {
    return this.tasks.get(taskId);
  }

  getAgents(): AutonomousAgent[] {
    return Array.from(this.agents.values());
  }

  getMetrics() {
    const agentMetrics = Array.from(this.agents.values()).map((agent) =>
      agent.getMetrics()
    );

    const allTasks = Array.from(this.tasks.values());
    
    return {
      totalAgents: this.agents.size,
      totalTasks: this.tasks.size,
      queuedTasks: this.executionQueue.length,
      completedTasks: allTasks.filter((t) => t.status === 'completed').length,
      failedTasks: allTasks.filter((t) => t.status === 'failed').length,
      agents: agentMetrics,
      strategy: this.strategy,
    };
  }

  setStrategy(strategy: OrchestrationStrategy): void {
    this.strategy = strategy;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createReasoningAgent(config?: Partial<AgentConfig>): AutonomousAgent {
  return new AutonomousAgent({
    name: 'Reasoning Agent',
    description: 'Advanced reasoning and problem-solving agent',
    capabilities: ['reasoning', 'planning', 'autonomous'],
    modelProvider: 'openai',
    modelName: 'gpt-4',
    systemPrompt: 'You are an expert reasoning agent specializing in complex problem-solving and strategic planning.',
    ...config,
  });
}

export function createVisionAgent(config?: Partial<AgentConfig>): AutonomousAgent {
  return new AutonomousAgent({
    name: 'Vision Agent',
    description: 'Multimodal vision and image understanding agent',
    capabilities: ['vision', 'multimodal', 'reasoning'],
    modelProvider: 'openai',
    modelName: 'gpt-4-vision-preview',
    systemPrompt: 'You are a vision specialist agent capable of understanding and analyzing images, screenshots, and visual data.',
    ...config,
  });
}

export function createCodingAgent(config?: Partial<AgentConfig>): AutonomousAgent {
  return new AutonomousAgent({
    name: 'Coding Agent',
    description: 'Software development and code execution agent',
    capabilities: ['coding', 'execution', 'tool_use', 'reasoning'],
    modelProvider: 'openai',
    modelName: 'gpt-4',
    systemPrompt: 'You are an expert software engineer capable of writing, analyzing, and executing code across multiple programming languages.',
    tools: ['code_interpreter', 'file_system', 'git', 'terminal'],
    ...config,
  });
}

export function createBlockchainAgent(config?: Partial<AgentConfig>): AutonomousAgent {
  return new AutonomousAgent({
    name: 'Blockchain Agent',
    description: 'Multi-chain blockchain interaction and smart contract agent',
    capabilities: ['blockchain', 'execution', 'tool_use', 'reasoning'],
    modelProvider: 'openai',
    modelName: 'gpt-4',
    systemPrompt: 'You are a blockchain specialist agent capable of interacting with multiple blockchain networks, executing transactions, and analyzing smart contracts.',
    tools: ['web3', 'ethers', 'solana', 'cosmos', 'wallet'],
    ...config,
  });
}

export function createPublicAIAgent(config?: Partial<AgentConfig>): AutonomousAgent {
  return new AutonomousAgent({
    name: 'Public AI Agent (Apertus)',
    description: 'Sovereign AI agent using Public AI infrastructure - nonprofit platform providing access to swiss-ai/apertus-8b-instruct model. Features: 65K context window, 8K output, GDPR-compliant, EU-hosted, Apache 2.0 licensed.',
    capabilities: ['reasoning', 'autonomous', 'multimodal'],
    modelProvider: 'publicai',
    modelName: 'swiss-ai/apertus-8b-instruct',
    systemPrompt: `You are a sovereign AI agent powered by Apertus, a fully open foundation model developed by the Swiss AI Initiative.

You operate on Public AI infrastructure - a nonprofit, open-source platform that provides AI as a public utility.

Core Values:
- Transparency: Full visibility into your operation
- Privacy: User data is protected by design (GDPR-compliant)
- Sovereignty: Public/national control over AI
- Open Source: Apache 2.0 licensed
- Public Good: Serving the public interest

You prioritize transparency, privacy, ethical AI practices, and GDPR compliance in all interactions.`,
    temperature: 0.8, // Recommended by swiss-ai
    maxTokens: 8192, // Maximum output tokens for Apertus
    ...config,
  });
}
