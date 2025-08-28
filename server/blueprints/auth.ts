/**
 * Authentication Blueprint - Automation Global v4.0
 * Handles user authentication, registration, and session management
 */

import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { supabaseRest } from '../database/supabase-rest.js';
import { cacheManager } from '../cache/cache-manager.js';
import { validateRequest, AppError } from '../middleware/validation.js';
import { rateLimiter } from '../middleware/rate-limit.js';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  organizationName: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

/**
 * User Registration
 */
router.post('/register', 
  rateLimiter('auth', 5, 900), // 5 attempts per 15 minutes
  validateRequest(registerSchema),
  async (req, res, next) => {
    try {
      const { email, password, name, organizationName } = req.body;

      // Check if user already exists
      const existingUser = await supabaseRest.query({
        table: 'users',
        filters: { email },
        limit: 1
      });

      if (existingUser.data && existingUser.data.length > 0) {
        throw new AppError(409, 'User already exists with this email');
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const userData = {
        email,
        password_hash: hashedPassword,
        name,
        email_verified: false,
        status: 'active',
        preferences: {},
        metadata: {}
      };

      const createUserResult = await supabaseRest.insert('users', userData);
      
      if (!createUserResult.success || !createUserResult.data?.[0]) {
        throw new AppError(500, 'Failed to create user account');
      }

      const newUser = createUserResult.data[0];

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

        const createOrgResult = await supabaseRest.insert('organizations', orgData);
        
        if (createOrgResult.success && createOrgResult.data?.[0]) {
          organization = createOrgResult.data[0];

          // Add user to organization as admin
          await supabaseRest.insert('organization_members', {
            user_id: newUser.id,
            organization_id: organization.id,
            role: 'admin',
            status: 'active',
            joined_at: new Date().toISOString()
          });
        }
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
            emailVerified: newUser.email_verified
          },
          organization: organization ? {
            id: organization.id,
            name: organization.name,
            slug: organization.slug
          } : null,
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: 3600
          }
        }
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * User Login
 */
router.post('/login',
  rateLimiter('auth', 10, 900), // 10 attempts per 15 minutes
  validateRequest(loginSchema),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Get user by email
      const userResult = await supabaseRest.query({
        table: 'users',
        filters: { email, status: 'active' },
        limit: 1
      });

      if (!userResult.success || !userResult.data || userResult.data.length === 0) {
        throw new AppError(401, 'Invalid email or password');
      }

      const user = userResult.data[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        throw new AppError(401, 'Invalid email or password');
      }

      // Get user's organizations
      const orgsResult = await supabaseRest.query({
        table: 'organization_members',
        filters: { user_id: user.id, status: 'active' },
        joins: [{
          table: 'organizations',
          on: 'organization_id',
          select: ['id', 'name', 'slug', 'status']
        }]
      });

      const organizations = orgsResult.data || [];
      const primaryOrg = organizations.length > 0 ? organizations[0].organizations : null;

      // Generate tokens
      const accessToken = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          organizationId: primaryOrg?.id 
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
        organizationId: primaryOrg?.id,
        organizations
      }, 604800); // 7 days

      // Cache user data
      await cacheManager.cacheUser(user.id, {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.email_verified,
        lastLogin: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            emailVerified: user.email_verified
          },
          organization: primaryOrg,
          organizations: organizations.map(org => org.organizations),
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: 3600
          }
        }
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * Refresh Token
 */
router.post('/refresh',
  rateLimiter('auth', 20, 900), // 20 attempts per 15 minutes
  validateRequest(refreshTokenSchema),
  async (req, res, next) => {
    try {
      const { refreshToken } = req.body;

      // Verify refresh token
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;
      } catch (error) {
        throw new AppError(401, 'Invalid refresh token');
      }

      // Get session from cache
      const session = await cacheManager.getSession(refreshToken);
      if (!session) {
        throw new AppError(401, 'Session expired or invalid');
      }

      // Get fresh user data
      const userResult = await supabaseRest.query({
        table: 'users',
        filters: { id: decoded.userId, status: 'active' },
        limit: 1
      });

      if (!userResult.success || !userResult.data || userResult.data.length === 0) {
        throw new AppError(401, 'User not found or inactive');
      }

      const user = userResult.data[0];

      // Generate new access token
      const newAccessToken = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          organizationId: session.organizationId 
        },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: newAccessToken,
          expiresIn: 3600
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
router.post('/logout', async (req, res, next) => {
  try {
    const refreshToken = req.body.refreshToken || req.headers.authorization?.replace('Bearer ', '');
    
    if (refreshToken) {
      await cacheManager.invalidateSession(refreshToken);
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Get Current User Profile
 */
router.get('/profile', async (req, res, next) => {
  try {
    // This route requires authentication middleware to be applied
    const userId = (req as any).user?.id;
    
    if (!userId) {
      throw new AppError(401, 'Authentication required');
    }

    // Try cache first
    let user = await cacheManager.getUser(userId);
    
    if (!user) {
      // Get from database
      const userResult = await supabaseRest.query({
        table: 'users',
        filters: { id: userId, status: 'active' },
        limit: 1
      });

      if (!userResult.success || !userResult.data || userResult.data.length === 0) {
        throw new AppError(404, 'User not found');
      }

      user = userResult.data[0];
      
      // Cache for future requests
      await cacheManager.cacheUser(userId, user);
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.email_verified,
        preferences: user.preferences || {},
        createdAt: user.created_at
      }
    });

  } catch (error) {
    next(error);
  }
});

export default router;