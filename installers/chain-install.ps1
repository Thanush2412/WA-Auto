# ═══════════════════════════════════════════════════════════════════════════════
# 🚀 WhatsApp Automation V2 - Chain Installer
# ═══════════════════════════════════════════════════════════════════════════════
# One-command installer that downloads, installs, and runs everything!
# Usage: iex (iwr "https://raw.githubusercontent.com/Thanush2412/WA-Auto/master/installers/chain-install.ps1").Content

# Color functions for beautiful output
function Write-ColorText {
    param([string]$Text, [string]$Color = "White")
    $colors = @{
        "Red" = "`e[31m"; "Green" = "`e[32m"; "Yellow" = "`e[33m"; "Blue" = "`e[34m"
        "Magenta" = "`e[35m"; "Cyan" = "`e[36m"; "White" = "`e[37m"; "Reset" = "`e[0m"
    }
    Write-Host "$($colors[$Color])$Text$($colors['Reset'])"
}

function Write-Step {
    param([string]$Message, [int]$Step, [int]$Total)
    Write-ColorText "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Cyan"
    Write-ColorText "🚀 STEP $Step/$Total`: $Message" "Yellow"
    Write-ColorText "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Cyan"
}

function Write-Success {
    param([string]$Message)
    Write-ColorText "✅ $Message" "Green"
}

function Write-Error {
    param([string]$Message)
    Write-ColorText "❌ $Message" "Red"
}

function Write-Info {
    param([string]$Message)
    Write-ColorText "ℹ️  $Message" "Blue"
}

