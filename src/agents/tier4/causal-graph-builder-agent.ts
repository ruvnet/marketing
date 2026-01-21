/**
 * Causal Graph Builder Agent - Influence Mapping
 * Tier 4: Attribution
 *
 * Responsibilities:
 * - Build causal graphs of marketing influence
 * - Map attribution paths
 * - Identify confounding variables
 * - Calculate causal effects
 * - Cypher-like graph queries
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  AgentConfig,
  TaskContext,
  DomainEvent,
  EventType,
  Campaign,
  CausalGraph,
  CausalNode,
  CausalEdge,
  AttributionPath,
  Touchpoint,
} from '../../types/index.js';
import { BaseAgent, AgentDependencies } from '../base-agent.js';

// ============================================================================
// Types
// ============================================================================

export interface CausalGraphInput {
  action: 'build_graph' | 'query_path' | 'identify_confounders' | 'calculate_effect' | 'analyze_attribution';
  campaigns?: Campaign[];
  touchpoints?: Touchpoint[];
  query?: CausalQuery;
  nodeIds?: string[];
}

export interface CausalQuery {
  type: 'path' | 'influence' | 'descendants' | 'ancestors';
  sourceNode?: string;
  targetNode?: string;
  maxDepth?: number;
  minWeight?: number;
}

export interface CausalGraphOutput {
  action: string;
  result: {
    graph?: CausalGraph;
    paths?: CausalPath[];
    confounders?: ConfounderAnalysis;
    causalEffect?: CausalEffect;
    attribution?: AttributionResult;
  };
}

export interface CausalPath {
  id: string;
  nodes: string[];
  edges: CausalEdge[];
  totalWeight: number;
  confidence: number;
}

export interface ConfounderAnalysis {
  confounders: Confounder[];
  adjustmentSet: string[];
  recommendations: string[];
}

export interface Confounder {
  nodeId: string;
  type: string;
  affectedPaths: string[];
  strength: number;
  correction: string;
}

export interface CausalEffect {
  cause: string;
  effect: string;
  directEffect: number;
  indirectEffect: number;
  totalEffect: number;
  confidence: number;
  mediators: string[];
}

export interface AttributionResult {
  conversionId: string;
  paths: AttributionPath[];
  nodeContributions: Map<string, number>;
  insights: string[];
}

// ============================================================================
// Configuration
// ============================================================================

export const causalGraphBuilderConfig: AgentConfig = {
  id: 'causal-graph',
  tier: 4,
  name: 'Causal Graph Builder Agent',
  description: 'Build causal influence graphs for attribution',
  capabilities: [
    {
      id: 'causal_mapping',
      name: 'Causal Mapping',
      description: 'Build causal graphs from marketing data',
      inputTypes: ['campaigns', 'touchpoints'],
      outputTypes: ['causal_graph'],
    },
    {
      id: 'influence_graph',
      name: 'Influence Graph',
      description: 'Map influence relationships',
      inputTypes: ['campaigns'],
      outputTypes: ['influence_graph'],
    },
    {
      id: 'path_analysis',
      name: 'Path Analysis',
      description: 'Analyze causal paths to conversion',
      inputTypes: ['touchpoints', 'query'],
      outputTypes: ['causal_paths'],
    },
    {
      id: 'confounder_detection',
      name: 'Confounder Detection',
      description: 'Identify confounding variables',
      inputTypes: ['graph'],
      outputTypes: ['confounders'],
    },
  ],
  maxConcurrency: 4,
  timeoutMs: 30000,
  priority: 58,
  dependencies: ['historical-memory'],
};

// ============================================================================
// Graph Builder Engine
// ============================================================================

class GraphEngine {
  private nodes: Map<string, CausalNode>;
  private edges: Map<string, CausalEdge[]>;
  private adjacency: Map<string, string[]>;

  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
    this.adjacency = new Map();
  }

  /**
   * Add a node to the graph
   */
  addNode(node: CausalNode): void {
    this.nodes.set(node.id, node);
    if (!this.adjacency.has(node.id)) {
      this.adjacency.set(node.id, []);
    }
  }

  /**
   * Add an edge to the graph
   */
  addEdge(edge: CausalEdge): void {
    const sourceEdges = this.edges.get(edge.source) ?? [];
    sourceEdges.push(edge);
    this.edges.set(edge.source, sourceEdges);

    const adj = this.adjacency.get(edge.source) ?? [];
    if (!adj.includes(edge.target)) {
      adj.push(edge.target);
      this.adjacency.set(edge.source, adj);
    }
  }

  /**
   * Find paths between nodes using BFS
   */
  findPaths(source: string, target: string, maxDepth: number = 5): CausalPath[] {
    const paths: CausalPath[] = [];
    const queue: { node: string; path: string[]; edges: CausalEdge[]; depth: number }[] = [
      { node: source, path: [source], edges: [], depth: 0 },
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.node === target) {
        const totalWeight = current.edges.reduce((sum, e) => sum + e.weight, 0) / Math.max(current.edges.length, 1);
        paths.push({
          id: uuidv4(),
          nodes: current.path,
          edges: current.edges,
          totalWeight,
          confidence: Math.pow(0.9, current.edges.length),
        });
        continue;
      }

      if (current.depth >= maxDepth) continue;

      const neighbors = this.adjacency.get(current.node) ?? [];
      for (const neighbor of neighbors) {
        if (!current.path.includes(neighbor)) {
          const edgesToNeighbor = this.edges.get(current.node)?.filter((e) => e.target === neighbor) ?? [];
          if (edgesToNeighbor.length > 0) {
            queue.push({
              node: neighbor,
              path: [...current.path, neighbor],
              edges: [...current.edges, edgesToNeighbor[0]],
              depth: current.depth + 1,
            });
          }
        }
      }
    }

    return paths;
  }

  /**
   * Get ancestors of a node
   */
  getAncestors(nodeId: string, maxDepth: number = 3): string[] {
    const ancestors: Set<string> = new Set();
    const visited: Set<string> = new Set();

    const dfs = (current: string, depth: number) => {
      if (depth >= maxDepth || visited.has(current)) return;
      visited.add(current);

      for (const [source, targets] of this.adjacency) {
        if (targets.includes(current) && source !== nodeId) {
          ancestors.add(source);
          dfs(source, depth + 1);
        }
      }
    };

    dfs(nodeId, 0);
    return Array.from(ancestors);
  }

  /**
   * Get descendants of a node
   */
  getDescendants(nodeId: string, maxDepth: number = 3): string[] {
    const descendants: Set<string> = new Set();
    const visited: Set<string> = new Set();

    const dfs = (current: string, depth: number) => {
      if (depth >= maxDepth || visited.has(current)) return;
      visited.add(current);

      const neighbors = this.adjacency.get(current) ?? [];
      for (const neighbor of neighbors) {
        descendants.add(neighbor);
        dfs(neighbor, depth + 1);
      }
    };

    dfs(nodeId, 0);
    return Array.from(descendants);
  }

  /**
   * Get the full graph
   */
  getGraph(): CausalGraph {
    return {
      id: uuidv4(),
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()).flat(),
      computedAt: new Date(),
    };
  }

  /**
   * Clear the graph
   */
  clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.adjacency.clear();
  }
}

