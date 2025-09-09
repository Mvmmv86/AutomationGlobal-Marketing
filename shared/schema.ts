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
  // Facebook Marketing API integration fields
  facebookCampaignId: varchar("facebook_campaign_id"), // ID da campanha real no Facebook
  facebookAdAccountId: varchar("facebook_ad_account_id"), // ID da conta de anúncios no Facebook
  facebookStatus: varchar("facebook_status"), // Status no Facebook: ACTIVE, PAUSED, DELETED
  facebookObjective: varchar("facebook_objective"), // Objetivo configurado no Facebook
  dailyBudget: decimal("daily_budget", { precision: 10, scale: 2 }), // Orçamento diário
  totalBudget: decimal("total_budget", { precision: 10, scale: 2 }), // Orçamento total
  isConnectedToFacebook: boolean("is_connected_to_facebook").default(false), // Se está sincronizada
  lastSyncAt: timestamp("last_sync_at"), // Última sincronização com Facebook
  facebookMetadata: jsonb("facebook_metadata").default({}), // Dados adicionais do Facebook
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

// =============================================================================
// FACEBOOK/INSTAGRAM INTEGRATION TABLES - NEW FUNCTIONALITY
// =============================================================================

// Connected Social Media Accounts (Facebook/Instagram OAuth)
export const connectedAccounts = pgTable("connected_accounts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  platform: text("platform").notNull(), // 'facebook' | 'instagram' | 'facebook_page'
  platformAccountId: text("platform_account_id").notNull(), // Facebook/Instagram Account ID
  accountName: text("account_name").notNull(), // Display name
  username: text("username"), // @username
  profilePicture: text("profile_picture"),
  accessToken: text("access_token").notNull(), // OAuth access token (encrypted)
  refreshToken: text("refresh_token"), // For token refresh
  tokenExpiresAt: timestamp("token_expires_at"),
  scopes: jsonb("scopes").default([]), // Permissions granted
  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  syncData: jsonb("sync_data").default({}), // Last sync metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Real-time Campaign Metrics (Facebook Ads Manager Integration)
export const campaignMetrics = pgTable("campaign_metrics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: uuid("campaign_id").references(() => socialMediaCampaigns.id).notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  spend: decimal("spend", { precision: 10, scale: 2 }).default("0.00"),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0.00"),
  roas: decimal("roas", { precision: 5, scale: 2 }).default("0.00"), // Return on Ad Spend
  cpm: decimal("cpm", { precision: 8, scale: 2 }).default("0.00"), // Cost per mille
  cpc: decimal("cpc", { precision: 8, scale: 2 }).default("0.00"), // Cost per click
  ctr: decimal("ctr", { precision: 5, scale: 4 }).default("0.0000"), // Click-through rate
  cvr: decimal("cvr", { precision: 5, scale: 4 }).default("0.0000"), // Conversion rate
  engagement: integer("engagement").default(0),
  reach: integer("reach").default(0),
  frequency: decimal("frequency", { precision: 5, scale: 2 }).default("0.00"),
  recordedAt: timestamp("recorded_at").defaultNow(),
  syncedAt: timestamp("synced_at").defaultNow(),
});

