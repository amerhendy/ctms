@echo off
REM Docker Backup Script for Windows - Run on HOME machine
echo 🔵 Docker Backup Started at %TIMESTAMP%
setlocal enabledelayedexpansion
set BACKUP_DIR=%1
if "%BACKUP_DIR%"=="" set BACKUP_DIR=.docker-backup

REM Create timestamp
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set TIMESTAMP=%mydate%_%mytime%
set BACKUP_PATH=%BACKUP_DIR%\backup_%TIMESTAMP%

echo.
echo 🔵 Docker Backup Started at %TIMESTAMP%
echo 📁 Backup location: %BACKUP_PATH%
echo.

mkdir "%BACKUP_PATH%"
mkdir "%BACKUP_PATH%\app"
mkdir "%BACKUP_PATH%\volumes"
mkdir "%BACKUP_PATH%\containers"

REM ===== 1. BACKUP DOCKER-COMPOSE =====
if exist "docker-compose.yml" (
    echo 📋 Backing up docker-compose.yml...
    copy "docker-compose.yml" "%BACKUP_PATH%\"
) else (
    echo ⚠️  docker-compose.yml not found
)

REM ===== 2. BACKUP DOCKERFILE =====
if exist "Dockerfile" (
    echo 📋 Backing up Dockerfile...
    copy "Dockerfile" "%BACKUP_PATH%\"
) else (
    echo ⚠️  Dockerfile not found
)

REM ===== 3. BACKUP SOURCE CODE =====
echo 📦 Backing up application files...
REM Using Windows robocopy (built-in, like rsync)
robocopy . "%BACKUP_PATH%\app" /MIR /XD ".git" "__pycache__" "node_modules" ".venv" ".docker" ".docker-backup*" /NFL /NDL /NJH /NJS /nc /ns /np

REM ===== 4. BACKUP VOLUMES =====
echo 🗄️  Backing up Docker volumes...

for /f "tokens=*" %%V in ('docker volume ls --quiet 2^>nul') do (
    echo   - Backing up volume: %%V
    mkdir "%BACKUP_PATH%\volumes\%%V"
    docker run --rm -v %%V:/volume_data -v "%BACKUP_PATH%\volumes\%%V":/backup alpine tar czf /backup/data.tar.gz -C /volume_data . >nul 2>&1 || (
        echo   ⚠️  Could not backup volume %%V
    )
)

REM ===== 5. SAVE CONTAINER STATES =====
echo 📸 Saving container states...
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Image}}" > "%BACKUP_PATH%\containers\state.txt" 2>nul

REM ===== 6. CREATE MANIFEST =====
echo 📝 Creating manifest...
(
    echo DOCKER BACKUP MANIFEST
    echo ======================
    echo Created: %date% %time%
    echo.
    echo CONTENTS:
    echo ✓ docker-compose.yml
    echo ✓ Dockerfile
    echo ✓ Application files
    echo ✓ Docker volumes
    echo ✓ Container states
    echo.
    echo TO RESTORE:
    echo Run: docker-restore.bat "%BACKUP_PATH%"
) > "%BACKUP_PATH%\MANIFEST.txt"

type "%BACKUP_PATH%\MANIFEST.txt"

REM ===== 7. SUMMARY =====
echo.
echo ✅ Backup Complete!
echo 📊 Backup created in: %BACKUP_PATH%
echo.
echo Next step: Copy entire '%BACKUP_DIR%' folder to USB and transfer to work machine
echo Then run: docker-restore.bat
echo.
pause
