import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  uuid, 
  timestamp, 
  jsonb, 
  integer, 
  decimal, 
  boolean,
  pgEnum
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const subscriptionPlanEnum = pgEnum('subscription_plan', ['starter', 'professional', 'enterprise']);
export const organizationTypeEnum = pgEnum('organization_type', ['marketing', 'support', 'trading']);
export const userRoleEnum = pgEnum('user_role', ['super_admin', 'org_owner', 'org_admin', 'org_manager', 'org_user', 'org_viewer']);
export const aiProviderEnum = pgEnum('ai_provider', ['openai', 'anthropic', 'custom']);
export const moduleStatusEnum = pgEnum('module_status', ['active', 'inactive', 'pending']);

// Core Tables
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  avatar: text("avatar"),
  password: text("password").notNull(),
  emailVerified: boolean("email_verified").default(false),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  domain: text("domain"),
  logo: text("logo"),
  description: text("description"),
  type: organizationTypeEnum("type").notNull(),
  subscriptionPlan: subscriptionPlanEnum("subscription_plan").default('starter'),
  settings: jsonb("settings").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const organizationUsers = pgTable("organization_users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  role: userRoleEnum("role").notNull().default('org_user'),
  permissions: jsonb("permissions").default({}),
  invitedBy: uuid("invited_by").references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// AI Tables - Each organization manages their own AI
export const organizationAiConfig = pgTable("organization_ai_config", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  provider: aiProviderEnum("provider").notNull(), // openai, anthropic
  apiKey: text("api_key"), // encrypted
  models: jsonb("models").default([]), // selected models
  monthlyLimit: integer("monthly_limit").default(10000), // requests per month
  dailyLimit: integer("daily_limit").default(500), // requests per day
  usedThisMonth: integer("used_this_month").default(0),
  usedToday: integer("used_today").default(0),
  isActive: boolean("is_active").default(true),
  isPausedByAdmin: boolean("is_paused_by_admin").default(false), // super admin can pause
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiUsageLogs = pgTable("ai_usage_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  provider: aiProviderEnum("provider").notNull(),
  model: text("model").notNull(),
  requestTokens: integer("request_tokens").default(0),
  responseTokens: integer("response_tokens").default(0),
  totalTokens: integer("total_tokens").default(0),
  cost: decimal("cost", { precision: 10, scale: 4 }).default('0'),
  responseTime: integer("response_time"), // milliseconds
  success: boolean("success").default(true),
  errorMessage: text("error_message"),
  userId: uuid("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiProviders = pgTable("ai_providers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  provider: aiProviderEnum("provider").notNull(),
  apiKey: text("api_key"),
  endpoint: text("endpoint"),
  models: jsonb("models").default([]),
  settings: jsonb("settings").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiConfigurations = pgTable("ai_configurations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  providerId: uuid("provider_id").references(() => aiProviders.id).notNull(),
  model: text("model").notNull(),
  settings: jsonb("settings").default({}),
  fallbackProviderId: uuid("fallback_provider_id").references(() => aiProviders.id),
  priority: integer("priority").default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Module Tables
export const modules = pgTable("modules", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  features: jsonb("features").default([]),
  requiredPlan: subscriptionPlanEnum("required_plan").default('starter'),
  settings: jsonb("settings").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const organizationModules = pgTable("organization_modules", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  moduleId: uuid("module_id").references(() => modules.id).notNull(),
  status: moduleStatusEnum("status").default('active'),
  settings: jsonb("settings").default({}),
  activatedAt: timestamp("activated_at").defaultNow(),
  activatedBy: uuid("activated_by").references(() => users.id),
});

// Automation Tables
export const automations = pgTable("automations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  trigger: jsonb("trigger").notNull(),
  actions: jsonb("actions").notNull(),
  conditions: jsonb("conditions").default([]),
  schedule: jsonb("schedule"),
  isActive: boolean("is_active").default(true),
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const automationExecutions = pgTable("automation_executions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  automationId: uuid("automation_id").references(() => automations.id).notNull(),
  status: text("status").notNull(), // 'running', 'completed', 'failed'
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  result: jsonb("result"),
  error: text("error"),
  logs: jsonb("logs").default([]),
});

// Integration Tables
export const integrations = pgTable("integrations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  provider: text("provider").notNull(), // 'google_ads', 'facebook_ads', 'zendesk', etc.
  description: text("description"),
  authType: text("auth_type").notNull(), // 'oauth', 'api_key', 'custom'
  settings: jsonb("settings").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const organizationIntegrations = pgTable("organization_integrations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  integrationId: uuid("integration_id").references(() => integrations.id).notNull(),
  credentials: jsonb("credentials"), // encrypted
  settings: jsonb("settings").default({}),
  status: text("status").default('active'),
  lastSyncAt: timestamp("last_sync_at"),
  connectedBy: uuid("connected_by").references(() => users.id).notNull(),
  connectedAt: timestamp("connected_at").defaultNow(),
});

// System Tables
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id),
  userId: uuid("user_id").references(() => users.id),
  action: text("action").notNull(),
  resource: text("resource").notNull(),
  resourceId: uuid("resource_id"),
  details: jsonb("details"),
  ip: text("ip"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const systemNotifications = pgTable("system_notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id),
  userId: uuid("user_id").references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'info', 'warning', 'error', 'success'
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Analytics and ML Tables
export const analyticsDatasets = pgTable("analytics_datasets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  dataSource: text("data_source").notNull(), // 'automation_logs', 'ai_usage', 'custom', etc.
  schema: jsonb("schema").notNull(), // Column definitions and types
  filters: jsonb("filters").default({}),
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const mlModels = pgTable("ml_models", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  datasetId: uuid("dataset_id").references(() => analyticsDatasets.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'classification', 'regression', 'clustering', 'anomaly_detection'
  algorithm: text("algorithm").notNull(), // 'random_forest', 'neural_network', 'kmeans', etc.
  parameters: jsonb("parameters").notNull(),
  trainingData: jsonb("training_data"),
  modelData: jsonb("model_data"), // Serialized model
  metrics: jsonb("metrics"), // Accuracy, precision, recall, etc.
  status: text("status").default('draft'), // 'draft', 'training', 'trained', 'deployed', 'error'
  trainedAt: timestamp("trained_at"),
  deployedAt: timestamp("deployed_at"),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const mlPredictions = pgTable("ml_predictions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  modelId: uuid("model_id").references(() => mlModels.id).notNull(),
  inputData: jsonb("input_data").notNull(),
  prediction: jsonb("prediction").notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 4 }),
  executedAt: timestamp("executed_at").defaultNow(),
  createdBy: uuid("created_by").references(() => users.id)
});

export const analyticsReports = pgTable("analytics_reports", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'dashboard', 'scheduled', 'alert', 'insight'
  configuration: jsonb("configuration").notNull(), // Charts, filters, ML model refs
  schedule: text("schedule"), // Cron expression for scheduled reports
  recipients: text("recipients").array(), // Email addresses for scheduled reports
  lastGenerated: timestamp("last_generated"),
  nextScheduled: timestamp("next_scheduled"),
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const analyticsInsights = pgTable("analytics_insights", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  reportId: uuid("report_id").references(() => analyticsReports.id),
  modelId: uuid("model_id").references(() => mlModels.id),
  type: text("type").notNull(), // 'trend', 'anomaly', 'prediction', 'recommendation'
  title: text("title").notNull(),
  description: text("description").notNull(),
  data: jsonb("data").notNull(), // Supporting data and charts
  confidence: decimal("confidence", { precision: 5, scale: 4 }),
  impact: text("impact"), // 'low', 'medium', 'high', 'critical'
  actionable: boolean("actionable").default(false),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAutomationSchema = createInsertSchema(automations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrganizationUserSchema = createInsertSchema(organizationUsers).omit({
  id: true,
  joinedAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export const insertAiUsageLogSchema = createInsertSchema(aiUsageLogs).omit({
  id: true,
  createdAt: true,
});

export const insertAnalyticsDatasetSchema = createInsertSchema(analyticsDatasets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMlModelSchema = createInsertSchema(mlModels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMlPredictionSchema = createInsertSchema(mlPredictions).omit({
  id: true,
  executedAt: true,
});

export const insertAnalyticsReportSchema = createInsertSchema(analyticsReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnalyticsInsightSchema = createInsertSchema(analyticsInsights).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type OrganizationUser = typeof organizationUsers.$inferSelect;
export type InsertOrganizationUser = z.infer<typeof insertOrganizationUserSchema>;

export type Module = typeof modules.$inferSelect;
export type OrganizationModule = typeof organizationModules.$inferSelect;

export type AiUsageLog = typeof aiUsageLogs.$inferSelect;
export type InsertAiUsageLog = z.infer<typeof insertAiUsageLogSchema>;

export type Automation = typeof automations.$inferSelect;
export type InsertAutomation = z.infer<typeof insertAutomationSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

export type SystemNotification = typeof systemNotifications.$inferSelect;

export type AnalyticsDataset = typeof analyticsDatasets.$inferSelect;
export type InsertAnalyticsDataset = z.infer<typeof insertAnalyticsDatasetSchema>;

export type MlModel = typeof mlModels.$inferSelect;
export type InsertMlModel = z.infer<typeof insertMlModelSchema>;

export type MlPrediction = typeof mlPredictions.$inferSelect;
export type InsertMlPrediction = z.infer<typeof insertMlPredictionSchema>;

export type AnalyticsReport = typeof analyticsReports.$inferSelect;
export type InsertAnalyticsReport = z.infer<typeof insertAnalyticsReportSchema>;

export type AnalyticsInsight = typeof analyticsInsights.$inferSelect;
export type InsertAnalyticsInsight = z.infer<typeof insertAnalyticsInsightSchema>;
