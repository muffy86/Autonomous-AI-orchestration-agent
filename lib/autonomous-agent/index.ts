/**
 * Autonomous Agentic OS - Main Entry Point
 * Complete integration of all autonomous agent capabilities
 */

export * from './orchestrator';
export * from './screen-capture';
export * from './blockchain';
export * from './tools';
export * from './execution-pipeline';

import {
  AgentOrchestrator,
  createReasoningAgent,
  createVisionAgent,
  createCodingAgent,
  createBlockchainAgent,
  createPublicAIAgent,
  type OrchestrationStrategy,
} from './orchestrator';

import {
  ScreenCaptureService,
  VisionProcessingAgent,
  ScreenInteractionAgent,
  type ScreenCaptureConfig,
} from './screen-capture';

import {
  MultiChainManager,
  SmartContractAgent,
  CrossChainBridgeAgent,
  DeFiAgent,
  NFTAgent,
  type ChainConfig,
  type BlockchainNetwork,
} from './blockchain';

import {
  ToolRegistry,
  ToolFactory,
  type BaseTool,
} from './tools';

import {
  PipelineExecutor,
  DeploymentManager,
  MonitoringService,
  type PipelineConfig,
  type DeploymentTarget,
} from './execution-pipeline';

// ============================================================================
// Autonomous Agent OS - Complete System
// ============================================================================

export interface AgentOSConfig {
  orchestration?: {
    strategy?: OrchestrationStrategy;
    enableAutoExecution?: boolean;
  };
  vision?: {
    enabled?: boolean;
    captureConfig?: Partial<ScreenCaptureConfig>;
  };
  blockchain?: {
    enabled?: boolean;
    chains?: ChainConfig[];
  };
  tools?: {
    enableBuiltIn?: boolean;
    customTools?: BaseTool[];
  };
  pipeline?: {
    enabled?: boolean;
  };
  publicAI?: {
    enabled?: boolean;
    apiKey?: string;
  };
}

export class AutonomousAgentOS {
  public orchestrator: AgentOrchestrator;
  public chainManager: MultiChainManager;
  public toolRegistry: ToolRegistry;
  public pipelineExecutor: PipelineExecutor;
  public deploymentManager: DeploymentManager;
  public monitoringService: MonitoringService;
  public visionAgent?: VisionProcessingAgent;
  public screenInteraction?: ScreenInteractionAgent;
  public smartContractAgent?: SmartContractAgent;
  public defiAgent?: DeFiAgent;
  public nftAgent?: NFTAgent;
  public bridgeAgent?: CrossChainBridgeAgent;

  private config: AgentOSConfig;
  private initialized = false;

  constructor(config: AgentOSConfig = {}) {
    this.config = {
      orchestration: {
        strategy: 'autonomous',
        enableAutoExecution: true,
        ...config.orchestration,
      },
      vision: {
        enabled: true,
        ...config.vision,
      },
      blockchain: {
        enabled: true,
        chains: [],
        ...config.blockchain,
      },
      tools: {
        enableBuiltIn: true,
        customTools: [],
        ...config.tools,
      },
      pipeline: {
        enabled: true,
        ...config.pipeline,
      },
      publicAI: {
        enabled: false,
        ...config.publicAI,
      },
    };

    // Initialize core components
    this.orchestrator = new AgentOrchestrator(
      this.config.orchestration?.strategy
    );
    this.chainManager = new MultiChainManager();
    this.toolRegistry = this.config.tools?.enableBuiltIn
      ? ToolFactory.createStandardToolset()
      : new ToolRegistry();
    this.pipelineExecutor = new PipelineExecutor();
    this.deploymentManager = new DeploymentManager();
    this.monitoringService = new MonitoringService();
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('⚠️  Agent OS already initialized');
      return;
    }

    console.log('🚀 Initializing Autonomous Agent OS...');

    // Initialize vision capabilities
    if (this.config.vision?.enabled) {
      this.visionAgent = new VisionProcessingAgent(
        this.config.vision.captureConfig
      );
      this.screenInteraction = new ScreenInteractionAgent(
        this.config.vision.captureConfig
      );
      console.log('✓ Vision system initialized');
    }

    // Initialize blockchain agents
    if (this.config.blockchain?.enabled) {
      // Add configured chains
      if (this.config.blockchain.chains) {
        for (const chainConfig of this.config.blockchain.chains) {
          await this.chainManager.addChain(chainConfig);
        }
      }

      this.smartContractAgent = new SmartContractAgent(this.chainManager);
      this.defiAgent = new DeFiAgent(this.chainManager);
      this.nftAgent = new NFTAgent(this.chainManager);
      this.bridgeAgent = new CrossChainBridgeAgent(this.chainManager);
      
      console.log('✓ Blockchain agents initialized');
    }

    // Register custom tools
    if (this.config.tools?.customTools) {
      for (const tool of this.config.tools.customTools) {
        this.toolRegistry.registerTool(tool);
      }
    }

