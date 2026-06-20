/**
 * Example: Content Aggregator
 * Collect and summarize content from multiple sources
 */

import { SovereignClient } from '../sdk/client.ts';

async function contentAggregator() {
  console.log('📰 Content Aggregator\n');

  const client = new SovereignClient();
  await client.connect();

  // Sources to monitor
  const sources = [
    'https://news.ycombinator.com',
    'https://reddit.com/r/technology',
    'https://dev.to'
  ];

  console.log('📡 Collecting content from sources...\n');

  const articles: any[] = [];

  for (const source of sources) {
    console.log(`Scraping: ${source}`);

    try {
      // Scrape articles
      const result = await client.scrape(source, 'article, .post, .story');
      
      if (result.data) {
        articles.push(...result.data.slice(0, 5));
      }

      console.log(`   Found ${result.data?.length || 0} articles\n`);
    } catch (error: any) {
      console.log(`   Error: ${error.message}\n`);
    }
  }

  // Generate daily digest
  console.log('📝 Generating daily digest...\n');

  const digest = await client.chat(
    `Create a daily digest summary from these article titles:\n\n${articles.map((a, i) => `${i + 1}. ${a.title || a}`).join('\n')}\n\nProvide a brief summary of the key themes and interesting stories.`,
    { model: 'llama3.1:8b' }
  );

  console.log('='.repeat(60));
  console.log('DAILY DIGEST');
  console.log('='.repeat(60));
  console.log(digest.response);
  console.log('='.repeat(60));
  console.log();

  // Store in knowledge graph
  await client.addNode({
    type: 'daily-digest',
    content: {
      date: new Date().toISOString().split('T')[0],
      summary: digest.response,
      articles: articles.length
    }
  });

  console.log('✅ Digest saved to knowledge graph\n');

  client.disconnect();
}

// Run if main
if (import.meta.main) {
  contentAggregator();
}

export { contentAggregator };
