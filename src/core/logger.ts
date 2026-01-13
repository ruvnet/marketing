/**
 * Logger - Structured Logging for Agent Swarm
 * Uses pino for high-performance JSON logging
 */

import pino from 'pino';
import type { AgentId } from '../types/index.js';

export interface LogContext {
  agentId?: AgentId;
  taskId?: string;
  campaignId?: string;
  correlationId?: string;
  [key: string]: unknown;
}

export interface Logger {
  debug(msg: string, context?: LogContext): void;
  info(msg: string, context?: LogContext): void;
  warn(msg: string, context?: LogContext): void;
  error(msg: string, error?: Error, context?: LogContext): void;
  child(context: LogContext): Logger;
}

const logLevel = process.env.LOG_LEVEL ?? 'info';

const pinoLogger = pino({
  level: logLevel,
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  base: {
    service: 'ai-marketing-swarm',
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
});

/**
 * Create a logger wrapper around pino
 */
function createLogger(baseLogger: pino.Logger): Logger {
  return {
    debug(msg: string, context?: LogContext): void {
      baseLogger.debug(context ?? {}, msg);
    },

    info(msg: string, context?: LogContext): void {
      baseLogger.info(context ?? {}, msg);
    },

    warn(msg: string, context?: LogContext): void {
      baseLogger.warn(context ?? {}, msg);
    },

    error(msg: string, error?: Error, context?: LogContext): void {
      const errorContext = error
        ? {
            ...context,
            error: {
              message: error.message,
              name: error.name,
              stack: error.stack,
            },
          }
        : context;
      baseLogger.error(errorContext ?? {}, msg);
    },

    child(context: LogContext): Logger {
      return createLogger(baseLogger.child(context));
    },
  };
}

// Root logger
export const logger = createLogger(pinoLogger);

/**
 * Create a named logger
 */
export function createNamedLogger(name: string): Logger {
  return logger.child({ component: name });
}

// Export createLogger as an alias for createNamedLogger
export { createNamedLogger as createLogger };

/**
 * Create a logger for a specific agent
 */
export function createAgentLogger(agentId: AgentId): Logger {
  return logger.child({ agentId });
}

/**
 * Create a logger for a specific task
 */
export function createTaskLogger(taskId: string, agentId?: AgentId): Logger {
  return logger.child({ taskId, agentId });
}

/**
 * Performance timing utility
 */
export function createTimer(): () => number {
  const start = performance.now();
  return () => Math.round(performance.now() - start);
}

/**
 * Log execution time of async functions
 */
export async function withTiming<T>(
  name: string,
  fn: () => Promise<T>,
  log: Logger = logger
): Promise<T> {
  const timer = createTimer();
  try {
    const result = await fn();
    log.debug(`${name} completed`, { durationMs: timer() });
    return result;
  } catch (error) {
    log.error(`${name} failed`, error as Error, { durationMs: timer() });
    throw error;
  }
}
