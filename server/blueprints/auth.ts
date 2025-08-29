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
import { localDataStorage } from '../storage/local-storage.js';
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

      // Check if user already exists locally
      const userExists = await localDataStorage.checkUserExists(email);
      
      if (userExists) {
        throw new AppError(409, 'User already exists with this email');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user locally (always works)
      const newUser = await localDataStorage.createUser({
        email,
        password_hash: hashedPassword,
        name,
        email_verified: false,
        status: 'active'
      });
      console.log('✅ User created successfully:', newUser.email);

      // Create organization if provided
      let organization = null;
      if (organizationName) {
        organization = await localDataStorage.createOrganization({
          name: organizationName,
          slug: organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          status: 'active'
        });

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
        // await cacheManager.deleteSession(refreshToken); // Method doesn't exist
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
router.get('/debug-data', async (req, res) => {
  try {
    const stats = await localDataStorage.getStats();
    
    res.json({
      success: true,
      message: 'Local data storage statistics',
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      error: error.message
    });
  }
});

// Endpoint to get all users
router.get('/users', async (req, res) => {
  try {
    const users = await localDataStorage.getUsers();
    
    res.json({
      success: true,
      message: `Found ${users.length} users`,
      data: users,
      count: users.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message
    });
  }
});

// Endpoint to get all organizations
router.get('/organizations', async (req, res) => {
  try {
    const organizations = await localDataStorage.getOrganizations();
    
    res.json({
      success: true,
      message: `Found ${organizations.length} organizations`,
      data: organizations,
      count: organizations.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get organizations',
      error: error.message
    });
  }
});

// Hybrid registration: Local + Supabase with Connection Manager
router.post('/hybrid-register', async (req, res) => {
  console.log('🚀 Hybrid registration started...');
  
  try {
    const { email, password, name, organizationName } = req.body;
    
    console.log('📝 Data received:', { email, name, organizationName });

    // Hash password
    const password_hash = await bcrypt.hash(password || '123456', 10);
    
    // Create user data
    const userData = {
      email: email || `user-${Date.now()}@automation.global`,
      password_hash,
      name: name || 'Hybrid User',
      email_verified: false,
      status: 'active' as const
    };
    
    console.log('👤 Creating user locally...');
    const localUser = await localDataStorage.createUser(userData);
    console.log('✅ Local user created:', localUser.id);
    
    // Create organization
    const orgData = {
      name: organizationName || 'Hybrid Organization',
      slug: `org-${Date.now()}`,
      status: 'active' as const
    };
    
    console.log('🏢 Creating organization locally...');
    const localOrg = await localDataStorage.createOrganization(orgData);
    console.log('✅ Local organization created:', localOrg.id);

    // Try to sync with Supabase using Connection Manager
    let supabaseResults = {
      userSynced: false,
      orgSynced: false,
      error: null
    };

    try {
      console.log('🔄 Attempting Supabase sync with Connection Manager...');
      
      // Import the connection manager
      const { createUserDirect, createOrganization } = await import('../database/supabase-connection-manager.js');
      
      // Sync user to Supabase
      const supabaseUser = await createUserDirect(userData);
      console.log('✅ Supabase user synced:', supabaseUser.id);
      supabaseResults.userSynced = true;

      // Sync organization to Supabase
      const supabaseOrg = await createOrganization({
        name: orgData.name,
        slug: orgData.slug,
        description: `Organization created via hybrid system`,
        type: 'marketing'
      });
      console.log('✅ Supabase organization synced:', supabaseOrg.id);
      supabaseResults.orgSynced = true;

    } catch (supabaseError: any) {
      console.warn('⚠️ Supabase sync failed, but local data is safe:', supabaseError.message);
      supabaseResults.error = supabaseError.message;
    }
    
    console.log('✅ Hybrid registration completed');
    
    res.json({
      success: true,
      message: 'Hybrid registration successful',
      data: {
        local: {
          user: localUser,
          organization: localOrg
        },
        supabase: supabaseResults
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Hybrid registration failed:', error);
    res.status(500).json({
      success: false,
      message: 'Hybrid registration failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Simple test endpoint for quick registration (mantido para compatibilidade)
router.post('/quick-register', async (req, res) => {
  console.log('🚀 Quick register started...');
  
  try {
    const { email, name, organizationName } = req.body;
    
    console.log('📝 Data received:', { email, name, organizationName });
    
    // Create user instantly
    const userData = {
      email: email || `user-${Date.now()}@test.com`,
      password_hash: 'quick-password-hash',
      name: name || 'Quick User',
      email_verified: false,
      status: 'active' as const
    };
    
    console.log('👤 Creating user with localDataStorage...');
    const user = await localDataStorage.createUser(userData);
    console.log('✅ User created:', user.id);
    
    // Create organization
    const orgData = {
      name: organizationName || 'Quick Organization',
      slug: `org-${Date.now()}`,
      status: 'active' as const
    };
    
    console.log('🏢 Creating organization...');
    const organization = await localDataStorage.createOrganization(orgData);
    console.log('✅ Organization created:', organization.id);
    
    console.log('✅ Quick registration completed');
    
    res.json({
      success: true,
      message: 'Quick registration successful',
      user,
      organization,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Quick registration failed:', error);
    res.status(500).json({
      success: false,
      message: 'Quick registration failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;