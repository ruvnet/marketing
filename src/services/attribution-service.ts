/**
 * Attribution Domain Service
 * Handles multi-touch attribution, incrementality, and causal analysis
 */

import { v4 as uuidv4 } from 'uuid';
import { EventBus, getEventBus } from '../core/event-bus';
import { StateManager, getStateManager } from '../core/state-manager';
import { createLogger, Logger } from '../core/logger';
import { Attribution, Platform, Touchpoint } from '../types';

export interface AttributionModel {
  type: 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'position_based' | 'data_driven';
  config?: Record<string, unknown>;
}

export interface ConversionPath {
  conversionId: string;
  touchpoints: Touchpoint[];
  value: number;
  timestamp: Date;
}

export interface AttributionResult {
  campaignId: string;
  platform: Platform;
  model: AttributionModel['type'];
  attributedConversions: number;
  attributedRevenue: number;
  contribution: number;
  confidence: number;
}

export interface IncrementalityResult {
  campaignId: string;
  incrementalConversions: number;
  incrementalRevenue: number;
  incrementalityRate: number;
  confidence: number;
  pValue: number;
}

export interface CausalEffect {
  source: string;
  target: string;
  effect: number;
  mechanism: string;
  confidence: number;
}

export class AttributionService {
  private readonly eventBus: EventBus;
  private readonly stateManager: StateManager;
  private readonly logger: Logger;
  private readonly conversionPaths: Map<string, ConversionPath> = new Map();

  constructor(eventBus?: EventBus, stateManager?: StateManager) {
    this.eventBus = eventBus || getEventBus();
    this.stateManager = stateManager || getStateManager();
    this.logger = createLogger('attribution-service');
  }

  /**
   * Record a touchpoint
   */
  recordTouchpoint(touchpoint: Touchpoint): void {
    const path = this.conversionPaths.get(touchpoint.userId) || {
      conversionId: '',
      touchpoints: [],
      value: 0,
      timestamp: new Date(),
    };

    path.touchpoints.push(touchpoint);
    this.conversionPaths.set(touchpoint.userId, path);

    this.eventBus.publish({
      id: uuidv4(),
      type: 'attribution.touchpoint_recorded',
      timestamp: new Date(),
      source: 'attribution-service',
      payload: { touchpoint },
    });
  }

  /**
   * Record a conversion
   */
  recordConversion(userId: string, value: number): void {
    const path = this.conversionPaths.get(userId);
    if (path) {
      path.conversionId = uuidv4();
      path.value = value;
      path.timestamp = new Date();

      this.eventBus.publish({
        id: uuidv4(),
        type: 'attribution.conversion_recorded',
        timestamp: new Date(),
        source: 'attribution-service',
        payload: { path },
      });
    }
  }

  /**
   * Calculate attribution using specified model
   */
  calculateAttribution(
    paths: ConversionPath[],
    model: AttributionModel
  ): Map<string, AttributionResult> {
    const results = new Map<string, AttributionResult>();

    for (const path of paths) {
      if (path.touchpoints.length === 0) continue;

      const credits = this.distributeCredit(path.touchpoints, model);

      for (const [key, credit] of credits) {
        const [campaignId, platform] = key.split('|');
        const existing = results.get(key) || {
          campaignId,
          platform: platform as Platform,
          model: model.type,
          attributedConversions: 0,
          attributedRevenue: 0,
          contribution: 0,
          confidence: 0.8,
        };

        existing.attributedConversions += credit;
        existing.attributedRevenue += path.value * credit;
        results.set(key, existing);
      }
    }

    // Calculate contribution percentages
    const totalConversions = Array.from(results.values()).reduce(
      (sum, r) => sum + r.attributedConversions,
      0
    );

    for (const result of results.values()) {
      result.contribution = totalConversions > 0
        ? result.attributedConversions / totalConversions
        : 0;
    }

    return results;
  }

  /**
   * Distribute credit based on attribution model
   */
  private distributeCredit(
    touchpoints: Touchpoint[],
    model: AttributionModel
  ): Map<string, number> {
    const credits = new Map<string, number>();

    switch (model.type) {
      case 'first_touch':
        this.addCredit(credits, touchpoints[0], 1);
        break;

      case 'last_touch':
        this.addCredit(credits, touchpoints[touchpoints.length - 1], 1);
        break;

      case 'linear':
        const equalCredit = 1 / touchpoints.length;
        for (const tp of touchpoints) {
          this.addCredit(credits, tp, equalCredit);
        }
        break;

      case 'time_decay':
        const decayFactor = 0.5;
        const now = Date.now();
        let totalWeight = 0;
        const weights = touchpoints.map((tp) => {
          const daysSince = (now - tp.timestamp.getTime()) / (1000 * 60 * 60 * 24);
          const weight = Math.pow(decayFactor, daysSince / 7);
          totalWeight += weight;
          return weight;
        });
        touchpoints.forEach((tp, i) => {
          this.addCredit(credits, tp, weights[i] / totalWeight);
        });
        break;

      case 'position_based':
        const firstLastWeight = 0.4;
        const middleWeight = 0.2 / Math.max(1, touchpoints.length - 2);
        touchpoints.forEach((tp, i) => {
          if (i === 0 || i === touchpoints.length - 1) {
            this.addCredit(credits, tp, firstLastWeight);
          } else {
            this.addCredit(credits, tp, middleWeight);
          }
        });
        break;

      case 'data_driven':
        // Simplified data-driven model using engagement weights
        let totalEngagement = 0;
        const engagements = touchpoints.map((tp) => {
          const engagement = this.calculateEngagement(tp);
          totalEngagement += engagement;
          return engagement;
        });
        touchpoints.forEach((tp, i) => {
          this.addCredit(credits, tp, engagements[i] / totalEngagement);
        });
        break;
    }

    return credits;
  }

