# DDD: Attribution & Analytics Domain - Overview

## Domain Purpose

The **Attribution & Analytics Domain** provides causal understanding of marketing performance. It moves beyond last-click attribution to build true causal graphs that answer: "What would NOT have happened if this ad never ran?"

## Strategic Classification

| Aspect | Classification |
|--------|----------------|
| **Domain Type** | Core Domain |
| **Business Value** | Critical - Truth about ROI |
| **Complexity** | Very High - Causal inference |
| **Volatility** | Low - Models are stable |

## Ubiquitous Language

| Term | Definition |
|------|------------|
| **Touchpoint** | A user interaction with marketing content |
| **Conversion** | A desired user action (purchase, signup, etc.) |
| **Attribution** | Credit assignment for conversion to touchpoints |
| **Causal Graph** | Graph showing influence relationships |
| **Counterfactual** | What would have happened without an intervention |
| **Lift** | Incremental effect caused by marketing |
| **Shapley Value** | Fair credit distribution based on contribution |
| **Holdout** | Control group excluded from treatment |

## Domain Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  ATTRIBUTION & ANALYTICS DOMAIN MODEL                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         AGGREGATES                                   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              ConversionJourney (Aggregate Root)              │   │   │
│  │  │                                                              │   │   │
│  │  │  • journeyId: JourneyId                                     │   │   │
│  │  │  • userId: UserId                                           │   │   │
│  │  │  • touchpoints: Touchpoint[]                                │   │   │
│  │  │  • conversion: Conversion?                                  │   │   │
│  │  │  • attribution: Attribution?                                │   │   │
│  │  │  • status: JourneyStatus                                    │   │   │
│  │  │                                                              │   │   │
│  │  │  + addTouchpoint(touchpoint: Touchpoint): void              │   │   │
│  │  │  + recordConversion(conversion: Conversion): void           │   │   │
│  │  │  + computeAttribution(model: AttributionModel): Attribution │   │   │
│  │  │  + getPath(): TouchpointPath                                │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              CausalGraph (Aggregate Root)                    │   │   │
│  │  │                                                              │   │   │
│  │  │  • graphId: GraphId                                         │   │   │
│  │  │  • accountId: AccountId                                     │   │   │
│  │  │  • nodes: CausalNode[]                                      │   │   │
│  │  │  • edges: CausalEdge[]                                      │   │   │
│  │  │  • statistics: GraphStatistics                              │   │   │
│  │  │                                                              │   │   │
│  │  │  + addNode(node: CausalNode): void                          │   │   │
│  │  │  + addEdge(edge: CausalEdge): void                          │   │   │
│  │  │  + computeInfluence(from: NodeId, to: NodeId): number       │   │   │
│  │  │  + findPaths(source: NodeId, target: NodeId): Path[]        │   │   │
│  │  │  + computeShapley(conversion: Conversion): ShapleyValues    │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              IncrementalityTest (Aggregate Root)             │   │   │
│  │  │                                                              │   │   │
│  │  │  • testId: TestId                                           │   │   │
│  │  │  • campaignId: CampaignId                                   │   │   │
│  │  │  • treatment: AudienceGroup                                 │   │   │
│  │  │  • holdout: AudienceGroup                                   │   │   │
│  │  │  • metrics: TestMetrics                                     │   │   │
│  │  │  • status: TestStatus                                       │   │   │
│  │  │                                                              │   │   │
│  │  │  + start(): void                                            │   │   │
│  │  │  + recordOutcome(group: 'treatment'|'holdout', metrics)     │   │   │
│  │  │  + computeLift(): LiftAnalysis                              │   │   │
│  │  │  + isStatisticallySignificant(): boolean                    │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       VALUE OBJECTS                                  │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    Touchpoint (Value Object)                 │   │   │
│  │  │                                                              │   │   │
│  │  │  • id: TouchpointId                                         │   │   │
│  │  │  • channel: Channel                                         │   │   │
│  │  │  • campaign: CampaignId                                     │   │   │
│  │  │  • creative: CreativeId                                     │   │   │
│  │  │  • timestamp: Timestamp                                     │   │   │
│  │  │  • interaction: InteractionType                             │   │   │
│  │  │  • embedding: Embedding                                     │   │   │
│  │  │  • position: number (in journey)                            │   │   │
│  │  │                                                              │   │   │
│  │  │  + isFirstTouch(): boolean                                  │   │   │
│  │  │  + isLastTouch(): boolean                                   │   │   │
│  │  │  + timeSince(other: Touchpoint): number                     │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    Attribution (Value Object)                │   │   │
│  │  │                                                              │   │   │
│  │  │  • model: AttributionModel                                  │   │   │
│  │  │  • credits: Map<TouchpointId, number>                       │   │   │
│  │  │  • confidence: number                                       │   │   │
│  │  │  • counterfactualLift: number                               │   │   │
│  │  │                                                              │   │   │
│  │  │  + getCreditFor(touchpointId: TouchpointId): number         │   │   │
│  │  │  + getTopContributors(n: number): TouchpointId[]            │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    ShapleyValues (Value Object)              │   │   │
│  │  │                                                              │   │   │
│  │  │  • values: Map<NodeId, number>                              │   │   │
│  │  │  • coalitions: Coalition[]                                  │   │   │
│  │  │  • iterations: number                                       │   │   │
│  │  │                                                              │   │   │
│  │  │  + getValue(nodeId: NodeId): number                         │   │   │
│  │  │  + normalize(): ShapleyValues                               │   │   │
│  │  │  + explain(nodeId: NodeId): string                          │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    LiftAnalysis (Value Object)               │   │   │
│  │  │                                                              │   │   │
│  │  │  • incrementalLift: number                                  │   │   │
│  │  │  • relativeLift: number (percentage)                        │   │   │
│  │  │  • confidenceInterval: [number, number]                     │   │   │
│  │  │  • pValue: number                                           │   │   │
│  │  │  • sampleSize: { treatment: number, holdout: number }       │   │   │
│  │  │                                                              │   │   │
│  │  │  + isSignificant(alpha: number): boolean                    │   │   │
│  │  │  + explain(): string                                        │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    CausalEdge (Value Object)                 │   │   │
│  │  │                                                              │   │   │
│  │  │  • source: NodeId                                           │   │   │
│  │  │  • target: NodeId                                           │   │   │
│  │  │  • weight: number                                           │   │   │
│  │  │  • confidence: number                                       │   │   │
│  │  │  • observations: number                                     │   │   │
│  │  │                                                              │   │   │
│  │  │  + strengthen(delta: number): CausalEdge                    │   │   │
│  │  │  + weaken(delta: number): CausalEdge                        │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       DOMAIN SERVICES                                │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              CausalGraphBuilder                              │   │   │
│  │  │                                                              │   │   │
│  │  │  - ruvectorGraph: GraphDB                                   │   │   │
│  │  │  - attention: GraphRoPeAttention                            │   │   │
│  │  │                                                              │   │   │
│  │  │  + build(journeys: ConversionJourney[]): CausalGraph        │   │   │
│  │  │  + addJourney(graph: CausalGraph, journey): void            │   │   │
│  │  │  + computeEdgeWeights(graph: CausalGraph): void             │   │   │
│  │  │  + pruneWeakEdges(graph: CausalGraph, threshold): void      │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              CounterfactualEngine                            │   │   │
│  │  │                                                              │   │   │
│  │  │  - simulationAgent: SimulationAgent                         │   │   │
│  │  │  - mincut: DynamicMinCut                                    │   │   │
│  │  │                                                              │   │   │
│  │  │  + whatIf(scenario: Scenario): CounterfactualResult         │   │   │
│  │  │  + estimateLift(campaign: Campaign): LiftEstimate           │   │   │
│  │  │  + computeImpact(touchpoint: Touchpoint): ImpactAnalysis    │   │   │
│  │  │  + simulate(iterations: number): SimulationResult[]         │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              ShapleyComputer                                 │   │   │
│  │  │                                                              │   │   │
│  │  │  + compute(conversion: Conversion, path: Path): ShapleyVals │   │   │
│  │  │  + approximateMonteCarlo(path, iterations): ShapleyValues   │   │   │
│  │  │  + computeCoalitionValue(coalition: Coalition): number      │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              IncrementalityTestService                       │   │   │
│  │  │                                                              │   │   │
│  │  │  + design(campaign: Campaign): TestDesign                   │   │   │
│  │  │  + run(test: IncrementalityTest): void                      │   │   │
│  │  │  + analyze(test: IncrementalityTest): LiftAnalysis          │   │   │
│  │  │  + validateStatistical(test: IncrementalityTest): boolean   │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       DOMAIN EVENTS                                  │   │
│  │                                                                      │   │
│  │  • TouchpointRecorded { journeyId, touchpoint, timestamp }          │   │
│  │  • ConversionRecorded { journeyId, conversion, value, timestamp }   │   │
│  │  • AttributionComputed { journeyId, model, credits, timestamp }     │   │
│  │  • CausalGraphUpdated { graphId, nodesAdded, edgesAdded, timestamp }│   │
│  │  • LiftMeasured { testId, lift, significance, timestamp }           │   │
│  │  • CounterfactualComputed { scenario, result, timestamp }           │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Attribution Models

