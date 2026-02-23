#!/bin/bash
# SENTINELI Dashboard Launcher for Linux/Mac
# Ricky Anh Nguyen <ricky@orchesity.com>

cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║   SENTINELI ENTERPRISE DASHBOARD LAUNCHER                ║
║   Mainframe Control System v1.0                          ║
╚═══════════════════════════════════════════════════════════╝
EOF

echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "[INFO] Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to install dependencies"
        exit 1
    fi
fi

echo "[INFO] Starting SENTINELI Dashboard..."
echo "[INFO] Dashboard will be available at: http://localhost:3100"
echo "[INFO] WebSocket endpoint: ws://localhost:3100"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the dashboard
npm run dev
