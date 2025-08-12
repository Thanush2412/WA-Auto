@echo off
title WhatsApp Automation V2 - Launcher
echo Starting WhatsApp Automation V2...
echo.

:: Check if PowerShell script exists
if not exist "start-app.ps1" (
    echo Error: start-app.ps1 not found!
    pause
    exit /b 1
)

:: Run PowerShell script with execution policy bypass
powershell.exe -ExecutionPolicy Bypass -NoProfile -File "start-app.ps1"

:: Keep window open if there was an error
if %errorlevel% neq 0 (
    echo.
    echo PowerShell script ended with error code: %errorlevel%
    pause
)
