# WhatsApp Automation V2 - Minimal Installer
# Usage: iex (iwr -useb 'https://raw.githubusercontent.com/Thanush2412/WA-Auto/master/installers/simple-install.ps1').Content

Clear-Host
Write-Host "🚀 WhatsApp Automation V2 - Minimal Installer" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Set working directory
$InstallPath = Get-Location
Write-Host "📁 Installing to: $InstallPath" -ForegroundColor Green
Write-Host ""

# Essential files only - confirmed to exist
$baseUrl = "https://raw.githubusercontent.com/Thanush2412/WA-Auto/master"
$essentialFiles = @(
    @{ Name = "start-app.ps1"; Url = "$baseUrl/start-app.ps1" },
    @{ Name = "Start WhatsApp Automation.bat"; Url = "$baseUrl/Start%20WhatsApp%20Automation.bat" },
    @{ Name = "package.json"; Url = "$baseUrl/package.json" }
)

# Simple download function with retry
function Download-Essential {
    param($Url, $OutputFile)
    
    $maxRetries = 3
    for ($i = 1; $i -le $maxRetries; $i++) {
        try {
            Write-Host "📥 Downloading $OutputFile... (Attempt $i/$maxRetries)" -ForegroundColor Yellow
            
            # Method 1: Invoke-WebRequest
            $ProgressPreference = 'SilentlyContinue'
            Invoke-WebRequest -Uri $Url -OutFile $OutputFile -UseBasicParsing -TimeoutSec 30
            Write-Host "✅ Downloaded $OutputFile" -ForegroundColor Green
            return $true
        } catch {
            if ($i -eq $maxRetries) {
                try {
                    # Method 2: WebClient fallback
                    Write-Host "🔄 Trying fallback method..." -ForegroundColor Yellow
                    (New-Object System.Net.WebClient).DownloadFile($Url, (Join-Path $PWD $OutputFile))
                    Write-Host "✅ Downloaded $OutputFile (fallback)" -ForegroundColor Green
                    return $true
                } catch {
                    Write-Host "❌ Failed to download $OutputFile after $maxRetries attempts" -ForegroundColor Red
                    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
                    return $false
                }
            }
            Start-Sleep -Seconds 2
        }
    }
    return $false
}

# Download essential files
$successCount = 0
$totalFiles = $essentialFiles.Count

foreach ($file in $essentialFiles) {
    if (Download-Essential $file.Url $file.Name) {
        $successCount++
    }
}

Write-Host ""
Write-Host "📊 Download Summary: $successCount/$totalFiles files" -ForegroundColor Cyan
Write-Host ""

if ($successCount -eq $totalFiles) {
    Write-Host "🎉 Installation successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 You can now run:" -ForegroundColor Cyan
    Write-Host "   • PowerShell: .\start-app.ps1" -ForegroundColor Yellow
    Write-Host "   • Double-click: Start WhatsApp Automation.bat" -ForegroundColor Yellow
    Write-Host ""
    
    $runNow = Read-Host "Start the application now? [Y/N]"
    if ($runNow.ToUpper() -eq "Y") {
        if (Test-Path "start-app.ps1") {
            & ".\start-app.ps1"
        } else {
            Write-Host "❌ start-app.ps1 not found" -ForegroundColor Red
        }
    }
} elseif ($successCount -gt 0) {
    Write-Host "⚠️  Partial installation ($successCount/$totalFiles files)" -ForegroundColor Yellow
    Write-Host "You can try running with what was downloaded:" -ForegroundColor Gray
    Write-Host ".\start-app.ps1" -ForegroundColor Yellow
} else {
    Write-Host "❌ Installation failed - no files downloaded" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Cyan
    Write-Host "1. Check your internet connection" -ForegroundColor Gray
    Write-Host "2. Try running as Administrator" -ForegroundColor Gray
    Write-Host "3. Check Windows Firewall/Antivirus settings" -ForegroundColor Gray
    Write-Host "4. Try the CMD installer instead:" -ForegroundColor Gray
    Write-Host "   curl -L https://raw.githubusercontent.com/Thanush2412/WA-Auto/master/installers/cmd-install.bat -o install.bat && install.bat" -ForegroundColor Yellow
}
