# Database Security Configuration
## Automation Global v4.0

## Row Level Security (RLS) Policies

### Overview
This document outlines the complete Row Level Security (RLS) implementation for the Automation Global platform. RLS ensures complete data isolation between organizations in our multi-tenant architecture.

### Security Principles
1. **Complete Tenant Isolation**: Each organization can only access its own data
2. **Role-Based Access**: Users can only access data based on their role within an organization  
3. **Audit Trail**: All data access and modifications are logged
4. **Defense in Depth**: Multiple layers of security at application and database levels

## RLS Policies by Table

### Core Tables

#### users
```sql
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own profile
CREATE POLICY "users_own_profile" ON users
  FOR ALL USING (auth.uid() = id);

-- Policy: Org admins can see users in their organization
CREATE POLICY "users_org_admin_access" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.organization_id IN (
        SELECT ou2.organization_id FROM organization_users ou2
        WHERE ou2.user_id = users.id
      )
      AND ou.role IN ('org_owner', 'org_admin')
      AND ou.is_active = true
    )
  );
```

#### organizations
```sql
-- Enable RLS on organizations table
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can access organizations they belong to
CREATE POLICY "organizations_member_access" ON organizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.organization_id = organizations.id
      AND ou.user_id = auth.uid()
      AND ou.is_active = true
    )
  );

-- Policy: Super admins can access all organizations
CREATE POLICY "organizations_super_admin_access" ON organizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
    )
  );
```

#### organization_users
```sql
-- Enable RLS on organization_users table
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own memberships
CREATE POLICY "org_users_own_membership" ON organization_users
  FOR ALL USING (user_id = auth.uid());

-- Policy: Org admins can manage memberships in their organizations
CREATE POLICY "org_users_admin_access" ON organization_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.organization_id = organization_users.organization_id
      AND ou.role IN ('org_owner', 'org_admin')
      AND ou.is_active = true
    )
  );
```

### AI Tables

#### ai_usage_logs
```sql
-- Enable RLS on ai_usage_logs table
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Organization-based access
CREATE POLICY "ai_usage_org_access" ON ai_usage_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.organization_id = ai_usage_logs.organization_id
      AND ou.user_id = auth.uid()
      AND ou.is_active = true
    )
  );

-- Policy: Users can see their own AI usage
CREATE POLICY "ai_usage_own_access" ON ai_usage_logs
  FOR SELECT USING (user_id = auth.uid());
```

#### ai_configurations
```sql
-- Enable RLS on ai_configurations table
ALTER TABLE ai_configurations ENABLE ROW LEVEL SECURITY;

-- Policy: Organization-based access with admin permissions
CREATE POLICY "ai_config_org_admin_access" ON ai_configurations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.organization_id = ai_configurations.organization_id
      AND ou.user_id = auth.uid()
      AND ou.role IN ('org_owner', 'org_admin', 'org_manager')
      AND ou.is_active = true
    )
  );
```

### Module Tables

#### organization_modules
```sql
-- Enable RLS on organization_modules table
ALTER TABLE organization_modules ENABLE ROW LEVEL SECURITY;

-- Policy: Organization members can view active modules
CREATE POLICY "org_modules_member_view" ON organization_modules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.organization_id = organization_modules.organization_id
      AND ou.user_id = auth.uid()
      AND ou.is_active = true
    )
  );

-- Policy: Org admins can manage modules
CREATE POLICY "org_modules_admin_manage" ON organization_modules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.organization_id = organization_modules.organization_id
      AND ou.user_id = auth.uid()
      AND ou.role IN ('org_owner', 'org_admin')
      AND ou.is_active = true
    )
  );
```

### Automation Tables

#### automations
```sql
-- Enable RLS on automations table
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;

-- Policy: Organization-based access
CREATE POLICY "automations_org_access" ON automations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.organization_id = automations.organization_id
      AND ou.user_id = auth.uid()
      AND ou.is_active = true
    )
  );

-- Policy: Users can only modify automations they created (unless admin)
CREATE POLICY "automations_creator_modify" ON automations
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.organization_id = automations.organization_id
      AND ou.user_id = auth.uid()
      AND ou.role IN ('org_owner', 'org_admin', 'org_manager')
      AND ou.is_active = true
    )
  );
```

#### automation_executions
```sql
-- Enable RLS on automation_executions table
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;

-- Policy: Access via automation ownership
CREATE POLICY "automation_exec_via_automation" ON automation_executions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM automations a
      JOIN organization_users ou ON ou.organization_id = a.organization_id
      WHERE a.id = automation_executions.automation_id
      AND ou.user_id = auth.uid()
      AND ou.is_active = true
    )
  );
```

