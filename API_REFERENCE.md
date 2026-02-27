# 📡 Sentineli - Complete API Reference

Complete documentation for all Sentineli API endpoints with examples, authentication, and error handling.

---

## 🌐 Base URL

```
Development: http://localhost:3000
Production:  https://your-domain.com
```

---

## 🔐 Authentication

Sentineli supports **two authentication methods**:

### 1. API Key (Recommended for server-to-server)

Add header to all protected requests:
```bash
X-API-Key: your-api-key-here
```

**Get API key:** Configure in `.env` file
```bash
API_KEYS=your-secret-key-here,another-key-here
```

---

### 2. JWT Token (For user sessions)

1. Obtain token from `/auth/login`
2. Add header:
```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📋 Endpoints Overview

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/health` | GET | ❌ No | System health check |
| `/api/metrics` | GET | ❌ No | System metrics |
| `/api/metrics/reset` | POST | ✅ Yes | Reset metrics |
| `/api/analyze` | POST | ❌ No | Ad-hoc COBOL analysis |
| `/api/analyze/:file` | POST | ✅ Yes | File-based analysis |
| `/api/run/:program` | POST | ✅ Yes | Execute COBOL program |
| `/api/impact` | POST | ✅ Yes | Impact analysis |
| `/api/impact/blast-radius/:identifier` | GET | ❌ No | Blast radius visualization |
| `/api/graph` | GET | ❌ No | Knowledge graph data |
| `/api/translate` | POST | ✅ Yes | Translate COBOL to modern languages |
| `/api/translate/languages` | GET | ❌ No | Get supported target languages |
| `/api/reports/compliance/:type` | POST | ✅ Yes | Generate compliance report |
| `/api/reports/types` | GET | ❌ No | Get available report types |
| `/api/system/status` | GET | ❌ No | System status (Dashboard) |

---

## 🔍 Endpoint Details

### 1. Health Check

**Get system health status**

```http
GET /health
```

**No authentication required**

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-25T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "ai": "enabled",
  "database": "healthy",
  "cache": "healthy"
}
```

**Example:**
```bash
curl http://localhost:3000/health
```

---

### 2. System Metrics

**Get aggregated LLM usage metrics**

```http
GET /api/metrics
```

**No authentication required**

**Response (200 OK):**
```json
{
  "success": true,
  "metrics": {
    "totalCalls": 42,
    "totalProcessingTimeMs": 328450,
    "averageProcessingTimeMs": 7820,
    "totalInputTokens": 52847,
    "totalOutputTokens": 18923,
    "totalTokens": 71770,
    "totalCostUSD": 0.321458,
    "averageCostPerCall": "0.0077",
    "sessionStartTime": "2026-02-24T02:54:25.180Z",
    "uptimeMinutes": 45
  }
}
```

**Example:**
```bash
curl http://localhost:3000/api/metrics
```

---

### 3. Reset Metrics

**Clear all metrics counters**

```http
POST /api/metrics/reset
```

**🔒 Authentication required**

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Metrics have been reset",
  "resetAt": "2026-02-25T10:30:00.000Z"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/metrics/reset \
  -H "X-API-Key: your-api-key"
```

---

### 4. Ad-hoc COBOL Analysis 🆕

**Analyze any COBOL code with AI - no file upload needed**

```http
POST /api/analyze
Content-Type: application/json
```

**No authentication required** (Public endpoint)

**Request Body:**
```json
{
  "program": "loan_approval",
  "code": "IDENTIFICATION DIVISION.\nPROGRAM-ID. LOAN-APPROVAL.\n..."
}
```

**Parameters:**
- `program` (string, required): Program identifier
- `code` (string, required): COBOL source code

