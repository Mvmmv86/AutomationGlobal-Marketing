# 🗄️ SETUP MANUAL DO SUPABASE - AUTOMATION GLOBAL v4.0

## ⚠️ Limitação de Rede do Replit
O ambiente Replit bloqueia conexões externas com Supabase na porta 5432, causando timeouts constantes. A única solução é executar o SQL diretamente no console do Supabase.

## 🚀 COMO EXECUTAR:

### Passo 1: Acesse o Supabase
1. Vá para [https://app.supabase.com](https://app.supabase.com)
2. Entre no seu projeto
3. Clique em **SQL Editor** na barra lateral esquerda
4. Clique em **+ New Query**

### Passo 2: Execute o SQL Completo
Copie e cole TODO este código SQL no editor e clique em **RUN**:

```sql
-- ====================================
-- AUTOMATION GLOBAL v4.0 - SCHEMA COMPLETO
-- Sistema SaaS Multi-tenant com IA
-- ====================================

-- PASSO 1: Limpar dados existentes (se houver)
DROP TABLE IF EXISTS system_notifications CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS organization_integrations CASCADE;
DROP TABLE IF EXISTS integrations CASCADE;
DROP TABLE IF EXISTS automation_executions CASCADE;
DROP TABLE IF EXISTS automations CASCADE;
DROP TABLE IF EXISTS organization_modules CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS ai_configurations CASCADE;
DROP TABLE IF EXISTS ai_usage_logs CASCADE;
DROP TABLE IF EXISTS ai_providers CASCADE;
DROP TABLE IF EXISTS organization_users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Remover ENUMs se existirem
DROP TYPE IF EXISTS subscription_plan CASCADE;
DROP TYPE IF EXISTS organization_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS ai_provider CASCADE;
DROP TYPE IF EXISTS module_status CASCADE;

-- PASSO 2: Criar ENUMs para tipos de dados
CREATE TYPE subscription_plan AS ENUM ('starter', 'professional', 'enterprise');
CREATE TYPE organization_type AS ENUM ('marketing', 'support', 'trading');
CREATE TYPE user_role AS ENUM ('super_admin', 'org_owner', 'org_admin', 'org_manager', 'org_user', 'org_viewer');
CREATE TYPE ai_provider AS ENUM ('openai', 'anthropic', 'custom');
CREATE TYPE module_status AS ENUM ('active', 'inactive', 'pending');

-- PASSO 3: Criar Tabelas Core do Sistema
-- Tabela de usuários
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    avatar TEXT,
    password TEXT NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de organizações
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    domain TEXT,
    logo TEXT,
    description TEXT,
    type organization_type NOT NULL,
    subscription_plan subscription_plan DEFAULT 'starter',
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de relacionamento usuários-organizações (multi-tenant)
CREATE TABLE organization_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    role user_role NOT NULL DEFAULT 'org_user',
    permissions JSONB DEFAULT '{}',
    invited_by UUID REFERENCES users(id),
    joined_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- PASSO 4: Criar Tabelas de IA e Provedores
-- Tabela de provedores de IA (OpenAI, Anthropic, etc.)
CREATE TABLE ai_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    provider ai_provider NOT NULL,
    api_key TEXT,
    endpoint TEXT,
    models JSONB DEFAULT '[]',
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Logs de uso de IA (para cobrança e monitoramento)
CREATE TABLE ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    user_id UUID REFERENCES users(id),
    provider_id UUID REFERENCES ai_providers(id) NOT NULL,
    model TEXT NOT NULL,
    tokens INTEGER,
    cost DECIMAL(10,6),
    request_data JSONB,
    response_data JSONB,
    status TEXT NOT NULL,
    duration INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Configurações de IA por organização
CREATE TABLE ai_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    provider_id UUID REFERENCES ai_providers(id) NOT NULL,
    model TEXT NOT NULL,
    settings JSONB DEFAULT '{}',
    fallback_provider_id UUID REFERENCES ai_providers(id),
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- PASSO 5: Criar Tabelas de Módulos de Automação
-- Módulos disponíveis (Marketing, Support, Trading)
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    features JSONB DEFAULT '[]',
    required_plan subscription_plan DEFAULT 'starter',
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Módulos ativados por organização  
CREATE TABLE organization_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    module_id UUID REFERENCES modules(id) NOT NULL,
    status module_status DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    activated_at TIMESTAMP DEFAULT NOW(),
    activated_by UUID REFERENCES users(id)
);

-- PASSO 6: Criar Tabelas de Automação e Workflows
-- Automações criadas pelos usuários
CREATE TABLE automations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    trigger JSONB NOT NULL,
    actions JSONB NOT NULL,
    conditions JSONB DEFAULT '[]',
    schedule JSONB,
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMP,
    next_run_at TIMESTAMP,
    created_by UUID REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Logs de execução das automações
CREATE TABLE automation_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automation_id UUID REFERENCES automations(id) NOT NULL,
    status TEXT NOT NULL,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    result JSONB,
    error TEXT,
    logs JSONB DEFAULT '[]'
);

-- PASSO 7: Criar Tabelas de Integrações Externas
-- Integrações disponíveis (Google Ads, Facebook, Zendesk, etc.)
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    description TEXT,
    auth_type TEXT NOT NULL,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Integrações ativas por organização
CREATE TABLE organization_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    integration_id UUID REFERENCES integrations(id) NOT NULL,
    credentials JSONB,
    settings JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active',
    last_sync_at TIMESTAMP,
    connected_by UUID REFERENCES users(id) NOT NULL,
    connected_at TIMESTAMP DEFAULT NOW()
);

-- PASSO 8: Criar Tabelas de Sistema e Auditoria
-- Logs de atividades dos usuários
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id UUID,
    details JSONB,
    ip TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sistema de notificações
CREATE TABLE system_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- PASSO 9: Criar Índices para Performance Otimizada
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organization_users_org ON organization_users(organization_id);
CREATE INDEX idx_organization_users_user ON organization_users(user_id);
CREATE INDEX idx_ai_usage_logs_org_created ON ai_usage_logs(organization_id, created_at);
CREATE INDEX idx_activity_logs_org_created ON activity_logs(organization_id, created_at);
CREATE INDEX idx_automation_executions_status ON automation_executions(status);

-- PASSO 10: Inserir Dados Iniciais do Sistema
-- Inserir os 3 módulos principais
INSERT INTO modules (name, slug, description, features, required_plan) VALUES
(
    'Marketing Automation',
    'marketing-automation',
    'Comprehensive marketing automation with AI-powered campaigns',
    '["Email campaigns", "Social media automation", "Lead scoring", "A/B testing", "Customer segmentation", "Analytics dashboard"]',
    'starter'
),
(
    'Customer Support AI',
    'customer-support-ai',
    'AI-powered customer support and ticket management',
    '["Auto ticket classification", "AI response suggestions", "Sentiment analysis", "Knowledge base integration", "Multi-channel support", "Performance analytics"]',
    'starter'
),
(
    'Trading Analytics',
    'trading-analytics',
    'Advanced trading analytics and market intelligence',
    '["Market sentiment analysis", "Trading signals", "Portfolio optimization", "Risk management", "Backtesting", "Real-time alerts"]',
    'professional'
);

-- Inserir provedores de IA com configurações atualizadas
INSERT INTO ai_providers (name, provider, models, settings) VALUES
(
    'OpenAI GPT-5',
    'openai',
    '["gpt-5", "gpt-4o", "gpt-4"]',
    '{"pricing": {"gpt-5": {"input": 0.00002, "output": 0.00006}, "gpt-4o": {"input": 0.0000025, "output": 0.00001}}, "rateLimits": {"requests_per_minute": 500, "tokens_per_minute": 30000}}'
),
(
    'Anthropic Claude Sonnet 4',
    'anthropic',
    '["claude-sonnet-4-20250514", "claude-3-7-sonnet-20250219"]',
    '{"pricing": {"claude-sonnet-4-20250514": {"input": 0.000015, "output": 0.000075}, "claude-3-7-sonnet-20250219": {"input": 0.000003, "output": 0.000015}}, "rateLimits": {"requests_per_minute": 300, "tokens_per_minute": 25000}}'
);

-- Inserir integrações básicas disponíveis
INSERT INTO integrations (name, provider, description, auth_type) VALUES
('Google Ads', 'google_ads', 'Google Ads campaign management and analytics', 'oauth'),
('Facebook Ads', 'facebook_ads', 'Facebook and Instagram advertising integration', 'oauth'),
('Zendesk', 'zendesk', 'Customer support ticket management', 'api_key');
```

## 🚀 **Como Executar:**

1. **Acesse o console Supabase**:
   - Vá para [https://app.supabase.com](https://app.supabase.com)
   - Entre no seu projeto

2. **Abra o SQL Editor**:
   - Clique em "SQL Editor" na barra lateral
   - Clique em "New Query"

3. **Cole o SQL completo**:
   - Copie TODO o código SQL acima
   - Cole no editor
   - Clique em "RUN"

4. **Verifique a criação**:
   - As 14 tabelas serão criadas
   - 3 módulos serão inseridos
   - 2 provedores de IA serão configurados
   - 3 integrações básicas serão criadas

## ✅ **Após executar o SQL:**

- Volte para a aplicação no Replit
- Use `/api/database/status` para confirmar que as tabelas existem
- A aplicação funcionará normalmente
- Poderá criar usuários e organizações via interface web

## 🔍 **Verificar se deu certo:**

Após executar o SQL no Supabase, volte ao teste na aplicação. As tabelas estarão prontas e funcionais.