// Image Bank for Posts
export const imageBank = pgTable("image_bank", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  url: text("url").notNull(), // Cloud storage URL
  thumbnailUrl: text("thumbnail_url"), // Optimized thumbnail
  size: integer("size").notNull(), // File size in bytes
  mimeType: text("mime_type").notNull(),
  width: integer("width"),
  height: integer("height"),
  category: text("category"), // 'product', 'lifestyle', 'promotional', etc.
  tags: jsonb("tags").default([]), // ['marketing', 'social', 'product']
  altText: text("alt_text"), // Accessibility text
  isPublic: boolean("is_public").default(false),
  uploadedBy: uuid("uploaded_by").references(() => users.id).notNull(),
  usageCount: integer("usage_count").default(0), // How many times used
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sales Funnel Data for Campaign Tracking
export const salesFunnels = pgTable("sales_funnels", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  campaignId: uuid("campaign_id").references(() => socialMediaCampaigns.id),
  name: text("name").notNull(),
  description: text("description"),
  // Funnel Stages with Metrics
  awareness: integer("awareness").default(0), // Top of funnel
  interest: integer("interest").default(0), // Interest stage  
  consideration: integer("consideration").default(0), // Consideration
  intent: integer("intent").default(0), // Purchase intent
  evaluation: integer("evaluation").default(0), // Evaluation stage
  purchase: integer("purchase").default(0), // Bottom of funnel - conversions
  // Conversion Rates Between Stages
  awarenessToInterest: decimal("awareness_to_interest", { precision: 5, scale: 4 }).default("0.0000"),
  interestToConsideration: decimal("interest_to_consideration", { precision: 5, scale: 4 }).default("0.0000"),
  considerationToIntent: decimal("consideration_to_intent", { precision: 5, scale: 4 }).default("0.0000"),
  intentToEvaluation: decimal("intent_to_evaluation", { precision: 5, scale: 4 }).default("0.0000"),
  evaluationToPurchase: decimal("evaluation_to_purchase", { precision: 5, scale: 4 }).default("0.0000"),
  // Overall Metrics
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default("0.00"),
  avgOrderValue: decimal("avg_order_value", { precision: 10, scale: 2 }).default("0.00"),
  customerLifetimeValue: decimal("customer_lifetime_value", { precision: 12, scale: 2 }).default("0.00"),
  recordedAt: timestamp("recorded_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Real-time Performance by Channel (Instagram, Facebook, etc.)
export const channelPerformance = pgTable("channel_performance", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  channel: text("channel").notNull(), // 'instagram', 'facebook', 'youtube', 'twitter'
  trafficPercentage: decimal("traffic_percentage", { precision: 5, scale: 2 }).default("0.00"),
  engagement: decimal("engagement", { precision: 5, scale: 2 }).default("0.00"), // Percentage
  followers: integer("followers").default(0),
  followersGrowth: decimal("followers_growth", { precision: 5, scale: 2 }).default("0.00"),
  posts: integer("posts").default(0),
  avgLikes: integer("avg_likes").default(0),
  avgComments: integer("avg_comments").default(0),
  avgShares: integer("avg_shares").default(0),
  topPerformingPost: text("top_performing_post"), // Post ID or URL
  recordedAt: timestamp("recorded_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Insights (Real-time) for Marketing Intelligence
export const aiMarketingInsights = pgTable("ai_marketing_insights", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  insightType: text("insight_type").notNull(), // 'best_posting_time', 'audience_analysis', 'content_recommendation'
  title: text("title").notNull(),
  description: text("description").notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).default("0.00"), // 0-100%
  impactScore: integer("impact_score").default(0), // 1-10 scale
  actionable: boolean("actionable").default(true),
  category: text("category"), // 'timing', 'audience', 'content', 'budget'
  data: jsonb("data").default({}), // Specific insight data
  isRead: boolean("is_read").default(false),
  validUntil: timestamp("valid_until"), // When insight expires
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Post Scheduling and Management
export const scheduledPosts = pgTable("scheduled_posts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  campaignId: uuid("campaign_id").references(() => socialMediaCampaigns.id),
  connectedAccountId: uuid("connected_account_id").references(() => connectedAccounts.id).notNull(),
  content: text("content").notNull(),
  imageIds: jsonb("image_ids").default([]), // References to imageBank
  scheduledFor: timestamp("scheduled_for").notNull(),
  status: text("status").default("scheduled"), // 'scheduled', 'published', 'failed', 'cancelled'
  platformPostId: text("platform_post_id"), // ID after publishing
  publishedAt: timestamp("published_at"),
  metrics: jsonb("metrics").default({}), // Post-specific metrics
  errorMessage: text("error_message"),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// =============================================================================
// SCHEMA EXPORTS FOR NEW TABLES
// =============================================================================

// Connected Accounts Schema
export const insertConnectedAccountSchema = createInsertSchema(connectedAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Campaign Metrics Schema
export const insertCampaignMetricsSchema = createInsertSchema(campaignMetrics).omit({
  id: true,
  recordedAt: true,
  syncedAt: true,
});

// Image Bank Schema
export const insertImageBankSchema = createInsertSchema(imageBank).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
});

// Sales Funnel Schema
export const insertSalesFunnelSchema = createInsertSchema(salesFunnels).omit({
  id: true,
  recordedAt: true,
  updatedAt: true,
});

// Channel Performance Schema  
export const insertChannelPerformanceSchema = createInsertSchema(channelPerformance).omit({
  id: true,
  recordedAt: true,
  updatedAt: true,
});

// AI Insights Schema
export const insertAiMarketingInsightsSchema = createInsertSchema(aiMarketingInsights).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Scheduled Posts Schema
export const insertScheduledPostSchema = createInsertSchema(scheduledPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
});

// =============================================================================
// TYPE EXPORTS FOR NEW TABLES
// =============================================================================

export type ConnectedAccount = typeof connectedAccounts.$inferSelect;
export type InsertConnectedAccount = z.infer<typeof insertConnectedAccountSchema>;

export type CampaignMetrics = typeof campaignMetrics.$inferSelect;
export type InsertCampaignMetrics = z.infer<typeof insertCampaignMetricsSchema>;

export type ImageBank = typeof imageBank.$inferSelect;
export type InsertImageBank = z.infer<typeof insertImageBankSchema>;

export type SalesFunnel = typeof salesFunnels.$inferSelect;
export type InsertSalesFunnel = z.infer<typeof insertSalesFunnelSchema>;

export type ChannelPerformance = typeof channelPerformance.$inferSelect;
export type InsertChannelPerformance = z.infer<typeof insertChannelPerformanceSchema>;

export type AiMarketingInsight = typeof aiMarketingInsights.$inferSelect;
export type InsertAiMarketingInsight = z.infer<typeof insertAiMarketingInsightsSchema>;

export type ScheduledPost = typeof scheduledPosts.$inferSelect;
export type InsertScheduledPost = z.infer<typeof insertScheduledPostSchema>;

// =============================================================================
// CONTENT AUTOMATION TABLES - SEMANA 1
// =============================================================================

// Content Automations Table - Main configuration table for content automation
export const contentAutomations = pgTable("content_automations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  keywordsPrimary: varchar("keywords_primary", { length: 500 }).notNull(),
  keywordsSecondary: jsonb("keywords_secondary").default([]),
  niche: varchar("niche", { length: 100 }).notNull(),
  toneOfVoice: varchar("tone_of_voice", { length: 50 }).notNull(),
  newsSources: jsonb("news_sources").default([]),
  blogConfig: jsonb("blog_config").default({}),
  instagramConfig: jsonb("instagram_config").default({}),
  frequency: varchar("frequency", { length: 50 }).notNull(),
  scheduleDays: jsonb("schedule_days").default([]),
  scheduleTime: varchar("schedule_time", { length: 8 }), // TIME format as varchar for simplicity
  manualApproval: boolean("manual_approval").default(true),
  status: varchar("status", { length: 20 }).default('active'), // active, paused, inactive
  lastExecution: timestamp("last_execution"),
  nextExecution: timestamp("next_execution"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Content Automation Executions Table - Track each execution of content automation
export const contentAutomationExecutions = pgTable("content_automation_executions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  automationId: uuid("automation_id").references(() => contentAutomations.id).notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  executionDate: timestamp("execution_date").defaultNow(),
  newsFound: integer("news_found").default(0),
  selectedNews: jsonb("selected_news").default({}),
  generatedContent: jsonb("generated_content").default({}),
  generatedImageUrl: varchar("generated_image_url", { length: 500 }),
  blogPublished: boolean("blog_published").default(false),
  instagramPublished: boolean("instagram_published").default(false),
  blogUrl: varchar("blog_url", { length: 500 }),
  instagramUrl: varchar("instagram_url", { length: 500 }),
  approvalStatus: varchar("approval_status", { length: 20 }).default('pending'), // pending, approved, rejected
  performanceMetrics: jsonb("performance_metrics").default({}),
  executionTime: integer("execution_time"), // seconds
  status: varchar("status", { length: 20 }).default('pending'), // success, failed, pending
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// News Sources Table - Track news sources and their reliability
export const newsSources = pgTable("news_sources", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  apiEndpoint: varchar("api_endpoint", { length: 500 }),
  scrapingConfig: jsonb("scraping_config").default({}),
  language: varchar("language", { length: 10 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  reliabilityScore: decimal("reliability_score", { precision: 3, scale: 2 }).default('0.00'),
  lastCheck: timestamp("last_check"),
  status: varchar("status", { length: 20 }).default('active'), // active, inactive, error
  createdAt: timestamp("created_at").defaultNow(),
});

// Generated Content Table - Store all generated content with metadata
export const generatedContent = pgTable("generated_content", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  executionId: uuid("execution_id").references(() => contentAutomationExecutions.id).notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  contentType: varchar("content_type", { length: 20 }).notNull(), // blog, instagram
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  metaDescription: varchar("meta_description", { length: 500 }),
  tags: jsonb("tags").default([]),
  imageUrl: varchar("image_url", { length: 500 }),
  imagePrompt: text("image_prompt"),
  seoScore: decimal("seo_score", { precision: 3, scale: 2 }).default('0.00'),
  readabilityScore: decimal("readability_score", { precision: 3, scale: 2 }).default('0.00'),
  wordCount: integer("word_count").default(0),
  estimatedReadingTime: integer("estimated_reading_time").default(0),
  performancePrediction: jsonb("performance_prediction").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

// =============================================================================
// CONTENT AUTOMATION SCHEMAS
// =============================================================================

// Content Automations Schema
export const insertContentAutomationSchema = createInsertSchema(contentAutomations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastExecution: true,
  nextExecution: true,
});

// Content Automation Executions Schema  
export const insertContentAutomationExecutionSchema = createInsertSchema(contentAutomationExecutions).omit({
  id: true,
  createdAt: true,
  executionDate: true,
});

// News Sources Schema
export const insertNewsSourceSchema = createInsertSchema(newsSources).omit({
  id: true,
  createdAt: true,
  lastCheck: true,
});

// Generated Content Schema
export const insertGeneratedContentSchema = createInsertSchema(generatedContent).omit({
  id: true,
  createdAt: true,
});

// =============================================================================
// CONTENT AUTOMATION TYPE EXPORTS
// =============================================================================

export type ContentAutomation = typeof contentAutomations.$inferSelect;
export type InsertContentAutomation = z.infer<typeof insertContentAutomationSchema>;

export type ContentAutomationExecution = typeof contentAutomationExecutions.$inferSelect;
export type InsertContentAutomationExecution = z.infer<typeof insertContentAutomationExecutionSchema>;

export type NewsSource = typeof newsSources.$inferSelect;
export type InsertNewsSource = z.infer<typeof insertNewsSourceSchema>;

export type GeneratedContent = typeof generatedContent.$inferSelect;
export type InsertGeneratedContent = z.infer<typeof insertGeneratedContentSchema>;

// =============================================================================
// BLOG & TRENDS AUTOMATION SYSTEM
// =============================================================================

// Blog & Trends System Tables
export const blogNiches = pgTable("blog_niches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  name: text("name").notNull(), // "Tecnologia", "Cripto", "Marketing"
  slug: text("slug").notNull().unique(), // "tecnologia", "cripto"
  description: text("description"),
  keywords: jsonb("keywords").default([]), // ["IA", "blockchain", "NFT"]
  language: text("language").default('pt'), // pt, en, es
  region: text("region").default('BR'), // BR, US, ES
  isActive: boolean("is_active").default(true),
  minArticlesForNewsMode: integer("min_articles_for_news_mode").default(3),
  maxPostsPerDay: integer("max_posts_per_day").default(5),
  scheduleCron: text("schedule_cron").default('0 */4 * * *'), // A cada 4 horas
  lastProcessedAt: timestamp("last_processed_at"),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const trendingTopics = pgTable("trending_topics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nicheId: varchar("niche_id").references(() => blogNiches.id).notNull(),
  term: text("term").notNull(),
  source: text("source").notNull(), // 'google_trends', 'youtube', 'reddit', 'twitter'
  sourceType: text("source_type").notNull(), // 'web', 'youtube_trends', 'youtube_popular', 'reddit_hot'
  score: integer("score").default(1), // Relevância 1-100
  metadata: jsonb("metadata").default({}), // Dados extras da fonte
  collectedAt: timestamp("collected_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
});

export const newsArticles = pgTable("news_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nicheId: varchar("niche_id").references(() => blogNiches.id).notNull(),
  trendTerm: text("trend_term"), // Termo que gerou o artigo
  title: text("title").notNull(),
  description: text("description"),
  content: text("content"),
  url: text("url").notNull().unique(),
  sourceUrl: text("source_url"), // Domínio da fonte
  sourceName: text("source_name"), // Nome da publicação
  author: text("author"),
  imageUrl: text("image_url"),
  publishedAt: timestamp("published_at"),
  language: text("language").default('pt'),
  relevanceScore: integer("relevance_score").default(0), // 0-100
  sentimentScore: decimal("sentiment_score", { precision: 3, scale: 2 }), // -1.00 a 1.00
  isUsed: boolean("is_used").default(false), // Se já foi usado em post
  createdAt: timestamp("created_at").defaultNow()
});

export const generatedBlogPosts = pgTable("generated_blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nicheId: varchar("niche_id").references(() => blogNiches.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  mode: text("mode").notNull(), // 'news' ou 'social'
  sourceData: jsonb("source_data").notNull(), // IDs dos artigos ou trends usados
  tags: jsonb("tags").default([]),
  featuredImageUrl: text("featured_image_url"),
  wordpressPostId: text("wordpress_post_id"), // ID no WordPress após publicação
  status: text("status").default('draft'), // 'draft', 'published', 'failed'
  publishedAt: timestamp("published_at"),
  publicationUrl: text("publication_url"), // URL final do post publicado
  contentHash: text("content_hash").notNull(), // Hash para deduplicação
  metadata: jsonb("metadata").default({}),
  readingTime: integer("reading_time"), // Tempo de leitura em minutos
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const blogAutomationRuns = pgTable("blog_automation_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nicheId: varchar("niche_id").references(() => blogNiches.id).notNull(),
  startedAt: timestamp("started_at").defaultNow(),
  finishedAt: timestamp("finished_at"),
  status: text("status").notNull(), // 'running', 'completed', 'failed'
  trendsCollected: integer("trends_collected").default(0),
  articlesFound: integer("articles_found").default(0),
  postsGenerated: integer("posts_generated").default(0),
  postsPublished: integer("posts_published").default(0),
  mode: text("mode"), // 'news' ou 'social' - qual rota foi usada
  errors: jsonb("errors").default([]),
  processingTime: integer("processing_time"), // Segundos
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow()
});

// Configurações do sistema de blog
export const blogSettings = pgTable("blog_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  wordpressApiUrl: text("wordpress_api_url"),
  wordpressUsername: text("wordpress_username"),
  wordpressAppPassword: text("wordpress_app_password"),
  defaultAuthor: text("default_author"),
  defaultCategories: jsonb("default_categories").default([]),
  contentPromptTemplate: text("content_prompt_template"),
  newsPromptTemplate: text("news_prompt_template"),
  socialPromptTemplate: text("social_prompt_template"),
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// =============================================================================
// BLOG SYSTEM SCHEMAS
// =============================================================================

export const insertBlogNicheSchema = createInsertSchema(blogNiches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastProcessedAt: true,
});

export const insertTrendingTopicSchema = createInsertSchema(trendingTopics).omit({
  id: true,
  createdAt: true,
  collectedAt: true,
});

export const insertNewsArticleSchema = createInsertSchema(newsArticles).omit({
  id: true,
  createdAt: true,
});

export const insertGeneratedBlogPostSchema = createInsertSchema(generatedBlogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
});

export const insertBlogSettingsSchema = createInsertSchema(blogSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// =============================================================================
// BLOG SYSTEM TYPE EXPORTS
// =============================================================================

export type BlogNiche = typeof blogNiches.$inferSelect;
export type InsertBlogNiche = z.infer<typeof insertBlogNicheSchema>;

export type TrendingTopic = typeof trendingTopics.$inferSelect;
export type InsertTrendingTopic = z.infer<typeof insertTrendingTopicSchema>;

export type NewsArticle = typeof newsArticles.$inferSelect;
export type InsertNewsArticle = z.infer<typeof insertNewsArticleSchema>;

export type GeneratedBlogPost = typeof generatedBlogPosts.$inferSelect;
export type InsertGeneratedBlogPost = z.infer<typeof insertGeneratedBlogPostSchema>;

export type BlogAutomationRun = typeof blogAutomationRuns.$inferSelect;
export type InsertBlogAutomationRun = typeof blogAutomationRuns.$inferInsert;

export type BlogSettings = typeof blogSettings.$inferSelect;
export type InsertBlogSettings = z.infer<typeof insertBlogSettingsSchema>;
