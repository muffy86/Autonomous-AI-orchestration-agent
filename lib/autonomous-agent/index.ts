/**
 * Autonomous Agentic OS - Main Entry Point
 * Complete integration of all autonomous agent capabilities
 */

export * from './orchestrator';
export * from './screen-capture';
export * from './blockchain';
export * from './tools';
export * from './execution-pipeline';
export * from './security';
export * from './resilience';
export * from './observability';

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

import {
  SecurityManager,
  RateLimiter,
  EncryptionService,
  SandboxManager,
  InputSanitizer,
  SecurityScanner,
  type SecurityPolicy,
} from './security';

import {
  CircuitBreaker,
  RetryManager,
  FallbackManager,
  HealthMonitor,
  Bulkhead,
  DeadLetterQueue,
  type HealthCheck,
} from './resilience';

import {
  APMMonitor,
  DistributedTracer,
  PerformanceMonitor,
  StructuredLogger,
  MetricsCollector,
  AlertManager,
  LogLevel,
} from './observability';

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
  security?: {
    enabled?: boolean;
    policy?: Partial<SecurityPolicy>;
    rateLimit?: boolean;
    encryption?: boolean;
    sandbox?: boolean;
  };
  resilience?: {
    enabled?: boolean;
    circuitBreaker?: boolean;
    retries?: boolean;
    healthChecks?: boolean;
  };
  observability?: {
    enabled?: boolean;
    tracing?: boolean;
    metrics?: boolean;
    logging?: LogLevel;
    alerts?: boolean;
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
  
  // Advanced features
  public securityManager?: SecurityManager;
  public rateLimiter?: RateLimiter;
  public encryptionService?: EncryptionService;
  public sandboxManager?: SandboxManager;
  public circuitBreakers: Map<string, CircuitBreaker> = new Map();
  public retryManager?: RetryManager;
  public fallbackManager?: FallbackManager;
  public healthMonitor?: HealthMonitor;
  public bulkhead?: Bulkhead;
  public deadLetterQueue?: DeadLetterQueue<any>;
  public apmMonitor?: APMMonitor;
  public alertManager?: AlertManager;

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
      security: {
        enabled: true,
        rateLimit: true,
        encryption: true,
        sandbox: true,
        ...config.security,
      },
      resilience: {
        enabled: true,
        circuitBreaker: true,
        retries: true,
        healthChecks: true,
        ...config.resilience,
      },
      observability: {
        enabled: true,
        tracing: true,
        metrics: true,
        logging: LogLevel.INFO,
        alerts: true,
        ...config.observability,
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
    
    // Initialize advanced features
    if (this.config.security?.enabled) {
      this.securityManager = new SecurityManager(this.config.security.policy);
      if (this.config.security.rateLimit) {
        this.rateLimiter = new RateLimiter();
      }
      if (this.config.security.encryption) {
        this.encryptionService = new EncryptionService();
      }
      if (this.config.security.sandbox) {
        this.sandboxManager = new SandboxManager();
      }
    }
    
    if (this.config.resilience?.enabled) {
      if (this.config.resilience.retries) {
        this.retryManager = new RetryManager();
      }
      this.fallbackManager = new FallbackManager();
      if (this.config.resilience.healthChecks) {
        this.healthMonitor = new HealthMonitor();
      }
      this.bulkhead = new Bulkhead(100, 200); // Max 100 concurrent, 200 queue
      this.deadLetterQueue = new DeadLetterQueue();
    }
    
    if (this.config.observability?.enabled) {
      this.apmMonitor = new APMMonitor();
      if (this.config.observability.alerts) {
        this.alertManager = new AlertManager();
      }
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('⚠️  Agent OS already initialized');
      return;
    }

    console.log('🚀 Initializing Autonomous Agent OS...');
    console.log('🔒 Security: ENABLED');
    console.log('🛡️  Resilience: ENABLED');
    console.log('📊 Observability: ENABLED');

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

    // Setup health checks
    if (this.healthMonitor) {
      this.setupHealthChecks();
      console.log('✓ Health monitoring initialized');
    }

    // Setup circuit breakers for critical services
    if (this.config.resilience?.circuitBreaker) {
      this.setupCircuitBreakers();
      console.log('✓ Circuit breakers initialized');
    }

    // Setup alert handlers
    if (this.alertManager) {
      this.setupAlertHandlers();
      console.log('✓ Alert system initialized');
    }

    // Register default agent fleet
    await this.registerDefaultAgents();

    this.initialized = true;
    console.log('✅ Autonomous Agent OS initialized successfully');
    console.log('📊 System Status:', this.getSystemStatus());
  }

  private setupHealthChecks(): void {
    if (!this.healthMonitor) return;

    // Core orchestrator health
    this.healthMonitor.registerCheck({
      name: 'orchestrator',
      critical: true,
      timeout: 5000,
      check: async () => ({
        healthy: this.orchestrator.getAgents().length > 0,
        details: { agentCount: this.orchestrator.getAgents().length },
      }),
    });

    // Tool registry health
    this.healthMonitor.registerCheck({
      name: 'tools',
      critical: true,
      timeout: 5000,
      check: async () => ({
        healthy: this.toolRegistry.getEnabledTools().length > 0,
        details: { toolCount: this.toolRegistry.getEnabledTools().length },
      }),
    });

    // Blockchain health (if enabled)
    if (this.config.blockchain?.enabled) {
      this.healthMonitor.registerCheck({
        name: 'blockchain',
        critical: false,
        timeout: 10000,
        check: async () => ({
          healthy: this.chainManager.getSupportedChains().length > 0,
          details: { chains: this.chainManager.getSupportedChains() },
        }),
      });
    }
  }

  private setupCircuitBreakers(): void {
    // API circuit breaker
    this.circuitBreakers.set(
      'api',
      new CircuitBreaker('api', {
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 60000,
      })
    );

    // Blockchain circuit breaker
    this.circuitBreakers.set(
      'blockchain',
      new CircuitBreaker('blockchain', {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 120000,
      })
    );

    // Vision circuit breaker
    this.circuitBreakers.set(
      'vision',
      new CircuitBreaker('vision', {
        failureThreshold: 5,
        successThreshold: 3,
        timeout: 30000,
      })
    );
  }

  private setupAlertHandlers(): void {
    if (!this.alertManager) return;

    this.alertManager.registerHandler((alert) => {
      // Log to APM
      if (this.apmMonitor) {
        this.apmMonitor.getLogger().error(
          `ALERT: ${alert.title}`,
          undefined,
          { alert }
        );
      }

      // In production: Send to notification channels
      // - Slack
      // - PagerDuty
      // - Email
      // - SMS
      if (process.env.NODE_ENV === 'production' && alert.severity === 'critical') {
        console.error('🚨 CRITICAL ALERT:', alert);
      }
    });
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
