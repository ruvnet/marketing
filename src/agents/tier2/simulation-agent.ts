/**
 * Simulation Agent - Monte Carlo Outcome Prediction
 * Tier 2: Intelligence
 *
 * Responsibilities:
 * - Monte Carlo simulations for campaign outcomes
 * - Budget allocation scenario modeling
 * - Bid strategy impact prediction
 * - Risk-adjusted forecasting
 * - What-if scenario generation
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  AgentConfig,
  TaskContext,
  DomainEvent,
  EventType,
  Campaign,
  SimulationScenario,
  SimulationResult,
  ScenarioVariation,
} from '../../types/index.js';
import { BaseAgent, AgentDependencies } from '../base-agent.js';

// ============================================================================
// Types
// ============================================================================

export interface SimulationInput {
  action: 'simulate' | 'forecast' | 'optimize' | 'sensitivity';
  scenario?: SimulationScenario;
  campaign?: Campaign;
  parameters?: SimulationParameters;
}

export interface SimulationParameters {
  iterations: number;
  confidenceLevel: number;
  timeHorizon: number; // days
  budgetRange?: [number, number];
  bidRange?: [number, number];
}

export interface SimulationOutput {
  action: string;
  result: {
    scenario?: SimulationScenario;
    results?: SimulationResult[];
    forecast?: ForecastResult;
    optimalConfig?: OptimalConfiguration;
    sensitivityAnalysis?: SensitivityResult[];
  };
}

export interface ForecastResult {
  expectedConversions: number;
  expectedRevenue: number;
  expectedSpend: number;
  expectedRoas: number;
  confidenceInterval: {
    conversions: [number, number];
    revenue: [number, number];
    roas: [number, number];
  };
  riskMetrics: {
    varAt95: number; // Value at Risk
    expectedShortfall: number;
    probabilityOfLoss: number;
  };
}

export interface OptimalConfiguration {
  dailyBudget: number;
  bidAmount: number;
  expectedRoas: number;
  confidence: number;
  tradeoffs: string[];
}

export interface SensitivityResult {
  parameter: string;
  baseValue: number;
  impact: number; // % change in outcome per 1% change in parameter
  elasticity: number;
  recommendation: string;
}

// ============================================================================
// Configuration
// ============================================================================

export const simulationConfig: AgentConfig = {
  id: 'simulation',
  tier: 2,
  name: 'Simulation Agent',
  description: 'Monte Carlo outcome prediction and scenario modeling',
  capabilities: [
    {
      id: 'monte_carlo',
      name: 'Monte Carlo Simulation',
      description: 'Run Monte Carlo simulations for outcome prediction',
      inputTypes: ['simulation_scenario', 'campaign'],
      outputTypes: ['simulation_results'],
    },
    {
      id: 'outcome_prediction',
      name: 'Outcome Prediction',
      description: 'Predict campaign outcomes with confidence intervals',
      inputTypes: ['campaign', 'forecast_request'],
      outputTypes: ['forecast'],
    },
    {
      id: 'budget_optimization',
      name: 'Budget Optimization',
      description: 'Find optimal budget allocation',
      inputTypes: ['campaign', 'optimization_request'],
      outputTypes: ['optimal_config'],
    },
    {
      id: 'sensitivity_analysis',
      name: 'Sensitivity Analysis',
      description: 'Analyze parameter sensitivity',
      inputTypes: ['campaign', 'sensitivity_request'],
      outputTypes: ['sensitivity_results'],
    },
  ],
  maxConcurrency: 4,
  timeoutMs: 60000, // Simulations can take time
  priority: 75,
  dependencies: ['memory', 'historical-memory'],
};

// ============================================================================
// Monte Carlo Engine
// ============================================================================

class MonteCarloEngine {
  /**
   * Run Monte Carlo simulation
   */
  async simulate(
    baseMetrics: CampaignMetricsBase,
    variations: ScenarioVariation[],
    iterations: number = 10000
  ): Promise<SimulationResult[]> {
    const results: SimulationResult[] = [];

    for (const variation of variations) {
      const outcomes = await this.runIterations(
        baseMetrics,
        variation.changes,
        iterations
      );

      const metrics = this.calculateMetrics(outcomes);
      const riskScore = this.calculateRiskScore(outcomes);

      results.push({
        variationId: variation.id,
        metrics,
        probability: this.calculateSuccessProbability(outcomes),
        riskScore,
      });
    }

    return results;
  }

  /**
   * Run iterations for a single variation
   */
  private async runIterations(
    base: CampaignMetricsBase,
    changes: Record<string, unknown>,
    iterations: number
  ): Promise<IterationOutcome[]> {
    const outcomes: IterationOutcome[] = [];

    // Apply changes to base
    const modified = this.applyChanges(base, changes);

    for (let i = 0; i < iterations; i++) {
      // Add stochastic noise
      const noisy = this.addNoise(modified);

      // Calculate outcomes
      const conversions = this.simulateConversions(noisy);
      const revenue = conversions * noisy.avgOrderValue * (1 + this.normalRandom(0, 0.1));
      const spend = noisy.dailyBudget * noisy.timeHorizon;
      const roas = spend > 0 ? revenue / spend : 0;

      outcomes.push({ conversions, revenue, spend, roas });
    }

    return outcomes;
  }

  /**
   * Apply changes to base metrics
   */
  private applyChanges(
    base: CampaignMetricsBase,
    changes: Record<string, unknown>
  ): CampaignMetricsBase {
    return {
      ...base,
      dailyBudget: (changes.dailyBudget as number) ?? base.dailyBudget,
      bidAmount: (changes.bidAmount as number) ?? base.bidAmount,
      conversionRate: (changes.conversionRate as number) ?? base.conversionRate,
      ctr: (changes.ctr as number) ?? base.ctr,
    };
  }

  /**
   * Add stochastic noise to metrics
   */
  private addNoise(metrics: CampaignMetricsBase): CampaignMetricsBase {
    return {
      ...metrics,
      conversionRate: metrics.conversionRate * (1 + this.normalRandom(0, 0.15)),
      ctr: metrics.ctr * (1 + this.normalRandom(0, 0.1)),
      cpc: metrics.cpc * (1 + this.normalRandom(0, 0.2)),
    };
  }

  /**
   * Simulate conversions
   */
  private simulateConversions(metrics: CampaignMetricsBase): number {
    const dailyClicks = (metrics.dailyBudget / metrics.cpc) * (1 + this.normalRandom(0, 0.1));
    const dailyConversions = dailyClicks * metrics.conversionRate;
    return Math.round(dailyConversions * metrics.timeHorizon);
  }

  /**
   * Calculate aggregate metrics from outcomes
   */
  private calculateMetrics(outcomes: IterationOutcome[]): SimulationResult['metrics'] {
    const n = outcomes.length;
    const sorted = {
      conversions: [...outcomes.map((o) => o.conversions)].sort((a, b) => a - b),
      revenue: [...outcomes.map((o) => o.revenue)].sort((a, b) => a - b),
      spend: [...outcomes.map((o) => o.spend)].sort((a, b) => a - b),
      roas: [...outcomes.map((o) => o.roas)].sort((a, b) => a - b),
    };

    const percentile = (arr: number[], p: number) => arr[Math.floor(n * p)];
    const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / n;

    return {
      expectedConversions: mean(sorted.conversions),
      expectedRevenue: mean(sorted.revenue),
      expectedSpend: mean(sorted.spend),
      expectedRoas: mean(sorted.roas),
      confidenceInterval: [
        percentile(sorted.roas, 0.025),
        percentile(sorted.roas, 0.975),
      ],
    };
  }

  /**
   * Calculate risk score
   */
  private calculateRiskScore(outcomes: IterationOutcome[]): number {
    const roasValues = outcomes.map((o) => o.roas);
    const mean = roasValues.reduce((a, b) => a + b, 0) / roasValues.length;
    const variance = roasValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / roasValues.length;
    const stdDev = Math.sqrt(variance);

    // Risk score based on coefficient of variation and probability of loss
    const cv = mean > 0 ? stdDev / mean : 1;
    const probLoss = roasValues.filter((r) => r < 1).length / roasValues.length;

    return Math.min(1, cv * 0.5 + probLoss * 0.5);
  }

  /**
   * Calculate probability of success (ROAS > 1)
   */
  private calculateSuccessProbability(outcomes: IterationOutcome[]): number {
    return outcomes.filter((o) => o.roas >= 1).length / outcomes.length;
  }

  /**
   * Normal random number generator (Box-Muller transform)
   */
  private normalRandom(mean: number = 0, stdDev: number = 1): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + stdDev * z;
  }
}

