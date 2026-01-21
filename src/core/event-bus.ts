/**
 * Event Bus - Central Event System for Agent Communication
 * Implements pub/sub with event sourcing support
 */

import EventEmitter from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';
import type { DomainEvent, EventType } from '../types/index.js';

export type EventHandler<T = unknown> = (event: DomainEvent<T>) => void | Promise<void>;

export interface EventSubscription {
  id: string;
  eventType: EventType | '*';
  handler: EventHandler;
  priority: number;
  once: boolean;
}

export interface EventBusConfig {
  maxEventHistory: number;
  enablePersistence: boolean;
  enableReplay: boolean;
  errorHandler?: (error: Error, event: DomainEvent) => void;
}

const DEFAULT_CONFIG: EventBusConfig = {
  maxEventHistory: 10000,
  enablePersistence: false,
  enableReplay: true,
};

/**
 * EventBus provides a centralized event system for the agent swarm
 * Supports event sourcing, replay, and async handlers
 */
export class EventBus {
  private emitter: EventEmitter;
  private subscriptions: Map<string, EventSubscription>;
  private eventHistory: DomainEvent[];
  private eventStore: Map<string, DomainEvent[]>; // By aggregate
  private config: EventBusConfig;
  private isProcessing: boolean;
  private eventQueue: DomainEvent[];

  constructor(config: Partial<EventBusConfig> = {}) {
    this.emitter = new EventEmitter();
    this.subscriptions = new Map();
    this.eventHistory = [];
    this.eventStore = new Map();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.isProcessing = false;
    this.eventQueue = [];
  }

  /**
   * Subscribe to events of a specific type
   */
  subscribe<T = unknown>(
    eventType: EventType | '*',
    handler: EventHandler<T>,
    options: { priority?: number; once?: boolean } = {}
  ): string {
    const subscription: EventSubscription = {
      id: uuidv4(),
      eventType,
      handler: handler as EventHandler,
      priority: options.priority ?? 0,
      once: options.once ?? false,
    };

    this.subscriptions.set(subscription.id, subscription);

    if (eventType === '*') {
      // Subscribe to all events
      this.emitter.on('*', handler as EventHandler);
    } else {
      this.emitter.on(eventType, handler as EventHandler);
    }

    return subscription.id;
  }

  /**
   * Subscribe to an event type once
   */
  subscribeOnce<T = unknown>(
    eventType: EventType,
    handler: EventHandler<T>
  ): string {
    return this.subscribe(eventType, handler, { once: true });
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return false;

    if (subscription.eventType === '*') {
      this.emitter.off('*', subscription.handler);
    } else {
      this.emitter.off(subscription.eventType, subscription.handler);
    }

    this.subscriptions.delete(subscriptionId);
    return true;
  }

  /**
   * Publish an event to all subscribers
   */
  async publish<T = unknown>(event: DomainEvent<T>): Promise<void> {
    // Add to history
    this.addToHistory(event);

    // Store by aggregate
    this.storeByAggregate(event);

    // Queue the event
    this.eventQueue.push(event as DomainEvent);

    // Process queue if not already processing
    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  /**
   * Create and publish an event
   */
  async emit<T = unknown>(
    type: EventType,
    aggregateId: string,
    aggregateType: string,
    payload: T,
    metadata?: Partial<DomainEvent['metadata']>
  ): Promise<DomainEvent<T>> {
    const event: DomainEvent<T> = {
      id: uuidv4(),
      type,
      timestamp: new Date(),
      source: aggregateType,
      aggregateId,
      aggregateType,
      payload,
      metadata: {
        correlationId: metadata?.correlationId ?? uuidv4(),
        causationId: metadata?.causationId,
        userId: metadata?.userId,
        version: metadata?.version ?? 1,
      },
    };

    await this.publish(event);
    return event;
  }

  /**
   * Replay events for an aggregate
   */
  async replay(aggregateId: string, handler: EventHandler): Promise<number> {
    if (!this.config.enableReplay) {
      throw new Error('Event replay is disabled');
    }

    const events = this.eventStore.get(aggregateId) ?? [];
    for (const event of events) {
      await handler(event);
    }
    return events.length;
  }

  /**
   * Replay all events since a timestamp
   */
  async replaySince(since: Date, handler: EventHandler): Promise<number> {
    if (!this.config.enableReplay) {
      throw new Error('Event replay is disabled');
    }

    const events = this.eventHistory.filter(
      (e) => e.timestamp >= since
    );

    for (const event of events) {
      await handler(event);
    }
    return events.length;
  }

  /**
   * Get events for an aggregate
   */
  getEventsForAggregate(aggregateId: string): DomainEvent[] {
    return [...(this.eventStore.get(aggregateId) ?? [])];
  }

  /**
   * Get recent events
   */
  getRecentEvents(count: number = 100): DomainEvent[] {
    return this.eventHistory.slice(-count);
  }

  /**
   * Get event count
   */
  getEventCount(): number {
    return this.eventHistory.length;
  }

  /**
   * Get subscription count
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Clear all subscriptions
   */
  clear(): void {
    this.emitter.removeAllListeners();
    this.subscriptions.clear();
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
    this.eventStore.clear();
  }

  /**
   * Process event queue
   */
  private async processQueue(): Promise<void> {
    this.isProcessing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!;

      try {
        // Emit to specific type listeners
        this.emitter.emit(event.type, event);

        // Emit to wildcard listeners
        this.emitter.emit('*', event);
      } catch (error) {
        if (this.config.errorHandler) {
          this.config.errorHandler(error as Error, event);
        } else {
          console.error('Event handler error:', error);
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Add event to history
   */
  private addToHistory(event: DomainEvent): void {
    this.eventHistory.push(event);

    // Trim history if needed
    if (this.eventHistory.length > this.config.maxEventHistory) {
      this.eventHistory = this.eventHistory.slice(-this.config.maxEventHistory);
    }
  }

  /**
   * Store event by aggregate
   */
  private storeByAggregate(event: DomainEvent): void {
    const aggregateId = event.aggregateId ?? event.id;
    const events = this.eventStore.get(aggregateId) ?? [];
    events.push(event);
    this.eventStore.set(aggregateId, events);
  }

  /**
   * Wait for an event to occur
   */
  waitFor<T = unknown>(
    eventType: EventType,
    timeout: number = 30000
  ): Promise<DomainEvent<T>> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.unsubscribe(subId);
        reject(new Error(`Timeout waiting for event: ${eventType}`));
      }, timeout);

      const subId = this.subscribeOnce<T>(eventType, (event) => {
        clearTimeout(timer);
        resolve(event);
      });
    });
  }
}

// Singleton instance for global use
let globalEventBus: EventBus | null = null;

export function getEventBus(config?: Partial<EventBusConfig>): EventBus {
  if (!globalEventBus) {
    globalEventBus = new EventBus(config);
  }
  return globalEventBus;
}

export function resetEventBus(): void {
  if (globalEventBus) {
    globalEventBus.clear();
    globalEventBus.clearHistory();
    globalEventBus = null;
  }
}
