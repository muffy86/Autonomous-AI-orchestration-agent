/**
 * Example: Price Monitoring Bot
 * Monitor e-commerce sites for price changes
 */

import { SovereignClient } from '../sdk/client.ts';

async function priceMonitoringBot() {
  console.log('💰 Price Monitoring Bot\n');

  // Initialize client
  const client = new SovereignClient();
  await client.connect();

  // Products to monitor
  const products = [
    {
      name: 'Example Product 1',
      url: 'https://example.com/product1',
      selector: '.price',
      maxPrice: 99.99
    },
    {
      name: 'Example Product 2',
      url: 'https://example.com/product2',
      selector: '.product-price',
      maxPrice: 149.99
    }
  ];

  console.log(`Monitoring ${products.length} products...\n`);

  // Create workflow for each product
  for (const product of products) {
    console.log(`Setting up monitor for: ${product.name}`);

    await client.createWorkflow({
      name: `Monitor: ${product.name}`,
      steps: [
        {
          type: 'browser',
          action: 'scrape',
          url: product.url,
          selector: product.selector
        },
        {
          type: 'condition',
          condition: `price < ${product.maxPrice}`,
          then: {
            type: 'notification',
            message: `Price alert: ${product.name} is now under $${product.maxPrice}!`
          }
        }
      ],
      schedule: '1h' // Check every hour
    });

    console.log(`   ✅ Monitoring every hour\n`);
  }

  // Monitor real-time price changes
  client.on('workflow:completed', (data: any) => {
    if (data.workflow.includes('Monitor:')) {
      console.log(`📊 Price check completed: ${data.workflow}`);
      
      // Check if price dropped
      if (data.results.some((r: any) => r.triggered)) {
        console.log('   🎉 Price alert triggered!');
      }
    }
  });

  console.log('✅ Price monitoring active!\n');
  console.log('Press Ctrl+C to stop\n');

  // Keep running
  await new Promise(() => {});
}

// Run if main
if (import.meta.main) {
  priceMonitoringBot();
}

export { priceMonitoringBot };
