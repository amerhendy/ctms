@echo off
setlocal DisableDelayedExpansion

:: ============================================================
::  end_work.bat  (External PostgreSQL edition)
::    STEP 1 - Locate pg_dump (prompt user, save path)
::    STEP 2 - Enter external DB connection info
::    STEP 3 - Export DB with pg_dump (host or docker fallback)
::    STEP 4 - Create 7-Zip backup (respects .gitignore)
::    STEP 5 - Stop Docker Compose services
::    STEP 6 - Commit + push to GitHub
::    STEP 7 - Start Docker Compose services
:: ============================================================

chcp 65001 >nul 2>&1

:: Docker image fallback for pg_dump (only if user leaves path blank
:: AND no pg_dump is in PATH). Change tag to match your server version.
set "PG_IMAGE=postgres:18-alpine"

:: ------------------------------------------------------------
::  Pre-flight: git and docker
:: ------------------------------------------------------------
where git >nul 2>&1
if errorlevel 1 (
    echo [ERROR] "git" not found in PATH.
    pause
    exit /b 1
)

set "DOCKER_OK=0"
where docker >nul 2>&1
if not errorlevel 1 set "DOCKER_OK=1"
if "%DOCKER_OK%"=="0" (
    echo [WARNING] "docker" not found in PATH. Container steps will be skipped.
    echo.
)

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

