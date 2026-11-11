@echo off
REM Start Odoo with existing services
REM This batch file starts both the shared services and the main docker-compose

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║          Starting Odoo with Shared Services                   ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo [1/2] Starting PostgreSQL, Redis, Celery services...
docker-compose -f docker-compose.services.yml up -d
if errorlevel 1 (
    echo ERROR: Failed to start services
    pause
    exit /b 1
)

echo [✓] Services started successfully
echo.
echo [2/2] Starting Backend, Frontend, Nginx, and Odoo...
docker-compose up -d
if errorlevel 1 (
    echo ERROR: Failed to start main containers
    pause
    exit /b 1
)

echo [✓] All containers started successfully
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    Access Your Services                       ║
echo ╠════════════════════════════════════════════════════════════════╣
echo ║  Odoo:        http://localhost:8069                          ║
echo ║  Backend API: http://localhost:3000                          ║
echo ║  Frontend:    http://localhost:5173                          ║
echo ║  Nginx:       http://localhost                               ║
echo ║  pgAdmin:     http://localhost:5050                          ║
echo ║                                                               ║
echo ║  PostgreSQL:  localhost:5433                                 ║
echo ║  Redis:       localhost:6379                                 ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo To view logs: docker logs ctms_odoo -f
echo To stop: docker-compose down
echo.
pause
