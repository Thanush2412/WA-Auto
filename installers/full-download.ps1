# WhatsApp Automation V2 - Full Repository Download
# Usage: iex (iwr -useb 'https://raw.githubusercontent.com/Thanush2412/WA-Auto/master/installers/full-download.ps1').Content

param(
    [string]$InstallPath = "WhatsApp-Automation-V2"
)

Clear-Host
Write-Host "🚀 WhatsApp Automation V2 - Full Repository Download" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# Color functions
function Write-Success { param($Text) Write-Host "✅ $Text" -ForegroundColor Green }
function Write-Info { param($Text) Write-Host "ℹ️  $Text" -ForegroundColor Cyan }
function Write-Warning { param($Text) Write-Host "⚠️  $Text" -ForegroundColor Yellow }
function Write-Error { param($Text) Write-Host "❌ $Text" -ForegroundColor Red }

# Check if git is available for clone
function Test-GitAvailable {
    try {
        $gitVersion = git --version 2>$null
        return $true
    } catch {
        return $false
    }
}

# Download function with retry
function Download-File {
    param($Url, $OutputPath, $Description = "file")
    
    $maxRetries = 3
    for ($i = 1; $i -le $maxRetries; $i++) {
        try {
            Write-Host "📥 Downloading $Description... (Attempt $i/$maxRetries)" -ForegroundColor Yellow
            
            # Create directory if needed
            $dir = Split-Path $OutputPath -Parent
            if ($dir -and !(Test-Path $dir)) {
                New-Item -ItemType Directory -Path $dir -Force | Out-Null
            }
            
            $ProgressPreference = 'SilentlyContinue'
            Invoke-WebRequest -Uri $Url -OutFile $OutputPath -UseBasicParsing -TimeoutSec 30
            Write-Success "Downloaded $Description"
            return $true
        } catch {
            if ($i -eq $maxRetries) {
                try {
                    # Fallback method
                    (New-Object System.Net.WebClient).DownloadFile($Url, (Resolve-Path $OutputPath -ErrorAction SilentlyContinue).Path -or $OutputPath)
                    Write-Success "Downloaded $Description (fallback)"
                    return $true
                } catch {
                    Write-Error "Failed to download $Description after $maxRetries attempts"
                    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
                    return $false
                }
            }
            Start-Sleep -Seconds 2
        }
    }
    return $false
}

Write-Info "Install location: $InstallPath"
Write-Host ""

# Create install directory
if (!(Test-Path $InstallPath)) {
    New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
    Write-Success "Created directory: $InstallPath"
}

Set-Location $InstallPath

# Method 1: Try git clone first (fastest and most complete)
if (Test-GitAvailable) {
    Write-Info "Git detected - attempting repository clone..."
    try {
        git clone https://github.com/Thanush2412/WA-Auto.git . 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Repository cloned successfully with git!"
            Write-Host ""
            Write-Host "🎉 Full installation complete!" -ForegroundColor Green
            Write-Host ""
            Write-Host "🚀 To start the application:" -ForegroundColor Cyan
            Write-Host "   • PowerShell: .\start-app.ps1" -ForegroundColor Yellow
            Write-Host "   • Double-click: Start WhatsApp Automation.bat" -ForegroundColor Yellow
            Write-Host ""
            
            $runNow = Read-Host "Start the application now? [Y/N]"
            if ($runNow.ToUpper() -eq "Y") {
                if (Test-Path "start-app.ps1") {
                    & ".\start-app.ps1"
                }
            }
            exit 0
        }
    } catch {
        Write-Warning "Git clone failed, falling back to individual file download..."
    }
} else {
    Write-Warning "Git not found, using individual file download method..."
}

Write-Host ""
Write-Info "Downloading files individually from GitHub..."
Write-Host ""

# Method 2: Download all files individually
$baseUrl = "https://raw.githubusercontent.com/Thanush2412/WA-Auto/master"