interface CampaignMetricsBase {
  dailyBudget: number;
  bidAmount: number;
  conversionRate: number;
  ctr: number;
  cpc: number;
  avgOrderValue: number;
  timeHorizon: number;
}

interface IterationOutcome {
  conversions: number;
  revenue: number;
  spend: number;
  roas: number;
}

// ============================================================================
// Simulation Agent Implementation
// ============================================================================

export class SimulationAgent extends BaseAgent<SimulationInput, SimulationOutput> {
  private engine: MonteCarloEngine;
  private simulationCache: Map<string, SimulationResult[]>;

  constructor(deps?: AgentDependencies) {
    super(simulationConfig, deps);
    this.engine = new MonteCarloEngine();
    this.simulationCache = new Map();
  }

  /**
   * Main processing logic
   */
  protected async process(
    input: SimulationInput,
    context: TaskContext
  ): Promise<SimulationOutput> {
    this.logger.info('Processing simulation request', { action: input.action });

    switch (input.action) {
      case 'simulate':
        return this.runSimulation(input, context);
      case 'forecast':
        return this.generateForecast(input, context);
      case 'optimize':
        return this.findOptimalConfig(input, context);
      case 'sensitivity':
        return this.analyzeSensitivity(input, context);
      default:
        throw new Error(`Unknown action: ${input.action}`);
    }
  }

