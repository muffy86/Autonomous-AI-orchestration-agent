/**
 * Webhook Handler for CI/CD and External Integrations
 * Handles webhooks from GitHub, GitLab, Vercel, and custom services
 */

import express, { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { AgentOrchestrator } from "./agent-orchestrator";

interface WebhookConfig {
  port: number;
  secret: string;
  endpoints: WebhookEndpoint[];
}

interface WebhookEndpoint {
  path: string;
  provider: "github" | "gitlab" | "vercel" | "custom";
  events: string[];
  handler: (payload: any) => Promise<void>;
}

class WebhookHandler {
  private app: express.Application;
  private orchestrator: AgentOrchestrator;
  private config: WebhookConfig;

  constructor(orchestrator: AgentOrchestrator, config: WebhookConfig) {
    this.app = express();
    this.orchestrator = orchestrator;
    this.config = config;
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes() {
    // Health check
    this.app.get("/health", (req: Request, res: Response) => {
      res.json({ status: "healthy", timestamp: new Date().toISOString() });
    });

    // GitHub webhooks
    this.app.post("/webhooks/github", async (req: Request, res: Response) => {
      if (!this.verifyGitHubSignature(req)) {
        return res.status(401).json({ error: "Invalid signature" });
      }

      const event = req.headers["x-github-event"] as string;
      await this.handleGitHubEvent(event, req.body);
      res.status(200).json({ received: true });
    });

    // GitLab webhooks
    this.app.post("/webhooks/gitlab", async (req: Request, res: Response) => {
      const token = req.headers["x-gitlab-token"];
      if (token !== this.config.secret) {
        return res.status(401).json({ error: "Invalid token" });
      }

      const event = req.headers["x-gitlab-event"] as string;
      await this.handleGitLabEvent(event, req.body);
      res.status(200).json({ received: true });
    });

    // Vercel webhooks
    this.app.post("/webhooks/vercel", async (req: Request, res: Response) => {
      await this.handleVercelEvent(req.body);
      res.status(200).json({ received: true });
    });

    // Custom webhooks
    this.app.post("/webhooks/custom/:id", async (req: Request, res: Response) => {
      const { id } = req.params;
      await this.handleCustomEvent(id, req.body);
      res.status(200).json({ received: true });
    });

    // Orchestrator status
    this.app.get("/status/agents", (req: Request, res: Response) => {
      const agents = this.orchestrator.getAgentStatus();
      res.json(agents);
    });

    this.app.get("/status/tasks/:taskId", (req: Request, res: Response) => {
      try {
        const task = this.orchestrator.getTaskStatus(req.params.taskId);
        res.json(task);
      } catch (error) {
        res.status(404).json({ error: "Task not found" });
      }
    });
  }

  private verifyGitHubSignature(req: Request): boolean {
    const signature = req.headers["x-hub-signature-256"] as string;
    if (!signature) return false;

    const hmac = crypto.createHmac("sha256", this.config.secret);
    const digest = `sha256=${hmac.update(JSON.stringify(req.body)).digest("hex")}`;

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  }

  private async handleGitHubEvent(event: string, payload: any): Promise<void> {
    console.log(`Handling GitHub event: ${event}`);

    switch (event) {
      case "push":
        await this.handlePushEvent(payload);
        break;
      case "pull_request":
        await this.handlePullRequestEvent(payload);
        break;
      case "issues":
        await this.handleIssueEvent(payload);
        break;
      case "workflow_run":
        await this.handleWorkflowRunEvent(payload);
        break;
      default:
        console.log(`Unhandled GitHub event: ${event}`);
    }
  }

  private async handlePushEvent(payload: any): Promise<void> {
    const { ref, commits, repository } = payload;
    const branch = ref.replace("refs/heads/", "");

    console.log(`Push to ${branch} with ${commits.length} commits`);

    // Trigger automated workflow
    await this.orchestrator.createWorkflow("ci-pipeline", [
      {
        id: "lint",
        name: "Lint Code",
        agent: "code-analyst",
        action: "static-analysis",
        input: { files: commits.flatMap((c: any) => c.modified) },
      },
      {
        id: "test",
        name: "Run Tests",
        agent: "test-engineer",
        action: "unit-tests",
        input: {},
      },
      {
        id: "build",
        name: "Build Project",
        agent: "build-specialist",
        action: "compile",
        input: {},
      },
      {
        id: "deploy",
        name: "Deploy Preview",
        agent: "deploy-manager",
        action: "preview-deploy",
        input: { branch },
        condition: (ctx) => ctx.test?.passed === true,
      },
    ]);
  }

  private async handlePullRequestEvent(payload: any): Promise<void> {
    const { action, pull_request } = payload;

    if (action === "opened" || action === "synchronize") {
      // Trigger PR review workflow
      await this.orchestrator.createWorkflow("pr-review", [
        {
          id: "review",
          name: "Code Review",
          agent: "code-analyst",
          action: "code-review",
          input: { files: pull_request.changed_files },
        },
        {
          id: "security",
          name: "Security Scan",
          agent: "code-analyst",
          action: "security-scan",
          input: {},
        },
        {
          id: "test",
          name: "Run Tests",
          agent: "test-engineer",
          action: "e2e-tests",
          input: {},
        },
      ]);
    }
  }

  private async handleIssueEvent(payload: any): Promise<void> {
    const { action, issue } = payload;

    if (action === "opened") {
      // Auto-label issues
      if (issue.title.toLowerCase().includes("bug")) {
        console.log("Bug issue detected, would auto-label");
      }
    }
  }

  private async handleWorkflowRunEvent(payload: any): Promise<void> {
    const { action, workflow_run } = payload;

    if (action === "completed" && workflow_run.conclusion === "failure") {
      console.log("Workflow failed, triggering analysis");
      await this.orchestrator.submitTask("code-review", {
        context: "workflow failure",
        workflow: workflow_run.name,
      });
    }
  }

  private async handleGitLabEvent(event: string, payload: any): Promise<void> {
    console.log(`Handling GitLab event: ${event}`);
    // Similar to GitHub handling
  }

  private async handleVercelEvent(payload: any): Promise<void> {
    const { type, deployment } = payload;

    if (type === "deployment.created") {
      console.log(`Deployment created: ${deployment.url}`);
    } else if (type === "deployment.succeeded") {
      console.log(`Deployment succeeded: ${deployment.url}`);
    } else if (type === "deployment.failed") {
      console.log(`Deployment failed: ${deployment.url}`);
      await this.orchestrator.submitTask("code-review", {
        context: "deployment failure",
      });
    }
  }

  private async handleCustomEvent(id: string, payload: any): Promise<void> {
    console.log(`Handling custom event: ${id}`, payload);
    // Custom event handling logic
  }

  public start(): void {
    this.app.listen(this.config.port, () => {
      console.log(`Webhook handler listening on port ${this.config.port}`);
    });
  }
}

export { WebhookHandler, WebhookConfig, WebhookEndpoint };
