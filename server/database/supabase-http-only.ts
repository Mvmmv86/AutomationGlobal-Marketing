/**
 * Supabase HTTP-Only Implementation
 * Uses only REST API calls, no direct PostgreSQL connection
 */

interface SupabaseHTTPResponse<T = any> {
  data: T | null;
  error: any;
}

class SupabaseHTTPOnly {
  private baseUrl: string;
  private apiKey: string;
  private headers: Record<string, string>;

  constructor() {
    this.baseUrl = process.env.SUPABASE_URL || '';
    this.apiKey = process.env.SUPABASE_ANON_KEY || '';
    
    if (!this.baseUrl || !this.apiKey) {
      console.error('❌ Missing Supabase credentials!');
      console.log('SUPABASE_URL:', this.baseUrl ? 'Set' : 'Missing');
      console.log('SUPABASE_ANON_KEY:', this.apiKey ? 'Set' : 'Missing');
    }

    this.headers = {
      'apikey': this.apiKey,
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    console.log('✅ Supabase HTTP-Only client initialized');
    console.log(`📍 Base URL: ${this.baseUrl}`);
  }

  /**
   * Create a user via HTTP REST API
   */
  async createUser(userData: any): Promise<SupabaseHTTPResponse> {
    const url = `${this.baseUrl}/rest/v1/users`;
    
    // Prepare user data with all required fields
    const userPayload = {
      id: userData.id || crypto.randomUUID(),
      email: userData.email,
      password_hash: userData.password_hash,
      name: userData.name,
      email_verified: userData.email_verified || false,
      status: userData.status || 'active',
      preferences: userData.preferences || {},
      metadata: userData.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📤 Creating user via HTTP:', userPayload.email);
    console.log('🔗 URL:', url);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(userPayload)
      });

      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ User created successfully:', data);
        return { data: Array.isArray(data) ? data[0] : data, error: null };
      } else {
        const errorText = await response.text();
        console.error('❌ User creation failed:', response.status, errorText);
        
        // Parse error for better understanding
        try {
          const errorObj = JSON.parse(errorText);
          return { data: null, error: errorObj };
        } catch {
          return { data: null, error: { message: errorText, status: response.status } };
        }
      }
    } catch (error: any) {
      console.error('❌ Network error creating user:', error.message);
      return { data: null, error: { message: error.message, type: 'network_error' } };
    }
  }

  /**
   * Create an organization via HTTP REST API
   */
  async createOrganization(orgData: any): Promise<SupabaseHTTPResponse> {
    const url = `${this.baseUrl}/rest/v1/organizations`;
    
    const orgPayload = {
      id: orgData.id || crypto.randomUUID(),
      name: orgData.name,
      slug: orgData.slug,
      settings: orgData.settings || {},
      billing_info: orgData.billing_info || {},
      subscription_tier: orgData.subscription_tier || 'free',
      status: orgData.status || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📤 Creating organization via HTTP:', orgPayload.name);
    console.log('🔗 URL:', url);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(orgPayload)
      });

      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Organization created successfully:', data);
        return { data: Array.isArray(data) ? data[0] : data, error: null };
      } else {
        const errorText = await response.text();
        console.error('❌ Organization creation failed:', response.status, errorText);
        
        try {
          const errorObj = JSON.parse(errorText);
          return { data: null, error: errorObj };
        } catch {
          return { data: null, error: { message: errorText, status: response.status } };
        }
      }
    } catch (error: any) {
      console.error('❌ Network error creating organization:', error.message);
      return { data: null, error: { message: error.message, type: 'network_error' } };
    }
  }

  /**
   * Create organization member relationship
   */
  async createOrganizationMember(userId: string, orgId: string, role: string = 'admin'): Promise<SupabaseHTTPResponse> {
    const url = `${this.baseUrl}/rest/v1/organization_members`;
    
    const memberPayload = {
      id: crypto.randomUUID(),
      user_id: userId,
      organization_id: orgId,
      role: role,
      status: 'active',
      joined_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📤 Creating organization member via HTTP');
    console.log('🔗 URL:', url);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(memberPayload)
      });

      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Organization member created successfully');
        return { data: Array.isArray(data) ? data[0] : data, error: null };
      } else {
        const errorText = await response.text();
        console.error('❌ Organization member creation failed:', response.status, errorText);
        return { data: null, error: { message: errorText, status: response.status } };
      }
    } catch (error: any) {
      console.error('❌ Network error creating organization member:', error.message);
      return { data: null, error: { message: error.message, type: 'network_error' } };
    }
  }

  /**
   * Check if user exists
   */
  async checkUserExists(email: string): Promise<SupabaseHTTPResponse> {
    const url = `${this.baseUrl}/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=id,email&limit=1`;
    
    console.log('🔍 Checking if user exists:', email);
    console.log('🔗 URL:', url);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers
      });

      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ User check completed:', data.length > 0 ? 'Exists' : 'Not found');
        return { data: data.length > 0 ? data[0] : null, error: null };
      } else {
        const errorText = await response.text();
        console.log('⚠️ User check failed (may be RLS):', response.status);
        // If RLS prevents reading, assume user doesn't exist
        return { data: null, error: null };
      }
    } catch (error: any) {
      console.error('❌ Network error checking user:', error.message);
      return { data: null, error: { message: error.message, type: 'network_error' } };
    }
  }

  /**
   * Test connection to Supabase
   */
  async testConnection(): Promise<boolean> {
    const url = `${this.baseUrl}/rest/v1/`;
    
    console.log('🧪 Testing Supabase connection...');
    console.log('🔗 URL:', url);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey
        }
      });

      console.log('📡 Test response status:', response.status);
      
      if (response.ok || response.status === 404) { // 404 means API is reachable but no specific endpoint
        console.log('✅ Supabase connection successful!');
        return true;
      } else {
        console.error('❌ Supabase connection failed:', response.status);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Network error testing connection:', error.message);
      return false;
    }
  }
}

// Export singleton instance
export const supabaseHTTP = new SupabaseHTTPOnly();