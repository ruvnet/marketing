# ADR-SW001: Claude-Flow V3 15-Agent Swarm Configuration

## Status
**Proposed** | Date: 2026-01-13

## Context

The AI Marketing Swarms platform requires sophisticated multi-agent coordination to handle:

1. **Parallel optimization** across multiple campaigns
2. **Specialized expertise** for different marketing functions
3. **Cross-agent learning** and pattern sharing
4. **Fault tolerance** and graceful degradation
5. **Real-time adaptation** to market conditions

Claude-Flow v3 provides:
- 15-agent hierarchical mesh coordination
- AgentDB with HNSW indexing (150x-12,500x faster)
- Flash Attention (2.49x-7.47x speedup)
- Event-sourced state management
- Domain-Driven Design architecture

## Decision

We will implement a **15-agent hierarchical mesh swarm** organized into 5 tiers:

### Swarm Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    15-AGENT MARKETING SWARM ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       TIER 1: COORDINATION (3)                       │   │
│  │                                                                      │   │
│  │       ┌─────────────────────────────────────────────────────┐       │   │
│  │       │              ORCHESTRATOR AGENT                      │       │   │
│  │       │                                                      │       │   │
│  │       │  • Master coordinator for all swarm operations       │       │   │
│  │       │  • Task distribution and load balancing              │       │   │
│  │       │  • Global optimization strategy                      │       │   │
│  │       │  • Inter-tier communication hub                      │       │   │
│  │       └──────────────────────┬───────────────────────────────┘       │   │
│  │                              │                                       │   │
│  │              ┌───────────────┴───────────────┐                       │   │
│  │              │                               │                       │   │
│  │       ┌──────┴──────┐               ┌───────┴─────┐                 │   │
│  │       │   MEMORY    │               │   QUALITY   │                 │   │
│  │       │   AGENT     │               │   AGENT     │                 │   │
│  │       │             │               │             │                 │   │
│  │       │• Cross-     │               │• Output     │                 │   │
│  │       │  session    │               │  validation │                 │   │
│  │       │  state      │               │• Truth-     │                 │   │
│  │       │• Pattern    │               │  scoring    │                 │   │
│  │       │  retrieval  │               │• Rollback   │                 │   │
│  │       │• Ruvector   │               │  decisions  │                 │   │
│  │       │  integration│               │             │                 │   │
│  │       └─────────────┘               └─────────────┘                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      TIER 2: INTELLIGENCE (4)                        │   │
│  │                                                                      │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │ SIMULATION  │ │ HISTORICAL  │ │    RISK     │ │  ATTENTION  │   │   │
│  │  │   AGENT     │ │   MEMORY    │ │  DETECTION  │ │  ARBITRAGE  │   │   │
│  │  │             │ │   AGENT     │ │   AGENT     │ │   AGENT     │   │   │
│  │  │• Monte Carlo│ │• Pattern    │ │• Spend trap │ │• Underpriced│   │   │
│  │  │  prediction │ │  retrieval  │ │  detection  │ │  discovery  │   │   │
│  │  │• Scenario   │ │• Analog     │ │• CPM spike  │ │• CPM anomaly│   │   │
│  │  │  simulation │ │  campaigns  │ │  alerts     │ │  detection  │   │   │
│  │  │• Outcome    │ │• Success    │ │• Platform   │ │• Trend      │   │   │
│  │  │  forecasting│ │  patterns   │ │  behavior   │ │  surfing    │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       TIER 3: CREATIVE (3)                           │   │
│  │                                                                      │   │
│  │  ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐ │   │
│  │  │  CREATIVE GENOME  │ │ FATIGUE FORECASTER│ │   MUTATION AGENT  │ │   │
│  │  │      AGENT        │ │      AGENT        │ │                   │ │   │
│  │  │                   │ │                   │ │• Evolutionary     │ │   │
│  │  │• DNA decomposition│ │• Decay curve      │ │  variants         │ │   │
│  │  │  (hook/promise/   │ │  prediction       │ │• Hook mutations   │ │   │
│  │  │   frame)          │ │• Days remaining   │ │• Promise variants │ │   │
│  │  │• Semantic analysis│ │  estimation       │ │• Frame evolution  │ │   │
│  │  │• Emotional mapping│ │• Fatigue signals  │ │• A/B generation   │ │   │
│  │  └───────────────────┘ └───────────────────┘ └───────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      TIER 4: ATTRIBUTION (3)                         │   │
│  │                                                                      │   │
│  │  ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐ │   │
│  │  │  COUNTERFACTUAL   │ │  CAUSAL GRAPH     │ │  INCREMENTALITY   │ │   │
│  │  │      AGENT        │ │   BUILDER AGENT   │ │   AUDITOR AGENT   │ │   │
│  │  │                   │ │                   │ │                   │ │   │
│  │  │• What-if analysis │ │• Influence path   │ │• True lift        │ │   │
│  │  │• Alternative      │ │  mapping          │ │  measurement      │ │   │
│  │  │  scenario         │ │• Touchpoint       │ │• Holdout analysis │ │   │
│  │  │  modeling         │ │  weighting        │ │• Statistical      │ │   │
│  │  │• Opportunity cost │ │• Cross-channel    │ │  significance     │ │   │
│  │  │  calculation      │ │  attribution      │ │  validation       │ │   │
│  │  └───────────────────┘ └───────────────────┘ └───────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      TIER 5: OPERATIONS (2)                          │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────┐ ┌─────────────────────────────────┐│   │
│  │  │     ACCOUNT HEALTH AGENT    │ │    CROSS-PLATFORM AGENT         ││   │
│  │  │                             │ │                                  ││   │
│  │  │• Self-healing operations    │ │• Meta ↔ Google intelligence     ││   │
│  │  │• CPM spike mitigation       │ │• TikTok ↔ Meta transfer         ││   │
│  │  │• Learning phase protection  │ │• Cross-platform patterns        ││   │
│  │  │• Shadow ban detection       │ │• Unified performance brain      ││   │
│  │  │• Recovery execution         │ │• Creative translation           ││   │
│  │  └─────────────────────────────┘ └─────────────────────────────────┘│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Agent Configuration

