/**
 * CampaignService Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CampaignService, getCampaignService } from '../../src/services/campaign-service';
import { resetEventBus } from '../../src/core/event-bus';
import { resetStateManager, getStateManager } from '../../src/core/state-manager';
import { Campaign } from '../../src/types';

describe('CampaignService', () => {
  let service: CampaignService;

  beforeEach(() => {
    resetEventBus();
    resetStateManager();
    service = new CampaignService();
  });

  afterEach(() => {
    resetEventBus();
    resetStateManager();
  });

  describe('createCampaign', () => {
    it('should create a campaign with all required fields', async () => {
      const input = {
        name: 'Test Campaign',
        platform: 'google-ads' as const,
        budget: 10000,
        dailyBudget: 500,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        targetAudience: ['tech-enthusiasts'],
        objectives: ['conversions'],
      };

      const campaign = await service.createCampaign(input);

      expect(campaign.id).toBeDefined();
      expect(campaign.name).toBe('Test Campaign');
      expect(campaign.platform).toBe('google-ads');
      expect(campaign.status).toBe('draft');
      expect(campaign.budget).toBe(10000);
      expect(campaign.dailyBudget).toBe(500);
      expect(campaign.spent).toBe(0);
    });

    it('should store campaign in state manager', async () => {
      const input = {
        name: 'Stored Campaign',
        platform: 'meta-ads' as const,
        budget: 5000,
        dailyBudget: 250,
        startDate: new Date(),
        endDate: new Date(),
        targetAudience: ['shoppers'],
        objectives: ['traffic'],
      };

      const campaign = await service.createCampaign(input);
      const stateManager = getStateManager();
      const stored = stateManager.getCampaign(campaign.id);

      expect(stored).toBeDefined();
      expect(stored?.name).toBe('Stored Campaign');
    });

    it('should initialize metrics to zero', async () => {
      const campaign = await service.createCampaign({
        name: 'Metrics Campaign',
        platform: 'tiktok-ads' as const,
        budget: 1000,
        dailyBudget: 100,
        startDate: new Date(),
        endDate: new Date(),
        targetAudience: [],
        objectives: [],
      });

      expect(campaign.metrics.impressions).toBe(0);
      expect(campaign.metrics.clicks).toBe(0);
      expect(campaign.metrics.conversions).toBe(0);
      expect(campaign.metrics.ctr).toBe(0);
      expect(campaign.metrics.roas).toBe(0);
    });
  });

  describe('updateStatus', () => {
    it('should update campaign status', async () => {
      const campaign = await service.createCampaign({
        name: 'Status Test',
        platform: 'google-ads' as const,
        budget: 5000,
        dailyBudget: 200,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        targetAudience: ['test'],
        objectives: ['test'],
      });

      const updated = await service.updateStatus(campaign.id, 'active');

      expect(updated.status).toBe('active');
    });

    it('should throw for non-existent campaign', async () => {
      await expect(
        service.updateStatus('non-existent', 'active')
      ).rejects.toThrow('Campaign not found');
    });
  });

  describe('pauseCampaign', () => {
    it('should pause an active campaign', async () => {
      const campaign = await service.createCampaign({
        name: 'Pause Test',
        platform: 'google-ads' as const,
        budget: 5000,
        dailyBudget: 200,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        targetAudience: ['test'],
        objectives: ['test'],
      });

      await service.updateStatus(campaign.id, 'active');
      const paused = await service.pauseCampaign(campaign.id);

      expect(paused.status).toBe('paused');
    });
  });

  describe('activateCampaign', () => {
    it('should activate a valid campaign', async () => {
      const campaign = await service.createCampaign({
        name: 'Activate Test',
        platform: 'google-ads' as const,
        budget: 5000,
        dailyBudget: 200,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        targetAudience: ['test'],
        objectives: ['test'],
      });

      const activated = await service.activateCampaign(campaign.id);

      expect(activated.status).toBe('active');
    });
  });

  describe('updateBudget', () => {
    it('should update campaign budget', async () => {
      const campaign = await service.createCampaign({
        name: 'Budget Test',
        platform: 'google-ads' as const,
        budget: 5000,
        dailyBudget: 200,
        startDate: new Date(),
        endDate: new Date(),
        targetAudience: [],
        objectives: [],
      });

      const updated = await service.updateBudget(campaign.id, 10000, 400);

      expect(updated.budget).toBe(10000);
      expect(updated.dailyBudget).toBe(400);
    });
  });

  describe('getOptimizationRecommendations', () => {
    it('should generate recommendations for low CTR', async () => {
      const campaign = await service.createCampaign({
        name: 'Low CTR Campaign',
        platform: 'google-ads' as const,
        budget: 5000,
        dailyBudget: 200,
        startDate: new Date(),
        endDate: new Date(),
        targetAudience: ['test'],
        objectives: ['test'],
      });

      // Manually set low CTR (in real scenario, this would be updated by tracking)
      const stateManager = getStateManager();
      const stored = stateManager.getCampaign(campaign.id)!;
      stored.metrics.ctr = 0.005; // Below 1%
      stateManager.addCampaign(stored);

      const result = await service.getOptimizationRecommendations(campaign.id);

      expect(result.campaignId).toBe(campaign.id);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r => r.type === 'creative')).toBe(true);
    });
  });

  describe('calculateBudgetAllocation', () => {
    it('should allocate budget based on performance', () => {
      const campaigns: Campaign[] = [
        {
          id: 'camp-1',
          name: 'High Performer',
          platform: 'google-ads',
          status: 'active',
          budget: 5000,
          dailyBudget: 200,
          spent: 4000,
          startDate: new Date(),
          endDate: new Date(),
          targetAudience: [],
          objectives: [],
          creativeIds: [],
          metrics: {
            impressions: 100000,
            clicks: 5000,
            conversions: 200,
            ctr: 0.05,
            cpc: 0.8,
            cpa: 20,
            roas: 5.0,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'camp-2',
          name: 'Low Performer',
          platform: 'meta-ads',
          status: 'active',
          budget: 5000,
          dailyBudget: 200,
          spent: 2000,
          startDate: new Date(),
          endDate: new Date(),
          targetAudience: [],
          objectives: [],
          creativeIds: [],
          metrics: {
            impressions: 50000,
            clicks: 1000,
            conversions: 20,
            ctr: 0.02,
            cpc: 2.0,
            cpa: 100,
            roas: 1.0,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const totalBudget = 10000;
      const allocation = service.calculateBudgetAllocation(campaigns, totalBudget);

      expect(allocation).toHaveLength(2);

      // High performer should get more budget
      const highPerformerAlloc = allocation.find(a => a.campaignId === 'camp-1')!;
      const lowPerformerAlloc = allocation.find(a => a.campaignId === 'camp-2')!;

      expect(highPerformerAlloc.allocatedBudget).toBeGreaterThan(lowPerformerAlloc.allocatedBudget);
    });

    it('should split evenly when no performance data', () => {
      const campaigns: Campaign[] = [
        {
          id: 'camp-3',
          name: 'New Campaign 1',
          platform: 'google-ads',
          status: 'draft',
          budget: 5000,
          dailyBudget: 200,
          spent: 0,
          startDate: new Date(),
          endDate: new Date(),
          targetAudience: [],
          objectives: [],
          creativeIds: [],
          metrics: { impressions: 0, clicks: 0, conversions: 0, ctr: 0, cpc: 0, cpa: 0, roas: 0 },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'camp-4',
          name: 'New Campaign 2',
          platform: 'meta-ads',
          status: 'draft',
          budget: 5000,
          dailyBudget: 200,
          spent: 0,
          startDate: new Date(),
          endDate: new Date(),
          targetAudience: [],
          objectives: [],
          creativeIds: [],
          metrics: { impressions: 0, clicks: 0, conversions: 0, ctr: 0, cpc: 0, cpa: 0, roas: 0 },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const totalBudget = 10000;
      const allocation = service.calculateBudgetAllocation(campaigns, totalBudget);

      expect(allocation[0].allocatedBudget).toBe(5000);
      expect(allocation[1].allocatedBudget).toBe(5000);
    });
  });
});
