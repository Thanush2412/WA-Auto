#!/bin/bash
# WhatsApp Automation V2 - Cross-platform installer
# Usage: curl -sSL https://raw.githubusercontent.com/Thanush2412/WA-Auto/master/installers/install.sh | bash
# Or: wget -qO- https://raw.githubusercontent.com/Thanush2412/WA-Auto/master/installers/install.sh | bash

echo "🚀 WhatsApp Automation V2 - Quick Installer"
echo "============================================="
echo ""

# Detect OS
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OS" == "Windows_NT" ]]; then
    OS="windows"
    SCRIPT_EXT=".ps1"
    LAUNCHER_EXT=".bat"
else
    echo "❌ This installer currently supports Windows only."
    echo "💡 Please run this on Windows or WSL."
    exit 1
fi

echo "📋 Detected OS: Windows"
echo "📂 Current directory: $(pwd)"
echo ""

# Base URL for files (replace with your actual repository)
BASE_URL="https://raw.githubusercontent.com/Thanush2412/WA-Auto/master"

# Download function
download_file() {
    local url="$1"
    local output="$2"
    echo "📥 Downloading $output..."
    
    if command -v curl &> /dev/null; then
        curl -sSL "$url" -o "$output"
    elif command -v wget &> /dev/null; then
        wget -q "$url" -O "$output"
    else
        echo "❌ Neither curl nor wget found. Please install one of them."
        return 1
    fi
    
    if [ $? -eq 0 ]; then
        echo "✅ Downloaded $output"
        return 0
    else
        echo "❌ Failed to download $output"
        return 1
    fi
}

# Download files
echo "📦 Downloading WhatsApp Automation V2 files..."
echo ""

download_file "$BASE_URL/start-app.ps1" "start-app.ps1"
download_file "$BASE_URL/Start%20WhatsApp%20Automation.bat" "Start WhatsApp Automation.bat"

echo ""
echo "🎉 Installation complete!"
echo ""
echo "📋 You can now run:"
echo "   • PowerShell: ./start-app.ps1"
echo "   • Double-click: Start WhatsApp Automation.bat"
echo ""
echo "💡 Make sure you have Node.js and npm installed!"
echo "💡 Python is optional but recommended for full functionality."
echo ""

# Ask if user wants to run now
read -p "🚀 Do you want to run it now? [Y/n]: " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
    echo "🎯 Starting WhatsApp Automation V2..."
    powershell.exe -ExecutionPolicy Bypass -File "start-app.ps1"
fi
