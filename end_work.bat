@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo 🐳 STEP 1: Searching for PostgreSQL Container...
echo ===================================================
for /f "tokens=*" %%i in ('docker ps --format "{{.Names}}" ^| findstr /i "postgres"') do (
    set DB_CONTAINER=%%i
)

if "%DB_CONTAINER%"=="" (
    echo ❌ ERROR: No container found with the name "postgres".
    echo Please make sure your docker containers are running!
    echo.
    pause
    exit /b
)
echo  Found Container Name: %DB_CONTAINER%
echo ===================================================
echo.

echo ===================================================
echo 🔑 STEP 2: Enter Database Credentials
echo ===================================================
set /p DB_USER="Enter Database User (e.g. postgres): "
set /p DB_NAME="Enter Database Name: "
set /p DB_PASSWORD="Enter Database Password: "
echo ===================================================
echo.

echo ===================================================
echo 📤 STEP 3: Exporting Database Backup (pg_dump)...
echo ===================================================
if not exist .\db_sync mkdir .\db_sync

docker exec -e PGPASSWORD=%DB_PASSWORD% -i %DB_CONTAINER% pg_dump -U %DB_USER% -d %DB_NAME% -F p > .\db_sync\latest_db.sql 2>.\db_sync\export_error.log
pause
if %ERRORLEVEL% EQU 0 (
    echo  Backup Exported Successfully! [OK]
    if exist .\db_sync\export_error.log del .\db_sync\export_error.log
) else (
    echo ❌ EXPORT FAILED!
    echo Error Details:
    type .\db_sync\export_error.log
    echo.
    pause
    exit /b
)
echo ===================================================
echo.

echo ===================================================
echo 🛑 STEP 4: Stopping Docker Containers...
echo ===================================================
:: تحديد ملف اليامل المناسب لتجنب خطأ الـ not found
if exist docker-compose.yml (
    docker compose -f docker-compose.yml down
) else if exist docker-compose.services.yml (
    docker compose -f docker-compose.services.yml down
) else (
    :: إذا لم يجد ملف يامل، سيقوم بإيقاف الحاوية مباشرة عن طريق اسمها
    echo  No docker-compose file found. Stopping container %DB_CONTAINER% directly...
    docker stop %DB_CONTAINER%
)
echo ===================================================
echo.

echo ===================================================
echo 🚀 STEP 5: Pushing Code and Database to GitHub...
echo ===================================================
:: التحقق أولاً هل المجلد الحالي هو مستودع جيت أم لا
if not exist .git (
    echo ❌ WARNING: This directory is not a Git repository!
    echo Skip pushing to GitHub. Please initialize Git first using: git init
    echo ===================================================
    pause
    exit /b
)

git add .
set "commit_msg=Automatic backup and sync - %DATE% %TIME%"
git commit -m "%commit_msg%"
git push origin main

echo.
echo ===================================================
echo 🏁 ALL DONE! Work saved, DB exported, and pushed to GitHub.
echo ===================================================
pause