  /**
   * Run Monte Carlo simulation
   */
  private async runSimulation(
    input: SimulationInput,
    context: TaskContext
  ): Promise<SimulationOutput> {
    if (!input.scenario) {
      throw new Error('Scenario is required for simulation');
    }

    const { scenario, parameters } = input;
    const iterations = parameters?.iterations ?? 10000;

    // Extract base metrics from scenario
    const baseMetrics = this.extractBaseMetrics(scenario.baselineConfig);

    // Run simulation
    const results = await this.engine.simulate(
      baseMetrics,
      scenario.variations,
      iterations
    );

    // Cache results
    this.simulationCache.set(scenario.id, results);

    // Update scenario with results
    scenario.results = results;
    scenario.runAt = new Date();

    this.logger.info('Simulation complete', {
      scenarioId: scenario.id,
      variations: results.length,
      iterations,
    });

    // Emit event
    await this.emitEvent(
      'intelligence.prediction_generated',
      scenario.id,
      'simulation',
      { scenarioId: scenario.id, resultCount: results.length },
      context.correlationId
    );

    return {
      action: 'simulate',
      result: { scenario, results },
    };
  }

  /**
   * Generate forecast for a campaign
   */
  private async generateForecast(
    input: SimulationInput,
    context: TaskContext
  ): Promise<SimulationOutput> {
    const { campaign, parameters } = input;

    if (!campaign) {
      throw new Error('Campaign is required for forecast');
    }

    const iterations = parameters?.iterations ?? 10000;
    const timeHorizon = parameters?.timeHorizon ?? 30;

    const baseMetrics: CampaignMetricsBase = {
      dailyBudget: campaign.budget.daily,
      bidAmount: campaign.bidding.targetValue ?? 1,
      conversionRate: campaign.metrics.conversions / Math.max(campaign.metrics.clicks, 1),
      ctr: campaign.metrics.ctr,
      cpc: campaign.metrics.cpc,
      avgOrderValue: campaign.metrics.revenue / Math.max(campaign.metrics.conversions, 1),
      timeHorizon,
    };

    // Run baseline simulation
    const baselineVariation: ScenarioVariation = {
      id: 'baseline',
      name: 'Current Configuration',
      changes: {},
    };

    const results = await this.engine.simulate(baseMetrics, [baselineVariation], iterations);
    const baseline = results[0];

    // Calculate risk metrics
    const forecast: ForecastResult = {
      expectedConversions: baseline.metrics.expectedConversions,
      expectedRevenue: baseline.metrics.expectedRevenue,
      expectedSpend: baseline.metrics.expectedSpend,
      expectedRoas: baseline.metrics.expectedRoas,
      confidenceInterval: {
        conversions: [
          baseline.metrics.expectedConversions * 0.8,
          baseline.metrics.expectedConversions * 1.2,
        ],
        revenue: [
          baseline.metrics.expectedRevenue * 0.75,
          baseline.metrics.expectedRevenue * 1.25,
        ],
        roas: baseline.metrics.confidenceInterval,
      },
      riskMetrics: {
        varAt95: baseline.metrics.expectedRevenue * 0.3,
        expectedShortfall: baseline.metrics.expectedRevenue * 0.4,
        probabilityOfLoss: 1 - baseline.probability,
      },
    };

    return {
      action: 'forecast',
      result: { forecast },
    };
  }

