import type { EnvironmentConfig } from './env';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEnvironment(env: EnvironmentConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Critical required variables for production
  const productionRequired = [
    'DATABASE_URL',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY',
    'JWT_SECRET'
  ];

  // Development warnings (should be set but not critical)
  const developmentWarnings = [
    'REDIS_URL',
    'CELERY_BROKER_URL',
    'CELERY_RESULT_BACKEND'
  ];

  // Validate required variables
  if (env.NODE_ENV === 'production') {
    for (const key of productionRequired) {
      const value = (env as any)[key];
      if (!value || value === '') {
        errors.push(`Missing required environment variable: ${key}`);
      }
    }
  } else {
    // Development environment - show warnings for missing production vars
    for (const key of productionRequired) {
      const value = (env as any)[key];
      if (!value || value === '') {
        warnings.push(`Missing environment variable for production readiness: ${key}`);
      }
    }
  }

  // Check development warnings
  for (const key of developmentWarnings) {
    const value = (env as any)[key];
    if (!value || value === '') {
      warnings.push(`Missing optional environment variable: ${key} (required for full functionality)`);
    }
  }

  // Validate specific formats
  if (env.SUPABASE_URL && !env.SUPABASE_URL.startsWith('https://')) {
    errors.push('SUPABASE_URL must start with https://');
  }

  if (env.DATABASE_URL && !env.DATABASE_URL.startsWith('postgres')) {
    errors.push('DATABASE_URL must be a valid PostgreSQL connection string');
  }

  if (env.REDIS_URL && !env.REDIS_URL.startsWith('redis://')) {
    warnings.push('REDIS_URL should start with redis://');
  }

  // Validate numeric ranges
  if (env.PORT < 1 || env.PORT > 65535) {
    errors.push('PORT must be between 1 and 65535');
  }

  if (env.BCRYPT_ROUNDS < 10 || env.BCRYPT_ROUNDS > 15) {
    warnings.push('BCRYPT_ROUNDS should be between 10 and 15 for optimal security/performance');
  }

  if (env.AI_MAX_TOKENS < 1 || env.AI_MAX_TOKENS > 32000) {
    warnings.push('AI_MAX_TOKENS should be between 1 and 32000');
  }

  // Validate AI models
  const validOpenAIModels = ['gpt-5', 'gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'];
  const validAnthropicModels = ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'];

  if (!validOpenAIModels.includes(env.AI_DEFAULT_MODEL) && !validAnthropicModels.includes(env.AI_DEFAULT_MODEL)) {
    warnings.push(`AI_DEFAULT_MODEL '${env.AI_DEFAULT_MODEL}' is not a recognized model`);
  }

  if (!validAnthropicModels.includes(env.AI_FALLBACK_MODEL) && !validOpenAIModels.includes(env.AI_FALLBACK_MODEL)) {
    warnings.push(`AI_FALLBACK_MODEL '${env.AI_FALLBACK_MODEL}' is not a recognized model`);
  }

  // JWT Secret strength validation
  if (env.JWT_SECRET && env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long for security');
  }

  const result: ValidationResult = {
    isValid: errors.length === 0,
    errors,
    warnings
  };

  // Log validation results
  if (errors.length > 0) {
    console.error('❌ Environment validation failed:');
    errors.forEach(error => console.error(`  - ${error}`));
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Environment validation warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ Environment validation passed');
  }

  // Exit on critical errors in production
  if (env.NODE_ENV === 'production' && errors.length > 0) {
    console.error('💀 Critical environment errors detected in production mode');
    process.exit(1);
  }

  return result;
}

export function generateSecretKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function maskSensitiveValue(value: string): string {
  if (!value || value.length < 8) {
    return '***';
  }
  return value.substring(0, 4) + '***' + value.substring(value.length - 4);
}

export function printEnvironmentSummary(env: EnvironmentConfig): void {
  console.log('\n🔧 Environment Configuration Summary:');
  console.log(`  Environment: ${env.NODE_ENV}`);
  console.log(`  Port: ${env.PORT}`);
  console.log(`  Debug Mode: ${env.DEBUG}`);
  console.log(`  Log Level: ${env.LOG_LEVEL}`);
  console.log('\n🔐 Services Configuration:');
  console.log(`  Database: ${env.DATABASE_URL ? '✅ Connected' : '❌ Not configured'}`);
  console.log(`  Supabase: ${env.SUPABASE_URL ? '✅ Connected' : '❌ Not configured'}`);
  console.log(`  OpenAI: ${env.OPENAI_API_KEY ? '✅ API Key set' : '❌ No API key'}`);
  console.log(`  Anthropic: ${env.ANTHROPIC_API_KEY ? '✅ API Key set' : '❌ No API key'}`);
  console.log(`  Redis: ${env.REDIS_URL ? '✅ Configured' : '⚠️ Not configured'}`);
  console.log('\n🤖 AI Configuration:');
  console.log(`  Default Model: ${env.AI_DEFAULT_MODEL}`);
  console.log(`  Fallback Model: ${env.AI_FALLBACK_MODEL}`);
  console.log(`  Max Tokens: ${env.AI_MAX_TOKENS}`);
  console.log(`  Timeout: ${env.AI_TIMEOUT}ms`);
}