// ============================================================================
// Causal Graph Builder Agent Implementation
// ============================================================================

export class CausalGraphBuilderAgent extends BaseAgent<CausalGraphInput, CausalGraphOutput> {
  private graphEngine: GraphEngine;
  private graphCache: Map<string, CausalGraph>;

  constructor(deps?: AgentDependencies) {
    super(causalGraphBuilderConfig, deps);
    this.graphEngine = new GraphEngine();
    this.graphCache = new Map();
  }

  /**
   * Main processing logic
   */
  protected async process(
    input: CausalGraphInput,
    context: TaskContext
  ): Promise<CausalGraphOutput> {
    this.logger.info('Processing causal graph request', { action: input.action });

    switch (input.action) {
      case 'build_graph':
        return this.buildGraph(input, context);
      case 'query_path':
        return this.queryPath(input);
      case 'identify_confounders':
        return this.identifyConfounders(input);
      case 'calculate_effect':
        return this.calculateEffect(input);
      case 'analyze_attribution':
        return this.analyzeAttribution(input);
      default:
        throw new Error(`Unknown action: ${input.action}`);
    }
  }

  /**
   * Build causal graph from campaigns and touchpoints
   */
  private async buildGraph(
    input: CausalGraphInput,
    context: TaskContext
  ): Promise<CausalGraphOutput> {
    this.graphEngine.clear();

    const campaigns = input.campaigns ?? [];
    const touchpoints = input.touchpoints ?? [];

    // Add campaign nodes
    for (const campaign of campaigns) {
      this.graphEngine.addNode({
        id: campaign.id,
        type: 'campaign',
        label: campaign.name,
        metrics: {
          impressions: campaign.metrics.impressions,
          clicks: campaign.metrics.clicks,
          conversions: campaign.metrics.conversions,
          spend: campaign.metrics.spend,
        },
      });

      // Add channel node
      const channelId = `channel_${campaign.platform}`;
      this.graphEngine.addNode({
        id: channelId,
        type: 'channel',
        label: campaign.platform,
        metrics: {},
      });

      // Edge from channel to campaign
      this.graphEngine.addEdge({
        source: channelId,
        target: campaign.id,
        weight: 1,
        confidence: 0.9,
        type: 'direct',
      });
    }

    // Add touchpoint nodes and edges
    for (const touchpoint of touchpoints) {
      // Add touchpoint node
      this.graphEngine.addNode({
        id: touchpoint.id,
        type: 'campaign',
        label: `Touchpoint ${touchpoint.position}`,
        metrics: { position: touchpoint.position },
      });

      // Connect touchpoints in sequence
      if (touchpoint.position > 1) {
        const prevTouchpoint = touchpoints.find((t) => t.position === touchpoint.position - 1);
        if (prevTouchpoint) {
          this.graphEngine.addEdge({
            source: prevTouchpoint.id,
            target: touchpoint.id,
            weight: touchpoint.attributedValue,
            confidence: 0.8,
            type: 'direct',
          });
        }
      }
    }

    // Add conversion node
    if (touchpoints.length > 0) {
      const conversionNode: CausalNode = {
        id: 'conversion',
        type: 'conversion',
        label: 'Conversion',
        metrics: { count: 1 },
      };
      this.graphEngine.addNode(conversionNode);

      // Connect last touchpoint to conversion
      const lastTouchpoint = touchpoints[touchpoints.length - 1];
      if (lastTouchpoint) {
        this.graphEngine.addEdge({
          source: lastTouchpoint.id,
          target: 'conversion',
          weight: lastTouchpoint.attributedValue,
          confidence: 0.95,
          type: 'direct',
        });
      }
    }

    const graph = this.graphEngine.getGraph();

    // Cache the graph
    const cacheKey = context.campaignId ?? 'default';
    this.graphCache.set(cacheKey, graph);

    return {
      action: 'build_graph',
      result: { graph },
    };
  }

