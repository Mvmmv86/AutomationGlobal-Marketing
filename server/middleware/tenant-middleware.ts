// server/middleware/tenant-middleware.ts
import { Request, Response, NextFunction } from 'express';
import { organizationService, UserOrganization } from '../services/organization-service.js';

// Estender tipos do Express para incluir tenant context
declare global {
  namespace Express {
    interface Request {
      tenant?: {
        organization: UserOrganization['organization'];
        membership: UserOrganization['membership'];
        organizationId: string;
        userId: string;
        role: string;
        permissions: Record<string, any>;
      };
    }
  }
}

// Middleware para extrair contexto da organização
export const extractTenantContext = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verificar se usuário está autenticado
    if (!req.user) {
      return next(); // Continua sem tenant context
    }

    // Tentar extrair organizationId de diferentes fontes
    let organizationId: string | undefined;

    // 1. Header X-Organization-ID
    organizationId = req.headers['x-organization-id'] as string;

    // 2. Query parameter org_id
    if (!organizationId) {
      organizationId = req.query.org_id as string;
    }

    // 3. Body organizationId
    if (!organizationId && req.body?.organizationId) {
      organizationId = req.body.organizationId;
    }

    // 4. URL parameter organizationId (para rotas como /api/organizations/:organizationId/...)
    if (!organizationId && req.params.organizationId) {
      organizationId = req.params.organizationId;
    }

    // 5. Se não encontrou, usar a primeira organização do usuário
    if (!organizationId) {
      const userOrgs = await organizationService.getUserOrganizations(req.user.id);
      if (userOrgs.length > 0) {
        organizationId = userOrgs[0].organization.id;
        console.log(`📍 Auto-selected organization: ${organizationId} for user ${req.user.id}`);
      }
    }

    if (organizationId) {
      // Verificar acesso e obter contexto completo
      const tenantContext = await organizationService.switchOrganizationContext(req.user.id, organizationId);

      req.tenant = {
        organization: tenantContext.organization,
        membership: tenantContext.membership,
        organizationId: tenantContext.organization.id,
        userId: req.user.id,
        role: tenantContext.membership.role,
        permissions: tenantContext.membership.permissions
      };

      console.log(`🏢 Tenant context set: ${req.tenant.organization.name} (${req.tenant.role})`);
    }

    next();
  } catch (error: any) {
    console.warn('⚠️ Tenant context extraction error (continuing):', error.message);
    next(); // Continua sem tenant context
  }
};

// Middleware que requer contexto de organização
export const requireTenant = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  // Se não tem tenant context, tentar extrair automaticamente
  if (!req.tenant) {
    try {
      const userOrgs = await organizationService.getUserOrganizations(req.user.id);
      if (userOrgs.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'User has no organization access',
          code: 'NO_ORGANIZATION_ACCESS'
        });
      }

      // Auto-selecionar primeira organização disponível
      const tenantContext = await organizationService.switchOrganizationContext(req.user.id, userOrgs[0].organization.id);
      
      req.tenant = {
        organization: tenantContext.organization,
        membership: tenantContext.membership,
        organizationId: tenantContext.organization.id,
        userId: req.user.id,
        role: tenantContext.membership.role,
        permissions: tenantContext.membership.permissions
      };

      console.log(`🔄 Auto-selected tenant context: ${req.tenant.organization.name} (${req.tenant.role})`);
    } catch (error) {
      return res.status(403).json({
        success: false,
        message: 'Active organization required',
        code: 'ORGANIZATION_CONTEXT_REQUIRED'
      });
    }
  }

  next();
};

// Middleware para verificar permissão específica no tenant
export const requireTenantPermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        message: 'Organization context required',
        code: 'ORGANIZATION_CONTEXT_REQUIRED'
      });
    }

    // Super admin sempre tem todas as permissões
    if (req.tenant.role === 'super_admin') {
      return next();
    }

    // Verificar se tem a permissão específica ou wildcard
    const hasPermission = req.tenant.permissions.includes(permission) || 
                         req.tenant.permissions.includes('*');

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Permission denied. Required: ${permission}`,
        code: 'TENANT_PERMISSION_DENIED',
        required: permission,
        userPermissions: req.tenant.permissions,
        userRole: req.tenant.role
      });
    }

    console.log(`✅ Tenant permission granted: ${permission} for ${req.user?.email}`);
    next();
  };
};

// Middleware para verificar role específico no tenant
export const requireTenantRole = (roles: string | string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        message: 'Organization context required',
        code: 'ORGANIZATION_CONTEXT_REQUIRED'
      });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.tenant.role)) {
      return res.status(403).json({
        success: false,
        message: `Role access denied. Required: ${allowedRoles.join(' or ')}`,
        code: 'TENANT_ROLE_DENIED',
        required: allowedRoles,
        userRole: req.tenant.role
      });
    }

    console.log(`✅ Tenant role access granted: ${req.tenant.role} for ${req.user?.email}`);
    next();
  };
};

// Middleware para isolar dados por organização (usado em queries)
export const isolateByTenant = (req: Request, res: Response, next: NextFunction) => {
  if (!req.tenant) {
    return res.status(400).json({
      success: false,
      message: 'Organization context required for data isolation',
      code: 'TENANT_ISOLATION_REQUIRED'
    });
  }

  // Adicionar filtro de organização automaticamente às queries
  // Isso pode ser usado pelos controllers para garantir isolamento
  req.query.organizationId = req.tenant.organizationId;

  console.log(`🔒 Data isolation applied for organization: ${req.tenant.organizationId}`);
  next();
};

// Middleware para logging de ações multi-tenant
export const auditTenantAction = (action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;

    res.json = function(body) {
      // Log da ação após response
      if (req.tenant && req.user) {
        console.log(`📊 Tenant Action: ${action}`, {
          userId: req.user.id,
          organizationId: req.tenant.organizationId,
          role: req.tenant.role,
          timestamp: new Date().toISOString(),
          endpoint: `${req.method} ${req.originalUrl}`,
          success: body?.success !== false
        });
      }

      return originalJson.call(this, body);
    };

    next();
  };
};

// Middleware combinado para rotas multi-tenant completas
export const fullTenantMiddleware = [
  extractTenantContext,
  requireTenant,
  isolateByTenant
];

// Middleware para administradores de organização
export const requireOrgAdmin = [
  extractTenantContext,
  requireTenant,
  requireTenantRole(['super_admin', 'org_admin'])
];

// Middleware para gerentes e acima
export const requireManager = [
  extractTenantContext,
  requireTenant,
  requireTenantRole(['super_admin', 'org_admin', 'manager'])
];

export default {
  extractTenantContext,
  requireTenant,
  requireTenantPermission,
  requireTenantRole,
  isolateByTenant,
  auditTenantAction,
  fullTenantMiddleware,
  requireOrgAdmin,
  requireManager
};