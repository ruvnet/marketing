/**
 * Cache Layer
 * High-performance caching for frequently accessed data
 */

import { createLogger } from '../core/logger';

const logger = createLogger('cache');

export interface CacheEntry<T> {
  value: T;
  createdAt: number;
  expiresAt: number;
  hits: number;
}

export interface CacheConfig {
  maxSize: number;
  defaultTtlMs: number;
  cleanupIntervalMs: number;
  onEvict?: (key: string, value: unknown) => void;
}

export interface CacheStats {
  size: number;
  maxSize: number;
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
}

/**
 * LRU Cache implementation with TTL support
 */
export class LRUCache<T = unknown> {
  private readonly cache: Map<string, CacheEntry<T>> = new Map();
  private readonly config: CacheConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: config.maxSize ?? 1000,
      defaultTtlMs: config.defaultTtlMs ?? 300000, // 5 minutes
      cleanupIntervalMs: config.cleanupIntervalMs ?? 60000, // 1 minute
      onEvict: config.onEvict,
    };

    this.startCleanup();
  }

  /**
   * Get a value from the cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      this.stats.misses++;
      return undefined;
    }

    // Update LRU order by re-inserting
    this.cache.delete(key);
    entry.hits++;
    this.cache.set(key, entry);

    this.stats.hits++;
    return entry.value;
  }

  /**
   * Set a value in the cache
   */
  set(key: string, value: T, ttlMs?: number): void {
    // Evict if at capacity
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }

    const now = Date.now();
    const entry: CacheEntry<T> = {
      value,
      createdAt: now,
      expiresAt: now + (ttlMs ?? this.config.defaultTtlMs),
      hits: 0,
    };

    this.cache.set(key, entry);
  }

  /**
   * Delete a value from the cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry && this.config.onEvict) {
      this.config.onEvict(key, entry.value);
    }
    return this.cache.delete(key);
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Get or set a value
   */
  async getOrSet(
    key: string,
    factory: () => Promise<T>,
    ttlMs?: number
  ): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, ttlMs);
    return value;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    if (this.config.onEvict) {
      for (const [key, entry] of this.cache) {
        this.config.onEvict(key, entry.value);
      }
    }
    this.cache.clear();
    logger.debug('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      evictions: this.stats.evictions,
    };
  }

  /**
   * Stop the cache (cleanup timer)
   */
  stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Evict oldest entry (LRU)
   */
  private evictOldest(): void {
    const firstKey = this.cache.keys().next().value;
    if (firstKey) {
      this.delete(firstKey);
      this.stats.evictions++;
    }
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupIntervalMs);

    // Don't prevent process exit
    this.cleanupTimer.unref();
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('Cache cleanup completed', { cleaned, remaining: this.cache.size });
    }
  }
}

/**
 * Multi-tier cache with L1 (memory) and L2 (Redis) layers
 */
export class TieredCache<T = unknown> {
  private readonly l1: LRUCache<T>;
  private readonly l2Client: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string, ttl?: number) => Promise<void>;
    del: (key: string) => Promise<void>;
  } | null;
  private readonly l2Prefix: string;

  constructor(
    l1Config: Partial<CacheConfig> = {},
    l2Client?: {
      get: (key: string) => Promise<string | null>;
      set: (key: string, value: string, ttl?: number) => Promise<void>;
      del: (key: string) => Promise<void>;
    },
    l2Prefix: string = 'cache:'
  ) {
    this.l1 = new LRUCache<T>(l1Config);
    this.l2Client = l2Client || null;
    this.l2Prefix = l2Prefix;
  }

  async get(key: string): Promise<T | undefined> {
    // Try L1 first
    const l1Value = this.l1.get(key);
    if (l1Value !== undefined) {
      return l1Value;
    }

    // Try L2 if available
    if (this.l2Client) {
      const l2Key = `${this.l2Prefix}${key}`;
      const l2Value = await this.l2Client.get(l2Key);

      if (l2Value) {
        const value = JSON.parse(l2Value) as T;
        // Populate L1 for future requests
        this.l1.set(key, value);
        return value;
      }
    }

    return undefined;
  }

  async set(key: string, value: T, ttlMs?: number): Promise<void> {
    // Set in L1
    this.l1.set(key, value, ttlMs);

    // Set in L2 if available
    if (this.l2Client) {
      const l2Key = `${this.l2Prefix}${key}`;
      const ttlSeconds = ttlMs ? Math.ceil(ttlMs / 1000) : undefined;
      await this.l2Client.set(l2Key, JSON.stringify(value), ttlSeconds);
    }
  }

  async delete(key: string): Promise<void> {
    this.l1.delete(key);

    if (this.l2Client) {
      const l2Key = `${this.l2Prefix}${key}`;
      await this.l2Client.del(l2Key);
    }
  }

  async getOrSet(
    key: string,
    factory: () => Promise<T>,
    ttlMs?: number
  ): Promise<T> {
    const cached = await this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttlMs);
    return value;
  }

  getL1Stats(): CacheStats {
    return this.l1.getStats();
  }

  stop(): void {
    this.l1.stop();
  }
}

/**
 * Memoization decorator for functions
 */
export function memoize<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  keyFn: (...args: Parameters<T>) => string = (...args) => JSON.stringify(args),
  ttlMs: number = 300000
): T {
  const cache = new LRUCache<Awaited<ReturnType<T>>>({ defaultTtlMs: ttlMs });

  return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const key = keyFn(...args);
    return cache.getOrSet(key, () => fn(...args) as Promise<Awaited<ReturnType<T>>>);
  }) as T;
}

// Singleton caches for common use cases
let campaignCache: LRUCache | null = null;
let creativeCache: LRUCache | null = null;
let analyticsCache: LRUCache | null = null;

export function getCampaignCache(): LRUCache {
  if (!campaignCache) {
    campaignCache = new LRUCache({ maxSize: 1000, defaultTtlMs: 60000 });
  }
  return campaignCache;
}

export function getCreativeCache(): LRUCache {
  if (!creativeCache) {
    creativeCache = new LRUCache({ maxSize: 5000, defaultTtlMs: 120000 });
  }
  return creativeCache;
}

export function getAnalyticsCache(): LRUCache {
  if (!analyticsCache) {
    analyticsCache = new LRUCache({ maxSize: 500, defaultTtlMs: 30000 });
  }
  return analyticsCache;
}
