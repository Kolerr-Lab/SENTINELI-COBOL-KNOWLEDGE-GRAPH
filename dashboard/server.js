/**
 * Sentineli Enterprise Dashboard WebSocket Server
 * Real-time streaming for mainframe modernization monitoring
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.DASHBOARD_PORT || 3100;
const BRIDGE_URL = process.env.BRIDGE_URL || 'http://localhost:3000';
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8080';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Store active connections
const clients = new Set();

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('✅ Client connected to dashboard stream');
  clients.add(ws);

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      // Handle different command types
      switch(data.type) {
        case 'analyze':
          await handleAnalysis(ws, data.payload);
          break;
        case 'impact':
          await handleImpactAnalysis(ws, data.payload);
          break;
        case 'metrics':
          await handleMetrics(ws);
          break;
        case 'logs':
          streamLogs(ws);
          break;
        default:
          ws.send(JSON.stringify({ type: 'error', message: 'Unknown command' }));
      }
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', message: error.message }));
    }
  });

  ws.on('close', () => {
    console.log('❌ Client disconnected');
    clients.delete(ws);
  });

  // Send initial connection message
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'SENTINELI MAINFRAME CONTROL SYSTEM v1.0',
    timestamp: new Date().toISOString(),
    status: 'READY'
  }));
});

// REST API endpoints for dashboard
app.get('/api/health', async (req, res) => {
  try {
    const bridgeHealth = await axios.get(`${BRIDGE_URL}/health`).catch(() => ({ data: { status: 'DOWN' } }));
    const gatewayHealth = await axios.get(`${GATEWAY_URL}/health`).catch(() => ({ data: { status: 'DOWN' } }));
    
    res.json({
      dashboard: 'UP',
      bridge: bridgeHealth.data.status || 'DOWN',
      gateway: gatewayHealth.data.status || 'DOWN',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/system/status', async (req, res) => {
  try {
    // Forward directly to Bridge system status
    const bridgeStatus = await axios.get(`${BRIDGE_URL}/api/system/status`, { timeout: 5000 });
    
    // Return Bridge data directly (includes all metrics)
    res.json(bridgeStatus.data);
  } catch (error) {
    console.error('Bridge /api/system/status error:', error.message);
    res.status(503).json({ 
      error: 'Bridge backend unavailable',
      message: 'The Bridge service is not responding. Please ensure it is running on port 3000.',
      status: 'OFFLINE',
      bridgeUrl: BRIDGE_URL
    });
  }
});

app.post('/api/analyze', async (req, res) => {
  try {
    const response = await axios.post(`${BRIDGE_URL}/api/analyze`, req.body);
    broadcast({ type: 'analysis', data: response.data });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ 
      error: error.message,
      details: error.response?.data 
    });
  }
});

app.get('/api/metrics', async (req, res) => {
  try {
    const response = await axios.get(`${BRIDGE_URL}/api/metrics`, { timeout: 5000 });
    res.json(response.data);
  } catch (error) {
    console.error('Bridge /api/metrics error:', error.message);
    res.status(503).json({ 
      success: false,
      error: 'Bridge backend unavailable',
      message: 'Cannot fetch metrics. Please ensure Bridge service is running.',
      metrics: {
        totalCalls: 0,
        totalCostUSD: 0,
        totalProcessingTimeMs: 0
      }
    });
  }
});

app.post('/api/impact', async (req, res) => {
  try {
    const response = await axios.post(`${BRIDGE_URL}/api/impact`, req.body);
    broadcast({ type: 'impact', data: response.data });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ 
      error: error.message,
      details: error.response?.data 
    });
  }
});

app.get('/api/graph', async (req, res) => {
  try {
    const response = await axios.get(`${BRIDGE_URL}/api/graph`, { timeout: 5000 });
    res.json(response.data);
  } catch (error) {
    console.error('Bridge /api/graph error:', error.message);
    res.status(503).json({ 
      success: false,
      error: 'Bridge backend unavailable',
      message: 'Cannot fetch knowledge graph. Please ensure Bridge service is running.',
      graph: { nodes: [], edges: [] }
    });
  }
});

// Helper functions
async function handleAnalysis(ws, payload) {
  try {
    ws.send(JSON.stringify({ type: 'status', message: 'Analyzing COBOL program...' }));
    const response = await axios.post(`${BRIDGE_URL}/api/analyze`, payload);
    ws.send(JSON.stringify({ type: 'analysis_result', data: response.data }));
  } catch (error) {
    ws.send(JSON.stringify({ type: 'error', message: error.message }));
  }
}

async function handleImpactAnalysis(ws, payload) {
  try {
    ws.send(JSON.stringify({ type: 'status', message: 'Running impact analysis...' }));
    const response = await axios.post(`${BRIDGE_URL}/api/impact`, payload);
    ws.send(JSON.stringify({ type: 'impact_result', data: response.data }));
  } catch (error) {
    ws.send(JSON.stringify({ type: 'error', message: error.message }));
  }
}

async function handleMetrics(ws) {
  try {
    const metrics = await axios.get(`${BRIDGE_URL}/api/metrics`);
    ws.send(JSON.stringify({ type: 'metrics', data: metrics.data }));
  } catch (error) {
    ws.send(JSON.stringify({ type: 'error', message: 'Metrics unavailable' }));
  }
}

function streamLogs(ws) {
  // Simulate log streaming
  const logInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'log',
        level: 'INFO',
        message: `System operational - ${new Date().toISOString()}`,
        timestamp: Date.now()
      }));
    } else {
      clearInterval(logInterval);
    }
  }, 2000);
}

function broadcast(message) {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Serve React SPA for all non-API routes (must be last!)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║   SENTINELI ENTERPRISE DASHBOARD                         ║
║   Mainframe Control System - Live Streaming              ║
╠═══════════════════════════════════════════════════════════╣
║   Dashboard: http://localhost:${PORT}                        ║
║   WebSocket: ws://localhost:${PORT}                          ║
║   Status:    OPERATIONAL                                  ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
