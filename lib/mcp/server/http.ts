#!/usr/bin/env node
/**
 * MCP HTTP Server Entry Point
 * Start the MCP server in HTTP mode for webhooks and API access
 */

import { mcpHttpServer } from './index';

async function main() {
  console.log('Starting MCP HTTP Server...');
  
  try {
    await mcpHttpServer.start();
    console.log('MCP HTTP Server started successfully');
    
    // Keep process alive
    process.on('SIGINT', () => {
      console.log('Shutting down MCP HTTP Server...');
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start MCP HTTP Server:', error);
    process.exit(1);
  }
}

main();
