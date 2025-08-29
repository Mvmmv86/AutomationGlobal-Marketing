// server/middleware/auth-middleware.ts
import { Request, Response, NextFunction } from 'express';
import { authService, SessionData, AuthUser } from '../services/auth-service.js';

// Estender tipos do Express para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      session?: SessionData;
    }
  }
}

// Middleware para verificar autenticação
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No authorization header provided',
        code: 'NO_AUTH_HEADER'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
        code: 'NO_TOKEN'
      });
    }

    // Verificar token
    const session = authService.verifyToken(token);
    
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // Adicionar session ao request
    req.session = session;
    
    // Criar objeto user baseado na session
    req.user = {
      id: session.userId,
      email: session.email,
      username: session.email.split('@')[0], // temporário
      emailVerified: true, // temporário
      organizationId: session.organizationId,
      role: session.role,
      permissions: session.permissions
    };

    console.log(`🔐 User authenticated: ${req.user.email} (${req.user.id})`);
    next();

  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      code: 'AUTH_FAILED',
      error: error.message
    });
  }
};

// Middleware opcional de autenticação (não bloqueia se não autenticado)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next(); // Continua sem autenticação
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return next(); // Continua sem autenticação
    }

    // Verificar token
    const session = authService.verifyToken(token);
    
    if (session) {
      req.session = session;
      req.user = {
        id: session.userId,
        email: session.email,
        username: session.email.split('@')[0],
        emailVerified: true,
        organizationId: session.organizationId,
        role: session.role,
        permissions: session.permissions
      };
      
      console.log(`🔐 Optional auth: User ${req.user.email} authenticated`);
    }

    next();

  } catch (error) {
    console.warn('⚠️ Optional auth error (continuing):', error.message);
    next(); // Continua mesmo com erro
  }
};

// Middleware para verificar permissões específicas
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userPermissions = req.user.permissions || [];
    
    if (!userPermissions.includes(permission) && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: `Permission denied. Required: ${permission}`,
        code: 'PERMISSION_DENIED',
        required: permission,
        userPermissions
      });
    }

    console.log(`✅ Permission granted: ${permission} for ${req.user.email}`);
    next();
  };
};

// Middleware para verificar role específico
export const requireRole = (roles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    const userRole = req.user.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Role access denied. Required: ${allowedRoles.join(' or ')}`,
        code: 'ROLE_DENIED',
        required: allowedRoles,
        userRole
      });
    }

    console.log(`✅ Role access granted: ${userRole} for ${req.user.email}`);
    next();
  };
};

// Middleware para verificar organização
export const requireOrganization = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  if (!req.user.organizationId) {
    return res.status(403).json({
      success: false,
      message: 'Organization access required',
      code: 'ORGANIZATION_REQUIRED'
    });
  }

  console.log(`✅ Organization access: ${req.user.organizationId} for ${req.user.email}`);
  next();
};

// Middleware de rate limiting por usuário
export const userRateLimit = (maxRequests: number, windowMs: number = 60000) => {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();

    let userRequests = requestCounts.get(userId);

    if (!userRequests || now > userRequests.resetTime) {
      userRequests = {
        count: 1,
        resetTime: now + windowMs
      };
      requestCounts.set(userId, userRequests);
      return next();
    }

    if (userRequests.count >= maxRequests) {
      const timeUntilReset = Math.ceil((userRequests.resetTime - now) / 1000);
      
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: timeUntilReset,
        limit: maxRequests,
        windowMs
      });
    }

    userRequests.count++;
    next();
  };
};

export default {
  requireAuth,
  optionalAuth,
  requirePermission,
  requireRole,
  requireOrganization,
  userRateLimit
};