/**
 * Autonomous Agent Orchestrator
 * Manages task queue, workflow execution, and agent state
 */

import { EventEmitter } from 'events';

export interface Task {
  id: string;
  type: 'workflow' | 'tool' | 'skill';
  name: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  result?: any;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  retries: number;
  maxRetries: number;
  dependencies?: string[];
  workflow?: WorkflowStep[];
  context?: any;
}

export interface WorkflowStep {
  id: string;
  name: string;
  action: string;
  params?: any;
  condition?: string;
  onSuccess?: string;
  onFailure?: string;
  retry?: boolean;
  timeout?: number;
}

export interface AgentState {
  isActive: boolean;
  currentTask?: string;
  taskQueue: string[];
  completedTasks: string[];
  failedTasks: string[];
  stats: {
    totalTasks: number;
    completed: number;
    failed: number;
    averageDuration: number;
  };
}

class AgentOrchestrator extends EventEmitter {
  private tasks: Map<string, Task> = new Map();
  private queue: Task[] = [];
  private running: boolean = false;
  private maxConcurrent: number = 3;
  private currentlyRunning: Set<string> = new Set();
  private state: AgentState;

  constructor() {
    super();
    this.state = {
      isActive: false,
      taskQueue: [],
      completedTasks: [],
      failedTasks: [],
      stats: {
        totalTasks: 0,
        completed: 0,
        failed: 0,
        averageDuration: 0,
      },
    };
  }

  /**
   * Add task to queue
   */
  async addTask(task: Omit<Task, 'id' | 'status' | 'progress' | 'createdAt' | 'retries'>): Promise<string> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullTask: Task = {
      ...task,
      id: taskId,
      status: 'pending',
      progress: 0,
      createdAt: Date.now(),
      retries: 0,
      maxRetries: task.maxRetries || 3,
    };

    this.tasks.set(taskId, fullTask);
    this.queue.push(fullTask);
    this.state.taskQueue.push(taskId);
    this.state.stats.totalTasks++;

    this.emit('task:added', fullTask);
    
    // Start processing if not already running
    if (!this.running) {
      this.start();
    }