### Integration Tables

#### organization_integrations
```sql
-- Enable RLS on organization_integrations table
ALTER TABLE organization_integrations ENABLE ROW LEVEL SECURITY;

-- Policy: Organization admin access for integrations
CREATE POLICY "org_integrations_admin_access" ON organization_integrations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.organization_id = organization_integrations.organization_id
      AND ou.user_id = auth.uid()
      AND ou.role IN ('org_owner', 'org_admin', 'org_manager')
      AND ou.is_active = true
    )
  );
```

### System Tables

#### activity_logs
```sql
-- Enable RLS on activity_logs table
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Organization-based access for admins
CREATE POLICY "activity_logs_org_admin_access" ON activity_logs
  FOR SELECT USING (
    organization_id IS NULL OR -- System-wide logs for super admins
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.organization_id = activity_logs.organization_id
      AND ou.user_id = auth.uid()
      AND ou.role IN ('org_owner', 'org_admin')
      AND ou.is_active = true
    )
  );

-- Policy: Users can see their own activity
CREATE POLICY "activity_logs_own_access" ON activity_logs
  FOR SELECT USING (user_id = auth.uid());
```

#### system_notifications
```sql
-- Enable RLS on system_notifications table
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own notifications
CREATE POLICY "notifications_own_access" ON system_notifications
  FOR ALL USING (user_id = auth.uid());

-- Policy: Organization-based notifications
CREATE POLICY "notifications_org_access" ON system_notifications
  FOR SELECT USING (
    organization_id IS NULL OR -- System-wide notifications
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.organization_id = system_notifications.organization_id
      AND ou.user_id = auth.uid()
      AND ou.is_active = true
    )
  );
```

## Security Functions

### Get Current Organization Context
```sql
CREATE OR REPLACE FUNCTION get_current_organization()
RETURNS UUID AS $$
  -- This function would be called by the application
  -- to set the current organization context
  SELECT current_setting('app.current_organization_id')::UUID;
$$ LANGUAGE sql;
```

### Check Organization Permission
```sql
CREATE OR REPLACE FUNCTION has_organization_permission(
  org_id UUID,
  required_role TEXT DEFAULT 'org_user'
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT ou.role INTO user_role
  FROM organization_users ou
  WHERE ou.organization_id = org_id
  AND ou.user_id = auth.uid()
  AND ou.is_active = true;
  
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Role hierarchy: super_admin > org_owner > org_admin > org_manager > org_user > org_viewer
  CASE required_role
    WHEN 'org_viewer' THEN
      RETURN user_role IN ('super_admin', 'org_owner', 'org_admin', 'org_manager', 'org_user', 'org_viewer');
    WHEN 'org_user' THEN
      RETURN user_role IN ('super_admin', 'org_owner', 'org_admin', 'org_manager', 'org_user');
    WHEN 'org_manager' THEN
      RETURN user_role IN ('super_admin', 'org_owner', 'org_admin', 'org_manager');
    WHEN 'org_admin' THEN
      RETURN user_role IN ('super_admin', 'org_owner', 'org_admin');
    WHEN 'org_owner' THEN
      RETURN user_role IN ('super_admin', 'org_owner');
    WHEN 'super_admin' THEN
      RETURN user_role = 'super_admin';
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql;
```

## Application-Level Security

### Middleware Implementation
The application enforces security through multiple middleware layers:

1. **Authentication Middleware**: Verifies JWT tokens and sets user context
2. **Organization Context Middleware**: Sets current organization from request headers
3. **Permission Middleware**: Checks role-based permissions for specific endpoints
4. **Rate Limiting Middleware**: Prevents abuse and ensures fair usage

### Security Headers
```typescript
// Security headers applied to all responses
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

## Audit and Monitoring

### Activity Logging
All sensitive operations are logged to the `activity_logs` table:
- User authentication events
- Organization changes
- Permission modifications  
- Data access patterns
- API usage statistics

### Security Monitoring
- Failed authentication attempts
- Unusual access patterns
- Permission escalation attempts
- Data export activities

## Implementation Status

### ✅ Completed
- RLS policy design for all tables
- Role hierarchy definition
- Security function specifications
- Application middleware architecture

### 🔄 Next Steps
- Apply RLS policies to production database
- Implement security monitoring dashboard
- Set up automated security testing
- Create security incident response procedures

## Security Best Practices

1. **Principle of Least Privilege**: Users get minimum necessary permissions
2. **Defense in Depth**: Multiple security layers (DB, app, network)
3. **Regular Security Audits**: Periodic review of permissions and access patterns
4. **Incident Response**: Clear procedures for security breaches
5. **Data Encryption**: Sensitive data encrypted at rest and in transit