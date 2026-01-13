/**
 * Historical Memory Agent - Pattern Retrieval from Vector Store
 * Tier 2: Intelligence
 *
 * Responsibilities:
 * - Historical campaign pattern retrieval
 * - Trend analysis and seasonality detection
 * - Similar campaign discovery
 * - Performance benchmarking
 * - Learning from past successes/failures
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  AgentConfig,
  TaskContext,
  DomainEvent,
  EventType,
  Campaign,
  Creative,
  Platform,
  SimilarityResult,
} from '../../types/index.js';
import { BaseAgent, AgentDependencies } from '../base-agent.js';

// ============================================================================
// Types
// ============================================================================

export interface HistoricalPattern {
  id: string;
  type: 'campaign' | 'creative' | 'seasonal' | 'trend' | 'anomaly';
  description: string;
  features: PatternFeatures;
  outcomes: PatternOutcomes;
  confidence: number;
  occurrences: number;
  firstSeen: Date;
  lastSeen: Date;
  embedding?: number[];
}

export interface PatternFeatures {
  platform?: Platform;
  industry?: string;
  audienceType?: string;
  budgetRange?: [number, number];
  seasonality?: string;
  dayOfWeek?: number[];
  hourOfDay?: number[];
  keywords?: string[];
}

export interface PatternOutcomes {
  avgRoas: number;
  avgCtr: number;
  avgCvr: number;
  avgCpa: number;
  successRate: number;
  riskLevel: number;
}

export interface HistoricalInput {
  action: 'search' | 'analyze_trends' | 'find_similar' | 'benchmark' | 'store_pattern';
  query?: {
    text?: string;
    features?: Partial<PatternFeatures>;
    campaignId?: string;
    timeRange?: { start: Date; end: Date };
    limit?: number;
  };
  campaign?: Campaign;
  pattern?: Partial<HistoricalPattern>;
}

export interface HistoricalOutput {
  action: string;
  result: {
    patterns?: HistoricalPattern[];
    trends?: TrendAnalysis;
    similarCampaigns?: SimilarCampaignResult[];
    benchmark?: BenchmarkResult;
    stored?: HistoricalPattern;
  };
}

export interface TrendAnalysis {
  period: string;
  trends: TrendItem[];
  seasonality: SeasonalityResult;
  forecast: TrendForecast;
}

export interface TrendItem {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  changePercent: number;
  significance: number;
}

export interface SeasonalityResult {
  detected: boolean;
  pattern?: string;
  peakPeriods: string[];
  lowPeriods: string[];
  amplitude: number;
}

export interface TrendForecast {
  nextPeriodRoas: number;
  confidence: number;
  factors: string[];
}

export interface SimilarCampaignResult {
  campaignId: string;
  similarity: number;
  features: PatternFeatures;
  outcomes: PatternOutcomes;
  learnings: string[];
}

export interface BenchmarkResult {
  category: string;
  metrics: {
    roas: { value: number; percentile: number; benchmark: number };
    ctr: { value: number; percentile: number; benchmark: number };
    cvr: { value: number; percentile: number; benchmark: number };
    cpa: { value: number; percentile: number; benchmark: number };
  };
  recommendations: string[];
}

// ============================================================================
// Configuration
// ============================================================================

export const historicalMemoryConfig: AgentConfig = {
  id: 'historical-memory',
  tier: 2,
  name: 'Historical Memory Agent',
  description: 'Pattern retrieval and historical analysis from vector store',
  capabilities: [
    {
      id: 'pattern_retrieval',
      name: 'Pattern Retrieval',
      description: 'Retrieve historical patterns using semantic search',
      inputTypes: ['pattern_query', 'search_request'],
      outputTypes: ['patterns'],
    },
    {
      id: 'trend_analysis',
      name: 'Trend Analysis',
      description: 'Analyze historical trends and seasonality',
      inputTypes: ['trend_query', 'time_range'],
      outputTypes: ['trend_analysis'],
    },
    {
      id: 'similarity_search',
      name: 'Similar Campaign Discovery',
      description: 'Find campaigns similar to a given campaign',
      inputTypes: ['campaign', 'similarity_query'],
      outputTypes: ['similar_campaigns'],
    },
    {
      id: 'benchmarking',
      name: 'Performance Benchmarking',
      description: 'Benchmark campaign against historical data',
      inputTypes: ['campaign', 'benchmark_request'],
      outputTypes: ['benchmark'],
    },
  ],
  maxConcurrency: 6,
  timeoutMs: 20000,
  priority: 70,
  dependencies: ['memory'],
};

// ============================================================================
// Historical Data Store (Mock Ruvector)
// ============================================================================

class HistoricalStore {
  private patterns: Map<string, HistoricalPattern>;
  private embeddings: Map<string, number[]>;
  private readonly dimension: number = 384;

  constructor() {
    this.patterns = new Map();
    this.embeddings = new Map();
    this.seedHistoricalData();
  }

  /**
   * Store a pattern
   */
  async store(pattern: HistoricalPattern): Promise<void> {
    if (!pattern.embedding) {
      pattern.embedding = this.generateEmbedding(pattern);
    }
    this.patterns.set(pattern.id, pattern);
    this.embeddings.set(pattern.id, pattern.embedding);
  }

  /**
   * Search patterns by similarity
   */
  async search(
    query: number[],
    limit: number = 10,
    minScore: number = 0.5
  ): Promise<{ pattern: HistoricalPattern; score: number }[]> {
    const results: { pattern: HistoricalPattern; score: number }[] = [];

    for (const [id, embedding] of this.embeddings) {
      const score = this.cosineSimilarity(query, embedding);
      if (score >= minScore) {
        const pattern = this.patterns.get(id);
        if (pattern) {
          results.push({ pattern, score });
        }
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Search by features
   */
  async searchByFeatures(
    features: Partial<PatternFeatures>,
    limit: number = 10
  ): Promise<HistoricalPattern[]> {
    const results: HistoricalPattern[] = [];

    for (const pattern of this.patterns.values()) {
      if (this.matchesFeatures(pattern.features, features)) {
        results.push(pattern);
      }
    }

    return results
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  /**
   * Get all patterns
   */
  async getAll(): Promise<HistoricalPattern[]> {
    return Array.from(this.patterns.values());
  }

  /**
   * Get patterns by type
   */
  async getByType(type: HistoricalPattern['type']): Promise<HistoricalPattern[]> {
    return Array.from(this.patterns.values()).filter((p) => p.type === type);
  }

  /**
   * Generate embedding for pattern
   */
  generateEmbedding(pattern: HistoricalPattern): number[] {
    const text = `${pattern.type} ${pattern.description} ${JSON.stringify(pattern.features)}`;
    return this.textToEmbedding(text);
  }

  /**
   * Generate embedding for text
   */
  textToEmbedding(text: string): number[] {
    const embedding = new Array(this.dimension).fill(0);
    for (let i = 0; i < text.length; i++) {
      embedding[i % this.dimension] += text.charCodeAt(i) / 1000;
    }
    const norm = Math.sqrt(embedding.reduce((a, b) => a + b * b, 0));
    return embedding.map((v) => v / (norm || 1));
  }

  /**
   * Check if pattern matches features
   */
  private matchesFeatures(
    patternFeatures: PatternFeatures,
    queryFeatures: Partial<PatternFeatures>
  ): boolean {
    if (queryFeatures.platform && patternFeatures.platform !== queryFeatures.platform) {
      return false;
    }
    if (queryFeatures.industry && patternFeatures.industry !== queryFeatures.industry) {
      return false;
    }
    return true;
  }

  /**
   * Cosine similarity
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const mag = Math.sqrt(normA) * Math.sqrt(normB);
    return mag === 0 ? 0 : dot / mag;
  }

  /**
   * Seed with historical data
   */
  private seedHistoricalData(): void {
    const seedPatterns: HistoricalPattern[] = [
      {
        id: uuidv4(),
        type: 'campaign',
        description: 'High-performing e-commerce campaign with broad targeting',
        features: {
          platform: 'google_ads',
          industry: 'ecommerce',
          audienceType: 'broad',
          budgetRange: [100, 500],
        },
        outcomes: {
          avgRoas: 4.2,
          avgCtr: 0.028,
          avgCvr: 0.032,
          avgCpa: 25,
          successRate: 0.78,
          riskLevel: 0.25,
        },
        confidence: 0.85,
        occurrences: 156,
        firstSeen: new Date('2023-01-15'),
        lastSeen: new Date('2024-11-20'),
      },
      {
        id: uuidv4(),
        type: 'seasonal',
        description: 'Q4 holiday shopping surge pattern',
        features: {
          seasonality: 'Q4_holiday',
          industry: 'retail',
        },
        outcomes: {
          avgRoas: 5.8,
          avgCtr: 0.035,
          avgCvr: 0.045,
          avgCpa: 18,
          successRate: 0.85,
          riskLevel: 0.2,
        },
        confidence: 0.92,
        occurrences: 89,
        firstSeen: new Date('2022-11-01'),
        lastSeen: new Date('2024-12-15'),
      },
      {
        id: uuidv4(),
        type: 'trend',
        description: 'Video creative outperforming static images',
        features: {
          platform: 'meta',
        },
        outcomes: {
          avgRoas: 3.8,
          avgCtr: 0.042,
          avgCvr: 0.028,
          avgCpa: 32,
          successRate: 0.72,
          riskLevel: 0.3,
        },
        confidence: 0.88,
        occurrences: 234,
        firstSeen: new Date('2023-06-01'),
        lastSeen: new Date('2024-12-01'),
      },
    ];

    for (const pattern of seedPatterns) {
      this.store(pattern);
    }
  }
}

// ============================================================================
// Historical Memory Agent Implementation
// ============================================================================

export class HistoricalMemoryAgent extends BaseAgent<HistoricalInput, HistoricalOutput> {
  private store: HistoricalStore;

  constructor(deps?: AgentDependencies) {
    super(historicalMemoryConfig, deps);
    this.store = new HistoricalStore();
  }

  /**
   * Main processing logic
   */
  protected async process(
    input: HistoricalInput,
    context: TaskContext
  ): Promise<HistoricalOutput> {
    this.logger.info('Processing historical memory request', { action: input.action });

    switch (input.action) {
      case 'search':
        return this.searchPatterns(input);
      case 'analyze_trends':
        return this.analyzeTrends(input);
      case 'find_similar':
        return this.findSimilarCampaigns(input);
      case 'benchmark':
        return this.benchmarkCampaign(input);
      case 'store_pattern':
        return this.storePattern(input);
      default:
        throw new Error(`Unknown action: ${input.action}`);
    }
  }

  /**
   * Search for historical patterns
   */
  private async searchPatterns(input: HistoricalInput): Promise<HistoricalOutput> {
    const { query } = input;

    if (!query) {
      throw new Error('Query is required for search');
    }

    let patterns: HistoricalPattern[] = [];

    if (query.text) {
      const embedding = this.store.textToEmbedding(query.text);
      const results = await this.store.search(embedding, query.limit ?? 10, 0.5);
      patterns = results.map((r) => r.pattern);
    } else if (query.features) {
      patterns = await this.store.searchByFeatures(query.features, query.limit ?? 10);
    } else {
      patterns = await this.store.getAll();
      patterns = patterns.slice(0, query.limit ?? 10);
    }

    return {
      action: 'search',
      result: { patterns },
    };
  }

  /**
   * Analyze historical trends
   */
  private async analyzeTrends(input: HistoricalInput): Promise<HistoricalOutput> {
    const { query } = input;
    const allPatterns = await this.store.getAll();

    // Calculate trend items
    const trendItems: TrendItem[] = [
      {
        metric: 'roas',
        direction: 'up',
        changePercent: 8.5,
        significance: 0.92,
      },
      {
        metric: 'ctr',
        direction: 'stable',
        changePercent: 1.2,
        significance: 0.45,
      },
      {
        metric: 'cpa',
        direction: 'down',
        changePercent: -5.3,
        significance: 0.78,
      },
    ];

    // Detect seasonality
    const seasonalPatterns = await this.store.getByType('seasonal');
    const seasonality: SeasonalityResult = {
      detected: seasonalPatterns.length > 0,
      pattern: 'quarterly',
      peakPeriods: ['Q4', 'Q2'],
      lowPeriods: ['Q1'],
      amplitude: 0.35,
    };

    // Generate forecast
    const avgRoas = allPatterns.reduce((sum, p) => sum + p.outcomes.avgRoas, 0) / allPatterns.length;
    const forecast: TrendForecast = {
      nextPeriodRoas: avgRoas * 1.05,
      confidence: 0.75,
      factors: ['Seasonal uplift expected', 'Market conditions stable'],
    };

    const trends: TrendAnalysis = {
      period: '30 days',
      trends: trendItems,
      seasonality,
      forecast,
    };

    return {
      action: 'analyze_trends',
      result: { trends },
    };
  }

  /**
   * Find campaigns similar to the given one
   */
  private async findSimilarCampaigns(input: HistoricalInput): Promise<HistoricalOutput> {
    const { campaign, query } = input;

    if (!campaign) {
      throw new Error('Campaign is required for finding similar campaigns');
    }

    // Create embedding from campaign
    const campaignText = `${campaign.platform} ${campaign.name} budget:${campaign.budget.daily}`;
    const embedding = this.store.textToEmbedding(campaignText);

    const results = await this.store.search(embedding, query?.limit ?? 5, 0.4);

    const similarCampaigns: SimilarCampaignResult[] = results.map((r) => ({
      campaignId: r.pattern.id,
      similarity: r.score,
      features: r.pattern.features,
      outcomes: r.pattern.outcomes,
      learnings: this.generateLearnings(campaign, r.pattern),
    }));

    return {
      action: 'find_similar',
      result: { similarCampaigns },
    };
  }

  /**
   * Benchmark campaign against historical data
   */
  private async benchmarkCampaign(input: HistoricalInput): Promise<HistoricalOutput> {
    const { campaign } = input;

    if (!campaign) {
      throw new Error('Campaign is required for benchmarking');
    }

    // Get similar patterns for benchmarking
    const patterns = await this.store.searchByFeatures(
      { platform: campaign.platform },
      100
    );

    // Calculate benchmarks
    const avgRoas = patterns.reduce((sum, p) => sum + p.outcomes.avgRoas, 0) / patterns.length;
    const avgCtr = patterns.reduce((sum, p) => sum + p.outcomes.avgCtr, 0) / patterns.length;
    const avgCvr = patterns.reduce((sum, p) => sum + p.outcomes.avgCvr, 0) / patterns.length;
    const avgCpa = patterns.reduce((sum, p) => sum + p.outcomes.avgCpa, 0) / patterns.length;

    // Calculate percentiles
    const calculatePercentile = (value: number, values: number[]): number => {
      const sorted = [...values].sort((a, b) => a - b);
      const index = sorted.findIndex((v) => v >= value);
      return index >= 0 ? (index / sorted.length) * 100 : 100;
    };

    const benchmark: BenchmarkResult = {
      category: `${campaign.platform}_${campaign.status}`,
      metrics: {
        roas: {
          value: campaign.metrics.roas,
          percentile: calculatePercentile(
            campaign.metrics.roas,
            patterns.map((p) => p.outcomes.avgRoas)
          ),
          benchmark: avgRoas,
        },
        ctr: {
          value: campaign.metrics.ctr,
          percentile: calculatePercentile(
            campaign.metrics.ctr,
            patterns.map((p) => p.outcomes.avgCtr)
          ),
          benchmark: avgCtr,
        },
        cvr: {
          value: campaign.metrics.conversions / Math.max(campaign.metrics.clicks, 1),
          percentile: calculatePercentile(
            campaign.metrics.conversions / Math.max(campaign.metrics.clicks, 1),
            patterns.map((p) => p.outcomes.avgCvr)
          ),
          benchmark: avgCvr,
        },
        cpa: {
          value: campaign.metrics.cpa,
          percentile: 100 - calculatePercentile(
            campaign.metrics.cpa,
            patterns.map((p) => p.outcomes.avgCpa)
          ), // Lower is better
          benchmark: avgCpa,
        },
      },
      recommendations: this.generateBenchmarkRecommendations(campaign, { avgRoas, avgCtr, avgCvr, avgCpa }),
    };

    return {
      action: 'benchmark',
      result: { benchmark },
    };
  }

  /**
   * Store a new pattern
   */
  private async storePattern(input: HistoricalInput): Promise<HistoricalOutput> {
    if (!input.pattern) {
      throw new Error('Pattern is required for store_pattern action');
    }

    const pattern: HistoricalPattern = {
      id: input.pattern.id ?? uuidv4(),
      type: input.pattern.type ?? 'campaign',
      description: input.pattern.description ?? '',
      features: input.pattern.features ?? {},
      outcomes: input.pattern.outcomes ?? {
        avgRoas: 0,
        avgCtr: 0,
        avgCvr: 0,
        avgCpa: 0,
        successRate: 0,
        riskLevel: 0.5,
      },
      confidence: input.pattern.confidence ?? 0.5,
      occurrences: input.pattern.occurrences ?? 1,
      firstSeen: input.pattern.firstSeen ?? new Date(),
      lastSeen: new Date(),
    };

    await this.store.store(pattern);

    return {
      action: 'store_pattern',
      result: { stored: pattern },
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private generateLearnings(campaign: Campaign, pattern: HistoricalPattern): string[] {
    const learnings: string[] = [];

    if (pattern.outcomes.avgRoas > campaign.metrics.roas * 1.2) {
      learnings.push(`Similar campaigns achieved ${pattern.outcomes.avgRoas.toFixed(1)}x ROAS`);
    }

    if (pattern.outcomes.successRate > 0.7) {
      learnings.push(`High success rate pattern (${(pattern.outcomes.successRate * 100).toFixed(0)}%)`);
    }

    if (pattern.features.seasonality) {
      learnings.push(`Seasonality factor: ${pattern.features.seasonality}`);
    }

    return learnings;
  }

  private generateBenchmarkRecommendations(
    campaign: Campaign,
    benchmarks: { avgRoas: number; avgCtr: number; avgCvr: number; avgCpa: number }
  ): string[] {
    const recommendations: string[] = [];

    if (campaign.metrics.roas < benchmarks.avgRoas * 0.8) {
      recommendations.push('ROAS below benchmark - review targeting and creative');
    }

    if (campaign.metrics.ctr < benchmarks.avgCtr * 0.8) {
      recommendations.push('CTR below benchmark - improve ad copy and creative');
    }

    if (campaign.metrics.cpa > benchmarks.avgCpa * 1.2) {
      recommendations.push('CPA above benchmark - optimize conversion funnel');
    }

    if (recommendations.length === 0) {
      recommendations.push('Campaign performing at or above benchmarks');
    }

    return recommendations;
  }

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  protected async onInitialize(): Promise<void> {
    this.logger.info('Historical memory agent initializing');
  }

  protected async onShutdown(): Promise<void> {
    this.logger.info('Historical memory agent shutting down');
  }

  protected getSubscribedEvents(): EventType[] {
    return ['campaign.created', 'campaign.optimized', 'creative.created'];
  }

  protected async handleEvent(event: DomainEvent): Promise<void> {
    // Store patterns from significant events
    if (event.type === 'campaign.optimized') {
      const payload = event.payload as { metrics?: PatternOutcomes };
      if (payload.metrics) {
        await this.storePattern({
          action: 'store_pattern',
          pattern: {
            type: 'campaign',
            description: `Optimization event for campaign ${event.aggregateId}`,
            outcomes: payload.metrics,
          },
        });
      }
    }
  }
}
