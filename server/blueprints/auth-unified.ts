/**
 * Unified Authentication System - Automation Global v4.0
 * Sistema consolidado focado em Organizações de Marketing
 * 
 * Planos disponíveis:
 * - Starter: Básico, limite de usuários e features
 * - Professional: Intermediário, mais recursos
 * - Enterprise: Avançado, recursos ilimitados
 */

import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../database/drizzle-connection.js';
import { users, organizations, organizationUsers } from '../../shared/schema.js';
import { eq, and } from 'drizzle-orm';
import { cacheManager } from '../cache/cache-manager.js';
import { AppError } from '../middleware/validation.js';

const router = Router();

// ========================================
// TYPES & INTERFACES
// ========================================

export type SubscriptionPlan = 'starter' | 'professional' | 'enterprise';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  emailVerified: boolean;
}

export interface OrganizationContext {
  id: string;
  name: string;
  slug: string;
  plan: SubscriptionPlan;
  role: string;
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse extends AuthTokens {
  user: AuthUser;
  organization?: OrganizationContext;
}

// ========================================
// VALIDATION SCHEMAS
// ========================================

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  firstName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  lastName: z.string().optional(),
  organizationName: z.string().min(2, 'Nome da organização deve ter no mínimo 2 caracteres'),
  plan: z.enum(['starter', 'professional', 'enterprise']).default('starter')
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório')
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(6, 'Nova senha deve ter no mínimo 6 caracteres')
});

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Gera JWT access token
 */
function generateAccessToken(userId: string, email: string, organizationId?: string): string {
  return jwt.sign(
    {
      userId,
      email,
      organizationId,
      type: 'access'
    },
    process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    { expiresIn: '1h' }
  );
}

/**
 * Gera JWT refresh token
 */
function generateRefreshToken(userId: string): string {
  return jwt.sign(
    {
      userId,
      type: 'refresh'
    },
    process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    { expiresIn: '7d' }
  );
}

/**
 * Busca permissões do usuário na organização
 */
async function getUserOrganizationContext(userId: string, organizationId: string): Promise<OrganizationContext | null> {
  try {
    const [membership] = await db
      .select()
      .from(organizationUsers)
      .where(
        and(
          eq(organizationUsers.userId, userId),
          eq(organizationUsers.organizationId, organizationId)
        )
      )
      .limit(1);

    if (!membership) {
      return null;
    }

    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!org) {
      return null;
    }

    // Determinar permissões baseadas no plano e role
    const permissions = getPermissionsByPlanAndRole(
      org.subscriptionTier as SubscriptionPlan,
      membership.role
    );

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      plan: org.subscriptionTier as SubscriptionPlan,
      role: membership.role,
      permissions
    };
  } catch (error) {
    console.error('❌ Erro ao buscar contexto da organização:', error);
    return null;
  }
}