# Complete file list - all files from your repository
$allFiles = @{
    # Root files
    "start-app.ps1" = "$baseUrl/start-app.ps1"
    "Start WhatsApp Automation.bat" = "$baseUrl/Start%20WhatsApp%20Automation.bat"
    "package.json" = "$baseUrl/package.json"
    "package-portable.json" = "$baseUrl/package-portable.json"
    "README.md" = "$baseUrl/README.md"
    "QUICK-INSTALL.md" = "$baseUrl/QUICK-INSTALL.md"
    "build-portable.js" = "$baseUrl/build-portable.js"
    "setup-complete-standalone.bat" = "$baseUrl/setup-complete-standalone.bat"
    
    # Installers
    "installers/simple-install.ps1" = "$baseUrl/installers/simple-install.ps1"
    "installers/cmd-install.bat" = "$baseUrl/installers/cmd-install.bat"
    "installers/install.ps1" = "$baseUrl/installers/install.ps1"
    "installers/quick-install.ps1" = "$baseUrl/installers/quick-install.ps1"
    "installers/install.sh" = "$baseUrl/installers/install.sh"
    "installers/universal-install.ps1" = "$baseUrl/installers/universal-install.ps1"
    
    # Documentation
    "docs/README-INSTALL.md" = "$baseUrl/docs/README-INSTALL.md"
    "docs/README-PORTABLE.md" = "$baseUrl/docs/README-PORTABLE.md"
    "docs/INSTALLATION-SUCCESS.md" = "$baseUrl/docs/INSTALLATION-SUCCESS.md"
    
    # Scripts
    "scripts/paste.vbs" = "$baseUrl/scripts/paste.vbs"
    "scripts/send.vbs" = "$baseUrl/scripts/send.vbs"
    "scripts/python/requirements.txt" = "$baseUrl/scripts/python/requirements.txt"
    "scripts/python/verify.py" = "$baseUrl/scripts/python/verify.py"
    "scripts/python/verify_portable.py" = "$baseUrl/scripts/python/verify_portable.py"
    
    # Database
    "database/mongodb.js" = "$baseUrl/database/mongodb.js"
    
    # Source files
    "src/main/main.js" = "$baseUrl/src/main/main.js"
    "src/main/main-portable.js" = "$baseUrl/src/main/main-portable.js"
    "src/main/preload.js" = "$baseUrl/src/main/preload.js"
    "src/renderer/index.html" = "$baseUrl/src/renderer/index.html"
    
    # Assets
    "assets/app_icon.png" = "$baseUrl/assets/app_icon.png"
    "assets/logo.png" = "$baseUrl/assets/logo.png"
    "assets/not in whatsapp.png" = "$baseUrl/assets/not%20in%20whatsapp.png"
    
    # Temp
    "temp/messages.json" = "$baseUrl/temp/messages.json"
}

$successCount = 0
$totalFiles = $allFiles.Count
$currentFile = 0

Write-Info "Downloading $totalFiles files..."
Write-Host ""

foreach ($file in $allFiles.GetEnumerator()) {
    $currentFile++
    $localPath = $file.Key
    $url = $file.Value
    
    Write-Host "[$currentFile/$totalFiles] $localPath" -ForegroundColor Cyan
    if (Download-File $url $localPath $localPath) {
        $successCount++
    }
}

Write-Host ""
Write-Host "📊 Download Summary: $successCount/$totalFiles files" -ForegroundColor Cyan
Write-Host ""

if ($successCount -ge ($totalFiles * 0.8)) {  # 80% success rate
    Write-Success "Installation completed successfully!"
    Write-Host ""
    Write-Host "🚀 To start the application:" -ForegroundColor Cyan
    Write-Host "   • PowerShell: .\start-app.ps1" -ForegroundColor Yellow
    Write-Host "   • Double-click: Start WhatsApp Automation.bat" -ForegroundColor Yellow
    Write-Host ""
    
    $runNow = Read-Host "Start the application now? [Y/N]"
    if ($runNow.ToUpper() -eq "Y") {
        if (Test-Path "start-app.ps1") {
            & ".\start-app.ps1"
        } else {
            Write-Error "start-app.ps1 not found"
        }
    }
} elseif ($successCount -gt 0) {
    Write-Warning "Partial installation ($successCount/$totalFiles files)"
    Write-Host "Some files failed to download. The app might still work with what was downloaded." -ForegroundColor Gray
    Write-Host "You can try running: .\start-app.ps1" -ForegroundColor Yellow
} else {
    Write-Error "Installation failed - no files downloaded"
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Cyan
    Write-Host "1. Check your internet connection" -ForegroundColor Gray
    Write-Host "2. Try running as Administrator" -ForegroundColor Gray
    Write-Host "3. Check Windows Firewall/Antivirus settings" -ForegroundColor Gray
    Write-Host "4. Try the git clone method if you have git installed:" -ForegroundColor Gray
    Write-Host "   git clone https://github.com/Thanush2412/WA-Auto.git" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🌟 Thank you for using WhatsApp Automation V2!" -ForegroundColor Green
