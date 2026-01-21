# Tutorial 1: Your First Campaign

**Time:** 15 minutes
**Difficulty:** Beginner

Learn how to submit a campaign to the AI Marketing Swarm and watch it optimize in real-time.

---

## Goal

By the end of this tutorial, you will:
- Submit a campaign to the swarm
- Monitor optimization progress
- View recommendations from the agents

---

## Prerequisites

- Completed [Getting Started](../getting-started.md)
- Swarm is running (`npx @claude-flow/cli@latest swarm status` shows active)

---

## Step 1: Create a Campaign Object

First, let's define our campaign:

```typescript
// campaign.ts
import { Campaign, Platform } from '@marketing/ai-swarms';

const campaign: Campaign = {
  id: 'summer-promo-001',
  name: 'Summer Promotion 2024',
  platform: 'google-ads',
  status: 'active',
  budget: {
    daily: 500,
    total: 15000,
  },
  targeting: {
    geoTargets: ['US', 'CA', 'UK'],
    ageRange: { min: 25, max: 54 },
    interests: ['outdoor', 'fitness', 'travel'],
  },
  bidStrategy: 'maximize_conversions',
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

---

## Step 2: Submit for Optimization

Now submit the campaign to the swarm:

```typescript
import { startMarketingSwarm } from '@marketing/ai-swarms';

async function optimizeCampaign() {
  // Start the swarm
  const swarm = await startMarketingSwarm();

  // Submit the campaign
  await swarm.submitCampaign(campaign);

  console.log('Campaign submitted for optimization!');

  // Submit an optimization task
  const task = await swarm.submitTask('campaign_optimization', {
    campaign,
    goals: {
      primaryMetric: 'conversions',
      targetCpa: 25.00,
    },
  });

  console.log(`Task ID: ${task.id}`);
  console.log(`Status: ${task.status}`);

  return task;
}

optimizeCampaign();
```

---

## Step 3: Monitor Progress

Watch the agents work:

```typescript
async function monitorProgress(swarm, taskId: string) {
  // Check status every 5 seconds
  const interval = setInterval(async () => {
    const status = swarm.getStatus();
    const metrics = swarm.getMetrics();

    console.log('\n--- Swarm Status ---');
    console.log(`Active Agents: ${status.activeAgents}`);
    console.log(`Tasks Completed: ${metrics.totalTasksCompleted}`);
    console.log(`Avg Duration: ${metrics.averageTaskDuration.toFixed(0)}ms`);

  }, 5000);

  // Stop monitoring after 1 minute
  setTimeout(() => {
    clearInterval(interval);
    console.log('\nMonitoring complete!');
  }, 60000);
}
```

---

## Step 4: View Recommendations

The agents will generate recommendations. Here's how to access them:

```typescript
// Listen for optimization events
swarm.on('task:completed', (event) => {
  if (event.payload?.recommendations) {
    console.log('\n--- Agent Recommendations ---');
    for (const rec of event.payload.recommendations) {
      console.log(`• ${rec.type}: ${rec.description}`);
      console.log(`  Expected Impact: ${rec.expectedImpact}`);
      console.log(`  Confidence: ${(rec.confidence * 100).toFixed(0)}%`);
    }
  }
});
```

Example output:

```
--- Agent Recommendations ---
• bid_adjustment: Increase max CPC for "outdoor gear" keywords by 15%
  Expected Impact: +12% conversions
  Confidence: 78%

• audience_expansion: Add lookalike audience based on converters
  Expected Impact: +8% reach at similar CPA
  Confidence: 85%

• schedule_optimization: Shift 20% budget to 6-9 PM slots
  Expected Impact: -5% CPA
  Confidence: 72%
```

---

## Complete Example

Here's the full working code:

```typescript
// first-campaign.ts
import { startMarketingSwarm, Campaign } from '@marketing/ai-swarms';

async function main() {
  // 1. Define the campaign
  const campaign: Campaign = {
    id: 'summer-promo-001',
    name: 'Summer Promotion 2024',
    platform: 'google-ads',
    status: 'active',
    budget: { daily: 500, total: 15000 },
    targeting: {
      geoTargets: ['US'],
      ageRange: { min: 25, max: 54 },
    },
    bidStrategy: 'maximize_conversions',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // 2. Start the swarm
  console.log('Starting AI Marketing Swarm...');
  const swarm = await startMarketingSwarm();
  console.log(`✓ Swarm started with ${swarm.getStatus().activeAgents} agents`);

  // 3. Submit the campaign
  console.log('\nSubmitting campaign...');
  await swarm.submitCampaign(campaign);
  console.log('✓ Campaign submitted');

  // 4. Request optimization
  console.log('\nRequesting optimization...');
  const task = await swarm.submitTask('campaign_optimization', {
    campaign,
    goals: { primaryMetric: 'conversions', targetCpa: 25.00 },
  });
  console.log(`✓ Task created: ${task.id}`);

  // 5. Wait and check results
  console.log('\nWaiting for agents to analyze...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  const metrics = swarm.getMetrics();
  console.log(`\n--- Results ---`);
  console.log(`Tasks Completed: ${metrics.totalTasksCompleted}`);
  console.log(`Success Rate: ${((1 - metrics.errorRate) * 100).toFixed(1)}%`);

  // 6. Cleanup
  await swarm.stop();
  console.log('\n✓ Done!');
}

main().catch(console.error);
```

Run it:

```bash
npx tsx first-campaign.ts
```

---

## What Happened Behind the Scenes?

When you submitted the campaign, here's what the agents did:

1. **Orchestrator** received the task and routed it to relevant specialists
2. **Memory** retrieved similar past campaigns for context
3. **Simulation** ran 1000+ Monte Carlo scenarios
4. **Historical Memory** found patterns from winning campaigns
5. **Risk Detection** checked for potential issues
6. **Quality** validated all recommendations before output

All in milliseconds!

---

## Verification

Your optimization worked if you see:
- ✓ "Campaign submitted" message
- ✓ Task ID generated
- ✓ `Tasks Completed: 1` or more in results

---

## Next Steps

- [Tutorial 2: Creative Testing](./02-creative-testing.md) - Test ad creatives
- [Agent Reference](../agents/README.md) - Learn about each agent
- [API Reference](../api/README.md) - Explore all methods
