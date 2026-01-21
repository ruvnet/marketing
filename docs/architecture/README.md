# Architecture Overview

Deep dive into the AI Marketing Swarms system architecture.

---

## Design Philosophy

AI Marketing Swarms is built on three core principles:

1. **Specialization** - Each agent is an expert in one domain
2. **Coordination** - Agents work together through events, not direct calls
3. **Resilience** - System continues operating even when individual agents fail

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL SYSTEMS                              │
│   Google Ads API    Meta API    TikTok API    LinkedIn API    ...      │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        INTEGRATION LAYER                                │
│                                                                         │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│   │  BigQuery    │  │   Pub/Sub    │  │   Storage    │  │ Vertex AI │  │
│   │   Client     │  │   Client     │  │   Client     │  │  Client   │  │
│   └──────────────┘  └──────────────┘  └──────────────┘  └──────────┘  │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        SWARM COORDINATOR                                │
│                                                                         │
│   • Agent lifecycle management                                          │
│   • Task submission and routing                                         │
│   • Health monitoring and auto-recovery                                 │
│   • Metrics collection                                                  │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│   EVENT BUS   │◀────────▶│ STATE MANAGER │◀────────▶│    LOGGER     │
│               │          │               │          │               │
│ • Pub/Sub     │          │ • Campaigns   │          │ • Structured  │
│ • Wildcards   │          │ • Creatives   │          │ • Correlation │
│ • History     │          │ • Tasks       │          │ • Performance │
│ • Replay      │          │ • Agents      │          │               │
└───────────────┘          └───────────────┘          └───────────────┘
        │                           │
        └───────────────┬───────────┘
                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          AGENT LAYER                                    │
│                                                                         │
│  TIER 1: COORDINATION        TIER 2: INTELLIGENCE                      │
│  ┌─────────────────────┐    ┌─────────────────────────────────────┐   │
│  │ Orchestrator        │    │ Simulation   Historical   Risk      │   │
│  │ Memory              │    │              Memory       Detection │   │
│  │ Quality             │    │ Attention Arbitrage                 │   │
│  └─────────────────────┘    └─────────────────────────────────────┘   │
│                                                                         │
│  TIER 3: CREATIVE            TIER 4: ATTRIBUTION                       │
│  ┌─────────────────────┐    ┌─────────────────────────────────────┐   │
│  │ Creative Genome     │    │ Counterfactual   Causal Graph       │   │
│  │ Fatigue Forecaster  │    │ Incrementality Auditor              │   │
│  │ Mutation            │    │                                     │   │
│  └─────────────────────┘    └─────────────────────────────────────┘   │
│                                                                         │
│  TIER 5: OPERATIONS                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Account Health                Cross-Platform                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### Event Bus

The event bus is the nervous system of the swarm. All agent communication happens through events.

**Design Decisions:**
- **Pub/Sub Pattern** - Loose coupling between agents
- **Wildcard Subscriptions** - `campaign.*` catches all campaign events
- **Event Sourcing** - Full history for replay and debugging
- **Async Processing** - Non-blocking event delivery

**Event Flow:**
```
Agent A                  Event Bus                  Agent B
   │                         │                         │
   │── publish(event) ──────▶│                         │
   │                         │── notify subscribers ──▶│
   │                         │                         │── handleEvent()
   │                         │◀── publish(response) ───│
   │◀── notify ──────────────│                         │
```

### State Manager

Centralized, reactive state management for shared data.

**State Categories:**
- **Campaigns** - Active campaign configurations
- **Creatives** - Ad creative data and DNA
- **Tasks** - Task queue and status
- **Agents** - Agent registration and metrics

**Features:**
- Reactive subscriptions (get notified when state changes)
- Snapshot creation for recovery
- Consistent view across all agents

### Agent Base Class

All 15 agents extend `BaseAgent` which provides:

```typescript
abstract class BaseAgent {
  // Lifecycle
  async initialize(): Promise<void>;
  async shutdown(): Promise<void>;

  // Task processing
  submitTask(task: Task): void;
  protected abstract process(task: Task): Promise<void>;

  // Event handling
  protected abstract getSubscribedEvents(): string[];
  protected abstract handleEvent(event: DomainEvent): Promise<void>;

  // Health
  async healthCheck(): Promise<HealthResult>;
}
```

---

## Data Flow

### Campaign Optimization Flow

