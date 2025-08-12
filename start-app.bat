@echo off
setlocal enabledelayedexpansion

:: Enable ANSI color codes
for /f %%A in ('echo prompt $E ^| cmd') do set "ESC=%%A"

:: Color definitions
set "RED=%ESC%[91m"
set "GREEN=%ESC%[92m"
set "YELLOW=%ESC%[93m"
set "BLUE=%ESC%[94m"
set "MAGENTA=%ESC%[95m"
set "CYAN=%ESC%[96m"
set "WHITE=%ESC%[97m"
set "BOLD=%ESC%[1m"
set "RESET=%ESC%[0m"

:: Clear screen and set title
cls
title WhatsApp Automation V2 - Startup Manager
mode con: cols=100 lines=30

echo.
echo %CYAN%╔══════════════════════════════════════════════════════════════════════════════════════════════╗%RESET%
echo %CYAN%║                                                                                              ║%RESET%
echo %CYAN%║%BOLD%%WHITE%                           🚀 WhatsApp Automation V2 Startup Manager 🚀                      %RESET%%CYAN%║%RESET%
echo %CYAN%║                                                                                              ║%RESET%
echo %CYAN%╚══════════════════════════════════════════════════════════════════════════════════════════════╝%RESET%
echo.

:: Function to display step header
:show_step
echo %BLUE%┌─────────────────────────────────────────────────────────────────────────────────────────────┐%RESET%
echo %BLUE%│ %BOLD%%WHITE%%~1%RESET%%BLUE%                                                                                    │%RESET%
echo %BLUE%└─────────────────────────────────────────────────────────────────────────────────────────────┘%RESET%
goto :eof

:: Step 1: Check Node.js and npm
call :show_step "Step 1/4: Checking Node.js and npm installation..."
echo.
echo %YELLOW%📋 Checking Node.js version...%RESET%
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%❌ Error: Node.js is not installed or not in PATH%RESET%
    echo %YELLOW%💡 Please install Node.js from https://nodejs.org/%RESET%
    pause
    exit /b 1
) else (
    for /f %%i in ('node --version') do echo %GREEN%✅ Node.js version: %%i%RESET%
)

echo %YELLOW%📋 Checking npm version...%RESET%
for /f %%i in ('npm --version') do echo %GREEN%✅ npm version: %%i%RESET%
echo.

:: Step 2: Install npm dependencies
call :show_step "Step 2/4: Installing npm dependencies..."
echo.
echo %YELLOW%📦 Installing Node.js dependencies...%RESET%
npm install
if %errorlevel% neq 0 (
    echo %RED%❌ Error: Failed to install npm dependencies%RESET%
    pause
    exit /b 1
) else (
    echo %GREEN%✅ npm dependencies installed successfully!%RESET%
)
echo.

:: Step 3: Check Python and install requirements
call :show_step "Step 3/4: Setting up Python environment..."
echo.
echo %YELLOW%🐍 Checking Python installation...%RESET%
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%❌ Warning: Python is not installed or not in PATH%RESET%
    echo %YELLOW%💡 Python scripts may not work properly%RESET%
    echo %YELLOW%💡 Please install Python from https://python.org/%RESET%
) else (
    for /f %%i in ('python --version') do echo %GREEN%✅ Python version: %%i%RESET%
    
    echo %YELLOW%📦 Installing Python requirements...%RESET%
    if exist "scripts\python\requirements.txt" (
        pip install -r scripts\python\requirements.txt
        if %errorlevel% neq 0 (
            echo %RED%❌ Warning: Failed to install some Python requirements%RESET%
            echo %YELLOW%💡 Some Python features may not work properly%RESET%
        ) else (
            echo %GREEN%✅ Python requirements installed successfully!%RESET%
        )
    ) else (
        echo %YELLOW%⚠️  requirements.txt not found in scripts\python\%RESET%
    )
)
echo.

:: Step 4: Start the application
:start_app
call :show_step "Step 4/4: Starting WhatsApp Automation V2..."
echo.
echo %GREEN%🚀 Starting the application...%RESET%
echo %CYAN%📱 WhatsApp Automation V2 is launching...%RESET%
echo.
echo %MAGENTA%┌─────────────────────────────────────────────────────────────────────────────────────────────┐%RESET%
echo %MAGENTA%│                                   🎉 Ready to Go! 🎉                                        │%RESET%
echo %MAGENTA%│                                                                                             │%RESET%
echo %MAGENTA%│  • The application window should open shortly                                               │%RESET%
echo %MAGENTA%│  • Make sure WhatsApp Web is logged in                                                     │%RESET%
echo %MAGENTA%│  • Check the application logs for any issues                                               │%RESET%
echo %MAGENTA%│                                                                                             │%RESET%
echo %MAGENTA%│  📝 To stop the application, close this window or press Ctrl+C                            │%RESET%
echo %MAGENTA%└─────────────────────────────────────────────────────────────────────────────────────────────┘%RESET%
echo.

:: Start the main application
echo %GREEN%🚀 Launching application...%RESET%
npm start

:: Check if the application exited normally or with an error
if %errorlevel% neq 0 (
    echo.
    echo %RED%❌ Application exited with error code: %errorlevel%%RESET%
    echo %YELLOW%💡 Check the logs above for error details%RESET%
) else (
    echo.
    echo %GREEN%✅ Application closed normally%RESET%
)

:: Application ended
echo.
echo %YELLOW%📊 Application has stopped%RESET%
echo %CYAN%Thank you for using WhatsApp Automation V2!%RESET%
echo.

:end_menu
echo %BLUE%┌─────────────────────────────────────────────────────────────────────────────────────────────┐%RESET%
echo %BLUE%│                                    What would you like to do?                               │%RESET%
echo %BLUE%└─────────────────────────────────────────────────────────────────────────────────────────────┘%RESET%
echo.
echo %GREEN%[1]%RESET% %WHITE%Restart the application%RESET%
echo %YELLOW%[2]%RESET% %WHITE%Exit%RESET%
echo.
set /p choice=%CYAN%Enter your choice (1 or 2): %RESET%

if "%choice%"=="1" (
    echo.
    echo %GREEN%🔄 Restarting application...%RESET%
    echo.
    goto :start_app
)
if "%choice%"=="2" (
    echo.
    echo %CYAN%👋 Goodbye!%RESET%
    goto :exit_app
)

echo %RED%❌ Invalid choice. Please enter 1 or 2.%RESET%
echo.
goto :end_menu

:exit_app
echo %BOLD%%WHITE%Press any key to exit...%RESET%
pause >nul
exit /b 0