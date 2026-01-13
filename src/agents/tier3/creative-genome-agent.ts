/**
 * Creative Genome Agent - Ad DNA Decomposition
 * Tier 3: Creative
 *
 * Responsibilities:
 * - Decompose creatives into genetic components (hook, promise, proof, CTA)
 * - Extract creative DNA for analysis
 * - Identify high-performing creative genes
 * - Build creative embeddings for similarity search
 * - Track creative lineage
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  AgentConfig,
  TaskContext,
  DomainEvent,
  EventType,
  Creative,
  CreativeGenome,
  HookGene,
  PromiseGene,
  ProofGene,
  CTAGene,
  VisualStyleGene,
  EmotionalToneGene,
} from '../../types/index.js';
import { BaseAgent, AgentDependencies } from '../base-agent.js';

// ============================================================================
// Types
// ============================================================================

export interface GenomeInput {
  action: 'extract' | 'analyze' | 'compare' | 'find_winners' | 'build_embedding';
  creative?: Creative;
  creatives?: Creative[];
  content?: {
    headline?: string;
    body?: string;
    cta?: string;
    imageUrl?: string;
    videoUrl?: string;
  };
  genomes?: CreativeGenome[];
}

export interface GenomeOutput {
  action: string;
  result: {
    genome?: CreativeGenome;
    analysis?: GenomeAnalysis;
    comparison?: GenomeComparison;
    winners?: WinningGenes;
    embedding?: number[];
  };
}

export interface GenomeAnalysis {
  creative: Creative;
  genome: CreativeGenome;
  scores: {
    hookStrength: number;
    promiseClarity: number;
    proofCredibility: number;
    ctaEffectiveness: number;
    visualImpact: number;
    emotionalResonance: number;
    overall: number;
  };
  recommendations: string[];
}

export interface GenomeComparison {
  creatives: string[];
  similarities: {
    hook: number;
    promise: number;
    proof: number;
    cta: number;
    visual: number;
    emotional: number;
    overall: number;
  };
  differentiators: string[];
  insights: string[];
}

export interface WinningGenes {
  topHooks: { gene: HookGene; performance: number }[];
  topPromises: { gene: PromiseGene; performance: number }[];
  topCtas: { gene: CTAGene; performance: number }[];
  topStyles: { gene: VisualStyleGene; performance: number }[];
  patterns: string[];
}

// ============================================================================
// Configuration
// ============================================================================

export const creativeGenomeConfig: AgentConfig = {
  id: 'creative-genome',
  tier: 3,
  name: 'Creative Genome Agent',
  description: 'Decompose creatives into genetic components for analysis',
  capabilities: [
    {
      id: 'genome_extraction',
      name: 'Genome Extraction',
      description: 'Extract creative DNA components',
      inputTypes: ['creative', 'content'],
      outputTypes: ['genome'],
    },
    {
      id: 'creative_analysis',
      name: 'Creative Analysis',
      description: 'Analyze creative effectiveness by component',
      inputTypes: ['creative', 'genome'],
      outputTypes: ['analysis'],
    },
    {
      id: 'genome_comparison',
      name: 'Genome Comparison',
      description: 'Compare creative genomes for similarity',
      inputTypes: ['creatives', 'genomes'],
      outputTypes: ['comparison'],
    },
    {
      id: 'dna_decomposition',
      name: 'DNA Decomposition',
      description: 'Break down creative into fundamental elements',
      inputTypes: ['creative'],
      outputTypes: ['genome', 'embedding'],
    },
  ],
  maxConcurrency: 6,
  timeoutMs: 20000,
  priority: 65,
  dependencies: ['memory'],
};

// ============================================================================
// Gene Extraction Utilities
// ============================================================================

const HOOK_PATTERNS = {
  question: /^(what|how|why|when|where|who|did you know|have you ever|are you)/i,
  statistic: /\d+%|\d+x|\d+ out of|\$\d+/,
  story: /^(i |we |my |our |one day|last |when i)/i,
  controversy: /(you're wrong|most people|the truth|secret|hidden|they don't want)/i,
  promise: /(get|achieve|unlock|discover|learn|master|become)/i,
  curiosity: /(this|these|here's|introducing|meet|finally)/i,
};

const EMOTIONAL_KEYWORDS = {
  fear: ['risk', 'danger', 'lose', 'miss', 'mistake', 'wrong', 'fail'],
  hope: ['dream', 'achieve', 'success', 'future', 'possibility', 'potential'],
  urgency: ['now', 'today', 'limited', 'last chance', 'hurry', 'fast', 'quick'],
  trust: ['proven', 'trusted', 'reliable', 'guarantee', 'secure', 'safe'],
  curiosity: ['discover', 'secret', 'hidden', 'reveal', 'unlock', 'find out'],
  aspiration: ['best', 'elite', 'premium', 'exclusive', 'ultimate', 'transform'],
};

// ============================================================================
// Creative Genome Agent Implementation
// ============================================================================

export class CreativeGenomeAgent extends BaseAgent<GenomeInput, GenomeOutput> {
  private genomeCache: Map<string, CreativeGenome>;
  private embeddingDimension: number = 384;

  constructor(deps?: AgentDependencies) {
    super(creativeGenomeConfig, deps);
    this.genomeCache = new Map();
  }

  /**
   * Main processing logic
   */
  protected async process(
    input: GenomeInput,
    context: TaskContext
  ): Promise<GenomeOutput> {
    this.logger.info('Processing creative genome request', { action: input.action });

    switch (input.action) {
      case 'extract':
        return this.extractGenome(input, context);
      case 'analyze':
        return this.analyzeGenome(input);
      case 'compare':
        return this.compareGenomes(input);
      case 'find_winners':
        return this.findWinningGenes(input);
      case 'build_embedding':
        return this.buildEmbedding(input);
      default:
        throw new Error(`Unknown action: ${input.action}`);
    }
  }

  /**
   * Extract genome from creative
   */
  private async extractGenome(
    input: GenomeInput,
    context: TaskContext
  ): Promise<GenomeOutput> {
    const creative = input.creative;
    const content = input.content;

    if (!creative && !content) {
      throw new Error('Creative or content is required for extraction');
    }

    // Extract text content
    const headline = content?.headline ?? creative?.name ?? '';
    const body = content?.body ?? '';
    const ctaText = content?.cta ?? 'Learn More';

    // Extract genes
    const hook = this.extractHookGene(headline, body);
    const promise = this.extractPromiseGene(headline, body);
    const proof = this.extractProofGene(body);
    const cta = this.extractCTAGene(ctaText);
    const visualStyle = this.extractVisualStyleGene(content);
    const emotionalTone = this.extractEmotionalToneGene(headline, body);

    // Build embedding
    const embedding = this.generateEmbedding({ hook, promise, proof, cta, visualStyle, emotionalTone });

    const genome: CreativeGenome = {
      hook,
      promise,
      proof,
      cta,
      visualStyle,
      emotionalTone,
      embedding,
    };

    // Cache the genome
    if (creative) {
      this.genomeCache.set(creative.id, genome);
    }

    // Emit event
    if (creative) {
      await this.emitEvent(
        'creative.genome_extracted',
        creative.id,
        'creative',
        { creativeId: creative.id, genome },
        context.correlationId
      );
    }

    return {
      action: 'extract',
      result: { genome },
    };
  }

  /**
   * Analyze creative genome
   */
  private async analyzeGenome(input: GenomeInput): Promise<GenomeOutput> {
    if (!input.creative) {
      throw new Error('Creative is required for analysis');
    }

    const creative = input.creative;
    let genome = creative.genome ?? this.genomeCache.get(creative.id);

    if (!genome) {
      const extracted = await this.extractGenome(
        { action: 'extract', creative },
        { correlationId: uuidv4(), metadata: {} }
      );
      genome = extracted.result.genome!;
    }

    // Calculate scores
    const scores = {
      hookStrength: genome.hook.strength,
      promiseClarity: genome.promise.specificity * genome.promise.believability,
      proofCredibility: genome.proof.strength,
      ctaEffectiveness: genome.cta.clarity * (genome.cta.urgency * 0.5 + 0.5),
      visualImpact: genome.visualStyle.contrast * genome.visualStyle.brandAlignment,
      emotionalResonance: genome.emotionalTone.intensity * genome.emotionalTone.consistency,
      overall: 0,
    };

    scores.overall = (
      scores.hookStrength * 0.2 +
      scores.promiseClarity * 0.2 +
      scores.proofCredibility * 0.15 +
      scores.ctaEffectiveness * 0.2 +
      scores.visualImpact * 0.1 +
      scores.emotionalResonance * 0.15
    );

    const recommendations = this.generateRecommendations(genome, scores);

    const analysis: GenomeAnalysis = {
      creative,
      genome,
      scores,
      recommendations,
    };

    return {
      action: 'analyze',
      result: { analysis },
    };
  }

  /**
   * Compare multiple genomes
   */
  private async compareGenomes(input: GenomeInput): Promise<GenomeOutput> {
    const creatives = input.creatives ?? [];
    const genomes = input.genomes ?? [];

    if (creatives.length < 2 && genomes.length < 2) {
      throw new Error('At least 2 creatives or genomes are required for comparison');
    }

    // Get genomes for creatives if not provided
    const genomesToCompare: CreativeGenome[] = [...genomes];
    for (const creative of creatives) {
      const genome = creative.genome ?? this.genomeCache.get(creative.id);
      if (genome) {
        genomesToCompare.push(genome);
      }
    }

    if (genomesToCompare.length < 2) {
      throw new Error('Could not extract genomes for comparison');
    }

    // Calculate similarities between all pairs
    const similarities = this.calculateSimilarities(genomesToCompare[0], genomesToCompare[1]);

    // Find differentiators
    const differentiators = this.findDifferentiators(genomesToCompare[0], genomesToCompare[1]);

    // Generate insights
    const insights = this.generateComparisonInsights(similarities, differentiators);

    const comparison: GenomeComparison = {
      creatives: creatives.map((c) => c.id),
      similarities,
      differentiators,
      insights,
    };

    return {
      action: 'compare',
      result: { comparison },
    };
  }

  /**
   * Find winning genes across creatives
   */
  private async findWinningGenes(input: GenomeInput): Promise<GenomeOutput> {
    const creatives = input.creatives ?? [];

    if (creatives.length === 0) {
      throw new Error('Creatives are required to find winning genes');
    }

    // Sort by performance
    const sorted = [...creatives].sort(
      (a, b) => (b.metrics?.ctr ?? 0) - (a.metrics?.ctr ?? 0)
    );

    const topCreatives = sorted.slice(0, Math.min(5, sorted.length));
    const topHooks: { gene: HookGene; performance: number }[] = [];
    const topPromises: { gene: PromiseGene; performance: number }[] = [];
    const topCtas: { gene: CTAGene; performance: number }[] = [];
    const topStyles: { gene: VisualStyleGene; performance: number }[] = [];

    for (const creative of topCreatives) {
      const genome = creative.genome ?? this.genomeCache.get(creative.id);
      if (!genome) continue;

      const performance = creative.metrics?.ctr ?? 0;

      topHooks.push({ gene: genome.hook, performance });
      topPromises.push({ gene: genome.promise, performance });
      topCtas.push({ gene: genome.cta, performance });
      topStyles.push({ gene: genome.visualStyle, performance });
    }

    // Identify patterns
    const patterns = this.identifyPatterns(topCreatives);

    const winners: WinningGenes = {
      topHooks: topHooks.sort((a, b) => b.performance - a.performance).slice(0, 3),
      topPromises: topPromises.sort((a, b) => b.performance - a.performance).slice(0, 3),
      topCtas: topCtas.sort((a, b) => b.performance - a.performance).slice(0, 3),
      topStyles: topStyles.sort((a, b) => b.performance - a.performance).slice(0, 3),
      patterns,
    };

    return {
      action: 'find_winners',
      result: { winners },
    };
  }

  /**
   * Build embedding for creative
   */
  private async buildEmbedding(input: GenomeInput): Promise<GenomeOutput> {
    if (!input.creative && !input.content) {
      throw new Error('Creative or content is required for embedding');
    }

    // First extract genome
    const genomeResult = await this.extractGenome(input, { correlationId: uuidv4(), metadata: {} });
    const genome = genomeResult.result.genome!;

    return {
      action: 'build_embedding',
      result: {
        genome,
        embedding: genome.embedding,
      },
    };
  }

  // ============================================================================
  // Gene Extraction Methods
  // ============================================================================

  private extractHookGene(headline: string, body: string): HookGene {
    const text = `${headline} ${body}`.toLowerCase();
    let type: HookGene['type'] = 'promise';
    let strength = 0.5;

    for (const [hookType, pattern] of Object.entries(HOOK_PATTERNS)) {
      if (pattern.test(text)) {
        type = hookType as HookGene['type'];
        strength = 0.7 + Math.random() * 0.3;
        break;
      }
    }

    const keywords = text.split(/\s+/).filter((w) => w.length > 4).slice(0, 5);

    return { type, strength, keywords };
  }

  private extractPromiseGene(headline: string, body: string): PromiseGene {
    const text = `${headline} ${body}`;

    // Extract primary promise (first strong claim)
    const primary = headline || text.split('.')[0] || 'Improve your results';

    // Extract secondary promises
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);
    const secondary = sentences.slice(1, 4).map((s) => s.trim());

    // Score specificity (numbers and specifics increase it)
    const specificity = (text.match(/\d+/g)?.length ?? 0) * 0.2 + 0.3;

    // Score believability (proof words increase it)
    const proofWords = ['proven', 'research', 'study', 'data', 'results'];
    const believability = proofWords.some((w) => text.toLowerCase().includes(w)) ? 0.8 : 0.5;

    return {
      primary,
      secondary,
      specificity: Math.min(1, specificity),
      believability: Math.min(1, believability),
    };
  }

  private extractProofGene(body: string): ProofGene {
    const text = body.toLowerCase();

    let type: ProofGene['type'] = 'demonstration';
    const elements: string[] = [];

    if (text.includes('customer') || text.includes('review') || text.includes('said')) {
      type = 'testimonial';
    } else if (text.includes('study') || text.includes('research') || text.includes('%')) {
      type = 'data';
    } else if (text.includes('expert') || text.includes('award') || text.includes('certified')) {
      type = 'authority';
    } else if (text.includes('join') || text.includes('thousands') || text.includes('popular')) {
      type = 'social';
    }

    // Extract proof elements
    const sentences = body.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (sentence.match(/\d+|proven|research|customer|award/i)) {
        elements.push(sentence.trim());
      }
    }

    const strength = Math.min(1, 0.3 + elements.length * 0.2);

    return { type, strength, elements: elements.slice(0, 3) };
  }

  private extractCTAGene(ctaText: string): CTAGene {
    const text = ctaText.toLowerCase();

    let type: CTAGene['type'] = 'direct';
    if (text.includes('learn') || text.includes('discover') || text.includes('explore')) {
      type = 'soft';
    } else if (text.includes('get') || text.includes('start') || text.includes('claim')) {
      type = 'assumptive';
    }

    const urgencyWords = ['now', 'today', 'limited', 'hurry', 'fast'];
    const urgency = urgencyWords.some((w) => text.includes(w)) ? 0.9 : 0.5;

    const clarity = ctaText.split(' ').length <= 4 ? 0.9 : 0.6;

    return { text: ctaText, urgency, clarity, type };
  }

  private extractVisualStyleGene(content?: GenomeInput['content']): VisualStyleGene {
    // Mock extraction - in real implementation, would analyze image/video
    return {
      colorPalette: ['#1a73e8', '#34a853', '#ffffff'],
      contrast: 0.7 + Math.random() * 0.3,
      complexity: 0.3 + Math.random() * 0.4,
      brandAlignment: 0.6 + Math.random() * 0.4,
    };
  }

  private extractEmotionalToneGene(headline: string, body: string): EmotionalToneGene {
    const text = `${headline} ${body}`.toLowerCase();

    let primary: EmotionalToneGene['primary'] = 'trust';
    let maxCount = 0;

    for (const [emotion, keywords] of Object.entries(EMOTIONAL_KEYWORDS)) {
      const count = keywords.filter((k) => text.includes(k)).length;
      if (count > maxCount) {
        maxCount = count;
        primary = emotion as EmotionalToneGene['primary'];
      }
    }

    const intensity = Math.min(1, 0.3 + maxCount * 0.15);
    const consistency = 0.6 + Math.random() * 0.3; // Would compare across creative elements

    return { primary, intensity, consistency };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private generateEmbedding(genome: Omit<CreativeGenome, 'embedding'>): number[] {
    // Create embedding from genome components
    const embedding = new Array(this.embeddingDimension).fill(0);

    // Encode hook type
    const hookTypes = ['question', 'statistic', 'story', 'controversy', 'promise', 'curiosity'];
    const hookIndex = hookTypes.indexOf(genome.hook.type);
    embedding[hookIndex] = genome.hook.strength;

    // Encode promise
    embedding[10] = genome.promise.specificity;
    embedding[11] = genome.promise.believability;

    // Encode proof
    const proofTypes = ['social', 'authority', 'demonstration', 'testimonial', 'data'];
    const proofIndex = proofTypes.indexOf(genome.proof.type);
    embedding[20 + proofIndex] = genome.proof.strength;

    // Encode CTA
    embedding[30] = genome.cta.urgency;
    embedding[31] = genome.cta.clarity;

    // Encode emotional tone
    const emotions = ['fear', 'hope', 'urgency', 'trust', 'curiosity', 'aspiration'];
    const emotionIndex = emotions.indexOf(genome.emotionalTone.primary);
    embedding[40 + emotionIndex] = genome.emotionalTone.intensity;

    // Normalize
    const norm = Math.sqrt(embedding.reduce((a, b) => a + b * b, 0));
    return embedding.map((v) => v / (norm || 1));
  }

  private calculateSimilarities(
    g1: CreativeGenome,
    g2: CreativeGenome
  ): GenomeComparison['similarities'] {
    return {
      hook: g1.hook.type === g2.hook.type ? 0.8 : 0.3,
      promise: Math.abs(g1.promise.specificity - g2.promise.specificity) < 0.3 ? 0.7 : 0.3,
      proof: g1.proof.type === g2.proof.type ? 0.8 : 0.3,
      cta: g1.cta.type === g2.cta.type ? 0.8 : 0.4,
      visual: 1 - Math.abs(g1.visualStyle.contrast - g2.visualStyle.contrast),
      emotional: g1.emotionalTone.primary === g2.emotionalTone.primary ? 0.9 : 0.3,
      overall: 0,
    };
  }

  private findDifferentiators(g1: CreativeGenome, g2: CreativeGenome): string[] {
    const diffs: string[] = [];

    if (g1.hook.type !== g2.hook.type) {
      diffs.push(`Hook type: ${g1.hook.type} vs ${g2.hook.type}`);
    }
    if (g1.emotionalTone.primary !== g2.emotionalTone.primary) {
      diffs.push(`Emotion: ${g1.emotionalTone.primary} vs ${g2.emotionalTone.primary}`);
    }
    if (Math.abs(g1.cta.urgency - g2.cta.urgency) > 0.3) {
      diffs.push(`CTA urgency: ${g1.cta.urgency.toFixed(1)} vs ${g2.cta.urgency.toFixed(1)}`);
    }

    return diffs;
  }

  private generateComparisonInsights(
    similarities: GenomeComparison['similarities'],
    differentiators: string[]
  ): string[] {
    const insights: string[] = [];

    if (similarities.overall > 0.7) {
      insights.push('Creatives are highly similar - consider diversifying');
    }
    if (similarities.emotional > 0.8) {
      insights.push('Same emotional appeal - test different emotions');
    }
    if (differentiators.length > 3) {
      insights.push('Significant differences found - good for A/B testing');
    }

    return insights;
  }

  private identifyPatterns(creatives: Creative[]): string[] {
    const patterns: string[] = [];

    // Count hook types
    const hookCounts = new Map<string, number>();
    for (const creative of creatives) {
      const genome = creative.genome ?? this.genomeCache.get(creative.id);
      if (genome) {
        hookCounts.set(genome.hook.type, (hookCounts.get(genome.hook.type) ?? 0) + 1);
      }
    }

    const topHook = [...hookCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topHook && topHook[1] >= 2) {
      patterns.push(`${topHook[0]} hooks perform well`);
    }

    return patterns;
  }

  private generateRecommendations(genome: CreativeGenome, scores: GenomeAnalysis['scores']): string[] {
    const recommendations: string[] = [];

    if (scores.hookStrength < 0.6) {
      recommendations.push('Strengthen hook with question or statistic');
    }
    if (scores.promiseClarity < 0.5) {
      recommendations.push('Make promise more specific with numbers');
    }
    if (scores.proofCredibility < 0.5) {
      recommendations.push('Add social proof or testimonials');
    }
    if (scores.ctaEffectiveness < 0.6) {
      recommendations.push('Add urgency to CTA');
    }

    return recommendations;
  }

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  protected async onInitialize(): Promise<void> {
    this.logger.info('Creative genome agent initializing');
  }

  protected async onShutdown(): Promise<void> {
    this.logger.info('Creative genome agent shutting down');
    this.genomeCache.clear();
  }

  protected getSubscribedEvents(): EventType[] {
    return ['creative.created'];
  }

  protected async handleEvent(event: DomainEvent): Promise<void> {
    if (event.type === 'creative.created') {
      // Could auto-extract genome for new creatives
      this.logger.debug('New creative created', { creativeId: event.aggregateId });
    }
  }
}
