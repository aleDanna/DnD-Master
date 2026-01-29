/**
 * Structured logging service
 * Provides consistent logging across all backend services
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  service?: string;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  campaignId?: string;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  duration?: number;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private level: LogLevel;
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.level = (process.env.LOG_LEVEL as LogLevel) || 'info';
    this.context = context;
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    const logger = new Logger({ ...this.context, ...additionalContext });
    logger.level = this.level;
    return logger;
  }

  /**
   * Set the minimum log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  /**
   * Format and output a log entry
   */
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...context },
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    // In production, output structured JSON
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(entry));
    } else {
      // In development, use pretty formatting
      const timestamp = entry.timestamp.split('T')[1].split('.')[0];
      const levelColors: Record<LogLevel, string> = {
        debug: '\x1b[90m', // gray
        info: '\x1b[36m',  // cyan
        warn: '\x1b[33m',  // yellow
        error: '\x1b[31m', // red
      };
      const reset = '\x1b[0m';
      const levelColor = levelColors[level];

      let output = `${levelColor}[${timestamp}] [${level.toUpperCase()}]${reset} ${message}`;

      if (entry.context && Object.keys(entry.context).length > 0) {
        const contextStr = Object.entries(entry.context)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => `${k}=${v}`)
          .join(' ');
        if (contextStr) {
          output += ` ${levelColor}(${contextStr})${reset}`;
        }
      }

      console.log(output);

      if (error) {
        console.error(error.stack || error.message);
      }
    }
  }

  /**
   * Debug level log
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  /**
   * Info level log
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Warning level log
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Error level log
   */
  error(message: string, error?: Error | LogContext, context?: LogContext): void {
    if (error instanceof Error) {
      this.log('error', message, context, error);
    } else {
      this.log('error', message, error as LogContext);
    }
  }

  /**
   * Log with timing information
   */
  timed<T>(message: string, fn: () => T, context?: LogContext): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = Math.round(performance.now() - start);
      this.debug(`${message} completed`, { ...context, duration: `${duration}ms` });
      return result;
    } catch (error) {
      const duration = Math.round(performance.now() - start);
      this.error(`${message} failed`, error as Error, { ...context, duration: `${duration}ms` });
      throw error;
    }
  }

  /**
   * Log async operations with timing
   */
  async timedAsync<T>(message: string, fn: () => Promise<T>, context?: LogContext): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = Math.round(performance.now() - start);
      this.debug(`${message} completed`, { ...context, duration: `${duration}ms` });
      return result;
    } catch (error) {
      const duration = Math.round(performance.now() - start);
      this.error(`${message} failed`, error as Error, { ...context, duration: `${duration}ms` });
      throw error;
    }
  }
}

/**
 * Create a logger instance
 */
export function createLogger(context: LogContext = {}): Logger {
  return new Logger(context);
}

/**
 * Default logger instance
 */
export const logger = createLogger({ service: 'dnd-master' });

export type { LogContext, LogEntry };
export { Logger };
