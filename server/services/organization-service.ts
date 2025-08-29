// server/services/organization-service.ts
import { db } from '../database/drizzle-connection.js';
import { organizations, organizationUsers, users } from '../../shared/schema.js';
import { eq, and } from 'drizzle-orm';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logo?: string;
  description?: string;
  type: 'marketing' | 'support' | 'trading' | 'enterprise';
  subscriptionPlan: 'starter' | 'professional' | 'enterprise';
  settings: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationMembership {
  id: string;
  userId: string;
  organizationId: string;
  role: 'super_admin' | 'org_owner' | 'org_admin' | 'org_manager' | 'org_user' | 'org_viewer';
  permissions: Record<string, any>;
  isActive: boolean;
  joinedAt: Date;
}

export interface UserOrganization {
  organization: Organization;
  membership: OrganizationMembership;
}

export interface CreateOrganizationData {
  name: string;
  slug: string;
  domain?: string;
  description?: string;
  type?: 'marketing' | 'support' | 'trading' | 'enterprise';
  subscriptionPlan?: 'starter' | 'professional' | 'enterprise';
}

export interface UpdateOrganizationData {
  name?: string;
  slug?: string;
  domain?: string;
  logo?: string;
  description?: string;
  type?: 'marketing' | 'support' | 'trading' | 'enterprise';
  subscriptionPlan?: 'starter' | 'professional' | 'enterprise';
  settings?: Record<string, any>;
  isActive?: boolean;
}

class OrganizationService {
  // Buscar organização por ID
  async getOrganizationById(organizationId: string): Promise<Organization | null> {
    try {
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, organizationId));

