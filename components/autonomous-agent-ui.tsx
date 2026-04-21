'use client';

/**
 * React UI Component for Autonomous Agent OS
 * Provides a user interface for interacting with the autonomous agent system
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface AgentMetrics {
  id: string;
  name: string;
  tasksExecuted: number;
  successRate: number;
}

interface SystemStatus {
  initialized: boolean;
  orchestration: {
    totalAgents: number;
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    agents: AgentMetrics[];
  };
  tools?: {
    total: number;
    enabled: number;
  };
  blockchain?: {
    chains: string[];
    transactions: number;
  };
}

export function AutonomousAgentUI() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [taskDescription, setTaskDescription] = useState('');
  const [taskType, setTaskType] = useState<'analysis' | 'execution' | 'planning' | 'vision' | 'blockchain'>('execution');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchStatus() {
    try {
      const response = await fetch('/api/autonomous-agent?action=status');
      const data = await response.json();
      if (data.success) {
        setStatus(data.status);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  }

  async function submitTask() {
    if (!taskDescription.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/autonomous-agent/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: taskType,
          description: taskDescription,
          input: {},
        }),
      });

      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        setTaskDescription('');
        fetchStatus();
      }
    } catch (error) {
      setResult({ success: false, error: String(error) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-2xl font-bold mb-4">🤖 Autonomous Agent OS</h2>
        
        {status && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border rounded p-3">
                <div className="text-sm text-muted-foreground">Agents</div>
                <div className="text-2xl font-bold">{status.orchestration.totalAgents}</div>
              </div>
              <div className="border rounded p-3">
                <div className="text-sm text-muted-foreground">Total Tasks</div>
                <div className="text-2xl font-bold">{status.orchestration.totalTasks}</div>
              </div>
              <div className="border rounded p-3">
                <div className="text-sm text-muted-foreground">Completed</div>
                <div className="text-2xl font-bold text-green-600">
                  {status.orchestration.completedTasks}
                </div>
              </div>
              <div className="border rounded p-3">
                <div className="text-sm text-muted-foreground">Failed</div>
                <div className="text-2xl font-bold text-red-600">
                  {status.orchestration.failedTasks}
                </div>
              </div>
            </div>

            {status.tools && (
              <div className="border rounded p-3">
                <div className="text-sm font-medium mb-2">Tools</div>
                <div className="text-sm text-muted-foreground">
                  {status.tools.enabled} of {status.tools.total} enabled
                </div>
              </div>
            )}

            {status.blockchain && (
              <div className="border rounded p-3">
                <div className="text-sm font-medium mb-2">Blockchain</div>
                <div className="text-sm text-muted-foreground">
                  {status.blockchain.chains.length} chains connected
                </div>
                <div className="text-xs mt-1">{status.blockchain.chains.join(', ')}</div>
              </div>
            )}

            <div className="border rounded p-3">
              <div className="text-sm font-medium mb-2">Active Agents</div>
              <div className="space-y-2">
                {status.orchestration.agents.map((agent) => (
                  <div key={agent.id} className="flex justify-between items-center text-sm">
                    <span>{agent.name}</span>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>{agent.tasksExecuted} tasks</span>
                      <span>{agent.successRate.toFixed(1)}% success</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border rounded-lg p-6 bg-card">
        <h3 className="text-xl font-semibold mb-4">Submit Task</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Task Type</label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value as any)}
              className="w-full p-2 border rounded"
            >
              <option value="analysis">Analysis</option>
              <option value="execution">Execution</option>
              <option value="planning">Planning</option>
              <option value="vision">Vision</option>
              <option value="blockchain">Blockchain</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Task Description</label>
            <Textarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Describe what you want the autonomous agents to do..."
              rows={4}
              className="w-full"
            />
          </div>

          <Button
            onClick={submitTask}
            disabled={loading || !taskDescription.trim()}
            className="w-full"
          >
            {loading ? 'Processing...' : 'Submit Task'}
          </Button>
        </div>

        {result && (
          <div className={`mt-4 p-4 rounded border ${
            result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="text-sm font-medium mb-2">
              {result.success ? '✅ Task Submitted' : '❌ Error'}
            </div>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground text-center">
        Autonomous Agent OS - Multi-model orchestration with vision, blockchain, and tool integration
      </div>
    </div>
  );
}
