/**
 * Workflow Automation System
 * Schedule tasks, create triggers, and build automation workflows
 */

export class WorkflowEngine {
  private workflows: Map<string, any> = new Map();
  private triggers: Map<string, any> = new Map();
  private schedules: Map<string, any> = new Map();
  private dataLayer: any;
  private os: any;

  constructor(dataLayer: any, os: any) {
    this.dataLayer = dataLayer;
    this.os = os;
  }

  async init() {
    // Load saved workflows
    const saved = await this.dataLayer.load('workflows') || [];
    for (const workflow of saved) {
      this.workflows.set(workflow.id, workflow);
      
      // Restart active workflows
      if (workflow.active) {
        await this.startWorkflow(workflow.id);
      }
    }

    console.log(`✅ Workflow engine ready (${this.workflows.size} workflows)`);
  }

  // ===== Workflow Creation =====

  async createWorkflow(definition: any) {
    const workflow = {
      id: definition.id || this.generateId(),
      name: definition.name,
      description: definition.description,
      steps: definition.steps || [],
      triggers: definition.triggers || [],
      schedule: definition.schedule,
      active: false,
      created: Date.now(),
      lastRun: null,
      runs: 0
    };

    this.workflows.set(workflow.id, workflow);
    await this.save();

    return workflow;
  }

  async updateWorkflow(id: string, updates: any) {
    const workflow = this.workflows.get(id);
    if (!workflow) throw new Error('Workflow not found');

    Object.assign(workflow, updates);
    await this.save();

    return workflow;
  }

  async deleteWorkflow(id: string) {
    await this.stopWorkflow(id);
    this.workflows.delete(id);
    await this.save();
  }

  // ===== Workflow Execution =====

  async startWorkflow(id: string) {
    const workflow = this.workflows.get(id);
    if (!workflow) throw new Error('Workflow not found');

    workflow.active = true;

    // Setup triggers
    if (workflow.triggers && workflow.triggers.length > 0) {
      for (const trigger of workflow.triggers) {
        await this.setupTrigger(id, trigger);
      }
    }

    // Setup schedule
    if (workflow.schedule) {
      await this.setupSchedule(id, workflow.schedule);
    }

    await this.save();
  }

  async stopWorkflow(id: string) {
    const workflow = this.workflows.get(id);
    if (!workflow) throw new Error('Workflow not found');

    workflow.active = false;

    // Remove triggers
    this.triggers.delete(id);

    // Remove schedule
    const schedule = this.schedules.get(id);
    if (schedule) {
      clearInterval(schedule);
      this.schedules.delete(id);
    }

    await this.save();
  }

  async executeWorkflow(id: string, context: any = {}) {
    const workflow = this.workflows.get(id);
    if (!workflow) throw new Error('Workflow not found');

    console.log(`🔄 Executing workflow: ${workflow.name}`);

    workflow.lastRun = Date.now();
    workflow.runs++;

    const results = [];
    let workflowContext = { ...context };

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      
      console.log(`  Step ${i + 1}: ${step.name}`);

      try {
        const result = await this.executeStep(step, workflowContext);
        results.push({ step: step.name, result, success: true });
        
        // Pass output to next step
        workflowContext = { ...workflowContext, ...result };
      } catch (error: any) {
        console.error(`  Step ${i + 1} failed:`, error.message);
        results.push({ step: step.name, error: error.message, success: false });
        
        if (step.stopOnError !== false) {
          break;
        }
      }
    }

    await this.save();

