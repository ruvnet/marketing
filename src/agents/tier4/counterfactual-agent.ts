/**
 * Counterfactual Agent - What-If Analysis
 * Tier 4: Attribution
 *
 * Responsibilities:
 * - What-if scenario analysis
 * - Counterfactual simulation
 * - Impact estimation for changes
 * - Opportunity cost calculation
 * - Alternative strategy evaluation
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  AgentConfig,
  TaskContext,
  DomainEvent,
  EventType,
  Campaign,
  CounterfactualAnalysis,
  ScenarioMetrics,
} from '../../types/index.js';
import { BaseAgent, AgentDependencies } from '../base-agent.js';

// ============================================================================
// Types
// ============================================================================

export interface CounterfactualInput {
  action: 'analyze' | 'compare_scenarios' | 'estimate_impact' | 'opportunity_cost' | 'batch_analysis';
  campaign?: Campaign;
  scenarios?: CounterfactualScenario[];
  baselineMetrics?: ScenarioMetrics;
  hypotheticalChange?: HypotheticalChange;
}

export interface CounterfactualScenario {
  id: string;
  name: string;
  description: string;
  changes: HypotheticalChange[];
  assumptions: string[];
}

export interface HypotheticalChange {
  type: 'budget' | 'bid' | 'targeting' | 'creative' | 'timing' | 'platform';
  parameter: string;
  currentValue: unknown;
  hypotheticalValue: unknown;
  confidence?: number;
}

export interface CounterfactualOutput {
  action: string;
  result: {
    analysis?: CounterfactualAnalysis;
    comparisons?: ScenarioComparison[];
    impactEstimate?: ImpactEstimate;
    opportunityCost?: OpportunityCost;
    batchResults?: CounterfactualAnalysis[];
  };
}

export interface ScenarioComparison {
  scenarioA: string;
  scenarioB: string;
  metricDifferences: {
    conversions: number;
    revenue: number;
    roas: number;
    efficiency: number;
  };
  winner: string;
  confidence: number;
  recommendation: string;
}

export interface ImpactEstimate {
  change: HypotheticalChange;
  baseline: ScenarioMetrics;
  projected: ScenarioMetrics;
  absoluteImpact: {
    conversions: number;
    revenue: number;
    spend: number;
  };
  relativeImpact: {
    conversions: number;
    revenue: number;
    roas: number;
  };
  confidence: number;
  risks: string[];
  opportunities: string[];
}

export interface OpportunityCost {
  currentStrategy: string;
  alternativeStrategy: string;
  forgoneConversions: number;
  forgoneRevenue: number;
  recommendations: string[];
}

// ============================================================================
// Configuration
// ============================================================================

export const counterfactualConfig: AgentConfig = {
  id: 'counterfactual',
  tier: 4,
  name: 'Counterfactual Agent',
  description: 'What-if analysis and counterfactual simulation',
  capabilities: [
    {
      id: 'what_if_analysis',
      name: 'What-If Analysis',
      description: 'Analyze what would happen under different conditions',
      inputTypes: ['campaign', 'scenario'],
      outputTypes: ['counterfactual_analysis'],
    },
    {
      id: 'counterfactual_simulation',
      name: 'Counterfactual Simulation',
      description: 'Simulate alternative realities',
      inputTypes: ['campaign', 'changes'],
      outputTypes: ['simulation_results'],
    },
    {
      id: 'impact_estimation',
      name: 'Impact Estimation',
      description: 'Estimate impact of hypothetical changes',
      inputTypes: ['change', 'baseline'],
      outputTypes: ['impact_estimate'],
    },
    {
      id: 'opportunity_analysis',
      name: 'Opportunity Cost Analysis',
      description: 'Calculate opportunity costs of current decisions',
      inputTypes: ['campaign', 'alternatives'],
      outputTypes: ['opportunity_cost'],
    },
  ],
  maxConcurrency: 5,
  timeoutMs: 25000,
  priority: 60,
  dependencies: ['simulation', 'historical-memory'],
};

// ============================================================================
// Counterfactual Engine
// ============================================================================

class CounterfactualEngine {
  /**
   * Run counterfactual simulation
   */
  async simulate(
    baseline: ScenarioMetrics,
    change: HypotheticalChange
  ): Promise<ScenarioMetrics> {
    // Apply change multipliers based on type
    const multiplier = this.getChangeMultiplier(change);

    return {
      conversions: Math.round(baseline.conversions * multiplier.conversions),
      revenue: baseline.revenue * multiplier.revenue,
      spend: baseline.spend * multiplier.spend,
      roas: (baseline.revenue * multiplier.revenue) / (baseline.spend * multiplier.spend),
    };
  }

  /**
   * Get multipliers for a change type
   */
  private getChangeMultiplier(change: HypotheticalChange): {
    conversions: number;
    revenue: number;
    spend: number;
  } {
    const current = Number(change.currentValue) || 1;
    const hypothetical = Number(change.hypotheticalValue) || 1;
    const ratio = hypothetical / current;

    switch (change.type) {
      case 'budget':
        // Budget changes have diminishing returns
        return {
          conversions: Math.pow(ratio, 0.7),
          revenue: Math.pow(ratio, 0.7),
          spend: ratio,
        };
      case 'bid':
        // Bid changes affect both volume and efficiency
        return {
          conversions: Math.pow(ratio, 0.5),
          revenue: Math.pow(ratio, 0.5),
          spend: Math.pow(ratio, 0.8),
        };
      case 'targeting':
        // Targeting changes affect conversion rate
        return {
          conversions: ratio > 1 ? ratio * 0.9 : ratio * 1.1,
          revenue: ratio > 1 ? ratio * 0.9 : ratio * 1.1,
          spend: 1,
        };
      case 'creative':
        // Creative changes primarily affect CTR and CVR
        return {
          conversions: ratio,
          revenue: ratio,
          spend: 1,
        };
      case 'timing':
        // Timing optimization
        return {
          conversions: 1 + (ratio - 1) * 0.3,
          revenue: 1 + (ratio - 1) * 0.3,
          spend: 1,
        };
      case 'platform':
        // Platform switches have different base efficiencies
        return {
          conversions: ratio * 0.85, // Some loss in transition
          revenue: ratio * 0.85,
          spend: ratio * 0.9,
        };
      default:
        return { conversions: 1, revenue: 1, spend: 1 };
    }
  }

  /**
   * Calculate confidence based on change magnitude
   */
  calculateConfidence(change: HypotheticalChange): number {
    const current = Number(change.currentValue) || 1;
    const hypothetical = Number(change.hypotheticalValue) || 1;
    const ratio = hypothetical / current;

    // Larger changes = lower confidence
    const magnitude = Math.abs(ratio - 1);
    return Math.max(0.4, 1 - magnitude * 0.5);
  }
}

