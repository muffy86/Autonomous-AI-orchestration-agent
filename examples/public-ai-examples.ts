/**
 * Public AI Integration Examples
 * Demonstrates how to use Public AI's sovereign infrastructure
 */

import { createPublicAIAgent, AutonomousAgentOS } from '@/lib/autonomous-agent';

// ============================================================================
// Example 1: Basic Public AI Usage
// ============================================================================

async function basicPublicAIExample() {
  console.log('=== Basic Public AI Example ===\n');

  const agentOS = new AutonomousAgentOS({
    publicAI: {
      enabled: true,
      apiKey: process.env.PUBLIC_AI_API_KEY,
    },
  });

  await agentOS.initialize();

  // Execute task with sovereign AI
  const taskId = await agentOS.executeTask({
    type: 'analysis',
    description: 'Explain the benefits of sovereign AI infrastructure',
    input: {
      topics: ['transparency', 'privacy', 'governance', 'compliance'],
    },
  });

  console.log('Task submitted to Public AI:', taskId);

  const task = await agentOS.orchestrator.getTask(taskId);
  console.log('Status:', task?.status);
  console.log('Assigned to:', task?.assignedAgent);

  await agentOS.shutdown();
}

// ============================================================================
// Example 2: GDPR-Compliant Data Processing
// ============================================================================

async function gdprCompliantExample() {
  console.log('\n=== GDPR-Compliant Processing ===\n');

  // Create specialized agent for GDPR compliance
  const gdprAgent = createPublicAIAgent({
    name: 'GDPR Compliance Agent',
    description: 'Processes data with strict GDPR compliance',
    systemPrompt: `You are a GDPR compliance specialist AI agent.
    
You must:
- Always respect user privacy
- Process minimal necessary data
- Provide transparency in data handling
- Support data subject rights (access, deletion, portability)
- Ensure lawful basis for processing
- Maintain data security
- Document all processing activities

You are powered by Public AI infrastructure (Apertus model) which is:
- GDPR-compliant by design
- EU-hosted (data residency)
- Privacy-first (no training on user data by default)
- Transparent and auditable`,
    priority: 9,
  });

  const agentOS = new AutonomousAgentOS({
    publicAI: {
      enabled: true,
      apiKey: process.env.PUBLIC_AI_API_KEY,
    },
  });

  await agentOS.initialize();
  agentOS.orchestrator.registerAgent(gdprAgent);

  // Process user data with GDPR compliance
  const taskId = await agentOS.executeTask({
    type: 'analysis',
    description: 'Analyze user behavior while ensuring GDPR compliance',
    input: {
      userData: {
        userId: 'user-123',
        actions: ['page_view', 'button_click'],
        consent: {
          analytics: true,
          marketing: false,
        },
      },
      requirements: [
        'Respect consent preferences',
        'Anonymize where possible',
        'Document processing purpose',
      ],
    },
  });

  console.log('GDPR-compliant task:', taskId);

  await agentOS.shutdown();
}

// ============================================================================
// Example 3: Multilingual European Content
// ============================================================================

async function multilingualExample() {
  console.log('\n=== Multilingual Content Generation ===\n');

  const multilingualAgent = createPublicAIAgent({
    name: 'Multilingual Content Agent',
    description: 'Creates content in multiple European languages using Apertus',
    systemPrompt: `You are a multilingual content specialist powered by Apertus.

Apertus supports multiple languages with native-level quality:
- German (Deutsch)
- French (Français)
- Italian (Italiano)
- Spanish (Español)
- English
- And many more European languages

You excel at:
- Translation with cultural context
- Localization for specific regions
- Maintaining brand voice across languages
- SEO-optimized multilingual content`,
    priority: 8,
  });

  const agentOS = new AutonomousAgentOS({
    publicAI: {
      enabled: true,
      apiKey: process.env.PUBLIC_AI_API_KEY,
    },
  });

  await agentOS.initialize();
  agentOS.orchestrator.registerAgent(multilingualAgent);

  // Generate multilingual content
  const taskId = await agentOS.executeTask({
    type: 'execution',
    description: 'Create product descriptions in multiple European languages',
    input: {
      product: {
        name: 'Swiss Watch',
        features: ['Precision', 'Craftsmanship', 'Durability'],
      },
      languages: ['en', 'de', 'fr', 'it'],
      tone: 'professional',
      length: 'medium',
    },
  });

  console.log('Multilingual content task:', taskId);

  await agentOS.shutdown();
}

