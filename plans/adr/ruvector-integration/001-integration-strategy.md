# ADR-RV001: Ruvector Integration Strategy

## Status
**Proposed** | Date: 2026-01-13

## Context

The AI Marketing Swarms platform requires advanced vector operations, graph neural networks, and attention mechanisms. The **ruvector** ecosystem provides 54+ production-ready Rust crates that deliver these capabilities with:

- Sub-millisecond latency
- WASM and native Node.js bindings
- Self-learning capabilities (SONA)
- Hyperbolic embeddings for hierarchical data

We need a comprehensive integration strategy that maximizes ruvector's capabilities for marketing optimization.

## Decision

We will integrate ruvector as the **core intelligence layer** across all marketing domains.

### Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    RUVECTOR INTEGRATION ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    MARKETING APPLICATION LAYER                       │   │
│  │                                                                      │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐       │   │
│  │  │ Campaign  │  │ Creative  │  │Attribution│  │  Budget   │       │   │
│  │  │ Optimizer │  │  Engine   │  │  Builder  │  │ Allocator │       │   │
│  │  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘       │   │
│  └────────┼──────────────┼──────────────┼──────────────┼─────────────┘   │
│           │              │              │              │                  │
│           └──────────────┴──────────────┴──────────────┘                  │
│                                   │                                       │
│                                   ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    RUVECTOR TYPESCRIPT SDK                          │   │
│  │                                                                      │   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │                    Unified API Layer                          │ │   │
│  │  │                                                               │ │   │
│  │  │  import { MarketingIntelligence } from '@marketing/ruvector'; │ │   │
│  │  │                                                               │ │   │
│  │  │  const mi = new MarketingIntelligence();                      │ │   │
│  │  │  await mi.initialize();                                       │ │   │
│  │  │                                                               │ │   │
│  │  │  // High-level marketing operations                           │ │   │
│  │  │  mi.findSimilarCampaigns(embedding, k);                       │ │   │
│  │  │  mi.predictCreativeFatigue(creativeId);                       │ │   │
│  │  │  mi.computeAttribution(touchpoints);                          │ │   │
│  │  │  mi.optimizeBudgetAllocation(campaigns, budget);              │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  │                                   │                                 │   │
│  │            ┌──────────────────────┼──────────────────────┐         │   │
│  │            ▼                      ▼                      ▼         │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │   │
│  │  │   WASM Layer    │  │   napi-rs Layer │  │  Server Layer   │   │   │
│  │  │   (Browser)     │  │   (Node.js)     │  │  (Cloud Run)    │   │   │
│  │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘   │   │
│  └───────────┼────────────────────┼────────────────────┼─────────────┘   │
│              │                    │                    │                  │
│              └────────────────────┴────────────────────┘                  │
│                                   │                                       │
│                                   ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    RUVECTOR RUST CRATES                             │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ CORE                                                         │   │   │
│  │  │ • ruvector-core (HNSW, 61µs search)                         │   │   │
│  │  │ • ruvector-graph (Cypher queries, hypergraph)               │   │   │
│  │  │ • ruvector-collections (namespace management)               │   │   │
│  │  │ • ruvector-filter (metadata filtering)                      │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ NEURAL                                                       │   │   │
│  │  │ • ruvector-gnn (GNN layers, pattern learning)               │   │   │
│  │  │ • ruvector-attention (39 attention mechanisms)              │   │   │
│  │  │ • ruvector-sona (runtime adaptive learning)                 │   │   │
│  │  │ • ruvector-tiny-dancer (LLM cost routing)                   │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ SPECIALIZED                                                  │   │   │
│  │  │ • ruvector-mincut (budget allocation, n^0.12)               │   │   │
│  │  │ • ruvector-dag (query optimization)                         │   │   │
│  │  │ • ruvector-nervous-system (BTSP, HDC, WTA)                  │   │   │
│  │  │ • ruvector-router (semantic routing)                        │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Mapping to Marketing Domains

| Marketing Domain | Ruvector Component | Use Case |
|-----------------|-------------------|----------|
| **Campaign Discovery** | ruvector-core (HNSW) | Find similar successful campaigns |
| **Audience Hierarchy** | Hyperbolic Embeddings | Model nested audience segments |
| **Creative Scoring** | ruvector-attention | Multi-head attention for creative analysis |
| **Fatigue Prediction** | ruvector-gnn | Learn fatigue patterns from graph |
| **Real-time Learning** | ruvector-sona | Adapt bid strategies in real-time |
| **LLM Cost Optimization** | ruvector-tiny-dancer | Route to appropriate LLM tier |
| **Budget Allocation** | ruvector-mincut | Graph-based budget distribution |
| **Attribution Graph** | ruvector-graph | Build causal attribution paths |

### Integration Packages

