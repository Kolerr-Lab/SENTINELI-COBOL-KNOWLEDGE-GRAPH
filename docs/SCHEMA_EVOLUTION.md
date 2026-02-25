# Schema Evolution Guide

## Overview
This document describes the schema evolution from the original format to the new enhanced format, including backwards compatibility measures.

## Schema Changes

### 1. Propagator Network: `edges` → `dataflows`

**Old Format:**
```json
{
  "propagator_network": {
    "variables": ["var1", "var2"],
    "edges": [
      { "from": "var1", "to": "var2", "type": "MOVE" }
    ]
  }
}
```

**New Format:**
```json
{
  "propagator_network": {
    "dataflows": [
      { "source": "var1", "target": "var2", "operation": "MOVE" }
    ]
  }
}
```

**Changes:**
- Removed `variables` array (redundant with dataflows)
- Renamed `edges` → `dataflows`
- Renamed `from/to` → `source/target`
- Renamed `type` → `operation`

**Backwards Compatibility:** The backend automatically normalizes both formats, so old analyses with `edges` will still render correctly.

---

### 2. Decision Tree: `children` → `branches` (Nested)

**Old Format:**
```json
{
  "decision_tree": {
    "root": "IF CREDIT-SCORE > 700",
    "branches": [
      { "condition": "true", "action": "APPROVE", "children": [...] }
    ]
  }
}
```

**New Format:**
```json
{
  "decision_tree": {
    "root": "IF CREDIT-SCORE > 700",
    "branches": [
      { 
        "condition": "true", 
        "action": "APPROVE", 
        "branches": [
          { "condition": "AMOUNT < 100K", "action": "AUTO-APPROVE", "branches": [] }
        ]
      }
    ]
  }
}
```

**Changes:**
- Renamed `children` → `branches` for consistency
- Supports deeply nested branches (recursive)

**Backwards Compatibility:** The backend normalizes `children` to `branches` automatically.

---

### 3. Business Rules: Objects → Strings

**Old Format:**
```json
{
  "business_rules": [
    { "rule_id": "BR001", "condition": "CREDIT-SCORE > 700", "action": "APPROVE" }
  ]
}
```

**New Format:**
```json
{
  "business_rules": [
    "Credit score above 700 triggers automatic approval",
    "Loan amount below 100K requires manager review"
  ]
}
```

**Changes:**
- Simplified to plain English strings instead of structured objects
- More readable for non-technical stakeholders

**Backwards Compatibility:** The backend converts objects to strings using their `condition` or `action` fields.

---

### 4. Dependencies: Enhanced Structure

**Old Format:**
```json
{
  "dependencies": {
    "called_programs": ["PROG1"],
    "datasets": ["FILE1"]
  }
}
```

**New Format:**
```json
{
  "dependencies": {
    "called_programs": ["PROG1", "PROG2"],
    "copybooks": ["CUSTOMER-RECORD"],
    "files": ["ACCTFILE", "TRANFILE"],
    "databases": ["CUSTOMER", "ACCOUNTS"]
  }
}
```

**Changes:**
- Added `copybooks` array for COBOL copybook dependencies
- Renamed `datasets` → `files` for clarity
- Added `databases` array for SQL table references (EXEC SQL)

**Warning System:** If `dependencies.databases` is empty in a COBOL file, a warning is added:
```json
{
  "warnings": [
    {
      "type": "MISSING_DB_DETECTION",
      "message": "Embedded SQL may not be detected - dependencies.databases is empty",
      "severity": "warning"
    }
  ]
}
```

---

## Database Schema Changes

### New Table Structure

The `knowledge_graph` table now stores **all analyses** (append-only), not just the latest per file:

```sql
CREATE TABLE knowledge_graph (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    analysis JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Extracted fields for fast queries
    cyclomatic_complexity INTEGER,
    logic_depth INTEGER,
    variable_count INTEGER,
    decision_points INTEGER,
    cost_usd DECIMAL(10, 8),
    tokens_used INTEGER,
    duration_ms INTEGER,
    ai_model VARCHAR(100)
);

CREATE INDEX idx_created_at ON knowledge_graph(created_at);
CREATE INDEX idx_file_name ON knowledge_graph(file_name);
CREATE INDEX idx_file_type ON knowledge_graph(file_type);
```

### Metrics View

Real-time metrics are calculated from the database using a PostgreSQL view:

