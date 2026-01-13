/**
 * Mutation Agent - Creative Variant Generation
 * Tier 3: Creative
 *
 * Responsibilities:
 * - Generate creative variants through genetic mutation
 * - A/B test variant creation
 * - Cross-pollination of winning elements
 * - Evolutionary optimization
 * - Lineage tracking
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  AgentConfig,
  TaskContext,
  DomainEvent,
  EventType,
  Creative,
  CreativeGenome,
  CreativeLineage,
  MutationType,
  HookGene,
  PromiseGene,
  CTAGene,
  VisualStyleGene,
  EmotionalToneGene,
} from '../../types/index.js';
import { BaseAgent, AgentDependencies } from '../base-agent.js';

// ============================================================================
// Types
// ============================================================================

export interface MutationInput {
  action: 'mutate' | 'crossover' | 'evolve' | 'generate_variants' | 'optimize_lineage';
  creative?: Creative;
  creatives?: Creative[];
  mutationTypes?: MutationType[];
  count?: number;
  constraints?: MutationConstraints;
}

export interface MutationConstraints {
  preserveHook?: boolean;
  preserveCta?: boolean;
  maxMutations?: number;
  mustIncludeMutations?: MutationType[];
  excludeMutations?: MutationType[];
}

export interface MutationOutput {
  action: string;
  result: {
    variants?: CreativeVariant[];
    offspring?: CreativeVariant;
    lineageTree?: LineageNode;
    optimizationPlan?: EvolutionPlan;
  };
}

export interface CreativeVariant {
  id: string;
  parentId: string;
  name: string;
  genome: CreativeGenome;
  mutations: AppliedMutation[];
  lineage: CreativeLineage;
  expectedPerformance: number;
  confidence: number;
}

export interface AppliedMutation {
  type: MutationType;
  gene: string;
  originalValue: unknown;
  mutatedValue: unknown;
  rationale: string;
}

export interface LineageNode {
  id: string;
  generation: number;
  performance: number;
  children: LineageNode[];
  mutations: MutationType[];
}

export interface EvolutionPlan {
  currentGeneration: number;
  targetGenerations: number;
  strategy: 'exploit' | 'explore' | 'balanced';
  plannedMutations: PlannedMutation[];
  expectedOutcome: number;
}

export interface PlannedMutation {
  generation: number;
  mutationType: MutationType;
  targetGene: string;
  rationale: string;
  probability: number;
}

// ============================================================================
// Configuration
// ============================================================================

export const mutationConfig: AgentConfig = {
  id: 'mutation',
  tier: 3,
  name: 'Mutation Agent',
  description: 'Generate creative variants through genetic mutation',
  capabilities: [
    {
      id: 'creative_variation',
      name: 'Creative Variation',
      description: 'Create variants of existing creatives',
      inputTypes: ['creative', 'mutation_types'],
      outputTypes: ['variants'],
    },
    {
      id: 'genetic_mutation',
      name: 'Genetic Mutation',
      description: 'Apply mutations to creative genome',
      inputTypes: ['genome', 'mutations'],
      outputTypes: ['mutated_genome'],
    },
    {
      id: 'crossover',
      name: 'Crossover Breeding',
      description: 'Combine genes from multiple creatives',
      inputTypes: ['creatives'],
      outputTypes: ['offspring'],
    },
    {
      id: 'ab_generation',
      name: 'A/B Test Generation',
      description: 'Generate variants for A/B testing',
      inputTypes: ['creative', 'count'],
      outputTypes: ['test_variants'],
    },
  ],
  maxConcurrency: 5,
  timeoutMs: 20000,
  priority: 62,
  dependencies: ['creative-genome'],
};

// ============================================================================
// Mutation Strategies
// ============================================================================

const MUTATION_STRATEGIES: Record<MutationType, (genome: CreativeGenome) => Partial<CreativeGenome>> = {
  hook_variation: (genome) => ({
    hook: mutateHook(genome.hook),
  }),
  cta_variation: (genome) => ({
    cta: mutateCTA(genome.cta),
  }),
  color_shift: (genome) => ({
    visualStyle: mutateVisualStyle(genome.visualStyle),
  }),
  copy_rewrite: (genome) => ({
    promise: mutatePromise(genome.promise),
  }),
  layout_change: (genome) => ({
    visualStyle: {
      ...genome.visualStyle,
      complexity: Math.max(0.1, Math.min(0.9, genome.visualStyle.complexity + (Math.random() - 0.5) * 0.3)),
    },
  }),
  audience_adaptation: (genome) => ({
    emotionalTone: mutateEmotionalTone(genome.emotionalTone),
  }),
};

function mutateHook(hook: HookGene): HookGene {
  const hookTypes: HookGene['type'][] = ['question', 'statistic', 'story', 'controversy', 'promise', 'curiosity'];
  const currentIndex = hookTypes.indexOf(hook.type);
  const newIndex = (currentIndex + 1 + Math.floor(Math.random() * (hookTypes.length - 1))) % hookTypes.length;

  return {
    type: hookTypes[newIndex],
    strength: Math.max(0.3, Math.min(1, hook.strength + (Math.random() - 0.4) * 0.3)),
    keywords: [...hook.keywords.slice(0, 3), generateKeyword()],
  };
}

function mutateCTA(cta: CTAGene): CTAGene {
  const ctaTemplates = [
    { text: 'Get Started Now', urgency: 0.9, type: 'direct' as const },
    { text: 'Learn More', urgency: 0.3, type: 'soft' as const },
    { text: 'Claim Your Spot', urgency: 0.8, type: 'assumptive' as const },
    { text: 'Start Free Trial', urgency: 0.6, type: 'assumptive' as const },
    { text: 'See How It Works', urgency: 0.4, type: 'soft' as const },
    { text: 'Join Today', urgency: 0.7, type: 'direct' as const },
  ];

  const template = ctaTemplates[Math.floor(Math.random() * ctaTemplates.length)];
  return {
    text: template.text,
    urgency: template.urgency,
    clarity: Math.max(0.5, Math.min(1, cta.clarity + (Math.random() - 0.5) * 0.2)),
    type: template.type,
  };
}

function mutatePromise(promise: PromiseGene): PromiseGene {
  const promiseEnhancements = [
    'in just 30 days',
    'guaranteed',
    'without the hassle',
    'starting today',
    'with proven results',
  ];

  const enhancement = promiseEnhancements[Math.floor(Math.random() * promiseEnhancements.length)];

  return {
    primary: promise.primary.includes(enhancement) ? promise.primary : `${promise.primary} ${enhancement}`,
    secondary: promise.secondary,
    specificity: Math.min(1, promise.specificity + 0.1),
    believability: promise.believability,
  };
}

function mutateVisualStyle(style: VisualStyleGene): VisualStyleGene {
  const colorShifts = [
    ['#1a73e8', '#4285f4', '#ffffff'], // Google blue
    ['#ff6b6b', '#ee5a5a', '#ffffff'], // Coral
    ['#00b894', '#00cec9', '#ffffff'], // Teal
    ['#6c5ce7', '#a29bfe', '#ffffff'], // Purple
    ['#fdcb6e', '#f39c12', '#ffffff'], // Gold
  ];

  return {
    colorPalette: colorShifts[Math.floor(Math.random() * colorShifts.length)],
    contrast: Math.max(0.5, Math.min(1, style.contrast + (Math.random() - 0.5) * 0.2)),
    complexity: style.complexity,
    brandAlignment: style.brandAlignment,
  };
}

function mutateEmotionalTone(tone: EmotionalToneGene): EmotionalToneGene {
  const emotions: EmotionalToneGene['primary'][] = ['fear', 'hope', 'urgency', 'trust', 'curiosity', 'aspiration'];
  const currentIndex = emotions.indexOf(tone.primary);
  const newIndex = (currentIndex + 1 + Math.floor(Math.random() * (emotions.length - 1))) % emotions.length;

  return {
    primary: emotions[newIndex],
    intensity: Math.max(0.3, Math.min(1, tone.intensity + (Math.random() - 0.5) * 0.3)),
    consistency: tone.consistency,
  };
}

function generateKeyword(): string {
  const keywords = ['proven', 'exclusive', 'limited', 'free', 'instant', 'guaranteed', 'new', 'best'];
  return keywords[Math.floor(Math.random() * keywords.length)];
}

// ============================================================================
// Mutation Agent Implementation
// ============================================================================

export class MutationAgent extends BaseAgent<MutationInput, MutationOutput> {
  private variantHistory: Map<string, CreativeVariant[]>;

  constructor(deps?: AgentDependencies) {
    super(mutationConfig, deps);
    this.variantHistory = new Map();
  }

  /**
   * Main processing logic
   */
  protected async process(
    input: MutationInput,
    context: TaskContext
  ): Promise<MutationOutput> {
    this.logger.info('Processing mutation request', { action: input.action });

    switch (input.action) {
      case 'mutate':
        return this.mutateCreative(input, context);
      case 'crossover':
        return this.crossoverCreatives(input, context);
      case 'evolve':
        return this.evolveCreative(input, context);
      case 'generate_variants':
        return this.generateVariants(input, context);
      case 'optimize_lineage':
        return this.optimizeLineage(input);
      default:
        throw new Error(`Unknown action: ${input.action}`);
    }
  }

  /**
   * Apply mutations to a creative
   */
  private async mutateCreative(
    input: MutationInput,
    context: TaskContext
  ): Promise<MutationOutput> {
    if (!input.creative) {
      throw new Error('Creative is required for mutation');
    }

    const creative = input.creative;
    const genome = creative.genome ?? this.createDefaultGenome();
    const mutationTypes = input.mutationTypes ?? this.selectRandomMutations(input.constraints);

    const mutations: AppliedMutation[] = [];
    let mutatedGenome = { ...genome };

    for (const mutationType of mutationTypes) {
      if (this.shouldSkipMutation(mutationType, input.constraints)) continue;

      const strategy = MUTATION_STRATEGIES[mutationType];
      if (!strategy) continue;

      const originalGene = this.extractGeneForMutation(mutatedGenome, mutationType);
      const mutation = strategy(mutatedGenome);
      mutatedGenome = { ...mutatedGenome, ...mutation };

      mutations.push({
        type: mutationType,
        gene: this.getMutatedGeneName(mutationType),
        originalValue: originalGene,
        mutatedValue: mutation[this.getMutatedGeneName(mutationType) as keyof CreativeGenome],
        rationale: this.getMutationRationale(mutationType),
      });
    }

    // Regenerate embedding
    mutatedGenome.embedding = this.generateEmbedding(mutatedGenome);

    const variant: CreativeVariant = {
      id: uuidv4(),
      parentId: creative.id,
      name: `${creative.name} - Variant ${Date.now() % 1000}`,
      genome: mutatedGenome,
      mutations,
      lineage: {
        parentId: creative.id,
        generation: (creative.lineage?.generation ?? 0) + 1,
        mutations: mutationTypes,
      },
      expectedPerformance: this.estimatePerformance(mutatedGenome, mutations),
      confidence: 0.7,
    };

    // Track variant
    const history = this.variantHistory.get(creative.id) ?? [];
    history.push(variant);
    this.variantHistory.set(creative.id, history);

    // Emit event
    await this.emitEvent(
      'creative.mutation_generated',
      variant.id,
      'creative',
      {
        variantId: variant.id,
        parentId: creative.id,
        mutations: mutationTypes,
      },
      context.correlationId
    );

    return {
      action: 'mutate',
      result: { variants: [variant] },
    };
  }

  /**
   * Crossover two creatives to create offspring
   */
  private async crossoverCreatives(
    input: MutationInput,
    context: TaskContext
  ): Promise<MutationOutput> {
    const creatives = input.creatives ?? [];
    if (creatives.length < 2) {
      throw new Error('At least 2 creatives are required for crossover');
    }

    const parent1 = creatives[0];
    const parent2 = creatives[1];
    const genome1 = parent1.genome ?? this.createDefaultGenome();
    const genome2 = parent2.genome ?? this.createDefaultGenome();

    // Crossover: take best genes from each parent
    const performance1 = parent1.metrics?.ctr ?? 0;
    const performance2 = parent2.metrics?.ctr ?? 0;

    const offspringGenome: CreativeGenome = {
      hook: performance1 > performance2 ? genome1.hook : genome2.hook,
      promise: this.mergePromises(genome1.promise, genome2.promise),
      proof: genome1.proof.strength > genome2.proof.strength ? genome1.proof : genome2.proof,
      cta: performance1 > performance2 ? genome1.cta : genome2.cta,
      visualStyle: this.blendVisualStyles(genome1.visualStyle, genome2.visualStyle),
      emotionalTone: genome1.emotionalTone.intensity > genome2.emotionalTone.intensity
        ? genome1.emotionalTone
        : genome2.emotionalTone,
      embedding: [],
    };

    offspringGenome.embedding = this.generateEmbedding(offspringGenome);

    const offspring: CreativeVariant = {
      id: uuidv4(),
      parentId: parent1.id,
      name: `Crossover: ${parent1.name} × ${parent2.name}`,
      genome: offspringGenome,
      mutations: [],
      lineage: {
        parentId: parent1.id,
        generation: Math.max(
          parent1.lineage?.generation ?? 0,
          parent2.lineage?.generation ?? 0
        ) + 1,
        mutations: ['hook_variation', 'cta_variation'], // Inherited
      },
      expectedPerformance: (performance1 + performance2) / 2 * 1.1, // Expected 10% improvement
      confidence: 0.6,
    };

    return {
      action: 'crossover',
      result: { offspring },
    };
  }

  /**
   * Evolve creative through multiple generations
   */
  private async evolveCreative(
    input: MutationInput,
    context: TaskContext
  ): Promise<MutationOutput> {
    if (!input.creative) {
      throw new Error('Creative is required for evolution');
    }

    const generations = input.count ?? 3;
    const variants: CreativeVariant[] = [];
    let currentCreative = input.creative;

    for (let gen = 0; gen < generations; gen++) {
      // Generate mutations for this generation
      const mutationResult = await this.mutateCreative(
        {
          action: 'mutate',
          creative: currentCreative,
          constraints: input.constraints,
        },
        context
      );

      const variant = mutationResult.result.variants?.[0];
      if (variant) {
        variants.push(variant);
        // Use variant as base for next generation
        currentCreative = {
          ...currentCreative,
          id: variant.id,
          genome: variant.genome,
          lineage: variant.lineage,
        };
      }
    }

    return {
      action: 'evolve',
      result: { variants },
    };
  }

  /**
   * Generate multiple variants for A/B testing
   */
  private async generateVariants(
    input: MutationInput,
    context: TaskContext
  ): Promise<MutationOutput> {
    if (!input.creative) {
      throw new Error('Creative is required for variant generation');
    }

    const count = input.count ?? 3;
    const variants: CreativeVariant[] = [];

    // Define different mutation strategies for diversity
    const strategies: MutationType[][] = [
      ['hook_variation'],
      ['cta_variation'],
      ['color_shift'],
      ['copy_rewrite'],
      ['audience_adaptation'],
      ['hook_variation', 'cta_variation'],
      ['color_shift', 'copy_rewrite'],
    ];

    for (let i = 0; i < count; i++) {
      const mutationTypes = strategies[i % strategies.length];

      const result = await this.mutateCreative(
        {
          action: 'mutate',
          creative: input.creative,
          mutationTypes,
          constraints: input.constraints,
        },
        context
      );

      if (result.result.variants?.[0]) {
        variants.push(result.result.variants[0]);
      }
    }

    return {
      action: 'generate_variants',
      result: { variants },
    };
  }

  /**
   * Optimize creative lineage
   */
  private async optimizeLineage(input: MutationInput): Promise<MutationOutput> {
    if (!input.creative) {
      throw new Error('Creative is required for lineage optimization');
    }

    const creative = input.creative;
    const generation = creative.lineage?.generation ?? 0;

    // Determine strategy based on generation
    let strategy: EvolutionPlan['strategy'];
    if (generation < 3) {
      strategy = 'explore'; // Early: try many different mutations
    } else if (generation < 7) {
      strategy = 'balanced'; // Mid: mix of exploration and exploitation
    } else {
      strategy = 'exploit'; // Late: focus on refining what works
    }

    // Plan future mutations
    const plannedMutations: PlannedMutation[] = [];
    const allMutationTypes: MutationType[] = [
      'hook_variation', 'cta_variation', 'color_shift',
      'copy_rewrite', 'layout_change', 'audience_adaptation',
    ];

    for (let g = 1; g <= 3; g++) {
      const mutation = allMutationTypes[Math.floor(Math.random() * allMutationTypes.length)];
      plannedMutations.push({
        generation: generation + g,
        mutationType: mutation,
        targetGene: this.getMutatedGeneName(mutation),
        rationale: this.getMutationRationale(mutation),
        probability: strategy === 'exploit' ? 0.8 : 0.5,
      });
    }

    const plan: EvolutionPlan = {
      currentGeneration: generation,
      targetGenerations: generation + 5,
      strategy,
      plannedMutations,
      expectedOutcome: this.estimateEvolutionOutcome(creative, plannedMutations),
    };

    // Build lineage tree
    const lineageTree = this.buildLineageTree(creative);

    return {
      action: 'optimize_lineage',
      result: { optimizationPlan: plan, lineageTree },
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private createDefaultGenome(): CreativeGenome {
    return {
      hook: { type: 'promise', strength: 0.5, keywords: [] },
      promise: { primary: '', secondary: [], specificity: 0.5, believability: 0.5 },
      proof: { type: 'social', strength: 0.5, elements: [] },
      cta: { text: 'Learn More', urgency: 0.5, clarity: 0.7, type: 'soft' },
      visualStyle: { colorPalette: [], contrast: 0.5, complexity: 0.5, brandAlignment: 0.5 },
      emotionalTone: { primary: 'trust', intensity: 0.5, consistency: 0.5 },
    };
  }

  private selectRandomMutations(constraints?: MutationConstraints): MutationType[] {
    const allTypes: MutationType[] = [
      'hook_variation', 'cta_variation', 'color_shift',
      'copy_rewrite', 'layout_change', 'audience_adaptation',
    ];

    const available = allTypes.filter((t) => !constraints?.excludeMutations?.includes(t));
    const count = Math.min(constraints?.maxMutations ?? 2, available.length);

    const selected: MutationType[] = constraints?.mustIncludeMutations ?? [];
    while (selected.length < count) {
      const random = available[Math.floor(Math.random() * available.length)];
      if (!selected.includes(random)) {
        selected.push(random);
      }
    }

    return selected;
  }

  private shouldSkipMutation(type: MutationType, constraints?: MutationConstraints): boolean {
    if (constraints?.preserveHook && type === 'hook_variation') return true;
    if (constraints?.preserveCta && type === 'cta_variation') return true;
    if (constraints?.excludeMutations?.includes(type)) return true;
    return false;
  }

  private extractGeneForMutation(genome: CreativeGenome, type: MutationType): unknown {
    const geneMap: Record<MutationType, keyof CreativeGenome> = {
      hook_variation: 'hook',
      cta_variation: 'cta',
      color_shift: 'visualStyle',
      copy_rewrite: 'promise',
      layout_change: 'visualStyle',
      audience_adaptation: 'emotionalTone',
    };
    return genome[geneMap[type]];
  }

  private getMutatedGeneName(type: MutationType): string {
    const geneMap: Record<MutationType, string> = {
      hook_variation: 'hook',
      cta_variation: 'cta',
      color_shift: 'visualStyle',
      copy_rewrite: 'promise',
      layout_change: 'visualStyle',
      audience_adaptation: 'emotionalTone',
    };
    return geneMap[type];
  }

  private getMutationRationale(type: MutationType): string {
    const rationales: Record<MutationType, string> = {
      hook_variation: 'Test different attention-grabbing approaches',
      cta_variation: 'Optimize call-to-action effectiveness',
      color_shift: 'Test visual impact of different color schemes',
      copy_rewrite: 'Improve promise clarity and believability',
      layout_change: 'Optimize visual hierarchy and readability',
      audience_adaptation: 'Better align emotional appeal with audience',
    };
    return rationales[type];
  }

  private mergePromises(p1: PromiseGene, p2: PromiseGene): PromiseGene {
    return {
      primary: p1.specificity > p2.specificity ? p1.primary : p2.primary,
      secondary: [...new Set([...p1.secondary, ...p2.secondary])].slice(0, 3),
      specificity: Math.max(p1.specificity, p2.specificity),
      believability: (p1.believability + p2.believability) / 2,
    };
  }

  private blendVisualStyles(s1: VisualStyleGene, s2: VisualStyleGene): VisualStyleGene {
    return {
      colorPalette: s1.colorPalette, // Use first parent's colors
      contrast: (s1.contrast + s2.contrast) / 2,
      complexity: (s1.complexity + s2.complexity) / 2,
      brandAlignment: Math.max(s1.brandAlignment, s2.brandAlignment),
    };
  }

  private generateEmbedding(genome: CreativeGenome): number[] {
    const dimension = 384;
    const embedding = new Array(dimension).fill(0);

    // Simple embedding based on genome properties
    embedding[0] = genome.hook.strength;
    embedding[1] = genome.promise.specificity;
    embedding[2] = genome.proof.strength;
    embedding[3] = genome.cta.urgency;
    embedding[4] = genome.visualStyle.contrast;
    embedding[5] = genome.emotionalTone.intensity;

    const norm = Math.sqrt(embedding.reduce((a, b) => a + b * b, 0));
    return embedding.map((v) => v / (norm || 1));
  }

  private estimatePerformance(genome: CreativeGenome, mutations: AppliedMutation[]): number {
    let base = 0.02; // Base CTR

    // Adjust based on genome strength
    base += genome.hook.strength * 0.005;
    base += genome.cta.urgency * 0.003;
    base += genome.emotionalTone.intensity * 0.002;

    // Mutations typically improve performance
    base *= 1 + mutations.length * 0.05;

    return Math.min(0.1, base);
  }

  private estimateEvolutionOutcome(creative: Creative, mutations: PlannedMutation[]): number {
    const currentPerformance = creative.metrics?.ctr ?? 0.02;
    const improvement = mutations.length * 0.03;
    return currentPerformance * (1 + improvement);
  }

  private buildLineageTree(creative: Creative): LineageNode {
    return {
      id: creative.id,
      generation: creative.lineage?.generation ?? 0,
      performance: creative.metrics?.ctr ?? 0,
      children: [],
      mutations: creative.lineage?.mutations ?? [],
    };
  }

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  protected async onInitialize(): Promise<void> {
    this.logger.info('Mutation agent initializing');
  }

  protected async onShutdown(): Promise<void> {
    this.logger.info('Mutation agent shutting down');
    this.variantHistory.clear();
  }

  protected getSubscribedEvents(): EventType[] {
    return ['creative.fatigue_detected', 'creative.genome_extracted'];
  }

  protected async handleEvent(event: DomainEvent): Promise<void> {
    if (event.type === 'creative.fatigue_detected') {
      this.logger.info('Creative fatigue detected - mutation may be needed', {
        creativeId: event.aggregateId,
      });
    }
  }
}
