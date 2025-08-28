-- AUTOMATION GLOBAL V4.0 - DATABASE SCHEMA
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- 1. CRIAR ENUM TYPES
CREATE TYPE "public"."ai_provider" AS ENUM('openai', 'anthropic', 'custom');
CREATE TYPE "public"."module_status" AS ENUM('active', 'inactive', 'pending');
CREATE TYPE "public"."organization_type" AS ENUM('marketing', 'support', 'trading');
CREATE TYPE "public"."subscription_plan" AS ENUM('starter', 'professional', 'enterprise');
CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'org_owner', 'org_admin', 'org_manager', 'org_user', 'org_viewer');

-- 2. TABELAS PRINCIPAIS

-- Users (base para autenticação)
CREATE TABLE "users" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "email" text NOT NULL UNIQUE,
    "username" text NOT NULL UNIQUE,
    "first_name" text,
    "last_name" text,
    "avatar" text,
    "password" text NOT NULL,
    "email_verified" boolean DEFAULT false,
    "last_login_at" timestamp,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);

-- Organizations (multi-tenant)
CREATE TABLE "organizations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "slug" text NOT NULL UNIQUE,
    "domain" text,
    "logo" text,
    "description" text,
    "type" "organization_type" NOT NULL,
    "subscription_plan" "subscription_plan" DEFAULT 'starter',
    "settings" jsonb DEFAULT '{}'::jsonb,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);

-- Organization Users (relacionamento many-to-many com roles)
CREATE TABLE "organization_users" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid NOT NULL REFERENCES "organizations"("id"),
    "user_id" uuid NOT NULL REFERENCES "users"("id"),
    "role" "user_role" DEFAULT 'org_user' NOT NULL,
    "permissions" jsonb DEFAULT '{}'::jsonb,
    "invited_by" uuid REFERENCES "users"("id"),
    "joined_at" timestamp DEFAULT now(),
    "is_active" boolean DEFAULT true
);

-- 3. SISTEMA DE MÓDULOS

-- Modules (marketing, support, trading)
CREATE TABLE "modules" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "slug" text NOT NULL UNIQUE,
    "description" text,
    "features" jsonb DEFAULT '[]'::jsonb,
    "required_plan" "subscription_plan" DEFAULT 'starter',
    "settings" jsonb DEFAULT '{}'::jsonb,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp DEFAULT now()
);

-- Organization Modules (quais módulos cada org tem ativo)
CREATE TABLE "organization_modules" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid NOT NULL REFERENCES "organizations"("id"),
    "module_id" uuid NOT NULL REFERENCES "modules"("id"),
    "status" "module_status" DEFAULT 'active',
    "settings" jsonb DEFAULT '{}'::jsonb,
    "activated_at" timestamp DEFAULT now(),
    "activated_by" uuid REFERENCES "users"("id")
);

-- 4. SISTEMA DE IA

-- AI Providers (OpenAI, Anthropic, etc.)
CREATE TABLE "ai_providers" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "provider" "ai_provider" NOT NULL,
    "api_key" text,
    "endpoint" text,
    "models" jsonb DEFAULT '[]'::jsonb,
    "settings" jsonb DEFAULT '{}'::jsonb,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp DEFAULT now()
);

-- AI Configurations (configuração por organização)
CREATE TABLE "ai_configurations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid NOT NULL REFERENCES "organizations"("id"),
    "provider_id" uuid NOT NULL REFERENCES "ai_providers"("id"),
    "model" text NOT NULL,
    "settings" jsonb DEFAULT '{}'::jsonb,
    "fallback_provider_id" uuid REFERENCES "ai_providers"("id"),
    "priority" integer DEFAULT 1,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp DEFAULT now()
);

-- AI Usage Logs (tracking de uso e custo)
CREATE TABLE "ai_usage_logs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid NOT NULL REFERENCES "organizations"("id"),
    "user_id" uuid REFERENCES "users"("id"),
    "provider_id" uuid NOT NULL REFERENCES "ai_providers"("id"),
    "model" text NOT NULL,
    "tokens" integer,
    "cost" numeric(10, 6),
    "request_data" jsonb,
    "response_data" jsonb,
    "status" text NOT NULL,
    "duration" integer,
    "created_at" timestamp DEFAULT now()
);

-- 5. SISTEMA DE AUTOMAÇÕES

-- Automations (workflows personalizados)
CREATE TABLE "automations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid NOT NULL REFERENCES "organizations"("id"),
    "name" text NOT NULL,
    "description" text,
    "trigger" jsonb NOT NULL,
    "actions" jsonb NOT NULL,
    "conditions" jsonb DEFAULT '[]'::jsonb,
    "schedule" jsonb,
    "is_active" boolean DEFAULT true,
    "last_run_at" timestamp,
    "next_run_at" timestamp,
    "created_by" uuid NOT NULL REFERENCES "users"("id"),
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);

-- Automation Executions (histórico de execuções)
CREATE TABLE "automation_executions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "automation_id" uuid NOT NULL REFERENCES "automations"("id"),
    "status" text NOT NULL,
    "started_at" timestamp DEFAULT now(),
    "completed_at" timestamp,
    "result" jsonb,
    "error" text,
    "logs" jsonb DEFAULT '[]'::jsonb
);

-- 6. SISTEMA DE INTEGRAÇÕES

-- Integrations (tipos de integração disponíveis)
CREATE TABLE "integrations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "provider" text NOT NULL,
    "description" text,
    "auth_type" text NOT NULL,
    "settings" jsonb DEFAULT '{}'::jsonb,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp DEFAULT now()
);

-- Organization Integrations (integrações ativas por org)
CREATE TABLE "organization_integrations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid NOT NULL REFERENCES "organizations"("id"),
    "integration_id" uuid NOT NULL REFERENCES "integrations"("id"),
    "credentials" jsonb,
    "settings" jsonb DEFAULT '{}'::jsonb,
    "status" text DEFAULT 'active',
    "last_sync_at" timestamp,
    "connected_by" uuid NOT NULL REFERENCES "users"("id"),
    "connected_at" timestamp DEFAULT now()
);

-- 7. SISTEMA DE LOGS E NOTIFICAÇÕES

-- Activity Logs (auditoria)
CREATE TABLE "activity_logs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid REFERENCES "organizations"("id"),
    "user_id" uuid REFERENCES "users"("id"),
    "action" text NOT NULL,
    "resource" text NOT NULL,
    "resource_id" uuid,
    "details" jsonb,
    "ip" text,
    "user_agent" text,
    "created_at" timestamp DEFAULT now()
);

-- System Notifications (notificações do sistema)
CREATE TABLE "system_notifications" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid REFERENCES "organizations"("id"),
    "user_id" uuid REFERENCES "users"("id"),
    "title" text NOT NULL,
    "message" text NOT NULL,
    "type" text NOT NULL,
    "is_read" boolean DEFAULT false,
    "created_at" timestamp DEFAULT now()
);

-- SUCESSO!
-- Execute este SQL completo no Supabase Dashboard
-- Todas as 14 tabelas e 5 ENUMs serão criados
-- Ready for Phase 2 development!