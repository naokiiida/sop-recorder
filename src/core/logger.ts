const PREFIX = '[SOP Recorder]';

/**
 * Structured logging utility with [SOP Recorder] prefix.
 * Pure TypeScript — no Chrome API dependencies.
 */
export const Logger = {
  info(component: string, operation: string, context?: Record<string, unknown>): void {
    console.log(PREFIX, `${component}: ${operation}`, {
      ...context,
      timestamp: Date.now(),
    });
  },

  warn(component: string, operation: string, context?: Record<string, unknown>): void {
    console.warn(PREFIX, `${component}: ${operation}`, {
      ...context,
      timestamp: Date.now(),
    });
  },

  error(component: string, operation: string, context?: Record<string, unknown>): void {
    console.error(PREFIX, `${component}: ${operation}`, {
      ...context,
      timestamp: Date.now(),
    });
  },

  debug(component: string, message: string): void {
    console.debug(`${PREFIX} [DEBUG] ${component}: ${message}`);
  },
};
