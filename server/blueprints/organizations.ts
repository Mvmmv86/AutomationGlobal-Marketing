/**
 * Organizations Blueprint - Automation Global v4.0
 * Handles organization management, member operations, and tenant switching
 */

import { Router } from 'express';
import { z } from 'zod';
import { supabaseRest } from '../database/supabase-rest.js';
import { cacheManager } from '../cache/cache-manager.js';
import { validateRequest, AppError } from '../middleware/validation.js';
import { requireAuth, requireOrganization, requirePermission } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rate-limit.js';

const router = Router();

// Validation schemas
const createOrgSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  description: z.string().optional(),
  industry: z.string().optional()
});

const updateOrgSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  industry: z.string().optional(),
  settings: z.object({}).optional()
});

const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum(['admin', 'manager', 'member', 'viewer'], {
    errorMap: () => ({ message: 'Role must be one of: admin, manager, member, viewer' })
  }),
  message: z.string().optional()
});

const updateMemberSchema = z.object({
  role: z.enum(['admin', 'manager', 'member', 'viewer']).optional(),
  status: z.enum(['active', 'inactive', 'pending']).optional()
});

/**
 * Get all organizations for current user
 */
router.get('/', 
  requireAuth,
  async (req, res, next) => {
    try {
      const userId = (req as any).user.id;

      const orgsResult = await supabaseRest.query({
        table: 'organization_members',
        filters: { user_id: userId, status: 'active' },
        joins: [{
          table: 'organizations',
          on: 'organization_id',
          select: ['id', 'name', 'slug', 'description', 'status', 'subscription_tier', 'created_at']
        }]
      });

      if (!orgsResult.success) {
        throw new AppError(500, 'Failed to fetch organizations');
      }

      const organizations = (orgsResult.data || []).map((membership: any) => ({
        id: membership.organizations.id,
        name: membership.organizations.name,
        slug: membership.organizations.slug,
        description: membership.organizations.description,
        status: membership.organizations.status,
        subscriptionTier: membership.organizations.subscription_tier,
        memberRole: membership.role,
        memberStatus: membership.status,
        joinedAt: membership.joined_at,
        createdAt: membership.organizations.created_at
      }));

      res.json({
        success: true,
        data: organizations
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * Create new organization
 */
router.post('/',
  requireAuth,
  rateLimiter('org_create', 3, 3600), // 3 organizations per hour
  validateRequest(createOrgSchema),
  async (req, res, next) => {
    try {
      const userId = (req as any).user.id;
      const { name, description, industry } = req.body;

      // Generate slug from name
      const slug = name.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);

      // Check if slug already exists
      const existingOrg = await supabaseRest.query({
        table: 'organizations',
        filters: { slug },
        limit: 1
      });

      if (existingOrg.data && existingOrg.data.length > 0) {
        throw new AppError(409, 'Organization with this name already exists');
      }

      // Create organization
      const orgData = {
        name,
        slug,
        description: description || '',
        settings: {
          industry: industry || '',
          timezone: 'UTC',
          dateFormat: 'YYYY-MM-DD',
          currency: 'USD'
        },
        billing_info: {},
        subscription_tier: 'free',
        status: 'active'
      };

      const createOrgResult = await supabaseRest.insert('organizations', orgData);
      
      if (!createOrgResult.success || !createOrgResult.data?.[0]) {
        throw new AppError(500, 'Failed to create organization');
      }

      const newOrg = createOrgResult.data[0];

      // Add creator as admin
      await supabaseRest.insert('organization_members', {
        user_id: userId,
        organization_id: newOrg.id,
        role: 'admin',
        status: 'active',
        joined_at: new Date().toISOString()
      });

      // Cache organization data
      await cacheManager.cacheOrganization(newOrg.id, newOrg);

      res.status(201).json({
        success: true,
        message: 'Organization created successfully',
        data: {
          id: newOrg.id,
          name: newOrg.name,
          slug: newOrg.slug,
          description: newOrg.description,
          subscriptionTier: newOrg.subscription_tier,
          memberRole: 'admin',
          createdAt: newOrg.created_at
        }
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get organization details
 */
router.get('/:orgId',
  requireAuth,
  requireOrganization,
  async (req, res, next) => {
    try {
      const orgId = req.params.orgId;
      const organization = (req as any).organization;

      res.json({
        success: true,
        data: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          description: organization.description,
          settings: organization.settings,
          subscriptionTier: organization.subscription_tier,
          status: organization.status,
          createdAt: organization.created_at
        }
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * Update organization
 */
router.put('/:orgId',
  requireAuth,
  requireOrganization,
  requirePermission('org:manage'),
  validateRequest(updateOrgSchema),
  async (req, res, next) => {
    try {
      const orgId = req.params.orgId;
      const updates = req.body;

      // If name is being updated, regenerate slug
      if (updates.name) {
        const newSlug = updates.name.toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50);

        // Check if new slug conflicts with existing organization
        const existingOrg = await supabaseRest.query({
          table: 'organizations',
          filters: { slug: newSlug },
          limit: 1
        });

        if (existingOrg.data && existingOrg.data.length > 0 && existingOrg.data[0].id !== orgId) {
          throw new AppError(409, 'Organization with this name already exists');
        }

        updates.slug = newSlug;
      }

      const updateResult = await supabaseRest.update('organizations', orgId, updates);

      if (!updateResult.success) {
        throw new AppError(500, 'Failed to update organization');
      }

      // Invalidate cache
      await cacheManager.invalidateOrganizationCache(orgId);

      res.json({
        success: true,
        message: 'Organization updated successfully',
        data: updateResult.data
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get organization members
 */
router.get('/:orgId/members',
  requireAuth,
  requireOrganization,
  requirePermission('org:view'),
  async (req, res, next) => {
    try {
      const orgId = req.params.orgId;

      const membersResult = await supabaseRest.query({
        table: 'organization_members',
        filters: { organization_id: orgId },
        joins: [{
          table: 'users',
          on: 'user_id',
          select: ['id', 'email', 'name', 'created_at']
        }]
      });

      if (!membersResult.success) {
        throw new AppError(500, 'Failed to fetch organization members');
      }

      const members = (membersResult.data || []).map((membership: any) => ({
        id: membership.id,
        userId: membership.user_id,
        email: membership.users.email,
        name: membership.users.name,
        role: membership.role,
        status: membership.status,
        joinedAt: membership.joined_at,
        userCreatedAt: membership.users.created_at
      }));

      res.json({
        success: true,
        data: members
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * Invite member to organization
 */
router.post('/:orgId/members/invite',
  requireAuth,
  requireOrganization,
  requirePermission('org:manage'),
  rateLimiter('invite_member', 10, 3600), // 10 invites per hour
  validateRequest(inviteMemberSchema),
  async (req, res, next) => {
    try {
      const orgId = req.params.orgId;
      const { email, role, message } = req.body;

      // Check if user exists
      const userResult = await supabaseRest.query({
        table: 'users',
        filters: { email, status: 'active' },
        limit: 1
      });

      if (!userResult.success || !userResult.data || userResult.data.length === 0) {
        throw new AppError(404, 'User not found with this email');
      }

      const user = userResult.data[0];

      // Check if user is already a member
      const existingMember = await supabaseRest.query({
        table: 'organization_members',
        filters: { user_id: user.id, organization_id: orgId },
        limit: 1
      });

      if (existingMember.data && existingMember.data.length > 0) {
        throw new AppError(409, 'User is already a member of this organization');
      }

      // Add member
      const memberData = {
        user_id: user.id,
        organization_id: orgId,
        role,
        status: 'active',
        joined_at: new Date().toISOString()
      };

      const addMemberResult = await supabaseRest.insert('organization_members', memberData);

      if (!addMemberResult.success) {
        throw new AppError(500, 'Failed to add member to organization');
      }

      res.status(201).json({
        success: true,
        message: 'Member invited successfully',
        data: {
          userId: user.id,
          email: user.email,
          name: user.name,
          role,
          status: 'active'
        }
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * Update member role/status
 */
router.put('/:orgId/members/:memberId',
  requireAuth,
  requireOrganization,
  requirePermission('org:manage'),
  validateRequest(updateMemberSchema),
  async (req, res, next) => {
    try {
      const { orgId, memberId } = req.params;
      const updates = req.body;

      const updateResult = await supabaseRest.update('organization_members', memberId, updates);

      if (!updateResult.success) {
        throw new AppError(500, 'Failed to update member');
      }

      res.json({
        success: true,
        message: 'Member updated successfully',
        data: updateResult.data
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * Remove member from organization
 */
router.delete('/:orgId/members/:memberId',
  requireAuth,
  requireOrganization,
  requirePermission('org:manage'),
  async (req, res, next) => {
    try {
      const { orgId, memberId } = req.params;

      const deleteResult = await supabaseRest.delete('organization_members', memberId);

      if (!deleteResult.success) {
        throw new AppError(500, 'Failed to remove member');
      }

      res.json({
        success: true,
        message: 'Member removed successfully'
      });

    } catch (error) {
      next(error);
    }
  }
);

export default router;