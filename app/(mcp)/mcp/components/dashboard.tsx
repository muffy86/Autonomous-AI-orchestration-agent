'use client';

/**
 * MCP Dashboard Component
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MCPStatus {
  online: boolean;
  version?: string;
  providers?: number;
  tools?: number;
  skills?: number;
}

export function MCPDashboard() {
  const [status, setStatus] = useState<MCPStatus>({ online: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  async function checkStatus() {
    try {
      const response = await fetch('http://localhost:3001/health');
      const data = await response.json();
      setStatus({ online: true, ...data });
    } catch {
      setStatus({ online: false });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">MCP Control Panel</h2>
        <div className="flex items-center space-x-2">
          <Badge variant={status.online ? "default" : "destructive"}>
            {status.online ? '● Online' : '● Offline'}
          </Badge>
          <Button onClick={checkStatus} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="providers">AI Providers</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="browser">Browser</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <span className="text-2xl">🤖</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {status.online ? 'Running' : 'Stopped'}
                </div>
                <p className="text-xs text-muted-foreground">
                  MCP Server v{status.version || '1.0.0'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Providers</CardTitle>
                <span className="text-2xl">🧠</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">9</div>
                <p className="text-xs text-muted-foreground">
                  Including Ollama (local) & Public AI
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tools</CardTitle>
                <span className="text-2xl">🛠️</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">10</div>
                <p className="text-xs text-muted-foreground">
                  Autonomous capabilities
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Skills</CardTitle>
                <span className="text-2xl">⚡</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">
                  Complex multi-step capabilities
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" variant="outline">
                  🔍 Analyze Current Page
                </Button>
                <Button className="w-full" variant="outline">
                  📝 Fill Form Intelligently
                </Button>
                <Button className="w-full" variant="outline">
                  🤖 Run Autonomous Workflow
                </Button>
                <Button className="w-full" variant="outline">
                  📊 Extract Data
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest tasks and operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>No recent activity</span>
                    <Badge variant="outline">New</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Execute tools and skills to see activity here
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Capabilities</CardTitle>
              <CardDescription>What your autonomous agent can do</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium">🌐 Web Control</div>
                  <p className="text-xs text-muted-foreground">Navigate, click, fill forms</p>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">🔍 Context Aware</div>
                  <p className="text-xs text-muted-foreground">Understand page content</p>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">🤖 Fully Autonomous</div>
                  <p className="text-xs text-muted-foreground">Execute complex workflows</p>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">🔒 Sovereign</div>
                  <p className="text-xs text-muted-foreground">Local models, no cloud</p>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">🚫 Uncensored</div>
                  <p className="text-xs text-muted-foreground">Ollama local models</p>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">⚡ Multi-Model</div>
                  <p className="text-xs text-muted-foreground">9 AI providers</p>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">📱 PWA Ready</div>
                  <p className="text-xs text-muted-foreground">Install as app</p>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">🔄 Offline Mode</div>
                  <p className="text-xs text-muted-foreground">Works without internet</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers">
          <Card>
            <CardHeader>
              <CardTitle>AI Providers</CardTitle>
              <CardDescription>Configured AI model providers</CardDescription>
            </CardHeader>
            <CardContent>
              <ProvidersView />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools">
          <Card>
            <CardHeader>
              <CardTitle>Autonomous Tools</CardTitle>
              <CardDescription>Execute individual tools</CardDescription>
            </CardHeader>
            <CardContent>
              <ToolsView />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle>AI Skills</CardTitle>
              <CardDescription>Complex multi-step capabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <SkillsView />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows">
          <Card>
            <CardHeader>
              <CardTitle>Workflows</CardTitle>
              <CardDescription>Build and run autonomous workflows</CardDescription>
            </CardHeader>
            <CardContent>
              <WorkflowsView />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Task Queue</CardTitle>
              <CardDescription>Monitor running and queued tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <TasksView />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="browser">
          <Card>
            <CardHeader>
              <CardTitle>Browser Automation</CardTitle>
              <CardDescription>Control and automate browser actions</CardDescription>
            </CardHeader>
            <CardContent>
              <BrowserView />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Configure your autonomous agent</CardDescription>
            </CardHeader>
            <CardContent>
              <SettingsView />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProvidersView() {
  return <div className="text-sm">Provider list coming soon...</div>;
}

function ToolsView() {
  return <div className="text-sm">Tools interface coming soon...</div>;
}

function SkillsView() {
  return <div className="text-sm">Skills interface coming soon...</div>;
}

function WorkflowsView() {
  return <div className="text-sm">Workflow builder coming soon...</div>;
}

function TasksView() {
  return <div className="text-sm">Task queue coming soon...</div>;
}

function BrowserView() {
  return <div className="text-sm">Browser automation coming soon...</div>;
}

function SettingsView() {
  return <div className="text-sm">Settings panel coming soon...</div>;
}