      return org || null;
    } catch (error) {
      console.error('❌ Error fetching organization by ID:', error.message);
      throw new Error(`Failed to fetch organization: ${error.message}`);
    }
  }

  // Buscar organização por slug
  async getOrganizationBySlug(slug: string): Promise<Organization | null> {
    try {
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.slug, slug));

      return org || null;
    } catch (error) {
      console.error('❌ Error fetching organization by slug:', error.message);
      throw new Error(`Failed to fetch organization: ${error.message}`);
    }
  }

  // Buscar organizações do usuário
  async getUserOrganizations(userId: string): Promise<UserOrganization[]> {
    try {
      const results = await db
        .select({
          organization: organizations,
          membership: organizationUsers
        })
        .from(organizationUsers)
        .innerJoin(organizations, eq(organizationUsers.organizationId, organizations.id))
        .where(
          and(
            eq(organizationUsers.userId, userId),
            eq(organizationUsers.isActive, true),
            eq(organizations.isActive, true)
          )
        );

      return results.map(result => ({
        organization: result.organization,
        membership: result.membership
      }));
    } catch (error) {
      console.error('❌ Error fetching user organizations:', error.message);
      throw new Error(`Failed to fetch user organizations: ${error.message}`);
    }
  }

  // Verificar se usuário tem acesso à organização
  async hasAccess(userId: string, organizationId: string): Promise<boolean> {
    try {
      const [membership] = await db
        .select()
        .from(organizationUsers)
        .where(
          and(
            eq(organizationUsers.userId, userId),
            eq(organizationUsers.organizationId, organizationId),
            eq(organizationUsers.isActive, true)
          )
        );

      return !!membership;
    } catch (error) {
      console.error('❌ Error checking organization access:', error.message);
      return false;
    }
  }

  // Obter membership do usuário em uma organização
  async getUserMembership(userId: string, organizationId: string): Promise<OrganizationMembership | null> {
    try {
      const [membership] = await db
        .select()
        .from(organizationUsers)
        .where(
          and(
            eq(organizationUsers.userId, userId),
            eq(organizationUsers.organizationId, organizationId),
            eq(organizationUsers.isActive, true)
          )
        );

      return membership || null;
    } catch (error) {
      console.error('❌ Error fetching user membership:', error.message);
      throw new Error(`Failed to fetch user membership: ${error.message}`);
    }
  }

  // Verificar se usuário tem permissão específica
  async hasPermission(userId: string, organizationId: string, permission: string): Promise<boolean> {
    try {
      const membership = await this.getUserMembership(userId, organizationId);
      
      if (!membership) {
        return false;
      }

      // Super admin sempre tem todas as permissões
      if (membership.role === 'super_admin') {
        return true;
      }

      // Verificar se a permissão está na lista
      return membership.permissions && membership.permissions[permission] === true;
    } catch (error) {
      console.error('❌ Error checking permission:', error.message);
      return false;
    }
  }

  // Verificar se usuário tem role específico
  async hasRole(userId: string, organizationId: string, roles: string | string[]): Promise<boolean> {
    try {
      const membership = await this.getUserMembership(userId, organizationId);
      
      if (!membership) {
        return false;
      }

      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      return allowedRoles.includes(membership.role);
    } catch (error) {
      console.error('❌ Error checking role:', error.message);
      return false;
    }
  }

  // Criar nova organização
  async createOrganization(data: CreateOrganizationData, creatorUserId: string): Promise<Organization> {
    try {
      console.log('🏢 Creating organization:', data.name);

      // Verificar se slug já existe
      const existingOrg = await this.getOrganizationBySlug(data.slug);
      if (existingOrg) {
        throw new Error(`Organization slug '${data.slug}' already exists`);
      }

      // Criar organização
      const [newOrg] = await db
        .insert(organizations)
        .values({
          name: data.name,
          slug: data.slug,
          domain: data.domain,
          description: data.description,
          type: data.type || 'marketing',
          subscriptionPlan: data.subscriptionPlan || 'starter',
          settings: {},
          isActive: true
        })
        .returning();

      // Adicionar criador como super_admin
      await db
        .insert(organizationUsers)
        .values({
          userId: creatorUserId,
          organizationId: newOrg.id,
          role: 'super_admin',
          permissions: { '*': true }, // Todas as permissões
          isActive: true
        });

      console.log('✅ Organization created:', newOrg.id);
      return newOrg;
    } catch (error) {
      console.error('❌ Error creating organization:', error.message);
      throw error;
    }
  }

  // Atualizar organização
  async updateOrganization(organizationId: string, data: UpdateOrganizationData, userId: string): Promise<Organization> {
    try {
      // Verificar se usuário tem permissão para editar
      const hasPermission = await this.hasPermission(userId, organizationId, 'manage_organization') ||
                           await this.hasRole(userId, organizationId, ['super_admin', 'org_admin']);

      if (!hasPermission) {
        throw new Error('Insufficient permissions to update organization');
      }

      const [updatedOrg] = await db
        .update(organizations)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(organizations.id, organizationId))
        .returning();

      if (!updatedOrg) {
        throw new Error('Organization not found');
      }

      console.log('✅ Organization updated:', updatedOrg.id);
      return updatedOrg;
    } catch (error) {
      console.error('❌ Error updating organization:', error.message);
      throw error;
    }
  }

  // Switch context para uma organização
  async switchOrganizationContext(userId: string, organizationId: string): Promise<UserOrganization> {
    try {
      // Verificar se usuário tem acesso
      const hasAccess = await this.hasAccess(userId, organizationId);
      if (!hasAccess) {
        throw new Error('User does not have access to this organization');
      }

      // Buscar dados completos
      const organization = await this.getOrganizationById(organizationId);
      const membership = await this.getUserMembership(userId, organizationId);

      if (!organization || !membership) {
        throw new Error('Organization or membership not found');
      }

      console.log('✅ Organization context switched:', userId, organizationId);
      
      return {
        organization,
        membership
      };
    } catch (error) {
      console.error('❌ Error switching organization context:', error.message);
      throw error;
    }
  }

  // Listar todos os membros de uma organização
  async getOrganizationMembers(organizationId: string, requesterId: string): Promise<Array<{
    user: any;
    membership: OrganizationMembership;
  }>> {
    try {
      // Verificar se requester tem acesso
      const hasAccess = await this.hasAccess(requesterId, organizationId);
      if (!hasAccess) {
        throw new Error('Access denied to organization members');
      }

      const results = await db
        .select({
          user: users,
          membership: organizationUsers
        })
        .from(organizationUsers)
        .innerJoin(users, eq(organizationUsers.userId, users.id))
        .where(
          and(
            eq(organizationUsers.organizationId, organizationId),
            eq(organizationUsers.isActive, true)
          )
        );

      return results;
    } catch (error) {
      console.error('❌ Error fetching organization members:', error.message);
      throw error;
    }
  }
}

// Singleton instance
export const organizationService = new OrganizationService();
export default organizationService;