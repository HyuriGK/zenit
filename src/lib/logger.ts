/**
 * Logger estruturado para a aplicação
 * Em desenvolvimento: logs detalhados no console
 * Em produção: logs sanitizados (sem stack traces)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  endpoint?: string;
  [key: string]: unknown;
}

const isDev = process.env.NODE_ENV === 'development';

/**
 * Sanitiza erros para produção removendo stack traces
 */
function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Erro desconhecido';
}

/**
 * Formata log para produção (JSON estruturado)
 */
function formatProductionLog(
  level: LogLevel,
  message: string,
  error?: unknown,
  context?: LogContext
): string {
  return JSON.stringify({
    level,
    message,
    error: error ? sanitizeError(error) : undefined,
    context,
    timestamp: new Date().toISOString(),
  });
}

export const logger = {
  /**
   * Log de erro - use para erros que precisam ser investigados
   */
  error: (message: string, error?: unknown, context?: LogContext): void => {
    if (isDev) {
      console.error(`[ERROR] ${message}`, error, context);
    } else {
      console.error(formatProductionLog('error', message, error, context));
    }
  },

  /**
   * Log de warning - use para situações inesperadas mas não críticas
   */
  warn: (message: string, context?: LogContext): void => {
    if (isDev) {
      console.warn(`[WARN] ${message}`, context);
    } else {
      console.warn(formatProductionLog('warn', message, undefined, context));
    }
  },

  /**
   * Log de info - use para eventos importantes
   */
  info: (message: string, context?: LogContext): void => {
    if (isDev) {
      console.log(`[INFO] ${message}`, context);
    }
    // Em produção, info logs são omitidos para reduzir ruído
  },

  /**
   * Log de debug - apenas em desenvolvimento
   */
  debug: (message: string, context?: LogContext): void => {
    if (isDev) {
      console.log(`[DEBUG] ${message}`, context);
    }
  },
};
