/**
 * Connection Pool
 * Efficient management of database and service connections
 */

import { EventEmitter } from 'eventemitter3';
import { createLogger } from '../core/logger';

const logger = createLogger('connection-pool');

export interface PoolConfig {
  minConnections: number;
  maxConnections: number;
  acquireTimeoutMs: number;
  idleTimeoutMs: number;
  maxWaitingClients: number;
  validateOnAcquire: boolean;
}

export interface Connection<T = unknown> {
  id: string;
  resource: T;
  createdAt: Date;
  lastUsedAt: Date;
  useCount: number;
}

export interface PoolStats {
  totalConnections: number;
  availableConnections: number;
  pendingAcquires: number;
  totalAcquires: number;
  totalReleases: number;
  totalCreated: number;
  totalDestroyed: number;
}

export interface ConnectionFactory<T> {
  create(): Promise<T>;
  validate(resource: T): Promise<boolean>;
  destroy(resource: T): Promise<void>;
}

/**
 * Generic connection pool implementation
 */
export class ConnectionPool<T> extends EventEmitter {
  private readonly config: PoolConfig;
  private readonly factory: ConnectionFactory<T>;
  private readonly available: Connection<T>[] = [];
  private readonly inUse: Map<string, Connection<T>> = new Map();
  private readonly waiting: Array<{
    resolve: (conn: Connection<T>) => void;
    reject: (error: Error) => void;
    timeoutId: NodeJS.Timeout;
  }> = [];
  private idleCheckTimer: NodeJS.Timeout | null = null;
  private connectionIdCounter = 0;
  private stats = {
    totalAcquires: 0,
    totalReleases: 0,
    totalCreated: 0,
    totalDestroyed: 0,
  };

  constructor(factory: ConnectionFactory<T>, config: Partial<PoolConfig> = {}) {
    super();
    this.factory = factory;
    this.config = {
      minConnections: config.minConnections ?? 2,
      maxConnections: config.maxConnections ?? 10,
      acquireTimeoutMs: config.acquireTimeoutMs ?? 30000,
      idleTimeoutMs: config.idleTimeoutMs ?? 300000,
      maxWaitingClients: config.maxWaitingClients ?? 50,
      validateOnAcquire: config.validateOnAcquire ?? true,
    };

    this.startIdleCheck();
  }

  /**
   * Initialize the pool with minimum connections
   */
  async initialize(): Promise<void> {
    logger.info('Initializing connection pool', {
      minConnections: this.config.minConnections,
      maxConnections: this.config.maxConnections,
    });

    const promises: Promise<void>[] = [];
    for (let i = 0; i < this.config.minConnections; i++) {
      promises.push(this.createConnection().then((conn) => {
        this.available.push(conn);
      }));
    }

    await Promise.all(promises);
    logger.info('Connection pool initialized', { connections: this.available.length });
  }

  /**
   * Acquire a connection from the pool
   */
  async acquire(): Promise<Connection<T>> {
    this.stats.totalAcquires++;

    // Try to get an available connection
    while (this.available.length > 0) {
      const conn = this.available.pop()!;

      // Validate if configured
      if (this.config.validateOnAcquire) {
        const valid = await this.validateConnection(conn);
        if (!valid) {
          await this.destroyConnection(conn);
          continue;
        }
      }

      conn.lastUsedAt = new Date();
      conn.useCount++;
      this.inUse.set(conn.id, conn);
      return conn;
    }

    // No available connections - can we create more?
    if (this.totalConnections < this.config.maxConnections) {
      const conn = await this.createConnection();
      conn.lastUsedAt = new Date();
      conn.useCount++;
      this.inUse.set(conn.id, conn);
      return conn;
    }

    // At max capacity - wait for a connection
    if (this.waiting.length >= this.config.maxWaitingClients) {
      throw new Error('Connection pool exhausted and waiting queue is full');
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const index = this.waiting.findIndex((w) => w.resolve === resolve);
        if (index >= 0) {
          this.waiting.splice(index, 1);
          reject(new Error('Connection acquire timeout'));
        }
      }, this.config.acquireTimeoutMs);