#### Core Package Structure
```
packages/
├── @marketing/ruvector/           # Unified SDK
│   ├── package.json
│   ├── src/
│   │   ├── index.ts               # Main exports
│   │   ├── core/                  # Core integrations
│   │   │   ├── vector-store.ts    # HNSW wrapper
│   │   │   ├── graph-db.ts        # Graph wrapper
│   │   │   └── collections.ts     # Namespace management
│   │   │
│   │   ├── intelligence/          # ML integrations
│   │   │   ├── gnn-layer.ts       # GNN wrapper
│   │   │   ├── attention.ts       # Attention wrapper
│   │   │   ├── sona.ts            # SONA wrapper
│   │   │   └── tiny-dancer.ts     # Routing wrapper
│   │   │
│   │   ├── specialized/           # Specialized integrations
│   │   │   ├── mincut.ts          # Budget allocation
│   │   │   ├── hyperbolic.ts      # Hyperbolic embeddings
│   │   │   └── nervous-system.ts  # Bio-inspired components
│   │   │
│   │   └── marketing/             # Domain-specific wrappers
│   │       ├── campaign.ts        # Campaign operations
│   │       ├── creative.ts        # Creative operations
│   │       ├── attribution.ts     # Attribution operations
│   │       └── budget.ts          # Budget operations
│   │
│   └── wasm/                      # WASM binaries
│       ├── marketing-wasm.js
│       └── marketing-wasm_bg.wasm
```

### Implementation Examples

#### Campaign Similarity Search
```typescript
// marketing/campaign.ts
import { VectorDB, HyperbolicMath } from '@marketing/ruvector';

export class CampaignIntelligence {
  private vectorDB: VectorDB;
  private hyperbolic: HyperbolicMath;

  constructor() {
    this.vectorDB = new VectorDB(384);  // 384-dim embeddings
    this.hyperbolic = new HyperbolicMath(1.0);  // Curvature
  }

  async findSimilarCampaigns(
    campaignEmbedding: Float32Array,
    k: number = 10
  ): Promise<SimilarCampaign[]> {
    // Use HNSW for fast approximate search
    const results = this.vectorDB.search(campaignEmbedding, k * 2);

    // Re-rank with hyperbolic distance for hierarchical data
    const reranked = results.map(r => ({
      ...r,
      hyperbolicDistance: this.hyperbolic.poincareDistance(
        campaignEmbedding,
        r.embedding
      )
    }));

    // Sort by hyperbolic distance and take top k
    return reranked
      .sort((a, b) => a.hyperbolicDistance - b.hyperbolicDistance)
      .slice(0, k);
  }
}
```

#### Creative Fatigue Prediction
```typescript
// marketing/creative.ts
import { GNNLayer, AttentionCompute, SonaEngine } from '@marketing/ruvector';

export class CreativeIntelligence {
  private gnn: GNNLayer;
  private attention: AttentionCompute;
  private sona: SonaEngine;

  async predictFatigue(creative: Creative): Promise<FatiguePrediction> {
    // Extract creative genome embeddings
    const genomeEmbeddings = [
      creative.genome.hook.embedding,
      creative.genome.promise.embedding,
      creative.genome.frame.embedding
    ];

    // Compute attention-weighted features
    const attentionOutput = this.attention.multiHead(
      creative.embedding,  // Query
      genomeEmbeddings,    // Keys
      genomeEmbeddings,    // Values
      { heads: 4, dropout: 0.1 }
    );

    // Pass through GNN for fatigue pattern
    const historicalNeighbors = await this.getHistoricalCreatives(creative);
    const gnnOutput = this.gnn.forward(
      attentionOutput,
      historicalNeighbors,
      this.computeEdgeWeights(creative, historicalNeighbors)
    );

    // SONA adapts prediction based on recent feedback
    const trajId = this.sona.beginTrajectory(gnnOutput);
    this.sona.addStep(trajId, gnnOutput, attentionOutput, 1.0);
    const adaptedPrediction = this.sona.applyMicroLora(gnnOutput);

    return {
      fatigueScore: adaptedPrediction[0],
      daysRemaining: Math.round(adaptedPrediction[1] * 30),
      decayCurve: Array.from(adaptedPrediction.slice(2, 12)),
      confidence: adaptedPrediction[12]
    };
  }
}
```

#### Budget Allocation with Min-Cut
```typescript
// marketing/budget.ts
import { DynamicMinCut, Graph } from '@marketing/ruvector';

export class BudgetAllocator {
  private mincut: DynamicMinCut;

  async optimizeAllocation(
    campaigns: Campaign[],
    totalBudget: number,
    constraints: AllocationConstraints
  ): Promise<AllocationResult> {
    // Build campaign graph
    const graph = new Graph();

    // Add source (budget) and sink (conversions)
    const sourceId = graph.addNode({ type: 'source', value: totalBudget });
    const sinkId = graph.addNode({ type: 'sink' });

    // Add campaign nodes
    for (const campaign of campaigns) {
      const nodeId = graph.addNode({
        type: 'campaign',
        id: campaign.id,
        expectedRoas: campaign.metrics.roas,
        minBudget: constraints.minBudget[campaign.id] || 0,
        maxBudget: constraints.maxBudget[campaign.id] || totalBudget
      });

      // Edge from source with capacity = max budget
      graph.addEdge(sourceId, nodeId, constraints.maxBudget[campaign.id] || totalBudget);

      // Edge to sink with capacity = expected conversions
      const expectedConversions = campaign.metrics.conversions *
        (totalBudget / campaign.budget.amount);
      graph.addEdge(nodeId, sinkId, expectedConversions);
    }

    // Add campaign-to-campaign edges for synergies
    for (let i = 0; i < campaigns.length; i++) {
      for (let j = i + 1; j < campaigns.length; j++) {
        const synergy = this.computeSynergy(campaigns[i], campaigns[j]);
        if (synergy > 0.1) {
          graph.addEdge(campaigns[i].id, campaigns[j].id, synergy * totalBudget);
        }
      }
    }

    // Compute min-cut for optimal allocation
    this.mincut = new DynamicMinCut(graph);
    const { value, cutEdges } = this.mincut.compute();

    // Extract allocations from flow
    const allocations: Record<string, number> = {};
    for (const campaign of campaigns) {
      const flow = this.mincut.getEdgeFlow(sourceId, campaign.id);
      allocations[campaign.id] = flow;
    }

    return {
      allocations,
      totalAllocated: Object.values(allocations).reduce((a, b) => a + b, 0),
      expectedValue: value,
      synergiesUtilized: cutEdges.filter(e =>
        e.source !== sourceId && e.target !== sinkId
      )
    };
  }
}
```

