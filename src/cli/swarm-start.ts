#!/usr/bin/env node
/**
 * CLI: Start Marketing Swarm
 */

import { startMarketingSwarm } from '../index';
import { createLogger } from '../core/logger';

const logger = createLogger('cli');

async function main() {
  console.log('🚀 AI Marketing Swarms');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('15-Agent Hierarchical Mesh for Autonomous Media Buying\n');

  try {
    logger.info('Starting swarm...');

    const swarm = await startMarketingSwarm({
      logLevel: 'info',
      healthCheckInterval: 30000,
      autoRecovery: true,
    });

    const status = swarm.getStatus();

    console.log('✅ Swarm started successfully!\n');
    console.log('📊 Status:');
    console.log(`   Active Agents: ${status.activeAgents}/${status.totalAgents}`);
    console.log(`   Status: ${status.status}`);
    console.log('');
    console.log('🔧 Agents by Tier:');
    console.log('   Tier 1 (Coordination): orchestrator, memory, quality');
    console.log('   Tier 2 (Intelligence): simulation, historical-memory, risk-detection, attention-arbitrage');
    console.log('   Tier 3 (Creative): creative-genome, fatigue-forecaster, mutation');
    console.log('   Tier 4 (Attribution): counterfactual, causal-graph, incrementality');
    console.log('   Tier 5 (Operations): account-health, cross-platform');
    console.log('');
    console.log('Press Ctrl+C to stop the swarm.');

    // Handle shutdown
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Shutting down swarm...');
      await swarm.stop();
      console.log('✅ Swarm stopped gracefully.');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await swarm.stop();
      process.exit(0);
    });

    // Keep process running
    await new Promise(() => {});
  } catch (error) {
    logger.error('Failed to start swarm', error instanceof Error ? error : new Error(String(error)));
    console.error('❌ Failed to start swarm:', error);
    process.exit(1);
  }
}

main();