  /**
   * Find optimal configuration
   */
  private async findOptimalConfig(
    input: SimulationInput,
    context: TaskContext
  ): Promise<SimulationOutput> {
    const { campaign, parameters } = input;

    if (!campaign) {
      throw new Error('Campaign is required for optimization');
    }

    const budgetRange = parameters?.budgetRange ?? [
      campaign.budget.daily * 0.5,
      campaign.budget.daily * 2,
    ];
    const bidRange = parameters?.bidRange ?? [
      (campaign.bidding.targetValue ?? 1) * 0.5,
      (campaign.bidding.targetValue ?? 1) * 2,
    ];

    // Generate variations across budget and bid space
    const variations: ScenarioVariation[] = [];
    const budgetSteps = 5;
    const bidSteps = 5;

    for (let b = 0; b < budgetSteps; b++) {
      for (let i = 0; i < bidSteps; i++) {
        const budget = budgetRange[0] + (budgetRange[1] - budgetRange[0]) * (b / (budgetSteps - 1));
        const bid = bidRange[0] + (bidRange[1] - bidRange[0]) * (i / (bidSteps - 1));

        variations.push({
          id: `opt_${b}_${i}`,
          name: `Budget: $${budget.toFixed(0)}, Bid: $${bid.toFixed(2)}`,
          changes: { dailyBudget: budget, bidAmount: bid },
        });
      }
    }

    const baseMetrics: CampaignMetricsBase = {
      dailyBudget: campaign.budget.daily,
      bidAmount: campaign.bidding.targetValue ?? 1,
      conversionRate: campaign.metrics.conversions / Math.max(campaign.metrics.clicks, 1),
      ctr: campaign.metrics.ctr,
      cpc: campaign.metrics.cpc,
      avgOrderValue: campaign.metrics.revenue / Math.max(campaign.metrics.conversions, 1),
      timeHorizon: parameters?.timeHorizon ?? 30,
    };

    const results = await this.engine.simulate(baseMetrics, variations, 5000);

    // Find optimal (highest ROAS with acceptable risk)
    const viable = results.filter((r) => r.riskScore < 0.6);
    const optimal = viable.length > 0
      ? viable.reduce((a, b) => (a.metrics.expectedRoas > b.metrics.expectedRoas ? a : b))
      : results.reduce((a, b) => (a.metrics.expectedRoas > b.metrics.expectedRoas ? a : b));

    // Extract optimal config from variation
    const optimalVariation = variations.find((v) => v.id === optimal.variationId)!;

    const optimalDailyBudget = (optimalVariation.changes.dailyBudget as number) ?? campaign.budget.daily;
    const optimalBidAmount = (optimalVariation.changes.bidAmount as number) ?? campaign.bidding.targetValue ?? 1;

    const optimalConfig: OptimalConfiguration = {
      dailyBudget: optimalDailyBudget,
      bidAmount: optimalBidAmount,
      expectedRoas: optimal.metrics.expectedRoas,
      confidence: optimal.probability,
      tradeoffs: [],
    };

    optimalConfig.tradeoffs = this.generateTradeoffs(campaign, optimalConfig, optimal);

    return {
      action: 'optimize',
      result: { optimalConfig, results },
    };
  }

