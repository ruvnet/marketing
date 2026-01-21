/**
 * Creative Domain Service
 * Handles creative asset management, analysis, and optimization
 */

import { v4 as uuidv4 } from 'uuid';
import { EventBus, getEventBus } from '../core/event-bus';
import { StateManager, getStateManager } from '../core/state-manager';
import { createLogger, Logger } from '../core/logger';
import { Creative, CreativeType, CreativeMetrics, Platform } from '../types';

export interface CreativeCreateInput {
  name: string;
  type: CreativeType;
  platform: Platform;
  content: {
    headline?: string;
    body?: string;
    callToAction?: string;
    imageUrl?: string;
    videoUrl?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface CreativePerformance {
  creativeId: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
  engagementScore: number;
  fatigueLevel: number;
  recommendedAction: 'continue' | 'optimize' | 'pause' | 'replace';
}

export interface CreativeVariant {
  id: string;
  parentId: string;
  mutationType: 'headline' | 'body' | 'cta' | 'visual' | 'full';
  changes: Record<string, unknown>;
  predictedImprovement: number;
}

export class CreativeService {
  private readonly eventBus: EventBus;
  private readonly stateManager: StateManager;
  private readonly logger: Logger;

  constructor(eventBus?: EventBus, stateManager?: StateManager) {
    this.eventBus = eventBus || getEventBus();
    this.stateManager = stateManager || getStateManager();
    this.logger = createLogger('creative-service');
  }

  /**
   * Create a new creative asset
   */
  async createCreative(input: CreativeCreateInput): Promise<Creative> {
    const metrics: CreativeMetrics = {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      cvr: 0,
      engagementRate: 0,
      fatigueScore: 0,
      qualityScore: 0,
      timestamp: new Date(),
    };

    const creative: Creative = {
      id: uuidv4(),
      campaignId: '',
      name: input.name,
      type: input.type,
      platform: input.platform,
      status: 'draft',
      content: {
        headline: input.content.headline,
        body: input.content.body,
        cta: input.content.callToAction,
        url: input.content.imageUrl || input.content.videoUrl,
      },
      assets: [],
      metrics,
      performance: metrics,
      metadata: input.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.stateManager.addCreative(creative);

    this.eventBus.publish({
      id: uuidv4(),
      type: 'creative.created',
      timestamp: new Date(),
      source: 'creative-service',
      payload: { creative },
    });

    this.logger.info('Creative created', { creativeId: creative.id, name: creative.name });

    return creative;
  }

  /**
   * Update creative content
   */
  async updateContent(
    creativeId: string,
    content: Partial<Creative['content']>
  ): Promise<Creative> {
    const creative = this.stateManager.getCreative(creativeId);
    if (!creative) {
      throw new Error(`Creative not found: ${creativeId}`);
    }

    creative.content = { ...creative.content, ...content };
    creative.updatedAt = new Date();

    this.stateManager.addCreative(creative);

    this.eventBus.publish({
      id: uuidv4(),
      type: 'creative.updated',
      timestamp: new Date(),
      source: 'creative-service',
      payload: { creativeId, changes: content },
    });

    return creative;
  }

  /**
   * Activate a creative
   */
  async activateCreative(creativeId: string): Promise<Creative> {
    const creative = this.stateManager.getCreative(creativeId);
    if (!creative) {
      throw new Error(`Creative not found: ${creativeId}`);
    }

    creative.status = 'active';
    creative.updatedAt = new Date();

    this.stateManager.addCreative(creative);

    this.eventBus.publish({
      id: uuidv4(),
      type: 'creative.activated',
      timestamp: new Date(),
      source: 'creative-service',
      payload: { creativeId },
    });

    return creative;
  }

  /**
   * Analyze creative performance
   */
  analyzePerformance(creative: Creative): CreativePerformance {
    const performance = creative.performance ?? creative.metrics;

    // Calculate engagement score (0-100)
    const ctrScore = Math.min(performance.ctr * 100, 30); // Max 30 points
    const conversionScore = Math.min(performance.cvr * 200, 40); // Max 40 points
    const volumeScore = Math.min(Math.log10(performance.impressions + 1) * 5, 30); // Max 30 points
    const engagementScore = ctrScore + conversionScore + volumeScore;

    // Calculate fatigue level (0-1)
    const daysSinceCreation = Math.max(
      1,
      (Date.now() - creative.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const impressionsPerDay = performance.impressions / daysSinceCreation;
    const fatigueLevel = Math.min(
      1,
      (impressionsPerDay / 10000) * (daysSinceCreation / 14)
    );

    // Determine recommended action
    let recommendedAction: CreativePerformance['recommendedAction'] = 'continue';
    if (fatigueLevel > 0.8) {
      recommendedAction = 'replace';
    } else if (fatigueLevel > 0.5 || engagementScore < 30) {
      recommendedAction = 'optimize';
    } else if (performance.ctr < 0.005) {
      recommendedAction = 'pause';
    }

    return {
      creativeId: creative.id,
      impressions: performance.impressions,
      clicks: performance.clicks,
      conversions: performance.conversions,
      ctr: performance.ctr,
      conversionRate: performance.cvr,
      engagementScore,
      fatigueLevel,
      recommendedAction,
    };
  }

  /**
   * Generate creative variants
   */
  generateVariants(creative: Creative, count: number = 3): CreativeVariant[] {
    const variants: CreativeVariant[] = [];
    const mutationTypes: CreativeVariant['mutationType'][] = [
      'headline',
      'body',
      'cta',
      'visual',
    ];

    for (let i = 0; i < count; i++) {
      const mutationType = mutationTypes[i % mutationTypes.length];
      const variant: CreativeVariant = {
        id: uuidv4(),
        parentId: creative.id,
        mutationType,
        changes: this.generateMutationChanges(creative, mutationType),
        predictedImprovement: Math.random() * 0.3 + 0.05, // 5-35% predicted improvement
      };
      variants.push(variant);
    }

    return variants;
  }

  /**
   * Clone a creative
   */
  async cloneCreative(creativeId: string, modifications?: Partial<CreativeCreateInput>): Promise<Creative> {
    const original = this.stateManager.getCreative(creativeId);
    if (!original) {
      throw new Error(`Creative not found: ${creativeId}`);
    }

    const input: CreativeCreateInput = {
      name: modifications?.name || `${original.name} (Copy)`,
      type: modifications?.type || original.type,
      platform: modifications?.platform || original.platform!,
      content: modifications?.content || {
        headline: original.content?.headline,
        body: original.content?.body,
        callToAction: original.content?.cta,
      },
      metadata: {
        ...original.metadata,
        ...modifications?.metadata,
        clonedFrom: creativeId,
      },
    };

    return this.createCreative(input);
  }

  /**
   * Get creatives by campaign
   */
  getCreativesByCampaign(campaignId: string): Creative[] {
    const campaign = this.stateManager.getCampaign(campaignId);
    if (!campaign) {
      return [];
    }

    const creativeIds = campaign.creativeIds ?? campaign.creatives ?? [];
    return creativeIds
      .map((id) => this.stateManager.getCreative(id))
      .filter((c): c is Creative => c !== undefined);
  }

  /**
   * Rank creatives by performance
   */
  rankCreatives(creatives: Creative[]): Creative[] {
    return creatives
      .map((creative) => ({
        creative,
        performance: this.analyzePerformance(creative),
      }))
      .sort((a, b) => b.performance.engagementScore - a.performance.engagementScore)
      .map(({ creative }) => creative);
  }

  /**
   * Generate mutation changes based on type
   */
  private generateMutationChanges(
    creative: Creative,
    mutationType: CreativeVariant['mutationType']
  ): Record<string, unknown> {
    switch (mutationType) {
      case 'headline':
        return {
          headline: this.mutateText(creative.content?.headline || '', 'headline'),
        };
      case 'body':
        return {
          body: this.mutateText(creative.content?.body || '', 'body'),
        };
      case 'cta':
        return {
          cta: this.generateAlternativeCTA(creative.content?.cta || ''),
        };
      case 'visual':
        return {
          visualStyle: 'variant',
          colorScheme: 'alternative',
        };
      case 'full':
        return {
          headline: this.mutateText(creative.content?.headline || '', 'headline'),
          body: this.mutateText(creative.content?.body || '', 'body'),
          cta: this.generateAlternativeCTA(creative.content?.cta || ''),
        };
      default:
        return {};
    }
  }

  /**
   * Mutate text content
   */
  private mutateText(text: string, type: 'headline' | 'body'): string {
    // In a real implementation, this would use AI to generate variants
    const prefixes = type === 'headline'
      ? ['Discover', 'Unlock', 'Experience', 'Transform']
      : ['Learn how', 'Find out why', 'See how', 'Discover why'];

    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    return `${prefix}: ${text}`;
  }

  /**
   * Generate alternative CTA
   */
  private generateAlternativeCTA(original: string): string {
    const alternatives: Record<string, string[]> = {
      'Buy Now': ['Shop Now', 'Get Yours', 'Order Today'],
      'Learn More': ['Discover More', 'Find Out More', 'Explore'],
      'Sign Up': ['Join Now', 'Get Started', 'Start Free'],
      'Get Started': ['Begin Now', 'Start Today', 'Try Free'],
    };

    const options = alternatives[original] || ['Learn More', 'Get Started', 'Try Now'];
    return options[Math.floor(Math.random() * options.length)];
  }
}

// Singleton instance
let serviceInstance: CreativeService | null = null;

export function getCreativeService(): CreativeService {
  if (!serviceInstance) {
    serviceInstance = new CreativeService();
  }
  return serviceInstance;
}
