# DDD: Campaign Optimization Domain - Overview

## Domain Purpose

The **Campaign Optimization Domain** orchestrates the continuous improvement of advertising campaigns. It integrates signals from all other domains to make data-driven decisions about budget allocation, bidding strategies, targeting, and creative rotation.

## Strategic Classification

| Aspect | Classification |
|--------|----------------|
| **Domain Type** | Core Domain |
| **Business Value** | Critical - Direct revenue impact |
| **Complexity** | High - Multi-signal optimization |
| **Volatility** | Medium - Strategies evolve |

## Ubiquitous Language

| Term | Definition |
|------|------------|
| **Campaign** | A marketing initiative with budget, targeting, and creatives |
| **Optimization** | An action taken to improve campaign performance |
| **Budget Allocation** | Distribution of spend across campaigns/ad sets |
| **Bidding Strategy** | Automated bid optimization approach |
| **Pacing** | Rate of budget spend over time |
| **Learning Phase** | Platform's initial optimization period |
| **ROAS** | Return on ad spend (revenue/spend) |
| **CPA** | Cost per acquisition (spend/conversions) |

## Domain Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   CAMPAIGN OPTIMIZATION DOMAIN MODEL                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         AGGREGATES                                   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              Campaign (Aggregate Root)                       │   │   │
│  │  │                                                              │   │   │
│  │  │  • campaignId: CampaignId                                   │   │   │
│  │  │  • accountId: AccountId                                     │   │   │
│  │  │  • platform: Platform                                       │   │   │
│  │  │  • status: CampaignStatus                                   │   │   │
│  │  │  • budget: Budget                                           │   │   │
│  │  │  • bidding: BiddingStrategy                                 │   │   │
│  │  │  • targeting: Targeting                                     │   │   │
│  │  │  • adSets: AdSet[]                                          │   │   │
│  │  │  • metrics: CampaignMetrics                                 │   │   │
│  │  │  • intelligence: CampaignIntelligence                       │   │   │
│  │  │                                                              │   │   │
│  │  │  + optimize(action: OptimizationAction): void               │   │   │
│  │  │  + adjustBudget(newBudget: Budget): void                    │   │   │
│  │  │  + updateBidding(strategy: BiddingStrategy): void           │   │   │
│  │  │  + recordMetrics(metrics: CampaignMetrics): void            │   │   │
│  │  │  + getHealthScore(): number                                 │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              OptimizationPlan (Aggregate Root)               │   │   │
│  │  │                                                              │   │   │
│  │  │  • planId: PlanId                                           │   │   │
│  │  │  • accountId: AccountId                                     │   │   │
│  │  │  • campaigns: CampaignId[]                                  │   │   │
│  │  │  • objective: OptimizationObjective                         │   │   │
│  │  │  • actions: OptimizationAction[]                            │   │   │
│  │  │  • simulation: SimulationResult                             │   │   │
│  │  │  • status: PlanStatus                                       │   │   │
│  │  │                                                              │   │   │
│  │  │  + addAction(action: OptimizationAction): void              │   │   │
│  │  │  + simulate(): SimulationResult                             │   │   │
│  │  │  + execute(): ExecutionResult                               │   │   │
│  │  │  + rollback(): void                                         │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              BudgetAllocation (Aggregate Root)               │   │   │
│  │  │                                                              │   │   │
│  │  │  • allocationId: AllocationId                               │   │   │
│  │  │  • accountId: AccountId                                     │   │   │
│  │  │  • totalBudget: Money                                       │   │   │
│  │  │  • allocations: Map<CampaignId, Money>                      │   │   │
│  │  │  • strategy: AllocationStrategy                             │   │   │
│  │  │  • constraints: AllocationConstraints                       │   │   │
│  │  │                                                              │   │   │
│  │  │  + optimize(): BudgetAllocation                             │   │   │
│  │  │  + rebalance(): void                                        │   │   │
│  │  │  + apply(): void                                            │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       VALUE OBJECTS                                  │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    Budget (Value Object)                     │   │   │
│  │  │                                                              │   │   │
│  │  │  • type: 'DAILY' | 'LIFETIME'                               │   │   │
│  │  │  • amount: Money                                            │   │   │
│  │  │  • spent: Money                                             │   │   │
│  │  │  • remaining: Money                                         │   │   │
│  │  │  • pacing: PacingType                                       │   │   │
│  │  │                                                              │   │   │
│  │  │  + isOnPace(): boolean                                      │   │   │
│  │  │  + percentSpent(): number                                   │   │   │
│  │  │  + projectedSpend(hours: number): Money                     │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    BiddingStrategy (Value Object)            │   │   │
│  │  │                                                              │   │   │
│  │  │  • type: BidStrategyType                                    │   │   │
│  │  │  • targetCpa: Money?                                        │   │   │
│  │  │  • targetRoas: number?                                      │   │   │
│  │  │  • maxBid: Money?                                           │   │   │
│  │  │  • bidAdjustments: BidAdjustment[]                          │   │   │
│  │  │                                                              │   │   │
│  │  │  + isLearning(): boolean                                    │   │   │
│  │  │  + suggestTarget(metrics: CampaignMetrics): Money           │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    CampaignMetrics (Value Object)            │   │   │
│  │  │                                                              │   │   │
│  │  │  • impressions: number                                      │   │   │
│  │  │  • clicks: number                                           │   │   │
│  │  │  • conversions: number                                      │   │   │
│  │  │  • spend: Money                                             │   │   │
│  │  │  • revenue: Money                                           │   │   │
│  │  │  • period: DateRange                                        │   │   │
│  │  │                                                              │   │   │
│  │  │  + ctr(): number                                            │   │   │
│  │  │  + cpm(): Money                                             │   │   │
│  │  │  + cpc(): Money                                             │   │   │
│  │  │  + cpa(): Money                                             │   │   │
│  │  │  + roas(): number                                           │   │   │
│  │  │  + conversionRate(): number                                 │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    OptimizationAction (Value Object)         │   │   │
│  │  │                                                              │   │   │
│  │  │  • type: ActionType                                         │   │   │
│  │  │  • target: CampaignId | AdSetId | CreativeId                │   │   │
│  │  │  • parameters: Record<string, unknown>                      │   │   │
│  │  │  • reasoning: string                                        │   │   │
│  │  │  • predictedImpact: ImpactPrediction                        │   │   │
│  │  │  • confidence: number                                       │   │   │
│  │  │  • agentId: AgentId                                         │   │   │
│  │  │                                                              │   │   │
│  │  │  + validate(): ValidationResult                             │   │   │
│  │  │  + estimateRisk(): RiskLevel                                │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    CampaignIntelligence (Value Object)       │   │   │
│  │  │                                                              │   │   │
│  │  │  • embedding: Embedding                                     │   │   │
│  │  │  • healthScore: number                                      │   │   │
│  │  │  • riskFactors: RiskFactor[]                                │   │   │
│  │  │  • opportunities: Opportunity[]                             │   │   │
│  │  │  • predictions: Prediction[]                                │   │   │
│  │  │  • lastAnalysis: Timestamp                                  │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       DOMAIN SERVICES                                │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              CampaignOptimizationService                     │   │   │
│  │  │                                                              │   │   │
│  │  │  - intelligence: MarketingIntelligenceService               │   │   │
│  │  │  - simulationAgent: SimulationAgent                         │   │   │
│  │  │  - qualityAgent: QualityAgent                               │   │   │
│  │  │                                                              │   │   │
│  │  │  + analyze(campaign: Campaign): CampaignAnalysis            │   │   │
│  │  │  + suggestOptimizations(campaign): OptimizationAction[]     │   │   │
│  │  │  + executeOptimization(action): ExecutionResult             │   │   │
│  │  │  + validateOptimization(action): ValidationResult           │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              BudgetOptimizationService                       │   │   │
│  │  │                                                              │   │   │
│  │  │  - mincut: DynamicMinCut                                    │   │   │
│  │  │  - simulationAgent: SimulationAgent                         │   │   │
│  │  │                                                              │   │   │
│  │  │  + optimizeAllocation(campaigns, budget): BudgetAllocation  │   │   │
│  │  │  + computeSynergies(campaigns): SynergyMatrix               │   │   │
│  │  │  + rebalance(allocation): BudgetAllocation                  │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              SimulationService                               │   │   │
│  │  │                                                              │   │   │
│  │  │  - monteCarloEngine: MonteCarloEngine                       │   │   │
│  │  │  - gnnPredictor: GnnPredictionService                       │   │   │
│  │  │                                                              │   │   │
│  │  │  + simulate(plan: OptimizationPlan): SimulationResult       │   │   │
│  │  │  + predictOutcome(action): OutcomePrediction                │   │   │
│  │  │  + runScenarios(scenarios): ScenarioResult[]                │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              AccountHealthService                            │   │   │
│  │  │                                                              │   │   │
│  │  │  - accountHealthAgent: AccountHealthAgent                   │   │   │
│  │  │  - riskDetectionAgent: RiskDetectionAgent                   │   │   │
│  │  │                                                              │   │   │
│  │  │  + monitor(account: Account): HealthReport                  │   │   │
│  │  │  + detectAnomalies(campaigns): Anomaly[]                    │   │   │
│  │  │  + heal(anomaly: Anomaly): HealingResult                    │   │   │
│  │  │  + preventIssue(risk: RiskFactor): PreventionAction         │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       DOMAIN EVENTS                                  │   │
│  │                                                                      │   │
│  │  • CampaignCreated { campaignId, accountId, platform, timestamp }   │   │
│  │  • CampaignOptimized { campaignId, action, result, timestamp }      │   │
│  │  • BudgetAdjusted { campaignId, oldBudget, newBudget, timestamp }   │   │
│  │  • BiddingStrategyChanged { campaignId, strategy, timestamp }       │   │
│  │  • MetricsRecorded { campaignId, metrics, timestamp }               │   │
│  │  • AnomalyDetected { campaignId, anomaly, severity, timestamp }     │   │
│  │  • HealingApplied { campaignId, anomaly, action, timestamp }        │   │
│  │  • AllocationOptimized { accountId, allocation, timestamp }         │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       POLICIES                                       │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              BudgetPolicy                                    │   │   │
│  │  │                                                              │   │   │
│  │  │  • minBudgetChange: 10% (no changes less than 10%)          │   │   │
│  │  │  • maxBudgetChange: 50% (no changes more than 50%/day)      │   │   │
│  │  │  • cooldownPeriod: 24 hours (between major changes)         │   │   │
│  │  │  • learningProtection: true (don't touch learning phases)   │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              OptimizationPolicy                              │   │   │
│  │  │                                                              │   │   │
│  │  │  • minConfidence: 0.7 (for auto-apply)                      │   │   │
│  │  │  • requireSimulation: true (simulate before execute)        │   │   │
│  │  │  • qualityThreshold: 0.95 (quality agent approval)          │   │   │
│  │  │  • rollbackEnabled: true (auto-rollback on failure)         │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              RiskPolicy                                      │   │   │
│  │  │                                                              │   │   │
│  │  │  • maxSpendVelocity: 2x (vs historical average)             │   │   │
│  │  │  • cpmSpikeThreshold: 30% (alert on CPM increase)           │   │   │
│  │  │  • conversionDropThreshold: 40% (alert on drop)             │   │   │
│  │  │  • autoHealEnabled: true (automatic recovery)               │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Optimization Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      OPTIMIZATION WORKFLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │ Monitor │───▶│ Analyze │───▶│ Propose │───▶│Simulate │───▶│ Execute │  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └────┬────┘  │
│                                                                    │       │
│                                                                    │       │
│  ┌─────────────────────────────────────────────────────────────────┘       │
│  │                                                                         │
│  │    ┌─────────┐    ┌─────────┐    ┌─────────┐                           │
│  └───▶│ Measure │───▶│  Learn  │───▶│ Iterate │                           │
│       └─────────┘    └─────────┘    └─────────┘                           │
│                            │                                               │
│                            │                                               │
│                            ▼                                               │
│                     [SONA Adaptive]                                        │
│                      [Learning]                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Implementation Example

```typescript
// services/campaign-optimization.service.ts
export class CampaignOptimizationService {
  private intelligence: MarketingIntelligenceService;
  private simulationAgent: SimulationAgent;
  private qualityAgent: QualityAgent;
  private budgetService: BudgetOptimizationService;

  async optimizeCampaign(
    campaign: Campaign
  ): Promise<OptimizationResult> {
    // 1. Analyze current state
    const analysis = await this.analyzeCampaign(campaign);

    // 2. Generate optimization suggestions
    const suggestions = await this.generateSuggestions(campaign, analysis);

    // 3. Simulate each suggestion
    const simulatedSuggestions = await Promise.all(
      suggestions.map(async s => ({
        suggestion: s,
        simulation: await this.simulationAgent.simulate(s)
      }))
    );

    // 4. Filter by quality threshold
    const validSuggestions = simulatedSuggestions.filter(
      ss => ss.simulation.confidence >= 0.7
    );

    // 5. Quality agent validation
    const approved = await this.qualityAgent.validate(validSuggestions);

    // 6. Execute approved optimizations
    const results: ExecutionResult[] = [];
    for (const suggestion of approved) {
      const result = await this.executeOptimization(campaign, suggestion);
      results.push(result);

      // Emit domain event
      DomainEvents.raise(new CampaignOptimized({
        campaignId: campaign.id,
        action: suggestion,
        result,
        timestamp: Date.now()
      }));
    }

    return {
      campaign: campaign.id,
      optimizations: results,
      totalImprovementPredicted: this.sumImprovements(results)
    };
  }

  private async generateSuggestions(
    campaign: Campaign,
    analysis: CampaignAnalysis
  ): Promise<OptimizationAction[]> {
    const suggestions: OptimizationAction[] = [];

    // Budget suggestions
    if (analysis.budgetEfficiency < 0.7) {
      const optimalBudget = await this.budgetService.suggestBudget(campaign);
      suggestions.push(new OptimizationAction({
        type: 'BUDGET_ADJUSTMENT',
        target: campaign.id,
        parameters: { newBudget: optimalBudget },
        reasoning: `Budget efficiency at ${analysis.budgetEfficiency}`,
        predictedImpact: { roas: 0.15, confidence: 0.8 }
      }));
    }

    // Bidding suggestions
    if (analysis.biddingHealth < 0.6) {
      suggestions.push(new OptimizationAction({
        type: 'BIDDING_ADJUSTMENT',
        target: campaign.id,
        parameters: {
          strategy: this.suggestBiddingStrategy(analysis)
        },
        reasoning: `Bidding health at ${analysis.biddingHealth}`,
        predictedImpact: { cpa: -0.1, confidence: 0.75 }
      }));
    }

    // Creative rotation suggestions
    for (const creative of campaign.creatives) {
      if (creative.fatigue.shouldRotate()) {
        suggestions.push(new OptimizationAction({
          type: 'CREATIVE_ROTATION',
          target: creative.id,
          parameters: { action: 'ROTATE' },
          reasoning: `Creative fatigue score: ${creative.fatigue.score}`,
          predictedImpact: { ctr: 0.2, confidence: 0.85 }
        }));
      }
    }

    return suggestions;
  }
}
```

## Related Documents
- [DDD: Campaign Optimization - Aggregates](./002-aggregates.md)
- [DDD: Campaign Optimization - Policies](./003-policies.md)
- [ADR: Claude-Flow v3 Swarm](../../adr/swarm-config/001-claude-flow-v3.md)
