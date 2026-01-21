/**
 * Input Validator
 * Security utilities for input validation and sanitization
 */

import { z } from 'zod';
import { createLogger } from '../core/logger';

const logger = createLogger('input-validator');

// Validation schemas for common inputs
export const schemas = {
  // Campaign input validation
  campaignId: z.string().uuid('Invalid campaign ID format'),

  campaignName: z
    .string()
    .min(1, 'Campaign name is required')
    .max(255, 'Campaign name too long')
    .regex(/^[\w\s\-_.()]+$/i, 'Campaign name contains invalid characters'),

  budget: z
    .number()
    .positive('Budget must be positive')
    .max(10000000, 'Budget exceeds maximum'),

  // Creative input validation
  creativeId: z.string().uuid('Invalid creative ID format'),

  creativeName: z
    .string()
    .min(1, 'Creative name is required')
    .max(255, 'Creative name too long'),

  // Content validation (prevents XSS)
  safeText: z
    .string()
    .transform((val) => sanitizeHtml(val))
    .pipe(z.string().max(10000)),

  // URL validation
  url: z.string().url('Invalid URL format'),

  safeUrl: z.string().url().refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    { message: 'URL must use HTTP or HTTPS protocol' }
  ),

  // Email validation
  email: z.string().email('Invalid email format'),

  // Platform validation
  platform: z.enum([
    'google-ads',
    'meta-ads',
    'tiktok-ads',
    'linkedin-ads',
    'twitter-ads',
    'amazon-ads',
  ]),

  // SQL-safe identifier (prevents SQL injection in dynamic queries)
  sqlIdentifier: z
    .string()
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Invalid SQL identifier'),

  // GCS path validation
  gcsPath: z
    .string()
    .regex(/^gs:\/\/[a-z0-9][\w.-]*[a-z0-9](\/.*)?$/i, 'Invalid GCS path'),

  // BigQuery table reference
  bigQueryTable: z
    .string()
    .regex(
      /^[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*$/,
      'Invalid BigQuery table reference (project.dataset.table)'
    ),
};

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeHtml(input: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };

  return input.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char] || char);
}

/**
 * Validate and sanitize campaign input
 */
export function validateCampaignInput(input: unknown): {
  valid: boolean;
  data?: Record<string, unknown>;
  errors?: string[];
} {
  const schema = z.object({
    name: schemas.campaignName,
    platform: schemas.platform,
    budget: schemas.budget,
    dailyBudget: schemas.budget,
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    targetAudience: z.array(schemas.safeText).max(50),
    objectives: z.array(schemas.safeText).max(20),
  });

  const result = schema.safeParse(input);

  if (result.success) {
    return { valid: true, data: result.data };
  }

  const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
  logger.warn('Campaign input validation failed', { errors });

  return { valid: false, errors };
}

/**
 * Validate and sanitize creative input
 */
export function validateCreativeInput(input: unknown): {
  valid: boolean;
  data?: Record<string, unknown>;
  errors?: string[];
} {
  const schema = z.object({
    name: schemas.creativeName,
    type: z.enum(['image', 'video', 'carousel', 'text', 'html']),
    platform: schemas.platform,
    content: z.object({
      headline: schemas.safeText.optional(),
      body: schemas.safeText.optional(),
      callToAction: schemas.safeText.optional(),
      imageUrl: schemas.safeUrl.optional(),
      videoUrl: schemas.safeUrl.optional(),
    }),
  });

  const result = schema.safeParse(input);

  if (result.success) {
    return { valid: true, data: result.data };
  }

  const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
  logger.warn('Creative input validation failed', { errors });

  return { valid: false, errors };
}

/**
 * Validate API request payload
 */
export function validateApiPayload<T>(
  schema: z.ZodSchema<T>,
  payload: unknown
): { valid: boolean; data?: T; errors?: string[] } {
  const result = schema.safeParse(payload);

  if (result.success) {
    return { valid: true, data: result.data };
  }

  const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
  return { valid: false, errors };
}

/**
 * Sanitize SQL identifier for safe use in dynamic queries
 * Only allows alphanumeric and underscore characters
 */
export function sanitizeSqlIdentifier(identifier: string): string {
  const sanitized = identifier.replace(/[^a-zA-Z0-9_]/g, '');
  if (sanitized !== identifier) {
    logger.warn('SQL identifier was sanitized', { original: identifier, sanitized });
  }
  return sanitized;
}

/**
 * Check for potential injection patterns
 */
export function detectInjectionPatterns(input: string): boolean {
  const patterns = [
    // SQL injection patterns
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|OR|AND)\b.*[=<>])/i,
    /(--|#|\/\*|\*\/)/,
    /('|")\s*(OR|AND)\s*('|"|\d)/i,

    // Command injection patterns
    /[;&|`$()]/,
    /\b(cat|ls|rm|chmod|chown|wget|curl|bash|sh)\b/i,

    // Path traversal patterns
    /\.\.[\/\\]/,

    // Script injection patterns
    /<script[\s>]/i,
    /javascript:/i,
    /on\w+\s*=/i,
  ];

  return patterns.some((pattern) => pattern.test(input));
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private readonly requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests
    const requests = this.requests.get(key) || [];

    // Filter to only requests in current window
    const validRequests = requests.filter((time) => time > windowStart);

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);

    return true;
  }

  getRemainingRequests(key: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const requests = this.requests.get(key) || [];
    const validRequests = requests.filter((time) => time > windowStart);
    return Math.max(0, this.maxRequests - validRequests.length);
  }

  reset(key: string): void {
    this.requests.delete(key);
  }
}

/**
 * Create secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (x) => chars[x % chars.length]).join('');
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(
  obj: Record<string, unknown>,
  sensitiveKeys: string[] = ['password', 'token', 'apiKey', 'secret', 'credential']
): Record<string, unknown> {
  const masked: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const isSensitive = sensitiveKeys.some(
      (k) => key.toLowerCase().includes(k.toLowerCase())
    );

    if (isSensitive && typeof value === 'string') {
      masked[key] = value.length > 4 ? `${value.slice(0, 2)}***${value.slice(-2)}` : '***';
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveData(value as Record<string, unknown>, sensitiveKeys);
    } else {
      masked[key] = value;
    }
  }

  return masked;
}