/**
 * Define permissões baseadas no plano e role
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
      'campaigns:create_limited', // Máx 5 campanhas
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
      'ai:generate_limited' // Máx 100 req/mês
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

// ========================================
// ROUTES
// ========================================

/**
 * POST /api/auth/register
 * Registro de usuário + organização
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('📝 Registro iniciado:', req.body.email);

    // Validar dados
    const validatedData = registerSchema.parse(req.body);
    const { email, password, firstName, lastName, organizationName, plan } = validatedData;

    // Verificar se email já existe
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      throw new AppError(409, 'Email já cadastrado', 'EMAIL_EXISTS');
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 12);

    // Gerar username único do email
    const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const uniqueUsername = `${baseUsername}_${Date.now().toString().slice(-6)}`;

    // Criar usuário
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        password: passwordHash,
        firstName,
        lastName,
        username: uniqueUsername,
        emailVerified: false,
        status: 'active'
      })
      .returning();

    console.log('✅ Usuário criado:', newUser.id);

    // Criar organização
    const slug = organizationName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const [newOrg] = await db
      .insert(organizations)
      .values({
        name: organizationName,
        slug: `${slug}-${Date.now()}`, // Garantir unicidade
        type: 'marketing',
        subscriptionTier: plan,
        isActive: true
      })
      .returning();

    console.log('✅ Organização criada:', newOrg.id, 'Plano:', plan);

    // Adicionar usuário como owner da organização
    await db
      .insert(organizationUsers)
      .values({
        userId: newUser.id,
        organizationId: newOrg.id,
        role: 'org_owner',
        status: 'active'
      });

    console.log('✅ Usuário adicionado como owner da organização');

    // Gerar tokens
    const accessToken = generateAccessToken(newUser.id, newUser.email, newOrg.id);
    const refreshToken = generateRefreshToken(newUser.id);

    // Cache da sessão
    await cacheManager.cacheSession(refreshToken, {
      userId: newUser.id,
      email: newUser.email,
      organizationId: newOrg.id
    }, 604800); // 7 dias

    // Buscar contexto da organização
    const orgContext = await getUserOrganizationContext(newUser.id, newOrg.id);

    // Resposta
    const response: AuthResponse = {
      accessToken,
      refreshToken,
      expiresIn: 3600,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        avatar: newUser.avatar,
        emailVerified: newUser.emailVerified
      },
      organization: orgContext || undefined
    };

    res.status(201).json({
      success: true,
      message: 'Registro realizado com sucesso',
      data: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Erro de validação',
        code: 'VALIDATION_ERROR',
        errors: error.errors
      });
    }
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Login de usuário
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('🔐 Login iniciado:', req.body.email);

    // Validar dados
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    // Buscar usuário
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      throw new AppError(401, 'Credenciais inválidas', 'INVALID_CREDENTIALS');
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new AppError(401, 'Credenciais inválidas', 'INVALID_CREDENTIALS');
    }

    // Verificar status do usuário
    if (user.status !== 'active') {
      throw new AppError(403, 'Usuário inativo', 'USER_INACTIVE');
    }

    // Buscar organização principal do usuário
    const [membership] = await db
      .select()
      .from(organizationUsers)
      .where(eq(organizationUsers.userId, user.id))
      .limit(1);

    const organizationId = membership?.organizationId;

    // Gerar tokens
    const accessToken = generateAccessToken(user.id, user.email, organizationId);
    const refreshToken = generateRefreshToken(user.id);

    // Cache da sessão
    await cacheManager.cacheSession(refreshToken, {
      userId: user.id,
      email: user.email,
      organizationId
    }, 604800); // 7 dias

    // Buscar contexto da organização
    let orgContext: OrganizationContext | undefined;
    if (organizationId) {
      orgContext = await getUserOrganizationContext(user.id, organizationId) || undefined;
    }

    // Resposta
    const response: AuthResponse = {
      accessToken,
      refreshToken,
      expiresIn: 3600,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        emailVerified: user.emailVerified
      },
      organization: orgContext
    };

    console.log('✅ Login realizado com sucesso:', user.email);

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Erro de validação',
        code: 'VALIDATION_ERROR',
        errors: error.errors
      });
    }
    next(error);
  }
});

/**
 * POST /api/auth/refresh
 * Renovar access token
 */
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validar dados
    const { refreshToken } = refreshTokenSchema.parse(req.body);

    // Verificar token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_SECRET || 'your-super-secret-jwt-key'
    ) as { userId: string; type: string };

    if (decoded.type !== 'refresh') {
      throw new AppError(401, 'Token inválido', 'INVALID_TOKEN');
    }

    // Verificar sessão no cache
    const session = await cacheManager.getSession(refreshToken);

    if (!session) {
      throw new AppError(401, 'Sessão expirada', 'SESSION_EXPIRED');
    }

    // Buscar usuário
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user || user.status !== 'active') {
      throw new AppError(401, 'Usuário inválido', 'INVALID_USER');
    }

    // Gerar novo access token
    const newAccessToken = generateAccessToken(
      user.id,
      user.email,
      session.organizationId
    );

    res.json({
      success: true,
      message: 'Token renovado com sucesso',
      data: {
        accessToken: newAccessToken,
        expiresIn: 3600
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Logout do usuário
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Invalidar sessão no cache
      await cacheManager.invalidateSession(refreshToken);
    }

    res.json({
      success: true,
      message: 'Logout realizado com sucesso',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro no logout:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao realizar logout'
    });
  }
});

/**
 * GET /api/auth/me
 * Dados do usuário autenticado
 * Requer autenticação
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    // Extrair token do header
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido',
        code: 'NO_TOKEN'
      });
    }

    // Verificar token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-super-secret-jwt-key'
    ) as { userId: string; email: string; organizationId?: string };

    // Buscar usuário
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    // Buscar contexto da organização
    let orgContext: OrganizationContext | undefined;
    if (decoded.organizationId) {
      orgContext = await getUserOrganizationContext(user.id, decoded.organizationId) || undefined;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          emailVerified: user.emailVerified
        },
        organization: orgContext
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }

    console.error('❌ Erro ao buscar dados do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados do usuário'
    });
  }
});

/**
 * POST /api/auth/change-password
 * Alterar senha do usuário
 * Requer autenticação
 */
router.post('/change-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extrair token
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      throw new AppError(401, 'Token não fornecido', 'NO_TOKEN');
    }

    // Verificar token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-super-secret-jwt-key'
    ) as { userId: string };

    // Validar dados
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    // Buscar usuário
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user) {
      throw new AppError(404, 'Usuário não encontrado', 'USER_NOT_FOUND');
    }

    // Verificar senha atual
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);

    if (!passwordMatch) {
      throw new AppError(401, 'Senha atual incorreta', 'INVALID_PASSWORD');
    }

    // Hash da nova senha
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Atualizar senha
    await db
      .update(users)
      .set({ password: newPasswordHash })
      .where(eq(users.id, user.id));

    console.log('✅ Senha alterada com sucesso:', user.email);

    res.json({
      success: true,
      message: 'Senha alterada com sucesso',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Erro de validação',
        code: 'VALIDATION_ERROR',
        errors: error.errors
      });
    }
    next(error);
  }
});

export default router;

