/**
 * Batch Processor
 * Efficient batching of operations for improved throughput
 */

import { EventEmitter } from 'eventemitter3';
import { createLogger } from '../core/logger';

const logger = createLogger('batch-processor');

export interface BatchConfig {
  maxBatchSize: number;
  maxWaitMs: number;
  concurrency: number;
}

export interface BatchResult<T, R> {
  item: T;
  result?: R;
  error?: Error;
}

export type BatchProcessor<T, R> = (items: T[]) => Promise<R[]>;

/**
 * Automatic batching of operations
 * Collects items and processes them in batches for efficiency
 */
export class AutoBatcher<T, R> extends EventEmitter {
  private readonly config: BatchConfig;
  private readonly processor: BatchProcessor<T, R>;
  private pending: Array<{
    item: T;
    resolve: (result: R) => void;
    reject: (error: Error) => void;
  }> = [];
  private timer: NodeJS.Timeout | null = null;
  private processing = false;
  private stats = {
    totalItems: 0,
    totalBatches: 0,
    totalErrors: 0,
  };

  constructor(processor: BatchProcessor<T, R>, config: Partial<BatchConfig> = {}) {
    super();
    this.processor = processor;
    this.config = {
      maxBatchSize: config.maxBatchSize ?? 100,
      maxWaitMs: config.maxWaitMs ?? 50,
      concurrency: config.concurrency ?? 1,
    };
  }

  /**
   * Add an item to be processed
   */
  async add(item: T): Promise<R> {
    this.stats.totalItems++;

    return new Promise((resolve, reject) => {
      this.pending.push({ item, resolve, reject });

      // Trigger batch if at max size
      if (this.pending.length >= this.config.maxBatchSize) {
        this.flush();
      } else if (!this.timer) {
        // Start timer for batch collection
        this.timer = setTimeout(() => {
          this.flush();
        }, this.config.maxWaitMs);
      }
    });
  }

  /**
   * Add multiple items
   */
  async addMany(items: T[]): Promise<R[]> {
    return Promise.all(items.map((item) => this.add(item)));
  }

  /**
   * Flush pending items immediately
   */
  flush(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.pending.length === 0 || this.processing) {
      return;
    }

    this.processing = true;
    const batch = this.pending.splice(0, this.config.maxBatchSize);

    this.processBatch(batch)
      .then(() => {
        this.processing = false;
        // Process next batch if pending
        if (this.pending.length > 0) {
          this.flush();
        }
      })
      .catch(() => {
        this.processing = false;
      });
  }

  /**
   * Get statistics
   */
  getStats(): typeof this.stats {
    return { ...this.stats };
  }

  private async processBatch(
    batch: Array<{
      item: T;
      resolve: (result: R) => void;
      reject: (error: Error) => void;
    }>
  ): Promise<void> {
    this.stats.totalBatches++;
    const items = batch.map((b) => b.item);

    try {
      const results = await this.processor(items);

      // Match results to pending items
      for (let i = 0; i < batch.length; i++) {
        if (results[i] !== undefined) {
          batch[i].resolve(results[i]);
        } else {
          batch[i].reject(new Error('No result for item'));
          this.stats.totalErrors++;
        }
      }

      this.emit('batch:completed', { size: batch.length, success: true });
    } catch (error) {
      // Reject all items in the batch
      for (const pending of batch) {
        pending.reject(error as Error);
        this.stats.totalErrors++;
      }

      this.emit('batch:completed', { size: batch.length, success: false, error });
      logger.error(`Batch processing failed (size: ${batch.length})`, error instanceof Error ? error : new Error(String(error)));
    }
  }
}

/**
 * Parallel batch executor
 * Executes batches in parallel with controlled concurrency
 */
export class ParallelBatchExecutor<T, R> {
  private readonly batchSize: number;
  private readonly concurrency: number;
  private readonly processor: (item: T) => Promise<R>;

  constructor(
    processor: (item: T) => Promise<R>,
    options: { batchSize?: number; concurrency?: number } = {}
  ) {
    this.processor = processor;
    this.batchSize = options.batchSize ?? 100;
    this.concurrency = options.concurrency ?? 5;
  }

  /**
   * Execute on all items with controlled parallelism
   */
  async execute(items: T[]): Promise<BatchResult<T, R>[]> {
    const results: BatchResult<T, R>[] = [];
    const batches = this.createBatches(items);

    // Process batches with concurrency control
    const batchPromises: Promise<void>[] = [];
    let running = 0;
    let batchIndex = 0;

    const processBatch = async (): Promise<void> => {
      while (batchIndex < batches.length) {
        const batch = batches[batchIndex++];
        const batchResults = await this.processBatch(batch);
        results.push(...batchResults);
      }
    };

    for (let i = 0; i < Math.min(this.concurrency, batches.length); i++) {
      batchPromises.push(processBatch());
    }

    await Promise.all(batchPromises);

    return results;
  }

  /**
   * Execute with progress callback
   */
  async executeWithProgress(
    items: T[],
    onProgress: (completed: number, total: number) => void
  ): Promise<BatchResult<T, R>[]> {
    const results: BatchResult<T, R>[] = [];
    let completed = 0;
    const total = items.length;

    const batches = this.createBatches(items);

    for (const batch of batches) {
      const batchResults = await this.processBatch(batch);
      results.push(...batchResults);
      completed += batch.length;
      onProgress(completed, total);
    }

    return results;
  }

  private createBatches(items: T[]): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += this.batchSize) {
      batches.push(items.slice(i, i + this.batchSize));
    }
    return batches;
  }

  private async processBatch(batch: T[]): Promise<BatchResult<T, R>[]> {
    const results: BatchResult<T, R>[] = [];

    await Promise.all(
      batch.map(async (item) => {
        try {
          const result = await this.processor(item);
          results.push({ item, result });
        } catch (error) {
          results.push({ item, error: error as Error });
        }
      })
    );

    return results;
  }
}

/**
 * Debounced batch processor
 * Collects items and processes after a quiet period
 */
export class DebouncedBatcher<T, R> {
  private readonly processor: BatchProcessor<T, R>;
  private readonly debounceMs: number;
  private pending: T[] = [];
  private timer: NodeJS.Timeout | null = null;
  private currentPromise: Promise<R[]> | null = null;
  private resolvers: Array<(results: R[]) => void> = [];

  constructor(processor: BatchProcessor<T, R>, debounceMs: number = 100) {
    this.processor = processor;
    this.debounceMs = debounceMs;
  }

  /**
   * Add item to pending batch
   */
  add(item: T): Promise<R[]> {
    this.pending.push(item);

    if (this.timer) {
      clearTimeout(this.timer);
    }

    if (!this.currentPromise) {
      this.currentPromise = new Promise((resolve) => {
        this.resolvers.push(resolve);
      });
    }

    this.timer = setTimeout(() => {
      this.flush();
    }, this.debounceMs);

    return this.currentPromise;
  }

  /**
   * Flush immediately
   */
  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.pending.length === 0) {
      return;
    }

    const items = [...this.pending];
    const resolvers = [...this.resolvers];

    this.pending = [];
    this.resolvers = [];
    this.currentPromise = null;

    try {
      const results = await this.processor(items);
      for (const resolve of resolvers) {
        resolve(results);
      }
    } catch (error) {
      logger.error('Debounced batch processing failed', error instanceof Error ? error : new Error(String(error)));
    }
  }
}
