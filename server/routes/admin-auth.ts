/**
 * Admin Authentication Routes
 * Rotas exclusivas para Super Admins e Org Owners
 */

import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../database/drizzle-connection.js';
import { users, organizationUsers } from '../../shared/schema.js';
import { eq, and } from 'drizzle-orm';
import { cacheManager } from '../cache/cache-manager.js';
import { AppError } from '../middleware/validation.js';

const router = Router();

// ========================================
// VALIDATION SCHEMAS
// ========================================

const adminLoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
});

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Gera JWT access token para admin
 */
function generateAdminAccessToken(userId: string, email: string, role: string): string {
  return jwt.sign(
    {
      userId,
      email,
      role,
      type: 'admin_access'
    },
    process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    { expiresIn: '1h' }
  );
}

/**
 * Gera refresh token para admin
 */
function generateAdminRefreshToken(userId: string): string {
  return jwt.sign(
    {
      userId,
      type: 'admin_refresh'
    },
    process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    { expiresIn: '7d' }
  );
}

/**
 * Verifica se usuário é super admin ou org owner
 */
async function isAdmin(userId: string): Promise<boolean> {
  try {
    // Buscar se usuário tem role de super_admin ou org_owner
    const [membership] = await db
      .select()
      .from(organizationUsers)
      .where(
        and(
          eq(organizationUsers.userId, userId),
          eq(organizationUsers.status, 'active')
        )
      )
      .limit(1);

    if (!membership) {
      return false;
    }

    return membership.role === 'super_admin' || membership.role === 'org_owner';
  } catch (error) {
    console.error('❌ Erro ao verificar admin:', error);
    return false;
  }
}

// ========================================
// ROUTES
// ========================================

/**
 * POST /api/admin/auth/login
 * Login exclusivo para admins
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('🔐 Admin login iniciado:', req.body.email);

    // Validar dados
    const validatedData = adminLoginSchema.parse(req.body);
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

    // Verificar se está ativo
    if (user.status !== 'active') {
      throw new AppError(403, 'Usuário inativo ou suspenso', 'USER_INACTIVE');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError(401, 'Credenciais inválidas', 'INVALID_CREDENTIALS');
    }

    // Verificar se é admin
    const userIsAdmin = await isAdmin(user.id);
    if (!userIsAdmin) {
      throw new AppError(403, 'Acesso negado. Apenas administradores podem acessar.', 'ACCESS_DENIED');
    }

    // Buscar role do usuário
    const [membership] = await db
      .select()
      .from(organizationUsers)
      .where(
        and(
          eq(organizationUsers.userId, user.id),
          eq(organizationUsers.status, 'active')
        )
      )
      .limit(1);

    // Gerar tokens
    const accessToken = generateAdminAccessToken(user.id, user.email, membership?.role || 'org_owner');
    const refreshToken = generateAdminRefreshToken(user.id);

    // Cache da sessão
    await cacheManager.cacheSession(refreshToken, {
      userId: user.id,
      email: user.email,
      role: membership?.role || 'org_owner',
      type: 'admin'
    }, 604800); // 7 dias

    // Atualizar lastLoginAt
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    console.log('✅ Admin login bem-sucedido:', user.email, 'Role:', membership?.role);

    // Resposta
    return res.status(200).json({
      success: true,
      message: 'Login administrativo realizado com sucesso',
      accessToken,
      refreshToken,
      expiresIn: 3600,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        role: membership?.role || 'org_owner'
      }
    });

  } catch (error) {
    console.error('❌ Erro no login admin:', error);
    next(error);
  }
});

/**
 * POST /api/admin/auth/refresh
 * Refresh token para admin
 */
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError(400, 'Refresh token é obrigatório', 'MISSING_REFRESH_TOKEN');
    }

    // Verificar token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_SECRET || 'your-super-secret-jwt-key'
    ) as any;

    if (decoded.type !== 'admin_refresh') {
      throw new AppError(403, 'Token inválido', 'INVALID_TOKEN');
    }

    // Buscar sessão no cache
    const session = await cacheManager.getSession(refreshToken);
    if (!session) {
      throw new AppError(401, 'Sessão expirada', 'SESSION_EXPIRED');
    }

    // Gerar novo access token
    const newAccessToken = generateAdminAccessToken(
      decoded.userId,
      session.email,
      session.role
    );

    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      expiresIn: 3600
    });

  } catch (error) {
    console.error('❌ Erro no refresh admin:', error);
    next(error);
  }
});

/**
 * POST /api/admin/auth/logout
 * Logout admin
 */
router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Invalidar sessão no cache
      await cacheManager.invalidateSession(refreshToken);
    }

    return res.status(200).json({
      success: true,
      message: 'Logout realizado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro no logout admin:', error);
    next(error);
  }
});

/**
 * GET /api/admin/auth/me
 * Retorna dados do admin logado
 */
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Adicionar middleware de auth aqui
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new AppError(401, 'Token não fornecido', 'MISSING_TOKEN');
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-super-secret-jwt-key'
    ) as any;

    if (decoded.type !== 'admin_access') {
      throw new AppError(403, 'Token inválido', 'INVALID_TOKEN');
    }

    // Buscar usuário
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user) {
      throw new AppError(404, 'Usuário não encontrado', 'USER_NOT_FOUND');
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        role: decoded.role
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar dados do admin:', error);
    next(error);
  }
});

export default router;
