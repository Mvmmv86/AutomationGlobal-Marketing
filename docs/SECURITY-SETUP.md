# Security Setup Guide - Automation Global v4.0

## Overview
This guide covers the implementation of Row Level Security (RLS) and multi-tenant isolation for the Automation Global platform using Supabase PostgreSQL.

## Security Architecture

### 1. Row Level Security (RLS)
All database tables have RLS enabled to ensure data isolation between organizations:

```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### 2. Multi-Tenant Isolation
Data is isolated at the organization level using policies that check organization membership:

```sql
-- Example policy for organization isolation
CREATE POLICY "org_isolation" ON table_name
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );
```

### 3. Role-Based Access Control

#### Role Hierarchy (highest to lowest):
1. **super_admin** - Platform administrator with global access
2. **owner** - Organization owner with full organization control
3. **admin** - Organization administrator with management privileges
4. **manager** - Organization manager with limited admin functions
5. **editor** - Content editor with creation/edit permissions
6. **viewer** - Read-only access to organization data

### 4. Security Functions

#### User Role Checking
```sql
-- Check if user has specific role in organization
SELECT user_has_role_in_org(user_uuid, org_uuid, 'admin');

-- Check if user belongs to organization
SELECT user_belongs_to_org(user_uuid, org_uuid);

-- Check if user is super admin
SELECT is_super_admin(user_uuid);

-- Get all user's organizations and roles
SELECT * FROM get_user_organizations(user_uuid);
```

## Implementation Files

### Backend Files
- `server/database/security-policies.ts` - Main security manager class
- `server/database/rls-setup.sql` - Complete SQL script for RLS setup
- `server/routes.ts` - Security API endpoints

### Frontend Files
- `client/src/pages/security-test.tsx` - Security testing interface

## API Endpoints

### Apply Security Policies
```
POST /api/security/apply-policies
```
Applies all RLS policies to the database.

### Validate Security Policies
```
GET /api/security/validate
```
Validates that security policies are working correctly.

### Get Security Status
```
GET /api/security/status
```
Returns current security configuration status.

## Table-Specific Policies

### Core Tables
- **users** - Users can see their own profile and users in same organizations
- **organizations** - Users can access organizations they belong to
- **organization_members** - Organization-scoped access to membership data

### AI Services
- **ai_providers** - Super admin access only
- **ai_models** - Super admin access only
- **ai_usage_logs** - Organization-scoped usage tracking

### Module Tables
- **marketing_campaigns** - Organization-scoped marketing data
- **support_tickets** - Organization-scoped support data
- **trading_strategies** - Organization-scoped trading data

### Automation Tables
- **automations** - Organization-scoped automation workflows
- **automation_steps** - Inherit organization scope from parent automation
- **automation_executions** - Inherit organization scope from parent automation

### Integration Tables
- **integrations** - Organization-scoped third-party integrations
- **webhooks** - Admin-level access within organization
- **api_keys** - Organization-scoped API key management

### System Tables
- **activity_logs** - Organization-scoped audit trails
- **system_notifications** - Globally visible system messages

## Testing Security

### 1. Manual SQL Testing
Execute the SQL script in Supabase SQL Editor:
```sql
-- Copy and paste contents of server/database/rls-setup.sql
```

### 2. Application Testing
Visit `/security-test` in the application to:
- Apply security policies
- Validate policy functionality
- Check security status
- Run comprehensive security tests

### 3. Validation Queries
```sql
-- Check RLS status on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- Check all active policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public';
```

## Security Best Practices

### 1. Data Access
- Always authenticate users before data access
- Validate organization context for all operations
- Use role-based permissions for sensitive operations
- Log all data access for audit trails

### 2. API Security
- Implement rate limiting per user/organization
- Validate all input parameters
- Use HTTPS for all communications
- Implement proper error handling without data leakage

### 3. Database Security
- Use parameterized queries to prevent SQL injection
- Regularly audit and update security policies
- Monitor for unusual access patterns
- Implement backup and recovery procedures

## Troubleshooting

### Common Issues

#### RLS Not Working
1. Verify RLS is enabled on tables
2. Check policy syntax and logic
3. Ensure auth.uid() returns valid user ID
4. Verify organization membership exists

#### Access Denied Errors
1. Check user's organization membership
2. Verify user has required role
3. Confirm policy covers the specific operation
4. Check for expired or invalid sessions

#### Performance Issues
1. Add indexes on frequently queried columns
2. Optimize policy queries for better performance
3. Consider denormalizing for read-heavy operations
4. Monitor and analyze query execution plans

## Maintenance

### Regular Tasks
1. Review and update security policies quarterly
2. Audit user access and remove unused accounts
3. Monitor security logs for anomalies
4. Test backup and recovery procedures
5. Update documentation as policies change

### Security Monitoring
- Set up alerts for failed authentication attempts
- Monitor unusual data access patterns
- Track privilege escalation attempts
- Log all administrative actions

## Compliance
This security setup ensures compliance with:
- Multi-tenant data isolation requirements
- Role-based access control standards
- Audit trail maintenance
- Data protection regulations