# Security Documentation

## Overview

This document outlines the security measures implemented in the AI Marketing Swarms platform.

## Security Architecture

### 1. Input Validation

All user inputs are validated and sanitized using Zod schemas:

- **Campaign inputs**: Name, budget, dates, target audiences
- **Creative inputs**: Content, URLs, metadata
- **API payloads**: All external data is validated before processing

```typescript
import { validateCampaignInput, schemas } from './security';

const result = validateCampaignInput(userInput);
if (!result.valid) {
  throw new Error(`Invalid input: ${result.errors.join(', ')}`);
}
```

### 2. Injection Prevention

#### SQL Injection
- All database queries use parameterized queries
- Dynamic identifiers are sanitized via `sanitizeSqlIdentifier()`
- BigQuery queries use parameterized query format

#### XSS Prevention
- HTML content is sanitized via `sanitizeHtml()`
- All user-generated content is escaped before rendering

#### Command Injection
- Shell commands are never constructed from user input
- All paths are validated against traversal patterns

### 3. Secrets Management

Sensitive data is managed through the `SecretsManager`:

```typescript
import { createSecretsManager, SecretNames } from './security';

const secrets = createSecretsManager('production', 'project-id');
const apiKey = await secrets.getRequired(SecretNames.GOOGLE_ADS_API_KEY);
```

**Best Practices:**
- Never commit secrets to version control
- Use environment variables for development
- Use GCP Secret Manager for production
- Rotate secrets regularly

### 4. Audit Logging

All security-relevant events are logged:

```typescript
import { getAuditLogger } from './security';

const audit = getAuditLogger();

await audit.logDataAccess(
  { type: 'user', id: userId },
  { type: 'campaign', id: campaignId },
  'read'
);
```

**Logged Events:**
- Authentication attempts (success/failure)
- Authorization decisions
- Data access (read, export)
- Data modifications (create, update, delete)
- Configuration changes
- Security alerts

### 5. Rate Limiting

API endpoints are protected with rate limiting:

```typescript
import { RateLimiter } from './security';

const limiter = new RateLimiter(100, 60000); // 100 requests per minute

if (!limiter.isAllowed(userId)) {
  throw new Error('Rate limit exceeded');
}
```

### 6. Authentication & Authorization

- API keys are required for all external requests
- Service accounts use GCP IAM for authorization
- Agent-to-agent communication uses internal tokens
- All tokens have expiration times

## Security Checklist

### Development

- [ ] All inputs validated with Zod schemas
- [ ] Sensitive data masked in logs
- [ ] No secrets in source code
- [ ] Dependencies regularly updated
- [ ] Security tests passing

### Deployment

- [ ] HTTPS enabled (TLS 1.3)
- [ ] GCP Secret Manager configured
- [ ] Cloud Armor WAF enabled
- [ ] VPC Service Controls configured
- [ ] Audit logs exported to SIEM

### Operations

- [ ] Regular security audits
- [ ] Incident response plan tested
- [ ] Secret rotation scheduled
- [ ] Access reviews completed
- [ ] Penetration testing performed

## Reporting Security Issues

If you discover a security vulnerability, please report it to:

1. **Email**: security@example.com
2. **Do not** create public GitHub issues for security vulnerabilities

## Compliance

This platform is designed to support:

- **GDPR**: Data privacy and protection
- **SOC 2**: Security and availability
- **ISO 27001**: Information security management
- **PCI DSS**: Payment card data protection (if applicable)

## Dependencies

Security-relevant dependencies:

| Package | Purpose | Version |
|---------|---------|---------|
| zod | Input validation | ^3.23.8 |
| uuid | Secure ID generation | ^10.0.0 |
| pino | Structured logging | ^9.2.0 |

## Security Updates

| Date | Version | Description |
|------|---------|-------------|
| 2024-01-01 | 1.0.0 | Initial security implementation |
