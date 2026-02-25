@echo off
echo.
echo ===============================================
echo    SENTINELI - Starting with PM2
echo ===============================================
echo.

REM Check if PM2 is installed
where pm2 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] PM2 not found. Installing...
    call npm install -g pm2
)

REM Stop any existing instances
echo [1/3] Stopping existing services...
call pm2 delete ecosystem.config.js 2>nul

REM Start services with PM2
echo [2/3] Starting services with PM2...
call pm2 start ecosystem.config.js

REM Show status
echo [3/3] Service status:
call pm2 status

echo.
echo ===============================================
echo    Sentineli is running!
echo ===============================================
echo.
echo  Dashboard:  http://localhost:3102
echo  Bridge API: http://localhost:3000
echo.
echo  Commands:
echo    pm2 logs       - View live logs
echo    pm2 monit      - Monitor resources
echo    pm2 restart    - Restart services
echo    pm2 stop all   - Stop all services
echo.

pause