    // Register default agent fleet
    await this.registerDefaultAgents();

    this.initialized = true;
    console.log('✅ Autonomous Agent OS initialized successfully');
    console.log('📊 System Status:', this.getSystemStatus());
  }

  private async registerDefaultAgents(): Promise<void> {
    // Register reasoning agent
    const reasoningAgent = createReasoningAgent({
      priority: 8,
      autonomous: true,
    });
    this.orchestrator.registerAgent(reasoningAgent);

    // Register vision agent
    const visionAgent = createVisionAgent({
      priority: 7,
      autonomous: true,
    });
    this.orchestrator.registerAgent(visionAgent);

    // Register coding agent
    const codingAgent = createCodingAgent({
      priority: 9,
      autonomous: true,
    });
    this.orchestrator.registerAgent(codingAgent);

    // Register blockchain agent
    if (this.config.blockchain?.enabled) {
      const blockchainAgent = createBlockchainAgent({
        priority: 7,
        autonomous: true,
      });
      this.orchestrator.registerAgent(blockchainAgent);
    }

    // Register Public AI agent if enabled
    if (this.config.publicAI?.enabled) {
      const publicAIAgent = createPublicAIAgent({
        priority: 6,
        autonomous: true,
      });
      this.orchestrator.registerAgent(publicAIAgent);
      console.log('✓ Public AI agent registered (Apertus model)');
    }

    console.log(
      `✓ Registered ${this.orchestrator.getAgents().length} autonomous agents`
    );
  }

  async executeTask(taskData: {
    type: 'analysis' | 'execution' | 'planning' | 'vision' | 'blockchain';
    description: string;
    input?: any;
    dependencies?: string[];
  }): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    const taskId = await this.orchestrator.submitTask(taskData);
    
    this.monitoringService.recordMetric('tasks_submitted', 1, {
      type: taskData.type,
    });

    return taskId;
  }

  async executePipeline(pipeline: PipelineConfig): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    const execution = await this.pipelineExecutor.execute(pipeline);
    
    this.monitoringService.recordMetric('pipelines_executed', 1, {
      pipelineId: pipeline.id,
    });

    return execution.id;
  }

  async deploy(
    targetId: string,
    artifact: {
      type: 'docker' | 'binary' | 'package';
      location: string;
      version: string;
    }
  ): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    const deploymentId = await this.deploymentManager.deploy(targetId, artifact);
    
    this.monitoringService.recordMetric('deployments', 1, {
      targetId,
      version: artifact.version,
    });

    return deploymentId;
  }

  getSystemStatus() {
    return {
      initialized: this.initialized,
      orchestration: this.orchestrator.getMetrics(),
      tools: {
        total: this.toolRegistry.getAllTools().length,
        enabled: this.toolRegistry.getEnabledTools().length,
        metrics: this.toolRegistry.getToolMetrics(),
      },
      blockchain: this.config.blockchain?.enabled
        ? {
            chains: this.chainManager.getSupportedChains(),
            transactions: this.chainManager.getTransactionHistory().length,
          }
        : undefined,
      vision: this.config.vision?.enabled
        ? {
            enabled: true,
            captureActive: false, // Would check actual status
          }
        : undefined,
      executions: {
        running: this.pipelineExecutor.getRunningExecutions().length,
        total: this.pipelineExecutor.getExecutions().length,
      },
      deployments: {
        active: this.deploymentManager.getActiveDeployments().length,
      },
    };
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Autonomous Agent OS...');

    // Stop vision capture if running
    if (this.visionAgent) {
      this.visionAgent.stopMonitoring();
    }

    // Disconnect blockchain providers
    const chains = this.chainManager.getSupportedChains();
    for (const chain of chains) {
      await this.chainManager.removeChain(chain);
    }

    this.initialized = false;
    console.log('✅ Agent OS shutdown complete');
  }
}

// ============================================================================
// Quick Start Factory
// ============================================================================

export async function createAgentOS(config?: AgentOSConfig): Promise<AutonomousAgentOS> {
  const os = new AutonomousAgentOS(config);
  await os.initialize();
  return os;
}

export async function createFullFeaturedAgentOS(
  publicAIKey?: string
): Promise<AutonomousAgentOS> {
  const os = new AutonomousAgentOS({
    orchestration: {
      strategy: 'autonomous',
      enableAutoExecution: true,
    },
    vision: {
      enabled: true,
      captureConfig: {
        captureInterval: 1000,
        enableOCR: true,
        enableObjectDetection: true,
      },
    },
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
      ],
    },
    tools: {
      enableBuiltIn: true,
    },
    pipeline: {
      enabled: true,
    },
    publicAI: {
      enabled: !!publicAIKey,
      apiKey: publicAIKey,
    },
  });

  await os.initialize();
  return os;
}

// ============================================================================
// Default Export
// ============================================================================

export default AutonomousAgentOS;
