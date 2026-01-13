# DDD: Agent Swarm Domain - Overview

## Domain Purpose

The **Agent Swarm Domain** manages the coordination, lifecycle, and intelligence of the 15-agent marketing swarm. It is the orchestration layer that enables parallel campaign optimization, cross-agent learning, and fault-tolerant operations.

## Strategic Classification

| Aspect | Classification |
|--------|----------------|
| **Domain Type** | Core Domain |
| **Business Value** | Critical - Enables all marketing optimization |
| **Complexity** | High - Multi-agent coordination |
| **Volatility** | Medium - Agent types may evolve |

## Ubiquitous Language

| Term | Definition |
|------|------------|
| **Agent** | An autonomous AI entity specialized for a specific marketing function |
| **Swarm** | The collective of 15 coordinated agents |
| **Tier** | Hierarchical level in the swarm (1-5) |
| **Task** | A unit of work assigned to one or more agents |
| **Coordination** | The process of agents working together on related tasks |
| **Q-Table** | Learned action-value mappings for agent decisions |
| **Trajectory** | A sequence of actions and outcomes for learning |
| **Hook** | An event trigger that enables agent coordination |

## Domain Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AGENT SWARM DOMAIN MODEL                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         AGGREGATES                                   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    Swarm (Aggregate Root)                    │   │   │
│  │  │                                                              │   │   │
│  │  │  • swarmId: SwarmId                                         │   │   │
│  │  │  • status: SwarmStatus                                      │   │   │
│  │  │  • topology: Topology                                       │   │   │
│  │  │  • agents: Map<AgentId, Agent>                              │   │   │
│  │  │  • coordinationProtocol: CoordinationProtocol               │   │   │
│  │  │                                                              │   │   │
│  │  │  + initialize(config: SwarmConfig): void                    │   │   │
│  │  │  + addAgent(agent: Agent): void                             │   │   │
│  │  │  + removeAgent(agentId: AgentId): void                      │   │   │
│  │  │  + submitTask(task: Task): TaskId                           │   │   │
│  │  │  + getStatus(): SwarmStatus                                 │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                        Agent (Entity)                        │   │   │
│  │  │                                                              │   │   │
│  │  │  • agentId: AgentId                                         │   │   │
│  │  │  • type: AgentType                                          │   │   │
│  │  │  • tier: Tier                                               │   │   │
│  │  │  • status: AgentStatus                                      │   │   │
│  │  │  • capabilities: Capability[]                               │   │   │
│  │  │  • qTable: QTable                                           │   │   │
│  │  │  • currentTask: Task?                                       │   │   │
│  │  │  • connections: AgentId[]                                   │   │   │
│  │  │                                                              │   │   │
│  │  │  + executeTask(task: Task): TaskResult                      │   │   │
│  │  │  + learn(trajectory: Trajectory): void                      │   │   │
│  │  │  + collaborate(partner: Agent, task: Task): TaskResult      │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                        Task (Entity)                         │   │   │
│  │  │                                                              │   │   │
│  │  │  • taskId: TaskId                                           │   │   │
│  │  │  • type: TaskType                                           │   │   │
│  │  │  • priority: Priority                                       │   │   │
│  │  │  • assignedAgents: AgentId[]                                │   │   │
│  │  │  • status: TaskStatus                                       │   │   │
│  │  │  • payload: TaskPayload                                     │   │   │
│  │  │  • result: TaskResult?                                      │   │   │
│  │  │                                                              │   │   │
│  │  │  + assign(agent: Agent): void                               │   │   │
│  │  │  + complete(result: TaskResult): void                       │   │   │
│  │  │  + fail(error: Error): void                                 │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       VALUE OBJECTS                                  │   │
│  │                                                                      │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐          │   │
│  │  │   SwarmId     │  │   AgentId     │  │   TaskId      │          │   │
│  │  │               │  │               │  │               │          │   │
│  │  │  value: UUID  │  │  value: UUID  │  │  value: UUID  │          │   │
│  │  └───────────────┘  └───────────────┘  └───────────────┘          │   │
│  │                                                                      │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐          │   │
│  │  │  Capability   │  │   Priority    │  │    Tier       │          │   │
│  │  │               │  │               │  │               │          │   │
│  │  │  name: string │  │  level: 1-5   │  │  level: 1-5   │          │   │
│  │  │  version: str │  │               │  │  name: string │          │   │
│  │  └───────────────┘  └───────────────┘  └───────────────┘          │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                       QTable (Value Object)                  │   │   │
│  │  │                                                              │   │   │
│  │  │  • stateActionValues: Map<State, Map<Action, number>>       │   │   │
│  │  │  • learningRate: number (default: 0.1)                      │   │   │
│  │  │  • discountFactor: number (default: 0.95)                   │   │   │
│  │  │  • explorationRate: number (default: 0.1)                   │   │   │
│  │  │                                                              │   │   │
│  │  │  + getValue(state: State, action: Action): number           │   │   │
│  │  │  + update(state: State, action: Action, reward: number)     │   │   │
│  │  │  + getBestAction(state: State): Action                      │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    Trajectory (Value Object)                 │   │   │
│  │  │                                                              │   │   │
│  │  │  • steps: TrajectoryStep[]                                  │   │   │
│  │  │  • startTime: Timestamp                                     │   │   │
│  │  │  • endTime: Timestamp?                                      │   │   │
│  │  │  • finalOutcome: number                                     │   │   │
│  │  │                                                              │   │   │
│  │  │  + addStep(step: TrajectoryStep): void                      │   │   │
│  │  │  + complete(outcome: number): void                          │   │   │
│  │  │  + getReward(): number                                      │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       DOMAIN EVENTS                                  │   │
│  │                                                                      │   │
│  │  • SwarmInitialized { swarmId, topology, agentCount, timestamp }    │   │
│  │  • AgentJoined { swarmId, agentId, agentType, tier, timestamp }     │   │
│  │  • AgentLeft { swarmId, agentId, reason, timestamp }                │   │
│  │  • TaskSubmitted { taskId, taskType, priority, timestamp }          │   │
│  │  • TaskAssigned { taskId, agentId, timestamp }                      │   │
│  │  • TaskCompleted { taskId, agentId, result, duration, timestamp }   │   │
│  │  • TaskFailed { taskId, agentId, error, timestamp }                 │   │
│  │  • AgentLearned { agentId, trajectory, improvement, timestamp }     │   │
│  │  • CoordinationStarted { taskId, agents, protocol, timestamp }      │   │
│  │  • CoordinationCompleted { taskId, agents, outcome, timestamp }     │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       DOMAIN SERVICES                                │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              TaskRoutingService                              │   │   │
│  │  │                                                              │   │   │
│  │  │  + routeTask(task: Task, swarm: Swarm): Agent[]             │   │   │
│  │  │  + findBestAgent(taskType: TaskType, agents: Agent[]): Agent│   │   │
│  │  │  + balanceLoad(swarm: Swarm): void                          │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              CoordinationService                             │   │   │
│  │  │                                                              │   │   │
│  │  │  + coordinate(agents: Agent[], task: Task): TaskResult      │   │   │
│  │  │  + broadcast(message: Message, swarm: Swarm): void          │   │   │
│  │  │  + sync(agents: Agent[]): void                              │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              LearningService                                 │   │   │
│  │  │                                                              │   │   │
│  │  │  + recordTrajectory(agent: Agent, traj: Trajectory): void   │   │   │
│  │  │  + updateQTable(agent: Agent, reward: number): void         │   │   │
│  │  │  + sharePatterns(from: Agent, to: Agent[]): void            │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              HealthService                                   │   │   │
│  │  │                                                              │   │   │
│  │  │  + checkHealth(swarm: Swarm): SwarmHealth                   │   │   │
│  │  │  + detectAnomalies(agent: Agent): Anomaly[]                 │   │   │
│  │  │  + heal(agent: Agent, anomaly: Anomaly): void               │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Bounded Context Interactions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      BOUNDED CONTEXT MAP                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                           ┌─────────────────┐                              │
│                           │  Agent Swarm    │                              │
│                           │    Context      │                              │
│                           └────────┬────────┘                              │
│                                    │                                        │
│           ┌────────────────────────┼────────────────────────┐              │
│           │                        │                        │              │
│           ▼                        ▼                        ▼              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│  │   Marketing     │    │    Creative     │    │   Attribution   │        │
│  │  Intelligence   │    │   Evolution     │    │    Analytics    │        │
│  │    Context      │    │    Context      │    │    Context      │        │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘        │
│           │                        │                        │              │
│           │                        │                        │              │
│           └────────────────────────┼────────────────────────┘              │
│                                    │                                        │
│                                    ▼                                        │
│                           ┌─────────────────┐                              │
│                           │    Campaign     │                              │
│                           │  Optimization   │                              │
│                           │    Context      │                              │
│                           └─────────────────┘                              │
│                                                                             │
│  RELATIONSHIP TYPES:                                                        │
│  ─────────────────                                                         │
│  Agent Swarm → Marketing Intelligence : Customer/Supplier                  │
│  Agent Swarm → Creative Evolution : Customer/Supplier                      │
│  Agent Swarm → Attribution Analytics : Customer/Supplier                   │
│  Agent Swarm → Campaign Optimization : Partnership                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Anti-Corruption Layer

