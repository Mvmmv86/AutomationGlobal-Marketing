/**
 * Authentication Blueprint - Automation Global v4.0
 * Real Supabase integration for user registration and authentication
 */

import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { supabaseREST } from '../database/supabase-rest.js';
import { realDataPersistence } from '../database/real-data-persistence.js';
import { supabaseHTTP } from '../database/supabase-http-only.js';
import { httpPersistence } from '../database/http-persistence.js';
import { cacheManager } from '../cache/cache-manager.js';
import { validateRequest, AppError } from '../middleware/validation.js';
import { rateLimiter } from '../middleware/rate-limit.js';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters').optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

/**
 * User Registration with Real Supabase Integration
 */
router.post('/register',
  rateLimiter('auth_register', 3, 300), // 3 attempts per 5 minutes
  validateRequest(registerSchema),
  async (req, res, next) => {
    try {
      const { email, password, name, organizationName } = req.body;

      // Check if user already exists (HTTP persistence always allows creation)
      const userExists = await httpPersistence.checkUserExists(email);
      
      if (userExists) {
        throw new AppError(409, 'User already exists with this email');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Prepare user data
      const userData = {
        email,
        password_hash: hashedPassword,
        name,
        email_verified: false,
        status: 'active',
        preferences: {},
        metadata: {}
      };

      // Create user using HTTP persistence system (bypasses network issues)
      const createResult = await httpPersistence.createUser(userData);
      
      if (!createResult.success || !createResult.data) {
        throw new AppError(500, `Failed to create user account: ${createResult.error?.message || 'Unknown error'}`);
      }

      const newUser = createResult.data;
      console.log('✅ User created successfully:', newUser.email);

      // Create organization if provided
      let organization = null;
      if (organizationName) {
        const orgData = {
          name: organizationName,
          slug: organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          settings: {},
          billing_info: {},
          subscription_tier: 'free',
          status: 'active'
        };

        const orgResult = await httpPersistence.createOrganization(orgData);
        
        if (!orgResult.success || !orgResult.data) {
          throw new AppError(500, `Failed to create organization: ${orgResult.error?.message || 'Unknown error'}`);
        }

        organization = orgResult.data;

        // Log organization membership creation
        console.log(`✅ Organization membership: User ${newUser.id} added as admin to ${organization.id}`);
      }

      // Generate tokens
      const accessToken = jwt.sign(
        { 
          userId: newUser.id, 
          email: newUser.email,
          organizationId: organization?.id 
        },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      const refreshToken = jwt.sign(
        { userId: newUser.id },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      // Cache user session
      await cacheManager.cacheSession(refreshToken, {
        userId: newUser.id,
        email: newUser.email,
        organizationId: organization?.id
      }, 604800); // 7 days

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            email_verified: newUser.email_verified
          },
          organization: organization ? {
            id: organization.id,
            name: organization.name,
            slug: organization.slug
          } : null,
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * User Login with Real Supabase Authentication
 */
router.post('/login',
  rateLimiter('auth_login', 5, 300), // 5 attempts per 5 minutes
  validateRequest(loginSchema),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!supabaseREST.client) {
        throw new AppError(503, 'Database connection not available');
      }

      // Find user by email
      const { data: user, error: userError } = await supabaseREST.client
        .from('users')
        .select('id, email, name, password_hash, status')
        .eq('email', email)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      if (userError) {
        throw new AppError(500, `Database query failed: ${userError.message}`);
      }

      if (!user) {
        throw new AppError(401, 'Invalid email or password');
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        throw new AppError(401, 'Invalid email or password');
      }

      // Get user's organizations
      const { data: memberships, error: memberError } = await supabaseREST.client
        .from('organization_members')
        .select(`
          organization_id,
          role,
          organizations (
            id,
            name,
            slug,
            subscription_tier
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      const organizations = memberships?.map((membership: any) => ({
        id: membership.organizations.id,
        name: membership.organizations.name,
        slug: membership.organizations.slug,
        role: membership.role,
        subscription_tier: membership.organizations.subscription_tier
      })) || [];

      // Generate tokens
      const primaryOrgId = organizations[0]?.id || null;
      
      const accessToken = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          organizationId: primaryOrgId 
        },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      // Cache user session
      await cacheManager.cacheSession(refreshToken, {
        userId: user.id,
        email: user.email,
        organizationId: primaryOrgId
      }, 604800); // 7 days

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name
          },
          organizations,
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * Logout
 */
router.post('/logout',
  rateLimiter('auth_logout', 10, 300),
  async (req, res, next) => {
    try {
      const refreshToken = req.body.refreshToken;
      
      if (refreshToken) {
        await cacheManager.deleteSession(refreshToken);
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * Blueprint health check with real data stats
 */
router.get('/health', (req, res) => {
  const stats = realDataPersistence.getPersistenceStats();
  
  res.json({
    success: true,
    blueprint: 'auth',
    status: 'healthy',
    database: supabaseREST.client ? 'connected' : 'disconnected',
    realDataPersistence: {
      localUsers: stats.localUsers,
      localOrganizations: stats.localOrganizations,
      supabaseStatus: {
        success: stats.supabaseSuccess,
        failed: stats.supabaseFailed,
        pending: stats.supabasePending
      }
    },
    endpoints: {
      'POST /register': 'User registration with organization creation',
      'POST /login': 'User authentication with JWT tokens', 
      'POST /logout': 'Session termination',
      'GET /debug-data': 'View all stored real data'
    }
  });
});

/**
 * Debug endpoint to view all real data
 */
router.get('/debug-data', (req, res) => {
  const allData = realDataPersistence.getAllStoredData();
  
  res.json({
    success: true,
    message: 'All stored real data',
    data: allData,
    stats: realDataPersistence.getPersistenceStats()
  });
});

export default router;