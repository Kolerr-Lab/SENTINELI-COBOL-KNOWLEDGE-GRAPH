# Real-World COBOL Source Code Repository

This directory contains production-quality COBOL code from renowned open-source projects, cloned for comprehensive testing of the SENTINELI COBOL Knowledge Graph system.

**Clone Date**: March 2, 2026  
**Purpose**: Stress-test the system with real mainframe codebases featuring CALL statements, DB2 interactions, VSAM, JCL, and complex enterprise patterns.

---

## Repository Summary

| Repository | Files | LOC | License | Focus Area |
|------------|-------|-----|---------|------------|
| IBM Stock Trader | 1 COBOL + 2 CPY + 3 JCL | 317 | Apache 2.0 ✅ | CICS/COBOL + DB2 + VSAM |
| Open Mainframe Project | 7 COBOL + 43 JCL | 1,022 | CC-BY-4.0 ✅ | Educational Labs + Advanced Topics |
| Multi-platform | 28 COBOL | 1,798 | GPL-3.0 ✅ | AS400 + OpenCOBOL/GnuCOBOL |
| **TOTAL** | **36 COBOL** | **3,137** | **All OSS** | **Enterprise Banking & Finance** |

**Additional Files**: 2 copybooks, 46 JCL files

---

## 1. IBM Stock Trader - Cash Account (COBOL)

### Source Information
- **Repository**: https://github.com/IBMStockTrader/cash-account-cobol
- **License**: Apache License 2.0
- **Author**: IBM Stock Trader Team (John Alcorn @jwalcorn)
- **Last Update**: October 2025 (5 months ago)
- **Stars**: 8 | **Forks**: 8
- **Local Path**: `src/cobol/real-world/ibm-stock-trader/`

### Why This Repository?
✅ **Production-grade IBM code** - Real banking logic from IBM's Stock Trader application  
✅ **CICS/COBOL integration** - Enterprise transaction processing  
✅ **DB2 for z/OS** - Complex embedded SQL patterns  
✅ **VSAM caching layer** - File system integration  
✅ **z/OS Connect exposure** - Modern API integration patterns  
✅ **Security patterns** - JWT/KeyCloak/LDAP/RACF authentication  
✅ **Mainframe modernization showcase** - "Integrate with" architecture pattern  

### Code Statistics
- **COBOL Programs**: 1 (CASH00.cbl)
- **Copybooks**: 2 (DCLCASH.cpy, DCLFRANK.cpy)
- **JCL Jobs**: 3 (DB2BIND.jcl, DB2DDL.jcl, DEFKSDS.jcl)
- **Total LOC**: 317 lines

### Key Features
- CICS transaction management
- DB2 embedded SQL (SELECT, INSERT, UPDATE)
- VSAM KSDS (Key-Sequenced Data Set) operations
- OpenAPI signature conformance
- Production-ready error handling

### Technical Complexity
**HIGH** - Enterprise-scale banking application with:
- Multi-tier architecture (CICS → DB2 → VSAM)
- External API exposure via z/OS Connect
- Enterprise security integration
- Mainframe-cloud hybrid patterns

### License Compliance Notes
Apache 2.0 allows:
- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Patent use
- ⚠️ Requires: License and copyright notice, state changes

---

## 2. Open Mainframe Project - COBOL Programming Course

### Source Information
- **Repository**: https://github.com/openmainframeproject/cobol-programming-course
- **License**: Creative Commons Attribution 4.0 International (CC-BY-4.0)
- **Author**: Open Mainframe Project (Linux Foundation)
- **Contributors**: 28 contributors (Mike Bauer, IBM, American River College)
- **Last Update**: February 2025 (1 month ago)
- **Stars**: 3,500 | **Forks**: 677
- **Local Path**: `src/cobol/real-world/open-mainframe/`

### Why This Repository?
✅ **Official Open Mainframe Project** - Industry-standard training materials  
✅ **IBM collaboration** - Built by IBM + American River College  
✅ **Comprehensive curriculum** - 4 complete courses (Getting Started → Testing)  
✅ **DB2 advanced topics** - Course #3 includes DB2 integration labs  
✅ **Real-world labs** - Practical exercises with actual business logic  
✅ **Active maintenance** - Updated Feb 2025, 3.2.0 release  
✅ **Massive adoption** - 3.5K stars, used by thousands of learners  

### Code Statistics
- **COBOL Programs**: 7 (CBL files)
- **JCL Scripts**: 43 (job control scripts)
- **Total LOC**: 1,022 lines
- **Languages**: 74% COBOL, 19.8% JCL, 6.2% TeX

