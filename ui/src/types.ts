export interface SystemState {
  status: 'IDLE' | 'EXECUTING' | 'INTERCEPT_REQUIRED' | 'ERROR';
  uptime: string;
  activeMemoryTokens: number;
  cpuUsage: number;
  vramAllocation: string;
}

export interface StreamLog {
  id: string;
  timestamp: string;
  source: 'AGENT' | 'SYSTEM' | 'LLM' | 'TOOL';
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  message: string;
}
