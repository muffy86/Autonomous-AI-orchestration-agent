/**
 * Autonomous Agent OS - Complete Demo
 * Demonstrates all capabilities of the autonomous agentic operating system
 */

import {
  createFullFeaturedAgentOS,
  AutonomousAgentOS,
  ToolFactory,
  type PipelineConfig,
} from '@/lib/autonomous-agent';

// ============================================================================
// Demo 1: Quick Start
// ============================================================================

async function quickStartDemo() {
  console.log('=== Quick Start Demo ===\n');

  // Create fully-featured agent OS
  const agentOS = await createFullFeaturedAgentOS(
    process.env.PUBLIC_AI_API_KEY
  );

  // Execute a simple task
  const taskId = await agentOS.executeTask({
    type: 'analysis',
    description: 'Analyze the current market trends in AI technology',
    input: {
      sources: ['news', 'research_papers', 'social_media'],
      timeframe: '30_days',
    },
  });

  console.log(`Task submitted: ${taskId}`);

  // Check system status
  const status = agentOS.getSystemStatus();
  console.log('\nSystem Status:', JSON.stringify(status, null, 2));

  await agentOS.shutdown();
}

// ============================================================================
// Demo 2: Multi-Agent Collaboration
// ============================================================================

async function multiAgentDemo() {
  console.log('\n=== Multi-Agent Collaboration Demo ===\n');

  const agentOS = new AutonomousAgentOS({
    orchestration: {
      strategy: 'pipeline', // Execute tasks in dependency order
      enableAutoExecution: true,
    },
  });

  await agentOS.initialize();

  // Complex multi-step workflow
  const tasks = [
    {
      id: 'research',
      type: 'analysis' as const,
      description: 'Research best practices for building a DeFi protocol',
      dependencies: [],
    },
    {
      id: 'architecture',
      type: 'planning' as const,
      description: 'Design the smart contract architecture',
      dependencies: ['research'],
    },
    {
      id: 'implementation',
      type: 'execution' as const,
      description: 'Implement the smart contracts in Solidity',
      dependencies: ['architecture'],
    },
    {
      id: 'testing',
      type: 'execution' as const,
      description: 'Write comprehensive test suite',
      dependencies: ['implementation'],
    },
    {
      id: 'deployment',
      type: 'blockchain' as const,
      description: 'Deploy contracts to testnet',
      dependencies: ['testing'],
    },
  ];

  // Submit all tasks
  const taskIds: string[] = [];
  for (const task of tasks) {
    const taskId = await agentOS.orchestrator.submitTask(task);
    taskIds.push(taskId);
    console.log(`Submitted: ${task.description} (${taskId})`);
  }

  // Process the pipeline
  await agentOS.orchestrator.processQueue();

  // Check results
  console.log('\nTask Results:');
  for (const taskId of taskIds) {
    const task = await agentOS.orchestrator.getTask(taskId);
    console.log(`- ${task?.description}: ${task?.status}`);
  }

  const metrics = agentOS.orchestrator.getMetrics();
  console.log('\nOrchestrator Metrics:', metrics);

  await agentOS.shutdown();
}

// ============================================================================
// Demo 3: Blockchain Operations
// ============================================================================

async function blockchainDemo() {
  console.log('\n=== Blockchain Operations Demo ===\n');

  const agentOS = new AutonomousAgentOS({
    blockchain: {
      enabled: true,
      chains: [
        {
          network: 'ethereum',
          rpcUrl: 'https://eth.llamarpc.com',
          chainId: 1,
        },
        {
          network: 'polygon',
          rpcUrl: 'https://polygon-rpc.com',
          chainId: 137,
        },
        {
          network: 'solana',
          rpcUrl: 'https://api.mainnet-beta.solana.com',
        },
      ],
    },
  });

  await agentOS.initialize();

  // Check balances across chains
  const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'; // Example
  
  console.log('Checking balances...');
  const chains = agentOS.chainManager.getSupportedChains();
  for (const chain of chains) {
    const balance = await agentOS.chainManager.getBalance(chain, address);
    console.log(`${chain}: ${balance}`);
  }

  // DeFi operations
  if (agentOS.defiAgent) {
    console.log('\nExecuting DeFi operations...');
    
    // Swap tokens
    await agentOS.defiAgent.swap(
      'polygon',
      'USDC',
      'WMATIC',
      '1000000000', // 1000 USDC
      0.5 // 0.5% slippage
    );

    // Add liquidity
    await agentOS.defiAgent.addLiquidity(
      'polygon',
      'USDC',
      'WMATIC',
      '1000000000',
      '500000000000000000'
    );

    // Get pool info
    const poolInfo = await agentOS.defiAgent.getPoolInfo(
      'polygon',
      '0x...' // Pool address
    );
    console.log('Pool info:', poolInfo);
  }

  // NFT operations
  if (agentOS.nftAgent) {
    console.log('\nMinting NFT...');
    
    const nft = await agentOS.nftAgent.mintNFT('ethereum', '0x...', {
      name: 'Autonomous Agent NFT',
      description: 'Created by autonomous agent',
      image: 'ipfs://QmX...',
      attributes: [
        { trait_type: 'Creator', value: 'Autonomous Agent OS' },
        { trait_type: 'Rarity', value: 'Legendary' },
      ],
    });
    
    console.log('NFT minted:', nft);
  }

  await agentOS.shutdown();
}

