# ADR-GC002: Firestore Database Schema Design

## Status
**Proposed** | Date: 2026-01-13

## Context

The AI Marketing Swarms platform requires a database that:

1. Supports **real-time updates** for dashboard displays
2. Handles **hierarchical data** (accounts → campaigns → ad groups → ads)
3. Enables **vector storage** for embeddings (via serialization)
4. Provides **event sourcing** capability
5. Scales **automatically** with data growth

## Decision

We will use **Firestore** in Native mode as the primary database with a carefully designed schema that supports both operational queries and event sourcing.

### Collection Schema

```
firestore/
├── accounts/{accountId}/
│   ├── profile                    # Account settings
│   ├── campaigns/{campaignId}/
│   │   ├── metadata              # Campaign config
│   │   ├── performance/          # Subcollection for time-series
│   │   │   └── {date}/
│   │   ├── creatives/{creativeId}/
│   │   │   ├── genome            # Creative DNA
│   │   │   └── performance/
│   │   └── audiences/{audienceId}/
│   └── attribution/
│       └── {conversionId}/
│
├── events/{eventId}/              # Immutable event store
│
├── projections/
│   ├── campaign-summaries/{accountId}/
│   ├── creative-health/{accountId}/
│   └── attribution-models/{accountId}/
│
├── vectors/                       # Vector embeddings cache
│   ├── campaigns/{campaignId}/
│   ├── creatives/{creativeId}/
│   └── audiences/{audienceId}/
│
├── models/                        # GNN model metadata
│   ├── campaign-predictor/
│   ├── creative-scorer/
│   └── fatigue-detector/
│
└── swarm/                         # Agent swarm state
    ├── agents/{agentId}/
    ├── tasks/{taskId}/
    └── coordination/
```

### Document Schemas

#### Account Document
```typescript
// accounts/{accountId}/profile
interface AccountProfile {
  // Identity
  id: string;
  name: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Platform connections
  platforms: {
    google?: {
      customerId: string;
      managerAccountId?: string;
      connected: boolean;
      lastSync: Timestamp;
    };
    meta?: {
      accountId: string;
      businessId?: string;
      connected: boolean;
      lastSync: Timestamp;
    };
    tiktok?: {
      advertiserId: string;
      connected: boolean;
      lastSync: Timestamp;
    };
  };

  // Configuration
  settings: {
    timezone: string;
    currency: string;
    budgetAlertThreshold: number;
    optimizationEnabled: boolean;
    autoMutation: boolean;
  };

  // Limits
  limits: {
    maxCampaigns: number;
    maxDailySpend: number;
    maxAgentsPerSwarm: number;
  };
}
```

#### Campaign Document
```typescript
// accounts/{accountId}/campaigns/{campaignId}/metadata
interface CampaignMetadata {
  // Identity
  id: string;
  accountId: string;
  externalId: string;  // Platform's campaign ID
  platform: 'google' | 'meta' | 'tiktok' | 'linkedin';

  // Configuration
  name: string;
  objective: CampaignObjective;
  status: 'ACTIVE' | 'PAUSED' | 'ENDED' | 'DRAFT';
  startDate: Timestamp;
  endDate?: Timestamp;

  // Budget
  budget: {
    type: 'DAILY' | 'LIFETIME';
    amount: number;
    spent: number;
    pacing: 'STANDARD' | 'ACCELERATED';
  };

  // Targeting
  targeting: {
    locations: string[];
    languages: string[];
    ageRange: { min: number; max: number };
    genders: ('MALE' | 'FEMALE' | 'ALL')[];
    interests?: string[];
    customAudiences?: string[];
  };

  // Bidding
  bidding: {
    strategy: BiddingStrategy;
    targetCpa?: number;
    targetRoas?: number;
    maxBid?: number;
  };

  // Intelligence
  intelligence: {
    embedding: string;  // Base64 encoded Float32Array
    embeddingDim: number;
    lastAnalysis: Timestamp;
    healthScore: number;
    riskFactors: string[];
  };

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastSyncedAt: Timestamp;
}
```

#### Campaign Performance Document
```typescript
// accounts/{accountId}/campaigns/{campaignId}/performance/{date}
interface CampaignPerformance {
  date: string;  // YYYY-MM-DD
  campaignId: string;

  // Core metrics
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    revenue: number;
  };

  // Derived metrics
  derived: {
    ctr: number;      // Click-through rate
    cpm: number;      // Cost per mille
    cpc: number;      // Cost per click
    cpa: number;      // Cost per acquisition
    roas: number;     // Return on ad spend
    convRate: number; // Conversion rate
  };

  // Hourly breakdown
  hourly: Array<{
    hour: number;
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
  }>;

  // Intelligence
  intelligence: {
    anomalyScore: number;
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    predictedNextDay: {
      conversions: number;
      spend: number;
      confidence: number;
    };
  };

  timestamp: Timestamp;
}
```