**Response (200 OK):**
```json
{
  "success": true,
  "program": "loan_approval",
  "analysis": {
    "summary": "Banking loan approval system with multi-stage validation",
    "business_rules": [
      "Minimum age requirement: 18 years",
      "Income threshold: $30,000 annually"
    ],
    "data_flows": [
      "AGE -> Age validation -> Eligibility check",
      "INCOME -> Income validation -> Risk assessment"
    ]
  },
  "metadata": {
    "timestamp": "2026-02-25T10:30:00.000Z",
    "processing_time_ms": 3600,
    "model": "gpt-4o",
    "tokens_used": 2961,
    "tokens_input": 2670,
    "tokens_output": 291,
    "cost_usd": 0.009585
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "program": "test",
    "code": "IDENTIFICATION DIVISION.\nPROGRAM-ID. HELLO.\nPROCEDURE DIVISION.\n    DISPLAY \"Hello World\".\n    STOP RUN."
  }'
```

**Error (400 Bad Request):**
```json
{
  "success": false,
  "error": "Missing required fields: program or code"
}
```

**Error (500 Internal Server Error):**
```json
{
  "success": false,
  "error": "AI analysis failed",
  "details": "OpenAI API error message"
}
```

---

### 5. File-based COBOL Analysis

**Analyze COBOL file from server filesystem**

```http
POST /api/analyze/:file
```

**🔒 Authentication required**

**Path Parameters:**
- `file` (string): File path relative to `src/cobol/` directory

**Example:** `/api/analyze/bank/credit_card_processing.cob`

**Response (200 OK):**
```json
{
  "success": true,
  "program": "credit_card_processing",
  "file": "bank/credit_card_processing.cob",
  "analysis": {
    "summary": "Credit card transaction processing with fraud detection",
    "business_rules": [...],
    "data_flows": [...]
  },
  "metadata": {
    "timestamp": "2026-02-25T10:30:00.000Z",
    "processing_time_ms": 4200,
    "cached": false,
    "file_lines": 450,
    "file_size_bytes": 12800
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/analyze/bank/loan_approval.cob \
  -H "X-API-Key: your-api-key"
```

**Error (404 Not Found):**
```json
{
  "success": false,
  "error": "File not found: bank/nonexistent.cob"
}
```

---

### 6. Execute COBOL Program

**Run COBOL program with input variables**

```http
POST /api/run/:program
Content-Type: application/json
```

**🔒 Authentication required**

**Path Parameters:**
- `program` (string): Program name (e.g., `main`, `loan_approval`)

**Request Body:**
```json
{
  "AGE": "30",
  "INCOME": "50000",
  "CREDIT_SCORE": "720",
  "DEBT": "10000"
}
```

**Response (200 OK):**
```json
{
  "program": "main",
  "success": true,
  "duration": 14,
  "stdout": "FINAL STATUS: APPROVED (PRIME)\nAPPROVAL REASON: Excellent credit and income",
  "stderr": "",
  "exitCode": 0,
  "timestamp": "2026-02-25T10:30:00.000Z",
  "environment": {
    "AGE": "30",
    "INCOME": "50000",
    "CREDIT_SCORE": "720",
    "DEBT": "10000"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/run/main \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "AGE": "25",
    "INCOME": "45000",
    "CREDIT_SCORE": "680",
    "DEBT": "5000"
  }'
```

**Error (404 Not Found):**
```json
{
  "success": false,
  "error": "Program not found: nonexistent",
  "available": ["main", "loan_approval", "interest_calculator"]
}
```

**Error (500 Execution Failed):**
```json
{
  "program": "main",
  "success": false,
  "error": "Program execution failed",
  "stderr": "COBOL runtime error message",
  "exitCode": 1
}
```

---

### 7. Impact Analysis

**Analyze impact of code changes on the system**

```http
POST /api/impact
Content-Type: application/json
```

**🔒 Authentication required**

**Request Body:**
```json
{
  "field": "CUSTOMER-ID",
  "changeType": "TYPE_CHANGE",
  "from": "PIC 9(6)",
  "to": "PIC X(10)"
}
```

**Parameters:**
- `field` (string, required): Field name being changed
- `changeType` (string, required): Type of change
- `from` (string, optional): Current value/type
- `to` (string, optional): New value/type

