@echo off
setlocal DisableDelayedExpansion

:: ============================================================
::  end_work.bat
::    - Export PostgreSQL DB via pg_dump
::    - Create 7-Zip backup (respects .gitignore)
::    - Stop Docker containers
::    - Commit + push to GitHub
::    - Restart Docker containers
:: ============================================================

chcp 65001 >nul 2>&1

:: ------------------------------------------------------------
::  Pre-flight checks
:: ------------------------------------------------------------
where docker >nul 2>&1
if errorlevel 1 (
    echo [ERROR] "docker" not found in PATH.
    pause
    exit /b 1
)

where git >nul 2>&1
if errorlevel 1 (
    echo [ERROR] "git" not found in PATH.
    pause
    exit /b 1
)

:: Detect Compose
set "COMPOSE_OK=0"
set "COMPOSE_CMD="
docker compose version >nul 2>&1
if not errorlevel 1 (
    set "COMPOSE_OK=1"
    set "COMPOSE_CMD=docker compose"
) else (
    docker-compose version >nul 2>&1
    if not errorlevel 1 (
        set "COMPOSE_OK=1"
        set "COMPOSE_CMD=docker-compose"
    )
)

:: Detect 7-Zip
set "SEVEN_ZIP="
if exist "%ProgramFiles%\7-Zip\7z.exe"     set "SEVEN_ZIP=%ProgramFiles%\7-Zip\7z.exe"
if not defined SEVEN_ZIP if exist "%ProgramFiles(x86)%\7-Zip\7z.exe" set "SEVEN_ZIP=%ProgramFiles(x86)%\7-Zip\7z.exe"
if not defined SEVEN_ZIP (
    where 7z >nul 2>&1
    if not errorlevel 1 set "SEVEN_ZIP=7z"
)
if not defined SEVEN_ZIP (
    echo [WARNING] 7-Zip not found. The archive step will be skipped.
    echo           Install it from https://7-zip.org/  ^(or add 7z.exe to PATH^).
    echo.
)

:: ------------------------------------------------------------
::  Jump into the git repo root (so all steps work regardless
::  of where this .bat is executed from)
:: ------------------------------------------------------------
set "REPO_ROOT="
for /f "delims=" %%r in ('git rev-parse --show-toplevel 2^>nul') do set "REPO_ROOT=%%r"
if not defined REPO_ROOT (
    pushd "%~dp0" >nul 2>&1
    for /f "delims=" %%r in ('git rev-parse --show-toplevel 2^>nul') do set "REPO_ROOT=%%r"
    popd >nul 2>&1
)
if defined REPO_ROOT (
    echo  Repo root: %REPO_ROOT%
    cd /d "%REPO_ROOT%"
) else (
    echo [WARNING] Not inside a Git repo. Continuing from: %CD%
)
echo.

:: ------------------------------------------------------------
::  STEP 1: Find PostgreSQL container
:: ------------------------------------------------------------
echo ============================================================
echo  STEP 1: Searching for PostgreSQL Container...
echo ============================================================
set "DB_CONTAINER="
for /f "tokens=*" %%i in ('docker ps --format "{{.Names}}" ^| findstr /i "postgres"') do (
    if not defined DB_CONTAINER set "DB_CONTAINER=%%i"
)
if not defined DB_CONTAINER (
    echo [ERROR] No running container with "postgres" in its name.
    pause
    exit /b 1
)
echo  Found Container: %DB_CONTAINER%
echo ============================================================
echo.

:: ------------------------------------------------------------
::  STEP 2: DB credentials
:: ------------------------------------------------------------
echo ============================================================
echo  STEP 2: Enter Database Credentials
echo ============================================================
set /p "DB_USER=Enter Database User (e.g. postgres): "
set /p "DB_NAME=Enter Database Name: "
set /p "DB_PASSWORD=Enter Database Password: "
echo ============================================================
echo.

:: ------------------------------------------------------------
::  STEP 3: Export database
:: ------------------------------------------------------------
echo ============================================================
echo  STEP 3: Exporting Database Backup (pg_dump)...
echo ============================================================
if not exist ".\db_sync" mkdir ".\db_sync"

docker exec -e "PGPASSWORD=%DB_PASSWORD%" -i %DB_CONTAINER% pg_dump -U %DB_USER% -d %DB_NAME% -F p > ".\db_sync\latest_db.sql" 2>".\db_sync\export_error.log"
if errorlevel 1 (
    echo [ERROR] EXPORT FAILED!
    if exist ".\db_sync\export_error.log" type ".\db_sync\export_error.log"
    pause
    exit /b 1
)
echo  [OK] Backup exported successfully.
if exist ".\db_sync\export_error.log" del ".\db_sync\export_error.log"
echo ============================================================
echo.

:: ------------------------------------------------------------
::  STEP 4: 7-Zip backup (respects .gitignore)
:: ------------------------------------------------------------
echo ============================================================
echo  STEP 4: Creating 7-Zip backup...
echo ============================================================
if not defined SEVEN_ZIP goto :skip_7zip

:: Timestamp via PowerShell (avoids locale issues with %DATE%/%TIME%)
set "TS="
for /f "delims=" %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss" 2^>nul') do set "TS=%%i"
if not defined TS set "TS=%DATE:/=-%_%TIME::=-%" & set "TS=%TS: =0%"

if not exist ".\backups" mkdir ".\backups"
set "ARCHIVE_PATH=.\backups\backup_%TS%.7z"