#### Creative Document
```typescript
// accounts/{accountId}/campaigns/{campaignId}/creatives/{creativeId}/genome
interface CreativeGenome {
  // Identity
  id: string;
  campaignId: string;
  externalId: string;

  // Content
  type: 'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'TEXT';
  content: {
    headline?: string;
    description?: string;
    callToAction?: string;
    mediaUrl?: string;
    thumbnailUrl?: string;
  };

  // DNA decomposition
  genome: {
    hook: {
      type: 'QUESTION' | 'STATISTIC' | 'STORY' | 'CHALLENGE' | 'CONTRAST';
      strength: number;
      embedding: string;  // Base64 encoded
    };
    promise: {
      category: 'TRANSFORMATION' | 'SOLUTION' | 'BENEFIT' | 'EXCLUSIVITY';
      clarity: number;
      embedding: string;
    };
    frame: {
      emotion: 'FEAR' | 'DESIRE' | 'CURIOSITY' | 'URGENCY' | 'TRUST';
      intensity: number;
      embedding: string;
    };
    cta: {
      type: 'LEARN' | 'BUY' | 'SIGN_UP' | 'DOWNLOAD' | 'CONTACT';
      urgency: number;
    };
  };

  // Full embedding
  embedding: string;  // Base64 encoded Float32Array
  embeddingDim: number;

  // Fatigue tracking
  fatigue: {
    score: number;           // 0-1, higher = more fatigued
    impressionsSinceReset: number;
    decayCurve: number[];    // Predicted performance over time
    predictedDaysRemaining: number;
    lastUpdated: Timestamp;
  };

  // Lineage
  lineage: {
    parentId?: string;       // If mutated from another creative
    generation: number;
    mutationType?: 'hook' | 'promise' | 'frame' | 'cta';
  };

  // Status
  status: 'ACTIVE' | 'PAUSED' | 'REJECTED' | 'FATIGUED';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Event Document
```typescript
// events/{eventId}
interface MarketingEvent {
  // Identity
  id: string;
  type: EventType;
  version: number;

  // Context
  accountId: string;
  campaignId?: string;
  creativeId?: string;
  agentId?: string;

  // Payload (varies by type)
  payload: Record<string, unknown>;

  // Metadata
  correlationId: string;
  causationId?: string;
  source: 'PLATFORM' | 'AGENT' | 'USER' | 'SYSTEM';

  // Timestamps
  occurredAt: Timestamp;
  recordedAt: Timestamp;
}

type EventType =
  | 'CAMPAIGN_CREATED'
  | 'CAMPAIGN_UPDATED'
  | 'CAMPAIGN_PERFORMANCE'
  | 'CREATIVE_ANALYZED'
  | 'CREATIVE_FATIGUED'
  | 'CREATIVE_MUTATED'
  | 'TOUCHPOINT_RECORDED'
  | 'CONVERSION_ATTRIBUTED'
  | 'AGENT_ACTION'
  | 'OPTIMIZATION_APPLIED';
```

#### Swarm Agent Document
```typescript
// swarm/agents/{agentId}
interface SwarmAgent {
  // Identity
  id: string;
  type: AgentType;
  tier: 1 | 2 | 3 | 4 | 5;

  // State
  status: 'IDLE' | 'WORKING' | 'WAITING' | 'ERROR';
  currentTask?: string;

  // Capabilities
  capabilities: string[];
  specializations: {
    domain: string;
    confidence: number;
  }[];

  // Learning
  qTable: string;  // Base64 encoded Q-learning state
  successRate: number;
  tasksCompleted: number;

  // Coordination
  connectedAgents: string[];
  lastHeartbeat: Timestamp;

  createdAt: Timestamp;
}

type AgentType =
  | 'ORCHESTRATOR'
  | 'MEMORY'
  | 'QUALITY'
  | 'SIMULATION'
  | 'HISTORICAL_MEMORY'
  | 'RISK_DETECTION'
  | 'ATTENTION_ARBITRAGE'
  | 'CREATIVE_GENOME'
  | 'FATIGUE_FORECASTER'
  | 'MUTATION'
  | 'COUNTERFACTUAL'
  | 'CAUSAL_GRAPH'
  | 'INCREMENTALITY'
  | 'ACCOUNT_HEALTH'
  | 'CROSS_PLATFORM';
```

### Indexes

```
# firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "campaigns",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "performance",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "date", "order": "DESCENDING" },
        { "fieldPath": "metrics.spend", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "occurredAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "accountId", "order": "ASCENDING" },
        { "fieldPath": "occurredAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "creatives",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "fatigue.score", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### Vector Storage Strategy

Since Firestore doesn't natively support vector search, we use a hybrid approach:

```typescript
// Vector storage utility
export class VectorStore {
  private firestore: Firestore;

  // Store embedding as base64 string
  async storeEmbedding(
    collection: string,
    id: string,
    embedding: Float32Array
  ): Promise<void> {
    const base64 = Buffer.from(embedding.buffer).toString('base64');

    await this.firestore.collection(collection).doc(id).set({
      embedding: base64,
      embeddingDim: embedding.length,
      updatedAt: Timestamp.now()
    }, { merge: true });
  }

  // Retrieve and decode embedding
  async getEmbedding(
    collection: string,
    id: string
  ): Promise<Float32Array | null> {
    const doc = await this.firestore.collection(collection).doc(id).get();

    if (!doc.exists) return null;

    const data = doc.data();
    const buffer = Buffer.from(data.embedding, 'base64');
    return new Float32Array(buffer.buffer);
  }

  // For actual vector search, use ruvector HNSW index
  // Firestore stores the embeddings, ruvector indexes them
}
```

## Consequences

### Positive
1. **Real-time updates** via Firestore listeners
2. **Automatic scaling** with data growth
3. **Hierarchical queries** for campaign data
4. **Event sourcing** support with events collection
5. **Offline support** for mobile dashboards

### Negative
1. **No native vector search** - requires external index
2. **Cost per operation** - expensive for high-frequency writes
3. **Document size limit** - 1MB max per document
4. **Query limitations** - complex joins not supported

### Mitigations
1. Use ruvector HNSW for vector search, sync to Firestore
2. Batch writes and use Pub/Sub for high-frequency events
3. Split large embeddings across documents
4. Denormalize data for common query patterns

## Related Documents
- [ADR-GC001: Infrastructure](./001-infrastructure.md)
- [ADR-GC003: Cloud Functions](./003-cloud-functions.md)
