/**
 * AI Marketing Swarms
 * 15-Agent Hierarchical Mesh for Autonomous Media Buying
 *
 * @packageDocumentation
 */

// Core Infrastructure
export * from './core';

// Type Definitions
export * from './types';

// All 15 Agents
export * from './agents';

// Swarm Coordinator
export * from './swarm';

// Domain Services
export * from './services';

// GCP Integrations
export * from './integrations';

// Security utilities
export * from './security';

// Performance utilities
export * from './performance';

// Convenience function to start the swarm
export async function startMarketingSwarm(
  config?: import('./swarm').SwarmConfig
): Promise<import('./swarm').SwarmCoordinator> {
  const { getSwarmCoordinator } = await import('./swarm');
  const swarm = getSwarmCoordinator(config);
  await swarm.start();
  return swarm;
}

// Version info
export const VERSION = '1.0.0';
export const AGENT_COUNT = 15;
export const TIER_COUNT = 5;
