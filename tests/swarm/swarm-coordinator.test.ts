/**
 * SwarmCoordinator Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SwarmCoordinator,
  getSwarmCoordinator,
  resetSwarmCoordinator,
} from '../../src/swarm/swarm-coordinator';
import { resetEventBus } from '../../src/core/event-bus';
import { resetStateManager } from '../../src/core/state-manager';

describe('SwarmCoordinator', () => {
  let swarm: SwarmCoordinator;

  beforeEach(() => {
    resetEventBus();
    resetStateManager();
    resetSwarmCoordinator();
  });

  afterEach(async () => {
    if (swarm) {
      await swarm.stop();
    }
    resetSwarmCoordinator();
    resetEventBus();
    resetStateManager();
  });

  describe('singleton', () => {
    it('should return the same instance', () => {
      const instance1 = getSwarmCoordinator();
      const instance2 = getSwarmCoordinator();
      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', async () => {
      const instance1 = getSwarmCoordinator();
      await instance1.start();
      await instance1.stop();
      resetSwarmCoordinator();
      const instance2 = getSwarmCoordinator();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('lifecycle', () => {
    it('should start successfully', async () => {
      swarm = getSwarmCoordinator();
      await swarm.start();

      const status = swarm.getStatus();
      expect(status.status).toBe('running');
      expect(status.activeAgents).toBe(15);
      expect(status.totalAgents).toBe(15);
    });

    it('should stop successfully', async () => {
      swarm = getSwarmCoordinator();
      await swarm.start();
      await swarm.stop();

      const status = swarm.getStatus();
      expect(status.status).toBe('stopped');
      expect(status.activeAgents).toBe(0);
    });

    it('should not start twice', async () => {
      swarm = getSwarmCoordinator();
      await swarm.start();
      await swarm.start(); // Should not throw

      const status = swarm.getStatus();
      expect(status.status).toBe('running');
    });

    it('should handle stop when not running', async () => {
      swarm = getSwarmCoordinator();
      await swarm.stop(); // Should not throw

      const status = swarm.getStatus();
      expect(status.status).toBe('stopped');
    });
  });

  describe('agent initialization', () => {
    it('should initialize all 15 agents', async () => {
      swarm = getSwarmCoordinator();
      await swarm.start();

      const status = swarm.getStatus();
      expect(status.totalAgents).toBe(15);

      // Check each tier
      const agentStatuses = status.agentStatuses;
      expect(agentStatuses.has('orchestrator')).toBe(true);
      expect(agentStatuses.has('memory')).toBe(true);
      expect(agentStatuses.has('quality')).toBe(true);
      expect(agentStatuses.has('simulation')).toBe(true);
      expect(agentStatuses.has('historical-memory')).toBe(true);
      expect(agentStatuses.has('risk-detection')).toBe(true);
      expect(agentStatuses.has('attention-arbitrage')).toBe(true);
      expect(agentStatuses.has('creative-genome')).toBe(true);
      expect(agentStatuses.has('fatigue-forecaster')).toBe(true);
      expect(agentStatuses.has('mutation')).toBe(true);
      expect(agentStatuses.has('counterfactual')).toBe(true);
      expect(agentStatuses.has('causal-graph')).toBe(true);
      expect(agentStatuses.has('incrementality')).toBe(true);
      expect(agentStatuses.has('account-health')).toBe(true);
      expect(agentStatuses.has('cross-platform')).toBe(true);
    });

    it('should only initialize enabled agents', async () => {
      swarm = new SwarmCoordinator({
        enabledAgents: ['orchestrator', 'memory', 'quality'],
      });
      await swarm.start();

      const status = swarm.getStatus();
      expect(status.totalAgents).toBe(3);
    });
  });

  describe('task submission', () => {
    it('should submit tasks when running', async () => {
      swarm = getSwarmCoordinator();
      await swarm.start();

      const task = await swarm.submitTask('campaign_optimization', {
        campaignId: 'test-camp-1',
      });

      expect(task.id).toBeDefined();
      expect(task.type).toBe('campaign_optimization');
      expect(task.status).toBe('pending');
    });

    it('should reject tasks when not running', async () => {
      swarm = getSwarmCoordinator();

      await expect(
        swarm.submitTask('campaign_optimization', {})
      ).rejects.toThrow('Cannot submit task: swarm is stopped');
    });

    it('should route tasks to target agent', async () => {
      swarm = getSwarmCoordinator();
      await swarm.start();

      const task = await swarm.submitTask(
        'creative_analysis',
        { creativeId: 'creative-1' },
        { targetAgent: 'creative-genome' }
      );

      expect(task.metadata?.targetAgent).toBe('creative-genome');
    });

    it('should support task priorities', async () => {
      swarm = getSwarmCoordinator();
      await swarm.start();

      const highPriorityTask = await swarm.submitTask(
        'risk_detection',
        {},
        { priority: 'critical' }
      );

      expect(highPriorityTask.priority).toBe('critical');
    });
  });

  describe('metrics', () => {
    it('should track task metrics', async () => {
      swarm = getSwarmCoordinator();
      await swarm.start();

      const initialMetrics = swarm.getMetrics();
      expect(initialMetrics.totalTasksSubmitted).toBe(0);

      await swarm.submitTask('campaign_optimization', {});
      await swarm.submitTask('bid_optimization', {});

      const metrics = swarm.getMetrics();
      expect(metrics.totalTasksSubmitted).toBe(2);
    });

    it('should track uptime', async () => {
      swarm = getSwarmCoordinator();
      await swarm.start();

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      const status = swarm.getStatus();
      expect(status.uptime).toBeGreaterThan(0);
    });
  });

  describe('diagnostics', () => {
    it('should run diagnostics on all agents', async () => {
      swarm = getSwarmCoordinator();
      await swarm.start();

      const diagnostics = await swarm.runDiagnostics();

      expect(diagnostics.size).toBe(15);
      for (const [agentId, result] of diagnostics) {
        expect(result).toHaveProperty('healthy');
      }
    });
  });

  describe('agent access', () => {
    it('should get specific agent', async () => {
      swarm = getSwarmCoordinator();
      await swarm.start();

      const orchestrator = swarm.getAgent('orchestrator');
      expect(orchestrator).toBeDefined();

      const nonExistent = swarm.getAgent('non-existent' as any);
      expect(nonExistent).toBeUndefined();
    });
  });

  describe('campaign submission', () => {
    it('should submit campaign for processing', async () => {
      swarm = getSwarmCoordinator();
      await swarm.start();

      const campaign = {
        id: 'test-campaign',
        name: 'Test Campaign',
        platform: 'google-ads' as const,
        status: 'draft' as const,
        budget: 10000,
        dailyBudget: 500,
        spent: 0,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        targetAudience: ['tech'],
        objectives: ['conversions'],
        creativeIds: [],
        metrics: { impressions: 0, clicks: 0, conversions: 0, ctr: 0, cpc: 0, cpa: 0, roas: 0 },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await swarm.submitCampaign(campaign);

      const metrics = swarm.getMetrics();
      expect(metrics.totalTasksSubmitted).toBe(1);
    });
  });

  describe('creative submission', () => {
    it('should submit creative for analysis', async () => {
      swarm = getSwarmCoordinator();
      await swarm.start();

      const creative = {
        id: 'test-creative',
        name: 'Test Creative',
        type: 'image' as const,
        platform: 'google-ads' as const,
        status: 'draft' as const,
        content: {
          headline: 'Buy Now',
          body: 'Great deals',
          callToAction: 'Shop',
        },
        performance: { impressions: 0, clicks: 0, conversions: 0, ctr: 0, conversionRate: 0 },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await swarm.submitCreative(creative);

      const metrics = swarm.getMetrics();
      expect(metrics.totalTasksSubmitted).toBe(1);
    });
  });
});
