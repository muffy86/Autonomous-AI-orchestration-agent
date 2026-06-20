/**
 * BabyAGI-style Task Management Agent
 * Creates, prioritizes, and executes tasks autonomously
 */

export class BabyAGI {
  private llm: any;
  private taskList: any[] = [];
  private completedTasks: any[] = [];
  private objective: string = '';

  constructor(config: any) {
    this.llm = config.llm;
  }

  async execute(task: any, context: any) {
    console.log(`🍼 BabyAGI executing: ${task.description}`);
    
    this.objective = task.description;
    
    // Initialize with first task
    this.taskList = [{ id: 1, task: this.objective }];
    
    const maxIterations = task.maxIterations || 10;
    
    for (let i = 0; i < maxIterations; i++) {
      if (this.taskList.length === 0) {
        console.log('✅ All tasks completed!');
        break;
      }
      
      // Get highest priority task
      const currentTask = this.taskList.shift()!;
      
      console.log(`  📝 Task ${currentTask.id}: ${currentTask.task}`);
      
      // Execute task
      const result = await this.executeTask(currentTask, context);
      
      // Store result
      this.completedTasks.push({
        ...currentTask,
        result,
        completed: Date.now()
      });
      
      // Create new tasks based on result
      const newTasks = await this.createNewTasks(result, currentTask);
      
      // Add new tasks
      for (const newTask of newTasks) {
        this.taskList.push({
          id: this.completedTasks.length + this.taskList.length + 1,
          task: newTask
        });
      }
      
      // Prioritize tasks
      await this.prioritizeTasks();
      
      console.log(`  ✓ Completed. ${this.taskList.length} tasks remaining.`);
    }
    
    return {
      objective: this.objective,
      completedTasks: this.completedTasks.length,
      remainingTasks: this.taskList.length,
      results: this.completedTasks,
      summary: await this.summarize()
    };
  }

  async executeTask(task: any, context: any) {
    const prompt = `You are an AI task execution agent. 

Objective: ${this.objective}

Current task: ${task.task}

Previously completed tasks:
${this.completedTasks.slice(-3).map(t => `- ${t.task}: ${t.result?.summary || 'completed'}`).join('\n')}

Execute this task and provide results.`;

    const response = await this.llm.generate({
      model: 'llama3.1:8b',
      prompt
    });
    
    return {
      summary: response.response,
      timestamp: Date.now()
    };
  }

  async createNewTasks(result: any, completedTask: any) {
    const prompt = `You are an AI task creation agent.

Objective: ${this.objective}

Completed task: ${completedTask.task}
Result: ${result.summary}

Existing incomplete tasks:
${this.taskList.map(t => `- ${t.task}`).join('\n')}

Based on the result, create new tasks needed to achieve the objective.
Only return new tasks that are not already in the task list.
Return one task per line, or empty if no new tasks needed.`;

    const response = await this.llm.generate({
      model: 'llama3.1:8b',
      prompt
    });
    
    // Parse tasks from response
    const tasks = response.response
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0 && !line.startsWith('#'))
      .map((line: string) => line.replace(/^[-*•]\s*/, ''));
    
    return tasks;
  }

  async prioritizeTasks() {
    if (this.taskList.length <= 1) return;
    
    const prompt = `You are an AI task prioritization agent.

Objective: ${this.objective}

Tasks to prioritize:
${this.taskList.map((t, i) => `${i + 1}. ${t.task}`).join('\n')}

Return the task numbers in priority order (highest priority first), one per line.
Only return numbers, nothing else.`;

    const response = await this.llm.generate({
      model: 'llama3.1:8b',
      prompt
    });
    
    // Parse priority order
    const order = response.response
      .split('\n')
      .map((line: string) => parseInt(line.trim()))
      .filter((n: number) => !isNaN(n) && n > 0 && n <= this.taskList.length);
    
    // Reorder tasks
    if (order.length === this.taskList.length) {
      const newTaskList = order.map(i => this.taskList[i - 1]);
      this.taskList = newTaskList;
    }
  }

  async summarize() {
    return `Completed ${this.completedTasks.length} tasks towards objective: ${this.objective}`;
  }
}

export default BabyAGI;
