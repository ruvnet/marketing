/**
 * Orchestrator Agent - Master Coordinator for Swarm Operations
 * Tier 1: Coordination
 *
 * Responsibilities:
 * - Task routing and distribution across agents
 * - Swarm lifecycle management
 * - Priority-based task scheduling
 * - Cross-agent coordination
 * - Workload balancing
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  AgentId,
  AgentConfig,
  Task,
  TaskContext,
  TaskPriority,
  DomainEvent,
  EventType,
  AgentState,
} from '../../types/index.js';
import { BaseAgent, AgentDependencies } from '../base-agent.js';

// ============================================================================
// Types
// ============================================================================

export interface OrchestratorInput {
  action: 'route_task' | 'balance_load' | 'coordinate' | 'health_check';
  task?: {
    type: string;
    input: unknown;
    priority: TaskPriority;
    targetCapabilities?: string[];
  };
  scope?: AgentId[];
}

export interface OrchestratorOutput {
  action: string;
  result: {
    assignedTo?: AgentId;
    taskId?: string;
    loadDistribution?: Record<AgentId, number>;
    healthStatus?: Record<AgentId, 'healthy' | 'degraded' | 'unhealthy'>;
    recommendations?: string[];
  };
}

export interface RoutingDecision {
  agentId: AgentId;
  score: number;
  reasons: string[];
}

// ============================================================================
// Configuration
// ============================================================================

export const orchestratorConfig: AgentConfig = {
  id: 'orchestrator',
  tier: 1,
  name: 'Orchestrator Agent',
  description: 'Master coordinator for swarm operations, task routing, and workload balancing',
  capabilities: [
    {
      id: 'task_routing',
      name: 'Task Routing',
      description: 'Route tasks to appropriate agents based on capabilities and load',
      inputTypes: ['task', 'route_request'],
      outputTypes: ['routing_decision'],
    },
    {
      id: 'load_balancing',
      name: 'Load Balancing',
      description: 'Balance workload across available agents',
      inputTypes: ['load_query'],
      outputTypes: ['load_distribution'],
    },
    {
      id: 'coordination',
      name: 'Cross-Agent Coordination',
      description: 'Coordinate multi-agent workflows',
      inputTypes: ['coordination_request'],
      outputTypes: ['coordination_plan'],
    },
    {
      id: 'health_monitoring',
      name: 'Health Monitoring',
      description: 'Monitor and report swarm health',
      inputTypes: ['health_query'],
      outputTypes: ['health_report'],
    },
  ],
  maxConcurrency: 10,
  timeoutMs: 30000,
  priority: 100, // Highest priority
  dependencies: [],
};

// ============================================================================
// Agent Capability Mapping
// ============================================================================

const AGENT_CAPABILITIES: Record<AgentId, string[]> = {
  // Tier 1
  orchestrator: ['task_routing', 'load_balancing', 'coordination'],
  memory: ['state_storage', 'vector_search', 'session_management'],
  quality: ['validation', 'truth_scoring', 'output_verification'],
  // Tier 2
  simulation: ['monte_carlo', 'outcome_prediction', 'scenario_analysis'],
  'historical-memory': ['pattern_retrieval', 'historical_search', 'trend_analysis'],
  'risk-detection': ['spend_trap_detection', 'fraud_detection', 'anomaly_detection'],
  'attention-arbitrage': ['attention_pricing', 'arbitrage_discovery', 'cpm_analysis'],
  // Tier 3
  'creative-genome': ['genome_extraction', 'creative_analysis', 'dna_decomposition'],
  'fatigue-forecaster': ['fatigue_prediction', 'decay_modeling', 'refresh_timing'],
  mutation: ['creative_variation', 'genetic_mutation', 'ab_generation'],
  // Tier 4
  counterfactual: ['what_if_analysis', 'counterfactual_simulation', 'impact_estimation'],
  'causal-graph': ['causal_mapping', 'influence_graph', 'path_analysis'],
  'incrementality': ['lift_measurement', 'holdout_analysis', 'incrementality_test'],
  // Tier 5
  'account-health': ['self_healing', 'health_monitoring', 'auto_recovery'],
  'cross-platform': ['multi_channel', 'platform_sync', 'cross_platform_intelligence'],
};

// ============================================================================
// Orchestrator Agent Implementation
// ============================================================================

export class OrchestratorAgent extends BaseAgent<OrchestratorInput, OrchestratorOutput> {
  private taskQueue: Map<string, Task>;
  private agentLoads: Map<AgentId, number>;
  private routingHistory: RoutingDecision[];

  constructor(deps?: AgentDependencies) {
    super(orchestratorConfig, deps);
    this.taskQueue = new Map();
    this.agentLoads = new Map();
    this.routingHistory = [];
  }

  /**
   * Main processing logic
   */
  protected async process(
    input: OrchestratorInput,
    context: TaskContext
  ): Promise<OrchestratorOutput> {
    this.logger.info('Processing orchestrator request', { action: input.action });

    switch (input.action) {
      case 'route_task':
        return this.routeTask(input, context);
      case 'balance_load':
        return this.balanceLoad(input);
      case 'coordinate':
        return this.coordinate(input, context);
      case 'health_check':
        return this.healthCheck(input);
      default:
        throw new Error(`Unknown action: ${input.action}`);
    }
  }

  /**
   * Route a task to the best available agent
   */
  private async routeTask(
    input: OrchestratorInput,
    context: TaskContext
  ): Promise<OrchestratorOutput> {
    if (!input.task) {
      throw new Error('Task is required for route_task action');
    }

    const { type, priority, targetCapabilities } = input.task;
    const candidates = this.findCandidateAgents(type, targetCapabilities);

    if (candidates.length === 0) {
      throw new Error(`No agents available for task type: ${type}`);
    }

    // Score candidates
    const scoredCandidates = candidates.map((agentId) =>
      this.scoreAgent(agentId, priority)
    );

    // Sort by score (descending)
    scoredCandidates.sort((a, b) => b.score - a.score);

    const bestChoice = scoredCandidates[0];
    this.logger.info('Task routed', {
      taskType: type,
      assignedTo: bestChoice.agentId,
      score: bestChoice.score,
    });

    // Track routing decision
    this.routingHistory.push(bestChoice);
    if (this.routingHistory.length > 1000) {
      this.routingHistory = this.routingHistory.slice(-1000);
    }

    // Update agent load
    const currentLoad = this.agentLoads.get(bestChoice.agentId) ?? 0;
    this.agentLoads.set(bestChoice.agentId, currentLoad + 1);

    return {
      action: 'route_task',
      result: {
        assignedTo: bestChoice.agentId,
        taskId: uuidv4(),
        recommendations: bestChoice.reasons,
      },
    };
  }

  /**
   * Balance load across agents
   */
  private async balanceLoad(input: OrchestratorInput): Promise<OrchestratorOutput> {
    const scope = input.scope ?? (Object.keys(AGENT_CAPABILITIES) as AgentId[]);
    const distribution: Record<string, number> = {};

    for (const agentId of scope) {
      const agent = this.stateManager.getState().agents.get(agentId);
      if (agent) {
        distribution[agentId] = agent.metrics.queueDepth;
      }
    }

    // Calculate recommendations
    const recommendations: string[] = [];
    const totalLoad = Object.values(distribution).reduce((a, b) => a + b, 0);
    const avgLoad = totalLoad / scope.length;

    for (const [agentId, load] of Object.entries(distribution)) {
      if (load > avgLoad * 1.5) {
        recommendations.push(`${agentId} is overloaded (${load} tasks). Consider redistributing.`);
      } else if (load < avgLoad * 0.5 && avgLoad > 1) {
        recommendations.push(`${agentId} is underutilized (${load} tasks). Route more tasks here.`);
      }
    }

    return {
      action: 'balance_load',
      result: {
        loadDistribution: distribution as Record<AgentId, number>,
        recommendations,
      },
    };
  }

  /**
   * Coordinate multi-agent workflow
   */
  private async coordinate(
    input: OrchestratorInput,
    context: TaskContext
  ): Promise<OrchestratorOutput> {
    const scope = input.scope ?? [];

    // Emit coordination event
    await this.emitEvent(
      'task.assigned',
      context.correlationId,
      'coordination',
      { agents: scope, timestamp: new Date() },
      context.correlationId
    );

    return {
      action: 'coordinate',
      result: {
        recommendations: [`Coordination initiated for ${scope.length} agents`],
      },
    };
  }

  /**
   * Check health of agents
   */
  private async healthCheck(input: OrchestratorInput): Promise<OrchestratorOutput> {
    const scope = input.scope ?? (Object.keys(AGENT_CAPABILITIES) as AgentId[]);
    const healthStatus: Record<string, 'healthy' | 'degraded' | 'unhealthy'> = {};
    const recommendations: string[] = [];

    for (const agentId of scope) {
      const agent = this.stateManager.getState().agents.get(agentId);

      if (!agent) {
        healthStatus[agentId] = 'unhealthy';
        recommendations.push(`${agentId} is not registered`);
        continue;
      }

      if (agent.status === 'offline' || agent.status === 'error') {
        healthStatus[agentId] = 'unhealthy';
        recommendations.push(`${agentId} is ${agent.status}`);
      } else if (agent.metrics.successRate < 0.9) {
        healthStatus[agentId] = 'degraded';
        recommendations.push(
          `${agentId} success rate is low: ${(agent.metrics.successRate * 100).toFixed(1)}%`
        );
      } else if (agent.metrics.queueDepth > 10) {
        healthStatus[agentId] = 'degraded';
        recommendations.push(`${agentId} queue depth is high: ${agent.metrics.queueDepth}`);
      } else {
        healthStatus[agentId] = 'healthy';
      }
    }

    return {
      action: 'health_check',
      result: {
        healthStatus: healthStatus as Record<AgentId, 'healthy' | 'degraded' | 'unhealthy'>,
        recommendations,
      },
    };
  }

  /**
   * Find agents capable of handling a task type
   */
  private findCandidateAgents(taskType: string, targetCapabilities?: string[]): AgentId[] {
    const candidates: AgentId[] = [];

    for (const [agentId, capabilities] of Object.entries(AGENT_CAPABILITIES)) {
      const hasCapability = targetCapabilities
        ? targetCapabilities.some((cap) => capabilities.includes(cap))
        : capabilities.some((cap) => cap.includes(taskType) || taskType.includes(cap));

      if (hasCapability) {
        const agent = this.stateManager.getState().agents.get(agentId as AgentId);
        if (agent && agent.status !== 'offline' && agent.status !== 'error') {
          candidates.push(agentId as AgentId);
        }
      }
    }

    return candidates;
  }

  /**
   * Score an agent for task assignment
   */
  private scoreAgent(agentId: AgentId, priority: TaskPriority): RoutingDecision {
    const agent = this.stateManager.getState().agents.get(agentId);
    const reasons: string[] = [];
    let score = 100;

    if (!agent) {
      return { agentId, score: 0, reasons: ['Agent not found'] };
    }

    // Availability score (0-30 points)
    if (agent.status === 'idle') {
      score += 30;
      reasons.push('Agent is idle (+30)');
    } else if (agent.status === 'processing') {
      score += 10;
      reasons.push('Agent is processing (+10)');
    }

    // Queue depth penalty (-5 per queued task)
    const queuePenalty = agent.metrics.queueDepth * 5;
    score -= queuePenalty;
    if (queuePenalty > 0) {
      reasons.push(`Queue depth penalty (-${queuePenalty})`);
    }

    // Success rate bonus (0-20 points)
    const successBonus = Math.floor(agent.metrics.successRate * 20);
    score += successBonus;
    reasons.push(`Success rate bonus (+${successBonus})`);

    // Processing speed bonus (0-15 points)
    if (agent.metrics.avgProcessingTime < 1000) {
      score += 15;
      reasons.push('Fast processing (+15)');
    } else if (agent.metrics.avgProcessingTime < 5000) {
      score += 10;
      reasons.push('Good processing speed (+10)');
    }

    // Priority tier matching
    if (priority === 'critical' && agent.config.tier === 1) {
      score += 20;
      reasons.push('Tier 1 for critical task (+20)');
    }

    return { agentId, score: Math.max(0, score), reasons };
  }

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  protected async onInitialize(): Promise<void> {
    this.logger.info('Orchestrator agent initializing');

    // Initialize agent loads tracking
    for (const agentId of Object.keys(AGENT_CAPABILITIES) as AgentId[]) {
      this.agentLoads.set(agentId, 0);
    }
  }

  protected async onShutdown(): Promise<void> {
    this.logger.info('Orchestrator agent shutting down');
    this.taskQueue.clear();
    this.agentLoads.clear();
  }

  protected getSubscribedEvents(): EventType[] {
    return [
      'task.submitted',
      'task.completed',
      'task.failed',
      'agent.joined',
      'agent.left',
      'agent.error',
    ];
  }

  protected async handleEvent(event: DomainEvent): Promise<void> {
    switch (event.type) {
      case 'task.submitted':
        this.logger.debug('Task submitted', { taskId: event.aggregateId });
        break;

      case 'task.completed':
        // Decrement agent load
        const completedPayload = event.payload as { agentId?: AgentId };
        if (completedPayload.agentId) {
          const currentLoad = this.agentLoads.get(completedPayload.agentId) ?? 1;
          this.agentLoads.set(completedPayload.agentId, Math.max(0, currentLoad - 1));
        }
        break;

      case 'agent.joined':
        const joinedPayload = event.payload as { agentId: AgentId };
        this.agentLoads.set(joinedPayload.agentId, 0);
        this.logger.info('Agent joined swarm', { agentId: joinedPayload.agentId });
        break;

      case 'agent.left':
        const leftPayload = event.payload as { agentId: AgentId };
        this.agentLoads.delete(leftPayload.agentId);
        this.logger.info('Agent left swarm', { agentId: leftPayload.agentId });
        break;

      case 'agent.error':
        this.logger.warn('Agent error detected', { eventId: event.id });
        break;
    }
  }
}
