/**
 * Quality Agent - Output Validation and Truth-Scoring
 * Tier 1: Coordination
 *
 * Responsibilities:
 * - Validate agent outputs before execution
 * - Truth-scoring for predictions and recommendations
 * - Consistency checking across agent outputs
 * - Quality gates for campaign changes
 * - Audit trail generation
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  AgentConfig,
  AgentId,
  TaskContext,
  DomainEvent,
  EventType,
  Campaign,
  Creative,
  SimulationResult,
} from '../../types/index.js';
import { BaseAgent, AgentDependencies } from '../base-agent.js';

// ============================================================================
// Types
// ============================================================================

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  validator: (data: unknown, context: ValidationContext) => ValidationResult;
}

export interface ValidationContext {
  agentId: AgentId;
  taskType: string;
  campaignId?: string;
  historical?: unknown[];
}

export interface ValidationResult {
  passed: boolean;
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  details?: Record<string, unknown>;
}

export interface TruthScore {
  overall: number; // 0-1
  confidence: number; // 0-1
  components: {
    consistency: number;
    plausibility: number;
    evidenceSupport: number;
    historicalAccuracy: number;
  };
  flags: string[];
}

export interface QualityInput {
  action: 'validate' | 'score_truth' | 'check_consistency' | 'audit' | 'gate';
  data: unknown;
  context: ValidationContext;
  rules?: string[]; // Rule IDs to apply
  threshold?: number; // For gate action
}

export interface QualityOutput {
  action: string;
  result: {
    valid: boolean;
    validationResults?: ValidationResult[];
    truthScore?: TruthScore;
    consistencyReport?: ConsistencyReport;
    auditEntry?: AuditEntry;
    gateDecision?: GateDecision;
  };
}

export interface ConsistencyReport {
  consistent: boolean;
  conflicts: ConflictItem[];
  recommendations: string[];
}

export interface ConflictItem {
  source: string;
  field: string;
  values: unknown[];
  resolution?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  agentId: AgentId;
  action: string;
  input: unknown;
  output: unknown;
  validationResults: ValidationResult[];
  approved: boolean;
}

export interface GateDecision {
  passed: boolean;
  score: number;
  threshold: number;
  blockers: string[];
  warnings: string[];
}

// ============================================================================
// Configuration
// ============================================================================

export const qualityConfig: AgentConfig = {
  id: 'quality',
  tier: 1,
  name: 'Quality Agent',
  description: 'Output validation, truth-scoring, and quality gates for swarm outputs',
  capabilities: [
    {
      id: 'validation',
      name: 'Output Validation',
      description: 'Validate agent outputs against business rules',
      inputTypes: ['agent_output', 'validation_request'],
      outputTypes: ['validation_result'],
    },
    {
      id: 'truth_scoring',
      name: 'Truth Scoring',
      description: 'Score predictions and recommendations for accuracy',
      inputTypes: ['prediction', 'recommendation'],
      outputTypes: ['truth_score'],
    },
    {
      id: 'consistency_check',
      name: 'Consistency Check',
      description: 'Verify consistency across multiple agent outputs',
      inputTypes: ['outputs_batch'],
      outputTypes: ['consistency_report'],
    },
    {
      id: 'quality_gate',
      name: 'Quality Gate',
      description: 'Gate changes based on quality thresholds',
      inputTypes: ['change_proposal'],
      outputTypes: ['gate_decision'],
    },
  ],
  maxConcurrency: 8,
  timeoutMs: 15000,
  priority: 90,
  dependencies: [],
};

// ============================================================================
// Validation Rules Registry
// ============================================================================

const VALIDATION_RULES: Map<string, ValidationRule> = new Map([
  // Budget Rules
  [
    'budget_positive',
    {
      id: 'budget_positive',
      name: 'Budget Must Be Positive',
      description: 'Budget values must be greater than zero',
      severity: 'error',
      validator: (data: unknown) => {
        const budget = (data as { budget?: number })?.budget;
        return {
          passed: budget !== undefined && budget > 0,
          ruleId: 'budget_positive',
          severity: 'error',
          message: budget && budget > 0 ? 'Budget is valid' : 'Budget must be positive',
        };
      },
    },
  ],
  [
    'budget_limit',
    {
      id: 'budget_limit',
      name: 'Budget Within Limits',
      description: 'Budget changes should not exceed safe limits',
      severity: 'warning',
      validator: (data: unknown) => {
        const change = (data as { budgetChange?: number })?.budgetChange ?? 0;
        const passed = Math.abs(change) <= 0.5; // Max 50% change
        return {
          passed,
          ruleId: 'budget_limit',
          severity: 'warning',
          message: passed
            ? 'Budget change within limits'
            : `Budget change of ${(change * 100).toFixed(0)}% exceeds 50% limit`,
        };
      },
    },
  ],

  // Bid Rules
  [
    'bid_reasonable',
    {
      id: 'bid_reasonable',
      name: 'Bid Amount Reasonable',
      description: 'Bid amounts should be within reasonable ranges',
      severity: 'error',
      validator: (data: unknown) => {
        const bid = (data as { bid?: number })?.bid;
        const passed = bid !== undefined && bid > 0.01 && bid < 1000;
        return {
          passed,
          ruleId: 'bid_reasonable',
          severity: 'error',
          message: passed ? 'Bid is reasonable' : 'Bid is outside reasonable range ($0.01-$1000)',
        };
      },
    },
  ],

  // ROAS Rules
  [
    'roas_plausible',
    {
      id: 'roas_plausible',
      name: 'ROAS Prediction Plausible',
      description: 'ROAS predictions should be plausible',
      severity: 'warning',
      validator: (data: unknown) => {
        const roas = (data as { predictedRoas?: number })?.predictedRoas;
        const passed = roas !== undefined && roas >= 0 && roas < 100;
        return {
          passed,
          ruleId: 'roas_plausible',
          severity: 'warning',
          message: passed ? 'ROAS prediction is plausible' : 'ROAS prediction seems unrealistic',
        };
      },
    },
  ],

  // Creative Rules
  [
    'creative_complete',
    {
      id: 'creative_complete',
      name: 'Creative Has Required Fields',
      description: 'Creative must have all required fields',
      severity: 'error',
      validator: (data: unknown) => {
        const creative = data as Partial<Creative>;
        const hasRequired = creative.id && creative.campaignId && creative.type && creative.name;
        return {
          passed: !!hasRequired,
          ruleId: 'creative_complete',
          severity: 'error',
          message: hasRequired ? 'Creative is complete' : 'Creative missing required fields',
          details: {
            hasId: !!creative.id,
            hasCampaignId: !!creative.campaignId,
            hasType: !!creative.type,
            hasName: !!creative.name,
          },
        };
      },
    },
  ],

  // Simulation Rules
  [
    'simulation_confidence',
    {
      id: 'simulation_confidence',
      name: 'Simulation Has Adequate Confidence',
      description: 'Simulation results should have sufficient confidence',
      severity: 'warning',
      validator: (data: unknown) => {
        const result = data as Partial<SimulationResult>;
        const confidence = result.probability ?? 0;
        const passed = confidence >= 0.7;
        return {
          passed,
          ruleId: 'simulation_confidence',
          severity: 'warning',
          message: passed
            ? 'Simulation confidence adequate'
            : `Simulation confidence ${(confidence * 100).toFixed(0)}% below 70% threshold`,
        };
      },
    },
  ],

  // Risk Rules
  [
    'risk_acceptable',
    {
      id: 'risk_acceptable',
      name: 'Risk Score Acceptable',
      description: 'Risk score should be below threshold',
      severity: 'error',
      validator: (data: unknown) => {
        const result = data as Partial<SimulationResult>;
        const riskScore = result.riskScore ?? 0;
        const passed = riskScore < 0.7;
        return {
          passed,
          ruleId: 'risk_acceptable',
          severity: 'error',
          message: passed
            ? 'Risk level acceptable'
            : `Risk score ${(riskScore * 100).toFixed(0)}% exceeds 70% threshold`,
        };
      },
    },
  ],
]);

// ============================================================================
// Quality Agent Implementation
// ============================================================================

export class QualityAgent extends BaseAgent<QualityInput, QualityOutput> {
  private auditLog: AuditEntry[];
  private predictionHistory: Map<string, { predicted: number; actual?: number }>;
  private maxAuditEntries: number = 10000;

  constructor(deps?: AgentDependencies) {
    super(qualityConfig, deps);
    this.auditLog = [];
    this.predictionHistory = new Map();
  }

  /**
   * Main processing logic
   */
  protected async process(
    input: QualityInput,
    context: TaskContext
  ): Promise<QualityOutput> {
    this.logger.info('Processing quality request', { action: input.action });

    switch (input.action) {
      case 'validate':
        return this.validate(input);
      case 'score_truth':
        return this.scoreTruth(input);
      case 'check_consistency':
        return this.checkConsistency(input);
      case 'audit':
        return this.createAuditEntry(input);
      case 'gate':
        return this.evaluateGate(input);
      default:
        throw new Error(`Unknown action: ${input.action}`);
    }
  }

  /**
   * Validate data against rules
   */
  private async validate(input: QualityInput): Promise<QualityOutput> {
    const rulesToApply = input.rules?.length
      ? input.rules.map((id) => VALIDATION_RULES.get(id)).filter(Boolean)
      : Array.from(VALIDATION_RULES.values());

    const validationResults: ValidationResult[] = [];
    let hasErrors = false;

    for (const rule of rulesToApply) {
      if (!rule) continue;

      try {
        const result = rule.validator(input.data, input.context);
        validationResults.push(result);

        if (!result.passed && result.severity === 'error') {
          hasErrors = true;
        }
      } catch (error) {
        validationResults.push({
          passed: false,
          ruleId: rule.id,
          severity: 'error',
          message: `Rule execution failed: ${(error as Error).message}`,
        });
        hasErrors = true;
      }
    }

    this.logger.info('Validation complete', {
      valid: !hasErrors,
      rulesApplied: validationResults.length,
      errors: validationResults.filter((r) => !r.passed && r.severity === 'error').length,
      warnings: validationResults.filter((r) => !r.passed && r.severity === 'warning').length,
    });

    return {
      action: 'validate',
      result: {
        valid: !hasErrors,
        validationResults,
      },
    };
  }

  /**
   * Score truth/accuracy of predictions
   */
  private async scoreTruth(input: QualityInput): Promise<QualityOutput> {
    const data = input.data as Record<string, unknown>;
    const flags: string[] = [];

    // Component scores
    const consistency = this.calculateConsistencyScore(data);
    const plausibility = this.calculatePlausibilityScore(data);
    const evidenceSupport = this.calculateEvidenceScore(data);
    const historicalAccuracy = await this.calculateHistoricalAccuracy(input.context);

    // Check for flags
    if (consistency < 0.5) flags.push('LOW_CONSISTENCY');
    if (plausibility < 0.5) flags.push('LOW_PLAUSIBILITY');
    if (evidenceSupport < 0.5) flags.push('INSUFFICIENT_EVIDENCE');
    if (historicalAccuracy < 0.6) flags.push('POOR_TRACK_RECORD');

    // Calculate overall score (weighted average)
    const weights = { consistency: 0.25, plausibility: 0.25, evidenceSupport: 0.25, historicalAccuracy: 0.25 };
    const overall =
      consistency * weights.consistency +
      plausibility * weights.plausibility +
      evidenceSupport * weights.evidenceSupport +
      historicalAccuracy * weights.historicalAccuracy;

    // Confidence based on data completeness
    const confidence = this.calculateConfidence(data);

    const truthScore: TruthScore = {
      overall,
      confidence,
      components: {
        consistency,
        plausibility,
        evidenceSupport,
        historicalAccuracy,
      },
      flags,
    };

    return {
      action: 'score_truth',
      result: { valid: true, truthScore },
    };
  }

  /**
   * Check consistency across multiple outputs
   */
  private async checkConsistency(input: QualityInput): Promise<QualityOutput> {
    const data = input.data as Record<string, unknown>[];
    const conflicts: ConflictItem[] = [];
    const recommendations: string[] = [];

    // Compare common fields across outputs
    const fieldValues: Map<string, unknown[]> = new Map();

    for (const item of data) {
      for (const [key, value] of Object.entries(item)) {
        const existing = fieldValues.get(key) ?? [];
        existing.push(value);
        fieldValues.set(key, existing);
      }
    }

    // Find conflicts
    for (const [field, values] of fieldValues) {
      const uniqueValues = [...new Set(values.map((v) => JSON.stringify(v)))];
      if (uniqueValues.length > 1) {
        conflicts.push({
          source: 'multi_agent',
          field,
          values: uniqueValues.map((v) => JSON.parse(v)),
          resolution: this.suggestResolution(field, uniqueValues),
        });
      }
    }

    // Generate recommendations
    if (conflicts.length > 0) {
      recommendations.push(`Found ${conflicts.length} conflicting fields`);
      recommendations.push('Consider re-running affected agents with updated context');
    } else {
      recommendations.push('All outputs are consistent');
    }

    const consistencyReport: ConsistencyReport = {
      consistent: conflicts.length === 0,
      conflicts,
      recommendations,
    };

    return {
      action: 'check_consistency',
      result: { valid: consistencyReport.consistent, consistencyReport },
    };
  }

  /**
   * Create audit entry
   */
  private async createAuditEntry(input: QualityInput): Promise<QualityOutput> {
    const { context, data } = input;
    const validationResult = await this.validate(input);

    const auditEntry: AuditEntry = {
      id: uuidv4(),
      timestamp: new Date(),
      agentId: context.agentId,
      action: context.taskType,
      input: data,
      output: null,
      validationResults: validationResult.result.validationResults ?? [],
      approved: validationResult.result.valid ?? false,
    };

    this.auditLog.push(auditEntry);

    // Trim audit log if needed
    if (this.auditLog.length > this.maxAuditEntries) {
      this.auditLog = this.auditLog.slice(-this.maxAuditEntries);
    }

    return {
      action: 'audit',
      result: {
        valid: auditEntry.approved,
        auditEntry,
      },
    };
  }

  /**
   * Evaluate quality gate
   */
  private async evaluateGate(input: QualityInput): Promise<QualityOutput> {
    const threshold = input.threshold ?? 0.7;

    // Run validation
    const validationResult = await this.validate(input);

    // Run truth scoring
    const truthResult = await this.scoreTruth(input);

    const truthScore = truthResult.result.truthScore!;
    const validationResults = validationResult.result.validationResults ?? [];

    const blockers = validationResults
      .filter((r) => !r.passed && r.severity === 'error')
      .map((r) => r.message);

    const warnings = validationResults
      .filter((r) => !r.passed && r.severity === 'warning')
      .map((r) => r.message);

    const passed = blockers.length === 0 && truthScore.overall >= threshold;

    const gateDecision: GateDecision = {
      passed,
      score: truthScore.overall,
      threshold,
      blockers,
      warnings,
    };

    this.logger.info('Gate evaluation complete', {
      passed,
      score: truthScore.overall.toFixed(2),
      blockers: blockers.length,
      warnings: warnings.length,
    });

    return {
      action: 'gate',
      result: {
        valid: passed,
        gateDecision,
        truthScore,
      },
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private calculateConsistencyScore(data: Record<string, unknown>): number {
    // Check internal consistency
    let score = 1.0;

    // Check for null/undefined values
    const nullCount = Object.values(data).filter((v) => v == null).length;
    score -= nullCount * 0.1;

    // Check for contradictory values
    if (data.minBid && data.maxBid && (data.minBid as number) > (data.maxBid as number)) {
      score -= 0.3;
    }

    return Math.max(0, Math.min(1, score));
  }

  private calculatePlausibilityScore(data: Record<string, unknown>): number {
    let score = 1.0;

    // Check for extremely high/low values
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'number') {
        if (key.includes('roas') && (value < 0 || value > 50)) score -= 0.2;
        if (key.includes('ctr') && (value < 0 || value > 1)) score -= 0.2;
        if (key.includes('cvr') && (value < 0 || value > 1)) score -= 0.2;
      }
    }

    return Math.max(0, Math.min(1, score));
  }

  private calculateEvidenceScore(data: Record<string, unknown>): number {
    let score = 0.5; // Base score

    // Higher score if confidence intervals are provided
    if (data.confidenceInterval) score += 0.2;

    // Higher score if sample size is adequate
    if (data.sampleSize && (data.sampleSize as number) > 1000) score += 0.15;

    // Higher score if historical data is referenced
    if (data.historicalComparison) score += 0.15;

    return Math.max(0, Math.min(1, score));
  }

  private async calculateHistoricalAccuracy(context: ValidationContext): Promise<number> {
    // Look up past predictions from this agent
    const predictions = Array.from(this.predictionHistory.values()).filter(
      (p) => p.actual !== undefined
    );

    if (predictions.length === 0) return 0.7; // Default for new agents

    // Calculate accuracy
    let totalError = 0;
    for (const p of predictions) {
      if (p.actual !== undefined) {
        totalError += Math.abs(p.predicted - p.actual) / Math.max(p.actual, 1);
      }
    }

    const avgError = totalError / predictions.length;
    return Math.max(0, 1 - avgError);
  }

  private calculateConfidence(data: Record<string, unknown>): number {
    // Count non-null fields
    const totalFields = Object.keys(data).length;
    const filledFields = Object.values(data).filter((v) => v != null).length;

    return totalFields > 0 ? filledFields / totalFields : 0;
  }

  private suggestResolution(field: string, values: string[]): string {
    // Simple resolution strategies
    if (values.every((v) => !isNaN(Number(JSON.parse(v))))) {
      return 'Use average or median value';
    }
    return 'Use most recent value or manual review';
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Quick validation check
   */
  async quickValidate(
    data: unknown,
    agentId: AgentId,
    rules?: string[]
  ): Promise<boolean> {
    const result = await this.process(
      {
        action: 'validate',
        data,
        context: { agentId, taskType: 'quick_validate' },
        rules,
      },
      { correlationId: uuidv4(), metadata: {} }
    );
    return result.result.valid ?? false;
  }

  /**
   * Record prediction for accuracy tracking
   */
  recordPrediction(id: string, predicted: number): void {
    this.predictionHistory.set(id, { predicted });
  }

  /**
   * Update prediction with actual value
   */
  updateActual(id: string, actual: number): void {
    const prediction = this.predictionHistory.get(id);
    if (prediction) {
      prediction.actual = actual;
    }
  }

  /**
   * Get audit log
   */
  getAuditLog(limit: number = 100): AuditEntry[] {
    return this.auditLog.slice(-limit);
  }

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  protected async onInitialize(): Promise<void> {
    this.logger.info('Quality agent initializing');
  }

  protected async onShutdown(): Promise<void> {
    this.logger.info('Quality agent shutting down');
    this.logger.info(`Final audit log size: ${this.auditLog.length}`);
  }

  protected getSubscribedEvents(): EventType[] {
    return [
      'task.completed',
      'campaign.optimized',
      'campaign.budget_adjusted',
      'intelligence.prediction_generated',
    ];
  }

  protected async handleEvent(event: DomainEvent): Promise<void> {
    // Auto-audit significant events
    if (event.type === 'campaign.optimized' || event.type === 'campaign.budget_adjusted') {
      await this.createAuditEntry({
        action: 'audit',
        data: event.payload,
        context: {
          agentId: 'orchestrator',
          taskType: event.type,
          campaignId: event.aggregateId,
        },
      });
    }
  }
}