### Repository Structure
```
COBOL Programming Course #1 - Getting Started/
COBOL Programming Course #2 - Learning COBOL/
COBOL Programming Course #3 - Advanced Topics/
    ├── Labs/cbl/ (CBLDB21.cbl, CBLDB22.cbl, CBLDB23.cbl - DB2 integration)
    └── Challenges/Debugging/cbl/ (CBL0106.cbl, CBL0106C.cbl - bug fixing)
COBOL Programming Course #4 - Testing/
    └── Labs/cbl/ (EMPPAY.CBL, DEPTPAY.CBL - payroll processing)
```

### Key Features
- Employee payroll system (EMPPAY, DEPTPAY)
- DB2 database integration (CBLDB21-23)
- Debugging challenges
- Testing methodologies
- Industry best practices

### Technical Complexity
**MEDIUM** - Educational but with realistic business logic:
- Structured programming patterns
- File I/O operations
- Database access patterns
- Error handling techniques
- Testing frameworks

### License Compliance Notes
CC-BY-4.0 allows:
- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use
- ⚠️ Requires: Attribution (credit to Open Mainframe Project)

---

## 3. Martinfx/Cobol - Multi-platform COBOL Examples

### Source Information
- **Repository**: https://github.com/Martinfx/Cobol
- **License**: GNU General Public License v3.0 (GPL-3.0)
- **Author**: Martin Fecko (@Martinfx)
- **Contributors**: 3 (Michal Slota, Ondrej Beranek)
- **Last Update**: October 2019 (archived project)
- **Stars**: 102 | **Forks**: 35
- **Local Path**: `src/cobol/real-world/multi-platform/`

### Why This Repository?
✅ **Multi-platform coverage** - AS400 ILE COBOL + OpenCOBOL/GnuCOBOL  
✅ **Diverse patterns** - Database, games, sorting, memory operations  
✅ **AS400 examples** - ILE COBOL, ILE CL, Physical/Logical files, Display files  
✅ **SQLite integration** - Embedded database examples  
✅ **Algorithm implementations** - Sorting, data structures  
✅ **Compiler diversity** - Tests multiple COBOL dialects  

### Code Statistics
- **COBOL Programs**: 28 (OpenCOBOL + AS400)
- **Total LOC**: 1,798 lines
- **Languages**: 92% COBOL, 5.2% C, 2.8% CLIPS

### Repository Structure
```
AS400/
    ├── CL_examples/ (Control Language)
    ├── COBOL_examples/ (ILE COBOL programs)
    ├── QCBLLESRC/ (COBOL source members)
    └── QDDSSRC/ (DDS - Data Description Specifications)
OpenCobol/
    ├── Database/ (StatusCode, OpenFile, SequentialRead)
    ├── Memory/ (Pointer, Address operations)
    ├── Sort/ (BubbleSort, InsertSort, SelectSort)
    ├── Date/ (DateAndTime)
    ├── SQLite/ (Hello_SQLITE)
    ├── Struct/ (Data structures)
    ├── Conditions/ (ConditionNameCondition, ClassCondition)
    ├── Games/ (Game implementations)
    ├── Loops/ (Loop patterns)
    └── String/ (String manipulation)
```

### Key Features
- **OpenCOBOL/GnuCOBOL examples**:
  - File I/O (sequential, indexed, relative)
  - SQLite database integration
  - Sorting algorithms
  - Memory/pointer operations
  - Date/time handling
  - Data structures
  
- **AS400 ILE COBOL**:
  - ILE (Integrated Language Environment) programs
  - Control Language (CL) examples
  - DDS file definitions
  - Display files (DSPF)
  - Physical files (PF)
  - Logical files (LF)

### Technical Complexity
**LOW to MEDIUM** - Educational examples with practical algorithms:
- Classic computer science algorithms in COBOL
- Cross-platform compilation patterns
- Database integration techniques
- AS400/iSeries specific patterns

### License Compliance Notes
GPL-3.0 requires:
- ✅ Source code disclosure for distributed modifications
- ✅ License and copyright notice
- ✅ State changes
- ✅ Same license for derivatives
- ⚠️ Note: Copyleft license - any modifications must also be GPL-3.0

---

## License Compatibility Matrix

All three repositories use OSS-approved licenses compatible with SENTINELI (Apache 2.0):

| Source License | Compatible with Apache 2.0 | Notes |
|----------------|----------------------------|-------|
| Apache 2.0 | ✅ YES | Same license, fully compatible |
| CC-BY-4.0 | ✅ YES | Attribution-only, no copyleft |
| GPL-3.0 | ⚠️ PARTIAL | Can use for testing; derivatives must be GPL if distributed |

