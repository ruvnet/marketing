/**
 * AI Marketing Swarms - Core Type Definitions
 * 15-Agent Hierarchical Mesh System
 */

import { z } from 'zod';

// ============================================================================
// Agent System Types
// ============================================================================

export type AgentTier = 1 | 2 | 3 | 4 | 5;

export type AgentId =
  // Tier 1: Coordination
  | 'orchestrator'
  | 'memory'
  | 'quality'
  // Tier 2: Intelligence
  | 'simulation'
  | 'historical-memory'
  | 'risk-detection'
  | 'attention-arbitrage'
  // Tier 3: Creative
  | 'creative-genome'
  | 'fatigue-forecaster'
  | 'mutation'
  // Tier 4: Attribution
  | 'counterfactual'
  | 'causal-graph'
  | 'incrementality'
  // Tier 5: Operations
  | 'account-health'
  | 'cross-platform';

export type AgentStatus = 'idle' | 'processing' | 'error' | 'offline';

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  inputTypes: string[];
  outputTypes: string[];
}

export interface AgentMetrics {
  tasksProcessed: number;
  avgProcessingTime: number;
  successRate: number;
  lastActive: Date;
  memoryUsage: number;
  queueDepth: number;
}

export interface AgentConfig {
  id: AgentId;
  tier: AgentTier;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  maxConcurrency: number;
  timeoutMs: number;
  priority: number;
  dependencies: AgentId[];
}

export interface AgentState {
  id: AgentId;
  status: AgentStatus;
  currentTask: string | null;
  metrics: AgentMetrics;
  lastError: string | null;
  config: AgentConfig;
}

// ============================================================================
// Task System Types
// ============================================================================

export type TaskStatus = 'pending' | 'assigned' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'normal' | 'low';

// Task type enum for routing
export type TaskType =
  | 'campaign_optimization'
  | 'creative_generation'
  | 'creative_mutation'
  | 'attribution_analysis'
  | 'simulation'
  | 'risk_assessment'
  | 'fatigue_prediction'
  | 'bid_optimization'
  | 'budget_allocation'
  | 'audience_analysis'
  | (string & {});

export interface TaskContext {
  campaignId?: string;
  creativeId?: string;
  accountId?: string;
  platform?: Platform;
  correlationId: string;
  parentTaskId?: string;
  metadata: Record<string, unknown>;
}

export interface Task<TInput = unknown, TOutput = unknown> {
  id: string;
  type: string;
  priority: TaskPriority;
  status: TaskStatus;
  payload: TInput;          // Primary field
  input?: TInput;           // Alias for backwards compatibility
  output?: TOutput;
  error?: string;
  assignedTo?: AgentId;
  context?: TaskContext;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  retryCount?: number;
  maxRetries?: number;
}

export interface TaskResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metrics: {
    processingTime: number;
    memoryUsed: number;
  };
}

// ============================================================================
// Event System Types
// ============================================================================

// Allow specific event types plus wildcards and custom events
export type EventType =
  // Swarm Events
  | 'swarm.initialized'
  | 'swarm.started'
  | 'swarm.shutdown'
  | 'agent.joined'
  | 'agent.left'
  | 'agent.error'
  // Task Events
  | 'task.submitted'
  | 'task.assigned'
  | 'task.started'
  | 'task.completed'
  | 'task.failed'
  | 'task.retry'
  // Campaign Events
  | 'campaign.created'
  | 'campaign.optimized'
  | 'campaign.budget_adjusted'
  | 'campaign.anomaly_detected'
  // Creative Events
  | 'creative.created'
  | 'creative.genome_extracted'
  | 'creative.fatigue_detected'
  | 'creative.mutation_generated'
  | 'creative.rotated'
  // Attribution Events
  | 'attribution.path_discovered'
  | 'attribution.value_computed'
  | 'attribution.counterfactual_analyzed'
  | 'attribution.touchpoint_recorded'
  | 'attribution.conversion_recorded'
  // Analytics Events
  | 'analytics.metrics_recorded'
  // Intelligence Events
  | 'intelligence.pattern_detected'
  | 'intelligence.prediction_generated'
  | 'intelligence.risk_identified'
  // Memory Events
  | 'memory.updated'
  | 'memory.retrieved'
  // Quality Events
  | 'quality.passed'
  | 'quality.failed'
  // Wildcard support (for subscriptions)
  | '*'
  // Allow any string for flexibility
  | (string & {});

export interface DomainEvent<T = unknown> {
  id: string;
  type: EventType | string;
  timestamp: Date;
  source: string;
  payload: T;
  aggregateId?: string;
  aggregateType?: string;
  metadata?: {
    correlationId?: string;
    causationId?: string;
    userId?: string;
    version?: number;
  };
}

// ============================================================================
// Marketing Domain Types
// ============================================================================

