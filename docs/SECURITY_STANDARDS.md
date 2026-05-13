# Security Standards & 7-Step CI/CD Check

**Document Version:** 1.0.0  
**Last Updated:** May 13, 2026  
**Status:** ✅ Production-Ready  
**Author:** Kolerr Lab Engineering Team

---

## 🛡️ Overview

This document defines the comprehensive security standards and 7-step CI/CD quality gate implemented for the Sentineli COBOL Knowledge Graph platform. All code changes must pass these checks before merge to `main` or `develop` branches.

## 📊 Current Security Status

| Component | Status | Vulnerabilities | Last Scan |
|-----------|--------|----------------|-----------|
| Root Package | ✅ **0 vulnerabilities** | 0 Critical, 0 High, 0 Moderate, 0 Low | 2026-05-13 |
| Dashboard | ✅ **0 vulnerabilities** | 0 Critical, 0 High, 0 Moderate, 0 Low | 2026-05-13 |
| Rust Gateway | ✅ **Clean** | 0 security issues (5 warnings for unmaintained deps) | 2026-05-13 |

---

## 🔒 7-Step Security & Quality Gate

### **Step 1/7: Dependency Security Audit**

**Purpose:** Detect known vulnerabilities in third-party dependencies  
**Tools:** `npm audit`, `cargo audit`  
**Failure Criteria:** Any HIGH or CRITICAL severity vulnerability

**What it checks:**
- NPM dependencies (root + dashboard)
- Rust crates (gateway)
- Transitive dependencies
- Known CVEs in dependency tree

**Thresholds:**
```yaml
FAIL_ON_SEVERITY: high  # Block CI on HIGH+ severity
Daily Schedule: 2 AM UTC  # Proactive daily scans
```

**Actions on failure:**
1. Review vulnerability details
2. Update affected packages
3. If no fix available, add to risk register
4. Consider alternative packages

---

### **Step 2/7: Static Code Analysis (SAST)**

**Purpose:** Find security issues and code quality problems in source code  
**Tools:** ESLint (security plugin), Clippy, CodeQL, Prettier  
**Failure Criteria:** Any security rule violation or linting error

**What it checks:**
- JavaScript/TypeScript code quality
- Rust code quality & safety
- Security anti-patterns
- Code formatting consistency
- Common vulnerabilities (injection, XSS, etc.)

**ESLint Security Rules:**
```json
{
  "plugins": ["security"],
  "extends": ["plugin:security/recommended"],
  "rules": {
    "no-eval": "error",
    "no-implied-eval": "error",
    "security/detect-eval-with-expression": "error",
    "security/detect-non-literal-regexp": "warn",
    "security/detect-buffer-noassert": "error"
  }
}
```

**Rust Clippy:**
```bash
cargo clippy --all-targets --all-features -- -D warnings
```

---

### **Step 3/7: License Compliance Check**

**Purpose:** Ensure all dependencies comply with licensing requirements  
**Tools:** `license-checker`, manual validation  
**Failure Criteria:** Prohibited licenses detected

**Prohibited Licenses:**
- GPL-3.0 (strong copyleft)
- AGPL-3.0 (network copyleft)
- SSPL-1.0 (server-side public license)

**Allowed Licenses:**
- MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause
- ISC, CC0-1.0, Unlicense
- BUSL-1.1 (our own license)

**Reports Generated:**
- `license-report-root.json`
- `license-report-dashboard.json`

---

### **Step 4/7: Secret Scanning**

**Purpose:** Prevent accidental commit of credentials and secrets  
**Tools:** Gitleaks, custom regex patterns  
**Failure Criteria:** Any exposed secret found

**What it detects:**
- API keys, tokens, passwords
- Private keys, certificates
- Database connection strings
- OAuth tokens
- Cloud provider credentials
- Generic secrets (regex patterns)

**Configuration:**
```yaml
# .gitleaksignore
tests/**/*.test.js  # Ignore test files with fake credentials
docs/**/*.md        # Ignore documentation examples
.env.example        # Ignore example configs
```

**Custom Checks:**
- No `.env` files committed
- No hardcoded passwords in code
- No AWS/GCP/Azure keys in configs

