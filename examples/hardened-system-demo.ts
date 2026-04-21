/**
 * Hardened Autonomous Agent System - Advanced Features Demo
 * Security, Resilience, Observability, and Production-Grade Features
 */

import {
  AutonomousAgentOS,
  CircuitBreaker,
  RetryManager,
  SecurityManager,
  RateLimiter,
  InputSanitizer,
  SecurityScanner,
  HealthMonitor,
  APMMonitor,
  LogLevel,
} from '@/lib/autonomous-agent';

// ============================================================================
// Demo 1: Security Features
// ============================================================================

async function securityDemo() {
  console.log('=== Security & Hardening Demo ===\n');

  const agentOS = new AutonomousAgentOS({
    security: {
      enabled: true,
      rateLimit: true,
      encryption: true,
      sandbox: true,
      policy: {
        maxConcurrentTasks: 50,
        maxTaskDuration: 600000, // 10 minutes
        allowedOperations: ['*'],
        deniedOperations: ['system.delete_all', 'admin.bypass'],
        requireApproval: ['blockchain.deploy_contract', 'system.admin'],
        sandboxEnabled: true,
        auditLogging: true,
      },
    },
  });

  await agentOS.initialize();

  // Test authorization
  if (agentOS.securityManager) {
    console.log('\n1. Testing Authorization...');
    
    const allowed = await agentOS.securityManager.authorize(
      'task.execute',
      'task-123',
      'user-alice'
    );
    console.log('Allowed operation:', allowed);

    const denied = await agentOS.securityManager.authorize(
      'system.delete_all',
      'system',
      'user-bob'
    );
    console.log('Denied operation:', denied);

    const needsApproval = await agentOS.securityManager.authorize(
      'blockchain.deploy_contract',
      'contract-xyz',
      'user-charlie'
    );
    console.log('Needs approval:', needsApproval);
  }

  // Test rate limiting
  if (agentOS.rateLimiter) {
    console.log('\n2. Testing Rate Limiting...');
    
    for (let i = 0; i < 5; i++) {
      const result = await agentOS.rateLimiter.checkLimit('user-123');
      console.log(`Request ${i + 1}:`, result.allowed, `(${result.remaining} remaining)`);
    }
  }

  // Test input sanitization
  console.log('\n3. Testing Input Sanitization...');
  const maliciousInput = "<script>alert('xss')</script>; DROP TABLE users;";
  console.log('Original:', maliciousInput);
  console.log('Sanitized HTML:', InputSanitizer.sanitizeHTML(maliciousInput));
  console.log('Sanitized SQL:', InputSanitizer.sanitizeSQL(maliciousInput));

  // Test security scanning
  console.log('\n4. Testing Security Scanner...');
  const codeWithSecrets = `
    const apiKey = "AKIA1234567890ABCDEF";
    const token = "ghp_1234567890abcdefghijklmnopqrstuvwxyz";
  `;
  const secretScan = SecurityScanner.scanForSecrets(codeWithSecrets);
  console.log('Secrets found:', secretScan.found);
  console.log('Detected:', secretScan.secrets);

  const unsafeCode = `
    eval(userInput);
    execute("SELECT * FROM users WHERE id = " + userId);
  `;
  const vulnScan = SecurityScanner.scanForVulnerabilities(unsafeCode, 'javascript');
  console.log('Code safe:', vulnScan.safe);
  console.log('Vulnerabilities:', vulnScan.vulnerabilities);

  // Test sandboxed execution
  if (agentOS.sandboxManager) {
    console.log('\n5. Testing Sandboxed Execution...');
    
    const sandboxId = await agentOS.sandboxManager.createSandbox({
      maxMemory: 256,
      maxCPU: 0.5,
      maxDuration: 30000,
    });

    const result = await agentOS.sandboxManager.executeSandboxed(
      sandboxId,
      'print("Hello from sandbox")',
      'python'
    );
    console.log('Sandbox result:', result);

    await agentOS.sandboxManager.destroySandbox(sandboxId);
  }

  // View audit log
  if (agentOS.securityManager) {
    console.log('\n6. Audit Log (last 5 entries):');
    const auditLog = agentOS.securityManager.getAuditLog(5);
    console.log(JSON.stringify(auditLog, null, 2));
  }

  await agentOS.shutdown();
}

