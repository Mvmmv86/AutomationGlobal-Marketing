// server/services/permission-service.ts
export interface Permission {
  action: string;
  resource: string;
  conditions?: Record<string, any>;
}

export interface RoleDefinition {
  role: string;
  permissions: Permission[];
  inherits?: string[];
}

// Define a hierarquia completa de roles e suas permissões
export const ROLE_DEFINITIONS: Record<string, RoleDefinition> = {
  // Super Admin - Acesso total ao sistema
  super_admin: {
    role: 'super_admin',
    permissions: [
      { action: '*', resource: '*' }, // Acesso total
    ]
  },

  // Organization Owner - Dono da organização
  org_owner: {
    role: 'org_owner',
    permissions: [
      { action: '*', resource: 'organization' },
      { action: '*', resource: 'users' },
      { action: '*', resource: 'billing' },
      { action: '*', resource: 'settings' },
      { action: '*', resource: 'ai' },
      { action: '*', resource: 'modules' },
      { action: '*', resource: 'automations' },
      { action: '*', resource: 'integrations' },
      { action: 'read', resource: 'analytics' },
      { action: 'read', resource: 'logs' }
    ]
  },

  // Organization Admin - Administrador da organização
  org_admin: {
    role: 'org_admin',
    permissions: [
      { action: 'read', resource: 'organization' },
      { action: 'update', resource: 'organization' },
      { action: '*', resource: 'users' },
      { action: 'read', resource: 'billing' },
      { action: '*', resource: 'settings' },
      { action: '*', resource: 'ai' },
      { action: '*', resource: 'modules' },
      { action: '*', resource: 'automations' },
      { action: '*', resource: 'integrations' },
      { action: 'read', resource: 'analytics' }
    ]
  },

  // Organization Manager - Gerente da organização
  org_manager: {
    role: 'org_manager',
    permissions: [
      { action: 'read', resource: 'organization' },
      { action: 'read', resource: 'users' },
      { action: 'create', resource: 'users', conditions: { role: 'org_user' } },
      { action: 'update', resource: 'users', conditions: { role: 'org_user' } },
      { action: 'read', resource: 'settings' },
      { action: 'update', resource: 'settings', conditions: { scope: 'module' } },
      { action: '*', resource: 'ai' },
      { action: '*', resource: 'modules' },
      { action: '*', resource: 'automations' },
      { action: 'read', resource: 'integrations' },
      { action: 'create', resource: 'integrations' },
      { action: 'read', resource: 'analytics' }
    ]
  },

  // Organization User - Usuário comum
  org_user: {
    role: 'org_user',
    permissions: [
      { action: 'read', resource: 'organization' },
      { action: 'read', resource: 'users' },
      { action: 'update', resource: 'users', conditions: { self: true } },
      { action: 'read', resource: 'settings' },
      { action: 'use', resource: 'ai' },
      { action: 'read', resource: 'modules' },
      { action: 'use', resource: 'modules' },
      { action: 'create', resource: 'automations' },
      { action: 'read', resource: 'automations', conditions: { owner: true } },
      { action: 'update', resource: 'automations', conditions: { owner: true } },
      { action: 'delete', resource: 'automations', conditions: { owner: true } },
      { action: 'read', resource: 'integrations' }
    ]
  },

  // Organization Viewer - Apenas visualização
  org_viewer: {
    role: 'org_viewer',
    permissions: [
      { action: 'read', resource: 'organization' },
      { action: 'read', resource: 'users' },
      { action: 'update', resource: 'users', conditions: { self: true } },
      { action: 'read', resource: 'settings' },
      { action: 'read', resource: 'modules' },
      { action: 'read', resource: 'automations', conditions: { public: true } },
      { action: 'read', resource: 'integrations' }
    ]
  }
};

export class PermissionService {
  
