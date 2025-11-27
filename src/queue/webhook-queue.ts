/**
 * Webhook Queue Processor using BullMQ
 * Handles MPesa callbacks asynchronously with retries and error handling
 * 
 * Install: npm install bullmq ioredis
 */

import { Queue, Worker, QueueEvents } from 'bullmq';
import { Redis } from 'ioredis';

export interface MpesaWebhookJob {
  type: 'stk_callback' | 'c2b_callback' | 'b2c_result' | 'timeout';
  payload: any;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface WebhookQueueOptions {
  redis?: {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
  };
  queueName?: string;
  concurrency?: number;
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
}

/**
 * MPesa Webhook Queue Manager
 */
export class MpesaWebhookQueue {
  private queue: Queue;
  private worker: Worker | null = null;
  private queueEvents: QueueEvents;
  private connection: Redis;

  constructor(options: WebhookQueueOptions = {}) {
    const {
      redis = {},
      queueName = 'mpesa-webhooks',
      concurrency = 5,
      removeOnComplete = 100,
      removeOnFail = false,
    } = options;

    // Create Redis connection
    this.connection = new Redis({
      host: redis.host || 'localhost',
      port: redis.port || 6379,
      password: redis.password,
      db: redis.db || 0,
      maxRetriesPerRequest: null,
    });

    // Create queue
    this.queue = new Queue(queueName, {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete,
        removeOnFail,
      },
    });

    // Create queue events for monitoring
    this.queueEvents = new QueueEvents(queueName, {
      connection: this.connection,
    });

    this.setupEventListeners();
  }

  /**
   * Add a webhook to the queue
   */
  async addWebhook(
    type: MpesaWebhookJob['type'],
    payload: any,
    metadata?: Record<string, any>
  ): Promise<string> {
    const job = await this.queue.add(
      type,
      {
        type,
        payload,
        timestamp: Date.now(),
        metadata,
      },
      {
        priority: this.getPriority(type),
      }
    );

    return job.id!;
  }

  /**
   * Process webhooks with a handler function
   */
  startProcessing(
    handler: (job: MpesaWebhookJob) => Promise<void>,
    concurrency: number = 5
  ): void {
    this.worker = new Worker(
      this.queue.name,
      async (job) => {
        console.log(`Processing webhook job ${job.id} (${job.data.type})`);
        await handler(job.data);
      },
      {
        connection: this.connection,
        concurrency,
      }
    );

    this.worker.on('completed', (job) => {
      console.log(`✅ Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, error) => {
      console.error(`❌ Job ${job?.id} failed:`, error.message);
    });
  }

  /**
   * Stop processing webhooks
   */
  async stopProcessing(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  /**
   * Clean up old jobs
   */
  async clean(grace: number = 24 * 60 * 60 * 1000): Promise<void> {
    await this.queue.clean(grace, 100, 'completed');
    await this.queue.clean(grace, 100, 'failed');
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    await this.stopProcessing();
    await this.queue.close();
    await this.queueEvents.close();
    await this.connection.quit();
  }

  private getPriority(type: MpesaWebhookJob['type']): number {
    // Higher priority for time-sensitive callbacks
    switch (type) {
      case 'stk_callback':
        return 1;
      case 'c2b_callback':
        return 1;
      case 'b2c_result':
        return 2;
      case 'timeout':
        return 3;
      default:
        return 5;
    }
  }

  private setupEventListeners(): void {
    this.queueEvents.on('completed', ({ jobId }) => {
      console.log(`📨 Webhook ${jobId} processed successfully`);
    });

    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      console.error(`📨 Webhook ${jobId} processing failed:`, failedReason);
    });

    this.queueEvents.on('progress', ({ jobId, data }) => {
      console.log(`📨 Webhook ${jobId} progress:`, data);
    });
  }
}

/**
 * Express Middleware with Queue Integration
 */
export function mpesaQueueMiddleware(webhookQueue: MpesaWebhookQueue) {
  return async (req: any, res: any, next: any) => {
    try {
      // Determine webhook type from URL or body
      const type = req.path.includes('stk') ? 'stk_callback' : 'c2b_callback';

      // Add to queue instead of processing immediately
      const jobId = await webhookQueue.addWebhook(type, req.body, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString(),
      });

      // Respond immediately to MPesa
      res.json({
        ResultCode: 0,
        ResultDesc: 'Success',
        QueueJobId: jobId,
      });
    } catch (error: any) {
      console.error('Queue middleware error:', error);
      res.status(500).json({
        ResultCode: 1,
        ResultDesc: 'Internal server error',
      });
    }
  };
}

/**
 * Example: Process webhooks from queue
 */
export async function processWebhook(job: MpesaWebhookJob): Promise<void> {
  const { type, payload, timestamp } = job;

  console.log(`Processing ${type} webhook from ${new Date(timestamp).toISOString()}`);

  try {
    switch (type) {
      case 'stk_callback':
        await handleSTKCallback(payload);
        break;
      case 'c2b_callback':
        await handleC2BCallback(payload);
        break;
      case 'b2c_result':
        await handleB2CResult(payload);
        break;
      case 'timeout':
        await handleTimeout(payload);
        break;
    }
  } catch (error: any) {
    console.error(`Error processing ${type}:`, error);
    throw error; // Let BullMQ handle retries
  }
}

async function handleSTKCallback(payload: any): Promise<void> {
  // Your business logic here
  // e.g., Update database, send notifications, etc.
  console.log('STK Callback:', payload);
}

async function handleC2BCallback(payload: any): Promise<void> {
  console.log('C2B Callback:', payload);
}

async function handleB2CResult(payload: any): Promise<void> {
  console.log('B2C Result:', payload);
}

async function handleTimeout(payload: any): Promise<void> {
  console.log('Timeout:', payload);
}
