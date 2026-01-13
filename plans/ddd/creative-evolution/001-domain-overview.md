# DDD: Creative Evolution Domain - Overview

## Domain Purpose

The **Creative Evolution Domain** manages the lifecycle of ad creatives, from DNA decomposition through fatigue prediction to evolutionary mutation. It treats creatives as living organisms that can be analyzed, optimized, and evolved.

## Strategic Classification

| Aspect | Classification |
|--------|----------------|
| **Domain Type** | Core Domain |
| **Business Value** | High - Drives creative performance |
| **Complexity** | High - Semantic + temporal analysis |
| **Volatility** | Medium - Creative patterns evolve |

## Ubiquitous Language

| Term | Definition |
|------|------------|
| **Creative** | An ad unit (image, video, carousel, or text) |
| **Genome** | The DNA decomposition of a creative into hook, promise, frame, and CTA |
| **Hook** | The attention-grabbing element (question, statistic, story) |
| **Promise** | The value proposition or transformation offered |
| **Frame** | The emotional context (fear, desire, curiosity) |
| **CTA** | Call-to-action (learn, buy, sign up) |
| **Fatigue** | Performance decay due to audience oversaturation |
| **Mutation** | Evolutionary variant of a creative |
| **Lineage** | Parent-child relationship between creatives |

