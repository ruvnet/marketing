/**
 * Analytics Domain Service
 * Handles metrics aggregation, reporting, and insights generation
 */

import { v4 as uuidv4 } from 'uuid';
import { EventBus, getEventBus } from '../core/event-bus';
import { StateManager, getStateManager } from '../core/state-manager';
import { createLogger, Logger } from '../core/logger';
import { Campaign, Creative, Platform } from '../types';

export interface MetricSnapshot {
  timestamp: Date;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr: number;
  cpc: number;
  cpa: number;
  roas: number;
}

export interface PerformanceReport {
  id: string;
  type: 'campaign' | 'creative' | 'platform' | 'account';
  entityId: string;
  period: { start: Date; end: Date };
  metrics: MetricSnapshot;
  trends: TrendAnalysis;
  insights: Insight[];
  generatedAt: Date;
}

export interface TrendAnalysis {
  impressionsTrend: number;
  clicksTrend: number;
  conversionsTrend: number;
  spendTrend: number;
  roasTrend: number;
  direction: 'improving' | 'stable' | 'declining';
}

export interface Insight {
  type: 'opportunity' | 'warning' | 'achievement' | 'anomaly';
  severity: 'low' | 'medium' | 'high';
  message: string;
  metric?: string;
  value?: number;
  recommendation?: string;
}

export interface Benchmark {
  metric: string;
  value: number;
  industryAverage: number;
  percentile: number;
}

export class AnalyticsService {
  private readonly eventBus: EventBus;
  private readonly stateManager: StateManager;
  private readonly logger: Logger;
  private readonly metricHistory: Map<string, MetricSnapshot[]> = new Map();

  constructor(eventBus?: EventBus, stateManager?: StateManager) {
    this.eventBus = eventBus || getEventBus();
    this.stateManager = stateManager || getStateManager();
    this.logger = createLogger('analytics-service');
  }

  /**
   * Record metrics snapshot
   */
  recordMetrics(entityId: string, metrics: MetricSnapshot): void {
    const history = this.metricHistory.get(entityId) || [];
    history.push(metrics);

    // Keep last 90 days of data
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const filtered = history.filter((m) => m.timestamp >= cutoff);

    this.metricHistory.set(entityId, filtered);

    this.eventBus.publish({
      id: uuidv4(),
      type: 'analytics.metrics_recorded',
      timestamp: new Date(),
      source: 'analytics-service',
      payload: { entityId, metrics },
    });
  }

  /**
   * Generate performance report for a campaign
   */
  generateCampaignReport(campaignId: string): PerformanceReport {
    const campaign = this.stateManager.getCampaign(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    const history = this.metricHistory.get(campaignId) || [];
    const currentMetrics = this.campaignToMetricSnapshot(campaign);
    const trends = this.analyzeTrends(history);
    const insights = this.generateCampaignInsights(campaign, trends);

    return {
      id: uuidv4(),
      type: 'campaign',
      entityId: campaignId,
      period: {
        start: campaign.startDate ?? new Date(),
        end: campaign.endDate ?? new Date(),
      },
      metrics: currentMetrics,
      trends,
      insights,
      generatedAt: new Date(),
    };
  }

  /**
   * Generate cross-platform report
   */
  generatePlatformReport(platform: Platform): PerformanceReport {
    const state = this.stateManager.getState();
    const campaigns = Array.from(state.campaigns.values())
      .filter((c: Campaign) => c.platform === platform);

    const aggregatedMetrics = this.aggregateMetrics(campaigns);
    const history = this.metricHistory.get(`platform:${platform}`) || [];
    const trends = this.analyzeTrends(history);
    const insights = this.generatePlatformInsights(platform, aggregatedMetrics, trends);

    return {
      id: uuidv4(),
      type: 'platform',
      entityId: platform,
      period: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      },
      metrics: aggregatedMetrics,
      trends,
      insights,
      generatedAt: new Date(),
    };
  }

  /**
   * Calculate benchmarks for metrics
   */
  calculateBenchmarks(entityId: string): Benchmark[] {
    const history = this.metricHistory.get(entityId) || [];
    if (history.length === 0) return [];

    const latest = history[history.length - 1];

    // Industry averages (simplified - would come from external data)
    const industryAverages: Record<string, number> = {
      ctr: 0.02,
      cpc: 1.5,
      cpa: 30,
      roas: 3.0,
    };

    return Object.entries(industryAverages).map(([metric, avg]) => {
      const value = (latest as unknown as Record<string, number>)[metric] || 0;
      const percentile = this.calculatePercentile(value, avg);
      return {
        metric,
        value,
        industryAverage: avg,
        percentile,
      };
    });
  }

