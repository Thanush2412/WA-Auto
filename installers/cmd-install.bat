@echo off
:: WhatsApp Automation V2 - Universal Installer (CMD & PowerShell Compatible)
:: Usage: curl -L https://raw.githubusercontent.com/Thanush2412/WA-Auto/master/installers/cmd-install.bat -o install.bat && install.bat

title WhatsApp Automation V2 - Universal Installer
color 0B

echo.
echo ========================================
echo   WhatsApp Automation V2 - Installer
echo ========================================
echo.

:: Check if PowerShell is available
powershell -Command "Write-Host 'PowerShell available'" >nul 2>&1
if %errorlevel% neq 0 (
    echo X PowerShell not found. This installer requires PowerShell.
    echo   Please install PowerShell or use Windows 10/11.
    pause
    exit /b 1
)

:: Set installation directory
set "INSTALL_DIR=%~dp0"
if "%1"=="-portable" (
    echo Installing in portable mode: %INSTALL_DIR%
) else (
    set "INSTALL_DIR=C:\WhatsApp-Automation-V2"
    echo Installing to: %INSTALL_DIR%
)

:: Create directory if needed
if not exist "%INSTALL_DIR%" (
    echo Creating installation directory...
    mkdir "%INSTALL_DIR%" 2>nul
    if errorlevel 1 (
        echo X Failed to create directory. Try running as Administrator.
        pause
        exit /b 1
    )
)

cd /d "%INSTALL_DIR%"

echo.
echo ^>^> Downloading essential files...
echo.

:: Download function using PowerShell (works in CMD)
call :download_file "https://raw.githubusercontent.com/Thanush2412/WA-Auto/master/start-app.ps1" "start-app.ps1"
call :download_file "https://raw.githubusercontent.com/Thanush2412/WA-Auto/master/Start WhatsApp Automation.bat" "Start WhatsApp Automation.bat"
call :download_file "https://raw.githubusercontent.com/Thanush2412/WA-Auto/master/package.json" "package.json"

echo.
echo ^>^> Checking prerequisites...
echo.

:: Check Node.js
node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f %%i in ('node --version') do echo OK Node.js %%i found
) else (
    echo X Node.js not found
    echo   Download from: https://nodejs.org/
    set /p choice="Open Node.js download page? [Y/N]: "
    if /i "!choice!"=="Y" start https://nodejs.org/
)

:: Check Python (optional)
python --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f %%i in ('python --version') do echo OK Python %%i found
) else (
    echo ! Python not found (optional)
    echo   Download from: https://python.org/
)

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo Installation path: %INSTALL_DIR%
echo.
echo To start the application:
echo   1. Double-click: Start WhatsApp Automation.bat
echo   2. Or run: start-app.ps1
echo.
set /p run_now="Start the application now? [Y/N]: "
if /i "%run_now%"=="Y" (
    echo.
    echo Starting WhatsApp Automation V2...
    if exist "start-app.ps1" (
        powershell -ExecutionPolicy Bypass -File "start-app.ps1"
    ) else (
        echo X start-app.ps1 not found. Installation may have failed.
        pause
    )
)

goto :eof

:: Download function
:download_file
set "url=%~1"
set "output=%~2"
echo Downloading %output%...

powershell -Command "try { $ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri '%url%' -OutFile '%output%' -UseBasicParsing -TimeoutSec 30; Write-Host 'OK Downloaded %output%' -ForegroundColor Green } catch { try { (New-Object System.Net.WebClient).DownloadFile('%url%', '%output%'); Write-Host 'OK Downloaded %output% (fallback)' -ForegroundColor Green } catch { Write-Host 'X Failed to download %output%' -ForegroundColor Red; exit 1 } }"

if %errorlevel% neq 0 (
    echo X Failed to download %output%
    set "download_failed=1"
)
goto :eof
