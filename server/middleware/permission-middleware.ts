// server/middleware/permission-middleware.ts
import { Request, Response, NextFunction } from 'express';
import { PermissionService, ACTIONS, RESOURCES } from '../services/permission-service';
// Simple error class for permissions
class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Middleware para verificar permissões específicas
 */
export const requirePermission = (action: string, resource: string) => {
  return (req: Request & { tenant?: any, user?: any }, res: Response, next: NextFunction) => {
    try {
      // Verificar se usuário está autenticado
      if (!req.user) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      // Verificar se tem contexto tenant para recursos organizacionais
      if (resource !== RESOURCES.ALL && !req.tenant) {
        throw new AppError('Active organization required', 403, 'TENANT_REQUIRED');
      }

      const userRole = req.tenant?.role || 'org_viewer';
      
      // Verificar permissão
      const hasPermission = PermissionService.hasPermission(
        userRole,
        action,
        resource,
        {
          userId: req.user.id,
          organizationId: req.tenant?.organizationId,
          self: req.params?.userId === req.user.id
        }
      );

      if (!hasPermission) {
        console.warn(`⚠️ Permission denied: ${userRole} tried ${action}:${resource}`);
        throw new AppError(
          `Insufficient permissions. Required: ${action}:${resource}`,
          403,
          'PERMISSION_DENIED',
          {
            required: { action, resource },
            current: { role: userRole, organizationId: req.tenant?.organizationId }
          }
        );
      }

      console.log(`✅ Permission granted: ${userRole} can ${action}:${resource}`);
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware para verificar se usuário é admin
 */
export const requireAdmin = requirePermission(ACTIONS.ALL, RESOURCES.ALL);

/**
 * Middleware para verificar se usuário pode gerenciar organização
 */
export const requireOrgManager = requirePermission(ACTIONS.UPDATE, RESOURCES.ORGANIZATION);

/**
 * Middleware para verificar se usuário pode gerenciar usuários
 */
export const requireUserManager = requirePermission(ACTIONS.UPDATE, RESOURCES.USERS);

/**
 * Middleware para verificar se usuário pode acessar billing
 */
export const requireBillingAccess = requirePermission(ACTIONS.READ, RESOURCES.BILLING);

/**
 * Middleware para verificar se usuário pode usar IA
 */
export const requireAIAccess = requirePermission(ACTIONS.USE, RESOURCES.AI);

/**
 * Middleware para verificar múltiplas permissões (OR logic)
 */
export const requireAnyPermission = (permissions: Array<{action: string, resource: string}>) => {
  return (req: Request & { tenant?: any, user?: any }, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      if (!req.tenant) {
        throw new AppError('Active organization required', 403, 'TENANT_REQUIRED');
      }

      const userRole = req.tenant.role;
      let hasAnyPermission = false;

      for (const { action, resource } of permissions) {
        if (PermissionService.hasPermission(userRole, action, resource, {
          userId: req.user.id,
          organizationId: req.tenant.organizationId,
          self: req.params?.userId === req.user.id
        })) {
          hasAnyPermission = true;
          break;
        }
      }

      if (!hasAnyPermission) {
        console.warn(`⚠️ Permission denied: ${userRole} needs any of:`, permissions);
        throw new AppError(
          'Insufficient permissions for any of the required actions',
          403,
          'PERMISSION_DENIED',
          { required: permissions, current: { role: userRole } }
        );
      }

      console.log(`✅ Permission granted: ${userRole} has required permissions`);
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware para verificar múltiplas permissões (AND logic)
 */
export const requireAllPermissions = (permissions: Array<{action: string, resource: string}>) => {
  return (req: Request & { tenant?: any, user?: any }, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      if (!req.tenant) {
        throw new AppError('Active organization required', 403, 'TENANT_REQUIRED');
      }

      const userRole = req.tenant.role;

      for (const { action, resource } of permissions) {
        const hasPermission = PermissionService.hasPermission(userRole, action, resource, {
          userId: req.user.id,
          organizationId: req.tenant.organizationId,
          self: req.params?.userId === req.user.id
        });

        if (!hasPermission) {
          console.warn(`⚠️ Permission denied: ${userRole} missing ${action}:${resource}`);
          throw new AppError(
            `Insufficient permissions. Missing: ${action}:${resource}`,
            403,
            'PERMISSION_DENIED',
            { 
              required: permissions,
              missing: { action, resource },
              current: { role: userRole } 
            }
          );
        }
      }

      console.log(`✅ All permissions granted: ${userRole} has all required permissions`);
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware para verificar se usuário pode acessar recurso próprio ou tem permissão admin
 */
export const requireSelfOrPermission = (action: string, resource: string) => {
  return (req: Request & { tenant?: any, user?: any }, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      const userRole = req.tenant?.role || 'org_viewer';
      const targetUserId = req.params?.userId || req.params?.id;
      const isSelf = targetUserId === req.user.id;

      // Se é o próprio usuário, permitir
      if (isSelf) {
        console.log(`✅ Self access granted: user ${req.user.id}`);
        return next();
      }

      // Senão, verificar permissão administrativa
      const hasPermission = PermissionService.hasPermission(
        userRole,
        action,
        resource,
        {
          userId: req.user.id,
          organizationId: req.tenant?.organizationId
        }
      );

      if (!hasPermission) {
        console.warn(`⚠️ Permission denied: ${userRole} cannot access other user's ${resource}`);
        throw new AppError(
          'Cannot access other user\'s resources without proper permissions',
          403,
          'PERMISSION_DENIED',
          { required: { action, resource }, current: { role: userRole } }
        );
      }

      console.log(`✅ Admin access granted: ${userRole} can ${action}:${resource}`);
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware para adicionar informações de permissões ao contexto da requisição
 */
export const enrichWithPermissions = (req: Request & { tenant?: any, user?: any }, res: Response, next: NextFunction) => {
  if (req.tenant && req.tenant.role) {
    // Adicionar capacidades do role ao contexto
    req.tenant.capabilities = PermissionService.getRoleCapabilities(req.tenant.role);
    
    // Adicionar função helper para verificar permissões
    req.tenant.can = (action: string, resource: string, context?: Record<string, any>) => {
      return PermissionService.hasPermission(
        req.tenant.role,
        action,
        resource,
        { ...context, userId: req.user?.id, organizationId: req.tenant?.organizationId }
      );
    };

    console.log(`🔐 Permissions enriched for ${req.tenant.role} in org ${req.tenant.organizationId}`);
  }

  next();
};