// ============================================================================
// Demo 2: Resilience Features
// ============================================================================

async function resilienceDemo() {
  console.log('\n=== Resilience & Fault Tolerance Demo ===\n');

  const agentOS = new AutonomousAgentOS({
    resilience: {
      enabled: true,
      circuitBreaker: true,
      retries: true,
      healthChecks: true,
    },
  });

  await agentOS.initialize();

  // Test circuit breaker
  console.log('1. Testing Circuit Breaker...');
  const apiBreaker = agentOS.circuitBreakers.get('api');
  
  if (apiBreaker) {
    let failureCount = 0;
    
    for (let i = 0; i < 10; i++) {
      try {
        await apiBreaker.execute(async () => {
          // Simulate failures
          if (failureCount < 5) {
            failureCount++;
            throw new Error('Service unavailable');
          }
          return 'Success';
        });
        console.log(`Request ${i + 1}: SUCCESS`);
      } catch (error) {
        console.log(`Request ${i + 1}: FAILED -`, (error as Error).message);
      }
    }

    console.log('\nCircuit Breaker Metrics:', apiBreaker.getMetrics());
  }

  // Test retry mechanism
  console.log('\n2. Testing Retry with Exponential Backoff...');
  if (agentOS.retryManager) {
    let attempts = 0;
    
    try {
      await agentOS.retryManager.executeWithRetry(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'Success after retries';
      }, 'test-operation');
    } catch (error) {
      console.log('Final error:', (error as Error).message);
    }
  }

  // Test fallback mechanism
  console.log('\n3. Testing Fallback...');
  if (agentOS.fallbackManager) {
    agentOS.fallbackManager.registerFallback('api-call', {
      enabled: true,
      fallbackValue: { cached: true, data: 'Fallback data' },
    });

    const result = await agentOS.fallbackManager.executeWithFallback(
      'api-call',
      async () => {
        throw new Error('Primary failed');
      }
    );
    console.log('Fallback result:', result);
  }

  // Test health checks
  console.log('\n4. Running Health Checks...');
  if (agentOS.healthMonitor) {
    const health = await agentOS.healthMonitor.runHealthChecks();
    console.log('Overall healthy:', health.healthy);
    console.log('Individual checks:', JSON.stringify(health.checks, null, 2));
  }

  // Test bulkhead (resource isolation)
  console.log('\n5. Testing Bulkhead (Resource Isolation)...');
  if (agentOS.bulkhead) {
    const promises = [];
    
    for (let i = 0; i < 15; i++) {
      promises.push(
        agentOS.bulkhead.execute(async () => {
          await new Promise((r) => setTimeout(r, 100));
          return `Task ${i + 1}`;
        }).then(
          (result) => console.log('Completed:', result),
          (error) => console.log('Rejected:', (error as Error).message)
        )
      );
    }

    await Promise.allSettled(promises);
    console.log('Bulkhead metrics:', agentOS.bulkhead.getMetrics());
  }

  // Test dead letter queue
  console.log('\n6. Testing Dead Letter Queue...');
  if (agentOS.deadLetterQueue) {
    agentOS.deadLetterQueue.add(
      { taskId: 'task-1', data: 'failed task' },
      'Timeout error',
      3
    );
    agentOS.deadLetterQueue.add(
      { taskId: 'task-2', data: 'another failed task' },
      'Invalid input',
      2
    );

    console.log('Dead letter queue size:', agentOS.deadLetterQueue.size());
    console.log('Failed tasks:', agentOS.deadLetterQueue.getAll());
  }

  await agentOS.shutdown();
}

// ============================================================================
// Demo 3: Observability Features
// ============================================================================

