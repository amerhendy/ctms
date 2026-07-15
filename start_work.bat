@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo 📥 STEP 1: Pulling Latest Code from GitHub...
echo ===================================================
git pull origin main
echo ===================================================
echo.

echo ===================================================
echo 🐳 STEP 2: Starting Docker Containers...
echo ===================================================
docker compose up -d
echo  Waiting 5 seconds for PostgreSQL to boot up...
timeout /t 5 /nobreak > nul
echo ===================================================
echo.

echo ===================================================
echo 🔍 STEP 3: Searching for PostgreSQL Container...
echo ===================================================
for /f "tokens=*" %%i in ('docker ps --format "{{.Names}}" ^| findstr /i "postgres"') do (
    set DB_CONTAINER=%%i
)

if "%DB_CONTAINER%"=="" (
    echo ❌ ERROR: No container found with the name "postgres".
    pause
    exit /b
)
echo  Found Container Name: %DB_CONTAINER%
echo ===================================================
echo.

echo ===================================================
echo 🔑 STEP 4: Enter Database Credentials
echo ===================================================
set /p DB_USER="Enter Database User: "
set /p DB_NAME="Enter Database Name: "
set /p DB_PASSWORD="Enter Database Password: "
echo ===================================================
echo.

echo ===================================================
echo 📥 STEP 5: Importing Database Backup (psql)...
echo ===================================================
:: التحقق من وجود ملف قاعدة البيانات أولاً
if not exist .\db_sync\latest_db.sql (
    echo ❌ ERROR: No database file found at .\db_sync\latest_db.sql
    echo Make sure you have run end_work.bat on the other machine first!
    pause
    exit /b
)

:: تشغيل أمر الاستيراد الفعلي وتمرير الملف
docker exec -e PGPASSWORD=%DB_PASSWORD% -i %DB_CONTAINER% psql -U %DB_USER% -d %DB_NAME% < .\db_sync\latest_db.sql 2>.\db_sync\import_error.log

:: التحقق من نجاح عملية الاستيراد
if %ERRORLEVEL% EQU 0 (
    echo  Database Imported Successfully! [OK]
    if exist .\db_sync\import_error.log del .\db_sync\import_error.log
) else (
    echo ❌ IMPORT FAILED!
    type .\db_sync\import_error.log
    pause
    exit /b
)
echo ===================================================
echo.

echo ===================================================
echo 🎉 SUCCESS! Everything is up to date and ready for work!
echo ===================================================
pause