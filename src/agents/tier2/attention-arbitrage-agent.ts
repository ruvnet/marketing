/**
 * Attention Arbitrage Agent - Underpriced Attention Discovery
 * Tier 2: Intelligence
 *
 * Responsibilities:
 * - Discover underpriced attention opportunities
 * - CPM analysis across platforms and segments
 * - Identify arbitrage windows
 * - Predict attention value vs market price
 * - Time-sensitive opportunity alerts
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  AgentConfig,
  TaskContext,
  DomainEvent,
  EventType,
  Campaign,
  Platform,
  AudienceSegment,
  AttentionArbitrageOpportunity,
} from '../../types/index.js';
import { BaseAgent, AgentDependencies } from '../base-agent.js';

// ============================================================================
// Types
// ============================================================================

export interface ArbitrageInput {
  action: 'scan' | 'analyze_segment' | 'predict_value' | 'find_windows' | 'benchmark_cpm';
  platform?: Platform;
  segment?: AudienceSegment;
  campaign?: Campaign;
  timeWindow?: { start: Date; end: Date };
  budget?: number;
}

export interface ArbitrageOutput {
  action: string;
  result: {
    opportunities?: AttentionArbitrageOpportunity[];
    segmentAnalysis?: SegmentAnalysis;
    valuePrediction?: ValuePrediction;
    arbitrageWindows?: ArbitrageWindow[];
    cpmBenchmark?: CpmBenchmark;
    recommendations?: string[];
  };
}

export interface SegmentAnalysis {
  segment: AudienceSegment;
  platform: Platform;
  metrics: {
    currentCpm: number;
    historicalCpm: number;
    predictedCpm: number;
    volatility: number;
  };
  value: {
    estimatedCvr: number;
    estimatedAov: number;
    estimatedLtv: number;
    valuePerImpression: number;
  };
  arbitrageScore: number;
  confidence: number;
}

export interface ValuePrediction {
  segment: AudienceSegment;
  predictedValue: number;
  currentCost: number;
  margin: number;
  factors: ValueFactor[];
  confidence: number;
}

export interface ValueFactor {
  name: string;
  impact: number;
  direction: 'positive' | 'negative';
  description: string;
}

export interface ArbitrageWindow {
  id: string;
  platform: Platform;
  segment: AudienceSegment;
  startTime: Date;
  endTime: Date;
  expectedCpmDrop: number;
  reason: string;
  confidence: number;
  recommendedAction: string;
}

export interface CpmBenchmark {
  platform: Platform;
  segment?: AudienceSegment;
  benchmarks: {
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
  currentPosition: number; // percentile
  trend: 'increasing' | 'stable' | 'decreasing';
  forecast: number[];
}

// ============================================================================
// Configuration
// ============================================================================

export const attentionArbitrageConfig: AgentConfig = {
  id: 'attention-arbitrage',
  tier: 2,
  name: 'Attention Arbitrage Agent',
  description: 'Discover underpriced attention opportunities across platforms',
  capabilities: [
    {
      id: 'attention_pricing',
      name: 'Attention Pricing Analysis',
      description: 'Analyze current attention pricing vs value',
      inputTypes: ['segment', 'platform'],
      outputTypes: ['pricing_analysis'],
    },
    {
      id: 'arbitrage_discovery',
      name: 'Arbitrage Opportunity Discovery',
      description: 'Find underpriced attention opportunities',
      inputTypes: ['platform', 'budget'],
      outputTypes: ['opportunities'],
    },
    {
      id: 'cpm_analysis',
      name: 'CPM Analysis',
      description: 'Analyze CPM trends and benchmarks',
      inputTypes: ['platform', 'segment'],
      outputTypes: ['cpm_benchmark'],
    },
    {
      id: 'value_prediction',
      name: 'Value Prediction',
      description: 'Predict true value of attention',
      inputTypes: ['segment', 'campaign'],
      outputTypes: ['value_prediction'],
    },
  ],
  maxConcurrency: 5,
  timeoutMs: 20000,
  priority: 72,
  dependencies: ['historical-memory', 'simulation'],
};

// ============================================================================
// CPM Data (Mock market data)
// ============================================================================

interface MarketData {
  platform: Platform;
  segment: string;
  cpm: number;
  volatility: number;
  trend: number; // -1 to 1
}

const MARKET_DATA: MarketData[] = [
  { platform: 'google_ads', segment: 'broad', cpm: 2.50, volatility: 0.15, trend: 0.05 },
  { platform: 'google_ads', segment: 'interest', cpm: 4.20, volatility: 0.20, trend: 0.10 },
  { platform: 'google_ads', segment: 'remarketing', cpm: 6.80, volatility: 0.25, trend: 0.15 },
  { platform: 'meta', segment: 'broad', cpm: 8.50, volatility: 0.30, trend: -0.05 },
  { platform: 'meta', segment: 'lookalike', cpm: 12.00, volatility: 0.25, trend: 0.00 },
  { platform: 'meta', segment: 'custom', cpm: 15.50, volatility: 0.35, trend: 0.20 },
  { platform: 'tiktok', segment: 'broad', cpm: 3.00, volatility: 0.40, trend: -0.15 },
  { platform: 'tiktok', segment: 'interest', cpm: 5.50, volatility: 0.45, trend: -0.10 },
  { platform: 'linkedin', segment: 'professional', cpm: 35.00, volatility: 0.20, trend: 0.05 },
  { platform: 'linkedin', segment: 'job_title', cpm: 55.00, volatility: 0.15, trend: 0.10 },
];

// ============================================================================
// Attention Arbitrage Agent Implementation
// ============================================================================

export class AttentionArbitrageAgent extends BaseAgent<ArbitrageInput, ArbitrageOutput> {
  private opportunityCache: Map<string, AttentionArbitrageOpportunity>;
  private cacheExpiry: number = 300000; // 5 minutes

  constructor(deps?: AgentDependencies) {
    super(attentionArbitrageConfig, deps);
    this.opportunityCache = new Map();
  }

  /**
   * Main processing logic
   */
  protected async process(
    input: ArbitrageInput,
    context: TaskContext
  ): Promise<ArbitrageOutput> {
    this.logger.info('Processing attention arbitrage request', { action: input.action });

    switch (input.action) {
      case 'scan':
        return this.scanForOpportunities(input, context);
      case 'analyze_segment':
        return this.analyzeSegment(input);
      case 'predict_value':
        return this.predictValue(input);
      case 'find_windows':
        return this.findArbitrageWindows(input);
      case 'benchmark_cpm':
        return this.benchmarkCpm(input);
      default:
        throw new Error(`Unknown action: ${input.action}`);
    }
  }

  /**
   * Scan for arbitrage opportunities
   */
  private async scanForOpportunities(
    input: ArbitrageInput,
    context: TaskContext
  ): Promise<ArbitrageOutput> {
    const platform = input.platform;
    const budget = input.budget ?? 1000;
    const opportunities: AttentionArbitrageOpportunity[] = [];

    // Filter market data by platform if specified
    const relevantData = platform
      ? MARKET_DATA.filter((d) => d.platform === platform)
      : MARKET_DATA;

    for (const data of relevantData) {
      // Calculate arbitrage score
      const valuePerImpression = this.estimateValuePerImpression(data);
      const arbitrageScore = (valuePerImpression - data.cpm / 1000) / (data.cpm / 1000);

      if (arbitrageScore > 0.2) {
        // 20% or more underpriced
        const opportunity: AttentionArbitrageOpportunity = {
          id: uuidv4(),
          platform: data.platform,
          segment: {
            id: `${data.platform}_${data.segment}`,
            name: `${data.segment} audience`,
            type: data.segment as AudienceSegment['type'],
            size: Math.floor(Math.random() * 1000000) + 100000,
          },
          currentCpm: data.cpm,
          predictedValue: valuePerImpression * 1000,
          arbitrageScore,
          timeWindow: {
            start: new Date(),
            end: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
          confidence: Math.max(0.5, 1 - data.volatility),
          detectedAt: new Date(),
        };

        opportunities.push(opportunity);
        this.opportunityCache.set(opportunity.id, opportunity);
      }
    }

    // Sort by arbitrage score
    opportunities.sort((a, b) => b.arbitrageScore - a.arbitrageScore);

    // Take top opportunities within budget
    const selectedOpportunities = this.selectWithinBudget(opportunities, budget);

    this.logger.info('Arbitrage scan complete', {
      total: opportunities.length,
      selected: selectedOpportunities.length,
    });

    return {
      action: 'scan',
      result: {
        opportunities: selectedOpportunities,
        recommendations: this.generateOpportunityRecommendations(selectedOpportunities),
      },
    };
  }

  /**
   * Analyze a specific segment
   */
  private async analyzeSegment(input: ArbitrageInput): Promise<ArbitrageOutput> {
    if (!input.segment || !input.platform) {
      throw new Error('Segment and platform are required for analysis');
    }

    const segment = input.segment;
    const marketData = MARKET_DATA.find(
      (d) => d.platform === input.platform && d.segment === segment.type
    ) ?? {
      platform: input.platform,
      segment: input.segment.type,
      cpm: 5.0,
      volatility: 0.25,
      trend: 0,
    };

    const valuePerImpression = this.estimateValuePerImpression(marketData);
    const arbitrageScore = (valuePerImpression - marketData.cpm / 1000) / (marketData.cpm / 1000);

    const segmentAnalysis: SegmentAnalysis = {
      segment: input.segment,
      platform: input.platform,
      metrics: {
        currentCpm: marketData.cpm,
        historicalCpm: marketData.cpm * (1 - marketData.trend * 0.5),
        predictedCpm: marketData.cpm * (1 + marketData.trend),
        volatility: marketData.volatility,
      },
      value: {
        estimatedCvr: 0.02 + Math.random() * 0.03,
        estimatedAov: 50 + Math.random() * 100,
        estimatedLtv: 150 + Math.random() * 200,
        valuePerImpression,
      },
      arbitrageScore: Math.max(-1, Math.min(1, arbitrageScore)),
      confidence: Math.max(0.5, 1 - marketData.volatility),
    };

    return {
      action: 'analyze_segment',
      result: {
        segmentAnalysis,
        recommendations: this.generateSegmentRecommendations(segmentAnalysis),
      },
    };
  }

  /**
   * Predict value of attention
   */
  private async predictValue(input: ArbitrageInput): Promise<ArbitrageOutput> {
    if (!input.segment) {
      throw new Error('Segment is required for value prediction');
    }

    const platform = input.platform ?? 'google_ads';
    const marketData = MARKET_DATA.find(
      (d) => d.platform === platform && d.segment === input.segment!.type
    );

    const baseValue = this.estimateValuePerImpression(marketData ?? {
      platform,
      segment: input.segment.type,
      cpm: 5,
      volatility: 0.25,
      trend: 0,
    });

    const factors: ValueFactor[] = [
      {
        name: 'Audience Quality',
        impact: 0.15,
        direction: 'positive',
        description: 'Segment shows high engagement rates',
      },
      {
        name: 'Seasonality',
        impact: this.getSeasonalityFactor(),
        direction: this.getSeasonalityFactor() > 0 ? 'positive' : 'negative',
        description: 'Current seasonal demand factor',
      },
      {
        name: 'Competition',
        impact: -0.08,
        direction: 'negative',
        description: 'Moderate competition in segment',
      },
      {
        name: 'Platform Trend',
        impact: marketData?.trend ?? 0,
        direction: (marketData?.trend ?? 0) > 0 ? 'positive' : 'negative',
        description: `Platform CPM trending ${(marketData?.trend ?? 0) > 0 ? 'up' : 'down'}`,
      },
    ];

    const adjustedValue = baseValue * (1 + factors.reduce((sum, f) =>
      sum + (f.direction === 'positive' ? f.impact : -f.impact), 0));

    const currentCost = (marketData?.cpm ?? 5) / 1000;

    const valuePrediction: ValuePrediction = {
      segment: input.segment,
      predictedValue: adjustedValue,
      currentCost,
      margin: (adjustedValue - currentCost) / currentCost,
      factors,
      confidence: 0.75,
    };

    return {
      action: 'predict_value',
      result: { valuePrediction },
    };
  }

  /**
   * Find arbitrage windows (time-based opportunities)
   */
  private async findArbitrageWindows(input: ArbitrageInput): Promise<ArbitrageOutput> {
    const platform = input.platform ?? 'google_ads';
    const windows: ArbitrageWindow[] = [];

    // Generate mock windows based on known patterns
    const patterns = [
      {
        name: 'Weekend Dip',
        days: [0, 6], // Sunday, Saturday
        hours: [0, 23],
        cpmDrop: 0.15,
        reason: 'Lower advertiser competition on weekends',
      },
      {
        name: 'Late Night',
        days: [0, 1, 2, 3, 4, 5, 6],
        hours: [23, 5],
        cpmDrop: 0.25,
        reason: 'Reduced competition late night hours',
      },
      {
        name: 'Early Week',
        days: [1], // Monday
        hours: [6, 10],
        cpmDrop: 0.10,
        reason: 'Budget reset at week start',
      },
    ];

    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    for (const pattern of patterns) {
      if (pattern.days.includes(currentDay)) {
        const isInWindow = pattern.hours[0] <= currentHour && currentHour <= pattern.hours[1];
        const windowStart = isInWindow ? now : this.getNextWindowStart(pattern.hours[0]);
        const windowEnd = new Date(windowStart.getTime() + (pattern.hours[1] - pattern.hours[0] + 1) * 3600000);

        windows.push({
          id: uuidv4(),
          platform,
          segment: {
            id: `${platform}_broad`,
            name: 'Broad audience',
            type: 'interest',
            size: 1000000,
          },
          startTime: windowStart,
          endTime: windowEnd,
          expectedCpmDrop: pattern.cpmDrop,
          reason: pattern.reason,
          confidence: 0.7,
          recommendedAction: `Increase ${platform} spend during window`,
        });
      }
    }

    return {
      action: 'find_windows',
      result: {
        arbitrageWindows: windows,
        recommendations: windows.map((w) => w.recommendedAction),
      },
    };
  }

  /**
   * Benchmark CPM against historical data
   */
  private async benchmarkCpm(input: ArbitrageInput): Promise<ArbitrageOutput> {
    const platform = input.platform ?? 'google_ads';

    const platformData = MARKET_DATA.filter((d) => d.platform === platform);
    const cpms = platformData.map((d) => d.cpm);

    // Sort for percentiles
    const sorted = [...cpms].sort((a, b) => a - b);
    const p25 = sorted[Math.floor(sorted.length * 0.25)] ?? sorted[0];
    const p50 = sorted[Math.floor(sorted.length * 0.5)] ?? sorted[0];
    const p75 = sorted[Math.floor(sorted.length * 0.75)] ?? sorted[sorted.length - 1];
    const p90 = sorted[Math.floor(sorted.length * 0.9)] ?? sorted[sorted.length - 1];

    const avgTrend = platformData.reduce((sum, d) => sum + d.trend, 0) / platformData.length;

    const cpmBenchmark: CpmBenchmark = {
      platform,
      segment: input.segment,
      benchmarks: { p25, p50, p75, p90 },
      currentPosition: 50, // Current campaign would be here
      trend: avgTrend > 0.05 ? 'increasing' : avgTrend < -0.05 ? 'decreasing' : 'stable',
      forecast: [
        p50,
        p50 * (1 + avgTrend * 0.5),
        p50 * (1 + avgTrend),
        p50 * (1 + avgTrend * 1.5),
      ],
    };

    return {
      action: 'benchmark_cpm',
      result: {
        cpmBenchmark,
        recommendations: [
          avgTrend > 0.1
            ? 'CPMs rising - lock in current rates'
            : avgTrend < -0.1
            ? 'CPMs falling - wait for better rates'
            : 'CPMs stable - current rates are fair',
        ],
      },
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private estimateValuePerImpression(data: MarketData): number {
    // Simple value estimation based on platform and segment
    const platformMultiplier: Record<Platform, number> = {
      google_ads: 1.2,
      meta: 1.0,
      tiktok: 0.8,
      linkedin: 1.5,
    };

    const segmentMultiplier: Record<string, number> = {
      broad: 0.8,
      interest: 1.0,
      remarketing: 1.5,
      lookalike: 1.2,
      custom: 1.3,
      professional: 1.4,
      job_title: 1.6,
    };

    const baseValue = 0.01; // $0.01 per impression
    return baseValue *
      (platformMultiplier[data.platform] ?? 1) *
      (segmentMultiplier[data.segment] ?? 1);
  }

  private getSeasonalityFactor(): number {
    const month = new Date().getMonth();
    // Q4 boost, Q1 dip
    if (month >= 9 && month <= 11) return 0.2; // Oct-Dec
    if (month >= 0 && month <= 2) return -0.1; // Jan-Mar
    return 0.05;
  }

  private getNextWindowStart(hour: number): Date {
    const now = new Date();
    const next = new Date(now);
    next.setHours(hour, 0, 0, 0);
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  }

  private selectWithinBudget(
    opportunities: AttentionArbitrageOpportunity[],
    budget: number
  ): AttentionArbitrageOpportunity[] {
    const selected: AttentionArbitrageOpportunity[] = [];
    let remainingBudget = budget;

    for (const opp of opportunities) {
      const minSpend = opp.currentCpm * 10; // Minimum 10k impressions
      if (remainingBudget >= minSpend) {
        selected.push(opp);
        remainingBudget -= minSpend;
      }
    }

    return selected;
  }

  private generateOpportunityRecommendations(
    opportunities: AttentionArbitrageOpportunity[]
  ): string[] {
    if (opportunities.length === 0) {
      return ['No significant arbitrage opportunities found at this time'];
    }

    const recommendations = opportunities.slice(0, 3).map(
      (opp) => `${opp.platform}: ${opp.segment.name} - ${(opp.arbitrageScore * 100).toFixed(0)}% underpriced`
    );

    recommendations.push(
      `Total ${opportunities.length} opportunities found across platforms`
    );

    return recommendations;
  }

  private generateSegmentRecommendations(analysis: SegmentAnalysis): string[] {
    const recommendations: string[] = [];

    if (analysis.arbitrageScore > 0.3) {
      recommendations.push('Strong arbitrage opportunity - increase spend');
    } else if (analysis.arbitrageScore > 0.1) {
      recommendations.push('Moderate opportunity - consider testing');
    } else if (analysis.arbitrageScore < -0.1) {
      recommendations.push('Segment overpriced - reduce spend or wait');
    }

    if (analysis.metrics.volatility > 0.3) {
      recommendations.push('High volatility - use bid limits');
    }

    if (analysis.confidence < 0.6) {
      recommendations.push('Low confidence - validate with small test');
    }

    return recommendations;
  }

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  protected async onInitialize(): Promise<void> {
    this.logger.info('Attention arbitrage agent initializing');
  }

  protected async onShutdown(): Promise<void> {
    this.logger.info('Attention arbitrage agent shutting down');
    this.opportunityCache.clear();
  }

  protected getSubscribedEvents(): EventType[] {
    return ['campaign.created', 'intelligence.prediction_generated'];
  }

  protected async handleEvent(event: DomainEvent): Promise<void> {
    // Could trigger opportunity scans on certain events
    this.logger.debug('Event received', { type: event.type });
  }
}
