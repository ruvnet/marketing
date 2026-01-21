# Tutorials

Learn AI Marketing Swarms through hands-on tutorials.

## Beginner Tutorials

| # | Tutorial | Time | What You'll Learn |
|---|----------|------|-------------------|
| 1 | [Your First Campaign](./01-first-campaign.md) | 15 min | Submit and optimize a campaign |
| 2 | [Creative Testing](./02-creative-testing.md) | 20 min | A/B test creatives with the Creative Genome agent |
| 3 | [Understanding Attribution](./03-attribution.md) | 25 min | Set up multi-touch attribution |

## Intermediate Tutorials

| # | Tutorial | Time | What You'll Learn |
|---|----------|------|-------------------|
| 4 | [Cross-Platform Sync](./04-cross-platform.md) | 30 min | Unify campaigns across Google, Meta, TikTok |
| 5 | [Custom Agents](./05-custom-agents.md) | 45 min | Build your own specialized agent |
| 6 | [Advanced Bidding](./06-advanced-bidding.md) | 30 min | Use the Simulation agent for bid optimization |

## Advanced Tutorials

| # | Tutorial | Time | What You'll Learn |
|---|----------|------|-------------------|
| 7 | [Incrementality Testing](./07-incrementality.md) | 45 min | Measure true campaign lift |
| 8 | [Causal Analysis](./08-causal-analysis.md) | 60 min | Build causal graphs for deep attribution |
| 9 | [Fraud Detection](./09-fraud-detection.md) | 30 min | Configure the Risk Detection agent |
| 10 | [Production Deployment](./10-production.md) | 60 min | Deploy to GCP with full observability |

---

## Tutorial Format

Each tutorial follows this structure:

1. **Goal** - What you'll achieve
2. **Prerequisites** - What you need before starting
3. **Steps** - Hands-on instructions
4. **Code** - Working examples you can copy
5. **Verification** - How to confirm it worked
6. **Next Steps** - Where to go from here

---

## Quick Example

Here's a taste of what you'll learn. This snippet shows how to submit a campaign for optimization:

```typescript
import { startMarketingSwarm } from '@marketing/ai-swarms';

// Start the swarm
const swarm = await startMarketingSwarm();

// Submit a campaign
const task = await swarm.submitTask('campaign_optimization', {
  campaignId: 'summer-sale-2024',
  platform: 'google-ads',
  budget: 5000,
  objective: 'conversions',
  constraints: {
    maxCpc: 2.50,
    targetRoas: 4.0,
  },
});

console.log(`Optimization started: ${task.id}`);
```

---

## Need Help?

- Check the [API Reference](../api/README.md) for detailed method documentation
- Read the [Agent Reference](../agents/README.md) to understand each agent
- Visit [GitHub Discussions](https://github.com/ruvnet/marketing/discussions) for community help