async function observabilityDemo() {
  console.log('\n=== Observability & Monitoring Demo ===\n');

  const agentOS = new AutonomousAgentOS({
    observability: {
      enabled: true,
      tracing: true,
      metrics: true,
      logging: LogLevel.INFO,
      alerts: true,
    },
  });

  await agentOS.initialize();

  if (!agentOS.apmMonitor) {
    console.log('APM not enabled');
    return;
  }

  // Test distributed tracing
  console.log('1. Testing Distributed Tracing...');
  const tracer = agentOS.apmMonitor.getTracer();
  
  const parentSpan = tracer.startSpan('user-request', undefined, {
    userId: 'user-123',
    endpoint: '/api/task',
  });

  const childSpan = tracer.startSpan('database-query', parentSpan.spanId, {
    query: 'SELECT * FROM tasks',
  });
  
  await new Promise((r) => setTimeout(r, 50));
  tracer.endSpan(childSpan.spanId, 'success');

  await new Promise((r) => setTimeout(r, 30));
  tracer.endSpan(parentSpan.spanId, 'success');

  console.log('Trace metrics:', tracer.getMetrics());
  console.log('Full trace:', tracer.getTrace(parentSpan.traceId));

  // Test performance monitoring
  console.log('\n2. Testing Performance Monitoring...');
  const perfMonitor = agentOS.apmMonitor.getPerformanceMonitor();

  for (let i = 0; i < 10; i++) {
    await perfMonitor.measure('database-query', async () => {
      await new Promise((r) => setTimeout(r, Math.random() * 100));
    });
  }

  console.log('Performance stats:', perfMonitor.getStats('database-query'));

  // Test structured logging
  console.log('\n3. Testing Structured Logging...');
  const logger = agentOS.apmMonitor.getLogger();

  logger.info('Application started', { version: '1.0.0', env: 'production' });
  logger.warn('High memory usage detected', { usage: '85%' });
  logger.error('Failed to connect to database', new Error('Connection timeout'), {
    host: 'db.example.com',
  });

  const recentLogs = logger.getLogs(5);
  console.log('Recent logs:', recentLogs);

  // Test metrics collection
  console.log('\n4. Testing Metrics Collection...');
  const metrics = agentOS.apmMonitor.getMetrics();

  metrics.increment('http.requests', 1, { endpoint: '/api/task', method: 'POST' });
  metrics.increment('http.requests', 1, { endpoint: '/api/task', method: 'GET' });
  metrics.gauge('system.memory', 75.5);
  metrics.histogram('response.time', 145);
  metrics.histogram('response.time', 203);
  metrics.histogram('response.time', 89);

  const endTimer = metrics.startTimer('operation.duration');
  await new Promise((r) => setTimeout(r, 100));
  endTimer();

  console.log('All metrics:', metrics.getAllMetrics());

  // Test alerting
  console.log('\n5. Testing Alert System...');
  if (agentOS.alertManager) {
    agentOS.alertManager.triggerAlert(
      'warning',
      'High Error Rate',
      'Error rate exceeded 5% threshold',
      { errorRate: 7.5, threshold: 5 }
    );

    agentOS.alertManager.triggerAlert(
      'critical',
      'Service Down',
      'Database connection lost',
      { service: 'postgresql', downtime: '30s' }
    );

    const unacknowledged = agentOS.alertManager.getAlerts(false);
    console.log('Unacknowledged alerts:', unacknowledged);
  }

  // Test APM dashboard
  console.log('\n6. APM Dashboard Overview:');
  const dashboard = agentOS.apmMonitor.getDashboard();
  console.log(JSON.stringify(dashboard, null, 2));

  await agentOS.shutdown();
}

// ============================================================================
// Demo 4: Production-Grade Task Execution
// ============================================================================

