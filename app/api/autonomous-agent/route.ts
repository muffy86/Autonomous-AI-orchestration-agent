/**
 * API Route for Autonomous Agent OS
 * Provides REST API access to the autonomous agent system
 */

import { NextRequest } from 'next/server';
import {
  createFullFeaturedAgentOS,
  type AutonomousAgentOS,
} from '@/lib/autonomous-agent';

// Singleton instance
let agentOSInstance: AutonomousAgentOS | null = null;

async function getAgentOS(): Promise<AutonomousAgentOS> {
  if (!agentOSInstance) {
    agentOSInstance = await createFullFeaturedAgentOS(
      process.env.PUBLIC_AI_API_KEY
    );
  }
  return agentOSInstance;
}

// POST /api/autonomous-agent/task - Submit a new task
export async function POST(request: NextRequest) {
  try {
    const agentOS = await getAgentOS();
    const body = await request.json();

    const { type, description, input } = body;

    if (!type || !description) {
      return Response.json(
        { error: 'Missing required fields: type, description' },
        { status: 400 }
      );
    }

    const taskId = await agentOS.executeTask({
      type,
      description,
      input,
    });

    const task = await agentOS.orchestrator.getTask(taskId);

    return Response.json({
      success: true,
      taskId,
      task,
    });
  } catch (error) {
    console.error('Task execution error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// GET /api/autonomous-agent/task?id=... - Get task status
export async function GET(request: NextRequest) {
  try {
    const agentOS = await getAgentOS();
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const taskId = searchParams.get('id');

    if (action === 'status') {
      // Get system status
      const status = agentOS.getSystemStatus();
      return Response.json({ success: true, status });
    }

    if (action === 'agents') {
      // Get all agents
      const agents = agentOS.orchestrator.getAgents().map((agent) => ({
        id: agent.config.id,
        name: agent.config.name,
        description: agent.config.description,
        capabilities: agent.config.capabilities,
        metrics: agent.getMetrics(),
      }));
      return Response.json({ success: true, agents });
    }

    if (action === 'tools') {
      // Get all tools
      const tools = agentOS.toolRegistry.getAllTools().map((tool) => ({
        id: tool.metadata.id,
        name: tool.metadata.name,
        description: tool.metadata.description,
        category: tool.metadata.category,
        enabled: tool.isEnabled(),
      }));
      return Response.json({ success: true, tools });
    }

    if (taskId) {
      // Get specific task
      const task = await agentOS.orchestrator.getTask(taskId);
      if (!task) {
        return Response.json(
          { success: false, error: 'Task not found' },
          { status: 404 }
        );
      }
      return Response.json({ success: true, task });
    }

    // Default: return all tasks
    const metrics = agentOS.orchestrator.getMetrics();
    return Response.json({ success: true, metrics });
  } catch (error) {
    console.error('GET error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// PUT /api/autonomous-agent/tool - Execute a tool
export async function PUT(request: NextRequest) {
  try {
    const agentOS = await getAgentOS();
    const body = await request.json();

    const { toolId, parameters } = body;

    if (!toolId || !parameters) {
      return Response.json(
        { error: 'Missing required fields: toolId, parameters' },
        { status: 400 }
      );
    }

    const execution = await agentOS.toolRegistry.executeTool(
      toolId,
      parameters
    );

    return Response.json({
      success: true,
      execution,
    });
  } catch (error) {
    console.error('Tool execution error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// DELETE /api/autonomous-agent - Shutdown the agent OS
export async function DELETE() {
  try {
    if (agentOSInstance) {
      await agentOSInstance.shutdown();
      agentOSInstance = null;
    }

    return Response.json({
      success: true,
      message: 'Agent OS shutdown successfully',
    });
  } catch (error) {
    console.error('Shutdown error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
