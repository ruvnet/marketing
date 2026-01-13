# ADR-001: AI Marketing Swarms System Architecture Overview

## Status
**Proposed** | Date: 2026-01-13

## Context

Traditional paid advertising platforms suffer from fundamental limitations:

1. **Delayed Feedback Loops** - Performance data arrives too late for optimization
2. **Platform Black Boxes** - Meta/Google control the algorithms
3. **Shallow Attribution** - Last-click attribution lies about causation
4. **Static Personas** - User segmentation doesn't adapt to behavioral states
5. **Manual Creative Cycles** - Human-driven creative iteration is slow
6. **Reactive Optimization** - Money burns before adjustments occur

The opportunity is to build an **agentic media buying** system that transforms paid advertising from spreadsheet management into a living, learning system.

## Decision

We will build a **15-agent AI Marketing Swarm** powered by:

1. **Claude-Flow v3** for hierarchical mesh agent coordination
2. **Ruvector WASM** for high-performance vector operations and GNN learning
3. **Google Cloud Platform** for scalable infrastructure
4. **Rust + TypeScript** for cross-platform performance

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AI MARKETING SWARMS                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    CLAUDE-FLOW V3 SWARM (15 Agents)                 │   │
│  │                                                                      │   │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │   │
│  │   │ Orchestrator│──│   Memory    │──│   Quality   │  ← Tier 1      │   │
│  │   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                │   │
│  │          │                │                │                        │   │
│  │   ┌──────┴────────────────┴────────────────┴──────┐                │   │
│  │   │         Intelligence Layer (4 Agents)         │  ← Tier 2      │   │
│  │   │  Simulation │ Historical │ Risk │ Arbitrage   │                │   │
│  │   └──────┬────────────────────────────────┬───────┘                │   │
│  │          │                                │                        │   │
│  │   ┌──────┴──────┐              ┌─────────┴─────────┐              │   │
│  │   │  Creative   │              │   Attribution     │              │   │
│  │   │   Layer     │              │      Layer        │              │   │
│  │   │ (3 Agents)  │              │   (3 Agents)      │  ← Tier 3/4   │   │
│  │   └──────┬──────┘              └─────────┬─────────┘              │   │
│  │          │                                │                        │   │
│  │   ┌──────┴────────────────────────────────┴──────┐                │   │
│  │   │         Operations Layer (2 Agents)          │  ← Tier 5      │   │
│  │   │      Account Health  │  Cross-Platform       │                │   │
│  │   └──────────────────────────────────────────────┘                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     RUVECTOR INTELLIGENCE LAYER                     │   │
│  │                                                                      │   │
│  │   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐       │   │
│  │   │   HNSW    │  │    GNN    │  │ Attention │  │   SONA    │       │   │
│  │   │  Vector   │  │  Learning │  │ Mechanisms│  │ Adaptive  │       │   │
│  │   │  Search   │  │   Layer   │  │ (39 types)│  │  Learning │       │   │
│  │   │  (61µs)   │  │           │  │           │  │  (<1ms)   │       │   │
│  │   └───────────┘  └───────────┘  └───────────┘  └───────────┘       │   │
│  │                                                                      │   │
│  │   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐       │   │
│  │   │Hyperbolic │  │   Tiny    │  │  Dynamic  │  │   DAG     │       │   │
│  │   │ Poincaré  │  │  Dancer   │  │  Min-Cut  │  │  Query    │       │   │
│  │   │  Lorentz  │  │  Router   │  │  (n^0.12) │  │  Optim    │       │   │
│  │   └───────────┘  └───────────┘  └───────────┘  └───────────┘       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      GOOGLE CLOUD PLATFORM                          │   │
│  │                                                                      │   │
│  │   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐       │   │
│  │   │ Firestore │  │  Cloud    │  │  Cloud    │  │  Google   │       │   │
│  │   │  (State)  │  │ Functions │  │   Run     │  │ Analytics │       │   │
│  │   │           │  │  (Events) │  │(Services) │  │   (Data)  │       │   │
│  │   └───────────┘  └───────────┘  └───────────┘  └───────────┘       │   │
│  │                                                                      │   │
│  │   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐       │   │
│  │   │  Secret   │  │   Pub/    │  │   Cloud   │  │  Vertex   │       │   │
│  │   │  Manager  │  │   Sub     │  │  Storage  │  │    AI     │       │   │
│  │   └───────────┘  └───────────┘  └───────────┘  └───────────┘       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      EXTERNAL INTEGRATIONS                          │   │
│  │                                                                      │   │
│  │   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐       │   │
│  │   │  Google   │  │   Meta    │  │  TikTok   │  │  LinkedIn │       │   │
│  │   │  Ads API  │  │ Marketing │  │   Ads     │  │    Ads    │       │   │
│  │   │           │  │    API    │  │    API    │  │    API    │       │   │
│  │   └───────────┘  └───────────┘  └───────────┘  └───────────┘       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Core System Components

