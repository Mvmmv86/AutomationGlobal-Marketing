// server/services/auth-service.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { CONFIG } from '../config.js';
import { createUserDrizzle, getUsersDrizzle } from '../database/drizzle-connection.js';
import { createClient } from '@supabase/supabase-js';

// Tipos para autenticação
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  emailVerified: boolean;
  organizationId?: string;
  role?: string;
  permissions?: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  organizationName?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface SessionData {
  userId: string;
  email: string;
  organizationId?: string;
  role?: string;
  permissions?: string[];
  iat: number;
  exp: number;
}

class AuthService {
  private supabase;
  private readonly ACCESS_TOKEN_EXPIRES = '1h';
  private readonly REFRESH_TOKEN_EXPIRES = '7d';

  constructor() {
    // Inicializar cliente Supabase para auth
    this.supabase = createClient(
      CONFIG.SUPABASE_URL,
      CONFIG.SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: false // Server-side não precisa persistir
        }
      }
    );
  }

  // Gerar tokens JWT
  generateTokens(user: AuthUser): { accessToken: string; refreshToken: string } {
    const payload = {
      userId: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
      permissions: user.permissions || []
    };

    const accessToken = jwt.sign(payload, CONFIG.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRES,
      issuer: 'automation-global'
    });

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      CONFIG.JWT_SECRET,
      {
        expiresIn: this.REFRESH_TOKEN_EXPIRES,
        issuer: 'automation-global'
      }
    );

    return { accessToken, refreshToken };
  }

  // Verificar token JWT
  verifyToken(token: string): SessionData | null {
    try {
      const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as any;
      
      if (decoded.type === 'refresh') {
        throw new Error('Refresh token cannot be used for authentication');
      }

      return decoded as SessionData;
    } catch (error) {
      console.warn('Token verification failed:', error.message);
      return null;
    }
  }

  // Verificar refresh token
  verifyRefreshToken(token: string): { userId: string } | null {
    try {
      const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as any;
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token');
      }

      return { userId: decoded.userId };
    } catch (error) {
      console.warn('Refresh token verification failed:', error.message);
      return null;
    }
  }

  // Hash password
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, CONFIG.BCRYPT_ROUNDS);
  }

  // Verificar password
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Registro com Supabase Auth
  async registerWithSupabase(data: RegisterData): Promise<AuthTokens> {
    try {
      console.log('🔐 Registrando usuário com Supabase Auth:', data.email);

      // Registrar no Supabase Auth
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            organization_name: data.organizationName
          }
        }
      });

      if (authError) {
        throw new Error(`Supabase Auth error: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('No user returned from Supabase');
      }

      // Criar usuário no banco local via Drizzle
      const hashedPassword = await this.hashPassword(data.password);
      const localUser = await createUserDrizzle({
        email: data.email,
        password_hash: hashedPassword,
        name: data.firstName,
        firstName: data.firstName,
        lastName: data.lastName,
        email_verified: false
      });

      // Preparar dados do usuário
      const user: AuthUser = {
        id: localUser.id,
        email: localUser.email,
        username: localUser.username,
        firstName: localUser.firstName,
        lastName: localUser.lastName,
        avatar: localUser.avatar,
        emailVerified: localUser.emailVerified
      };

      // Gerar tokens
      const tokens = this.generateTokens(user);

      console.log('✅ Usuário registrado com sucesso:', user.id);

      return {
        ...tokens,
        expiresIn: 3600, // 1 hora
        user
      };

    } catch (error) {
      console.error('❌ Erro no registro:', error.message);
      throw error;
    }
  }

  // Login com Supabase Auth
  async loginWithSupabase(credentials: LoginCredentials): Promise<AuthTokens> {
    try {
      console.log('🔐 Login com Supabase Auth:', credentials.email);

      // Autenticar com Supabase
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (authError) {
        throw new Error(`Invalid credentials: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('No user returned from Supabase');
      }

      // Buscar usuário no banco local
      const users = await getUsersDrizzle();
      const localUser = users.find(u => u.email === credentials.email);

      if (!localUser) {
        throw new Error('User not found in local database');
      }

      // Preparar dados do usuário
      const user: AuthUser = {
        id: localUser.id,
        email: localUser.email,
        username: localUser.username,
        firstName: localUser.firstName,
        lastName: localUser.lastName,
        avatar: localUser.avatar,
        emailVerified: localUser.emailVerified
      };

      // Gerar tokens
      const tokens = this.generateTokens(user);

      console.log('✅ Login realizado com sucesso:', user.id);

      return {
        ...tokens,
        expiresIn: 3600, // 1 hora
        user
      };

    } catch (error) {
      console.error('❌ Erro no login:', error.message);
      throw error;
    }
  }

  // Login apenas local (fallback)
  async loginLocal(credentials: LoginCredentials): Promise<AuthTokens> {
    try {
      console.log('🔐 Login local:', credentials.email);

      // Buscar usuário no banco local
      const users = await getUsersDrizzle();
      const user = users.find(u => u.email === credentials.email);

      if (!user) {
        throw new Error('User not found');
      }

      // Verificar senha
      const isValidPassword = await this.verifyPassword(credentials.password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid password');
      }

      // Preparar dados do usuário
      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        emailVerified: user.emailVerified
      };

      // Gerar tokens
      const tokens = this.generateTokens(authUser);

      console.log('✅ Login local realizado com sucesso:', authUser.id);

      return {
        ...tokens,
        expiresIn: 3600, // 1 hora
        user: authUser
      };

    } catch (error) {
      console.error('❌ Erro no login local:', error.message);
      throw error;
    }
  }

  // Refresh token
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    const decoded = this.verifyRefreshToken(refreshToken);
    if (!decoded) {
      throw new Error('Invalid refresh token');
    }

    // Buscar usuário atual
    const users = await getUsersDrizzle();
    const user = users.find(u => u.id === decoded.userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Preparar dados do usuário
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      emailVerified: user.emailVerified
    };

    // Gerar novo access token
    const { accessToken } = this.generateTokens(authUser);

    return {
      accessToken,
      expiresIn: 3600
    };
  }

  // Logout
  async logout(userId: string): Promise<void> {
    try {
      console.log('🔐 Logout usuário:', userId);
      
      // Logout do Supabase Auth
      await this.supabase.auth.signOut();

      console.log('✅ Logout realizado com sucesso');
    } catch (error) {
      console.warn('⚠️ Erro no logout (não crítico):', error.message);
    }
  }

  // Verificar se email existe
  async emailExists(email: string): Promise<boolean> {
    try {
      const users = await getUsersDrizzle();
      return users.some(u => u.email === email);
    } catch (error) {
      console.error('❌ Erro ao verificar email:', error.message);
      return false;
    }
  }

  // Reset password (placeholder para futura implementação)
  async requestPasswordReset(email: string): Promise<void> {
    try {
      console.log('🔐 Solicitação de reset de senha:', email);
      
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`
      });

      if (error) {
        throw new Error(`Password reset error: ${error.message}`);
      }

      console.log('✅ Email de reset enviado com sucesso');
    } catch (error) {
      console.error('❌ Erro no reset de senha:', error.message);
      throw error;
    }
  }
}

// Singleton instance
export const authService = new AuthService();
export default authService;