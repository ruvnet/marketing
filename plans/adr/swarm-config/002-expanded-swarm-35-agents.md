# ADR-SW002: Expanded 35-Agent Swarm Architecture

## Status
**Proposed** | Date: 2026-01-13

## Context

The original 15-agent configuration (ADR-SW001) covers core marketing operations but lacks agents for:

1. **Dynamic Persona & Psychology** - 4 agents for moment-based targeting
2. **Offer Engineering** - 4 agents for offer optimization
3. **SEO & Semantics** - 4 agents for content optimization
4. **Conversational Commerce** - 4 agents for dialog optimization
5. **Extended Arbitrage** - 2 agents for execution and exit
6. **Extended Operations** - 2 agents for deployment and structure

Based on Build.docx requirements, we need to expand to **35 agents** in **7 tiers**.

## Decision

We will implement an expanded **35-agent hierarchical mesh swarm**.

### Expanded Swarm Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    35-AGENT MARKETING SWARM ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       TIER 1: COORDINATION (3)                       │   │
│  │                                                                      │   │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │   │ Orchestrator │  │    Memory    │  │   Quality    │              │   │
│  │   │    Agent     │  │    Agent     │  │    Agent     │              │   │
│  │   └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      TIER 2: INTELLIGENCE (6)                        │   │
│  │                                                                      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │Simulation│ │Historical│ │   Risk   │ │Attention │ │  Budget  │  │   │
│  │  │  Agent   │ │  Memory  │ │Detection │ │Arbitrage │ │Strategist│  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  │                             ┌──────────┐                            │   │
│  │                             │Exit Timing│                           │   │
│  │                             │  Agent   │                            │   │
│  │                             └──────────┘                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      TIER 3: CREATIVE (4)                            │   │
│  │                                                                      │   │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌──────────┐│   │
│  │  │Creative Genome│ │   Fatigue     │ │   Mutation    │ │Deployment││   │
│  │  │    Agent      │ │  Forecaster   │ │    Agent      │ │  Agent   ││   │
│  │  └───────────────┘ └───────────────┘ └───────────────┘ └──────────┘│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      TIER 4: ATTRIBUTION (3)                         │   │
│  │                                                                      │   │
│  │  ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐ │   │
│  │  │  Counterfactual   │ │  Causal Graph     │ │  Incrementality   │ │   │
│  │  │      Agent        │ │   Builder Agent   │ │   Auditor Agent   │ │   │
│  │  └───────────────────┘ └───────────────────┘ └───────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      TIER 5: PERSONA & PSYCHOLOGY (4)                │   │
│  │                                                                      │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐│   │
│  │  │   Moment     │ │Psychological │ │   Message    │ │ Conversion   ││   │
│  │  │ Detection    │ │    State     │ │    Frame     │ │ Probability  ││   │
│  │  │   Agent      │ │   Modeler    │ │  Selector    │ │    Agent     ││   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      TIER 6: OFFER ENGINEERING (4)                   │   │
│  │                                                                      │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐│   │
│  │  │Offer Variant │ │  Elasticity  │ │    Risk      │ │Profit-Aware  ││   │
│  │  │ Generator    │ │    Model     │ │  Reversal    │ │  Optimizer   ││   │
│  │  │   Agent      │ │    Agent     │ │    Agent     │ │    Agent     ││   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      TIER 7: OPERATIONS (5)                          │   │
│  │                                                                      │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌────────┐│   │
│  │  │  Account  │ │  Cross    │ │  Account  │ │   Speed   │ │Platform││   │
│  │  │  Health   │ │ Platform  │ │ Structure │ │ Execution │ │Behavior││   │
│  │  │  Agent    │ │  Agent    │ │ Optimizer │ │   Agent   │ │Watcher ││   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └────────┘│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      EXTENSION TIERS (Optional)                      │   │
│  │                                                                      │   │
│  │  SEO & SEMANTICS (4):                                               │   │
│  │  • Semantic Drift Tracker  • Content Rewriter Agent                 │   │
│  │  • Graph SEO Agent         • Search Performance Agent               │   │
│  │                                                                      │   │
│  │  CONVERSATIONAL COMMERCE (4):                                       │   │
│  │  • Intent Specialist       • Objection Handler                      │   │
│  │  • Emotion-Adaptive Dialog • Next-Best-Action Predictor             │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### New Agent Definitions

#### Tier 5: Persona & Psychology Agents

