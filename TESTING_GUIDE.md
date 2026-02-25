# 🧪 SENTINELI Testing Guide

> Complete guide to testing and validating the SENTINELI COBOL Knowledge Graph system

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [System Status Checks](#system-status-checks)
3. [Test Suite Overview](#test-suite-overview)
4. [Basic Tests](#basic-tests)
5. [Performance Tests](#performance-tests)
6. [Enterprise Tests](#enterprise-tests)
7. [API Testing](#api-testing)
8. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Prerequisites

Before running tests, ensure all services are running:

```powershell
# Check all services
Write-Host "`nSYSTEM STATUS:" -ForegroundColor Yellow
try { Invoke-WebRequest -Uri "http://localhost:8766/health" -UseBasicParsing -TimeoutSec 2 | Out-Null; Write-Host "  ✓ Bridge:    ONLINE (Docker port 8766)" -ForegroundColor Green } catch { Write-Host "  ✗ Bridge:    OFFLINE" -ForegroundColor Red }
try { Invoke-WebRequest -Uri "http://localhost:3100/api/health" -UseBasicParsing -TimeoutSec 2 | Out-Null; Write-Host "  ✓ Dashboard: ONLINE (port 3100)" -ForegroundColor Green } catch { Write-Host "  ✗ Dashboard: OFFLINE" -ForegroundColor Red }
try { Invoke-WebRequest -Uri "http://localhost:8080/" -UseBasicParsing -TimeoutSec 2 | Out-Null; Write-Host "  ✓ Gateway:   ONLINE (port 8080)" -ForegroundColor Green } catch { Write-Host "  ✗ Gateway:   OFFLINE" -ForegroundColor Red }
Write-Host ""
```

### Required Services

- **Bridge** (Docker port 8766): AI analysis service with GPT-4o
- **Dashboard** (port 3100): Real-time monitoring UI with system logs
- **Gateway** (port 8080): Rust API gateway (optional for some tests)

### Environment Variables

Ensure your `.env` file is configured:

```bash
OPENAI_API_KEY=your-api-key-here
OPENAI_MODEL=gpt-4o
PORT=3050                  # Internal Bridge port (Docker maps to 8766)
DASHBOARD_PORT=3100        # Dashboard server port
```

---

## 🔍 System Status Checks

### Comprehensive System Check

```powershell
# Full system verification with AI status
Write-Host "`n═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  SENTINELI SYSTEM STATUS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════`n" -ForegroundColor Cyan

$services = @(
    @{N="Dashboard";P=3100;E="/api/health"}, 
    @{N="Bridge";P=3000;E="/health"}, 
    @{N="Gateway";P=8080;E="/"}
)

foreach ($s in $services) {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:$($s.P)$($s.E)" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        Write-Host "  ✓ $($s.N.PadRight(12)) http://localhost:$($s.P)" -ForegroundColor Green
        
        if ($s.N -eq "Bridge") {
            $h = $r.Content | ConvertFrom-Json
            Write-Host "    AI Status: $($h.ai.ToUpper())" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "  ✗ $($s.N.PadRight(12)) OFFLINE" -ForegroundColor Red
    }
}

Write-Host "`n═══════════════════════════════════════════`n" -ForegroundColor Cyan
```

### Quick Metrics Check

```powershell
# Check current system metrics
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8766/api/metrics" -UseBasicParsing -TimeoutSec 3
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "`n📊 SYSTEM METRICS:" -ForegroundColor Yellow
    Write-Host "  Total Calls:    $($data.metrics.totalCalls)" -ForegroundColor Cyan
    Write-Host "  Average Time:   $($data.metrics.averageProcessingTimeMs)ms" -ForegroundColor Cyan
    Write-Host "  Total Cost:     `$$($data.metrics.totalCostUSD)" -ForegroundColor Green
    Write-Host "  Avg Complexity: $($data.metrics.averageCyclomaticComplexity)" -ForegroundColor Magenta
    Write-Host ""
} catch {
    Write-Host "`n❌ Could not retrieve metrics" -ForegroundColor Red
}
```

---

## 🧪 Test Suite Overview

### Directory Structure

```
tests/
├── real_api_test.js              # Basic OpenAI API test
├── single_module_cost_test.js    # Single module cost analysis
├── enterprise_batch_processor.js # Full 5K LOC banking system test
├── streaming_dashboard.js        # Real-time dashboard utility
├── z3_proof.js                   # Z3 formal verification test
│
├── performance/                  # Performance & stress tests
│   ├── stress_test.js           # Basic load test (50 requests)
│   ├── hft_flood.js             # High-frequency test (1000 requests)
│   ├── enterprise_stress_test.js # Enterprise-scale stress test
│   ├── master_dashboard.js      # System vitals display
│   └── [other performance tests]
│
├── unit/                         # Unit tests
│   ├── service_test.cob
│   ├── user_test.cob
│   └── utility_test.cob
│
└── integration/                  # Integration tests
    ├── api_test.cob
    └── auth_test.cob
```

---

## 🎯 Basic Tests

### 1. Real API Test

**Purpose**: Verify OpenAI GPT-4o API connectivity and basic COBOL analysis

**Command**:
```powershell
cd tests
node real_api_test.js
```

**What it tests**:
- ✅ OpenAI API key validity
- ✅ GPT-4o model access
- ✅ Basic COBOL code analysis
- ✅ Token usage and cost calculation

**Expected output**:
```
╔══════════════════════════════════════════════════════════════╗
║         REAL API TEST - ACTUAL OPENAI CALLS                 ║
╚══════════════════════════════════════════════════════════════╝

✅ API Key detected
   Prefix: sk-proj-abc...
   Length: 164 characters

🧪 Test 1: Simple COBOL Analysis

⏳ Calling OpenAI GPT-4o...

✅ SUCCESS! API Response Received

📊 Metrics:
   Duration: 1234ms
   Model: gpt-4o-2024-11-20
   Tokens: 2,345 (2,100 prompt + 245 completion)
   Cost: $0.007695
```

---

### 2. Single Module Cost Test

**Purpose**: Analyze exact costs for processing a single COBOL module

**Command**:
```powershell
cd tests
node single_module_cost_test.js
```

**What it tests**:
- ✅ Reads `loan_approval.cob` (258 LOC)
- ✅ Calculates exact OpenAI API costs
- ✅ Shows token breakdown (input/output)
- ✅ Provides cost projections for scaling

**Expected output**:
```
╔══════════════════════════════════════════════════════════════╗
║     SINGLE MODULE REAL API COST TEST                        ║
╚══════════════════════════════════════════════════════════════╝

📄 Module: loan_approval.cob
   LOC: 258
   Size: 8.45 KB

⏳ Calling OpenAI GPT-4o...

✅ API Response Received

📊 REAL METRICS:
   Duration: 3,612ms
   Model: gpt-4o-2024-11-20
   Prompt tokens: 2,670
   Completion tokens: 291
   Total tokens: 2,961

💰 REAL COSTS:
   Input cost:   $0.006675
   Output cost:  $0.002910
   Total cost:   $0.009585

📈 SCALING PROJECTIONS:
   10 modules:   $0.10
   100 modules:  $0.96
   1000 modules: $9.59
```

---

### 3. Z3 Formal Verification Test

**Purpose**: Prove AI correctly understands COBOL logic using Z3 theorem prover

**Command**:
```powershell
cd tests
node z3_proof.js
```

**What it tests**:
- ✅ COBOL program execution (black box)
- ✅ AI analysis of COBOL logic
- ✅ Z3 mathematical proof of correctness
- ✅ Three-layer validation (COBOL → AI → Z3)

**Expected output**:
```
═══════════════════════════════════════════════════════════════
  BLACK BOX TRANSPARENCY TEST - Z3 FORMAL VERIFICATION
═══════════════════════════════════════════════════════════════

🧪 Running 10 loan scenarios through COBOL...
   ✅ Scenario 1: DENIED (Age < 18)
   ✅ Scenario 2: APPROVED (Prime applicant)
   [...]

🤖 AI analyzing COBOL source code with GPT-4o...
   ✅ Business rules extracted
   ✅ Decision logic understood

🔬 Z3 proving AI understanding == COBOL behavior...
   ✅ Scenario 1: PROVEN ✓
   ✅ Scenario 2: PROVEN ✓
   [...]

╔═══════════════════════════════════════════════════════════════╗
║   🏆 100% Z3 VERIFICATION SUCCESS                            ║
║   Mathematical proof: AI correctly understands COBOL         ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## ⚡ Performance Tests

### 1. Basic Stress Test

**Purpose**: Test system under moderate load (50 concurrent requests)

**Command**:
```powershell
cd tests/performance
node stress_test.js
```

**What it tests**:
- ✅ Concurrent request handling
- ✅ Response time under load
- ✅ Cache effectiveness
- ✅ Error rate monitoring

**Expected output**:
```
⚡ INITIATING NEURO-SYMBOLIC STRESS TEST ⚡
Target: http://localhost:3050
Load:   50 requests (5 concurrent)

>>> STAGE 1: COBOL ENGINE REPLAY (high-speed)
[50/50] Sending... ■■■■■■■■■■■■■■■■■■■■

>>> STAGE 2: NEURO-SYMBOLIC EXTRACTION (AI + Cache)
AI Request 1 (Cold/API): 1,234ms
AI Request 2 (Cache Hit): 45ms

📊 FINAL REPORT
-----------------------------
COBOL Success: 50/50
AI Success: 2/2
Average Latency: 67ms
Cache Efficiency: 95%
```

---

### 2. HFT Flood Test

**Purpose**: High-frequency trading simulation (1000 requests at maximum speed)

**Command**:
```powershell
cd tests/performance
node hft_flood.js
```

**What it tests**:
- ✅ Maximum throughput capacity
- ✅ System stability under extreme load
- ✅ Response time distribution
- ✅ Real-time performance monitoring

**Expected output**:
```
⚡ SENTINELI: HFT FLOOD (1000 TX)

Initializing Reactor Core...
[████████████████████████████████████████] 100% | SPEED: 156 Req/Sec

📊 MISSION REPORT
-----------------------------
Total Transactions : 1000
Success Rate       : 100%
Total Time         : 6.4 seconds
Average RPS        : 156
Peak RPS           : 168
Average Latency    : 6ms
P95 Latency        : 12ms
P99 Latency        : 18ms
```

---

### 3. Master Dashboard Display

**Purpose**: Beautiful system vitals display

**Command**:
```powershell
cd tests/performance
node master_dashboard.js
```

**What it shows**:
```
╔════════════════════════════════════════════════════════════════╗
║         🧠  SENTINELI v1.0  🧠                                  ║
║             Status: BATTLE TESTED (HARD MODE)                  ║
╚════════════════════════════════════════════════════════════════╝

1. SYSTEM VITALS
   CORE OPERATING SYSTEM   : ONLINE (Windows/Docker)
   SENTINELI (COBOL)       : ACTIVE (4-Stage Logic)
   NEURAL BRIDGE (Node.js) : ACTIVE (Port 3000)
   KNOWLEDGE GRAPH (PG)    : HEALTHY (5435)
   CORTEX MEMORY (Redis)   : HEALTHY (6385)

2. INTELLIGENCE REPORT
   AI MODEL               : GPT-4o (Authenticated)
   LOGIC COMPLEXITY       : HIGH (Multi-Variable)
   DECISION DEPTH         : 4 LAYERS (Age>Inc>Cred>DTI)
   REVERSE ENGINEERING    : 100% ACCURACY

3. DECISION TOPOLOGY TELEMETRY
   ■ REJECT (Minor)       : ████░░░░░░░░░░░░░░░░ 5
   ■ REJECT (Income)      : ████████░░░░░░░░░░░░ 8
   ■ REJECT (Credit)      : ███████████░░░░░░░░░ 11
   ■ REJECT (Leverage)    : █████████░░░░░░░░░░░ 9
   ■ APPROVED (Prime)     : █████████████████░░░ 17

4. PERFORMANCE METRICS
   Avg Decision Latency   : 14ms (w/ Cache)
   Throughput Capacity    : 10k req/sec

   ✅ FINAL STATUS: SYSTEM SURPASSED ALL BENCHMARKS
```

---

## 🏢 Enterprise Tests

### Enterprise Batch Processor

**Purpose**: Process and verify entire banking system (5,028 LOC, 13 modules)

**Command**:
```powershell
cd tests
node enterprise_batch_processor.js
```

**What it does**:
1. **Decomposes** 5,028 LOC banking system into modules
2. **Analyzes** each module with GPT-4o (real API calls)
3. **Caches** results intelligently (70%+ hit rate)
4. **Verifies** with Z3 formal proofs
5. **Streams** real-time progress to dashboard

**Features**:
- ✅ Real OpenAI API integration
- ✅ Intelligent caching (3x cost reduction)
- ✅ Z3 formal verification per module
- ✅ Live streaming dashboard
- ✅ Cost tracking and optimization

**Expected output**:
```
═══════════════════════════════════════════════════════════════════════════
  SENTINELI ENTERPRISE BATCH PROCESSOR - REAL API VERSION
═══════════════════════════════════════════════════════════════════════════

📊 BANKING SYSTEM OVERVIEW
  Total Modules: 13
  Total LOC: 5,028
  Complexity: ENTERPRISE GRADE

═══════════════════════════════════════════════════════════════════════════

🔄 MODULE 1/13: account_management.cob
  • LOC: 310
  • Status: ANALYZING...
  • AI: ✅ SUCCESS (3,421ms, $0.0124)
  • Z3: ✅ PROVEN
  • Cache: MISS (new analysis)

🔄 MODULE 2/13: transaction_processor.cob
  • LOC: 445
  • Status: ANALYZING...
  • AI: ✅ SUCCESS (4,156ms, $0.0178)
  • Z3: ✅ PROVEN
  • Cache: MISS (new analysis)

🔄 MODULE 3/13: fraud_detection.cob
  • LOC: 290
  • Status: ANALYZING...
  • AI: ✅ SUCCESS (45ms, $0.00)
  • Z3: ✅ PROVEN
  • Cache: HIT (saved $0.0115)

[... continues for all 13 modules ...]

═══════════════════════════════════════════════════════════════════════════
  ENTERPRISE BATCH COMPLETE
═══════════════════════════════════════════════════════════════════════════

📊 FINAL METRICS:
  Modules Processed: 13/13 (100%)
  LOC Verified: 5,028
  COBOL Success: 13/13 (100%)
  AI Success: 13/13 (100%)
  Z3 Proofs: 13/13 (100%)
  
💰 COST ANALYSIS:
  Total Cost: $0.156
  Cache Hit Rate: 75%
  Cost Saved: $0.468 (3x reduction)
  Cost per LOC: $0.000031
  
⚡ PERFORMANCE:
  Total Time: 42.3 seconds
  Throughput: 119 LOC/second
  Average per Module: 3.25 seconds
  
🏆 STATUS: 100% ENTERPRISE VERIFICATION SUCCESS
```

---

## 🔌 API Testing

### Direct API Calls

#### 1. Analyze COBOL Code (Ad-hoc)

```powershell
# Test ad-hoc COBOL analysis
$cobolCode = @"
IDENTIFICATION DIVISION.
PROGRAM-ID. HELLO.
PROCEDURE DIVISION.
    DISPLAY 'HELLO WORLD'.
    STOP RUN.
"@

$body = @{
    program = "HELLO"
    code = $cobolCode
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8766/api/analyze" -Method POST -Body $body -ContentType "application/json"

Write-Host "`n✅ ANALYSIS COMPLETE" -ForegroundColor Green
Write-Host "Analysis: $($response.analysis)" -ForegroundColor White
Write-Host "Processing Time: $($response.metadata.processing_time_ms)ms" -ForegroundColor Cyan
Write-Host "Cost: `$$($response.metadata.cost_usd)" -ForegroundColor Green
Write-Host "Tokens: $($response.metadata.tokens_used)" -ForegroundColor Yellow
```

#### 2. Analyze COBOL File

```powershell
# Analyze existing COBOL file
$response = Invoke-RestMethod -Uri "http://localhost:8766/api/analyze/loan_approval.cob" -Method POST

Write-Host "`n✅ FILE ANALYSIS COMPLETE" -ForegroundColor Green
Write-Host "File: loan_approval.cob" -ForegroundColor Cyan
Write-Host "Analysis Length: $($response.analysis.Length) characters" -ForegroundColor White
Write-Host "Complexity: $($response.metadata.complexity_metrics.cyclomatic_complexity)" -ForegroundColor Magenta
```

#### 3. Get System Metrics

```powershell
# Retrieve current metrics
$metrics = Invoke-RestMethod -Uri "http://localhost:8766/api/metrics"

Write-Host "`n📊 SYSTEM METRICS" -ForegroundColor Yellow
Write-Host "Total Calls: $($metrics.metrics.totalCalls)" -ForegroundColor Cyan
Write-Host "Average Time: $($metrics.metrics.averageProcessingTimeMs)ms" -ForegroundColor Cyan
Write-Host "Total Cost: `$$($metrics.metrics.totalCostUSD)" -ForegroundColor Green
Write-Host "Avg Complexity: $($metrics.metrics.averageCyclomaticComplexity)" -ForegroundColor Magenta
```

#### 4. Reset Metrics

```powershell
# Reset all metrics (admin only)
Invoke-RestMethod -Uri "http://localhost:8766/api/metrics/reset" -Method POST

Write-Host "`n✅ METRICS RESET" -ForegroundColor Green
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Bridge Service Not Responding

**Symptoms**:
```
Bridge: OFFLINE (no response)
```

**Solution**:
```powershell
# Check if port 3000 is in use
$pid = (netstat -ano | Select-String ":3000.*LISTENING" | Select-Object -First 1) -replace '\s+', ' ' -split ' ' | Select-Object -Last 1

if ($pid) {
    Write-Host "Killing process on port 3000 (PID: $pid)"
    Stop-Process -Id $pid -Force
    Start-Sleep -Seconds 2
}

# Restart Bridge
$env:PORT="3000"
cd src\bridge
node server.js
```

#### 2. OpenAI API Key Not Loaded

**Symptoms**:
```
❌ ERROR: OPENAI_API_KEY not set!
```

**Solution**:
```powershell
# Option 1: Set environment variable
$env:OPENAI_API_KEY = "your-key-here"

# Option 2: Add to .env file (recommended)
# Create/edit .env in project root:
# OPENAI_API_KEY=your-key-here
# OPENAI_MODEL=gpt-4o
```

#### 3. Rate Limiting Errors

**Symptoms**:
```
Error: Too many requests (429)
```

**Solution**:
```powershell
# Wait and retry, or check current metrics
$metrics = Invoke-RestMethod -Uri "http://localhost:8766/api/metrics"
Write-Host "Total Calls: $($metrics.metrics.totalCalls)"

# Consider resetting metrics if testing
Invoke-RestMethod -Uri "http://localhost:8766/api/metrics/reset" -Method POST
```

#### 4. Dashboard WebSocket Not Connecting

**Symptoms**:
- Dashboard shows "WEBSOCKET: DISCONNECTED"

**Solution**:
```powershell
# Check Dashboard is running on correct port
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3100/api/health" -UseBasicParsing
    Write-Host "Dashboard: ONLINE" -ForegroundColor Green
} catch {
    Write-Host "Dashboard: OFFLINE - Restarting..." -ForegroundColor Yellow
    
    # Restart Dashboard
    $env:DASHBOARD_PORT="3100"
    cd dashboard
    node server.js
}

# Hard refresh browser: Ctrl+F5
```

#### 5. Z3 Verification Failures

**Symptoms**:
```
❌ Z3 Proof: FAILED
```

**Possible causes**:
1. AI misunderstood COBOL logic
2. Test scenarios don't match COBOL behavior
3. Z3 constraints incorrectly formulated

**Solution**:
```powershell
# Enable debug logging in z3_proof.js
# Check COBOL execution output vs AI analysis
# Verify test scenarios match expected behavior
```

---

## 🎯 Quick Reference Commands

### Start All Services

```powershell
# Terminal 1: Bridge
$env:PORT="3000"
cd src\bridge
node server.js

# Terminal 2: Dashboard
$env:DASHBOARD_PORT="3100"
cd dashboard
node server.js

# Terminal 3: Gateway (if needed)
cd gateway
cargo run --release
```

### Run Complete Test Suite

```powershell
# Basic functionality
cd tests
node real_api_test.js

# Single module cost analysis
node single_module_cost_test.js

# Z3 verification
node z3_proof.js

# Enterprise batch processing
node enterprise_batch_processor.js

# Performance tests
cd performance
node stress_test.js
node hft_flood.js
```

### Monitor System

```powershell
# Watch metrics in real-time
while ($true) {
    Clear-Host
    $m = Invoke-RestMethod -Uri "http://localhost:8766/api/metrics"
    Write-Host "`n📊 LIVE METRICS (refreshing every 3s)" -ForegroundColor Cyan
    Write-Host "Calls: $($m.metrics.totalCalls)" -ForegroundColor White
    Write-Host "Time:  $($m.metrics.averageProcessingTimeMs)ms" -ForegroundColor Yellow
    Write-Host "Cost:  `$$($m.metrics.totalCostUSD)" -ForegroundColor Green
    Start-Sleep -Seconds 3
}
```

---

## 📚 Additional Resources

- **Main README**: [README.md](README.md) - Full system documentation
- **Dashboard Guide**: [dashboard/README.md](dashboard/README.md) - UI documentation
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md) - System design
- **Security Policy**: [SECURITY.md](SECURITY.md) - Security guidelines

---

## 💡 Testing Best Practices

1. **Start Small**: Begin with `real_api_test.js` to verify API connectivity
2. **Check Costs**: Use `single_module_cost_test.js` to understand API costs before scaling
3. **Use Caching**: Enterprise batch processor shows 75% cache hit rate = 3x cost savings
4. **Monitor Metrics**: Keep Dashboard open during testing for real-time monitoring
5. **Reset When Needed**: Reset metrics between test runs for accurate measurements
6. **Verify with Z3**: Use Z3 verification to prove AI correctness mathematically

---

## 🎉 Success Indicators

Your system is working perfectly when:

✅ All services respond to health checks  
✅ Real API test completes successfully  
✅ Single module analysis returns correct token/cost data  
✅ Z3 verification achieves 100% proof rate  
✅ Enterprise batch processor completes all modules  
✅ Cache hit rate reaches 70%+ in repeated runs  
✅ Dashboard WebSocket stays connected  
✅ Metrics are accurate and updating in real-time  

---

**Built with ❤️ by Ricky Anh Nguyen | OrchesityAI & Kolerr Lab**
