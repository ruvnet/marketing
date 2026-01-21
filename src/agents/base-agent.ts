/**
 * Base Agent - Foundation for All 15 Swarm Agents
 * Provides common functionality for task processing, communication, and lifecycle
 */

import { v4 as uuidv4 } from 'uuid';
import PQueue from 'p-queue';
import type {
  AgentId,
  AgentConfig,
  AgentState,
  AgentStatus,
  AgentCapability,
  AgentMetrics,
  Task,
  TaskResult,
  TaskContext,
  DomainEvent,
  EventType,
} from '../types/index.js';
import { EventBus, getEventBus } from '../core/event-bus.js';
import { StateManager, getStateManager } from '../core/state-manager.js';
import { Logger, createAgentLogger, createTimer } from '../core/logger.js';

export interface AgentDependencies {
  eventBus?: EventBus;
  stateManager?: StateManager;
  logger?: Logger;
}

export abstract class BaseAgent<TInput = unknown, TOutput = unknown> {
  protected readonly id: AgentId;
  protected readonly config: AgentConfig;
  protected readonly eventBus: EventBus;
  protected readonly stateManager: StateManager;
  protected readonly logger: Logger;
  protected readonly queue: PQueue;

  private status: AgentStatus = 'idle';
  private currentTask: string | null = null;
  private metrics: AgentMetrics;
  private lastError: string | null = null;
  private subscriptionIds: string[] = [];
  private isShuttingDown = false;

  constructor(config: AgentConfig, deps: AgentDependencies = {}) {
    this.id = config.id;
    this.config = config;
    this.eventBus = deps.eventBus ?? getEventBus();
    this.stateManager = deps.stateManager ?? getStateManager();
    this.logger = deps.logger ?? createAgentLogger(config.id);

    this.queue = new PQueue({
      concurrency: config.maxConcurrency,
      timeout: config.timeoutMs,
    });

    this.metrics = {
      tasksProcessed: 0,
      avgProcessingTime: 0,
      successRate: 1,
      lastActive: new Date(),
      memoryUsage: 0,
      queueDepth: 0,
    };

    this.setupQueueEvents();
  }

  /**
   * Initialize the agent
   */
  async initialize(): Promise<void> {
    this.logger.info(`Initializing agent: ${this.config.name}`);

    try {
      // Register with state manager
      this.stateManager.registerAgent(this.getState());

      // Subscribe to relevant events
      await this.subscribeToEvents();

      // Run agent-specific initialization
      await this.onInitialize();

      this.setStatus('idle');
      this.logger.info(`Agent initialized: ${this.config.name}`);

      // Emit agent joined event
      await this.eventBus.emit(
        'agent.joined',
        this.id,
        'agent',
        { agentId: this.id, config: this.config }
      );
    } catch (error) {
      this.setStatus('error');
      this.lastError = (error as Error).message;
      this.logger.error('Agent initialization failed', error as Error);
      throw error;
    }
  }