  /**
   * Query paths in the graph
   */
  private async queryPath(input: CausalGraphInput): Promise<CausalGraphOutput> {
    const { query } = input;

    if (!query) {
      throw new Error('Query is required for path operations');
    }

    let paths: CausalPath[] = [];

    switch (query.type) {
      case 'path':
        if (query.sourceNode && query.targetNode) {
          paths = this.graphEngine.findPaths(
            query.sourceNode,
            query.targetNode,
            query.maxDepth ?? 5
          );
        }
        break;

      case 'ancestors':
        if (query.sourceNode) {
          const ancestors = this.graphEngine.getAncestors(query.sourceNode, query.maxDepth ?? 3);
          paths = ancestors.map((a) => ({
            id: uuidv4(),
            nodes: [a, query.sourceNode!],
            edges: [],
            totalWeight: 1,
            confidence: 0.8,
          }));
        }
        break;

      case 'descendants':
        if (query.sourceNode) {
          const descendants = this.graphEngine.getDescendants(query.sourceNode, query.maxDepth ?? 3);
          paths = descendants.map((d) => ({
            id: uuidv4(),
            nodes: [query.sourceNode!, d],
            edges: [],
            totalWeight: 1,
            confidence: 0.8,
          }));
        }
        break;
    }

    // Filter by minimum weight if specified
    if (query.minWeight) {
      paths = paths.filter((p) => p.totalWeight >= query.minWeight!);
    }

    return {
      action: 'query_path',
      result: { paths },
    };
  }