```yaml
# Tier 5 agents
- id: "moment-detection-agent"
  type: "MOMENT_DETECTION"
  tier: 5
  capabilities:
    - "behavioral-signal-monitoring"
    - "state-trigger-detection"
    - "btsp-pattern-learning"
    - "real-time-moment-classification"
  ruvector:
    components:
      - "nervous-system.btsp"
      - "attention.hyperbolic"
  connections:
    - "psychological-state-modeler"
    - "memory-agent"
    - "orchestrator"

- id: "psychological-state-modeler"
  type: "PSYCHOLOGICAL_STATE"
  tier: 5
  capabilities:
    - "stress-level-inference"
    - "urgency-detection"
    - "aspiration-vs-fear-mapping"
    - "decision-readiness-scoring"
  ruvector:
    components:
      - "gnn"
      - "attention.hyperbolic"
  connections:
    - "moment-detection-agent"
    - "message-frame-selector"
    - "conversion-probability-agent"

- id: "message-frame-selector"
  type: "MESSAGE_FRAME"
  tier: 5
  capabilities:
    - "frame-state-matching"
    - "intensity-calibration"
    - "multi-frame-ranking"
    - "contextual-adaptation"
  ruvector:
    components:
      - "attention.moe"
      - "tiny-dancer"
  connections:
    - "psychological-state-modeler"
    - "creative-genome-agent"
    - "mutation-agent"

- id: "conversion-probability-agent"
  type: "CONVERSION_PROBABILITY"
  tier: 5
  capabilities:
    - "real-time-probability-calculation"
    - "frame-impact-prediction"
    - "factor-contribution-analysis"
    - "sona-adaptive-learning"
  ruvector:
    components:
      - "sona"
      - "gnn"
  connections:
    - "psychological-state-modeler"
    - "simulation-agent"
    - "quality-agent"
```

#### Tier 6: Offer Engineering Agents

```yaml
# Tier 6 agents
- id: "offer-variant-generator"
  type: "OFFER_VARIANT"
  tier: 6
  capabilities:
    - "genetic-mutation"
    - "crossover-generation"
    - "diversity-enforcement"
    - "offer-genome-encoding"
  ruvector:
    components:
      - "nervous-system.hdc"
      - "mincut"
  connections:
    - "elasticity-model-agent"
    - "profit-aware-optimizer"
    - "creative-genome-agent"

- id: "elasticity-model-agent"
  type: "ELASTICITY_MODEL"
  tier: 6
  capabilities:
    - "price-elasticity-estimation"
    - "demand-curve-modeling"
    - "optimal-price-discovery"
    - "experiment-integration"
  ruvector:
    components:
      - "gnn"
      - "sona"
  connections:
    - "offer-variant-generator"
    - "profit-aware-optimizer"
    - "historical-memory-agent"

- id: "risk-reversal-agent"
  type: "RISK_REVERSAL"
  tier: 6
  capabilities:
    - "guarantee-optimization"
    - "refund-risk-calculation"
    - "trust-impact-modeling"
    - "conversion-lift-estimation"
  connections:
    - "offer-variant-generator"
    - "profit-aware-optimizer"
    - "conversion-probability-agent"

- id: "profit-aware-optimizer"
  type: "PROFIT_OPTIMIZER"
  tier: 6
  capabilities:
    - "profit-maximization"
    - "revenue-optimization"
    - "volume-optimization"
    - "pareto-frontier-calculation"
  ruvector:
    components:
      - "mincut"
      - "dag"
  connections:
    - "elasticity-model-agent"
    - "risk-reversal-agent"
    - "orchestrator"
```

#### Extended Operations Agents

```yaml
# Extended Tier 2 agents
- id: "budget-strategist-agent"
  type: "BUDGET_STRATEGIST"
  tier: 2
  capabilities:
    - "pre-launch-allocation"
    - "portfolio-optimization"
    - "risk-adjusted-budgeting"
    - "synergy-detection"
  ruvector:
    components:
      - "mincut"
      - "graph"
  connections:
    - "simulation-agent"
    - "risk-detection-agent"
    - "orchestrator"

- id: "exit-timing-agent"
  type: "EXIT_TIMING"
  tier: 2
  capabilities:
    - "inflation-detection"
    - "spend-pullback-signals"
    - "diminishing-returns-detection"
    - "reentry-opportunity-monitoring"
  connections:
    - "attention-arbitrage-agent"
    - "risk-detection-agent"
    - "account-health-agent"

# Extended Tier 3 agents
- id: "deployment-agent"
  type: "DEPLOYMENT"
  tier: 3
  capabilities:
    - "creative-rotation"
    - "pre-decline-deployment"
    - "a-b-test-management"
    - "winner-scaling"
  connections:
    - "fatigue-forecaster-agent"
    - "mutation-agent"
    - "cross-platform-agent"

# Extended Tier 7 agents
- id: "account-structure-optimizer"
  type: "ACCOUNT_STRUCTURE"
  tier: 7
  capabilities:
    - "campaign-structure-optimization"
    - "ad-set-consolidation"
    - "audience-overlap-resolution"
    - "budget-distribution-optimization"
  connections:
    - "account-health-agent"
    - "cross-platform-agent"
    - "orchestrator"

- id: "speed-execution-agent"
  type: "SPEED_EXECUTION"
  tier: 7
  capabilities:
    - "instant-deployment"
    - "rapid-budget-shifts"
    - "emergency-pause"
    - "opportunity-capture"
  ruvector:
    components:
      - "nervous-system.wta"
  connections:
    - "attention-arbitrage-agent"
    - "exit-timing-agent"
    - "account-health-agent"

- id: "platform-behavior-watcher"
  type: "PLATFORM_WATCHER"
  tier: 7
  capabilities:
    - "api-behavior-monitoring"
    - "learning-phase-detection"
    - "shadow-ban-detection"
    - "throttling-detection"
  connections:
    - "account-health-agent"
    - "risk-detection-agent"
    - "cross-platform-agent"
```