  /**
   * Detect anomalies in metrics
   */
  detectAnomalies(entityId: string): Insight[] {
    const history = this.metricHistory.get(entityId) || [];
    if (history.length < 7) return [];

    const insights: Insight[] = [];
    const metrics: (keyof MetricSnapshot)[] = ['impressions', 'clicks', 'conversions', 'spend'];

    for (const metric of metrics) {
      const values = history.map((h) => h[metric] as number);
      const mean = this.mean(values);
      const stdDev = this.stdDev(values);
      const latest = values[values.length - 1];

      if (Math.abs(latest - mean) > 2 * stdDev) {
        const direction = latest > mean ? 'spike' : 'drop';
        insights.push({
          type: 'anomaly',
          severity: 'high',
          message: `Unusual ${direction} in ${metric}: ${latest.toFixed(2)} vs average ${mean.toFixed(2)}`,
          metric,
          value: latest,
          recommendation: direction === 'drop'
            ? `Investigate cause of ${metric} decline`
            : `Capitalize on ${metric} surge if positive`,
        });
      }
    }

    return insights;
  }

  /**
   * Get time series data for visualization
   */
  getTimeSeries(
    entityId: string,
    metric: keyof MetricSnapshot,
    period: { start: Date; end: Date }
  ): Array<{ timestamp: Date; value: number }> {
    const history = this.metricHistory.get(entityId) || [];

    return history
      .filter((h) => h.timestamp >= period.start && h.timestamp <= period.end)
      .map((h) => ({
        timestamp: h.timestamp,
        value: h[metric] as number,
      }));
  }

  /**
   * Compare entities performance
   */
  compareEntities(
    entityIds: string[],
    metric: keyof MetricSnapshot
  ): Array<{ entityId: string; current: number; previous: number; change: number }> {
    return entityIds.map((entityId) => {
      const history = this.metricHistory.get(entityId) || [];
      const current = history.length > 0 ? (history[history.length - 1][metric] as number) : 0;
      const previous = history.length > 1 ? (history[history.length - 2][metric] as number) : current;
      const change = previous > 0 ? (current - previous) / previous : 0;

      return { entityId, current, previous, change };
    });
  }

  /**
   * Convert campaign to metric snapshot
   */
  private campaignToMetricSnapshot(campaign: Campaign): MetricSnapshot {
    const spent = campaign.spent ?? campaign.budget.spent ?? 0;
    return {
      timestamp: new Date(),
      impressions: campaign.metrics.impressions,
      clicks: campaign.metrics.clicks,
      conversions: campaign.metrics.conversions,
      spend: spent,
      revenue: campaign.metrics.conversions * (campaign.metrics.roas * spent / Math.max(1, campaign.metrics.conversions)),
      ctr: campaign.metrics.ctr,
      cpc: campaign.metrics.cpc,
      cpa: campaign.metrics.cpa,
      roas: campaign.metrics.roas,
    };
  }

  /**
   * Aggregate metrics from multiple campaigns
   */
  private aggregateMetrics(campaigns: Campaign[]): MetricSnapshot {
    const totals = campaigns.reduce(
      (acc, c) => {
        const spent = c.spent ?? c.budget.spent ?? 0;
        return {
          impressions: acc.impressions + c.metrics.impressions,
          clicks: acc.clicks + c.metrics.clicks,
          conversions: acc.conversions + c.metrics.conversions,
          spend: acc.spend + spent,
          revenue: acc.revenue + (c.metrics.roas * spent),
        };
      },
      { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 }
    );

    return {
      timestamp: new Date(),
      ...totals,
      ctr: totals.impressions > 0 ? totals.clicks / totals.impressions : 0,
      cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
      cpa: totals.conversions > 0 ? totals.spend / totals.conversions : 0,
      roas: totals.spend > 0 ? totals.revenue / totals.spend : 0,
    };
  }

  /**
   * Analyze trends from history
   */
  private analyzeTrends(history: MetricSnapshot[]): TrendAnalysis {
    if (history.length < 2) {
      return {
        impressionsTrend: 0,
        clicksTrend: 0,
        conversionsTrend: 0,
        spendTrend: 0,
        roasTrend: 0,
        direction: 'stable',
      };
    }

    const calculateTrend = (metric: keyof MetricSnapshot): number => {
      const values = history.map((h) => h[metric] as number);
      const n = values.length;
      const recentAvg = this.mean(values.slice(-Math.ceil(n / 3)));
      const olderAvg = this.mean(values.slice(0, Math.ceil(n / 3)));
      return olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;
    };

    const impressionsTrend = calculateTrend('impressions');
    const clicksTrend = calculateTrend('clicks');
    const conversionsTrend = calculateTrend('conversions');
    const spendTrend = calculateTrend('spend');
    const roasTrend = calculateTrend('roas');

    // Determine overall direction
    const avgTrend = (roasTrend + conversionsTrend + clicksTrend) / 3;
    const direction: TrendAnalysis['direction'] =
      avgTrend > 0.05 ? 'improving' : avgTrend < -0.05 ? 'declining' : 'stable';

    return {
      impressionsTrend,
      clicksTrend,
      conversionsTrend,
      spendTrend,
      roasTrend,
      direction,
    };
  }