```yaml
# .claude/swarm-config.yaml
swarm:
  name: "AI Marketing Swarms"
  version: "v3"
  topology: "hierarchical-mesh"
  maxAgents: 15

agents:
  # Tier 1: Coordination
  - id: "orchestrator"
    type: "ORCHESTRATOR"
    tier: 1
    capabilities:
      - "task-distribution"
      - "load-balancing"
      - "global-optimization"
      - "inter-tier-communication"
    memory:
      backend: "ruvector"
      collection: "orchestrator-state"
    connections:
      - "memory-agent"
      - "quality-agent"
      - "simulation-agent"
      - "historical-memory-agent"
      - "risk-detection-agent"
      - "attention-arbitrage-agent"

  - id: "memory-agent"
    type: "MEMORY"
    tier: 1
    capabilities:
      - "cross-session-state"
      - "pattern-retrieval"
      - "ruvector-integration"
      - "embedding-storage"
    memory:
      backend: "ruvector"
      collection: "global-memory"
      indexType: "hnsw"
      dimensions: 384
    connections:
      - "orchestrator"
      - "historical-memory-agent"
      - "quality-agent"

  - id: "quality-agent"
    type: "QUALITY"
    tier: 1
    capabilities:
      - "output-validation"
      - "truth-scoring"
      - "rollback-decisions"
      - "accuracy-monitoring"
    thresholds:
      truthScore: 0.95
      rollbackThreshold: 0.7
    connections:
      - "orchestrator"
      - "memory-agent"

  # Tier 2: Intelligence
  - id: "simulation-agent"
    type: "SIMULATION"
    tier: 2
    capabilities:
      - "monte-carlo-prediction"
      - "scenario-simulation"
      - "outcome-forecasting"
      - "risk-modeling"
    config:
      simulationRuns: 10000
      confidenceLevel: 0.95
    connections:
      - "orchestrator"
      - "historical-memory-agent"
      - "risk-detection-agent"

  - id: "historical-memory-agent"
    type: "HISTORICAL_MEMORY"
    tier: 2
    capabilities:
      - "pattern-retrieval"
      - "analog-campaigns"
      - "success-patterns"
      - "failure-analysis"
    memory:
      backend: "ruvector"
      collection: "campaign-history"
      ttlDays: 365
    connections:
      - "orchestrator"
      - "memory-agent"
      - "simulation-agent"

  - id: "risk-detection-agent"
    type: "RISK_DETECTION"
    tier: 2
    capabilities:
      - "spend-trap-detection"
      - "cpm-spike-alerts"
      - "platform-behavior-analysis"
      - "anomaly-detection"
    alerts:
      cpmSpikeThreshold: 0.3
      spendTrapThreshold: 0.5
    connections:
      - "orchestrator"
      - "simulation-agent"
      - "account-health-agent"

  - id: "attention-arbitrage-agent"
    type: "ATTENTION_ARBITRAGE"
    tier: 2
    capabilities:
      - "underpriced-discovery"
      - "cpm-anomaly-detection"
      - "trend-surfing"
      - "placement-optimization"
    config:
      minArbitrageOpportunity: 0.15
      maxPositionSize: 0.1
    connections:
      - "orchestrator"
      - "risk-detection-agent"
      - "cross-platform-agent"

  # Tier 3: Creative
  - id: "creative-genome-agent"
    type: "CREATIVE_GENOME"
    tier: 3
    capabilities:
      - "dna-decomposition"
      - "semantic-analysis"
      - "emotional-mapping"
      - "hook-extraction"
    attention:
      mechanism: "multi-head"
      heads: 4
      dimension: 256
    connections:
      - "fatigue-forecaster-agent"
      - "mutation-agent"
      - "memory-agent"

  - id: "fatigue-forecaster-agent"
    type: "FATIGUE_FORECASTER"
    tier: 3
    capabilities:
      - "decay-curve-prediction"
      - "days-remaining-estimation"
      - "fatigue-signals"
      - "preemptive-alerts"
    model:
      type: "gnn"
      backend: "ruvector-gnn"
    connections:
      - "creative-genome-agent"
      - "mutation-agent"
      - "account-health-agent"

  - id: "mutation-agent"
    type: "MUTATION"
    tier: 3
    capabilities:
      - "evolutionary-variants"
      - "hook-mutations"
      - "promise-variants"
      - "frame-evolution"
    config:
      mutationRate: 0.2
      preserveTopK: 3
    connections:
      - "creative-genome-agent"
      - "fatigue-forecaster-agent"
      - "quality-agent"

  # Tier 4: Attribution
  - id: "counterfactual-agent"
    type: "COUNTERFACTUAL"
    tier: 4
    capabilities:
      - "what-if-analysis"
      - "alternative-scenarios"
      - "opportunity-cost"
      - "causal-inference"
    connections:
      - "causal-graph-agent"
      - "incrementality-agent"
      - "simulation-agent"

  - id: "causal-graph-agent"
    type: "CAUSAL_GRAPH"
    tier: 4
    capabilities:
      - "influence-path-mapping"
      - "touchpoint-weighting"
      - "cross-channel-attribution"
      - "shapley-values"
    graph:
      backend: "ruvector-graph"
      queryLanguage: "cypher"
    connections:
      - "counterfactual-agent"
      - "incrementality-agent"
      - "memory-agent"

  - id: "incrementality-agent"
    type: "INCREMENTALITY"
    tier: 4
    capabilities:
      - "true-lift-measurement"
      - "holdout-analysis"
      - "statistical-validation"
      - "significance-testing"
    config:
      minSampleSize: 1000
      significanceLevel: 0.05
    connections:
      - "counterfactual-agent"
      - "causal-graph-agent"
      - "quality-agent"

  # Tier 5: Operations
  - id: "account-health-agent"
    type: "ACCOUNT_HEALTH"
    tier: 5
    capabilities:
      - "self-healing-operations"
      - "cpm-mitigation"
      - "learning-protection"
      - "shadow-ban-detection"
    monitoring:
      interval: "5m"
      healthCheckEndpoint: "/health"
    connections:
      - "risk-detection-agent"
      - "fatigue-forecaster-agent"
      - "orchestrator"

  - id: "cross-platform-agent"
    type: "CROSS_PLATFORM"
    tier: 5
    capabilities:
      - "platform-intelligence-transfer"
      - "cross-platform-patterns"
      - "unified-performance"
      - "creative-translation"
    platforms:
      - google
      - meta
      - tiktok
      - linkedin
    connections:
      - "attention-arbitrage-agent"
      - "creative-genome-agent"
      - "memory-agent"

coordination:
  protocol: "event-sourced"
  messageQueue: "pubsub"
  consensusRequired: false
  quorum: 0.6

hooks:
  preTask:
    - "npx ruvector hooks pre-task"
  postTask:
    - "npx ruvector hooks post-task --emit-event"
  preEdit:
    - "npx ruvector hooks pre-edit"
  postEdit:
    - "npx ruvector hooks post-edit --success"

learning:
  enabled: true
  backend: "sona"
  adaptationRate: 0.1
  trajectoryTracking: true
```

