import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, desc, count, sum, gte } from "drizzle-orm";
import { CONFIG } from "./config";
import * as schema from "@shared/schema";
import type { 
  User, 
  InsertUser, 
  Organization, 
  InsertOrganization, 
  OrganizationUser,
  Automation,
  InsertAutomation,
  AiUsageLog,
  InsertAiUsageLog,
  ActivityLog
} from "@shared/schema";

// Convert Supabase URL to proper PostgreSQL connection string if needed
const getPostgreSQLUrl = (url: string): string => {
  if (url.startsWith('postgresql://')) {
    return url;
  }
  // For Supabase URLs, return as is - postgres.js can handle them
  return url;
};

const connectionString = getPostgreSQLUrl(CONFIG.DATABASE_URL);
const client = postgres(connectionString, {
  ssl: CONFIG.NODE_ENV === 'production' ? 'require' : 'prefer',
  max: 10,
});
const db = drizzle(client, { schema });

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser & { password: string }): Promise<User>;
  updateUserLastLogin(userId: string): Promise<void>;

  // Organization methods
  getOrganization(id: string): Promise<Organization | undefined>;
  createOrganization(data: InsertOrganization & { ownerId?: string }): Promise<Organization>;
  updateOrganization(id: string, data: Partial<Organization>): Promise<Organization>;
  getUserOrganizations(userId: string): Promise<Array<OrganizationUser & { organization: Organization }>>;
  getOrganizationUsers(organizationId: string): Promise<OrganizationUser[]>;
  getOrganizationOwners(organizationId: string): Promise<OrganizationUser[]>;
  addUserToOrganization(data: {
    userId: string;
    organizationId: string;
    role: string;
    invitedBy?: string;
  }): Promise<OrganizationUser>;
  removeUserFromOrganization(organizationId: string, userId: string): Promise<void>;
  updateUserRole(organizationId: string, userId: string, role: string): Promise<OrganizationUser>;
  getOrganizationMembership(userId: string, organizationId: string): Promise<OrganizationUser | undefined>;

  // AI methods
  logAiUsage(data: Omit<InsertAiUsageLog, 'id' | 'createdAt'> & { 
    provider: string; 
    model: string;
    tokens: number;
    cost: number;
    duration: number;
    requestData: any;
    responseData: any;
    status: string;
  }): Promise<void>;
  getAiUsageStats(organizationId: string, period: 'today' | 'week' | 'month'): Promise<{
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
  }>;

  // Automation methods
  createAutomation(data: Omit<InsertAutomation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Automation>;
  getOrganizationAutomations(organizationId: string): Promise<Automation[]>;

  // Activity logging
  logActivity(data: {
    organizationId?: string;
    userId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: any;
    ip?: string;
    userAgent?: string;
  }): Promise<void>;

  // Module methods
  getOrganizationActiveModules(organizationId: string): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
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
      .set({ lastLoginAt: new Date() })
      .where(eq(schema.users.id, userId));
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const orgs = await db.select().from(schema.organizations).where(eq(schema.organizations.id, id));
    return orgs[0];
  }

  async createOrganization(data: InsertOrganization & { ownerId?: string }): Promise<Organization> {
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
      eq(schema.organizationUsers.isActive, true)
    ));

    return memberships;
  }

  async getOrganizationUsers(organizationId: string): Promise<OrganizationUser[]> {
    return await db.select()
      .from(schema.organizationUsers)
      .where(and(
        eq(schema.organizationUsers.organizationId, organizationId),
        eq(schema.organizationUsers.isActive, true)
      ));
  }

  async getOrganizationOwners(organizationId: string): Promise<OrganizationUser[]> {
    return await db.select()
      .from(schema.organizationUsers)
      .where(and(
        eq(schema.organizationUsers.organizationId, organizationId),
        eq(schema.organizationUsers.role, 'org_owner'),
        eq(schema.organizationUsers.isActive, true)
      ));
  }

  async addUserToOrganization(data: {
    userId: string;
    organizationId: string;
    role: string;
    invitedBy?: string;
  }): Promise<OrganizationUser> {
    const [membership] = await db.insert(schema.organizationUsers).values({
      userId: data.userId,
      organizationId: data.organizationId,
      role: data.role as any,
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
      .set({ role: role as any })
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

  async logAiUsage(data: Omit<InsertAiUsageLog, 'id' | 'createdAt'> & { 
    provider: string; 
    model: string;
    tokens: number;
    cost: number;
    duration: number;
    requestData: any;
    responseData: any;
    status: string;
  }): Promise<void> {
    // For now, we'll create a simple AI provider entry if it doesn't exist
    // In a full implementation, this would reference the aiProviders table
    await db.insert(schema.aiUsageLogs).values({
      organizationId: data.organizationId,
      userId: data.userId,
      providerId: 'default-provider-id', // This should be looked up from aiProviders
      model: data.model,
      tokens: data.tokens,
      cost: String(data.cost),
      requestData: data.requestData,
      responseData: data.responseData,
      status: data.status,
      duration: data.duration,
    });
  }

  async getAiUsageStats(organizationId: string, period: 'today' | 'week' | 'month'): Promise<{
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
  }> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const stats = await db.select({
      totalRequests: count(),
      totalTokens: sum(schema.aiUsageLogs.tokens),
      totalCost: sum(schema.aiUsageLogs.cost),
    })
    .from(schema.aiUsageLogs)
    .where(and(
      eq(schema.aiUsageLogs.organizationId, organizationId),
      gte(schema.aiUsageLogs.createdAt, startDate)
    ));

    const result = stats[0];
    return {
      totalRequests: Number(result.totalRequests) || 0,
      totalTokens: Number(result.totalTokens) || 0,
      totalCost: Number(result.totalCost ?? 0),
    };
  }

  async createAutomation(data: Omit<InsertAutomation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Automation> {
    const [automation] = await db.insert(schema.automations).values(data).returning();
    return automation;
  }

  async getOrganizationAutomations(organizationId: string): Promise<Automation[]> {
    return await db.select()
      .from(schema.automations)
      .where(eq(schema.automations.organizationId, organizationId))
      .orderBy(desc(schema.automations.createdAt));
  }

  async logActivity(data: {
    organizationId?: string;
    userId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: any;
    ip?: string;
    userAgent?: string;
  }): Promise<void> {
    await db.insert(schema.activityLogs).values({
      organizationId: data.organizationId,
      userId: data.userId,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId,
      details: data.details,
      ip: data.ip,
      userAgent: data.userAgent,
    });
  }

  async getOrganizationActiveModules(organizationId: string): Promise<any[]> {
    // This would query the organizationModules table in a full implementation
    // For now, returning mock data based on organization type
    const org = await this.getOrganization(organizationId);
    if (!org) return [];

    const modulesByType = {
      marketing: ['marketing-ai', 'content-ai', 'analytics-ai'],
      support: ['support-ai', 'chatbot-ai', 'knowledge-base-ai'],
      trading: ['trading-ai', 'risk-management-ai', 'market-analysis-ai'],
    };

    return modulesByType[org.type] || [];
  }
}

export const storage = new DatabaseStorage();
