import { config } from 'dotenv';

// Load environment variables
config();

export const CONFIG = {
  // Server
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',
  
  // AI Services
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  
  // Auth & Security
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  BCRYPT_ROUNDS: 12,
  
  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',
  
  // Redis (for future implementation)
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 1000,
  
  // AI Configuration
  AI_DEFAULT_MODEL: 'gpt-5',
  AI_FALLBACK_MODEL: 'claude-sonnet-4-20250514',
  AI_MAX_TOKENS: 4096,
  AI_TIMEOUT: 30000, // 30 seconds
  
  // Subscription Plans
  PLANS: {
    starter: {
      name: 'Starter',
      price: 29,
      maxUsers: 2,
      maxAiRequests: 1000,
      maxModules: 2,
      features: ['basic_integrations', 'email_support']
    },
    professional: {
      name: 'Professional', 
      price: 99,
      maxUsers: 10,
      maxAiRequests: 10000,
      maxModules: -1, // unlimited
      features: ['advanced_integrations', 'priority_support', 'analytics']
    },
    enterprise: {
      name: 'Enterprise',
      price: 299,
      maxUsers: -1, // unlimited
      maxAiRequests: 100000,
      maxModules: -1, // unlimited
      features: ['custom_integrations', 'dedicated_support', 'custom_ai_models', 'sla']
    }
  }
} as const;

// Validation
if (CONFIG.NODE_ENV === 'production') {
  const required = [
    'DATABASE_URL',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY'
  ];
  
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}
