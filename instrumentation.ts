import { registerOTel } from '@vercel/otel';
import { validateEnv } from './lib/env';

export function register() {
  // Validate environment variables on startup
  validateEnv();
  
  registerOTel({ serviceName: 'ai-chatbot' });
}
