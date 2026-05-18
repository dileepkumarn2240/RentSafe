@echo off
set "PROJECT_ROOT=%~dp0"

echo ===================================================
echo [RentSafe] Starting Frontend Development Server...
echo ===================================================

cd "%PROJECT_ROOT%"
echo Current Directory: %CD%

echo Ensuring dependencies are installed...
call npm install

call npm run dev -- --force

pause
