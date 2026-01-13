# ADR-API002: Google Secrets Manager Configuration

## Status
**Proposed** | Date: 2026-01-13

## Context

The AI Marketing Swarms platform requires secure management of sensitive credentials:

1. **Platform API Credentials** - Google Ads, Meta, TikTok, LinkedIn OAuth tokens
2. **Service Account Keys** - GCP service authentication
3. **Database Credentials** - Firestore, PostgreSQL connections
4. **Third-Party API Keys** - Analytics, embedding services
5. **Encryption Keys** - Data encryption at rest

These credentials must be:
- Centrally managed and rotatable
- Access-controlled with IAM
- Audited for compliance
- Available to Cloud Functions and Cloud Run

## Decision

We will use **Google Secret Manager** as the centralized secrets store with automatic rotation and fine-grained IAM controls.

### Secret Organization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SECRETS MANAGER ORGANIZATION                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  projects/marketing-swarms/secrets/                                         │
│  │                                                                          │
│  ├── platform-credentials/                                                  │
│  │   ├── google-ads-oauth-client-id                                        │
│  │   ├── google-ads-oauth-client-secret                                    │
│  │   ├── google-ads-developer-token                                        │
│  │   ├── google-ads-refresh-token                                          │
│  │   ├── meta-app-id                                                       │
│  │   ├── meta-app-secret                                                   │
│  │   ├── meta-access-token                                                 │
│  │   ├── tiktok-app-id                                                     │
│  │   ├── tiktok-app-secret                                                 │
│  │   ├── tiktok-access-token                                               │
│  │   ├── linkedin-client-id                                                │
│  │   ├── linkedin-client-secret                                            │
│  │   └── linkedin-access-token                                             │
│  │                                                                          │
│  ├── service-accounts/                                                      │
│  │   ├── firestore-service-account                                         │
│  │   ├── pubsub-service-account                                            │
│  │   ├── cloud-run-service-account                                         │
│  │   └── vertex-ai-service-account                                         │
│  │                                                                          │
│  ├── database/                                                              │
│  │   ├── postgres-connection-string                                        │
│  │   ├── postgres-read-replica-string                                      │
│  │   └── redis-connection-string                                           │
│  │                                                                          │
│  ├── api-keys/                                                              │
│  │   ├── openai-api-key                                                    │
│  │   ├── anthropic-api-key                                                 │
│  │   ├── cohere-api-key                                                    │
│  │   └── analytics-api-key                                                 │
│  │                                                                          │
│  ├── encryption/                                                            │
│  │   ├── data-encryption-key                                               │
│  │   ├── token-signing-key                                                 │
│  │   └── webhook-signing-secret                                            │
│  │                                                                          │
│  └── internal/                                                              │
│      ├── jwt-signing-key                                                   │
│      ├── session-encryption-key                                            │
│      └── inter-service-auth-token                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### IAM Configuration

```yaml
# iam-policy.yaml
bindings:
  # Cloud Functions can access platform credentials
  - role: roles/secretmanager.secretAccessor
    members:
      - serviceAccount:cloud-functions@marketing-swarms.iam.gserviceaccount.com
    condition:
      title: "Platform Credentials Access"
      expression: |
        resource.name.startsWith("projects/marketing-swarms/secrets/platform-credentials/")

  # Cloud Run can access all operational secrets
  - role: roles/secretmanager.secretAccessor
    members:
      - serviceAccount:cloud-run@marketing-swarms.iam.gserviceaccount.com
    condition:
      title: "Operational Secrets Access"
      expression: |
        resource.name.startsWith("projects/marketing-swarms/secrets/platform-credentials/") ||
        resource.name.startsWith("projects/marketing-swarms/secrets/database/") ||
        resource.name.startsWith("projects/marketing-swarms/secrets/api-keys/")

  # Admin access for rotation
  - role: roles/secretmanager.admin
    members:
      - group:security-admins@marketing-swarms.com
```

### Secret Access Patterns

#### Cloud Functions
```typescript
// functions/src/secrets.ts
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();

export async function getSecret(secretName: string): Promise<string> {
  const name = `projects/marketing-swarms/secrets/${secretName}/versions/latest`;
  const [version] = await client.accessSecretVersion({ name });
  return version.payload?.data?.toString() || '';
}

export async function getPlatformCredentials(platform: string): Promise<PlatformCredentials> {
  const [clientId, clientSecret, accessToken] = await Promise.all([
    getSecret(`platform-credentials/${platform}-client-id`),
    getSecret(`platform-credentials/${platform}-client-secret`),
    getSecret(`platform-credentials/${platform}-access-token`)
  ]);

  return { clientId, clientSecret, accessToken };
}
```

#### Cloud Run (Environment Injection)
```yaml
# cloudrun-service.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: campaign-optimizer
spec:
  template:
    spec:
      containers:
        - image: gcr.io/marketing-swarms/campaign-optimizer
          env:
            - name: GOOGLE_ADS_CLIENT_ID
              valueFrom:
                secretKeyRef:
                  key: latest
                  name: google-ads-oauth-client-id
            - name: GOOGLE_ADS_CLIENT_SECRET
              valueFrom:
                secretKeyRef:
                  key: latest
                  name: google-ads-oauth-client-secret
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  key: latest
                  name: postgres-connection-string
```