### Initialization Commands

```bash
# Initialize the 15-agent swarm
npx claude-flow@v3alpha swarm init \
  --v3-mode \
  --config .claude/swarm-config.yaml \
  --topology hierarchical-mesh

# Start swarm with marketing objective
npx claude-flow@v3alpha swarm start \
  --objective "AI Marketing Optimization" \
  --strategy production

# Monitor swarm status
npx claude-flow@v3alpha swarm status --dashboard

# Scale specific tier
npx claude-flow@v3alpha swarm scale --tier 2 --replicas 2
```

### Agent Communication Protocol

```typescript
// Agent message format
interface AgentMessage {
  id: string;
  from: AgentId;
  to: AgentId | 'broadcast';
  type: MessageType;
  payload: unknown;
  timestamp: number;
  correlationId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

type MessageType =
  | 'TASK_ASSIGNMENT'
  | 'TASK_RESULT'
  | 'PATTERN_SHARE'
  | 'MEMORY_UPDATE'
  | 'ALERT'
  | 'HEALTH_CHECK'
  | 'COORDINATION_REQUEST'
  | 'LEARNING_SIGNAL';
```

## Consequences

### Positive
1. **Specialized expertise** - Each agent focuses on specific domain
2. **Parallel processing** - Multiple campaigns optimized simultaneously
3. **Fault tolerance** - Individual agent failures don't crash system
4. **Self-learning** - SONA integration enables continuous improvement
5. **Scalable** - Add replicas for high-demand tiers

### Negative
1. **Coordination overhead** - 15 agents require careful orchestration
2. **Complexity** - Debugging multi-agent systems is challenging
3. **Resource usage** - Each agent consumes memory and compute

### Mitigations
1. Hierarchical structure reduces coordination complexity
2. Comprehensive logging and distributed tracing
3. Lazy agent initialization and resource pooling

## Related Documents
- [ADR-SW002: Agent Types](./002-agent-types.md)
- [ADR-SW003: Coordination Patterns](./003-coordination-patterns.md)
- [DDD: Agent Swarm Domain](../../ddd/agent-swarm/001-domain-overview.md)
