import { apiRequest } from "./queryClient";

// Auth API
export const authApi = {
  register: (data: { email: string; username: string; password: string; firstName?: string; lastName?: string; organizationName?: string }) =>
    apiRequest('POST', '/api/auth/register', data),
  
  login: (data: { email: string; password: string; organizationId?: string }) =>
    apiRequest('POST', '/api/auth/login', data),
  
  refresh: (refreshToken: string) =>
    apiRequest('POST', '/api/auth/refresh', { refreshToken }),
  
  switchOrganization: (organizationId: string) =>
    apiRequest('POST', '/api/auth/switch-organization', { organizationId }),
};

// User API
export const userApi = {
  getProfile: () =>
    apiRequest('GET', '/api/user/profile'),
  
  getOrganizations: () =>
    apiRequest('GET', '/api/user/organizations'),
};

// Organization API
export const organizationApi = {
  get: (organizationId: string) =>
    apiRequest('GET', `/api/organizations/${organizationId}`),
  
  update: (organizationId: string, data: any) =>
    apiRequest('PUT', `/api/organizations/${organizationId}`, data),
  
  getStats: (organizationId: string) =>
    apiRequest('GET', `/api/organizations/${organizationId}/stats`),
  
  getQuotas: (organizationId: string) =>
    apiRequest('GET', `/api/organizations/${organizationId}/quotas`),
  
  getDashboard: (organizationId: string) =>
    apiRequest('GET', `/api/organizations/${organizationId}/dashboard`),
};

// AI API
export const aiApi = {
  getProviders: () =>
    apiRequest('GET', '/api/ai/providers'),
  
  generate: (organizationId: string, data: {
    prompt: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  }) =>
    apiRequest('POST', `/api/organizations/${organizationId}/ai/generate`, data),
  
  getUsage: (organizationId: string, period: 'today' | 'week' | 'month' = 'today') =>
    apiRequest('GET', `/api/organizations/${organizationId}/ai/usage?period=${period}`),
};

// Health API
export const healthApi = {
  check: () =>
    apiRequest('GET', '/api/health'),
};

// Type definitions for API responses
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  emailVerified: boolean;
  lastLoginAt?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logo?: string;
  description?: string;
  type: 'marketing' | 'support' | 'trading';
  subscriptionPlan: 'starter' | 'professional' | 'enterprise';
  settings: any;
  isActive: boolean;
}

export interface OrganizationStats {
  totalUsers: number;
  totalAutomations: number;
  totalAiRequests: number;
  totalCost: number;
  activeModules: number;
}

export interface AiUsageStats {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
}

export interface DashboardData {
  organization: Organization;
  stats: OrganizationStats;
  aiUsage: AiUsageStats;
  quotas: {
    users: { current: number; limit: number; withinLimit: boolean };
    aiRequests: { current: number; limit: number; withinLimit: boolean };
    modules: { current: number; limit: number; withinLimit: boolean };
  };
  modules: {
    marketing: {
      status: string;
      efficiency: number;
      metrics: { [key: string]: number };
    };
    support: {
      status: string;
      efficiency: number;
      metrics: { [key: string]: number };
    };
    trading: {
      status: string;
      efficiency: number;
      metrics: { [key: string]: number };
    };
  };
  recentAutomations: Array<{
    id: string;
    name: string;
    module: string;
    status: string;
    startedAt?: string;
    completedAt?: string;
    processed: number;
  }>;
  systemStatus: {
    api: { status: string; uptime?: number };
    database: { status: string };
    ai: { status: string };
    queue: { status: string };
  };
}

export interface ApiError {
  message: string;
  error?: string;
  status?: number;
}
