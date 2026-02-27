# Security Advisory

## Current Known Vulnerabilities

### pm2 Regular Expression Denial of Service (CVE-2025-5891)

**Status:** ACCEPTED RISK - Monitoring for upstream fix  
**Severity:** Low (CVSS 2.1/10)  
**Date Identified:** February 27, 2026  
**Affected Versions:** pm2 <= 6.0.14 (all currently released versions)  
**GitHub Advisory:** [GHSA-x5gf-qvw8-r2rm](https://github.com/advisories/GHSA-x5gf-qvw8-r2rm)

#### Description
A Regular Expression Denial of Service (ReDoS) vulnerability exists in pm2's `/lib/tools/Config.js` file. The vulnerability affects inefficient regex parsing in the configuration system.

#### Impact Assessment
- **Attack Vector:** Network-based, requires authenticated access (low privileges)
- **Attack Complexity:** Low
- **Real-World Impact:** Minimal - pm2 is used for process management in controlled environments, not exposed to untrusted input
- **Availability Impact:** Low - potential for minor performance degradation under specific attack conditions
- **Confidentiality/Integrity:** None affected

#### Risk Acceptance Rationale
1. **Low Severity:** CVSS score of 2.1/10 represents minimal security impact
2. **Limited Exposure:** pm2 is used internally for process management, not exposed to public APIs
3. **Authentication Required:** Attack requires authenticated access with privileges
4. **No Fix Available:** pm2 maintainers have not released a patched version (as of v6.0.14)
5. **Upstream PR Exists:** [Unitech/pm2#5971](https://github.com/Unitech/pm2/pull/5971) is addressing the issue

#### Mitigation Measures
- **Access Control:** Ensure pm2 commands are only accessible to trusted administrators
- **Network Isolation:** pm2 management interfaces are not exposed to public networks
- **Monitoring:** Track [pm2 releases](https://github.com/Unitech/pm2/releases) for security patches
- **Update Policy:** Will upgrade to patched version immediately upon release

#### Review Schedule
This advisory will be reviewed:
- **Weekly:** Check for new pm2 releases
- **Upon Notification:** When GitHub Dependabot detects a fix is available
- **Before Major Releases:** Re-assess risk tolerance

#### References
- CVE-2025-5891: https://nvd.nist.gov/vuln/detail/CVE-2025-5891
- GitHub Advisory: https://github.com/advisories/GHSA-x5gf-qvw8-r2rm
- pm2 Repository: https://github.com/Unitech/pm2
- Security PR: https://github.com/Unitech/pm2/pull/5971

---

## Recently Resolved Vulnerabilities

### ✅ esbuild Development Server Request Vulnerability (GHSA-67mh-4wv8-2f99)
- **Fixed:** February 27, 2026
- **Solution:** Upgraded vite from 5.0.12 → 6.4.1 (includes patched esbuild)
- **Package:** dashboard/package.json
- **Severity:** Moderate
- **Impact:** Development-only vulnerability, not present in production builds

### ✅ minimatch ReDoS Vulnerabilities
- **Fixed:** February 27, 2026
- **Solution:** Applied `npm audit fix` to update minimatch dependencies
- **Package:** package.json (root)
- **Severity:** High (development dependency only)
- **Impact:** Build-time dependency, minimal production risk

---

## Security Review Process

### Continuous Monitoring
- **GitHub Dependabot:** Enabled for automatic vulnerability detection
- **npm audit:** Run during CI/CD pipeline on every commit
- **Monthly Reviews:** Security team reviews all dependencies quarterly

### Response Protocol
1. **Critical/High Severity:** Patch within 24 hours if fix available
2. **Moderate Severity:** Patch within 1 week, assess production impact
3. **Low Severity:** Patch within 30 days or accept risk with documentation
4. **No Fix Available:** Document as accepted risk, monitor for upstream fix

### Contact
For security concerns, please email: ricky@orchesity.com  
For vulnerability reports: https://github.com/Kolerr-Lab/SENTINELI-COBOL-KNOWLEDGE-GRAPH/security

---

**Last Updated:** February 27, 2026  
**Next Review:** March 6, 2026  
**Reviewed By:** Automated Security Audit System
