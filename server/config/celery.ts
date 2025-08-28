/**
 * Celery/Queue Configuration
 * Automation Global v4.0
 * 
 * Configuration for background task processing using queue systems
 */

import { CONFIG } from '../config';

// Queue configuration
export const queueConfig = {
  redis: {
    host: CONFIG.REDIS_URL.includes('://') 
      ? new URL(CONFIG.REDIS_URL).hostname 
      : CONFIG.REDIS_URL.split(':')[0],
    port: CONFIG.REDIS_URL.includes('://') 
      ? parseInt(new URL(CONFIG.REDIS_URL).port || '6379')
      : parseInt(CONFIG.REDIS_URL.split(':')[1] || '6379'),
    db: 3, // Dedicated database for queues
    password: CONFIG.REDIS_URL.includes('@') 
      ? CONFIG.REDIS_URL.split('@')[0].split(':').pop()
      : undefined,
  },
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};

// Queue definitions
export const queues = {
  // High priority queue for user-facing operations
  high: {
    name: 'automation-global-high',
    concurrency: 5,
    options: {
      ...queueConfig.defaultJobOptions,
      priority: 100,
    },
  },
  
  // Default queue for standard operations
  default: {
    name: 'automation-global-default',
    concurrency: 10,
    options: {
      ...queueConfig.defaultJobOptions,
      priority: 50,
    },
  },
  
  // Low priority queue for background operations
  low: {
    name: 'automation-global-low',
    concurrency: 3,
    options: {
      ...queueConfig.defaultJobOptions,
      priority: 10,
    },
  },
  
  // Specific queues for different operations
  ai: {
    name: 'automation-global-ai',
    concurrency: 8,
    options: {
      ...queueConfig.defaultJobOptions,
      priority: 80,
      attempts: 2, // AI operations should fail fast
    },
  },
  
  email: {
    name: 'automation-global-email',
    concurrency: 15,
    options: {
      ...queueConfig.defaultJobOptions,
      priority: 70,
    },
  },
  
  automation: {
    name: 'automation-global-automation',
    concurrency: 5,
    options: {
      ...queueConfig.defaultJobOptions,
      priority: 90,
      attempts: 5, // Automations should retry more
    },
  },
  
  reports: {
    name: 'automation-global-reports',
    concurrency: 2,
    options: {
      ...queueConfig.defaultJobOptions,
      priority: 20,
    },
  },
} as const;

// Job types definitions
export const jobTypes = {
  // AI Operations
  AI_GENERATE_CONTENT: 'ai.generate.content',
  AI_ANALYZE_DATA: 'ai.analyze.data',
  AI_PROCESS_BATCH: 'ai.process.batch',
  
  // Email Operations
  EMAIL_SEND_WELCOME: 'email.send.welcome',
  EMAIL_SEND_NOTIFICATION: 'email.send.notification',
  EMAIL_SEND_REPORT: 'email.send.report',
  EMAIL_PROCESS_CAMPAIGN: 'email.process.campaign',
  
  // Automation Operations
  AUTOMATION_EXECUTE: 'automation.execute',
  AUTOMATION_SCHEDULE: 'automation.schedule',
  AUTOMATION_RETRY: 'automation.retry',
  
  // Data Processing
  DATA_IMPORT: 'data.import',
  DATA_EXPORT: 'data.export',
  DATA_SYNC: 'data.sync',
  DATA_CLEANUP: 'data.cleanup',
  
  // System Operations
  SYSTEM_BACKUP: 'system.backup',
  SYSTEM_MAINTENANCE: 'system.maintenance',
  SYSTEM_REPORT_GENERATE: 'system.report.generate',
  
  // Integration Operations
  INTEGRATION_SYNC: 'integration.sync',
  INTEGRATION_WEBHOOK: 'integration.webhook',
  INTEGRATION_IMPORT: 'integration.import',
} as const;

// Retry policies for different job types
export const retryPolicies = {
  [jobTypes.AI_GENERATE_CONTENT]: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 5000 },
  },
  [jobTypes.AI_ANALYZE_DATA]: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  },
  [jobTypes.EMAIL_SEND_NOTIFICATION]: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 1000 },
  },
  [jobTypes.AUTOMATION_EXECUTE]: {
    attempts: 3,
    backoff: { type: 'fixed', delay: 10000 },
  },
  [jobTypes.DATA_SYNC]: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 5000 },
  },
} as const;

// Job scheduling patterns
export const schedules = {
  // Data cleanup - daily at 2 AM
  DAILY_CLEANUP: '0 2 * * *',
  
  // Usage reports - daily at 6 AM  
  DAILY_REPORTS: '0 6 * * *',
  
  // System backup - daily at 3 AM
  DAILY_BACKUP: '0 3 * * *',
  
  // AI usage analytics - hourly
  HOURLY_AI_ANALYTICS: '0 * * * *',
  
  // Integration sync - every 15 minutes
  INTEGRATION_SYNC: '*/15 * * * *',
  
  // Health checks - every 5 minutes
  HEALTH_CHECK: '*/5 * * * *',
} as const;

// Worker configuration
export const workerConfig = {
  // Number of workers per queue
  workers: {
    high: 2,
    default: 3,
    low: 1,
    ai: 2,
    email: 3,
    automation: 2,
    reports: 1,
  },
  
  // Worker settings
  settings: {
    stalledInterval: 30000, // 30 seconds
    maxStalledCount: 1,
  },
  
  // Graceful shutdown timeout
  shutdownTimeout: 30000, // 30 seconds
};

// Monitoring and metrics
export const monitoring = {
  metrics: {
    // Collect metrics every minute
    interval: 60000,
    
    // Metrics to track
    track: [
      'jobs.completed',
      'jobs.failed',
      'jobs.delayed',
      'jobs.active',
      'workers.active',
      'queues.waiting',
    ],
  },
  
  // Alert thresholds
  alerts: {
    queueBacklog: 100, // Alert if queue has > 100 waiting jobs
    failureRate: 0.1, // Alert if failure rate > 10%
    responseTime: 30000, // Alert if jobs take > 30 seconds
  },
};

export default {
  queueConfig,
  queues,
  jobTypes,
  retryPolicies,
  schedules,
  workerConfig,
  monitoring,
};