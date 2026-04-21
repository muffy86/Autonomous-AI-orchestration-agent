/**
 * Comprehensive Logging Infrastructure
 * Automatically logs all important events with proper formatting
 */

import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'security';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  stack?: string;
}

class Logger {
  private logDir: string;
  private logFile: string;
  private securityLogFile: string;
  private errorLogFile: string;

  constructor() {
    this.logDir = join(process.cwd(), 'logs');
    this.logFile = join(this.logDir, 'application.log');
    this.securityLogFile = join(this.logDir, 'security.log');
    this.errorLogFile = join(this.logDir, 'errors.log');

    // Create logs directory if it doesn't exist
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatLog(entry: LogEntry): string {
    const contextStr = entry.context 
      ? `\n  Context: ${JSON.stringify(entry.context, null, 2)}` 
      : '';
    const stackStr = entry.stack ? `\n  Stack: ${entry.stack}` : '';
    
    return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${contextStr}${stackStr}\n`;
  }

  private writeLog(entry: LogEntry, file: string) {
    try {
      const formattedLog = this.formatLog(entry);
      
      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        const colors = {
          info: '\x1b[36m',    // Cyan
          warn: '\x1b[33m',    // Yellow
          error: '\x1b[31m',   // Red
          debug: '\x1b[35m',   // Magenta
          security: '\x1b[41m', // Red background
        };
        
        console.log(`${colors[entry.level]}${formattedLog}\x1b[0m`);
      }
      
      // Write to file
      appendFileSync(file, formattedLog, 'utf8');
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  private createLogEntry(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      stack: error?.stack,
    };
  }

  info(message: string, context?: Record<string, any>) {
    const entry = this.createLogEntry('info', message, context);
    this.writeLog(entry, this.logFile);
  }

  warn(message: string, context?: Record<string, any>) {
    const entry = this.createLogEntry('warn', message, context);
    this.writeLog(entry, this.logFile);
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    const entry = this.createLogEntry('error', message, context, error);
    this.writeLog(entry, this.logFile);
    this.writeLog(entry, this.errorLogFile);
  }

  debug(message: string, context?: Record<string, any>) {
    if (process.env.NODE_ENV === 'development') {
      const entry = this.createLogEntry('debug', message, context);
      this.writeLog(entry, this.logFile);
    }
  }

  security(message: string, context?: Record<string, any>) {
    const entry = this.createLogEntry('security', message, context);
    this.writeLog(entry, this.logFile);
    this.writeLog(entry, this.securityLogFile);
    
    // Send alert for critical security events
    if (context?.severity === 'critical') {
      this.sendSecurityAlert(entry);
    }
  }

  private sendSecurityAlert(entry: LogEntry) {
    // In production, you would send this to your monitoring service
    console.error('🚨 SECURITY ALERT:', entry);
    
    // Examples of integrations you could add:
    // - Send email
    // - Post to Slack
    // - Trigger PagerDuty
    // - Send to Sentry
  }

  // Log HTTP requests
  request(method: string, url: string, statusCode: number, duration: number, userId?: string) {
    this.info('HTTP Request', {
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      userId,
    });
  }

  // Log database queries
  query(query: string, duration: number, error?: Error) {
    if (error) {
      this.error('Database Query Failed', error, {
        query,
        duration: `${duration}ms`,
      });
    } else if (duration > 1000) {
      // Log slow queries
      this.warn('Slow Query Detected', {
        query,
        duration: `${duration}ms`,
      });
    } else {
      this.debug('Database Query', {
        query,
        duration: `${duration}ms`,
      });
    }
  }

  // Log authentication events
  auth(event: string, email: string, success: boolean, reason?: string) {
    const level = success ? 'info' : 'security';
    const message = success 
      ? `Authentication successful: ${event}`
      : `Authentication failed: ${event}`;
    
    this[level](message, {
      email,
      event,
      reason,
    });
  }

  // Log system events
  system(event: string, details?: Record<string, any>) {
    this.info(`System Event: ${event}`, details);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export log rotation function
export function rotateLog() {
  const logger = new Logger();
  const timestamp = new Date().toISOString().split('T')[0];
  
  try {
    const logDir = join(process.cwd(), 'logs');
    const archiveDir = join(logDir, 'archive');
    
    if (!existsSync(archiveDir)) {
      mkdirSync(archiveDir, { recursive: true });
    }
    
    const files = ['application.log', 'security.log', 'errors.log'];
    
    for (const file of files) {
      const filePath = join(logDir, file);
      if (existsSync(filePath)) {
        const archivePath = join(archiveDir, `${file}.${timestamp}`);
        writeFileSync(archivePath, '');
        writeFileSync(filePath, '');
      }
    }
    
    console.log('✅ Log rotation completed');
  } catch (error) {
    console.error('❌ Log rotation failed:', error);
  }
}
