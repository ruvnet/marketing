# ADR-API001: API Architecture and Design

## Status
**Proposed** | Date: 2026-01-13

## Context

The AI Marketing Swarms platform requires APIs to:

1. **Integrate with ad platforms** (Google Ads, Meta, TikTok, LinkedIn)
2. **Expose optimization capabilities** to client applications
3. **Enable agent-to-agent communication** in the swarm
4. **Provide real-time event streaming** for dashboards
5. **Support both REST and GraphQL** patterns

## Decision

We will implement a **multi-protocol API architecture** with:

1. **REST API** for standard CRUD operations
2. **GraphQL** for complex queries and real-time subscriptions
3. **gRPC** for high-performance agent communication
4. **WebSocket** for real-time dashboard updates

### API Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API ARCHITECTURE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      API GATEWAY (Cloud Run)                         │   │
│  │                                                                      │   │
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │   │
│  │  │   REST API      │    │   GraphQL API   │    │   WebSocket     │ │   │
│  │  │   /api/v1/*     │    │   /graphql      │    │   /ws           │ │   │
│  │  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘ │   │
│  │           │                      │                      │          │   │
│  │  ┌────────┴──────────────────────┴──────────────────────┴────────┐│   │
│  │  │                     Authentication Layer                       ││   │
│  │  │                                                                ││   │
│  │  │  • Firebase Auth (user tokens)                                 ││   │
│  │  │  • Service Account Auth (platform APIs)                        ││   │
│  │  │  • API Key Auth (external integrations)                        ││   │
│  │  └────────────────────────────────────────────────────────────────┘│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      SERVICE LAYER                                   │   │
│  │                                                                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │   │
│  │  │  Campaign   │  │  Creative   │  │ Attribution │  │   Budget   │ │   │
│  │  │  Service    │  │  Service    │  │   Service   │  │  Service   │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │   │
│  │                                                                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │   │
│  │  │   Swarm     │  │ Intelligence│  │   Platform  │  │  Webhook   │ │   │
│  │  │  Service    │  │   Service   │  │   Service   │  │  Service   │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### REST API Endpoints

```yaml
# openapi.yaml
openapi: 3.0.3
info:
  title: AI Marketing Swarms API
  version: 1.0.0

paths:
  # Campaign endpoints
  /api/v1/campaigns:
    get:
      summary: List campaigns
      parameters:
        - name: accountId
          in: query
          required: true
        - name: platform
          in: query
          enum: [google, meta, tiktok, linkedin]
        - name: status
          in: query
          enum: [ACTIVE, PAUSED, ENDED, DRAFT]
      responses:
        '200':
          description: Campaign list
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CampaignList'

    post:
      summary: Create campaign
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateCampaignRequest'
      responses:
        '201':
          description: Campaign created

  /api/v1/campaigns/{campaignId}:
    get:
      summary: Get campaign details
    put:
      summary: Update campaign
    delete:
      summary: Delete campaign

  /api/v1/campaigns/{campaignId}/optimize:
    post:
      summary: Trigger optimization
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                optimizationType:
                  enum: [BUDGET, BIDDING, TARGETING, CREATIVE]
                agentOverride:
                  type: string
      responses:
        '202':
          description: Optimization queued

  /api/v1/campaigns/{campaignId}/simulate:
    post:
      summary: Run Monte Carlo simulation
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                scenarios:
                  type: integer
                  default: 10000
                budgetRange:
                  type: object
                  properties:
                    min: { type: number }
                    max: { type: number }
      responses:
        '200':
          description: Simulation results

  # Creative endpoints
  /api/v1/creatives:
    get:
      summary: List creatives
    post:
      summary: Create creative

  /api/v1/creatives/{creativeId}/genome:
    get:
      summary: Get creative DNA
    put:
      summary: Update creative genome

  /api/v1/creatives/{creativeId}/fatigue:
    get:
      summary: Get fatigue prediction

  /api/v1/creatives/{creativeId}/mutate:
    post:
      summary: Generate mutations
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                mutationType:
                  enum: [hook, promise, frame, cta, full]
                preserveElements:
                  type: array
                  items:
                    type: string
      responses:
        '200':
          description: Mutation variants

  # Attribution endpoints
  /api/v1/attribution/paths:
    get:
      summary: Get attribution paths
      parameters:
        - name: userId
          in: query
        - name: conversionId
          in: query

  /api/v1/attribution/compute:
    post:
      summary: Compute attribution
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                model:
                  enum: [causal, shapley, last_click, linear, time_decay]
                touchpoints:
                  type: array
                  items:
                    $ref: '#/components/schemas/Touchpoint'

  # Swarm endpoints
  /api/v1/swarm/status:
    get:
      summary: Get swarm status

  /api/v1/swarm/agents:
    get:
      summary: List active agents

  /api/v1/swarm/agents/{agentId}:
    get:
      summary: Get agent details

  /api/v1/swarm/tasks:
    get:
      summary: List tasks
    post:
      summary: Submit task to swarm

  # Intelligence endpoints
  /api/v1/intelligence/search:
    post:
      summary: Vector similarity search
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                embedding:
                  type: array
                  items:
                    type: number
                k:
                  type: integer
                  default: 10
                collection:
                  enum: [campaigns, creatives, audiences]

  /api/v1/intelligence/predict:
    post:
      summary: GNN prediction
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                type:
                  enum: [fatigue, performance, conversion]
                input:
                  type: object

components:
  schemas:
    Campaign:
      type: object
      properties:
        id:
          type: string
        accountId:
          type: string
        platform:
          enum: [google, meta, tiktok, linkedin]
        name:
          type: string
        status:
          enum: [ACTIVE, PAUSED, ENDED, DRAFT]
        budget:
          $ref: '#/components/schemas/Budget'
        metrics:
          $ref: '#/components/schemas/CampaignMetrics'
        intelligence:
          $ref: '#/components/schemas/CampaignIntelligence'

    Creative:
      type: object
      properties:
        id:
          type: string
        campaignId:
          type: string
        type:
          enum: [IMAGE, VIDEO, CAROUSEL, TEXT]
        genome:
          $ref: '#/components/schemas/CreativeGenome'
        fatigue:
          $ref: '#/components/schemas/FatigueStatus'

    CreativeGenome:
      type: object
      properties:
        hook:
          type: object
        promise:
          type: object
        frame:
          type: object
        cta:
          type: object

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
    apiKey:
      type: apiKey
      in: header
      name: X-API-Key
```

### GraphQL Schema

```graphql
# schema.graphql
type Query {
  # Campaign queries
  campaigns(accountId: ID!, filter: CampaignFilter): [Campaign!]!
  campaign(id: ID!): Campaign
  campaignPerformance(id: ID!, dateRange: DateRange!): [PerformanceData!]!

  # Creative queries
  creatives(campaignId: ID, filter: CreativeFilter): [Creative!]!
  creative(id: ID!): Creative
  creativeFatigue(id: ID!): FatiguePrediction!

  # Attribution queries
  attributionPath(userId: ID!, conversionId: ID): AttributionPath!
  attributionModel(model: AttributionModel!, touchpoints: [TouchpointInput!]!): Attribution!

  # Swarm queries
  swarmStatus: SwarmStatus!
  agents: [Agent!]!
  agent(id: ID!): Agent

  # Intelligence queries
  similarCampaigns(embedding: [Float!]!, k: Int = 10): [SimilarResult!]!
  similarCreatives(embedding: [Float!]!, k: Int = 10): [SimilarResult!]!
}

type Mutation {
  # Campaign mutations
  createCampaign(input: CreateCampaignInput!): Campaign!
  updateCampaign(id: ID!, input: UpdateCampaignInput!): Campaign!
  deleteCampaign(id: ID!): Boolean!
  optimizeCampaign(id: ID!, type: OptimizationType!): OptimizationResult!
  simulateCampaign(id: ID!, params: SimulationParams!): SimulationResult!

  # Creative mutations
  createCreative(input: CreateCreativeInput!): Creative!
  updateCreative(id: ID!, input: UpdateCreativeInput!): Creative!
  mutateCreative(id: ID!, params: MutationParams!): [Creative!]!
  analyzeCreative(id: ID!): CreativeAnalysis!

  # Swarm mutations
  submitTask(input: TaskInput!): Task!
  pauseAgent(id: ID!): Agent!
  resumeAgent(id: ID!): Agent!
}

type Subscription {
  # Real-time subscriptions
  campaignMetrics(campaignId: ID!): PerformanceData!
  creativeFatigue(creativeId: ID!): FatiguePrediction!
  swarmEvents: SwarmEvent!
  agentActivity(agentId: ID): AgentActivity!
  optimizationProgress(taskId: ID!): OptimizationProgress!
}

# Types
type Campaign {
  id: ID!
  accountId: ID!
  platform: Platform!
  name: String!
  status: CampaignStatus!
  budget: Budget!
  targeting: Targeting!
  bidding: Bidding!
  metrics: CampaignMetrics
  intelligence: CampaignIntelligence
  creatives: [Creative!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Creative {
  id: ID!
  campaignId: ID!
  type: CreativeType!
  content: CreativeContent!
  genome: CreativeGenome!
  fatigue: FatigueStatus!
  performance: CreativePerformance
  lineage: CreativeLineage
}

type CreativeGenome {
  hook: Hook!
  promise: Promise!
  frame: Frame!
  cta: CTA!
  embedding: [Float!]!
}

type FatiguePrediction {
  score: Float!
  daysRemaining: Int!
  decayCurve: [Float!]!
  confidence: Float!
  recommendations: [String!]!
}

type Attribution {
  model: AttributionModel!
  credits: [TouchpointCredit!]!
  confidence: Float!
  counterfactualLift: Float
}

type SwarmStatus {
  activeAgents: Int!
  totalTasks: Int!
  completedTasks: Int!
  pendingTasks: Int!
  averageLatency: Float!
  healthScore: Float!
}

type Agent {
  id: ID!
  type: AgentType!
  tier: Int!
  status: AgentStatus!
  currentTask: Task
  capabilities: [String!]!
  metrics: AgentMetrics!
}

# Enums
enum Platform {
  GOOGLE
  META
  TIKTOK
  LINKEDIN
}

enum CampaignStatus {
  ACTIVE
  PAUSED
  ENDED
  DRAFT
}

enum CreativeType {
  IMAGE
  VIDEO
  CAROUSEL
  TEXT
}

enum AttributionModel {
  CAUSAL
  SHAPLEY
  LAST_CLICK
  LINEAR
  TIME_DECAY
}

enum AgentType {
  ORCHESTRATOR
  MEMORY
  QUALITY
  SIMULATION
  HISTORICAL_MEMORY
  RISK_DETECTION
  ATTENTION_ARBITRAGE
  CREATIVE_GENOME
  FATIGUE_FORECASTER
  MUTATION
  COUNTERFACTUAL
  CAUSAL_GRAPH
  INCREMENTALITY
  ACCOUNT_HEALTH
  CROSS_PLATFORM
}
```

### Error Handling

```typescript
// errors.ts
export class APIError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
  }
}

export const ErrorCodes = {
  // Authentication
  AUTH_INVALID_TOKEN: { code: 'AUTH001', status: 401 },
  AUTH_EXPIRED_TOKEN: { code: 'AUTH002', status: 401 },
  AUTH_INSUFFICIENT_PERMISSIONS: { code: 'AUTH003', status: 403 },

  // Validation
  VALIDATION_FAILED: { code: 'VAL001', status: 400 },
  INVALID_CAMPAIGN_ID: { code: 'VAL002', status: 400 },
  INVALID_EMBEDDING_DIMENSION: { code: 'VAL003', status: 400 },

  // Resource
  CAMPAIGN_NOT_FOUND: { code: 'RES001', status: 404 },
  CREATIVE_NOT_FOUND: { code: 'RES002', status: 404 },
  AGENT_NOT_FOUND: { code: 'RES003', status: 404 },

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: { code: 'RATE001', status: 429 },

  // Platform Integration
  PLATFORM_API_ERROR: { code: 'PLAT001', status: 502 },
  PLATFORM_RATE_LIMITED: { code: 'PLAT002', status: 429 },

  // Swarm
  SWARM_UNAVAILABLE: { code: 'SWM001', status: 503 },
  AGENT_BUSY: { code: 'SWM002', status: 503 },
  TASK_TIMEOUT: { code: 'SWM003', status: 504 }
};
```

## Consequences

### Positive
1. **Multi-protocol support** for different use cases
2. **Strong typing** via OpenAPI and GraphQL schemas
3. **Real-time updates** via WebSocket subscriptions
4. **Comprehensive error handling** with clear codes

### Negative
1. **Multiple APIs to maintain** (REST, GraphQL, WebSocket)
2. **Schema synchronization** required across protocols
3. **Complexity** of gateway routing

### Mitigations
1. Generate TypeScript types from schemas
2. Automated schema validation in CI/CD
3. API gateway handles protocol routing

## Related Documents
- [ADR-API002: Google Secrets Management](./002-google-secrets.md)
- [ADR-API003: Authentication](./003-authentication.md)
