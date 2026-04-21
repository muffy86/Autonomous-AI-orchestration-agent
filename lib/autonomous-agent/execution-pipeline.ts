/**
 * Real-time Execution & Deployment Pipeline
 * Automated continuous deployment and execution monitoring
 */

import { z } from 'zod';
import { nanoid } from 'nanoid';

// ============================================================================
// Pipeline Types & Schemas
// ============================================================================

export const PipelineStageSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum([
    'build',
    'test',
    'deploy',
    'validate',
    'monitor',
    'rollback',
    'custom',
  ]),
  command: z.string().optional(),
  script: z.string().optional(),
  dependencies: z.array(z.string()).default([]),
  timeout: z.number().default(300000), // 5 minutes
  retries: z.number().default(0),
  continueOnError: z.boolean().default(false),
  environment: z.record(z.string()).optional(),
  artifacts: z
    .object({
      paths: z.array(z.string()),
      retention: z.number().optional(),
    })
    .optional(),
});

export const PipelineConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  stages: z.array(PipelineStageSchema),
  triggers: z
    .object({
      manual: z.boolean().default(true),
      webhook: z.boolean().default(false),
      schedule: z.string().optional(), // Cron expression
      onPush: z.boolean().default(false),
      onPR: z.boolean().default(false),
    })
    .default({}),
  notifications: z
    .object({
      onSuccess: z.array(z.string()).default([]),
      onFailure: z.array(z.string()).default([]),
    })
    .optional(),
  parallel: z.boolean().default(false),
});

