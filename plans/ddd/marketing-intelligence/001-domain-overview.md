# DDD: Marketing Intelligence Domain - Overview

## Domain Purpose

The **Marketing Intelligence Domain** provides the predictive and analytical capabilities that power the AI Marketing Swarms platform. It encompasses vector search, GNN-based pattern learning, attention mechanisms, and real-time adaptive learning via SONA.

## Strategic Classification

| Aspect | Classification |
|--------|----------------|
| **Domain Type** | Core Domain |
| **Business Value** | Critical - Powers all predictions |
| **Complexity** | Very High - ML/AI operations |
| **Volatility** | High - Models evolve frequently |

## Ubiquitous Language

| Term | Definition |
|------|------------|
| **Embedding** | A numerical vector representation of marketing entities |
| **HNSW Index** | Hierarchical Navigable Small World graph for fast vector search |
| **GNN Layer** | Graph Neural Network for learning from campaign graphs |
| **Attention** | Mechanism for weighting importance of different inputs |
| **SONA** | Self-Optimizing Neural Architecture for runtime learning |
| **Prediction** | An inference about future campaign performance |
| **Pattern** | A learned relationship between campaign attributes and outcomes |
| **Similarity** | Measure of closeness between embeddings in vector space |

## Domain Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   MARKETING INTELLIGENCE DOMAIN MODEL                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         AGGREGATES                                   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              VectorIndex (Aggregate Root)                    │   │   │
│  │  │                                                              │   │   │
│  │  │  • indexId: IndexId                                         │   │   │
│  │  │  • collection: Collection                                   │   │   │
│  │  │  • dimension: number                                        │   │   │
│  │  │  • metric: DistanceMetric                                   │   │   │
│  │  │  • vectorCount: number                                      │   │   │
│  │  │  • config: HnswConfig                                       │   │   │
│  │  │                                                              │   │   │
│  │  │  + insert(id: string, embedding: Embedding): void           │   │   │
│  │  │  + search(query: Embedding, k: number): SearchResult[]      │   │   │
│  │  │  + delete(id: string): void                                 │   │   │
│  │  │  + rebuild(): void                                          │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              PredictionModel (Aggregate Root)                │   │   │
│  │  │                                                              │   │   │
│  │  │  • modelId: ModelId                                         │   │   │
│  │  │  • type: ModelType                                          │   │   │
│  │  │  • gnnLayers: GnnLayer[]                                    │   │   │
│  │  │  • attentionConfig: AttentionConfig                         │   │   │
│  │  │  • sonaEngine: SonaEngine                                   │   │   │
│  │  │  • version: ModelVersion                                    │   │   │
│  │  │                                                              │   │   │
│  │  │  + predict(input: PredictionInput): Prediction              │   │   │
│  │  │  + learn(trajectory: Trajectory): void                      │   │   │
│  │  │  + train(dataset: TrainingDataset): TrainingResult          │   │   │
│  │  │  + export(): ModelWeights                                   │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              Pattern (Entity)                                │   │   │
│  │  │                                                              │   │   │
│  │  │  • patternId: PatternId                                     │   │   │
│  │  │  • type: PatternType                                        │   │   │
│  │  │  • embedding: Embedding                                     │   │   │
│  │  │  • confidence: number                                       │   │   │
│  │  │  • frequency: number                                        │   │   │
│  │  │  • associations: Association[]                              │   │   │
│  │  │                                                              │   │   │
│  │  │  + matches(input: Embedding): boolean                       │   │   │
│  │  │  + strengthen(outcome: Outcome): void                       │   │   │
│  │  │  + weaken(): void                                           │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       VALUE OBJECTS                                  │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    Embedding (Value Object)                  │   │   │
│  │  │                                                              │   │   │
│  │  │  • values: Float32Array                                     │   │   │
│  │  │  • dimension: number                                        │   │   │
│  │  │  • normalized: boolean                                      │   │   │
│  │  │                                                              │   │   │
│  │  │  + cosineSimilarity(other: Embedding): number               │   │   │
│  │  │  + euclideanDistance(other: Embedding): number              │   │   │
│  │  │  + dotProduct(other: Embedding): number                     │   │   │
│  │  │  + normalize(): Embedding                                   │   │   │
│  │  │  + toHyperbolic(curvature: number): HyperbolicEmbedding     │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    Prediction (Value Object)                 │   │   │
│  │  │                                                              │   │   │
│  │  │  • value: number                                            │   │   │
│  │  │  • confidence: number                                       │   │   │
│  │  │  • uncertainty: number                                      │   │   │
│  │  │  • explanation: string                                      │   │   │
│  │  │  • contributingPatterns: PatternId[]                        │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    AttentionOutput (Value Object)            │   │   │
│  │  │                                                              │   │   │
│  │  │  • output: Float32Array                                     │   │   │
│  │  │  • weights: Float32Array[]                                  │   │   │
│  │  │  • headOutputs: Float32Array[]                              │   │   │
│  │  │  • mechanism: AttentionMechanism                            │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    SearchResult (Value Object)               │   │   │
│  │  │                                                              │   │   │
│  │  │  • id: string                                               │   │   │
│  │  │  • score: number                                            │   │   │
│  │  │  • embedding: Embedding                                     │   │   │
│  │  │  • metadata: Record<string, unknown>                        │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       DOMAIN SERVICES                                │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              VectorSearchService                             │   │   │
│  │  │                                                              │   │   │
│  │  │  - ruvectorCore: RuvectorCore                               │   │   │
│  │  │  - indices: Map<Collection, VectorIndex>                    │   │   │
│  │  │                                                              │   │   │
│  │  │  + searchSimilar(query, collection, k): SearchResult[]      │   │   │
│  │  │  + searchWithFilter(query, filter, k): SearchResult[]       │   │   │
│  │  │  + hybridSearch(query, keywords, k): SearchResult[]         │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              GnnPredictionService                            │   │   │
│  │  │                                                              │   │   │
│  │  │  - ruvectorGnn: RuvectorGnn                                 │   │   │
│  │  │  - models: Map<ModelType, PredictionModel>                  │   │   │
│  │  │                                                              │   │   │
│  │  │  + predictCampaignPerformance(campaign): Prediction         │   │   │
│  │  │  + predictCreativeFatigue(creative): FatiguePrediction      │   │   │
│  │  │  + predictAudienceResponse(audience, creative): Prediction  │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              AttentionService                                │   │   │
│  │  │                                                              │   │   │
│  │  │  - ruvectorAttention: RuvectorAttention                     │   │   │
│  │  │  - mechanisms: Map<UseCase, AttentionMechanism>             │   │   │
│  │  │                                                              │   │   │
│  │  │  + computeCreativeAttention(creative): AttentionOutput      │   │   │
│  │  │  + computeAttributionAttention(path): AttentionOutput       │   │   │
│  │  │  + computeAudienceAttention(segments): AttentionOutput      │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              SonaLearningService                             │   │   │
│  │  │                                                              │   │   │
│  │  │  - sonaEngine: SonaEngine                                   │   │   │
│  │  │  - trajectoryBuffer: TrajectoryBuffer                       │   │   │
│  │  │                                                              │   │   │
│  │  │  + beginTrajectory(input: Embedding): TrajectoryId          │   │   │
│  │  │  + recordStep(trajId, activations, attention, conf): void   │   │   │
│  │  │  + endTrajectory(trajId, outcome): void                     │   │   │
│  │  │  + applyLearning(input: Embedding): Embedding               │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              HyperbolicEmbeddingService                      │   │   │
│  │  │                                                              │   │   │
│  │  │  - curvature: number                                        │   │   │
│  │  │                                                              │   │   │
│  │  │  + embedAudienceHierarchy(root: Audience): HyperbolicEmb    │   │   │
│  │  │  + computeHyperbolicDistance(a, b): number                  │   │   │
│  │  │  + mapToTangentSpace(embedding): TangentEmbedding           │   │   │
│  │  │  + projectToPoincare(embedding): PoincareEmbedding          │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       DOMAIN EVENTS                                  │   │
│  │                                                                      │   │
│  │  • VectorIndexed { collection, vectorId, embedding, timestamp }     │   │
│  │  • SimilaritySearched { query, results, latency, timestamp }        │   │
│  │  • PredictionMade { modelId, input, prediction, timestamp }         │   │
│  │  • PatternDiscovered { patternId, type, confidence, timestamp }     │   │
│  │  • ModelTrained { modelId, metrics, dataset, timestamp }            │   │
│  │  • SonaAdapted { trajectoryId, improvement, timestamp }             │   │
│  │  • AttentionComputed { mechanism, input, output, timestamp }        │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Ruvector Integration Points