// ============================================================================
// Example 4: Transparent AI Decision Making
// ============================================================================

async function transparentDecisionExample() {
  console.log('\n=== Transparent AI Decisions ===\n');

  const transparentAgent = createPublicAIAgent({
    name: 'Transparent Decision Agent',
    description: 'Makes explainable, transparent AI decisions',
    systemPrompt: `You are a transparent AI decision-making agent.

Your decisions must be:
- Explainable: Provide clear reasoning
- Auditable: Document decision factors
- Fair: Avoid bias and discrimination
- Compliant: Follow regulations (EU AI Act)
- Transparent: Show your work

You are powered by Public AI (Apertus), which provides:
- Full transparency in model development
- Open-source infrastructure
- Public governance
- Regulatory compliance (EU AI Act)

Always explain your reasoning step-by-step.`,
    priority: 9,
  });

  const agentOS = new AutonomousAgentOS({
    publicAI: {
      enabled: true,
      apiKey: process.env.PUBLIC_AI_API_KEY,
    },
  });

  await agentOS.initialize();
  agentOS.orchestrator.registerAgent(transparentAgent);

  // Make transparent decision
  const taskId = await agentOS.executeTask({
    type: 'analysis',
    description: 'Evaluate loan application with full transparency',
    input: {
      application: {
        income: 75000,
        creditScore: 720,
        employmentYears: 5,
        loanAmount: 200000,
      },
      requirements: [
        'Explain decision factors',
        'Show calculations',
        'Identify potential biases',
        'Provide recommendations',
      ],
    },
  });

  console.log('Transparent decision task:', taskId);

  await agentOS.shutdown();
}

// ============================================================================
// Example 5: Public Sector Chatbot
// ============================================================================

async function publicSectorExample() {
  console.log('\n=== Public Sector Chatbot ===\n');

  const publicServiceAgent = createPublicAIAgent({
    name: 'Swiss Citizen Service Agent',
    description: 'Provides public services information to Swiss citizens',
    systemPrompt: `You are a Swiss government service chatbot powered by Public AI.

Your role:
- Provide accurate information about public services
- Assist citizens with government procedures
- Support multiple Swiss languages (DE, FR, IT)
- Maintain data privacy (GDPR)
- Be transparent about your capabilities
- Direct complex cases to human officials

You operate on sovereign Swiss AI infrastructure (Apertus by Swiss AI Initiative):
- Hosted in Switzerland
- Privacy-preserving
- Transparent
- Publicly governed

You can help with:
- Tax information and filing
- Social services
- Administrative procedures
- Public health information
- Education services`,
    priority: 8,
  });

  const agentOS = new AutonomousAgentOS({
    publicAI: {
      enabled: true,
      apiKey: process.env.PUBLIC_AI_API_KEY,
    },
  });

  await agentOS.initialize();
  agentOS.orchestrator.registerAgent(publicServiceAgent);

  // Handle citizen query
  const taskId = await agentOS.executeTask({
    type: 'execution',
    description: 'Answer citizen question about tax filing in German',
    input: {
      question: 'Wie reiche ich meine Steuererklärung ein?',
      language: 'de',
      context: {
        canton: 'Zürich',
        taxYear: 2026,
      },
    },
  });

  console.log('Public service task:', taskId);

  await agentOS.shutdown();
}

// ============================================================================
// Example 6: Research & Education
// ============================================================================

