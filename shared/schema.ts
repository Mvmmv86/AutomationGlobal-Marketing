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
  schedule: jsonb("schedule"),
  lastRunAt: timestamp("last_run_at"),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Marketing Module Tables
export const marketingMetrics = pgTable("marketing_metrics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  date: timestamp("date").notNull(),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  roi: decimal("roi", { precision: 5, scale: 2 }).default('0'),
  impressionsChange: decimal("impressions_change", { precision: 5, scale: 2 }).default('0'),
  clicksChange: decimal("clicks_change", { precision: 5, scale: 2 }).default('0'),
  conversionsChange: decimal("conversions_change", { precision: 5, scale: 2 }).default('0'),
  roiChange: decimal("roi_change", { precision: 5, scale: 2 }).default('0'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const marketingChannels = pgTable("marketing_channels", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  channelName: text("channel_name").notNull(),
  trafficPercentage: decimal("traffic_percentage", { precision: 5, scale: 2 }).default('0'),
  performanceData: jsonb("performance_data").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const marketingAiInsights = pgTable("marketing_ai_insights", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  insightText: text("insight_text").notNull(),
  category: text("category").notNull(), // 'audience', 'timing', 'content', 'optimization'
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }).default('0'),
  metadata: jsonb("metadata").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});

export const marketingPreferences = pgTable("marketing_preferences", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  theme: text("theme").default('dark'), // 'dark' or 'light'
  dashboardSettings: jsonb("dashboard_settings").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Organization Access Control - Independent Login System
export const organizationCredentials = pgTable("organization_credentials", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  loginEmail: text("login_email").notNull().unique(), // e.g., marketing@empresa.com
  loginPassword: text("login_password").notNull(), // hashed
  displayName: text("display_name").notNull(),
  accessLevel: text("access_level").default('full'), // 'full', 'readonly'
  permissions: jsonb("permissions").default({}),
  isActive: boolean("is_active").default(true),
  createdByAdmin: uuid("created_by_admin").references(() => users.id).notNull(),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Organization Sessions - Independent session management
export const organizationSessions = pgTable("organization_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  credentialId: uuid("credential_id").references(() => organizationCredentials.id),
  adminUserId: uuid("admin_user_id").references(() => users.id), // Se foi acessado pelo admin
  sessionToken: text("session_token").notNull().unique(),
  accessType: text("access_type").notNull(), // 'organization', 'admin_impersonate'
  ip: text("ip"),
  userAgent: text("user_agent"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Social Media Enums
export const socialMediaPlatformEnum = pgEnum('social_media_platform', ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok']);
export const campaignTypeEnum = pgEnum('campaign_type', [
  'awareness',              // Reconhecimento: Alcance e Impressões
  'traffic',               // Tráfego: Cliques no link
  'engagement',            // Interação: Curtidas, comentários, compartilhamentos
  'leads',                // Geração de cadastro: Leads e formulários
  'app_promotion',        // Promoção do app: Instalações e ações no app
  'sales',                // Vendas: Conversões e valor de conversão
  'reach',                // Alcance: Alcançar o máximo de pessoas únicas
  'brand_awareness',      // Reconhecimento da marca: Lembrança da marca
  'video_views',          // Visualizações de vídeo: Pessoas que assistem vídeos
  'messages',             // Mensagens: Conversas no Messenger/WhatsApp
  'conversion',           // Conversão: Ações específicas no site
  'store_visits'          // Visitas à loja: Pessoas que visitam loja física
]);
export const postStatusEnum = pgEnum('post_status', ['draft', 'scheduled', 'published', 'failed', 'cancelled']);
export const postTypeEnum = pgEnum('post_type', ['text', 'image', 'video', 'carousel', 'story', 'reel']);

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

// Social Media Tables - Complete System
export const socialMediaAccounts = pgTable("social_media_accounts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  platform: text("platform").notNull(), // 'facebook', 'instagram', 'twitter', 'linkedin'
  accountId: text("account_id").notNull(), // Platform-specific account ID
  accountName: text("account_name").notNull(),
  accountHandle: text("account_handle"), // @username
  accessToken: text("access_token"), // encrypted
  refreshToken: text("refresh_token"), // encrypted
  tokenExpiresAt: timestamp("token_expires_at"),
  accountData: jsonb("account_data").default({}), // profile info, followers count, etc.
  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  connectedAt: timestamp("connected_at").defaultNow(),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
});

// Social Media Campaigns Table - Simplified to match database structure
export const socialMediaCampaigns = pgTable("social_media_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  type: varchar("type").notNull(),
  status: varchar("status").default('active'),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});

export const socialMediaPosts = pgTable("social_media_posts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  campaignId: varchar("campaign_id"), // Optional - posts can be part of campaigns or standalone
  title: text("title"),
  content: text("content").notNull(),
  mediaUrls: jsonb("media_urls").default([]), // Array of image/video URLs
  mediaItems: jsonb("media_items").default([]), // Array with file info and base64 data
  platforms: jsonb("platforms").default([]), // Target platforms
  selectedAccounts: jsonb("selected_accounts").default([]), // Selected social media accounts
  mediaType: text("media_type").default('feed'), // 'feed', 'story', 'reel'
  status: text("status").default('draft'), // 'draft', 'scheduled', 'published', 'failed', 'archived'
  publishMode: text("publish_mode").default('manual'), // 'manual', 'auto', 'scheduled'
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  failureReason: text("failure_reason"),
  postData: jsonb("post_data").default({}), // Platform-specific post data
  analytics: jsonb("analytics").default({}), // engagement metrics
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const socialMediaPostPlatforms = pgTable("social_media_post_platforms", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: uuid("post_id").references(() => socialMediaPosts.id).notNull(),
  accountId: uuid("account_id").references(() => socialMediaAccounts.id).notNull(),
  platform: text("platform").notNull(),
  platformPostId: text("platform_post_id"), // ID returned by platform after publishing
  status: text("status").default('pending'), // 'pending', 'published', 'failed'
  publishedAt: timestamp("published_at"),
  failureReason: text("failure_reason"),
  analytics: jsonb("analytics").default({}), // Platform-specific metrics
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const socialMediaTemplates = pgTable("social_media_templates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(), // 'promotional', 'educational', 'social_proof', 'engagement'
  content: text("content").notNull(),
  mediaUrls: jsonb("media_urls").default([]),
  platforms: jsonb("platforms").default([]), // Recommended platforms
  tags: jsonb("tags").default([]),
  usageCount: integer("usage_count").default(0),
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const socialMediaAnalytics = pgTable("social_media_analytics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  accountId: uuid("account_id").references(() => socialMediaAccounts.id).notNull(),
  postId: uuid("post_id").references(() => socialMediaPosts.id),
  platform: text("platform").notNull(),
  date: timestamp("date").notNull(),
  impressions: integer("impressions").default(0),
  engagements: integer("engagements").default(0),
  clicks: integer("clicks").default(0),
  shares: integer("shares").default(0),
  comments: integer("comments").default(0),
  likes: integer("likes").default(0),
  reach: integer("reach").default(0),
  saves: integer("saves").default(0),
  rawData: jsonb("raw_data").default({}), // Full platform response
  createdAt: timestamp("created_at").defaultNow()
});

export const socialMediaContentLibrary = pgTable("social_media_content_library", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  title: text("title").notNull(),
  type: text("type").notNull(), // 'image', 'video', 'text', 'carousel'
  content: text("content"),
  mediaUrl: text("media_url"),
  tags: jsonb("tags").default([]),
  category: text("category"),
  fileSize: integer("file_size"),
  dimensions: jsonb("dimensions"), // {width, height}
  duration: integer("duration"), // for videos, in seconds
  isActive: boolean("is_active").default(true),
  usageCount: integer("usage_count").default(0),
  uploadedBy: uuid("uploaded_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
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

// Marketing Social Media Schemas (Combined)

// Marketing Schemas
export const insertMarketingMetricSchema = createInsertSchema(marketingMetrics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMarketingChannelSchema = createInsertSchema(marketingChannels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMarketingAiInsightSchema = createInsertSchema(marketingAiInsights).omit({
  id: true,
  createdAt: true,
});

export const insertMarketingPreferenceSchema = createInsertSchema(marketingPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrganizationCredentialSchema = createInsertSchema(organizationCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrganizationSessionSchema = createInsertSchema(organizationSessions).omit({
  id: true,
  createdAt: true,
});



export const contentTemplates = pgTable("content_templates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'promotional', 'educational', 'social_proof', 'engagement'
  content: text("content").notNull(),
  mediaUrls: jsonb("media_urls").default([]),
  platforms: jsonb("platforms").default([]), // Array of supported platforms
  variables: jsonb("variables").default([]), // Template variables like {company_name}
  usageCount: integer("usage_count").default(0),
  tags: jsonb("tags").default([]),
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const scheduledJobs = pgTable("scheduled_jobs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  jobType: text("job_type").notNull(), // 'publish_post', 'sync_metrics', 'refresh_token'
  resourceId: uuid("resource_id").notNull(), // postId, accountId, etc.
  scheduledAt: timestamp("scheduled_at").notNull(),
  executedAt: timestamp("executed_at"),
  status: text("status").default('pending'), // 'pending', 'completed', 'failed'
  result: jsonb("result"),
  error: text("error"),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  createdAt: timestamp("created_at").defaultNow()
});

export const socialMediaInsights = pgTable("social_media_insights", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  accountId: uuid("account_id").references(() => socialMediaAccounts.id),
  postId: uuid("post_id").references(() => socialMediaPosts.id),
  date: timestamp("date").notNull(),
  platform: socialMediaPlatformEnum("platform").notNull(),
  metrics: jsonb("metrics").notNull(), // Platform-specific metrics
  reach: integer("reach").default(0),
  impressions: integer("impressions").default(0),
  engagement: integer("engagement").default(0),
  clicks: integer("clicks").default(0),
  shares: integer("shares").default(0),
  comments: integer("comments").default(0),
  likes: integer("likes").default(0),
  createdAt: timestamp("created_at").defaultNow()
});

// Social Media Insert Schemas
export const insertSocialMediaAccountSchema = createInsertSchema(socialMediaAccounts).omit({
  id: true,
  connectedAt: true,
});

export const insertSocialMediaPostSchema = createInsertSchema(socialMediaPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContentTemplateSchema = createInsertSchema(contentTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScheduledJobSchema = createInsertSchema(scheduledJobs).omit({
  id: true,
  createdAt: true,
});

export const insertSocialMediaInsightSchema = createInsertSchema(socialMediaInsights).omit({
  id: true,
  createdAt: true,
});

export const insertSocialMediaCampaignSchema = createInsertSchema(socialMediaCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

// Marketing Types
export type MarketingMetric = typeof marketingMetrics.$inferSelect;
export type InsertMarketingMetric = z.infer<typeof insertMarketingMetricSchema>;

export type MarketingChannel = typeof marketingChannels.$inferSelect;
export type InsertMarketingChannel = z.infer<typeof insertMarketingChannelSchema>;

export type MarketingAiInsight = typeof marketingAiInsights.$inferSelect;
export type InsertMarketingAiInsight = z.infer<typeof insertMarketingAiInsightSchema>;

export type MarketingPreference = typeof marketingPreferences.$inferSelect;
export type InsertMarketingPreference = z.infer<typeof insertMarketingPreferenceSchema>;

// Organization Access Types
export type OrganizationCredential = typeof organizationCredentials.$inferSelect;
export type InsertOrganizationCredential = z.infer<typeof insertOrganizationCredentialSchema>;

export type OrganizationSession = typeof organizationSessions.$inferSelect;
export type InsertOrganizationSession = z.infer<typeof insertOrganizationSessionSchema>;

// Social Media Types
export type SocialMediaPost = typeof socialMediaPosts.$inferSelect;
export type InsertSocialMediaPost = z.infer<typeof insertSocialMediaPostSchema>;

export type SocialMediaAccount = typeof socialMediaAccounts.$inferSelect;
export type InsertSocialMediaAccount = z.infer<typeof insertSocialMediaAccountSchema>;

export type ContentTemplate = typeof contentTemplates.$inferSelect;
export type InsertContentTemplate = z.infer<typeof insertContentTemplateSchema>;

export type ScheduledJob = typeof scheduledJobs.$inferSelect;
export type InsertScheduledJob = z.infer<typeof insertScheduledJobSchema>;

export type SocialMediaInsight = typeof socialMediaInsights.$inferSelect;
export type InsertSocialMediaInsight = z.infer<typeof insertSocialMediaInsightSchema>;

export type SocialMediaCampaign = typeof socialMediaCampaigns.$inferSelect;
export type InsertSocialMediaCampaign = z.infer<typeof insertSocialMediaCampaignSchema>;
