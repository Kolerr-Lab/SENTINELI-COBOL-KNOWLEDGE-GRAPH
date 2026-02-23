@echo off
REM SENTINELI Dashboard Launcher for Windows
REM Ricky Anh Nguyen <ricky@orchesity.com>

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║   SENTINELI ENTERPRISE DASHBOARD LAUNCHER                ║
echo ║   Mainframe Control System v1.0                          ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [INFO] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
)

echo [INFO] Starting SENTINELI Dashboard...
echo [INFO] Dashboard will be available at: http://localhost:3100
echo [INFO] WebSocket endpoint: ws://localhost:3100
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the dashboard
call npm run dev

pause
