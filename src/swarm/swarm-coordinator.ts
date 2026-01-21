/**
 * Swarm Coordinator
 * Central coordination layer for the 15-agent marketing swarm
 * Manages lifecycle, routing, and inter-agent communication
 */

import { EventEmitter } from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';
import { getEventBus, EventBus } from '../core/event-bus';
import { getStateManager, StateManager } from '../core/state-manager';
import { createLogger, Logger } from '../core/logger';
import { BaseAgent } from '../agents/base-agent';
import {
  Task,
  TaskType,
  TaskPriority,
  TaskStatus,
  DomainEvent,
  AgentId,
  Campaign,
  Creative,
} from '../types';

// Import all 15 agents
import { OrchestratorAgent } from '../agents/tier1/orchestrator-agent';
import { MemoryAgent } from '../agents/tier1/memory-agent';
import { QualityAgent } from '../agents/tier1/quality-agent';
import { SimulationAgent } from '../agents/tier2/simulation-agent';
import { HistoricalMemoryAgent } from '../agents/tier2/historical-memory-agent';
import { RiskDetectionAgent } from '../agents/tier2/risk-detection-agent';
import { AttentionArbitrageAgent } from '../agents/tier2/attention-arbitrage-agent';
import { CreativeGenomeAgent } from '../agents/tier3/creative-genome-agent';
import { FatigueForecasterAgent } from '../agents/tier3/fatigue-forecaster-agent';
import { MutationAgent } from '../agents/tier3/mutation-agent';
import { CounterfactualAgent } from '../agents/tier4/counterfactual-agent';
import { CausalGraphBuilderAgent } from '../agents/tier4/causal-graph-builder-agent';
import { IncrementalityAuditorAgent } from '../agents/tier4/incrementality-auditor-agent';
import { AccountHealthAgent } from '../agents/tier5/account-health-agent';
import { CrossPlatformAgent } from '../agents/tier5/cross-platform-agent';

export interface SwarmConfig {
  enabledAgents?: AgentId[];
  maxConcurrentTasks?: number;
  healthCheckInterval?: number;
  autoRecovery?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export interface SwarmStatus {
  status: 'initializing' | 'running' | 'degraded' | 'stopped' | 'error';
  activeAgents: number;
  totalAgents: number;
  agentStatuses: Map<AgentId, AgentStatus>;
  uptime: number;
  tasksProcessed: number;
  lastHealthCheck: Date | null;
}

export interface AgentStatus {
  id: AgentId;
  status: 'initializing' | 'running' | 'stopped' | 'error';
  queueLength: number;
  tasksProcessed: number;
  lastActivity: Date | null;
  errorCount: number;
}

export interface SwarmMetrics {
  totalTasksSubmitted: number;
  totalTasksCompleted: number;
  totalTasksFailed: number;
  averageTaskDuration: number;
  tasksByType: Map<TaskType, number>;
  tasksByAgent: Map<AgentId, number>;
  errorRate: number;
  throughput: number;
}

const DEFAULT_CONFIG: SwarmConfig = {
  maxConcurrentTasks: 100,
  healthCheckInterval: 30000,
  autoRecovery: true,
  logLevel: 'info',
};

export class SwarmCoordinator extends EventEmitter {
  private readonly agents: Map<AgentId, BaseAgent> = new Map();
  private readonly eventBus: EventBus;
  private readonly stateManager: StateManager;
  private readonly logger: Logger;
  private readonly config: SwarmConfig;

  private status: SwarmStatus['status'] = 'stopped';
  private startTime: Date | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private metrics: SwarmMetrics;

  constructor(config: Partial<SwarmConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.eventBus = getEventBus();
    this.stateManager = getStateManager();
    this.logger = createLogger('swarm-coordinator');

    this.metrics = {
      totalTasksSubmitted: 0,
      totalTasksCompleted: 0,
      totalTasksFailed: 0,
      averageTaskDuration: 0,
      tasksByType: new Map(),
      tasksByAgent: new Map(),
      errorRate: 0,
      throughput: 0,
    };

    this.setupEventHandlers();
  }

