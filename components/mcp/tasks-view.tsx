'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function TasksView() {
  const tasks = []; // Would connect to orchestrator
  
  return (
    <div className="space-y-2">
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tasks running. Create a workflow to get started.</p>
      ) : (
        tasks.map((t: any) => (
          <Card key={t.id} className="p-4">
            <div className="flex items-center justify-between">
              <span>{t.name}</span>
              <Badge>{t.status}</Badge>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
