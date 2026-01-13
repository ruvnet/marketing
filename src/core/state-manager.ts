/**
 * State Manager - Centralized State Management for Agent Swarm
 * Provides reactive state updates with event sourcing
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  AgentId,
  AgentState,
  AgentStatus,
  Task,
  TaskStatus,
  Campaign,
  Creative,
} from '../types/index.js';
import { EventBus, getEventBus } from './event-bus.js';

export interface SwarmState {
  id: string;
  name: string;
  status: 'initializing' | 'running' | 'paused' | 'shutdown';
  agents: Map<AgentId, AgentState>;
  tasks: Map<string, Task>;
  campaigns: Map<string, Campaign>;
  creatives: Map<string, Creative>;
  metrics: SwarmMetrics;
  startedAt: Date;
  lastUpdate: Date;
}

export interface SwarmMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  avgProcessingTime: number;
  activeAgents: number;
  queuedTasks: number;
  eventsProcessed: number;
}

export type StateSubscriber = (state: SwarmState) => void;

export interface StateManagerConfig {
  persistState: boolean;
  snapshotInterval: number;
  maxSnapshots: number;
}

const DEFAULT_CONFIG: StateManagerConfig = {
  persistState: false,
  snapshotInterval: 60000, // 1 minute
  maxSnapshots: 100,
};

/**
 * StateManager provides centralized state management with:
 * - Reactive updates via subscriptions
 * - State snapshots for recovery
 * - Event-sourced state changes
 */
export class StateManager {
  private state: SwarmState;
  private subscribers: Map<string, StateSubscriber>;
  private snapshots: SwarmState[];
  private eventBus: EventBus;
  private config: StateManagerConfig;
  private snapshotTimer?: NodeJS.Timeout;

  constructor(name: string, config: Partial<StateManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.subscribers = new Map();
    this.snapshots = [];
    this.eventBus = getEventBus();

    this.state = {
      id: uuidv4(),
      name,
      status: 'initializing',
      agents: new Map(),
      tasks: new Map(),
      campaigns: new Map(),
      creatives: new Map(),
      metrics: {
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        avgProcessingTime: 0,
        activeAgents: 0,
        queuedTasks: 0,
        eventsProcessed: 0,
      },
      startedAt: new Date(),
      lastUpdate: new Date(),
    };

    this.setupEventHandlers();
  }

  /**
   * Get current state (readonly clone)
   */
  getState(): Readonly<SwarmState> {
    return {
      ...this.state,
      agents: new Map(this.state.agents),
      tasks: new Map(this.state.tasks),
      campaigns: new Map(this.state.campaigns),
      creatives: new Map(this.state.creatives),
    };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback: StateSubscriber): string {
    const id = uuidv4();
    this.subscribers.set(id, callback);
    return id;
  }

  /**
   * Unsubscribe from state changes
   */
  unsubscribe(subscriptionId: string): boolean {
    return this.subscribers.delete(subscriptionId);
  }

  /**
   * Update swarm status
   */
  setSwarmStatus(status: SwarmState['status']): void {
    this.state.status = status;
    this.notifySubscribers();
  }

  /**
   * Register an agent
   */
  registerAgent(agentState: AgentState): void {
    this.state.agents.set(agentState.id, agentState);
    this.state.metrics.activeAgents = this.countActiveAgents();
    this.notifySubscribers();
  }

  /**
   * Update agent state
   */
  updateAgent(agentId: AgentId, updates: Partial<AgentState>): void {
    const agent = this.state.agents.get(agentId);
    if (agent) {
      this.state.agents.set(agentId, { ...agent, ...updates });
      this.state.metrics.activeAgents = this.countActiveAgents();
      this.notifySubscribers();
    }
  }

  /**
   * Update agent status
   */
  updateAgentStatus(agentId: AgentId, status: AgentStatus): void {
    const agent = this.state.agents.get(agentId);
    if (agent) {
      agent.status = status;
      this.state.metrics.activeAgents = this.countActiveAgents();
      this.notifySubscribers();
    }
  }

  /**
   * Remove an agent
   */
  removeAgent(agentId: AgentId): void {
    this.state.agents.delete(agentId);
    this.state.metrics.activeAgents = this.countActiveAgents();
    this.notifySubscribers();
  }

  /**
   * Add a task
   */
  addTask(task: Task): void {
    this.state.tasks.set(task.id, task);
    this.state.metrics.totalTasks++;
    this.state.metrics.queuedTasks = this.countQueuedTasks();
    this.notifySubscribers();
  }

  /**
   * Update task status
   */
  updateTask(taskId: string, updates: Partial<Task>): void {
    const task = this.state.tasks.get(taskId);
    if (task) {
      const updatedTask = { ...task, ...updates, updatedAt: new Date() };
      this.state.tasks.set(taskId, updatedTask);

      // Update metrics
      if (updates.status === 'completed') {
        this.state.metrics.completedTasks++;
        this.updateAvgProcessingTime(updatedTask);
      } else if (updates.status === 'failed') {
        this.state.metrics.failedTasks++;
      }
      this.state.metrics.queuedTasks = this.countQueuedTasks();

      this.notifySubscribers();
    }
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): Task | undefined {
    return this.state.tasks.get(taskId);
  }

  /**
   * Get all tasks by status
   */
  getTasksByStatus(status: TaskStatus): Task[] {
    return Array.from(this.state.tasks.values()).filter(
      (task) => task.status === status
    );
  }

