// server/blueprints/auth-v2.ts
import { Router } from 'express';
import { authService } from '../services/auth-service.js';
import { requireAuth, optionalAuth } from '../middleware/auth-middleware.js';
import { z } from 'zod';

const router = Router();

// Schemas de validação
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  organizationName: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email format')
});

// POST /api/auth/v2/register - Registro com Supabase Auth
router.post('/register', async (req, res) => {
  try {
    console.log('🚀 Auth V2: Register request received');

    // Validar dados
    const validatedData = registerSchema.parse(req.body);

    // Verificar se email já existe
    const emailExists = await authService.emailExists(validatedData.email);
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
        code: 'EMAIL_EXISTS'
      });
    }

    // Registrar usuário
    const authTokens = await authService.registerWithSupabase(validatedData);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: authTokens,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Register error:', error.message);

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
      message: 'Registration failed',
      code: 'REGISTRATION_FAILED',
      error: error.message
    });
  }
});

// POST /api/auth/v2/login - Login com Supabase Auth
router.post('/login', async (req, res) => {
  try {
    console.log('🚀 Auth V2: Login request received');

    // Validar dados
    const validatedData = loginSchema.parse(req.body);

    // Tentar login com Supabase primeiro, fallback para local
    let authTokens;
    try {
      authTokens = await authService.loginWithSupabase(validatedData);
    } catch (supabaseError) {
      console.warn('⚠️ Supabase login failed, trying local:', supabaseError.message);
      authTokens = await authService.loginLocal(validatedData);
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: authTokens,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Login error:', error.message);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        errors: error.errors
      });
    }

    // Determinar código de erro específico
    let statusCode = 500;
    let errorCode = 'LOGIN_FAILED';

    if (error.message.includes('Invalid credentials') || 
        error.message.includes('Invalid password') || 
        error.message.includes('User not found')) {
      statusCode = 401;
      errorCode = 'INVALID_CREDENTIALS';
    }

    res.status(statusCode).json({
      success: false,
      message: 'Login failed',
      code: errorCode,
      error: error.message
    });
  }
});

// POST /api/auth/v2/refresh - Refresh access token
router.post('/refresh', async (req, res) => {
  try {
    console.log('🚀 Auth V2: Refresh token request');

    // Validar dados
    const validatedData = refreshSchema.parse(req.body);

    // Refresh token
    const newTokens = await authService.refreshAccessToken(validatedData.refreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: newTokens,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Refresh token error:', error.message);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        errors: error.errors
      });
    }

    res.status(401).json({
      success: false,
      message: 'Token refresh failed',
      code: 'REFRESH_FAILED',
      error: error.message
    });
  }
});

// POST /api/auth/v2/logout - Logout
router.post('/logout', requireAuth, async (req, res) => {
  try {
    console.log('🚀 Auth V2: Logout request');

    if (req.user) {
      await authService.logout(req.user.id);
    }

    res.json({
      success: true,
      message: 'Logout successful',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Logout error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Logout failed',
      code: 'LOGOUT_FAILED',
      error: error.message
    });
  }
});

// GET /api/auth/v2/me - Obter dados do usuário autenticado
router.get('/me', requireAuth, async (req, res) => {
  try {
    console.log('🚀 Auth V2: Get current user');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
    }

    res.json({
      success: true,
      message: 'User data retrieved successfully',
      data: {
        user: req.user,
        session: req.session
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Get user error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to get user data',
      code: 'GET_USER_FAILED',
      error: error.message
    });
  }
});

// POST /api/auth/v2/reset-password - Solicitar reset de senha
router.post('/reset-password', async (req, res) => {
  try {
    console.log('🚀 Auth V2: Password reset request');

    // Validar dados
    const validatedData = resetPasswordSchema.parse(req.body);

    // Solicitar reset
    await authService.requestPasswordReset(validatedData.email);

    res.json({
      success: true,
      message: 'Password reset email sent successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Password reset error:', error.message);

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
      message: 'Password reset failed',
      code: 'RESET_FAILED',
      error: error.message
    });
  }
});

// GET /api/auth/v2/check-email/:email - Verificar se email existe
router.get('/check-email/:email', async (req, res) => {
  try {
    const { email } = req.params;

    // Validar email
    const emailSchema = z.string().email();
    const validatedEmail = emailSchema.parse(email);

    // Verificar se existe
    const exists = await authService.emailExists(validatedEmail);

    res.json({
      success: true,
      data: {
        email: validatedEmail,
        exists
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Check email error:', error.message);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Email check failed',
      code: 'CHECK_EMAIL_FAILED',
      error: error.message
    });
  }
});

// GET /api/auth/v2/status - Status do sistema de autenticação
router.get('/status', optionalAuth, async (req, res) => {
  try {
    const isAuthenticated = !!req.user;
    
    res.json({
      success: true,
      data: {
        authSystemStatus: 'operational',
        isAuthenticated,
        user: isAuthenticated ? req.user : null,
        supportedMethods: ['email_password', 'supabase_auth'],
        features: {
          registration: true,
          passwordReset: true,
          tokenRefresh: true,
          emailVerification: true
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Auth status error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to get auth status',
      code: 'STATUS_FAILED',
      error: error.message
    });
  }
});

console.log('✅ Auth V2 blueprint initialized with routes: register, login, refresh, logout, me, reset-password, check-email, status');

export default router;