// ============================================================================
// Counterfactual Agent Implementation
// ============================================================================

export class CounterfactualAgent extends BaseAgent<CounterfactualInput, CounterfactualOutput> {
  private engine: CounterfactualEngine;
  private analysisCache: Map<string, CounterfactualAnalysis>;

  constructor(deps?: AgentDependencies) {
    super(counterfactualConfig, deps);
    this.engine = new CounterfactualEngine();
    this.analysisCache = new Map();
  }

  /**
   * Main processing logic
   */
  protected async process(
    input: CounterfactualInput,
    context: TaskContext
  ): Promise<CounterfactualOutput> {
    this.logger.info('Processing counterfactual request', { action: input.action });

    switch (input.action) {
      case 'analyze':
        return this.analyzeCounterfactual(input, context);
      case 'compare_scenarios':
        return this.compareScenarios(input);
      case 'estimate_impact':
        return this.estimateImpact(input);
      case 'opportunity_cost':
        return this.calculateOpportunityCost(input);
      case 'batch_analysis':
        return this.batchAnalysis(input, context);
      default:
        throw new Error(`Unknown action: ${input.action}`);
    }
  }

  /**
   * Analyze a single counterfactual scenario
   */
  private async analyzeCounterfactual(
    input: CounterfactualInput,
    context: TaskContext
  ): Promise<CounterfactualOutput> {
    const { campaign, scenarios } = input;

    if (!campaign || !scenarios || scenarios.length === 0) {
      throw new Error('Campaign and at least one scenario are required');
    }

    const scenario = scenarios[0];
    const baseline = this.extractBaselineMetrics(campaign);

    // Simulate each change in the scenario
    let counterfactual = { ...baseline };
    for (const change of scenario.changes) {
      counterfactual = await this.engine.simulate(counterfactual, change);
    }

    // Calculate lift
    const lift = (counterfactual.roas - baseline.roas) / baseline.roas;

    // Calculate confidence
    const avgConfidence = scenario.changes.reduce(
      (sum, c) => sum + this.engine.calculateConfidence(c),
      0
    ) / scenario.changes.length;

    const analysis: CounterfactualAnalysis = {
      id: uuidv4(),
      scenario: scenario.name,
      baseline,
      counterfactual,
      lift,
      confidence: avgConfidence,
      computedAt: new Date(),
    };

    // Cache result
    this.analysisCache.set(`${campaign.id}_${scenario.id}`, analysis);

    // Emit event
    await this.emitEvent(
      'attribution.counterfactual_analyzed',
      campaign.id,
      'campaign',
      { campaignId: campaign.id, scenario: scenario.name, lift },
      context.correlationId
    );

    return {
      action: 'analyze',
      result: { analysis },
    };
  }

