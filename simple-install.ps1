# WhatsApp Automation V2 - Simple Installer
# Usage: iex (iwr -useb 'https://raw.githubusercontent.com/Thanush2412/WA-Auto/main/simple-install.ps1').Content

Clear-Host
Write-Host "🚀 WhatsApp Automation V2 - Simple Installer" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Set working directory
$InstallPath = Get-Location
Write-Host "📁 Installing to: $InstallPath" -ForegroundColor Green
Write-Host ""

# Essential files only
$baseUrl = "https://raw.githubusercontent.com/Thanush2412/WA-Auto/main"
$essentialFiles = @{
    "start-app.ps1" = "$baseUrl/start-app.ps1"
    "Start WhatsApp Automation.bat" = "$baseUrl/Start%20WhatsApp%20Automation.bat"
    "package.json" = "$baseUrl/package.json"
}

# Simple download function
function Download-Essential {
    param($Url, $OutputFile)
    
    try {
        Write-Host "📥 Downloading $OutputFile..." -ForegroundColor Yellow
        $webRequest = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 30
        [System.IO.File]::WriteAllBytes($OutputFile, $webRequest.Content)
        Write-Host "✅ Downloaded $OutputFile" -ForegroundColor Green
        return $true
    } catch {
        try {
            # Fallback method
            (New-Object System.Net.WebClient).DownloadFile($Url, $OutputFile)
            Write-Host "✅ Downloaded $OutputFile (fallback)" -ForegroundColor Green
            return $true
        } catch {
            Write-Host "❌ Failed to download $OutputFile" -ForegroundColor Red
            return $false
        }
    }
}

# Download essential files
$successCount = 0
foreach ($file in $essentialFiles.GetEnumerator()) {
    if (Download-Essential $file.Value $file.Key) {
        $successCount++
    }
}

Write-Host ""
if ($successCount -eq $essentialFiles.Count) {
    Write-Host "🎉 Download complete! ($successCount/$($essentialFiles.Count) files)" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 You can now run:" -ForegroundColor Cyan
    Write-Host "   • PowerShell: .\start-app.ps1" -ForegroundColor Yellow
    Write-Host "   • Double-click: Start WhatsApp Automation.bat" -ForegroundColor Yellow
    Write-Host ""
    
    $runNow = Read-Host "Start now? [Y/N]"
    if ($runNow.ToUpper() -eq "Y") {
        & ".\start-app.ps1"
    }
} else {
    Write-Host "⚠️  Partial download ($successCount/$($essentialFiles.Count) files)" -ForegroundColor Yellow
    Write-Host "You can try running the full installer instead:" -ForegroundColor Gray
    Write-Host "iex (iwr -useb 'https://raw.githubusercontent.com/Thanush2412/WA-Auto/main/install.ps1').Content" -ForegroundColor Gray
}
