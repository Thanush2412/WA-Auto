# WhatsApp Automation V2 - Universal Installer
# One-command setup: Downloads → Installs → Runs

Clear-Host
Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║                    🚀 WhatsApp Automation V2 🚀                             ║" -ForegroundColor Magenta  
Write-Host "║                      Universal Installer                                    ║" -ForegroundColor Magenta
Write-Host "║                                                                              ║" -ForegroundColor Magenta
Write-Host "║         Downloads → Installs Dependencies → Runs Application                 ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

# Setup installation path
$InstallPath = Join-Path $env:USERPROFILE "WhatsApp-Automation-V2"
Write-Host "🔧 Setting up installation directory..." -ForegroundColor Yellow

if (Test-Path $InstallPath) {
    $BackupPath = $InstallPath + "_backup_" + (Get-Date -Format "yyyyMMdd_HHmmss")
    Write-Host "📦 Backing up existing installation..." -ForegroundColor Blue
    Move-Item $InstallPath $BackupPath -Force
}

New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
Set-Location $InstallPath

# Download repository
Write-Host "⬇️  Downloading repository..." -ForegroundColor Yellow
$ZipUrl = "https://github.com/Thanush2412/WA-Auto/archive/refs/heads/master.zip"
$ZipPath = Join-Path $InstallPath "wa-auto.zip"

try {
    Invoke-WebRequest -Uri $ZipUrl -OutFile $ZipPath -UseBasicParsing
    Write-Host "✅ Repository downloaded successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Download failed: $_" -ForegroundColor Red
    exit 1
}

# Extract files
Write-Host "📂 Extracting files..." -ForegroundColor Yellow
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory($ZipPath, $InstallPath)

$ExtractedFolder = Join-Path $InstallPath "WA-Auto-master"
if (Test-Path $ExtractedFolder) {
    Get-ChildItem $ExtractedFolder | Move-Item -Destination $InstallPath -Force
    Remove-Item $ExtractedFolder -Force
}
Remove-Item $ZipPath -Force

# Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow
$NodeInstalled = Get-Command "node" -ErrorAction SilentlyContinue
$NpmInstalled = Get-Command "npm" -ErrorAction SilentlyContinue

if (-not $NodeInstalled) {
    Write-Host "❌ Node.js not found! Please install from https://nodejs.org/" -ForegroundColor Red
    Write-Host "Press any key to exit..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host "✅ Node.js found: $(node --version)" -ForegroundColor Green

# Install dependencies
if (Test-Path "package.json") {
    Write-Host "📦 Installing Node.js dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ package.json not found!" -ForegroundColor Red
    exit 1
}

# Install Python requirements if available
$PythonInstalled = Get-Command "python" -ErrorAction SilentlyContinue
$RequirementsPath = "scripts\python\requirements.txt"

if ($PythonInstalled -and (Test-Path $RequirementsPath)) {
    Write-Host "🐍 Installing Python requirements..." -ForegroundColor Yellow
    python -m pip install -r $RequirementsPath
    Write-Host "✅ Python requirements installed" -ForegroundColor Green
}

# Create desktop shortcut
Write-Host "🔗 Creating desktop shortcut..." -ForegroundColor Yellow
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "WhatsApp Automation V2.lnk"
$LauncherPath = Join-Path $InstallPath "Start WhatsApp Automation.bat"

if (Test-Path $LauncherPath) {
    $WshShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
    $Shortcut.TargetPath = $LauncherPath
    $Shortcut.WorkingDirectory = $InstallPath
    $Shortcut.Description = "WhatsApp Automation V2"
    $Shortcut.Save()
    Write-Host "✅ Desktop shortcut created" -ForegroundColor Green
}

# Installation complete
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                            🎉 INSTALLATION COMPLETE! 🎉                       ║" -ForegroundColor Green
Write-Host "║                                                                              ║" -ForegroundColor Green
Write-Host "║  ✅ Repository downloaded and extracted                                      ║" -ForegroundColor Green
Write-Host "║  ✅ Dependencies installed                                                   ║" -ForegroundColor Green
Write-Host "║  ✅ Desktop shortcut created                                                 ║" -ForegroundColor Green
Write-Host "║                                                                              ║" -ForegroundColor Green
Write-Host "║  📍 Location: $InstallPath" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

# Launch application
Write-Host "🚀 Starting WhatsApp Automation V2..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

$StartAppPath = Join-Path $InstallPath "start-app.ps1"
if (Test-Path $StartAppPath) {
    & PowerShell -ExecutionPolicy Bypass -File $StartAppPath
} else {
    Write-Host "⚠️  Launcher not found. You can manually run the application from:" -ForegroundColor Yellow
    Write-Host "   $InstallPath" -ForegroundColor Cyan
}
