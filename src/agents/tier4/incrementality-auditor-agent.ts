/**
 * Incrementality Auditor Agent - True Lift Measurement
 * Tier 4: Attribution
 *
 * Responsibilities:
 * - Measure true incremental lift of campaigns
 * - Design and analyze holdout tests
 * - Calculate statistical significance
 * - Detect cannibalization effects
 * - Recommend test configurations
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  AgentConfig,
  TaskContext,
  DomainEvent,
  EventType,
  Campaign,
  IncrementalityResult,
  GroupMetrics,
} from '../../types/index.js';
import { BaseAgent, AgentDependencies } from '../base-agent.js';

// ============================================================================
// Types
// ============================================================================

export interface IncrementalityInput {
  action: 'analyze_lift' | 'design_test' | 'validate_significance' | 'detect_cannibalization' | 'recommend_holdout';
  campaign?: Campaign;
  testData?: TestData;
  parameters?: TestParameters;
}

export interface TestData {
  testGroup: GroupMetrics;
  controlGroup: GroupMetrics;
  testPeriod: { start: Date; end: Date };
  testType: 'geo_holdout' | 'user_holdout' | 'time_holdout' | 'matched_market';
}

export interface TestParameters {
  confidenceLevel: number;
  minDetectableEffect: number;
  power: number;
  duration: number;
  holdoutPercentage: number;
}

export interface IncrementalityOutput {
  action: string;
  result: {
    incrementality?: IncrementalityResult;
    testDesign?: TestDesign;
    significanceResult?: SignificanceResult;
    cannibalizationAnalysis?: CannibalizationAnalysis;
    holdoutRecommendation?: HoldoutRecommendation;
  };
}

export interface TestDesign {
  id: string;
  type: 'geo_holdout' | 'user_holdout' | 'time_holdout' | 'matched_market';
  testGroupSize: number;
  controlGroupSize: number;
  duration: number;
  expectedPower: number;
  minDetectableEffect: number;
  setup: TestSetupInstructions;
}

export interface TestSetupInstructions {
  steps: string[];
  segmentationRules: SegmentationRule[];
  monitoringGuidelines: string[];
  successCriteria: string[];
}

export interface SegmentationRule {
  dimension: string;
  operator: 'equals' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  values: string[];
}

export interface SignificanceResult {
  significant: boolean;
  pValue: number;
  confidenceInterval: [number, number];
  effectSize: number;
  power: number;
  sampleSizeAdequate: boolean;
  recommendation: string;
}

export interface CannibalizationAnalysis {
  detected: boolean;
  severity: 'none' | 'low' | 'moderate' | 'high';
  affectedChannels: string[];
  estimatedImpact: number;
  recommendations: string[];
}

export interface HoldoutRecommendation {
  recommendedPercentage: number;
  recommendedDuration: number;
  expectedCost: number;
  expectedInsight: string;
  tradeoffs: string[];
}

// ============================================================================
// Configuration
// ============================================================================

export const incrementalityAuditorConfig: AgentConfig = {
  id: 'incrementality',
  tier: 4,
  name: 'Incrementality Auditor Agent',
  description: 'Measure true incremental lift and design holdout tests',
  capabilities: [
    {
      id: 'lift_measurement',
      name: 'Lift Measurement',
      description: 'Measure true incremental lift of campaigns',
      inputTypes: ['test_data', 'campaign'],
      outputTypes: ['incrementality_result'],
    },
    {
      id: 'holdout_analysis',
      name: 'Holdout Analysis',
      description: 'Analyze holdout test results',
      inputTypes: ['test_data'],
      outputTypes: ['analysis'],
    },
    {
      id: 'incrementality_test',
      name: 'Test Design',
      description: 'Design incrementality tests',
      inputTypes: ['campaign', 'parameters'],
      outputTypes: ['test_design'],
    },
    {
      id: 'significance_testing',
      name: 'Statistical Significance',
      description: 'Validate statistical significance of results',
      inputTypes: ['test_data'],
      outputTypes: ['significance_result'],
    },
  ],
  maxConcurrency: 4,
  timeoutMs: 25000,
  priority: 55,
  dependencies: ['simulation', 'counterfactual'],
};

// ============================================================================
// Statistical Utilities
// ============================================================================

class StatisticalEngine {
  /**
   * Calculate Z-score for two-sample proportion test
   */
  calculateZScore(
    rate1: number,
    rate2: number,
    n1: number,
    n2: number
  ): number {
    const pooledRate = (rate1 * n1 + rate2 * n2) / (n1 + n2);
    const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1 / n1 + 1 / n2));
    return se > 0 ? (rate1 - rate2) / se : 0;
  }

  /**
   * Calculate p-value from Z-score (two-tailed)
   */
  zToPValue(z: number): number {
    // Approximation of the standard normal CDF
    const absZ = Math.abs(z);
    const t = 1 / (1 + 0.2316419 * absZ);
    const d = 0.3989423 * Math.exp(-absZ * absZ / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return 2 * (z > 0 ? p : 1 - p);
  }

  /**
   * Calculate confidence interval for lift
   */
  calculateConfidenceInterval(
    lift: number,
    testRate: number,
    controlRate: number,
    testN: number,
    controlN: number,
    confidence: number = 0.95
  ): [number, number] {
    const zCritical = this.getZCritical(confidence);

    // Standard error of the relative lift
    const se = Math.sqrt(
      (testRate * (1 - testRate)) / testN +
      (controlRate * (1 - controlRate)) / controlN
    ) / Math.max(controlRate, 0.001);

    return [
      lift - zCritical * se,
      lift + zCritical * se,
    ];
  }

  /**
   * Get Z critical value for confidence level
   */
  getZCritical(confidence: number): number {
    const alphaHalf = (1 - confidence) / 2;
    // Approximation for common confidence levels
    if (confidence >= 0.99) return 2.576;
    if (confidence >= 0.95) return 1.96;
    if (confidence >= 0.90) return 1.645;
    return 1.96;
  }

  /**
   * Calculate required sample size
   */
  calculateSampleSize(
    baselineRate: number,
    minDetectableEffect: number,
    power: number = 0.8,
    alpha: number = 0.05
  ): number {
    const zAlpha = this.getZCritical(1 - alpha);
    const zBeta = this.getZCritical(power * 2 - 1);

    const p1 = baselineRate;
    const p2 = baselineRate * (1 + minDetectableEffect);
    const pAvg = (p1 + p2) / 2;

    const n = 2 * Math.pow(zAlpha + zBeta, 2) * pAvg * (1 - pAvg) /
      Math.pow(p1 - p2, 2);

    return Math.ceil(n);
  }

  /**
   * Calculate statistical power
   */
  calculatePower(
    testRate: number,
    controlRate: number,
    testN: number,
    controlN: number,
    alpha: number = 0.05
  ): number {
    const effect = Math.abs(testRate - controlRate);
    const pooledVar = (testRate * (1 - testRate)) / testN +
                      (controlRate * (1 - controlRate)) / controlN;
    const se = Math.sqrt(pooledVar);

    const zAlpha = this.getZCritical(1 - alpha);
    const zEffect = effect / se;

    // Approximate power
    return Math.min(0.99, Math.max(0.1, 1 - this.zToPValue(zEffect - zAlpha)));
  }

  /**
   * Calculate effect size (Cohen's h)
   */
  calculateEffectSize(rate1: number, rate2: number): number {
    const phi1 = 2 * Math.asin(Math.sqrt(rate1));
    const phi2 = 2 * Math.asin(Math.sqrt(rate2));
    return Math.abs(phi1 - phi2);
  }
}