## Domain Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CREATIVE EVOLUTION DOMAIN MODEL                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         AGGREGATES                                   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              Creative (Aggregate Root)                       │   │   │
│  │  │                                                              │   │   │
│  │  │  • creativeId: CreativeId                                   │   │   │
│  │  │  • campaignId: CampaignId                                   │   │   │
│  │  │  • type: CreativeType                                       │   │   │
│  │  │  • content: CreativeContent                                 │   │   │
│  │  │  • genome: CreativeGenome                                   │   │   │
│  │  │  • fatigue: FatigueStatus                                   │   │   │
│  │  │  • lineage: CreativeLineage                                 │   │   │
│  │  │  • status: CreativeStatus                                   │   │   │
│  │  │  • embedding: Embedding                                     │   │   │
│  │  │                                                              │   │   │
│  │  │  + analyze(): GenomeAnalysis                                │   │   │
│  │  │  + predictFatigue(): FatiguePrediction                      │   │   │
│  │  │  + mutate(type: MutationType): Creative[]                   │   │   │
│  │  │  + recordPerformance(metrics: PerformanceMetrics): void     │   │   │
│  │  │  + updateFatigue(): void                                    │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              CreativeGenome (Entity)                         │   │   │
│  │  │                                                              │   │   │
│  │  │  • hook: Hook                                               │   │   │
│  │  │  • promise: Promise                                         │   │   │
│  │  │  • frame: Frame                                             │   │   │
│  │  │  • cta: CTA                                                 │   │   │
│  │  │  • combinedEmbedding: Embedding                             │   │   │
│  │  │                                                              │   │   │
│  │  │  + score(): GenomeScore                                     │   │   │
│  │  │  + similarity(other: CreativeGenome): number                │   │   │
│  │  │  + extract(content: CreativeContent): CreativeGenome        │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              MutationPlan (Entity)                           │   │   │
│  │  │                                                              │   │   │
│  │  │  • planId: MutationPlanId                                   │   │   │
│  │  │  • parentId: CreativeId                                     │   │   │
│  │  │  • mutationType: MutationType                               │   │   │
│  │  │  • preservedElements: string[]                              │   │   │
│  │  │  • variants: MutationVariant[]                              │   │   │
│  │  │                                                              │   │   │
│  │  │  + execute(): Creative[]                                    │   │   │
│  │  │  + rank(variants: Creative[]): Creative[]                   │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       VALUE OBJECTS                                  │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    Hook (Value Object)                       │   │   │
│  │  │                                                              │   │   │
│  │  │  • type: HookType (QUESTION|STATISTIC|STORY|CHALLENGE)      │   │   │
│  │  │  • content: string                                          │   │   │
│  │  │  • strength: number (0-1)                                   │   │   │
│  │  │  • embedding: Embedding                                     │   │   │
│  │  │                                                              │   │   │
│  │  │  + analyzeStrength(): number                                │   │   │
│  │  │  + generateVariants(): Hook[]                               │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    Promise (Value Object)                    │   │   │
│  │  │                                                              │   │   │
│  │  │  • category: PromiseCategory                                │   │   │
│  │  │  • content: string                                          │   │   │
│  │  │  • clarity: number (0-1)                                    │   │   │
│  │  │  • embedding: Embedding                                     │   │   │
│  │  │                                                              │   │   │
│  │  │  + analyzeClarity(): number                                 │   │   │
│  │  │  + generateVariants(): Promise[]                            │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    Frame (Value Object)                      │   │   │
│  │  │                                                              │   │   │
│  │  │  • emotion: FrameEmotion (FEAR|DESIRE|CURIOSITY|URGENCY)    │   │   │
│  │  │  • intensity: number (0-1)                                  │   │   │
│  │  │  • embedding: Embedding                                     │   │   │
│  │  │                                                              │   │   │
│  │  │  + analyzeIntensity(): number                               │   │   │
│  │  │  + modulate(targetIntensity: number): Frame                 │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    FatigueStatus (Value Object)              │   │   │
│  │  │                                                              │   │   │
│  │  │  • score: number (0-1, higher = more fatigued)              │   │   │
│  │  │  • impressionsSinceReset: number                            │   │   │
│  │  │  • decayCurve: number[]                                     │   │   │
│  │  │  • predictedDaysRemaining: number                           │   │   │
│  │  │  • lastUpdated: Timestamp                                   │   │   │
│  │  │                                                              │   │   │
│  │  │  + isFatigued(): boolean                                    │   │   │
│  │  │  + shouldRotate(): boolean                                  │   │   │
│  │  │  + projectPerformance(days: number): number                 │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    CreativeLineage (Value Object)            │   │   │
│  │  │                                                              │   │   │
│  │  │  • parentId: CreativeId?                                    │   │   │
│  │  │  • generation: number                                       │   │   │
│  │  │  • mutationType: MutationType?                              │   │   │
│  │  │  • siblings: CreativeId[]                                   │   │   │
│  │  │  • offspring: CreativeId[]                                  │   │   │
│  │  │                                                              │   │   │
│  │  │  + isOriginal(): boolean                                    │   │   │
│  │  │  + getAncestors(): CreativeId[]                             │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       DOMAIN SERVICES                                │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              GenomeAnalysisService                           │   │   │
│  │  │                                                              │   │   │
│  │  │  - attention: MultiHeadAttention                            │   │   │
│  │  │  - embedder: CreativeEmbedder                               │   │   │
│  │  │                                                              │   │   │
│  │  │  + analyze(creative: Creative): GenomeAnalysis              │   │   │
│  │  │  + extractHook(content: CreativeContent): Hook              │   │   │
│  │  │  + extractPromise(content: CreativeContent): Promise        │   │   │
│  │  │  + extractFrame(content: CreativeContent): Frame            │   │   │
│  │  │  + scoreGenome(genome: CreativeGenome): GenomeScore         │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              FatiguePredictionService                        │   │   │
│  │  │                                                              │   │   │
│  │  │  - gnnModel: GNNLayer                                       │   │   │
│  │  │  - sona: SonaEngine                                         │   │   │
│  │  │  - historicalIndex: VectorIndex                             │   │   │
│  │  │                                                              │   │   │
│  │  │  + predict(creative: Creative): FatiguePrediction           │   │   │
│  │  │  + computeDecayCurve(creative: Creative): number[]          │   │   │
│  │  │  + estimateDaysRemaining(creative: Creative): number        │   │   │
│  │  │  + findSimilarFatiguePatterns(creative): FatiguePattern[]   │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              MutationService                                 │   │   │
│  │  │                                                              │   │   │
│  │  │  - llmRouter: TinyDancerRouter                              │   │   │
│  │  │  - vectorSearch: VectorSearchService                        │   │   │
│  │  │                                                              │   │   │
│  │  │  + generateMutations(creative, type): Creative[]            │   │   │
│  │  │  + mutateHook(creative: Creative): Creative[]               │   │   │
│  │  │  + mutatePromise(creative: Creative): Creative[]            │   │   │
│  │  │  + mutateFrame(creative: Creative): Creative[]              │   │   │
│  │  │  + crossover(a: Creative, b: Creative): Creative            │   │   │
│  │  │  + rankVariants(variants: Creative[]): Creative[]           │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              CreativeRotationService                         │   │   │
│  │  │                                                              │   │   │
│  │  │  + shouldRotate(creative: Creative): boolean                │   │   │
│  │  │  + planRotation(campaign: Campaign): RotationPlan           │   │   │
│  │  │  + executeRotation(plan: RotationPlan): void                │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       DOMAIN EVENTS                                  │   │
│  │                                                                      │   │
│  │  • CreativeCreated { creativeId, campaignId, type, timestamp }      │   │
│  │  • GenomeExtracted { creativeId, genome, timestamp }                │   │
│  │  • FatigueDetected { creativeId, score, daysRemaining, timestamp }  │   │
│  │  • MutationGenerated { parentId, childId, type, timestamp }         │   │
│  │  • CreativeRotated { outId, inId, campaignId, timestamp }           │   │
│  │  • PerformanceRecorded { creativeId, metrics, timestamp }           │   │
│  │  • CreativeRetired { creativeId, reason, finalMetrics, timestamp }  │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Creative Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CREATIVE LIFECYCLE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │ Created │───▶│Analyzed │───▶│ Active  │───▶│Fatigued │───▶│ Retired │  │
│  └─────────┘    └─────────┘    └────┬────┘    └────┬────┘    └─────────┘  │
│                                     │              │                       │
│                                     │              │                       │
│                                     ▼              ▼                       │
│                              ┌─────────────────────────┐                  │
│                              │       Mutation          │                  │
│                              │                         │                  │
│                              │  ┌──────┐  ┌──────┐    │                  │
│                              │  │Child1│  │Child2│    │                  │
│                              │  └──────┘  └──────┘    │                  │
│                              └─────────────────────────┘                  │
│                                         │                                 │
│                                         ▼                                 │
│                                   [New Creative]                          │
│                                         │                                 │
│                                         ▼                                 │
│                              (Re-enter at "Created")                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Implementation Example

