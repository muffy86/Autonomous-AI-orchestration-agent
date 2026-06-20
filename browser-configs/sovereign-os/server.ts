/**
 * Enhanced Deno Server with WebSocket Support
 * Real-time communication for agents and UI updates
 */

import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.220.0/http/file_server.ts";

const PORT = 8000;
const clients: Set<WebSocket> = new Set();

console.log(`
╔════════════════════════════════════════╗
║   SOVEREIGN BROWSER OS - June 2026    ║
║                                        ║
║   🔐 Uncensored • Private • Sovereign ║
║   🤖 AutoGPT • BabyAGI • 7 Agents     ║
║   🧠 Knowledge Graph • Smart Search   ║
║   🎨 Command Palette • Workflows      ║
╚════════════════════════════════════════╝

Server running on http://localhost:${PORT}
WebSocket ready for real-time updates
Command Palette: ⌘K or Ctrl+K

Ready to serve!
`);

serve(async (req: Request) => {
  const url = new URL(req.url);
  
  // CORS headers for API requests
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // WebSocket upgrade
  if (url.pathname === "/ws") {
    return handleWebSocket(req);
  }

  // API endpoints
  if (url.pathname.startsWith("/api/")) {
    return handleAPI(req, url, corsHeaders);
  }

  // Serve static files from ui/
  return serveDir(req, {
    fsRoot: "./ui",
    urlRoot: "",
    showDirListing: true,
    enableCors: true,
  });
}, { port: PORT });

// ===== WebSocket Handler =====

function handleWebSocket(req: Request): Response {
  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.addEventListener("open", () => {
    console.log("🔌 WebSocket client connected");
    clients.add(socket);
  });

  socket.addEventListener("message", async (event) => {
    try {
      const data = JSON.parse(event.data);
      
      // Handle different message types
      if (data.type === "ping") {
        socket.send(JSON.stringify({ type: "pong" }));
      } else if (data.type === "subscribe") {
        // Subscribe to specific events
        socket.send(JSON.stringify({ type: "subscribed", channel: data.channel }));
      } else {
        // Echo back for testing
        socket.send(JSON.stringify({ type: "echo", data }));
      }
    } catch (error: any) {
      console.error("WebSocket message error:", error.message);
    }
  });

  socket.addEventListener("close", () => {
    console.log("🔌 WebSocket client disconnected");
    clients.delete(socket);
  });

  socket.addEventListener("error", (error) => {
    console.error("WebSocket error:", error);
    clients.delete(socket);
  });

  return response;
}

// Broadcast to all connected clients
export function broadcast(message: any) {
  const data = JSON.stringify(message);
  
  for (const client of clients) {
    try {
      client.send(data);
    } catch (error) {
      console.error("Failed to send to client:", error);
      clients.delete(client);
    }
  }
}

// Send to specific client (would need client tracking)
export function sendToClient(clientId: string, message: any) {
  // Implementation would require client ID tracking
}

// ===== API Handler =====

async function handleAPI(req: Request, url: URL, corsHeaders: any) {
  const path = url.pathname.replace("/api/", "");

  try {
    switch (path) {
      case "health":
        return new Response(
          JSON.stringify({ 
            status: "ok", 
            timestamp: Date.now(),
            clients: clients.size 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      case "chat":
        return await handleChat(req, corsHeaders);

      case "command":
        return await handleCommand(req, corsHeaders);

      case "agents":
        return await handleAgents(req, corsHeaders);

      case "knowledge":
        return await handleKnowledge(req, corsHeaders);

      case "search":
        return await handleSearch(req, corsHeaders);

      case "workflows":
        return await handleWorkflows(req, corsHeaders);

      case "settings":
        return await handleSettings(req, corsHeaders);

      case "plugins":
        return await handlePlugins(req, corsHeaders);

      default:
        return new Response(
          JSON.stringify({ error: "Not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function handleChat(req: Request, corsHeaders: any) {
  const { message, provider = "ollama", model = "llama3.1:8b" } = await req.json();

  // Broadcast that chat started
  broadcast({ type: "chat:started", message: message.slice(0, 100) });

  // Route to Ollama
  if (provider === "ollama") {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt: message,
        stream: false,
      }),
    });

    const data = await response.json();

    // Broadcast completion
    broadcast({ type: "chat:completed", responseLength: data.response.length });

    return new Response(
      JSON.stringify({ response: data.response, provider, model }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ error: "Provider not supported yet" }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleCommand(req: Request, corsHeaders: any) {
  const { command, options = {} } = await req.json();

  // Broadcast command execution
  broadcast({ type: "command:queued", command });

  // Here you would integrate with the main orchestrator
  const commandId = crypto.randomUUID();

  // Simulate async execution
  setTimeout(() => {
    broadcast({ type: "command:completed", commandId });
  }, 2000);

  return new Response(
    JSON.stringify({
      command,
      status: "queued",
      id: commandId,
      message: "Command queued for execution",
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleAgents(req: Request, corsHeaders: any) {
  const agents = [
    { id: "autoGPT", name: "AutoGPT", status: "ready", capabilities: ["autonomous", "research", "code"] },
    { id: "babyAGI", name: "BabyAGI", status: "ready", capabilities: ["task-management", "prioritization"] },
    { id: "coder", name: "Coder", status: "ready", capabilities: ["code-generation", "debug", "refactor"] },
    { id: "researcher", name: "Researcher", status: "ready", capabilities: ["web-search", "analysis"] },
    { id: "browser", name: "Browser", status: "ready", capabilities: ["automation", "scraping"] },
    { id: "analyst", name: "Analyst", status: "ready", capabilities: ["data-analysis", "visualization"] },
    { id: "creative", name: "Creative", status: "ready", capabilities: ["image", "video", "audio"] },
  ];

  return new Response(
    JSON.stringify({ agents }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleKnowledge(req: Request, corsHeaders: any) {
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({
        nodes: 0,
        edges: 0,
        lastUpdated: Date.now(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (req.method === "POST") {
    const data = await req.json();

    return new Response(
      JSON.stringify({
        success: true,
        id: crypto.randomUUID(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ error: "Method not allowed" }),
    { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleSearch(req: Request, corsHeaders: any) {
  const { query, engines = ["brave", "duckduckgo"] } = await req.json();

  // Broadcast search started
  broadcast({ type: "search:started", query });

  // Simulate search
  const results = {
    query,
    results: [],
    totalResults: 0,
    timestamp: Date.now()
  };

  broadcast({ type: "search:completed", query, resultsCount: results.totalResults });

  return new Response(
    JSON.stringify(results),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleWorkflows(req: Request, corsHeaders: any) {
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ workflows: [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (req.method === "POST") {
    const workflow = await req.json();

    return new Response(
      JSON.stringify({
        success: true,
        id: crypto.randomUUID(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ error: "Method not allowed" }),
    { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleSettings(req: Request, corsHeaders: any) {
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({
        llm: { defaultProvider: "ollama", defaultModel: "llama3.1:8b" },
        ui: { theme: "dark", accentColor: "sovereign" }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (req.method === "POST") {
    const settings = await req.json();

    broadcast({ type: "settings:updated" });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ error: "Method not allowed" }),
    { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handlePlugins(req: Request, corsHeaders: any) {
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ plugins: [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ error: "Method not allowed" }),
    { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
