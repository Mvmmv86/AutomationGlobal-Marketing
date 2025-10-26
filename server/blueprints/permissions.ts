// server/blueprints/permissions.ts
import express from 'express';
import { PermissionService, USER_ROLES, ACTIONS, RESOURCES } from '../services/permission-service.js';
import { requireAuth } from '../middleware/auth-unified.js';
import { extractTenantContext } from '../middleware/tenant-middleware.js';
import { AppError } from '../middleware/validation.js';

const router = express.Router();

/**
 * GET /api/permissions/roles
 * Get all available roles and their definitions
 */
router.get('/roles', (req: any, res: any, next: any) => {
  try {
    const roles = PermissionService.getRoleHierarchy().map(role => ({
      role,
      capabilities: PermissionService.getRoleCapabilities(role),
      permissions: PermissionService.getRolePermissions(role)
    }));

    res.json({
      success: true,
      message: 'Role definitions retrieved successfully',
      data: {
        roles,
        hierarchy: PermissionService.getRoleHierarchy()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error getting roles:', error);
    next(new AppError(error.message, 500, 'ROLES_ERROR'));
  }
});

/**
 * GET /api/permissions/check
 * Check if user has specific permissions
 */
router.get('/check',
  requireAuth,
  extractTenantContext,
  (req: any, res: any, next: any) => {
    try {
      const { action, resource } = req.query;
      
      if (!action || !resource) {
        throw new AppError('action and resource query parameters are required', 400, 'MISSING_PARAMETERS');
      }

      if (!req.tenant) {
        throw new AppError('Active organization context required', 403, 'TENANT_REQUIRED');
      }

      const hasPermission = PermissionService.hasPermission(
        req.tenant.role,
        action,
        resource,
        {
          userId: req.user.id,
          organizationId: req.tenant.organizationId
        }
      );

      res.json({
        success: true,
        message: 'Permission check completed',
        data: {
          hasPermission,
          role: req.tenant.role,
          action,
          resource,
          organizationId: req.tenant.organizationId
        },
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('❌ Permission check error:', error);
      next(new AppError(error.message, error.statusCode || 500, 'PERMISSION_CHECK_ERROR'));
    }
  }
);

/**
 * GET /api/permissions/matrix
 * Get permission matrix for current user's role
 */
router.get('/matrix',
  requireAuth,
  extractTenantContext,
  (req: any, res: any, next: any) => {
    try {
      if (!req.tenant) {
        throw new AppError('Active organization context required', 403, 'TENANT_REQUIRED');
      }

      const role = req.tenant.role;
      const capabilities = PermissionService.getRoleCapabilities(role);
      const permissions = PermissionService.getRolePermissions(role);
      const expandedPermissions = PermissionService.expandPermissionsForRole(role);

      // Create a matrix for common actions and resources
      const actions = [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.USE];
      const resources = [
        RESOURCES.ORGANIZATION,
        RESOURCES.USERS,
        RESOURCES.SETTINGS,
        RESOURCES.AI,
        RESOURCES.MODULES,
        RESOURCES.AUTOMATIONS,
        RESOURCES.ANALYTICS
      ];

      const matrix = actions.map(action => ({
        action,
        resources: resources.map(resource => ({
          resource,
          allowed: PermissionService.hasPermission(role, action, resource, {
            userId: req.user.id,
            organizationId: req.tenant.organizationId
          })
        }))
      }));

      res.json({
        success: true,
        message: 'Permission matrix retrieved successfully',
        data: {
          role,
          organizationId: req.tenant.organizationId,
          capabilities,
          permissions,
          expandedPermissions,
          matrix
        },
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('❌ Permission matrix error:', error);
      next(new AppError(error.message, error.statusCode || 500, 'PERMISSION_MATRIX_ERROR'));
    }
  }
);

/**
 * POST /api/permissions/test
 * Test specific permission scenarios
 */
router.post('/test',
  requireAuth,
  extractTenantContext,
  (req: any, res: any, next: any) => {
    try {
      if (!req.tenant) {
        throw new AppError('Active organization context required', 403, 'TENANT_REQUIRED');
      }

      const { scenarios = [] } = req.body;
      
      const results = scenarios.map((scenario: any) => {
        const { action, resource, description } = scenario;
        
        const hasPermission = PermissionService.hasPermission(
          req.tenant.role,
          action,
          resource,
          {
            userId: req.user.id,
            organizationId: req.tenant.organizationId
          }
        );

        return {
          scenario: `${action}:${resource}`,
          description: description || `Test ${action} permission on ${resource}`,
          hasPermission,
          role: req.tenant.role
        };
      });

      res.json({
        success: true,
        message: 'Permission test scenarios completed',
        data: {
          role: req.tenant.role,
          organizationId: req.tenant.organizationId,
          results,
          summary: {
            total: results.length,
            allowed: results.filter((r: any) => r.hasPermission).length,
            denied: results.filter((r: any) => !r.hasPermission).length
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('❌ Permission test error:', error);
      next(new AppError(error.message, error.statusCode || 500, 'PERMISSION_TEST_ERROR'));
    }
  }
);

/**
 * GET /api/permissions/user-context
 * Get detailed permission context for current user
 */
router.get('/user-context',
  requireAuth,
  extractTenantContext,
  (req: any, res: any, next: any) => {
    try {
      let context = {
        user: {
          id: req.user.id,
          email: req.user.email
        },
        tenant: null as any,
        permissions: {
          isAuthenticated: true,
          hasOrganization: false,
          capabilities: null as any
        }
      };

      if (req.tenant) {
        context.tenant = {
          organizationId: req.tenant.organizationId,
          organizationName: req.tenant.organization.name,
          role: req.tenant.role,
          permissions: req.tenant.permissions
        };

        context.permissions = {
          isAuthenticated: true,
          hasOrganization: true,
          capabilities: PermissionService.getRoleCapabilities(req.tenant.role),
          isAdmin: PermissionService.isAdminRole(req.tenant.role),
          canManageUsers: PermissionService.canManageUsers(req.tenant.role),
          canAccessBilling: PermissionService.canAccessBilling(req.tenant.role)
        };
      }

      res.json({
        success: true,
        message: 'User permission context retrieved successfully',
        data: context,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('❌ User context error:', error);
      next(new AppError(error.message, error.statusCode || 500, 'USER_CONTEXT_ERROR'));
    }
  }
);

export { router as permissionsBlueprint };