**Response (200 OK):**
```json
{
  "field": "CUSTOMER-ID",
  "changeType": "TYPE_CHANGE",
  "affectedPrograms": [
    "CUSTOMER-LOOKUP",
    "ORDER-PROCESSING",
    "INVOICE-GENERATION"
  ],
  "riskLevel": "HIGH",
  "estimatedEffort": "8-12 hours",
  "recommendations": [
    "Update all copybooks referencing CUSTOMER-ID",
    "Test end-to-end customer flows",
    "Update database schema if persisted"
  ],
  "dependencies": [
    {
      "program": "CUSTOMER-LOOKUP",
      "type": "DIRECT_USAGE",
      "location": "Line 125-130"
    }
  ]
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/impact \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "ACCOUNT-BALANCE",
    "changeType": "TYPE_CHANGE",
    "from": "PIC 9(7)V99",
    "to": "PIC 9(9)V99"
  }'
```

---

### 7a. Blast Radius Visualization

**Analyze change impact with recursive dependency tracking and cost analysis**

```http
GET /api/impact/blast-radius/:identifier?maxDepth=3
```

**No authentication required**

**Path Parameters:**
- `identifier` (string, required): Program, function, or data structure name

**Query Parameters:**
- `maxDepth` (number, optional): Maximum recursion depth (default: 3, max: 10)

**Response (200 OK):**
```json
{
  "success": true,
  "found": true,
  "identifier": "CALCULATE-INTEREST",
  "impact": {
    "totalNodes": 12,
    "totalEdges": 15,
    "maxDepth": 3,
    "riskLevel": "HIGH",
    "riskScore": "6.38"
  },
  "cost": {
    "totalMIPS": 10750,
    "monthlyCostUSD": "43000.00",
    "annualCostUSD": "516000.00",
    "impactedMIPSPercentage": "100.00"
  },
  "breakdown": {
    "byLanguage": {
      "COBOL": {"count": 8, "mips": 6600},
      "DB2": {"count": 1, "mips": 450},
      "VSAM": {"count": 1, "mips": 300},
      "JCL": {"count": 1, "mips": 2500},
      "CICS": {"count": 1, "mips": 900}
    },
    "byDepth": [
      {"depth": 0, "nodeCount": 1},
      {"depth": 1, "nodeCount": 4},
      {"depth": 2, "nodeCount": 5},
      {"depth": 3, "nodeCount": 2}
    ]
  },
  "nodes": [
    {
      "id": "CALCULATE-INTEREST",
      "type": "COBOL",
      "mips": 800,
      "depth": 0,
      "riskScore": 10,
      "description": "Interest calculation procedure"
    }
  ],
  "edges": [
    {
      "from": "CALCULATE-INTEREST",
      "to": "INTEREST-RATE-TABLE",
      "type": "reads",
      "weight": 1
    }
  ],
  "graph": {
    "nodes": [...],
    "edges": [...],
    "layout": "3d-force-directed"
  },
  "metadata": {
    "timestamp": "2026-02-28T10:30:00.000Z",
    "depth": 3,
    "traversalTimeMs": 45
  }
}
```

**Example:**
```bash
curl "http://localhost:3000/api/impact/blast-radius/CALCULATE-INTEREST?maxDepth=3"
```

**Error (404 Not Found):**
```json
{
  "success": true,
  "found": false,
  "identifier": "NONEXISTENT",
  "message": "Identifier not found in knowledge graph"
}
```

**Use Cases:**
- Visualize change impact before modifying code
- Quantify MIPS cost of touching a component
- Identify all systems affected by a change
- Generate 3D force-directed graphs for stakeholder presentations
- Risk assessment for change management

---

### 8. Knowledge Graph

**Get program dependency graph data**

```http
GET /api/graph
```

**No authentication required**

**Response (200 OK):**
```json
{
  "success": true,
  "graph": {
    "nodes": [
      {
        "id": "loan_approval",
        "type": "program",
        "complexity": 7,
        "lines": 245
      },
      {
        "id": "credit_check",
        "type": "subroutine",
        "complexity": 3,
        "lines": 89
      }
    ],
    "edges": [
      {
        "source": "loan_approval",
        "target": "credit_check",
        "type": "CALL"
      }
    ]
  },
  "stats": {
    "totalNodes": 12,
    "totalEdges": 18,
    "avgComplexity": 4.2
  }
}
```

**Example:**
```bash
curl http://localhost:3000/api/graph
```