  /**
   * Shutdown the agent
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    this.logger.info(`Shutting down agent: ${this.config.name}`);

    try {
      // Clear queue
      this.queue.clear();
      await this.queue.onIdle();

      // Unsubscribe from events
      this.subscriptionIds.forEach((id) => this.eventBus.unsubscribe(id));

      // Run agent-specific shutdown
      await this.onShutdown();

      this.setStatus('offline');

      // Remove from state manager
      this.stateManager.removeAgent(this.id);

      // Emit agent left event
      await this.eventBus.emit(
        'agent.left',
        this.id,
        'agent',
        { agentId: this.id }
      );

      this.logger.info(`Agent shutdown complete: ${this.config.name}`);
    } catch (error) {
      this.logger.error('Agent shutdown error', error as Error);
      throw error;
    }
  }

  /**
   * Submit a task to this agent
   */
  async submitTask(task: Task<TInput, TOutput>): Promise<TaskResult<TOutput>> {
    if (this.isShuttingDown) {
      throw new Error('Agent is shutting down');
    }

    return this.queue.add(async () => {
      const timer = createTimer();

      try {
        this.setStatus('processing');
        this.currentTask = task.id;
        task.status = 'processing';
        task.startedAt = new Date();

        this.stateManager.updateTask(task.id, {
          status: 'processing',
          assignedTo: this.id,
          startedAt: task.startedAt,
        });

        await this.eventBus.emit(
          'task.started',
          task.id,
          'task',
          { taskId: task.id, agentId: this.id },
          { correlationId: task.context?.correlationId }
        );

        // Execute the task - use payload (primary) or input (alias)
        const taskInput = task.payload ?? task.input;
        const taskContext = task.context ?? { correlationId: task.id, metadata: {} };
        const result = await this.process(taskInput as TInput, taskContext);

        // Update metrics
        this.updateMetrics(timer(), true);

        task.status = 'completed';
        task.completedAt = new Date();
        task.output = result;

        this.stateManager.updateTask(task.id, {
          status: 'completed',
          output: result,
          completedAt: task.completedAt,
        });

        await this.eventBus.emit(
          'task.completed',
          task.id,
          'task',
          { taskId: task.id, agentId: this.id, result },
          { correlationId: task.context?.correlationId }
        );

        this.setStatus('idle');
        this.currentTask = null;

        return {
          success: true,
          data: result,
          metrics: {
            processingTime: timer(),
            memoryUsed: this.getMemoryUsage(),
          },
        };
      } catch (error) {
        this.updateMetrics(timer(), false);
        this.lastError = (error as Error).message;

        task.status = 'failed';
        task.error = (error as Error).message;

        this.stateManager.updateTask(task.id, {
          status: 'failed',
          error: (error as Error).message,
        });

        await this.eventBus.emit(
          'task.failed',
          task.id,
          'task',
          { taskId: task.id, agentId: this.id, error: (error as Error).message },
          { correlationId: task.context?.correlationId }
        );

        this.setStatus('idle');
        this.currentTask = null;

        this.logger.error('Task processing failed', error as Error, {
          taskId: task.id,
        });

        return {
          success: false,
          error: (error as Error).message,
          metrics: {
            processingTime: timer(),
            memoryUsed: this.getMemoryUsage(),
          },
        };
      }
    }) as Promise<TaskResult<TOutput>>;
  }

  /**
   * Get current agent state
   */
  getState(): AgentState {
    return {
      id: this.id,
      status: this.status,
      currentTask: this.currentTask,
      metrics: { ...this.metrics },
      lastError: this.lastError,
      config: this.config,
    };
  }

  /**
   * Get agent ID
   */
  getId(): AgentId {
    return this.id;
  }

  /**
   * Get agent capabilities
   */
  getCapabilities(): AgentCapability[] {
    return this.config.capabilities;
  }

  /**
   * Check if agent can handle a task type
   */
  canHandle(taskType: string): boolean {
    return this.config.capabilities.some(
      (cap) => cap.inputTypes.includes(taskType) || cap.id === taskType
    );
  }

  /**
   * Get current status
   */
  getStatus(): AgentStatus {
    return this.status;
  }

  /**
   * Check if agent is available for tasks
   */
  isAvailable(): boolean {
    return (
      this.status === 'idle' &&
      !this.isShuttingDown &&
      this.queue.size < this.config.maxConcurrency
    );
  }

  /**
   * Get queue depth
   */
  getQueueDepth(): number {
    return this.queue.size + this.queue.pending;
  }

  // ============================================================================
  // Abstract Methods (Must be implemented by each agent)
  // ============================================================================

  /**
   * Process a task - main agent logic
   */
  protected abstract process(input: TInput, context: TaskContext): Promise<TOutput>;

  /**
   * Agent-specific initialization
   */
  protected abstract onInitialize(): Promise<void>;

  /**
   * Agent-specific shutdown
   */
  protected abstract onShutdown(): Promise<void>;

  /**
   * Get events this agent subscribes to
   */
  protected abstract getSubscribedEvents(): EventType[];

  /**
   * Handle incoming events
   */
  protected abstract handleEvent(event: DomainEvent): Promise<void>;

  // ============================================================================
  // Protected Helper Methods
  // ============================================================================