#### 1. Claude-Flow V3 Swarm Layer
- **15-agent hierarchical mesh** coordination
- Event-sourced state management
- Domain-Driven Design architecture
- AgentDB with HNSW indexing (150x-12,500x faster)
- Flash Attention (2.49x-7.47x speedup)

#### 2. Ruvector Intelligence Layer
- **WASM-compiled** Rust core for browser/Node.js execution
- **napi-rs bindings** for native Node.js performance
- 39 attention mechanisms for different use cases
- Hyperbolic embeddings for hierarchical audience data
- SONA for runtime adaptive learning

#### 3. Google Cloud Infrastructure
- **Firestore** for campaign state and configuration
- **Cloud Functions** for event-driven processing
- **Cloud Run** for containerized services
- **Google Analytics** for conversion data
- **Secret Manager** for API credentials

#### 4. Platform Integrations
- Google Ads API for campaign management
- Meta Marketing API for Facebook/Instagram
- TikTok Ads API for short-form video
- LinkedIn Ads API for B2B

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Ad Platforms] ──► [Event Ingestion] ──► [Vector Embedding] ──►           │
│                                                                             │
│  ──► [HNSW Index] ──► [GNN Layer] ──► [Pattern Recognition] ──►            │
│                                                                             │
│  ──► [Agent Swarm] ──► [Decision Engine] ──► [Action Execution] ──►        │
│                                                                             │
│  ──► [Platform APIs] ──► [Performance Feedback] ──► [Learning Loop]        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Performance Targets

| Metric | Target | Ruvector Capability |
|--------|--------|---------------------|
| Vector Search | <1ms | HNSW (61µs p50) |
| GNN Inference | <10ms | SIMD-optimized |
| Attention Compute | <5ms | Flash Attention |
| SONA Adaptation | <1ms | MicroLoRA (45µs) |
| LLM Cost Reduction | 70-85% | Tiny Dancer routing |
| Memory Compression | 2-32x | Tiered quantization |

## Consequences

### Positive
1. **Predictive Optimization** - Pre-emptive action instead of reactive response
2. **Self-Learning** - System improves with every campaign interaction
3. **Cost Efficiency** - Significant LLM cost reduction through intelligent routing
4. **Cross-Platform Intelligence** - Unified learning across all ad platforms
5. **Scalable Architecture** - Cloud-native design handles any load

### Negative
1. **Complexity** - 15-agent system requires careful coordination
2. **Learning Curve** - Rust/WASM stack requires specialized skills
3. **Cost** - Google Cloud infrastructure has ongoing costs
4. **Integration Effort** - Multiple platform APIs to maintain

### Risks
1. **API Changes** - Platform APIs may change without notice
2. **Model Drift** - GNN patterns may need periodic retraining
3. **Privacy Regulations** - Data handling must comply with GDPR/CCPA

## Related Documents
- [ADR-002: Rust/WASM Strategy](./002-rust-wasm-strategy.md)
- [ADR-003: Event-Driven Design](./003-event-driven-design.md)
- [DDD: Agent Swarm Domain](../../ddd/agent-swarm/001-domain-overview.md)
