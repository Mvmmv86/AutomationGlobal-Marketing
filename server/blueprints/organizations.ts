// server/blueprints/organizations.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/auth-middleware.js';
import { 
  extractTenantContext, 
  requireTenant, 
  requireTenantRole,
  requireTenantPermission,
  auditTenantAction
} from '../middleware/tenant-middleware.js';
import { organizationService } from '../services/organization-service.js';
import { z } from 'zod';

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(requireAuth);
router.use(extractTenantContext);

// Schemas de validação
const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  slug: z.string().min(1, 'Organization slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  domain: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(['marketing', 'support', 'trading', 'enterprise']).optional(),
  subscriptionPlan: z.enum(['starter', 'professional', 'enterprise']).optional()
});

const updateOrganizationSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  domain: z.string().optional(),
  logo: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(['marketing', 'support', 'trading', 'enterprise']).optional(),
  subscriptionPlan: z.enum(['starter', 'professional', 'enterprise']).optional(),
  settings: z.record(z.any()).optional(),
  isActive: z.boolean().optional()
});

const addUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['super_admin', 'org_owner', 'org_admin', 'org_manager', 'org_user', 'org_viewer']).optional(),
  permissions: z.record(z.boolean()).optional()
});

const switchContextSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required')
});

// GET /api/organizations - Listar organizações do usuário
router.get('/', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const organizations = await organizationService.getUserOrganizations(req.user.id);

    res.json({
      success: true,
      data: {
        organizations,
        total: organizations.length,
        currentContext: req.tenant ? {
          organizationId: req.tenant.organizationId,
          organizationName: req.tenant.organization.name,
          role: req.tenant.role
        } : null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error listing organizations:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to list organizations',
      code: 'LIST_ORGANIZATIONS_FAILED',
      error: error.message
    });
  }
});

// POST /api/organizations - Criar nova organização
router.post('/', auditTenantAction('create_organization'), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Validar dados
    const validatedData = createOrganizationSchema.parse(req.body);

    // Criar organização
    const organization = await organizationService.createOrganization(validatedData, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      data: { organization },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error creating organization:', error.message);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create organization',
      code: 'CREATE_ORGANIZATION_FAILED',
      error: error.message
    });
  }
});

// GET /api/organizations/:organizationId - Obter organização específica
router.get('/:organizationId', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const { organizationId } = req.params;

    // Verificar acesso
    const hasAccess = await organizationService.hasAccess(req.user.id, organizationId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this organization',
        code: 'ORGANIZATION_ACCESS_DENIED'
      });
    }

    // Buscar organização e membership
    const organization = await organizationService.getOrganizationById(organizationId);
    const membership = await organizationService.getUserMembership(req.user.id, organizationId);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
        code: 'ORGANIZATION_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        organization,
        membership
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error fetching organization:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization',
      code: 'FETCH_ORGANIZATION_FAILED',
      error: error.message
    });
  }
});

// PUT /api/organizations/:organizationId - Atualizar organização
router.put('/:organizationId', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const { organizationId } = req.params;

      // Verificar se o usuário tem acesso à organização
      const hasAccess = await organizationService.hasAccess(req.user.id, organizationId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this organization',
          code: 'ORGANIZATION_ACCESS_DENIED'
        });
      }

      // Validar dados
      const validatedData = updateOrganizationSchema.parse(req.body);

      // Atualizar organização
      const organization = await organizationService.updateOrganization(organizationId, validatedData, req.user.id);

      res.json({
        success: true,
        message: 'Organization updated successfully',
        data: { organization },
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('❌ Error updating organization:', error.message);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          errors: error.errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update organization',
        code: 'UPDATE_ORGANIZATION_FAILED',
        error: error.message
      });
    }
  }
);

// GET /api/organizations/:organizationId/users - Listar usuários da organização
router.get('/:organizationId/users', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const { organizationId } = req.params;

    const members = await organizationService.getOrganizationMembers(organizationId, req.user.id);

    res.json({
      success: true,
      data: {
        users: members,
        total: members.length,
        organizationId
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error fetching organization members:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization members',
      code: 'FETCH_MEMBERS_FAILED',
      error: error.message
    });
  }
});

// POST /api/organizations/:organizationId/users - Adicionar usuário à organização  
router.post('/:organizationId/users', async (req, res) => {
    try {
      const { organizationId } = req.params;

      // Validar dados
      const validatedData = addUserSchema.parse(req.body);

      // Adicionar usuário
      const membership = await organizationService.addUserToOrganization(
        validatedData.userId,
        organizationId,
        validatedData.role || 'user',
        validatedData.permissions || [],
        req.user!.id
      );

      res.status(201).json({
        success: true,
        message: 'User added to organization successfully',
        data: { membership },
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('❌ Error adding user to organization:', error.message);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          errors: error.errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to add user to organization',
        code: 'ADD_USER_FAILED',
        error: error.message
      });
    }
  }
);

// DELETE /api/organizations/:organizationId/members/:userId - Remover usuário da organização
router.delete('/:organizationId/members/:userId',
  requireTenantRole(['super_admin', 'org_admin']),
  auditTenantAction('remove_organization_member'),
  async (req, res) => {
    try {
      const { organizationId, userId } = req.params;

      await organizationService.removeUserFromOrganization(userId, organizationId, req.user!.id);

      res.json({
        success: true,
        message: 'User removed from organization successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('❌ Error removing user from organization:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to remove user from organization',
        code: 'REMOVE_USER_FAILED',
        error: error.message
      });
    }
  }
);

// POST /api/organizations/switch-context - Switch contexto de organização
router.post('/switch-context', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Validar dados
    const validatedData = switchContextSchema.parse(req.body);

    // Switch contexto
    const tenantContext = await organizationService.switchOrganizationContext(
      req.user.id, 
      validatedData.organizationId
    );

    res.json({
      success: true,
      message: 'Organization context switched successfully',
      data: {
        context: {
          organization: tenantContext.organization,
          membership: tenantContext.membership,
          organizationId: tenantContext.organization.id,
          role: tenantContext.membership.role,
          permissions: tenantContext.membership.permissions
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error switching organization context:', error.message);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to switch organization context',
      code: 'SWITCH_CONTEXT_FAILED',
      error: error.message
    });
  }
});

// GET /api/organizations/current - Obter contexto atual
router.get('/current', requireTenant, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        context: {
          organization: req.tenant!.organization,
          membership: req.tenant!.membership,
          organizationId: req.tenant!.organizationId,
          role: req.tenant!.role,
          permissions: req.tenant!.permissions
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error getting current context:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get current context',
      code: 'GET_CURRENT_CONTEXT_FAILED',
      error: error.message
    });
  }
});

console.log('✅ Organizations blueprint initialized with multi-tenant routes');

export default router;