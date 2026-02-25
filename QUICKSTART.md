# ⚡ Sentineli - Quick Start Guide

Get Sentineli running in **2 minutes** with zero configuration hassle.

---

## 🚀 Prerequisites (One-Time Setup)

You need these installed:

- **Node.js 18+** → [Download](https://nodejs.org/)
- **Docker Desktop** → [Download](https://www.docker.com/products/docker-desktop/)
- **OpenAI API Key** → [Get Free Trial](https://platform.openai.com/api-keys)

**Verify installation:**
```bash
node --version   # Should show v18 or higher
docker --version # Should show 20.10 or higher
```

---

## 📥 Installation (3 Commands)

```bash
# 1. Clone the repository
git clone https://github.com/Kolerr-Lab/sentineli.git
cd sentineli

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
```

**Edit `.env` file** and add your OpenAI key:
```bash
OPENAI_API_KEY=sk-your-actual-key-here
```

---

## ▶️ Start Sentineli (Choose One)

### Option A: Docker (Recommended for first-time users)

```bash
docker-compose up --build
```

**What starts:**
- ✅ PostgreSQL database (port 5432)
- ✅ Redis cache (port 6385)
- ✅ Node.js Bridge (port 3000)
- ✅ Dashboard UI (port 3102)

**Wait 30 seconds** for all services to start.

---

### Option B: Manual Start (For development)

**Terminal 1 - Start Bridge Backend:**
```bash
cd src/bridge
PORT=3000 node server.js
```

**Terminal 2 - Start Dashboard:**
```bash
cd dashboard
npm run build
DASHBOARD_PORT=3102 node server.js
```

---

## 🎯 Access the System

**Open in your browser:**

- 🖥️ **Dashboard**: http://localhost:3102
- 🔍 **API Health**: http://localhost:3000/health
- 📊 **System Status**: http://localhost:3000/api/metrics

---

## ✨ Test It Works

### Quick Test #1: Health Check

```bash
curl http://localhost:3000/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-25T...",
  "ai": "enabled",
  "database": "healthy",
  "cache": "healthy"
}
```

---

### Quick Test #2: Analyze COBOL Code

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "program": "test",
    "code": "IDENTIFICATION DIVISION.\nPROGRAM-ID. HELLO.\nPROCEDURE DIVISION.\n    DISPLAY \"Hello World\".\n    STOP RUN."
  }'
```

**You should see:** AI analysis with tokens, cost, and business logic extraction.

---

### Quick Test #3: Dashboard UI

1. Open http://localhost:3102
2. Press **Ctrl+F5** (hard refresh)
3. Click **"COBOL Analysis"** tab
4. Paste sample COBOL code
5. Click **"Analyze Program"**
6. Watch AI analysis appear in real-time! ✨

---

## 🛠️ Common Issues

### ❌ Port already in use

**Error:** `EADDRINUSE :::3000`

**Fix:**
```bash
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

---

### ❌ OpenAI API key not working

**Error:** `AI: disabled` in health check

**Fix:**
1. Check `.env` file has correct key: `OPENAI_API_KEY=sk-...`
2. Restart the Bridge: `Ctrl+C` and restart
3. Verify key at https://platform.openai.com/api-keys

---

### ❌ Database connection failed

**Error:** `database: unhealthy`

**Fix (Docker):**
```bash
docker-compose down
docker-compose up --build
```

**Fix (Manual):**
- Install PostgreSQL locally
- Update `DATABASE_URL` in `.env`

---

## 📖 Next Steps

**You're all set! Now explore:**

- 📘 [Complete API Reference](docs/REAL_API_GUIDE.md) - All endpoints
- 🏗️ [Architecture Guide](ARCHITECTURE.md) - How it works
- 🧪 [Testing Guide](TESTING_GUIDE.md) - Run tests
- 🚀 [Enterprise Demo](docs/ENTERPRISE_DEMO.md) - Advanced features
- 🔒 [Security Guide](SECURITY.md) - Production security

---

## 🆘 Need Help?

- 💬 [GitHub Discussions](https://github.com/Kolerr-Lab/sentineli/discussions)
- 🐛 [Report Bug](https://github.com/Kolerr-Lab/sentineli/issues/new?template=bug_report.md)
- ✨ [Request Feature](https://github.com/Kolerr-Lab/sentineli/issues/new?template=feature_request.md)
- 📧 Email: ricky@orchesity.com

---

**🎉 Congratulations! You're running Sentineli!**

*Built with ❤️ by Ricky Anh Nguyen | OrchesityAI & Kolerr Lab*