set "FILE_LIST="
set "FILES_FROM_GIT=0"

if exist ".git" (
    set "FILE_LIST=%TEMP%\git_archive_files_%RANDOM%.txt"
    git ls-files > "%FILE_LIST%"

    :: Explicitly include files that .gitignore excludes but we DO want in backup
    if exist "db_sync\latest_db.sql" echo db_sync/latest_db.sql>> "%FILE_LIST%"
    if exist "docker-compose.yml"     echo docker-compose.yml>> "%FILE_LIST%"
    if exist "docker-compose.services.yml" echo docker-compose.services.yml>> "%FILE_LIST%"

    set "FILES_FROM_GIT=1"
)

if "%FILES_FROM_GIT%"=="1" (
    "%SEVEN_ZIP%" a -t7z -mx=5 "%ARCHIVE_PATH%" @"%FILE_LIST%" ^
        -xr!.git -xr!backups -xr!__pycache__ -xr!node_modules -xr!.venv -xr!venv ^
        -x!*.env -x!.env -x!backend\celerybeat-schedule -x!backend\celerybeat.pid ^
        -bso0 -bsp0
    if errorlevel 1 goto :7zip_failed
    del "%FILE_LIST%" 2>nul
) else (
    "%SEVEN_ZIP%" a -t7z -mx=5 "%ARCHIVE_PATH%" "." ^
        -xr!.git -xr!backups -xr!__pycache__ -xr!node_modules -xr!.venv -xr!venv ^
        -x!*.env -x!.env -x!backend\celerybeat-schedule -x!backend\celerybeat.pid ^
        -bso0 -bsp0
    if errorlevel 1 goto :7zip_failed
)

echo  [OK] Archive created: %ARCHIVE_PATH%

:: Keep only the 10 most recent backups
for /f "skip=10 delims=" %%f in ('dir /b /o-d ".\backups\backup_*.7z" 2^>nul') do (
    del ".\backups\%%f" 2>nul
)
goto :skip_7zip

:7zip_failed
echo [WARNING] 7-Zip archiving failed. Continuing anyway.
if defined FILE_LIST if exist "%FILE_LIST%" del "%FILE_LIST%" 2>nul

:skip_7zip
echo ============================================================
echo.

:: ------------------------------------------------------------
::  STEP 5: Stop containers
:: ------------------------------------------------------------
echo ============================================================
echo  STEP 5: Stopping Docker Containers...
echo ============================================================
set "STOPPED_BY_COMPOSE=0"
if exist "docker-compose.yml" (
    if "%COMPOSE_OK%"=="1" (
        %COMPOSE_CMD% -f docker-compose.yml down
        set "STOPPED_BY_COMPOSE=1"
    )
)
if exist "docker-compose.services.yml" (
    if "%COMPOSE_OK%"=="1" (
        %COMPOSE_CMD% -f docker-compose.services.yml down
        set "STOPPED_BY_COMPOSE=1"
    )
)
if "%STOPPED_BY_COMPOSE%"=="0" (
    echo  Stopping container %DB_CONTAINER% directly...
    docker stop %DB_CONTAINER%
)
echo ============================================================
echo.

:: ------------------------------------------------------------
::  STEP 6: Push to GitHub
:: ------------------------------------------------------------
echo ============================================================
echo  STEP 6: Pushing Code and Database to GitHub...
echo ============================================================
if not defined REPO_ROOT (
    echo [WARNING] Not in a Git repository. Skipping push.
    goto :skip_git
)

git add -A
git diff --cached --quiet
if errorlevel 1 (
    git commit -m "Automatic backup and sync - %DATE% %TIME%"
) else (
    echo  No changes to commit.
)

set "CURRENT_BRANCH="
for /f "tokens=*" %%b in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "CURRENT_BRANCH=%%b"
if not defined CURRENT_BRANCH goto :skip_git
if "%CURRENT_BRANCH%"=="HEAD" (
    echo [WARNING] Detached HEAD. Skipping push.
    goto :skip_git
)

git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo [WARNING] No "origin" remote.
    goto :skip_git
)

git push -u origin %CURRENT_BRANCH%
if errorlevel 1 (
    echo [WARNING] git push failed.
) else (
    echo  [OK] Pushed to origin/%CURRENT_BRANCH%.
)

:skip_git
echo ============================================================
echo.

:: ------------------------------------------------------------
::  STEP 7: Start containers
:: ------------------------------------------------------------
echo ============================================================
echo  STEP 7: Starting Docker Containers...
echo ============================================================
set "STARTED_BY_COMPOSE=0"
if exist "docker-compose.yml" (
    if "%COMPOSE_OK%"=="1" (
        %COMPOSE_CMD% -f docker-compose.yml up -d
        set "STARTED_BY_COMPOSE=1"
    )
)
if exist "docker-compose.services.yml" (
    if "%COMPOSE_OK%"=="1" (
        %COMPOSE_CMD% -f docker-compose.services.yml up -d
        set "STARTED_BY_COMPOSE=1"
    )
)
if "%STARTED_BY_COMPOSE%"=="0" (
    echo  Starting container %DB_CONTAINER% directly...
    docker start %DB_CONTAINER%
)

echo.
echo ============================================================
echo  ALL DONE!
echo    - DB exported       : .\db_sync\latest_db.sql
echo    - 7-Zip backup      : .\backups\
echo    - Git pushed
echo    - Containers running
echo ============================================================
echo.
pause
endlocal
exit /b 0