# Getting Started

This guide will help you set up and run AI Marketing Swarms in under 10 minutes.

## Prerequisites

Before you begin, make sure you have:

- **Node.js 20+** - [Download here](https://nodejs.org/)
- **npm 9+** - Comes with Node.js
- **Git** - [Download here](https://git-scm.com/)

Check your versions:

```bash
node --version  # Should be v20.0.0 or higher
npm --version   # Should be 9.0.0 or higher
```

## Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/ruvnet/marketing.git
cd marketing

# Install dependencies
npm install
```

This installs all required packages including:
- `eventemitter3` - Event-driven communication
- `pino` - High-performance logging
- `zod` - Input validation
- `p-queue` - Task queue management

## Step 2: Initialize Claude-Flow

Claude-Flow is the coordination layer that manages the 15-agent swarm.

```bash
# Initialize with default settings
npx @claude-flow/cli@latest init --force
```

This creates:
- `.claude/` - Agent definitions and skills
- `.claude-flow/` - Runtime configuration
- `CLAUDE.md` - Claude Code integration

## Step 3: Start the Swarm

```bash
# Initialize the swarm with hierarchical topology
npx @claude-flow/cli@latest swarm init --topology hierarchical --max-agents 15

# Start the daemon (background workers)
npx @claude-flow/cli@latest daemon start
```

## Step 4: Verify Everything Works

```bash
# Check swarm status
npx @claude-flow/cli@latest swarm status
```

You should see:

```
Swarm Status: swarm-XXXXX

Agents
+-----------+-------+
| Status    | Count |
+-----------+-------+
| Active    |    15 |
| Total     |    15 |
+-----------+-------+
```

## Step 5: Run Your First Task

Create a simple test file:

```typescript
// test-swarm.ts
import { startMarketingSwarm } from './src';

async function main() {
  console.log('Starting swarm...');

  const swarm = await startMarketingSwarm();

  console.log('Swarm started!');
  console.log(`Active agents: ${swarm.getStatus().activeAgents}`);

  // Submit a test task
  const task = await swarm.submitTask('campaign_optimization', {
    campaignId: 'test-campaign-001',
    platform: 'google-ads',
    budget: 1000,
  });

  console.log(`Task submitted: ${task.id}`);

  // Wait a bit then check status
  await new Promise(resolve => setTimeout(resolve, 2000));

  const metrics = swarm.getMetrics();
  console.log(`Tasks completed: ${metrics.totalTasksCompleted}`);

  await swarm.stop();
}

main().catch(console.error);
```

Run it:

```bash
npx tsx test-swarm.ts
```

## What's Next?

Now that your swarm is running, you can:

1. **[Submit Campaigns](./tutorials/01-first-campaign.md)** - Learn how to optimize real campaigns
2. **[Configure Agents](./agents/README.md)** - Customize agent behavior
3. **[Connect Platforms](./tutorials/04-cross-platform.md)** - Add Google Ads, Meta, etc.
4. **[Monitor Performance](./api/README.md)** - Track metrics and health

## Troubleshooting

### "Command not found: npx"

Make sure Node.js is installed and in your PATH:

```bash
which node
which npm
```

### "Port already in use"

Another process is using the default port. Either stop it or configure a different port:

```bash
CLAUDE_FLOW_MCP_PORT=3001 npx @claude-flow/cli@latest daemon start
```

### "Module not found"

Run `npm install` again to ensure all dependencies are installed:

```bash
rm -rf node_modules
npm install
```

### Need More Help?

- Check [GitHub Issues](https://github.com/ruvnet/marketing/issues)
- Read the [full documentation](./README.md)
- Review [CLAUDE.md](../CLAUDE.md) for Claude Code integration