// ============================================================================
// Incrementality Auditor Agent Implementation
// ============================================================================

export class IncrementalityAuditorAgent extends BaseAgent<IncrementalityInput, IncrementalityOutput> {
  private stats: StatisticalEngine;
  private testHistory: Map<string, IncrementalityResult>;

  constructor(deps?: AgentDependencies) {
    super(incrementalityAuditorConfig, deps);
    this.stats = new StatisticalEngine();
    this.testHistory = new Map();
  }

  /**
   * Main processing logic
   */
  protected async process(
    input: IncrementalityInput,
    context: TaskContext
  ): Promise<IncrementalityOutput> {
    this.logger.info('Processing incrementality audit request', { action: input.action });

    switch (input.action) {
      case 'analyze_lift':
        return this.analyzeLift(input, context);
      case 'design_test':
        return this.designTest(input);
      case 'validate_significance':
        return this.validateSignificance(input);
      case 'detect_cannibalization':
        return this.detectCannibalization(input);
      case 'recommend_holdout':
        return this.recommendHoldout(input);
      default:
        throw new Error(`Unknown action: ${input.action}`);
    }
  }

  /**
   * Analyze incremental lift from test data
   */
  private async analyzeLift(
    input: IncrementalityInput,
    context: TaskContext
  ): Promise<IncrementalityOutput> {
    const { campaign, testData } = input;

    if (!testData) {
      throw new Error('Test data is required for lift analysis');
    }

    const { testGroup, controlGroup, testPeriod } = testData;

    // Calculate lift
    const incrementalLift = (testGroup.conversionRate - controlGroup.conversionRate) /
      Math.max(controlGroup.conversionRate, 0.001);

    // Calculate statistical significance
    const zScore = this.stats.calculateZScore(
      testGroup.conversionRate,
      controlGroup.conversionRate,
      testGroup.size,
      controlGroup.size
    );
    const pValue = this.stats.zToPValue(zScore);
    const statisticalSignificance = 1 - pValue;

    // Calculate confidence
    const ci = this.stats.calculateConfidenceInterval(
      incrementalLift,
      testGroup.conversionRate,
      controlGroup.conversionRate,
      testGroup.size,
      controlGroup.size,
      0.95
    );
    const confidence = pValue < 0.05 ? 0.95 : 1 - pValue;

    const incrementality: IncrementalityResult = {
      id: uuidv4(),
      campaignId: campaign?.id ?? 'unknown',
      testGroup,
      controlGroup,
      incrementalLift,
      statisticalSignificance,
      confidence,
      testPeriod,
    };

    // Store in history
    this.testHistory.set(incrementality.id, incrementality);

    return {
      action: 'analyze_lift',
      result: { incrementality },
    };
  }