```sql
CREATE OR REPLACE VIEW metrics_realtime AS
SELECT
    COUNT(*) as total_calls,
    COALESCE(SUM(duration_ms), 0) as total_processing_time_ms,
    COALESCE(AVG(duration_ms), 0) as average_processing_time_ms,
    COALESCE(SUM(tokens_used), 0) as total_tokens,
    COALESCE(SUM(cost_usd), 0) as total_cost_usd,
    COALESCE(AVG(cost_usd), 0) as average_cost_per_call,
    COALESCE(AVG(cyclomatic_complexity), 0) as average_cyclomatic_complexity,
    MIN(created_at) as first_analysis,
    MAX(created_at) as last_analysis
FROM knowledge_graph;
```

---

## API Changes

### GET `/api/metrics` - Now DB-backed

**Old Behavior:** Returned in-memory metrics that reset on server restart.

**New Behavior:** Queries database for persistent, accurate metrics.

**Response:**
```json
{
  "success": true,
  "metrics": {
    "totalCalls": 42,
    "totalProcessingTimeMs": 125340,
    "averageProcessingTimeMs": 2984.29,
    "totalTokens": 89234,
    "totalCostUSD": 0.223085,
    "averageCostPerCall": 0.005312,
    "totalCyclomaticComplexity": 1842,
    "averageCyclomaticComplexity": 43.86,
    "averageLogicDepth": 5.2,
    "averageVariableCount": 24.7,
    "averageDecisionPoints": 8.3,
    "firstAnalysis": "2026-02-26T10:30:00Z",
    "lastAnalysis": "2026-02-26T15:45:00Z",
    "aiProvider": "openai",
    "aiModel": "gpt-4o"
  }
}
```

### POST `/api/analyze` - Enhanced Response

**New Fields Added:**
- `warnings` array for issues detected (e.g., missing DB detection)
- Normalized schema (both old `edges` and new `dataflows` present for backwards compatibility)

---

## Frontend Changes

### Graph Visualization

The graph view now handles both formats:
1. Checks for `propagator_network.dataflows` first (new format)
2. Falls back to `propagator_network.edges` (old format)
3. Renders using `source→target` or `from→to` accordingly

### Dependencies Panel

Enhanced to show all dependency types:
- **Called Programs**: COBOL `CALL` statements
- **Copybooks**: `COPY` statements
- **Files**: DD statements, VSAM files, sequential files
- **Databases**: EXEC SQL table references

---

## Migration Guide

### Running the Migration

```bash
# Using Docker
docker exec -i kg_cobol_db psql -U admin -d kg_cobol_db < scripts/migrate-metrics.sql

# Or using local PostgreSQL
psql -U postgres -d sentineli_cobol_graph -f scripts/migrate-metrics.sql
```

### What It Does

1. Drops and recreates `knowledge_graph` table
2. Changes from `ON CONFLICT` overwrite to append-only inserts
3. Creates indexes for fast queries
4. Creates `metrics_realtime` view for aggregate calculations

### Data Loss Warning

⚠️ **This migration drops all existing analysis data.** If you need to preserve data:

```bash
# Backup before migration
pg_dump -U admin -d kg_cobol_db -t knowledge_graph > backup.sql

# Restore after migration (adapt as needed)
# psql -U admin -d kg_cobol_db < backup_transformed.sql
```

---

## Testing

Run the schema evolution test suite:

```bash
npm test tests/test_schema_evolution.js
```

This verifies:
1. ✅ New schema structure in analysis responses
2. ✅ DB-backed metrics endpoint
3. ✅ Graph endpoint builds from dataflows
4. ✅ Backwards compatibility with old schema
5. ✅ Warning system for missing dependencies

---

## Backwards Compatibility

All old analyses continue to work:
- Old `edges` → normalized to `dataflows` (and vice versa)
- Old `children` → normalized to `branches`
- Old business rule objects → converted to strings

**No breaking changes for existing integrations.**

---

## Summary

| Feature | Old | New |
|---------|-----|-----|
| Propagator edges | `edges: [{ from, to, type }]` | `dataflows: [{ source, target, operation }]` |
| Decision tree | `branches: [{ children: [...] }]` | `branches: [{ branches: [...] }]` |
| Business rules | Array of objects | Array of strings |
| Dependencies | `called_programs, datasets` | `called_programs, copybooks, files, databases` |
| Metrics storage | In-memory (volatile) | PostgreSQL (persistent) |
| Database writes | Overwrite per file | Append-only (all analyses) |
| Warning system | None | Detects missing DB detection, etc. |

---

## Questions?

Contact: Ricky Anh Nguyen  
Email: ricky@kolerr.dev  
GitHub: https://github.com/Kolerr/SENTINELI-COBOL-KNOWLEDGE-GRAPH