  /**
   * Generate campaign-specific insights
   */
  private generateCampaignInsights(campaign: Campaign, trends: TrendAnalysis): Insight[] {
    const insights: Insight[] = [];

    // Budget utilization
    const spent = campaign.spent ?? campaign.budget.spent ?? 0;
    const totalBudget = campaign.budget.total;
    const utilization = totalBudget > 0 ? spent / totalBudget : 0;
    if (utilization < 0.3) {
      insights.push({
        type: 'warning',
        severity: 'medium',
        message: 'Budget underutilization detected',
        metric: 'spend',
        value: utilization * 100,
        recommendation: 'Consider increasing bids or expanding targeting',
      });
    } else if (utilization > 0.95) {
      insights.push({
        type: 'warning',
        severity: 'high',
        message: 'Budget nearly exhausted',
        metric: 'spend',
        value: utilization * 100,
        recommendation: 'Review budget allocation or increase daily cap',
      });
    }

    // ROAS performance
    if (campaign.metrics.roas > 4) {
      insights.push({
        type: 'achievement',
        severity: 'low',
        message: 'Excellent ROAS performance',
        metric: 'roas',
        value: campaign.metrics.roas,
        recommendation: 'Consider scaling budget for this campaign',
      });
    } else if (campaign.metrics.roas < 1) {
      insights.push({
        type: 'warning',
        severity: 'high',
        message: 'ROAS below break-even',
        metric: 'roas',
        value: campaign.metrics.roas,
        recommendation: 'Urgent optimization needed or pause campaign',
      });
    }

    // Trend-based insights
    if (trends.direction === 'declining') {
      insights.push({
        type: 'warning',
        severity: 'medium',
        message: 'Performance trending downward',
        recommendation: 'Review recent changes and consider creative refresh',
      });
    } else if (trends.direction === 'improving') {
      insights.push({
        type: 'opportunity',
        severity: 'low',
        message: 'Positive performance trend detected',
        recommendation: 'Opportunity to scale while momentum is strong',
      });
    }

    return insights;
  }

  /**
   * Generate platform-specific insights
   */
  private generatePlatformInsights(
    platform: Platform,
    metrics: MetricSnapshot,
    trends: TrendAnalysis
  ): Insight[] {
    const insights: Insight[] = [];

    // Platform-specific thresholds
    const thresholds: Record<Platform, { ctr: number; cpc: number }> = {
      'google_ads': { ctr: 0.02, cpc: 2.0 },
      'meta': { ctr: 0.015, cpc: 1.5 },
      'tiktok': { ctr: 0.01, cpc: 0.5 },
      'linkedin': { ctr: 0.005, cpc: 5.0 },
    };

    const platformThreshold = thresholds[platform];
    if (platformThreshold) {
      if (metrics.ctr < platformThreshold.ctr) {
        insights.push({
          type: 'warning',
          severity: 'medium',
          message: `CTR below ${platform} average`,
          metric: 'ctr',
          value: metrics.ctr,
          recommendation: 'Test new ad creatives and refine targeting',
        });
      }

      if (metrics.cpc > platformThreshold.cpc * 1.5) {
        insights.push({
          type: 'warning',
          severity: 'medium',
          message: `CPC above ${platform} benchmarks`,
          metric: 'cpc',
          value: metrics.cpc,
          recommendation: 'Review bidding strategy and audience overlap',
        });
      }
    }

    return insights;
  }

  /**
   * Calculate percentile based on value vs average
   */
  private calculatePercentile(value: number, average: number): number {
    const ratio = value / average;
    // Approximate percentile using ratio
    return Math.min(99, Math.max(1, 50 + (ratio - 1) * 30));
  }

  /**
   * Calculate mean
   */
  private mean(values: number[]): number {
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  /**
   * Calculate standard deviation
   */
  private stdDev(values: number[]): number {
    const m = this.mean(values);
    const variance = this.mean(values.map((x) => (x - m) ** 2));
    return Math.sqrt(variance);
  }
}

// Singleton instance
let serviceInstance: AnalyticsService | null = null;

export function getAnalyticsService(): AnalyticsService {
  if (!serviceInstance) {
    serviceInstance = new AnalyticsService();
  }
  return serviceInstance;
}
