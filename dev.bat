@echo off
setlocal EnableDelayedExpansion
title Ovvi — Dev Launcher

:: ============================================================
::  OVVI DEV LAUNCHER
::  Double-click this file to start the development environment
:: ============================================================

cls
echo.
echo  ============================================
echo    OVVI  ^|  Dev Launcher
echo  ============================================
echo.

:: --- Check Node is installed ---
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is not installed or not in PATH.
    echo          Install it from https://nodejs.org
    pause
    exit /b 1
)

:: --- Check we're in the right directory ---
if not exist "package.json" (
    echo  [ERROR] package.json not found.
    echo          Move this file to d:\CS Projects\ovvi and try again.
    pause
    exit /b 1
)

:: --- Check .env.local exists ---
if not exist ".env.local" (
    echo  [WARN]  .env.local not found. Copying from .env.example ...
    copy ".env.example" ".env.local" >nul 2>&1
    echo          Fill in your API keys in .env.local before continuing.
    echo.
)

:: --- Check if DATABASE_URL is filled in ---
set "DB_CONFIGURED=0"
for /f "usebackq tokens=1,* delims==" %%A in (".env.local") do (
    if "%%A"=="DATABASE_URL" (
        if not "%%B"=="" set "DB_CONFIGURED=1"
    )
)

:: --- Check if Clerk key is filled in ---
set "CLERK_CONFIGURED=0"
for /f "usebackq tokens=1,* delims==" %%A in (".env.local") do (
    if "%%A"=="NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" (
        if not "%%B"=="" set "CLERK_CONFIGURED=1"
    )
)

:: --- Status Report ---
echo  Environment Status:
echo  ------------------------------------------

if "!DB_CONFIGURED!"=="1" (
    echo   [OK]  DATABASE_URL is set
) else (
    echo   [!!]  DATABASE_URL is EMPTY  ^<-- fill in .env.local
)

if "!CLERK_CONFIGURED!"=="1" (
    echo   [OK]  Clerk keys are set
) else (
    echo   [!!]  CLERK_PUBLISHABLE_KEY is EMPTY  ^<-- fill in .env.local
)

echo  ------------------------------------------
echo.

:: --- Migration prompt (only if DB is configured) ---
if "!DB_CONFIGURED!"=="1" (
    echo  [?] Do you want to run DB migrations before starting?
    echo      (Safe to skip if already migrated)
    echo.
    choice /C YN /M "  Run migrations"
    if !errorlevel!==1 (
        echo.
        echo  Running: npm run db:generate ...
        call npm run db:generate
        if !errorlevel! neq 0 (
            echo.
            echo  [ERROR] db:generate failed. Check your DATABASE_URL.
            pause
            exit /b 1
        )
        echo.
        echo  Running: npm run db:migrate ...
        call npm run db:migrate
        if !errorlevel! neq 0 (
            echo.
            echo  [ERROR] db:migrate failed. See error above.
            pause
            exit /b 1
        )
        echo.
        echo  [OK] Migrations applied successfully.
        echo.
    )
)

:: --- Open browser after short delay (in background) ---
start "" cmd /c "timeout /t 3 >nul && start http://localhost:3000"

:: --- Start dev server ---
echo  Starting dev server on http://localhost:3000 ...
echo  (Browser will open automatically)
echo.
echo  Press Ctrl+C to stop.
echo  ============================================
echo.

call npm run dev

:: --- On exit ---
echo.
echo  Dev server stopped.
pause
