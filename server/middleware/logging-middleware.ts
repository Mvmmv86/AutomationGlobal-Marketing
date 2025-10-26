/**
 * Logging Middleware - Automation Global v4.0
 * Middleware para logar automaticamente todas as requisições HTTP
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger.js';

/**
 * Middleware que loga todas as requisições HTTP
 */
export function loggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Gerar e atribuir requestId
  const requestId = logger.generateRequestId();
  (req as any).requestId = requestId;

  // Capturar tempo de início
  const startTime = Date.now();

  // Log de início da requisição
  logger.logRequest(req, 'Request started');

  // Interceptar o response.json() para logar quando a resposta for enviada
  const originalJson = res.json.bind(res);
  res.json = function(body: any) {
    const duration = Date.now() - startTime;
    logger.logResponse(req, res.statusCode, duration);
    
    // Log de slow requests (> 2 segundos)
    if (duration > 2000) {
      logger.warn('Slow request detected', {
        endpoint: req.route?.path || req.path,
        method: req.method,
        duration: `${duration}ms`,
        statusCode: res.statusCode
      });
    }
    
    return originalJson(body);
  };

  // Interceptar o response.send() também
  const originalSend = res.send.bind(res);
  res.send = function(body: any) {
    const duration = Date.now() - startTime;
    logger.logResponse(req, res.statusCode, duration);
    
    if (duration > 2000) {
      logger.warn('Slow request detected', {
        endpoint: req.route?.path || req.path,
        method: req.method,
        duration: `${duration}ms`,
        statusCode: res.statusCode
      });
    }
    
    return originalSend(body);
  };

  next();
}

/**
 * Middleware de error logging
 * Captura e loga todos os erros não tratados
 */
export function errorLoggingMiddleware(err: any, req: Request, res: Response, next: NextFunction): void {
  const context = logger.extractRequestContext(req);
  
  logger.error('Unhandled error', {
    ...context,
    errorName: err.name,
    errorCode: err.code,
    statusCode: err.status || err.statusCode || 500
  }, err);

  // Passar para o próximo error handler
  next(err);
}

/**
 * Middleware para logar apenas em desenvolvimento
 */
export function devLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (process.env.NODE_ENV === 'development') {
    logger.debug(`${req.method} ${req.path}`, {
      query: req.query,
      params: req.params,
      body: req.body ? Object.keys(req.body) : undefined
    });
  }
  next();
}

