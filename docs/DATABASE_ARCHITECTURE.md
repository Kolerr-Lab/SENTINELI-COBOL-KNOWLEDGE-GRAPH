# 🏗️ Database Schema Architecture

## Hybrid Schema Design

Sentineli uses a **hybrid dual-table schema** to balance performance with enterprise compliance requirements.

### Tables

#### 1. `knowledge_graph` - Current State
**Purpose:** Fast graph queries and latest analysis lookups  
**Guarantee:** Exactly 1 row per unique file (enforced by UNIQUE constraint)

```sql
CREATE TABLE knowledge_graph (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(255) UNIQUE NOT NULL,  -- ← UNIQUE enforced
    file_type VARCHAR(50),
    latest_analysis JSONB NOT NULL,
    cyclomatic_complexity INTEGER,
    logic_depth INTEGER,
    variable_count INTEGER,
    decision_points INTEGER,
    first_analyzed_at TIMESTAMP,           -- When first analyzed
    last_analyzed_at TIMESTAMP,            -- Last analysis timestamp
    analysis_count INTEGER DEFAULT 1,      -- Number of times analyzed
    total_cost_usd DECIMAL(10, 8),        -- Cumulative OpenAI costs
    latest_ai_model VARCHAR(100)
);
```

**Used by:**
- GET /api/graph (visualizations)
- GET /api/metrics (dashboards)
- Any query needing "current state"

---

#### 2. `analysis_history` - Complete Audit Trail
**Purpose:** Preserve every analysis run for compliance and analytics  
**Guarantee:** Never loses data (append-only)

```sql
CREATE TABLE analysis_history (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,  -- ← Can have duplicates
    file_type VARCHAR(50),
    analysis JSONB NOT NULL,
    cyclomatic_complexity INTEGER,
    logic_depth INTEGER,
    variable_count INTEGER,
    decision_points INTEGER,
    cost_usd DECIMAL(10, 8),          -- Cost for THIS run
    tokens_used INTEGER,
    duration_ms INTEGER,
    ai_model VARCHAR(100),
    analyzed_at TIMESTAMP DEFAULT NOW()
);
```

**Used by:**
- Cost tracking over time
- Performance trend analysis
- Compliance audits (SOX 404, Basel III)
- "Show me all versions" queries

---

### Why This Design?

#### Alternative 1: Single Table with Duplicates ❌
**Problem:** Graph queries slow (need deduplication)
```sql
-- Slow: Must deduplicate 30 rows → 13 nodes
SELECT * FROM knowledge_graph ORDER BY created_at DESC LIMIT 100
```

#### Alternative 2: Single Table with UPSERT ❌
**Problem:** Lose historical data, can't track costs
```sql
-- On re-analysis, old data is GONE
INSERT ... ON CONFLICT DO UPDATE
```

#### Our Solution: Hybrid Schema ✅
**Benefits:**
1. **Fast Queries:** Graph builder reads deduplicated data directly
2. **Audit Trail:** Every analysis preserved for compliance
3. **Analytics:** Track cost trends, performance improvements
4. **Enterprise-Ready:** Meets SOX 404, Basel III requirements
5. **Zero Data Loss:** Historical runs never deleted

---

### How It Works

#### On Analysis (POST /api/analyze):
```javascript
async function storeAnalysis(pool, fileName, fileType, analysis) {
    // 1. INSERT into analysis_history (audit trail)
    await pool.query(`
        INSERT INTO analysis_history (...) 
        VALUES (...)
    `);
    
    // 2. UPSERT into knowledge_graph (current state)
    await pool.query(`
        INSERT INTO knowledge_graph (...) 
        VALUES (...)
        ON CONFLICT (file_name) DO UPDATE SET
            latest_analysis = ...,
            analysis_count = analysis_count + 1,
            total_cost_usd = total_cost_usd + ...
    `);
}
```

#### On Graph Query (GET /api/graph):
```javascript
// Fast: Pre-deduplicated by UNIQUE constraint
const result = await pool.query(`
    SELECT file_name, latest_analysis 
    FROM knowledge_graph
    ORDER BY last_analyzed_at DESC
`);
```

---

### Migration

**From single-table to hybrid:**
```bash
node scripts/migrate-to-hybrid-schema.js
```

**What it does:**
1. Creates `analysis_history` table
2. Copies all existing data to `analysis_history`
3. Recreates `knowledge_graph` with UNIQUE constraint
4. Populates `knowledge_graph` with latest analysis per file
5. Creates performance indexes

**Safe:** Uses transactions (ROLLBACK on error), no data loss

---

### For Contributors

#### Adding New Analysis Fields

**1. Update both table schemas:**
```sql
-- In scripts/migrate.js
ALTER TABLE knowledge_graph ADD COLUMN new_field TYPE;
ALTER TABLE analysis_history ADD COLUMN new_field TYPE;
```

**2. Update storeAnalysis():**
```javascript
// src/bridge/utils/dbMetrics.js
await client.query(`
    INSERT INTO analysis_history (..., new_field) 
    VALUES (..., $12)
`, [..., newFieldValue]);
```

#### Querying Historical Data

```javascript
// Get all analyses for a file (cost tracking)
const history = await pool.query(`
    SELECT cost_usd, analyzed_at 
    FROM analysis_history 
    WHERE file_name = $1 
    ORDER BY analyzed_at DESC
`, [fileName]);

// Calculate cost trends
const costTrend = history.rows.map(r => ({
    date: r.analyzed_at,
    cost: r.cost_usd
}));
```

---

### Performance Characteristics

| Operation | Table | Index Used | Speed |
|-----------|-------|------------|-------|
| Graph visualization | `knowledge_graph` | PRIMARY KEY | O(1) lookup |
| Latest analysis | `knowledge_graph` | `file_name` UNIQUE | O(1) |
| Cost history | `analysis_history` | `idx_ah_file_name` | O(log n) |
| Trend analysis | `analysis_history` | `idx_ah_analyzed_at` | O(log n) |

**Space Complexity:**
- Avg analysis size: ~5KB (JSONB)
- 1000 files, 10 runs each: ~50MB total
- `knowledge_graph`: ~5MB (latest only)
- `analysis_history`: ~45MB (all runs)

---

### Schema Evolution Strategy

**Version 1.0 (Current):** Hybrid schema
**Future:** Add materialized views for analytics

```sql
-- Planned for v1.1
CREATE MATERIALIZED VIEW analysis_trends AS
SELECT 
    file_name,
    DATE_TRUNC('day', analyzed_at) as day,
    AVG(cost_usd) as avg_cost,
    AVG(duration_ms) as avg_duration
FROM analysis_history
GROUP BY file_name, day;
```

---

### References

- Original discussion: `/tmp/graph_persistence_investigation.md`
- Migration script: `scripts/migrate-to-hybrid-schema.js`
- Implementation: `src/bridge/utils/dbMetrics.js:80`
