/**
 * Cross-Platform Agent - Multi-Channel Intelligence
 * Tier 5: Operations
 *
 * Responsibilities:
 * - Coordinate across multiple ad platforms
 * - Sync budgets and strategies
 * - Cross-platform attribution
 * - Unified reporting
 * - Platform arbitrage
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  AgentConfig,
  TaskContext,
  DomainEvent,
  EventType,
  Campaign,
  Platform,
  CampaignMetrics,
} from '../../types/index.js';
import { BaseAgent, AgentDependencies } from '../base-agent.js';

// ============================================================================
// Types
// ============================================================================

export interface CrossPlatformInput {
  action: 'analyze' | 'sync' | 'arbitrage' | 'unified_report' | 'optimize_allocation';
  campaigns?: Campaign[];
  platforms?: Platform[];
  budget?: number;
  reportPeriod?: { start: Date; end: Date };
}

export interface CrossPlatformOutput {
  action: string;
  result: {
    analysis?: PlatformAnalysis;
    syncPlan?: SyncPlan;
    arbitrageOpportunities?: ArbitrageOpportunity[];
    unifiedReport?: UnifiedReport;
    allocationPlan?: AllocationPlan;
  };
}

export interface PlatformAnalysis {
  platforms: PlatformMetrics[];
  comparison: PlatformComparison;
  recommendations: string[];
  overlapAnalysis: OverlapAnalysis;
}

export interface PlatformMetrics {
  platform: Platform;
  campaigns: number;
  totalSpend: number;
  totalRevenue: number;
  totalConversions: number;
  avgRoas: number;
  avgCpa: number;
  avgCtr: number;
  marketShare: number;
}

export interface PlatformComparison {
  bestPerformer: Platform;
  worstPerformer: Platform;
  efficiency: Record<Platform, number>;
  scalability: Record<Platform, number>;
  costTrends: Record<Platform, number>;
}

export interface OverlapAnalysis {
  estimatedOverlap: number;
  overlappingAudiences: string[];
  deduplicationStrategy: string;
}

export interface SyncPlan {
  id: string;
  platforms: Platform[];
  changes: SyncChange[];
  expectedOutcome: string;
  risks: string[];
}

export interface SyncChange {
  platform: Platform;
  changeType: 'budget' | 'bid' | 'targeting' | 'creative' | 'schedule';
  currentValue: unknown;
  newValue: unknown;
  rationale: string;
}

export interface ArbitrageOpportunity {
  id: string;
  fromPlatform: Platform;
  toPlatform: Platform;
  budgetToShift: number;
  expectedLift: number;
  confidence: number;
  timeWindow: string;
  rationale: string;
}

export interface UnifiedReport {
  period: { start: Date; end: Date };
  summary: ReportSummary;
  platformBreakdown: PlatformMetrics[];
  topCampaigns: CampaignSummary[];
  insights: ReportInsight[];
  recommendations: string[];
}

export interface ReportSummary {
  totalSpend: number;
  totalRevenue: number;
  totalConversions: number;
  blendedRoas: number;
  blendedCpa: number;
  platformCount: number;
  campaignCount: number;
}

export interface CampaignSummary {
  id: string;
  name: string;
  platform: Platform;
  metrics: CampaignMetrics;
  rank: number;
}

export interface ReportInsight {
  type: 'opportunity' | 'risk' | 'trend' | 'anomaly';
  title: string;
  description: string;
  impact: number;
  action?: string;
}

export interface AllocationPlan {
  totalBudget: number;
  currentAllocation: Record<Platform, number>;
  recommendedAllocation: Record<Platform, number>;
  expectedImprovement: number;
  reallocationSteps: ReallocationStep[];
}

export interface ReallocationStep {
  order: number;
  platform: Platform;
  action: 'increase' | 'decrease';
  amount: number;
  timing: string;
}

// ============================================================================
// Configuration
// ============================================================================

export const crossPlatformConfig: AgentConfig = {
  id: 'cross-platform',
  tier: 5,
  name: 'Cross-Platform Agent',
  description: 'Coordinate and optimize across multiple ad platforms',
  capabilities: [
    {
      id: 'multi_channel',
      name: 'Multi-Channel Analysis',
      description: 'Analyze performance across platforms',
      inputTypes: ['campaigns'],
      outputTypes: ['platform_analysis'],
    },
    {
      id: 'platform_sync',
      name: 'Platform Sync',
      description: 'Synchronize strategies across platforms',
      inputTypes: ['campaigns', 'sync_config'],
      outputTypes: ['sync_plan'],
    },
    {
      id: 'cross_platform_intelligence',
      name: 'Cross-Platform Intelligence',
      description: 'Generate unified insights across channels',
      inputTypes: ['campaigns', 'period'],
      outputTypes: ['unified_report'],
    },
    {
      id: 'budget_arbitrage',
      name: 'Budget Arbitrage',
      description: 'Find arbitrage opportunities across platforms',
      inputTypes: ['campaigns', 'budget'],
      outputTypes: ['arbitrage_opportunities'],
    },
  ],
  maxConcurrency: 4,
  timeoutMs: 30000,
  priority: 48,
  dependencies: ['attention-arbitrage', 'simulation'],
};

// ============================================================================
// Platform Benchmark Data
// ============================================================================

const PLATFORM_BENCHMARKS: Record<Platform, { avgCpm: number; avgCtr: number; avgCvr: number }> = {
  google_ads: { avgCpm: 3.5, avgCtr: 0.035, avgCvr: 0.04 },
  meta: { avgCpm: 8.0, avgCtr: 0.012, avgCvr: 0.025 },
  tiktok: { avgCpm: 4.0, avgCtr: 0.015, avgCvr: 0.02 },
  linkedin: { avgCpm: 35.0, avgCtr: 0.005, avgCvr: 0.035 },
};

// ============================================================================
// Cross-Platform Agent Implementation
// ============================================================================

export class CrossPlatformAgent extends BaseAgent<CrossPlatformInput, CrossPlatformOutput> {
  private reportCache: Map<string, UnifiedReport>;

  constructor(deps?: AgentDependencies) {
    super(crossPlatformConfig, deps);
    this.reportCache = new Map();
  }

  /**
   * Main processing logic
   */
  protected async process(
    input: CrossPlatformInput,
    context: TaskContext
  ): Promise<CrossPlatformOutput> {
    this.logger.info('Processing cross-platform request', { action: input.action });

    switch (input.action) {
      case 'analyze':
        return this.analyzePlatforms(input);
      case 'sync':
        return this.createSyncPlan(input);
      case 'arbitrage':
        return this.findArbitrageOpportunities(input);
      case 'unified_report':
        return this.generateUnifiedReport(input);
      case 'optimize_allocation':
        return this.optimizeAllocation(input);
      default:
        throw new Error(`Unknown action: ${input.action}`);
    }
  }

  /**
   * Analyze performance across platforms
   */
  private async analyzePlatforms(input: CrossPlatformInput): Promise<CrossPlatformOutput> {
    const { campaigns = [] } = input;

    // Group campaigns by platform
    const platformGroups = this.groupByPlatform(campaigns);

    // Calculate metrics for each platform
    const platformMetrics: PlatformMetrics[] = [];
    const totalSpend = campaigns.reduce((sum, c) => sum + c.metrics.spend, 0);

    for (const [platform, platformCampaigns] of Object.entries(platformGroups)) {
      const metrics = this.calculatePlatformMetrics(platform as Platform, platformCampaigns, totalSpend);
      platformMetrics.push(metrics);
    }

    // Create comparison
    const comparison = this.createPlatformComparison(platformMetrics);

    // Analyze overlap
    const overlapAnalysis = this.analyzeOverlap(campaigns);

    // Generate recommendations
    const recommendations = this.generatePlatformRecommendations(platformMetrics, comparison);

    const analysis: PlatformAnalysis = {
      platforms: platformMetrics,
      comparison,
      recommendations,
      overlapAnalysis,
    };

    return {
      action: 'analyze',
      result: { analysis },
    };
  }

  /**
   * Create a synchronization plan
   */
  private async createSyncPlan(input: CrossPlatformInput): Promise<CrossPlatformOutput> {
    const { campaigns = [], platforms = ['google_ads', 'meta'] } = input;

    const changes: SyncChange[] = [];

    // Calculate optimal settings based on cross-platform analysis
    const platformGroups = this.groupByPlatform(campaigns);

    // Find best performing platform for reference
    let bestPlatform: Platform = 'google_ads';
    let bestRoas = 0;

    for (const [platform, platformCampaigns] of Object.entries(platformGroups)) {
      const avgRoas = platformCampaigns.reduce((sum, c) => sum + c.metrics.roas, 0) / platformCampaigns.length;
      if (avgRoas > bestRoas) {
        bestRoas = avgRoas;
        bestPlatform = platform as Platform;
      }
    }

    // Generate sync changes
    for (const platform of platforms) {
      if (platform !== bestPlatform) {
        const platformCampaigns = platformGroups[platform] ?? [];
        const avgBudget = platformCampaigns.reduce((sum, c) => sum + c.budget.daily, 0) / Math.max(platformCampaigns.length, 1);

        changes.push({
          platform,
          changeType: 'budget',
          currentValue: avgBudget,
          newValue: avgBudget * 1.1, // Increase underperforming platforms
          rationale: `Align with ${bestPlatform} performance`,
        });
      }
    }

    const syncPlan: SyncPlan = {
      id: uuidv4(),
      platforms,
      changes,
      expectedOutcome: 'Improved cross-platform consistency',
      risks: ['Short-term performance fluctuation', 'Platform-specific factors not accounted for'],
    };

    return {
      action: 'sync',
      result: { syncPlan },
    };
  }

  /**
   * Find arbitrage opportunities
   */
  private async findArbitrageOpportunities(input: CrossPlatformInput): Promise<CrossPlatformOutput> {
    const { campaigns = [], budget } = input;

    const opportunities: ArbitrageOpportunity[] = [];
    const platformGroups = this.groupByPlatform(campaigns);

    // Calculate efficiency for each platform
    const efficiencies: { platform: Platform; roas: number; cpa: number }[] = [];

    for (const [platform, platformCampaigns] of Object.entries(platformGroups)) {
      const totalConversions = platformCampaigns.reduce((sum, c) => sum + c.metrics.conversions, 0);
      const totalSpend = platformCampaigns.reduce((sum, c) => sum + c.metrics.spend, 0);
      const totalRevenue = platformCampaigns.reduce((sum, c) => sum + c.metrics.revenue, 0);

      efficiencies.push({
        platform: platform as Platform,
        roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
        cpa: totalConversions > 0 ? totalSpend / totalConversions : Infinity,
      });
    }

    // Sort by ROAS
    efficiencies.sort((a, b) => b.roas - a.roas);

    // Find arbitrage opportunities (shift from low to high performers)
    if (efficiencies.length >= 2) {
      const best = efficiencies[0];
      const worst = efficiencies[efficiencies.length - 1];

      if (best.roas > worst.roas * 1.3) {
        const worstCampaigns = platformGroups[worst.platform] ?? [];
        const shiftAmount = worstCampaigns.reduce((sum, c) => sum + c.budget.daily, 0) * 0.2;

        opportunities.push({
          id: uuidv4(),
          fromPlatform: worst.platform,
          toPlatform: best.platform,
          budgetToShift: shiftAmount,
          expectedLift: (best.roas / worst.roas - 1) * 0.5, // Conservative estimate
          confidence: 0.7,
          timeWindow: 'Next 7 days',
          rationale: `${best.platform} has ${((best.roas / worst.roas - 1) * 100).toFixed(0)}% higher ROAS than ${worst.platform}`,
        });
      }
    }

    // Check for CPM arbitrage
    for (const platform of Object.keys(PLATFORM_BENCHMARKS) as Platform[]) {
      const benchmark = PLATFORM_BENCHMARKS[platform];
      const platformCampaigns = platformGroups[platform] ?? [];

      if (platformCampaigns.length > 0) {
        const avgCpm = platformCampaigns.reduce((sum, c) =>
          sum + (c.metrics.spend / c.metrics.impressions * 1000), 0) / platformCampaigns.length;

        if (avgCpm < benchmark.avgCpm * 0.8) {
          opportunities.push({
            id: uuidv4(),
            fromPlatform: 'google_ads', // Generic source
            toPlatform: platform,
            budgetToShift: (budget ?? 1000) * 0.1,
            expectedLift: 0.15,
            confidence: 0.6,
            timeWindow: 'Immediate',
            rationale: `${platform} CPM ${((1 - avgCpm / benchmark.avgCpm) * 100).toFixed(0)}% below benchmark`,
          });
        }
      }
    }

    return {
      action: 'arbitrage',
      result: { arbitrageOpportunities: opportunities },
    };
  }

  /**
   * Generate unified report
   */
  private async generateUnifiedReport(input: CrossPlatformInput): Promise<CrossPlatformOutput> {
    const { campaigns = [], reportPeriod } = input;
    const period = reportPeriod ?? {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
    };

    // Calculate summary
    const totalSpend = campaigns.reduce((sum, c) => sum + c.metrics.spend, 0);
    const totalRevenue = campaigns.reduce((sum, c) => sum + c.metrics.revenue, 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + c.metrics.conversions, 0);

    const summary: ReportSummary = {
      totalSpend,
      totalRevenue,
      totalConversions,
      blendedRoas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
      blendedCpa: totalConversions > 0 ? totalSpend / totalConversions : 0,
      platformCount: new Set(campaigns.map((c) => c.platform)).size,
      campaignCount: campaigns.length,
    };

    // Platform breakdown
    const platformGroups = this.groupByPlatform(campaigns);
    const platformBreakdown: PlatformMetrics[] = [];
    for (const [platform, platformCampaigns] of Object.entries(platformGroups)) {
      platformBreakdown.push(this.calculatePlatformMetrics(platform as Platform, platformCampaigns, totalSpend));
    }

    // Top campaigns
    const topCampaigns: CampaignSummary[] = campaigns
      .sort((a, b) => b.metrics.roas - a.metrics.roas)
      .slice(0, 10)
      .map((c, i) => ({
        id: c.id,
        name: c.name,
        platform: c.platform,
        metrics: c.metrics,
        rank: i + 1,
      }));

    // Generate insights
    const insights = this.generateInsights(campaigns, platformBreakdown, summary);

    // Generate recommendations
    const recommendations = this.generateReportRecommendations(platformBreakdown, insights);

    const unifiedReport: UnifiedReport = {
      period,
      summary,
      platformBreakdown,
      topCampaigns,
      insights,
      recommendations,
    };

    // Cache the report
    const cacheKey = `${period.start.toISOString()}_${period.end.toISOString()}`;
    this.reportCache.set(cacheKey, unifiedReport);

    return {
      action: 'unified_report',
      result: { unifiedReport },
    };
  }

  /**
   * Optimize budget allocation across platforms
   */
  private async optimizeAllocation(input: CrossPlatformInput): Promise<CrossPlatformOutput> {
    const { campaigns = [], budget } = input;

    const totalBudget = budget ?? campaigns.reduce((sum, c) => sum + c.budget.daily, 0);
    const platformGroups = this.groupByPlatform(campaigns);

    // Current allocation
    const currentAllocation: Record<Platform, number> = {} as Record<Platform, number>;
    for (const [platform, platformCampaigns] of Object.entries(platformGroups)) {
      currentAllocation[platform as Platform] = platformCampaigns.reduce((sum, c) => sum + c.budget.daily, 0);
    }

    // Calculate recommended allocation based on efficiency
    const efficiencyScores: Record<Platform, number> = {} as Record<Platform, number>;
    let totalScore = 0;

    for (const [platform, platformCampaigns] of Object.entries(platformGroups)) {
      const avgRoas = platformCampaigns.reduce((sum, c) => sum + c.metrics.roas, 0) / platformCampaigns.length;
      const score = Math.pow(avgRoas, 1.5); // Weight higher ROAS more
      efficiencyScores[platform as Platform] = score;
      totalScore += score;
    }

    const recommendedAllocation: Record<Platform, number> = {} as Record<Platform, number>;
    for (const [platform, score] of Object.entries(efficiencyScores)) {
      recommendedAllocation[platform as Platform] = totalScore > 0 ? (score / totalScore) * totalBudget : totalBudget / Object.keys(efficiencyScores).length;
    }

    // Calculate expected improvement
    let currentWeightedRoas = 0;
    let recommendedWeightedRoas = 0;

    for (const [platform, platformCampaigns] of Object.entries(platformGroups)) {
      const avgRoas = platformCampaigns.reduce((sum, c) => sum + c.metrics.roas, 0) / platformCampaigns.length;
      currentWeightedRoas += (currentAllocation[platform as Platform] / totalBudget) * avgRoas;
      recommendedWeightedRoas += (recommendedAllocation[platform as Platform] / totalBudget) * avgRoas;
    }

    const expectedImprovement = currentWeightedRoas > 0 ? (recommendedWeightedRoas / currentWeightedRoas - 1) : 0;

    // Generate reallocation steps
    const reallocationSteps: ReallocationStep[] = [];
    let order = 1;

    for (const platform of Object.keys(currentAllocation) as Platform[]) {
      const diff = recommendedAllocation[platform] - currentAllocation[platform];
      if (Math.abs(diff) > totalBudget * 0.05) {
        reallocationSteps.push({
          order: order++,
          platform,
          action: diff > 0 ? 'increase' : 'decrease',
          amount: Math.abs(diff),
          timing: Math.abs(diff) > totalBudget * 0.1 ? 'Gradual over 1 week' : 'Immediate',
        });
      }
    }

    const allocationPlan: AllocationPlan = {
      totalBudget,
      currentAllocation,
      recommendedAllocation,
      expectedImprovement,
      reallocationSteps,
    };

    return {
      action: 'optimize_allocation',
      result: { allocationPlan },
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private groupByPlatform(campaigns: Campaign[]): Record<Platform, Campaign[]> {
    const groups: Record<Platform, Campaign[]> = {
      google_ads: [],
      meta: [],
      tiktok: [],
      linkedin: [],
    };

    for (const campaign of campaigns) {
      if (groups[campaign.platform]) {
        groups[campaign.platform].push(campaign);
      }
    }

    return groups;
  }

  private calculatePlatformMetrics(
    platform: Platform,
    campaigns: Campaign[],
    totalSpend: number
  ): PlatformMetrics {
    const totalPlatformSpend = campaigns.reduce((sum, c) => sum + c.metrics.spend, 0);
    const totalRevenue = campaigns.reduce((sum, c) => sum + c.metrics.revenue, 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + c.metrics.conversions, 0);
    const totalClicks = campaigns.reduce((sum, c) => sum + c.metrics.clicks, 0);
    const totalImpressions = campaigns.reduce((sum, c) => sum + c.metrics.impressions, 0);

    return {
      platform,
      campaigns: campaigns.length,
      totalSpend: totalPlatformSpend,
      totalRevenue,
      totalConversions,
      avgRoas: totalPlatformSpend > 0 ? totalRevenue / totalPlatformSpend : 0,
      avgCpa: totalConversions > 0 ? totalPlatformSpend / totalConversions : 0,
      avgCtr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
      marketShare: totalSpend > 0 ? totalPlatformSpend / totalSpend : 0,
    };
  }

  private createPlatformComparison(metrics: PlatformMetrics[]): PlatformComparison {
    const sorted = [...metrics].sort((a, b) => b.avgRoas - a.avgRoas);
    const bestPerformer = sorted[0]?.platform ?? 'google_ads';
    const worstPerformer = sorted[sorted.length - 1]?.platform ?? 'google_ads';

    const efficiency: Record<Platform, number> = {} as Record<Platform, number>;
    const scalability: Record<Platform, number> = {} as Record<Platform, number>;
    const costTrends: Record<Platform, number> = {} as Record<Platform, number>;

    for (const m of metrics) {
      efficiency[m.platform] = m.avgRoas;
      scalability[m.platform] = m.campaigns * m.avgCtr; // Simplified
      costTrends[m.platform] = 0; // Would need historical data
    }

    return {
      bestPerformer,
      worstPerformer,
      efficiency,
      scalability,
      costTrends,
    };
  }

  private analyzeOverlap(campaigns: Campaign[]): OverlapAnalysis {
    // Simplified overlap analysis
    const platforms = new Set(campaigns.map((c) => c.platform));
    const estimatedOverlap = platforms.size > 1 ? 0.15 : 0; // Estimate 15% overlap

    return {
      estimatedOverlap,
      overlappingAudiences: ['Remarketing audiences', 'Interest-based audiences'],
      deduplicationStrategy: 'Use cross-platform audience exclusions and frequency capping',
    };
  }

  private generatePlatformRecommendations(
    metrics: PlatformMetrics[],
    comparison: PlatformComparison
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.length < 2) {
      recommendations.push('Consider expanding to additional platforms for diversification');
    }

    const bestMetrics = metrics.find((m) => m.platform === comparison.bestPerformer);
    const worstMetrics = metrics.find((m) => m.platform === comparison.worstPerformer);

    if (bestMetrics && worstMetrics && bestMetrics.avgRoas > worstMetrics.avgRoas * 1.5) {
      recommendations.push(`Consider shifting budget from ${worstMetrics.platform} to ${bestMetrics.platform}`);
    }

    const lowCtrPlatforms = metrics.filter((m) => m.avgCtr < 0.01);
    for (const m of lowCtrPlatforms) {
      recommendations.push(`Improve creative performance on ${m.platform} (low CTR)`);
    }

    return recommendations;
  }

  private generateInsights(
    campaigns: Campaign[],
    platformBreakdown: PlatformMetrics[],
    summary: ReportSummary
  ): ReportInsight[] {
    const insights: ReportInsight[] = [];

    // ROAS insight
    if (summary.blendedRoas > 3) {
      insights.push({
        type: 'opportunity',
        title: 'Strong ROAS Performance',
        description: `Blended ROAS of ${summary.blendedRoas.toFixed(1)}x indicates opportunity to scale`,
        impact: 0.3,
        action: 'Consider increasing overall budget by 20%',
      });
    } else if (summary.blendedRoas < 1.5) {
      insights.push({
        type: 'risk',
        title: 'Low ROAS Warning',
        description: `Blended ROAS of ${summary.blendedRoas.toFixed(1)}x is below target`,
        impact: -0.2,
        action: 'Review and optimize underperforming campaigns',
      });
    }

    // Platform concentration
    const maxShare = Math.max(...platformBreakdown.map((p) => p.marketShare));
    if (maxShare > 0.7) {
      const dominantPlatform = platformBreakdown.find((p) => p.marketShare === maxShare);
      insights.push({
        type: 'risk',
        title: 'Platform Concentration Risk',
        description: `${(maxShare * 100).toFixed(0)}% of spend is on ${dominantPlatform?.platform}`,
        impact: -0.1,
        action: 'Diversify spend across platforms to reduce risk',
      });
    }

    return insights;
  }

  private generateReportRecommendations(
    platformBreakdown: PlatformMetrics[],
    insights: ReportInsight[]
  ): string[] {
    const recommendations: string[] = [];

    for (const insight of insights) {
      if (insight.action) {
        recommendations.push(insight.action);
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue monitoring performance and look for optimization opportunities');
    }

    return recommendations;
  }

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  protected async onInitialize(): Promise<void> {
    this.logger.info('Cross-platform agent initializing');
  }

  protected async onShutdown(): Promise<void> {
    this.logger.info('Cross-platform agent shutting down');
    this.reportCache.clear();
  }

  protected getSubscribedEvents(): EventType[] {
    return ['campaign.created', 'campaign.optimized'];
  }

  protected async handleEvent(event: DomainEvent): Promise<void> {
    this.logger.debug('Event received', { type: event.type });
  }
}