export type Platform = 'google_ads' | 'meta' | 'tiktok' | 'linkedin';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'ended';

export interface Campaign {
  id: string;
  name: string;
  platform: Platform;
  accountId: string;
  status: CampaignStatus;
  budget: Budget;
  spent?: number;               // Direct spend accessor for convenience
  dailyBudget?: number;         // Direct daily budget accessor
  bidding: BiddingStrategy;
  targeting: TargetingConfig;
  creatives: string[];
  creativeIds?: string[];       // Alias for creatives
  metrics: CampaignMetrics;
  targetAudience?: AudienceSegment;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  daily: number;
  total: number;
  spent: number;
  currency: string;
  allocation: BudgetAllocation[];
}

export interface BudgetAllocation {
  segmentId: string;
  percentage: number;
  minSpend: number;
  maxSpend: number;
}

export interface BiddingStrategy {
  type: 'manual_cpc' | 'target_cpa' | 'target_roas' | 'maximize_conversions' | 'maximize_clicks';
  targetValue?: number;
  maxBid?: number;
  adjustments: BidAdjustment[];
}

export interface BidAdjustment {
  dimension: 'device' | 'location' | 'time' | 'audience';
  value: string;
  modifier: number;
}

export interface TargetingConfig {
  audiences: AudienceSegment[];
  locations: string[];
  languages: string[];
  devices: ('desktop' | 'mobile' | 'tablet')[];
  schedules: DaypartSchedule[];
  exclusions: string[];
}

export interface AudienceSegment {
  id: string;
  name: string;
  type: 'custom' | 'lookalike' | 'interest' | 'demographic' | 'remarketing';
  size: number;
  matchRate?: number;
}

export interface DaypartSchedule {
  dayOfWeek: number;
  startHour: number;
  endHour: number;
  bidModifier: number;
}

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr: number;
  cpc: number;
  cpa: number;
  roas: number;
  qualityScore?: number;
  timestamp: Date;
}

// ============================================================================
// Creative Types
// ============================================================================

export type CreativeType = 'image' | 'video' | 'carousel' | 'text' | 'responsive';

export interface CreativeContent {
  headline?: string;
  body?: string;
  description?: string;
  cta?: string;
  url?: string;
}

export interface Creative {
  id: string;
  campaignId: string;
  type: CreativeType;
  name: string;
  platform?: Platform;
  status: 'draft' | 'active' | 'fatigued' | 'retired';
  content?: CreativeContent;
  genome?: CreativeGenome;
  assets: CreativeAsset[];
  metrics: CreativeMetrics;
  performance?: CreativeMetrics;  // Alias for metrics
  lineage?: CreativeLineage;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreativeGenome {
  hook: HookGene;
  promise: PromiseGene;
  proof: ProofGene;
  cta: CTAGene;
  visualStyle: VisualStyleGene;
  emotionalTone: EmotionalToneGene;
  embedding?: number[];
}

export interface HookGene {
  type: 'question' | 'statistic' | 'story' | 'controversy' | 'promise' | 'curiosity';
  strength: number;
  keywords: string[];
}

export interface PromiseGene {
  primary: string;
  secondary: string[];
  specificity: number;
  believability: number;
}

export interface ProofGene {
  type: 'social' | 'authority' | 'demonstration' | 'testimonial' | 'data';
  strength: number;
  elements: string[];
}

export interface CTAGene {
  text: string;
  urgency: number;
  clarity: number;
  type: 'direct' | 'soft' | 'assumptive';
}

export interface VisualStyleGene {
  colorPalette: string[];
  contrast: number;
  complexity: number;
  brandAlignment: number;
}

export interface EmotionalToneGene {
  primary: 'fear' | 'hope' | 'urgency' | 'trust' | 'curiosity' | 'aspiration';
  intensity: number;
  consistency: number;
}

export interface CreativeAsset {
  id: string;
  type: 'image' | 'video' | 'text' | 'audio';
  url: string;
  dimensions?: { width: number; height: number };
  duration?: number;
  fileSize: number;
}

export interface CreativeMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  spend?: number;
  revenue?: number;
  ctr: number;
  cvr: number;
  engagementRate: number;
  viewRate?: number;
  avgWatchTime?: number;
  fatigueScore: number;
  qualityScore: number;
  timestamp: Date;
}

export interface CreativeLineage {
  parentId?: string;
  generation: number;
  mutations: MutationType[];
  performanceVsParent?: number;
}

export type MutationType =
  | 'hook_variation'
  | 'cta_variation'
  | 'color_shift'
  | 'copy_rewrite'
  | 'layout_change'
  | 'audience_adaptation';

// ============================================================================
// Attribution Types
// ============================================================================

export interface AttributionPath {
  id: string;
  conversionId: string;
  touchpoints: Touchpoint[];
  totalValue: number;
  model: AttributionModel;
  computedAt: Date;
}

