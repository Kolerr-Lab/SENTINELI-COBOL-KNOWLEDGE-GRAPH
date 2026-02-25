# 🖥️ SENTINELI Enterprise Dashboard

**Mainframe meets Modern** - A hybrid dashboard that combines classic green-screen mainframe aesthetics with real-time modern streaming capabilities.

## 🎯 Features

- **Live WebSocket Streaming**: Real-time system monitoring and analysis results
- **Mainframe Aesthetic**: Classic CRT green-screen design with modern UX
- **COBOL Analysis**: Interactive COBOL program analysis interface
- **Impact Analysis**: Trace dependencies and assess change impact
- **Knowledge Graph**: Visualize program relationships and data flows
- **Performance Metrics**: Real-time system health and performance monitoring
- **System Logs**: Live log streaming with filtering
- **Mainframe-Friendly**: Familiar interface for mainframe developers

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- SENTINELI Bridge running on port 8766 (Docker container)
- SENTINELI Gateway running on port 8080

### Installation

```bash
cd dashboard
npm install
```

### Development Mode

```bash
npm run dev
```

This starts **two servers**:
- **Express WebSocket server** on `http://localhost:3100` (server.js)
- **Vite dev server** on `http://localhost:5173` (React hot reload)
- Dashboard accessible at `http://localhost:5173`

**Port Architecture:**
- **5173**: Vite dev server (React app with HMR)
- **3100**: Express server (WebSocket + API proxy to backend)
- **8766**: Backend Bridge API (Docker container)

**Data flow:** Browser (5173) → Express (3100) → Backend (8766)

### Production Build

```bash
npm run build
npm start
```

## 📡 Architecture

```
┌─────────────────┐
│   Dashboard UI  │  ← React + Vite (Port 3100)
│  (Mainframe UI) │
└────────┬────────┘
         │ WebSocket
         ↓
┌─────────────────┐
│  WebSocket      │  ← Express + WS (Port 3100)
│  Server         │
└────────┬────────┘
         │ HTTP/REST
         ↓
┌─────────────────┐     ┌─────────────────┐
│  Node.js Bridge │──→──│  Rust Gateway   │
│    (Port 3000)  │     │   (Port 8080)   │
└─────────────────┘     └─────────────────┘
```

## 🎨 Design Philosophy

### Mainframe Heritage
- **Green-on-black CRT aesthetic**
- **Scanline effects** for authentic feel
- **Monospace fonts** (IBM Plex Mono)
- **Border-box UI** with ASCII art headers
- **Terminal-style** command interfaces

### Modern Capabilities
- **Real-time WebSocket streaming**
- **React components** for interactivity
- **Responsive grid layouts**
- **Live metrics & charts**
- **Hot module replacement**

## 📊 Dashboard Views

### 1. System Dashboard
- **System overview** with key metrics
- **Live console** with streaming messages
- **Health indicators** for all services

### 2. COBOL Analysis
- **Interactive form** for program submission
- **Real-time analysis** results streaming
- **Syntax highlighting** and error reporting

### 3. Impact Analysis
- **Dependency tracing** for field changes
- **Risk assessment** visualization
- **Affected programs** listing

### 4. Knowledge Graph
- **Interactive graph** visualization
- **Node/edge statistics**
- **Cluster analysis**

### 5. System Logs
- **Live log streaming**
- **Filter by level** (ERROR, WARN, INFO)
- **Auto-refresh** capabilities

### 6. Performance Metrics
- **System uptime** tracking
- **Memory usage** monitoring
- **Connection statistics**
- **Real-time health** reporting

## 🔌 WebSocket API

### Client → Server

```javascript
// Analyze COBOL program
ws.send(JSON.stringify({
  type: 'analyze',
  payload: { program: 'INVMAINT', code: '...' }
}));

// Impact analysis
ws.send(JSON.stringify({
  type: 'impact',
  payload: { field: 'WS-BALANCE', newType: 'PIC 9(15)V99' }
}));

// Request metrics
ws.send(JSON.stringify({ type: 'metrics' }));

// Stream logs
ws.send(JSON.stringify({ type: 'logs' }));
```

### Server → Client

```javascript
// Connection established
{
  type: 'connection',
  message: 'SENTINELI MAINFRAME CONTROL SYSTEM v1.0',
  status: 'READY'
}

// Analysis result
{
  type: 'analysis_result',
  data: { /* analysis data */ }
}

// Log entry
{
  type: 'log',
  level: 'INFO',
  message: 'System operational',
  timestamp: 1708713600000
}
```

## 🛠️ REST API Endpoints

### Health Check
```
GET /api/health
```
Returns status of dashboard, bridge, and gateway.

### System Status
```
GET /api/system/status
```
Returns uptime, memory, connections.

### Analyze Program
```
POST /api/analyze
Content-Type: application/json

{
  "program": "INVMAINT",
  "code": "COBOL source..."
}
```

### Impact Analysis
```
POST /api/impact
Content-Type: application/json

{
  "field": "WS-ACCOUNT-BALANCE",
  "newType": "PIC 9(15)V99"
}
```

## 🎨 Customization

### Colors
Edit `src/styles/mainframe.css`:

```css
:root {
  --mainframe-green: #00ff00;  /* Primary color */
  --mainframe-dark: #0a0e0a;   /* Background */
  --modern-blue: #58a6ff;      /* Accents */
}
```

### Layout
Edit `dashboard-container` grid in CSS:

```css
.dashboard-container {
  grid-template-columns: 300px 1fr 350px;
}
```

## 🔒 Security

- No authentication by default (add middleware)
- CORS enabled for development
- WebSocket connections per-client isolated
- Sanitize all user inputs server-side

## 📈 Performance Tips

1. **Limit message history**: Only show last 20 messages
2. **Debounce metrics**: Fetch every 5 seconds, not on every message
3. **Lazy load views**: Use React.lazy() for large components
4. **Production build**: Use `npm run build` for optimized bundle

## 🤝 Integration with SENTINELI

The dashboard automatically connects to:
- **Bridge**: `http://localhost:8766` (Docker container, configurable via BRIDGE_URL)
- **Gateway**: `http://localhost:8080` (configurable via GATEWAY_URL)

Ensure both services are running before starting the dashboard.

## 📝 Environment Variables

```bash
DASHBOARD_PORT=3100
BRIDGE_URL=http://localhost:8766
GATEWAY_URL=http://localhost:8080
```

## 🐛 Troubleshooting

### WebSocket Connection Failed
- Ensure dashboard server is running
- Check firewall settings for port 3100
- Verify no port conflicts

### Bridge/Gateway Down
- Check if services are running
- Verify URLs in environment variables
- Check network connectivity

### Build Errors
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📄 License

MIT License - Same as parent SENTINELI project

## 👨‍💻 Author

**Ricky Anh Nguyen** <ricky@orchesity.com>  
OrchesityAI & Kolerr Lab

---

**Built with ❤️ for Mainframe Modernization**