  /**
   * Add a campaign
   */
  addCampaign(campaign: Campaign): void {
    this.state.campaigns.set(campaign.id, campaign);
    this.notifySubscribers();
  }

  /**
   * Update campaign
   */
  updateCampaign(campaignId: string, updates: Partial<Campaign>): void {
    const campaign = this.state.campaigns.get(campaignId);
    if (campaign) {
      this.state.campaigns.set(campaignId, {
        ...campaign,
        ...updates,
        updatedAt: new Date(),
      });
      this.notifySubscribers();
    }
  }

  /**
   * Get campaign by ID
   */
  getCampaign(campaignId: string): Campaign | undefined {
    return this.state.campaigns.get(campaignId);
  }

  /**
   * Add a creative
   */
  addCreative(creative: Creative): void {
    this.state.creatives.set(creative.id, creative);
    this.notifySubscribers();
  }

  /**
   * Update creative
   */
  updateCreative(creativeId: string, updates: Partial<Creative>): void {
    const creative = this.state.creatives.get(creativeId);
    if (creative) {
      this.state.creatives.set(creativeId, {
        ...creative,
        ...updates,
        updatedAt: new Date(),
      });
      this.notifySubscribers();
    }
  }

  /**
   * Get creative by ID
   */
  getCreative(creativeId: string): Creative | undefined {
    return this.state.creatives.get(creativeId);
  }

  /**
   * Create a state snapshot
   */
  createSnapshot(): void {
    const snapshot = this.cloneState();
    this.snapshots.push(snapshot);

    // Trim snapshots if needed
    if (this.snapshots.length > this.config.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-this.config.maxSnapshots);
    }
  }

  /**
   * Restore from snapshot
   */
  restoreSnapshot(index: number): boolean {
    if (index < 0 || index >= this.snapshots.length) {
      return false;
    }

    const snapshot = this.snapshots[index];
    this.state = this.cloneState(snapshot);
    this.notifySubscribers();
    return true;
  }

  /**
   * Get all snapshots
   */
  getSnapshots(): SwarmState[] {
    return this.snapshots.map((s) => this.cloneState(s));
  }

  /**
   * Start automatic snapshots
   */
  startAutoSnapshot(): void {
    if (this.snapshotTimer) return;

    this.snapshotTimer = setInterval(() => {
      this.createSnapshot();
    }, this.config.snapshotInterval);
  }

  /**
   * Stop automatic snapshots
   */
  stopAutoSnapshot(): void {
    if (this.snapshotTimer) {
      clearInterval(this.snapshotTimer);
      this.snapshotTimer = undefined;
    }
  }

  /**
   * Increment events processed counter
   */
  incrementEventsProcessed(): void {
    this.state.metrics.eventsProcessed++;
  }

  /**
   * Get swarm metrics
   */
  getMetrics(): SwarmMetrics {
    return { ...this.state.metrics };
  }

  /**
   * Shutdown state manager
   */
  shutdown(): void {
    this.stopAutoSnapshot();
    this.subscribers.clear();
    this.createSnapshot(); // Final snapshot
  }

  /**
   * Setup event handlers for state updates
   */
  private setupEventHandlers(): void {
    this.eventBus.subscribe('*', (event) => {
      this.state.lastUpdate = new Date();
      this.incrementEventsProcessed();
    });
  }

  /**
   * Notify all subscribers of state change
   */
  private notifySubscribers(): void {
    this.state.lastUpdate = new Date();
    const stateCopy = this.getState();
    this.subscribers.forEach((callback) => {
      try {
        callback(stateCopy);
      } catch (error) {
        console.error('State subscriber error:', error);
      }
    });
  }

  /**
   * Count active agents
   */
  private countActiveAgents(): number {
    return Array.from(this.state.agents.values()).filter(
      (agent) => agent.status !== 'offline'
    ).length;
  }

  /**
   * Count queued tasks
   */
  private countQueuedTasks(): number {
    return Array.from(this.state.tasks.values()).filter(
      (task) => task.status === 'pending' || task.status === 'assigned'
    ).length;
  }

  /**
   * Update average processing time
   */
  private updateAvgProcessingTime(task: Task): void {
    if (!task.startedAt || !task.completedAt) return;

    const processingTime =
      task.completedAt.getTime() - task.startedAt.getTime();
    const { avgProcessingTime, completedTasks } = this.state.metrics;

    // Rolling average
    this.state.metrics.avgProcessingTime =
      (avgProcessingTime * (completedTasks - 1) + processingTime) /
      completedTasks;
  }

  /**
   * Clone state for snapshots
   */
  private cloneState(source?: SwarmState): SwarmState {
    const s = source ?? this.state;
    return {
      ...s,
      agents: new Map(s.agents),
      tasks: new Map(s.tasks),
      campaigns: new Map(s.campaigns),
      creatives: new Map(s.creatives),
      metrics: { ...s.metrics },
      startedAt: new Date(s.startedAt),
      lastUpdate: new Date(s.lastUpdate),
    };
  }
}

// Singleton instance
let globalStateManager: StateManager | null = null;

export function getStateManager(name?: string): StateManager {
  if (!globalStateManager) {
    globalStateManager = new StateManager(name ?? 'AI Marketing Swarm');
  }
  return globalStateManager;
}

export function resetStateManager(): void {
  if (globalStateManager) {
    globalStateManager.shutdown();
    globalStateManager = null;
  }
}
