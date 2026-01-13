/**
 * Risk Detection Agent - Spend Trap Identification
 * Tier 2: Intelligence
 *
 * Responsibilities:
 * - Identify spend traps and budget waste
 * - Detect fraudulent activity patterns
 * - Monitor budget pacing anomalies
 * - Quality score degradation alerts
 * - Competitor activity detection
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  AgentConfig,
  TaskContext,
  DomainEvent,
  EventType,
  Campaign,
  RiskAlert,
  Platform,
} from '../../types/index.js';
import { BaseAgent, AgentDependencies } from '../base-agent.js';

// ============================================================================
// Types
// ============================================================================

export interface RiskInput {
  action: 'scan' | 'analyze_campaign' | 'detect_fraud' | 'monitor_pacing' | 'assess_quality';
  campaign?: Campaign;
  campaigns?: Campaign[];
  metrics?: RiskMetricsInput;
  timeWindow?: { start: Date; end: Date };
}

export interface RiskMetricsInput {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  bounceRate?: number;
  avgSessionDuration?: number;
  clickPatterns?: ClickPattern[];
}

export interface ClickPattern {
  timestamp: Date;
  ip: string;
  userAgent: string;
  geo: string;
}

export interface RiskOutput {
  action: string;
  result: {
    alerts?: RiskAlert[];
    riskScore?: number;
    fraudIndicators?: FraudIndicator[];
    pacingAnalysis?: PacingAnalysis;
    qualityAssessment?: QualityAssessment;
    recommendations?: string[];
  };
}

export interface FraudIndicator {
  type: 'click_farm' | 'bot_traffic' | 'competitor_click' | 'geo_mismatch' | 'time_pattern';
  confidence: number;
  evidence: string[];
  affectedSpend: number;
}

export interface PacingAnalysis {
  currentSpend: number;
  expectedSpend: number;
  pacingRate: number; // Actual vs expected
  projection: {
    endOfDaySpend: number;
    endOfPeriodSpend: number;
    willExceedBudget: boolean;
    willUnderdeliver: boolean;
  };
  recommendations: string[];
}

export interface QualityAssessment {
  overallScore: number;
  components: {
    adRelevance: number;
    landingPageExperience: number;
    expectedCtr: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  issues: string[];
}

export interface RiskThresholds {
  spendTrapCtrThreshold: number;
  fraudClickRateThreshold: number;
  pacingDeviationThreshold: number;
  qualityScoreMinimum: number;
}

// ============================================================================
// Configuration
// ============================================================================

export const riskDetectionConfig: AgentConfig = {
  id: 'risk-detection',
  tier: 2,
  name: 'Risk Detection Agent',
  description: 'Identify spend traps, fraud, and budget anomalies',
  capabilities: [
    {
      id: 'spend_trap_detection',
      name: 'Spend Trap Detection',
      description: 'Identify campaigns wasting budget without results',
      inputTypes: ['campaign', 'metrics'],
      outputTypes: ['risk_alerts'],
    },
    {
      id: 'fraud_detection',
      name: 'Fraud Detection',
      description: 'Detect click fraud and bot traffic',
      inputTypes: ['click_patterns', 'metrics'],
      outputTypes: ['fraud_indicators'],
    },
    {
      id: 'pacing_monitor',
      name: 'Budget Pacing Monitor',
      description: 'Monitor budget pacing and predict overspend',
      inputTypes: ['campaign', 'time_window'],
      outputTypes: ['pacing_analysis'],
    },
    {
      id: 'quality_assessment',
      name: 'Quality Score Assessment',
      description: 'Monitor and assess quality score trends',
      inputTypes: ['campaign'],
      outputTypes: ['quality_assessment'],
    },
  ],
  maxConcurrency: 6,
  timeoutMs: 15000,
  priority: 80,
  dependencies: ['memory'],
};

const DEFAULT_THRESHOLDS: RiskThresholds = {
  spendTrapCtrThreshold: 0.005, // CTR below 0.5% is suspicious
  fraudClickRateThreshold: 0.15, // 15% fraud rate triggers alert
  pacingDeviationThreshold: 0.2, // 20% deviation from expected
  qualityScoreMinimum: 5,
};

// ============================================================================
// Risk Detection Agent Implementation
// ============================================================================

export class RiskDetectionAgent extends BaseAgent<RiskInput, RiskOutput> {
  private thresholds: RiskThresholds;
  private alertHistory: RiskAlert[];
  private maxAlertHistory: number = 1000;

  constructor(deps?: AgentDependencies, thresholds?: Partial<RiskThresholds>) {
    super(riskDetectionConfig, deps);
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
    this.alertHistory = [];
  }

  /**
   * Main processing logic
   */
  protected async process(
    input: RiskInput,
    context: TaskContext
  ): Promise<RiskOutput> {
    this.logger.info('Processing risk detection request', { action: input.action });

    switch (input.action) {
      case 'scan':
        return this.scanForRisks(input, context);
      case 'analyze_campaign':
        return this.analyzeCampaign(input, context);
      case 'detect_fraud':
        return this.detectFraud(input, context);
      case 'monitor_pacing':
        return this.monitorPacing(input);
      case 'assess_quality':
        return this.assessQuality(input);
      default:
        throw new Error(`Unknown action: ${input.action}`);
    }
  }

  /**
   * Scan multiple campaigns for risks
   */
  private async scanForRisks(
    input: RiskInput,
    context: TaskContext
  ): Promise<RiskOutput> {
    const campaigns = input.campaigns ?? (input.campaign ? [input.campaign] : []);
    const alerts: RiskAlert[] = [];
    let totalRiskScore = 0;

    for (const campaign of campaigns) {
      const campaignAlerts = await this.analyzeSingleCampaign(campaign, context);
      alerts.push(...campaignAlerts);
      totalRiskScore += this.calculateCampaignRiskScore(campaign, campaignAlerts);
    }

    const avgRiskScore = campaigns.length > 0 ? totalRiskScore / campaigns.length : 0;

    // Store alerts
    this.storeAlerts(alerts);

    return {
      action: 'scan',
      result: {
        alerts,
        riskScore: avgRiskScore,
        recommendations: this.generateRecommendations(alerts),
      },
    };
  }

  /**
   * Analyze a single campaign for risks
   */
  private async analyzeCampaign(
    input: RiskInput,
    context: TaskContext
  ): Promise<RiskOutput> {
    if (!input.campaign) {
      throw new Error('Campaign is required for analysis');
    }

    const alerts = await this.analyzeSingleCampaign(input.campaign, context);
    const riskScore = this.calculateCampaignRiskScore(input.campaign, alerts);

    // Emit event if high risk
    if (riskScore > 0.7) {
      await this.emitEvent(
        'intelligence.risk_identified',
        input.campaign.id,
        'campaign',
        { riskScore, alertCount: alerts.length },
        context.correlationId
      );
    }

    return {
      action: 'analyze_campaign',
      result: {
        alerts,
        riskScore,
        recommendations: this.generateRecommendations(alerts),
      },
    };
  }

  /**
   * Analyze a single campaign and return alerts
   */
  private async analyzeSingleCampaign(
    campaign: Campaign,
    context: TaskContext
  ): Promise<RiskAlert[]> {
    const alerts: RiskAlert[] = [];

    // Check for spend trap
    if (this.isSpendTrap(campaign)) {
      alerts.push({
        id: uuidv4(),
        type: 'spend_trap',
        severity: 'high',
        campaignId: campaign.id,
        description: `Campaign has low CTR (${(campaign.metrics.ctr * 100).toFixed(2)}%) and no conversions`,
        recommendation: 'Pause campaign and review targeting/creative',
        metrics: {
          ctr: campaign.metrics.ctr,
          conversions: campaign.metrics.conversions,
          spend: campaign.metrics.spend,
        },
        detectedAt: new Date(),
      });
    }

    // Check budget pacing
    const pacingRisk = this.checkBudgetPacing(campaign);
    if (pacingRisk) {
      alerts.push(pacingRisk);
    }

    // Check quality score
    if (campaign.metrics.qualityScore && campaign.metrics.qualityScore < this.thresholds.qualityScoreMinimum) {
      alerts.push({
        id: uuidv4(),
        type: 'quality_drop',
        severity: 'medium',
        campaignId: campaign.id,
        description: `Quality score dropped to ${campaign.metrics.qualityScore}`,
        recommendation: 'Improve ad relevance and landing page experience',
        metrics: { qualityScore: campaign.metrics.qualityScore },
        detectedAt: new Date(),
      });
    }

    return alerts;
  }

  /**
   * Detect fraud patterns
   */
  private async detectFraud(
    input: RiskInput,
    context: TaskContext
  ): Promise<RiskOutput> {
    const { metrics, campaign } = input;
    const fraudIndicators: FraudIndicator[] = [];

    if (!metrics) {
      return {
        action: 'detect_fraud',
        result: { fraudIndicators, riskScore: 0 },
      };
    }

    // Check for abnormal click-to-conversion ratio
    if (metrics.clicks > 0 && metrics.conversions === 0 && metrics.spend > 100) {
      fraudIndicators.push({
        type: 'click_farm',
        confidence: 0.7,
        evidence: [
          `${metrics.clicks} clicks with 0 conversions`,
          `$${metrics.spend.toFixed(2)} spent without results`,
        ],
        affectedSpend: metrics.spend * 0.5,
      });
    }

    // Check bounce rate
    if (metrics.bounceRate && metrics.bounceRate > 0.95) {
      fraudIndicators.push({
        type: 'bot_traffic',
        confidence: 0.8,
        evidence: [
          `Bounce rate ${(metrics.bounceRate * 100).toFixed(1)}% is abnormally high`,
          'Typical of bot traffic',
        ],
        affectedSpend: metrics.spend * 0.3,
      });
    }

    // Check session duration
    if (metrics.avgSessionDuration !== undefined && metrics.avgSessionDuration < 2) {
      fraudIndicators.push({
        type: 'bot_traffic',
        confidence: 0.6,
        evidence: [
          `Average session duration ${metrics.avgSessionDuration.toFixed(1)}s is too short`,
        ],
        affectedSpend: metrics.spend * 0.2,
      });
    }

    // Check click patterns
    if (metrics.clickPatterns && metrics.clickPatterns.length > 0) {
      const patternIndicators = this.analyzeClickPatterns(metrics.clickPatterns);
      fraudIndicators.push(...patternIndicators);
    }

    const riskScore = this.calculateFraudRiskScore(fraudIndicators);

    // Create alert if significant fraud detected
    if (riskScore > 0.5 && campaign) {
      const alert: RiskAlert = {
        id: uuidv4(),
        type: 'fraud',
        severity: riskScore > 0.7 ? 'critical' : 'high',
        campaignId: campaign.id,
        description: `Fraud indicators detected: ${fraudIndicators.map((f) => f.type).join(', ')}`,
        recommendation: 'Review traffic sources and consider IP exclusions',
        metrics: {
          fraudScore: riskScore,
          affectedSpend: fraudIndicators.reduce((sum, f) => sum + f.affectedSpend, 0),
        },
        detectedAt: new Date(),
      };
      this.storeAlerts([alert]);
    }

    return {
      action: 'detect_fraud',
      result: {
        fraudIndicators,
        riskScore,
        recommendations: fraudIndicators.length > 0
          ? ['Review traffic quality', 'Add IP exclusions', 'Enable fraud protection']
          : ['No fraud indicators detected'],
      },
    };
  }

  /**
   * Monitor budget pacing
   */
  private async monitorPacing(input: RiskInput): Promise<RiskOutput> {
    if (!input.campaign) {
      throw new Error('Campaign is required for pacing monitoring');
    }

    const campaign = input.campaign;
    const now = new Date();
    const hourOfDay = now.getHours();
    const expectedPacingRate = hourOfDay / 24;

    const actualPacingRate = campaign.budget.spent / campaign.budget.daily;
    const pacingDeviation = actualPacingRate - expectedPacingRate;

    const projection = {
      endOfDaySpend: (campaign.budget.spent / Math.max(expectedPacingRate, 0.01)),
      endOfPeriodSpend: campaign.budget.spent * (1 + (1 - expectedPacingRate) / Math.max(expectedPacingRate, 0.01)),
      willExceedBudget: actualPacingRate > expectedPacingRate * 1.2,
      willUnderdeliver: actualPacingRate < expectedPacingRate * 0.8,
    };

    const recommendations: string[] = [];
    if (projection.willExceedBudget) {
      recommendations.push('Reduce bids or tighten targeting to slow spend');
    }
    if (projection.willUnderdeliver) {
      recommendations.push('Increase bids or expand targeting to increase delivery');
    }

    const pacingAnalysis: PacingAnalysis = {
      currentSpend: campaign.budget.spent,
      expectedSpend: campaign.budget.daily * expectedPacingRate,
      pacingRate: actualPacingRate / Math.max(expectedPacingRate, 0.01),
      projection,
      recommendations,
    };

    // Create alert if pacing is significantly off
    const alerts: RiskAlert[] = [];
    if (Math.abs(pacingDeviation) > this.thresholds.pacingDeviationThreshold) {
      alerts.push({
        id: uuidv4(),
        type: 'budget_pacing',
        severity: Math.abs(pacingDeviation) > 0.3 ? 'high' : 'medium',
        campaignId: campaign.id,
        description: projection.willExceedBudget
          ? 'Budget pacing too fast - will overspend'
          : 'Budget pacing too slow - will underdeliver',
        recommendation: recommendations[0] ?? 'Monitor pacing',
        metrics: {
          pacingRate: pacingAnalysis.pacingRate,
          deviation: pacingDeviation,
        },
        detectedAt: new Date(),
      });
    }

    return {
      action: 'monitor_pacing',
      result: {
        pacingAnalysis,
        alerts,
        riskScore: Math.min(1, Math.abs(pacingDeviation) * 2),
      },
    };
  }

  /**
   * Assess quality score
   */
  private async assessQuality(input: RiskInput): Promise<RiskOutput> {
    if (!input.campaign) {
      throw new Error('Campaign is required for quality assessment');
    }

    const campaign = input.campaign;

    // Mock quality components (in real implementation, fetch from platform)
    const components = {
      adRelevance: Math.min(10, Math.max(1, (campaign.metrics.qualityScore ?? 7) + (Math.random() - 0.5) * 2)),
      landingPageExperience: Math.min(10, Math.max(1, (campaign.metrics.qualityScore ?? 7) + (Math.random() - 0.5) * 2)),
      expectedCtr: Math.min(10, Math.max(1, (campaign.metrics.qualityScore ?? 7) + (Math.random() - 0.5) * 2)),
    };

    const overallScore = (components.adRelevance + components.landingPageExperience + components.expectedCtr) / 3;

    const issues: string[] = [];
    if (components.adRelevance < 5) issues.push('Low ad relevance - improve keyword-ad alignment');
    if (components.landingPageExperience < 5) issues.push('Poor landing page experience - improve load time and content');
    if (components.expectedCtr < 5) issues.push('Low expected CTR - improve ad copy');

    const qualityAssessment: QualityAssessment = {
      overallScore,
      components,
      trend: overallScore > 7 ? 'improving' : overallScore > 5 ? 'stable' : 'declining',
      issues,
    };

    return {
      action: 'assess_quality',
      result: {
        qualityAssessment,
        riskScore: Math.max(0, (10 - overallScore) / 10),
        recommendations: issues.length > 0 ? issues : ['Quality score is healthy'],
      },
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private isSpendTrap(campaign: Campaign): boolean {
    return (
      campaign.metrics.ctr < this.thresholds.spendTrapCtrThreshold &&
      campaign.metrics.conversions === 0 &&
      campaign.metrics.spend > 50
    );
  }

  private checkBudgetPacing(campaign: Campaign): RiskAlert | null {
    const pacingRate = campaign.budget.spent / campaign.budget.daily;
    const hourOfDay = new Date().getHours();
    const expectedRate = hourOfDay / 24;

    if (Math.abs(pacingRate - expectedRate) > this.thresholds.pacingDeviationThreshold) {
      return {
        id: uuidv4(),
        type: 'budget_pacing',
        severity: 'medium',
        campaignId: campaign.id,
        description: `Budget pacing deviation: ${((pacingRate - expectedRate) * 100).toFixed(0)}%`,
        recommendation: pacingRate > expectedRate
          ? 'Consider reducing bids'
          : 'Consider increasing bids or expanding targeting',
        metrics: { pacingRate, expectedRate },
        detectedAt: new Date(),
      };
    }
    return null;
  }

  private analyzeClickPatterns(patterns: ClickPattern[]): FraudIndicator[] {
    const indicators: FraudIndicator[] = [];

    // Check for repeated IPs
    const ipCounts = new Map<string, number>();
    for (const pattern of patterns) {
      ipCounts.set(pattern.ip, (ipCounts.get(pattern.ip) ?? 0) + 1);
    }

    const suspiciousIps = Array.from(ipCounts.entries()).filter(([_, count]) => count > 5);
    if (suspiciousIps.length > 0) {
      indicators.push({
        type: 'competitor_click',
        confidence: 0.75,
        evidence: suspiciousIps.map(([ip, count]) => `IP ${ip} clicked ${count} times`),
        affectedSpend: suspiciousIps.reduce((sum, [_, count]) => sum + count, 0) * 0.5,
      });
    }

    // Check for geographic anomalies
    const geoCounts = new Map<string, number>();
    for (const pattern of patterns) {
      geoCounts.set(pattern.geo, (geoCounts.get(pattern.geo) ?? 0) + 1);
    }

    return indicators;
  }

  private calculateCampaignRiskScore(campaign: Campaign, alerts: RiskAlert[]): number {
    let score = 0;

    // Base risk from alerts
    for (const alert of alerts) {
      switch (alert.severity) {
        case 'critical':
          score += 0.4;
          break;
        case 'high':
          score += 0.25;
          break;
        case 'medium':
          score += 0.15;
          break;
        case 'low':
          score += 0.05;
          break;
      }
    }

    // Additional risk factors
    if (campaign.metrics.roas < 1) score += 0.2;
    if (campaign.metrics.conversions === 0 && campaign.metrics.spend > 100) score += 0.3;

    return Math.min(1, score);
  }

  private calculateFraudRiskScore(indicators: FraudIndicator[]): number {
    if (indicators.length === 0) return 0;
    return Math.min(1, indicators.reduce((sum, i) => sum + i.confidence * 0.3, 0));
  }

  private generateRecommendations(alerts: RiskAlert[]): string[] {
    const recommendations: string[] = [];

    const alertTypes = new Set(alerts.map((a) => a.type));

    if (alertTypes.has('spend_trap')) {
      recommendations.push('Review and pause underperforming campaigns');
    }
    if (alertTypes.has('fraud')) {
      recommendations.push('Implement click fraud protection');
    }
    if (alertTypes.has('budget_pacing')) {
      recommendations.push('Adjust bidding strategy for better pacing');
    }
    if (alertTypes.has('quality_drop')) {
      recommendations.push('Improve ad relevance and landing page quality');
    }

    if (recommendations.length === 0) {
      recommendations.push('No immediate actions required');
    }

    return recommendations;
  }

  private storeAlerts(alerts: RiskAlert[]): void {
    this.alertHistory.push(...alerts);
    if (this.alertHistory.length > this.maxAlertHistory) {
      this.alertHistory = this.alertHistory.slice(-this.maxAlertHistory);
    }
  }

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  protected async onInitialize(): Promise<void> {
    this.logger.info('Risk detection agent initializing');
  }

  protected async onShutdown(): Promise<void> {
    this.logger.info('Risk detection agent shutting down');
    this.logger.info(`Total alerts generated: ${this.alertHistory.length}`);
  }

  protected getSubscribedEvents(): EventType[] {
    return ['campaign.created', 'campaign.budget_adjusted', 'campaign.anomaly_detected'];
  }

  protected async handleEvent(event: DomainEvent): Promise<void> {
    if (event.type === 'campaign.anomaly_detected') {
      this.logger.warn('Anomaly detected event received', { campaignId: event.aggregateId });
    }
  }
}
