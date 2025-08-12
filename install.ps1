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
    Write-Host "✅ Tesseract OCR found at: $ProgramFilesTesseract" -ForegroundColor Green
} elseif (Test-Path $ProgramFilesx86Tesseract) {
    $TesseractFound = $true
    $TesseractLocation = $ProgramFilesx86Tesseract
    Write-Host "✅ Tesseract OCR found at: $ProgramFilesx86Tesseract" -ForegroundColor Green
}

if (-not $TesseractFound) {
    if (Test-Path $LocalTesseractPath) {
        Write-Host "📦 Installing Tesseract OCR to Program Files..." -ForegroundColor Yellow
        try {
            # Check if running as administrator
            $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
            
            if ($isAdmin) {
                # Copy Tesseract to Program Files
                Copy-Item $LocalTesseractPath $ProgramFilesTesseract -Recurse -Force
                
                # Add to system PATH
                $currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
                if ($currentPath -notlike "*$ProgramFilesTesseract*") {
                    [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$ProgramFilesTesseract", "Machine")
                    Write-Host "✅ Tesseract OCR installed at: $ProgramFilesTesseract" -ForegroundColor Green
                    Write-Host "✅ Added to system PATH" -ForegroundColor Green
                } else {
                    Write-Host "✅ Tesseract OCR installed at: $ProgramFilesTesseract" -ForegroundColor Green
                }
                
                # Remove local copy to save space
                Remove-Item $LocalTesseractPath -Recurse -Force
                Write-Host "🗑️ Removed local Tesseract copy (now available system-wide)" -ForegroundColor Blue
                $TesseractLocation = $ProgramFilesTesseract
            } else {
                Write-Host "⚠️ Administrator rights required to install Tesseract to Program Files" -ForegroundColor Yellow
                Write-Host "ℹ️ Tesseract will use local copy in project folder" -ForegroundColor Blue
                $TesseractLocation = $LocalTesseractPath
            }
        } catch {
            Write-Host "⚠️ Could not install Tesseract to Program Files: $_" -ForegroundColor Yellow
            Write-Host "ℹ️ Tesseract will use local copy in project folder" -ForegroundColor Blue
            $TesseractLocation = $LocalTesseractPath
        }
    } else {
        Write-Host "❌ Tesseract OCR folder not found in project" -ForegroundColor Red
    }
} else {
    # Remove local copy if it exists (since system version is available)
    if (Test-Path $LocalTesseractPath) {
        Remove-Item $LocalTesseractPath -Recurse -Force
        Write-Host "🗑️ Removed local Tesseract copy (using system version)" -ForegroundColor Blue
    }
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
Write-Host "║  ✅ Tesseract OCR configured                                                 ║" -ForegroundColor Green
Write-Host "║  ✅ Desktop shortcut created                                                 ║" -ForegroundColor Green
Write-Host "║                                                                              ║" -ForegroundColor Green
Write-Host "║  📍 Location: $InstallPath" -ForegroundColor Green
if ($TesseractLocation) {
    if ($TesseractLocation -like "*Program Files*") {
        Write-Host "║  👁️ Tesseract: Installed in Program Files" -ForegroundColor Green
    } else {
        Write-Host "║  👁️ Tesseract: Using local copy" -ForegroundColor Green
    }
}
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