```
1. User submits campaign
        │
        ▼
2. SwarmCoordinator.submitCampaign()
        │
        ▼
3. Orchestrator routes to specialists
        │
        ├──▶ Simulation (forecasting)
        ├──▶ Historical Memory (patterns)
        ├──▶ Risk Detection (threats)
        └──▶ Quality (validation)
        │
        ▼
4. Results aggregated
        │
        ▼
5. Recommendations returned
```

### Creative Analysis Flow

```
1. Creative submitted
        │
        ▼
2. Creative Genome extracts DNA
        │
        ├──▶ Hook analysis
        ├──▶ Promise extraction
        ├──▶ Proof identification
        └──▶ CTA scoring
        │
        ▼
3. Fatigue Forecaster predicts lifespan
        │
        ▼
4. Mutation generates variants (if requested)
        │
        ▼
5. Results stored in Memory
```

---

## Hierarchical Topology

The swarm uses a hierarchical mesh topology:

```
                    ┌─────────────────┐
                    │   Orchestrator  │ ◀── Tier 1 (Coordinator)
                    │    (Queen)      │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
   ┌──────────┐        ┌──────────┐        ┌──────────┐
   │ Memory   │        │ Quality  │        │  Tier 2  │
   │ (Worker) │        │ (Worker) │        │ Workers  │
   └──────────┘        └──────────┘        └──────────┘
                                                 │
                    ┌────────────────────────────┼────────┐
                    ▼                            ▼        ▼
              ┌──────────┐                ┌──────────┐
              │  Tier 3  │                │ Tier 4-5 │
              │ Workers  │                │ Workers  │
              └──────────┘                └──────────┘
```

**Benefits:**
- Clear chain of command
- Reduced message complexity
- Easy to reason about
- Fault isolation

---

## Error Handling & Recovery

### Agent-Level Recovery

```typescript
try {
  await this.process(task);
} catch (error) {
  this.errorCount++;
  this.logger.error('Task failed', error);

  // Notify for potential recovery
  this.eventBus.publish({
    type: 'agent.error',
    payload: { agentId: this.id, error },
  });
}
```

### Swarm-Level Recovery

When `autoRecovery: true`:

1. Health check detects failing agent
2. SwarmCoordinator attempts restart
3. If restart fails, swarm enters "degraded" mode
4. Other agents continue operating

```typescript
// Auto-recovery flow
if (agent.healthCheck().healthy === false) {
  await agent.shutdown();
  await agent.initialize();  // Restart
}
```

---

## Performance Optimizations

### Caching Layer

- **LRU Cache** with configurable TTL
- **Tiered Caching** (L1: memory, L2: Redis)
- **Cache-aside Pattern** for database queries

### Connection Pooling

- **Pool Size** based on workload
- **Health Checks** on connections
- **Auto-scaling** based on demand

### Batch Processing

- **Auto-batching** of small operations
- **Parallel execution** with concurrency limits
- **Debounced processing** for high-frequency events

---

## Security Architecture

### Defense in Depth

```
┌─────────────────────────────────────────────────┐
│            Input Validation (Zod)               │  Layer 1
└─────────────────────────────────────────────────┘
                       │
┌─────────────────────────────────────────────────┐
│            Rate Limiting                        │  Layer 2
└─────────────────────────────────────────────────┘
                       │
┌─────────────────────────────────────────────────┐
│            Secrets Management                   │  Layer 3
└─────────────────────────────────────────────────┘
                       │
┌─────────────────────────────────────────────────┐
│            Audit Logging                        │  Layer 4
└─────────────────────────────────────────────────┘
```

### Key Security Features

- **Input Validation** - All inputs validated with Zod schemas
- **Secrets Management** - GCP Secret Manager integration
- **Audit Logging** - All actions logged for compliance
- **Rate Limiting** - Protects against abuse

---

## Deployment Architecture (GCP)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Cloud Load Balancer                      │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────┼─────────────────────────────────┐
│                          Cloud Run                              │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                  AI Marketing Swarms                     │  │
│   │               (15 agents, auto-scaling)                  │  │
│   └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│   BigQuery    │      │  Cloud Pub/Sub │      │Cloud Storage  │
│  (Analytics)  │      │   (Events)     │      │  (Assets)     │
└───────────────┘      └───────────────┘      └───────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                ▼
                      ┌───────────────┐
                      │  Vertex AI    │
                      │ (Embeddings)  │
                      └───────────────┘
```

---

## See Also

- [API Reference](../api/README.md) - Detailed method documentation
- [Agent Reference](../agents/README.md) - Agent capabilities
- [Security](../../SECURITY.md) - Security best practices
- [ADRs](../../plans/adr/) - Architecture Decision Records
