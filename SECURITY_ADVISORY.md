# Security Advisory

## Current Known Vulnerabilities

### pm2 Regular Expression Denial of Service (CVE-2025-5891) ✅

**Status:** RESOLVED - Applied fix from PR #6079  
**Severity:** Low (CVSS 2.1/10)  
**Date Identified:** February 27, 2026  
**Date Resolved:** February 27, 2026  
**GitHub Advisory:** [GHSA-x5gf-qvw8-r2rm](https://github.com/advisories/GHSA-x5gf-qvw8-r2rm)

#### Description
A Regular Expression Denial of Service (ReDoS) vulnerability existed in pm2's `/lib/tools/Config.js` file due to inefficient regex parsing in the configuration system.

#### Resolution
**Applied Fix:** Installed pm2 directly from GitHub branch with tokenizer-based parsing instead of regex.

- **Source:** `github:dbankier/pm2#master` (commit 3c58b3aa)
- **Pull Request:** [Unitech/pm2#6079](https://github.com/Unitech/pm2/pull/6079)
- **Fix Method:** Replaced regex-based parser with tokenizer in `lib/tools/Config.js`
- **Function:** `tokenizePm2ConfigArrayString()` replaces vulnerable regex pattern
- **Verification:** Code inspection confirms tokenizer implementation present

#### Why npm audit Still Shows Vulnerability
npm audit reports vulnerabilities based on package version numbers. Since no official pm2 release contains the fix yet (latest is 6.0.14), npm audit will continue showing the vulnerability even though our code has the patch applied.

**Evidence the fix is applied:**
```bash
$ grep tokenizePm2ConfigArrayString node_modules/pm2/lib/tools/Config.js
function tokenizePm2ConfigArrayString(input) {
  value = tokenizePm2ConfigArrayString(value);
```

#### Status Notes
- ✅ Fix applied and verified in codebase
- ⚠️ npm audit still reports issue (version-based detection)
- ⏳ Waiting for official pm2 release to clear Dependabot alert
- 📝 Will switch to official version when released

#### References
- CVE-2025-5891: https://nvd.nist.gov/vuln/detail/CVE-2025-5891
- GitHub Advisory: https://github.com/advisories/GHSA-x5gf-qvw8-r2rm
- Applied Fix PR: https://github.com/Unitech/pm2/pull/6079
- Original PR #5971: https://github.com/Unitech/pm2/pull/5971 (had issues, fixed by #6079)
- pm2 Repository: https://github.com/Unitech/pm2

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