```typescript
// acl/marketing-intelligence-acl.ts
export class MarketingIntelligenceACL {
  constructor(
    private intelligenceService: MarketingIntelligenceService
  ) {}

  // Translate swarm tasks to intelligence operations
  async executeIntelligenceTask(
    task: Task,
    agent: Agent
  ): Promise<TaskResult> {
    // Convert swarm task format to intelligence domain
    const intelligenceRequest = this.translateToIntelligence(task);

    // Execute in intelligence domain
    const intelligenceResult = await this.intelligenceService.execute(
      intelligenceRequest
    );

    // Translate back to swarm domain
    return this.translateFromIntelligence(intelligenceResult, task);
  }

  private translateToIntelligence(task: Task): IntelligenceRequest {
    switch (task.type) {
      case 'VECTOR_SEARCH':
        return {
          operation: 'search',
          embedding: task.payload.embedding,
          k: task.payload.k
        };
      case 'GNN_PREDICTION':
        return {
          operation: 'predict',
          model: task.payload.model,
          input: task.payload.input
        };
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }
}
```

## Implementation Guidelines

### 1. Agent Implementation
```typescript
// domain/agent.ts
export class Agent {
  private readonly id: AgentId;
  private readonly type: AgentType;
  private readonly tier: Tier;
  private status: AgentStatus;
  private qTable: QTable;
  private currentTask: Task | null;

  constructor(props: AgentProps) {
    this.id = new AgentId(props.id);
    this.type = props.type;
    this.tier = new Tier(props.tier);
    this.status = AgentStatus.IDLE;
    this.qTable = new QTable(props.qTableConfig);
    this.currentTask = null;
  }

  async executeTask(task: Task): Promise<TaskResult> {
    this.status = AgentStatus.WORKING;
    this.currentTask = task;

    try {
      // Start trajectory for learning
      const trajectory = new Trajectory();
      trajectory.start(this.getCurrentState());

      // Execute based on agent type
      const result = await this.doExecute(task);

      // Record trajectory step
      trajectory.addStep({
        state: this.getCurrentState(),
        action: task.type,
        reward: result.success ? 1.0 : -0.5
      });

      // Learn from trajectory
      this.learn(trajectory);

      return result;
    } finally {
      this.status = AgentStatus.IDLE;
      this.currentTask = null;
    }
  }

  learn(trajectory: Trajectory): void {
    // Q-learning update
    for (const step of trajectory.steps) {
      this.qTable.update(
        step.state,
        step.action,
        step.reward
      );
    }

    // Emit learning event
    DomainEvents.raise(new AgentLearned({
      agentId: this.id,
      trajectory,
      improvement: this.qTable.getAverageImprovement()
    }));
  }
}
```