      this.waiting.push({ resolve, reject, timeoutId });
    });
  }

  /**
   * Release a connection back to the pool
   */
  async release(conn: Connection<T>): Promise<void> {
    this.stats.totalReleases++;

    if (!this.inUse.has(conn.id)) {
      logger.warn('Attempted to release unknown connection', { connectionId: conn.id });
      return;
    }

    this.inUse.delete(conn.id);
    conn.lastUsedAt = new Date();

    // If there are waiting clients, give them this connection
    if (this.waiting.length > 0) {
      const waiting = this.waiting.shift()!;
      clearTimeout(waiting.timeoutId);
      conn.useCount++;
      this.inUse.set(conn.id, conn);
      waiting.resolve(conn);
      return;
    }

    // Otherwise, add back to available pool
    this.available.push(conn);
  }

  /**
   * Execute a function with an acquired connection
   */
  async withConnection<R>(fn: (resource: T) => Promise<R>): Promise<R> {
    const conn = await this.acquire();
    try {
      return await fn(conn.resource);
    } finally {
      await this.release(conn);
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): PoolStats {
    return {
      totalConnections: this.totalConnections,
      availableConnections: this.available.length,
      pendingAcquires: this.waiting.length,
      ...this.stats,
    };
  }

  /**
   * Drain and close the pool
   */
  async drain(): Promise<void> {
    logger.info('Draining connection pool');

    // Stop accepting new requests
    if (this.idleCheckTimer) {
      clearInterval(this.idleCheckTimer);
      this.idleCheckTimer = null;
    }

    // Reject waiting clients
    for (const waiting of this.waiting) {
      clearTimeout(waiting.timeoutId);
      waiting.reject(new Error('Connection pool is draining'));
    }
    this.waiting.length = 0;

    // Destroy all connections
    const destroyPromises: Promise<void>[] = [];

    for (const conn of this.available) {
      destroyPromises.push(this.destroyConnection(conn));
    }
    this.available.length = 0;

    for (const conn of this.inUse.values()) {
      destroyPromises.push(this.destroyConnection(conn));
    }
    this.inUse.clear();

    await Promise.all(destroyPromises);
    logger.info('Connection pool drained');
  }

  private get totalConnections(): number {
    return this.available.length + this.inUse.size;
  }

  private async createConnection(): Promise<Connection<T>> {
    const id = `conn_${++this.connectionIdCounter}`;
    const resource = await this.factory.create();

    this.stats.totalCreated++;

    const conn: Connection<T> = {
      id,
      resource,
      createdAt: new Date(),
      lastUsedAt: new Date(),
      useCount: 0,
    };

    this.emit('connection:created', { id });
    logger.debug('Connection created', { connectionId: id });

    return conn;
  }

  private async validateConnection(conn: Connection<T>): Promise<boolean> {
    try {
      return await this.factory.validate(conn.resource);
    } catch {
      return false;
    }
  }

  private async destroyConnection(conn: Connection<T>): Promise<void> {
    try {
      await this.factory.destroy(conn.resource);
      this.stats.totalDestroyed++;
      this.emit('connection:destroyed', { id: conn.id });
      logger.debug('Connection destroyed', { connectionId: conn.id });
    } catch (error) {
      logger.error(`Error destroying connection ${conn.id}`, error instanceof Error ? error : new Error(String(error)));
    }
  }

  private startIdleCheck(): void {
    this.idleCheckTimer = setInterval(() => {
      this.checkIdleConnections();
    }, 60000);

    this.idleCheckTimer.unref();
  }

  private async checkIdleConnections(): Promise<void> {
    const now = Date.now();
    const toDestroy: Connection<T>[] = [];

    // Find idle connections exceeding timeout
    for (const conn of this.available) {
      const idleTime = now - conn.lastUsedAt.getTime();
      if (idleTime > this.config.idleTimeoutMs) {
        // Keep minimum connections
        if (this.totalConnections - toDestroy.length > this.config.minConnections) {
          toDestroy.push(conn);
        }
      }
    }

    // Remove from available and destroy
    for (const conn of toDestroy) {
      const index = this.available.indexOf(conn);
      if (index >= 0) {
        this.available.splice(index, 1);
        await this.destroyConnection(conn);
      }
    }

    if (toDestroy.length > 0) {
      logger.debug('Idle connections cleaned up', { count: toDestroy.length });
    }
  }
}

// Factory for common connection types
export function createGenericPool<T>(
  createFn: () => Promise<T>,
  destroyFn: (resource: T) => Promise<void>,
  validateFn?: (resource: T) => Promise<boolean>,
  config?: Partial<PoolConfig>
): ConnectionPool<T> {
  const factory: ConnectionFactory<T> = {
    create: createFn,
    destroy: destroyFn,
    validate: validateFn ?? (async () => true),
  };

  return new ConnectionPool<T>(factory, config);
}
