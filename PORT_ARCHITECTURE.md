# 🔌 Port Architecture Explained

## Why Multiple Ports?

Sentineli uses **3 different ports** for clearly separated concerns:

```
┌─────────────────────────────────────────────────┐
│  Frontend (React Dashboard)                     │
│  • Development: http://localhost:5173           │
│  • Production: http://localhost:3100            │
│                                                  │
│  Uses: Vite dev server (HMR, fast refresh)     │
└─────────────────────────────────────────────────┘
                    ↓ /api/* requests
┌─────────────────────────────────────────────────┐
│  Middleware Layer (Express)                     │
│  • Port: 3100                                   │
│                                                  │
│  Provides:                                      │
│  • WebSocket server (real-time updates)        │
│  • API proxy to backend                        │
│  • CORS handling                                │
│  • Static file serving (production)            │
└─────────────────────────────────────────────────┘
                    ↓ proxies to
┌─────────────────────────────────────────────────┐
│  Backend Bridge API (Node.js)                   │
│  • Port: 8766 (external Docker mapping)        │
│  • Internal: 3050 (inside container)           │
│                                                  │
│  Provides:                                      │
│  • AI analysis endpoints                       │
│  • PostgreSQL database access                  │
│  • Redis caching                                │
│  • COBOL compilation                            │
└─────────────────────────────────────────────────┘
```

---

## Port Reference Table

| Port | Service | Purpose | When to Use |
|------|---------|---------|-------------|
| **5173** | Vite Dev Server | React app with HMR | Development only (`npm run dev` in dashboard/) |
| **3100** | Express Server | WebSocket + API proxy | Both dev and production |
| **8766** | Backend API | AI analysis, DB, Redis | Always (Docker container) |

---

## Development Workflow

**Starting the full stack:**

```bash
# Terminal 1: Start backend (Docker)
docker-compose up

# Terminal 2: Start dashboard
cd dashboard
npm run dev
```

**Access points:**
- Dashboard UI: http://localhost:5173 ← **Use this for development**
- WebSocket: ws://localhost:3100
- Backend API: http://localhost:8766

---

## Production Workflow

**Build and deploy:**

```bash
# Build dashboard
cd dashboard
npm run build

# Start Express server (serves built React app)
npm start
```

**Access points:**
- Dashboard UI: http://localhost:3100 ← **Single entry point**
- Backend API: http://localhost:8766

---

## Why This Architecture?

### 1. **Separation of Concerns**
- **Vite (5173)**: Frontend development with instant HMR
- **Express (3100)**: WebSocket + middleware logic
- **Backend (8766)**: Heavy AI processing, database

### 2. **Hot Module Replacement (HMR)**
During development, Vite's HMR gives instant feedback on React changes without full page refreshes.

### 3. **WebSocket Support**
Express handles persistent connections for real-time updates (logs, streaming analysis).

### 4. **Production Optimization**
In production, Express serves pre-built React bundles (no Vite needed).

### 5. **CORS & Proxy**
Express handles cross-origin requests and proxies `/api/*` to backend.

---

## Common Issues

### "Why can't I access the dashboard on port 8766?"

**8766 is the backend API only** (Node.js + PostgreSQL + Redis). It doesn't serve HTML.

- ✅ **Dev**: Use http://localhost:5173
- ✅ **Prod**: Use http://localhost:3100

### "Port 3100 already in use"

Another process (maybe old dashboard) is running. 

```bash
# Windows
Get-Process -Name node | Stop-Process -Force

# Linux/Mac
lsof -ti:3100 | xargs kill -9
```

### "502 Bad Gateway on /api requests"

Dashboard can't reach backend. Ensure Docker container is running:

```bash
docker ps | grep kg_ai_cobol_modernizer
# Should show "Up X minutes (healthy)"
```

---

## Historical Context (What Changed)

**Before (Broken):**
- README said dashboard on port `3102` (wrong!)
- README said backend on port `3000` (wrong!)
- Vite and Express both tried to use `3100` (conflict!)

**After (Fixed):**
- ✅ Clear separation: Vite (5173), Express (3100), Backend (8766)
- ✅ No port conflicts
- ✅ Correct documentation everywhere

---

## Quick Reference

**For Users:**
```
Development:  http://localhost:5173
Production:   http://localhost:3100
Backend API:  http://localhost:8766
```

**For Developers:**
```bash
# Dashboard dev
cd dashboard && npm run dev  # → 5173

# Backend
docker-compose up            # → 8766

# Production dashboard
cd dashboard && npm start    # → 3100
```

**Data Flow:**
```
Browser → Vite (5173) → Express (3100) → Backend (8766) → PostgreSQL/Redis
```

---

**Need help?** See [dashboard/README.md](dashboard/README.md) for detailed setup.
