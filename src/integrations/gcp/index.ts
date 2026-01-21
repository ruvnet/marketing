/**
 * Google Cloud Platform Integration Exports
 */

// Import factory functions for local use in createGCPClients
import { createBigQueryClient } from './bigquery-client';
import { createPubSubClient } from './pubsub-client';
import { createStorageClient } from './storage-client';
import { createVertexAIClient } from './vertex-ai-client';

export {
  BigQueryClient,
  BigQueryConfig,
  QueryResult,
  SchemaField,
  TableMetadata,
  InsertResult,
  createBigQueryClient,
} from './bigquery-client';

export {
  PubSubClient,
  PubSubConfig,
  Topic,
  Subscription,
  Message,
  PublishResult,
  MessageHandler,
  createPubSubClient,
} from './pubsub-client';

export {
  StorageClient,
  StorageConfig,
  Bucket,
  LifecycleRule,
  StorageObject,
  UploadOptions,
  SignedUrlOptions,
  createStorageClient,
} from './storage-client';

export {
  VertexAIClient,
  VertexAIConfig,
  Endpoint,
  DeployedModel,
  PredictionRequest,
  PredictionResponse,
  BatchPredictionJob,
  EmbeddingRequest,
  EmbeddingResponse,
  createVertexAIClient,
} from './vertex-ai-client';

// Unified GCP configuration
export interface GCPConfig {
  projectId: string;
  location?: string;
  credentials?: {
    clientEmail: string;
    privateKey: string;
  };
}

// Factory for creating all GCP clients
export function createGCPClients(config: GCPConfig) {
  return {
    bigquery: createBigQueryClient({
      projectId: config.projectId,
      datasetId: 'marketing_swarm',
      credentials: config.credentials,
    }),
    pubsub: createPubSubClient({
      projectId: config.projectId,
      credentials: config.credentials,
    }),
    storage: createStorageClient({
      projectId: config.projectId,
      credentials: config.credentials,
    }),
    vertexai: createVertexAIClient({
      projectId: config.projectId,
      location: config.location || 'us-central1',
      credentials: config.credentials,
    }),
  };
}
