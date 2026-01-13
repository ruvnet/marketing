# ADR-RV002: Attention Mechanisms for Marketing Intelligence

## Status
**Proposed** | Date: 2026-01-13

## Context

The AI Marketing Swarms platform requires sophisticated attention mechanisms to:

1. **Score creative elements** based on multi-factor analysis
2. **Weight touchpoints** in attribution paths
3. **Prioritize campaigns** for optimization
4. **Model user attention** across platforms

Ruvector provides 39 attention mechanisms based on 7 mathematical theories. We need to select and apply the right mechanisms for each marketing use case.

## Decision

We will leverage ruvector's attention mechanisms strategically across marketing domains:

### Attention Mechanism Selection Matrix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                ATTENTION MECHANISM SELECTION FOR MARKETING                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ USE CASE                  │ MECHANISM              │ RATIONALE      │   │
│  ├───────────────────────────┼────────────────────────┼────────────────┤   │
│  │ Creative Element Scoring  │ Multi-Head Attention   │ Multiple heads │   │
│  │                           │                        │ capture hook,  │   │
│  │                           │                        │ promise, frame │   │
│  ├───────────────────────────┼────────────────────────┼────────────────┤   │
│  │ Audience Hierarchy        │ Hyperbolic Attention   │ Natural fit    │   │
│  │                           │                        │ for tree-like  │   │
│  │                           │                        │ audience data  │   │
│  ├───────────────────────────┼────────────────────────┼────────────────┤   │
│  │ Long Creative Sequences   │ Flash Attention        │ O(n) memory    │   │
│  │                           │                        │ for carousel   │   │
│  │                           │                        │ and video ads  │   │
│  ├───────────────────────────┼────────────────────────┼────────────────┤   │
│  │ Attribution Paths         │ Graph RoPE Attention   │ Position-aware │   │
│  │                           │                        │ for temporal   │   │
│  │                           │                        │ touchpoints    │   │
│  ├───────────────────────────┼────────────────────────┼────────────────┤   │
│  │ Cross-Platform Learning   │ Cross Attention        │ Multi-modal    │   │
│  │                           │                        │ platform data  │   │
│  ├───────────────────────────┼────────────────────────┼────────────────┤   │
│  │ Expert Routing            │ MoE Attention          │ Specialized    │   │
│  │                           │                        │ agents per     │   │
│  │                           │                        │ platform       │   │
│  ├───────────────────────────┼────────────────────────┼────────────────┤   │
│  │ Budget Flow Optimization  │ TopologyGatedAttention │ Coherence-     │   │
│  │                           │                        │ based mode     │   │
│  │                           │                        │ switching      │   │
│  ├───────────────────────────┼────────────────────────┼────────────────┤   │
│  │ Real-time Bid Adjustment  │ Linear Attention       │ O(n) for       │   │
│  │                           │                        │ streaming      │   │
│  │                           │                        │ bid requests   │   │
│  └───────────────────────────┴────────────────────────┴────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Mathematical Theories Applied

#### Theory 1: Optimal Transport for Creative Distribution
```typescript
// Use Sliced Wasserstein for creative performance distribution matching
import { SlicedWassersteinAttention } from '@ruvector/attention';

export class CreativeDistributionMatcher {
  private otAttention: SlicedWassersteinAttention;

  async matchPerformanceDistribution(
    newCreative: Creative,
    topPerformers: Creative[]
  ): Promise<DistributionMatch> {
    // Treat creative embeddings as distributions
    const newDist = newCreative.genome.embedding;
    const targetDists = topPerformers.map(c => c.genome.embedding);

    // Compute OT-based attention to find closest distribution match
    const matches = this.otAttention.compute(newDist, targetDists, targetDists);

    return {
      bestMatch: topPerformers[matches.topIndex],
      wassersteinDistance: matches.distance,
      transportPlan: matches.plan
    };
  }
}
```

