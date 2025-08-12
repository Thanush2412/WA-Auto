@echo off
title WhatsApp Automation V2 - Chain Installer
color 0A

echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo                    🚀 WhatsApp Automation V2 🚀
echo                      CHAIN INSTALLER v2.0
echo                                                              
echo         Downloads → Installs → Configures → Runs Everything!                
echo ═══════════════════════════════════════════════════════════════════════════════
echo.

echo [INFO] Starting chain installation...

powershell -ExecutionPolicy Bypass -Command "iex (iwr 'https://raw.githubusercontent.com/Thanush2412/WA-Auto/master/installers/chain-install.ps1').Content"

echo.
echo [INFO] Installation process completed.
echo Press any key to exit...
pause >nul
