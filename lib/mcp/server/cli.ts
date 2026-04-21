#!/usr/bin/env node
/**
 * MCP Server CLI Entry Point
 * Start the MCP server in stdio mode
 */

import { mcpServer } from './index';

async function main() {
  console.error('Starting MCP Server...');
  
  try {
    await mcpServer.start();
    console.error('MCP Server started successfully');
    
    // Keep process alive
    process.on('SIGINT', async () => {
      console.error('Shutting down MCP Server...');
      await mcpServer.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start MCP Server:', error);
    process.exit(1);
  }
}

main();
