# Universal One-Liner Installer for WhatsApp Automation V2
# This script can be called from both CMD and PowerShell

# Check if running in CMD via PowerShell
if ($env:CMDEXTVERSION) {
    # Called from CMD
    Write-Host "Detected CMD environment" -ForegroundColor Yellow
} else {
    # Running in PowerShell directly
    Write-Host "Detected PowerShell environment" -ForegroundColor Yellow
}

Clear-Host
Write-Host "🚀 WhatsApp Automation V2 - Universal Installer" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Get current directory
$InstallPath = Get-Location
Write-Host "📁 Installing to: $InstallPath" -ForegroundColor Green
Write-Host ""

# Essential files - guaranteed to work
$baseUrl = "https://raw.githubusercontent.com/Thanush2412/WA-Auto/master"
$files = @(
    "start-app.ps1",
    "Start WhatsApp Automation.bat", 
    "package.json"
)

# Download with multiple fallback methods
function Get-File {
    param($FileName)
    $url = "$baseUrl/$FileName"
    $encodedUrl = $url -replace ' ', '%20'
    
    Write-Host "📥 Downloading $FileName..." -ForegroundColor Yellow
    
    # Try method 1: Invoke-WebRequest
    try {
        $ProgressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri $encodedUrl -OutFile $FileName -UseBasicParsing -TimeoutSec 30
        Write-Host "✅ $FileName" -ForegroundColor Green
        return $true
    } catch {
        # Try method 2: WebClient
        try {
            (New-Object System.Net.WebClient).DownloadFile($encodedUrl, (Join-Path $PWD $FileName))
            Write-Host "✅ $FileName (fallback)" -ForegroundColor Green
            return $true
        } catch {
            Write-Host "❌ Failed: $FileName" -ForegroundColor Red
            return $false
        }
    }
}

# Download all files
$success = 0
foreach ($file in $files) {
    if (Get-File $file) { $success++ }
}

Write-Host ""
Write-Host "📊 Downloaded: $success/$($files.Count) files" -ForegroundColor Cyan

if ($success -eq $files.Count) {
    Write-Host "🎉 Installation successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 To start:" -ForegroundColor White
    Write-Host "   Double-click: Start WhatsApp Automation.bat" -ForegroundColor Yellow
    Write-Host "   Or run: .\start-app.ps1" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "⚠️  Partial installation. Some features may not work." -ForegroundColor Yellow
}