    return {
      workflow: workflow.name,
      results,
      success: results.every(r => r.success),
      timestamp: Date.now()
    };
  }

  private async executeStep(step: any, context: any) {
    switch (step.type) {
      case 'task':
        return await this.os.executeTask(step.task, { context });

      case 'command':
        return await this.os.command(step.command);

      case 'search':
        return await this.os.searchWeb(step.query);

      case 'http':
        return await this.httpRequest(step);

      case 'delay':
        await new Promise(resolve => setTimeout(resolve, step.duration));
        return { delayed: step.duration };

      case 'condition':
        return await this.evaluateCondition(step, context);

      case 'script':
        return await this.executeScript(step.script, context);

      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  private async httpRequest(step: any) {
    const response = await fetch(step.url, {
      method: step.method || 'GET',
      headers: step.headers || {},
      body: step.body ? JSON.stringify(step.body) : undefined
    });

    const data = await response.json();
    return { response: data, status: response.status };
  }

  private async evaluateCondition(step: any, context: any) {
    // Simple condition evaluation
    const fn = new Function('context', `return ${step.condition}`);
    const result = fn(context);
    
    if (result && step.then) {
      return await this.executeStep(step.then, context);
    } else if (!result && step.else) {
      return await this.executeStep(step.else, context);
    }

    return { condition: result };
  }

  private async executeScript(script: string, context: any) {
    const fn = new Function('context', script);
    return fn(context);
  }

  // ===== Triggers =====

  private async setupTrigger(workflowId: string, trigger: any) {
    const triggerId = `${workflowId}:${trigger.type}`;

    if (trigger.type === 'webhook') {
      // Setup webhook endpoint
      this.triggers.set(triggerId, {
        type: 'webhook',
        path: trigger.path,
        execute: () => this.executeWorkflow(workflowId)
      });
    } else if (trigger.type === 'event') {
      // Setup event listener
      this.triggers.set(triggerId, {
        type: 'event',
        event: trigger.event,
        execute: () => this.executeWorkflow(workflowId)
      });
    } else if (trigger.type === 'watch') {
      // Setup file/URL watcher
      const watcher = setInterval(async () => {
        const changed = await this.checkForChanges(trigger);
        if (changed) {
          await this.executeWorkflow(workflowId, { trigger: 'watch', changed });
        }
      }, trigger.interval || 60000);

      this.triggers.set(triggerId, {
        type: 'watch',
        watcher,
        execute: () => this.executeWorkflow(workflowId)
      });
    }
  }

  private async checkForChanges(trigger: any) {
    // Check if watched resource changed
    // This would implement actual change detection
    return false;
  }

  async triggerWebhook(path: string, data: any) {
    for (const [id, trigger] of this.triggers) {
      if (trigger.type === 'webhook' && trigger.path === path) {
        await trigger.execute(data);
      }
    }
  }

  async triggerEvent(event: string, data: any) {
    for (const [id, trigger] of this.triggers) {
      if (trigger.type === 'event' && trigger.event === event) {
        await trigger.execute(data);
      }
    }
  }

  // ===== Scheduling =====

  private async setupSchedule(workflowId: string, schedule: any) {
    // Parse cron-like schedule or simple intervals
    let interval: number;

    if (typeof schedule === 'string') {
      // Parse cron: "*/5 * * * *" or interval: "5m", "1h", "1d"
      interval = this.parseSchedule(schedule);
    } else {
      interval = schedule.interval || 3600000; // Default 1 hour
    }

    const scheduleId = setInterval(async () => {
      await this.executeWorkflow(workflowId);
    }, interval);

    this.schedules.set(workflowId, scheduleId);
  }

  private parseSchedule(schedule: string): number {
    // Simple interval parsing
    const match = schedule.match(/^(\d+)([smhd])$/);
    if (!match) return 3600000; // Default 1 hour

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers: any = {
      s: 1000,
      m: 60000,
      h: 3600000,
      d: 86400000
    };

    return value * multipliers[unit];
  }

  // ===== Templates =====

  getWorkflowTemplates() {
    return [
      {
        id: 'daily-summary',
        name: 'Daily Summary',
        description: 'Generate a daily summary of your activity',
        steps: [
          { type: 'task', name: 'Gather data', task: 'Get my activity from knowledge graph' },
          { type: 'task', name: 'Analyze', task: 'Analyze the activity data' },
          { type: 'task', name: 'Generate summary', task: 'Create a summary report' }
        ],
        schedule: '1d'
      },
      
      {
        id: 'monitor-website',
        name: 'Monitor Website',
        description: 'Check a website for changes',
        steps: [
          { type: 'task', name: 'Scrape', task: 'Scrape the website', url: '${url}' },
          { type: 'condition', name: 'Check changes', condition: 'context.changed', then: {
            type: 'task', task: 'Send notification about changes'
          }}
        ],
        triggers: [{ type: 'watch', url: '${url}', interval: 300000 }]
      },
      
      {
        id: 'auto-research',
        name: 'Automated Research',
        description: 'Research a topic and save findings',
        steps: [
          { type: 'search', name: 'Search web', query: '${topic}' },
          { type: 'task', name: 'Analyze results', task: 'Analyze and summarize findings' },
          { type: 'task', name: 'Save to knowledge', task: 'Store in knowledge graph' }
        ]
      },
      
      {
        id: 'data-pipeline',
        name: 'Data Pipeline',
        description: 'Fetch, process, and store data',
        steps: [
          { type: 'http', name: 'Fetch data', url: '${apiUrl}', method: 'GET' },
          { type: 'task', name: 'Process', task: 'Process the fetched data' },
          { type: 'task', name: 'Store', task: 'Store processed data' }
        ],
        schedule: '1h'
      }
    ];
  }

  async createFromTemplate(templateId: string, parameters: any) {
    const template = this.getWorkflowTemplates().find(t => t.id === templateId);
    if (!template) throw new Error('Template not found');

    // Replace parameters in template
    const workflowDef = JSON.parse(
      JSON.stringify(template).replace(/\$\{(\w+)\}/g, (match, key) => {
        return parameters[key] || match;
      })
    );

    return await this.createWorkflow(workflowDef);
  }

  // ===== Utilities =====

  listWorkflows() {
    return Array.from(this.workflows.values());
  }

  getWorkflow(id: string) {
    return this.workflows.get(id);
  }

  async getWorkflowHistory(id: string) {
    // Get execution history from data layer
    return await this.dataLayer.load(`workflow:history:${id}`) || [];
  }

  private generateId() {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async save() {
    await this.dataLayer.save('workflows', Array.from(this.workflows.values()));
  }
}

export default WorkflowEngine;