async function productionTaskDemo() {
  console.log('\n=== Production-Grade Task Execution Demo ===\n');

  const agentOS = new AutonomousAgentOS({
    security: { enabled: true },
    resilience: { enabled: true },
    observability: { enabled: true },
  });

  await agentOS.initialize();

  // Execute task with full monitoring
  console.log('Executing task with full observability...\n');

  if (agentOS.apmMonitor && agentOS.rateLimiter && agentOS.securityManager) {
    try {
      // Check rate limit
      const rateLimitCheck = await agentOS.rateLimiter.checkLimit('user-123');
      if (!rateLimitCheck.allowed) {
        throw new Error('Rate limit exceeded');
      }

      // Check authorization
      const authCheck = await agentOS.securityManager.authorize(
        'task.execute',
        'important-task',
        'user-123'
      );
      if (!authCheck.allowed) {
        throw new Error('Unauthorized');
      }

      // Execute with tracing and metrics
      const result = await agentOS.apmMonitor.trace(
        'execute-important-task',
        async () => {
          // Simulate task execution
          await new Promise((r) => setTimeout(r, 200));
          return { success: true, data: 'Task completed' };
        },
        { userId: 'user-123', taskType: 'analysis' }
      );

      console.log('Task result:', result);
    } catch (error) {
      console.error('Task execution failed:', (error as Error).message);
      
      // Add to dead letter queue
      if (agentOS.deadLetterQueue) {
        agentOS.deadLetterQueue.add(
          { taskId: 'important-task', user: 'user-123' },
          (error as Error).message
        );
      }
    }
  }

  // Show system metrics
  console.log('\nSystem Metrics:');
  const status = agentOS.getSystemStatus();
  console.log(JSON.stringify(status, null, 2));

  await agentOS.shutdown();
}

// ============================================================================
// Demo 5: Chaos Engineering
// ============================================================================

async function chaosEngineeringDemo() {
  console.log('\n=== Chaos Engineering Demo ===\n');
  console.log('Testing system resilience under failure conditions...\n');

  const { ChaosMonkey } = await import('@/lib/autonomous-agent/resilience');
  const chaos = new ChaosMonkey(true, 0.3); // 30% failure rate

  const agentOS = new AutonomousAgentOS({
    resilience: { enabled: true, retries: true, circuitBreaker: true },
  });

  await agentOS.initialize();

  console.log('🐵 Chaos Monkey enabled with 30% failure rate\n');

  // Test system under chaos
  for (let i = 0; i < 10; i++) {
    try {
      await chaos.maybeInjectFailure();
      
      if (agentOS.retryManager) {
        await agentOS.retryManager.executeWithRetry(async () => {
          await chaos.maybeInjectFailure();
          return 'Success';
        }, `chaos-test-${i + 1}`);
      }

      console.log(`✓ Test ${i + 1}: Success`);
    } catch (error) {
      console.log(`✗ Test ${i + 1}: Failed -`, (error as Error).message);
    }
  }

  chaos.disable();
  console.log('\n🐵 Chaos Monkey disabled');

  await agentOS.shutdown();
}

// ============================================================================
// Run All Hardened Demos
// ============================================================================

async function runAllHardenedDemos() {
  console.log('🛡️  HARDENED AUTONOMOUS AGENT SYSTEM - ADVANCED FEATURES\n');
  console.log('========================================================\n');

  try {
    await securityDemo();
    await resilienceDemo();
    await observabilityDemo();
    await productionTaskDemo();
    await chaosEngineeringDemo();

    console.log('\n✅ All hardened system demos completed successfully!');
    console.log('\n📊 Key Features Demonstrated:');
    console.log('  ✓ Security: Authorization, rate limiting, encryption, sandboxing');
    console.log('  ✓ Resilience: Circuit breakers, retries, fallbacks, health checks');
    console.log('  ✓ Observability: Tracing, metrics, logging, alerting');
    console.log('  ✓ Production-Grade: Full monitoring and error handling');
    console.log('  ✓ Chaos Engineering: Failure injection and recovery testing');
  } catch (error) {
    console.error('Demo error:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  runAllHardenedDemos().catch(console.error);
}

export {
  securityDemo,
  resilienceDemo,
  observabilityDemo,
  productionTaskDemo,
  chaosEngineeringDemo,
  runAllHardenedDemos,
};
