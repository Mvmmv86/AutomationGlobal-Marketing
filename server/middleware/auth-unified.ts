/**
 * Unified Authentication Middleware - Automation Global v4.0
 * Middleware consolidado para autenticação e autorização
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../database/drizzle-connection.js';
import { users, organizationUsers, organizations } from '../../shared/schema.js';
import { eq, and } from 'drizzle-orm';
import { AppError } from './validation.js';

// ========================================
// TYPES
// ========================================

export type SubscriptionPlan = 'starter' | 'professional' | 'enterprise';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  emailVerified: boolean;
  organizationId?: string;
  role?: string;
  plan?: SubscriptionPlan;
  permissions?: string[];
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Busca permissões do usuário baseadas no plano e role
 */
function getPermissionsByPlanAndRole(plan: SubscriptionPlan, role: string): string[] {
  const basePermissions = [
    'dashboard:view',
    'profile:view',
    'profile:edit'
  ];

  const planPermissions: Record<SubscriptionPlan, string[]> = {
    starter: [
      'campaigns:view',
      'campaigns:create_limited',
      'analytics:view_basic'
    ],
    professional: [
      'campaigns:view',
      'campaigns:create',
      'campaigns:edit',
      'campaigns:delete',
      'analytics:view',
      'analytics:export',
      'integrations:facebook',
      'integrations:google',
      'ai:generate_limited'
    ],
    enterprise: [
      'campaigns:*',
      'analytics:*',
      'integrations:*',
      'ai:*',
      'users:manage',
      'billing:manage',
      'settings:manage'
    ]
  };

  const rolePermissions: Record<string, string[]> = {
    'org_viewer': [],
    'org_user': ['content:create', 'content:edit_own'],
    'org_manager': ['content:*', 'team:view'],
    'org_admin': ['*'],
    'org_owner': ['*']
  };

  return [
    ...basePermissions,
    ...(planPermissions[plan] || []),
    ...(rolePermissions[role] || [])
  ];
}

/**
 * Verifica se usuário tem permissão específica
 */
function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  // Admin tem todas as permissões
  if (userPermissions.includes('*')) {
    return true;
  }

  // Verificar permissão exata
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  // Verificar permissão wildcard (ex: campaigns:* inclui campaigns:create)
  const [category] = requiredPermission.split(':');
  if (userPermissions.includes(`${category}:*`)) {
    return true;
  }

  return false;
}

/**
 * Verifica se o plano do usuário atende o requisito
 */
function meetsplanRequirement(userPlan: SubscriptionPlan, requiredPlan: SubscriptionPlan): boolean {
  const planHierarchy: Record<SubscriptionPlan, number> = {
    starter: 1,
    professional: 2,
    enterprise: 3
  };

  return planHierarchy[userPlan] >= planHierarchy[requiredPlan];
}

// ========================================
// MIDDLEWARE
// ========================================

/**
 * Middleware: Require Authentication
 * Verifica se o usuário está autenticado via JWT
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Extrair token do header
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      throw new AppError(401, 'Token de autenticação não fornecido', 'NO_TOKEN');
    }

    // Verificar e decodificar token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-super-secret-jwt-key'
    ) as { userId: string; email: string; organizationId?: string; type: string };

    if (decoded.type !== 'access') {
      throw new AppError(401, 'Tipo de token inválido', 'INVALID_TOKEN_TYPE');
    }

    // Buscar usuário no banco
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user) {
      throw new AppError(401, 'Usuário não encontrado', 'USER_NOT_FOUND');
    }

    if (user.status !== 'active') {
      throw new AppError(403, 'Usuário inativo', 'USER_INACTIVE');
    }

    // Buscar contexto da organização se existir
    let role: string | undefined;
    let plan: SubscriptionPlan | undefined;
    let permissions: string[] | undefined;

    if (decoded.organizationId) {
      const [membership] = await db
        .select()
        .from(organizationUsers)
        .where(
          and(
            eq(organizationUsers.userId, user.id),
            eq(organizationUsers.organizationId, decoded.organizationId)
          )
        )
        .limit(1);

      if (membership) {
        const [org] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, decoded.organizationId))
          .limit(1);

        if (org) {
          role = membership.role;
          plan = org.subscriptionTier as SubscriptionPlan;
          permissions = getPermissionsByPlanAndRole(plan, role);
        }
      }
    }

    // Adicionar usuário ao request
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      emailVerified: user.emailVerified,
      organizationId: decoded.organizationId,
      role,
      plan,
      permissions
    };

    console.log(`🔐 Usuário autenticado: ${user.email} (${user.id})`);
    next();

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError(401, 'Token inválido', 'INVALID_TOKEN'));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError(401, 'Token expirado', 'TOKEN_EXPIRED'));
    }
    next(error);
  }
}

/**
 * Middleware: Optional Authentication
 * Adiciona dados do usuário se autenticado, mas não bloqueia se não estiver
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      // Sem token, continuar sem autenticação
      return next();
    }

    // Tentar autenticar (mas não bloquear se falhar)
    await requireAuth(req, res, () => {
      // Sucesso na autenticação
      next();
    });

  } catch (error) {
    // Falha na autenticação, mas não bloqueia
    console.log('⚠️ Autenticação opcional falhou, continuando sem auth');
    next();
  }
}

/**
 * Middleware Factory: Require Plan
 * Verifica se o usuário tem o plano mínimo necessário
 */
export function requirePlan(minPlan: SubscriptionPlan) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Autenticação necessária', 'AUTH_REQUIRED');
      }

      if (!req.user.plan) {
        throw new AppError(403, 'Usuário não pertence a nenhuma organização', 'NO_ORGANIZATION');
      }

      if (!meetsplanRequirement(req.user.plan, minPlan)) {
        throw new AppError(
          403,
          `Plano ${minPlan} ou superior necessário`,
          'INSUFFICIENT_PLAN',
          {
            userPlan: req.user.plan,
            requiredPlan: minPlan
          }
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware Factory: Require Permission
 * Verifica se o usuário tem uma permissão específica
 */
export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Autenticação necessária', 'AUTH_REQUIRED');
      }

      if (!req.user.permissions) {
        throw new AppError(403, 'Sem permissões definidas', 'NO_PERMISSIONS');
      }

      if (!hasPermission(req.user.permissions, permission)) {
        throw new AppError(
          403,
          `Permissão '${permission}' necessária`,
          'INSUFFICIENT_PERMISSION',
          {
            required: permission,
            userPermissions: req.user.permissions
          }
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware Factory: Require Role
 * Verifica se o usuário tem uma role específica
 */
export function requireRole(role: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Autenticação necessária', 'AUTH_REQUIRED');
      }

      if (!req.user.role) {
        throw new AppError(403, 'Role não definida', 'NO_ROLE');
      }

      if (req.user.role !== role) {
        throw new AppError(
          403,
          `Role '${role}' necessária`,
          'INSUFFICIENT_ROLE',
          {
            required: role,
            userRole: req.user.role
          }
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware Factory: Require Organization
 * Verifica se o usuário pertence a uma organização
 */
export async function requireOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'Autenticação necessária', 'AUTH_REQUIRED');
    }

    if (!req.user.organizationId) {
      throw new AppError(403, 'Usuário não pertence a nenhuma organização', 'NO_ORGANIZATION');
    }

    next();
  } catch (error) {
    next(error);
  }
}

// Exportar tipos para uso em outras partes da aplicação
export type { AuthUser as UnifiedAuthUser };

