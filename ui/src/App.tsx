import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Cpu, Play } from 'lucide-react';
import { SystemState, StreamLog } from './types';

export default function App() {
  const [sysState, setSysState] = useState<SystemState>({
    status: 'EXECUTING',
    uptime: '00:00:00',
    activeMemoryTokens: 0,
    cpuUsage: 0,
    vramAllocation: '0 GB / 16 GB'
  });
  
  const [logs, setLogs] = useState<StreamLog[]>([]);
  const [inputCmd, setInputCmd] = useState('');
  const [connected, setConnected] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch('/api/state');
        const data = await res.json();
        setSysState({
          status: data.status,
          uptime: data.uptime,
          activeMemoryTokens: data.active_memory_tokens,
          cpuUsage: data.cpu_usage,
          vramAllocation: data.vram_allocation
        });
        setConnected(true);
      } catch (e) {
        setConnected(false);
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 2000);
    
    setLogs([
      { id: '1', timestamp: new Date().toLocaleTimeString(), source: 'SYSTEM', level: 'INFO', message: 'Core Core Rust engine bound successfully.' },
      { id: '2', timestamp: new Date().toLocaleTimeString(), source: 'AGENT', level: 'SUCCESS', message: 'Awaiting execution loops.' }
    ]);

    return () => clearInterval(interval);
  }, []);

  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCmd.trim()) return;

    setLogs(prev => [...prev, {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      source: 'SYSTEM',
      level: 'INFO',
      message: `Direct Command Dispatched: ${inputCmd}`
    }]);

    try {
      await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: inputCmd })
      });
    } catch (err) {
      setLogs(prev => [...prev, {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        source: 'SYSTEM',
        level: 'ERROR',
        message: 'Endpoint dropped.'
      }]);
    }
    setInputCmd('');
  };

  return (
    <div className="flex flex-col h-screen w-screen p-4 gap-4 overflow-hidden bg-zinc-950 text-zinc-50 font-mono">
      <header className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-3">
          <div className={`h-2.5 w-2.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <h1 className="text-md font-bold tracking-wider uppercase">Sovereign Control Node</h1>
        </div>
        <div className="flex gap-6 text-xs text-zinc-400">
          <span>DAEMON STATE: <strong className="text-emerald-400">{sysState.status}</strong></span>
          <span>UPTIME: <strong className="text-zinc-200">{sysState.uptime}</strong></span>
        </div>
      </header>

      <div className="grid grid-cols-12 flex-1 gap-4 overflow-hidden">
        <aside className="col-span-3 border border-zinc-800 bg-zinc-900/40 p-4 rounded flex flex-col gap-6">
          <h2 className="text-xs uppercase font-bold tracking-widest text-zinc-400 flex items-center gap-2">
            <Cpu size={14} /> Telemetry Matrix
          </h2>
          <div className="space-y-4 text-xs">
            <div className="bg-zinc-950 p-3 border border-zinc-800/80 rounded">
              <span className="text-zinc-500 block mb-1">VRAM Footprint</span>
              <div>{sysState.vramAllocation}</div>
            </div>
            <div className="bg-zinc-950 p-3 border border-zinc-800/80 rounded">
              <span className="text-zinc-500 block mb-1">Active Context</span>
              <div>{sysState.activeMemoryTokens.toLocaleString()} tokens</div>
            </div>
          </div>
        </aside>

        <main className="col-span-9 border border-zinc-800 bg-zinc-950 rounded flex flex-col overflow-hidden">
          <div className="flex-1 p-4 overflow-y-auto text-xs space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 border-b border-zinc-900/30 pb-1">
                <span className="text-zinc-600">[{log.timestamp}]</span>
                <span className="font-bold text-indigo-400">[{log.source}]</span>
                <span className={log.level === 'ERROR' ? 'text-rose-400' : 'text-zinc-300'}>{log.message}</span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>

          <form onSubmit={handleSendCommand} className="border-t border-zinc-800 p-3 bg-zinc-900/20 flex gap-3">
            <input
              type="text"
              value={inputCmd}
              onChange={(e) => setInputCmd(e.target.value)}
              placeholder="Inject manual system prompt intercept loop..."
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs focus:outline-none focus:border-zinc-700 text-zinc-200"
            />
            <button type="submit" className="bg-zinc-100 text-zinc-950 text-xs px-4 py-2 rounded font-bold flex items-center gap-2">
              <Play size={12} fill="currentColor" /> EXECUTE
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}
