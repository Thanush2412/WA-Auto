@echo off
title WhatsApp Automation V2 - Installer
color 0A

echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo                    🚀 WhatsApp Automation V2 🚀
echo                      Universal Installer
echo                                                              
echo         Downloads → Installs Dependencies → Runs Application                
echo ═══════════════════════════════════════════════════════════════════════════════
echo.

echo [INFO] Starting installation...
echo.

powershell -ExecutionPolicy Bypass -Command "iex (iwr 'https://raw.githubusercontent.com/Thanush2412/WA-Auto/master/install.ps1').Content"

echo.
echo [INFO] Installation completed.
echo Press any key to exit...
pause >nul
