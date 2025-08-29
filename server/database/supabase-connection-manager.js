// supabase/connectionManager.js
import { createClient } from '@supabase/supabase-js'

class SupabaseConnectionManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.retryAttempts = 0;
    this.maxRetries = 5;
    this.baseDelay = 1000; // 1 segundo
    this.maxDelay = 30000; // 30 segundos
    this.connectionPool = [];
    this.requestQueue = [];
    this.isProcessingQueue = false;
  }

  // Inicializar cliente com configurações otimizadas para Replit
  initialize() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Key são obrigatórios');
    }

    console.log('🔄 Inicializando Supabase Connection Manager...');

    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 2 // Reduzir eventos em tempo real
        }
      },
      global: {
        headers: {
          'Connection': 'keep-alive',
          'Keep-Alive': 'timeout=5, max=1000'
        }
      }
    });

    return this.client;
  }

  // Função de delay exponencial para retry
  calculateDelay(attempt) {
    const delay = Math.min(this.baseDelay * Math.pow(2, attempt), this.maxDelay);
    const jitter = Math.random() * 0.1 * delay; // 10% de jitter
    return delay + jitter;
  }

  // Wrapper para requisições com retry automático
  async executeWithRetry(operation, context = 'operação') {
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[Supabase] Tentativa ${attempt + 1} para ${context}`);
        
        const result = await Promise.race([
          operation(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 25000) // 25s timeout
          )
        ]);

        console.log(`[Supabase] ✅ Sucesso em ${context}`);
        this.retryAttempts = 0; // Reset counter on success
        return result;

      } catch (error) {
        console.error(`[Supabase] ❌ Erro na tentativa ${attempt + 1}:`, error.message);

        if (attempt === this.maxRetries) {
          throw new Error(`Falha após ${this.maxRetries + 1} tentativas: ${error.message}`);
        }

        // Verificar se é erro de rede/timeout para retry
        const shouldRetry = 
          error.message.includes('timeout') ||
          error.message.includes('network') ||
          error.message.includes('ECONNRESET') ||
          error.message.includes('fetch') ||
          error.code === 'PGRST301' ||
          error.status >= 500;

        if (!shouldRetry) {
          throw error; // Não retry para erros de validação, etc.
        }

        const delay = this.calculateDelay(attempt);
        console.log(`[Supabase] ⏳ Aguardando ${Math.round(delay)}ms antes da próxima tentativa...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Queue system para evitar muitas requisições simultâneas
  async addToQueue(operation, context) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        operation,
        context,
        resolve,
        reject
      });

      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      
      try {
        const result = await this.executeWithRetry(request.operation, request.context);
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }

      // Pequeno delay entre requisições para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    this.isProcessingQueue = false;
  }

  // Métodos específicos para operações comuns
  async createUser(userData) {
    if (!this.client) this.initialize();

    return this.addToQueue(async () => {
      const { data, error } = await this.client.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            ...userData.metadata
          }
        }
      });

      if (error) throw error;
      return data;
    }, `criar usuário ${userData.email}`);
  }

  async createOrganization(orgData) {
    if (!this.client) this.initialize();

    return this.addToQueue(async () => {
      const { data, error } = await this.client
        .from('organizations')
        .insert([orgData])
        .select();

      if (error) throw error;
      return data;
    }, `criar organização ${orgData.name}`);
  }

  async signIn(credentials) {
    if (!this.client) this.initialize();

    return this.addToQueue(async () => {
      const { data, error } = await this.client.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) throw error;
      return data;
    }, `login ${credentials.email}`);
  }

  async signOut() {
    if (!this.client) this.initialize();

    return this.executeWithRetry(async () => {
      const { error } = await this.client.auth.signOut();
      if (error) throw error;
      return true;
    }, 'logout');
  }

  // Verificar saúde da conexão
  async healthCheck() {
    if (!this.client) this.initialize();

    try {
      const { data, error } = await Promise.race([
        this.client.from('organizations').select('count', { count: 'exact', head: true }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), 5000)
        )
      ]);

      this.isConnected = !error;
      return !error;
    } catch (error) {
      console.error('[Supabase] Health check failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  // Reconectar se necessário
  async ensureConnection() {
    const isHealthy = await this.healthCheck();
    
    if (!isHealthy) {
      console.log('[Supabase] 🔄 Reconectando...');
      this.client = null;
      this.initialize();
    }
    
    return isHealthy;
  }

  // Obter cliente (com verificação de conexão)
  async getClient() {
    await this.ensureConnection();
    return this.client;
  }

  // Método otimizado para criar usuário via REST API (evitando auth complexa)
  async createUserDirect(userData) {
    if (!this.client) this.initialize();

    return this.addToQueue(async () => {
      const { data, error } = await this.client
        .from('users')
        .insert([{
          email: userData.email,
          password_hash: userData.password_hash,
          name: userData.name,
          email_verified: userData.email_verified || false,
          status: userData.status || 'active'
        }])
        .select();

      if (error) throw error;
      return data[0];
    }, `criar usuário direto ${userData.email}`);
  }

  // Método para criar membership
  async createMembership(membershipData) {
    if (!this.client) this.initialize();

    return this.addToQueue(async () => {
      const { data, error } = await this.client
        .from('organization_members')
        .insert([membershipData])
        .select();

      if (error) throw error;
      return data[0];
    }, `criar membership ${membershipData.user_id}`);
  }
}

// Singleton instance
const supabaseManager = new SupabaseConnectionManager();

export default supabaseManager;

// Helper functions para usar em toda a aplicação
export const createUserWithRetry = (userData) => supabaseManager.createUser(userData);
export const createUserDirectWithRetry = (userData) => supabaseManager.createUserDirect(userData);
export const createOrganizationWithRetry = (orgData) => supabaseManager.createOrganization(orgData);
export const createMembershipWithRetry = (membershipData) => supabaseManager.createMembership(membershipData);
export const signInWithRetry = (credentials) => supabaseManager.signIn(credentials);
export const signOutWithRetry = () => supabaseManager.signOut();
export const getSupabaseClient = () => supabaseManager.getClient();
export const healthCheckSupabase = () => supabaseManager.healthCheck();