### Coordination Protocol

```typescript
// Agent coordination with NAO governance
import { WasmNAO, GlobalWorkspace } from '@ruvector/exotic-wasm';

export class SwarmCoordinator {
  private nao: WasmNAO;
  private workspace: GlobalWorkspace;

  constructor() {
    // 70% quorum for major decisions
    this.nao = new WasmNAO(0.7);
    // Miller's Law: 7 active items
    this.workspace = new GlobalWorkspace(7);
  }

  async registerAgents(agents: Agent[]): Promise<void> {
    // Tier-based stake allocation
    const tierStakes = {
      1: 100,  // Coordination: highest stake
      2: 80,   // Intelligence
      3: 60,   // Creative
      4: 50,   // Attribution
      5: 50,   // Persona
      6: 40,   // Offer
      7: 30    // Operations
    };

    for (const agent of agents) {
      this.nao.addMember(agent.id, tierStakes[agent.tier]);
    }
  }

  async proposeOptimization(
    optimization: OptimizationAction,
    proposingAgent: string
  ): Promise<ProposalResult> {
    // Broadcast to workspace for attention
    this.workspace.broadcast({
      content: optimization.embedding,
      salience: optimization.priority,
      source: proposingAgent,
      timestamp: Date.now()
    });

    // Only proceed if in active workspace (top 7 signals)
    const active = this.workspace.get_active_items();
    if (!active.some(i => i.source === proposingAgent)) {
      return { executed: false, reason: 'Not salient enough' };
    }

    // Create NAO proposal
    const proposalId = this.nao.propose(
      `${optimization.type}: ${optimization.description}`
    );

    // Collect votes from affected agents
    const voters = this.getAffectedAgents(optimization);
    for (const voter of voters) {
      const confidence = await voter.evaluate(optimization);
      this.nao.vote(proposalId, voter.id, confidence);
    }

    // Execute if quorum reached
    const executed = this.nao.execute(proposalId);

    return {
      proposalId,
      executed,
      stats: this.nao.getProposalStats(proposalId)
    };
  }
}
```

### Resource Requirements

| Tier | Agents | Memory | CPU | Ruvector Components |
|------|--------|--------|-----|---------------------|
| 1 | 3 | 2GB | 2 cores | core, graph |
| 2 | 6 | 4GB | 4 cores | mincut, attention |
| 3 | 4 | 3GB | 3 cores | gnn, attention |
| 4 | 3 | 2GB | 2 cores | graph |
| 5 | 4 | 4GB | 4 cores | nervous-system, gnn |
| 6 | 4 | 3GB | 3 cores | mincut, hdc |
| 7 | 5 | 3GB | 3 cores | wta, core |
| **Total** | **29** | **21GB** | **21 cores** | - |

*Note: Extension tiers (SEO, Conversational) add 8 more agents requiring additional ~6GB and 6 cores.*

## Consequences

### Positive
1. **Complete coverage** of all Build.docx requirements
2. **Specialized agents** for each marketing function
3. **Bio-inspired coordination** via NAO/Workspace
4. **Scalable architecture** - tiers can scale independently

### Negative
1. **Increased complexity** - 35 vs 15 agents
2. **Higher resource requirements** - 21GB+ memory
3. **More coordination overhead** - larger NAO quorum

### Mitigations
1. Lazy agent initialization
2. Tier-based scaling (scale only busy tiers)
3. Efficient Global Workspace filtering

## Related Documents
- [ADR-SW001: Original 15-Agent Swarm](./001-claude-flow-v3.md)
- [ADR-RV003: Bio-Inspired Systems](../ruvector-integration/003-bio-inspired-systems.md)
- [DDD: Dynamic Persona Domain](../../ddd/persona-psychology/001-domain-overview.md)