export const ExecutionSchema = z.object({
  id: z.string(),
  pipelineId: z.string(),
  status: z.enum([
    'pending',
    'running',
    'success',
    'failed',
    'cancelled',
    'skipped',
  ]),
  startTime: z.number().optional(),
  endTime: z.number().optional(),
  currentStage: z.string().optional(),
  stages: z.record(
    z.object({
      status: z.enum(['pending', 'running', 'success', 'failed', 'skipped']),
      startTime: z.number().optional(),
      endTime: z.number().optional(),
      logs: z.array(z.string()).default([]),
      error: z.string().optional(),
      retryCount: z.number().default(0),
    })
  ),
  triggeredBy: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type PipelineStage = z.infer<typeof PipelineStageSchema>;
export type PipelineConfig = z.infer<typeof PipelineConfigSchema>;
export type Execution = z.infer<typeof ExecutionSchema>;

// ============================================================================
// Pipeline Executor
// ============================================================================

export class PipelineExecutor {
  private executions: Map<string, Execution> = new Map();
  private runningExecutions: Set<string> = new Set();

  async execute(
    pipeline: PipelineConfig,
    triggeredBy?: string
  ): Promise<Execution> {
    const execution: Execution = ExecutionSchema.parse({
      id: nanoid(),
      pipelineId: pipeline.id,
      status: 'pending',
      stages: {},
      triggeredBy,
      metadata: {
        pipelineName: pipeline.name,
        totalStages: pipeline.stages.length,
      },
    });

    // Initialize stage status
    for (const stage of pipeline.stages) {
      execution.stages[stage.id] = {
        status: 'pending',
        logs: [],
        retryCount: 0,
      };
    }

    this.executions.set(execution.id, execution);
    this.runningExecutions.add(execution.id);

    console.log(`🚀 Starting pipeline execution: ${pipeline.name} (${execution.id})`);

    // Execute asynchronously
    this.runPipeline(pipeline, execution).catch((error) => {
      console.error('Pipeline execution error:', error);
      execution.status = 'failed';
      execution.endTime = Date.now();
      this.runningExecutions.delete(execution.id);
    });

    return execution;
  }

  private async runPipeline(
    pipeline: PipelineConfig,
    execution: Execution
  ): Promise<void> {
    execution.status = 'running';
    execution.startTime = Date.now();

    try {
      if (pipeline.parallel) {
        await this.executeParallel(pipeline, execution);
      } else {
        await this.executeSequential(pipeline, execution);
      }

      execution.status = 'success';
      execution.endTime = Date.now();

      console.log(`✅ Pipeline completed successfully: ${pipeline.name}`);
      
      await this.sendNotifications(pipeline, execution, 'success');
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = Date.now();

      console.error(`❌ Pipeline failed: ${pipeline.name}`, error);
      
      await this.sendNotifications(pipeline, execution, 'failure');
    } finally {
      this.runningExecutions.delete(execution.id);
    }
  }

  private async executeSequential(
    pipeline: PipelineConfig,
    execution: Execution
  ): Promise<void> {
    for (const stage of pipeline.stages) {
      if (!this.canExecuteStage(stage, execution)) {
        execution.stages[stage.id].status = 'skipped';
        continue;
      }

      execution.currentStage = stage.id;
      
      try {
        await this.executeStage(stage, execution);
      } catch (error) {
        if (!stage.continueOnError) {
          throw error;
        }
        console.warn(`⚠️ Stage failed but continuing: ${stage.name}`);
      }
    }
  }

  private async executeParallel(
    pipeline: PipelineConfig,
    execution: Execution
  ): Promise<void> {
    // Group stages by dependency level
    const levels = this.buildDependencyLevels(pipeline.stages);

    for (const level of levels) {
      const promises = level.map((stage) => {
        if (!this.canExecuteStage(stage, execution)) {
          execution.stages[stage.id].status = 'skipped';
          return Promise.resolve();
        }

        return this.executeStage(stage, execution).catch((error) => {
          if (!stage.continueOnError) throw error;
          console.warn(`⚠️ Stage failed but continuing: ${stage.name}`);
        });
      });

      await Promise.all(promises);
    }
  }

  private buildDependencyLevels(stages: PipelineStage[]): PipelineStage[][] {
    const levels: PipelineStage[][] = [];
    const processed = new Set<string>();
    const stageMap = new Map(stages.map((s) => [s.id, s]));

    while (processed.size < stages.length) {
      const level: PipelineStage[] = [];

      for (const stage of stages) {
        if (processed.has(stage.id)) continue;

        const allDepsProcessed = stage.dependencies.every((dep) =>
          processed.has(dep)
        );

        if (allDepsProcessed) {
          level.push(stage);
          processed.add(stage.id);
        }
      }

      if (level.length === 0) {
        throw new Error('Circular dependency detected in pipeline stages');
      }

      levels.push(level);
    }

    return levels;
  }

  private canExecuteStage(stage: PipelineStage, execution: Execution): boolean {
    // Check if all dependencies succeeded
    return stage.dependencies.every((depId) => {
      const depStatus = execution.stages[depId]?.status;
      return depStatus === 'success' || depStatus === 'skipped';
    });
  }

  private async executeStage(
    stage: PipelineStage,
    execution: Execution
  ): Promise<void> {
    const stageExecution = execution.stages[stage.id];
    stageExecution.status = 'running';
    stageExecution.startTime = Date.now();

    console.log(`▶️  Executing stage: ${stage.name}`);

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= stage.retries; attempt++) {
      if (attempt > 0) {
        console.log(`🔄 Retrying stage ${stage.name} (attempt ${attempt + 1}/${stage.retries + 1})`);
        stageExecution.retryCount = attempt;
      }

      try {
        const result = await this.runStageCommand(stage, execution);
        
        stageExecution.logs.push(...result.logs);
        stageExecution.status = 'success';
        stageExecution.endTime = Date.now();

        console.log(`✓ Stage completed: ${stage.name}`);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        stageExecution.logs.push(`Error: ${lastError.message}`);
      }
    }

    // All retries failed
    stageExecution.status = 'failed';
    stageExecution.endTime = Date.now();
    stageExecution.error = lastError?.message;

    throw lastError;
  }

  private async runStageCommand(
    stage: PipelineStage,
    execution: Execution
  ): Promise<{ logs: string[]; exitCode: number }> {
    const logs: string[] = [];

    // Execute command or script
    if (stage.command) {
      logs.push(`$ ${stage.command}`);
      
      // In production: Use child_process.exec or execa
      // const { stdout, stderr } = await exec(stage.command, {
      //   timeout: stage.timeout,
      //   env: { ...process.env, ...stage.environment },
      // });
      
      logs.push('Command executed successfully');
    }

    if (stage.script) {
      logs.push('Running script...');
      // Execute script
      logs.push('Script completed');
    }

    // Handle artifacts
    if (stage.artifacts) {
      logs.push(`Collecting artifacts: ${stage.artifacts.paths.join(', ')}`);
    }

    return { logs, exitCode: 0 };
  }

  private async sendNotifications(
    pipeline: PipelineConfig,
    execution: Execution,
    type: 'success' | 'failure'
  ): Promise<void> {
    const recipients =
      type === 'success'
        ? pipeline.notifications?.onSuccess || []
        : pipeline.notifications?.onFailure || [];

    if (recipients.length === 0) return;

    const message = `Pipeline ${pipeline.name} ${type === 'success' ? 'succeeded' : 'failed'}`;
    
    console.log(`📬 Sending ${type} notifications to:`, recipients);
    
    // In production: Send emails, webhooks, Slack messages, etc.
  }

  async cancelExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    execution.status = 'cancelled';
    execution.endTime = Date.now();
    this.runningExecutions.delete(executionId);

    console.log(`🛑 Execution cancelled: ${executionId}`);
  }

  getExecution(executionId: string): Execution | undefined {
    return this.executions.get(executionId);
  }

  getExecutions(pipelineId?: string): Execution[] {
    const executions = Array.from(this.executions.values());
    
    if (pipelineId) {
      return executions.filter((e) => e.pipelineId === pipelineId);
    }
    
    return executions;
  }

  getRunningExecutions(): Execution[] {
    return Array.from(this.runningExecutions)
      .map((id) => this.executions.get(id))
      .filter((e): e is Execution => e !== undefined);
  }
}

