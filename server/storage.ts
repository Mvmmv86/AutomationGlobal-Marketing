import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, desc, count, sum, gte, or } from "drizzle-orm";
import { CONFIG } from "./config";
import * as schema from "@shared/schema";
import type { 
  User, 
  InsertUser, 
  Organization, 
  InsertOrganization, 
  OrganizationUser,
  InsertOrganizationUser,
  Automation,
  InsertAutomation,
  AiUsageLog,
  InsertAiUsageLog,
  ActivityLog,
  InsertActivityLog,
  Module,
  OrganizationModule,
  MarketingMetric,
  InsertMarketingMetric,
  MarketingChannel,
  InsertMarketingChannel,
  MarketingAiInsight,
  InsertMarketingAiInsight,
  MarketingPreference,
  InsertMarketingPreference
} from "@shared/schema";

// Database connection for production
const connectionString = CONFIG.DATABASE_URL;
const client = postgres(connectionString, {
  ssl: CONFIG.NODE_ENV === 'production' ? 'require' : 'prefer',
  max: 20, // Production pool size
  idle_timeout: 20,
  connect_timeout: 60,
});

const db = drizzle(client, { schema });

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser & { password: string }): Promise<User>;
  updateUserLastLogin(userId: string): Promise<void>;
  updateUser(id: string, data: Partial<User>): Promise<User>;

  // Organization methods
  getOrganization(id: string): Promise<Organization | undefined>;
  getOrganizationBySlug(slug: string): Promise<Organization | undefined>;
  getAllOrganizations(): Promise<Organization[]>;
  getAllUsers(): Promise<User[]>;
  createOrganization(data: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, data: Partial<Organization>): Promise<Organization>;
  getUserOrganizations(userId: string): Promise<Array<OrganizationUser & { organization: Organization }>>;
  getOrganizationUsers(organizationId: string): Promise<Array<OrganizationUser & { user: User }>>;
  getOrganizationOwners(organizationId: string): Promise<OrganizationUser[]>;
  addUserToOrganization(data: InsertOrganizationUser): Promise<OrganizationUser>;
  removeUserFromOrganization(organizationId: string, userId: string): Promise<void>;
  updateUserRole(organizationId: string, userId: string, role: string): Promise<OrganizationUser>;
  getOrganizationMembership(userId: string, organizationId: string): Promise<OrganizationUser | undefined>;

  // Module methods  
  getModules(): Promise<Module[]>;
  getOrganizationModules(organizationId: string): Promise<Array<OrganizationModule & { module: Module }>>;
  activateModuleForOrganization(organizationId: string, moduleId: string, activatedBy: string): Promise<OrganizationModule>;
  deactivateModuleForOrganization(organizationId: string, moduleId: string): Promise<void>;

  // AI methods
  logAiUsage(data: InsertAiUsageLog): Promise<void>;
  getAiUsageStats(organizationId: string, period: 'today' | 'week' | 'month'): Promise<{
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    averageResponseTime: number;
  }>;
  getAiUsageByProvider(organizationId: string, period: 'today' | 'week' | 'month'): Promise<Array<{
    provider: string;
    model: string;
    requests: number;
    tokens: number;
    cost: number;
  }>>;

  // Automation methods
  createAutomation(data: InsertAutomation): Promise<Automation>;
  getAutomations(organizationId: string): Promise<Automation[]>;
  getAutomation(id: string): Promise<Automation | undefined>;
  updateAutomation(id: string, data: Partial<Automation>): Promise<Automation>;
  deleteAutomation(id: string): Promise<void>;
  
  // Activity logging
  logActivity(data: InsertActivityLog): Promise<void>;
  getActivityLogs(organizationId: string, limit?: number): Promise<Array<ActivityLog & { user?: User }>>;

  // Health check
  healthCheck(): Promise<boolean>;

  // Marketing methods
  getMarketingMetrics(organizationId: string, period?: 'today' | 'week' | 'month'): Promise<MarketingMetric[]>;
  createMarketingMetric(data: InsertMarketingMetric): Promise<MarketingMetric>;
  getMarketingChannels(organizationId: string): Promise<MarketingChannel[]>;
  createMarketingChannel(data: InsertMarketingChannel): Promise<MarketingChannel>;
  updateMarketingChannel(id: string, data: Partial<MarketingChannel>): Promise<MarketingChannel>;
  getMarketingAiInsights(organizationId: string): Promise<MarketingAiInsight[]>;
  createMarketingAiInsight(data: InsertMarketingAiInsight): Promise<MarketingAiInsight>;
  getMarketingPreferences(organizationId: string, userId: string): Promise<MarketingPreference | undefined>;
  createMarketingPreference(data: InsertMarketingPreference): Promise<MarketingPreference>;
  updateMarketingPreference(organizationId: string, userId: string, data: Partial<MarketingPreference>): Promise<MarketingPreference>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return users[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return users[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return users[0];
  }

  async createUser(userData: InsertUser & { password: string }): Promise<User> {
    const [user] = await db.insert(schema.users).values({
      email: userData.email,
      username: userData.username,
      firstName: userData.firstName,
      lastName: userData.lastName,
      avatar: userData.avatar,
      password: userData.password,
    }).returning();
    return user;
  }

  async updateUserLastLogin(userId: string): Promise<void> {
    await db.update(schema.users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.users.id, userId));
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const [user] = await db.update(schema.users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    return user;
  }

  // Organization methods
  async getOrganization(id: string): Promise<Organization | undefined> {
    const orgs = await db.select().from(schema.organizations).where(eq(schema.organizations.id, id));
    return orgs[0];
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    const orgs = await db.select().from(schema.organizations).where(eq(schema.organizations.slug, slug));
    return orgs[0];
  }

  async getAllOrganizations(): Promise<Organization[]> {
    return await db.select().from(schema.organizations).orderBy(desc(schema.organizations.createdAt));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(schema.users).orderBy(desc(schema.users.createdAt));
  }

  async createOrganization(data: InsertOrganization): Promise<Organization> {
    const [organization] = await db.insert(schema.organizations).values({
      name: data.name,
      slug: data.slug,
      domain: data.domain,
      logo: data.logo,
      description: data.description,
      type: data.type,
      subscriptionPlan: data.subscriptionPlan || 'starter',
      settings: data.settings || {},
    }).returning();
    return organization;
  }

  async updateOrganization(id: string, data: Partial<Organization>): Promise<Organization> {
    const [organization] = await db.update(schema.organizations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.organizations.id, id))
      .returning();
    return organization;
  }

  async getUserOrganizations(userId: string): Promise<Array<OrganizationUser & { organization: Organization }>> {
    const memberships = await db.select({
      id: schema.organizationUsers.id,
      organizationId: schema.organizationUsers.organizationId,
      userId: schema.organizationUsers.userId,
      role: schema.organizationUsers.role,
      permissions: schema.organizationUsers.permissions,
      invitedBy: schema.organizationUsers.invitedBy,
      joinedAt: schema.organizationUsers.joinedAt,
      isActive: schema.organizationUsers.isActive,
      organization: schema.organizations
    })
    .from(schema.organizationUsers)
    .innerJoin(schema.organizations, eq(schema.organizationUsers.organizationId, schema.organizations.id))
    .where(and(
      eq(schema.organizationUsers.userId, userId),
      eq(schema.organizationUsers.isActive, true),
      eq(schema.organizations.isActive, true)
    ));

    return memberships;
  }

  async getOrganizationUsers(organizationId: string): Promise<Array<OrganizationUser & { user: User }>> {
    const memberships = await db.select({
      id: schema.organizationUsers.id,
      organizationId: schema.organizationUsers.organizationId,
      userId: schema.organizationUsers.userId,
      role: schema.organizationUsers.role,
      permissions: schema.organizationUsers.permissions,
      invitedBy: schema.organizationUsers.invitedBy,
      joinedAt: schema.organizationUsers.joinedAt,
      isActive: schema.organizationUsers.isActive,
      user: schema.users
    })
    .from(schema.organizationUsers)
    .innerJoin(schema.users, eq(schema.organizationUsers.userId, schema.users.id))
    .where(and(
      eq(schema.organizationUsers.organizationId, organizationId),
      eq(schema.organizationUsers.isActive, true)
    ));

    return memberships;
  }

  async getOrganizationOwners(organizationId: string): Promise<OrganizationUser[]> {
    return await db.select()
      .from(schema.organizationUsers)
      .where(and(
        eq(schema.organizationUsers.organizationId, organizationId),
        or(
          eq(schema.organizationUsers.role, 'org_owner'),
          eq(schema.organizationUsers.role, 'super_admin')
        ),
        eq(schema.organizationUsers.isActive, true)
      ));
  }

  async addUserToOrganization(data: InsertOrganizationUser): Promise<OrganizationUser> {
    const [membership] = await db.insert(schema.organizationUsers).values({
      organizationId: data.organizationId,
      userId: data.userId,
      role: data.role,
      permissions: data.permissions || {},
      invitedBy: data.invitedBy,
    }).returning();
    return membership;
  }

  async removeUserFromOrganization(organizationId: string, userId: string): Promise<void> {
    await db.update(schema.organizationUsers)
      .set({ isActive: false })
      .where(and(
        eq(schema.organizationUsers.organizationId, organizationId),
        eq(schema.organizationUsers.userId, userId)
      ));
  }

  async updateUserRole(organizationId: string, userId: string, role: string): Promise<OrganizationUser> {
    const [membership] = await db.update(schema.organizationUsers)
      .set({ role: role as any }) // Cast to any to handle enum typing
      .where(and(
        eq(schema.organizationUsers.organizationId, organizationId),
        eq(schema.organizationUsers.userId, userId)
      ))
      .returning();
    return membership;
  }

  async getOrganizationMembership(userId: string, organizationId: string): Promise<OrganizationUser | undefined> {
    const memberships = await db.select()
      .from(schema.organizationUsers)
      .where(and(
        eq(schema.organizationUsers.userId, userId),
        eq(schema.organizationUsers.organizationId, organizationId),
        eq(schema.organizationUsers.isActive, true)
      ));
    return memberships[0];
  }

  // Module methods
  async getModules(): Promise<Module[]> {
    return await db.select()
      .from(schema.modules)
      .where(eq(schema.modules.isActive, true))
      .orderBy(schema.modules.name);
  }

  async getOrganizationModules(organizationId: string): Promise<Array<OrganizationModule & { module: Module }>> {
    const orgModules = await db.select({
      id: schema.organizationModules.id,
      organizationId: schema.organizationModules.organizationId,
      moduleId: schema.organizationModules.moduleId,
      status: schema.organizationModules.status,
      settings: schema.organizationModules.settings,
      activatedAt: schema.organizationModules.activatedAt,
      activatedBy: schema.organizationModules.activatedBy,
      module: schema.modules
    })
    .from(schema.organizationModules)
    .innerJoin(schema.modules, eq(schema.organizationModules.moduleId, schema.modules.id))
    .where(and(
      eq(schema.organizationModules.organizationId, organizationId),
      eq(schema.organizationModules.status, 'active')
    ));

    return orgModules;
  }

  async activateModuleForOrganization(organizationId: string, moduleId: string, activatedBy: string): Promise<OrganizationModule> {
    const [orgModule] = await db.insert(schema.organizationModules).values({
      organizationId,
      moduleId,
      status: 'active',
      activatedBy,
    }).returning();
    return orgModule;
  }

  async deactivateModuleForOrganization(organizationId: string, moduleId: string): Promise<void> {
    await db.update(schema.organizationModules)
      .set({ status: 'inactive' })
      .where(and(
        eq(schema.organizationModules.organizationId, organizationId),
        eq(schema.organizationModules.moduleId, moduleId)
      ));
  }

  // AI methods
  async logAiUsage(data: InsertAiUsageLog): Promise<void> {
    await db.insert(schema.aiUsageLogs).values(data);
  }

  async getAiUsageStats(organizationId: string, period: 'today' | 'week' | 'month'): Promise<{
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    averageResponseTime: number;
  }> {
    const periodStart = this.getPeriodStart(period);
    
    const stats = await db.select({
      totalRequests: count(schema.aiUsageLogs.id),
      totalTokens: sum(schema.aiUsageLogs.tokens),
      totalCost: sum(schema.aiUsageLogs.cost),
      avgDuration: sum(schema.aiUsageLogs.duration)
    })
    .from(schema.aiUsageLogs)
    .where(and(
      eq(schema.aiUsageLogs.organizationId, organizationId),
      gte(schema.aiUsageLogs.createdAt, periodStart)
    ));

    const result = stats[0];
    return {
      totalRequests: Number(result.totalRequests || 0),
      totalTokens: Number(result.totalTokens || 0),
      totalCost: Number(result.totalCost || 0),
      averageResponseTime: result.totalRequests > 0 
        ? Number(result.avgDuration || 0) / Number(result.totalRequests || 1)
        : 0
    };
  }

  async getAiUsageByProvider(organizationId: string, period: 'today' | 'week' | 'month'): Promise<Array<{
    provider: string;
    model: string;
    requests: number;
    tokens: number;
    cost: number;
  }>> {
    const periodStart = this.getPeriodStart(period);
    
    const usage = await db.select({
      providerId: schema.aiUsageLogs.providerId,
      model: schema.aiUsageLogs.model,
      requests: count(schema.aiUsageLogs.id),
      tokens: sum(schema.aiUsageLogs.tokens),
      cost: sum(schema.aiUsageLogs.cost)
    })
    .from(schema.aiUsageLogs)
    .innerJoin(schema.aiProviders, eq(schema.aiUsageLogs.providerId, schema.aiProviders.id))
    .where(and(
      eq(schema.aiUsageLogs.organizationId, organizationId),
      gte(schema.aiUsageLogs.createdAt, periodStart)
    ))
    .groupBy(schema.aiUsageLogs.providerId, schema.aiUsageLogs.model);

    return usage.map(u => ({
      provider: u.providerId, // Will be enriched with provider name later
      model: u.model,
      requests: Number(u.requests || 0),
      tokens: Number(u.tokens || 0),
      cost: Number(u.cost || 0)
    }));
  }

  // Automation methods
  async createAutomation(data: InsertAutomation): Promise<Automation> {
    const [automation] = await db.insert(schema.automations).values(data).returning();
    return automation;
  }

  async getAutomations(organizationId: string): Promise<Automation[]> {
    return await db.select()
      .from(schema.automations)
      .where(eq(schema.automations.organizationId, organizationId))
      .orderBy(desc(schema.automations.createdAt));
  }

  async getAutomation(id: string): Promise<Automation | undefined> {
    const automations = await db.select()
      .from(schema.automations)
      .where(eq(schema.automations.id, id));
    return automations[0];
  }

  async updateAutomation(id: string, data: Partial<Automation>): Promise<Automation> {
    const [automation] = await db.update(schema.automations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.automations.id, id))
      .returning();
    return automation;
  }

  async deleteAutomation(id: string): Promise<void> {
    await db.delete(schema.automations).where(eq(schema.automations.id, id));
  }

  // Activity logging
  async logActivity(data: InsertActivityLog): Promise<void> {
    await db.insert(schema.activityLogs).values(data);
  }

  async getActivityLogs(organizationId: string, limit = 50): Promise<Array<ActivityLog & { user?: User }>> {
    const logs = await db.select({
      id: schema.activityLogs.id,
      organizationId: schema.activityLogs.organizationId,
      userId: schema.activityLogs.userId,
      action: schema.activityLogs.action,
      resource: schema.activityLogs.resource,
      resourceId: schema.activityLogs.resourceId,
      details: schema.activityLogs.details,
      ip: schema.activityLogs.ip,
      userAgent: schema.activityLogs.userAgent,
      createdAt: schema.activityLogs.createdAt,
      user: schema.users
    })
    .from(schema.activityLogs)
    .leftJoin(schema.users, eq(schema.activityLogs.userId, schema.users.id))
    .where(eq(schema.activityLogs.organizationId, organizationId))
    .orderBy(desc(schema.activityLogs.createdAt))
    .limit(limit);

    return logs.map(log => ({
      ...log,
      user: log.user || undefined
    }));
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await db.select({ count: count() }).from(schema.users).limit(1);
      return true;
    } catch {
      return false;
    }
  }

  // Marketing methods
  async getMarketingMetrics(organizationId: string, period?: 'today' | 'week' | 'month'): Promise<MarketingMetric[]> {
    let query = db.select().from(schema.marketingMetrics)
      .where(eq(schema.marketingMetrics.organizationId, organizationId))
      .orderBy(desc(schema.marketingMetrics.date));
    
    if (period) {
      const periodStart = this.getPeriodStart(period);
      query = query.where(and(
        eq(schema.marketingMetrics.organizationId, organizationId),
        gte(schema.marketingMetrics.date, periodStart)
      ));
    }
    
    return await query;
  }

  async createMarketingMetric(data: InsertMarketingMetric): Promise<MarketingMetric> {
    const [metric] = await db.insert(schema.marketingMetrics).values(data).returning();
    return metric;
  }

  async getMarketingChannels(organizationId: string): Promise<MarketingChannel[]> {
    return await db.select().from(schema.marketingChannels)
      .where(and(
        eq(schema.marketingChannels.organizationId, organizationId),
        eq(schema.marketingChannels.isActive, true)
      ))
      .orderBy(desc(schema.marketingChannels.trafficPercentage));
  }

  async createMarketingChannel(data: InsertMarketingChannel): Promise<MarketingChannel> {
    const [channel] = await db.insert(schema.marketingChannels).values(data).returning();
    return channel;
  }

  async updateMarketingChannel(id: string, data: Partial<MarketingChannel>): Promise<MarketingChannel> {
    const [channel] = await db.update(schema.marketingChannels)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.marketingChannels.id, id))
      .returning();
    return channel;
  }

  async getMarketingAiInsights(organizationId: string): Promise<MarketingAiInsight[]> {
    return await db.select().from(schema.marketingAiInsights)
      .where(and(
        eq(schema.marketingAiInsights.organizationId, organizationId),
        eq(schema.marketingAiInsights.isActive, true)
      ))
      .orderBy(desc(schema.marketingAiInsights.createdAt))
      .limit(10);
  }

  async createMarketingAiInsight(data: InsertMarketingAiInsight): Promise<MarketingAiInsight> {
    const [insight] = await db.insert(schema.marketingAiInsights).values(data).returning();
    return insight;
  }

  async getMarketingPreferences(organizationId: string, userId: string): Promise<MarketingPreference | undefined> {
    const preferences = await db.select().from(schema.marketingPreferences)
      .where(and(
        eq(schema.marketingPreferences.organizationId, organizationId),
        eq(schema.marketingPreferences.userId, userId)
      ));
    return preferences[0];
  }

  async createMarketingPreference(data: InsertMarketingPreference): Promise<MarketingPreference> {
    const [preference] = await db.insert(schema.marketingPreferences).values(data).returning();
    return preference;
  }

  async updateMarketingPreference(organizationId: string, userId: string, data: Partial<MarketingPreference>): Promise<MarketingPreference> {
    const [preference] = await db.update(schema.marketingPreferences)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(schema.marketingPreferences.organizationId, organizationId),
        eq(schema.marketingPreferences.userId, userId)
      ))
      .returning();
    return preference;
  }

  // Utility methods
  private getPeriodStart(period: 'today' | 'week' | 'month'): Date {
    const now = new Date();
    switch (period) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        return weekStart;
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      default:
        return new Date(0);
    }
  }
}

// Create and export storage instance
export const storage = new DatabaseStorage();

// Export database connection for advanced usage
export { db, client };