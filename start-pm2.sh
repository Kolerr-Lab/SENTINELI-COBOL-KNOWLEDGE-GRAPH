#!/bin/bash
# Sentineli Startup Script for Linux/Mac

echo ""
echo "==============================================="
echo "   SENTINELI - Starting with PM2"
echo "==============================================="
echo ""

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "[ERROR] PM2 not found. Installing..."
    npm install -g pm2
fi

# Stop any existing instances
echo "[1/3] Stopping existing services..."
pm2 delete ecosystem.config.js 2>/dev/null || true

# Start services with PM2
echo "[2/3] Starting services with PM2..."
pm2 start ecosystem.config.js

# Show status
echo "[3/3] Service status:"
pm2 status

echo ""
echo "==============================================="
echo "   Sentineli is running!"
echo "==============================================="
echo ""
echo " Dashboard:  http://localhost:3102"
echo " Bridge API: http://localhost:3000"
echo ""
echo " Commands:"
echo "   pm2 logs       - View live logs"
echo "   pm2 monit      - Monitor resources"
echo "   pm2 restart    - Restart services"
echo "   pm2 stop all   - Stop all services"
echo ""