  /**
   * Compare multiple scenarios
   */
  private async compareScenarios(input: CounterfactualInput): Promise<CounterfactualOutput> {
    const { campaign, scenarios } = input;

    if (!campaign || !scenarios || scenarios.length < 2) {
      throw new Error('Campaign and at least two scenarios are required for comparison');
    }

    const baseline = this.extractBaselineMetrics(campaign);
    const comparisons: ScenarioComparison[] = [];

    // Compare each pair of scenarios
    for (let i = 0; i < scenarios.length; i++) {
      for (let j = i + 1; j < scenarios.length; j++) {
        const scenarioA = scenarios[i];
        const scenarioB = scenarios[j];

        // Simulate both scenarios
        let metricsA = { ...baseline };
        for (const change of scenarioA.changes) {
          metricsA = await this.engine.simulate(metricsA, change);
        }

        let metricsB = { ...baseline };
        for (const change of scenarioB.changes) {
          metricsB = await this.engine.simulate(metricsB, change);
        }

        // Calculate differences
        const comparison: ScenarioComparison = {
          scenarioA: scenarioA.name,
          scenarioB: scenarioB.name,
          metricDifferences: {
            conversions: metricsA.conversions - metricsB.conversions,
            revenue: metricsA.revenue - metricsB.revenue,
            roas: metricsA.roas - metricsB.roas,
            efficiency: (metricsA.roas / metricsB.roas) - 1,
          },
          winner: metricsA.roas > metricsB.roas ? scenarioA.name : scenarioB.name,
          confidence: 0.7,
          recommendation: this.generateRecommendation(metricsA, metricsB, scenarioA, scenarioB),
        };

        comparisons.push(comparison);
      }
    }

    return {
      action: 'compare_scenarios',
      result: { comparisons },
    };
  }

  /**
   * Estimate impact of a hypothetical change
   */
  private async estimateImpact(input: CounterfactualInput): Promise<CounterfactualOutput> {
    const { campaign, hypotheticalChange, baselineMetrics } = input;

    if (!hypotheticalChange) {
      throw new Error('Hypothetical change is required for impact estimation');
    }

    const baseline = baselineMetrics ?? (campaign ? this.extractBaselineMetrics(campaign) : null);
    if (!baseline) {
      throw new Error('Baseline metrics or campaign is required');
    }

    // Simulate the change
    const projected = await this.engine.simulate(baseline, hypotheticalChange);
    const confidence = this.engine.calculateConfidence(hypotheticalChange);

    // Calculate absolute and relative impacts
    const absoluteImpact = {
      conversions: projected.conversions - baseline.conversions,
      revenue: projected.revenue - baseline.revenue,
      spend: projected.spend - baseline.spend,
    };

    const relativeImpact = {
      conversions: (projected.conversions - baseline.conversions) / baseline.conversions,
      revenue: (projected.revenue - baseline.revenue) / baseline.revenue,
      roas: (projected.roas - baseline.roas) / baseline.roas,
    };

    // Identify risks and opportunities
    const risks: string[] = [];
    const opportunities: string[] = [];

    if (relativeImpact.roas < -0.1) {
      risks.push('Potential ROAS decline');
    }
    if (absoluteImpact.spend > baseline.spend * 0.3) {
      risks.push('Significant budget increase required');
    }
    if (relativeImpact.conversions > 0.2) {
      opportunities.push('Strong conversion growth potential');
    }
    if (relativeImpact.roas > 0.1) {
      opportunities.push('Efficiency improvement opportunity');
    }

    const impactEstimate: ImpactEstimate = {
      change: hypotheticalChange,
      baseline,
      projected,
      absoluteImpact,
      relativeImpact,
      confidence,
      risks,
      opportunities,
    };

    return {
      action: 'estimate_impact',
      result: { impactEstimate },
    };
  }

  /**
   * Calculate opportunity cost
   */
  private async calculateOpportunityCost(input: CounterfactualInput): Promise<CounterfactualOutput> {
    const { campaign, scenarios } = input;

    if (!campaign) {
      throw new Error('Campaign is required for opportunity cost calculation');
    }

    const baseline = this.extractBaselineMetrics(campaign);

    // If no alternative scenarios provided, generate standard alternatives
    const alternatives = scenarios ?? this.generateStandardAlternatives(campaign);

    // Find best alternative
    let bestAlternative = { ...baseline };
    let bestScenarioName = 'Current Strategy';

    for (const scenario of alternatives) {
      let altMetrics = { ...baseline };
      for (const change of scenario.changes) {
        altMetrics = await this.engine.simulate(altMetrics, change);
      }

      if (altMetrics.roas > bestAlternative.roas) {
        bestAlternative = altMetrics;
        bestScenarioName = scenario.name;
      }
    }

    const opportunityCost: OpportunityCost = {
      currentStrategy: 'Current Campaign Configuration',
      alternativeStrategy: bestScenarioName,
      forgoneConversions: Math.max(0, bestAlternative.conversions - baseline.conversions),
      forgoneRevenue: Math.max(0, bestAlternative.revenue - baseline.revenue),
      recommendations: this.generateOpportunityRecommendations(
        baseline,
        bestAlternative,
        bestScenarioName
      ),
    };

    return {
      action: 'opportunity_cost',
      result: { opportunityCost },
    };
  }

