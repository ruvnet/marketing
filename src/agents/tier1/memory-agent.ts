/**
 * Memory Agent - Cross-Session State Management via Ruvector
 * Tier 1: Coordination
 *
 * Responsibilities:
 * - Vector-based semantic memory storage
 * - Session state persistence
 * - Cross-session knowledge retrieval
 * - Memory consolidation and cleanup
 * - HNSW-powered similarity search
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  AgentConfig,
  TaskContext,
  DomainEvent,
  EventType,
  VectorEmbedding,
  SimilarityResult,
} from '../../types/index.js';
import { BaseAgent, AgentDependencies } from '../base-agent.js';

// ============================================================================
// Types
// ============================================================================

export interface MemoryEntry {
  id: string;
  type: 'campaign' | 'creative' | 'insight' | 'decision' | 'pattern' | 'session';
  content: string;
  embedding?: number[];
  metadata: Record<string, unknown>;
  ttl?: number; // Time to live in ms
  createdAt: Date;
  accessedAt: Date;
  accessCount: number;
}

export interface MemoryInput {
  action: 'store' | 'retrieve' | 'search' | 'consolidate' | 'cleanup' | 'stats';
  entry?: Partial<MemoryEntry>;
  query?: {
    text?: string;
    embedding?: number[];
    type?: MemoryEntry['type'];
    limit?: number;
    minScore?: number;
  };
  options?: {
    ttl?: number;
    forceRefresh?: boolean;
    consolidationThreshold?: number;
  };
}

export interface MemoryOutput {
  action: string;
  result: {
    entry?: MemoryEntry;
    entries?: MemoryEntry[];
    searchResults?: SimilarityResult[];
    stats?: MemoryStats;
    consolidated?: number;
    cleaned?: number;
  };
}

export interface MemoryStats {
  totalEntries: number;
  byType: Record<string, number>;
  avgAccessCount: number;
  oldestEntry: Date;
  newestEntry: Date;
  memoryUsageMb: number;
}

// ============================================================================
// Configuration
// ============================================================================

export const memoryConfig: AgentConfig = {
  id: 'memory',
  tier: 1,
  name: 'Memory Agent',
  description: 'Cross-session state management with vector-based semantic memory',
  capabilities: [
    {
      id: 'memory_storage',
      name: 'Memory Storage',
      description: 'Store entries with vector embeddings for semantic retrieval',
      inputTypes: ['memory_entry', 'store_request'],
      outputTypes: ['stored_entry'],
    },
    {
      id: 'semantic_search',
      name: 'Semantic Search',
      description: 'Search memory using vector similarity (HNSW)',
      inputTypes: ['search_query', 'embedding'],
      outputTypes: ['search_results'],
    },
    {
      id: 'session_management',
      name: 'Session Management',
      description: 'Manage cross-session state and context',
      inputTypes: ['session_state'],
      outputTypes: ['session_context'],
    },
    {
      id: 'memory_consolidation',
      name: 'Memory Consolidation',
      description: 'Consolidate and optimize stored memories',
      inputTypes: ['consolidation_request'],
      outputTypes: ['consolidation_report'],
    },
  ],
  maxConcurrency: 5,
  timeoutMs: 10000,
  priority: 95,
  dependencies: [],
};

// ============================================================================
// Vector Operations (Mock Ruvector Integration)
// ============================================================================

class VectorStore {
  private entries: Map<string, MemoryEntry>;
  private embeddings: Map<string, number[]>;
  private dimension: number = 384; // Default embedding dimension

  constructor() {
    this.entries = new Map();
    this.embeddings = new Map();
  }

  /**
   * Store entry with embedding
   */
  async store(entry: MemoryEntry): Promise<void> {
    this.entries.set(entry.id, entry);
    if (entry.embedding) {
      this.embeddings.set(entry.id, entry.embedding);
    }
  }

  /**
   * Retrieve entry by ID
   */
  async retrieve(id: string): Promise<MemoryEntry | undefined> {
    const entry = this.entries.get(id);
    if (entry) {
      entry.accessedAt = new Date();
      entry.accessCount++;
    }
    return entry;
  }

  /**
   * Search by vector similarity (HNSW-like)
   */
  async search(
    query: number[],
    limit: number = 10,
    minScore: number = 0.5
  ): Promise<SimilarityResult[]> {
    const results: SimilarityResult[] = [];

    for (const [id, embedding] of this.embeddings) {
      const score = this.cosineSimilarity(query, embedding);
      if (score >= minScore) {
        const entry = this.entries.get(id);
        results.push({
          id,
          score,
          metadata: entry?.metadata ?? {},
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Search by type
   */
  async searchByType(type: MemoryEntry['type'], limit: number = 100): Promise<MemoryEntry[]> {
    const results: MemoryEntry[] = [];
    for (const entry of this.entries.values()) {
      if (entry.type === type) {
        results.push(entry);
      }
    }
    return results
      .sort((a, b) => b.accessedAt.getTime() - a.accessedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Delete entry
   */
  async delete(id: string): Promise<boolean> {
    this.embeddings.delete(id);
    return this.entries.delete(id);
  }

  /**
   * Get all entries
   */
  async getAll(): Promise<MemoryEntry[]> {
    return Array.from(this.entries.values());
  }

  /**
   * Get stats
   */
  async getStats(): Promise<MemoryStats> {
    const entries = Array.from(this.entries.values());
    const byType: Record<string, number> = {};

    let totalAccessCount = 0;
    let oldest = new Date();
    let newest = new Date(0);

    for (const entry of entries) {
      byType[entry.type] = (byType[entry.type] ?? 0) + 1;
      totalAccessCount += entry.accessCount;
      if (entry.createdAt < oldest) oldest = entry.createdAt;
      if (entry.createdAt > newest) newest = entry.createdAt;
    }

    return {
      totalEntries: entries.length,
      byType,
      avgAccessCount: entries.length > 0 ? totalAccessCount / entries.length : 0,
      oldestEntry: oldest,
      newestEntry: newest,
      memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    };
  }

  /**
   * Cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Generate mock embedding (placeholder for real embedding model)
   */
  generateEmbedding(text: string): number[] {
    // Simple hash-based mock embedding
    const embedding = new Array(this.dimension).fill(0);
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      embedding[i % this.dimension] += charCode / 1000;
    }
    // Normalize
    const norm = Math.sqrt(embedding.reduce((a, b) => a + b * b, 0));
    return embedding.map((v) => v / (norm || 1));
  }
}

// ============================================================================
// Memory Agent Implementation
// ============================================================================

export class MemoryAgent extends BaseAgent<MemoryInput, MemoryOutput> {
  private vectorStore: VectorStore;
  private sessionContext: Map<string, unknown>;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(deps?: AgentDependencies) {
    super(memoryConfig, deps);
    this.vectorStore = new VectorStore();
    this.sessionContext = new Map();
  }

  /**
   * Main processing logic
   */
  protected async process(
    input: MemoryInput,
    context: TaskContext
  ): Promise<MemoryOutput> {
    this.logger.info('Processing memory request', { action: input.action });

    switch (input.action) {
      case 'store':
        return this.storeEntry(input, context);
      case 'retrieve':
        return this.retrieveEntry(input);
      case 'search':
        return this.searchMemory(input);
      case 'consolidate':
        return this.consolidateMemory(input);
      case 'cleanup':
        return this.cleanupMemory(input);
      case 'stats':
        return this.getMemoryStats();
      default:
        throw new Error(`Unknown action: ${input.action}`);
    }
  }

  /**
   * Store a memory entry
   */
  private async storeEntry(
    input: MemoryInput,
    context: TaskContext
  ): Promise<MemoryOutput> {
    if (!input.entry) {
      throw new Error('Entry is required for store action');
    }

    const entry: MemoryEntry = {
      id: input.entry.id ?? uuidv4(),
      type: input.entry.type ?? 'insight',
      content: input.entry.content ?? '',
      embedding: input.entry.embedding ??
        this.vectorStore.generateEmbedding(input.entry.content ?? ''),
      metadata: {
        ...input.entry.metadata,
        correlationId: context.correlationId,
        campaignId: context.campaignId,
      },
      ttl: input.options?.ttl,
      createdAt: new Date(),
      accessedAt: new Date(),
      accessCount: 0,
    };

    await this.vectorStore.store(entry);
    this.logger.info('Memory entry stored', { entryId: entry.id, type: entry.type });

    return {
      action: 'store',
      result: { entry },
    };
  }

  /**
   * Retrieve a specific entry
   */
  private async retrieveEntry(input: MemoryInput): Promise<MemoryOutput> {
    if (!input.entry?.id) {
      throw new Error('Entry ID is required for retrieve action');
    }

    const entry = await this.vectorStore.retrieve(input.entry.id);

    if (!entry) {
      throw new Error(`Entry not found: ${input.entry.id}`);
    }

    return {
      action: 'retrieve',
      result: { entry },
    };
  }

  /**
   * Search memory using vector similarity or type filter
   */
  private async searchMemory(input: MemoryInput): Promise<MemoryOutput> {
    const { query } = input;

    if (!query) {
      throw new Error('Query is required for search action');
    }

    let searchResults: SimilarityResult[] = [];
    let entries: MemoryEntry[] = [];

    if (query.embedding || query.text) {
      const embedding = query.embedding ??
        this.vectorStore.generateEmbedding(query.text ?? '');
      searchResults = await this.vectorStore.search(
        embedding,
        query.limit ?? 10,
        query.minScore ?? 0.5
      );
    } else if (query.type) {
      entries = await this.vectorStore.searchByType(query.type, query.limit ?? 100);
    }

    return {
      action: 'search',
      result: { searchResults, entries },
    };
  }

  /**
   * Consolidate similar memories
   */
  private async consolidateMemory(input: MemoryInput): Promise<MemoryOutput> {
    const threshold = input.options?.consolidationThreshold ?? 0.95;
    const allEntries = await this.vectorStore.getAll();
    let consolidated = 0;

    // Find and merge highly similar entries
    const processed = new Set<string>();

    for (const entry of allEntries) {
      if (processed.has(entry.id) || !entry.embedding) continue;

      const similar = await this.vectorStore.search(entry.embedding, 5, threshold);
      const toMerge = similar.filter(
        (s) => s.id !== entry.id && !processed.has(s.id)
      );

      if (toMerge.length > 0) {
        // Merge metadata and increase access count
        for (const s of toMerge) {
          const similarEntry = await this.vectorStore.retrieve(s.id);
          if (similarEntry) {
            entry.accessCount += similarEntry.accessCount;
            entry.metadata = { ...entry.metadata, ...similarEntry.metadata };
            await this.vectorStore.delete(s.id);
            processed.add(s.id);
            consolidated++;
          }
        }
        await this.vectorStore.store(entry);
      }
      processed.add(entry.id);
    }

    this.logger.info('Memory consolidation complete', { consolidated });

    return {
      action: 'consolidate',
      result: { consolidated },
    };
  }

  /**
   * Clean up expired entries
   */
  private async cleanupMemory(input: MemoryInput): Promise<MemoryOutput> {
    const allEntries = await this.vectorStore.getAll();
    const now = Date.now();
    let cleaned = 0;

    for (const entry of allEntries) {
      if (entry.ttl && now - entry.createdAt.getTime() > entry.ttl) {
        await this.vectorStore.delete(entry.id);
        cleaned++;
      }
    }

    this.logger.info('Memory cleanup complete', { cleaned });

    return {
      action: 'cleanup',
      result: { cleaned },
    };
  }

  /**
   * Get memory statistics
   */
  private async getMemoryStats(): Promise<MemoryOutput> {
    const stats = await this.vectorStore.getStats();

    return {
      action: 'stats',
      result: { stats },
    };
  }

  // ============================================================================
  // Public API for other agents
  // ============================================================================

  /**
   * Store campaign memory
   */
  async storeCampaignMemory(
    campaignId: string,
    content: string,
    metadata: Record<string, unknown> = {}
  ): Promise<MemoryEntry> {
    const result = await this.process(
      {
        action: 'store',
        entry: {
          type: 'campaign',
          content,
          metadata: { campaignId, ...metadata },
        },
      },
      { correlationId: uuidv4(), campaignId, metadata: {} }
    );
    return result.result.entry!;
  }

  /**
   * Search for similar patterns
   */
  async findSimilarPatterns(
    text: string,
    limit: number = 5
  ): Promise<SimilarityResult[]> {
    const result = await this.process(
      {
        action: 'search',
        query: { text, limit, minScore: 0.6 },
      },
      { correlationId: uuidv4(), metadata: {} }
    );
    return result.result.searchResults ?? [];
  }

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  protected async onInitialize(): Promise<void> {
    this.logger.info('Memory agent initializing');

    // Start periodic cleanup
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.cleanupMemory({
          action: 'cleanup',
        });
      } catch (error) {
        this.logger.error('Periodic cleanup failed', error as Error);
      }
    }, 300000); // Every 5 minutes
  }

  protected async onShutdown(): Promise<void> {
    this.logger.info('Memory agent shutting down');

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Final consolidation
    await this.consolidateMemory({ action: 'consolidate' });
  }

  protected getSubscribedEvents(): EventType[] {
    return [
      'campaign.created',
      'campaign.optimized',
      'creative.created',
      'intelligence.pattern_detected',
    ];
  }

  protected async handleEvent(event: DomainEvent): Promise<void> {
    // Auto-store significant events as memories
    switch (event.type) {
      case 'intelligence.pattern_detected':
        await this.vectorStore.store({
          id: uuidv4(),
          type: 'pattern',
          content: JSON.stringify(event.payload),
          embedding: this.vectorStore.generateEmbedding(JSON.stringify(event.payload)),
          metadata: { eventId: event.id, eventType: event.type },
          createdAt: new Date(),
          accessedAt: new Date(),
          accessCount: 0,
        });
        break;

      case 'campaign.optimized':
        await this.vectorStore.store({
          id: uuidv4(),
          type: 'decision',
          content: JSON.stringify(event.payload),
          embedding: this.vectorStore.generateEmbedding(JSON.stringify(event.payload)),
          metadata: {
            eventId: event.id,
            eventType: event.type,
            campaignId: event.aggregateId,
          },
          createdAt: new Date(),
          accessedAt: new Date(),
          accessCount: 0,
        });
        break;
    }
  }
}