  /**
   * Verifica se um usuário tem permissão para realizar uma ação
   */
  static hasPermission(
    userRole: string,
    action: string,
    resource: string,
    context?: Record<string, any>
  ): boolean {
    const roleDefinition = ROLE_DEFINITIONS[userRole];
    if (!roleDefinition) {
      console.warn(`⚠️ Unknown role: ${userRole}`);
      return false;
    }

    // Super admin sempre tem acesso
    if (userRole === 'super_admin') {
      return true;
    }

    // Verificar permissões específicas
    for (const permission of roleDefinition.permissions) {
      if (this.matchesPermission(permission, action, resource, context)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Verifica se uma permissão específica permite a ação
   */
  private static matchesPermission(
    permission: Permission,
    action: string,
    resource: string,
    context?: Record<string, any>
  ): boolean {
    // Verificar ação
    const actionMatches = permission.action === '*' || permission.action === action;
    if (!actionMatches) return false;

    // Verificar recurso
    const resourceMatches = permission.resource === '*' || permission.resource === resource;
    if (!resourceMatches) return false;

    // Verificar condições se existirem
    if (permission.conditions && context) {
      for (const [key, value] of Object.entries(permission.conditions)) {
        if (context[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Obtém todas as permissões de um role
   */
  static getRolePermissions(role: string): Permission[] {
    const roleDefinition = ROLE_DEFINITIONS[role];
    if (!roleDefinition) {
      return [];
    }

    return roleDefinition.permissions;
  }

  /**
   * Verifica se um role pode executar ações administrativas
   */
  static isAdminRole(role: string): boolean {
    return ['super_admin', 'org_owner', 'org_admin'].includes(role);
  }

  /**
   * Verifica se um role pode gerenciar usuários
   */
  static canManageUsers(role: string): boolean {
    return ['super_admin', 'org_owner', 'org_admin', 'org_manager'].includes(role);
  }

  /**
   * Verifica se um role pode acessar billing
   */
  static canAccessBilling(role: string): boolean {
    return ['super_admin', 'org_owner'].includes(role);
  }

  /**
   * Obtém a lista de roles hierárquica
   */
  static getRoleHierarchy(): string[] {
    return [
      'super_admin',
      'org_owner', 
      'org_admin',
      'org_manager',
      'org_user',
      'org_viewer'
    ];
  }

  /**
   * Verifica se roleA tem mais privilégios que roleB
   */
  static isRoleHigher(roleA: string, roleB: string): boolean {
    const hierarchy = this.getRoleHierarchy();
    const indexA = hierarchy.indexOf(roleA);
    const indexB = hierarchy.indexOf(roleB);
    
    return indexA !== -1 && indexB !== -1 && indexA < indexB;
  }

  /**
   * Expande permissões para formato de verificação rápida
   */
  static expandPermissionsForRole(role: string): Record<string, boolean> {
    const permissions = this.getRolePermissions(role);
    const expanded: Record<string, boolean> = {};

    for (const permission of permissions) {
      const key = `${permission.action}:${permission.resource}`;
      expanded[key] = true;
      
      // Para ações wildcard, adicionar ações específicas comuns
      if (permission.action === '*') {
        ['create', 'read', 'update', 'delete', 'use'].forEach(action => {
          expanded[`${action}:${permission.resource}`] = true;
        });
      }

      // Para recursos wildcard, adicionar recursos específicos comuns
      if (permission.resource === '*') {
        ['organization', 'users', 'settings', 'ai', 'modules', 'automations'].forEach(resource => {
          expanded[`${permission.action}:${resource}`] = true;
        });
      }
    }

    return expanded;
  }

  /**
   * Gera um resumo das capacidades do role
   */
  static getRoleCapabilities(role: string): {
    canManageOrg: boolean;
    canManageUsers: boolean;
    canAccessBilling: boolean;
    canUseAI: boolean;
    canCreateAutomations: boolean;
    canViewAnalytics: boolean;
    level: 'admin' | 'manager' | 'user' | 'viewer';
  } {
    return {
      canManageOrg: this.hasPermission(role, 'update', 'organization'),
      canManageUsers: this.canManageUsers(role),
      canAccessBilling: this.canAccessBilling(role),
      canUseAI: this.hasPermission(role, 'use', 'ai'),
      canCreateAutomations: this.hasPermission(role, 'create', 'automations'),
      canViewAnalytics: this.hasPermission(role, 'read', 'analytics'),
      level: this.isAdminRole(role) ? 'admin' : 
             this.canManageUsers(role) ? 'manager' :
             role === 'org_user' ? 'user' : 'viewer'
    };
  }
}

// Export das constantes para uso em outros módulos
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin' as const,
  ORG_OWNER: 'org_owner' as const,
  ORG_ADMIN: 'org_admin' as const,
  ORG_MANAGER: 'org_manager' as const,
  ORG_USER: 'org_user' as const,
  ORG_VIEWER: 'org_viewer' as const
};

export const ACTIONS = {
  CREATE: 'create' as const,
  READ: 'read' as const,
  UPDATE: 'update' as const,
  DELETE: 'delete' as const,
  USE: 'use' as const,
  ALL: '*' as const
};

export const RESOURCES = {
  ORGANIZATION: 'organization' as const,
  USERS: 'users' as const,
  BILLING: 'billing' as const,
  SETTINGS: 'settings' as const,
  AI: 'ai' as const,
  MODULES: 'modules' as const,
  AUTOMATIONS: 'automations' as const,
  INTEGRATIONS: 'integrations' as const,
  ANALYTICS: 'analytics' as const,
  LOGS: 'logs' as const,
  ALL: '*' as const
};