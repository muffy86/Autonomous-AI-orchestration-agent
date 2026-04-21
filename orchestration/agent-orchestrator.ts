/**
 * Autonomous Agent Orchestrator
 * Manages multiple AI agents for different tasks with coordination and state management
 */

import { EventEmitter } from "events";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, mkdir } from "fs/promises";
import { join } from "path";

const execAsync = promisify(exec);

interface Agent {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
  status: "idle" | "busy" | "error";
  currentTask?: Task;
}

interface Task {
  id: string;
  type: string;
  priority: number;
  payload: any;
  assignedAgent?: string;
  status: "pending" | "in-progress" | "completed" | "failed";
  result?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

interface WorkflowStep {
  id: string;
  name: string;
  agent: string;
  action: string;
  input: any;
  condition?: (context: any) => boolean;
  onSuccess?: string;
  onFailure?: string;
}

interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  context: any;
  currentStep: number;
  status: "pending" | "running" | "completed" | "failed";
}

class AgentOrchestrator extends EventEmitter {
  private agents: Map<string, Agent> = new Map();
  private tasks: Map<string, Task> = new Map();
  private workflows: Map<string, Workflow> = new Map();
  private taskQueue: Task[] = [];
  private workspaceRoot: string;

  constructor(workspaceRoot: string = process.cwd()) {
    super();
    this.workspaceRoot = workspaceRoot;
    this.initializeAgents();
    this.startTaskProcessor();
  }

  private initializeAgents() {
    const agents: Agent[] = [
      {
        id: "code-analyst",
        name: "Code Analyst",
        role: "analyze",
        capabilities: ["code-review", "static-analysis", "security-scan", "performance-analysis"],
        status: "idle",
      },
      {
        id: "test-engineer",
        name: "Test Engineer",
        role: "test",
        capabilities: ["unit-tests", "integration-tests", "e2e-tests", "coverage-analysis"],
        status: "idle",
      },
      {
        id: "build-specialist",
        name: "Build Specialist",
        role: "build",
        capabilities: ["compile", "bundle", "optimize", "artifact-generation"],
        status: "idle",
      },
      {
        id: "deploy-manager",
        name: "Deploy Manager",
        role: "deploy",
        capabilities: ["preview-deploy", "production-deploy", "rollback", "health-check"],
        status: "idle",
      },
      {
        id: "documentation-writer",
        name: "Documentation Writer",
        role: "document",
        capabilities: ["api-docs", "readme", "changelog", "code-comments"],
        status: "idle",
      },
      {
        id: "refactor-expert",
        name: "Refactor Expert",
        role: "refactor",
        capabilities: ["code-cleanup", "optimization", "modernization", "pattern-application"],
        status: "idle",
      },
      {
        id: "monitoring-agent",
        name: "Monitoring Agent",
        role: "monitor",
        capabilities: ["log-analysis", "performance-tracking", "error-detection", "alerting"],
        status: "idle",
      },
    ];

    agents.forEach((agent) => this.agents.set(agent.id, agent));
  }

  private startTaskProcessor() {
    setInterval(() => {
      this.processTaskQueue();
    }, 1000);
  }

  private async processTaskQueue() {
    if (this.taskQueue.length === 0) return;

    const task = this.taskQueue.shift();
    if (!task) return;

    const agent = this.findAvailableAgent(task.type);
    if (!agent) {
      this.taskQueue.unshift(task);
      return;
    }

    await this.executeTask(task, agent);
  }

  private findAvailableAgent(taskType: string): Agent | undefined {
    for (const agent of this.agents.values()) {
      if (agent.status === "idle" && agent.capabilities.includes(taskType)) {
        return agent;
      }
    }
    return undefined;
  }

  private async executeTask(task: Task, agent: Agent): Promise<void> {
    agent.status = "busy";
    agent.currentTask = task;
    task.status = "in-progress";
    task.assignedAgent = agent.id;

    this.emit("task:started", { task, agent });

    try {
      const result = await this.performTask(task, agent);
      task.status = "completed";
      task.result = result;
      task.completedAt = new Date();
      this.emit("task:completed", { task, agent, result });
    } catch (error) {
      task.status = "failed";
      task.error = error instanceof Error ? error.message : String(error);
      task.completedAt = new Date();
      this.emit("task:failed", { task, agent, error });
    } finally {
      agent.status = "idle";
      agent.currentTask = undefined;
    }
  }

