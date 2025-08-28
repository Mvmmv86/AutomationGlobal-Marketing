/**
 * Database Seed Data
 * Automation Global v4.0
 * 
 * Production-ready initial data setup
 */

import { storage, db } from '../storage';
import * as schema from '@shared/schema';

export class DatabaseSeeder {
  
  async seedInitialData(): Promise<void> {
    console.log('🌱 Seeding initial data for production...');
    
    try {
      await this.seedModules();
      await this.seedAiProviders();
      console.log('✅ Initial data seeded successfully');
    } catch (error: any) {
      console.error('❌ Seeding error:', error.message);
      throw error;
    }
  }

  private async seedModules(): Promise<void> {
    const modules = await storage.getModules();
    
    if (modules.length === 0) {
      console.log('📦 Creating system modules...');
      
      const moduleData = [
        {
          name: 'Marketing Automation',
          slug: 'marketing-automation',
          description: 'AI-powered email campaigns, social media management, and lead nurturing',
          features: [
            'Email Campaign Automation',
            'Social Media Scheduling',
            'Lead Scoring & Nurturing',
            'A/B Testing',
            'Performance Analytics',
            'Multi-channel Integration'
          ],
          requiredPlan: 'starter' as const,
          settings: {
            maxCampaigns: { starter: 5, professional: 25, enterprise: 100 },
            maxContacts: { starter: 1000, professional: 10000, enterprise: 100000 },
            aiTokens: { starter: 10000, professional: 50000, enterprise: 200000 }
          }
        },
        {
          name: 'Customer Support AI',
          slug: 'customer-support-ai',
          description: 'Intelligent ticket routing, automated responses, and sentiment analysis',
          features: [
            'Auto-ticket Classification',
            'AI Response Suggestions',
            'Sentiment Analysis',
            'Knowledge Base Integration',
            'Live Chat Automation',
            'Multi-language Support'
          ],
          requiredPlan: 'starter' as const,
          settings: {
            maxTickets: { starter: 100, professional: 1000, enterprise: 10000 },
            aiResponses: { starter: 500, professional: 5000, enterprise: 25000 },
            languages: { starter: 5, professional: 15, enterprise: 50 }
          }
        },
        {
          name: 'Trading Analytics',
          slug: 'trading-analytics',
          description: 'AI-driven market analysis, trading signals, and portfolio optimization',
          features: [
            'Market Sentiment Analysis',
            'Trading Signal Generation',
            'Portfolio Risk Assessment',
            'Technical Indicator Analysis',
            'News Impact Prediction',
            'Automated Trading Alerts'
          ],
          requiredPlan: 'professional' as const,
          settings: {
            maxPortfolios: { professional: 5, enterprise: 25 },
            signalsPerDay: { professional: 50, enterprise: 200 },
            markets: { professional: 10, enterprise: 50 }
          }
        }
      ];

      for (const module of moduleData) {
        try {
          await db.insert(schema.modules).values({
            name: module.name,
            slug: module.slug,
            description: module.description,
            features: module.features,
            requiredPlan: module.requiredPlan,
            settings: module.settings
          });
          console.log(`  ✅ Module: ${module.name}`);
        } catch (error: any) {
          if (!error.message.includes('duplicate key')) {
            throw error;
          }
          console.log(`  ⚠️ Module already exists: ${module.name}`);
        }
      }
    } else {
      console.log('📦 System modules already exist');
    }
  }

  private async seedAiProviders(): Promise<void> {
    try {
      const existingProviders = await db.select()
        .from(schema.aiProviders)
        .limit(1);

      if (existingProviders.length === 0) {
        console.log('🤖 Creating AI providers...');
        
        const providers = [
          {
            name: 'OpenAI GPT-5',
            provider: 'openai' as const,
            models: [
              { name: 'gpt-5', contextWindow: 128000, costPer1kTokens: 0.002 },
              { name: 'gpt-4o', contextWindow: 128000, costPer1kTokens: 0.001 }
            ],
            settings: {
              defaultTemperature: 0.7,
              maxTokens: 4000,
              rateLimits: {
                requestsPerMinute: 500,
                tokensPerMinute: 30000
              }
            }
          },
          {
            name: 'Anthropic Claude',
            provider: 'anthropic' as const,
            models: [
              { name: 'claude-sonnet-4-20250514', contextWindow: 200000, costPer1kTokens: 0.003 },
              { name: 'claude-3-7-sonnet-20250219', contextWindow: 200000, costPer1kTokens: 0.002 }
            ],
            settings: {
              defaultTemperature: 0.7,
              maxTokens: 4000,
              rateLimits: {
                requestsPerMinute: 300,
                tokensPerMinute: 25000
              }
            }
          }
        ];

        for (const provider of providers) {
          try {
            await db.insert(schema.aiProviders).values({
              name: provider.name,
              provider: provider.provider,
              models: provider.models,
              settings: provider.settings
            });
            console.log(`  ✅ AI Provider: ${provider.name}`);
          } catch (error: any) {
            if (!error.message.includes('duplicate key')) {
              throw error;
            }
            console.log(`  ⚠️ Provider already exists: ${provider.name}`);
          }
        }
      } else {
        console.log('🤖 AI providers already exist');
      }
    } catch (error: any) {
      console.error('❌ Error seeding AI providers:', error.message);
      // Don't throw, just log - providers can be configured manually
    }
  }

  async createFirstSuperAdmin(email: string, password: string): Promise<void> {
    console.log('👤 Creating first super admin...');
    
    try {
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        console.log('⚠️ Super admin already exists');
        return;
      }

      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 12);

      const [superAdmin] = await db.insert(schema.users).values({
        email,
        username: email.split('@')[0] + '_admin',
        firstName: 'Super',
        lastName: 'Admin',
        password: hashedPassword,
        emailVerified: true
      }).returning();

      console.log(`✅ Super admin created: ${superAdmin.email}`);

    } catch (error: any) {
      console.error('❌ Error creating super admin:', error.message);
      throw error;
    }
  }
}