### Rotation Strategy

```typescript
// rotation/platform-token-rotator.ts
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { GoogleAdsApi, MetaAdsApi, TikTokAdsApi } from '@marketing/platform-apis';

const client = new SecretManagerServiceClient();

interface RotationConfig {
  platform: string;
  rotationIntervalDays: number;
  notifyOnRotation: boolean;
}

const rotationConfigs: RotationConfig[] = [
  { platform: 'google-ads', rotationIntervalDays: 30, notifyOnRotation: true },
  { platform: 'meta', rotationIntervalDays: 60, notifyOnRotation: true },
  { platform: 'tiktok', rotationIntervalDays: 90, notifyOnRotation: true },
  { platform: 'linkedin', rotationIntervalDays: 60, notifyOnRotation: true }
];

export async function rotateToken(platform: string): Promise<void> {
  // 1. Get current credentials
  const currentToken = await getSecret(`platform-credentials/${platform}-access-token`);
  const refreshToken = await getSecret(`platform-credentials/${platform}-refresh-token`);

  // 2. Refresh the token
  let newToken: string;
  switch (platform) {
    case 'google-ads':
      newToken = await GoogleAdsApi.refreshToken(refreshToken);
      break;
    case 'meta':
      newToken = await MetaAdsApi.refreshToken(refreshToken);
      break;
    case 'tiktok':
      newToken = await TikTokAdsApi.refreshToken(refreshToken);
      break;
    default:
      throw new Error(`Unknown platform: ${platform}`);
  }

  // 3. Store new version
  const secretName = `projects/marketing-swarms/secrets/platform-credentials/${platform}-access-token`;
  await client.addSecretVersion({
    parent: secretName,
    payload: { data: Buffer.from(newToken) }
  });

  // 4. Verify new token works
  const verified = await verifyToken(platform, newToken);
  if (!verified) {
    // Rollback
    await client.disableSecretVersion({
      name: `${secretName}/versions/latest`
    });
    throw new Error(`Token verification failed for ${platform}`);
  }

  // 5. Disable old version (keep for 24h for rollback)
  setTimeout(async () => {
    const versions = await client.listSecretVersions({ parent: secretName });
    for (const version of versions[0]) {
      if (version.state === 'ENABLED' && version.name !== `${secretName}/versions/latest`) {
        await client.disableSecretVersion({ name: version.name });
      }
    }
  }, 24 * 60 * 60 * 1000);
}

// Cloud Scheduler trigger
export async function scheduledRotation(): Promise<void> {
  for (const config of rotationConfigs) {
    const lastRotation = await getLastRotationTime(config.platform);
    const daysSinceRotation = (Date.now() - lastRotation) / (1000 * 60 * 60 * 24);

    if (daysSinceRotation >= config.rotationIntervalDays) {
      await rotateToken(config.platform);

      if (config.notifyOnRotation) {
        await notifyRotation(config.platform);
      }
    }
  }
}
```

### Audit Logging

```yaml
# audit-config.yaml
auditLogConfigs:
  - service: secretmanager.googleapis.com
    auditLogConfigs:
      - logType: ADMIN_READ
      - logType: ADMIN_WRITE
      - logType: DATA_READ
      - logType: DATA_WRITE

# Cloud Logging filter for secret access
filter: |
  resource.type="secretmanager.googleapis.com/Secret"
  protoPayload.methodName="google.cloud.secretmanager.v1.SecretManagerService.AccessSecretVersion"
```

### Environment-Specific Configuration

| Secret Category | Development | Staging | Production |
|-----------------|-------------|---------|------------|
| Platform Tokens | Test accounts | Sandbox accounts | Live accounts |
| Database | Local/emulator | Staging DB | Prod replicated |
| API Keys | Free tier | Limited | Full access |
| Encryption | Test keys | Staging keys | HSM-backed |

```typescript
// config/secrets-config.ts
export function getSecretPrefix(): string {
  const env = process.env.ENVIRONMENT || 'development';
  return `projects/marketing-swarms-${env}/secrets`;
}

export function getSecretName(category: string, name: string): string {
  return `${getSecretPrefix()}/${category}/${name}`;
}
```

## Consequences

### Positive
1. **Centralized management** - All secrets in one auditable location
2. **Automatic rotation** - Reduces stale credential risk
3. **Fine-grained access** - IAM conditions limit exposure
4. **Version history** - Easy rollback if needed
5. **Native GCP integration** - Seamless with Cloud Run/Functions

### Negative
1. **GCP lock-in** - Secrets tied to Google infrastructure
2. **Latency** - Network call for each secret access
3. **Cost** - Per-access and storage charges

### Mitigations
1. Local caching with TTL for frequently accessed secrets
2. Batch secret retrieval where possible
3. Use environment injection for Cloud Run

## Related Documents
- [ADR-API001: API Design](./001-api-design.md)
- [ADR-API003: Authentication](./003-authentication.md)
- [ADR-GC001: Infrastructure](../google-cloud/001-infrastructure.md)
