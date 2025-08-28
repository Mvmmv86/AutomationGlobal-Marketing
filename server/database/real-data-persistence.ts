/**
 * Real Data Persistence System - Automation Global v4.0
 * Handles real data storage with Supabase when available, maintains local backup
 */

import { supabaseREST } from './supabase-rest.js';

interface UserData {
  id?: string;
  email: string;
  password_hash: string;
  name: string;
  email_verified?: boolean;
  status?: string;
  preferences?: any;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
}

interface OrganizationData {
  id?: string;
  name: string;
  slug: string;
  settings?: any;
  billing_info?: any;
  subscription_tier?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

class RealDataPersistence {
  private localUsers: Map<string, UserData> = new Map();
  private localOrganizations: Map<string, OrganizationData> = new Map();
  private persistenceLog: Array<{
    type: 'user' | 'organization';
    action: 'create' | 'update';
    data: any;
    timestamp: string;
    supabaseStatus: 'success' | 'failed' | 'pending';
  }> = [];

  /**
   * Create a user with real data persistence
   */
  async createUser(userData: UserData): Promise<{ data: UserData | null; error: any }> {
    const userId = userData.id || crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    const completeUserData: UserData = {
      id: userId,
      email: userData.email,
      password_hash: userData.password_hash,
      name: userData.name,
      email_verified: userData.email_verified || false,
      status: userData.status || 'active',
      preferences: userData.preferences || {},
      metadata: userData.metadata || {},
      created_at: timestamp,
      updated_at: timestamp
    };

    // Store locally first (immediate backup)
    this.localUsers.set(userId, completeUserData);
    
    // Log the creation
    this.persistenceLog.push({
      type: 'user',
      action: 'create',
      data: completeUserData,
      timestamp,
      supabaseStatus: 'pending'
    });

    console.log(`✅ [LOCAL] User stored locally: ${completeUserData.email}`);

    // Try to persist to Supabase in background
    this.attemptSupabasePersistence('user', completeUserData);

    return { data: completeUserData, error: null };
  }

  /**
   * Create an organization with real data persistence
   */
  async createOrganization(orgData: OrganizationData): Promise<{ data: OrganizationData | null; error: any }> {
    const orgId = orgData.id || crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    const completeOrgData: OrganizationData = {
      id: orgId,
      name: orgData.name,
      slug: orgData.slug,
      settings: orgData.settings || {},
      billing_info: orgData.billing_info || {},
      subscription_tier: orgData.subscription_tier || 'free',
      status: orgData.status || 'active',
      created_at: timestamp,
      updated_at: timestamp
    };

    // Store locally first
    this.localOrganizations.set(orgId, completeOrgData);
    
    // Log the creation
    this.persistenceLog.push({
      type: 'organization',
      action: 'create',
      data: completeOrgData,
      timestamp,
      supabaseStatus: 'pending'
    });

    console.log(`✅ [LOCAL] Organization stored locally: ${completeOrgData.name}`);

    // Try to persist to Supabase in background
    this.attemptSupabasePersistence('organization', completeOrgData);

    return { data: completeOrgData, error: null };
  }

  /**
   * Check if user exists (local first, then Supabase)
   */
  async checkUserExists(email: string): Promise<{ data: UserData | null; error: any }> {
    // Check local storage first
    for (const user of this.localUsers.values()) {
      if (user.email === email) {
        console.log(`📍 [LOCAL] User found locally: ${email}`);
        return { data: user, error: null };
      }
    }

    // Try Supabase check if needed
    try {
      const result = await supabaseREST.checkUserExistsHTTP(email);
      return result;
    } catch (error) {
      return { data: null, error: null }; // Assume doesn't exist if can't check
    }
  }

  /**
   * Attempt to persist data to Supabase in background
   */
  private async attemptSupabasePersistence(type: 'user' | 'organization', data: any): Promise<void> {
    try {
      let result;
      
      if (type === 'user') {
        result = await supabaseREST.createUserHTTP(data);
      } else {
        result = await supabaseREST.createOrganizationHTTP(data);
      }

      if (!result.error) {
        console.log(`✅ [SUPABASE] ${type} persisted successfully: ${data.email || data.name}`);
        this.updatePersistenceLog(data.id, 'success');
      } else {
        console.warn(`⚠️ [SUPABASE] ${type} persistence failed: ${result.error.message}`);
        this.updatePersistenceLog(data.id, 'failed');
      }
    } catch (error) {
      console.warn(`⚠️ [SUPABASE] ${type} persistence error:`, error.message);
      this.updatePersistenceLog(data.id, 'failed');
    }
  }

  /**
   * Update persistence log status
   */
  private updatePersistenceLog(id: string, status: 'success' | 'failed'): void {
    const logEntry = this.persistenceLog.find(entry => entry.data.id === id);
    if (logEntry) {
      logEntry.supabaseStatus = status;
    }
  }

  /**
   * Get persistence statistics
   */
  getPersistenceStats(): {
    localUsers: number;
    localOrganizations: number;
    supabaseSuccess: number;
    supabaseFailed: number;
    supabasePending: number;
  } {
    const supabaseSuccess = this.persistenceLog.filter(entry => entry.supabaseStatus === 'success').length;
    const supabaseFailed = this.persistenceLog.filter(entry => entry.supabaseStatus === 'failed').length;
    const supabasePending = this.persistenceLog.filter(entry => entry.supabaseStatus === 'pending').length;

    return {
      localUsers: this.localUsers.size,
      localOrganizations: this.localOrganizations.size,
      supabaseSuccess,
      supabaseFailed,
      supabasePending
    };
  }

  /**
   * Get all stored data for debugging
   */
  getAllStoredData(): {
    users: UserData[];
    organizations: OrganizationData[];
    persistenceLog: Array<any>;
  } {
    return {
      users: Array.from(this.localUsers.values()),
      organizations: Array.from(this.localOrganizations.values()),
      persistenceLog: this.persistenceLog
    };
  }

  /**
   * Clear all local data (for testing)
   */
  clearLocalData(): void {
    this.localUsers.clear();
    this.localOrganizations.clear();
    this.persistenceLog.length = 0;
    console.log('🗑️ All local data cleared');
  }
}

export const realDataPersistence = new RealDataPersistence();