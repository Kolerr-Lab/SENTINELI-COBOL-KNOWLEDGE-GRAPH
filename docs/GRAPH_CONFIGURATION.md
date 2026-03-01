# Knowledge Graph Configuration Guide

## Overview

The knowledge graph configuration system provides robust program name resolution, test file filtering, and edge type definitions for enterprise-grade COBOL modernization.

## Features

### 1. Program Name Resolution

Resolves mainframe program names (CALL/INVOKE statements) to actual file names using a comprehensive registry.

**Supported naming conventions:**
- **8-character limit**: `ACCMGMT` → `account_management.cob`
- **Hyphenated names**: `ACCOUNT-MGMT` → `account_management.cob`
- **Full descriptive**: `ACCOUNT-MANAGEMENT` → `account_management.cob`
- **Case-insensitive**: `accmgmt`, `AccMgmt`, `ACCMGMT` all resolve correctly

**Example:**
```javascript
const { resolveProgramName } = require('./src/bridge/config/graph.config');

// All resolve to: bank/account_management.cob
resolveProgramName('ACCMGMT');           
resolveProgramName('ACCOUNT-MGMT');      
resolveProgramName('ACCOUNT-MANAGEMENT'); 
```

### 2. Test File Filtering

Automatically excludes test files from production knowledge graphs using pattern matching.

**Exclusion patterns:**
- **Test prefix/suffix**: `test_*`, `*_test`, `*-test-*`
- **Spec files**: `spec_*`, `*.spec.*`
- **Mock files**: `mock_*`, `*_mock`
- **Demo/sample**: `demo_*`, `sample_*`, `example_*`
- **Temporary**: `temp_*`, `tmp_*`, `scratch_*`
- **Backups**: `*.bak`, `*.old`, `*.backup`

**Example:**
```javascript
const { isTestFile } = require('./src/bridge/config/graph.config');

isTestFile('test_program.cob');        // true
isTestFile('program_test.cob');        // true
isTestFile('account_management.cob');  // false
isTestFile('bank/fraud_detection.cob'); // false
```

### 3. Edge Type Definitions

Comprehensive edge metadata for graph visualization and analysis.

**Supported edge types:**

| Type | Description | Color | Strength |
|------|-------------|-------|----------|
| **CALLS** | COBOL CALL statement | #0066cc (Blue) | 0.9 |
| **INVOKES** | CICS transaction invocation | #00cccc (Cyan) | 0.85 |
| **EXECUTES** | JCL EXEC PGM | #00cc66 (Green) | 0.95 |
| **INCLUDES** | COPY/INCLUDE copybook | #cccc00 (Yellow) | 0.7 |
| **QUERIES** | SQL SELECT statement | #cc00cc (Magenta) | 0.8 |
| **READS** | File/VSAM READ | #ff9900 (Orange) | 0.75 |
| **WRITES** | File/Database WRITE | #ff0000 (Red) | 0.85 |
| **TRIGGERS** | Workflow/Event trigger | #9900cc (Purple) | 0.65 |
| **DEPENDS_ON** | Generic dependency (default) | #666666 (Gray) | 0.6 |

**Example:**
```javascript
const { getEdgeMetadata } = require('./src/bridge/config/graph.config');

const meta = getEdgeMetadata('CALLS');
// {
//   label: 'Calls',
//   color: '#0066cc',
//   strength: 0.9,
//   description: 'COBOL CALL statement'
// }
```

## API Reference

### `resolveProgramName(programName)`

Resolves a program name to its file path.

**Parameters:**
- `programName` (string): Program name from CALL statement

**Returns:**
- `string|null`: Resolved file path or null if not found

**Example:**
```javascript
resolveProgramName('FRAUDDET');
// Returns: 'bank/fraud_detection.cob'
```

---

### `isTestFile(fileName)`

Checks if a file should be excluded from production graphs.

**Parameters:**
- `fileName` (string): File name or path

**Returns:**
- `boolean`: True if file matches test exclusion patterns

**Example:**
```javascript
isTestFile('test_program.cob');  // true
isTestFile('fraud_detection.cob'); // false
```

---

### `getEdgeMetadata(edgeType)`

Gets visualization metadata for an edge type.

**Parameters:**
- `edgeType` (string): Edge type identifier (case-insensitive)

**Returns:**
- `object`: Metadata with `label`, `color`, `strength`, `description`

**Example:**
```javascript
getEdgeMetadata('CALLS');
// {
//   label: 'Calls',
//   color: '#0066cc',
//   strength: 0.9,
//   description: 'COBOL CALL statement'
// }
```

---

### `findFileByProgramName(programName, dbRows)`

Finds a database row by program name with intelligent fallback.

**Parameters:**
- `programName` (string): Program name to search for
- `dbRows` (Array): Array of database rows from `knowledge_graph` table

**Returns:**
- `object|null`: Matching row or null

**Example:**
```javascript
const rows = await pool.query('SELECT * FROM knowledge_graph');
const match = findFileByProgramName('ACCMGMT', rows.rows);
// Returns: { file_name: 'bank/account_management.cob', ... }
```

## Program Registry

### Banking Domain Programs