#### Theory 2: Mixed Curvature for Audience Modeling
```typescript
// Use mixed curvature for hierarchical + flat audience segments
import { MixedCurvatureFusedAttention } from '@ruvector/attention';

export class AudienceModeler {
  private mixedAttention: MixedCurvatureFusedAttention;

  constructor() {
    this.mixedAttention = new MixedCurvatureFusedAttention({
      euclideanDim: 128,    // Demographics (flat)
      hyperbolicDim: 128,   // Interest hierarchy
      sphericalDim: 64,     // Behavioral cycles
      curvatureH: -1.0,
      curvatureS: 1.0
    });
  }

  async modelAudience(
    userFeatures: UserFeatures
  ): Promise<AudienceEmbedding> {
    // Split features into curvature-appropriate spaces
    const euclidean = userFeatures.demographics;  // Age, income, location
    const hyperbolic = userFeatures.interests;    // Interest tree
    const spherical = userFeatures.behavior;      // Cyclical patterns

    // Fused attention across all spaces
    const embedding = this.mixedAttention.compute({
      euclidean,
      hyperbolic,
      spherical
    });

    return {
      embedding,
      segments: this.extractSegments(embedding),
      hierarchy: this.extractHierarchy(embedding)
    };
  }
}
```

#### Theory 3: Topology-Gated for Campaign Health
```typescript
// Use topology-gated attention for automatic mode switching
import { TopologyGatedAttention, AttentionMode } from '@ruvector/attention';

export class CampaignHealthMonitor {
  private gatedAttention: TopologyGatedAttention;

  constructor() {
    this.gatedAttention = new TopologyGatedAttention({
      dim: 256,
      stableThreshold: 0.8,     // High coherence = stable
      cautiousThreshold: 0.5,   // Medium = cautious
      freezeThreshold: 0.3,     // Low = freeze optimizations
      hysteresis: 0.05
    });
  }

  async monitorHealth(
    campaigns: Campaign[]
  ): Promise<HealthReport> {
    const embeddings = campaigns.map(c => c.intelligence.embedding);

    // Attention automatically adjusts based on window coherence
    const healthScores = this.gatedAttention.compute(
      campaigns.map(c => c.metrics),
      embeddings,
      embeddings
    );

    const mode = this.gatedAttention.currentMode();

    return {
      scores: healthScores,
      mode,
      recommendations: this.getRecommendations(mode, healthScores)
    };
  }

  private getRecommendations(
    mode: AttentionMode,
    scores: number[]
  ): string[] {
    switch (mode) {
      case 'STABLE':
        return ['Continue current optimization strategy'];
      case 'CAUTIOUS':
        return ['Reduce bid adjustments', 'Monitor creative fatigue'];
      case 'FREEZE':
        return ['Pause optimizations', 'Investigate anomalies', 'Alert team'];
    }
  }
}
```

#### Theory 4: Information Geometry for Natural Optimization
```typescript
// Use natural gradient for bid optimization
import { NaturalGradient, FisherMetric } from '@ruvector/attention';

export class BidOptimizer {
  private naturalGradient: NaturalGradient;

  constructor() {
    this.naturalGradient = new NaturalGradient({
      lr: 0.1,
      useDiagonal: false  // Full CG solve for accuracy
    });
  }

  async optimizeBids(
    currentBids: Float32Array,
    gradients: Float32Array
  ): Promise<Float32Array> {
    // Natural gradient descent respects probability geometry
    // Better for bid distributions than vanilla SGD
    const optimizedBids = this.naturalGradient.step(currentBids, gradients);

    // Ensure bids stay in valid range
    return this.clampBids(optimizedBids);
  }
}
```

#### Theory 5: Information Bottleneck for Creative Compression
```typescript
// Use IB for extracting essential creative features
import { InformationBottleneck } from '@ruvector/attention';

export class CreativeCompressor {
  private ib: InformationBottleneck;

  constructor() {
    this.ib = new InformationBottleneck({
      beta: 0.5,           // Compression-accuracy tradeoff
      compressedDim: 64    // Target dimension
    });
  }

  async extractEssence(
    creative: Creative
  ): Promise<CompressedCreative> {
    // Compress creative embedding while preserving conversion signal
    const compressed = this.ib.compress(
      creative.embedding,
      creative.conversionRate  // Target to preserve
    );

    return {
      originalId: creative.id,
      essence: compressed.embedding,
      informationPreserved: compressed.mutualInformation,
      compressionRatio: creative.embedding.length / compressed.embedding.length
    };
  }
}
```

