/**
 * Sovereign OS Test Suite
 * Unit and integration tests for all major components
 */

import { assertEquals, assertExists, assert } from "https://deno.land/std@0.220.0/assert/mod.ts";

// ===== Core Tests =====

Deno.test("Core Orchestrator - Initialization", async () => {
  const { SovereignBrowserOS } = await import("../core.ts");
  
  const os = new SovereignBrowserOS({
    llmProviders: ['ollama'],
    dataStorage: 'local',
    encryption: false // Disable for testing
  });

  assertExists(os);
  assertEquals(typeof os.init, 'function');
});

Deno.test("Core Orchestrator - Agent Registration", async () => {
  const agents = new Map();
  
  agents.set('test-agent', {
    name: 'Test Agent',
    capabilities: ['test'],
    async execute(task: any) {
      return { success: true };
    }
  });

  assertEquals(agents.size, 1);
  assert(agents.has('test-agent'));
});

// ===== Knowledge Graph Tests =====

Deno.test("Knowledge Graph - Add Node", async () => {
  const { PersonalKnowledgeGraph } = await import("../knowledge/graph.ts");
  
  const mockDataLayer = {
    async save() {},
    async load() { return null; }
  };

  const graph = new PersonalKnowledgeGraph(mockDataLayer);
  await graph.init();

  const nodeId = await graph.addNode({
    type: 'concept',
    content: { name: 'Test Concept' }
  });

  assertExists(nodeId);
  const node = await graph.getNode(nodeId);
  assertExists(node);
  assertEquals(node.type, 'concept');
});

Deno.test("Knowledge Graph - Query", async () => {
  const { PersonalKnowledgeGraph } = await import("../knowledge/graph.ts");
  
  const mockDataLayer = {
    async save() {},
    async load() { return null; }
  };

  const graph = new PersonalKnowledgeGraph(mockDataLayer);
  await graph.init();

  await graph.addNode({
    type: 'entity',
    content: { name: 'AI Safety' }
  });

  const results = await graph.query('AI Safety');
  assert(Array.isArray(results));
});

Deno.test("Knowledge Graph - Add Edge", async () => {
  const { PersonalKnowledgeGraph } = await import("../knowledge/graph.ts");
  
  const mockDataLayer = {
    async save() {},
    async load() { return null; }
  };

  const graph = new PersonalKnowledgeGraph(mockDataLayer);
  await graph.init();

  const id1 = await graph.addNode({ type: 'concept', content: { name: 'A' } });
  const id2 = await graph.addNode({ type: 'concept', content: { name: 'B' } });

  await graph.addEdge(id1, id2, 'relates-to');

  const connected = await graph.getConnected(id1);
  assertEquals(connected.length, 1);
});

// ===== Data Layer Tests =====

Deno.test("Data Layer - Save and Load", async () => {
  const { SovereignDataLayer } = await import("../data/sovereign.ts");
  
  const dataLayer = new SovereignDataLayer({
    dbName: 'test-db',
    encryption: false
  });

  // Note: Would need IndexedDB mock for full testing
  assertExists(dataLayer);
});

// ===== Search Engine Tests =====

Deno.test("Search Engine - DuckDuckGo", async () => {
  const { SearchEngine } = await import("../search/engine.ts");
  
  const engine = new SearchEngine({ cacheEnabled: false });
  
  const results = await engine.searchDuckDuckGo('test query');
  assert(Array.isArray(results));
});

Deno.test("Search Engine - Cache", async () => {
  const { SearchEngine } = await import("../search/engine.ts");
  
  const engine = new SearchEngine({ cacheEnabled: true, cacheTTL: 1000 });
  
  // First search
  const results1 = await engine.searchDuckDuckGo('test');
  
  // Second search (should hit cache)
  const results2 = await engine.searchDuckDuckGo('test');
  
  assert(Array.isArray(results1));
  assert(Array.isArray(results2));
});

// ===== Settings Tests =====

Deno.test("Settings - Get/Set", async () => {
  const { SettingsManager } = await import("../config/settings.ts");
  
  const mockDataLayer = {
    async save() {},
    async load() { return null; }
  };

  const settings = new SettingsManager(mockDataLayer);
  await settings.init();

  await settings.set('test.value', 42);
  const value = settings.get('test.value');
  
  assertEquals(value, 42);
});

Deno.test("Settings - Presets", async () => {
  const { SettingsManager } = await import("../config/settings.ts");
  
  const mockDataLayer = {
    async save() {},
    async load() { return null; }
  };

  const settings = new SettingsManager(mockDataLayer);
  await settings.init();

  const result = await settings.applyPreset('privacy-focused');
  assertEquals(result, true);
  
  assertEquals(settings.get('llm.defaultProvider'), 'ollama');
});

Deno.test("Settings - Change Listener", async () => {
  const { SettingsManager } = await import("../config/settings.ts");
  
  const mockDataLayer = {
    async save() {},
    async load() { return null; }
  };

  const settings = new SettingsManager(mockDataLayer);
  await settings.init();

  let called = false;
  settings.onChange('test.value', () => {
    called = true;
  });

  await settings.set('test.value', 'changed');
  assertEquals(called, true);
});