```typescript
// domain/creative.ts
export class Creative {
  private readonly id: CreativeId;
  private genome: CreativeGenome;
  private fatigue: FatigueStatus;
  private lineage: CreativeLineage;

  async analyze(
    genomeService: GenomeAnalysisService
  ): Promise<GenomeAnalysis> {
    const analysis = await genomeService.analyze(this);

    this.genome = new CreativeGenome({
      hook: analysis.hook,
      promise: analysis.promise,
      frame: analysis.frame,
      cta: analysis.cta,
      combinedEmbedding: analysis.embedding
    });

    DomainEvents.raise(new GenomeExtracted({
      creativeId: this.id,
      genome: this.genome,
      timestamp: Date.now()
    }));

    return analysis;
  }

  async predictFatigue(
    fatigueService: FatiguePredictionService
  ): Promise<FatiguePrediction> {
    const prediction = await fatigueService.predict(this);

    this.fatigue = new FatigueStatus({
      score: prediction.score,
      impressionsSinceReset: this.fatigue?.impressionsSinceReset || 0,
      decayCurve: prediction.decayCurve,
      predictedDaysRemaining: prediction.daysRemaining,
      lastUpdated: Date.now()
    });

    if (this.fatigue.isFatigued()) {
      DomainEvents.raise(new FatigueDetected({
        creativeId: this.id,
        score: prediction.score,
        daysRemaining: prediction.daysRemaining,
        timestamp: Date.now()
      }));
    }

    return prediction;
  }

  async mutate(
    mutationService: MutationService,
    type: MutationType
  ): Promise<Creative[]> {
    const variants = await mutationService.generateMutations(this, type);

    for (const variant of variants) {
      DomainEvents.raise(new MutationGenerated({
        parentId: this.id,
        childId: variant.id,
        type,
        timestamp: Date.now()
      }));
    }

    return variants;
  }
}
```

## Related Documents
- [DDD: Creative Evolution - Entities](./002-entities.md)
- [DDD: Creative Evolution - Domain Events](./003-domain-events.md)
- [ADR: Attention Mechanisms](../../adr/ruvector-integration/002-attention-mechanisms.md)
