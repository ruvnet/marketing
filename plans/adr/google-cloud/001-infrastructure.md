# ADR-GC001: Google Cloud Platform Infrastructure

## Status
**Proposed** | Date: 2026-01-13

## Context

The AI Marketing Swarms platform requires a cloud infrastructure that provides:

1. **Serverless compute** for event-driven processing
2. **Scalable database** for campaign state and vectors
3. **Real-time analytics** for performance monitoring
4. **GPU acceleration** for GNN inference
5. **Cost-effective** scaling based on demand
6. **Integration** with Google Ads and Analytics APIs

## Decision

We will deploy on **Google Cloud Platform** using the following services:

### Infrastructure Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    GOOGLE CLOUD PLATFORM ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    COMPUTE LAYER                                     │   │
│  │                                                                      │   │
│  │  ┌─────────────────────┐    ┌─────────────────────────────────────┐│   │
│  │  │   Cloud Functions   │    │         Cloud Run                    ││   │
│  │  │   (Gen 2)           │    │                                      ││   │
│  │  │                     │    │  ┌───────────┐  ┌───────────┐       ││   │
│  │  │  • campaign-events  │    │  │ API       │  │ Intelligence│      ││   │
│  │  │  • creative-analyze │    │  │ Gateway   │  │ Service    │      ││   │
│  │  │  • attribution-calc │    │  │           │  │ (GPU)      │      ││   │
│  │  │  • webhook-handler  │    │  └───────────┘  └───────────┘       ││   │
│  │  │                     │    │                                      ││   │
│  │  │  Memory: 2GB max    │    │  ┌───────────┐  ┌───────────┐       ││   │
│  │  │  Timeout: 540s      │    │  │ Simulation│  │ Swarm     │       ││   │
│  │  │  Concurrency: 1000  │    │  │ Engine    │  │ Coordinator│      ││   │
│  │  │                     │    │  │           │  │            │      ││   │
│  │  └─────────────────────┘    │  └───────────┘  └───────────┘       ││   │
│  │                              └─────────────────────────────────────┘│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    DATA LAYER                                        │   │
│  │                                                                      │   │
│  │  ┌─────────────────────┐    ┌─────────────────────────────────────┐│   │
│  │  │      Firestore      │    │         Cloud Storage               ││   │
│  │  │                     │    │                                      ││   │
│  │  │  • campaigns/       │    │  • models/       (GNN weights)      ││   │
│  │  │  • creatives/       │    │  • embeddings/   (vector cache)     ││   │
│  │  │  • attribution/     │    │  • creatives/    (media assets)     ││   │
│  │  │  • events/          │    │  • backups/      (snapshots)        ││   │
│  │  │  • projections/     │    │                                      ││   │
│  │  │                     │    │  Nearline + Coldline for archives   ││   │
│  │  └─────────────────────┘    └─────────────────────────────────────┘│   │
│  │                                                                      │   │
│  │  ┌─────────────────────┐    ┌─────────────────────────────────────┐│   │
│  │  │    BigQuery         │    │         Vertex AI                   ││   │
│  │  │                     │    │                                      ││   │
│  │  │  • analytics_raw    │    │  • Model Registry                   ││   │
│  │  │  • campaigns_perf   │    │  • Feature Store                    ││   │
│  │  │  • attribution_data │    │  • Prediction Endpoints             ││   │
│  │  │  • ml_features      │    │  • Training Pipelines               ││   │
│  │  │                     │    │                                      ││   │
│  │  └─────────────────────┘    └─────────────────────────────────────┘│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    MESSAGING & INTEGRATION                           │   │
│  │                                                                      │   │
│  │  ┌─────────────────────┐    ┌─────────────────────────────────────┐│   │
│  │  │      Pub/Sub        │    │       Cloud Scheduler               ││   │
│  │  │                     │    │                                      ││   │
│  │  │  Topics:            │    │  • sync-campaigns (5 min)           ││   │
│  │  │  • campaigns        │    │  • fatigue-scan (hourly)            ││   │
│  │  │  • creatives        │    │  • model-retrain (daily)            ││   │
│  │  │  • attribution      │    │  • cleanup (weekly)                 ││   │
│  │  │  • agent-commands   │    │                                      ││   │
│  │  │  • dead-letters     │    │                                      ││   │
│  │  └─────────────────────┘    └─────────────────────────────────────┘│   │
│  │                                                                      │   │
│  │  ┌─────────────────────┐    ┌─────────────────────────────────────┐│   │
│  │  │   Secret Manager    │    │       Cloud Monitoring              ││   │
│  │  │                     │    │                                      ││   │
│  │  │  • google-ads-api   │    │  • Custom dashboards                ││   │
│  │  │  • meta-api         │    │  • Alerting policies                ││   │
│  │  │  • tiktok-api       │    │  • Log-based metrics                ││   │
│  │  │  • anthropic-api    │    │  • Uptime checks                    ││   │
│  │  │  • db-credentials   │    │                                      ││   │
│  │  └─────────────────────┘    └─────────────────────────────────────┘│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Resource Specifications

#### Cloud Functions (Gen 2)

