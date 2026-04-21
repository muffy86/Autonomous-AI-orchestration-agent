/**
 * MCP Control Panel - Main Dashboard
 * Complete UI for all MCP features
 */

import { Metadata } from 'next';
import { MCPDashboard } from './components/dashboard';

export const metadata: Metadata = {
  title: 'MCP Control Panel - Autonomous AI Agent',
  description: 'Control panel for Model Context Protocol autonomous AI system',
};

export default function MCPPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MCPDashboard />
    </div>
  );
}