| Model | Use Case | Complexity |
|-------|----------|------------|
| **Last Click** | Simple reporting | Low |
| **Linear** | Equal credit | Low |
| **Time Decay** | Recency bias | Medium |
| **Position-Based** | First/last emphasis | Medium |
| **Shapley** | Fair contribution | High |
| **Causal** | True incrementality | Very High |

## Implementation Example

```typescript
// services/causal-graph-builder.service.ts
import { GraphDB, GraphRoPeAttention } from '@marketing/ruvector';

export class CausalGraphBuilder {
  private graphDB: GraphDB;
  private attention: GraphRoPeAttention;

  async build(journeys: ConversionJourney[]): Promise<CausalGraph> {
    const graph = new CausalGraph();

    // Build nodes from touchpoints
    for (const journey of journeys) {
      for (const touchpoint of journey.touchpoints) {
        await this.graphDB.execute(`
          MERGE (t:Touchpoint {
            id: '${touchpoint.id.value}',
            channel: '${touchpoint.channel}',
            campaign: '${touchpoint.campaign}',
            embedding: '${touchpoint.embedding.toBase64()}'
          })
        `);
        graph.addNode(new CausalNode(touchpoint));
      }

      // Build edges for sequential touchpoints
      for (let i = 0; i < journey.touchpoints.length - 1; i++) {
        const source = journey.touchpoints[i];
        const target = journey.touchpoints[i + 1];

        await this.graphDB.execute(`
          MATCH (s:Touchpoint {id: '${source.id.value}'})
          MATCH (t:Touchpoint {id: '${target.id.value}'})
          MERGE (s)-[r:PRECEDED]->(t)
          ON CREATE SET r.weight = 1, r.observations = 1
          ON MATCH SET r.weight = r.weight + 0.1, r.observations = r.observations + 1
        `);
      }

      // Build conversion edge
      if (journey.conversion) {
        const lastTouchpoint = journey.touchpoints[journey.touchpoints.length - 1];
        await this.graphDB.execute(`
          MATCH (t:Touchpoint {id: '${lastTouchpoint.id.value}'})
          MERGE (c:Conversion {id: '${journey.conversion.id.value}'})
          MERGE (t)-[r:CONVERTED {value: ${journey.conversion.value}}]->(c)
        `);
      }
    }

    // Compute attention-weighted edge strengths
    await this.computeEdgeWeights(graph);

    return graph;
  }

  private async computeEdgeWeights(graph: CausalGraph): Promise<void> {
    // Get all edges from graph
    const edges = await this.graphDB.execute(`
      MATCH (s:Touchpoint)-[r:PRECEDED]->(t:Touchpoint)
      RETURN s.embedding as sourceEmb, t.embedding as targetEmb, r.weight as weight
    `);

    // Use Graph RoPE attention for position-aware weighting
    for (const edge of edges) {
      const sourceEmb = Embedding.fromBase64(edge.sourceEmb);
      const targetEmb = Embedding.fromBase64(edge.targetEmb);

      const attentionScore = this.attention.compute(
        sourceEmb.values,
        [targetEmb.values],
        [targetEmb.values]
      );

      // Update edge weight with attention-informed score
      const newWeight = edge.weight * attentionScore.output[0];
      graph.updateEdgeWeight(edge.source, edge.target, newWeight);
    }
  }
}
```

## Related Documents
- [DDD: Attribution - Bounded Contexts](./002-bounded-contexts.md)
- [DDD: Attribution - Repositories](./003-repositories.md)
- [ADR: Ruvector Integration](../../adr/ruvector-integration/001-integration-strategy.md)
