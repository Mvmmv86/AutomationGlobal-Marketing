import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, userApi, type AuthResponse, type UserProfile } from '@/lib/api';

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true,
  });

  // Load token from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      setAuthState(prev => ({ ...prev, token, isAuthenticated: true, loading: false }));
    } else {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Fetch user profile when authenticated
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['/api/user/profile'],
    enabled: authState.isAuthenticated && !!authState.token,
    retry: false,
  });

  // Update user in auth state when profile loads
  useEffect(() => {
    if (userProfile?.user) {
      setAuthState(prev => ({ ...prev, user: userProfile.user }));
    }
  }, [userProfile]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (response: AuthResponse) => {
      const { user, tokens } = response;
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      
      setAuthState({
        isAuthenticated: true,
        user,
        token: tokens.accessToken,
        loading: false,
      });

      // Invalidate queries to refetch with new auth context
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      console.error('Login failed:', error);
      logout();
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (response: AuthResponse) => {
      const { user, tokens } = response;
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      
      setAuthState({
        isAuthenticated: true,
        user,
        token: tokens.accessToken,
        loading: false,
      });

      queryClient.invalidateQueries();
    },
    onError: (error) => {
      console.error('Registration failed:', error);
    },
  });

  // Switch organization mutation
  const switchOrganizationMutation = useMutation({
    mutationFn: authApi.switchOrganization,
    onSuccess: (response: { tokens: AuthResponse['tokens'] }) => {
      const { tokens } = response;
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      
      setAuthState(prev => ({
        ...prev,
        token: tokens.accessToken,
      }));

      // Invalidate all queries to refetch with new organization context
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      console.error('Organization switch failed:', error);
    },
  });

  // Logout function
  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
    });

    // Clear all cached data
    queryClient.clear();
  };

  // Refresh token function
  const refreshToken = async () => {
    try {
      const refreshTokenValue = localStorage.getItem('refreshToken');
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }

      const response = await authApi.refresh(refreshTokenValue);
      const { tokens } = response;
      
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      
      setAuthState(prev => ({
        ...prev,
        token: tokens.accessToken,
      }));

      return tokens.accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      throw error;
    }
  };

  return {
    // Auth state
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    token: authState.token,
    loading: authState.loading || profileLoading,

    // Auth actions
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    switchOrganization: switchOrganizationMutation.mutate,
    refreshToken,

    // Mutation states
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isSwitchingOrg: switchOrganizationMutation.isPending,
    
    // Errors
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    switchOrgError: switchOrganizationMutation.error,
  };
}

// Hook for getting current user organizations
export function useUserOrganizations() {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['/api/user/organizations'],
    enabled: isAuthenticated,
    retry: false,
  });
}

// Hook for checking if user has specific permission
export function usePermission(resource: string, action: string) {
  const { user, isAuthenticated } = useAuth();
  
  // TODO: Implement proper permission checking based on user role
  // For now, return true if authenticated
  return {
    hasPermission: isAuthenticated,
    loading: false,
  };
}
