/**
 * Example: Personal Research Assistant
 * Automated research workflow with knowledge storage
 */

import { SovereignClient } from '../sdk/client.ts';

async function personalResearchAssistant() {
  console.log('🔬 Personal Research Assistant\n');

  // Initialize client
  const client = new SovereignClient();
  await client.connect();

  // Research topic
  const topic = 'quantum computing applications 2026';
  
  console.log(`Researching: ${topic}\n`);

  // Step 1: Multi-engine search
  console.log('📚 Step 1: Searching multiple sources...');
  const searchResults = await client.smartSearch(topic);
  
  console.log(`   Found ${searchResults.totalSources} sources\n`);

  // Step 2: AI synthesis
  console.log('🤖 Step 2: Synthesizing findings...');
  const synthesis = await client.chat(
    `Summarize the key points from this research:\n${searchResults.answer}`,
    { model: 'llama3.1:8b' }
  );

  console.log(`   Generated ${synthesis.response.length} character summary\n`);

  // Step 3: Store in knowledge graph
  console.log('💾 Step 3: Storing in knowledge graph...');
  await client.addNode({
    type: 'research',
    content: {
      topic,
      summary: synthesis.response,
      sources: searchResults.sources,
      date: new Date().toISOString()
    }
  });

  console.log('   Stored successfully\n');

  // Step 4: Create follow-up questions
  console.log('❓ Step 4: Generating follow-up questions...');
  const questions = await client.chat(
    `Based on this research about ${topic}, generate 3 interesting follow-up questions to explore`,
    { model: 'llama3.1:8b' }
  );

  console.log(questions.response);
  console.log();

  // Done
  console.log('✅ Research complete!\n');
  
  client.disconnect();
}

// Run if main
if (import.meta.main) {
  personalResearchAssistant();
}

export { personalResearchAssistant };
