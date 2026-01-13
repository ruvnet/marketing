/**
 * Secrets Manager
 * Secure handling of API keys, credentials, and sensitive configuration
 */

import { createLogger } from '../core/logger';

const logger = createLogger('secrets-manager');

export interface SecretConfig {
  name: string;
  version?: string;
  required?: boolean;
}

export interface Secret {
  name: string;
  value: string;
  version: string;
  createdAt: Date;
  expiresAt?: Date;
}

/**
 * Abstract secrets provider interface
 * Implementations can use GCP Secret Manager, AWS Secrets Manager, HashiCorp Vault, etc.
 */
export interface SecretsProvider {
  getSecret(name: string, version?: string): Promise<Secret | null>;
  setSecret(name: string, value: string): Promise<void>;
  deleteSecret(name: string): Promise<void>;
  listSecrets(): Promise<string[]>;
}

/**
 * Environment-based secrets provider (for development)
 */
export class EnvSecretsProvider implements SecretsProvider {
  private readonly prefix: string;

  constructor(prefix: string = 'SECRET_') {
    this.prefix = prefix;
  }

  async getSecret(name: string): Promise<Secret | null> {
    const envKey = `${this.prefix}${name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
    const value = process.env[envKey];

    if (!value) {
      return null;
    }

    return {
      name,
      value,
      version: '1',
      createdAt: new Date(),
    };
  }

  async setSecret(_name: string, _value: string): Promise<void> {
    throw new Error('Cannot set secrets in environment provider');
  }

  async deleteSecret(_name: string): Promise<void> {
    throw new Error('Cannot delete secrets in environment provider');
  }

  async listSecrets(): Promise<string[]> {
    return Object.keys(process.env)
      .filter((key) => key.startsWith(this.prefix))
      .map((key) => key.slice(this.prefix.length).toLowerCase().replace(/_/g, '-'));
  }
}

/**
 * In-memory secrets provider (for testing)
 */
export class MemorySecretsProvider implements SecretsProvider {
  private readonly secrets: Map<string, Secret> = new Map();

  async getSecret(name: string, version?: string): Promise<Secret | null> {
    const secret = this.secrets.get(name);
    if (!secret) return null;
    if (version && secret.version !== version) return null;
    return secret;
  }

  async setSecret(name: string, value: string): Promise<void> {
    const existing = this.secrets.get(name);
    const version = existing ? String(parseInt(existing.version) + 1) : '1';

    this.secrets.set(name, {
      name,
      value,
      version,
      createdAt: new Date(),
    });
  }

  async deleteSecret(name: string): Promise<void> {
    this.secrets.delete(name);
  }

  async listSecrets(): Promise<string[]> {
    return Array.from(this.secrets.keys());
  }
}

/**
 * GCP Secret Manager provider (production)
 */
export class GCPSecretsProvider implements SecretsProvider {
  private readonly projectId: string;

  constructor(projectId: string) {
    this.projectId = projectId;
  }

  async getSecret(name: string, version: string = 'latest'): Promise<Secret | null> {
    // In production, this would use @google-cloud/secret-manager
    // const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
    // const client = new SecretManagerServiceClient();

    logger.debug('Fetching secret from GCP', { name, version });

    // Mock implementation
    return null;
  }

  async setSecret(name: string, _value: string): Promise<void> {
    logger.debug('Setting secret in GCP', { name });
    // Mock implementation
  }

  async deleteSecret(name: string): Promise<void> {
    logger.debug('Deleting secret from GCP', { name });
    // Mock implementation
  }

  async listSecrets(): Promise<string[]> {
    logger.debug('Listing secrets from GCP');
    // Mock implementation
    return [];
  }
}

/**
 * Secrets Manager - central interface for secret management
 */
export class SecretsManager {
  private readonly provider: SecretsProvider;
  private readonly cache: Map<string, { secret: Secret; cachedAt: Date }> = new Map();
  private readonly cacheTtlMs: number;

  constructor(provider: SecretsProvider, cacheTtlMs: number = 300000) {
    this.provider = provider;
    this.cacheTtlMs = cacheTtlMs;
  }

  /**
   * Get a secret value
   */
  async get(name: string, options?: { version?: string; useCache?: boolean }): Promise<string | null> {
    const useCache = options?.useCache !== false;

    // Check cache first
    if (useCache) {
      const cached = this.cache.get(name);
      if (cached && Date.now() - cached.cachedAt.getTime() < this.cacheTtlMs) {
        logger.debug('Secret retrieved from cache', { name });
        return cached.secret.value;
      }
    }

    // Fetch from provider
    const secret = await this.provider.getSecret(name, options?.version);
    if (!secret) {
      logger.warn('Secret not found', { name });
      return null;
    }

    // Update cache
    if (useCache) {
      this.cache.set(name, { secret, cachedAt: new Date() });
    }

    logger.debug('Secret retrieved', { name, version: secret.version });
    return secret.value;
  }

  /**
   * Get a required secret (throws if not found)
   */
  async getRequired(name: string, options?: { version?: string }): Promise<string> {
    const value = await this.get(name, options);
    if (value === null) {
      throw new Error(`Required secret not found: ${name}`);
    }
    return value;
  }

  /**
   * Get multiple secrets
   */
  async getMany(configs: SecretConfig[]): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    await Promise.all(
      configs.map(async (config) => {
        const value = await this.get(config.name, { version: config.version });

        if (value !== null) {
          results.set(config.name, value);
        } else if (config.required) {
          throw new Error(`Required secret not found: ${config.name}`);
        }
      })
    );

    return results;
  }

  /**
   * Set a secret
   */
  async set(name: string, value: string): Promise<void> {
    await this.provider.setSecret(name, value);
    this.cache.delete(name);
    logger.info('Secret updated', { name });
  }

  /**
   * Delete a secret
   */
  async delete(name: string): Promise<void> {
    await this.provider.deleteSecret(name);
    this.cache.delete(name);
    logger.info('Secret deleted', { name });
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.debug('Secret cache cleared');
  }

  /**
   * List available secrets
   */
  async list(): Promise<string[]> {
    return this.provider.listSecrets();
  }
}

// Common secret names
export const SecretNames = {
  GOOGLE_ADS_API_KEY: 'google-ads-api-key',
  GOOGLE_ADS_DEVELOPER_TOKEN: 'google-ads-developer-token',
  META_ADS_ACCESS_TOKEN: 'meta-ads-access-token',
  META_ADS_APP_SECRET: 'meta-ads-app-secret',
  TIKTOK_ADS_ACCESS_TOKEN: 'tiktok-ads-access-token',
  LINKEDIN_ADS_ACCESS_TOKEN: 'linkedin-ads-access-token',
  TWITTER_ADS_ACCESS_TOKEN: 'twitter-ads-access-token',
  AMAZON_ADS_ACCESS_TOKEN: 'amazon-ads-access-token',
  DATABASE_URL: 'database-url',
  REDIS_URL: 'redis-url',
  ENCRYPTION_KEY: 'encryption-key',
} as const;

// Factory functions
export function createSecretsManager(
  environment: 'development' | 'production' = 'development',
  gcpProjectId?: string
): SecretsManager {
  let provider: SecretsProvider;

  if (environment === 'production' && gcpProjectId) {
    provider = new GCPSecretsProvider(gcpProjectId);
  } else {
    provider = new EnvSecretsProvider();
  }

  return new SecretsManager(provider);
}
