/**
 * Security Module Exports
 */

export {
  schemas,
  sanitizeHtml,
  validateCampaignInput,
  validateCreativeInput,
  validateApiPayload,
  sanitizeSqlIdentifier,
  detectInjectionPatterns,
  RateLimiter,
  generateSecureToken,
  maskSensitiveData,
} from './input-validator';

export {
  SecretsProvider,
  EnvSecretsProvider,
  MemorySecretsProvider,
  GCPSecretsProvider,
  SecretsManager,
  SecretNames,
  createSecretsManager,
  Secret,
  SecretConfig,
} from './secrets-manager';

export {
  AuditEventType,
  AuditSeverity,
  AuditEvent,
  AuditActor,
  AuditResource,
  AuditLogSink,
  AuditFilter,
  ConsoleAuditSink,
  MemoryAuditSink,
  AuditLogger,
  getAuditLogger,
  setAuditLogger,
} from './audit-logger';