#### Attribution Graph Building
```typescript
// marketing/attribution.ts
import { GraphDB, CypherExecutor } from '@marketing/ruvector';

export class AttributionBuilder {
  private graphDB: GraphDB;

  async buildCausalGraph(
    touchpoints: Touchpoint[],
    conversions: Conversion[]
  ): Promise<AttributionGraph> {
    // Create nodes for each touchpoint
    for (const tp of touchpoints) {
      await this.graphDB.execute(`
        CREATE (t:Touchpoint {
          id: '${tp.id}',
          channel: '${tp.channel}',
          campaign: '${tp.campaignId}',
          creative: '${tp.creativeId}',
          timestamp: ${tp.timestamp},
          embedding: '${tp.embedding}'
        })
      `);
    }

    // Create edges for sequential paths
    const userPaths = this.groupByUser(touchpoints);
    for (const [userId, path] of Object.entries(userPaths)) {
      for (let i = 0; i < path.length - 1; i++) {
        const timeDiff = path[i + 1].timestamp - path[i].timestamp;
        await this.graphDB.execute(`
          MATCH (t1:Touchpoint {id: '${path[i].id}'})
          MATCH (t2:Touchpoint {id: '${path[i + 1].id}'})
          CREATE (t1)-[:PRECEDED {
            userId: '${userId}',
            timeDelta: ${timeDiff}
          }]->(t2)
        `);
      }
    }

    // Create conversion nodes and attribute
    for (const conv of conversions) {
      const lastTouchpoint = userPaths[conv.userId]?.slice(-1)[0];

      await this.graphDB.execute(`
        CREATE (c:Conversion {
          id: '${conv.id}',
          userId: '${conv.userId}',
          value: ${conv.value},
          timestamp: ${conv.timestamp}
        })
      `);

      if (lastTouchpoint) {
        await this.graphDB.execute(`
          MATCH (t:Touchpoint {id: '${lastTouchpoint.id}'})
          MATCH (c:Conversion {id: '${conv.id}'})
          CREATE (t)-[:CONVERTED {
            timeDelta: ${conv.timestamp - lastTouchpoint.timestamp}
          }]->(c)
        `);
      }
    }

    // Query for attribution paths
    const attributionPaths = await this.graphDB.execute(`
      MATCH path = (t:Touchpoint)-[:PRECEDED*0..10]->(final:Touchpoint)-[:CONVERTED]->(c:Conversion)
      RETURN path, c.value as conversionValue
      ORDER BY c.timestamp DESC
      LIMIT 10000
    `);

    return this.computeShapleyValues(attributionPaths);
  }
}
```

### Performance Requirements

| Operation | Target Latency | Ruvector Capability |
|-----------|---------------|---------------------|
| Campaign Search | <5ms | HNSW: 61µs |
| Creative Scoring | <20ms | Attention: 5-8ms |
| Fatigue Prediction | <50ms | GNN: 10-15ms |
| Budget Optimization | <100ms | Min-Cut: 50-80ms |
| Attribution Query | <200ms | Cypher: 100-150ms |
| Real-time Adaptation | <1ms | SONA: 0.8ms |

## Consequences

### Positive
1. **Unified intelligence layer** across all marketing domains
2. **Sub-millisecond operations** for real-time optimization
3. **Self-learning capabilities** via SONA
4. **Cost reduction** with Tiny Dancer routing
5. **Rich graph operations** for attribution

### Negative
1. **Learning curve** for ruvector ecosystem
2. **Binary size** for WASM bundles (~200-400KB)
3. **Memory usage** for large vector indices

### Mitigations
1. Comprehensive documentation and examples
2. Lazy loading and code splitting
3. Tiered caching with warm/cold data separation

## Related Documents
- [ADR-RV002: Attention Mechanisms](./002-attention-mechanisms.md)
- [ADR-RV003: Hyperbolic Vectors](./003-hyperbolic-vectors.md)
- [ADR-RV004: GNN Learning](./004-gnn-learning.md)
