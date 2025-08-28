import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    organizationId?: string;
    role?: string;
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    authService.verifyToken(token)
      .then(decoded => {
        req.user = {
          userId: decoded.userId,
          organizationId: decoded.organizationId,
          role: decoded.role,
        };
        next();
      })
      .catch(error => {
        res.status(401).json({ message: 'Invalid token', error: error.message });
      });
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
}

export function requireOrganization(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user?.organizationId) {
    return res.status(403).json({ message: 'Organization context required' });
  }
  next();
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
}

export function requirePermission(resource: string, action: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.userId || !req.user?.organizationId) {
        return res.status(403).json({ message: 'Authentication and organization context required' });
      }

      const hasPermission = await authService.validatePermission(
        req.user.userId,
        req.user.organizationId,
        resource,
        action
      );

      if (!hasPermission) {
        return res.status(403).json({ message: `Insufficient permissions for ${resource}.${action}` });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: 'Permission check failed', error: error.message });
    }
  };
}