// ============================================================================
// Demo 4: Vision & Screen Capture
// ============================================================================

async function visionDemo() {
  console.log('\n=== Vision & Screen Capture Demo ===\n');

  const agentOS = new AutonomousAgentOS({
    vision: {
      enabled: true,
      captureConfig: {
        captureInterval: 2000,
        quality: 80,
        enableOCR: true,
        enableObjectDetection: true,
      },
    },
  });

  await agentOS.initialize();

  if (agentOS.visionAgent) {
    console.log('Starting screen monitoring...');

    // Monitor for specific conditions
    await agentOS.visionAgent.startMonitoring(
      [
        'Find all visible buttons',
        'Detect any error messages',
        'Identify form input fields',
      ],
      (result) => {
        console.log('Vision Analysis:', result.query);
        console.log('Result:', result.result);
      }
    );

    // Run for 10 seconds
    await new Promise((resolve) => setTimeout(resolve, 10000));

    agentOS.visionAgent.stopMonitoring();
    console.log('Monitoring stopped');
  }

  // Screen interaction demo
  if (agentOS.screenInteraction) {
    console.log('\nExecuting screen interactions...');

    await agentOS.screenInteraction.executeSequence([
      {
        type: 'navigate',
        value: 'https://example.com',
      },
      {
        type: 'wait',
        duration: 2000,
      },
      {
        type: 'click',
        target: '#submit-button',
      },
      {
        type: 'type',
        target: '#search-input',
        value: 'autonomous agents',
      },
    ]);

    const history = agentOS.screenInteraction.getActionHistory();
    console.log('Actions executed:', history.length);
  }

  await agentOS.shutdown();
}

// ============================================================================
// Demo 5: Tool Ecosystem
// ============================================================================

async function toolsDemo() {
  console.log('\n=== Tool Ecosystem Demo ===\n');

  const agentOS = new AutonomousAgentOS({
    tools: {
      enableBuiltIn: true,
    },
  });

  await agentOS.initialize();

  // Web search
  console.log('Performing web search...');
  const searchResult = await agentOS.toolRegistry.executeTool(
    agentOS.toolRegistry.getToolByName('web_search')!.metadata.id,
    {
      query: 'autonomous agent frameworks 2026',
      limit: 5,
    }
  );
  console.log('Search results:', searchResult.result);

  // Code execution
  console.log('\nExecuting Python code...');
  const codeResult = await agentOS.toolRegistry.executeTool(
    agentOS.toolRegistry.getToolByName('code_executor')!.metadata.id,
    {
      code: `
import math
result = math.sqrt(16)
print(f"Square root of 16 is {result}")
      `,
      language: 'python',
    }
  );
  console.log('Code output:', codeResult.result);

  // API call
  console.log('\nMaking API call...');
  const apiResult = await agentOS.toolRegistry.executeTool(
    agentOS.toolRegistry.getToolByName('api_call')!.metadata.id,
    {
      url: 'https://api.publicai.co/v1/models',
      method: 'GET',
      headers: {
        'User-Agent': 'AutonomousAgentOS/1.0',
      },
    }
  );
  console.log('API response:', apiResult.result);

  // Custom tool
  console.log('\nCreating custom tool...');
  const weatherTool = ToolFactory.createCustomTool(
    'weather',
    'Get weather information',
    'api',
    [
      {
        name: 'city',
        type: 'string',
        description: 'City name',
        required: true,
      },
    ],
    async (params) => {
      // Mock weather data
      return {
        city: params.city,
        temperature: 72,
        condition: 'Sunny',
        humidity: 45,
      };
    }
  );

  agentOS.toolRegistry.registerTool(weatherTool);
  
  const weatherResult = await agentOS.toolRegistry.executeTool(
    weatherTool.metadata.id,
    { city: 'Zurich' }
  );
  console.log('Weather data:', weatherResult.result);

  // Tool metrics
  const metrics = agentOS.toolRegistry.getToolMetrics();
  console.log('\nTool Performance Metrics:');
  for (const metric of metrics) {
    console.log(`- ${metric.toolName}: ${metric.executions} executions, ${metric.successRate.toFixed(1)}% success rate`);
  }

  await agentOS.shutdown();
}

// ============================================================================
// Demo 6: CI/CD Pipeline
// ============================================================================

