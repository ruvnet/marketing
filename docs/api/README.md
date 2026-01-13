# API Reference

Complete TypeScript API documentation for AI Marketing Swarms.

---

## Quick Reference

| Class/Function | Purpose |
|----------------|---------|
| [`startMarketingSwarm()`](#startmarketingswarm) | Start the 15-agent swarm |
| [`SwarmCoordinator`](#swarmcoordinator) | Main swarm controller |
| [`getEventBus()`](#eventbus) | Access event system |
| [`getStateManager()`](#statemanager) | Access state management |

---

## Main Entry Point

### startMarketingSwarm()

Convenience function to initialize and start the swarm.

```typescript
import { startMarketingSwarm } from '@marketing/ai-swarms';

const swarm = await startMarketingSwarm(config?);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `config` | `SwarmConfig` | Optional configuration |

**Returns:** `Promise<SwarmCoordinator>`

**Example:**

```typescript
const swarm = await startMarketingSwarm({
  maxConcurrentTasks: 100,
  autoRecovery: true,
  healthCheckInterval: 30000,
});
```

---

## SwarmCoordinator

Central controller for the 15-agent swarm.

### Constructor

```typescript
const swarm = new SwarmCoordinator(config?: SwarmConfig);
```

### SwarmConfig

```typescript
interface SwarmConfig {
  enabledAgents?: AgentId[];      // Agents to enable (default: all)
  maxConcurrentTasks?: number;    // Max parallel tasks (default: 100)
  healthCheckInterval?: number;   // Health check ms (default: 30000)
  autoRecovery?: boolean;         // Auto-recover failed agents (default: true)
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}
```

---

### start()

Initialize and start all agents.

```typescript
await swarm.start();
```

**Returns:** `Promise<void>`

**Events Emitted:**
- `swarm:started`

---

### stop()

Gracefully shutdown all agents.

```typescript
await swarm.stop();
```

**Returns:** `Promise<void>`

**Events Emitted:**
- `swarm:stopped`

---

### submitTask()

Submit a task for processing.

```typescript
const task = await swarm.submitTask(type, payload, options?);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | `TaskType` | Type of task |
| `payload` | `object` | Task data |
| `options.priority` | `TaskPriority` | `'low' \| 'medium' \| 'high' \| 'critical'` |
| `options.targetAgent` | `AgentId` | Route to specific agent |
| `options.metadata` | `object` | Additional metadata |

**Returns:** `Promise<Task>`

**Task Types:**

```typescript
type TaskType =
  | 'campaign_optimization'
  | 'bid_optimization'
  | 'creative_analysis'
  | 'attribution_analysis'
  | 'risk_assessment'
  | 'forecasting'
  | 'health_check';
```

**Example:**

```typescript
const task = await swarm.submitTask(
  'campaign_optimization',
  {
    campaignId: 'camp-123',
    platform: 'google-ads',
    budget: 5000,
  },
  {
    priority: 'high',
    targetAgent: 'simulation',
  }
);
```

---

### submitCampaign()

Submit a campaign for processing.

```typescript
await swarm.submitCampaign(campaign);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `campaign` | `Campaign` | Campaign object |

**Returns:** `Promise<void>`

**Campaign Interface:**

```typescript
interface Campaign {
  id: string;
  name: string;
  platform: Platform;
  status: 'draft' | 'active' | 'paused' | 'completed';
  budget: {
    daily?: number;
    total?: number;
  };
  targeting?: {
    geoTargets?: string[];
    ageRange?: { min: number; max: number };
    interests?: string[];
  };
  bidStrategy?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### submitCreative()

Submit a creative for analysis.

```typescript
await swarm.submitCreative(creative);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `creative` | `Creative` | Creative object |

**Returns:** `Promise<void>`

---

### getStatus()

Get current swarm status.

```typescript
const status = swarm.getStatus();
```

**Returns:** `SwarmStatus`

```typescript
interface SwarmStatus {
  status: 'initializing' | 'running' | 'degraded' | 'stopped' | 'error';
  activeAgents: number;
  totalAgents: number;
  agentStatuses: Map<AgentId, AgentStatus>;
  uptime: number;
  tasksProcessed: number;
  lastHealthCheck: Date | null;
}
```

---

### getMetrics()

Get swarm performance metrics.

```typescript
const metrics = swarm.getMetrics();
```

**Returns:** `SwarmMetrics`

```typescript
interface SwarmMetrics {
  totalTasksSubmitted: number;
  totalTasksCompleted: number;
  totalTasksFailed: number;
  averageTaskDuration: number;
  tasksByType: Map<TaskType, number>;
  tasksByAgent: Map<AgentId, number>;
  errorRate: number;
  throughput: number;
}
```

---

### getAgent()

Get a specific agent instance.

```typescript
const agent = swarm.getAgent<SimulationAgent>('simulation');
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `agentId` | `AgentId` | Agent identifier |

**Returns:** `T | undefined`

---

### runDiagnostics()

Run health diagnostics on all agents.

```typescript
const diagnostics = await swarm.runDiagnostics();
```

**Returns:** `Promise<Map<AgentId, unknown>>`

---

## EventBus

Pub/sub event system for agent communication.

### getEventBus()

Get the singleton event bus instance.

```typescript
import { getEventBus } from '@marketing/ai-swarms';

const eventBus = getEventBus();
```

### publish()

Publish an event.

```typescript
eventBus.publish({
  id: 'evt-123',
  type: 'campaign.optimized',
  timestamp: new Date(),
  source: 'simulation',
  payload: { recommendations: [...] },
});
```

### subscribe()

Subscribe to events.

```typescript
// Exact match
eventBus.subscribe('campaign.optimized', (event) => {
  console.log('Campaign optimized:', event.payload);
});

// Wildcard
eventBus.subscribe('campaign.*', (event) => {
  console.log('Campaign event:', event.type);
});
```

---

## StateManager

Centralized state management.

### getStateManager()

Get the singleton state manager.

```typescript
import { getStateManager } from '@marketing/ai-swarms';

const stateManager = getStateManager();
```

### Key Methods

```typescript
// Campaigns
stateManager.addCampaign(campaign);
stateManager.getCampaign(id);
stateManager.updateCampaign(id, updates);
stateManager.getAllCampaigns();

// Creatives
stateManager.addCreative(creative);
stateManager.getCreative(id);
stateManager.getAllCreatives();

// Tasks
stateManager.addTask(task);
stateManager.getTask(id);
stateManager.updateTaskStatus(id, status);

// Agents
stateManager.registerAgent(id, info);
stateManager.getAgent(id);
stateManager.updateAgentMetrics(id, metrics);

// Snapshots
stateManager.createSnapshot();
stateManager.getSnapshots();
```

---

## Type Definitions

### AgentId

```typescript
type AgentId =
  | 'orchestrator'
  | 'memory'
  | 'quality'
  | 'simulation'
  | 'historical-memory'
  | 'risk-detection'
  | 'attention-arbitrage'
  | 'creative-genome'
  | 'fatigue-forecaster'
  | 'mutation'
  | 'counterfactual'
  | 'causal-graph'
  | 'incrementality'
  | 'account-health'
  | 'cross-platform';
```

### Platform

```typescript
type Platform =
  | 'google-ads'
  | 'meta'
  | 'tiktok'
  | 'linkedin'
  | 'twitter'
  | 'pinterest'
  | 'snapchat';
```

### TaskPriority

```typescript
type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
```

### TaskStatus

```typescript
type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
```

---

## Error Handling

All async methods can throw errors:

```typescript
try {
  await swarm.submitTask('campaign_optimization', { ... });
} catch (error) {
  if (error.message.includes('swarm is stopped')) {
    // Swarm not running
  } else if (error.message.includes('agent not found')) {
    // Invalid target agent
  }
}
```

---

## Events Reference

| Event | Description | Payload |
|-------|-------------|---------|
| `swarm:started` | Swarm initialized | `{ timestamp }` |
| `swarm:stopped` | Swarm shutdown | `{ timestamp }` |
| `swarm:healthcheck` | Health check completed | `{ healthy, unhealthy, status }` |
| `task.assigned` | Task routed to agent | `{ taskId, agentId }` |
| `task.completed` | Task finished | `{ taskId, duration, result }` |
| `task.failed` | Task errored | `{ taskId, error }` |
| `agent.error` | Agent encountered error | `{ agentId, error }` |
| `campaign.optimized` | Campaign optimization done | `{ campaignId, recommendations }` |
| `creative.analyzed` | Creative analysis done | `{ creativeId, dna }` |

---

## See Also

- [Agent Reference](../agents/README.md) - Agent capabilities
- [Tutorials](../tutorials/README.md) - Hands-on examples
- [Architecture](../architecture/README.md) - System design
