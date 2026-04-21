'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function WorkflowBuilder() {
  const [steps, setSteps] = useState<any[]>([]);
  
  const addStep = () => setSteps([...steps, { id: Date.now(), action: 'execute_tool', params: {} }]);
  
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={addStep}>Add Step</Button>
        <Button variant="outline">Save Workflow</Button>
        <Button>Execute</Button>
      </div>
      
      <div className="space-y-2">
        {steps.map((step, i) => (
          <Card key={step.id} className="p-4">
            <div className="flex gap-2">
              <Input placeholder="Action" defaultValue={step.action} />
              <Button size="sm" variant="ghost" onClick={() => setSteps(steps.filter((_, idx) => idx !== i))}>✕</Button>
            </div>
          </Card>
        ))}
      </div>
      
      {steps.length === 0 && <p className="text-sm text-muted-foreground">Add steps to build your workflow</p>}
    </div>
  );
}
