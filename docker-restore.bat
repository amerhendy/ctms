@echo off
REM Docker Restore Script for Windows - Run on WORK machine
setlocal enabledelayedexpansion

REM تعريف متغيرات الألوان (ANSI Codes)
set "CLR_RESET=^[[0m"
set "CLR_START=^[[94m"
set "CLR_OK=^[[92m"
set "CLR_INFO=^[[36m"
set "CLR_WARN=^[[93m"
set "CLR_ERR=^[[91m"

REM Fix: Safely handle paths with spaces and strip quotes
set "BACKUP_PATH=%~1"
if "%BACKUP_PATH%"=="" set "BACKUP_PATH=."

REM Fix: Cleaned check without syntax breaking spaces
if not exist "%BACKUP_PATH%\MANIFEST.txt" (
    echo %CLR_ERR%[ERROR] MANIFEST.txt not found in: "%BACKUP_PATH%"%CLR_RESET%
    echo Usage: docker-restore.bat "C:\path\to\backup_folder"
    pause
    exit /b 1
)

echo.
echo %CLR_START%============================================
echo   [START] Docker Restore Started (Target: %CD%)
echo ============================================%CLR_RESET%
echo.
type "%BACKUP_PATH%\MANIFEST.txt"
echo.

REM Fix: Replaced emoji with clean text to prevent input check crash
set /p confirm="%CLR_WARN%[WARNING] This will UPDATE your Docker setup in (%CD%). Continue? (yes/no): %CLR_RESET%"
if /i not "%confirm%"=="yes" (
    echo %CLR_WARN%Cancelled by user.%CLR_RESET%
    pause
    exit /b 0
)

REM ===== 1. CREATE SAFETY BACKUP =====
echo.
echo [1/8] Creating safety backup...
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set "SAFETY_BACKUP=.docker-backup-safety-%mydate%_%mytime%"

mkdir "%SAFETY_BACKUP%"
if exist "docker-compose.yml" (
    copy "docker-compose.yml" "%SAFETY_BACKUP%\" >nul
)
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Image}}" > "%SAFETY_BACKUP%\containers-before.txt" 2>nul

echo  --- %CLR_OK%[OK] Safety backup created in: %CD%\%SAFETY_BACKUP%%CLR_RESET%

REM ===== 2. STOP CONTAINERS =====
echo.
echo [2/8] Stopping running containers...

for /f "tokens=*" %%C in ('docker ps -q 2^>nul') do (
    docker stop %%C >nul 2>&1
    set STOPPED=1
)

if defined STOPPED (
    echo  --- %CLR_OK%[OK] Containers stopped%CLR_RESET%
) else (
    echo  --- %CLR_INFO%[INFO] No running containers found%CLR_RESET%
)

REM ===== 3. UPDATE CONFIGS =====
echo.
echo [3/8] Updating configuration files...

if exist "%BACKUP_PATH%\Dockerfile" (
    echo      -[Copying] Dockerfile
    copy "%BACKUP_PATH%\Dockerfile" "Dockerfile" >nul
) else (
    echo      -%CLR_INFO%[INFO] No Dockerfile in backup%CLR_RESET%
)

if exist "%BACKUP_PATH%\docker-compose.yml" (
    echo      -[Copying] docker-compose.yml
    copy "%BACKUP_PATH%\docker-compose.yml" "docker-compose.yml" >nul
) else (
    echo      -%CLR_INFO%[INFO] No docker-compose.yml in backup%CLR_RESET%
)

REM ===== 4. SYNC APP FILES =====
echo.
echo [4/8] Syncing application files...

if exist "%BACKUP_PATH%\app" (
    REM SAFE SYNC: Merges app files into the chosen directory without deleting local tools/backups
    robocopy "%BACKUP_PATH%\app" . /E /XC /XN /XO /XD ".git" "__pycache__" "node_modules" ".venv" ".docker-backup" /NFL /NDL /NJH /NJS /nc /ns /np >nul 2>&1
    echo  --- %CLR_OK%[OK] Application files synced to current directory%CLR_RESET%
) else (
    echo  --- %CLR_INFO%[INFO] No app files found in backup%CLR_RESET%
)

REM ===== 5. MERGE VOLUMES =====
echo.
echo [5/8] Merging Docker volumes...

if exist "%BACKUP_PATH%\volumes" (
    for /d %%V in ("%BACKUP_PATH%\volumes\*") do (
        set VOLUME_NAME=%%~nxV
        
        REM Check if volume exists
        docker volume inspect "!VOLUME_NAME!" >nul 2>&1
        if errorlevel 1 (
            echo      -[Creating Volume] !VOLUME_NAME!
            docker volume create "!VOLUME_NAME!" >nul 2>&1
        )
        
        REM Check if backup data exists
        if exist "%%V\data.tar.gz" (
            echo      -[Restoring Data] !VOLUME_NAME!
            docker run --rm -v "!VOLUME_NAME!:/volume_data" -v "%%V":/backup alpine tar xzf /backup/data.tar.gz -C /volume_data/ >nul 2>&1 || (
                echo      -%CLR_WARN%[WARNING] Could not merge volume: !VOLUME_NAME!%CLR_RESET%
            )
        )
    )
    echo  --- %CLR_OK%[OK] Volumes merged%CLR_RESET%
) else (
    echo  --- %CLR_INFO%[INFO] No volumes found in backup%CLR_RESET%
)

REM ===== 6. REBUILD & START =====
echo.
echo [6/8] Rebuilding Docker image and starting containers...

if exist "Dockerfile" (
    docker-compose build --no-cache
    echo  --- %CLR_OK%[OK] Image rebuilt%CLR_RESET%
) else (
    echo  --- %CLR_INFO%[INFO] No Dockerfile found, skipping build step%CLR_RESET%
)

echo.
echo [7/8] Starting containers...
docker-compose up -d

REM ===== 7. VERIFY =====
echo.
echo [8/8] Verification:
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"

REM ===== 8. SUMMARY =====
echo.
echo %CLR_OK%============================================
echo   [SUCCESS] Restore Complete!
echo ============================================%CLR_RESET%
echo.
echo What was updated:
echo    - Dockerfile (latest version)
echo    - docker-compose.yml (latest version)
echo    - Application files (safely merged into target path)
echo    - Docker volumes (data merged)
echo    - Containers (rebuilt and restarted)
echo.
echo Safety backup location: %CD%\%SAFETY_BACKUP%
echo.
pause