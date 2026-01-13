# ADR-002: Rust and WASM Implementation Strategy

## Status
**Proposed** | Date: 2026-01-13

## Context

The AI Marketing Swarms system requires high-performance vector operations, GNN inference, and attention mechanisms. These computations must run in multiple environments:

1. **Server-side** - Google Cloud Functions and Cloud Run
2. **Edge** - Browser-based analytics dashboards
3. **Hybrid** - Node.js backend services

We need to decide on the implementation approach that maximizes:
- Performance (sub-millisecond latency)
- Code reuse across platforms
- Developer productivity
- Long-term maintainability

## Decision

We will implement the core intelligence layer in **Rust** with dual bindings:

1. **WASM (wasm-bindgen)** for browser and universal JavaScript execution
2. **napi-rs** for native Node.js performance where WASM overhead is unacceptable

### Ruvector Crates Integration

We will integrate the following ruvector crates:

#### Core Vector Operations
```toml
[dependencies]
ruvector-core = "0.1.31"        # HNSW indexing, vector search
ruvector-collections = "0.1.31" # Namespace management
ruvector-filter = "0.1.31"      # Metadata filtering
```

#### Graph & GNN
```toml
[dependencies]
ruvector-graph = "0.1.31"       # Cypher queries, hypergraph
ruvector-gnn = "0.1.31"         # GNN layers, training
ruvector-gnn-wasm = "0.1.31"    # WASM bindings for GNN
ruvector-gnn-node = "0.1.31"    # napi-rs bindings for GNN
```

#### Attention Mechanisms
```toml
[dependencies]
ruvector-attention = "0.1.31"        # 39 attention types
ruvector-attention-wasm = "0.1.31"   # Browser attention
ruvector-attention-unified-wasm = "0.1.31" # Unified API
```

#### AI Routing & Learning
```toml
[dependencies]
ruvector-tiny-dancer-core = "0.1.31" # AI agent routing
ruvector-tiny-dancer-wasm = "0.1.31" # WASM routing
ruvector-sona = "0.1.31"             # Runtime adaptive learning
```

#### Specialized Capabilities
```toml
[dependencies]
ruvector-mincut = "0.1.31"      # Dynamic budget allocation
ruvector-dag = "0.1.31"         # Query optimization
ruvector-router-core = "0.1.31" # Semantic routing
```

### TypeScript Integration Layer

```typescript
// marketing-intelligence/src/lib.ts

// WASM imports for browser/universal
import init, {
  HnswIndex,
  GnnLayer,
  AttentionCompute,
  SonaEngine,
  TinyDancerRouter
} from '@ruvector/wasm';

// napi-rs imports for Node.js native performance
import {
  VectorDB,
  GraphDB,
  GNNLayer,
  SemanticRouter
} from 'ruvector';

// Auto-detection wrapper
export class MarketingIntelligence {
  private backend: 'wasm' | 'native';

  constructor() {
    this.backend = typeof process !== 'undefined' ? 'native' : 'wasm';
  }

  async initialize(): Promise<void> {
    if (this.backend === 'wasm') {
      await init();
    }
  }

  // Unified API regardless of backend
  async searchSimilarCampaigns(
    embedding: Float32Array,
    k: number
  ): Promise<SearchResult[]> {
    // Implementation uses appropriate backend
  }
}
```

### Project Structure

```
marketing-swarms/
├── Cargo.toml                    # Workspace root
├── crates/
│   ├── marketing-core/           # Core Rust library
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── lib.rs
│   │       ├── campaign/         # Campaign domain
│   │       ├── creative/         # Creative evolution
│   │       ├── attribution/      # Attribution logic
│   │       └── simulation/       # Monte Carlo engine
│   │
│   ├── marketing-wasm/           # WASM bindings
│   │   ├── Cargo.toml
│   │   └── src/
│   │       └── lib.rs            # wasm-bindgen exports
│   │
│   └── marketing-node/           # napi-rs bindings
│       ├── Cargo.toml
│       └── src/
│           └── lib.rs            # napi-rs exports
│
├── packages/
│   └── marketing-ts/             # TypeScript package
│       ├── package.json
│       ├── src/
│       │   ├── index.ts          # Main exports
│       │   ├── wasm/             # WASM wrappers
│       │   └── native/           # Native wrappers
│       └── tsconfig.json
│
└── functions/                    # Google Cloud Functions
    ├── campaign-events/
    ├── creative-mutation/
    └── attribution-compute/
```