function Test-CommandExists {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Main installation function
function Start-ChainInstall {
    Clear-Host
    
    Write-ColorText "╔══════════════════════════════════════════════════════════════════════════════╗" "Magenta"
    Write-ColorText "║                    🚀 WhatsApp Automation V2 🚀                             ║" "Magenta"
    Write-ColorText "║                      CHAIN INSTALLER v2.0                                   ║" "Magenta"
    Write-ColorText "║                                                                              ║" "Magenta"
    Write-ColorText "║         Downloads → Installs → Configures → Runs Everything!                ║" "Magenta"
    Write-ColorText "╚══════════════════════════════════════════════════════════════════════════════╝" "Magenta"
    Write-Host ""

    # Step 1: Setup directories
    Write-Step "Setting up installation directory" 1 8
    
    $InstallPath = Join-Path $env:USERPROFILE "WhatsApp-Automation-V2"
    $BackupPath = $InstallPath + "_backup_" + (Get-Date -Format "yyyyMMdd_HHmmss")
    
    if (Test-Path $InstallPath) {
        Write-Info "Existing installation found. Creating backup..."
        try {
            Move-Item $InstallPath $BackupPath -Force
            Write-Success "Backup created at: $BackupPath"
        } catch {
            Write-Error "Failed to backup existing installation: $_"
            return
        }
    }
    
    try {
        New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
        Set-Location $InstallPath
        Write-Success "Installation directory created: $InstallPath"
    } catch {
        Write-Error "Failed to create installation directory: $_"
        return
    }

    # Step 2: Download repository
    Write-Step "Downloading repository from GitHub" 2 8
    
    $GitHubRepo = "https://github.com/Thanush2412/WA-Auto"
    $ZipUrl = "$GitHubRepo/archive/refs/heads/master.zip"
    $ZipPath = Join-Path $InstallPath "wa-auto.zip"
    
    try {
        Write-Info "Downloading from: $ZipUrl"
        Invoke-WebRequest -Uri $ZipUrl -OutFile $ZipPath -UseBasicParsing
        Write-Success "Repository downloaded successfully"
    } catch {
        Write-Error "Failed to download repository: $_"
        return
    }

    # Step 3: Extract files
    Write-Step "Extracting files" 3 8
    
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::ExtractToDirectory($ZipPath, $InstallPath)
        
        # Move files from extracted folder to root
        $ExtractedFolder = Join-Path $InstallPath "WA-Auto-master"
        if (Test-Path $ExtractedFolder) {
            Get-ChildItem $ExtractedFolder | Move-Item -Destination $InstallPath -Force
            Remove-Item $ExtractedFolder -Force
        }
        
        Remove-Item $ZipPath -Force
        Write-Success "Files extracted successfully"
    } catch {
        Write-Error "Failed to extract files: $_"
        return
    }

    # Step 4: Check prerequisites
    Write-Step "Checking prerequisites" 4 8
    
    $NodeInstalled = Test-CommandExists "node"
    $NpmInstalled = Test-CommandExists "npm"
    $PythonInstalled = Test-CommandExists "python"
    
    if ($NodeInstalled) {
        $NodeVersion = node --version
        Write-Success "Node.js found: $NodeVersion"
    } else {
        Write-Error "Node.js not found! Please install Node.js from https://nodejs.org/"
        Write-Info "After installing Node.js, run this installer again."
        return
    }
    
    if ($NpmInstalled) {
        $NpmVersion = npm --version
        Write-Success "npm found: v$NpmVersion"
    } else {
        Write-Error "npm not found! This usually comes with Node.js."
        return
    }
    
    if ($PythonInstalled) {
        $PythonVersion = python --version
        Write-Success "Python found: $PythonVersion"
    } else {
        Write-Info "Python not found. This is optional for basic functionality."
    }

    # Step 5: Install Node.js dependencies
    Write-Step "Installing Node.js dependencies" 5 8
    
    if (Test-Path "package.json") {
        try {
            Write-Info "Running npm install..."
            npm install
            Write-Success "Node.js dependencies installed successfully"
        } catch {
            Write-Error "Failed to install Node.js dependencies: $_"
            Write-Info "You can try running 'npm install' manually later."
        }
    } else {
        Write-Error "package.json not found!"
        return
    }

    # Step 6: Install Python dependencies (if Python is available)
    Write-Step "Installing Python dependencies" 6 8
    
    $PythonReqPath = Join-Path "scripts" "python" "requirements.txt"
    if ($PythonInstalled -and (Test-Path $PythonReqPath)) {
        try {
            Write-Info "Installing Python requirements..."
            python -m pip install -r $PythonReqPath
            Write-Success "Python dependencies installed successfully"
        } catch {
            Write-Info "Failed to install Python dependencies (this is optional): $_"
        }
    } else {
        Write-Info "Skipping Python dependencies (Python not available or requirements.txt not found)"
    }

    # Step 7: Create desktop shortcut
    Write-Step "Creating desktop shortcut" 7 8
    
    try {
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
            Write-Success "Desktop shortcut created"
        }
    } catch {
        Write-Info "Could not create desktop shortcut: $_"
    }

    # Step 8: Launch application
    Write-Step "Launching WhatsApp Automation V2" 8 8
    
    Write-ColorText "╔══════════════════════════════════════════════════════════════════════════════╗" "Green"
    Write-ColorText "║                            🎉 INSTALLATION COMPLETE! 🎉                       ║" "Green"
    Write-ColorText "║                                                                              ║" "Green"
    Write-ColorText "║  ✅ Repository downloaded and extracted                                      ║" "Green"
    Write-ColorText "║  ✅ Dependencies installed                                                   ║" "Green"
    Write-ColorText "║  ✅ Application configured                                                   ║" "Green"
    Write-ColorText "║  ✅ Desktop shortcut created                                                 ║" "Green"
    Write-ColorText "║                                                                              ║" "Green"
    Write-ColorText "║  📍 Installation Path`: $InstallPath" "Green"
    Write-ColorText "╚══════════════════════════════════════════════════════════════════════════════╝" "Green"
    Write-Host ""
    
    Write-Info "Starting WhatsApp Automation V2..."
    
    # Try to launch the app
    $LauncherPath = Join-Path $InstallPath "start-app.ps1"
    if (Test-Path $LauncherPath) {
        try {
            Write-Info "Launching application..."
            Start-Sleep -Seconds 2
            & PowerShell -ExecutionPolicy Bypass -File $LauncherPath
        } catch {
            Write-Error "Failed to launch application: $_"
            Write-Info "You can manually run: $LauncherPath"
        }
    } else {
        Write-Error "Launcher not found at: $LauncherPath"
        Write-Info "You can try running 'npm start' from the installation directory."
    }
}

# Start the installation
Start-ChainInstall
