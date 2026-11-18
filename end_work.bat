@echo off
setlocal DisableDelayedExpansion

:: ============================================================
::  end_work.bat  (External PostgreSQL edition)
::    - Export external PostgreSQL DB via pg_dump
::    - Create 7-Zip backup (respects .gitignore)
::    - Stop Docker Compose services (DB stays external)
::    - Commit + push to GitHub
::    - Restart Docker Compose services
:: ============================================================

chcp 65001 >nul 2>&1

:: Image used for pg_dump fallback (matches your server's major version).
:: Change the tag (e.g. postgres:15-alpine) if needed.
set "PG_IMAGE=postgres:16-alpine"

:: ------------------------------------------------------------
::  Pre-flight checks
:: ------------------------------------------------------------
where git >nul 2>&1
if errorlevel 1 (
    echo [ERROR] "git" not found in PATH.
    pause
    exit /b 1
)

:: Docker is optional now (DB is external). Used only for compose services.
set "DOCKER_OK=0"
where docker >nul 2>&1
if not errorlevel 1 set "DOCKER_OK=1"
if "%DOCKER_OK%"=="0" (
    echo [WARNING] "docker" not found in PATH. Container steps will be skipped.
    echo.
)

:: Detect Compose (only if docker is available)
set "COMPOSE_OK=0"
set "COMPOSE_CMD="
if "%DOCKER_OK%"=="1" (
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
::  Jump into the git repo root
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
::  STEP 1: Locate pg_dump
:: ------------------------------------------------------------
echo ============================================================
echo  STEP 1: Locating pg_dump
echo ============================================================
echo  Tip: your server is PostgreSQL 18.x, so use pg_dump 18.x
echo       e.g. "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe"
echo.

set "PG_DUMP_EXE="
set "PG_DUMP_MODE="
set "PG_DUMP_PATH_FILE=%~dp0.pg_dump_path"

:: 1) Load previously saved path (if any)
if exist "%PG_DUMP_PATH_FILE%" set /p PG_DUMP_EXE=<"%PG_DUMP_PATH_FILE%"
if defined PG_DUMP_EXE echo  [OK] Loaded saved path: %PG_DUMP_EXE%
if defined PG_DUMP_EXE goto :pgdump_use_input

:: 2) Ask the user
set /p "PG_DUMP_EXE=Path to pg_dump.exe (or blank to auto-detect): "

:pgdump_use_input
if not defined PG_DUMP_EXE goto :pgdump_auto

:: Strip surrounding quotes if user pasted them
set "PG_DUMP_EXE=%PG_DUMP_EXE:"=%"
if not exist "%PG_DUMP_EXE%" (
    echo [ERROR] pg_dump not found at: %PG_DUMP_EXE%
    pause
    exit /b 1
)

:: Offer to save path (only if we didn't just load it)
if exist "%PG_DUMP_PATH_FILE%" goto :pgdump_path_saved
choice /c YN /n /m "Save this path for future runs? [Y/N]: "
if errorlevel 2 goto :pgdump_path_saved
> "%PG_DUMP_PATH_FILE%" echo %PG_DUMP_EXE%
echo  [OK] Path saved to: %PG_DUMP_PATH_FILE%

:pgdump_path_saved
set "PG_DUMP_MODE=host"
echo  [OK] Using pg_dump: %PG_DUMP_EXE%
goto :pgdump_done

:: 3) Auto-detect fallback
:pgdump_auto
where pg_dump >nul 2>&1
if not errorlevel 1 (
    set "PG_DUMP_EXE=pg_dump"
    set "PG_DUMP_MODE=host"
    echo  [OK] Found pg_dump in PATH.
    goto :pgdump_done
)
if "%DOCKER_OK%"=="1" (
    set "PG_DUMP_MODE=docker"
    echo  [INFO] pg_dump not found on host. Using temporary container: %PG_IMAGE%
    echo         ^(edit PG_IMAGE if your server version differs^).
    goto :pgdump_done
)
echo [ERROR] pg_dump not found on host and Docker is not available.
echo         Install the PostgreSQL client tools for your server version
echo         and provide the full path to pg_dump.exe.
pause
exit /b 1

