import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { CONFIG } from '../config';
import { storage } from '../storage';
import type { User, InsertUser } from '@shared/schema';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  userId: string;
  organizationId?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  organizationId?: string;
}

export interface RegisterRequest extends InsertUser {
  password: string;
  organizationName?: string;
}

class AuthService {
  async register(data: RegisterRequest): Promise<{ user: User; tokens: AuthTokens }> {
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, CONFIG.BCRYPT_ROUNDS);

    // Create user
    const userData = {
      ...data,
      password: hashedPassword,
    };

    const user = await storage.createUser(userData);

    // Create organization if provided
    let organizationId: string | undefined;
    if (data.organizationName) {
      const organization = await storage.createOrganization({
        name: data.organizationName,
        slug: this.generateSlug(data.organizationName),
        type: 'marketing', // default type
        subscriptionPlan: 'starter',
      });

      // Add user as organization owner
      await storage.addUserToOrganization({
        userId: user.id,
        organizationId: organization.id,
        role: 'org_owner',
      });

      organizationId = organization.id;
    }

    // Generate tokens
    const tokens = this.generateTokens({
      userId: user.id,
      organizationId,
      role: organizationId ? 'org_owner' : undefined,
    });

    return { user, tokens };
  }

  async login(data: LoginRequest): Promise<{ user: User; tokens: AuthTokens }> {
    // Find user by email
    const user = await storage.getUserByEmail(data.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Get user's organization memberships
    const memberships = await storage.getUserOrganizations(user.id);
    
    let organizationId = data.organizationId;
    let role: string | undefined;

    if (organizationId) {
      // Verify user belongs to specified organization
      const membership = memberships.find(m => m.organizationId === organizationId);
      if (!membership) {
        throw new Error('User is not a member of this organization');
      }
      role = membership.role;
    } else if (memberships.length > 0) {
      // Use first organization if none specified
      organizationId = memberships[0].organizationId;
      role = memberships[0].role;
    }

    // Update last login
    await storage.updateUserLastLogin(user.id);

    // Generate tokens
    const tokens = this.generateTokens({
      userId: user.id,
      organizationId,
      role,
    });

    return { user, tokens };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, CONFIG.JWT_SECRET) as JwtPayload;
      
      // Verify user still exists
      const user = await storage.getUser(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate new tokens
      return this.generateTokens({
        userId: decoded.userId,
        organizationId: decoded.organizationId,
        role: decoded.role,
      });
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as JwtPayload;
      
      // Verify user still exists
      const user = await storage.getUser(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async switchOrganization(userId: string, organizationId: string): Promise<AuthTokens> {
    // Verify user belongs to organization
    const membership = await storage.getOrganizationMembership(userId, organizationId);
    if (!membership) {
      throw new Error('User is not a member of this organization');
    }

    // Generate new tokens with new organization context
    return this.generateTokens({
      userId,
      organizationId,
      role: membership.role,
    });
  }

  private generateTokens(payload: Omit<JwtPayload, 'iat' | 'exp'>): AuthTokens {
    const accessToken = jwt.sign(payload, CONFIG.JWT_SECRET, {
      expiresIn: '1h',
    });

    const refreshToken = jwt.sign(payload, CONFIG.JWT_SECRET, {
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1 hour in seconds
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Math.random().toString(36).substr(2, 6);
  }

  async validatePermission(
    userId: string, 
    organizationId: string, 
    resource: string, 
    action: string
  ): Promise<boolean> {
    const membership = await storage.getOrganizationMembership(userId, organizationId);
    if (!membership) {
      return false;
    }

    // Role-based permissions
    const rolePermissions: Record<string, string[]> = {
      'super_admin': ['*'],
      'org_owner': ['*'],
      'org_admin': [
        'users.create', 'users.read', 'users.update', 'users.delete',
        'modules.read', 'modules.update',
        'automations.create', 'automations.read', 'automations.update', 'automations.delete',
        'integrations.create', 'integrations.read', 'integrations.update', 'integrations.delete',
        'analytics.read', 'billing.read'
      ],
      'org_manager': [
        'users.read', 'users.update',
        'modules.read', 'modules.update',
        'automations.create', 'automations.read', 'automations.update',
        'integrations.read', 'integrations.update',
        'analytics.read'
      ],
      'org_user': [
        'automations.create', 'automations.read', 'automations.update',
        'integrations.read',
        'analytics.read'
      ],
      'org_viewer': [
        'automations.read',
        'integrations.read',
        'analytics.read'
      ]
    };

    const permissions = rolePermissions[membership.role] || [];
    const requiredPermission = `${resource}.${action}`;

    return permissions.includes('*') || permissions.includes(requiredPermission);
  }
}

export const authService = new AuthService();