---

### **Step 5/7: Advanced SAST (Snyk/Semgrep)**

**Purpose:** Deep security analysis with commercial-grade tools  
**Tools:** Snyk (primary), Semgrep (fallback)  
**Failure Criteria:** HIGH+ severity issues in application code

**Snyk Scans:**
1. **Open Source Dependencies** - Known vulnerabilities
2. **Code Analysis** - Custom vulnerability patterns
3. **Container Images** - Docker layer analysis
4. **IaC Security** - Kubernetes/Docker-Compose configs

**Semgrep Rules:**
- OWASP Top 10 patterns
- Language-specific vulnerabilities
- Framework-specific issues (Express, React, Actix)

**Exclusions:**
```yaml
exclude:
  - tests/**
  - coverage/**
  - node_modules/**
  - '**/*.test.js'
```

---

### **Step 6/7: Container Security Scan**

**Purpose:** Scan Docker images for OS/library vulnerabilities  
**Tools:** Trivy, Docker Scout  
**Failure Criteria:** CRITICAL severity in base images or dependencies

**Images Scanned:**
1. `sentineli:test` (main application)
2. `sentineli-dashboard:test` (frontend dashboard)
3. `sentineli-gateway:test` (Rust gateway)

**Trivy Configuration:**
```yaml
severity: CRITICAL,HIGH
format: sarif  # GitHub Security integration
exit-code: 0   # Report but don't block (review required)
```

**What it checks:**
- OS package vulnerabilities (Alpine/Ubuntu)
- Application dependency vulnerabilities
- Misconfigurations (exposed ports, root user)
- Secrets in image layers

**SARIF Reports:**
- Uploaded to GitHub Security tab
- Automatically tracked and triaged

---

### **Step 7/7: Test Coverage & Quality Gates**

**Purpose:** Ensure code quality and comprehensive test coverage  
**Tools:** Jest, Cargo Test, Codecov  
**Failure Criteria:** Coverage below 80% threshold

**Coverage Requirements:**
```javascript
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  }
}
```

**Test Suites:**
1. **Unit Tests** - Component-level testing
2. **Integration Tests** - API/database integration
3. **Rust Tests** - Gateway functionality
4. **COBOL Compilation** - Legacy code validation

**Services Required:**
- PostgreSQL 15 (test database)
- Redis (caching layer)
- GnuCOBOL (COBOL compiler)

**Quality Metrics:**
- Code coverage >= 80%
- All tests passing
- No critical TODO/FIXME in production code
- Database migrations successful

---

## 📋 Pre-Commit Checklist

Before pushing code, ensure:

- [ ] **All tests pass locally**
  ```bash
  npm test
  cd dashboard && npm test
  cd gateway && cargo test
  ```

- [ ] **No vulnerabilities**
  ```bash
  npm audit
  cd dashboard && npm audit
  cd gateway && cargo audit
  ```

- [ ] **Linting passes**
  ```bash
  npm run lint
  npm run format:check
  cargo clippy
  ```

- [ ] **No secrets in code**
  ```bash
  git diff | grep -i "password\|secret\|api_key"
  ```

- [ ] **Coverage threshold met**
  ```bash
  npm run test:coverage
  # Check coverage/lcov-report/index.html
  ```

---

## 🚨 Handling CI Failures

### **Step 1 Failure (Dependency Audit)**
1. Run `npm audit` or `cargo audit` locally
2. Update vulnerable packages: `npm audit fix`
3. If no fix available:
   - Check if vulnerability applies to your usage
   - Add to `.snyk` policy with justification
   - Create ticket to track resolution

### **Step 2 Failure (SAST)**
1. Fix linting errors: `npm run lint:fix`
2. Review security warnings carefully
3. Never disable security rules without approval
4. Format code: `npm run format`

### **Step 3 Failure (License Compliance)**
1. Identify problematic dependency
2. Find alternative with compatible license
3. Update package.json and reinstall
4. Document decision in CHANGELOG.md

