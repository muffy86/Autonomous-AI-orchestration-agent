/**
 * MCP Test Runner
 * Comprehensive tests for MCP server functionality
 */

import { mcpTools } from '../tools';
import { mcpResources } from '../resources';
import { modelProviders } from '../providers';
import { webhookManager } from '../webhooks';
import { skillsManager } from '../skills';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({
      name,
      passed: true,
      message: 'Passed',
      duration: Date.now() - start,
    });
    console.log(`✓ ${name}`);
  } catch (error) {
    results.push({
      name,
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - start,
    });
    console.error(`✗ ${name}:`, error);
  }
}

async function runTests() {
  console.log('\n🧪 Running MCP Tests...\n');

  // Tool Tests
  console.log('Testing Tools...');
  await test('Tools: All tools registered', async () => {
    if (mcpTools.length === 0) throw new Error('No tools registered');
  });

  await test('Tools: Execute web_search', async () => {
    const tool = mcpTools.find(t => t.name === 'web_search');
    if (!tool) throw new Error('web_search tool not found');
    const result = await tool.execute({ query: 'test' });
    if (!result.success) throw new Error('web_search failed');
  });

  await test('Tools: Execute fetch_url', async () => {
    const tool = mcpTools.find(t => t.name === 'fetch_url');
    if (!tool) throw new Error('fetch_url tool not found');
    // Test with a simple URL
    const result = await tool.execute({ url: 'https://httpbin.org/json' });
    if (!result.success && result.status !== 200) {
      console.warn('fetch_url test warning:', result.error);
    }
  });

  // Resource Tests
  console.log('\nTesting Resources...');
  await test('Resources: All resources registered', async () => {
    if (mcpResources.length === 0) throw new Error('No resources registered');
  });

  await test('Resources: Read system info', async () => {
    const resource = mcpResources.find(r => r.uri === 'resource://system/info');
    if (!resource) throw new Error('system/info resource not found');
    const data = await resource.read();
    if (!data) throw new Error('Failed to read system info');
  });

  await test('Resources: Read available models', async () => {
    const resource = mcpResources.find(r => r.uri === 'resource://models/available');
    if (!resource) throw new Error('models/available resource not found');
    const data = await resource.read();
    if (!data) throw new Error('Failed to read models');
  });

  // Provider Tests
  console.log('\nTesting Model Providers...');
  await test('Providers: List all providers', async () => {
    const providers = modelProviders.listProviders();
    if (providers.length === 0) throw new Error('No providers registered');
  });

  await test('Providers: Get free providers', async () => {
    const freeProviders = modelProviders.getFreeProviders();
    if (freeProviders.length === 0) throw new Error('No free providers found');
  });

  await test('Providers: Get free models', async () => {
    const freeModels = modelProviders.getFreeModels();
    if (freeModels.length === 0) throw new Error('No free models found');
  });

  await test('Providers: Get configured providers', async () => {
    const configured = modelProviders.getConfiguredProviders();
    console.log(`  Found ${configured.length} configured providers`);
  });

  // Webhook Tests
  console.log('\nTesting Webhooks...');
  await test('Webhooks: List all webhooks', async () => {
    const webhooks = webhookManager.listWebhooks();
    if (webhooks.length === 0) throw new Error('No webhooks registered');
  });

  await test('Webhooks: Trigger test webhook', async () => {
    const result = await webhookManager.trigger('api', {
      test: true,
      message: 'Test webhook',
    });
    if (!result.success) throw new Error('Webhook trigger failed');
  });

  await test('Webhooks: Emit event', async () => {
    const results = await webhookManager.emitEvent('custom', {
      test: true,
    });
    if (!results || results.length === 0) {
      console.warn('  No listeners for custom event');
    }
  });

  // Skills Tests
  console.log('\nTesting Skills...');
  await test('Skills: List all skills', async () => {
    const skills = skillsManager.listSkills();
    if (skills.length === 0) throw new Error('No skills registered');
  });

  await test('Skills: Execute code_analysis skill', async () => {
    const result = await skillsManager.executeSkill('code_analysis', {
      code: 'function test() { return true; }',
      language: 'javascript',
    });
    if (!result.success) throw new Error('code_analysis skill failed');
  });

  await test('Skills: Execute research skill', async () => {
    const result = await skillsManager.executeSkill('research', {
      topic: 'AI testing',
    });
    if (!result.success) throw new Error('research skill failed');
  });

  await test('Skills: Get skill categories', async () => {
    const categories = skillsManager.getCategories();
    if (categories.length === 0) throw new Error('No skill categories found');
  });

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`Total: ${total}`);
  console.log(`Passed: ${passed} (${((passed / total) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed Tests:');
    results
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`  ✗ ${r.name}: ${r.message}`);
      });
  }

  console.log('\n' + '='.repeat(60));

  // Free Tier Summary
  console.log('\n📱 Free Tier Models Available:');
  const freeModels = modelProviders.getFreeModels();
  freeModels.forEach(({ provider, model }) => {
    console.log(`  - ${model.name} (${provider})`);
  });

  console.log('\n✅ Configured Providers:');
  const configured = modelProviders.getConfiguredProviders();
  configured.forEach(provider => {
    console.log(`  - ${provider.name} (${provider.id})`);
  });

  if (configured.length === 0) {
    console.log('  ⚠️  No providers configured. Add API keys to .env');
    console.log('  ℹ️  Free providers: Google Gemini, Groq, OpenRouter');
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
