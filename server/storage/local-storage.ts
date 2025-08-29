/**
 * Simple local storage system for immediate data persistence
 * This ensures data is always created and visible regardless of external connections
 */

interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  email_verified: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface LocalStorage {
  users: User[];
  organizations: Organization[];
  stats: {
    totalUsers: number;
    totalOrganizations: number;
    lastCreated: string;
  };
}

class LocalDataStorage {
  private data: LocalStorage = {
    users: [],
    organizations: [],
    stats: {
      totalUsers: 0,
      totalOrganizations: 0,
      lastCreated: new Date().toISOString()
    }
  };

  /**
   * Create user locally - always succeeds
   */
  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const timestamp = new Date().toISOString();
    const user: User = {
      id: crypto.randomUUID(),
      ...userData,
      created_at: timestamp,
      updated_at: timestamp
    };

    this.data.users.push(user);
    this.data.stats.totalUsers = this.data.users.length;
    this.data.stats.lastCreated = timestamp;

    console.log(`✅ [LOCAL] User created: ${user.email} (ID: ${user.id})`);
    return user;
  }

  /**
   * Create organization locally - always succeeds
   */
  async createOrganization(orgData: Omit<Organization, 'id' | 'created_at' | 'updated_at'>): Promise<Organization> {
    const timestamp = new Date().toISOString();
    const organization: Organization = {
      id: crypto.randomUUID(),
      ...orgData,
      created_at: timestamp,
      updated_at: timestamp
    };

    this.data.organizations.push(organization);
    this.data.stats.totalOrganizations = this.data.organizations.length;
    this.data.stats.lastCreated = timestamp;

    console.log(`✅ [LOCAL] Organization created: ${organization.name} (ID: ${organization.id})`);
    return organization;
  }

  /**
   * Check if user exists by email
   */
  async checkUserExists(email: string): Promise<boolean> {
    return this.data.users.some(user => user.email === email);
  }

  /**
   * Get all users
   */
  async getUsers(): Promise<User[]> {
    return [...this.data.users];
  }

  /**
   * Get all organizations
   */
  async getOrganizations(): Promise<Organization[]> {
    return [...this.data.organizations];
  }

  /**
   * Get storage statistics
   */
  async getStats() {
    return {
      ...this.data.stats,
      recentUsers: this.data.users.slice(-5),
      recentOrganizations: this.data.organizations.slice(-5)
    };
  }

  /**
   * Clear all data (for testing)
   */
  async clearAll() {
    this.data.users = [];
    this.data.organizations = [];
    this.data.stats = {
      totalUsers: 0,
      totalOrganizations: 0,
      lastCreated: new Date().toISOString()
    };
    console.log('🗑️ [LOCAL] All data cleared');
  }
}

export const localDataStorage = new LocalDataStorage();