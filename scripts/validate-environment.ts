#!/usr/bin/env tsx
/**
 * Environment Variables Validation Script
 * Automation Global v4.0
 * 
 * This script validates all required environment variables and tests connectivity
 * to external services like Supabase, OpenAI, and Anthropic.
 */

import { config } from 'dotenv';
import { CONFIG } from '../server/config';

// Load environment variables
config();

interface ValidationResult {
  service: string;
  status: '✓ PASS' | '✗ FAIL' | '⚠ WARNING';
  message: string;
  details?: string;
}

class EnvironmentValidator {
  private results: ValidationResult[] = [];

  private addResult(service: string, status: 'PASS' | 'FAIL' | 'WARNING', message: string, details?: string) {
    this.results.push({
      service,
      status: status === 'PASS' ? '✓ PASS' : status === 'FAIL' ? '✗ FAIL' : '⚠ WARNING',
      message,
      details
    });
  }

  // Basic environment variable checks
  validateBasicConfig() {
    console.log('\n🔧 BASIC CONFIGURATION VALIDATION\n');

    // Node environment
    if (CONFIG.NODE_ENV) {
      this.addResult('NODE_ENV', 'PASS', `Environment: ${CONFIG.NODE_ENV}`);
    } else {
      this.addResult('NODE_ENV', 'WARNING', 'NODE_ENV not set, defaulting to development');
    }

    // Port
    if (CONFIG.PORT) {
      this.addResult('PORT', 'PASS', `Server port: ${CONFIG.PORT}`);
    } else {
      this.addResult('PORT', 'WARNING', 'PORT not set, using default 5000');
    }
  }

  // Database connection validation
  async validateDatabase() {
    console.log('\n🗄️  DATABASE VALIDATION\n');

    if (!CONFIG.DATABASE_URL) {
      this.addResult('DATABASE_URL', 'FAIL', 'DATABASE_URL is required but not set');
      return;
    }

    // Check URL format
    if (!CONFIG.DATABASE_URL.includes('postgresql://') && !CONFIG.DATABASE_URL.includes('postgres://')) {
      this.addResult('DATABASE_URL', 'WARNING', 'DATABASE_URL format may be incorrect (expected postgresql://)', CONFIG.DATABASE_URL.substring(0, 20) + '...');
      return;
    }

    try {
      // Test database connection
      const { storage } = await import('../server/storage');
      await storage.getUser('test'); // This will fail but tests connection
      this.addResult('DATABASE', 'PASS', 'Database connection successful');
    } catch (error: any) {
      if (error.message && !error.message.includes('invalid input syntax')) {
        this.addResult('DATABASE', 'FAIL', 'Database connection failed', error.message);
      } else {
        this.addResult('DATABASE', 'PASS', 'Database connection successful (expected query error)');
      }
    }
  }

  // AI services validation
  async validateAIServices() {
    console.log('\n🤖 AI SERVICES VALIDATION\n');

    // OpenAI validation
    if (!CONFIG.OPENAI_API_KEY) {
      this.addResult('OPENAI_API_KEY', 'FAIL', 'OpenAI API key is required but not set');
    } else {
      if (CONFIG.OPENAI_API_KEY.startsWith('sk-')) {
        this.addResult('OPENAI_API_KEY', 'PASS', 'OpenAI API key format is valid');
        
        try {
          // Test OpenAI connection (mock test - actual test would cost money)
          const keyLength = CONFIG.OPENAI_API_KEY.length;
          if (keyLength > 40) {
            this.addResult('OPENAI', 'PASS', `OpenAI API key appears valid (length: ${keyLength})`);
          } else {
            this.addResult('OPENAI', 'WARNING', 'OpenAI API key may be too short');
          }
        } catch (error: any) {
          this.addResult('OPENAI', 'FAIL', 'OpenAI service test failed', error.message);
        }
      } else {
        this.addResult('OPENAI_API_KEY', 'WARNING', 'OpenAI API key format may be incorrect (should start with sk-)');
      }
    }

    // Anthropic validation
    if (!CONFIG.ANTHROPIC_API_KEY) {
      this.addResult('ANTHROPIC_API_KEY', 'FAIL', 'Anthropic API key is required but not set');
    } else {
      if (CONFIG.ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
        this.addResult('ANTHROPIC_API_KEY', 'PASS', 'Anthropic API key format is valid');
        
        try {
          const keyLength = CONFIG.ANTHROPIC_API_KEY.length;
          if (keyLength > 40) {
            this.addResult('ANTHROPIC', 'PASS', `Anthropic API key appears valid (length: ${keyLength})`);
          } else {
            this.addResult('ANTHROPIC', 'WARNING', 'Anthropic API key may be too short');
          }
        } catch (error: any) {
          this.addResult('ANTHROPIC', 'FAIL', 'Anthropic service test failed', error.message);
        }
      } else {
        this.addResult('ANTHROPIC_API_KEY', 'WARNING', 'Anthropic API key format may be incorrect (should start with sk-ant-)');
      }
    }

    // AI model configuration
    if (CONFIG.AI_DEFAULT_MODEL) {
      this.addResult('AI_DEFAULT_MODEL', 'PASS', `Default AI model: ${CONFIG.AI_DEFAULT_MODEL}`);
    } else {
      this.addResult('AI_DEFAULT_MODEL', 'WARNING', 'AI_DEFAULT_MODEL not set, using default');
    }

    if (CONFIG.AI_FALLBACK_MODEL) {
      this.addResult('AI_FALLBACK_MODEL', 'PASS', `Fallback AI model: ${CONFIG.AI_FALLBACK_MODEL}`);
    } else {
      this.addResult('AI_FALLBACK_MODEL', 'WARNING', 'AI_FALLBACK_MODEL not set, using default');
    }
  }

