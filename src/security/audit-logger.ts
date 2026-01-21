/**
 * Audit Logger
 * Security audit logging for compliance and monitoring
 */

import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../core/logger';

const logger = createLogger('audit-logger');

export type AuditEventType =
  | 'authentication'
  | 'authorization'
  | 'data_access'
  | 'data_modification'
  | 'configuration_change'
  | 'system_event'
  | 'security_alert';

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AuditEvent {
  id: string;
  timestamp: Date;
  type: AuditEventType;
  severity: AuditSeverity;
  action: string;
  actor: AuditActor;
  resource: AuditResource;
  outcome: 'success' | 'failure' | 'denied';
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

export interface AuditActor {
  type: 'user' | 'service' | 'agent' | 'system';
  id: string;
  name?: string;
  email?: string;
}

export interface AuditResource {
  type: string;
  id: string;
  name?: string;
  attributes?: Record<string, unknown>;
}

export interface AuditLogSink {
  write(event: AuditEvent): Promise<void>;
  query?(filter: AuditFilter): Promise<AuditEvent[]>;
}

export interface AuditFilter {
  startTime?: Date;
  endTime?: Date;
  types?: AuditEventType[];
  actors?: string[];
  resources?: string[];
  outcomes?: Array<'success' | 'failure' | 'denied'>;
  severity?: AuditSeverity[];
  limit?: number;
}

/**
 * Console audit sink (development)
 */
export class ConsoleAuditSink implements AuditLogSink {
  async write(event: AuditEvent): Promise<void> {
    const context = {
      auditId: event.id,
      type: event.type,
      action: event.action,
      actor: `${event.actor.type}:${event.actor.id}`,
      resource: `${event.resource.type}:${event.resource.id}`,
      outcome: event.outcome,
    };

    if (event.severity === 'critical' || event.severity === 'error') {
      logger.error('Audit event', undefined, context);
    } else if (event.severity === 'warning') {
      logger.warn('Audit event', context);
    } else {
      logger.info('Audit event', context);
    }
  }
}

/**
 * In-memory audit sink (testing)
 */
export class MemoryAuditSink implements AuditLogSink {
  private readonly events: AuditEvent[] = [];

  async write(event: AuditEvent): Promise<void> {
    this.events.push(event);
  }

  async query(filter: AuditFilter): Promise<AuditEvent[]> {
    let results = [...this.events];

    if (filter.startTime) {
      results = results.filter((e) => e.timestamp >= filter.startTime!);
    }
    if (filter.endTime) {
      results = results.filter((e) => e.timestamp <= filter.endTime!);
    }
    if (filter.types?.length) {
      results = results.filter((e) => filter.types!.includes(e.type));
    }
    if (filter.actors?.length) {
      results = results.filter((e) => filter.actors!.includes(e.actor.id));
    }
    if (filter.resources?.length) {
      results = results.filter((e) => filter.resources!.includes(e.resource.id));
    }
    if (filter.outcomes?.length) {
      results = results.filter((e) => filter.outcomes!.includes(e.outcome));
    }
    if (filter.severity?.length) {
      results = results.filter((e) => filter.severity!.includes(e.severity));
    }
    if (filter.limit) {
      results = results.slice(0, filter.limit);
    }

    return results;
  }

  getAll(): AuditEvent[] {
    return [...this.events];
  }

  clear(): void {
    this.events.length = 0;
  }
}

/**
 * Audit Logger - central audit logging facility
 */
export class AuditLogger {
  private readonly sinks: AuditLogSink[];

  constructor(sinks: AuditLogSink[] = [new ConsoleAuditSink()]) {
    this.sinks = sinks;
  }

  /**
   * Log an audit event
   */
  async log(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<string> {
    const fullEvent: AuditEvent = {
      ...event,
      id: uuidv4(),
      timestamp: new Date(),
    };

    await Promise.all(this.sinks.map((sink) => sink.write(fullEvent)));

    return fullEvent.id;
  }

  /**
   * Log authentication event
   */
  async logAuthentication(
    actor: AuditActor,
    outcome: 'success' | 'failure',
    metadata?: Record<string, unknown>
  ): Promise<string> {
    return this.log({
      type: 'authentication',
      severity: outcome === 'failure' ? 'warning' : 'info',
      action: 'authenticate',
      actor,
      resource: { type: 'auth', id: 'login' },
      outcome,
      metadata,
    });
  }

  /**
   * Log authorization event
   */
  async logAuthorization(
    actor: AuditActor,
    resource: AuditResource,
    action: string,
    outcome: 'success' | 'denied',
    metadata?: Record<string, unknown>
  ): Promise<string> {
    return this.log({
      type: 'authorization',
      severity: outcome === 'denied' ? 'warning' : 'info',
      action,
      actor,
      resource,
      outcome,
      metadata,
    });
  }

  /**
   * Log data access event
   */
  async logDataAccess(
    actor: AuditActor,
    resource: AuditResource,
    action: 'read' | 'list' | 'export',
    metadata?: Record<string, unknown>
  ): Promise<string> {
    return this.log({
      type: 'data_access',
      severity: 'info',
      action,
      actor,
      resource,
      outcome: 'success',
      metadata,
    });
  }

  /**
   * Log data modification event
   */
  async logDataModification(
    actor: AuditActor,
    resource: AuditResource,
    action: 'create' | 'update' | 'delete',
    outcome: 'success' | 'failure',
    metadata?: Record<string, unknown>
  ): Promise<string> {
    return this.log({
      type: 'data_modification',
      severity: outcome === 'failure' ? 'error' : 'info',
      action,
      actor,
      resource,
      outcome,
      metadata,
    });
  }

  /**
   * Log configuration change
   */
  async logConfigurationChange(
    actor: AuditActor,
    resource: AuditResource,
    action: string,
    previousValue?: unknown,
    newValue?: unknown
  ): Promise<string> {
    return this.log({
      type: 'configuration_change',
      severity: 'warning',
      action,
      actor,
      resource,
      outcome: 'success',
      metadata: { previousValue, newValue },
    });
  }

  /**
   * Log security alert
   */
  async logSecurityAlert(
    severity: AuditSeverity,
    action: string,
    resource: AuditResource,
    metadata?: Record<string, unknown>
  ): Promise<string> {
    return this.log({
      type: 'security_alert',
      severity,
      action,
      actor: { type: 'system', id: 'security-monitor' },
      resource,
      outcome: 'success',
      metadata,
    });
  }

  /**
   * Query audit logs (if supported by sinks)
   */
  async query(filter: AuditFilter): Promise<AuditEvent[]> {
    const results: AuditEvent[] = [];

    for (const sink of this.sinks) {
      if (sink.query) {
        const sinkResults = await sink.query(filter);
        results.push(...sinkResults);
      }
    }

    // Deduplicate by ID
    const seen = new Set<string>();
    return results.filter((event) => {
      if (seen.has(event.id)) return false;
      seen.add(event.id);
      return true;
    });
  }
}

// Singleton instance
let auditLoggerInstance: AuditLogger | null = null;

export function getAuditLogger(): AuditLogger {
  if (!auditLoggerInstance) {
    auditLoggerInstance = new AuditLogger();
  }
  return auditLoggerInstance;
}

export function setAuditLogger(logger: AuditLogger): void {
  auditLoggerInstance = logger;
}