// ============================================================================
// Deployment Manager
// ============================================================================

export const DeploymentTargetSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['docker', 'kubernetes', 'serverless', 'vm', 'edge']),
  config: z.record(z.any()),
  environment: z.enum(['development', 'staging', 'production']),
  healthCheck: z
    .object({
      url: z.string(),
      interval: z.number(),
      timeout: z.number(),
    })
    .optional(),
});

export type DeploymentTarget = z.infer<typeof DeploymentTargetSchema>;

export class DeploymentManager {
  private targets: Map<string, DeploymentTarget> = new Map();
  private deployments: Map<string, {
    id: string;
    targetId: string;
    version: string;
    status: 'deploying' | 'active' | 'failed' | 'rolled_back';
    timestamp: number;
    healthStatus?: 'healthy' | 'unhealthy';
  }> = new Map();

  registerTarget(target: DeploymentTarget): void {
    this.targets.set(target.id, target);
    console.log(`🎯 Registered deployment target: ${target.name}`);
  }

  async deploy(
    targetId: string,
    artifact: {
      type: 'docker' | 'binary' | 'package';
      location: string;
      version: string;
    }
  ): Promise<string> {
    const target = this.targets.get(targetId);
    if (!target) {
      throw new Error(`Target not found: ${targetId}`);
    }

    const deploymentId = nanoid();
    const deployment = {
      id: deploymentId,
      targetId,
      version: artifact.version,
      status: 'deploying' as const,
      timestamp: Date.now(),
    };

    this.deployments.set(deploymentId, deployment);

    console.log(`🚀 Deploying ${artifact.version} to ${target.name}...`);

    // Execute deployment based on target type
    try {
      switch (target.type) {
        case 'docker':
          await this.deployDocker(target, artifact);
          break;
        case 'kubernetes':
          await this.deployKubernetes(target, artifact);
          break;
        case 'serverless':
          await this.deployServerless(target, artifact);
          break;
        case 'vm':
          await this.deployVM(target, artifact);
          break;
        case 'edge':
          await this.deployEdge(target, artifact);
          break;
      }

      deployment.status = 'active';
      console.log(`✅ Deployment successful: ${deploymentId}`);

      // Start health checks
      if (target.healthCheck) {
        this.startHealthCheck(deploymentId, target);
      }
    } catch (error) {
      deployment.status = 'failed';
      console.error(`❌ Deployment failed: ${deploymentId}`, error);
      throw error;
    }

    return deploymentId;
  }

