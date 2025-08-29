// server/blueprints/auth-local.ts
import { Router } from 'express';
import { authService } from '../services/auth-service.js';
import { requireAuth } from '../middleware/auth-middleware.js';
import { z } from 'zod';
import { createUserDrizzle } from '../database/drizzle-connection.js';

const router = Router();

// Schemas de validação
const registerLocalSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional()
});

const loginLocalSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

// POST /api/auth/local/register - Registro apenas local (sem Supabase Auth)
router.post('/register', async (req, res) => {
  try {
    console.log('🚀 Auth Local: Register request received');

    // Validar dados
    const validatedData = registerLocalSchema.parse(req.body);

    // Verificar se email já existe
    const emailExists = await authService.emailExists(validatedData.email);
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
        code: 'EMAIL_EXISTS'
      });
    }

    // Hash da senha
    const hashedPassword = await authService.hashPassword(validatedData.password);

    // Criar usuário local via Drizzle
    const localUser = await createUserDrizzle({
      email: validatedData.email,
      password_hash: hashedPassword,
      name: validatedData.firstName,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email_verified: false
    });

    // Preparar dados do usuário
    const user = {
      id: localUser.id,
      email: localUser.email,
      username: localUser.username,
      firstName: localUser.firstName,
      lastName: localUser.lastName,
      avatar: localUser.avatar,
      emailVerified: localUser.emailVerified
    };

    // Gerar tokens
    const tokens = authService.generateTokens(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully (local only)',
      data: {
        ...tokens,
        expiresIn: 3600,
        user
      },
      method: 'local-only',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Local register error:', error.message);

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
      code: 'LOCAL_REGISTRATION_FAILED',
      error: error.message
    });
  }
});

// POST /api/auth/local/login - Login apenas local
router.post('/login', async (req, res) => {
  try {
    console.log('🚀 Auth Local: Login request received');

    // Validar dados
    const validatedData = loginLocalSchema.parse(req.body);

    // Login local
    const authTokens = await authService.loginLocal(validatedData);

    res.json({
      success: true,
      message: 'Login successful (local authentication)',
      data: authTokens,
      method: 'local-only',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Local login error:', error.message);

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
    let errorCode = 'LOCAL_LOGIN_FAILED';

    if (error.message.includes('Invalid password') || 
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

// GET /api/auth/local/test-auth - Testar autenticação
router.get('/test-auth', requireAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Authentication test successful',
      data: {
        user: req.user,
        session: req.session,
        authMethod: 'JWT Token'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Auth test error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Authentication test failed',
      code: 'AUTH_TEST_FAILED',
      error: error.message
    });
  }
});

console.log('✅ Auth Local blueprint initialized with routes: register, login, test-auth');

export default router;