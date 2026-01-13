/**
 * Agent Exports
 * Central export for all 15 agents in the marketing swarm
 */

// Base Agent
export { BaseAgent } from './base-agent';

// Tier 1: Core Coordination
export { OrchestratorAgent } from './tier1/orchestrator-agent';
export { MemoryAgent } from './tier1/memory-agent';
export { QualityAgent } from './tier1/quality-agent';

// Tier 2: Intelligence Layer
export { SimulationAgent } from './tier2/simulation-agent';
export { HistoricalMemoryAgent } from './tier2/historical-memory-agent';
export { RiskDetectionAgent } from './tier2/risk-detection-agent';
export { AttentionArbitrageAgent } from './tier2/attention-arbitrage-agent';

// Tier 3: Creative Intelligence
export { CreativeGenomeAgent } from './tier3/creative-genome-agent';
export { FatigueForecasterAgent } from './tier3/fatigue-forecaster-agent';
export { MutationAgent } from './tier3/mutation-agent';

// Tier 4: Attribution & Causality
export { CounterfactualAgent } from './tier4/counterfactual-agent';
export { CausalGraphBuilderAgent } from './tier4/causal-graph-builder-agent';
export { IncrementalityAuditorAgent } from './tier4/incrementality-auditor-agent';

// Tier 5: Operations
export { AccountHealthAgent } from './tier5/account-health-agent';
export { CrossPlatformAgent } from './tier5/cross-platform-agent';

// Agent type for type-safe agent references
export type AgentClass =
  | typeof import('./tier1/orchestrator-agent').OrchestratorAgent
  | typeof import('./tier1/memory-agent').MemoryAgent
  | typeof import('./tier1/quality-agent').QualityAgent
  | typeof import('./tier2/simulation-agent').SimulationAgent
  | typeof import('./tier2/historical-memory-agent').HistoricalMemoryAgent
  | typeof import('./tier2/risk-detection-agent').RiskDetectionAgent
  | typeof import('./tier2/attention-arbitrage-agent').AttentionArbitrageAgent
  | typeof import('./tier3/creative-genome-agent').CreativeGenomeAgent
  | typeof import('./tier3/fatigue-forecaster-agent').FatigueForecasterAgent
  | typeof import('./tier3/mutation-agent').MutationAgent
  | typeof import('./tier4/counterfactual-agent').CounterfactualAgent
  | typeof import('./tier4/causal-graph-builder-agent').CausalGraphBuilderAgent
  | typeof import('./tier4/incrementality-auditor-agent').IncrementalityAuditorAgent
  | typeof import('./tier5/account-health-agent').AccountHealthAgent
  | typeof import('./tier5/cross-platform-agent').CrossPlatformAgent;