  /**
   * Batch analyze multiple campaigns/scenarios
   */
  private async batchAnalysis(
    input: CounterfactualInput,
    context: TaskContext
  ): Promise<CounterfactualOutput> {
    const { campaign, scenarios } = input;

    if (!campaign || !scenarios) {
      throw new Error('Campaign and scenarios are required for batch analysis');
    }

    const batchResults: CounterfactualAnalysis[] = [];

    for (const scenario of scenarios) {
      const result = await this.analyzeCounterfactual(
        { ...input, scenarios: [scenario] },
        context
      );
      if (result.result.analysis) {
        batchResults.push(result.result.analysis);
      }
    }

    return {
      action: 'batch_analysis',
      result: { batchResults },
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private extractBaselineMetrics(campaign: Campaign): ScenarioMetrics {
    return {
      conversions: campaign.metrics.conversions,
      revenue: campaign.metrics.revenue,
      spend: campaign.metrics.spend,
      roas: campaign.metrics.roas,
    };
  }

  private generateStandardAlternatives(campaign: Campaign): CounterfactualScenario[] {
    return [
      {
        id: 'budget_increase',
        name: 'Budget +20%',
        description: 'Increase daily budget by 20%',
        changes: [{
          type: 'budget',
          parameter: 'daily',
          currentValue: campaign.budget.daily,
          hypotheticalValue: campaign.budget.daily * 1.2,
        }],
        assumptions: ['Stable conversion rate', 'Available inventory'],
      },
      {
        id: 'budget_decrease',
        name: 'Budget -20%',
        description: 'Decrease daily budget by 20%',
        changes: [{
          type: 'budget',
          parameter: 'daily',
          currentValue: campaign.budget.daily,
          hypotheticalValue: campaign.budget.daily * 0.8,
        }],
        assumptions: ['Maintained efficiency'],
      },
      {
        id: 'bid_optimization',
        name: 'Optimized Bidding',
        description: 'Optimize bid strategy',
        changes: [{
          type: 'bid',
          parameter: 'target',
          currentValue: campaign.bidding.targetValue ?? 1,
          hypotheticalValue: (campaign.bidding.targetValue ?? 1) * 1.1,
        }],
        assumptions: ['Better bid positioning'],
      },
    ];
  }

  private generateRecommendation(
    metricsA: ScenarioMetrics,
    metricsB: ScenarioMetrics,
    scenarioA: CounterfactualScenario,
    scenarioB: CounterfactualScenario
  ): string {
    if (metricsA.roas > metricsB.roas * 1.1) {
      return `${scenarioA.name} significantly outperforms - recommend implementation`;
    } else if (metricsB.roas > metricsA.roas * 1.1) {
      return `${scenarioB.name} significantly outperforms - recommend implementation`;
    }
    return 'Scenarios perform similarly - test with small budget first';
  }

  private generateOpportunityRecommendations(
    current: ScenarioMetrics,
    best: ScenarioMetrics,
    bestScenarioName: string
  ): string[] {
    const recommendations: string[] = [];

    if (best.roas > current.roas * 1.1) {
      recommendations.push(`Consider switching to "${bestScenarioName}"`);
    }

    if (best.revenue > current.revenue * 1.2) {
      recommendations.push(`Potential ${((best.revenue / current.revenue - 1) * 100).toFixed(0)}% revenue increase available`);
    }

    if (best.conversions > current.conversions * 1.15) {
      recommendations.push(`Could gain ${best.conversions - current.conversions} additional conversions`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Current strategy is near-optimal');
    }

    return recommendations;
  }

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  protected async onInitialize(): Promise<void> {
    this.logger.info('Counterfactual agent initializing');
  }

  protected async onShutdown(): Promise<void> {
    this.logger.info('Counterfactual agent shutting down');
    this.analysisCache.clear();
  }

  protected getSubscribedEvents(): EventType[] {
    return ['campaign.created', 'campaign.optimized'];
  }

  protected async handleEvent(event: DomainEvent): Promise<void> {
    this.logger.debug('Event received', { type: event.type });
  }
}
