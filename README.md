# AI Marketing Swarms

> **Autonomous AI agents that optimize your advertising campaigns 24/7**

A 15-agent AI swarm system that handles media buying, creative optimization, and campaign management across multiple advertising platforms. Built with Claude-Flow V3 for enterprise-grade reliability.

---

## What Is This?

Imagine having a team of 15 AI specialists working around the clock on your marketing campaigns:

- One agent **optimizes your bids** in real-time
- Another **predicts which creatives will fatigue** before they do
- Another **detects fraud and wasted spend** instantly
- And 12 more specialists handling everything from attribution to cross-platform sync

That's what AI Marketing Swarms does. It's like hiring an elite marketing team that never sleeps, never makes emotional decisions, and learns from every dollar spent.

---

## Key Features

| Feature | Description |
|---------|-------------|
| **15 Specialized Agents** | Each agent is an expert in one domain - from bid optimization to creative mutation |
| **Hierarchical Mesh Architecture** | Agents coordinate intelligently, sharing insights and avoiding conflicts |
| **Real-Time Optimization** | Continuous campaign adjustments based on live performance data |
| **Multi-Platform Support** | Google Ads, Meta, TikTok, LinkedIn, Twitter/X, Pinterest, Snapchat |
| **Causal Attribution** | Understand *why* campaigns work, not just *that* they work |
| **Creative DNA Analysis** | Break down winning ads into genetic components and breed new variants |
| **Fraud Detection** | Identify and block wasted spend before it drains your budget |
| **Self-Learning** | Every campaign makes the system smarter |

---

## The 15 Agents

### Tier 1: Coordination Layer
*The brain of the operation*

| Agent | What It Does |
|-------|--------------|
| **Orchestrator** | Routes tasks to the right specialist, balances workloads |
| **Memory** | Remembers everything - past campaigns, winning strategies, lessons learned |
| **Quality** | Validates all decisions, ensures nothing goes live without approval |

### Tier 2: Intelligence Layer
*The analysts and forecasters*

| Agent | What It Does |
|-------|--------------|
| **Simulation** | Runs Monte Carlo simulations to predict campaign outcomes |
| **Historical Memory** | Finds patterns from past campaigns that apply to current ones |
| **Risk Detection** | Spots fraud, spend traps, and pacing issues before they hurt you |
| **Attention Arbitrage** | Finds underpriced ad inventory across platforms |

### Tier 3: Creative Layer
*The creative directors*

| Agent | What It Does |
|-------|--------------|
| **Creative Genome** | Extracts the "DNA" of winning ads (hook, promise, proof, CTA) |
| **Fatigue Forecaster** | Predicts when ads will stop working, so you can refresh early |
| **Mutation** | Breeds new ad variants by combining elements from winners |

### Tier 4: Attribution Layer
*The truth-seekers*

| Agent | What It Does |
|-------|--------------|
| **Counterfactual** | Answers "what if" questions about campaign changes |
| **Causal Graph** | Maps the true cause-and-effect relationships in your funnel |
| **Incrementality** | Measures true lift - what you gained that wouldn't have happened anyway |

### Tier 5: Operations Layer
*The platform managers*

| Agent | What It Does |
|-------|--------------|
| **Account Health** | Monitors campaign health, diagnoses issues, suggests fixes |
| **Cross-Platform** | Syncs strategies and budgets across all your ad platforms |

---

## Quick Stats

| Metric | Value |
|--------|-------|
| Total Agents | 15 |
| Agent Tiers | 5 |
| Supported Platforms | 7+ |
| Attribution Models | 6 |
| Event Types | 25+ |
| Test Coverage | 85%+ |

---

## Quickstart

### Prerequisites

- Node.js 20+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/ruvnet/marketing.git
cd marketing

# Install dependencies
npm install

# Initialize Claude-Flow
npx @claude-flow/cli@latest init --force

# Initialize the swarm
npx @claude-flow/cli@latest swarm init --topology hierarchical --max-agents 15
```

### Start the Swarm

```bash
# Option 1: Using npm script
npm run swarm:start

# Option 2: Using Claude-Flow CLI
npx @claude-flow/cli@latest daemon start
```

### Check Status

```bash
npm run swarm:status
# or
npx @claude-flow/cli@latest swarm status
```

### Basic Usage (TypeScript)

```typescript
import { startMarketingSwarm } from '@marketing/ai-swarms';

// Start the swarm
const swarm = await startMarketingSwarm({
  maxConcurrentTasks: 100,
  autoRecovery: true,
});

// Submit a campaign for optimization
await swarm.submitTask('campaign_optimization', {
  campaignId: 'camp-123',
  platform: 'google-ads',
  budget: 10000,
  objective: 'conversions',
});

