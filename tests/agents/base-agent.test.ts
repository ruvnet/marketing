/**
 * BaseAgent Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BaseAgent } from '../../src/agents/base-agent';
import { EventBus, getEventBus, resetEventBus } from '../../src/core/event-bus';
import { StateManager, getStateManager, resetStateManager } from '../../src/core/state-manager';
import { Task, DomainEvent, AgentId } from '../../src/types';

// Concrete implementation for testing
class TestAgent extends BaseAgent {
  public processedTasks: Task[] = [];
  public handledEvents: DomainEvent[] = [];

  constructor(eventBus: EventBus, stateManager: StateManager) {
    super('orchestrator' as AgentId, eventBus, stateManager);
  }

  protected async process(task: Task): Promise<void> {
    this.processedTasks.push(task);
  }

  protected async onInitialize(): Promise<void> {
    // Test initialization
  }

  protected async onShutdown(): Promise<void> {
    // Test shutdown
  }

  protected getSubscribedEvents(): string[] {
    return ['test.event', 'another.*'];
  }

  protected async handleEvent(event: DomainEvent): Promise<void> {
    this.handledEvents.push(event);
  }
}

describe('BaseAgent', () => {
  let agent: TestAgent;
  let eventBus: EventBus;
  let stateManager: StateManager;

  beforeEach(async () => {
    resetEventBus();
    resetStateManager();
    eventBus = getEventBus();
    stateManager = getStateManager();
    agent = new TestAgent(eventBus, stateManager);
    await agent.initialize();
  });

  afterEach(async () => {
    await agent.shutdown();
    resetEventBus();
    resetStateManager();
  });

  describe('lifecycle', () => {
    it('should initialize correctly', async () => {
      const newAgent = new TestAgent(eventBus, stateManager);
      expect(newAgent.getStatus()).toBe('stopped');

      await newAgent.initialize();
      expect(newAgent.getStatus()).toBe('running');

      await newAgent.shutdown();
    });

    it('should shutdown correctly', async () => {
      expect(agent.getStatus()).toBe('running');

      await agent.shutdown();
      expect(agent.getStatus()).toBe('stopped');
    });

    it('should not initialize twice', async () => {
      // Agent is already initialized in beforeEach
      await agent.initialize(); // Should not throw
      expect(agent.getStatus()).toBe('running');
    });
  });

  describe('task processing', () => {
    it('should process submitted tasks', async () => {
      const task: Task = {
        id: 'task-1',
        type: 'campaign_optimization',
        priority: 'medium',
        status: 'pending',
        payload: { test: true },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      agent.submitTask(task);

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(agent.processedTasks).toHaveLength(1);
      expect(agent.processedTasks[0].id).toBe('task-1');
    });

    it('should track tasks processed count', async () => {
      const task: Task = {
        id: 'task-2',
        type: 'bid_optimization',
        priority: 'high',
        status: 'pending',
        payload: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(agent.getTasksProcessed()).toBe(0);

      agent.submitTask(task);
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(agent.getTasksProcessed()).toBe(1);
    });

    it('should track queue length', () => {
      // Initially empty
      expect(agent.getQueueLength()).toBe(0);
    });
  });

  describe('event handling', () => {
    it('should handle subscribed events', async () => {
      const event: DomainEvent = {
        id: '1',
        type: 'test.event',
        timestamp: new Date(),
        source: 'test',
        payload: { data: 'test' },
      };

      eventBus.publish(event);

      // Wait for async handling
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(agent.handledEvents).toHaveLength(1);
      expect(agent.handledEvents[0].type).toBe('test.event');
    });

    it('should handle wildcard events', async () => {
      const event: DomainEvent = {
        id: '2',
        type: 'another.specific',
        timestamp: new Date(),
        source: 'test',
        payload: {},
      };

      eventBus.publish(event);
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(agent.handledEvents).toHaveLength(1);
    });

    it('should not handle unsubscribed events', async () => {
      const event: DomainEvent = {
        id: '3',
        type: 'unsubscribed.event',
        timestamp: new Date(),
        source: 'test',
        payload: {},
      };

      eventBus.publish(event);
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(agent.handledEvents).toHaveLength(0);
    });
  });

  describe('health check', () => {
    it('should return healthy status when running', async () => {
      const result = await agent.healthCheck();

      expect(result.healthy).toBe(true);
      expect(result.status).toBe('running');
      expect(result.agentId).toBe('orchestrator');
    });

    it('should return unhealthy status when stopped', async () => {
      await agent.shutdown();

      const result = await agent.healthCheck();

      expect(result.healthy).toBe(false);
      expect(result.status).toBe('stopped');
    });
  });

  describe('activity tracking', () => {
    it('should track last activity', async () => {
      const before = agent.getLastActivity();

      const task: Task = {
        id: 'task-3',
        type: 'creative_analysis',
        priority: 'low',
        status: 'pending',
        payload: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      agent.submitTask(task);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const after = agent.getLastActivity();

      expect(after).not.toBeNull();
      expect(after!.getTime()).toBeGreaterThanOrEqual(before?.getTime() || 0);
    });

    it('should track error count', () => {
      expect(agent.getErrorCount()).toBe(0);
    });
  });
});