| 8-Char | Hyphenated | Full Name | File Path |
|--------|------------|-----------|-----------|
| `ACCMGMT` | `ACCOUNT-MGMT` | `ACCOUNT-MANAGEMENT` | `bank/account_management.cob` |
| `CREDSCOR` | `CREDIT-SCORE` | `CREDIT-SCORING` | `bank/credit_scoring.cob` |
| `FRAUDDET` | `FRAUD-DET` | `FRAUD-DETECTION` | `bank/fraud_detection.cob` |
| `INTCALC` | `INT-CALC` | `INTEREST-CALCULATOR` | `bank/interest_calculator.cob` |
| `TXNPROC` | `TXN-PROC` | `TRANSACTION-PROCESSOR` | `bank/transaction_processor.cob` |
| `PAYPROC` | `PAY-PROC` | `PAYMENT-PROCESSING` | `bank/payment_processing.cob` |
| `RISKASMT` | `RISK-ASMT` | `RISK-ASSESSMENT` | `bank/risk_assessment.cob` |
| `MORTGSVC` | `MORTG-SVC` | `MORTGAGE-SERVICING` | `bank/mortgage_servicing.cob` |
| `CREDCARD` | `CREDIT-CARD` | `CREDIT-CARD-PROC` | `bank/credit_card_processing.cob` |
| `PORTMGMT` | `PORT-MGMT` | `PORTFOLIO-MANAGEMENT` | `bank/portfolio_management.cob` |
| `COMPLRPT` | `COMPL-RPT` | `COMPLIANCE-REPORTING` | `bank/compliance_reporting.cob` |

### Main Programs

| Short Name | Full Name | File Path |
|------------|-----------|-----------|
| `LOANAPPR` | `LOAN-APPROVAL` | `loan_approval.cob` |
| `MAINPROG` | `MAIN` | `main.cob` |

## Adding New Programs

To add a new program to the registry:

1. Open `src/bridge/config/graph.config.js`
2. Add entries to `PROGRAM_REGISTRY`:

```javascript
const PROGRAM_REGISTRY = {
    // ... existing entries ...
    
    // Your new program
    'YOURPROG': 'your_program.cob',
    'YOUR-PROG': 'your_program.cob',
    'YOUR-PROGRAM': 'your_program.cob',
};
```

3. Restart the server:
```bash
docker compose restart kg-ai-cobol-modernize
```

## Usage Examples

### Example 1: Graph Builder

```javascript
// src/bridge/routes/graph.js
const { findFileByProgramName, isTestFile, getEdgeMetadata } = require('../config/graph.config');

// Filter test files
const nodes = dbRows
    .filter(row => !isTestFile(row.file_name))
    .map(row => ({ ... }));

// Resolve CALL statements
if (deps.called_programs) {
    deps.called_programs.forEach(calledProg => {
        const targetRow = findFileByProgramName(calledProg, dbRows);
        if (targetRow) {
            const edgeMeta = getEdgeMetadata('CALLS');
            edges.push({
                from: sourceIdx,
                to: targetIdx,
                type: 'CALLS',
                color: edgeMeta.color,
                strength: edgeMeta.strength
            });
        }
    });
}
```

### Example 2: Blast Radius Analyzer

```javascript
// src/bridge/analyzers/blast_radius.js
const { resolveProgramName } = require('../config/graph.config');

function findNode(identifier, knowledgeGraph) {
    // Try direct resolution
    const resolvedFile = resolveProgramName(identifier);
    if (resolvedFile) {
        return searchNodesByFile(resolvedFile, knowledgeGraph);
    }
    
    // Fallback to fuzzy search
    return fuzzySearch(identifier, knowledgeGraph);
}
```

## Testing

Run the configuration tests:

```bash
npm test -- tests/unit/graph.config.test.js
```

**Test coverage:**
- ✅ Program name resolution (all variants)
- ✅ Test file filtering (all patterns)
- ✅ Edge metadata retrieval
- ✅ Database row finding
- ✅ Integration scenarios

## Troubleshooting

### Program not resolving

**Problem:** `resolveProgramName('MYPROG')` returns `null`

**Solution:** Add the program to `PROGRAM_REGISTRY` in `graph.config.js`

---

### Test files appearing in graph

**Problem:** Test files showing up in production graphs

**Solution:** Ensure file names match exclusion patterns in `TEST_EXCLUSION_PATTERNS`

---

### Edge colors not appearing

**Problem:** All edges have default color

**Solution:** Use `getEdgeMetadata(edgeType)` to get color/strength values

## Performance Considerations

- **Program resolution**: O(1) dictionary lookup - extremely fast
- **Test filtering**: O(n) regex matching - runs per file
- **Edge metadata**: O(1) lookup - no performance impact

**Recommendations:**
- Registry supports 100+ programs with no performance degradation
- Test patterns optimized for common naming conventions
- Edge metadata cached internally by Node.js

## Security

The configuration system:
- ✅ Does not execute code
- ✅ Does not access filesystem
- ✅ Does not make network requests
- ✅ Pure data structure lookups
- ✅ Safe for multi-tenant environments

## Version History

**v1.0.0 (March 2026)**
- Initial release
- 11 banking programs registered
- 13 test exclusion patterns
- 9 edge types defined
- Comprehensive test coverage

---

**Author:** Ricky Anh Nguyen <ricky@orchesity.com>  
**Copyright:** 2026 OrchesityAI & Kolerr Lab  
**License:** MIT