---

### 9. Code Translation

**Translate COBOL code to modern languages with Z3 verification**

```http
POST /api/translate
Content-Type: application/json
```

**🔒 Authentication required**

**Request Body:**
```json
{
  "code": "IDENTIFICATION DIVISION.\nPROGRAM-ID. HELLO.\nPROCEDURE DIVISION.\n    DISPLAY 'HELLO WORLD'.\n    STOP RUN.",
  "targetLanguage": "python",
  "verify": true
}
```

**Parameters:**
- `code` (string, required): COBOL source code
- `targetLanguage` (string, required): Target language (`python`, `java`, `typescript`, `javascript`, `csharp`, `go`)
- `verify` (boolean, optional): Enable Z3 formal verification (default: true)

**Response (200 OK):**
```json
{
  "success": true,
  "translation": {
    "language": "python",
    "code": "def main():\n    print('HELLO WORLD')\n\nif __name__ == '__main__':\n    main()",
    "verified": true
  },
  "verification": {
    "status": "VERIFIED",
    "confidence": 0.95,
    "proofGenerated": true,
    "details": "Z3 proof: behavioral equivalence verified"
  },
  "cost": {
    "inputTokens": 150,
    "outputTokens": 85,
    "totalCostUSD": "0.0021"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/translate \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "COMPUTE TOTAL = PRICE * QUANTITY.",
    "targetLanguage": "python",
    "verify": true
  }'
```

---

### 10. Get Supported Languages

**List all supported target languages for translation**

```http
GET /api/translate/languages
```

**No authentication required**

**Response (200 OK):**
```json
{
  "success": true,
  "languages": [
    {"id": "python", "name": "Python", "maturity": "production"},
    {"id": "java", "name": "Java", "maturity": "production"},
    {"id": "typescript", "name": "TypeScript", "maturity": "stable"},
    {"id": "javascript", "name": "JavaScript", "maturity": "stable"},
    {"id": "csharp", "name": "C#", "maturity": "beta"},
    {"id": "go", "name": "Go", "maturity": "beta"}
  ]
}
```

---

### 11. Generate Compliance Report

**Generate regulatory compliance report with Z3 proofs**

```http
POST /api/reports/compliance/:type
Content-Type: application/json
```

**🔒 Authentication required**

**Path Parameters:**
- `type` (string, required): Report type (`sox`, `basel`, `occ`, `sec`, `banking`)

**Request Body:**
```json
{
  "program": "loan_approval",
  "options": {
    "includeProofs": true,
    "format": "html"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "report": {
    "type": "sox",
    "title": "SOX 404 - Internal Controls Assessment",
    "program": "loan_approval",
    "generatedAt": "2026-02-28T10:30:00.000Z",
    "sections": {
      "executiveSummary": "...",
      "formalVerification": "100% of business rules formally verified",
      "complianceStatus": "COMPLIANT",
      "riskAssessment": "LOW (Z3 proof confirms correctness)",
      "auditTrail": [...],
      "recommendations": [...]
    },
    "html": "<!DOCTYPE html>...",
    "proofsIncluded": true,
    "z3Proofs": [
      {
        "rule": "interest_calculation",
        "status": "verified",
        "smtlib": "(declare-const rate Real)..."
      }
    ]
  },
  "metadata": {
    "reportId": "sox-loan_approval-20260228",
    "version": "1.0",
    "generationTimeMs": 2340
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/reports/compliance/sox \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "program": "loan_approval",
    "options": {"includeProofs": true, "format": "html"}
  }'
```

---

### 12. Get Report Types

**List all available compliance report types**

```http
GET /api/reports/types
```

**No authentication required**

