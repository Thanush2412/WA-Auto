# Tesseract OCR System-Wide Installer
# Run this script as Administrator to install Tesseract OCR system-wide

param(
    [string]$SourcePath = (Join-Path (Get-Location) "Tesseract-OCR")
)

# Check if running as administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Administrator)) {
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "💡 Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host "Press any key to exit..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host "🔧 Tesseract OCR System-Wide Installer" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

$SystemTesseractPath = "C:\Tesseract-OCR"

# Check if source exists
if (-not (Test-Path $SourcePath)) {
    Write-Host "❌ Tesseract source folder not found at: $SourcePath" -ForegroundColor Red
    Write-Host "💡 Make sure you're running this from the WhatsApp Automation folder" -ForegroundColor Yellow
    Write-Host "Press any key to exit..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Check if already installed
$TesseractInstalled = Get-Command "tesseract" -ErrorAction SilentlyContinue
if ($TesseractInstalled) {
    Write-Host "✅ Tesseract is already installed system-wide" -ForegroundColor Green
    Write-Host "📍 Location: $($TesseractInstalled.Source)" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Do you want to update/reinstall? (y/N): " -ForegroundColor Yellow -NoNewline
    $response = Read-Host
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-Host "Installation cancelled." -ForegroundColor Gray
        exit 0
    }
}

try {
    Write-Host "📦 Installing Tesseract OCR to C:\Tesseract-OCR..." -ForegroundColor Yellow
    
    # Remove existing installation
    if (Test-Path $SystemTesseractPath) {
        Write-Host "🗑️ Removing existing installation..." -ForegroundColor Blue
        Remove-Item $SystemTesseractPath -Recurse -Force
    }
    
    # Copy Tesseract to C: drive
    Write-Host "📁 Copying files..." -ForegroundColor Blue
    Copy-Item $SourcePath $SystemTesseractPath -Recurse -Force
    
    # Add to system PATH
    Write-Host "🔗 Adding to system PATH..." -ForegroundColor Blue
    $currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
    if ($currentPath -notlike "*$SystemTesseractPath*") {
        [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$SystemTesseractPath", "Machine")
        Write-Host "✅ Added to system PATH" -ForegroundColor Green
    } else {
        Write-Host "✅ Already in system PATH" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "🎉 Tesseract OCR installed successfully!" -ForegroundColor Green
    Write-Host "📍 Location: $SystemTesseractPath" -ForegroundColor Blue
    Write-Host "💡 You may need to restart your terminal/applications to use the new PATH" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Testing installation..." -ForegroundColor Blue
    
    # Test the installation
    $env:PATH = [Environment]::GetEnvironmentVariable("PATH", "Machine")
    $tesseractTest = Get-Command "tesseract" -ErrorAction SilentlyContinue
    if ($tesseractTest) {
        Write-Host "✅ Tesseract is now available system-wide!" -ForegroundColor Green
        $version = & tesseract --version 2>&1 | Select-Object -First 1
        Write-Host "📋 Version: $version" -ForegroundColor Blue
    } else {
        Write-Host "⚠️ Installation completed but may require system restart" -ForegroundColor Yellow
    }

} catch {
    Write-Host "❌ Installation failed: $_" -ForegroundColor Red
    Write-Host "💡 Try running as Administrator or check permissions" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