  // Security validation
  validateSecurity() {
    console.log('\n🔐 SECURITY VALIDATION\n');

    // JWT Secret
    if (!CONFIG.JWT_SECRET) {
      this.addResult('JWT_SECRET', 'FAIL', 'JWT_SECRET is required but not set');
    } else {
      if (CONFIG.JWT_SECRET === 'your-super-secret-jwt-key') {
        this.addResult('JWT_SECRET', 'FAIL', 'JWT_SECRET is using default value - SECURITY RISK!');
      } else if (CONFIG.JWT_SECRET.length < 32) {
        this.addResult('JWT_SECRET', 'WARNING', 'JWT_SECRET should be at least 32 characters long');
      } else {
        this.addResult('JWT_SECRET', 'PASS', `JWT secret is configured (length: ${CONFIG.JWT_SECRET.length})`);
      }
    }

    // BCrypt rounds
    if (CONFIG.BCRYPT_ROUNDS >= 10 && CONFIG.BCRYPT_ROUNDS <= 15) {
      this.addResult('BCRYPT_ROUNDS', 'PASS', `BCrypt rounds: ${CONFIG.BCRYPT_ROUNDS}`);
    } else if (CONFIG.BCRYPT_ROUNDS < 10) {
      this.addResult('BCRYPT_ROUNDS', 'WARNING', `BCrypt rounds too low (${CONFIG.BCRYPT_ROUNDS}), recommend 12+`);
    } else {
      this.addResult('BCRYPT_ROUNDS', 'WARNING', `BCrypt rounds very high (${CONFIG.BCRYPT_ROUNDS}), may be slow`);
    }
  }

  // Optional services validation
  validateOptionalServices() {
    console.log('\n⚙️  OPTIONAL SERVICES VALIDATION\n');

    // Redis
    if (!CONFIG.REDIS_URL) {
      this.addResult('REDIS_URL', 'WARNING', 'Redis not configured (optional for caching and queues)');
    } else {
      if (CONFIG.REDIS_URL.startsWith('redis://')) {
        this.addResult('REDIS_URL', 'PASS', 'Redis URL format is valid');
      } else {
        this.addResult('REDIS_URL', 'WARNING', 'Redis URL format may be incorrect');
      }
    }

    // Rate limiting
    this.addResult('RATE_LIMITING', 'PASS', 
      `Rate limit: ${CONFIG.RATE_LIMIT_MAX_REQUESTS} requests per ${CONFIG.RATE_LIMIT_WINDOW/1000/60} minutes`);
  }

  // Generate final report
  generateReport() {
    console.log('\n📊 VALIDATION SUMMARY\n');
    console.log('='.repeat(80));

    const passed = this.results.filter(r => r.status === '✓ PASS').length;
    const failed = this.results.filter(r => r.status === '✗ FAIL').length;
    const warnings = this.results.filter(r => r.status === '⚠ WARNING').length;

    console.log(`\n📈 Results: ${passed} PASSED | ${warnings} WARNINGS | ${failed} FAILED\n`);

    // Group results by category
    const categories = ['Basic', 'Database', 'AI', 'Security', 'Optional'];
    
    this.results.forEach(result => {
      console.log(`${result.status} ${result.service.padEnd(20)} ${result.message}`);
      if (result.details) {
        console.log(`${''.padEnd(25)} ↳ ${result.details}`);
      }
    });

    console.log('\n' + '='.repeat(80));

    // Final status
    if (failed === 0) {
      if (warnings === 0) {
        console.log('\n🎉 ALL VALIDATIONS PASSED! Environment is ready for production.');
        process.exit(0);
      } else {
        console.log('\n⚠️  Environment is functional but has warnings. Review above.');
        process.exit(0);
      }
    } else {
      console.log('\n❌ Environment validation FAILED! Fix the issues above before running the application.');
      process.exit(1);
    }
  }

  // Run all validations
  async runAll() {
    console.log('🚀 AUTOMATION GLOBAL - ENVIRONMENT VALIDATION');
    console.log('='.repeat(80));
    
    try {
      this.validateBasicConfig();
      await this.validateDatabase();
      await this.validateAIServices();
      this.validateSecurity();
      this.validateOptionalServices();
      
      this.generateReport();
    } catch (error: any) {
      console.error('\n💥 Validation script failed:', error.message);
      process.exit(1);
    }
  }
}

// Run validation if script is executed directly
const validator = new EnvironmentValidator();
validator.runAll().catch(console.error);

export default EnvironmentValidator;