  /**
   * Design an incrementality test
   */
  private async designTest(input: IncrementalityInput): Promise<IncrementalityOutput> {
    const { campaign, parameters } = input;

    if (!campaign) {
      throw new Error('Campaign is required for test design');
    }

    const params = parameters ?? {
      confidenceLevel: 0.95,
      minDetectableEffect: 0.1, // 10% minimum detectable effect
      power: 0.8,
      duration: 14, // days
      holdoutPercentage: 0.1, // 10%
    };

    // Calculate required sample sizes
    const baselineRate = campaign.metrics.conversions / Math.max(campaign.metrics.clicks, 1);
    const totalSampleSize = this.stats.calculateSampleSize(
      baselineRate,
      params.minDetectableEffect,
      params.power,
      1 - params.confidenceLevel
    );

    const controlGroupSize = Math.ceil(totalSampleSize * params.holdoutPercentage);
    const testGroupSize = totalSampleSize - controlGroupSize;

    // Determine best test type
    const testType = this.recommendTestType(campaign, params);

    // Create setup instructions
    const setup = this.createSetupInstructions(testType, campaign, params);

    const testDesign: TestDesign = {
      id: uuidv4(),
      type: testType,
      testGroupSize,
      controlGroupSize,
      duration: params.duration,
      expectedPower: params.power,
      minDetectableEffect: params.minDetectableEffect,
      setup,
    };

    return {
      action: 'design_test',
      result: { testDesign },
    };
  }

  /**
   * Validate statistical significance
   */
  private async validateSignificance(input: IncrementalityInput): Promise<IncrementalityOutput> {
    const { testData, parameters } = input;

    if (!testData) {
      throw new Error('Test data is required for significance validation');
    }

    const { testGroup, controlGroup } = testData;
    const alpha = 1 - (parameters?.confidenceLevel ?? 0.95);

    // Calculate Z-score and p-value
    const zScore = this.stats.calculateZScore(
      testGroup.conversionRate,
      controlGroup.conversionRate,
      testGroup.size,
      controlGroup.size
    );
    const pValue = this.stats.zToPValue(zScore);

    // Calculate effect size
    const effectSize = this.stats.calculateEffectSize(
      testGroup.conversionRate,
      controlGroup.conversionRate
    );

    // Calculate achieved power
    const power = this.stats.calculatePower(
      testGroup.conversionRate,
      controlGroup.conversionRate,
      testGroup.size,
      controlGroup.size,
      alpha
    );

    // Calculate lift and confidence interval
    const lift = (testGroup.conversionRate - controlGroup.conversionRate) /
      Math.max(controlGroup.conversionRate, 0.001);
    const ci = this.stats.calculateConfidenceInterval(
      lift,
      testGroup.conversionRate,
      controlGroup.conversionRate,
      testGroup.size,
      controlGroup.size,
      1 - alpha
    );

    // Check sample size adequacy
    const requiredSampleSize = this.stats.calculateSampleSize(
      controlGroup.conversionRate,
      parameters?.minDetectableEffect ?? 0.1,
      parameters?.power ?? 0.8,
      alpha
    );
    const sampleSizeAdequate = (testGroup.size + controlGroup.size) >= requiredSampleSize;

    // Generate recommendation
    const recommendation = this.generateSignificanceRecommendation(
      pValue < alpha,
      sampleSizeAdequate,
      power,
      lift
    );

    const significanceResult: SignificanceResult = {
      significant: pValue < alpha,
      pValue,
      confidenceInterval: ci,
      effectSize,
      power,
      sampleSizeAdequate,
      recommendation,
    };

    return {
      action: 'validate_significance',
      result: { significanceResult },
    };
  }

