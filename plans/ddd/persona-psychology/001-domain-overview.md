# DDD: Dynamic Persona & Psychology Domain - Overview

## Domain Purpose

The **Dynamic Persona & Psychology Domain** replaces static user personas with real-time behavioral state modeling. Instead of treating users as fixed segments, it detects moment-based intent clusters and psychological states to serve contextually appropriate messaging.

> *"Personas are fake. Behavior isn't."* - Build.docx

## Strategic Classification

| Aspect | Classification |
|--------|----------------|
| **Domain Type** | Core Domain |
| **Business Value** | Critical - Enables moment-based targeting |
| **Complexity** | Very High - Psychology + ML |
| **Volatility** | High - Behavioral patterns evolve |

## Ubiquitous Language

| Term | Definition |
|------|------------|
| **Moment** | A specific psychological/behavioral state at a point in time |
| **Intent Cluster** | Group of users exhibiting similar momentary behavior |
| **Psychological State** | Detected emotional/cognitive state (stress, urgency, aspiration) |
| **Message Frame** | Emotional positioning of ad message (fear, desire, trust) |
| **Behavioral Signal** | Observable user action indicating state change |
| **State Transition** | Movement from one psychological state to another |
| **Conversion Probability** | Likelihood of conversion given current state |

## Domain Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   DYNAMIC PERSONA & PSYCHOLOGY DOMAIN MODEL                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         AGGREGATES                                   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              UserMoment (Aggregate Root)                     │   │   │
│  │  │                                                              │   │   │
│  │  │  • momentId: MomentId                                       │   │   │
│  │  │  • userId: UserId                                           │   │   │
│  │  │  • psychologicalState: PsychologicalState                   │   │   │
│  │  │  • intentSignals: IntentSignal[]                            │   │   │
│  │  │  • contextFactors: ContextFactors                           │   │   │
│  │  │  • conversionProbability: number                            │   │   │
│  │  │  • recommendedFrames: MessageFrame[]                        │   │   │
│  │  │  • timestamp: Timestamp                                     │   │   │
│  │  │                                                              │   │   │
│  │  │  + detectStateChange(signal: BehavioralSignal): boolean     │   │   │
│  │  │  + updatePsychologicalState(state: PsychState): void        │   │   │
│  │  │  + calculateConversionProbability(): number                 │   │   │
│  │  │  + selectOptimalFrame(): MessageFrame                       │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              IntentCluster (Aggregate Root)                  │   │   │
│  │  │                                                              │   │   │
│  │  │  • clusterId: ClusterId                                     │   │   │
│  │  │  • name: string                                             │   │   │
│  │  │  • centroid: Embedding                                      │   │   │
│  │  │  • members: UserId[]                                        │   │   │
│  │  │  • dominantState: PsychologicalState                        │   │   │
│  │  │  • optimalFrames: MessageFrame[]                            │   │   │
│  │  │  • avgConversionRate: number                                │   │   │
│  │  │                                                              │   │   │
│  │  │  + addMember(userId: UserId, moment: UserMoment): void      │   │   │
│  │  │  + removeMember(userId: UserId): void                       │   │   │
│  │  │  + updateCentroid(): void                                   │   │   │
│  │  │  + getRecommendations(): ClusterRecommendations             │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              StateTransitionModel (Aggregate Root)           │   │   │
│  │  │                                                              │   │   │
│  │  │  • modelId: ModelId                                         │   │   │
│  │  │  • transitionMatrix: Map<StateKey, TransitionProbabilities> │   │   │
│  │  │  • triggerPatterns: TriggerPattern[]                        │   │   │
│  │  │  • learningRate: number                                     │   │   │
│  │  │                                                              │   │   │
│  │  │  + predictNextState(current: PsychState): PsychState        │   │   │
│  │  │  + recordTransition(from: PsychState, to: PsychState): void │   │   │
│  │  │  + identifyTriggers(signals: BehavioralSignal[]): Trigger[] │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       VALUE OBJECTS                                  │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │               PsychologicalState (Value Object)              │   │   │
│  │  │                                                              │   │   │
│  │  │  • stressLevel: number (0-1)                                │   │   │
│  │  │  • urgencyLevel: number (0-1)                               │   │   │
│  │  │  • financialAnxiety: number (0-1)                           │   │   │
│  │  │  • aspirationVsFear: number (-1 to 1)                       │   │   │
│  │  │  • decisionReadiness: number (0-1)                          │   │   │
│  │  │  • trustLevel: number (0-1)                                 │   │   │
│  │  │                                                              │   │   │
│  │  │  + dominantEmotion(): Emotion                               │   │   │
│  │  │  + isActionReady(): boolean                                 │   │   │
│  │  │  + compatibleFrames(): MessageFrame[]                       │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │               MessageFrame (Value Object)                    │   │   │
│  │  │                                                              │   │   │
│  │  │  • type: FrameType (FEAR | DESIRE | CURIOSITY | URGENCY |   │   │   │
│  │  │          TRUST | SOCIAL_PROOF | SCARCITY | AUTHORITY)       │   │   │
│  │  │  • intensity: number (0-1)                                  │   │   │
│  │  │  • embedding: Embedding                                     │   │   │
│  │  │                                                              │   │   │
│  │  │  + matchScore(state: PsychologicalState): number            │   │   │
│  │  │  + generateCopy(template: string): string                   │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │               IntentSignal (Value Object)                    │   │   │
│  │  │                                                              │   │   │
│  │  │  • type: SignalType                                         │   │   │
│  │  │  • strength: number                                         │   │   │
│  │  │  • source: SignalSource                                     │   │   │
│  │  │  • timestamp: Timestamp                                     │   │   │
│  │  │  • embedding: Embedding                                     │   │   │
│  │  │                                                              │   │   │
│  │  │  Types: PURCHASE_INTENT | RESEARCH_PHASE | COMPARISON |     │   │   │
│  │  │         ABANDONMENT_RISK | PRICE_SENSITIVITY |              │   │   │
│  │  │         URGENCY_DETECTED | TRUST_BUILDING                   │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │               ContextFactors (Value Object)                  │   │   │
│  │  │                                                              │   │   │
│  │  │  • timeOfDay: TimeSlot                                      │   │   │
│  │  │  • dayOfWeek: DayType                                       │   │   │
│  │  │  • deviceType: DeviceType                                   │   │   │
│  │  │  • sessionDuration: number                                  │   │   │
│  │  │  • pageDepth: number                                        │   │   │
│  │  │  • previousTouchpoints: number                              │   │   │
│  │  │  • externalEvents: ExternalEvent[]                          │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       DOMAIN SERVICES                                │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              MomentDetectionService                          │   │   │
│  │  │                                                              │   │   │
│  │  │  - btspLayer: BTSPLayer                                     │   │   │
│  │  │  - signalClassifier: SignalClassifier                       │   │   │
│  │  │                                                              │   │   │
│  │  │  + detectMoment(signals: BehavioralSignal[]): UserMoment    │   │   │
│  │  │  + classifyIntent(signal: BehavioralSignal): IntentSignal   │   │   │
│  │  │  + extractContextFactors(session: Session): ContextFactors  │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              PsychologicalStateModeler                       │   │   │
│  │  │                                                              │   │   │
│  │  │  - gnnModel: RuvectorGNN                                    │   │   │
│  │  │  - attentionLayer: HyperbolicAttention                      │   │   │
│  │  │                                                              │   │   │
│  │  │  + inferState(signals: IntentSignal[]): PsychologicalState  │   │   │
│  │  │  + predictStateTransition(state, trigger): PsychState       │   │   │
│  │  │  + getStateLikelihood(user, state): number                  │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              MessageFrameSelector                            │   │   │
│  │  │                                                              │   │   │
│  │  │  - moeAttention: MoEAttention                               │   │   │
│  │  │  - frameLibrary: FrameLibrary                               │   │   │
│  │  │                                                              │   │   │
│  │  │  + selectFrame(state: PsychState, context): MessageFrame    │   │   │
│  │  │  + rankFrames(state: PsychState): RankedFrame[]             │   │   │
│  │  │  + adaptFrame(frame, intensity): MessageFrame               │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              ConversionProbabilityService                    │   │   │
│  │  │                                                              │   │   │
│  │  │  - sonaEngine: SonaEngine                                   │   │   │
│  │  │  - historicalData: ConversionHistory                        │   │   │
│  │  │                                                              │   │   │
│  │  │  + calculate(moment: UserMoment): number                    │   │   │
│  │  │  + predictWithFrame(moment, frame): number                  │   │   │
│  │  │  + getContributingFactors(moment): Factor[]                 │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              IntentClusteringService                         │   │   │
│  │  │                                                              │   │   │
│  │  │  - hnswIndex: RuvectorCore                                  │   │   │
│  │  │  - kMeans: KMeansClustering                                 │   │   │
│  │  │                                                              │   │   │
│  │  │  + clusterUsers(moments: UserMoment[]): IntentCluster[]     │   │   │
│  │  │  + assignToCluster(moment: UserMoment): ClusterId           │   │   │
│  │  │  + updateClusters(newMoments: UserMoment[]): void           │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       AGENTS (4)                                     │   │
│  │                                                                      │   │
│  │  1. Moment Detection Agent                                          │   │
│  │     • Monitors behavioral signals in real-time                      │   │
│  │     • Triggers state detection on signal patterns                   │   │
│  │     • Uses BTSP for one-shot pattern learning                       │   │
│  │                                                                      │   │
│  │  2. Psychological State Modeler Agent                               │   │
│  │     • Infers psychological state from signals                       │   │
│  │     • Maintains state transition model                              │   │
│  │     • Uses GNN for pattern recognition                              │   │
│  │                                                                      │   │
│  │  3. Message Frame Selector Agent                                    │   │
│  │     • Selects optimal message frame for state                       │   │
│  │     • Adapts frame intensity based on context                       │   │
│  │     • Uses MoE attention for expert routing                         │   │
│  │                                                                      │   │
│  │  4. Conversion Probability Agent                                    │   │
│  │     • Calculates real-time conversion probability                   │   │
│  │     • Predicts impact of different frames                           │   │
│  │     • Uses SONA for adaptive learning                               │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       DOMAIN EVENTS                                  │   │
│  │                                                                      │   │
│  │  • MomentDetected { userId, momentId, signals, timestamp }          │   │
│  │  • StateChanged { userId, fromState, toState, trigger, timestamp }  │   │
│  │  • ClusterAssigned { userId, clusterId, similarity, timestamp }     │   │
│  │  • FrameSelected { userId, momentId, frame, probability, timestamp }│   │
│  │  • ConversionPredicted { userId, probability, factors, timestamp }  │   │
│  │  • IntentDetected { userId, intentType, strength, timestamp }       │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Psychological State Dimensions