### **Step 4 Failure (Secret Scanning)**
1. **STOP** - Do NOT push more commits
2. Remove secret from code immediately
3. Rotate the exposed credential
4. Use environment variables or secret manager
5. Add to `.gitignore` or `.gitleaksignore`

### **Step 5 Failure (Advanced SAST)**
1. Review Snyk/Semgrep findings
2. Prioritize by severity
3. Fix code vulnerabilities
4. Update dependencies if needed
5. Request security review for complex issues

### **Step 6 Failure (Container Scan)**
1. Check Trivy SARIF report in GitHub Security
2. Update base images: `FROM node:18-alpine` → `FROM node:20-alpine`
3. Rebuild images: `docker-compose build`
4. Re-scan locally: `trivy image sentineli:test`

### **Step 7 Failure (Quality Gates)**
1. Add missing tests for uncovered code
2. Fix failing tests
3. Check coverage report: `coverage/lcov-report/index.html`
4. Ensure >= 80% for all metrics

---

## 🔐 Security Best Practices

### **Secrets Management**
- ✅ Use `.env` files (never commit)
- ✅ Use environment variables in CI
- ✅ Use GitHub Secrets for sensitive data
- ✅ Rotate secrets every 90 days
- ❌ Never hardcode credentials
- ❌ Never log sensitive data

### **Dependency Management**
- ✅ Pin exact versions in `package-lock.json`
- ✅ Review dependency updates before applying
- ✅ Run `npm audit` before every release
- ✅ Use `npm ci` in CI (not `npm install`)
- ❌ Don't use wildcards in version ranges
- ❌ Don't ignore audit warnings

### **Code Practices**
- ✅ Validate all user inputs
- ✅ Use parameterized queries (prevent SQL injection)
- ✅ Sanitize HTML output (prevent XSS)
- ✅ Implement rate limiting on APIs
- ✅ Use HTTPS everywhere
- ✅ Enable CORS properly
- ❌ Never use `eval()` or `Function()`
- ❌ Never trust user input

### **Container Security**
- ✅ Use minimal base images (Alpine)
- ✅ Run as non-root user
- ✅ Scan images before deploy
- ✅ Update base images monthly
- ❌ Don't include build tools in production images
- ❌ Don't copy `.env` files into images

---

## 📈 Security Metrics & KPIs

| Metric | Target | Current |
|--------|--------|---------|
| **Vulnerability Count** | 0 | ✅ 0 |
| **Test Coverage** | >= 80% | TBD |
| **MTTR (Mean Time to Remediate)** | < 24h for HIGH | N/A |
| **Dependency Freshness** | < 90 days old | ✅ Fresh |
| **Security Scan Frequency** | Daily | ✅ Daily |
| **License Compliance** | 100% | ✅ 100% |
| **Secret Leaks** | 0 | ✅ 0 |

---

## 🔄 Continuous Improvement

### **Weekly**
- Review failed CI jobs
- Update dependencies
- Review security advisories

### **Monthly**
- Audit user access/permissions
- Review security logs
- Update security tooling
- Rotate development secrets

### **Quarterly**
- Full security assessment
- Penetration testing
- Compliance audit (SOC 2, MAS TRM)
- Update security policies

---

## 📞 Security Contacts

| Role | Responsibility | Contact |
|------|---------------|---------|
| **Security Lead** | Overall security posture | [security@kolerr-lab.com] |
| **DevSecOps** | CI/CD security implementation | [devops@kolerr-lab.com] |
| **Incident Response** | Security incident handling | [incidents@kolerr-lab.com] |

**Report Security Issues:**  
Email: security@kolerr-lab.com  
PGP Key: [Link to public key]  
Response SLA: < 24 hours

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Snyk Security Docs](https://snyk.io/learn/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [Rust Security Guidelines](https://anssi-fr.github.io/rust-guide/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

## ✅ Sign-Off

This security standard has been reviewed and approved for production use.

**Approved by:** Kolerr Lab Engineering Team  
**Date:** May 13, 2026  
**Next Review:** August 13, 2026

---

*Document maintained by Kolerr Lab Engineering. For updates, submit PR to `/docs/SECURITY_STANDARDS.md`.*
