-- Row Level Security Setup for Automation Global v4.0
-- Multi-tenant security policies for Supabase

-- =============================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECURITY UTILITY FUNCTIONS
-- =============================================

-- Function to check if user has role in organization
CREATE OR REPLACE FUNCTION user_has_role_in_org(user_uuid uuid, org_uuid uuid, required_role text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members 
    WHERE user_id = user_uuid 
    AND organization_id = org_uuid 
    AND role = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user belongs to organization
CREATE OR REPLACE FUNCTION user_belongs_to_org(user_uuid uuid, org_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members 
    WHERE user_id = user_uuid 
    AND organization_id = org_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's organizations
CREATE OR REPLACE FUNCTION get_user_organizations(user_uuid uuid)
RETURNS TABLE(organization_id uuid, role text) AS $$
BEGIN
  RETURN QUERY
  SELECT om.organization_id, om.role 
  FROM organization_members om 
  WHERE om.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members 
    WHERE user_id = user_uuid 
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- USER ACCESS POLICIES
-- =============================================

-- Users can only see users in their organization or themselves
CREATE POLICY "users_org_isolation" ON users
  FOR ALL USING (
    id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM organization_members om 
      WHERE om.user_id = auth.uid() 
      AND om.organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = users.id
      )
    )
  );

-- Users can update their own profile
CREATE POLICY "users_self_update" ON users
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- =============================================
-- ORGANIZATION ACCESS POLICIES
-- =============================================

-- Users can view organizations they belong to
CREATE POLICY "organizations_member_access" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Users can update organizations based on their role
CREATE POLICY "organizations_role_update" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Super admins can see all organizations
CREATE POLICY "organizations_super_admin_access" ON organizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- =============================================
-- ORGANIZATION MEMBERS POLICIES
-- =============================================

-- Organization members can only see their organization data
CREATE POLICY "org_members_isolation" ON organization_members
  FOR ALL USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- AI SERVICES POLICIES
-- =============================================

-- AI providers are managed by super admins
CREATE POLICY "ai_providers_admin_only" ON ai_providers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- AI models are managed by super admins
CREATE POLICY "ai_models_admin_only" ON ai_models
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- AI usage logs are organization-scoped
CREATE POLICY "ai_usage_org_isolation" ON ai_usage_logs
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- MODULE-SPECIFIC POLICIES
-- =============================================

-- Marketing campaigns are organization-scoped
CREATE POLICY "marketing_org_isolation" ON marketing_campaigns
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Support tickets are organization-scoped
CREATE POLICY "support_org_isolation" ON support_tickets
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Trading strategies are organization-scoped
CREATE POLICY "trading_org_isolation" ON trading_strategies
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- AUTOMATION POLICIES
-- =============================================

-- Automations are organization-scoped
CREATE POLICY "automations_org_isolation" ON automations
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Automation steps inherit organization scope
CREATE POLICY "automation_steps_org_isolation" ON automation_steps
  FOR ALL USING (
    automation_id IN (
      SELECT id FROM automations 
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Automation executions inherit organization scope
CREATE POLICY "automation_executions_org_isolation" ON automation_executions
  FOR ALL USING (
    automation_id IN (
      SELECT id FROM automations 
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- =============================================
-- INTEGRATION POLICIES
-- =============================================

-- Integrations are organization-scoped
CREATE POLICY "integrations_org_isolation" ON integrations
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Webhooks are organization-scoped with admin access
CREATE POLICY "webhooks_admin_access" ON webhooks
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- API keys are organization-scoped
CREATE POLICY "api_keys_org_isolation" ON api_keys
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- SYSTEM POLICIES
-- =============================================

-- Activity logs are organization-scoped
CREATE POLICY "activity_logs_org_isolation" ON activity_logs
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- System notifications can be seen by all users
CREATE POLICY "system_notifications_public" ON system_notifications
  FOR SELECT USING (true);

-- =============================================
-- ROLE HIERARCHY DEFINITIONS
-- =============================================

-- Role hierarchy (from highest to lowest):
-- 1. super_admin - Platform administrator
-- 2. owner - Organization owner
-- 3. admin - Organization administrator  
-- 4. manager - Organization manager
-- 5. editor - Content editor
-- 6. viewer - Read-only access

-- Grant permissions for each role level
COMMENT ON TABLE organization_members IS 'Role hierarchy: super_admin > owner > admin > manager > editor > viewer';

-- =============================================
-- SETUP VALIDATION QUERIES
-- =============================================

-- Query to check RLS status on all tables
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND rowsecurity = true;

-- Query to check all policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public';