    return taskId;
  }

  /**
   * Start orchestrator
   */
  start() {
    if (this.running) return;
    
    this.running = true;
    this.state.isActive = true;
    this.emit('orchestrator:started');
    
    this.processQueue();
  }

  /**
   * Stop orchestrator
   */
  stop() {
    this.running = false;
    this.state.isActive = false;
    this.emit('orchestrator:stopped');
  }

  /**
   * Process task queue
   */
  private async processQueue() {
    while (this.running && (this.queue.length > 0 || this.currentlyRunning.size > 0)) {
      // Get tasks we can run
      const available = this.maxConcurrent - this.currentlyRunning.size;
      
      if (available > 0 && this.queue.length > 0) {
        // Sort by priority
        this.queue.sort((a, b) => {
          const priorities = { critical: 4, high: 3, medium: 2, low: 1 };
          return priorities[b.priority] - priorities[a.priority];
        });

        // Get next tasks
        const tasksToRun = this.queue.splice(0, available);
        
        for (const task of tasksToRun) {
          // Check dependencies
          if (task.dependencies && !this.areDependenciesMet(task.dependencies)) {
            this.queue.push(task); // Put back in queue
            continue;
          }

          this.executeTask(task);
        }
      }

      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.running = false;
    this.state.isActive = false;
  }

  /**
   * Execute a single task
   */
  private async executeTask(task: Task) {
    this.currentlyRunning.add(task.id);
    this.state.currentTask = task.id;
    
    task.status = 'running';
    task.startedAt = Date.now();
    
    this.emit('task:started', task);

    try {
      let result;

      switch (task.type) {
        case 'workflow':
          result = await this.executeWorkflow(task);
          break;
        case 'tool':
          result = await this.executeTool(task);
          break;
        case 'skill':
          result = await this.executeSkill(task);
          break;
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      task.status = 'completed';
      task.result = result;
      task.progress = 100;
      task.completedAt = Date.now();

      this.state.completedTasks.push(task.id);
      this.state.stats.completed++;
      this.updateAverageDuration(task);

      this.emit('task:completed', task);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Retry logic
      if (task.retries < task.maxRetries) {
        task.retries++;
        task.status = 'pending';
        this.queue.push(task);
        this.emit('task:retry', task);
      } else {
        task.status = 'failed';
        task.error = errorMessage;
        task.completedAt = Date.now();
        
        this.state.failedTasks.push(task.id);
        this.state.stats.failed++;
        
        this.emit('task:failed', task);
      }
    } finally {
      this.currentlyRunning.delete(task.id);
      this.state.currentTask = undefined;
      
      // Remove from taskQueue
      this.state.taskQueue = this.state.taskQueue.filter(id => id !== task.id);
    }
  }

  /**
   * Execute workflow
   */
  private async executeWorkflow(task: Task): Promise<any> {
    if (!task.workflow) {
      throw new Error('No workflow defined');
    }

    const results: any[] = [];
    let currentStep = 0;

    for (const step of task.workflow) {
      task.progress = (currentStep / task.workflow.length) * 100;
      this.emit('task:progress', task);

      try {
        const result = await this.executeWorkflowStep(step, task.context, results);
        results.push(result);

        // Check condition
        if (step.condition && !this.evaluateCondition(step.condition, result)) {
          break;
        }

        // Handle success
        if (step.onSuccess) {
          const nextStep = task.workflow.find(s => s.id === step.onSuccess);
          if (nextStep) {
            currentStep = task.workflow.indexOf(nextStep);
            continue;
          }
        }
      } catch (error) {
        // Handle failure
        if (step.onFailure) {
          const failureStep = task.workflow.find(s => s.id === step.onFailure);
          if (failureStep) {
            currentStep = task.workflow.indexOf(failureStep);
            continue;
          }
        }
        
        if (!step.retry) {
          throw error;
        }
      }

      currentStep++;
    }

    return {
      steps: results.length,
      results,
    };
  }

  /**
   * Execute workflow step
   */
  private async executeWorkflowStep(step: WorkflowStep, context: any, previousResults: any[]): Promise<any> {
    // Import dynamically to avoid circular dependencies
    const { mcpTools } = await import('../mcp/tools');
    const { skillsManager } = await import('../mcp/skills');

    const timeout = step.timeout || 30000;

    return await Promise.race([
      (async () => {
        switch (step.action) {
          case 'execute_tool': {
            const tool = mcpTools.find(t => t.name === step.params?.tool);
            if (!tool) throw new Error(`Tool not found: ${step.params?.tool}`);
            return await tool.execute(step.params?.args || {});
          }

          case 'execute_skill': {
            return await skillsManager.executeSkill(
              step.params?.skill,
              step.params?.args || {}
            );
          }

          case 'wait': {
            await new Promise(resolve => setTimeout(resolve, step.params?.duration || 1000));
            return { waited: step.params?.duration };
          }

          case 'condition': {
            const result = this.evaluateCondition(step.params?.expression, context);
            return { condition: result };
          }

          default:
            throw new Error(`Unknown action: ${step.action}`);
        }
      })(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Step timeout')), timeout)
      ),
    ]);
  }

  /**
   * Execute tool
   */
  private async executeTool(task: Task): Promise<any> {
    const { mcpTools } = await import('../mcp/tools');
    const tool = mcpTools.find(t => t.name === task.name);
    
    if (!tool) {
      throw new Error(`Tool not found: ${task.name}`);
    }

    return await tool.execute(task.context || {});
  }

  /**
   * Execute skill
   */
  private async executeSkill(task: Task): Promise<any> {
    const { skillsManager } = await import('../mcp/skills');
    return await skillsManager.executeSkill(task.name, task.context || {});
  }

  /**
   * Evaluate condition
   */
  private evaluateCondition(expression: string, context: any): boolean {
    try {
      // Simple condition evaluation (can be enhanced)
      return eval(expression);
    } catch {
      return false;
    }
  }

  /**
   * Check if dependencies are met
   */
  private areDependenciesMet(dependencies: string[]): boolean {
    return dependencies.every(depId => {
      const dep = this.tasks.get(depId);
      return dep && dep.status === 'completed';
    });
  }

  /**
   * Update average duration
   */
  private updateAverageDuration(task: Task) {
    if (task.startedAt && task.completedAt) {
      const duration = task.completedAt - task.startedAt;
      const { completed, averageDuration } = this.state.stats;
      this.state.stats.averageDuration = 
        (averageDuration * (completed - 1) + duration) / completed;
    }
  }

  /**
   * Get task by ID
   */
  getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  /**
   * Get all tasks
   */
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get state
   */
  getState(): AgentState {
    return { ...this.state };
  }

  /**
   * Cancel task
   */
  cancelTask(id: string): boolean {
    const task = this.tasks.get(id);
    if (!task) return false;

    if (task.status === 'running') {
      // Can't cancel running tasks immediately
      return false;
    }

    task.status = 'cancelled';
    task.completedAt = Date.now();
    
    // Remove from queue
    this.queue = this.queue.filter(t => t.id !== id);
    this.state.taskQueue = this.state.taskQueue.filter(tid => tid !== id);

    this.emit('task:cancelled', task);
    return true;
  }

  /**
   * Pause task
   */
  pauseTask(id: string): boolean {
    const task = this.tasks.get(id);
    if (!task || task.status !== 'running') return false;

    task.status = 'paused';
    this.emit('task:paused', task);
    return true;
  }

  /**
   * Resume task
   */
  resumeTask(id: string): boolean {
    const task = this.tasks.get(id);
    if (!task || task.status !== 'paused') return false;

    task.status = 'pending';
    this.queue.push(task);
    this.emit('task:resumed', task);
    
    if (!this.running) {
      this.start();
    }
    
    return true;
  }

  /**
   * Clear completed tasks
   */
  clearCompleted() {
    for (const [id, task] of this.tasks.entries()) {
      if (task.status === 'completed') {
        this.tasks.delete(id);
      }
    }
    
    this.state.completedTasks = [];
  }
}

export const orchestrator = new AgentOrchestrator();
export default orchestrator;
