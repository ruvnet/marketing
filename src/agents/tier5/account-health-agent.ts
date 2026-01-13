/**
 * Account Health Agent - Self-Healing Operations
 * Tier 5: Operations
 *
 * Responsibilities:
 * - Monitor account health metrics
 * - Self-healing automated responses
 * - Budget pacing correction
 * - Quality score recovery
 * - Policy violation prevention
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  AgentConfig,
  TaskContext,
  DomainEvent,
  EventType,
  Campaign,
  Platform,
} from '../../types/index.js';
import { BaseAgent, AgentDependencies } from '../base-agent.js';

// ============================================================================
// Types
// ============================================================================

export interface AccountHealthInput {
  action: 'check_health' | 'diagnose' | 'heal' | 'prevent' | 'optimize';
  accountId?: string;
  platform?: Platform;
  campaigns?: Campaign[];
  issue?: HealthIssue;
}

export interface HealthIssue {
  type: 'budget_pacing' | 'quality_score' | 'policy_violation' | 'performance_drop' | 'billing';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  affectedCampaigns?: string[];
}

export interface AccountHealthOutput {
  action: string;
  result: {
    healthReport?: AccountHealthReport;
    diagnosis?: HealthDiagnosis;
    healingActions?: HealingAction[];
    preventionPlan?: PreventionPlan;
    optimizations?: AccountOptimization[];
  };
}

export interface AccountHealthReport {
  accountId: string;
  platform: Platform;
  overallHealth: 'healthy' | 'warning' | 'critical';
  score: number;
  metrics: AccountHealthMetrics;
  issues: HealthIssue[];
  recommendations: string[];
  lastChecked: Date;
}

export interface AccountHealthMetrics {
  budgetUtilization: number;
  avgQualityScore: number;
  policyCompliance: number;
  performanceTrend: number;
  accountAge: number;
  spendVelocity: number;
}

export interface HealthDiagnosis {
  issue: HealthIssue;
  rootCauses: RootCause[];
  impact: ImpactAssessment;
  urgency: 'immediate' | 'short_term' | 'long_term';
  complexity: 'simple' | 'moderate' | 'complex';
}

export interface RootCause {
  factor: string;
  contribution: number;
  evidence: string[];
  fixable: boolean;
}

export interface ImpactAssessment {
  revenueAtRisk: number;
  conversionsAtRisk: number;
  accountRisk: number;
  timeToImpact: number;
}

export interface HealingAction {
  id: string;
  type: 'automatic' | 'semi_automatic' | 'manual';
  priority: number;
  description: string;
  steps: string[];
  expectedOutcome: string;
  risk: 'low' | 'medium' | 'high';
  executed?: boolean;
  result?: string;
}

export interface PreventionPlan {
  triggers: PreventionTrigger[];
  rules: PreventionRule[];
  monitoring: MonitoringConfig;
}

export interface PreventionTrigger {
  condition: string;
  threshold: number;
  action: string;
}

export interface PreventionRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: string[];
  actions: string[];
}

export interface MonitoringConfig {
  frequency: string;
  metrics: string[];
  alerts: AlertConfig[];
}

export interface AlertConfig {
  metric: string;
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  notification: string;
}

export interface AccountOptimization {
  area: string;
  currentState: string;
  recommendedState: string;
  expectedImprovement: number;
  effort: 'low' | 'medium' | 'high';
}

// ============================================================================
// Configuration
// ============================================================================

export const accountHealthConfig: AgentConfig = {
  id: 'account-health',
  tier: 5,
  name: 'Account Health Agent',
  description: 'Monitor account health and perform self-healing operations',
  capabilities: [
    {
      id: 'health_monitoring',
      name: 'Health Monitoring',
      description: 'Monitor overall account health',
      inputTypes: ['account', 'campaigns'],
      outputTypes: ['health_report'],
    },
    {
      id: 'self_healing',
      name: 'Self-Healing',
      description: 'Automatically fix common issues',
      inputTypes: ['issue', 'campaigns'],
      outputTypes: ['healing_actions'],
    },
    {
      id: 'auto_recovery',
      name: 'Auto Recovery',
      description: 'Recover from performance degradation',
      inputTypes: ['campaigns', 'diagnosis'],
      outputTypes: ['recovery_plan'],
    },
    {
      id: 'prevention',
      name: 'Issue Prevention',
      description: 'Prevent common account issues',
      inputTypes: ['account', 'history'],
      outputTypes: ['prevention_plan'],
    },
  ],
  maxConcurrency: 4,
  timeoutMs: 20000,
  priority: 50,
  dependencies: ['quality', 'risk-detection'],
};

// ============================================================================
// Account Health Agent Implementation
// ============================================================================

export class AccountHealthAgent extends BaseAgent<AccountHealthInput, AccountHealthOutput> {
  private healthHistory: Map<string, AccountHealthReport[]>;
  private activeHealingActions: Map<string, HealingAction>;

  constructor(deps?: AgentDependencies) {
    super(accountHealthConfig, deps);
    this.healthHistory = new Map();
    this.activeHealingActions = new Map();
  }

  /**
   * Main processing logic
   */
  protected async process(
    input: AccountHealthInput,
    context: TaskContext
  ): Promise<AccountHealthOutput> {
    this.logger.info('Processing account health request', { action: input.action });

    switch (input.action) {
      case 'check_health':
        return this.checkHealth(input, context);
      case 'diagnose':
        return this.diagnoseIssue(input);
      case 'heal':
        return this.healIssue(input, context);
      case 'prevent':
        return this.createPreventionPlan(input);
      case 'optimize':
        return this.optimizeAccount(input);
      default:
        throw new Error(`Unknown action: ${input.action}`);
    }
  }

  /**
   * Check overall account health
   */
  private async checkHealth(
    input: AccountHealthInput,
    context: TaskContext
  ): Promise<AccountHealthOutput> {
    const { accountId = 'default', platform = 'google_ads', campaigns = [] } = input;

    // Calculate health metrics
    const metrics = this.calculateHealthMetrics(campaigns);

    // Identify issues
    const issues = this.identifyIssues(campaigns, metrics);

    // Calculate overall health score
    const score = this.calculateHealthScore(metrics, issues);

    // Determine overall health status
    let overallHealth: AccountHealthReport['overallHealth'] = 'healthy';
    if (score < 50) overallHealth = 'critical';
    else if (score < 75) overallHealth = 'warning';

    // Generate recommendations
    const recommendations = this.generateHealthRecommendations(issues, metrics);

    const healthReport: AccountHealthReport = {
      accountId,
      platform,
      overallHealth,
      score,
      metrics,
      issues,
      recommendations,
      lastChecked: new Date(),
    };

    // Store in history
    const history = this.healthHistory.get(accountId) ?? [];
    history.push(healthReport);
    if (history.length > 100) history.shift();
    this.healthHistory.set(accountId, history);

    // Emit event if health is degraded
    if (overallHealth !== 'healthy') {
      await this.emitEvent(
        'campaign.anomaly_detected',
        accountId,
        'account',
        { health: overallHealth, score, issueCount: issues.length },
        context.correlationId
      );
    }

    return {
      action: 'check_health',
      result: { healthReport },
    };
  }

  /**
   * Diagnose a specific issue
   */
  private async diagnoseIssue(input: AccountHealthInput): Promise<AccountHealthOutput> {
    const { issue, campaigns = [] } = input;

    if (!issue) {
      throw new Error('Issue is required for diagnosis');
    }

    // Identify root causes
    const rootCauses = this.identifyRootCauses(issue, campaigns);

    // Assess impact
    const impact = this.assessImpact(issue, campaigns);

    // Determine urgency
    const urgency = this.determineUrgency(issue, impact);

    // Assess complexity
    const complexity = this.assessComplexity(rootCauses);

    const diagnosis: HealthDiagnosis = {
      issue,
      rootCauses,
      impact,
      urgency,
      complexity,
    };

    return {
      action: 'diagnose',
      result: { diagnosis },
    };
  }

  /**
   * Execute healing actions
   */
  private async healIssue(
    input: AccountHealthInput,
    context: TaskContext
  ): Promise<AccountHealthOutput> {
    const { issue, campaigns = [] } = input;

    if (!issue) {
      throw new Error('Issue is required for healing');
    }

    // Generate healing actions based on issue type
    const healingActions = this.generateHealingActions(issue, campaigns);

    // Execute automatic actions
    for (const action of healingActions.filter((a) => a.type === 'automatic')) {
      try {
        await this.executeHealingAction(action, context);
        action.executed = true;
        action.result = 'Success';
      } catch (error) {
        action.executed = false;
        action.result = `Failed: ${(error as Error).message}`;
      }
    }

    return {
      action: 'heal',
      result: { healingActions },
    };
  }

  /**
   * Create prevention plan
   */
  private async createPreventionPlan(input: AccountHealthInput): Promise<AccountHealthOutput> {
    const { campaigns = [] } = input;

    // Define prevention triggers
    const triggers: PreventionTrigger[] = [
      { condition: 'budget_utilization < 0.8', threshold: 0.8, action: 'increase_bids' },
      { condition: 'budget_utilization > 1.1', threshold: 1.1, action: 'decrease_bids' },
      { condition: 'quality_score < 5', threshold: 5, action: 'review_creative' },
      { condition: 'ctr < baseline * 0.7', threshold: 0.7, action: 'refresh_creative' },
    ];

    // Define prevention rules
    const rules: PreventionRule[] = [
      {
        id: 'budget_guard',
        name: 'Budget Guard',
        description: 'Prevent budget overspend',
        enabled: true,
        conditions: ['spend > daily_budget * 0.9', 'time_of_day > 18:00'],
        actions: ['reduce_bids_by_10%', 'pause_low_performers'],
      },
      {
        id: 'quality_protector',
        name: 'Quality Protector',
        description: 'Maintain quality scores',
        enabled: true,
        conditions: ['quality_score_trend = declining', 'consecutive_days > 3'],
        actions: ['review_keywords', 'optimize_landing_pages'],
      },
      {
        id: 'policy_shield',
        name: 'Policy Shield',
        description: 'Prevent policy violations',
        enabled: true,
        conditions: ['ad_copy_contains_restricted_terms'],
        actions: ['flag_for_review', 'pause_ad'],
      },
    ];

    // Define monitoring configuration
    const monitoring: MonitoringConfig = {
      frequency: 'hourly',
      metrics: [
        'budget_utilization',
        'quality_score',
        'ctr',
        'cvr',
        'cpa',
        'roas',
        'impression_share',
      ],
      alerts: [
        { metric: 'budget_utilization', threshold: 1.2, severity: 'critical', notification: 'email' },
        { metric: 'quality_score', threshold: 3, severity: 'warning', notification: 'slack' },
        { metric: 'cpa', threshold: 1.5, severity: 'warning', notification: 'dashboard' },
      ],
    };

    const preventionPlan: PreventionPlan = {
      triggers,
      rules,
      monitoring,
    };

    return {
      action: 'prevent',
      result: { preventionPlan },
    };
  }

  /**
   * Optimize account settings
   */
  private async optimizeAccount(input: AccountHealthInput): Promise<AccountHealthOutput> {
    const { campaigns = [] } = input;

    const optimizations: AccountOptimization[] = [];

    // Budget allocation optimization
    const totalBudget = campaigns.reduce((sum, c) => sum + c.budget.daily, 0);
    const avgRoas = campaigns.reduce((sum, c) => sum + c.metrics.roas, 0) / campaigns.length;

    if (avgRoas < 2) {
      optimizations.push({
        area: 'Budget Allocation',
        currentState: 'Even distribution',
        recommendedState: 'Performance-based allocation',
        expectedImprovement: 0.15,
        effort: 'low',
      });
    }

    // Bidding strategy optimization
    const manualBidCampaigns = campaigns.filter(
      (c) => c.bidding.type === 'manual_cpc'
    );
    if (manualBidCampaigns.length > 0) {
      optimizations.push({
        area: 'Bidding Strategy',
        currentState: `${manualBidCampaigns.length} campaigns on manual bidding`,
        recommendedState: 'Smart bidding (Target ROAS)',
        expectedImprovement: 0.2,
        effort: 'medium',
      });
    }

    // Targeting optimization
    const broadTargetingCampaigns = campaigns.filter(
      (c) => c.targeting.audiences.some((a) => a.type === 'interest')
    );
    if (broadTargetingCampaigns.length > campaigns.length * 0.5) {
      optimizations.push({
        area: 'Audience Targeting',
        currentState: 'Heavy reliance on interest targeting',
        recommendedState: 'Add remarketing and lookalike audiences',
        expectedImprovement: 0.25,
        effort: 'medium',
      });
    }

    // Creative optimization
    const staleCreatives = campaigns.filter(
      (c) => c.creatives.length < 3
    );
    if (staleCreatives.length > 0) {
      optimizations.push({
        area: 'Creative Diversity',
        currentState: `${staleCreatives.length} campaigns with limited creatives`,
        recommendedState: 'Minimum 3-5 creative variants per campaign',
        expectedImprovement: 0.1,
        effort: 'high',
      });
    }

    return {
      action: 'optimize',
      result: { optimizations },
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private calculateHealthMetrics(campaigns: Campaign[]): AccountHealthMetrics {
    if (campaigns.length === 0) {
      return {
        budgetUtilization: 1,
        avgQualityScore: 7,
        policyCompliance: 1,
        performanceTrend: 0,
        accountAge: 365,
        spendVelocity: 1,
      };
    }

    const totalSpent = campaigns.reduce((sum, c) => sum + c.budget.spent, 0);
    const totalBudget = campaigns.reduce((sum, c) => sum + c.budget.daily, 0);
    const avgQs = campaigns.reduce((sum, c) => sum + (c.metrics.qualityScore ?? 7), 0) / campaigns.length;

    return {
      budgetUtilization: totalBudget > 0 ? totalSpent / totalBudget : 1,
      avgQualityScore: avgQs,
      policyCompliance: 1, // Would check policy status
      performanceTrend: 0.05, // Would calculate from historical data
      accountAge: 365, // Would get from account data
      spendVelocity: 1, // Would calculate spend rate
    };
  }

  private identifyIssues(campaigns: Campaign[], metrics: AccountHealthMetrics): HealthIssue[] {
    const issues: HealthIssue[] = [];

    if (metrics.budgetUtilization > 1.2) {
      issues.push({
        type: 'budget_pacing',
        severity: 'high',
        description: 'Budget overspend detected',
        affectedCampaigns: campaigns.filter((c) => c.budget.spent > c.budget.daily).map((c) => c.id),
      });
    }

    if (metrics.budgetUtilization < 0.7) {
      issues.push({
        type: 'budget_pacing',
        severity: 'medium',
        description: 'Budget underspend - not fully utilizing allocated budget',
        affectedCampaigns: campaigns.filter((c) => c.budget.spent < c.budget.daily * 0.7).map((c) => c.id),
      });
    }

    if (metrics.avgQualityScore < 5) {
      issues.push({
        type: 'quality_score',
        severity: 'high',
        description: 'Low quality scores affecting ad rank and costs',
        affectedCampaigns: campaigns.filter((c) => (c.metrics.qualityScore ?? 7) < 5).map((c) => c.id),
      });
    }

    const poorPerformers = campaigns.filter((c) => c.metrics.roas < 1);
    if (poorPerformers.length > campaigns.length * 0.3) {
      issues.push({
        type: 'performance_drop',
        severity: 'high',
        description: `${poorPerformers.length} campaigns performing below ROAS threshold`,
        affectedCampaigns: poorPerformers.map((c) => c.id),
      });
    }

    return issues;
  }

  private calculateHealthScore(metrics: AccountHealthMetrics, issues: HealthIssue[]): number {
    let score = 100;

    // Deduct for budget issues
    if (metrics.budgetUtilization > 1.1 || metrics.budgetUtilization < 0.8) {
      score -= 15;
    }

    // Deduct for quality score
    if (metrics.avgQualityScore < 7) {
      score -= (7 - metrics.avgQualityScore) * 5;
    }

    // Deduct for issues
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical':
          score -= 20;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  private generateHealthRecommendations(issues: HealthIssue[], metrics: AccountHealthMetrics): string[] {
    const recommendations: string[] = [];

    if (issues.length === 0) {
      recommendations.push('Account is healthy - continue monitoring');
    }

    for (const issue of issues) {
      switch (issue.type) {
        case 'budget_pacing':
          recommendations.push('Review and adjust daily budgets to match pacing targets');
          break;
        case 'quality_score':
          recommendations.push('Improve ad relevance and landing page experience');
          break;
        case 'performance_drop':
          recommendations.push('Analyze and optimize underperforming campaigns');
          break;
        case 'policy_violation':
          recommendations.push('Review and update ads to comply with policies');
          break;
      }
    }

    return recommendations;
  }

  private identifyRootCauses(issue: HealthIssue, campaigns: Campaign[]): RootCause[] {
    const rootCauses: RootCause[] = [];

    switch (issue.type) {
      case 'budget_pacing':
        rootCauses.push({
          factor: 'Bid strategy',
          contribution: 0.4,
          evidence: ['Bids may be too aggressive/conservative'],
          fixable: true,
        });
        rootCauses.push({
          factor: 'Competition',
          contribution: 0.3,
          evidence: ['Market competition may have changed'],
          fixable: false,
        });
        break;

      case 'quality_score':
        rootCauses.push({
          factor: 'Ad relevance',
          contribution: 0.35,
          evidence: ['Keywords may not match ad copy'],
          fixable: true,
        });
        rootCauses.push({
          factor: 'Landing page',
          contribution: 0.35,
          evidence: ['Landing page may have issues'],
          fixable: true,
        });
        rootCauses.push({
          factor: 'Expected CTR',
          contribution: 0.3,
          evidence: ['Historical CTR below average'],
          fixable: true,
        });
        break;

      case 'performance_drop':
        rootCauses.push({
          factor: 'Creative fatigue',
          contribution: 0.3,
          evidence: ['Ads may have been running too long'],
          fixable: true,
        });
        rootCauses.push({
          factor: 'Audience saturation',
          contribution: 0.3,
          evidence: ['Target audience may be exhausted'],
          fixable: true,
        });
        rootCauses.push({
          factor: 'Seasonality',
          contribution: 0.2,
          evidence: ['May be seasonal fluctuation'],
          fixable: false,
        });
        break;
    }

    return rootCauses;
  }

  private assessImpact(issue: HealthIssue, campaigns: Campaign[]): ImpactAssessment {
    const affectedCampaigns = campaigns.filter(
      (c) => issue.affectedCampaigns?.includes(c.id)
    );

    const revenueAtRisk = affectedCampaigns.reduce((sum, c) => sum + c.metrics.revenue, 0) * 0.2;
    const conversionsAtRisk = affectedCampaigns.reduce((sum, c) => sum + c.metrics.conversions, 0) * 0.2;

    let accountRisk = 0;
    let timeToImpact = 7;

    switch (issue.severity) {
      case 'critical':
        accountRisk = 0.8;
        timeToImpact = 1;
        break;
      case 'high':
        accountRisk = 0.5;
        timeToImpact = 3;
        break;
      case 'medium':
        accountRisk = 0.3;
        timeToImpact = 7;
        break;
      case 'low':
        accountRisk = 0.1;
        timeToImpact = 14;
        break;
    }

    return { revenueAtRisk, conversionsAtRisk, accountRisk, timeToImpact };
  }

  private determineUrgency(issue: HealthIssue, impact: ImpactAssessment): HealthDiagnosis['urgency'] {
    if (issue.severity === 'critical' || impact.timeToImpact <= 1) {
      return 'immediate';
    }
    if (issue.severity === 'high' || impact.timeToImpact <= 3) {
      return 'short_term';
    }
    return 'long_term';
  }

  private assessComplexity(rootCauses: RootCause[]): HealthDiagnosis['complexity'] {
    const fixableCount = rootCauses.filter((r) => r.fixable).length;
    const avgContribution = rootCauses.reduce((sum, r) => sum + r.contribution, 0) / rootCauses.length;

    if (fixableCount === rootCauses.length && avgContribution < 0.4) {
      return 'simple';
    }
    if (fixableCount >= rootCauses.length * 0.5) {
      return 'moderate';
    }
    return 'complex';
  }

  private generateHealingActions(issue: HealthIssue, campaigns: Campaign[]): HealingAction[] {
    const actions: HealingAction[] = [];

    switch (issue.type) {
      case 'budget_pacing':
        actions.push({
          id: uuidv4(),
          type: 'automatic',
          priority: 1,
          description: 'Adjust bid modifiers for pacing',
          steps: ['Calculate pacing deviation', 'Adjust bids by inverse of deviation', 'Monitor for 2 hours'],
          expectedOutcome: 'Pacing within 5% of target',
          risk: 'low',
        });
        break;

      case 'quality_score':
        actions.push({
          id: uuidv4(),
          type: 'semi_automatic',
          priority: 1,
          description: 'Review and update ad copy',
          steps: ['Identify low QS keywords', 'Generate new ad variations', 'Submit for review'],
          expectedOutcome: 'Quality score improvement within 1-2 weeks',
          risk: 'low',
        });
        break;

      case 'performance_drop':
        actions.push({
          id: uuidv4(),
          type: 'automatic',
          priority: 1,
          description: 'Pause worst performers',
          steps: ['Identify campaigns with ROAS < 0.5', 'Pause for review', 'Notify team'],
          expectedOutcome: 'Stop budget waste immediately',
          risk: 'medium',
        });
        actions.push({
          id: uuidv4(),
          type: 'semi_automatic',
          priority: 2,
          description: 'Refresh creative assets',
          steps: ['Identify fatigued creatives', 'Generate variations', 'Launch A/B test'],
          expectedOutcome: 'Performance recovery within 1 week',
          risk: 'low',
        });
        break;
    }

    return actions;
  }

  private async executeHealingAction(action: HealingAction, context: TaskContext): Promise<void> {
    this.logger.info('Executing healing action', { actionId: action.id, description: action.description });

    // Simulate action execution
    await new Promise((resolve) => setTimeout(resolve, 100));

    this.activeHealingActions.set(action.id, action);

    await this.emitEvent(
      'campaign.anomaly_detected',
      action.id,
      'healing_action',
      { action: action.description, status: 'executed' },
      context.correlationId
    );
  }

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  protected async onInitialize(): Promise<void> {
    this.logger.info('Account health agent initializing');
  }

  protected async onShutdown(): Promise<void> {
    this.logger.info('Account health agent shutting down');
    this.healthHistory.clear();
    this.activeHealingActions.clear();
  }

  protected getSubscribedEvents(): EventType[] {
    return ['campaign.anomaly_detected', 'intelligence.risk_identified'];
  }

  protected async handleEvent(event: DomainEvent): Promise<void> {
    if (event.type === 'intelligence.risk_identified') {
      this.logger.warn('Risk identified - may need healing', { eventId: event.id });
    }
  }
}
