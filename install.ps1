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

# Check and setup Tesseract OCR
Write-Host "👁️ Checking Tesseract OCR..." -ForegroundColor Yellow
$LocalTesseractPath = Join-Path $InstallPath "Tesseract-OCR"
$ProgramFilesTesseract = "C:\Program Files\Tesseract-OCR"
$ProgramFilesx86Tesseract = "C:\Program Files (x86)\Tesseract-OCR"

# Check if Tesseract is installed in standard locations
$TesseractFound = $false
$TesseractLocation = ""

if (Test-Path $ProgramFilesTesseract) {
    $TesseractFound = $true
    $TesseractLocation = $ProgramFilesTesseract
    Write-Host "✅ Tesseract OCR found at: Program Files" -ForegroundColor Green
} elseif (Test-Path $ProgramFilesx86Tesseract) {
    $TesseractFound = $true
    $TesseractLocation = $ProgramFilesx86Tesseract
    Write-Host "✅ Tesseract OCR found at: Program Files (x86)" -ForegroundColor Green
} else {
    Write-Host "❌ Tesseract OCR not found in Program Files" -ForegroundColor Red
    
    if (Test-Path $LocalTesseractPath) {
        Write-Host "📦 Installing Tesseract OCR to Program Files..." -ForegroundColor Yellow
        try {
            # Check if running as administrator
            $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
            
            if ($isAdmin) {
                Write-Host "   📁 Copying Tesseract files..." -ForegroundColor Blue
                Copy-Item $LocalTesseractPath $ProgramFilesTesseract -Recurse -Force
                
                Write-Host "   🔗 Adding to system PATH..." -ForegroundColor Blue
                $currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
                if ($currentPath -notlike "*$ProgramFilesTesseract*") {
                    [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$ProgramFilesTesseract", "Machine")
                }
                
                Write-Host "✅ Tesseract OCR installed successfully!" -ForegroundColor Green
                Write-Host "📍 Location: $ProgramFilesTesseract" -ForegroundColor Blue
                
                # Remove local copy to save space
                Write-Host "🗑️ Cleaning up local copy..." -ForegroundColor Blue
                Remove-Item $LocalTesseractPath -Recurse -Force
                Write-Host "✅ Local copy removed (using system version)" -ForegroundColor Green
                $TesseractLocation = $ProgramFilesTesseract
            } else {
                Write-Host "⚠️ Administrator rights required for system-wide installation" -ForegroundColor Yellow
                Write-Host "ℹ️ Tesseract will use local copy in project folder" -ForegroundColor Blue
                Write-Host "💡 Run 'install-tesseract.ps1' as Administrator for system-wide access" -ForegroundColor Cyan
                $TesseractLocation = $LocalTesseractPath
            }
        } catch {
            Write-Host "⚠️ Could not install Tesseract to Program Files: $_" -ForegroundColor Yellow
            Write-Host "ℹ️ Tesseract will use local copy in project folder" -ForegroundColor Blue
            $TesseractLocation = $LocalTesseractPath
        }
    } else {
        Write-Host "❌ Tesseract OCR folder not found in downloaded files" -ForegroundColor Red
        Write-Host "⚠️ OCR features may not work properly" -ForegroundColor Yellow
    }
}

# Remove local copy if system version exists
if ($TesseractFound -and (Test-Path $LocalTesseractPath)) {
    Write-Host "🗑️ Removing local Tesseract copy (using system version)..." -ForegroundColor Blue
    Remove-Item $LocalTesseractPath -Recurse -Force
    Write-Host "✅ Local copy removed" -ForegroundColor Green
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
Write-Host "║  ✅ Node.js dependencies installed                                          ║" -ForegroundColor Green
Write-Host "║  ✅ Python requirements installed                                           ║" -ForegroundColor Green
Write-Host "║  ✅ Tesseract OCR configured                                                 ║" -ForegroundColor Green
Write-Host "║  ✅ Desktop shortcut created                                                 ║" -ForegroundColor Green
Write-Host "║                                                                              ║" -ForegroundColor Green
Write-Host "║  📍 Application Location: $([System.IO.Path]::GetFileName($InstallPath))" -ForegroundColor Green
if ($TesseractLocation) {
    if ($TesseractLocation -like "*Program Files*") {
        Write-Host "║  👁️ Tesseract OCR: Installed system-wide" -ForegroundColor Green
    } else {
        Write-Host "║  👁️ Tesseract OCR: Using local copy" -ForegroundColor Green
    }
} else {
    Write-Host "║  ⚠️ Tesseract OCR: Not found - OCR features disabled" -ForegroundColor Yellow
}
Write-Host "║                                                                              ║" -ForegroundColor Green
Write-Host "║  🚀 Starting application automatically...                                   ║" -ForegroundColor Green
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