  /**
   * Identify confounding variables
   */
  private async identifyConfounders(input: CausalGraphInput): Promise<CausalGraphOutput> {
    const graph = this.graphEngine.getGraph();
    const confounders: Confounder[] = [];

    // Look for common causes (potential confounders)
    for (const node of graph.nodes) {
      const descendants = this.graphEngine.getDescendants(node.id, 2);

      // If a node has multiple descendants, it might be a confounder
      if (descendants.length > 1) {
        // Check if descendants are connected (potential confounding)
        for (let i = 0; i < descendants.length; i++) {
          for (let j = i + 1; j < descendants.length; j++) {
            const paths = this.graphEngine.findPaths(descendants[i], descendants[j], 2);
            if (paths.length > 0) {
              confounders.push({
                nodeId: node.id,
                type: node.type,
                affectedPaths: paths.map((p) => p.id),
                strength: 0.7,
                correction: `Adjust for ${node.label} when analyzing ${descendants[i]} → ${descendants[j]}`,
              });
            }
          }
        }
      }
    }

    // Generate adjustment set
    const adjustmentSet = [...new Set(confounders.map((c) => c.nodeId))];

    const confounderAnalysis: ConfounderAnalysis = {
      confounders,
      adjustmentSet,
      recommendations: this.generateConfounderRecommendations(confounders),
    };

    return {
      action: 'identify_confounders',
      result: { confounders: confounderAnalysis },
    };
  }

  /**
   * Calculate causal effect between nodes
   */
  private async calculateEffect(input: CausalGraphInput): Promise<CausalGraphOutput> {
    const { nodeIds } = input;

    if (!nodeIds || nodeIds.length < 2) {
      throw new Error('At least two node IDs are required for effect calculation');
    }

    const cause = nodeIds[0];
    const effect = nodeIds[1];

    // Find direct path
    const directPaths = this.graphEngine.findPaths(cause, effect, 1);
    const directEffect = directPaths.length > 0 ? directPaths[0].totalWeight : 0;

    // Find all paths (for indirect effect)
    const allPaths = this.graphEngine.findPaths(cause, effect, 4);
    const indirectPaths = allPaths.filter((p) => p.nodes.length > 2);
    const indirectEffect = indirectPaths.reduce((sum, p) => sum + p.totalWeight, 0) / Math.max(indirectPaths.length, 1);

    // Find mediators
    const mediators = [...new Set(
      indirectPaths.flatMap((p) => p.nodes.slice(1, -1))
    )];

    const causalEffect: CausalEffect = {
      cause,
      effect,
      directEffect,
      indirectEffect,
      totalEffect: directEffect + indirectEffect,
      confidence: Math.max(...allPaths.map((p) => p.confidence), 0),
      mediators,
    };

    return {
      action: 'calculate_effect',
      result: { causalEffect },
    };
  }