**Response (200 OK):**
```json
{
  "success": true,
  "count": 5,
  "reportTypes": [
    {
      "id": "sox",
      "name": "SOX 404 - Internal Controls Assessment",
      "authority": "SEC (U.S. Securities and Exchange Commission)",
      "focus": "Financial reporting controls and IT general controls"
    },
    {
      "id": "basel",
      "name": "Basel III - Capital & Risk Management",
      "authority": "Basel Committee on Banking Supervision",
      "focus": "Credit risk, operational risk, model validation"
    },
    {
      "id": "occ",
      "name": "OCC - Federal Banking Examination",
      "authority": "Office of the Comptroller of the Currency",
      "focus": "Safety and soundness, IT risk management"
    },
    {
      "id": "sec",
      "name": "SEC - Financial Reporting Controls",
      "authority": "Securities and Exchange Commission",
      "focus": "Accuracy of financial data processing"
    },
    {
      "id": "banking",
      "name": "General Banking Regulatory Compliance",
      "authority": "Multiple (Fed, ECB, FSA, etc.)",
      "focus": "Comprehensive banking system verification"
    }
  ]
}
```

---

### 13. System Status (Dashboard)

**Get comprehensive system status for dashboard**

```http
GET /api/system/status
```

**No authentication required**

**Response (200 OK):**
```json
{
  "status": "healthy",
  "uptime": 3600,
  "timestamp": "2026-02-25T10:30:00.000Z",
  "system": {
    "memory": {
      "used": "125 MB",
      "total": "512 MB"
    },
    "cpu": {
      "usage": "15%"
    }
  },
  "services": {
    "ai": "enabled",
    "database": "healthy",
    "cache": "healthy"
  },
  "metrics": {
    "totalCalls": 42,
    "totalCostUSD": 0.32,
    "averageResponseTime": 3600
  }
}
```

**Example:**
```bash
curl http://localhost:3000/api/system/status
```

---

## �❌ Error Responses

All endpoints follow consistent error format:

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation error message",
  "details": {
    "field": "program",
    "issue": "Required parameter missing"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Authentication required",
  "message": "Please provide X-API-Key header or Authorization token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Invalid API key",
  "message": "The provided API key is not valid"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Resource not found",
  "resource": "Program 'nonexistent' does not exist"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "retryAfter": 60,
  "message": "Please wait 60 seconds before trying again"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "An unexpected error occurred",
  "requestId": "req_1234567890"
}
```

---

## ⚡ Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/analyze` (public) | 100 requests | 1 hour |
| `/api/run/:program` | 10,000 requests | 15 minutes |
| `/api/*` (authenticated) | 50,000 requests | 15 minutes |
| `/api/*` (public) | 200 requests | 15 minutes |

**Rate limit headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1614556800
```

---

## 🧪 Testing Endpoints

### Using curl
```bash
# Health check
curl http://localhost:3000/health

# Analyze COBOL
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"program":"test","code":"..."}'

# Execute program with auth
curl -X POST http://localhost:3000/api/run/main \
  -H "X-API-Key: demo-api-key-sentineli-2026" \
  -H "Content-Type: application/json" \
  -d '{"AGE":"30","INCOME":"50000"}'
```

### Using JavaScript (fetch)
```javascript
// Analyze COBOL code
const response = await fetch('http://localhost:3000/api/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    program: 'loan_approval',
    code: 'IDENTIFICATION DIVISION...'
  })
});

const result = await response.json();
console.log(result.analysis);
```

### Using Python (requests)
```python
import requests

# Execute COBOL program
response = requests.post(
    'http://localhost:3000/api/run/main',
    headers={
        'X-API-Key': 'demo-api-key-sentineli-2026',
        'Content-Type': 'application/json'
    },
    json={
        'AGE': '30',
        'INCOME': '50000',
        'CREDIT_SCORE': '720',
        'DEBT': '10000'
    }
)

print(response.json())
```

---

## 📚 Additional Resources

- [Quick Start Guide](QUICKSTART.md) - Get up and running
- [Enterprise Demo](docs/ENTERPRISE_DEMO.md) - Advanced features
- [Z3 Verification Guide](docs/Z3_VERIFICATION_GUIDE.md) - Formal proofs
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues

---

## 💬 Support

- 🐛 [Report Issues](https://github.com/Kolerr-Lab/sentineli/issues)
- 💡 [Request Features](https://github.com/Kolerr-Lab/sentineli/discussions)
- 📧 Email: ricky@orchesity.com

---

**Built with ❤️ by Ricky Anh Nguyen | OrchesityAI & Kolerr Lab**