### Implementation Architecture

```typescript
// attention/marketing-attention.ts
import {
  MultiHeadAttention,
  HyperbolicAttention,
  FlashAttention,
  GraphRoPeAttention,
  CrossAttention,
  MoEAttention,
  TopologyGatedAttention,
  LinearAttention
} from '@ruvector/attention';

export class MarketingAttentionEngine {
  private mechanisms: Map<string, AttentionMechanism>;

  constructor() {
    this.mechanisms = new Map([
      ['creative_scoring', new MultiHeadAttention({ heads: 4, dim: 256 })],
      ['audience_hierarchy', new HyperbolicAttention({ curvature: -1.0 })],
      ['long_sequence', new FlashAttention({ blockSize: 64 })],
      ['attribution', new GraphRoPeAttention({ maxLen: 100 })],
      ['cross_platform', new CrossAttention({ queryDim: 256, keyDim: 384 })],
      ['expert_routing', new MoEAttention({ numExperts: 4, topK: 2 })],
      ['health_monitoring', new TopologyGatedAttention({ dim: 256 })],
      ['realtime_bidding', new LinearAttention({ kernelSize: 16 })]
    ]);
  }

  async compute(
    useCase: string,
    query: Float32Array,
    keys: Float32Array[],
    values: Float32Array[]
  ): Promise<AttentionOutput> {
    const mechanism = this.mechanisms.get(useCase);
    if (!mechanism) {
      throw new Error(`Unknown use case: ${useCase}`);
    }

    return mechanism.compute(query, keys, values);
  }

  // Domain-specific convenience methods
  async scoreCreative(creative: Creative): Promise<CreativeScore> {
    const scores = await this.compute(
      'creative_scoring',
      creative.embedding,
      [creative.genome.hook.embedding, creative.genome.promise.embedding, creative.genome.frame.embedding],
      [creative.genome.hook.embedding, creative.genome.promise.embedding, creative.genome.frame.embedding]
    );

    return {
      hookScore: scores.headOutputs[0],
      promiseScore: scores.headOutputs[1],
      frameScore: scores.headOutputs[2],
      overallScore: scores.output
    };
  }

  async computeAttribution(touchpoints: Touchpoint[]): Promise<AttributionWeights> {
    const embeddings = touchpoints.map(t => t.embedding);
    const positions = touchpoints.map(t => t.position);

    const output = await this.compute(
      'attribution',
      touchpoints[touchpoints.length - 1].embedding,  // Conversion
      embeddings,
      embeddings
    );

    return {
      weights: output.attentionWeights,
      positions,
      shapleyValues: this.computeShapley(output.attentionWeights, touchpoints)
    };
  }
}
```

### Performance Benchmarks

| Mechanism | Complexity | Latency (256d, 100 seq) | Memory |
|-----------|------------|-------------------------|--------|
| Multi-Head | O(n²·h) | 2.3ms | 2.5MB |
| Hyperbolic | O(n²) | 3.1ms | 2.0MB |
| Flash | O(n²) | 1.8ms | 0.5MB |
| Graph RoPE | O(n²) | 2.8ms | 2.2MB |
| Cross | O(n·m) | 1.5ms | 1.8MB |
| MoE | O(n·k) | 2.0ms | 3.0MB |
| Topology-Gated | O(n²) | 2.5ms | 2.3MB |
| Linear | O(n·d) | 0.8ms | 0.3MB |

## Consequences

### Positive
1. **Purpose-built mechanisms** for each marketing use case
2. **Sub-5ms latency** for real-time operations
3. **Rich mathematical foundations** for principled decisions
4. **Automatic mode switching** via topology-gated attention

### Negative
1. **Complexity** of choosing right mechanism
2. **Memory overhead** for multiple mechanisms
3. **Tuning required** for hyperparameters

### Mitigations
1. Clear selection matrix (above)
2. Lazy loading of mechanisms
3. Auto-tuning via SONA feedback

## Related Documents
- [ADR-RV001: Integration Strategy](./001-integration-strategy.md)
- [ADR-RV003: Hyperbolic Vectors](./003-hyperbolic-vectors.md)
