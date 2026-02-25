# Sentineli Startup Script with PM2
Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host "   SENTINELI - Starting with PM2" -ForegroundColor Cyan
Write-Host "===============================================`n" -ForegroundColor Cyan

# Check if PM2 is installed
$pm2Installed = Get-Command pm2 -ErrorAction SilentlyContinue
if (-not $pm2Installed) {
    Write-Host "[ERROR] PM2 not found. Installing globally..." -ForegroundColor Red
    npm install -g pm2
}

# Stop any existing instances
Write-Host "[1/3] Stopping existing services..." -ForegroundColor Yellow
pm2 delete ecosystem.config.js 2>$null

# Start services with PM2
Write-Host "[2/3] Starting services with PM2..." -ForegroundColor Yellow
pm2 start ecosystem.config.js

# Show status
Write-Host "[3/3] Service status:" -ForegroundColor Yellow
pm2 status

Write-Host "`n===============================================" -ForegroundColor Green
Write-Host "   Sentineli is running!" -ForegroundColor Green
Write-Host "===============================================`n" -ForegroundColor Green

Write-Host " Dashboard:  http://localhost:3102" -ForegroundColor Cyan
Write-Host " Bridge API: http://localhost:3000" -ForegroundColor Cyan
Write-Host "`n Commands:" -ForegroundColor Yellow
Write-Host "   pm2 logs       - View live logs" -ForegroundColor White
Write-Host "   pm2 monit      - Monitor resources" -ForegroundColor White
Write-Host "   pm2 restart    - Restart services" -ForegroundColor White
Write-Host "   pm2 stop all   - Stop all services" -ForegroundColor White
Write-Host ""
