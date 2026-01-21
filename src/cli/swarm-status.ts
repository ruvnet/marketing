#!/usr/bin/env node
/**
 * CLI: Get Swarm Status
 */

import { getSwarmCoordinator } from '../swarm';

async function main() {
  console.log('📊 AI Marketing Swarms - Status\n');

  const swarm = getSwarmCoordinator();
  const status = swarm.getStatus();
  const metrics = swarm.getMetrics();

  console.log('🔍 Swarm Status');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   Status: ${status.status}`);
  console.log(`   Active Agents: ${status.activeAgents}/${status.totalAgents}`);
  console.log(`   Uptime: ${Math.floor(status.uptime / 1000)}s`);
  console.log(`   Tasks Processed: ${status.tasksProcessed}`);
  console.log('');

  console.log('📈 Metrics');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   Total Tasks Submitted: ${metrics.totalTasksSubmitted}`);
  console.log(`   Total Tasks Completed: ${metrics.totalTasksCompleted}`);
  console.log(`   Total Tasks Failed: ${metrics.totalTasksFailed}`);
  console.log(`   Error Rate: ${(metrics.errorRate * 100).toFixed(2)}%`);
  console.log(`   Avg Task Duration: ${metrics.averageTaskDuration.toFixed(2)}ms`);
  console.log('');

  console.log('🤖 Agent Status');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const tiers: Record<number, string[]> = {
    1: ['orchestrator', 'memory', 'quality'],
    2: ['simulation', 'historical-memory', 'risk-detection', 'attention-arbitrage'],
    3: ['creative-genome', 'fatigue-forecaster', 'mutation'],
    4: ['counterfactual', 'causal-graph', 'incrementality'],
    5: ['account-health', 'cross-platform'],
  };

  for (const [tier, agents] of Object.entries(tiers)) {
    console.log(`\n   Tier ${tier}:`);
    for (const agentId of agents) {
      const agentStatus = status.agentStatuses.get(agentId as any);
      if (agentStatus) {
        const statusIcon = agentStatus.status === 'running' ? '✅' : '❌';
        console.log(`   ${statusIcon} ${agentId}: ${agentStatus.status} (tasks: ${agentStatus.tasksProcessed}, queue: ${agentStatus.queueLength})`);
      } else {
        console.log(`   ⚪ ${agentId}: not initialized`);
      }
    }
  }

  console.log('');
}

main().catch(console.error);
