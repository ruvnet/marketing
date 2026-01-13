# ADR-003: Event-Driven Architecture Design

## Status
**Proposed** | Date: 2026-01-13

## Context

Marketing optimization requires responding to real-time events from multiple sources:

1. **Platform Events** - Impressions, clicks, conversions from ad platforms
2. **Budget Events** - Spend thresholds, pacing alerts
3. **Creative Events** - Performance changes, fatigue signals
4. **Learning Events** - GNN updates, pattern discoveries

We need an architecture that:
- Handles high-volume event streams (millions/day)
- Enables loose coupling between components
- Supports event replay for backtesting
- Integrates with Google Cloud services

## Decision

We will implement an **event-sourced architecture** using:

1. **Google Cloud Pub/Sub** for event streaming
2. **Firestore** for event store and projections
3. **Cloud Functions** for event handlers
4. **Claude-Flow v3 hooks** for agent coordination

### Event Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EVENT-DRIVEN ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      EVENT SOURCES                                   │   │
│  │                                                                      │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │   │
│  │  │ Google  │ │  Meta   │ │ TikTok  │ │Analytics│ │ Agent   │       │   │
│  │  │  Ads    │ │  Ads    │ │  Ads    │ │  Events │ │ Actions │       │   │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘       │   │
│  └───────┼───────────┼───────────┼───────────┼───────────┼─────────────┘   │
│          │           │           │           │           │                  │
│          └───────────┴───────────┴───────────┴───────────┘                  │
│                                  │                                          │
│                                  ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    GOOGLE CLOUD PUB/SUB                             │   │
│  │                                                                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │   │
│  │  │ campaigns   │  │  creatives  │  │ attribution │                 │   │
│  │  │   topic     │  │   topic     │  │    topic    │                 │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                 │   │
│  └─────────┼────────────────┼────────────────┼─────────────────────────┘   │
│            │                │                │                              │
│            ▼                ▼                ▼                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    CLOUD FUNCTIONS (Event Handlers)                 │   │
│  │                                                                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │   │
│  │  │ campaign-   │  │  creative-  │  │ attribution-│                 │   │
│  │  │  processor  │  │  analyzer   │  │   builder   │                 │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                 │   │
│  └─────────┼────────────────┼────────────────┼─────────────────────────┘   │
│            │                │                │                              │
│            └────────────────┼────────────────┘                              │
│                             │                                               │
│                             ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         FIRESTORE                                    │   │
│  │                                                                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │   │
│  │  │  events/    │  │projections/ │  │  snapshots/ │                 │   │
│  │  │ (immutable) │  │   (state)   │  │  (indexes)  │                 │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Event Types

#### Campaign Domain Events
```typescript
// events/campaign.ts
export interface CampaignCreatedEvent {
  type: 'CAMPAIGN_CREATED';
  campaignId: string;
  accountId: string;
  platform: 'google' | 'meta' | 'tiktok' | 'linkedin';
  budget: BudgetConfig;
  targeting: TargetingConfig;
  timestamp: number;
  correlationId: string;
}

export interface CampaignPerformanceEvent {
  type: 'CAMPAIGN_PERFORMANCE';
  campaignId: string;
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    cpm: number;
    ctr: number;
    cpa: number;
  };
  window: 'hourly' | 'daily';
  timestamp: number;
}

export interface CampaignOptimizedEvent {
  type: 'CAMPAIGN_OPTIMIZED';
  campaignId: string;
  action: OptimizationAction;
  reasoning: string;
  predictedImpact: number;
  agentId: string;
  timestamp: number;
}
```

#### Creative Domain Events
```typescript
// events/creative.ts
export interface CreativeAnalyzedEvent {
  type: 'CREATIVE_ANALYZED';
  creativeId: string;
  genome: CreativeGenome;
  embedding: Float32Array;
  attentionScores: AttentionScores;
  timestamp: number;
}

export interface CreativeFatigueDetectedEvent {
  type: 'CREATIVE_FATIGUE_DETECTED';
  creativeId: string;
  fatigueScore: number;
  decayCurve: number[];
  predictedDaysRemaining: number;
  timestamp: number;
}

export interface CreativeMutatedEvent {
  type: 'CREATIVE_MUTATED';
  parentId: string;
  childId: string;
  mutationType: 'hook' | 'promise' | 'frame' | 'cta';
  mutationVector: Float32Array;
  timestamp: number;
}
```

#### Attribution Domain Events
```typescript
// events/attribution.ts
export interface TouchpointRecordedEvent {
  type: 'TOUCHPOINT_RECORDED';
  userId: string;
  touchpoint: {
    channel: string;
    campaign: string;
    creative: string;
    timestamp: number;
  };
  sessionId: string;
}

export interface ConversionAttributedEvent {
  type: 'CONVERSION_ATTRIBUTED';
  conversionId: string;
  userId: string;
  attributionModel: 'causal' | 'shapley' | 'last_click';
  creditDistribution: Record<string, number>;
  counterfactualLift: number;
  timestamp: number;
}
```

### Event Handler Implementation

