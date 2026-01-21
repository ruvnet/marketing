/**
 * EventBus Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventBus, getEventBus, resetEventBus } from '../../src/core/event-bus';
import { DomainEvent } from '../../src/types';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    resetEventBus();
    eventBus = getEventBus();
  });

  afterEach(() => {
    resetEventBus();
  });

  describe('singleton', () => {
    it('should return the same instance', () => {
      const instance1 = getEventBus();
      const instance2 = getEventBus();
      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = getEventBus();
      resetEventBus();
      const instance2 = getEventBus();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('publish/subscribe', () => {
    it('should deliver events to subscribers', () => {
      const handler = vi.fn();
      eventBus.subscribe('test.event', handler);

      const event: DomainEvent = {
        id: '1',
        type: 'test.event',
        timestamp: new Date(),
        source: 'test',
        payload: { data: 'test' },
      };

      eventBus.publish(event);

      expect(handler).toHaveBeenCalledWith(event);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should support multiple subscribers', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventBus.subscribe('test.event', handler1);
      eventBus.subscribe('test.event', handler2);

      const event: DomainEvent = {
        id: '1',
        type: 'test.event',
        timestamp: new Date(),
        source: 'test',
        payload: {},
      };

      eventBus.publish(event);

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should support wildcard subscriptions', () => {
      const handler = vi.fn();
      eventBus.subscribe('test.*', handler);

      eventBus.publish({
        id: '1',
        type: 'test.event1',
        timestamp: new Date(),
        source: 'test',
        payload: {},
      });

      eventBus.publish({
        id: '2',
        type: 'test.event2',
        timestamp: new Date(),
        source: 'test',
        payload: {},
      });

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should not call unsubscribed handlers', () => {
      const handler = vi.fn();
      const unsubscribe = eventBus.subscribe('test.event', handler);

      unsubscribe();

      eventBus.publish({
        id: '1',
        type: 'test.event',
        timestamp: new Date(),
        source: 'test',
        payload: {},
      });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('event sourcing', () => {
    it('should store events in history', () => {
      const event: DomainEvent = {
        id: '1',
        type: 'test.event',
        timestamp: new Date(),
        source: 'test',
        payload: { data: 'test' },
      };

      eventBus.publish(event);

      const history = eventBus.getEventHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(event);
    });

    it('should filter history by event type', () => {
      eventBus.publish({
        id: '1',
        type: 'test.event1',
        timestamp: new Date(),
        source: 'test',
        payload: {},
      });

      eventBus.publish({
        id: '2',
        type: 'test.event2',
        timestamp: new Date(),
        source: 'test',
        payload: {},
      });

      const history = eventBus.getEventHistory('test.event1');
      expect(history).toHaveLength(1);
      expect(history[0].type).toBe('test.event1');
    });

    it('should replay events', () => {
      const handler = vi.fn();

      eventBus.publish({
        id: '1',
        type: 'test.event',
        timestamp: new Date(),
        source: 'test',
        payload: {},
      });

      eventBus.publish({
        id: '2',
        type: 'test.event',
        timestamp: new Date(),
        source: 'test',
        payload: {},
      });

      eventBus.subscribe('test.event', handler);
      eventBus.replayEvents('test.event');

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should clear event history', () => {
      eventBus.publish({
        id: '1',
        type: 'test.event',
        timestamp: new Date(),
        source: 'test',
        payload: {},
      });

      eventBus.clearEventHistory();

      const history = eventBus.getEventHistory();
      expect(history).toHaveLength(0);
    });
  });
});