### Build Configuration

#### WASM Build (wasm-pack)
```toml
# crates/marketing-wasm/Cargo.toml
[package]
name = "marketing-wasm"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
marketing-core = { path = "../marketing-core" }
wasm-bindgen = "0.2"
wasm-bindgen-futures = "0.4"
js-sys = "0.3"
getrandom = { version = "0.3", features = ["wasm_js"] }
ruvector-attention-wasm = "0.1.31"
ruvector-gnn-wasm = "0.1.31"
ruvector-sona = { version = "0.1.31", features = ["wasm"] }

[profile.release]
opt-level = "z"      # Size optimization
lto = true           # Link-time optimization
```

#### Node.js Build (napi-rs)
```toml
# crates/marketing-node/Cargo.toml
[package]
name = "marketing-node"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
marketing-core = { path = "../marketing-core" }
napi = { version = "2.16", default-features = false, features = ["napi9", "async", "tokio_rt"] }
napi-derive = "2.16"
ruvector-core = "0.1.31"
ruvector-gnn-node = "0.1.31"
ruvector-attention-node = "0.1.31"

[build-dependencies]
napi-build = "2.1"
```

### Performance Characteristics

| Operation | WASM | napi-rs | Use Case |
|-----------|------|---------|----------|
| Vector Search | 80µs | 61µs | Campaign similarity |
| GNN Forward | 15ms | 10ms | Pattern learning |
| Attention | 8ms | 5ms | Creative scoring |
| SONA Adapt | 1.2ms | 0.8ms | Real-time learning |

### Decision Matrix

| Criterion | WASM | napi-rs | Winner |
|-----------|------|---------|--------|
| Browser Support | ✅ | ❌ | WASM |
| Node.js Performance | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | napi-rs |
| Code Sharing | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | WASM |
| Bundle Size | ⭐⭐⭐ | N/A | napi-rs |
| Deployment Simplicity | ⭐⭐⭐⭐ | ⭐⭐⭐ | WASM |

## Consequences

### Positive
1. **Near-native performance** in Node.js via napi-rs
2. **Universal deployment** via WASM
3. **Single codebase** for core logic
4. **Type safety** from Rust to TypeScript
5. **Leverage ruvector ecosystem** - 54+ production-ready crates

### Negative
1. **Build complexity** - Two binding targets to maintain
2. **Testing overhead** - Must test both WASM and native paths
3. **Debugging difficulty** - WASM stack traces less clear

### Mitigations
1. Use `wasm-pack` and `napi-rs` build scripts for automation
2. Comprehensive integration tests in CI/CD
3. Source maps and debug symbols for WASM

## Implementation Notes

### Google Cloud Functions with WASM
```typescript
// functions/campaign-events/src/index.ts
import { onRequest } from 'firebase-functions/v2/https';
import init, { CampaignAnalyzer } from 'marketing-wasm';

let analyzer: CampaignAnalyzer | null = null;

export const analyzeCampaign = onRequest(async (req, res) => {
  if (!analyzer) {
    await init();
    analyzer = new CampaignAnalyzer();
  }

  const result = analyzer.analyze(req.body);
  res.json(result);
});
```

### Cloud Run with napi-rs
```typescript
// services/intelligence-api/src/server.ts
import express from 'express';
import { VectorDB, GNNLayer } from 'marketing-node';

const app = express();
const vectorDB = new VectorDB(384);
const gnnLayer = new GNNLayer(384, 256, 4);

app.post('/api/search', async (req, res) => {
  const embedding = Float32Array.from(req.body.embedding);
  const results = vectorDB.search(embedding, 10);
  res.json(results);
});
```

## Related Documents
- [ADR-001: System Overview](./001-system-overview.md)
- [ADR-003: Event-Driven Design](./003-event-driven-design.md)
- [Ruvector README](../../../ruvector-upstream/README.md)