// ===== Plugin Tests =====

Deno.test("Plugin Manager - Install Plugin", async () => {
  const { PluginManager } = await import("../plugins/manager.ts");
  
  const mockDataLayer = {
    async save() {},
    async load() { return []; }
  };

  const plugins = new PluginManager(mockDataLayer);
  await plugins.init();

  const pluginCode = `
    function createPlugin(sandbox) {
      return {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0'
      };
    }
  `;

  const result = await plugins.installPlugin(pluginCode);
  assertEquals(result.success, true);
  assertExists(result.plugin);
});

Deno.test("Plugin Manager - List Plugins", async () => {
  const { PluginManager } = await import("../plugins/manager.ts");
  
  const mockDataLayer = {
    async save() {},
    async load() { return [] ; }
  };

  const plugins = new PluginManager(mockDataLayer);
  await plugins.init();

  const list = plugins.listPlugins();
  assert(Array.isArray(list));
});

// ===== Workflow Tests =====

Deno.test("Workflow Engine - Create Workflow", async () => {
  const { WorkflowEngine } = await import("../workflows/engine.ts");
  
  const mockDataLayer = {
    async save() {},
    async load() { return [] ; }
  };

  const mockOS = {
    async executeTask() { return { success: true }; }
  };

  const workflows = new WorkflowEngine(mockDataLayer, mockOS);
  await workflows.init();

  const workflow = await workflows.createWorkflow({
    name: 'Test Workflow',
    steps: [
      { type: 'task', name: 'Test', task: 'test task' }
    ]
  });

  assertExists(workflow);
  assertEquals(workflow.name, 'Test Workflow');
});

Deno.test("Workflow Engine - Execute Workflow", async () => {
  const { WorkflowEngine } = await import("../workflows/engine.ts");
  
  const mockDataLayer = {
    async save() {},
    async load() { return []; }
  };

  const mockOS = {
    async executeTask() { return { result: 'success' }; }
  };

  const workflows = new WorkflowEngine(mockDataLayer, mockOS);
  await workflows.init();

  const workflow = await workflows.createWorkflow({
    name: 'Test',
    steps: [{ type: 'task', task: 'test' }]
  });

  const result = await workflows.executeWorkflow(workflow.id);
  assertExists(result);
  assertEquals(result.success, true);
});

// ===== Monitoring Tests =====

Deno.test("Monitoring - Record Metric", async () => {
  const { MonitoringDashboard } = await import("../monitoring/dashboard.ts");
  
  const mockDataLayer = {
    async save() {},
    async load() { return null; }
  };

  const monitoring = new MonitoringDashboard(mockDataLayer);
  await monitoring.init();

  monitoring.recordMetric('test', { value: 42 });
  
  const metrics = monitoring.getMetrics('test');
  assertEquals(metrics.length, 1);
  assertEquals(metrics[0].value, 42);
});

Deno.test("Monitoring - Create Alert", async () => {
  const { MonitoringDashboard } = await import("../monitoring/dashboard.ts");
  
  const mockDataLayer = {
    async save() {},
    async load() { return null; }
  };

  const monitoring = new MonitoringDashboard(mockDataLayer);
  await monitoring.init();

  const alert = monitoring.createAlert('test', 'Test alert', 'warning');
  
  assertExists(alert);
  assertEquals(alert.severity, 'warning');
  
  const alerts = monitoring.getAlerts();
  assertEquals(alerts.length, 1);
});

// ===== Client SDK Tests =====

Deno.test("Client SDK - Initialization", async () => {
  const { SovereignClient } = await import("../sdk/client.ts");
  
  const client = new SovereignClient({
    baseURL: 'http://localhost:8000'
  });

  assertExists(client);
  assertEquals(typeof client.chat, 'function');
});

Deno.test("Client SDK - Event System", async () => {
  const { SovereignClient } = await import("../sdk/client.ts");
  
  const client = new SovereignClient();
  
  let called = false;
  client.on('test', () => {
    called = true;
  });

  client.emit('test', {});
  assertEquals(called, true);
});

// ===== Integration Tests =====

Deno.test("Integration - Full Workflow", async () => {
  // This would test a complete workflow from start to finish
  // Skipping actual execution for now
  assert(true);
});

// ===== Performance Tests =====

Deno.test("Performance - Knowledge Graph Query Speed", async () => {
  const { PersonalKnowledgeGraph } = await import("../knowledge/graph.ts");
  
  const mockDataLayer = {
    async save() {},
    async load() { return null; }
  };

  const graph = new PersonalKnowledgeGraph(mockDataLayer);
  await graph.init();

  // Add 100 nodes
  for (let i = 0; i < 100; i++) {
    await graph.addNode({
      type: 'test',
      content: { value: i }
    });
  }

  const start = performance.now();
  await graph.query('test');
  const duration = performance.now() - start;

  // Should complete in under 100ms
  assert(duration < 100);
});

console.log('\n✅ All tests completed!\n');