| Function | Memory | Timeout | Concurrency | Trigger |
|----------|--------|---------|-------------|---------|
| campaign-events | 2GB | 60s | 100 | Pub/Sub |
| creative-analyze | 4GB | 120s | 50 | Pub/Sub |
| attribution-calc | 4GB | 300s | 20 | Pub/Sub |
| webhook-handler | 512MB | 30s | 1000 | HTTP |
| scheduled-sync | 2GB | 540s | 1 | Scheduler |

#### Cloud Run Services

| Service | CPU | Memory | GPU | Min/Max Instances |
|---------|-----|--------|-----|-------------------|
| api-gateway | 2 | 4GB | - | 1/100 |
| intelligence-service | 8 | 16GB | L4 | 0/10 |
| simulation-engine | 4 | 8GB | - | 0/20 |
| swarm-coordinator | 2 | 4GB | - | 1/5 |

#### Firestore Configuration

```yaml
# firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Campaign data - scoped to account
    match /campaigns/{accountId}/{document=**} {
      allow read, write: if request.auth != null
        && request.auth.token.accountId == accountId;
    }

    // Events - append-only
    match /events/{eventId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null;
      // No update or delete allowed
    }

    // Projections - system-only writes
    match /projections/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.admin == true;
    }
  }
}
```

### Network Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      NETWORK TOPOLOGY                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     GLOBAL LOAD BALANCER                            │   │
│  │                                                                      │   │
│  │                      ┌──────────────┐                               │   │
│  │                      │   Cloud CDN  │                               │   │
│  │                      │  (static)    │                               │   │
│  │                      └──────┬───────┘                               │   │
│  │                             │                                        │   │
│  │           ┌─────────────────┼─────────────────┐                     │   │
│  │           │                 │                 │                     │   │
│  │           ▼                 ▼                 ▼                     │   │
│  │    ┌──────────┐      ┌──────────┐      ┌──────────┐               │   │
│  │    │us-central│      │ europe-  │      │  asia-   │               │   │
│  │    │    1     │      │  west1   │      │ east1    │               │   │
│  │    └──────────┘      └──────────┘      └──────────┘               │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      VPC NETWORK                                     │   │
│  │                                                                      │   │
│  │  ┌─────────────────────┐    ┌─────────────────────────────────────┐│   │
│  │  │   Public Subnet     │    │        Private Subnet               ││   │
│  │  │                     │    │                                      ││   │
│  │  │  • Cloud Run        │◄───│  • Cloud Functions                  ││   │
│  │  │    (ingress)        │    │  • Firestore                        ││   │
│  │  │                     │    │  • Secret Manager                   ││   │
│  │  └─────────────────────┘    │  • Internal services                ││   │
│  │                              │                                      ││   │
│  │  Serverless VPC Connector   │  Private Google Access enabled      ││   │
│  │                              └─────────────────────────────────────┘│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Deployment Configuration

```yaml
# cloudbuild.yaml
steps:
  # Build WASM package
  - name: 'rust:1.77'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
        wasm-pack build crates/marketing-wasm --target web

  # Build Cloud Functions
  - name: 'node:20'
    entrypoint: 'npm'
    args: ['install']
    dir: 'functions/campaign-events'

  - name: 'node:20'
    entrypoint: 'npm'
    args: ['run', 'build']
    dir: 'functions/campaign-events'

  # Deploy Functions
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'functions'
      - 'deploy'
      - 'campaign-events'
      - '--gen2'
      - '--runtime=nodejs20'
      - '--trigger-topic=campaigns'
      - '--memory=2048MB'
      - '--timeout=60s'

  # Build and deploy Cloud Run
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/intelligence-service', 'services/intelligence']

  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/intelligence-service']

  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'intelligence-service'
      - '--image=gcr.io/$PROJECT_ID/intelligence-service'
      - '--platform=managed'
      - '--region=us-central1'
      - '--gpu=1'
      - '--gpu-type=nvidia-l4'
      - '--memory=16Gi'
      - '--cpu=8'
```

### Cost Estimation

| Service | Monthly Estimate | Scaling Factor |
|---------|-----------------|----------------|
| Cloud Functions | $150-500 | Event volume |
| Cloud Run | $200-1,000 | Request volume + GPU |
| Firestore | $100-400 | Data size + ops |
| Pub/Sub | $50-200 | Message volume |
| BigQuery | $100-500 | Query volume |
| Secret Manager | $10-20 | Secret count |
| Cloud Storage | $50-150 | Data stored |
| **Total** | **$660-2,770** | - |

## Consequences

### Positive
1. **Fully managed** - No server maintenance
2. **Auto-scaling** - Handles traffic spikes automatically
3. **GPU access** - Cloud Run GPU for GNN inference
4. **Native integration** - Google Ads/Analytics APIs
5. **Cost-effective** - Pay-per-use pricing

### Negative
1. **Cold starts** - Functions may have latency on first call
2. **Vendor lock-in** - Deep GCP integration
3. **Complexity** - Multiple services to manage
4. **Regional limits** - GPU only in specific regions

### Mitigations
1. Keep minimum instances for critical services
2. Abstract platform APIs behind interfaces
3. Use Terraform for infrastructure as code
4. Plan for multi-region deployment

## Related Documents
- [ADR-GC002: Firestore Schema](./002-firestore-schema.md)
- [ADR-GC003: Cloud Functions](./003-cloud-functions.md)
- [ADR-GC004: Cloud Run Services](./004-cloud-run-services.md)
