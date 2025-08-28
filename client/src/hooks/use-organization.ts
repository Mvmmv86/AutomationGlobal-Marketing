import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationApi, type Organization, type OrganizationStats, type DashboardData } from '@/lib/api';
import { useAuth } from './use-auth';

export function useOrganization(organizationId?: string) {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['/api/organizations', organizationId],
    queryFn: () => organizationApi.get(organizationId!),
    enabled: isAuthenticated && !!organizationId,
    retry: false,
  });
}

export function useOrganizationStats(organizationId?: string) {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['/api/organizations', organizationId, 'stats'],
    queryFn: () => organizationApi.getStats(organizationId!),
    enabled: isAuthenticated && !!organizationId,
    retry: false,
    refetchInterval: 30000, // Refetch every 30 seconds for live stats
  });
}

export function useOrganizationQuotas(organizationId?: string) {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['/api/organizations', organizationId, 'quotas'],
    queryFn: () => organizationApi.getQuotas(organizationId!),
    enabled: isAuthenticated && !!organizationId,
    retry: false,
    refetchInterval: 60000, // Refetch every minute for quota updates
  });
}

export function useDashboardData(organizationId?: string) {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['/api/organizations', organizationId, 'dashboard'],
    queryFn: () => organizationApi.getDashboard(organizationId!),
    enabled: isAuthenticated && !!organizationId,
    retry: false,
    refetchInterval: 15000, // Refetch every 15 seconds for dashboard updates
  });
}

export function useUpdateOrganization(organizationId?: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Organization>) => 
      organizationApi.update(organizationId!, data),
    onSuccess: () => {
      // Invalidate organization-related queries
      queryClient.invalidateQueries({ 
        queryKey: ['/api/organizations', organizationId] 
      });
    },
    onError: (error) => {
      console.error('Failed to update organization:', error);
    },
  });
}

// Hook for organization context (current active organization)
export function useCurrentOrganization() {
  const { user } = useAuth();
  
  // TODO: Get current organization from user context or local storage
  // For now, we'll return mock organization data
  const mockOrganizationId = 'org_123'; // This should come from auth context
  
  const { data: organization, isLoading, error } = useOrganization(mockOrganizationId);
  const { data: stats, isLoading: statsLoading } = useOrganizationStats(mockOrganizationId);
  const { data: quotas, isLoading: quotasLoading } = useOrganizationQuotas(mockOrganizationId);
  const { data: dashboardData, isLoading: dashboardLoading } = useDashboardData(mockOrganizationId);
  
  return {
    organization: organization?.organization,
    stats: stats?.stats,
    quotas: quotas?.quotas,
    dashboardData,
    isLoading: isLoading || statsLoading || quotasLoading || dashboardLoading,
    error,
    organizationId: mockOrganizationId,
  };
}

// Hook for switching organization context
export function useOrganizationSwitcher() {
  const { switchOrganization, isSwitchingOrg } = useAuth();
  const queryClient = useQueryClient();
  
  const switchToOrganization = async (organizationId: string) => {
    try {
      await switchOrganization(organizationId);
      
      // Clear all organization-specific cache
      queryClient.removeQueries({ 
        queryKey: ['/api/organizations'] 
      });
      
      // Refetch dashboard data for new organization
      queryClient.invalidateQueries({ 
        queryKey: ['/api/organizations', organizationId, 'dashboard'] 
      });
      
      return true;
    } catch (error) {
      console.error('Failed to switch organization:', error);
      return false;
    }
  };
  
  return {
    switchToOrganization,
    isSwitching: isSwitchingOrg,
  };
}

// Hook for organization permissions
export function useOrganizationPermissions(organizationId?: string) {
  const { user } = useAuth();
  
  // TODO: Implement proper permission checking based on user role in organization
  // This would query the organization_users table to get the user's role
  
  const getUserRole = () => {
    // Mock implementation - in real app, this would come from the organization membership
    return 'org_admin'; // 'super_admin', 'org_owner', 'org_admin', 'org_manager', 'org_user', 'org_viewer'
  };
  
  const hasPermission = (resource: string, action: string) => {
    const role = getUserRole();
    
    // Role-based permissions (simplified)
    const rolePermissions: Record<string, string[]> = {
      'super_admin': ['*'],
      'org_owner': ['*'],
      'org_admin': [
        'users.create', 'users.read', 'users.update', 'users.delete',
        'modules.read', 'modules.update',
        'automations.create', 'automations.read', 'automations.update', 'automations.delete',
        'integrations.create', 'integrations.read', 'integrations.update', 'integrations.delete',
        'analytics.read', 'billing.read'
      ],
      'org_manager': [
        'users.read', 'users.update',
        'modules.read', 'modules.update',
        'automations.create', 'automations.read', 'automations.update',
        'integrations.read', 'integrations.update',
        'analytics.read'
      ],
      'org_user': [
        'automations.create', 'automations.read', 'automations.update',
        'integrations.read',
        'analytics.read'
      ],
      'org_viewer': [
        'automations.read',
        'integrations.read',
        'analytics.read'
      ]
    };
    
    const permissions = rolePermissions[role] || [];
    const requiredPermission = `${resource}.${action}`;
    
    return permissions.includes('*') || permissions.includes(requiredPermission);
  };
  
  return {
    role: getUserRole(),
    hasPermission,
    canManageUsers: hasPermission('users', 'create'),
    canManageAutomations: hasPermission('automations', 'create'),
    canManageIntegrations: hasPermission('integrations', 'create'),
    canViewBilling: hasPermission('billing', 'read'),
    canManageSettings: hasPermission('organization', 'update'),
  };
}