  /**
   * Detect cannibalization effects
   */
  private async detectCannibalization(input: IncrementalityInput): Promise<IncrementalityOutput> {
    const { campaign, testData } = input;

    if (!testData) {
      throw new Error('Test data is required for cannibalization detection');
    }

    // Analyze if lift is lower than expected
    const { testGroup, controlGroup } = testData;
    const observedLift = (testGroup.conversionRate - controlGroup.conversionRate) /
      Math.max(controlGroup.conversionRate, 0.001);

    // Estimate expected lift (simplified model)
    const expectedLift = 0.15; // Could be based on historical data

    // Detect cannibalization
    const detected = observedLift < expectedLift * 0.5;
    let severity: CannibalizationAnalysis['severity'] = 'none';
    if (detected) {
      if (observedLift < 0) severity = 'high';
      else if (observedLift < expectedLift * 0.3) severity = 'moderate';
      else severity = 'low';
    }

    // Identify potentially affected channels
    const affectedChannels: string[] = [];
    if (campaign) {
      // In real implementation, would analyze cross-channel data
      if (campaign.platform === 'google_ads') {
        affectedChannels.push('organic_search');
      }
      if (campaign.platform === 'meta') {
        affectedChannels.push('direct', 'referral');
      }
    }

    // Estimate impact
    const estimatedImpact = detected ?
      Math.abs(expectedLift - observedLift) * (campaign?.metrics.revenue ?? 0) : 0;

    const recommendations = this.generateCannibalizationRecommendations(
      severity,
      affectedChannels
    );

    const cannibalizationAnalysis: CannibalizationAnalysis = {
      detected,
      severity,
      affectedChannels,
      estimatedImpact,
      recommendations,
    };

    return {
      action: 'detect_cannibalization',
      result: { cannibalizationAnalysis },
    };
  }