  /**
   * Emit an event from this agent
   */
  protected async emitEvent<T>(
    type: EventType,
    aggregateId: string,
    aggregateType: string,
    payload: T,
    correlationId?: string
  ): Promise<void> {
    await this.eventBus.emit(type, aggregateId, aggregateType, payload, {
      correlationId: correlationId ?? uuidv4(),
    });
  }

  /**
   * Request another agent to process a task
   */
  protected async requestAgent<TIn, TOut>(
    agentId: AgentId,
    taskType: string,
    input: TIn,
    context: Partial<TaskContext> = {}
  ): Promise<TaskResult<TOut>> {
    const task: Task<TIn, TOut> = {
      id: uuidv4(),
      type: taskType,
      priority: 'normal',
      status: 'pending',
      payload: input,
      input,
      context: {
        correlationId: context.correlationId ?? uuidv4(),
        ...context,
        metadata: context.metadata ?? {},
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      retryCount: 0,
      maxRetries: 3,
    };

    this.stateManager.addTask(task);

    await this.eventBus.emit(
      'task.submitted',
      task.id,
      'task',
      { taskId: task.id, targetAgent: agentId, type: taskType },
      { correlationId: task.context?.correlationId }
    );

    // Wait for task completion
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const updatedTask = this.stateManager.getTask(task.id);
        if (updatedTask?.status === 'completed' || updatedTask?.status === 'failed') {
          clearInterval(checkInterval);
          resolve({
            success: updatedTask.status === 'completed',
            data: updatedTask.output as TOut,
            error: updatedTask.error,
            metrics: { processingTime: 0, memoryUsed: 0 },
          });
        }
      }, 100);
    });
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Set agent status
   */
  private setStatus(status: AgentStatus): void {
    this.status = status;
    this.stateManager.updateAgentStatus(this.id, status);
  }

  /**
   * Subscribe to events
   */
  private async subscribeToEvents(): Promise<void> {
    const events = this.getSubscribedEvents();

    for (const eventType of events) {
      const subId = this.eventBus.subscribe(eventType, async (event) => {
        try {
          await this.handleEvent(event);
        } catch (error) {
          this.logger.error('Event handler error', error as Error, {
            eventType,
            eventId: event.id,
          });
        }
      });
      this.subscriptionIds.push(subId);
    }
  }

  /**
   * Update metrics after task completion
   */
  private updateMetrics(processingTime: number, success: boolean): void {
    this.metrics.tasksProcessed++;
    this.metrics.lastActive = new Date();
    this.metrics.memoryUsage = this.getMemoryUsage();
    this.metrics.queueDepth = this.getQueueDepth();

    // Update average processing time
    this.metrics.avgProcessingTime =
      (this.metrics.avgProcessingTime * (this.metrics.tasksProcessed - 1) +
        processingTime) /
      this.metrics.tasksProcessed;

    // Update success rate
    const totalSuccess = this.metrics.successRate * (this.metrics.tasksProcessed - 1);
    this.metrics.successRate =
      (totalSuccess + (success ? 1 : 0)) / this.metrics.tasksProcessed;

    this.stateManager.updateAgent(this.id, { metrics: this.metrics });
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    const usage = process.memoryUsage();
    return Math.round(usage.heapUsed / 1024 / 1024); // MB
  }

  /**
   * Setup queue event handlers
   */
  private setupQueueEvents(): void {
    this.queue.on('error', (error) => {
      this.logger.error('Queue error', error);
    });
  }
}

/**
 * Create a task for submission
 */
export function createTask<TInput, TOutput = unknown>(
  type: string,
  input: TInput,
  options: Partial<{
    priority: Task['priority'];
    context: Partial<TaskContext>;
    maxRetries: number;
  }> = {}
): Task<TInput, TOutput> {
  return {
    id: uuidv4(),
    type,
    priority: options.priority ?? 'normal',
    status: 'pending',
    payload: input,
    input,
    context: {
      correlationId: uuidv4(),
      metadata: {},
      ...options.context,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    retryCount: 0,
    maxRetries: options.maxRetries ?? 3,
  };
}
