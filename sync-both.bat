@echo off
REM Master Sync Control Script for Windows - Flexible Paths & Colored
setlocal enabledelayedexpansion

REM تعريف متغيرات الألوان (ANSI Codes)
set "CLR_RESET=^[[0m"
set "CLR_START=^[[94m"
set "CLR_OK=^[[92m"
set "CLR_INFO=^[[36m"
set "CLR_WARN=^[[93m"
set "CLR_ERR=^[[91m"

:MENU
cls
echo.
echo %CLR_START%========================================
echo        DOCKER AUTO-SYNC TOOL
echo ========================================%CLR_RESET%
echo.
echo [1] BACKUP  - Run on HOME machine
echo [2] RESTORE - Run on WORK machine
echo [3] STATUS  - Show current Docker state
echo [4] EXIT
echo.
echo %CLR_START%========================================%CLR_RESET%
set /p CHOICE="Enter your choice (1-4) and press Enter: "

if "%CHOICE%"=="1" goto SET_PATHS
if "%CHOICE%"=="2" goto SET_PATHS
if "%CHOICE%"=="3" goto DO_STATUS
if "%CHOICE%"=="4" exit /b 0

echo %CLR_WARN%Invalid choice, please try again...%CLR_RESET%
pause
goto MENU

:SET_PATHS
echo.
echo %CLR_INFO%--- Path Configuration (Press ENTER to use current folder) ---%CLR_RESET%

REM 1. اختيار مكان ملفات الدوكر
set /p DOCKER_PATH="Enter Docker project path (e.g., C:\MyProject): "
if "!DOCKER_PATH!"=="" set "DOCKER_PATH=."
REM إزالة علامات التنصيص الزائدة إن وجدت
set "DOCKER_PATH=%DOCKER_PATH:"=%"

REM 2. اختيار مكان مجلد الـ Backup
set /p BACKUP_ROOT="Enter Backup folder path (e.g., F:\.docker-backup): "
if "!BACKUP_ROOT!"=="" set "BACKUP_ROOT=.docker-backup"
set "BACKUP_ROOT=%BACKUP_ROOT:"=%"

REM التوجه لمجلد الدوكر لتنفيذ العمليات من داخله
if not exist "!DOCKER_PATH!" (
    echo %CLR_ERR%[ERROR] Docker path does not exist: "!DOCKER_PATH!"%CLR_RESET%
    pause
    goto MENU
)

REM الانتقال للوضع المطلوب
if "%CHOICE%"=="1" goto DO_BACKUP
if "%CHOICE%"=="2" goto DO_RESTORE
goto MENU

:DO_STATUS
echo.
echo %CLR_START%========== CURRENT DOCKER STATE ==========%CLR_RESET%
echo.
echo %CLR_INFO%Containers:%CLR_RESET%
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Image}}" 2>nul || echo No containers found.
echo.
echo %CLR_INFO%Volumes:%CLR_RESET%
docker volume ls --format "table {{.Name}}\t{{.Driver}}" 2>nul || echo No volumes found.
echo.
echo %CLR_INFO%Images:%CLR_RESET%
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" 2>nul || echo No images found.
echo.
pause
goto MENU

:DO_BACKUP
echo.
echo %CLR_START%Starting BACKUP mode...%CLR_RESET%
REM التحقق من وجود سكربت الباك أب بجانب هذا السكربت الحالي أولاً
if not exist "%~dp0docker-backup.bat" (
    echo %CLR_ERR%[ERROR] docker-backup.bat NOT found in the script directory!%CLR_RESET%
    pause
    goto MENU
)

REM نمرر للباك أب مسار مجلد المشروع ومسار مجلد الحفظ الرئيسي
cd /d "!DOCKER_PATH!"
call "%~dp0docker-backup.bat" "!BACKUP_ROOT!"
cd /d "%~dp0"
pause
goto MENU

:DO_RESTORE
echo.
echo %CLR_START%Starting RESTORE mode...%CLR_RESET%
if not exist "%~dp0docker-restore.bat" (
    echo %CLR_ERR%[ERROR] docker-restore.bat NOT found in the script directory!%CLR_RESET%
    pause
    goto MENU
)

REM البحث عن أحدث نسخة داخل المجلد الذي اخترته أنت
set "LATEST_BACKUP="
if exist "!BACKUP_ROOT!" (
    for /d %%D in ("!BACKUP_ROOT!\backup_*") do (
        set "LATEST_BACKUP=%%D"
    )
)

if not defined LATEST_BACKUP (
    echo %CLR_ERR%[ERROR] No backup found in: "!BACKUP_ROOT!"%CLR_RESET%
    pause
    goto MENU
)

echo %CLR_OK%Found backup: !LATEST_BACKUP!%CLR_RESET%

REM الانتقال لمجلد مشروع الدوكر وتمرير مسار الباك أب المختار لسكربت الاستعادة
cd /d "!DOCKER_PATH!"
for /f "delims=" %%A in ("!LATEST_BACKUP!") do (
    endlocal
    call "%~dp0docker-restore.bat" "%%A"
)
cd /d "%~dp0"
pause
goto MENU