| Dimension | Range | Low State | High State | Marketing Implication |
|-----------|-------|-----------|------------|----------------------|
| **Stress Level** | 0-1 | Relaxed | Stressed | Calming vs urgent messaging |
| **Urgency Level** | 0-1 | Browsing | Time-sensitive | Soft vs hard CTAs |
| **Financial Anxiety** | 0-1 | Comfortable | Concerned | Value vs premium framing |
| **Aspiration vs Fear** | -1 to 1 | Fear-driven | Aspiration-driven | Loss aversion vs gain |
| **Decision Readiness** | 0-1 | Research | Ready to buy | Education vs conversion |
| **Trust Level** | 0-1 | Skeptical | Trusting | Proof vs benefits |

## Implementation Example

```typescript
// services/moment-detection.service.ts
import { BTSPLayer } from '@ruvector/nervous-system-wasm';
import { HyperbolicAttention } from '@ruvector/attention';

export class MomentDetectionService {
  private btsp: BTSPLayer;
  private attention: HyperbolicAttention;

  constructor() {
    this.btsp = new BTSPLayer(256, 2000.0);
    this.attention = new HyperbolicAttention({ curvature: -1.0 });
  }

  async detectMoment(
    userId: string,
    signals: BehavioralSignal[]
  ): Promise<UserMoment> {
    // 1. Extract intent signals
    const intentSignals = signals.map(s => this.classifyIntent(s));

    // 2. Compute attention over signals (hyperbolic for hierarchy)
    const signalEmbeddings = intentSignals.map(s => s.embedding);
    const attendedSignals = this.attention.compute(
      this.getUserEmbedding(userId),
      signalEmbeddings,
      signalEmbeddings
    );

    // 3. One-shot learn this pattern
    this.btsp.one_shot_associate(attendedSignals, 1.0);

    // 4. Infer psychological state
    const psychState = await this.inferPsychologicalState(intentSignals);

    // 5. Extract context
    const context = this.extractContextFactors(signals);

    // 6. Calculate conversion probability
    const convProb = await this.calculateConversionProbability(
      psychState, context
    );

    // 7. Select optimal frames
    const frames = this.selectOptimalFrames(psychState, context);

    return {
      momentId: generateId(),
      userId,
      psychologicalState: psychState,
      intentSignals,
      contextFactors: context,
      conversionProbability: convProb,
      recommendedFrames: frames,
      timestamp: Date.now()
    };
  }

  private async inferPsychologicalState(
    signals: IntentSignal[]
  ): Promise<PsychologicalState> {
    // Map signals to state dimensions
    const stressSignals = signals.filter(s =>
      ['ABANDONMENT_RISK', 'PRICE_SENSITIVITY'].includes(s.type)
    );
    const urgencySignals = signals.filter(s =>
      ['URGENCY_DETECTED', 'PURCHASE_INTENT'].includes(s.type)
    );

    return {
      stressLevel: this.average(stressSignals.map(s => s.strength)),
      urgencyLevel: this.average(urgencySignals.map(s => s.strength)),
      financialAnxiety: this.detectFinancialAnxiety(signals),
      aspirationVsFear: this.detectAspirationVsFear(signals),
      decisionReadiness: this.detectDecisionReadiness(signals),
      trustLevel: this.detectTrustLevel(signals)
    };
  }

  private selectOptimalFrames(
    state: PsychologicalState,
    context: ContextFactors
  ): MessageFrame[] {
    const frames: MessageFrame[] = [];

    // High stress + financial anxiety → Trust + Social Proof
    if (state.stressLevel > 0.7 && state.financialAnxiety > 0.6) {
      frames.push({ type: 'TRUST', intensity: 0.8 });
      frames.push({ type: 'SOCIAL_PROOF', intensity: 0.7 });
    }

    // High urgency + decision ready → Scarcity + Urgency
    if (state.urgencyLevel > 0.7 && state.decisionReadiness > 0.7) {
      frames.push({ type: 'SCARCITY', intensity: 0.8 });
      frames.push({ type: 'URGENCY', intensity: 0.9 });
    }

    // Aspiration-driven → Desire + Transformation
    if (state.aspirationVsFear > 0.5) {
      frames.push({ type: 'DESIRE', intensity: state.aspirationVsFear });
    }

    // Fear-driven → Loss Aversion
    if (state.aspirationVsFear < -0.3) {
      frames.push({ type: 'FEAR', intensity: Math.abs(state.aspirationVsFear) });
    }

    return frames.slice(0, 3); // Top 3 frames
  }
}
```

## Related Documents
- [ADR-RV003: Bio-Inspired Systems](../../adr/ruvector-integration/003-bio-inspired-systems.md)
- [DDD: Creative Evolution Domain](../creative-evolution/001-domain-overview.md)
- [ADR-SW001: Claude-Flow v3 Swarm](../../adr/swarm-config/001-claude-flow-v3.md)