  /**
   * Add credit to a touchpoint
   */
  private addCredit(credits: Map<string, number>, tp: Touchpoint, credit: number): void {
    const key = `${tp.campaignId}|${tp.platform}`;
    credits.set(key, (credits.get(key) || 0) + credit);
  }

  /**
   * Calculate engagement score for a touchpoint
   */
  private calculateEngagement(tp: Touchpoint): number {
    const typeWeights: Record<string, number> = {
      impression: 0.1,
      click: 0.3,
      view: 0.2,
      engagement: 0.4,
      conversion: 1.0,
    };
    return typeWeights[tp.type] || 0.1;
  }

  /**
   * Measure incrementality for a campaign
   */
  measureIncrementality(
    campaignId: string,
    testGroup: { conversions: number; users: number },
    controlGroup: { conversions: number; users: number }
  ): IncrementalityResult {
    const testRate = testGroup.conversions / testGroup.users;
    const controlRate = controlGroup.conversions / controlGroup.users;

    const incrementalRate = testRate - controlRate;
    const incrementalConversions = incrementalRate * testGroup.users;

    // Calculate statistical significance (simplified)
    const pooledVariance = Math.sqrt(
      (testRate * (1 - testRate)) / testGroup.users +
      (controlRate * (1 - controlRate)) / controlGroup.users
    );
    const zScore = incrementalRate / pooledVariance;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));

    const confidence = 1 - pValue;

    return {
      campaignId,
      incrementalConversions,
      incrementalRevenue: incrementalConversions * 50, // Assume $50 avg value
      incrementalityRate: testRate > 0 ? incrementalRate / testRate : 0,
      confidence,
      pValue,
    };
  }

  /**
   * Build causal graph from data
   */
  buildCausalGraph(
    variables: string[],
    observations: Record<string, number>[]
  ): CausalEffect[] {
    const effects: CausalEffect[] = [];

    // Simplified causal discovery using correlations
    for (let i = 0; i < variables.length; i++) {
      for (let j = i + 1; j < variables.length; j++) {
        const varA = variables[i];
        const varB = variables[j];

        const correlation = this.calculateCorrelation(
          observations.map((o) => o[varA] || 0),
          observations.map((o) => o[varB] || 0)
        );

        if (Math.abs(correlation) > 0.3) {
          effects.push({
            source: varA,
            target: varB,
            effect: correlation,
            mechanism: correlation > 0 ? 'positive' : 'negative',
            confidence: Math.min(0.95, Math.abs(correlation)),
          });
        }
      }
    }

    return effects;
  }

  /**
   * Estimate causal effect of intervention
   */
  estimateCausalEffect(
    intervention: string,
    outcome: string,
    treatmentData: number[],
    controlData: number[]
  ): CausalEffect {
    const treatmentMean = this.mean(treatmentData);
    const controlMean = this.mean(controlData);
    const effect = treatmentMean - controlMean;

    // Calculate confidence using t-test approximation
    const treatmentVar = this.variance(treatmentData);
    const controlVar = this.variance(controlData);
    const se = Math.sqrt(treatmentVar / treatmentData.length + controlVar / controlData.length);
    const tStat = effect / se;
    const confidence = Math.min(0.95, 1 - 2 * (1 - this.normalCDF(Math.abs(tStat))));

    return {
      source: intervention,
      target: outcome,
      effect,
      mechanism: 'intervention',
      confidence,
    };
  }

  /**
   * Normal CDF approximation
   */
  private normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - p : p;
  }

  /**
   * Calculate Pearson correlation
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;

    const meanX = this.mean(x);
    const meanY = this.mean(y);

    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      numerator += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    }

    const denom = Math.sqrt(denomX * denomY);
    return denom > 0 ? numerator / denom : 0;
  }

  /**
   * Calculate mean
   */
  private mean(values: number[]): number {
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  /**
   * Calculate variance
   */
  private variance(values: number[]): number {
    const m = this.mean(values);
    return this.mean(values.map((x) => (x - m) ** 2));
  }
}

// Singleton instance
let serviceInstance: AttributionService | null = null;

export function getAttributionService(): AttributionService {
  if (!serviceInstance) {
    serviceInstance = new AttributionService();
  }
  return serviceInstance;
}