:: ------------------------------------------------------------
::  Locate 7-Zip (user's install: C:\Program Files (x86)\7-Zip)
:: ------------------------------------------------------------
set "SEVEN_ZIP=C:\Program Files (x86)\7-Zip\7z.exe"
if exist "%SEVEN_ZIP%" goto :sevenzip_ok

set "SEVEN_ZIP=%ProgramFiles%\7-Zip\7z.exe"
if exist "%SEVEN_ZIP%" goto :sevenzip_ok

where 7z >nul 2>&1
if not errorlevel 1 (
    set "SEVEN_ZIP=7z"
    goto :sevenzip_ok
)

set "SEVEN_ZIP="
echo [WARNING] 7-Zip not found at "C:\Program Files (x86)\7-Zip" or in PATH.
echo           The archive step will be skipped.
echo.
goto :sevenzip_done

:sevenzip_ok
echo  7-Zip: %SEVEN_ZIP%
:sevenzip_done

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

if exist "%PG_DUMP_PATH_FILE%" set /p PG_DUMP_EXE=<"%PG_DUMP_PATH_FILE%"
if defined PG_DUMP_EXE echo  [OK] Loaded saved path: %PG_DUMP_EXE%
if defined PG_DUMP_EXE goto :pgdump_use_input

set /p "PG_DUMP_EXE=Path to pg_dump.exe (or blank to auto-detect): "

:pgdump_use_input
if not defined PG_DUMP_EXE goto :pgdump_auto

:: Strip surrounding quotes if the user pasted them
set "PG_DUMP_EXE=%PG_DUMP_EXE:"=%"
if not exist "%PG_DUMP_EXE%" (
    echo [ERROR] pg_dump not found at: %PG_DUMP_EXE%
    pause
    exit /b 1
)

if exist "%PG_DUMP_PATH_FILE%" goto :pgdump_path_saved
choice /c YN /n /m "Save this path for future runs? [Y/N]: "
if errorlevel 2 goto :pgdump_path_saved
> "%PG_DUMP_PATH_FILE%" echo %PG_DUMP_EXE%
echo  [OK] Path saved to: %PG_DUMP_PATH_FILE%

:pgdump_path_saved
set "PG_DUMP_MODE=host"
echo  [OK] Using pg_dump: %PG_DUMP_EXE%
goto :pgdump_done

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

:: Compute DOCKER_DB_HOST OUTSIDE any parenthesized block — variables
:: set inside a block aren't expanded within the same block (parse-time).
set "DOCKER_DB_HOST=%DB_HOST%"
if /I "%DB_HOST%"=="localhost" set "DOCKER_DB_HOST=host.docker.internal"
if /I "%DB_HOST%"=="127.0.0.1" set "DOCKER_DB_HOST=host.docker.internal"

set "PGDUMP_EXIT=0"

if /I "%PG_DUMP_MODE%"=="host" (
    set "PGPASSWORD=%DB_PASSWORD%"
    "%PG_DUMP_EXE%" -h "%DB_HOST%" -p %DB_PORT% -U "%DB_USER%" -d "%DB_NAME%" -F p > ".\db_sync\latest_db.sql" 2> ".\db_sync\export_error.log"
    if errorlevel 1 set "PGDUMP_EXIT=1"
    set "PGPASSWORD="
) else (
    set "PGDUMP_CONTAINER=pgdump_%RANDOM%%RANDOM%"
    docker run --name "%PGDUMP_CONTAINER%" ^
        -e "PGPASSWORD=%DB_PASSWORD%" ^
        %PG_IMAGE% ^
        pg_dump -h %DOCKER_DB_HOST% -p %DB_PORT% -U "%DB_USER%" -d "%DB_NAME%" -F p -f /tmp/latest_db.sql 2> ".\db_sync\export_error.log"
    if errorlevel 1 (
        set "PGDUMP_EXIT=1"
    ) else (
        docker cp "%PGDUMP_CONTAINER%:/tmp/latest_db.sql" ".\db_sync\latest_db.sql"
        if errorlevel 1 set "PGDUMP_EXIT=1"
    )
    docker rm -f "%PGDUMP_CONTAINER%" >nul 2>&1
)

if "%PGDUMP_EXIT%"=="1" (
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

:: Timestamp via PowerShell (avoids locale issues with %DATE%/%TIME%)
set "TS="
for /f "delims=" %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss" 2^>nul') do set "TS=%%i"
if not defined TS (
    echo [ERROR] Cannot generate timestamp.
    pause
    exit /b 1
)

if not exist ".\backups" mkdir ".\backups"
set "ARCHIVE_PATH=.\backups\backup_%TS%.7z"

set "FILE_LIST="
set "FILES_FROM_GIT=0"

:: IMPORTANT: build the listfile in a subroutine so that FILE_LIST is
:: set on its own line and expanded on the next one — not in the same
:: parenthesized block (which would expand %FILE_LIST% at parse time
:: while it's still empty).
if exist ".git" call :build_git_file_list

if "%FILES_FROM_GIT%"=="1" goto :zip_from_list
goto :zip_whole_tree

:zip_from_list
"%SEVEN_ZIP%" a -t7z -mx=5 "%ARCHIVE_PATH%" @"%FILE_LIST%" ^
    -xr!.git -xr!backups -xr!__pycache__ -xr!node_modules -xr!.venv -xr!venv ^
    -x!*.env -x!.env -x!backend\celerybeat-schedule -x!backend\celerybeat.pid ^
    -bso0 -bsp0
if errorlevel 1 goto :7zip_failed
del "%FILE_LIST%" 2>nul
goto :zip_done

:zip_whole_tree
"%SEVEN_ZIP%" a -t7z -mx=5 "%ARCHIVE_PATH%" "." ^
    -xr!.git -xr!backups -xr!__pycache__ -xr!node_modules -xr!.venv -xr!venv ^
    -x!*.env -x!.env -x!backend\celerybeat-schedule -x!backend\celerybeat.pid ^
    -bso0 -bsp0
if errorlevel 1 goto :7zip_failed
goto :zip_done

:build_git_file_list
set "FILE_LIST=%TEMP%\git_archive_files_%RANDOM%.txt"
git ls-files > "%FILE_LIST%"
if errorlevel 1 (
    del "%FILE_LIST%" 2>nul
    set "FILE_LIST="
    set "FILES_FROM_GIT=0"
    goto :eof
)
if exist "db_sync\latest_db.sql"          echo db_sync/latest_db.sql>> "%FILE_LIST%"
if exist "docker-compose.yml"             echo docker-compose.yml>> "%FILE_LIST%"
if exist "docker-compose.services.yml"    echo docker-compose.services.yml>> "%FILE_LIST%"
set "FILES_FROM_GIT=1"
goto :eof

:zip_done
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
::  STEP 5: Stop Docker Compose services (external DB untouched)
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