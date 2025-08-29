// server/database/supabase-connection-manager.js
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

    // Configurações específicas para Replit
    this.REPLIT_CONFIG = {
      CONNECT_TIMEOUT: 30000,
      REQUEST_TIMEOUT: 25000,
      RETRY_ATTEMPTS: 5,
      RETRY_DELAY: 2000,
      MAX_CONNECTIONS: 3,
      CONNECTION_IDLE_TIME: 10000,
      KEEP_ALIVE: false,
      DISABLE_CACHE: true
    };
  }

  // Inicializar cliente com configurações otimizadas para Replit
  initialize() {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('❌ Supabase URL e Key são obrigatórios');
    }

    console.log('🔧 Inicializando Supabase com configurações otimizadas para Replit...');

    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // Desabilitar para evitar problemas no Replit
        storageKey: 'supabase-auth'
      },
      
      // Configurações globais de fetch otimizadas para Replit
      global: {
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal', // Reduzir payload
          'Accept': 'application/json',
          'Cache-Control': 'no-cache', // Evitar cache no Replit
          'Connection': 'close', // Não usar keep-alive no Replit
        },
        
        // Fetch customizado com retry para Replit
        fetch: this.createReplitOptimizedFetch()
      },
      
      // Realtime desabilitado para reduzir conexões
      realtime: {
        params: {
          eventsPerSecond: 1
        }
      },
      
      // Configurações do PostgREST
      db: {
        schema: 'public'
      }
    });

    console.log('✅ Supabase inicializado com sucesso para Replit');
    return this.client;
  }

  // Fetch customizado com retry e timeouts para Replit
  createReplitOptimizedFetch() {
    return async (url, options = {}) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`⏰ Timeout na requisição para: ${url}`);
        controller.abort();
      }, this.REPLIT_CONFIG.REQUEST_TIMEOUT);

      // Configurações específicas para Replit
      const fetchOptions = {
        ...options,
        signal: controller.signal,
        
        // Headers otimizados para Replit
        headers: {
          ...options.headers,
          'Connection': 'close', // Crucial para Replit
          'User-Agent': 'Replit-App/1.0',
          'Keep-Alive': 'timeout=5, max=1000',
        },

        // Configurações de rede
        keepalive: false, // Desabilitar keep-alive
        cache: 'no-store' // Forçar sem cache
      };

      let lastError;
      
      // Retry com backoff exponencial
      for (let attempt = 1; attempt <= this.REPLIT_CONFIG.RETRY_ATTEMPTS; attempt++) {
        try {
          console.log(`🔄 [Tentativa ${attempt}/${this.REPLIT_CONFIG.RETRY_ATTEMPTS}] ${url.split('/').pop()}`);
          
          const response = await fetch(url, fetchOptions);
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          console.log(`✅ Sucesso na tentativa ${attempt}`);
          return response;
          
        } catch (error) {
          lastError = error;
          console.warn(`⚠️ Falha na tentativa ${attempt}: ${error.message}`);
          
          clearTimeout(timeoutId);
          
          if (attempt < this.REPLIT_CONFIG.RETRY_ATTEMPTS) {
            const delay = this.REPLIT_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);
            console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
            await this.sleep(delay);
            
            // Recriar controller para próxima tentativa
            const newController = new AbortController();
            fetchOptions.signal = newController.signal;
            setTimeout(() => newController.abort(), this.REPLIT_CONFIG.REQUEST_TIMEOUT);
          }
        }
      }
      
      throw new Error(`Falha após ${this.REPLIT_CONFIG.RETRY_ATTEMPTS} tentativas: ${lastError.message}`);
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Função de delay exponencial para retry
  calculateDelay(attempt) {
    const delay = Math.min(this.baseDelay * Math.pow(2, attempt), this.maxDelay);
    const jitter = Math.random() * 0.1 * delay; // 10% de jitter
    return delay + jitter;
  }

  // Wrapper para requisições com retry automático
  async executeWithRetry(operation, context = 'operação') {
    if (!this.client) this.initialize();

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🚀 [${context}] Tentativa ${attempt + 1}`);
        
        const result = await Promise.race([
          operation(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout da operação')), this.REPLIT_CONFIG.REQUEST_TIMEOUT)
          )
        ]);

        console.log(`✅ [${context}] Concluído com sucesso`);
        this.retryAttempts = 0; // Reset counter on success
        return result;

      } catch (error) {
        console.error(`❌ [${context}] Erro na tentativa ${attempt + 1}:`, error.message);

        if (attempt === this.maxRetries) {
          throw new Error(`[${context}] Falha após ${this.maxRetries + 1} tentativas: ${error.message}`);
        }

        // Verificar se é erro de rede/timeout para retry
        const shouldRetry = 
          error.message.includes('timeout') ||
          error.message.includes('network') ||
          error.message.includes('ECONNRESET') ||
          error.message.includes('fetch') ||
          error.message.includes('ECONNREFUSED') ||
          error.code === 'PGRST301' ||
          error.status >= 500;

        if (!shouldRetry) {
          throw error; // Não retry para erros de validação, etc.
        }

        const delay = this.calculateDelay(attempt);
        console.log(`⏳ [${context}] Aguardando ${Math.round(delay)}ms antes da próxima tentativa...`);
        
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
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    this.isProcessingQueue = false;
  }

  // **LINHA 145** - Criação de usuário otimizada
  async createUser(userData) {
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

  // **LINHA 165** - Criação de organização otimizada
  async createOrganization(orgData) {
    return this.addToQueue(async () => {
      const { data, error } = await this.client
        .from('organizations')
        .insert([orgData])
        .select();

      if (error) throw error;
      return data;
    }, `criar organização ${orgData.name}`);
  }

  // **LINHA 179** - Login otimizado
  async signIn(credentials) {
    return this.addToQueue(async () => {
      const { data, error } = await this.client.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) throw error;
      return data;
    }, `login ${credentials.email}`);
  }

  // **LINHA 193** - Logout otimizado
  async signOut() {
    return this.executeWithRetry(async () => {
      const { error } = await this.client.auth.signOut();
      if (error) throw error;
      return true;
    }, 'logout');
  }

  // **LINHA 205** - Health check otimizado
  async healthCheck() {
    return this.executeWithRetry(async () => {
      const { data, error } = await this.client
        .from('organizations')
        .select('count', { count: 'exact', head: true });

      this.isConnected = !error;
      return !error;
    }, 'health check');
  }

  // **LINHA 244** - Criação direta de usuário (bypass auth)
  async createUserDirect(userData) {
    return this.addToQueue(async () => {
      const { data, error } = await this.client
        .from('users')
        .insert([userData])
        .select();

      if (error) throw error;
      return data;
    }, `criar usuário direto ${userData.email || userData.name}`);
  }

  // **LINHA 265** - Criação de membership
  async createOrganizationMember(memberData) {
    return this.addToQueue(async () => {
      const { data, error } = await this.client
        .from('organization_members')
        .insert([memberData])
        .select();

      if (error) throw error;
      return data;
    }, `criar membership para org ${memberData.organization_id}`);
  }

  // Reconectar se necessário
  async ensureConnection() {
    const isHealthy = await this.healthCheck();
    
    if (!isHealthy) {
      console.log('🔄 Reconectando...');
      this.client = null;
      this.initialize();
    }
    
    return isHealthy;
  }

  // Obter cliente (com verificação de conexão)
  async getClient() {
    if (!this.client) this.initialize();
    await this.ensureConnection();
    return this.client;
  }
}

// Singleton instance
const supabaseManager = new SupabaseConnectionManager();

export default supabaseManager;

// Export das funções para manter compatibilidade
export const createUser = (userData) => supabaseManager.createUser(userData);
export const createOrganization = (orgData) => supabaseManager.createOrganization(orgData);
export const signIn = (credentials) => supabaseManager.signIn(credentials);
export const signOut = () => supabaseManager.signOut();
export const healthCheck = () => supabaseManager.healthCheck();
export const createUserDirect = (userData) => supabaseManager.createUserDirect(userData);
export const createOrganizationMember = (memberData) => supabaseManager.createOrganizationMember(memberData);
export const getSupabaseClient = () => supabaseManager.getClient();