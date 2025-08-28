import { storage } from '../storage';
import { CONFIG } from '../config';
import type { Organization, InsertOrganization, OrganizationUser } from '@shared/schema';

export interface OrganizationStats {
  totalUsers: number;
  totalAutomations: number;
  totalAiRequests: number;
  totalCost: number;
  activeModules: number;
}

export interface CreateOrganizationRequest extends InsertOrganization {
  ownerUserId: string;
  template?: 'marketing' | 'support' | 'trading';
}

class OrganizationService {
  async createOrganization(data: CreateOrganizationRequest): Promise<Organization> {
    // Create organization
    const organization = await storage.createOrganization({
      name: data.name,
      slug: data.slug || this.generateSlug(data.name),
      domain: data.domain,
      logo: data.logo,
      description: data.description,
      type: data.type,
      subscriptionPlan: data.subscriptionPlan || 'starter',
      settings: data.settings,
    });

    // Add owner as org_owner
    await storage.addUserToOrganization({
      userId: data.ownerUserId,
      organizationId: organization.id,
      role: 'org_owner',
    });

    // Apply template if specified
    if (data.template) {
      await this.applyTemplate(organization.id, data.template);
    }

    // Log activity
    await storage.logActivity({
      organizationId: organization.id,
      userId: data.ownerUserId,
      action: 'organization.created',
      resource: 'organization',
      resourceId: organization.id,
      details: { name: data.name, type: data.type, plan: data.subscriptionPlan },
    });

    return organization;
  }

  async getOrganization(organizationId: string): Promise<Organization | undefined> {
    return await storage.getOrganization(organizationId);
  }

  async updateOrganization(organizationId: string, data: Partial<Organization>): Promise<Organization> {
    const organization = await storage.updateOrganization(organizationId, data);

    // Log activity
    await storage.logActivity({
      organizationId,
      action: 'organization.updated',
      resource: 'organization',
      resourceId: organizationId,
      details: data,
    });

    return organization;
  }

  async getOrganizationStats(organizationId: string): Promise<OrganizationStats> {
    const [users, automations, aiUsage, modules] = await Promise.all([
      storage.getOrganizationUsers(organizationId),
      storage.getOrganizationAutomations(organizationId),
      storage.getAiUsageStats(organizationId, 'month'),
      storage.getOrganizationActiveModules(organizationId),
    ]);

    return {
      totalUsers: users.length,
      totalAutomations: automations.length,
      totalAiRequests: aiUsage.totalRequests,
      totalCost: aiUsage.totalCost,
      activeModules: modules.length,
    };
  }

