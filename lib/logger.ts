type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    // Set log level from environment variable or default to 'info'
    this.logLevel = (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(entry: LogEntry): string {
    const { level, message, timestamp, context, error } = entry;
    let formatted = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (context && Object.keys(context).length > 0) {
      formatted += ` | Context: ${JSON.stringify(context)}`;
    }

    if (error) {
      formatted += ` | Error: ${error.message}`;
      if (error.stack) {
        formatted += ` | Stack: ${error.stack}`;
      }
    }

    return formatted;
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ) {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    };

    const formattedMessage = this.formatMessage(entry);

    // Console logging
    switch (level) {
      case 'debug':
        console.debug(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        break;
    }

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production' && level === 'error') {
      // Example: Send to Sentry, LogRocket, etc.
      // this.sendToErrorTracking(entry);
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log('error', message, context, error);
  }

  // API route logging helper
  logApiRequest(
    method: string,
    path: string,
    statusCode: number,
    duration?: number,
    error?: Error
  ) {
    const context = {
      method,
      path,
      statusCode,
      duration: duration ? `${duration}ms` : undefined,
    };

    if (error || statusCode >= 400) {
      this.error(`API ${method} ${path} failed`, error, context);
    } else {
      this.info(`API ${method} ${path}`, context);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for use in other files
export type { LogLevel, LogEntry };