async function researchExample() {
  console.log('\n=== Research & Education ===\n');

  const researchAgent = createPublicAIAgent({
    name: 'Research AI Agent',
    description: 'Supports academic research with transparent AI',
    systemPrompt: `You are an academic research assistant powered by Public AI.

Your purpose:
- Support academic research with AI
- Maintain research integrity
- Provide transparent, reproducible results
- Respect academic ethics
- Contribute to open science

Public AI (Apertus) advantages for research:
- Transparency: Fully open model development
- Reproducibility: Consistent, documented results
- Privacy: Research data protected
- Open Source: Study how the AI works
- Public Good: Aligned with academic values

You excel at:
- Literature analysis
- Data interpretation
- Hypothesis generation
- Research methodology
- Academic writing`,
    priority: 8,
  });

  const agentOS = new AutonomousAgentOS({
    publicAI: {
      enabled: true,
      apiKey: process.env.PUBLIC_AI_API_KEY,
    },
  });

  await agentOS.initialize();
  agentOS.orchestrator.registerAgent(researchAgent);

  // Support research task
  const taskId = await agentOS.executeTask({
    type: 'analysis',
    description: 'Analyze research literature on sovereign AI',
    input: {
      topic: 'sovereign AI infrastructure',
      databases: ['academic_papers', 'policy_documents'],
      focus: [
        'Digital sovereignty',
        'AI governance',
        'Privacy regulations',
        'Public infrastructure',
      ],
      outputFormat: 'literature_review',
    },
  });

  console.log('Research task:', taskId);

  await agentOS.shutdown();
}

// ============================================================================
// Example 7: Direct API Integration
// ============================================================================

async function directAPIExample() {
  console.log('\n=== Direct Public AI API ===\n');

  // Direct API call to Public AI
  const response = await fetch('https://api.publicai.co/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.PUBLIC_AI_API_KEY}`,
      'User-Agent': 'AutonomousAgentOS/1.0',
    },
    body: JSON.stringify({
      model: 'swiss-ai/apertus-8b-instruct',
      messages: [
        {
          role: 'system',
          content: 'You are Apertus, a sovereign AI model from the Swiss AI Initiative.',
        },
        {
          role: 'user',
          content: 'What makes sovereign AI important for Europe?',
        },
      ],
      temperature: 0.8,
      top_p: 0.9,
      max_tokens: 8192,
    }),
  });

  const data = await response.json();
  console.log('Public AI Response:', data.choices[0].message.content);
  console.log('Tokens used:', data.usage);
}

// ============================================================================
// Example 8: Comparing Models
// ============================================================================

async function compareModelsExample() {
  console.log('\n=== Compare Public AI vs Commercial ===\n');

  const agentOS = new AutonomousAgentOS({
    publicAI: {
      enabled: true,
      apiKey: process.env.PUBLIC_AI_API_KEY,
    },
  });

  await agentOS.initialize();

  const prompt = 'Explain the concept of digital sovereignty';

  // Task 1: Using Public AI (Apertus)
  const publicAITask = await agentOS.executeTask({
    type: 'analysis',
    description: prompt,
    input: { preferredAgent: 'Public AI Agent' },
  });

  // Task 2: Using commercial model (if configured)
  const commercialTask = await agentOS.executeTask({
    type: 'analysis',
    description: prompt,
    input: { preferredAgent: 'Reasoning Agent' }, // Uses OpenAI/other
  });

  console.log('Public AI task:', publicAITask);
  console.log('Commercial task:', commercialTask);

  // Compare results
  const metrics = agentOS.orchestrator.getMetrics();
  console.log('\nAgent Performance:');
  metrics.agents.forEach((agent) => {
    console.log(`${agent.name}: ${agent.successRate}% success rate`);
  });

  await agentOS.shutdown();
}

// ============================================================================
// Run All Examples
// ============================================================================

async function runAllPublicAIExamples() {
  console.log('🌐 Public AI Integration Examples\n');
  console.log('Using sovereign AI infrastructure: https://publicai.co\n');

  try {
    await basicPublicAIExample();
    await gdprCompliantExample();
    await multilingualExample();
    await transparentDecisionExample();
    await publicSectorExample();
    await researchExample();
    await directAPIExample();
    await compareModelsExample();

    console.log('\n✅ All Public AI examples completed!');
    console.log('\nLearn more:');
    console.log('- Platform: https://platform.publicai.co');
    console.log('- Chat: https://chat.publicai.co');
    console.log('- About: https://publicai.co/about');
  } catch (error) {
    console.error('Example error:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  runAllPublicAIExamples().catch(console.error);
}

export {
  basicPublicAIExample,
  gdprCompliantExample,
  multilingualExample,
  transparentDecisionExample,
  publicSectorExample,
  researchExample,
  directAPIExample,
  compareModelsExample,
  runAllPublicAIExamples,
};
