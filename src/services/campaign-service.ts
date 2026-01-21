/**
 * Campaign Domain Service
 * Handles campaign lifecycle, optimization, and management
 */

import { v4 as uuidv4 } from 'uuid';
import { EventBus, getEventBus } from '../core/event-bus';
import { StateManager, getStateManager } from '../core/state-manager';
import { createLogger, Logger } from '../core/logger';
import {
  Campaign,
  CampaignStatus,
  Platform,
  Budget,
  TargetingConfig,
  BiddingStrategy,
} from '../types';

export interface CampaignBudgetAllocation {
  campaignId: string;
  platform: Platform;
  allocatedBudget: number;
  percentage: number;
  rationale: string;
}

export interface CampaignCreateInput {
  name: string;
  platform: Platform;
  budget: number;
  dailyBudget: number;
  startDate: Date;
  endDate: Date;
  targetAudience: string[];
  objectives: string[];
  creativeIds?: string[];
}

export interface OptimizationResult {
  campaignId: string;
  recommendations: OptimizationRecommendation[];
  projectedImprovement: number;
  confidence: number;
}

export interface OptimizationRecommendation {
  type: 'budget' | 'targeting' | 'bidding' | 'creative' | 'schedule';
  action: string;
  expectedImpact: number;
  priority: 'high' | 'medium' | 'low';
  rationale: string;
}

export class CampaignService {
  private readonly eventBus: EventBus;
  private readonly stateManager: StateManager;
  private readonly logger: Logger;

  constructor(eventBus?: EventBus, stateManager?: StateManager) {
    this.eventBus = eventBus || getEventBus();
    this.stateManager = stateManager || getStateManager();
    this.logger = createLogger('campaign-service');
  }