  /**
   * Recommend holdout configuration
   */
  private async recommendHoldout(input: IncrementalityInput): Promise<IncrementalityOutput> {
    const { campaign, parameters } = input;

    if (!campaign) {
      throw new Error('Campaign is required for holdout recommendation');
    }

    // Calculate optimal holdout percentage based on campaign scale
    const dailyConversions = campaign.metrics.conversions / 30; // Assume monthly data
    let recommendedPercentage: number;

    if (dailyConversions > 100) {
      recommendedPercentage = 0.05; // 5% for high volume
    } else if (dailyConversions > 20) {
      recommendedPercentage = 0.10; // 10% for medium volume
    } else {
      recommendedPercentage = 0.15; // 15% for low volume
    }

    // Calculate recommended duration
    const minDetectableEffect = parameters?.minDetectableEffect ?? 0.1;
    const requiredSampleSize = this.stats.calculateSampleSize(
      campaign.metrics.conversions / Math.max(campaign.metrics.clicks, 1),
      minDetectableEffect,
      parameters?.power ?? 0.8,
      0.05
    );

    const dailyTraffic = campaign.metrics.clicks / 30;
    const recommendedDuration = Math.ceil(requiredSampleSize / dailyTraffic);

    // Calculate expected cost (opportunity cost of holdout)
    const expectedCost = campaign.metrics.revenue *
      recommendedPercentage *
      (recommendedDuration / 30);

    const holdoutRecommendation: HoldoutRecommendation = {
      recommendedPercentage,
      recommendedDuration: Math.min(28, Math.max(7, recommendedDuration)),
      expectedCost,
      expectedInsight: `Detect ${(minDetectableEffect * 100).toFixed(0)}% or larger lift with 80% power`,
      tradeoffs: this.generateHoldoutTradeoffs(recommendedPercentage, recommendedDuration),
    };

    return {
      action: 'recommend_holdout',
      result: { holdoutRecommendation },
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private recommendTestType(
    campaign: Campaign,
    params: TestParameters
  ): TestDesign['type'] {
    // Geo holdout for large campaigns with geographic targeting
    if (campaign.targeting.locations.length > 5 && campaign.metrics.impressions > 1000000) {
      return 'geo_holdout';
    }

    // Matched market for campaigns with specific regions
    if (campaign.targeting.locations.length >= 2) {
      return 'matched_market';
    }

    // User holdout for remarketing campaigns
    if (campaign.targeting.audiences.some((a) => a.type === 'remarketing')) {
      return 'user_holdout';
    }

    // Default to time holdout
    return 'time_holdout';
  }

  private createSetupInstructions(
    testType: TestDesign['type'],
    campaign: Campaign,
    params: TestParameters
  ): TestSetupInstructions {
    const steps: string[] = [];
    const segmentationRules: SegmentationRule[] = [];
    const monitoringGuidelines: string[] = [];
    const successCriteria: string[] = [];

    switch (testType) {
      case 'geo_holdout':
        steps.push('1. Identify matched geographic regions');
        steps.push('2. Randomly assign regions to test/control');
        steps.push('3. Turn off campaign in control regions');
        steps.push('4. Monitor for spillover effects');
        segmentationRules.push({
          dimension: 'geo',
          operator: 'in',
          values: campaign.targeting.locations.slice(0, 3),
        });
        break;

      case 'user_holdout':
        steps.push('1. Create user segments based on behavior');
        steps.push('2. Randomly assign users to test/control');
        steps.push('3. Exclude control users from targeting');
        steps.push('4. Track user-level conversions');
        segmentationRules.push({
          dimension: 'user_list',
          operator: 'not_in',
          values: ['holdout_list'],
        });
        break;

      case 'time_holdout':
        steps.push('1. Define test and control time windows');
        steps.push('2. Account for seasonality');
        steps.push('3. Run campaign only during test periods');
        steps.push('4. Compare matched time periods');
        break;

      case 'matched_market':
        steps.push('1. Identify similar markets by historical performance');
        steps.push('2. Match markets by size and demographics');
        steps.push('3. Randomly assign matched pairs to test/control');
        steps.push('4. Monitor market-level performance');
        break;
    }

    monitoringGuidelines.push('Check daily for anomalies');
    monitoringGuidelines.push('Monitor both test and control groups');
    monitoringGuidelines.push('Track spillover metrics');

    successCriteria.push(`Achieve ${(params.power * 100).toFixed(0)}% statistical power`);
    successCriteria.push(`p-value < ${(1 - params.confidenceLevel).toFixed(2)}`);
    successCriteria.push('No significant spillover detected');

    return { steps, segmentationRules, monitoringGuidelines, successCriteria };
  }

  private generateSignificanceRecommendation(
    significant: boolean,
    sampleSizeAdequate: boolean,
    power: number,
    lift: number
  ): string {
    if (significant && sampleSizeAdequate) {
      return lift > 0
        ? 'Result is statistically significant positive - recommend scaling campaign'
        : 'Result is statistically significant negative - recommend pausing campaign';
    }

    if (!significant && !sampleSizeAdequate) {
      return 'Insufficient sample size - extend test duration or increase traffic';
    }

    if (!significant && power < 0.8) {
      return 'Test underpowered - cannot detect small effects with current sample';
    }

    return 'Result not significant - true effect may be near zero';
  }

  private generateCannibalizationRecommendations(
    severity: CannibalizationAnalysis['severity'],
    affectedChannels: string[]
  ): string[] {
    const recommendations: string[] = [];

    switch (severity) {
      case 'high':
        recommendations.push('Consider pausing campaign to evaluate true incremental value');
        recommendations.push('Analyze cross-channel attribution before resuming');
        break;
      case 'moderate':
        recommendations.push('Reduce budget and monitor cannibalization levels');
        recommendations.push('Implement frequency caps to reduce overlap');
        break;
      case 'low':
        recommendations.push('Minor cannibalization detected - continue monitoring');
        break;
      default:
        recommendations.push('No cannibalization detected - continue current strategy');
    }

    if (affectedChannels.length > 0) {
      recommendations.push(`Monitor ${affectedChannels.join(', ')} for spillover effects`);
    }

    return recommendations;
  }

  private generateHoldoutTradeoffs(
    percentage: number,
    duration: number
  ): string[] {
    const tradeoffs: string[] = [];

    if (percentage < 0.1) {
      tradeoffs.push('Low holdout may require longer test duration');
    }
    if (percentage > 0.15) {
      tradeoffs.push('High holdout means more lost revenue during test');
    }
    if (duration < 14) {
      tradeoffs.push('Short duration may miss weekly patterns');
    }
    if (duration > 21) {
      tradeoffs.push('Long duration increases cost and risk of external factors');
    }

    return tradeoffs;
  }

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  protected async onInitialize(): Promise<void> {
    this.logger.info('Incrementality auditor agent initializing');
  }

  protected async onShutdown(): Promise<void> {
    this.logger.info('Incrementality auditor agent shutting down');
    this.testHistory.clear();
  }

  protected getSubscribedEvents(): EventType[] {
    return ['attribution.value_computed'];
  }

  protected async handleEvent(event: DomainEvent): Promise<void> {
    this.logger.debug('Event received', { type: event.type });
  }
}