### Usage Guidelines
1. **IBM Stock Trader (Apache 2.0)**: Can integrate freely, just maintain notices
2. **Open Mainframe (CC-BY-4.0)**: Can use freely, provide attribution
3. **Multi-platform (GPL-3.0)**: Use for testing/analysis; don't distribute modified GPL code as part of Apache-licensed project

---

## Testing Strategy

### Phase 1: Baseline Analysis
- [x] Clone repositories (March 2, 2026)
- [ ] Analyze IBM Stock Trader (production-grade complexity)
- [ ] Analyze Open Mainframe samples (educational patterns)
- [ ] Analyze Multi-platform examples (compiler diversity)

### Phase 2: Feature Detection
Target patterns to validate:
- ✅ **CALL statements** - Cross-program dependencies
- ✅ **DB2 embedded SQL** - EXEC SQL blocks
- ✅ **VSAM operations** - File system integration
- ✅ **JCL integration** - Batch processing
- ✅ **Copybooks** - COPY statements
- ✅ **CICS commands** - Transaction processing
- ✅ **Complex data structures** - 01-level hierarchies

### Phase 3: Stress Testing
- Concurrent analysis of all 36 COBOL programs
- Graph generation with 100+ nodes
- Cross-program CALL resolution
- Performance benchmarking (LOC/second)
- Memory usage under load

### Phase 4: Edge Case Validation
- Different COBOL dialects (IBM Enterprise, ILE, GnuCOBOL)
- AS400 specific syntax
- Nested COPY statements
- EXEC SQL with host variables
- Conditional compilation

---

## Repository Metrics Summary

### File Count by Type
```
COBOL Programs (.cbl, .cob, .CBL, .COB): 36
Copybooks (.cpy, .CPY):                    2
JCL Scripts (.jcl, .JCL):                 46
Total Mainframe Files:                    84
```

### Lines of Code Distribution
```
IBM Stock Trader:       317 LOC (10.1%)
Open Mainframe:       1,022 LOC (32.6%)
Multi-platform:       1,798 LOC (57.3%)
──────────────────────────────────────
TOTAL:               3,137 LOC (100%)
```

### Complexity Distribution
```
HIGH complexity:     1 repo  (IBM Stock Trader)
MEDIUM complexity:   1 repo  (Open Mainframe)
LOW-MEDIUM:          1 repo  (Multi-platform)
```

### Code Origin
```
Production code (IBM):           1 repo
Educational (Open Mainframe):    1 repo  
Community examples:              1 repo
──────────────────────────────────────
Enterprise patterns:             3 repos
```

---

## Technical Highlights

### What Makes These Repositories Ideal for Testing?

1. **Diverse COBOL Dialects**
   - IBM Enterprise COBOL (z/OS)
   - AS400 ILE COBOL (IBM i)
   - GnuCOBOL (open-source)

2. **Real Database Integrations**
   - DB2 for z/OS (embedded SQL)
   - SQLite (C interface)
   - VSAM (mainframe file system)

3. **Enterprise Patterns**
   - CICS transaction processing
   - JCL batch orchestration
   - Copybook modularization
   - CALL statement dependencies

4. **Complexity Range**
   - Simple algorithms (sorting, loops)
   - Medium business logic (payroll)
   - Complex enterprise apps (banking)

5. **License Diversity**
   - Permissive (Apache 2.0)
   - Attribution (CC-BY-4.0)
   - Copyleft (GPL-3.0)

---

## Acknowledgments

### IBM Stock Trader
Built by IBM Stock Trader team for mainframe modernization demonstrations.  
See: https://medium.com/cloud-journey-optimization/bridging-the-chasm-between-cloud-native-and-the-mainframe-b87a2ed77742

### Open Mainframe Project
Collaborative effort between:
- Open Mainframe Project (Linux Foundation)
- IBM Corporation
- American River College

Used by thousands of learners worldwide. Available on:
- IBM Digital Learning Platform
- Coursera
- Pluralsight
- YouTube

### Martinfx/Cobol
Community-maintained COBOL examples by Martin Fecko and contributors, demonstrating COBOL's versatility across platforms.

---

## Contact & Support

For issues with:
- **IBM Stock Trader**: https://github.com/IBMStockTrader/cash-account-cobol/issues
- **Open Mainframe**: https://github.com/openmainframeproject/cobol-programming-course/issues
- **Multi-platform**: https://github.com/Martinfx/Cobol/issues

For SENTINELI analysis issues: See main project documentation.

---

**Last Updated**: March 2, 2026  
**SENTINELI Version**: 1.x  
**Cloned By**: SENTINELI COBOL Knowledge Graph System