export interface Touchpoint {
  id: string;
  channelId: string;
  campaignId: string;
  creativeId?: string;
  timestamp: Date;
  type: 'impression' | 'click' | 'view' | 'engagement' | 'conversion';
  position: number;
  attributedValue: number;
  shapleyValue?: number;
  platform: Platform;
  userId: string;
}

// Alias for backwards compatibility
export type Attribution = AttributionPath;

export type AttributionModel =
  | 'last_click'
  | 'first_click'
  | 'linear'
  | 'time_decay'
  | 'position_based'
  | 'data_driven'
  | 'shapley';

export interface CausalGraph {
  id: string;
  nodes: CausalNode[];
  edges: CausalEdge[];
  computedAt: Date;
}

export interface CausalNode {
  id: string;
  type: 'campaign' | 'creative' | 'channel' | 'audience' | 'conversion';
  label: string;
  metrics: Record<string, number>;
}

export interface CausalEdge {
  source: string;
  target: string;
  weight: number;
  confidence: number;
  type: 'direct' | 'indirect' | 'confounding';
}

export interface CounterfactualAnalysis {
  id: string;
  scenario: string;
  baseline: ScenarioMetrics;
  counterfactual: ScenarioMetrics;
  lift: number;
  confidence: number;
  computedAt: Date;
}

export interface ScenarioMetrics {
  conversions: number;
  revenue: number;
  spend: number;
  roas: number;
}

export interface IncrementalityResult {
  id: string;
  campaignId: string;
  testGroup: GroupMetrics;
  controlGroup: GroupMetrics;
  incrementalLift: number;
  statisticalSignificance: number;
  confidence: number;
  testPeriod: { start: Date; end: Date };
}

export interface GroupMetrics {
  size: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  avgOrderValue: number;
}

// ============================================================================
// Intelligence Types
// ============================================================================

export interface SimulationScenario {
  id: string;
  name: string;
  type: 'budget' | 'bid' | 'creative' | 'targeting';
  baselineConfig: Record<string, unknown>;
  variations: ScenarioVariation[];
  results?: SimulationResult[];
  runAt?: Date;
}

export interface ScenarioVariation {
  id: string;
  name: string;
  changes: Record<string, unknown>;
}

export interface SimulationResult {
  variationId: string;
  metrics: {
    expectedConversions: number;
    expectedRevenue: number;
    expectedSpend: number;
    expectedRoas: number;
    confidenceInterval: [number, number];
  };
  probability: number;
  riskScore: number;
}

export interface RiskAlert {
  id: string;
  type: 'spend_trap' | 'fraud' | 'budget_pacing' | 'quality_drop' | 'competitor';
  severity: 'critical' | 'high' | 'medium' | 'low';
  campaignId: string;
  description: string;
  recommendation: string;
  metrics: Record<string, number>;
  detectedAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

export interface AttentionArbitrageOpportunity {
  id: string;
  platform: Platform;
  segment: AudienceSegment;
  currentCpm: number;
  predictedValue: number;
  arbitrageScore: number;
  timeWindow: { start: Date; end: Date };
  confidence: number;
  detectedAt: Date;
}

// ============================================================================
// Vector & ML Types
// ============================================================================

export interface VectorEmbedding {
  id: string;
  vector: number[];
  dimensions: number;
  model: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface SimilarityResult {
  id: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface GNNPrediction {
  nodeId: string;
  predictions: Record<string, number>;
  confidence: number;
  features: number[];
}

export interface AttentionOutput {
  weights: number[][];
  output: number[];
  mechanism: string;
}

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const TaskInputSchema = z.object({
  type: z.string(),
  data: z.record(z.unknown()),
  priority: z.enum(['critical', 'high', 'normal', 'low']).default('normal'),
  context: z.object({
    campaignId: z.string().optional(),
    creativeId: z.string().optional(),
    accountId: z.string().optional(),
    platform: z.enum(['google_ads', 'meta', 'tiktok', 'linkedin']).optional(),
  }).optional(),
});

export const CampaignSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(255),
  platform: z.enum(['google_ads', 'meta', 'tiktok', 'linkedin']),
  accountId: z.string(),
  status: z.enum(['active', 'paused', 'ended']),
  budget: z.object({
    daily: z.number().positive(),
    total: z.number().positive(),
    spent: z.number().nonnegative(),
    currency: z.string().length(3),
  }),
});

export const CreativeSchema = z.object({
  id: z.string(),
  campaignId: z.string(),
  type: z.enum(['image', 'video', 'carousel', 'text', 'responsive']),
  name: z.string().min(1).max(255),
  status: z.enum(['draft', 'active', 'fatigued', 'retired']),
});

export type TaskInput = z.infer<typeof TaskInputSchema>;