```typescript
// functions/campaign-processor/src/index.ts
import { CloudEvent } from '@google-cloud/functions-framework';
import { getFirestore } from 'firebase-admin/firestore';
import init, { CampaignAnalyzer } from 'marketing-wasm';

const db = getFirestore();
let analyzer: CampaignAnalyzer | null = null;

export async function handleCampaignEvent(event: CloudEvent<CampaignPerformanceEvent>) {
  // Initialize WASM
  if (!analyzer) {
    await init();
    analyzer = new CampaignAnalyzer();
  }

  const campaignEvent = event.data;

  // Store event immutably
  await db.collection('events').add({
    ...campaignEvent,
    processedAt: Date.now()
  });

  // Analyze with ruvector
  const analysis = analyzer.analyzePerformance(campaignEvent);

  // Update projection
  await db.collection('projections/campaigns')
    .doc(campaignEvent.campaignId)
    .update({
      lastMetrics: campaignEvent.metrics,
      analysis: analysis,
      updatedAt: Date.now()
    });

  // Emit derived events if needed
  if (analysis.requiresOptimization) {
    await publishEvent('campaigns', {
      type: 'OPTIMIZATION_REQUIRED',
      campaignId: campaignEvent.campaignId,
      reason: analysis.reason,
      priority: analysis.priority
    });
  }
}
```

### Claude-Flow v3 Hook Integration

```yaml
# .claude/hooks.yaml
hooks:
  PreToolUse:
    - matcher: "Edit|Write"
      command: "npx ruvector hooks pre-edit \"$TOOL_INPUT_file_path\""
    - matcher: "Bash"
      command: "npx ruvector hooks pre-command \"$TOOL_INPUT_command\""

  PostToolUse:
    - matcher: "Edit|Write"
      command: "npx ruvector hooks post-edit \"$TOOL_INPUT_file_path\" --emit-event"
    - matcher: "Bash"
      command: "npx ruvector hooks post-command \"$TOOL_INPUT_command\" --emit-event"

  # Custom marketing hooks
  CampaignOptimized:
    - command: "npx claude-flow hooks campaign-optimized"

  CreativeMutated:
    - command: "npx claude-flow hooks creative-mutated"
```

### Event Replay for Backtesting

```typescript
// services/backtest/src/replay.ts
import { getFirestore } from 'firebase-admin/firestore';

export class EventReplayer {
  async replayPeriod(
    startTime: number,
    endTime: number,
    eventTypes: string[]
  ): Promise<void> {
    const db = getFirestore();

    const events = await db.collection('events')
      .where('timestamp', '>=', startTime)
      .where('timestamp', '<=', endTime)
      .where('type', 'in', eventTypes)
      .orderBy('timestamp')
      .get();

    for (const doc of events.docs) {
      await this.processEvent(doc.data());
    }
  }

  async simulateWithAlternative(
    startTime: number,
    endTime: number,
    alternativeStrategy: Strategy
  ): Promise<SimulationResult> {
    // Replay events but apply alternative optimization logic
    // Compare outcomes for strategy evaluation
  }
}
```

### Pub/Sub Topic Configuration

```yaml
# pubsub-config.yaml
topics:
  - name: campaigns
    labels:
      domain: campaign
    subscriptions:
      - name: campaign-processor
        pushEndpoint: https://campaign-processor-xxxxx.run.app
        ackDeadlineSeconds: 60
        retryPolicy:
          minimumBackoff: 10s
          maximumBackoff: 600s

      - name: campaign-analytics
        pushEndpoint: https://campaign-analytics-xxxxx.run.app
        filter: 'attributes.type = "CAMPAIGN_PERFORMANCE"'

  - name: creatives
    labels:
      domain: creative
    subscriptions:
      - name: creative-analyzer
        pushEndpoint: https://creative-analyzer-xxxxx.run.app

      - name: fatigue-detector
        pushEndpoint: https://fatigue-detector-xxxxx.run.app
        filter: 'attributes.type = "CREATIVE_ANALYZED"'

  - name: attribution
    labels:
      domain: attribution
    subscriptions:
      - name: attribution-builder
        pushEndpoint: https://attribution-builder-xxxxx.run.app
```

## Consequences

### Positive
1. **Loose coupling** - Components communicate via events
2. **Scalability** - Pub/Sub handles millions of events
3. **Auditability** - Full event history for compliance
4. **Replay capability** - Backtest strategies with historical data
5. **Agent coordination** - Hooks integrate naturally with Claude-Flow

### Negative
1. **Eventual consistency** - Projections may lag behind events
2. **Complexity** - Event schemas must be carefully versioned
3. **Debugging** - Tracing across async events is harder
4. **Cost** - High-volume Pub/Sub can be expensive

### Mitigations
1. Use Firestore transactions for critical consistency
2. Implement schema registry with versioning
3. Add correlation IDs for distributed tracing
4. Use dead-letter topics for failed events

## Related Documents
- [ADR-001: System Overview](./001-system-overview.md)
- [ADR-002: Rust/WASM Strategy](./002-rust-wasm-strategy.md)
- [Google Cloud: Firestore Schema](../google-cloud/002-firestore-schema.md)