  /**
   * Analyze attribution using the causal graph
   */
  private async analyzeAttribution(input: CausalGraphInput): Promise<CausalGraphOutput> {
    const { touchpoints } = input;

    if (!touchpoints || touchpoints.length === 0) {
      throw new Error('Touchpoints are required for attribution analysis');
    }

    // Build graph from touchpoints
    await this.buildGraph(input, { correlationId: uuidv4(), metadata: {} });

    // Find all paths to conversion
    const pathsToConversion: AttributionPath[] = [];
    const nodeContributions = new Map<string, number>();

    for (const touchpoint of touchpoints) {
      const paths = this.graphEngine.findPaths(touchpoint.id, 'conversion', 3);

      for (const path of paths) {
        // Calculate Shapley-like contribution
        const contribution = path.totalWeight / touchpoints.length;
        nodeContributions.set(
          touchpoint.id,
          (nodeContributions.get(touchpoint.id) ?? 0) + contribution
        );

        pathsToConversion.push({
          id: path.id,
          conversionId: 'conversion',
          touchpoints: touchpoints.filter((t) => path.nodes.includes(t.id)),
          totalValue: path.totalWeight,
          model: 'data_driven',
          computedAt: new Date(),
        });
      }
    }

    // Generate insights
    const insights = this.generateAttributionInsights(touchpoints, nodeContributions);

    const attribution: AttributionResult = {
      conversionId: 'conversion',
      paths: pathsToConversion,
      nodeContributions,
      insights,
    };

    return {
      action: 'analyze_attribution',
      result: { attribution },
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private generateConfounderRecommendations(confounders: Confounder[]): string[] {
    const recommendations: string[] = [];

    if (confounders.length === 0) {
      recommendations.push('No significant confounders detected');
    } else {
      recommendations.push(`Found ${confounders.length} potential confounders`);
      recommendations.push('Consider adjusting for common causes in analysis');

      const strongConfounders = confounders.filter((c) => c.strength > 0.6);
      if (strongConfounders.length > 0) {
        recommendations.push(
          `High priority adjustments: ${strongConfounders.map((c) => c.nodeId).join(', ')}`
        );
      }
    }

    return recommendations;
  }

  private generateAttributionInsights(
    touchpoints: Touchpoint[],
    contributions: Map<string, number>
  ): string[] {
    const insights: string[] = [];

    // Find highest contributor
    let maxContribution = 0;
    let topContributor = '';
    for (const [nodeId, contribution] of contributions) {
      if (contribution > maxContribution) {
        maxContribution = contribution;
        topContributor = nodeId;
      }
    }

    if (topContributor) {
      insights.push(`Top contributing touchpoint: ${topContributor}`);
    }

    // Analyze path length
    const avgPosition = touchpoints.reduce((sum, t) => sum + t.position, 0) / touchpoints.length;
    if (avgPosition > 3) {
      insights.push('Long conversion path - consider nurture campaigns');
    }

    // Check for first/last touch dominance
    const firstTouch = touchpoints.find((t) => t.position === 1);
    const lastTouch = touchpoints[touchpoints.length - 1];

    if (firstTouch && lastTouch) {
      const firstContrib = contributions.get(firstTouch.id) ?? 0;
      const lastContrib = contributions.get(lastTouch.id) ?? 0;

      if (firstContrib > lastContrib * 1.5) {
        insights.push('First touch has high influence - focus on awareness');
      } else if (lastContrib > firstContrib * 1.5) {
        insights.push('Last touch has high influence - focus on conversion');
      }
    }

    return insights;
  }

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  protected async onInitialize(): Promise<void> {
    this.logger.info('Causal graph builder agent initializing');
  }

  protected async onShutdown(): Promise<void> {
    this.logger.info('Causal graph builder agent shutting down');
    this.graphEngine.clear();
    this.graphCache.clear();
  }

  protected getSubscribedEvents(): EventType[] {
    return ['attribution.path_discovered'];
  }

  protected async handleEvent(event: DomainEvent): Promise<void> {
    this.logger.debug('Event received', { type: event.type });
  }
}
