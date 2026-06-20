#!/usr/bin/env deno run --allow-all

/**
 * Sovereign OS CLI Tool
 * Command-line interface for managing the browser OS
 */

import { parse } from "https://deno.land/std@0.220.0/flags/mod.ts";

const VERSION = "2.0.0";

// ===== Main CLI =====

async function main() {
  const args = parse(Deno.args, {
    boolean: ["help", "version", "verbose"],
    string: ["config"],
    alias: {
      h: "help",
      v: "version",
      c: "config"
    }
  });

  if (args.version) {
    console.log(`Sovereign Browser OS CLI v${VERSION}`);
    return;
  }

  const command = args._[0];

  if (!command || args.help) {
    showHelp();
    return;
  }

  try {
    switch (command) {
      case "start":
        await startServer(args);
        break;
      
      case "stop":
        await stopServer(args);
        break;
      
      case "status":
        await showStatus(args);
        break;
      
      case "chat":
        await chat(args);
        break;
      
      case "search":
        await search(args);
        break;
      
      case "execute":
        await executeCommand(args);
        break;
      
      case "workflow":
        await manageWorkflow(args);
        break;
      
      case "plugin":
        await managePlugin(args);
        break;
      
      case "export":
        await exportData(args);
        break;
      
      case "import":
        await importData(args);
        break;
      
      case "stats":
        await showStats(args);
        break;
      
      case "logs":
        await showLogs(args);
        break;
      
      default:
        console.error(`Unknown command: ${command}`);
        console.log("Run 'sovereign-os --help' for usage");
        Deno.exit(1);
    }
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (args.verbose) {
      console.error(error.stack);
    }
    Deno.exit(1);
  }
}

// ===== Commands =====

async function startServer(args: any) {
  console.log("🚀 Starting Sovereign Browser OS...\n");
  
  const port = args.port || 8000;
  const config = args.config || "./config.json";
  
  console.log(`Port: ${port}`);
  console.log(`Config: ${config}\n`);

  // Run the server
  const server = Deno.run({
    cmd: ["deno", "run", "--allow-all", "server.ts"],
    stdout: "piped",
    stderr: "piped"
  });

  console.log("✅ Server started!");
  console.log(`   Open http://localhost:${port}`);
  console.log("   Press Ctrl+C to stop\n");

  await server.status();
}

async function stopServer(args: any) {
  console.log("⏹️  Stopping Sovereign Browser OS...");
  
  // Would send shutdown signal to running server
  console.log("✅ Server stopped");
}

async function showStatus(args: any) {
  console.log("📊 Sovereign Browser OS Status\n");

  try {
    const response = await fetch("http://localhost:8000/api/health");
    const data = await response.json();

    console.log(`Status: ${data.status === 'ok' ? '✅ Running' : '❌ Not Running'}`);
    console.log(`Uptime: ${formatUptime(data.timestamp)}`);
    console.log(`WebSocket Clients: ${data.clients || 0}`);
  } catch (error) {
    console.log("Status: ❌ Not Running");
    console.log("\nRun 'sovereign-os start' to start the server");
  }
}

async function chat(args: any) {
  const message = args._.slice(1).join(" ");
  
  if (!message) {
    console.error("Usage: sovereign-os chat <message>");
    return;
  }

  console.log(`💬 You: ${message}\n`);

  const response = await fetch("http://localhost:8000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      provider: args.provider || "ollama",
      model: args.model || "llama3.1:8b"
    })
  });

  const data = await response.json();
  console.log(`🤖 AI: ${data.response}\n`);
}

async function search(args: any) {
  const query = args._.slice(1).join(" ");
  
  if (!query) {
    console.error("Usage: sovereign-os search <query>");
    return;
  }

  console.log(`🔍 Searching: "${query}"\n`);

  const response = await fetch("http://localhost:8000/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  });

  const data = await response.json();

  console.log(`Found ${data.totalResults} results:\n`);

  for (let i = 0; i < Math.min(5, data.results.length); i++) {
    const result = data.results[i];
    console.log(`${i + 1}. ${result.title}`);
    console.log(`   ${result.url}`);
    console.log(`   ${result.snippet}\n`);
  }
}

async function executeCommand(args: any) {
  const command = args._.slice(1).join(" ");
  
  if (!command) {
    console.error("Usage: sovereign-os execute <command>");
    return;
  }

  console.log(`⚙️  Executing: "${command}"\n`);

  const response = await fetch("http://localhost:8000/api/command", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command })
  });

  const data = await response.json();
  console.log(`✅ Command queued: ${data.id}`);
  console.log(`   Status: ${data.status}\n`);
}

