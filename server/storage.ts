import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, desc, count, sum, gte, or, gt } from "drizzle-orm";
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
  InsertMarketingPreference,
  OrganizationCredential,
  OrganizationSession,
  InsertOrganizationSession,
  SocialMediaAccount,
  InsertSocialMediaAccount,
  SocialMediaPost,
  InsertSocialMediaPost,
  ContentTemplate,
  InsertContentTemplate,
  ScheduledJob,
  InsertScheduledJob,
  SocialMediaInsight,
  InsertSocialMediaInsight
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

  // Social Media Account methods
  getSocialMediaAccounts(organizationId: string): Promise<SocialMediaAccount[]>;
  getSocialMediaAccount(id: string): Promise<SocialMediaAccount | undefined>;
  createSocialMediaAccount(data: InsertSocialMediaAccount): Promise<SocialMediaAccount>;
  updateSocialMediaAccount(id: string, data: Partial<SocialMediaAccount>): Promise<SocialMediaAccount>;
  deleteSocialMediaAccount(id: string): Promise<void>;
  
  // Social Media Post methods
  getSocialMediaPosts(organizationId: string, accountId?: string): Promise<SocialMediaPost[]>;
  getSocialMediaPost(id: string): Promise<SocialMediaPost | undefined>;
  createSocialMediaPost(data: InsertSocialMediaPost): Promise<SocialMediaPost>;
  updateSocialMediaPost(id: string, data: Partial<SocialMediaPost>): Promise<SocialMediaPost>;
  deleteSocialMediaPost(id: string): Promise<void>;
  getScheduledPosts(organizationId: string): Promise<SocialMediaPost[]>;
  getPostsByStatus(organizationId: string, status: string): Promise<SocialMediaPost[]>;
  
  // Content Template methods
  getContentTemplates(organizationId: string, category?: string): Promise<ContentTemplate[]>;
  getContentTemplate(id: string): Promise<ContentTemplate | undefined>;
  createContentTemplate(data: InsertContentTemplate): Promise<ContentTemplate>;
  updateContentTemplate(id: string, data: Partial<ContentTemplate>): Promise<ContentTemplate>;
  deleteContentTemplate(id: string): Promise<void>;
  
  // Scheduled Job methods
  getScheduledJobs(organizationId: string, jobType?: string): Promise<ScheduledJob[]>;
  createScheduledJob(data: InsertScheduledJob): Promise<ScheduledJob>;
  updateScheduledJob(id: string, data: Partial<ScheduledJob>): Promise<ScheduledJob>;
  deleteScheduledJob(id: string): Promise<void>;
  getPendingJobs(): Promise<ScheduledJob[]>;
  
  // Social Media Insights methods
  getSocialMediaInsights(organizationId: string, accountId?: string, postId?: string): Promise<SocialMediaInsight[]>;
  createSocialMediaInsight(data: InsertSocialMediaInsight): Promise<SocialMediaInsight>;
  updateSocialMediaInsights(accountId: string, insights: any[]): Promise<void>;
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

  // Organization Access Control Methods
  async createOrganizationWithCredentials(
    orgData: InsertOrganization,
    credentialsData: {
      loginEmail: string;
      loginPassword: string; // Already hashed
      displayName: string;
      createdByAdmin: string;
    }
  ): Promise<{ organization: Organization; credentials: OrganizationCredential }> {
    // Create organization first
    const [organization] = await db.insert(schema.organizations).values(orgData).returning();
    
    // Create credentials for the organization
    const [credentials] = await db.insert(schema.organizationCredentials).values({
      organizationId: organization.id,
      loginEmail: credentialsData.loginEmail,
      loginPassword: credentialsData.loginPassword,
      displayName: credentialsData.displayName,
      createdByAdmin: credentialsData.createdByAdmin
    }).returning();
    
    return { organization, credentials };
  }

  async getOrganizationCredentialsByEmail(email: string): Promise<OrganizationCredential | undefined> {
    const [credentials] = await db.select()
      .from(schema.organizationCredentials)
      .where(and(
        eq(schema.organizationCredentials.loginEmail, email),
        eq(schema.organizationCredentials.isActive, true)
      ));
    return credentials;
  }

  async getOrganizationCredentialsById(id: string): Promise<OrganizationCredential | undefined> {
    const [credentials] = await db.select()
      .from(schema.organizationCredentials)
      .where(and(
        eq(schema.organizationCredentials.id, id),
        eq(schema.organizationCredentials.isActive, true)
      ));
    return credentials;
  }

  async updateOrganizationCredentialsLastLogin(credentialId: string): Promise<void> {
    await db.update(schema.organizationCredentials)
      .set({ lastLoginAt: new Date() })
      .where(eq(schema.organizationCredentials.id, credentialId));
  }

  async createOrganizationSession(sessionData: InsertOrganizationSession): Promise<OrganizationSession> {
    const [session] = await db.insert(schema.organizationSessions)
      .values(sessionData)
      .returning();
    return session;
  }

  async getOrganizationSession(token: string): Promise<OrganizationSession | undefined> {
    const [session] = await db.select()
      .from(schema.organizationSessions)
      .where(and(
        eq(schema.organizationSessions.sessionToken, token),
        gt(schema.organizationSessions.expiresAt, new Date())
      ));
    return session;
  }

  async getOrganizationBySession(token: string): Promise<Organization | undefined> {
    const [result] = await db.select({ organization: schema.organizations })
      .from(schema.organizationSessions)
      .innerJoin(schema.organizations, eq(schema.organizationSessions.organizationId, schema.organizations.id))
      .where(and(
        eq(schema.organizationSessions.sessionToken, token),
        gt(schema.organizationSessions.expiresAt, new Date()),
        eq(schema.organizations.isActive, true)
      ));
    return result?.organization;
  }

  async revokeOrganizationSession(token: string): Promise<void> {
    await db.delete(schema.organizationSessions)
      .where(eq(schema.organizationSessions.sessionToken, token));
  }

  async getOrganizationsByType(type: 'marketing' | 'support' | 'trading'): Promise<Organization[]> {
    return await db.select()
      .from(schema.organizations)
      .where(and(
        eq(schema.organizations.type, type),
        eq(schema.organizations.isActive, true)
      ))
      .orderBy(desc(schema.organizations.createdAt));
  }

  async getOrganizationWithCredentials(orgId: string): Promise<{
    organization: Organization;
    credentials: OrganizationCredential | undefined;
  } | undefined> {
    const [orgResult] = await db.select()
      .from(schema.organizations)
      .where(eq(schema.organizations.id, orgId));
    
    if (!orgResult) return undefined;
    
    const [credentialsResult] = await db.select()
      .from(schema.organizationCredentials)
      .where(and(
        eq(schema.organizationCredentials.organizationId, orgId),
        eq(schema.organizationCredentials.isActive, true)
      ));
    
    return {
      organization: orgResult,
      credentials: credentialsResult
    };
  }

  // Social Media Account methods
  async getSocialMediaAccounts(organizationId: string): Promise<SocialMediaAccount[]> {
    return await db.select()
      .from(schema.socialMediaAccounts)
      .where(and(
        eq(schema.socialMediaAccounts.organizationId, organizationId),
        eq(schema.socialMediaAccounts.isActive, true)
      ))
      .orderBy(desc(schema.socialMediaAccounts.createdAt));
  }

  async getSocialMediaAccount(id: string): Promise<SocialMediaAccount | undefined> {
    const [account] = await db.select()
      .from(schema.socialMediaAccounts)
      .where(eq(schema.socialMediaAccounts.id, id));
    return account;
  }

  async createSocialMediaAccount(data: InsertSocialMediaAccount): Promise<SocialMediaAccount> {
    const [account] = await db.insert(schema.socialMediaAccounts)
      .values(data)
      .returning();
    return account;
  }

  async updateSocialMediaAccount(id: string, data: Partial<SocialMediaAccount>): Promise<SocialMediaAccount> {
    const [account] = await db.update(schema.socialMediaAccounts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.socialMediaAccounts.id, id))
      .returning();
    return account;
  }

  async deleteSocialMediaAccount(id: string): Promise<void> {
    await db.update(schema.socialMediaAccounts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schema.socialMediaAccounts.id, id));
  }

  // Social Media Post methods
  async getSocialMediaPosts(organizationId: string, accountId?: string): Promise<SocialMediaPost[]> {
    const conditions = [eq(schema.socialMediaPosts.organizationId, organizationId)];
    if (accountId) {
      conditions.push(eq(schema.socialMediaPosts.accountId, accountId));
    }

    return await db.select()
      .from(schema.socialMediaPosts)
      .where(and(...conditions))
      .orderBy(desc(schema.socialMediaPosts.createdAt));
  }

  async getSocialMediaPost(id: string): Promise<SocialMediaPost | undefined> {
    const [post] = await db.select()
      .from(schema.socialMediaPosts)
      .where(eq(schema.socialMediaPosts.id, id));
    return post;
  }

  async createSocialMediaPost(data: InsertSocialMediaPost): Promise<SocialMediaPost> {
    const [post] = await db.insert(schema.socialMediaPosts)
      .values(data)
      .returning();
    return post;
  }

  async updateSocialMediaPost(id: string, data: Partial<SocialMediaPost>): Promise<SocialMediaPost> {
    const [post] = await db.update(schema.socialMediaPosts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.socialMediaPosts.id, id))
      .returning();
    return post;
  }

  async deleteSocialMediaPost(id: string): Promise<void> {
    await db.delete(schema.socialMediaPosts)
      .where(eq(schema.socialMediaPosts.id, id));
  }

  async getScheduledPosts(organizationId: string): Promise<SocialMediaPost[]> {
    return await db.select()
      .from(schema.socialMediaPosts)
      .where(and(
        eq(schema.socialMediaPosts.organizationId, organizationId),
        eq(schema.socialMediaPosts.status, 'scheduled'),
        gte(schema.socialMediaPosts.scheduledAt, new Date())
      ))
      .orderBy(schema.socialMediaPosts.scheduledAt);
  }

  async getPostsByStatus(organizationId: string, status: string): Promise<SocialMediaPost[]> {
    return await db.select()
      .from(schema.socialMediaPosts)
      .where(and(
        eq(schema.socialMediaPosts.organizationId, organizationId),
        eq(schema.socialMediaPosts.status, status)
      ))
      .orderBy(desc(schema.socialMediaPosts.createdAt));
  }

  // Content Template methods
  async getContentTemplates(organizationId: string, category?: string): Promise<ContentTemplate[]> {
    const conditions = [
      eq(schema.contentTemplates.organizationId, organizationId),
      eq(schema.contentTemplates.isActive, true)
    ];
    
    if (category) {
      conditions.push(eq(schema.contentTemplates.category, category));
    }

    return await db.select()
      .from(schema.contentTemplates)
      .where(and(...conditions))
      .orderBy(desc(schema.contentTemplates.createdAt));
  }

  async getContentTemplate(id: string): Promise<ContentTemplate | undefined> {
    const [template] = await db.select()
      .from(schema.contentTemplates)
      .where(eq(schema.contentTemplates.id, id));
    return template;
  }

  async createContentTemplate(data: InsertContentTemplate): Promise<ContentTemplate> {
    const [template] = await db.insert(schema.contentTemplates)
      .values(data)
      .returning();
    return template;
  }

  async updateContentTemplate(id: string, data: Partial<ContentTemplate>): Promise<ContentTemplate> {
    const [template] = await db.update(schema.contentTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.contentTemplates.id, id))
      .returning();
    return template;
  }

  async deleteContentTemplate(id: string): Promise<void> {
    await db.update(schema.contentTemplates)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schema.contentTemplates.id, id));
  }

  // Scheduled Job methods
  async getScheduledJobs(organizationId: string, jobType?: string): Promise<ScheduledJob[]> {
    const conditions = [eq(schema.scheduledJobs.organizationId, organizationId)];
    if (jobType) {
      conditions.push(eq(schema.scheduledJobs.jobType, jobType));
    }

    return await db.select()
      .from(schema.scheduledJobs)
      .where(and(...conditions))
      .orderBy(schema.scheduledJobs.scheduledAt);
  }

  async createScheduledJob(data: InsertScheduledJob): Promise<ScheduledJob> {
    const [job] = await db.insert(schema.scheduledJobs)
      .values(data)
      .returning();
    return job;
  }

  async updateScheduledJob(id: string, data: Partial<ScheduledJob>): Promise<ScheduledJob> {
    const [job] = await db.update(schema.scheduledJobs)
      .set(data)
      .where(eq(schema.scheduledJobs.id, id))
      .returning();
    return job;
  }

  async deleteScheduledJob(id: string): Promise<void> {
    await db.delete(schema.scheduledJobs)
      .where(eq(schema.scheduledJobs.id, id));
  }

  async getPendingJobs(): Promise<ScheduledJob[]> {
    return await db.select()
      .from(schema.scheduledJobs)
      .where(and(
        eq(schema.scheduledJobs.status, 'pending'),
        gte(schema.scheduledJobs.scheduledAt, new Date())
      ))
      .orderBy(schema.scheduledJobs.scheduledAt);
  }

  // Social Media Insights methods
  async getSocialMediaInsights(organizationId: string, accountId?: string, postId?: string): Promise<SocialMediaInsight[]> {
    const conditions = [eq(schema.socialMediaInsights.organizationId, organizationId)];
    
    if (accountId) {
      conditions.push(eq(schema.socialMediaInsights.accountId, accountId));
    }
    if (postId) {
      conditions.push(eq(schema.socialMediaInsights.postId, postId));
    }

    return await db.select()
      .from(schema.socialMediaInsights)
      .where(and(...conditions))
      .orderBy(desc(schema.socialMediaInsights.date));
  }

  async createSocialMediaInsight(data: InsertSocialMediaInsight): Promise<SocialMediaInsight> {
    const [insight] = await db.insert(schema.socialMediaInsights)
      .values(data)
      .returning();
    return insight;
  }

  async updateSocialMediaInsights(accountId: string, insights: any[]): Promise<void> {
    for (const insight of insights) {
      await db.insert(schema.socialMediaInsights)
        .values({
          ...insight,
          accountId
        })
        .onConflictDoNothing();
    }
  }

  // Social Media Account methods
  async getSocialMediaAccountsByOrganization(organizationId: string): Promise<SocialMediaAccount[]> {
    return await db
      .select()
      .from(schema.socialMediaAccounts)
      .where(and(
        eq(schema.socialMediaAccounts.organizationId, organizationId),
        eq(schema.socialMediaAccounts.isActive, true)
      ));
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