async function pipelineDemo() {
  console.log('\n=== CI/CD Pipeline Demo ===\n');

  const agentOS = await createFullFeaturedAgentOS();

  // Define build and deployment pipeline
  const pipeline: PipelineConfig = {
    id: 'web-app-pipeline',
    name: 'Web App Build & Deploy',
    description: 'Build and deploy a web application',
    stages: [
      {
        id: 'install',
        name: 'Install Dependencies',
        type: 'build',
        command: 'npm install',
        timeout: 300000,
        retries: 2,
      },
      {
        id: 'lint',
        name: 'Lint Code',
        type: 'validate',
        command: 'npm run lint',
        dependencies: ['install'],
        continueOnError: true,
      },
      {
        id: 'test',
        name: 'Run Tests',
        type: 'test',
        command: 'npm test',
        dependencies: ['install'],
        timeout: 600000,
      },
      {
        id: 'build',
        name: 'Build Application',
        type: 'build',
        command: 'npm run build',
        dependencies: ['test'],
        artifacts: {
          paths: ['dist/**/*', 'build/**/*'],
          retention: 7, // days
        },
      },
      {
        id: 'deploy-staging',
        name: 'Deploy to Staging',
        type: 'deploy',
        command: 'npm run deploy:staging',
        dependencies: ['build'],
        environment: {
          ENV: 'staging',
          API_URL: 'https://api.staging.example.com',
        },
      },
      {
        id: 'deploy-production',
        name: 'Deploy to Production',
        type: 'deploy',
        command: 'npm run deploy:production',
        dependencies: ['deploy-staging'],
        environment: {
          ENV: 'production',
          API_URL: 'https://api.example.com',
        },
      },
    ],
    parallel: false,
    triggers: {
      manual: true,
      onPush: true,
      webhook: true,
    },
    notifications: {
      onSuccess: ['devops@example.com'],
      onFailure: ['devops@example.com', 'team@example.com'],
    },
  };

  // Execute pipeline
  const executionId = await agentOS.executePipeline(pipeline);
  console.log(`Pipeline started: ${executionId}`);

  // Monitor execution (in production, this would poll)
  const execution = agentOS.pipelineExecutor.getExecution(executionId);
  console.log('Pipeline status:', execution?.status);

  // Register deployment targets
  agentOS.deploymentManager.registerTarget({
    id: 'k8s-production',
    name: 'Production Kubernetes Cluster',
    type: 'kubernetes',
    environment: 'production',
    config: {
      cluster: 'prod-us-east-1',
      namespace: 'default',
    },
    healthCheck: {
      url: 'https://app.example.com/health',
      interval: 30000,
      timeout: 5000,
    },
  });

  // Deploy to Kubernetes
  const deploymentId = await agentOS.deploy('k8s-production', {
    type: 'docker',
    location: 'myapp:v1.2.3',
    version: 'v1.2.3',
  });
  
  console.log(`Deployed: ${deploymentId}`);

  // Get deployment status
  const deployment = agentOS.deploymentManager.getDeployment(deploymentId);
  console.log('Deployment status:', deployment);

  await agentOS.shutdown();
}

// ============================================================================
// Demo 7: Public AI Integration
// ============================================================================

async function publicAIDemo() {
  console.log('\n=== Public AI Integration Demo ===\n');

  const agentOS = new AutonomousAgentOS({
    publicAI: {
      enabled: true,
      apiKey: process.env.PUBLIC_AI_API_KEY,
    },
  });

  await agentOS.initialize();

  // Task will be routed to Public AI agent using Apertus model
  const taskId = await agentOS.executeTask({
    type: 'analysis',
    description: 'Analyze the benefits of sovereign AI infrastructure',
    input: {
      topics: ['privacy', 'transparency', 'governance', 'compliance'],
    },
  });

  console.log(`Task submitted to Public AI agent: ${taskId}`);

  // Check which agent handled the task
  const task = await agentOS.orchestrator.getTask(taskId);
  console.log('Assigned agent:', task?.assignedAgent);

  const metrics = agentOS.orchestrator.getMetrics();
  console.log('\nAgent Performance:');
  for (const agent of metrics.agents) {
    console.log(`- ${agent.name}: ${agent.tasksExecuted} tasks, ${agent.successRate.toFixed(1)}% success`);
  }

  await agentOS.shutdown();
}

// ============================================================================
// Run All Demos
// ============================================================================

async function runAllDemos() {
  try {
    await quickStartDemo();
    await multiAgentDemo();
    await blockchainDemo();
    await visionDemo();
    await toolsDemo();
    await pipelineDemo();
    await publicAIDemo();

    console.log('\n✅ All demos completed successfully!');
  } catch (error) {
    console.error('Demo error:', error);
  }
}

// Run demos if executed directly
if (require.main === module) {
  runAllDemos().catch(console.error);
}

export {
  quickStartDemo,
  multiAgentDemo,
  blockchainDemo,
  visionDemo,
  toolsDemo,
  pipelineDemo,
  publicAIDemo,
  runAllDemos,
};