:pgdump_done
echo ============================================================
echo.
:: ------------------------------------------------------------
::  STEP 2: DB connection info (external DB)
:: ------------------------------------------------------------
echo ============================================================
echo  STEP 2: Enter External Database Connection Info
echo ============================================================
set "DB_HOST="
set /p "DB_HOST=Enter DB Host [localhost]: "
if not defined DB_HOST set "DB_HOST=localhost"

set "DB_PORT="
set /p "DB_PORT=Enter DB Port [5432]: "
if not defined DB_PORT set "DB_PORT=5432"

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
del ".\db_sync\latest_db.sql" 2>nul
del ".\db_sync\export_error.log" 2>nul

:: ---- Compute DOCKER_DB_HOST OUTSIDE the if-block (critical!) ----
:: Inside a parenthesized block, %VAR% is expanded at parse time,
:: so setting it inside the block and reading it in the same block
:: yields an empty value. Always compute it before the `if`.
set "DOCKER_DB_HOST=%DB_HOST%"
if /I "%DB_HOST%"=="localhost" set "DOCKER_DB_HOST=host.docker.internal"
if /I "%DB_HOST%"=="127.0.0.1" set "DOCKER_DB_HOST=host.docker.internal"

:: Absolute path of the db_sync folder (for docker -v)
set "DB_SYNC_DIR=%CD%\db_sync"

if /I "%PG_DUMP_MODE%"=="host" (
    set "PGPASSWORD=%DB_PASSWORD%"
    "%PG_DUMP_EXE%" -h "%DB_HOST%" -p %DB_PORT% -U "%DB_USER%" -d "%DB_NAME%" -F p > ".\db_sync\latest_db.sql" 2> ".\db_sync\export_error.log"
    set "PGPASSWORD="
) else (
    :: pg_dump inside container writes directly to /dump/latest_db.sql
    :: via the mounted folder; no stdout redirect needed.
    docker run --rm ^
        -e "PGPASSWORD=%DB_PASSWORD%" ^
        -v "%DB_SYNC_DIR%:/dump" ^
        %PG_IMAGE% ^
        pg_dump -h %DOCKER_DB_HOST% -p %DB_PORT% -U "%DB_USER%" -d "%DB_NAME%" -F p -f /dump/latest_db.sql ^
        2> ".\db_sync\export_error.log"
)

if errorlevel 1 (
    echo [ERROR] EXPORT FAILED!
    if exist ".\db_sync\export_error.log" type ".\db_sync\export_error.log"
    pause
    exit /b 1
)
if not exist ".\db_sync\latest_db.sql" (
    echo [ERROR] EXPORT FAILED! Output file was not created.
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
::  STEP 5: Stop Docker Compose services (external DB is untouched)
:: ------------------------------------------------------------
echo ============================================================
echo  STEP 5: Stopping Docker Compose services...
echo ============================================================
set "STOPPED_BY_COMPOSE=0"
if "%DOCKER_OK%"=="1" (
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
)
if "%STOPPED_BY_COMPOSE%"=="0" (
    echo  [INFO] No compose services stopped. External DB remains running.
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
::  STEP 7: Restart Docker Compose services
:: ------------------------------------------------------------
echo ============================================================
echo  STEP 7: Starting Docker Compose services...
echo ============================================================
set "STARTED_BY_COMPOSE=0"
if "%DOCKER_OK%"=="1" (
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
)
if "%STARTED_BY_COMPOSE%"=="0" (
    echo  [INFO] No compose services were started. External DB is already up.
)

echo.
echo ============================================================
echo  ALL DONE!
echo    - External DB host : %DB_HOST%:%DB_PORT%
echo    - DB exported      : .\db_sync\latest_db.sql
echo    - 7-Zip backup     : .\backups\
echo    - Git pushed
echo    - Compose services running (DB is external)
echo ============================================================
echo.
pause
endlocal
exit /b 0