| Intelligence Capability | Ruvector Component | Performance Target |
|------------------------|-------------------|-------------------|
| Vector Search | ruvector-core (HNSW) | <1ms / 10K vectors |
| GNN Prediction | ruvector-gnn | <15ms inference |
| Attention Compute | ruvector-attention | <8ms per mechanism |
| Runtime Learning | ruvector-sona | <1ms adaptation |
| LLM Routing | ruvector-tiny-dancer | 70-85% cost reduction |
| Hyperbolic Math | ruvector-attention (hyperbolic) | <2ms operations |

## Implementation Example

```typescript
// services/marketing-intelligence.service.ts
import {
  VectorDB,
  GNNLayer,
  MultiHeadAttention,
  HyperbolicAttention,
  SonaEngine,
  TinyDancerRouter
} from '@marketing/ruvector';

export class MarketingIntelligenceService {
  private vectorDB: VectorDB;
  private gnnLayer: GNNLayer;
  private attention: MultiHeadAttention;
  private hyperbolicAttention: HyperbolicAttention;
  private sona: SonaEngine;
  private router: TinyDancerRouter;

  constructor() {
    this.vectorDB = new VectorDB(384);
    this.gnnLayer = new GNNLayer(384, 256, 4);
    this.attention = new MultiHeadAttention({ heads: 4, dim: 256 });
    this.hyperbolicAttention = new HyperbolicAttention({ curvature: -1.0 });
    this.sona = new SonaEngine({ hiddenDim: 256 });
    this.router = new TinyDancerRouter();
  }

  async findSimilarCampaigns(
    campaignEmbedding: Embedding,
    k: number = 10
  ): Promise<SearchResult[]> {
    // Fast HNSW search
    const results = this.vectorDB.search(
      campaignEmbedding.values,
      k * 2  // Over-fetch for re-ranking
    );

    // Re-rank with GNN for better relevance
    const reranked = await this.rerankWithGnn(results, campaignEmbedding);

    return reranked.slice(0, k);
  }

  async predictCampaignPerformance(
    campaign: Campaign
  ): Promise<CampaignPrediction> {
    // Get campaign embedding
    const embedding = new Embedding(campaign.intelligence.embedding);

    // Find historical neighbors
    const neighbors = await this.findSimilarCampaigns(embedding, 20);

    // Build neighborhood graph
    const neighborEmbeddings = neighbors.map(n => n.embedding);
    const edgeWeights = this.computeEdgeWeights(neighbors);

    // GNN forward pass
    const gnnOutput = this.gnnLayer.forward(
      embedding.values,
      neighborEmbeddings,
      edgeWeights
    );

    // Attention over historical patterns
    const attentionOutput = this.attention.compute(
      gnnOutput,
      neighborEmbeddings,
      neighborEmbeddings
    );

    // SONA adaptive refinement
    const trajId = this.sona.beginTrajectory(attentionOutput);
    this.sona.addStep(trajId, gnnOutput, attentionOutput, 1.0);

    const prediction = this.extractPrediction(attentionOutput);

    // Record for learning
    this.sona.endTrajectory(trajId, prediction.confidence);

    return prediction;
  }

  async computeAudienceHierarchy(
    rootAudience: Audience
  ): Promise<HierarchicalEmbedding> {
    // Embed in hyperbolic space for natural hierarchy
    const flatEmbedding = await this.embedAudience(rootAudience);

    // Map to Poincaré ball
    const hyperbolicEmbedding = this.hyperbolicAttention.expMap(
      flatEmbedding.values,
      -1.0  // Curvature
    );

    // Compute hierarchical attention
    const children = rootAudience.children || [];
    const childEmbeddings = await Promise.all(
      children.map(c => this.embedAudience(c))
    );

    const hierarchicalAttention = this.hyperbolicAttention.compute(
      hyperbolicEmbedding,
      childEmbeddings.map(c => c.values),
      childEmbeddings.map(c => c.values)
    );

    return {
      root: hyperbolicEmbedding,
      attention: hierarchicalAttention,
      depth: this.computeHierarchyDepth(rootAudience)
    };
  }
}
```

## Related Documents
- [DDD: Marketing Intelligence - Value Objects](./002-value-objects.md)
- [DDD: Marketing Intelligence - Services](./003-services.md)
- [ADR: Ruvector Integration](../../adr/ruvector-integration/001-integration-strategy.md)
