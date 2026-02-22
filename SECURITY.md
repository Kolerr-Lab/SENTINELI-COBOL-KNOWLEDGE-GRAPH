# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

The Orchesity Neural-Core team takes security vulnerabilities seriously. We appreciate your efforts to responsibly disclose your findings.

### How to Report a Security Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report security vulnerabilities by email to:

**[security@kolerr-lab.com]** (or your designated security contact)

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

### What to Include in Your Report

Please include the following information in your report:

- **Type of vulnerability** (e.g., SQL injection, XSS, authentication bypass)
- **Full paths of source file(s)** related to the vulnerability
- **Location of the affected source code** (tag/branch/commit or direct URL)
- **Step-by-step instructions** to reproduce the issue
- **Proof-of-concept or exploit code** (if possible)
- **Impact of the issue** - what can an attacker do?
- **Any potential mitigations** you've identified

### Our Commitment

When you report a vulnerability, we commit to:

- **Acknowledge receipt** within 48 hours
- **Provide an initial assessment** within 5 business days
- **Keep you informed** of progress toward resolution
- **Credit you** in the security advisory (if desired)
- **Notify you** when the vulnerability is fixed

### Disclosure Policy

- **Coordinated disclosure:** We ask that you give us a reasonable amount of time to fix the vulnerability before public disclosure
- **Typical timeline:** 90 days from initial report to public disclosure
- **Expedited fixes:** Critical vulnerabilities will be prioritized
- **Security advisories:** We will publish security advisories on GitHub

### Security Update Process

1. **Vulnerability reported** to security team
2. **Assessment and reproduction** of the issue
3. **Fix developed** and tested internally
4. **Security patch released** with minimal details
5. **Security advisory published** after users have time to update
6. **Credit given** to reporter in advisory

## Security Best Practices for Users

### API Security

- **Always use HTTPS** in production
- **Keep your API keys secret** - never commit to version control
- **Rotate API keys regularly**
- **Use environment variables** for all secrets
- **Enable rate limiting** to prevent abuse

### Authentication

- **Enable authentication** in production (JWT or API keys)
- **Use strong secrets** for JWT signing (min 256-bit)
- **Implement token expiration** and refresh mechanisms
- **Never transmit credentials** over unencrypted connections

### Docker/Container Security

- **Run containers as non-root user** when possible
- **Keep base images updated** regularly
- **Scan images for vulnerabilities** (use Trivy, Snyk, etc.)
- **Limit container capabilities** and resources
- **Use secrets management** (Docker secrets, K8s secrets, Vault)

### Database Security

- **Use strong passwords** for database accounts
- **Limit database user privileges** (principle of least privilege)
- **Enable SSL/TLS** for database connections
- **Regular backups** with encryption
- **Keep PostgreSQL updated** with security patches

### Network Security

- **Use firewalls** to restrict access
- **Limit exposed ports** to only what's necessary
- **Use VPN or bastion hosts** for administrative access
- **Enable CORS** with specific origins (not wildcard)
- **Implement rate limiting** at multiple layers

### COBOL Security

- **Validate all inputs** before processing
- **Sanitize file paths** to prevent directory traversal
- **Use parameterized queries** when interfacing with databases
- **Limit program execution** to whitelisted programs only
- **Audit COBOL program execution** logs

## Known Security Considerations

### OpenAI API Integration

- **API key exposure risk:** Keys are passed via environment variables
- **Mitigation:** Never log API keys, use secrets management
- **Data privacy:** Code sent to OpenAI for analysis
- **Consideration:** Don't send sensitive/proprietary code without approval

### COBOL Execution

- **Arbitrary code execution risk:** `/run/:program` endpoint can execute binaries
- **Mitigation:** Implement program whitelist, authentication required
- **Input validation:** Always validate environment variables passed to COBOL
- **Sandbox consideration:** Consider containerization per execution

### Database Access

- **SQL injection risk:** Parameterized queries used but validate inputs
- **Mitigation:** Input validation, prepared statements, least privilege
- **Connection security:** Use SSL/TLS for production databases

### Redis Cache

- **Data exposure:** Cached data may contain sensitive information
- **Mitigation:** Use Redis AUTH, enable SSL/TLS, set appropriate TTLs
- **Memory limits:** Configure maxmemory and eviction policies

## Security Tools and Scanning

We recommend running these security tools regularly:

### Dependency Scanning
```bash
# Check for vulnerable dependencies
npm audit

# Fix automatically (carefully review changes)
npm audit fix
```

### Container Scanning
```bash
# Scan Docker images with Trivy
trivy image kg-ai-cobol-modernize:latest
```

### Secret Scanning
```bash
# Scan for accidentally committed secrets
git secrets --scan

# Or use truffleHog
trufflehog git file://. --only-verified
```

### Static Analysis
```bash
# ESLint security plugin
npm install --save-dev eslint-plugin-security

# Run security-focused linting
eslint --plugin security .
```

## Security Hardening Checklist

- [ ] API authentication enabled
- [ ] Rate limiting configured
- [ ] HTTPS/TLS enabled
- [ ] Security headers configured (Helmet.js)
- [ ] Input validation on all endpoints
- [ ] CORS properly configured
- [ ] Secrets in environment variables (not code)
- [ ] Database using SSL/TLS
- [ ] Redis AUTH enabled
- [ ] Containers running as non-root
- [ ] Container image scanning enabled
- [ ] Dependency scanning in CI/CD
- [ ] Audit logging enabled
- [ ] Error messages don't leak system info
- [ ] File path validation implemented
- [ ] Program execution whitelist configured

## Compliance

While this project is open source, users implementing it in regulated environments should consider:

- **GDPR:** Data privacy if processing EU citizen data
- **HIPAA:** Healthcare data protection (if applicable)
- **PCI DSS:** Payment card data security (if applicable)
- **SOC 2:** Security controls for service organizations
- **ISO 27001:** Information security management

Each deployment should undergo appropriate security assessment for their use case.

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [COBOL Security Guidelines](https://www.ibm.com/docs/en/cobol-zos)

## Contact

For security concerns or questions:
- **Email:** [security contact]
- **PGP Key:** [if applicable]

## Acknowledgments

We thank the security researchers and community members who help keep Orchesity Neural-Core secure.

Security researchers who responsibly disclose vulnerabilities will be credited in:
- Security advisories
- Release notes
- This document (if desired)

---

**Last Updated:** February 22, 2026
