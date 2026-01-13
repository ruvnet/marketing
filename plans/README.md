# AI Marketing Swarms - Architecture Decision Records & Domain-Driven Design

## Project Overview

This directory contains comprehensive Architecture Decision Records (ADRs) and Domain-Driven Design (DDD) documentation for the **AI Marketing Swarms** platform - an agentic media buying system built on Google Cloud with ruvector WASM integration.

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Runtime** | Rust + WASM | High-performance vector operations, GNN inference |
| **Bindings** | TypeScript + napi-rs/wasm-bindgen | Native Node.js and browser integration |
| **Cloud** | Google Cloud Platform | Firestore, Functions, Cloud Run, Analytics |
| **Orchestration** | Claude-Flow v3 | 15-agent hierarchical mesh coordination |
| **Vector Engine** | ruvector | Hyperbolic vectors, GNN, attention mechanisms |

## Document Structure

```
plans/
├── README.md                           # This file
├── adr/                                # Architecture Decision Records
│   ├── architecture/
│   │   ├── 001-system-overview.md      # High-level system architecture
│   │   ├── 002-rust-wasm-strategy.md   # Rust/WASM implementation approach
│   │   └── 003-event-driven-design.md  # Event sourcing patterns
│   ├── google-cloud/
│   │   ├── 001-infrastructure.md       # GCP infrastructure decisions
│   │   ├── 002-firestore-schema.md     # Database design
│   │   ├── 003-cloud-functions.md      # Serverless functions
│   │   └── 004-cloud-run-services.md   # Container services
│   ├── ruvector-integration/
│   │   ├── 001-integration-strategy.md # Ruvector integration approach
│   │   ├── 002-attention-mechanisms.md # 39 attention types usage
│   │   ├── 003-hyperbolic-vectors.md   # Hyperbolic embedding strategy
│   │   └── 004-gnn-learning.md         # Graph neural network learning
│   ├── api-security/
│   │   ├── 001-api-design.md           # API architecture
│   │   ├── 002-google-secrets.md       # Secrets management
│   │   └── 003-authentication.md       # Auth patterns
│   └── swarm-config/
│       ├── 001-claude-flow-v3.md       # 15-agent swarm configuration
│       ├── 002-agent-types.md          # Agent specializations
│       └── 003-coordination-patterns.md # Inter-agent communication
│
└── ddd/                                # Domain-Driven Design
    ├── agent-swarm/
    │   ├── 001-domain-overview.md      # Swarm coordination domain
    │   ├── 002-bounded-contexts.md     # Context boundaries
    │   └── 003-aggregates.md           # Domain aggregates
    ├── marketing-intelligence/
    │   ├── 001-domain-overview.md      # Intelligence & prediction
    │   ├── 002-value-objects.md        # Domain value objects
    │   └── 003-services.md             # Domain services
    ├── creative-evolution/
    │   ├── 001-domain-overview.md      # Creative mutation domain
    │   ├── 002-entities.md             # Core entities
    │   └── 003-domain-events.md        # Event definitions
    ├── attribution-analytics/
    │   ├── 001-domain-overview.md      # Causal attribution domain
    │   ├── 002-bounded-contexts.md     # Analytics contexts
    │   └── 003-repositories.md         # Data repositories
    └── campaign-optimization/
        ├── 001-domain-overview.md      # Campaign optimization domain
        ├── 002-aggregates.md           # Campaign aggregates
        └── 003-policies.md             # Business policies
```

## Agent Swarm Architecture (15 Agents)

The Claude-Flow v3 swarm consists of 15 specialized agents organized in a hierarchical mesh:

### Tier 1: Coordination (3 Agents)
1. **Orchestrator Agent** - Master coordinator for swarm operations
2. **Memory Agent** - Cross-session state management via ruvector
3. **Quality Agent** - Output validation and truth-scoring

### Tier 2: Intelligence (4 Agents)
4. **Simulation Agent** - Monte Carlo outcome prediction
5. **Historical Memory Agent** - Pattern retrieval from vector store
6. **Risk Detection Agent** - Spend trap identification
7. **Attention Arbitrage Agent** - Underpriced attention discovery

### Tier 3: Creative (3 Agents)
8. **Creative Genome Agent** - Ad DNA decomposition
9. **Fatigue Forecaster Agent** - Decay curve prediction
10. **Mutation Agent** - Creative variant generation

### Tier 4: Attribution (3 Agents)
11. **Counterfactual Agent** - What-if analysis
12. **Causal Graph Builder Agent** - Influence mapping
13. **Incrementality Auditor Agent** - True lift measurement

### Tier 5: Operations (2 Agents)
14. **Account Health Agent** - Self-healing operations
15. **Cross-Platform Agent** - Multi-channel intelligence

## Key Ruvector Capabilities for Marketing

| Capability | Ruvector Component | Marketing Application |
|------------|-------------------|----------------------|
| **Semantic Search** | HNSW Index (61µs latency) | Similar campaign discovery |
| **GNN Learning** | ruvector-gnn | Campaign pattern learning |
| **Hyperbolic Embeddings** | Poincaré + Lorentz | Audience hierarchy modeling |
| **39 Attention Mechanisms** | ruvector-attention | Creative performance prediction |
| **SONA Adaptation** | ruvector-sona | Real-time bid optimization |
| **Tiny Dancer Routing** | ruvector-tiny-dancer | LLM cost reduction (70-85%) |
| **Graph Queries** | Cypher support | Attribution path analysis |
| **Dynamic Min-Cut** | ruvector-mincut | Budget allocation optimization |

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- Google Cloud infrastructure setup
- Ruvector WASM integration
- Core vector database deployment

### Phase 2: Intelligence Layer (Weeks 3-4)
- GNN model training pipeline
- Attention mechanism integration
- SONA learning system

### Phase 3: Agent Swarm (Weeks 5-6)
- 15-agent Claude-Flow v3 configuration
- Inter-agent communication protocols
- Memory coordination via hooks

### Phase 4: Marketing Domains (Weeks 7-8)
- Campaign simulation engine
- Creative evolution system
- Attribution analytics

### Phase 5: Production (Weeks 9-10)
- Google Ads API integration
- Real-time optimization loops
- Monitoring and alerting

## Getting Started

```bash
# Initialize Claude-Flow v3 swarm
npx claude-flow@v3alpha swarm init --v3-mode --agents 15

# Start with hierarchical mesh topology
npx claude-flow@v3alpha swarm start -o "AI Marketing Swarms" -s production

# View swarm status
npx claude-flow@v3alpha swarm status
```

## Related Documentation

- [ruvector Documentation](../ruvector-upstream/README.md)
- [Claude-Flow v3 Guide](https://github.com/ruvnet/claude-flow)
- [Google Cloud Architecture](https://cloud.google.com/architecture)
