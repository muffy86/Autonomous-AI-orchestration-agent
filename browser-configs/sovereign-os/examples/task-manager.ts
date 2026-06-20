/**
 * Example: AI-Powered Task Manager
 * Intelligent task prioritization and execution
 */

import { SovereignClient } from '../sdk/client.ts';

async function aiTaskManager() {
  console.log('✅ AI-Powered Task Manager\n');

  const client = new SovereignClient();
  await client.connect();

  // User's tasks
  const tasks = [
    'Research competitive pricing for Q2',
    'Review code for feature-auth branch',
    'Write documentation for API endpoints',
    'Update dependencies in package.json',
    'Analyze user feedback from last week',
    'Prepare presentation for stakeholder meeting'
  ];

  console.log('📋 Tasks to prioritize:\n');
  tasks.forEach((task, i) => console.log(`   ${i + 1}. ${task}`));
  console.log();

  // AI prioritization
  console.log('🤖 AI is analyzing and prioritizing...\n');

  const prioritization = await client.chat(
    `You are a task management AI. Analyze these tasks and:
1. Prioritize them (1-6, 1 being highest priority)
2. Estimate time needed (in hours)
3. Suggest dependencies between tasks
4. Recommend execution order

Tasks:
${tasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Return as JSON with: priority, timeEstimate, dependencies, executionOrder, reasoning`,
    { model: 'llama3.1:70b' }
  );

  // Parse AI response
  try {
    const analysis = JSON.parse(prioritization.response);

    console.log('📊 Analysis Results:\n');
    console.log('Priority Order:');
    analysis.executionOrder?.forEach((taskNum: number, i: number) => {
      console.log(`   ${i + 1}. ${tasks[taskNum - 1]}`);
      console.log(`      Time: ${analysis.timeEstimate?.[taskNum - 1] || 'unknown'} hours`);
    });
    console.log();

    console.log('💡 Reasoning:');
    console.log(`   ${analysis.reasoning || 'No reasoning provided'}`);
    console.log();

  } catch (error) {
    console.log('Raw AI response:');
    console.log(prioritization.response);
    console.log();
  }

  // Create automated workflow
  console.log('⚙️  Creating automated workflow...\n');

  await client.createWorkflow({
    name: 'Daily Task Execution',
    steps: [
      {
        type: 'task',
        name: 'Gather tasks',
        task: 'List all pending tasks'
      },
      {
        type: 'task',
        name: 'Prioritize',
        task: 'Use AI to prioritize tasks'
      },
      {
        type: 'task',
        name: 'Execute top priority',
        task: 'Begin work on highest priority task'
      }
    ],
    schedule: '1d'
  });

  console.log('✅ Workflow created! Tasks will be auto-prioritized daily.\n');

  client.disconnect();
}

// Run if main
if (import.meta.main) {
  aiTaskManager();
}

export { aiTaskManager };
