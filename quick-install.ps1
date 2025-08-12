# Quick One-liner Installer for WhatsApp Automation V2
# Run this in PowerShell: iex (iwr -useb 'your-url/quick-install.ps1').Content

Clear-Host
Write-Host "WhatsApp Automation V2 - Quick Install" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Quick download and run
try {
    $tempDir = [System.IO.Path]::GetTempPath() + "WhatsApp-Automation-V2"
    
    Write-Host "Creating temp directory..." -ForegroundColor Yellow
    if (!(Test-Path $tempDir)) {
        New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    }
    
    Set-Location $tempDir
    
    Write-Host "Downloading installer..." -ForegroundColor Yellow
    $installerUrl = "https://raw.githubusercontent.com/Thanush2412/WA-Auto/main/install.ps1"
    (New-Object System.Net.WebClient).DownloadFile($installerUrl, "$tempDir\install.ps1")
    
    Write-Host "Running full installer..." -ForegroundColor Green
    & ".\install.ps1"
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "Please check your internet connection and try again." -ForegroundColor Yellow
}
