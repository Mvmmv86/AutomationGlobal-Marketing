import { config } from 'dotenv';
import { validateEnvironment } from './validation';

// Load environment variables from .env file
config();

export interface EnvironmentConfig {
  // Server Configuration
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  
  // Database Configuration
  DATABASE_URL: string;
  
  // AI Service Configuration
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  
  // Authentication & Security
  JWT_SECRET: string;
  BCRYPT_ROUNDS: number;
  
  // Supabase Configuration
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_KEY: string;
  
  // Redis Configuration (for future implementation)
  REDIS_URL: string;
  
  // Celery/Queue Configuration (for future implementation)
  CELERY_BROKER_URL: string;
  CELERY_RESULT_BACKEND: string;
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  
  // AI Configuration
  AI_DEFAULT_MODEL: string;
  AI_FALLBACK_MODEL: string;
  AI_MAX_TOKENS: number;
  AI_TIMEOUT: number;
  
  // Logging Configuration
  LOG_LEVEL: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  
  // Environment Flags
  DEBUG: boolean;
  ENVIRONMENT: string;
}

function parseEnvNumber(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

function parseEnvBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

export const ENV: EnvironmentConfig = {
  // Server Configuration
  NODE_ENV: (process.env.NODE_ENV as any) || 'development',
  PORT: parseEnvNumber(process.env.PORT, 5000),
  
  // Database Configuration
  DATABASE_URL: process.env.DATABASE_URL || '',
  
  // AI Service Configuration
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  
  // Authentication & Security
  JWT_SECRET: process.env.JWT_SECRET || process.env.FLASK_SECRET_KEY || '',
  BCRYPT_ROUNDS: parseEnvNumber(process.env.BCRYPT_ROUNDS, 12),
  
  // Supabase Configuration
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',
  
  // Redis Configuration
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Celery/Queue Configuration  
  CELERY_BROKER_URL: process.env.CELERY_BROKER_URL || process.env.REDIS_URL || 'redis://localhost:6379',
  CELERY_RESULT_BACKEND: process.env.CELERY_RESULT_BACKEND || process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: parseEnvNumber(process.env.RATE_LIMIT_WINDOW, 15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseEnvNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 1000),
  
  // AI Configuration
  AI_DEFAULT_MODEL: process.env.AI_DEFAULT_MODEL || 'gpt-5',
  AI_FALLBACK_MODEL: process.env.AI_FALLBACK_MODEL || 'claude-sonnet-4-20250514',
  AI_MAX_TOKENS: parseEnvNumber(process.env.AI_MAX_TOKENS, 4096),
  AI_TIMEOUT: parseEnvNumber(process.env.AI_TIMEOUT, 30000),
  
  // Logging Configuration
  LOG_LEVEL: (process.env.LOG_LEVEL as any) || 'INFO',
  
  // Environment Flags
  DEBUG: parseEnvBoolean(process.env.DEBUG, process.env.NODE_ENV === 'development'),
  ENVIRONMENT: process.env.ENVIRONMENT || process.env.NODE_ENV || 'development',
};

// Validate environment configuration on startup
validateEnvironment(ENV);

export default ENV;
