'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function ToolsView() {
  const [tools, setTools] = useState<any[]>([]);
  
  useEffect(() => {
    fetch('http://localhost:3001/api/mcp/tools')
      .then(r => r.json())
      .then(d => setTools(d.tools || []))
      .catch(() => {});
  }, []);
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tools.map(t => (
        <Card key={t.name} className="p-4">
          <h3 className="font-semibold mb-2">{t.name}</h3>
          <p className="text-sm text-muted-foreground mb-3">{t.description}</p>
          <Button size="sm" className="w-full">Execute</Button>
        </Card>
      ))}
    </div>
  );
}
