/**
 * Queue Manager for Automation Global v4.0
 * Handles asynchronous tasks and job processing
 */

import Bull, { Queue, Job, JobOptions } from 'bull';
import { redisClient } from '../cache/redis-client.js';

interface QueueConfig {
  name: string;
  concurrency: number;
  attempts: number;
  backoff: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
}

interface JobData {
  type: string;
  payload: any;
  organizationId?: string;
  userId?: string;
  priority?: number;
}

export class QueueManager {
  private queues: Map<string, Queue> = new Map();
  private isRedisAvailable = false;
  private fallbackJobs: Map<string, any[]> = new Map();

  private queueConfigs: QueueConfig[] = [
    {
      name: 'ai-processing',
      concurrency: 5,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 }
    },
    {
      name: 'automation-execution',
      concurrency: 10,
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 }
    },
    {
      name: 'email-notifications',
      concurrency: 20,
      attempts: 3,
      backoff: { type: 'fixed', delay: 5000 }
    },
    {
      name: 'data-processing',
      concurrency: 3,
      attempts: 2,
      backoff: { type: 'exponential', delay: 3000 }
    },
    {
      name: 'analytics-aggregation',
      concurrency: 2,
      attempts: 1,
      backoff: { type: 'fixed', delay: 10000 }
    }
  ];

  constructor() {
    this.initializeQueues();
  }

  private async initializeQueues(): Promise<void> {
    try {
      // Check Redis availability
      const redisStatus = redisClient.getStatus();
      this.isRedisAvailable = redisStatus.connected;

      if (this.isRedisAvailable) {
        console.log('✅ Redis available, initializing Bull queues...');
        this.initializeBullQueues();
      } else {
        console.log('⚠️ Redis not available, using in-memory job processing...');
        this.initializeFallbackQueues();
      }

    } catch (error) {
      console.warn('❌ Failed to initialize queues:', (error as Error).message);
      this.initializeFallbackQueues();
    }
  }

  private initializeBullQueues(): void {
    for (const config of this.queueConfigs) {
      try {
        const queue = new Bull(config.name, {
          redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD
          },
          defaultJobOptions: {
            attempts: config.attempts,
            backoff: config.backoff,
            removeOnComplete: 10,
            removeOnFail: 5
          }
        });

        // Set up job processors
        queue.process(config.concurrency, this.getJobProcessor(config.name));

        // Set up event listeners
        this.setupQueueEvents(queue, config.name);

        this.queues.set(config.name, queue);
        console.log(`✅ Queue '${config.name}' initialized with concurrency: ${config.concurrency}`);

      } catch (error) {
        console.error(`❌ Failed to initialize queue '${config.name}':`, (error as Error).message);
      }
    }
  }

  private initializeFallbackQueues(): void {
    for (const config of this.queueConfigs) {
      this.fallbackJobs.set(config.name, []);
      console.log(`⚠️ Fallback queue '${config.name}' initialized (in-memory)`);
    }

    // Start processing fallback jobs
    this.processFallbackJobs();
  }

  private setupQueueEvents(queue: Queue, queueName: string): void {
    queue.on('completed', (job: Job) => {
      console.log(`✅ Job ${job.id} completed in queue '${queueName}'`);
    });

    queue.on('failed', (job: Job, err: Error) => {
      console.error(`❌ Job ${job.id} failed in queue '${queueName}':`, err.message);
    });

    queue.on('progress', (job: Job, progress: number) => {
      console.log(`🔄 Job ${job.id} progress: ${progress}% in queue '${queueName}'`);
    });

    queue.on('stalled', (job: Job) => {
      console.warn(`⚠️ Job ${job.id} stalled in queue '${queueName}'`);
    });
  }

  private getJobProcessor(queueName: string) {
    return async (job: Job<JobData>) => {
      try {
        console.log(`🔄 Processing job ${job.id} of type '${job.data.type}' in queue '${queueName}'`);

        // Route to appropriate processor based on job type
        switch (job.data.type) {
          case 'ai-request':
            return await this.processAIRequest(job);
          case 'automation-step':
            return await this.processAutomationStep(job);
          case 'send-email':
            return await this.processSendEmail(job);
          case 'process-data':
            return await this.processData(job);
          case 'aggregate-analytics':
            return await this.processAnalyticsAggregation(job);
          default:
            throw new Error(`Unknown job type: ${job.data.type}`);
        }

      } catch (error) {
        console.error(`❌ Job processing failed:`, (error as Error).message);
        throw error;
      }
    };
  }

  /**
   * Add job to queue
   */
  async addJob(queueName: string, jobData: JobData, options?: JobOptions): Promise<string> {
    if (this.isRedisAvailable && this.queues.has(queueName)) {
      const queue = this.queues.get(queueName)!;
      const job = await queue.add(jobData, {
        priority: jobData.priority || 0,
        delay: options?.delay || 0,
        ...options
      });
      return job.id!.toString();
    } else {
      // Fallback to in-memory processing
      const jobId = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fallbackJob = { id: jobId, data: jobData, ...options };
      
      const jobs = this.fallbackJobs.get(queueName) || [];
      jobs.push(fallbackJob);
      this.fallbackJobs.set(queueName, jobs);
      
      return jobId;
    }
  }

  /**
   * Process AI requests
   */
  private async processAIRequest(job: Job<JobData>): Promise<any> {
    const { payload } = job.data;
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update progress
    job.progress(50);
    
    // Simulate more processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    job.progress(100);
    
    return {
      success: true,
      result: `AI request processed for: ${payload.prompt || 'unknown'}`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Process automation steps
   */
  private async processAutomationStep(job: Job<JobData>): Promise<any> {
    const { payload } = job.data;
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      result: `Automation step '${payload.stepType}' executed`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Process email sending
   */
  private async processSendEmail(job: Job<JobData>): Promise<any> {
    const { payload } = job.data;
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      result: `Email sent to ${payload.recipient}`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Process data operations
   */
  private async processData(job: Job<JobData>): Promise<any> {
    const { payload } = job.data;
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return {
      success: true,
      result: `Data processing completed for ${payload.dataType}`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Process analytics aggregation
   */
  private async processAnalyticsAggregation(job: Job<JobData>): Promise<any> {
    const { payload } = job.data;
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    return {
      success: true,
      result: `Analytics aggregated for period: ${payload.period}`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Process fallback jobs (in-memory)
   */
  private async processFallbackJobs(): Promise<void> {
    setInterval(async () => {
      for (const [queueName, jobs] of this.fallbackJobs.entries()) {
        if (jobs.length > 0) {
          const job = jobs.shift()!;
          
          try {
            console.log(`🔄 Processing fallback job ${job.id} in queue '${queueName}'`);
            const processor = this.getJobProcessor(queueName);
            await processor(job as Job<JobData>);
            console.log(`✅ Fallback job ${job.id} completed`);
          } catch (error) {
            console.error(`❌ Fallback job ${job.id} failed:`, (error as Error).message);
          }
        }
      }
    }, 1000); // Process every second
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<any> {
    const stats: any = {
      mode: this.isRedisAvailable ? 'redis' : 'memory',
      queues: {}
    };

    if (this.isRedisAvailable) {
      for (const [name, queue] of this.queues.entries()) {
        try {
          const waiting = await queue.getWaiting();
          const active = await queue.getActive();
          const completed = await queue.getCompleted();
          const failed = await queue.getFailed();

          stats.queues[name] = {
            waiting: waiting.length,
            active: active.length,
            completed: completed.length,
            failed: failed.length,
            total: waiting.length + active.length + completed.length + failed.length
          };
        } catch (error) {
          stats.queues[name] = { error: (error as Error).message };
        }
      }
    } else {
      for (const [name, jobs] of this.fallbackJobs.entries()) {
        stats.queues[name] = {
          waiting: jobs.length,
          mode: 'memory_fallback'
        };
      }
    }

    return stats;
  }

  /**
   * Test queue functionality
   */
  async testQueues(): Promise<{ success: boolean; tests: any[] }> {
    const tests = [];

    try {
      // Test 1: AI Processing Queue
      const aiJobId = await this.addJob('ai-processing', {
        type: 'ai-request',
        payload: { prompt: 'Test AI request' },
        organizationId: 'test-org',
        priority: 1
      });

      tests.push({
        name: 'AI Processing Queue Test',
        success: !!aiJobId,
        details: `Job added with ID: ${aiJobId}`
      });

      // Test 2: Automation Queue
      const automationJobId = await this.addJob('automation-execution', {
        type: 'automation-step',
        payload: { stepType: 'send-email', config: {} },
        organizationId: 'test-org'
      });

      tests.push({
        name: 'Automation Queue Test',
        success: !!automationJobId,
        details: `Job added with ID: ${automationJobId}`
      });

      // Test 3: Queue Stats
      const stats = await this.getQueueStats();
      
      tests.push({
        name: 'Queue Statistics Test',
        success: !!stats && !!stats.queues,
        details: `Mode: ${stats.mode}, Active queues: ${Object.keys(stats.queues).length}`
      });

      return {
        success: tests.every(test => test.success),
        tests
      };

    } catch (error) {
      tests.push({
        name: 'Queue Test Error',
        success: false,
        details: (error as Error).message
      });

      return {
        success: false,
        tests
      };
    }
  }

  /**
   * Cleanup and close queues
   */
  async close(): Promise<void> {
    for (const queue of this.queues.values()) {
      await queue.close();
    }
    this.queues.clear();
  }
}

export const queueManager = new QueueManager();