  async addUserToOrganization(
    organizationId: string, 
    userId: string, 
    role: string,
    invitedBy: string
  ): Promise<OrganizationUser> {
    // Check organization exists
    const organization = await storage.getOrganization(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    // Check user limits based on plan
    const plan = CONFIG.PLANS[organization.subscriptionPlan];
    const currentUsers = await storage.getOrganizationUsers(organizationId);
    
    if (plan.maxUsers !== -1 && currentUsers.length >= plan.maxUsers) {
      throw new Error(`Organization has reached the user limit for ${organization.subscriptionPlan} plan`);
    }

    // Add user to organization
    const membership = await storage.addUserToOrganization({
      userId,
      organizationId,
      role,
      invitedBy,
    });

    // Log activity
    await storage.logActivity({
      organizationId,
      userId: invitedBy,
      action: 'user.added',
      resource: 'organization_user',
      resourceId: membership.id,
      details: { userId, role },
    });

    return membership;
  }

  async removeUserFromOrganization(
    organizationId: string, 
    userId: string,
    removedBy: string
  ): Promise<void> {
    // Check user is not the only owner
    const owners = await storage.getOrganizationOwners(organizationId);
    const userMembership = owners.find(o => o.userId === userId);
    
    if (userMembership && owners.length === 1) {
      throw new Error('Cannot remove the last owner of an organization');
    }

    await storage.removeUserFromOrganization(organizationId, userId);

    // Log activity
    await storage.logActivity({
      organizationId,
      userId: removedBy,
      action: 'user.removed',
      resource: 'organization_user',
      details: { userId },
    });
  }

  async updateUserRole(
    organizationId: string,
    userId: string,
    newRole: string,
    updatedBy: string
  ): Promise<OrganizationUser> {
    const membership = await storage.updateUserRole(organizationId, userId, newRole);

    // Log activity
    await storage.logActivity({
      organizationId,
      userId: updatedBy,
      action: 'user.role_updated',
      resource: 'organization_user',
      resourceId: membership.id,
      details: { userId, newRole },
    });

    return membership;
  }

  async upgradeSubscription(
    organizationId: string,
    newPlan: 'starter' | 'professional' | 'enterprise',
    upgradedBy: string
  ): Promise<Organization> {
    const organization = await storage.updateOrganization(organizationId, {
      subscriptionPlan: newPlan,
    });

    // Log activity
    await storage.logActivity({
      organizationId,
      userId: upgradedBy,
      action: 'subscription.upgraded',
      resource: 'organization',
      resourceId: organizationId,
      details: { newPlan },
    });

    return organization;
  }

  async checkQuotas(organizationId: string): Promise<{
    users: { current: number; limit: number; withinLimit: boolean };
    aiRequests: { current: number; limit: number; withinLimit: boolean };
    modules: { current: number; limit: number; withinLimit: boolean };
  }> {
    const organization = await storage.getOrganization(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    const plan = CONFIG.PLANS[organization.subscriptionPlan];
    const [users, aiUsage, modules] = await Promise.all([
      storage.getOrganizationUsers(organizationId),
      storage.getAiUsageStats(organizationId, 'month'),
      storage.getOrganizationActiveModules(organizationId),
    ]);

    return {
      users: {
        current: users.length,
        limit: plan.maxUsers,
        withinLimit: plan.maxUsers === -1 || users.length < plan.maxUsers,
      },
      aiRequests: {
        current: aiUsage.totalRequests,
        limit: plan.maxAiRequests,
        withinLimit: aiUsage.totalRequests < plan.maxAiRequests,
      },
      modules: {
        current: modules.length,
        limit: plan.maxModules,
        withinLimit: plan.maxModules === -1 || modules.length < plan.maxModules,
      },
    };
  }

  private async applyTemplate(organizationId: string, template: 'marketing' | 'support' | 'trading'): Promise<void> {
    // Template configurations for different business types
    const templates = {
      marketing: {
        modules: ['marketing-ai', 'content-ai', 'analytics-ai'],
        integrations: ['google-ads', 'facebook-ads', 'hubspot'],
        defaultAutomations: [
          {
            name: 'Lead Scoring Automation',
            description: 'Automatically score leads based on behavior and demographics',
            trigger: { type: 'webhook', source: 'lead_created' },
            actions: [
              { type: 'ai_analysis', model: 'gpt-5', prompt: 'Analyze lead quality' },
              { type: 'update_crm', field: 'score' }
            ]
          }
        ]
      },
      support: {
        modules: ['support-ai', 'chatbot-ai', 'knowledge-base-ai'],
        integrations: ['zendesk', 'intercom', 'slack'],
        defaultAutomations: [
          {
            name: 'Ticket Auto-Classification',
            description: 'Automatically classify and prioritize support tickets',
            trigger: { type: 'webhook', source: 'ticket_created' },
            actions: [
              { type: 'ai_classification', model: 'claude-sonnet-4-20250514' },
              { type: 'assign_priority' },
              { type: 'route_to_agent' }
            ]
          }
        ]
      },
      trading: {
        modules: ['trading-ai', 'risk-management-ai', 'market-analysis-ai'],
        integrations: ['binance', 'coinbase', 'tradingview'],
        defaultAutomations: [
          {
            name: 'Market Signal Analysis',
            description: 'Analyze market data and generate trading signals',
            trigger: { type: 'schedule', interval: '5m' },
            actions: [
              { type: 'fetch_market_data' },
              { type: 'ai_analysis', model: 'gpt-5', prompt: 'Analyze market trends' },
              { type: 'generate_signals' }
            ]
          }
        ]
      }
    };

    const templateConfig = templates[template];
    
    // Activate modules (would need module management implementation)
    for (const moduleSlug of templateConfig.modules) {
      // await storage.activateModuleForOrganization(organizationId, moduleSlug);
    }

    // Create default automations
    for (const automation of templateConfig.defaultAutomations) {
      await storage.createAutomation({
        organizationId,
        name: automation.name,
        description: automation.description,
        trigger: automation.trigger,
        actions: automation.actions,
        createdBy: 'system', // system-generated
        isActive: true,
      });
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Math.random().toString(36).substr(2, 6);
  }
}

export const organizationService = new OrganizationService();
