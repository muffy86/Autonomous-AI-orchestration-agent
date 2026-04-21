'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function ProvidersView() {
  const [providers, setProviders] = useState<any[]>([]);
  
  useEffect(() => {
    fetch('http://localhost:3001/api/providers')
      .then(r => r.json())
      .then(d => setProviders(d.providers || []))
      .catch(() => {});
  }, []);
  
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {providers.map(p => (
        <Card key={p.id} className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">{p.name}</h3>
            <Badge variant={p.free ? "default" : "secondary"}>{p.free ? 'FREE' : 'Paid'}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{p.description}</p>
          <div className="text-xs">
            {p.apiKeyConfigured ? '✓ Configured' : `⚠ Add ${p.apiKeyEnv}`}
          </div>
          <div className="mt-2 text-xs">Models: {p.models?.length || 0}</div>
        </Card>
      ))}
    </div>
  );
}
