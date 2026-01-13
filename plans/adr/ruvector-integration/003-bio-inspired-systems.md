# ADR-RV003: Bio-Inspired Neural Systems for Marketing Intelligence

## Status
**Proposed** | Date: 2026-01-13

## Context

Marketing optimization requires capabilities beyond traditional ML:

1. **One-shot learning** - Immediately learn from single conversion events
2. **Instant decisions** - Sub-millisecond bid adjustments
3. **Sparse representations** - Efficient encoding of diverse creative concepts
4. **Attention bottlenecks** - Focus on 4-7 most relevant signals (Miller's Law)
5. **Self-organizing coordination** - Decentralized agent governance

Ruvector provides bio-inspired neural systems that address these needs:

- **ruvector-nervous-system** - BTSP, HDC, WTA, Global Workspace
- **ruvector-exotic-wasm** - NAO, Morphogenetic Networks, Time Crystals

## Decision

We will integrate ruvector's bio-inspired systems for advanced marketing intelligence.

### Bio-Inspired Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BIO-INSPIRED MARKETING INTELLIGENCE                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     NERVOUS SYSTEM LAYER                            │   │
│  │                                                                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │   │
│  │  │    BTSP     │  │     HDC     │  │    WTA/     │  │  Global   │  │   │
│  │  │  One-Shot   │  │ Hypervector │  │   K-WTA     │  │ Workspace │  │   │
│  │  │  Learning   │  │  10K-bit    │  │  Decisions  │  │ Attention │  │   │
│  │  │             │  │             │  │             │  │           │  │   │
│  │  │• Instant    │  │• Sparse     │  │• Winner     │  │• 7±2 items│  │   │
│  │  │  pattern    │  │  encoding   │  │  selection  │  │• Broadcast│  │   │
│  │  │  learning   │  │• XOR bind   │  │• <1µs       │  │• Salience │  │   │
│  │  │• No epochs  │  │• 10^40 cap  │  │  latency    │  │  ranking  │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     EXOTIC COORDINATION LAYER                       │   │
│  │                                                                      │   │
│  │  ┌───────────────────┐  ┌───────────────────┐  ┌─────────────────┐ │   │
│  │  │        NAO        │  │   Morphogenetic   │  │  Time Crystal   │ │   │
│  │  │  Neural Autonomous│  │     Network       │  │   Coordinator   │ │   │
│  │  │    Organization   │  │                   │  │                 │ │   │
│  │  │                   │  │                   │  │                 │ │   │
│  │  │• Stake-weighted   │  │• Emergent         │  │• Period-doubled │ │   │
│  │  │  voting           │  │  topology         │  │  oscillations   │ │   │
│  │  │• Quadratic votes  │  │• Growth/pruning   │  │• Floquet        │ │   │
│  │  │• Quorum consensus │  │• Differentiation  │  │  engineering    │ │   │
│  │  └───────────────────┘  └───────────────────┘  └─────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Marketing Applications

#### 1. BTSP for One-Shot Conversion Learning

**Problem:** A conversion event is rare and valuable. Traditional ML needs thousands of examples.

**Solution:** BTSP (Behavioral Timescale Synaptic Plasticity) learns from single events.

```typescript
// intelligence/one-shot-learning.ts
import { BTSPLayer } from '@ruvector/nervous-system-wasm';

export class ConversionLearner {
  private btsp: BTSPLayer;

  constructor() {
    // 384-dim embeddings, 2000ms time constant
    this.btsp = new BTSPLayer(384, 2000.0);
  }

  async learnFromConversion(conversion: ConversionEvent): Promise<void> {
    // Extract pattern from conversion context
    const pattern = await this.extractConversionPattern(conversion);

    // One-shot association - immediate learning
    this.btsp.one_shot_associate(
      pattern,
      conversion.value // Learning strength proportional to value
    );

    // Pattern is now retrievable for similar contexts
  }

  async predictConversionLikelihood(context: MarketingContext): Promise<number> {
    const contextEmbedding = await this.embedContext(context);

    // Forward pass retrieves learned associations
    const output = this.btsp.forward(contextEmbedding);

    // Higher output = stronger match to conversion patterns
    return this.sigmoid(output.reduce((a, b) => a + b, 0));
  }

  private extractConversionPattern(conversion: ConversionEvent): Float32Array {
    // Combine: creative embedding + audience embedding + context
    return new Float32Array([
      ...conversion.creative.embedding,
      ...conversion.audience.embedding,
      ...conversion.context.features
    ].slice(0, 384));
  }
}
```

#### 2. HDC for Creative Concept Encoding

**Problem:** Creative elements (hook, promise, frame) need efficient compositional encoding.

**Solution:** Hyperdimensional Computing with 10,000-bit vectors for massive capacity.

```typescript
// intelligence/creative-hdc.ts
import { Hypervector, HdcMemory } from '@ruvector/nervous-system-wasm';

export class CreativeHDC {
  private memory: HdcMemory;
  private conceptVectors: Map<string, Hypervector>;

  constructor() {
    this.memory = new HdcMemory();
    this.conceptVectors = new Map();
    this.initializeBaseVectors();
  }

  private initializeBaseVectors(): void {
    // Base concept vectors (random, nearly orthogonal)
    const concepts = [
      // Hook types
      'QUESTION', 'STATISTIC', 'STORY', 'CHALLENGE', 'CONTRAST',
      // Promise types
      'TRANSFORMATION', 'SOLUTION', 'BENEFIT', 'EXCLUSIVITY',
      // Frame types
      'FEAR', 'DESIRE', 'CURIOSITY', 'URGENCY', 'TRUST',
      // CTA types
      'LEARN', 'BUY', 'SIGN_UP', 'DOWNLOAD', 'CONTACT'
    ];

    for (const concept of concepts) {
      this.conceptVectors.set(concept, Hypervector.random());
    }
  }

  encodeCreative(creative: Creative): Hypervector {
    // Get base vectors
    const hookVec = this.conceptVectors.get(creative.genome.hook.type)!;
    const promiseVec = this.conceptVectors.get(creative.genome.promise.category)!;
    const frameVec = this.conceptVectors.get(creative.genome.frame.emotion)!;
    const ctaVec = this.conceptVectors.get(creative.genome.cta.type)!;

    // Bind components together (XOR - associative, commutative)
    const bound = hookVec
      .bind(promiseVec)
      .bind(frameVec)
      .bind(ctaVec);

    // Store in memory for retrieval
    this.memory.store(creative.id, bound);

    return bound;
  }

  findSimilarCreatives(creative: Creative, threshold: number = 0.7): string[] {
    const encoded = this.encodeCreative(creative);

    // Retrieve similar (Hamming distance < threshold)
    return this.memory.retrieve(encoded, threshold);
  }

  decomposeCreative(encoded: Hypervector): DecomposedGenome {
    // Unbind to find constituent concepts
    const results: DecomposedGenome = {
      hook: null, promise: null, frame: null, cta: null
    };

    for (const [concept, vec] of this.conceptVectors) {
      const similarity = encoded.similarity(vec);

      if (similarity > 0.7) {
        // High similarity = this concept is present
        if (['QUESTION', 'STATISTIC', 'STORY', 'CHALLENGE', 'CONTRAST'].includes(concept)) {
          results.hook = { type: concept, confidence: similarity };
        } else if (['TRANSFORMATION', 'SOLUTION', 'BENEFIT', 'EXCLUSIVITY'].includes(concept)) {
          results.promise = { category: concept, confidence: similarity };
        }
        // ... etc
      }
    }

    return results;
  }
}
```

#### 3. WTA for Instant Bid Decisions

**Problem:** Real-time bidding requires sub-millisecond decisions.

**Solution:** Winner-Take-All for instant competitive selection.

```typescript
// intelligence/instant-bidding.ts
import { WTALayer, KWTALayer } from '@ruvector/nervous-system-wasm';

export class InstantBidder {
  private wta: WTALayer;
  private kwta: KWTALayer;

  constructor() {
    // 1000 bid candidates, threshold 0.5, inhibition 0.8
    this.wta = new WTALayer(1000, 0.5, 0.8);
    // K-WTA for top 10 selections
    this.kwta = new KWTALayer(1000, 10);
  }

  async selectBestBid(bidCandidates: BidCandidate[]): Promise<BidCandidate> {
    // Convert candidates to activation values
    const activations = new Float32Array(bidCandidates.map(c =>
      c.expectedROAS * c.confidence - c.risk
    ));

    // WTA selects single winner in <1µs
    const winnerIdx = this.wta.compete(activations);

    return bidCandidates[winnerIdx];
  }

  async selectTopBids(bidCandidates: BidCandidate[], k: number): Promise<BidCandidate[]> {
    const activations = new Float32Array(bidCandidates.map(c =>
      c.expectedROAS * c.confidence - c.risk
    ));

    // K-WTA selects top K in <10µs
    const winnerIndices = this.kwta.select(activations);

    return winnerIndices.map(i => bidCandidates[i]);
  }
}
```

#### 4. Global Workspace for Agent Attention

**Problem:** 15+ agents generate many signals. Need to focus on most important.

**Solution:** Global Workspace (Baars' theory) with 7±2 item limit.

```typescript
// intelligence/agent-workspace.ts
import { GlobalWorkspace, WorkspaceItem } from '@ruvector/nervous-system-wasm';

export class AgentWorkspace {
  private workspace: GlobalWorkspace;

  constructor() {
    // Miller's Law: 7 ± 2 items
    this.workspace = new GlobalWorkspace(7);
  }

  async broadcastSignal(signal: AgentSignal): Promise<void> {
    const item = new WorkspaceItem(
      new Float32Array(signal.embedding),
      signal.salience,      // Importance score 0-1
      signal.agentId,       // Source agent
      Date.now()            // Timestamp
    );

    // Broadcast competes for workspace slots
    // Low salience items get pushed out
    this.workspace.broadcast(item);
  }

  async getActiveSignals(): Promise<AgentSignal[]> {
    // Returns only the 7 most salient items
    const items = this.workspace.get_active_items();

    return items.map(item => ({
      embedding: Array.from(item.content),
      salience: item.salience,
      agentId: item.source,
      timestamp: item.timestamp
    }));
  }

  async shouldAgentAct(agentId: string): Promise<boolean> {
    // Agent should act only if its signal is in workspace
    const active = await this.getActiveSignals();
    return active.some(s => s.agentId === agentId);
  }
}
```

#### 5. NAO for Agent Governance

**Problem:** 15+ agents need decentralized decision-making.

**Solution:** Neural Autonomous Organization with stake-weighted voting.

```typescript
// coordination/agent-nao.ts
import { WasmNAO } from '@ruvector/exotic-wasm';

export class AgentGovernance {
  private nao: WasmNAO;

  constructor() {
    // 70% quorum required for proposals
    this.nao = new WasmNAO(0.7);
  }

  async registerAgent(agentId: string, tier: number): Promise<void> {
    // Tier 1 agents have higher stake
    const stake = [100, 75, 50, 40, 30][tier - 1];
    this.nao.addMember(agentId, stake);
  }

  async proposeOptimization(
    optimization: OptimizationAction
  ): Promise<ProposalResult> {
    // Create proposal
    const proposalId = this.nao.propose(
      `${optimization.type}: ${optimization.description}`
    );

    // Collect votes from relevant agents
    const voters = await this.getRelevantAgents(optimization);

    for (const agent of voters) {
      const confidence = await agent.evaluateOptimization(optimization);
      this.nao.vote(proposalId, agent.id, confidence);
    }

    // Execute if quorum reached
    const executed = this.nao.execute(proposalId);

    return {
      proposalId,
      executed,
      votingResults: this.nao.getProposalStats(proposalId)
    };
  }
}
```

#### 6. Morphogenetic Network for Swarm Topology

**Problem:** Agent network should self-organize based on task patterns.

**Solution:** Morphogenetic growth/pruning for emergent topology.

```typescript
// coordination/swarm-morphology.ts
import { WasmMorphogeneticNetwork } from '@ruvector/exotic-wasm';

export class SwarmMorphology {
  private network: WasmMorphogeneticNetwork;

  constructor() {
    // 15x15 grid for 15 agents
    this.network = new WasmMorphogeneticNetwork(15, 15);
  }

  async initializeFromAgents(agents: Agent[]): Promise<void> {
    // Seed signaling cells for tier-1 agents
    const tier1Agents = agents.filter(a => a.tier === 1);

    for (const agent of tier1Agents) {
      const position = this.agentToGridPosition(agent);
      this.network.seedSignaling(position.x, position.y);
    }
  }

  async evolveTopology(interactions: AgentInteraction[]): Promise<void> {
    // Record interaction strengths
    for (const interaction of interactions) {
      const fromPos = this.agentToGridPosition(interaction.from);
      const toPos = this.agentToGridPosition(interaction.to);

      // Strengthen connection based on interaction success
      this.network.strengthen(fromPos, toPos, interaction.successRate);
    }

    // Grow network (10% growth rate)
    for (let i = 0; i < 100; i++) {
      this.network.grow(0.1);
    }

    // Differentiate cells into specialized agents
    this.network.differentiate();

    // Prune weak connections (10% threshold)
    this.network.prune(0.1);
  }

  async getOptimalConnections(): Promise<AgentConnection[]> {
    return this.network.getConnections().map(c => ({
      from: this.gridPositionToAgent(c.from),
      to: this.gridPositionToAgent(c.to),
      strength: c.weight
    }));
  }
}
```

#### 7. Time Crystal for Distributed Coordination

**Problem:** Agents need synchronized decision-making without central clock.

**Solution:** Time Crystal oscillations for robust coordination.

```typescript
// coordination/time-crystal.ts
import { WasmTimeCrystal } from '@ruvector/exotic-wasm';

export class DistributedCoordinator {
  private crystal: WasmTimeCrystal;

  constructor() {
    // 15 oscillators (one per agent), 100ms period
    this.crystal = new WasmTimeCrystal(15, 100);
  }

  async initialize(): Promise<void> {
    // Crystallize - establish period-doubled pattern
    this.crystal.crystallize();
  }

  async tick(): Promise<CoordinationPattern> {
    // Get current pattern
    const pattern = this.crystal.tick();

    return {
      // Agents with phase 1 should act this tick
      activeAgents: pattern.map((phase, i) => phase > 0.5 ? i : -1).filter(i => i >= 0),
      synchronization: this.crystal.orderParameter(),
      phasePattern: Array.from(pattern)
    };
  }

  async shouldAgentActNow(agentIndex: number): Promise<boolean> {
    const pattern = await this.tick();
    return pattern.activeAgents.includes(agentIndex);
  }
}
```

### Performance Characteristics

| Component | Operation | Latency | Capacity |
|-----------|-----------|---------|----------|
| BTSP | One-shot associate | Immediate | Unlimited patterns |
| HDC | Bind operation | <50ns | 10^40 vectors |
| HDC | Similarity | <100ns | - |
| WTA | Compete | <1µs | 1000+ candidates |
| K-WTA | Select top-k | <10µs | 1000+ candidates |
| Global Workspace | Broadcast | <10µs | 7±2 items |
| NAO | Vote | <1ms | 100+ members |
| Morphogenetic | Grow | <5ms | 1000x1000 grid |
| Time Crystal | Tick | <100µs | 256 oscillators |

## Consequences

### Positive
1. **Instant learning** - BTSP eliminates training delays
2. **Efficient encoding** - HDC 10K-bit vectors with 10^40 capacity
3. **Sub-millisecond decisions** - WTA for real-time bidding
4. **Focused attention** - Global Workspace prevents overload
5. **Self-organization** - Morphogenetic topology evolution
6. **Robust coordination** - Time Crystal sync without central clock

### Negative
1. **Complexity** - Bio-inspired systems have unconventional APIs
2. **Tuning** - Parameters (tau, curvature) require experimentation
3. **Debugging** - Emergent behavior harder to trace

### Mitigations
1. Comprehensive documentation with marketing examples
2. Parameter presets for common scenarios
3. Detailed logging and visualization tools

## Related Documents
- [ADR-RV001: Integration Strategy](./001-integration-strategy.md)
- [ADR-RV002: Attention Mechanisms](./002-attention-mechanisms.md)
- [DDD: Agent Swarm Domain](../../ddd/agent-swarm/001-domain-overview.md)