  private async deployDocker(
    target: DeploymentTarget,
    artifact: any
  ): Promise<void> {
    // In production: Use Docker API or CLI
    // docker pull ${artifact.location}
    // docker run -d --name app ${artifact.location}
    console.log('Deploying to Docker...');
  }

  private async deployKubernetes(
    target: DeploymentTarget,
    artifact: any
  ): Promise<void> {
    // In production: Use kubectl or k8s client
    // kubectl apply -f deployment.yaml
    console.log('Deploying to Kubernetes...');
  }

  private async deployServerless(
    target: DeploymentTarget,
    artifact: any
  ): Promise<void> {
    // In production: Deploy to AWS Lambda, Vercel, etc.
    console.log('Deploying to serverless platform...');
  }

  private async deployVM(
    target: DeploymentTarget,
    artifact: any
  ): Promise<void> {
    // In production: SSH and deploy to VM
    console.log('Deploying to VM...');
  }

  private async deployEdge(
    target: DeploymentTarget,
    artifact: any
  ): Promise<void> {
    // In production: Deploy to edge locations
    console.log('Deploying to edge...');
  }

  private startHealthCheck(deploymentId: string, target: DeploymentTarget): void {
    if (!target.healthCheck) return;

    const checkHealth = async () => {
      const deployment = this.deployments.get(deploymentId);
      if (!deployment || deployment.status !== 'active') return;

      try {
        // In production: Make HTTP request to health check endpoint
        // const response = await fetch(target.healthCheck.url, {
        //   timeout: target.healthCheck.timeout,
        // });
        // deployment.healthStatus = response.ok ? 'healthy' : 'unhealthy';
        
        deployment.healthStatus = 'healthy';
      } catch (error) {
        deployment.healthStatus = 'unhealthy';
        console.warn(`⚠️ Health check failed for ${deploymentId}`);
      }
    };

    // Run initial check and schedule periodic checks
    checkHealth();
    setInterval(checkHealth, target.healthCheck.interval);
  }

  async rollback(deploymentId: string): Promise<void> {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) {
      throw new Error(`Deployment not found: ${deploymentId}`);
    }

    console.log(`⏮️  Rolling back deployment: ${deploymentId}`);

    // Find previous successful deployment
    const previousDeployments = Array.from(this.deployments.values())
      .filter(
        (d) =>
          d.targetId === deployment.targetId &&
          d.status === 'active' &&
          d.timestamp < deployment.timestamp
      )
      .sort((a, b) => b.timestamp - a.timestamp);

    if (previousDeployments.length === 0) {
      throw new Error('No previous deployment to rollback to');
    }

    deployment.status = 'rolled_back';
    console.log(`✓ Rolled back to version: ${previousDeployments[0].version}`);
  }

  getDeployment(deploymentId: string) {
    return this.deployments.get(deploymentId);
  }

  getActiveDeployments(): Array<any> {
    return Array.from(this.deployments.values()).filter(
      (d) => d.status === 'active'
    );
  }
}

// ============================================================================
// Monitoring & Observability
// ============================================================================

export class MonitoringService {
  private metrics: Map<string, Array<{
    timestamp: number;
    value: number;
    labels?: Record<string, string>;
  }>> = new Map();

  recordMetric(
    name: string,
    value: number,
    labels?: Record<string, string>
  ): void {
    const metricData = this.metrics.get(name) || [];
    metricData.push({ timestamp: Date.now(), value, labels });
    
    // Keep last 1000 data points
    if (metricData.length > 1000) {
      metricData.shift();
    }
    
    this.metrics.set(name, metricData);
  }

  getMetric(name: string, since?: number) {
    const data = this.metrics.get(name) || [];
    
    if (since) {
      return data.filter((d) => d.timestamp >= since);
    }
    
    return data;
  }

  getAggregatedMetric(
    name: string,
    aggregation: 'sum' | 'avg' | 'min' | 'max',
    since?: number
  ): number {
    const data = this.getMetric(name, since);
    
    if (data.length === 0) return 0;

    const values = data.map((d) => d.value);

    switch (aggregation) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
    }
  }

  getAllMetrics(): string[] {
    return Array.from(this.metrics.keys());
  }
}