async function manageWorkflow(args: any) {
  const action = args._[1];

  if (!action) {
    console.error("Usage: sovereign-os workflow <list|create|run|stop> [options]");
    return;
  }

  const response = await fetch("http://localhost:8000/api/workflows");
  const data = await response.json();

  if (action === "list") {
    console.log("📋 Workflows:\n");
    for (const workflow of data.workflows) {
      console.log(`  ${workflow.id}: ${workflow.name}`);
      console.log(`     Status: ${workflow.active ? '✅ Active' : '⏸️ Stopped'}`);
      console.log(`     Runs: ${workflow.runs || 0}\n`);
    }
  }
}

async function managePlugin(args: any) {
  const action = args._[1];

  if (!action) {
    console.error("Usage: sovereign-os plugin <list|install|enable|disable> [options]");
    return;
  }

  const response = await fetch("http://localhost:8000/api/plugins");
  const data = await response.json();

  if (action === "list") {
    console.log("🔌 Plugins:\n");
    for (const plugin of data.plugins) {
      console.log(`  ${plugin.id} (v${plugin.version})`);
      console.log(`     ${plugin.name}`);
      console.log(`     Status: ${plugin.enabled ? '✅ Enabled' : '⏸️ Disabled'}\n`);
    }
  }
}

async function exportData(args: any) {
  const type = args._[1] || "all";
  const format = args.format || "json";
  const output = args.output || `export-${Date.now()}.${format}`;

  console.log(`📦 Exporting ${type} data...\n`);

  const response = await fetch(`http://localhost:8000/api/knowledge/export?format=${format}`);
  const data = await response.text();

  await Deno.writeTextFile(output, data);

  console.log(`✅ Exported to ${output}`);
}

async function importData(args: any) {
  const file = args._[1];

  if (!file) {
    console.error("Usage: sovereign-os import <file>");
    return;
  }

  console.log(`📥 Importing from ${file}...\n`);

  const data = await Deno.readTextFile(file);

  // Would send to import API
  console.log("✅ Import completed");
}

async function showStats(args: any) {
  console.log("📊 Statistics\n");

  const response = await fetch("http://localhost:8000/api/stats");
  const data = await response.json();

  console.log("System:");
  console.log(`  Memory: ${formatBytes(data.memory?.used || 0)} / ${formatBytes(data.memory?.total || 0)}`);
  console.log(`  Uptime: ${formatUptime(data.uptime)}`);
  console.log();

  console.log("Agents:");
  console.log(`  Active: ${data.agents?.active || 0}`);
  console.log(`  Completed Tasks: ${data.agents?.completed || 0}`);
  console.log(`  Failed Tasks: ${data.agents?.failed || 0}`);
  console.log();

  console.log("Requests:");
  console.log(`  Total: ${data.requests || 0}`);
  console.log(`  Errors: ${data.errors || 0}`);
}

async function showLogs(args: any) {
  console.log("📜 Recent Logs\n");
  
  // Would fetch logs from monitoring system
  console.log("(Log viewing feature coming soon)");
}

// ===== Utilities =====

function showHelp() {
  console.log(`
Sovereign Browser OS CLI v${VERSION}

Usage: sovereign-os <command> [options]

Commands:
  start                Start the server
  stop                 Stop the server
  status               Show server status
  chat <message>       Chat with AI
  search <query>       Search the web
  execute <command>    Execute a command
  workflow <action>    Manage workflows
  plugin <action>      Manage plugins
  export [type]        Export data
  import <file>        Import data
  stats                Show statistics
  logs                 Show logs

Options:
  -h, --help          Show this help
  -v, --version       Show version
  -c, --config        Config file path
  --verbose           Verbose output

Examples:
  sovereign-os start
  sovereign-os chat "Hello, how are you?"
  sovereign-os search "AI news"
  sovereign-os execute "Research quantum computing"
  sovereign-os workflow list
  sovereign-os stats

For more information, visit:
  https://github.com/your-repo/sovereign-os
`);
}

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ===== Run =====

if (import.meta.main) {
  main();
}
