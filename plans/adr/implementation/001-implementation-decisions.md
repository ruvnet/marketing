# ADR-001: Implementation Decisions

## Status
Accepted

## Date
2024-01-13

## Context
This ADR documents the key implementation decisions made during the development of the 15-agent marketing swarm system.

## Decisions

### 1. TypeScript with ESM Modules
**Decision**: Use TypeScript with ES2022 target and NodeNext module resolution.

**Rationale**:
- Type safety reduces runtime errors
- Modern ESM modules for better tree-shaking
- Excellent IDE support and developer experience
- Compatibility with latest Node.js features

**Implementation**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

### 2. Event-Driven Architecture
**Decision**: Implement pub/sub event bus with event sourcing capabilities.

**Rationale**:
- Loose coupling between agents
- Enables replay and debugging
- Supports distributed systems expansion
- Clear audit trail

**Implementation**:
- `EventBus` class with wildcard subscriptions
- Event history for replay
- Singleton pattern for global access

### 3. Base Agent Pattern
**Decision**: All 15 agents extend a common `BaseAgent` abstract class.

**Rationale**:
- Consistent lifecycle management (initialize, shutdown)
- Built-in task queue with p-queue
- Standardized health checks
- Uniform event handling

**Implementation**:
```typescript
abstract class BaseAgent {
  protected abstract process(task: Task): Promise<void>;
  protected abstract onInitialize(): Promise<void>;
  protected abstract onShutdown(): Promise<void>;
  protected abstract getSubscribedEvents(): string[];
  protected abstract handleEvent(event: DomainEvent): Promise<void>;
}
```

### 4. Tiered Agent Architecture
**Decision**: Organize 15 agents into 5 tiers based on function and dependencies.

**Tiers**:
1. **Coordination** (Tier 1): Orchestrator, Memory, Quality
2. **Intelligence** (Tier 2): Simulation, Historical Memory, Risk Detection, Attention Arbitrage
3. **Creative** (Tier 3): Creative Genome, Fatigue Forecaster, Mutation
4. **Attribution** (Tier 4): Counterfactual, Causal Graph, Incrementality Auditor
5. **Operations** (Tier 5): Account Health, Cross-Platform

**Rationale**:
- Clear dependency order for initialization
- Logical grouping by responsibility
- Enables selective agent activation

### 5. Domain Services Layer
**Decision**: Create dedicated service classes for business logic.

**Services**:
- `CampaignService`: Campaign lifecycle and optimization
- `CreativeService`: Creative management and analysis
- `AttributionService`: Multi-touch attribution and causality
- `AnalyticsService`: Metrics and reporting

**Rationale**:
- Separation of concerns
- Reusable across agents
- Easier testing and maintenance

### 6. GCP Integration Abstractions
**Decision**: Create abstraction layer for Google Cloud Platform services.

**Components**:
- `BigQueryClient`: Data warehouse operations
- `PubSubClient`: Event messaging
- `StorageClient`: Object storage
- `VertexAIClient`: ML model serving

**Rationale**:
- Enables local development with mocks
- Clear interface for production implementation
- Easier testing without cloud dependencies

### 7. Security-First Design
**Decision**: Build security utilities into core framework.

**Components**:
- `InputValidator`: Zod-based validation schemas
- `SecretsManager`: Secure credential handling
- `AuditLogger`: Compliance logging
- `RateLimiter`: Request throttling

**Rationale**:
- OWASP compliance from the start
- Consistent security patterns across codebase
- Audit trail for compliance requirements

### 8. Performance Optimization Layer
**Decision**: Include performance utilities as first-class citizens.

**Components**:
- `LRUCache`: In-memory caching with TTL
- `TieredCache`: L1/L2 cache strategy
- `ConnectionPool`: Efficient resource management
- `AutoBatcher`: Automatic operation batching

**Rationale**:
- Performance critical for real-time bidding
- Reduces cloud costs
- Improves agent response times

### 9. Testing Strategy
**Decision**: Use Vitest for comprehensive testing.

**Coverage**:
- Unit tests for core infrastructure
- Agent lifecycle tests
- Service integration tests
- GCP client mock tests

**Rationale**:
- Fast test execution
- Native ESM support
- Good coverage reporting

## Consequences

### Positive
- Clean, maintainable codebase
- Strong type safety
- Excellent developer experience
- Production-ready security

### Negative
- Initial setup complexity
- Learning curve for new developers
- Mock implementations need production replacement

## Related ADRs
- [001-claude-flow-v3](../swarm-config/001-claude-flow-v3.md)
- [001-infrastructure](../google-cloud/001-infrastructure.md)
- [001-api-design](../api-security/001-api-design.md)