// Get swarm status
const status = swarm.getStatus();
console.log(`Active agents: ${status.activeAgents}`);
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     SWARM COORDINATOR                           │
│                  (Central Orchestration)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  TIER 1       │    │  TIER 2       │    │  TIER 3       │
│  Coordination │───▶│  Intelligence │───▶│  Creative     │
│               │    │               │    │               │
│ • Orchestrator│    │ • Simulation  │    │ • Genome      │
│ • Memory      │    │ • Historical  │    │ • Fatigue     │
│ • Quality     │    │ • Risk        │    │ • Mutation    │
│               │    │ • Arbitrage   │    │               │
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  TIER 4       │    │  TIER 5       │    │  SERVICES     │
│  Attribution  │    │  Operations   │    │               │
│               │    │               │    │ • Campaign    │
│ • Counterfact │    │ • Account     │    │ • Creative    │
│ • Causal      │    │ • Cross-Plat  │    │ • Attribution │
│ • Incremental │    │               │    │ • Analytics   │
└───────────────┘    └───────────────┘    └───────────────┘
```

---

## Supported Platforms

| Platform | Status | Features |
|----------|--------|----------|
| Google Ads | ✅ Full | Bid optimization, audience targeting, creative testing |
| Meta (Facebook/Instagram) | ✅ Full | Dynamic creative, lookalike audiences, placement optimization |
| TikTok Ads | ✅ Full | Spark ads, creative trends, audience insights |
| LinkedIn Ads | ✅ Full | B2B targeting, lead gen, account-based marketing |
| Twitter/X Ads | ✅ Full | Promoted tweets, follower campaigns, conversation targeting |
| Pinterest Ads | ✅ Full | Shopping ads, idea pins, interest targeting |
| Snapchat Ads | ✅ Full | Story ads, AR lenses, geofilters |

---

## Configuration

### Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...      # Claude API key

# Optional - Platform APIs
GOOGLE_ADS_API_KEY=...            # Google Ads
META_ACCESS_TOKEN=...             # Meta Business
TIKTOK_ACCESS_TOKEN=...           # TikTok for Business

# Optional - GCP Integration
GOOGLE_CLOUD_PROJECT=...          # GCP project ID
GOOGLE_APPLICATION_CREDENTIALS=... # Service account path
```

### Swarm Configuration

```yaml
# .claude-flow/config.yaml
swarm:
  topology: hierarchical
  maxAgents: 15
  autoScale: true

memory:
  backend: hybrid
  vectorSearch: true

performance:
  cacheEnabled: true
  batchSize: 100
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [Getting Started](./docs/getting-started.md) | Step-by-step setup guide |
| [Agent Reference](./docs/agents/README.md) | Detailed agent documentation |
| [API Reference](./docs/api/README.md) | TypeScript API documentation |
| [Tutorials](./docs/tutorials/README.md) | Hands-on tutorials |
| [Architecture](./docs/architecture/README.md) | System design deep-dive |
| [Security](./SECURITY.md) | Security best practices |

### Tutorials

1. **[Your First Campaign](./docs/tutorials/01-first-campaign.md)** - Submit and optimize a campaign
2. **[Creative Testing](./docs/tutorials/02-creative-testing.md)** - A/B test creatives with AI
3. **[Attribution Setup](./docs/tutorials/03-attribution.md)** - Configure multi-touch attribution
4. **[Cross-Platform Sync](./docs/tutorials/04-cross-platform.md)** - Unify campaigns across platforms
5. **[Custom Agents](./docs/tutorials/05-custom-agents.md)** - Build your own specialized agents

---

## Project Structure

```
marketing/
├── src/
│   ├── agents/           # All 15 agents
│   │   ├── tier1/        # Coordination agents
│   │   ├── tier2/        # Intelligence agents
│   │   ├── tier3/        # Creative agents
│   │   ├── tier4/        # Attribution agents
│   │   └── tier5/        # Operations agents
│   ├── core/             # Event bus, state, logging
│   ├── services/         # Domain services
│   ├── integrations/     # GCP, platform APIs
│   ├── security/         # Input validation, secrets
│   ├── performance/      # Caching, pooling
│   └── swarm/            # Swarm coordinator
├── tests/                # Test suites
├── plans/                # ADRs and DDD docs
├── .claude/              # Claude Code integration
└── .claude-flow/         # Runtime configuration
```

---

## Performance

| Operation | Latency | Throughput |
|-----------|---------|------------|
| Task routing | <10ms | 1000+ tasks/sec |
| Memory search (HNSW) | <5ms | 10,000+ queries/sec |
| Event processing | <1ms | 50,000+ events/sec |
| Agent health check | <50ms | All 15 agents |

---

## Comparison

| Feature | AI Marketing Swarms | Traditional Tools | Manual Management |
|---------|---------------------|-------------------|-------------------|
| 24/7 Optimization | ✅ | ⚠️ Limited | ❌ |
| Cross-Platform Sync | ✅ Automatic | ⚠️ Manual | ❌ |
| Causal Attribution | ✅ Built-in | ❌ | ❌ |
| Creative Evolution | ✅ AI-Powered | ❌ | ⚠️ Manual |
| Fraud Detection | ✅ Real-time | ⚠️ Delayed | ❌ |
| Learning | ✅ Continuous | ❌ | ⚠️ Slow |

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

```bash
# Run tests
npm test

# Run linter
npm run lint

# Type check
npm run typecheck
```

---

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

## Support

- **Documentation**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/ruvnet/marketing/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ruvnet/marketing/discussions)

---

<p align="center">
  <b>Built with Claude-Flow V3</b><br>
  <i>15 agents. One mission. Better marketing.</i>
</p>