### 2. Task Routing
```typescript
// services/task-routing.service.ts
export class TaskRoutingService {
  constructor(
    private ruvectorRouter: SemanticRouter
  ) {}

  async routeTask(task: Task, swarm: Swarm): Promise<Agent[]> {
    // Get task embedding
    const taskEmbedding = await this.embedTask(task);

    // Find agents with matching capabilities
    const eligibleAgents = swarm.getAgentsByCapability(task.requiredCapabilities);

    // Use ruvector semantic routing for best match
    const rankedAgents = await this.ruvectorRouter.route(
      taskEmbedding,
      eligibleAgents.map(a => ({
        id: a.id.value,
        embedding: a.getSpecializationEmbedding()
      }))
    );

    // Consider Q-table confidence
    const withConfidence = rankedAgents.map(ra => ({
      agent: eligibleAgents.find(a => a.id.value === ra.id)!,
      score: ra.score * this.getQTableConfidence(ra.id, task.type)
    }));

    // Sort by combined score
    withConfidence.sort((a, b) => b.score - a.score);

    // Return top agents (1 for simple tasks, 2-3 for complex)
    const count = task.complexity === 'COMPLEX' ? 3 : 1;
    return withConfidence.slice(0, count).map(wc => wc.agent);
  }
}
```

## Related Documents
- [DDD: Agent Swarm - Bounded Contexts](./002-bounded-contexts.md)
- [DDD: Agent Swarm - Aggregates](./003-aggregates.md)
- [ADR: Claude-Flow v3 Configuration](../../adr/swarm-config/001-claude-flow-v3.md)
