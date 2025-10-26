/**
 * Unified Logger Service - Automation Global v4.0
 * Sistema de logging estruturado e centralizado
 * 
 * Substitui console.log() por um sistema profissional de logs
 */

import { Request } from 'express';

// ========================================
// TYPES & ENUMS
// ========================================

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

export interface LogContext {
  requestId?: string;
  userId?: string;
  organizationId?: string;
  userEmail?: string;
  method?: string;
  endpoint?: string;
  ip?: string;
  userAgent?: string;
  duration?: number;
  statusCode?: number;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  stack?: string;
}

// ========================================
// LOGGER CLASS
// ========================================

class Logger {
  private appName = 'AutomationGlobal';
  private env = process.env.NODE_ENV || 'development';
  private minLevel: LogLevel;
  
  // In-memory log storage (rotativo)
  private logs: LogEntry[] = [];
  private maxLogs = 5000;

  constructor() {
    // Definir nível mínimo baseado no ambiente
    this.minLevel = this.env === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
  }

  /**
   * Verifica se deve logar baseado no nível mínimo
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.CRITICAL];
    const currentIndex = levels.indexOf(level);
    const minIndex = levels.indexOf(this.minLevel);
    return currentIndex >= minIndex;
  }

  /**
   * Formata a mensagem de log
   */
  private formatMessage(level: LogLevel, message: string, context: LogContext): string {
    const timestamp = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const color = this.getColor(level);
    const reset = '\x1b[0m';
    
    // Formato: HH:MM:SS LEVEL [requestId] message {context}
    let formatted = `${timestamp} ${color}${level.padEnd(8)}${reset}`;
    
    if (context.requestId) {
      formatted += ` [${context.requestId}]`;
    }
    
    formatted += ` ${message}`;
    
    // Adicionar contexto relevante
    const contextStr = JSON.stringify(context);
    if (contextStr !== '{}') {
      formatted += ` ${contextStr}`;
    }
    
    return formatted;
  }

  /**
   * Retorna código de cor ANSI para o nível
   */
  private getColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '\x1b[36m'; // Cyan
      case LogLevel.INFO: return '\x1b[32m';  // Green
      case LogLevel.WARN: return '\x1b[33m';  // Yellow
      case LogLevel.ERROR: return '\x1b[31m'; // Red
      case LogLevel.CRITICAL: return '\x1b[35m'; // Magenta
      default: return '\x1b[0m'; // Reset
    }
  }

  /**
   * Log genérico
   */
  private log(level: LogLevel, message: string, context: LogContext = {}, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      stack: error?.stack
    };

    // Armazenar em memória (com rotação)
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Output no console
    const formatted = this.formatMessage(level, message, context);
    console.log(formatted);

    // Se for erro, também printar o stack
    if (error && error.stack) {
      console.error(error.stack);
    }
  }

  // ========================================
  // PUBLIC METHODS - Level específicos
  // ========================================

  /**
   * DEBUG: Informações de debug/desenvolvimento
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * INFO: Informações gerais do sistema
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * WARN: Avisos que não são erros mas merecem atenção
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * ERROR: Erros que precisam ser investigados
   */
  error(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * CRITICAL: Erros críticos que podem derrubar o sistema
   */
  critical(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.CRITICAL, message, context, error);
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Extrai contexto de um Request do Express
   */
  extractRequestContext(req: Request): LogContext {
    return {
      requestId: (req as any).requestId || this.generateRequestId(),
      userId: (req as any).user?.id,
      organizationId: (req as any).user?.organizationId || (req as any).tenant?.organizationId,
      userEmail: (req as any).user?.email,
      method: req.method,
      endpoint: req.route?.path || req.path,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };
  }

  /**
   * Gera um ID único para request
   */
  generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log de request HTTP
   */
  logRequest(req: Request, message: string, additionalContext?: LogContext): void {
    const context = {
      ...this.extractRequestContext(req),
      ...additionalContext
    };
    this.info(message, context);
  }

  /**
   * Log de response HTTP
   */
  logResponse(req: Request, statusCode: number, duration: number): void {
    const context = {
      ...this.extractRequestContext(req),
      statusCode,
      duration: Math.round(duration * 100) / 100 // 2 casas decimais
    };
    
    const level = statusCode >= 500 ? LogLevel.ERROR :
                  statusCode >= 400 ? LogLevel.WARN :
                  LogLevel.INFO;
    
    this.log(level, 'Request completed', context);
  }

  /**
   * Retorna logs armazenados
   */
  getLogs(limit: number = 100): LogEntry[] {
    return this.logs.slice(-limit);
  }

  /**
   * Limpa logs armazenados
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Estatísticas de logs
   */
  getStats(): {
    total: number;
    byLevel: Record<LogLevel, number>;
    oldestLog?: string;
    newestLog?: string;
  } {
    const stats = {
      total: this.logs.length,
      byLevel: {
        [LogLevel.DEBUG]: 0,
        [LogLevel.INFO]: 0,
        [LogLevel.WARN]: 0,
        [LogLevel.ERROR]: 0,
        [LogLevel.CRITICAL]: 0
      },
      oldestLog: this.logs[0]?.timestamp,
      newestLog: this.logs[this.logs.length - 1]?.timestamp
    };

    this.logs.forEach(log => {
      stats.byLevel[log.level]++;
    });

    return stats;
  }
}

// ========================================
// SINGLETON EXPORT
// ========================================

export const logger = new Logger();

// Para compatibilidade com código antigo
export default logger;

