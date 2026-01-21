/**
 * AI Marketing Swarms
 * 15-Agent Hierarchical Mesh for Autonomous Media Buying
 *
 * @packageDocumentation
 */

// Type Definitions (export first to establish base types)
export * from './types';

// Core Infrastructure
export { EventBus, getEventBus, resetEventBus } from './core/event-bus';
export { StateManager, getStateManager, resetStateManager } from './core/state-manager';
export { logger, createLogger, createAgentLogger, createTaskLogger } from './core/logger';

// Swarm Coordinator (primary interface)
export {
  SwarmCoordinator,
  SwarmConfig,
  SwarmStatus,
  SwarmMetrics,
  getSwarmCoordinator,
  resetSwarmCoordinator,
} from './swarm';

// Base agent for extension
export { BaseAgent, createTask } from './agents/base-agent';

// Domain Services (namespaced to avoid conflicts)
export { CampaignService, getCampaignService } from './services/campaign-service';
export { CreativeService, getCreativeService } from './services/creative-service';
export { AttributionService, getAttributionService } from './services/attribution-service';
export { AnalyticsService, getAnalyticsService } from './services/analytics-service';

// Security utilities
export { validateCampaignInput, sanitizeHtml, sanitizeSqlIdentifier } from './security/input-validator';
export { SecretsManager, createSecretsManager, SecretNames } from './security/secrets-manager';
export { AuditLogger, getAuditLogger } from './security/audit-logger';

// Performance utilities
export { LRUCache, TieredCache } from './performance/cache';
export { ConnectionPool, Connection } from './performance/connection-pool';
export { AutoBatcher, ParallelBatchExecutor } from './performance/batch-processor';

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
