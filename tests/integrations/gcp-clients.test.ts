/**
 * GCP Client Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  BigQueryClient,
  PubSubClient,
  StorageClient,
  VertexAIClient,
  createGCPClients,
} from '../../src/integrations/gcp';

describe('GCP Clients', () => {
  describe('BigQueryClient', () => {
    let client: BigQueryClient;

    beforeEach(async () => {
      client = new BigQueryClient({
        projectId: 'test-project',
        datasetId: 'test_dataset',
      });
      await client.connect();
    });

    afterEach(async () => {
      await client.close();
    });

    it('should connect successfully', async () => {
      const newClient = new BigQueryClient({
        projectId: 'test-project',
        datasetId: 'test_dataset',
      });
      await newClient.connect();
      await newClient.close();
    });

    it('should execute query', async () => {
      const result = await client.query('SELECT * FROM table LIMIT 10');

      expect(result).toHaveProperty('rows');
      expect(result).toHaveProperty('totalRows');
      expect(result).toHaveProperty('jobId');
      expect(result).toHaveProperty('executionTime');
    });

    it('should insert rows', async () => {
      const result = await client.insert('test_table', [
        { name: 'Test 1', value: 100 },
        { name: 'Test 2', value: 200 },
      ]);

      expect(result.insertedRows).toBe(2);
      expect(result.failedRows).toBe(0);
    });

    it('should get table metadata', async () => {
      const metadata = await client.getTableMetadata('test_table');

      expect(metadata).toHaveProperty('tableId');
      expect(metadata).toHaveProperty('datasetId');
      expect(metadata).toHaveProperty('schema');
    });

    it('should execute parameterized query', async () => {
      const result = await client.parameterizedQuery(
        'SELECT * FROM table WHERE id = @id',
        [{ name: 'id', value: '123', type: 'STRING' }]
      );

      expect(result).toHaveProperty('rows');
    });

    it('should throw when not connected', async () => {
      const newClient = new BigQueryClient({
        projectId: 'test-project',
        datasetId: 'test_dataset',
      });

      await expect(newClient.query('SELECT 1')).rejects.toThrow(
        'BigQuery client not connected'
      );
    });
  });

  describe('PubSubClient', () => {
    let client: PubSubClient;

    beforeEach(async () => {
      client = new PubSubClient({
        projectId: 'test-project',
      });
      await client.connect();
    });

    afterEach(async () => {
      await client.close();
    });

    it('should create topic', async () => {
      const topic = await client.createTopic('test-topic');

      expect(topic.name).toBe('test-topic');
    });

    it('should create subscription', async () => {
      await client.createTopic('sub-test-topic');
      const subscription = await client.createSubscription(
        'test-subscription',
        'sub-test-topic'
      );

      expect(subscription.name).toBe('test-subscription');
      expect(subscription.topic).toBe('sub-test-topic');
    });

    it('should publish message', async () => {
      await client.createTopic('publish-topic');

      const result = await client.publish('publish-topic', { data: 'test' });

      expect(result).toHaveProperty('messageId');
      expect(result).toHaveProperty('topic', 'publish-topic');
    });

    it('should deliver to subscribers', async () => {
      const topicName = 'delivery-topic';
      const subName = 'delivery-sub';

      await client.createTopic(topicName);
      await client.createSubscription(subName, topicName);

      const received: unknown[] = [];
      client.subscribe(subName, async (message) => {
        received.push(JSON.parse(message.data.toString()));
      });

      await client.publish(topicName, { value: 42 });

      // Wait for async delivery
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(received).toHaveLength(1);
      expect(received[0]).toEqual({ value: 42 });
    });

    it('should list topics and subscriptions', async () => {
      await client.createTopic('list-topic-1');
      await client.createTopic('list-topic-2');

      const topics = await client.listTopics();
      expect(topics.length).toBeGreaterThanOrEqual(2);

      await client.createSubscription('list-sub', 'list-topic-1');
      const subscriptions = await client.listSubscriptions();
      expect(subscriptions.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('StorageClient', () => {
    let client: StorageClient;

    beforeEach(async () => {
      client = new StorageClient({
        projectId: 'test-project',
      });
      await client.connect();
    });

    afterEach(async () => {
      await client.close();
    });

    it('should create bucket', async () => {
      const bucket = await client.createBucket('test-bucket');

      expect(bucket.name).toBe('test-bucket');
      expect(bucket.storageClass).toBe('STANDARD');
    });

    it('should upload and download object', async () => {
      await client.createBucket('upload-bucket');

      const content = 'Hello, World!';
      const uploaded = await client.upload('upload-bucket', 'test.txt', content);

      expect(uploaded.name).toBe('test.txt');
      expect(uploaded.size).toBe(Buffer.from(content).length);

      const downloaded = await client.download('upload-bucket', 'test.txt');
      expect(downloaded.toString()).toBe(content);
    });

    it('should check object existence', async () => {
      await client.createBucket('exists-bucket');

      expect(await client.exists('exists-bucket', 'missing.txt')).toBe(false);

      await client.upload('exists-bucket', 'exists.txt', 'data');

      expect(await client.exists('exists-bucket', 'exists.txt')).toBe(true);
    });

    it('should list objects', async () => {
      await client.createBucket('list-bucket');
      await client.upload('list-bucket', 'file1.txt', 'data1');
      await client.upload('list-bucket', 'file2.txt', 'data2');
      await client.upload('list-bucket', 'prefix/file3.txt', 'data3');

      const allObjects = await client.listObjects('list-bucket');
      expect(allObjects).toHaveLength(3);

      const prefixedObjects = await client.listObjects('list-bucket', {
        prefix: 'prefix/',
      });
      expect(prefixedObjects).toHaveLength(1);
    });

    it('should copy and move objects', async () => {
      await client.createBucket('source-bucket');
      await client.createBucket('dest-bucket');

      await client.upload('source-bucket', 'original.txt', 'content');

      // Copy
      await client.copy('source-bucket', 'original.txt', 'dest-bucket', 'copied.txt');
      expect(await client.exists('dest-bucket', 'copied.txt')).toBe(true);
      expect(await client.exists('source-bucket', 'original.txt')).toBe(true);

      // Move
      await client.move('source-bucket', 'original.txt', 'dest-bucket', 'moved.txt');
      expect(await client.exists('dest-bucket', 'moved.txt')).toBe(true);
      expect(await client.exists('source-bucket', 'original.txt')).toBe(false);
    });

    it('should generate signed URL', async () => {
      await client.createBucket('signed-bucket');
      await client.upload('signed-bucket', 'signed.txt', 'data');

      const url = await client.getSignedUrl('signed-bucket', 'signed.txt', {
        action: 'read',
        expires: new Date(Date.now() + 3600000),
      });

      expect(url).toContain('storage.googleapis.com');
      expect(url).toContain('signed-bucket');
      expect(url).toContain('signed.txt');
    });
  });

  describe('VertexAIClient', () => {
    let client: VertexAIClient;

    beforeEach(async () => {
      client = new VertexAIClient({
        projectId: 'test-project',
        location: 'us-central1',
      });
      await client.connect();
    });

    afterEach(async () => {
      await client.close();
    });

    it('should make predictions', async () => {
      const response = await client.predict('test-endpoint', {
        instances: [{ features: [1, 2, 3] }, { features: [4, 5, 6] }],
      });

      expect(response.predictions).toHaveLength(2);
      expect(response).toHaveProperty('deployedModelId');
    });

    it('should generate embeddings', async () => {
      const response = await client.generateEmbeddings({
        texts: ['Hello world', 'Test text'],
      });

      expect(response.embeddings).toHaveLength(2);
      expect(response.embeddings[0]).toHaveLength(768);
      expect(response).toHaveProperty('usage');
    });

    it('should generate text', async () => {
      const response = await client.generateText('Write a marketing tagline');

      expect(response).toHaveProperty('text');
      expect(response).toHaveProperty('tokenCount');
    });

    it('should create batch prediction job', async () => {
      const job = await client.createBatchPredictionJob(
        'Test Batch Job',
        'model-123',
        'gs://input/data.jsonl',
        'gs://output/'
      );

      expect(job).toHaveProperty('id');
      expect(job.state).toBe('pending');
    });

    it('should create and manage endpoints', async () => {
      const endpoint = await client.createEndpoint('Test Endpoint');

      expect(endpoint).toHaveProperty('id');
      expect(endpoint.displayName).toBe('Test Endpoint');

      await client.deleteEndpoint(endpoint.id);
    });
  });

  describe('createGCPClients factory', () => {
    it('should create all GCP clients', () => {
      const clients = createGCPClients({
        projectId: 'test-project',
        location: 'us-central1',
      });

      expect(clients).toHaveProperty('bigquery');
      expect(clients).toHaveProperty('pubsub');
      expect(clients).toHaveProperty('storage');
      expect(clients).toHaveProperty('vertexai');
    });
  });
});