  /**
   * Analyze parameter sensitivity
   */
  private async analyzeSensitivity(
    input: SimulationInput,
    context: TaskContext
  ): Promise<SimulationOutput> {
    const { campaign, parameters } = input;

    if (!campaign) {
      throw new Error('Campaign is required for sensitivity analysis');
    }

    const baseMetrics: CampaignMetricsBase = {
      dailyBudget: campaign.budget.daily,
      bidAmount: campaign.bidding.targetValue ?? 1,
      conversionRate: campaign.metrics.conversions / Math.max(campaign.metrics.clicks, 1),
      ctr: campaign.metrics.ctr,
      cpc: campaign.metrics.cpc,
      avgOrderValue: campaign.metrics.revenue / Math.max(campaign.metrics.conversions, 1),
      timeHorizon: parameters?.timeHorizon ?? 30,
    };

    const sensitivityResults: SensitivityResult[] = [];
    const testParams = ['dailyBudget', 'bidAmount', 'conversionRate', 'ctr'];
    const perturbation = 0.1; // 10% change

    for (const param of testParams) {
      const baseValue = baseMetrics[param as keyof CampaignMetricsBase] as number;

      // Run with increased value
      const increasedVariation: ScenarioVariation = {
        id: `${param}_up`,
        name: `${param} +10%`,
        changes: { [param]: baseValue * (1 + perturbation) },
      };

      const decreasedVariation: ScenarioVariation = {
        id: `${param}_down`,
        name: `${param} -10%`,
        changes: { [param]: baseValue * (1 - perturbation) },
      };

      const results = await this.engine.simulate(
        baseMetrics,
        [increasedVariation, decreasedVariation],
        2000
      );

      const baseResult = await this.engine.simulate(
        baseMetrics,
        [{ id: 'base', name: 'Baseline', changes: {} }],
        2000
      );

      const baseRoas = baseResult[0].metrics.expectedRoas;
      const upRoas = results[0].metrics.expectedRoas;
      const downRoas = results[1].metrics.expectedRoas;

      const impact = ((upRoas - downRoas) / (2 * perturbation * baseRoas)) * 100;
      const elasticity = (upRoas - baseRoas) / baseRoas / perturbation;

      sensitivityResults.push({
        parameter: param,
        baseValue,
        impact,
        elasticity,
        recommendation: this.generateSensitivityRecommendation(param, elasticity),
      });
    }

    return {
      action: 'sensitivity',
      result: { sensitivityAnalysis: sensitivityResults },
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private extractBaseMetrics(config: Record<string, unknown>): CampaignMetricsBase {
    return {
      dailyBudget: (config.dailyBudget as number) ?? 100,
      bidAmount: (config.bidAmount as number) ?? 1,
      conversionRate: (config.conversionRate as number) ?? 0.02,
      ctr: (config.ctr as number) ?? 0.02,
      cpc: (config.cpc as number) ?? 1,
      avgOrderValue: (config.avgOrderValue as number) ?? 50,
      timeHorizon: (config.timeHorizon as number) ?? 30,
    };
  }

  private generateTradeoffs(
    campaign: Campaign,
    optimal: OptimalConfiguration,
    result: SimulationResult
  ): string[] {
    const tradeoffs: string[] = [];

    if (optimal.dailyBudget > campaign.budget.daily * 1.2) {
      tradeoffs.push('Higher budget increases risk exposure');
    }
    if (optimal.dailyBudget < campaign.budget.daily * 0.8) {
      tradeoffs.push('Lower budget may reduce market share');
    }
    if (result.riskScore > 0.3) {
      tradeoffs.push('Moderate risk - monitor closely');
    }

    return tradeoffs;
  }

  private generateSensitivityRecommendation(param: string, elasticity: number): string {
    if (Math.abs(elasticity) > 1) {
      return `${param} is highly sensitive - small changes have large impact`;
    } else if (Math.abs(elasticity) > 0.5) {
      return `${param} has moderate sensitivity - consider for optimization`;
    }
    return `${param} has low sensitivity - stable parameter`;
  }

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  protected async onInitialize(): Promise<void> {
    this.logger.info('Simulation agent initializing');
  }

  protected async onShutdown(): Promise<void> {
    this.logger.info('Simulation agent shutting down');
    this.simulationCache.clear();
  }

  protected getSubscribedEvents(): EventType[] {
    return ['campaign.created', 'campaign.budget_adjusted'];
  }

  protected async handleEvent(event: DomainEvent): Promise<void> {
    // Auto-simulate on campaign changes
    if (event.type === 'campaign.budget_adjusted') {
      this.logger.info('Budget adjustment detected - may trigger re-simulation', {
        campaignId: event.aggregateId,
      });
    }
  }
}
