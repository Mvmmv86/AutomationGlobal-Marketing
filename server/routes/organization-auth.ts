import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { storage } from '../storage';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import type { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Schema for validation
const createOrgSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  type: z.enum(['marketing', 'support', 'trading']),
  description: z.string().optional(),
  loginEmail: z.string().email(),
  loginPassword: z.string().min(8),
  displayName: z.string().min(1)
});

const orgLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

// Admin route: Create organization with dedicated credentials
router.post('/admin/create-organization', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Only super_admin can create organizations
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can create organizations' });
    }

    const validation = createOrgSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid data', 
        details: validation.error.errors 
      });
    }

    const { name, slug, type, description, loginEmail, loginPassword, displayName } = validation.data;

    // Check if email already exists
    const existingCredentials = await storage.getOrganizationCredentialsByEmail(loginEmail);
    if (existingCredentials) {
      return res.status(400).json({ error: 'Login email already in use' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(loginPassword, 12);

    // Create organization with credentials
    const result = await storage.createOrganizationWithCredentials(
      {
        name,
        slug,
        type,
        description: description || null,
        isActive: true
      },
      {
        loginEmail,
        loginPassword: hashedPassword,
        displayName,
        createdByAdmin: req.user.id
      }
    );

    // Don't return the hashed password
    const { loginPassword: _, ...credentialsWithoutPassword } = result.credentials;

    res.json({
      success: true,
      organization: result.organization,
      credentials: credentialsWithoutPassword,
      message: `Organization '${name}' created successfully with login: ${loginEmail}`
    });

  } catch (error: any) {
    console.error('Error creating organization:', error);
    res.status(500).json({ error: 'Failed to create organization' });
  }
});

// Organization login
router.post('/organization/login', async (req, res) => {
  try {
    const validation = orgLoginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid email or password format' });
    }

    const { email, password } = validation.data;

    // Get credentials
    const credentials = await storage.getOrganizationCredentialsByEmail(email);
    if (!credentials) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, credentials.loginPassword);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await storage.updateOrganizationCredentialsLastLogin(credentials.id);

    // Create session token
    const sessionToken = jwt.sign(
      { 
        credentialId: credentials.id, 
        organizationId: credentials.organizationId,
        type: 'organization' 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // Create session record
    await storage.createOrganizationSession({
      organizationId: credentials.organizationId,
      credentialId: credentials.id,
      sessionToken,
      accessType: 'organization',
      ip: req.ip,
      userAgent: req.get('User-Agent') || null,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    // Get organization details
    const organization = await storage.getOrganization(credentials.organizationId);

    res.json({
      success: true,
      sessionToken,
      organization: organization,
      credentials: {
        id: credentials.id,
        displayName: credentials.displayName,
        accessLevel: credentials.accessLevel
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

  } catch (error: any) {
    console.error('Error in organization login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Admin impersonation: Access organization as admin
router.post('/admin/impersonate/:organizationId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Only super_admin and org_admin can impersonate
    if (!['super_admin', 'org_admin'].includes(req.user?.role || '')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { organizationId } = req.params;

    // Get organization
    const organization = await storage.getOrganization(organizationId);
    if (!organization || !organization.isActive) {
      return res.status(404).json({ error: 'Organization not found or inactive' });
    }

    // Create admin session token
    const sessionToken = jwt.sign(
      { 
        adminUserId: req.user.id, 
        organizationId: organization.id,
        type: 'admin_impersonate' 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '8h' }
    );

    // Create session record
    await storage.createOrganizationSession({
      organizationId: organization.id,
      adminUserId: req.user.id,
      sessionToken,
      accessType: 'admin_impersonate',
      ip: req.ip,
      userAgent: req.get('User-Agent') || null,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours
    });

    res.json({
      success: true,
      sessionToken,
      organization: organization,
      accessType: 'admin_impersonate',
      adminUser: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      },
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000)
    });

  } catch (error: any) {
    console.error('Error in admin impersonation:', error);
    res.status(500).json({ error: 'Impersonation failed' });
  }
});

// Verify organization session
router.get('/verify-session', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Get session
    const session = await storage.getOrganizationSession(token);
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Get organization
    const organization = await storage.getOrganization(session.organizationId);
    if (!organization || !organization.isActive) {
      return res.status(401).json({ error: 'Organization not found or inactive' });
    }

    let sessionData: any = {
      organization,
      accessType: session.accessType,
      expiresAt: session.expiresAt
    };

    if (session.accessType === 'organization' && session.credentialId) {
      // Get credentials for organization login
      const credentials = await storage.getOrganizationCredentialsById(session.credentialId);
      if (credentials) {
        sessionData.credentials = {
          id: credentials.id,
          displayName: credentials.displayName,
          accessLevel: credentials.accessLevel
        };
      }
    } else if (session.accessType === 'admin_impersonate' && session.adminUserId) {
      // Get admin user info
      const adminUser = await storage.getUser(session.adminUserId);
      if (adminUser) {
        sessionData.adminUser = {
          id: adminUser.id,
          email: adminUser.email,
          role: adminUser.role
        };
      }
    }

    res.json({
      success: true,
      session: sessionData
    });

  } catch (error: any) {
    console.error('Error verifying session:', error);
    res.status(401).json({ error: 'Invalid session' });
  }
});

// Logout (revoke session)
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      await storage.revokeOrganizationSession(token);
    }
    
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('Error in logout:', error);
    res.json({ success: true, message: 'Logged out' }); // Always succeed logout
  }
});

// List organizations by type (for admin)
router.get('/admin/organizations/:type', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!['super_admin', 'org_admin'].includes(req.user?.role || '')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { type } = req.params;
    if (!['marketing', 'support', 'trading'].includes(type)) {
      return res.status(400).json({ error: 'Invalid organization type' });
    }

    const organizations = await storage.getOrganizationsByType(type as 'marketing' | 'support' | 'trading');
    
    // Get credentials for each organization
    const orgsWithCredentials = await Promise.all(
      organizations.map(async (org) => {
        const result = await storage.getOrganizationWithCredentials(org.id);
        return result ? {
          organization: result.organization,
          credentials: result.credentials ? {
            id: result.credentials.id,
            loginEmail: result.credentials.loginEmail,
            displayName: result.credentials.displayName,
            accessLevel: result.credentials.accessLevel,
            lastLoginAt: result.credentials.lastLoginAt,
            createdAt: result.credentials.createdAt
          } : null
        } : null;
      })
    );

    res.json({
      success: true,
      organizations: orgsWithCredentials.filter(org => org !== null)
    });

  } catch (error: any) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
});

export default router;