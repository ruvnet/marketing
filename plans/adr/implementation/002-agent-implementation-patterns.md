# ADR-002: Agent Implementation Patterns

## Status
Accepted

## Date
2024-01-13

## Context
This ADR documents the patterns used to implement the 15 agents in the marketing swarm.

## Agent Implementation Patterns

### Pattern 1: Task Type Routing
Each agent handles specific task types routed by the Orchestrator.

```typescript
protected async process(task: Task): Promise<void> {
  switch (task.type) {
    case 'campaign_optimization':
      return this.handleCampaignOptimization(task);
    case 'bid_adjustment':
      return this.handleBidAdjustment(task);
    default:
      throw new Error(`Unknown task type: ${task.type}`);
  }
}
```

### Pattern 2: Event-Driven Communication
Agents communicate through the event bus, not direct calls.

```typescript
// Publishing events
this.eventBus.publish({
  id: uuidv4(),
  type: 'campaign.optimized',
  timestamp: new Date(),
  source: this.id,
  payload: { campaignId, recommendations }
});

// Subscribing to events
protected getSubscribedEvents(): string[] {
  return ['campaign.created', 'metrics.updated'];
}
```

### Pattern 3: State Management
Agents use the centralized StateManager for shared state.

```typescript
// Reading state
const campaign = this.stateManager.getCampaign(campaignId);

// Updating state
this.stateManager.addTask(task);
this.stateManager.updateTaskStatus(taskId, 'completed');
```

### Pattern 4: Monte Carlo Simulation (Tier 2)
Simulation agent uses Monte Carlo methods for predictions.

```typescript
private runMonteCarloSimulation(
  campaigns: Campaign[],
  scenarios: number
): ForecastResult {
  const results: number[] = [];
  for (let i = 0; i < scenarios; i++) {
    results.push(this.simulateScenario(campaigns));
  }
  return this.analyzeResults(results);
}
```

### Pattern 5: Creative DNA (Tier 3)
Creative Genome agent decomposes creatives into genetic components.

```typescript
interface CreativeDNA {
  hookGene: HookGene;       // Attention-grabbing elements
  promiseGene: PromiseGene; // Value proposition
  proofGene: ProofGene;     // Credibility elements
  ctaGene: CTAGene;         // Call-to-action
}
```

### Pattern 6: Causal Graph Building (Tier 4)
Causal Graph Builder creates directed acyclic graphs for attribution.

```typescript
interface CausalNode {
  id: string;
  type: 'touchpoint' | 'conversion' | 'confounder';
  data: Record<string, unknown>;
}

interface CausalEdge {
  source: string;
  target: string;
  weight: number;
  mechanism: string;
}
```

### Pattern 7: Health Scoring (Tier 5)
Account Health agent computes health scores across dimensions.

```typescript
interface HealthScore {
  overall: number;          // 0-100
  dimensions: {
    performance: number;    // ROAS, CTR, etc.
    efficiency: number;     // Budget utilization
    compliance: number;     // Policy adherence
    stability: number;      // Volatility metrics
  };
  trend: 'improving' | 'stable' | 'declining';
}
```

## Agent Capabilities Matrix

| Agent | Task Types | Events Published | Events Subscribed |
|-------|------------|------------------|-------------------|
| Orchestrator | task_routing, load_balancing | task.assigned, task.completed | task.* |
| Memory | context_retrieval, session_management | memory.updated, memory.retrieved | task.*, agent.* |
| Quality | validation, truth_scoring | quality.passed, quality.failed | task.completed |
| Simulation | forecasting, scenario_planning | forecast.generated | campaign.*, metrics.* |
| Historical Memory | pattern_retrieval, trend_analysis | pattern.matched | campaign.*, creative.* |
| Risk Detection | anomaly_detection, fraud_detection | risk.detected, risk.cleared | metrics.*, spend.* |
| Attention Arbitrage | cpm_analysis, opportunity_detection | arbitrage.opportunity | market.*, platform.* |
| Creative Genome | dna_extraction, genome_comparison | creative.analyzed | creative.* |
| Fatigue Forecaster | decay_modeling, lifespan_estimation | fatigue.predicted | creative.*, metrics.* |
| Mutation | variant_generation, crossover | creative.mutated | creative.*, fatigue.* |
| Counterfactual | what_if_analysis, impact_estimation | counterfactual.computed | campaign.*, metrics.* |
| Causal Graph | graph_building, path_finding | causality.mapped | touchpoint.*, conversion.* |
| Incrementality | lift_analysis, test_design | incrementality.measured | campaign.*, experiment.* |
| Account Health | health_diagnosis, healing_actions | health.updated | campaign.*, risk.*, metrics.* |
| Cross-Platform | sync_planning, unified_reporting | platform.synced | platform.*, campaign.* |

## Error Handling Pattern

All agents follow consistent error handling:

```typescript
try {
  await this.process(task);
  this.stateManager.updateTaskStatus(task.id, 'completed');
  this.eventBus.publish({
    type: 'task.completed',
    payload: { taskId: task.id }
  });
} catch (error) {
  this.errorCount++;
  this.logger.error('Task processing failed', { taskId: task.id, error });
  this.stateManager.updateTaskStatus(task.id, 'failed');
  this.eventBus.publish({
    type: 'task.failed',
    payload: { taskId: task.id, error: String(error) }
  });
}
```

## Related ADRs
- [001-implementation-decisions](./001-implementation-decisions.md)
- [001-domain-overview](../../ddd/agent-swarm/001-domain-overview.md)
