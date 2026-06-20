/**
 * Deno Server for Sovereign Browser OS
 */

import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.220.0/http/file_server.ts";

const PORT = 8000;

console.log(`
╔════════════════════════════════════════╗
║   SOVEREIGN BROWSER OS - June 2026    ║
║                                        ║
║   🔐 Uncensored • Private • Sovereign ║
╚════════════════════════════════════════╝

Server running on http://localhost:${PORT}
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

async function handleAPI(req: Request, url: URL, corsHeaders: any) {
  const path = url.pathname.replace("/api/", "");

  try {
    switch (path) {
      case "health":
        return new Response(
          JSON.stringify({ status: "ok", timestamp: Date.now() }),
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

  // Here you would integrate with the main orchestrator
  // For now, return a mock response

  return new Response(
    JSON.stringify({
      command,
      status: "queued",
      id: crypto.randomUUID(),
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
    // Get knowledge graph stats
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
    // Add to knowledge graph
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
