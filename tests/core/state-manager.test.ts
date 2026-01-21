/**
 * StateManager Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StateManager, getStateManager, resetStateManager } from '../../src/core/state-manager';
import { Campaign, Creative, Task } from '../../src/types';

describe('StateManager', () => {
  let stateManager: StateManager;

  beforeEach(() => {
    resetStateManager();
    stateManager = getStateManager();
  });

  afterEach(() => {
    resetStateManager();
  });

  describe('singleton', () => {
    it('should return the same instance', () => {
      const instance1 = getStateManager();
      const instance2 = getStateManager();
      expect(instance1).toBe(instance2);
    });
  });

  describe('agent management', () => {
    it('should register an agent', () => {
      stateManager.registerAgent('orchestrator', {
        id: 'orchestrator',
        status: 'running',
        capabilities: ['routing', 'load-balancing'],
        tier: 1,
        lastHeartbeat: new Date(),
        metrics: { tasksProcessed: 0, averageResponseTime: 0, errorRate: 0 },
      });

      const agent = stateManager.getAgent('orchestrator');
      expect(agent).toBeDefined();
      expect(agent?.status).toBe('running');
    });

    it('should unregister an agent', () => {
      stateManager.registerAgent('memory', {
        id: 'memory',
        status: 'running',
        capabilities: [],
        tier: 1,
        lastHeartbeat: new Date(),
        metrics: { tasksProcessed: 0, averageResponseTime: 0, errorRate: 0 },
      });

      stateManager.unregisterAgent('memory');

      const agent = stateManager.getAgent('memory');
      expect(agent).toBeUndefined();
    });
  });

  describe('task management', () => {
    it('should add a task', () => {
      const task: Task = {
        id: 'task-1',
        type: 'campaign_optimization',
        priority: 'high',
        status: 'pending',
        payload: { campaignId: 'camp-1' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      stateManager.addTask(task);

      const retrieved = stateManager.getTask('task-1');
      expect(retrieved).toBeDefined();
      expect(retrieved?.type).toBe('campaign_optimization');
    });

    it('should update task status', () => {
      const task: Task = {
        id: 'task-2',
        type: 'bid_optimization',
        priority: 'medium',
        status: 'pending',
        payload: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      stateManager.addTask(task);
      stateManager.updateTaskStatus('task-2', 'in_progress');

      const retrieved = stateManager.getTask('task-2');
      expect(retrieved?.status).toBe('in_progress');
    });

    it('should get pending tasks', () => {
      stateManager.addTask({
        id: 'task-3',
        type: 'creative_analysis',
        priority: 'low',
        status: 'pending',
        payload: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      stateManager.addTask({
        id: 'task-4',
        type: 'risk_detection',
        priority: 'high',
        status: 'in_progress',
        payload: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const pending = stateManager.getPendingTasks();
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe('task-3');
    });
  });

  describe('campaign management', () => {
    it('should add a campaign', () => {
      const campaign: Campaign = {
        id: 'camp-1',
        name: 'Summer Sale',
        platform: 'google-ads',
        status: 'active',
        budget: 10000,
        dailyBudget: 500,
        spent: 1500,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        targetAudience: ['retail'],
        objectives: ['conversions'],
        creativeIds: [],
        metrics: {
          impressions: 50000,
          clicks: 2500,
          conversions: 100,
          ctr: 0.05,
          cpc: 0.6,
          cpa: 15,
          roas: 3.5,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      stateManager.addCampaign(campaign);

      const retrieved = stateManager.getCampaign('camp-1');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Summer Sale');
    });

    it('should get active campaigns', () => {
      const activeCampaign: Campaign = {
        id: 'camp-2',
        name: 'Active Campaign',
        platform: 'meta-ads',
        status: 'active',
        budget: 5000,
        dailyBudget: 200,
        spent: 500,
        startDate: new Date(),
        endDate: new Date(),
        targetAudience: [],
        objectives: [],
        creativeIds: [],
        metrics: { impressions: 0, clicks: 0, conversions: 0, ctr: 0, cpc: 0, cpa: 0, roas: 0 },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const pausedCampaign: Campaign = {
        ...activeCampaign,
        id: 'camp-3',
        name: 'Paused Campaign',
        status: 'paused',
      };

      stateManager.addCampaign(activeCampaign);
      stateManager.addCampaign(pausedCampaign);

      const active = stateManager.getActiveCampaigns();
      expect(active).toHaveLength(1);
      expect(active[0].name).toBe('Active Campaign');
    });
  });

  describe('creative management', () => {
    it('should add a creative', () => {
      const creative: Creative = {
        id: 'creative-1',
        name: 'Banner Ad',
        type: 'image',
        platform: 'google-ads',
        status: 'active',
        content: {
          headline: 'Buy Now',
          body: 'Great deals',
          callToAction: 'Shop Now',
        },
        performance: {
          impressions: 10000,
          clicks: 500,
          conversions: 25,
          ctr: 0.05,
          conversionRate: 0.05,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      stateManager.addCreative(creative);

      const retrieved = stateManager.getCreative('creative-1');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Banner Ad');
    });
  });

  describe('subscriptions', () => {
    it('should notify subscribers of state changes', () => {
      const subscriber = vi.fn();
      const unsubscribe = stateManager.subscribe('campaigns', subscriber);

      const campaign: Campaign = {
        id: 'camp-4',
        name: 'Test Campaign',
        platform: 'tiktok-ads',
        status: 'draft',
        budget: 1000,
        dailyBudget: 100,
        spent: 0,
        startDate: new Date(),
        endDate: new Date(),
        targetAudience: [],
        objectives: [],
        creativeIds: [],
        metrics: { impressions: 0, clicks: 0, conversions: 0, ctr: 0, cpc: 0, cpa: 0, roas: 0 },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      stateManager.addCampaign(campaign);

      expect(subscriber).toHaveBeenCalled();

      unsubscribe();
    });
  });

  describe('snapshots', () => {
    it('should return state snapshot', () => {
      const snapshot = stateManager.getSnapshot();

      expect(snapshot).toHaveProperty('agents');
      expect(snapshot).toHaveProperty('tasks');
      expect(snapshot).toHaveProperty('campaigns');
      expect(snapshot).toHaveProperty('creatives');
    });
  });
});
