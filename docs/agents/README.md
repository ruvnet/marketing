# Agent Reference

Complete documentation for all 15 agents in the AI Marketing Swarm.

---

## Agent Overview

| Tier | Agent | Primary Function | Key Capabilities |
|------|-------|------------------|------------------|
| 1 | [Orchestrator](#orchestrator) | Task Routing | Load balancing, health monitoring |
| 1 | [Memory](#memory) | Knowledge Management | Vector search, session context |
| 1 | [Quality](#quality) | Validation | Truth scoring, audit logging |
| 2 | [Simulation](#simulation) | Forecasting | Monte Carlo, scenario planning |
| 2 | [Historical Memory](#historical-memory) | Pattern Recognition | Trend analysis, benchmarking |
| 2 | [Risk Detection](#risk-detection) | Threat Detection | Fraud, spend traps, pacing |
| 2 | [Attention Arbitrage](#attention-arbitrage) | Value Discovery | CPM analysis, opportunities |
| 3 | [Creative Genome](#creative-genome) | Creative Analysis | DNA extraction, comparison |
| 3 | [Fatigue Forecaster](#fatigue-forecaster) | Decay Prediction | Lifespan, refresh timing |
| 3 | [Mutation](#mutation) | Creative Evolution | Variants, crossover |
| 4 | [Counterfactual](#counterfactual) | What-If Analysis | Impact estimation |
| 4 | [Causal Graph](#causal-graph) | Causal Discovery | Attribution paths |
| 4 | [Incrementality](#incrementality) | Lift Measurement | Statistical testing |
| 5 | [Account Health](#account-health) | Health Monitoring | Diagnosis, healing |
| 5 | [Cross-Platform](#cross-platform) | Multi-Platform Sync | Unified strategy |

---

## Tier 1: Coordination

### Orchestrator

**Purpose:** Routes tasks to the right specialist agents and ensures balanced workloads.

**Key Functions:**
- Task routing based on type and requirements
- Load balancing across agents
- Health monitoring
- Capability mapping

**Task Types:**
```typescript
'task_routing' | 'load_balancing' | 'health_check' | 'capability_query'
```

**Events Published:**
- `task.assigned` - When a task is assigned to an agent
- `task.completed` - When a task finishes
- `agent.health_updated` - Health status changes

**Example Usage:**
```typescript
const task = await swarm.submitTask('task_routing', {
  taskType: 'campaign_optimization',
  priority: 'high',
  requirements: ['simulation', 'historical-memory'],
});
```

---

### Memory

**Purpose:** Manages all knowledge storage and retrieval with semantic search capabilities.

**Key Functions:**
- Vector-based semantic search
- Session context management
- Memory consolidation
- Knowledge graph building

**Task Types:**
```typescript
'context_retrieval' | 'session_management' | 'memory_consolidation' | 'knowledge_search'
```

**Events Published:**
- `memory.updated` - New information stored
- `memory.retrieved` - Information retrieved
- `context.loaded` - Session context activated

**Example Usage:**
```typescript
// Search for relevant past campaigns
const task = await swarm.submitTask('context_retrieval', {
  query: 'high-performing summer campaigns',
  limit: 10,
  minSimilarity: 0.7,
}, { targetAgent: 'memory' });
```

---

### Quality

**Purpose:** Validates all agent outputs and ensures data integrity.

**Key Functions:**
- Input validation with Zod schemas
- Truth scoring for outputs
- Consistency checking
- Audit trail creation

**Task Types:**
```typescript
'validation' | 'truth_scoring' | 'consistency_check' | 'audit_creation' | 'gate_check'
```

**Events Published:**
- `quality.passed` - Validation succeeded
- `quality.failed` - Validation failed
- `audit.created` - Audit entry recorded

**Example Usage:**
```typescript
const task = await swarm.submitTask('validation', {
  schema: 'campaign',
  data: campaignData,
}, { targetAgent: 'quality' });
```

---

## Tier 2: Intelligence

### Simulation

**Purpose:** Runs probabilistic simulations to predict campaign outcomes.

**Key Functions:**
- Monte Carlo simulations
- Budget optimization
- Scenario planning
- Sensitivity analysis

**Task Types:**
```typescript
'forecasting' | 'scenario_planning' | 'budget_optimization' | 'sensitivity_analysis'
```

**Configuration:**
```typescript
{
  scenarios: 10000,        // Number of simulations
  confidenceLevel: 0.95,   // Confidence interval
  timeHorizon: 30,         // Days to forecast
}
```

**Example Usage:**
```typescript
const task = await swarm.submitTask('forecasting', {
  campaign,
  scenarios: 10000,
  metrics: ['conversions', 'revenue', 'roas'],
}, { targetAgent: 'simulation' });
```

---

### Historical Memory

**Purpose:** Finds patterns from past campaigns that apply to current situations.

**Key Functions:**
- Pattern matching
- Trend analysis
- Similar campaign discovery
- Performance benchmarking

**Task Types:**
```typescript
'pattern_retrieval' | 'trend_analysis' | 'similar_discovery' | 'benchmark_comparison'
```

**Example Usage:**
```typescript
const task = await swarm.submitTask('similar_discovery', {
  campaign,
  matchCriteria: ['platform', 'industry', 'objective'],
  limit: 5,
}, { targetAgent: 'historical-memory' });
```

---

### Risk Detection

**Purpose:** Identifies fraud, spend traps, and pacing issues before they cause damage.

**Key Functions:**
- Spend trap detection
- Fraud indicator analysis
- Pacing monitoring
- Quality score assessment

**Task Types:**
```typescript
'anomaly_detection' | 'fraud_detection' | 'pacing_analysis' | 'quality_assessment'
```

**Risk Levels:**
```typescript
'low' | 'medium' | 'high' | 'critical'
```

**Example Usage:**
```typescript
const task = await swarm.submitTask('anomaly_detection', {
  campaignId: 'camp-123',
  metrics: metricsData,
  sensitivity: 'high',
}, { targetAgent: 'risk-detection' });
```

---

### Attention Arbitrage

**Purpose:** Finds underpriced ad inventory opportunities across platforms.

**Key Functions:**
- CPM analysis
- Arbitrage opportunity detection
- Market data aggregation
- Value prediction

**Task Types:**
```typescript
'cpm_analysis' | 'opportunity_detection' | 'market_analysis' | 'value_prediction'
```

**Example Usage:**
```typescript
const task = await swarm.submitTask('opportunity_detection', {
  platforms: ['google-ads', 'meta', 'tiktok'],
  segments: ['25-34', 'fitness-enthusiasts'],
  threshold: 0.2, // 20% below market
}, { targetAgent: 'attention-arbitrage' });
```

---

## Tier 3: Creative

### Creative Genome

**Purpose:** Extracts the "DNA" of winning ads to understand what makes them work.

**Key Functions:**
- DNA extraction (hook, promise, proof, CTA)
- Genome comparison
- Winning element identification
- Performance correlation

**Creative DNA Structure:**
```typescript
interface CreativeDNA {
  hookGene: {
    type: 'question' | 'statistic' | 'story' | 'shock';
    strength: number;
  };
  promiseGene: {
    value: string;
    clarity: number;
  };
  proofGene: {
    type: 'social' | 'data' | 'testimonial' | 'demo';
    credibility: number;
  };
  ctaGene: {
    action: string;
    urgency: number;
  };
}
```

**Example Usage:**
```typescript
const task = await swarm.submitTask('creative_analysis', {
  creative,
}, { targetAgent: 'creative-genome' });
```

---

### Fatigue Forecaster

**Purpose:** Predicts when ads will stop performing so you can refresh before decline.

**Key Functions:**
- Decay curve modeling
- Lifespan estimation
- Fatigue signal detection
- Refresh timing optimization

**Fatigue Stages:**
```typescript
'fresh' | 'performing' | 'early-fatigue' | 'fatigued' | 'exhausted'
```

**Example Usage:**
```typescript
const task = await swarm.submitTask('fatigue_prediction', {
  creativeId: 'cr-456',
  metrics: last30DaysMetrics,
}, { targetAgent: 'fatigue-forecaster' });

// Returns: { predictedDaysRemaining: 12, currentStage: 'early-fatigue' }
```

---

### Mutation

**Purpose:** Creates new ad variants by combining successful elements from winners.

**Key Functions:**
- Genetic mutations
- Crossover breeding
- Variant generation
- Evolution tracking

**Mutation Types:**
```typescript
'headline' | 'image' | 'cta' | 'copy' | 'color' | 'layout'
```

**Example Usage:**
```typescript
const task = await swarm.submitTask('variant_generation', {
  parentCreatives: [creative1, creative2],
  mutationRate: 0.3,
  variants: 5,
}, { targetAgent: 'mutation' });
```

---

## Tier 4: Attribution

### Counterfactual

**Purpose:** Answers "what if" questions to estimate the impact of campaign changes.

**Key Functions:**
- What-if analysis
- Scenario comparison
- Impact estimation
- Opportunity cost calculation

**Example Usage:**
```typescript
const task = await swarm.submitTask('what_if_analysis', {
  campaignId: 'camp-123',
  scenarios: [
    { change: 'budget', from: 1000, to: 1500 },
    { change: 'bidStrategy', from: 'manual', to: 'tCPA' },
  ],
}, { targetAgent: 'counterfactual' });
```

---

### Causal Graph

**Purpose:** Maps true cause-and-effect relationships for accurate attribution.

**Key Functions:**
- Graph construction
- Path finding
- Confounder detection
- Causal effect estimation

**Example Usage:**
```typescript
const task = await swarm.submitTask('causal_analysis', {
  touchpoints: conversionPath,
  outcome: 'purchase',
}, { targetAgent: 'causal-graph' });

// Returns: { causalPaths: [...], confounders: [...], effects: {...} }
```

---

### Incrementality

**Purpose:** Measures the true lift from campaigns - what happened that wouldn't have anyway.

**Key Functions:**
- Lift analysis
- Test design
- Significance validation
- Holdout management

**Example Usage:**
```typescript
const task = await swarm.submitTask('lift_analysis', {
  campaignId: 'camp-123',
  testGroup: { users: 10000, conversions: 250 },
  controlGroup: { users: 5000, conversions: 100 },
}, { targetAgent: 'incrementality' });

// Returns: { incrementalLift: 0.25, pValue: 0.02, confidence: 0.98 }
```

---

## Tier 5: Operations

### Account Health

**Purpose:** Monitors overall campaign health and suggests fixes for issues.

**Key Functions:**
- Health scoring
- Issue diagnosis
- Healing actions
- Prevention planning

**Health Dimensions:**
```typescript
{
  performance: number;  // ROAS, CTR, CVR
  efficiency: number;   // Budget utilization
  compliance: number;   // Policy adherence
  stability: number;    // Metric volatility
}
```

**Example Usage:**
```typescript
const task = await swarm.submitTask('health_diagnosis', {
  accountId: 'acc-123',
}, { targetAgent: 'account-health' });

// Returns: { overallScore: 78, issues: [...], recommendations: [...] }
```

---

### Cross-Platform

**Purpose:** Synchronizes campaigns and strategies across all advertising platforms.

**Key Functions:**
- Multi-platform analysis
- Strategy synchronization
- Budget allocation
- Unified reporting

**Supported Platforms:**
```typescript
'google-ads' | 'meta' | 'tiktok' | 'linkedin' | 'twitter' | 'pinterest' | 'snapchat'
```

**Example Usage:**
```typescript
const task = await swarm.submitTask('cross_platform_sync', {
  strategy: 'maximize_reach',
  totalBudget: 50000,
  platforms: ['google-ads', 'meta', 'tiktok'],
}, { targetAgent: 'cross-platform' });

// Returns: { allocation: { 'google-ads': 20000, 'meta': 20000, 'tiktok': 10000 } }
```

---

## Agent Communication

Agents communicate through the event bus:

```
Orchestrator ──▶ assigns tasks ──▶ Specialist Agents
                                         │
Specialist Agents ──▶ publish results ──▶ Event Bus
                                         │
Memory Agent ◀── stores learnings ◀──────┘
                                         │
Quality Agent ◀── validates ◀────────────┘
```

---

## See Also

- [API Reference](../api/README.md) - Detailed method documentation
- [Tutorials](../tutorials/README.md) - Hands-on examples
- [Architecture](../architecture/README.md) - System design deep-dive