  private async performTask(task: Task, agent: Agent): Promise<any> {
    switch (task.type) {
      case "code-review":
        return await this.performCodeReview(task.payload);
      case "unit-tests":
        return await this.runTests("unit", task.payload);
      case "integration-tests":
        return await this.runTests("integration", task.payload);
      case "e2e-tests":
        return await this.runTests("e2e", task.payload);
      case "compile":
        return await this.buildProject(task.payload);
      case "preview-deploy":
        return await this.deployPreview(task.payload);
      case "static-analysis":
        return await this.runStaticAnalysis(task.payload);
      case "security-scan":
        return await this.runSecurityScan(task.payload);
      case "api-docs":
        return await this.generateDocs(task.payload);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  private async performCodeReview(payload: any): Promise<any> {
    const { files } = payload;
    const results = [];

    for (const file of files) {
      const { stdout } = await execAsync(`npx biome check ${file}`, {
        cwd: this.workspaceRoot,
      });
      results.push({ file, output: stdout });
    }

    return results;
  }

  private async runTests(type: string, payload: any): Promise<any> {
    const command =
      type === "unit"
        ? "pnpm test:unit"
        : type === "integration"
          ? "pnpm test:integration"
          : "pnpm test";

    const { stdout, stderr } = await execAsync(command, {
      cwd: this.workspaceRoot,
    });

    return { stdout, stderr, passed: !stderr.includes("failed") };
  }

  private async buildProject(payload: any): Promise<any> {
    const { stdout } = await execAsync("pnpm build", {
      cwd: this.workspaceRoot,
    });
    return { output: stdout };
  }

  private async deployPreview(payload: any): Promise<any> {
    const { stdout } = await execAsync("vercel deploy --yes", {
      cwd: this.workspaceRoot,
    });
    return { deploymentUrl: stdout.trim() };
  }

  private async runStaticAnalysis(payload: any): Promise<any> {
    const { stdout } = await execAsync("npx biome check .", {
      cwd: this.workspaceRoot,
    });
    return { analysis: stdout };
  }

  private async runSecurityScan(payload: any): Promise<any> {
    const { stdout } = await execAsync("pnpm security:audit", {
      cwd: this.workspaceRoot,
    });
    return { vulnerabilities: stdout };
  }

  private async generateDocs(payload: any): Promise<any> {
    return { message: "Documentation generation not implemented" };
  }

  // Public API
  public async submitTask(type: string, payload: any, priority: number = 5): Promise<string> {
    const task: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      priority,
      payload,
      status: "pending",
      createdAt: new Date(),
    };

    this.tasks.set(task.id, task);
    this.taskQueue.push(task);
    this.taskQueue.sort((a, b) => b.priority - a.priority);

    this.emit("task:submitted", task);
    return task.id;
  }

  public async createWorkflow(name: string, steps: WorkflowStep[]): Promise<string> {
    const workflow: Workflow = {
      id: `workflow-${Date.now()}`,
      name,
      steps,
      context: {},
      currentStep: 0,
      status: "pending",
    };

    this.workflows.set(workflow.id, workflow);
    await this.executeWorkflow(workflow.id);
    return workflow.id;
  }

  private async executeWorkflow(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) throw new Error(`Workflow not found: ${workflowId}`);

    workflow.status = "running";

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      workflow.currentStep = i;

      if (step.condition && !step.condition(workflow.context)) {
        continue;
      }

      const taskId = await this.submitTask(step.action, step.input, 10);
      const task = this.tasks.get(taskId);

      if (!task) continue;

      await new Promise<void>((resolve) => {
        const checkTask = setInterval(() => {
          if (task.status === "completed" || task.status === "failed") {
            clearInterval(checkTask);
            if (task.status === "completed") {
              workflow.context[step.id] = task.result;
              resolve();
            } else {
              workflow.status = "failed";
              resolve();
            }
          }
        }, 500);
      });

      if (workflow.status === "failed") break;
    }

    if (workflow.status !== "failed") {
      workflow.status = "completed";
    }

    this.emit("workflow:completed", workflow);
  }

  public getAgentStatus(agentId?: string): Agent | Agent[] {
    if (agentId) {
      const agent = this.agents.get(agentId);
      if (!agent) throw new Error(`Agent not found: ${agentId}`);
      return agent;
    }
    return Array.from(this.agents.values());
  }

  public getTaskStatus(taskId: string): Task {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);
    return task;
  }

  public getWorkflowStatus(workflowId: string): Workflow {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) throw new Error(`Workflow not found: ${workflowId}`);
    return workflow;
  }

  public async saveState(filepath: string): Promise<void> {
    const state = {
      agents: Array.from(this.agents.entries()),
      tasks: Array.from(this.tasks.entries()),
      workflows: Array.from(this.workflows.entries()),
      timestamp: new Date().toISOString(),
    };

    await writeFile(filepath, JSON.stringify(state, null, 2));
  }

  public async loadState(filepath: string): Promise<void> {
    const content = await readFile(filepath, "utf-8");
    const state = JSON.parse(content);

    this.agents = new Map(state.agents);
    this.tasks = new Map(state.tasks);
    this.workflows = new Map(state.workflows);
  }
}

export { AgentOrchestrator, Agent, Task, Workflow, WorkflowStep };