  /**
   * Initialize and start the swarm
   */
  async start(): Promise<void> {
    if (this.status === 'running') {
      this.logger.warn('Swarm is already running');
      return;
    }

    this.logger.info('Starting AI Marketing Swarm...');
    this.status = 'initializing';
    this.startTime = new Date();

    try {
      // Initialize agents in tier order (dependencies first)
      await this.initializeAgents();

      // Start health monitoring
      this.startHealthMonitoring();

      this.status = 'running';
      this.logger.info('Swarm started successfully', {
        activeAgents: this.agents.size,
        config: this.config,
      });

      this.emit('swarm:started', { timestamp: new Date() });
      this.eventBus.publish({
        id: uuidv4(),
        type: 'swarm.started',
        timestamp: new Date(),
        source: 'swarm-coordinator',
        payload: { agentCount: this.agents.size },
      });
    } catch (error) {
      this.status = 'error';
      this.logger.error('Failed to start swarm', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Gracefully stop the swarm
   */
  async stop(): Promise<void> {
    if (this.status === 'stopped') {
      this.logger.warn('Swarm is already stopped');
      return;
    }

    this.logger.info('Stopping AI Marketing Swarm...');

    // Stop health monitoring
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    // Shutdown agents in reverse tier order
    const agentIds = Array.from(this.agents.keys()).reverse();
    for (const agentId of agentIds) {
      const agent = this.agents.get(agentId);
      if (agent) {
        try {
          await agent.shutdown();
          this.logger.debug(`Agent ${agentId} shutdown complete`);
        } catch (error) {
          this.logger.error(`Error shutting down agent ${agentId}`, error instanceof Error ? error : new Error(String(error)));
        }
      }
    }

    this.agents.clear();
    this.status = 'stopped';
    this.startTime = null;

    this.logger.info('Swarm stopped successfully');
    this.emit('swarm:stopped', { timestamp: new Date() });
  }

  /**
   * Submit a task to the swarm
   */
  async submitTask(
    type: TaskType,
    payload: Record<string, unknown>,
    options: {
      priority?: TaskPriority;
      targetAgent?: AgentId;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<Task> {
    if (this.status !== 'running') {
      throw new Error(`Cannot submit task: swarm is ${this.status}`);
    }

    const task: Task = {
      id: uuidv4(),
      type,
      priority: options.priority || 'medium',
      status: 'pending',
      payload,
      metadata: {
        ...options.metadata,
        submittedAt: new Date().toISOString(),
        targetAgent: options.targetAgent,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.metrics.totalTasksSubmitted++;
    this.incrementTaskTypeCount(type);

    // Register task in state manager
    this.stateManager.addTask(task);

    // Route to orchestrator for distribution (or direct to target agent)
    const targetAgent = options.targetAgent || 'orchestrator';
    const agent = this.agents.get(targetAgent);

    if (!agent) {
      throw new Error(`Target agent ${targetAgent} not found`);
    }

    this.logger.debug('Submitting task', { taskId: task.id, type, targetAgent });

    // Submit to agent queue
    agent.submitTask(task);

    return task;
  }

  /**
   * Submit a campaign for processing
   */
  async submitCampaign(campaign: Campaign): Promise<void> {
    this.stateManager.addCampaign(campaign);

    // Orchestrator will coordinate the campaign workflow
    await this.submitTask('campaign_optimization', { campaign }, { priority: 'high' });

    this.logger.info('Campaign submitted for processing', { campaignId: campaign.id });
  }

  /**
   * Submit a creative for analysis
   */
  async submitCreative(creative: Creative): Promise<void> {
    this.stateManager.addCreative(creative);

    // Creative genome agent will analyze the creative
    await this.submitTask(
      'creative_analysis',
      { creative },
      { targetAgent: 'creative-genome', priority: 'medium' }
    );

    this.logger.info('Creative submitted for analysis', { creativeId: creative.id });
  }

  /**
   * Get current swarm status
   */
  getStatus(): SwarmStatus {
    const agentStatuses = new Map<AgentId, AgentStatus>();

    for (const [id, agent] of this.agents) {
      const state = agent.getState();
      agentStatuses.set(id, {
        id,
        status: this.mapAgentStatus(state.status),
        queueLength: agent.getQueueDepth(),
        tasksProcessed: state.metrics.tasksProcessed,
        lastActivity: state.metrics.lastActive,
        errorCount: state.metrics.successRate < 1 ? Math.round((1 - state.metrics.successRate) * state.metrics.tasksProcessed) : 0,
      });
    }

    return {
      status: this.status,
      activeAgents: Array.from(agentStatuses.values()).filter(
        (s) => s.status === 'running'
      ).length,
      totalAgents: this.agents.size,
      agentStatuses,
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
      tasksProcessed: this.metrics.totalTasksCompleted,
      lastHealthCheck: null,
    };
  }

  /**
   * Get swarm metrics
   */
  getMetrics(): SwarmMetrics {
    return { ...this.metrics };
  }

  /**
   * Get a specific agent
   */
  getAgent<T extends BaseAgent>(agentId: AgentId): T | undefined {
    return this.agents.get(agentId) as T | undefined;
  }

  /**
   * Run diagnostics on the swarm
   */
  async runDiagnostics(): Promise<Map<AgentId, unknown>> {
    const diagnostics = new Map<AgentId, unknown>();

    for (const [id, agent] of this.agents) {
      try {
        const state = agent.getState();
        diagnostics.set(id, {
          healthy: state.status !== 'error' && state.status !== 'offline',
          status: state.status,
          metrics: state.metrics,
          lastError: state.lastError,
        });
      } catch (error) {
        diagnostics.set(id, { error: String(error), healthy: false });
      }
    }

    return diagnostics;
  }

  /**
   * Map BaseAgent status to local AgentStatus type
   */
  private mapAgentStatus(status: import('../types').AgentStatus): 'initializing' | 'running' | 'stopped' | 'error' {
    switch (status) {
      case 'idle':
      case 'processing':
        return 'running';
      case 'error':
        return 'error';
      case 'offline':
        return 'stopped';
      default:
        return 'running';
    }
  }

  /**
   * Initialize all 15 agents in dependency order
   */
  private async initializeAgents(): Promise<void> {
    const enabledAgents = this.config.enabledAgents;

    const deps = { eventBus: this.eventBus, stateManager: this.stateManager };

    // Tier 1: Core Coordination (no dependencies)
    await this.initializeAgent(
      'orchestrator',
      () => new OrchestratorAgent(deps),
      enabledAgents
    );
    await this.initializeAgent(
      'memory',
      () => new MemoryAgent(deps),
      enabledAgents
    );
    await this.initializeAgent(
      'quality',
      () => new QualityAgent(deps),
      enabledAgents
    );

    // Tier 2: Intelligence Layer (depends on Tier 1)
    await this.initializeAgent(
      'simulation',
      () => new SimulationAgent(deps),
      enabledAgents
    );
    await this.initializeAgent(
      'historical-memory',
      () => new HistoricalMemoryAgent(deps),
      enabledAgents
    );
    await this.initializeAgent(
      'risk-detection',
      () => new RiskDetectionAgent(deps),
      enabledAgents
    );
    await this.initializeAgent(
      'attention-arbitrage',
      () => new AttentionArbitrageAgent(deps),
      enabledAgents
    );

    // Tier 3: Creative Intelligence (depends on Tier 1, 2)
    await this.initializeAgent(
      'creative-genome',
      () => new CreativeGenomeAgent(deps),
      enabledAgents
    );
    await this.initializeAgent(
      'fatigue-forecaster',
      () => new FatigueForecasterAgent(deps),
      enabledAgents
    );
    await this.initializeAgent(
      'mutation',
      () => new MutationAgent(deps),
      enabledAgents
    );

    // Tier 4: Attribution & Causality (depends on Tier 1, 2, 3)
    await this.initializeAgent(
      'counterfactual',
      () => new CounterfactualAgent(deps),
      enabledAgents
    );
    await this.initializeAgent(
      'causal-graph',
      () => new CausalGraphBuilderAgent(deps),
      enabledAgents
    );
    await this.initializeAgent(
      'incrementality',
      () => new IncrementalityAuditorAgent(deps),
      enabledAgents
    );

    // Tier 5: Operations (depends on all other tiers)
    await this.initializeAgent(
      'account-health',
      () => new AccountHealthAgent(deps),
      enabledAgents
    );
    await this.initializeAgent(
      'cross-platform',
      () => new CrossPlatformAgent(deps),
      enabledAgents
    );

    this.logger.info(`Initialized ${this.agents.size} agents`);
  }

  /**
   * Initialize a single agent
   */
  private async initializeAgent(
    agentId: AgentId,
    factory: () => BaseAgent,
    enabledAgents?: AgentId[]
  ): Promise<void> {
    // Skip if not in enabled list (when list is provided)
    if (enabledAgents && !enabledAgents.includes(agentId)) {
      this.logger.debug(`Skipping disabled agent: ${agentId}`);
      return;
    }

    try {
      const agent = factory();
      await agent.initialize();
      this.agents.set(agentId, agent);
      this.stateManager.registerAgent(agent.getState());
      this.logger.debug(`Agent ${agentId} initialized`);
    } catch (error) {
      this.logger.error(`Failed to initialize agent ${agentId}`, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Get the tier number for an agent
   */
  private getAgentTier(agentId: AgentId): number {
    const tierMap: Record<AgentId, number> = {
      orchestrator: 1,
      memory: 1,
      quality: 1,
      simulation: 2,
      'historical-memory': 2,
      'risk-detection': 2,
      'attention-arbitrage': 2,
      'creative-genome': 3,
      'fatigue-forecaster': 3,
      mutation: 3,
      counterfactual: 4,
      'causal-graph': 4,
      incrementality: 4,
      'account-health': 5,
      'cross-platform': 5,
    };
    return tierMap[agentId] || 0;
  }

  /**
   * Setup event handlers for swarm-wide events
   */
  private setupEventHandlers(): void {
    // Track task completions
    this.eventBus.subscribe('task.*', (event: DomainEvent) => {
      if (event.type === 'task.completed') {
        this.metrics.totalTasksCompleted++;
        const payload = event.payload as { duration?: number } | undefined;
        this.updateAverageTaskDuration(payload?.duration ?? 0);
      } else if (event.type === 'task.failed') {
        this.metrics.totalTasksFailed++;
        this.updateErrorRate();
      }
    });

    // Track agent events
    this.eventBus.subscribe('agent.*', (event: DomainEvent) => {
      if (event.type === 'agent.error' && this.config.autoRecovery) {
        this.handleAgentError(event);
      }
    });
  }

  /**
   * Start periodic health monitoring
   */
  private startHealthMonitoring(): void {
    if (!this.config.healthCheckInterval) return;

    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform health check on all agents
   */
  private async performHealthCheck(): Promise<void> {
    let healthyCount = 0;
    const unhealthyAgents: AgentId[] = [];

    for (const [id, agent] of this.agents) {
      try {
        const state = agent.getState();
        const isHealthy = state.status !== 'error' && state.status !== 'offline';
        if (isHealthy) {
          healthyCount++;
        } else {
          unhealthyAgents.push(id);
        }
      } catch {
        unhealthyAgents.push(id);
      }
    }

    // Update swarm status based on agent health
    if (unhealthyAgents.length === 0) {
      this.status = 'running';
    } else if (unhealthyAgents.length < this.agents.size / 2) {
      this.status = 'degraded';
      this.logger.warn(`Swarm operating in degraded mode. Unhealthy agents: ${unhealthyAgents.join(', ')}`);
    } else {
      this.status = 'error';
      this.logger.error(`Swarm in error state. Unhealthy agents: ${unhealthyAgents.join(', ')}`);
    }

    this.emit('swarm:healthcheck', {
      healthy: healthyCount,
      unhealthy: unhealthyAgents,
      status: this.status,
    });
  }

  /**
   * Handle agent errors with auto-recovery
   */
  private async handleAgentError(event: DomainEvent): Promise<void> {
    const agentId = event.source as AgentId;
    this.logger.warn(`Agent error detected: ${agentId}`, { event });

    if (this.config.autoRecovery) {
      try {
        const agent = this.agents.get(agentId);
        if (agent) {
          this.logger.info(`Attempting to recover agent: ${agentId}`);
          await agent.shutdown();
          await agent.initialize();
          this.logger.info(`Agent ${agentId} recovered successfully`);
        }
      } catch (error) {
        this.logger.error(`Failed to recover agent: ${agentId}`, error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  /**
   * Update average task duration metric
   */
  private updateAverageTaskDuration(duration: number): void {
    if (!duration) return;
    const total = this.metrics.totalTasksCompleted;
    const current = this.metrics.averageTaskDuration;
    this.metrics.averageTaskDuration = (current * (total - 1) + duration) / total;
  }

  /**
   * Update error rate metric
   */
  private updateErrorRate(): void {
    const total = this.metrics.totalTasksCompleted + this.metrics.totalTasksFailed;
    this.metrics.errorRate = total > 0 ? this.metrics.totalTasksFailed / total : 0;
  }

  /**
   * Increment task type count
   */
  private incrementTaskTypeCount(type: TaskType): void {
    const current = this.metrics.tasksByType.get(type) || 0;
    this.metrics.tasksByType.set(type, current + 1);
  }
}

// Singleton instance
let swarmInstance: SwarmCoordinator | null = null;

export function getSwarmCoordinator(config?: Partial<SwarmConfig>): SwarmCoordinator {
  if (!swarmInstance) {
    swarmInstance = new SwarmCoordinator(config);
  }
  return swarmInstance;
}

export function resetSwarmCoordinator(): void {
  if (swarmInstance) {
    swarmInstance.stop().catch(console.error);
    swarmInstance = null;
  }
}