  /**
   * Create a new campaign
   */
  async createCampaign(input: CampaignCreateInput): Promise<Campaign> {
    const budget: Budget = {
      daily: input.dailyBudget,
      total: input.budget,
      spent: 0,
      currency: 'USD',
      allocation: [],
    };

    const targeting: TargetingConfig = {
      audiences: input.targetAudience.map((name, idx) => ({
        id: `audience-${idx}`,
        name,
        type: 'custom' as const,
        size: 0,
      })),
      locations: [],
      languages: ['en'],
      devices: ['desktop', 'mobile', 'tablet'],
      schedules: [],
      exclusions: [],
    };

    const bidding: BiddingStrategy = {
      type: 'maximize_conversions',
      adjustments: [],
    };

    const campaign: Campaign = {
      id: uuidv4(),
      name: input.name,
      platform: input.platform,
      accountId: 'default-account',
      status: 'draft',
      budget,
      dailyBudget: input.dailyBudget,
      spent: 0,
      bidding,
      targeting,
      creatives: input.creativeIds || [],
      creativeIds: input.creativeIds || [],
      startDate: input.startDate,
      endDate: input.endDate,
      metrics: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: 0,
        revenue: 0,
        ctr: 0,
        cpc: 0,
        cpa: 0,
        roas: 0,
        timestamp: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.stateManager.addCampaign(campaign);

    this.eventBus.publish({
      id: uuidv4(),
      type: 'campaign.created',
      timestamp: new Date(),
      source: 'campaign-service',
      payload: { campaign },
    });

    this.logger.info('Campaign created', { campaignId: campaign.id, name: campaign.name });

    return campaign;
  }

  /**
   * Update campaign status
   */
  async updateStatus(campaignId: string, status: CampaignStatus): Promise<Campaign> {
    const campaign = this.stateManager.getCampaign(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    const previousStatus = campaign.status;
    campaign.status = status;
    campaign.updatedAt = new Date();

    this.stateManager.addCampaign(campaign);

    this.eventBus.publish({
      id: uuidv4(),
      type: 'campaign.status_changed',
      timestamp: new Date(),
      source: 'campaign-service',
      payload: { campaignId, previousStatus, newStatus: status },
    });

    this.logger.info('Campaign status updated', { campaignId, previousStatus, newStatus: status });

    return campaign;
  }

  /**
   * Pause a campaign
   */
  async pauseCampaign(campaignId: string): Promise<Campaign> {
    return this.updateStatus(campaignId, 'paused');
  }

  /**
   * Activate a campaign
   */
  async activateCampaign(campaignId: string): Promise<Campaign> {
    const campaign = this.stateManager.getCampaign(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    // Validate campaign is ready for activation
    this.validateForActivation(campaign);

    return this.updateStatus(campaignId, 'active');
  }

  /**
   * Update campaign budget
   */
  async updateBudget(
    campaignId: string,
    budget: number,
    dailyBudget?: number
  ): Promise<Campaign> {
    const campaign = this.stateManager.getCampaign(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    const previousBudget = campaign.budget.total;
    campaign.budget.total = budget;
    if (dailyBudget !== undefined) {
      campaign.dailyBudget = dailyBudget;
    }
    campaign.updatedAt = new Date();

    this.stateManager.addCampaign(campaign);

    this.eventBus.publish({
      id: uuidv4(),
      type: 'campaign.budget_updated',
      timestamp: new Date(),
      source: 'campaign-service',
      payload: { campaignId, previousBudget, newBudget: budget },
    });

    return campaign;
  }

  /**
   * Get optimization recommendations for a campaign
   */
  async getOptimizationRecommendations(campaignId: string): Promise<OptimizationResult> {
    const campaign = this.stateManager.getCampaign(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    const recommendations: OptimizationRecommendation[] = [];

    // Analyze campaign performance and generate recommendations
    if (campaign.metrics.ctr < 0.01) {
      recommendations.push({
        type: 'creative',
        action: 'Test new creative variants with stronger hooks',
        expectedImpact: 0.15,
        priority: 'high',
        rationale: 'CTR is below platform average, indicating creative fatigue or poor targeting match',
      });
    }

    if (campaign.metrics.cpa > campaign.budget.total * 0.1) {
      recommendations.push({
        type: 'targeting',
        action: 'Narrow audience targeting to high-intent segments',
        expectedImpact: 0.2,
        priority: 'high',
        rationale: 'CPA is high relative to budget, suggesting inefficient audience targeting',
      });
    }

    const spent = campaign.spent ?? campaign.budget.spent ?? 0;
    const budgetUtilization = campaign.budget.total > 0 ? spent / campaign.budget.total : 0;
    if (budgetUtilization < 0.5 && campaign.status === 'active') {
      recommendations.push({
        type: 'bidding',
        action: 'Increase bid cap or switch to aggressive bidding strategy',
        expectedImpact: 0.1,
        priority: 'medium',
        rationale: 'Budget underutilization indicates bid competitiveness issues',
      });
    }

    return {
      campaignId,
      recommendations,
      projectedImprovement: recommendations.reduce((sum, r) => sum + r.expectedImpact, 0),
      confidence: Math.min(0.95, 0.6 + recommendations.length * 0.1),
    };
  }

  /**
   * Calculate budget allocation across campaigns
   */
  calculateBudgetAllocation(
    campaigns: Campaign[],
    totalBudget: number
  ): CampaignBudgetAllocation[] {
    // Score campaigns by performance
    const scores = campaigns.map((campaign) => {
      let score = 0;

      // ROAS contribution
      score += campaign.metrics.roas * 0.4;

      // Conversion rate
      const conversionRate = campaign.metrics.clicks > 0
        ? campaign.metrics.conversions / campaign.metrics.clicks
        : 0;
      score += conversionRate * 100 * 0.3;

      // CTR contribution
      score += campaign.metrics.ctr * 10 * 0.2;

      // Budget efficiency
      const spent = campaign.spent ?? campaign.budget.spent ?? 0;
      const efficiency = campaign.budget.total > 0 ? spent / campaign.budget.total : 0;
      score += efficiency * 0.1;

      return { campaign, score };
    });

    const totalScore = scores.reduce((sum, s) => sum + s.score, 0);

    return scores.map(({ campaign, score }) => ({
      campaignId: campaign.id,
      platform: campaign.platform,
      allocatedBudget: totalScore > 0 ? (score / totalScore) * totalBudget : totalBudget / campaigns.length,
      percentage: totalScore > 0 ? (score / totalScore) * 100 : 100 / campaigns.length,
      rationale: `Performance score: ${score.toFixed(2)}`,
    }));
  }

  /**
   * Validate campaign for activation
   */
  private validateForActivation(campaign: Campaign): void {
    const errors: string[] = [];

    if (!campaign.budget || campaign.budget.total <= 0) {
      errors.push('Campaign must have a positive budget');
    }

    if (!campaign.startDate || !campaign.endDate) {
      errors.push('Campaign must have start and end dates');
    } else if (campaign.startDate > campaign.endDate) {
      errors.push('Start date must be before end date');
    }

    if (!campaign.targeting || campaign.targeting.audiences.length === 0) {
      errors.push('Campaign must have at least one target audience');
    }

    if (errors.length > 0) {
      throw new Error(`Campaign validation failed: ${errors.join(', ')}`);
    }
  }
}

// Singleton instance
let serviceInstance: CampaignService | null = null;

export function getCampaignService(): CampaignService {
  if (!serviceInstance) {
    serviceInstance = new CampaignService();
  }
  return serviceInstance;
}
