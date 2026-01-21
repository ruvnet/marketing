/**
 * Fatigue Forecaster Agent - Decay Curve Prediction
 * Tier 3: Creative
 *
 * Responsibilities:
 * - Predict creative fatigue and decay curves
 * - Monitor engagement decline patterns
 * - Estimate creative lifespan
 * - Recommend refresh timing
 * - Detect early fatigue signals
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  AgentConfig,
  TaskContext,
  DomainEvent,
  EventType,
  Creative,
  CreativeMetrics,
} from '../../types/index.js';
import { BaseAgent, AgentDependencies } from '../base-agent.js';

// ============================================================================
// Types
// ============================================================================

export interface FatigueInput {
  action: 'predict' | 'analyze_decay' | 'estimate_lifespan' | 'detect_signals' | 'recommend_refresh';
  creative?: Creative;
  creatives?: Creative[];
  historicalMetrics?: MetricsTimeSeries[];
  timeHorizon?: number; // days
}

export interface MetricsTimeSeries {
  timestamp: Date;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cvr: number;
  fatigueScore: number;
}

export interface FatigueOutput {
  action: string;
  result: {
    prediction?: FatiguePrediction;
    decayAnalysis?: DecayAnalysis;
    lifespan?: LifespanEstimate;
    signals?: FatigueSignal[];
    refreshRecommendation?: RefreshRecommendation;
  };
}

export interface FatiguePrediction {
  creativeId: string;
  currentFatigueScore: number;
  predictedFatigueScore: number;
  daysUntilFatigue: number;
  decayCurve: DecayPoint[];
  confidence: number;
  factors: FatigueFactor[];
}

export interface DecayPoint {
  day: number;
  predictedCtr: number;
  predictedCvr: number;
  fatigueScore: number;
  confidence: number;
}

export interface DecayAnalysis {
  creativeId: string;
  decayRate: number; // % decline per day
  decayType: 'linear' | 'exponential' | 'plateau' | 'cliff';
  halfLife: number; // days until 50% performance decline
  acceleratingFactors: string[];
  mitigatingFactors: string[];
}

export interface LifespanEstimate {
  creativeId: string;
  estimatedLifespan: number; // days
  optimalRefreshPoint: number; // days
  confidenceInterval: [number, number];
  assumptions: string[];
}

export interface FatigueSignal {
  type: 'ctr_decline' | 'frequency_cap' | 'engagement_drop' | 'cpa_increase' | 'reach_plateau';
  severity: 'early' | 'moderate' | 'severe';
  metric: string;
  currentValue: number;
  baselineValue: number;
  changePercent: number;
  detectedAt: Date;
}

export interface FatigueFactor {
  name: string;
  impact: number; // -1 to 1
  description: string;
}

export interface RefreshRecommendation {
  action: 'refresh_now' | 'schedule_refresh' | 'monitor' | 'no_action';
  urgency: 'critical' | 'high' | 'medium' | 'low';
  recommendedDate?: Date;
  suggestedChanges: string[];
  expectedImpact: number; // % improvement
}

// ============================================================================
// Configuration
// ============================================================================

export const fatigueForecasterConfig: AgentConfig = {
  id: 'fatigue-forecaster',
  tier: 3,
  name: 'Fatigue Forecaster Agent',
  description: 'Predict creative fatigue and decay curves',
  capabilities: [
    {
      id: 'fatigue_prediction',
      name: 'Fatigue Prediction',
      description: 'Predict when creative will become fatigued',
      inputTypes: ['creative', 'historical_metrics'],
      outputTypes: ['prediction'],
    },
    {
      id: 'decay_modeling',
      name: 'Decay Modeling',
      description: 'Model creative performance decay curves',
      inputTypes: ['creative', 'metrics'],
      outputTypes: ['decay_analysis'],
    },
    {
      id: 'refresh_timing',
      name: 'Refresh Timing',
      description: 'Recommend optimal refresh timing',
      inputTypes: ['creative', 'prediction'],
      outputTypes: ['refresh_recommendation'],
    },
    {
      id: 'signal_detection',
      name: 'Early Signal Detection',
      description: 'Detect early fatigue warning signals',
      inputTypes: ['creative', 'metrics'],
      outputTypes: ['signals'],
    },
  ],
  maxConcurrency: 6,
  timeoutMs: 15000,
  priority: 63,
  dependencies: ['creative-genome', 'historical-memory'],
};

// ============================================================================
// Fatigue Model Constants
// ============================================================================

const FATIGUE_THRESHOLDS = {
  early: 0.3,
  moderate: 0.5,
  severe: 0.7,
  critical: 0.85,
};

const DECAY_MODELS = {
  linear: (t: number, rate: number, initial: number) => initial * (1 - rate * t),
  exponential: (t: number, rate: number, initial: number) => initial * Math.exp(-rate * t),
  plateau: (t: number, rate: number, initial: number, floor: number) =>
    floor + (initial - floor) * Math.exp(-rate * t),
};

// ============================================================================
// Fatigue Forecaster Agent Implementation
// ============================================================================

export class FatigueForecasterAgent extends BaseAgent<FatigueInput, FatigueOutput> {
  private predictionCache: Map<string, FatiguePrediction>;

  constructor(deps?: AgentDependencies) {
    super(fatigueForecasterConfig, deps);
    this.predictionCache = new Map();
  }

  /**
   * Main processing logic
   */
  protected async process(
    input: FatigueInput,
    context: TaskContext
  ): Promise<FatigueOutput> {
    this.logger.info('Processing fatigue forecast request', { action: input.action });

    switch (input.action) {
      case 'predict':
        return this.predictFatigue(input, context);
      case 'analyze_decay':
        return this.analyzeDecay(input);
      case 'estimate_lifespan':
        return this.estimateLifespan(input);
      case 'detect_signals':
        return this.detectSignals(input);
      case 'recommend_refresh':
        return this.recommendRefresh(input, context);
      default:
        throw new Error(`Unknown action: ${input.action}`);
    }
  }

  /**
   * Predict creative fatigue
   */
  private async predictFatigue(
    input: FatigueInput,
    context: TaskContext
  ): Promise<FatigueOutput> {
    if (!input.creative) {
      throw new Error('Creative is required for fatigue prediction');
    }

    const creative = input.creative;
    const timeHorizon = input.timeHorizon ?? 30;
    const metrics = creative.metrics;

    // Current fatigue score
    const currentFatigueScore = metrics.fatigueScore;

    // Estimate decay rate based on current metrics
    const decayRate = this.estimateDecayRate(creative, input.historicalMetrics);

    // Generate decay curve
    const decayCurve = this.generateDecayCurve(
      metrics.ctr,
      metrics.conversions / Math.max(metrics.clicks, 1),
      decayRate,
      timeHorizon
    );

    // Find days until fatigue threshold
    const daysUntilFatigue = this.findDaysUntilFatigue(decayCurve);

    // Predict future fatigue score
    const predictedFatigueScore = Math.min(1, currentFatigueScore + decayRate * timeHorizon);

    // Identify factors
    const factors = this.identifyFatigueFactors(creative, decayRate);

    const prediction: FatiguePrediction = {
      creativeId: creative.id,
      currentFatigueScore,
      predictedFatigueScore,
      daysUntilFatigue,
      decayCurve,
      confidence: 0.75,
      factors,
    };

    // Cache prediction
    this.predictionCache.set(creative.id, prediction);

    // Emit event if fatigue is imminent
    if (daysUntilFatigue < 7) {
      await this.emitEvent(
        'creative.fatigue_detected',
        creative.id,
        'creative',
        {
          creativeId: creative.id,
          daysUntilFatigue,
          fatigueScore: predictedFatigueScore,
        },
        context.correlationId
      );
    }

    return {
      action: 'predict',
      result: { prediction },
    };
  }

  /**
   * Analyze decay patterns
   */
  private async analyzeDecay(input: FatigueInput): Promise<FatigueOutput> {
    if (!input.creative) {
      throw new Error('Creative is required for decay analysis');
    }

    const creative = input.creative;
    const historicalMetrics = input.historicalMetrics ?? [];

    // Calculate decay rate
    const decayRate = this.estimateDecayRate(creative, historicalMetrics);

    // Determine decay type
    const decayType = this.determineDecayType(historicalMetrics);

    // Calculate half-life
    const halfLife = decayRate > 0 ? Math.log(2) / decayRate : 999;

    // Identify factors
    const acceleratingFactors: string[] = [];
    const mitigatingFactors: string[] = [];

    if (creative.metrics.impressions > 1000000) {
      acceleratingFactors.push('High impression volume');
    }
    if (creative.lineage?.generation && creative.lineage.generation > 0) {
      mitigatingFactors.push('Part of creative lineage');
    }
    if (creative.type === 'video') {
      mitigatingFactors.push('Video content tends to fatigue slower');
    }

    const decayAnalysis: DecayAnalysis = {
      creativeId: creative.id,
      decayRate,
      decayType,
      halfLife,
      acceleratingFactors,
      mitigatingFactors,
    };

    return {
      action: 'analyze_decay',
      result: { decayAnalysis },
    };
  }

  /**
   * Estimate creative lifespan
   */
  private async estimateLifespan(input: FatigueInput): Promise<FatigueOutput> {
    if (!input.creative) {
      throw new Error('Creative is required for lifespan estimation');
    }

    const creative = input.creative;
    const decayRate = this.estimateDecayRate(creative, input.historicalMetrics);

    // Calculate days until fatigue threshold
    const daysUntilFatigue = this.calculateDaysUntilThreshold(
      creative.metrics.fatigueScore,
      decayRate,
      FATIGUE_THRESHOLDS.severe
    );

    // Optimal refresh point is before severe fatigue
    const optimalRefreshPoint = Math.max(1, daysUntilFatigue * 0.7);

    // Confidence interval based on data quality
    const confidenceWidth = input.historicalMetrics?.length ?? 0 > 7 ? 3 : 7;

    const lifespan: LifespanEstimate = {
      creativeId: creative.id,
      estimatedLifespan: Math.round(daysUntilFatigue),
      optimalRefreshPoint: Math.round(optimalRefreshPoint),
      confidenceInterval: [
        Math.max(1, Math.round(daysUntilFatigue - confidenceWidth)),
        Math.round(daysUntilFatigue + confidenceWidth),
      ],
      assumptions: [
        'Constant impression volume',
        'No major audience changes',
        'Similar competitive environment',
      ],
    };

    return {
      action: 'estimate_lifespan',
      result: { lifespan },
    };
  }

  /**
   * Detect early fatigue signals
   */
  private async detectSignals(input: FatigueInput): Promise<FatigueOutput> {
    if (!input.creative) {
      throw new Error('Creative is required for signal detection');
    }

    const creative = input.creative;
    const metrics = creative.metrics;
    const signals: FatigueSignal[] = [];

    // Define baseline (could come from historical data)
    const baselineCtr = 0.02;
    const baselineCvr = 0.03;
    const baselineCpa = 30;

    // Check CTR decline
    if (metrics.ctr < baselineCtr * 0.8) {
      signals.push({
        type: 'ctr_decline',
        severity: metrics.ctr < baselineCtr * 0.5 ? 'severe' : 'moderate',
        metric: 'ctr',
        currentValue: metrics.ctr,
        baselineValue: baselineCtr,
        changePercent: ((metrics.ctr - baselineCtr) / baselineCtr) * 100,
        detectedAt: new Date(),
      });
    }

    // Check engagement drop
    const cvr = metrics.conversions / Math.max(metrics.clicks, 1);
    if (cvr < baselineCvr * 0.7) {
      signals.push({
        type: 'engagement_drop',
        severity: cvr < baselineCvr * 0.5 ? 'severe' : 'moderate',
        metric: 'cvr',
        currentValue: cvr,
        baselineValue: baselineCvr,
        changePercent: ((cvr - baselineCvr) / baselineCvr) * 100,
        detectedAt: new Date(),
      });
    }

    // Check CPA increase
    const cpa = (metrics.spend ?? 0) / Math.max(metrics.conversions, 1);
    if (cpa > baselineCpa * 1.3) {
      signals.push({
        type: 'cpa_increase',
        severity: cpa > baselineCpa * 1.5 ? 'severe' : 'moderate',
        metric: 'cpa',
        currentValue: cpa,
        baselineValue: baselineCpa,
        changePercent: ((cpa - baselineCpa) / baselineCpa) * 100,
        detectedAt: new Date(),
      });
    }

    // Check fatigue score directly
    if (metrics.fatigueScore > FATIGUE_THRESHOLDS.early) {
      let severity: FatigueSignal['severity'] = 'early';
      if (metrics.fatigueScore > FATIGUE_THRESHOLDS.severe) severity = 'severe';
      else if (metrics.fatigueScore > FATIGUE_THRESHOLDS.moderate) severity = 'moderate';

      signals.push({
        type: 'engagement_drop',
        severity,
        metric: 'fatigueScore',
        currentValue: metrics.fatigueScore,
        baselineValue: 0,
        changePercent: metrics.fatigueScore * 100,
        detectedAt: new Date(),
      });
    }

    return {
      action: 'detect_signals',
      result: { signals },
    };
  }

  /**
   * Recommend refresh strategy
   */
  private async recommendRefresh(
    input: FatigueInput,
    context: TaskContext
  ): Promise<FatigueOutput> {
    if (!input.creative) {
      throw new Error('Creative is required for refresh recommendation');
    }

    const creative = input.creative;

    // Get or generate prediction
    let prediction = this.predictionCache.get(creative.id);
    if (!prediction) {
      const predictionResult = await this.predictFatigue(input, context);
      prediction = predictionResult.result.prediction!;
    }

    // Determine action and urgency
    let action: RefreshRecommendation['action'];
    let urgency: RefreshRecommendation['urgency'];
    let recommendedDate: Date | undefined;

    if (prediction.daysUntilFatigue <= 3) {
      action = 'refresh_now';
      urgency = 'critical';
    } else if (prediction.daysUntilFatigue <= 7) {
      action = 'refresh_now';
      urgency = 'high';
    } else if (prediction.daysUntilFatigue <= 14) {
      action = 'schedule_refresh';
      urgency = 'medium';
      recommendedDate = new Date(Date.now() + prediction.daysUntilFatigue * 0.7 * 86400000);
    } else if (prediction.currentFatigueScore > FATIGUE_THRESHOLDS.early) {
      action = 'monitor';
      urgency = 'low';
    } else {
      action = 'no_action';
      urgency = 'low';
    }

    // Generate suggested changes based on genome
    const suggestedChanges = this.generateSuggestedChanges(creative, prediction.factors);

    // Estimate improvement
    const expectedImpact = this.estimateRefreshImpact(creative);

    const refreshRecommendation: RefreshRecommendation = {
      action,
      urgency,
      recommendedDate,
      suggestedChanges,
      expectedImpact,
    };

    return {
      action: 'recommend_refresh',
      result: {
        refreshRecommendation,
        prediction,
      },
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private estimateDecayRate(
    creative: Creative,
    historicalMetrics?: MetricsTimeSeries[]
  ): number {
    // If we have historical data, calculate actual decay rate
    if (historicalMetrics && historicalMetrics.length >= 2) {
      const sorted = [...historicalMetrics].sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      );
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const days = (last.timestamp.getTime() - first.timestamp.getTime()) / 86400000;

      if (days > 0 && first.ctr > 0) {
        const ctrDecline = (first.ctr - last.ctr) / first.ctr;
        return ctrDecline / days;
      }
    }

    // Otherwise estimate based on creative type and current fatigue
    const baseRate = 0.02; // 2% per day base decay
    const fatigueMultiplier = 1 + creative.metrics.fatigueScore;

    // Adjust by creative type
    const typeMultiplier: Record<string, number> = {
      image: 1.0,
      video: 0.7,
      carousel: 0.8,
      text: 1.2,
      responsive: 0.9,
    };

    return baseRate * fatigueMultiplier * (typeMultiplier[creative.type] ?? 1);
  }

  private generateDecayCurve(
    initialCtr: number,
    initialCvr: number,
    decayRate: number,
    days: number
  ): DecayPoint[] {
    const curve: DecayPoint[] = [];
    const floor = 0.3; // Performance floor at 30% of initial

    for (let day = 0; day <= days; day++) {
      const predictedCtr = DECAY_MODELS.plateau(day, decayRate, initialCtr, initialCtr * floor);
      const predictedCvr = DECAY_MODELS.plateau(day, decayRate, initialCvr, initialCvr * floor);
      const fatigueScore = Math.min(1, 1 - predictedCtr / initialCtr);

      curve.push({
        day,
        predictedCtr,
        predictedCvr,
        fatigueScore,
        confidence: Math.max(0.5, 1 - day * 0.02),
      });
    }

    return curve;
  }

  private findDaysUntilFatigue(curve: DecayPoint[]): number {
    const threshold = FATIGUE_THRESHOLDS.severe;
    const fatiguedPoint = curve.find((p) => p.fatigueScore >= threshold);
    return fatiguedPoint?.day ?? 999;
  }

  private calculateDaysUntilThreshold(
    currentScore: number,
    decayRate: number,
    threshold: number
  ): number {
    if (currentScore >= threshold) return 0;
    if (decayRate <= 0) return 999;

    return (threshold - currentScore) / decayRate;
  }

  private determineDecayType(
    metrics: MetricsTimeSeries[]
  ): DecayAnalysis['decayType'] {
    if (metrics.length < 3) return 'linear';

    // Analyze the pattern of decline
    const ctrValues = metrics.map((m) => m.ctr);
    const changes = [];
    for (let i = 1; i < ctrValues.length; i++) {
      changes.push(ctrValues[i] - ctrValues[i - 1]);
    }

    // Check for cliff (sudden drop)
    const hasCliff = changes.some((c) => c < -0.3 * ctrValues[0]);
    if (hasCliff) return 'cliff';

    // Check for plateau (diminishing changes)
    const recentChanges = changes.slice(-3);
    const isPlateauing = recentChanges.every((c) => Math.abs(c) < 0.01);
    if (isPlateauing) return 'plateau';

    // Check for exponential (accelerating decline)
    const isAccelerating = changes.length >= 3 &&
      Math.abs(changes[changes.length - 1]) > Math.abs(changes[0]) * 1.5;
    if (isAccelerating) return 'exponential';

    return 'linear';
  }

  private identifyFatigueFactors(creative: Creative, decayRate: number): FatigueFactor[] {
    const factors: FatigueFactor[] = [];

    if (creative.metrics.impressions > 500000) {
      factors.push({
        name: 'High Frequency',
        impact: 0.3,
        description: 'High impression volume accelerates fatigue',
      });
    }

    if (creative.type === 'image') {
      factors.push({
        name: 'Static Content',
        impact: 0.2,
        description: 'Static images fatigue faster than video',
      });
    }

    if (decayRate > 0.03) {
      factors.push({
        name: 'Rapid Decay',
        impact: 0.4,
        description: 'Creative showing above-average decay rate',
      });
    }

    return factors;
  }

  private generateSuggestedChanges(
    creative: Creative,
    factors: FatigueFactor[]
  ): string[] {
    const suggestions: string[] = [];

    suggestions.push('Change primary visual element');
    suggestions.push('Update headline/hook');
    suggestions.push('Modify CTA text');

    if (factors.some((f) => f.name === 'Static Content')) {
      suggestions.push('Consider video or animated version');
    }

    if (factors.some((f) => f.name === 'High Frequency')) {
      suggestions.push('Reduce impression frequency cap');
    }

    return suggestions;
  }

  private estimateRefreshImpact(creative: Creative): number {
    // Estimate performance improvement from refresh
    const fatigueScore = creative.metrics.fatigueScore;

    // Higher fatigue = more potential improvement
    return Math.min(0.5, fatigueScore * 0.6);
  }

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  protected async onInitialize(): Promise<void> {
    this.logger.info('Fatigue forecaster agent initializing');
  }

  protected async onShutdown(): Promise<void> {
    this.logger.info('Fatigue forecaster agent shutting down');
    this.predictionCache.clear();
  }

  protected getSubscribedEvents(): EventType[] {
    return ['creative.created', 'creative.rotated'];
  }

  protected async handleEvent(event: DomainEvent): Promise<void> {
    if (event.type === 'creative.created') {
      this.logger.debug('New creative to monitor', { creativeId: event.aggregateId });
    }
  }
}
