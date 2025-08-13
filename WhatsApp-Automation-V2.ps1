# WhatsApp Automation V2 - Complete Universal Solution
# Compatible with all Windows systems (Windows 7, 8, 10, 11)
# PowerShell 2.0+ Compatible

param(
    [switch]$Install,
    [switch]$Run,
    [switch]$Help
)

# Global Configuration
$Script:AppName = "WhatsApp Automation V2"
$Script:Version = "2.0"
$Script:RepoUrl = "https://github.com/Thanush2412/WA-Auto/archive/refs/heads/master.zip"
$Script:DefaultInstallPath = Join-Path $env:USERPROFILE "WhatsApp-Automation-V2"

# Cross-platform PowerShell compatibility
$Script:IsPS2 = $PSVersionTable.PSVersion.Major -eq 2
$Script:IsWindows7 = [Environment]::OSVersion.Version.Major -eq 6 -and [Environment]::OSVersion.Version.Minor -eq 1

#region Helper Functions

function Write-ColorText {
    param(
        [string]$Text,
        [string]$Color = "White",
        [switch]$NoNewline
    )
    
    if ($Script:IsPS2) {
        # PowerShell 2.0 fallback
        if ($NoNewline) {
            Write-Host $Text -NoNewline
        } else {
            Write-Host $Text
        }
    } else {
        if ($NoNewline) {
            Write-Host $Text -ForegroundColor $Color -NoNewline
        } else {
            Write-Host $Text -ForegroundColor $Color
        }
    }
}

function Test-Administrator {
    try {
        $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
        $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
        return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    } catch {
        return $false
    }
}

function Request-AdminPrivileges {
    if (-not (Test-Administrator)) {
        Write-ColorText "🔐 Administrator privileges required for full installation..." -Color Yellow
        Write-ColorText "🔄 Restarting with administrator privileges..." -Color Cyan
        
        try {
            $scriptPath = $MyInvocation.MyCommand.Path
            $arguments = "-ExecutionPolicy Bypass -File `"$scriptPath`""
            if ($Install) { $arguments += " -Install" }
            if ($Run) { $arguments += " -Run" }
            
            Start-Process PowerShell -Verb RunAs -ArgumentList $arguments
            exit
        } catch {
            Write-ColorText "❌ Failed to restart with admin privileges." -Color Red
            Write-ColorText "⚠️ Some features may not work properly without admin rights." -Color Yellow
            Write-ColorText "Press any key to continue..." -Color White
            if (-not $Script:IsPS2) {
                $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            } else {
                Read-Host
            }
            return $false
        }
    }
    return $true
}

function Set-WindowTitle {
    param([string]$Title)
    try {
        $Host.UI.RawUI.WindowTitle = $Title
    } catch {
        # Ignore if unable to set title
    }
}

function Set-ConsoleSize {
    try {
        if (-not $Script:IsPS2) {
            $pshost = Get-Host
            $pswindow = $pshost.UI.RawUI
            $newsize = $pswindow.BufferSize
            $newsize.Height = 3000
            $newsize.Width = 120
            $pswindow.BufferSize = $newsize
            $newsize = $pswindow.WindowSize
            $newsize.Height = 30
            $newsize.Width = 120
            $pswindow.WindowSize = $newsize
        }
    } catch {
        # Ignore errors if unable to resize
    }
}

function Show-Header {
    param([string]$Title, [string]$Subtitle = "")
    
    Clear-Host
    Write-ColorText ""
    Write-ColorText "╔══════════════════════════════════════════════════════════════════════════════╗" -Color Magenta
    Write-ColorText "║                             🚀 $Script:AppName 🚀                           ║" -Color Magenta
    if ($Subtitle) {
        Write-ColorText "║                              $Subtitle                                      ║" -Color Magenta
    }
    Write-ColorText "║                                Version $Script:Version                                   ║" -Color Magenta
    Write-ColorText "║                                                                              ║" -Color Magenta
    Write-ColorText "║              Universal Solution - Compatible with All Windows Systems        ║" -Color Magenta
    Write-ColorText "╚══════════════════════════════════════════════════════════════════════════════╝" -Color Magenta
    Write-ColorText ""
}

function Show-Step {
    param([string]$StepText)
    Write-ColorText ""
    Write-ColorText "=" * 80 -Color Cyan
    Write-ColorText "  $StepText" -Color Yellow
    Write-ColorText "=" * 80 -Color Cyan
    Write-ColorText ""
}

function Test-PrerequisitesSilent {
    $results = @{
        NodeJS = $false
        NPM = $false
        Python = $false
        PIP = $false
        Internet = $false
    }
    
    try { $null = Get-Command "node" -ErrorAction Stop; $results.NodeJS = $true } catch { }
    try { $null = Get-Command "npm" -ErrorAction Stop; $results.NPM = $true } catch { }
    try { $null = Get-Command "python" -ErrorAction Stop; $results.Python = $true } catch { }
    try { $null = Get-Command "pip" -ErrorAction Stop; $results.PIP = $true } catch { }
    
    try {
        $null = Invoke-WebRequest -Uri "https://www.google.com" -UseBasicParsing -TimeoutSec 5
        $results.Internet = $true
    } catch { }
    
    return $results
}

function Install-Dependencies {
    param([string]$InstallPath)
    
    Show-Step "Installing Dependencies"
    
    # Install npm dependencies
    if (Test-Path (Join-Path $InstallPath "package.json")) {
        Write-ColorText "📦 Installing Node.js dependencies..." -Color Yellow
        try {
            Push-Location $InstallPath
            $npmOutput = npm install 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-ColorText "✅ Node.js dependencies installed successfully" -Color Green
            } else {
                Write-ColorText "❌ Failed to install Node.js dependencies" -Color Red
                Write-ColorText "Error: $npmOutput" -Color Red
                return $false
            }
        } catch {
            Write-ColorText "❌ Error during npm install: $_" -Color Red
            return $false
        } finally {
            Pop-Location
        }
    }
    
    # Install Python requirements
    $reqPath = Join-Path $InstallPath "scripts\python\requirements.txt"
    if ((Test-Path $reqPath) -and (Get-Command "python" -ErrorAction SilentlyContinue)) {
        Write-ColorText "🐍 Installing Python requirements..." -Color Yellow
        try {
            Push-Location $InstallPath
            $pipOutput = python -m pip install -r $reqPath 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-ColorText "✅ Python requirements installed successfully" -Color Green
            } else {
                Write-ColorText "⚠️ Some Python requirements failed to install" -Color Yellow
                Write-ColorText "Python features may be limited" -Color Yellow
            }
        } catch {
            Write-ColorText "⚠️ Error installing Python requirements: $_" -Color Yellow
        } finally {
            Pop-Location
        }
    }
    
    return $true
}

function Setup-TesseractOCR {
    param([string]$InstallPath)
    
    Show-Step "Setting up Tesseract OCR"
    
    $LocalTesseract = Join-Path $InstallPath "Tesseract-OCR"
    $ProgramFilesTesseract = "C:\Program Files\Tesseract-OCR"
    $ProgramFilesx86Tesseract = "C:\Program Files (x86)\Tesseract-OCR"
    
    # Check existing installations
    if (Test-Path $ProgramFilesTesseract) {
        Write-ColorText "✅ Tesseract OCR found: Program Files" -Color Green
        if (Test-Path $LocalTesseract) {
            Write-ColorText "🗑️ Removing local copy (using system version)..." -Color Blue
            Remove-Item $LocalTesseract -Recurse -Force -ErrorAction SilentlyContinue
        }
        return $true
    } elseif (Test-Path $ProgramFilesx86Tesseract) {
        Write-ColorText "✅ Tesseract OCR found: Program Files (x86)" -Color Green
        if (Test-Path $LocalTesseract) {
            Write-ColorText "🗑️ Removing local copy (using system version)..." -Color Blue
            Remove-Item $LocalTesseract -Recurse -Force -ErrorAction SilentlyContinue
        }
        return $true
    } elseif (Test-Path $LocalTesseract) {
        Write-ColorText "📦 Found local Tesseract OCR copy" -Color Yellow
        
        if (Test-Administrator) {
            Write-ColorText "🔧 Installing Tesseract to Program Files..." -Color Blue
            try {
                Copy-Item $LocalTesseract $ProgramFilesTesseract -Recurse -Force
                
                # Add to PATH
                $currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
                if ($currentPath -notlike "*$ProgramFilesTesseract*") {
                    [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$ProgramFilesTesseract", "Machine")
                }
                
                Write-ColorText "✅ Tesseract OCR installed to Program Files" -Color Green
                Write-ColorText "🗑️ Removing local copy..." -Color Blue
                Remove-Item $LocalTesseract -Recurse -Force
                return $true
            } catch {
                Write-ColorText "⚠️ Could not install to Program Files: $_" -Color Yellow
                Write-ColorText "ℹ️ Using local copy instead" -Color Blue
                return $true
            }
        } else {
            Write-ColorText "ℹ️ Using local Tesseract copy (no admin rights)" -Color Blue
            Write-ColorText "💡 Run with Administrator for system-wide installation" -Color Cyan
            return $true
        }
    } else {
        Write-ColorText "❌ Tesseract OCR not found" -Color Red
        Write-ColorText "⚠️ OCR features will not work" -Color Yellow
        return $false
    }
}

function Download-Repository {
    param([string]$InstallPath)
    
    Show-Step "Downloading Repository"
    
    Write-ColorText "⬇️ Downloading from GitHub..." -Color Yellow
    $zipPath = Join-Path $InstallPath "wa-auto.zip"
    
    try {
        if ($Script:IsPS2) {
            # PowerShell 2.0 compatible download
            $webClient = New-Object System.Net.WebClient
            $webClient.DownloadFile($Script:RepoUrl, $zipPath)
        } else {
            Invoke-WebRequest -Uri $Script:RepoUrl -OutFile $zipPath -UseBasicParsing
        }
        Write-ColorText "✅ Repository downloaded successfully" -Color Green
    } catch {
        Write-ColorText "❌ Download failed: $_" -Color Red
        return $false
    }
    
    # Extract files
    Write-ColorText "📂 Extracting files..." -Color Yellow
    try {
        if ($Script:IsPS2) {
            # PowerShell 2.0 compatible extraction
            $shell = New-Object -ComObject Shell.Application
            $zip = $shell.NameSpace($zipPath)
            $dest = $shell.NameSpace($InstallPath)
            $dest.CopyHere($zip.Items(), 4)
        } else {
            Add-Type -AssemblyName System.IO.Compression.FileSystem
            [System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $InstallPath)
        }
        
        # Move files from extracted folder
        $extractedFolder = Join-Path $InstallPath "WA-Auto-master"
        if (Test-Path $extractedFolder) {
            Get-ChildItem $extractedFolder | Move-Item -Destination $InstallPath -Force
            Remove-Item $extractedFolder -Force
        }
        Remove-Item $zipPath -Force
        
        Write-ColorText "✅ Files extracted successfully" -Color Green
        return $true
    } catch {
        Write-ColorText "❌ Extraction failed: $_" -Color Red
        return $false
    }
}

function Create-DesktopShortcut {
    param([string]$InstallPath)
    
    try {
        $desktopPath = [Environment]::GetFolderPath("Desktop")
        $shortcutPath = Join-Path $desktopPath "$Script:AppName.lnk"
        $targetPath = Join-Path $InstallPath "WhatsApp-Automation-V2.ps1"
        
        $WshShell = New-Object -ComObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut($shortcutPath)
        $Shortcut.TargetPath = "powershell.exe"
        $Shortcut.Arguments = "-ExecutionPolicy Bypass -File `"$targetPath`" -Run"
        $Shortcut.WorkingDirectory = $InstallPath
        $Shortcut.Description = $Script:AppName
        $Shortcut.Save()
        
        Write-ColorText "✅ Desktop shortcut created" -Color Green
        return $true
    } catch {
        Write-ColorText "⚠️ Could not create desktop shortcut: $_" -Color Yellow
        return $false
    }
}

#endregion

#region Installation Functions

function Start-Installation {
    Show-Header "Universal Installer" "Downloads → Installs → Runs"
    
    # Check prerequisites
    Write-ColorText "🔍 Checking prerequisites..." -Color Yellow
    $prereqs = Test-PrerequisitesSilent
    
    if (-not $prereqs.NodeJS) {
        Write-ColorText "❌ Node.js not found!" -Color Red
        Write-ColorText "📥 Please install Node.js from: https://nodejs.org/" -Color Yellow
        Write-ColorText "Press any key to exit..." -Color White
        if (-not $Script:IsPS2) { $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") } else { Read-Host }
        exit 1
    }
    
    if (-not $prereqs.Internet) {
        Write-ColorText "❌ Internet connection required for installation!" -Color Red
        Write-ColorText "Press any key to exit..." -Color White
        if (-not $Script:IsPS2) { $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") } else { Read-Host }
        exit 1
    }
    
    Write-ColorText "✅ Node.js found: $(node --version)" -Color Green
    if ($prereqs.Python) { Write-ColorText "✅ Python found: $(python --version 2>$null)" -Color Green }
    
    # Setup installation directory
    $installPath = $Script:DefaultInstallPath
    Write-ColorText "📁 Installation directory: $installPath" -Color Blue
    
    if (Test-Path $installPath) {
        $backupPath = $installPath + "_backup_" + (Get-Date -Format "yyyyMMdd_HHmmss")
        Write-ColorText "📦 Backing up existing installation..." -Color Yellow
        Move-Item $installPath $backupPath -Force
    }
    
    New-Item -ItemType Directory -Path $installPath -Force | Out-Null
    
    # Download and extract
    if (-not (Download-Repository $installPath)) {
        Write-ColorText "❌ Installation failed during download" -Color Red
        exit 1
    }
    
    # Copy this script to installation directory
    $thisScriptPath = $MyInvocation.MyCommand.Path
    $newScriptPath = Join-Path $installPath "WhatsApp-Automation-V2.ps1"
    Copy-Item $thisScriptPath $newScriptPath -Force
    
    # Install dependencies
    if (-not (Install-Dependencies $installPath)) {
        Write-ColorText "❌ Installation failed during dependency installation" -Color Red
        exit 1
    }
    
    # Setup Tesseract OCR
    Setup-TesseractOCR $installPath
    
    # Create desktop shortcut
    Create-DesktopShortcut $installPath
    
    # Installation complete
    Write-ColorText ""
    Write-ColorText "╔══════════════════════════════════════════════════════════════════════════════╗" -Color Green
    Write-ColorText "║                            🎉 INSTALLATION COMPLETE! 🎉                       ║" -Color Green
    Write-ColorText "║                                                                              ║" -Color Green
    Write-ColorText "║  ✅ Repository downloaded and extracted                                      ║" -Color Green
    Write-ColorText "║  ✅ Dependencies installed                                                   ║" -Color Green
    Write-ColorText "║  ✅ Tesseract OCR configured                                                 ║" -Color Green
    Write-ColorText "║  ✅ Desktop shortcut created                                                 ║" -Color Green
    Write-ColorText "║                                                                              ║" -Color Green
    Write-ColorText "║  📍 Application Location: WhatsApp-Automation-V2                             ║" -Color Green
    Write-ColorText "║  🚀 Starting application automatically...                                   ║" -Color Green
    Write-ColorText "╚══════════════════════════════════════════════════════════════════════════════╝" -Color Green
    Write-ColorText ""
    
    # Launch application
    Write-ColorText "🚀 Starting $Script:AppName..." -Color Yellow
    Start-Sleep -Seconds 2
    Set-Location $installPath
    Start-Application $installPath
}

#endregion

#region Application Functions

function Start-Application {
    param([string]$AppPath = (Get-Location).Path)
    
    Show-Header "Application Launcher"
    Set-WindowTitle "$Script:AppName - Launcher"
    Set-ConsoleSize
    
    # Check if we're in the right directory
    if (-not (Test-Path (Join-Path $AppPath "package.json"))) {
        Write-ColorText "❌ Application files not found in current directory" -Color Red
        Write-ColorText "Please run this script from the application directory" -Color Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    Set-Location $AppPath
    
    # Step 1: Check Node.js
    Show-Step "Step 1/5: Checking Node.js and npm"
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-ColorText "✅ Node.js version: $nodeVersion" -Color Green
        } else {
            throw "Node.js not found"
        }
        
        $npmVersion = npm --version 2>$null
        if ($npmVersion) {
            Write-ColorText "✅ npm version: $npmVersion" -Color Green
        }
    } catch {
        Write-ColorText "❌ Node.js is not installed or not in PATH" -Color Red
        Write-ColorText "📥 Please install Node.js from https://nodejs.org/" -Color Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    # Step 2: Install npm dependencies
    Show-Step "Step 2/5: Installing npm dependencies"
    try {
        Write-ColorText "📦 Installing Node.js dependencies..." -Color Yellow
        $npmResult = npm install 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-ColorText "✅ npm dependencies installed successfully" -Color Green
        } else {
            Write-ColorText "❌ Failed to install npm dependencies" -Color Red
            Write-ColorText "Error: $npmResult" -Color Red
            Read-Host "Press Enter to exit"
            exit 1
        }
    } catch {
        Write-ColorText "❌ Error running npm install: $_" -Color Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    # Step 3: Check Python
    Show-Step "Step 3/5: Setting up Python environment"
    try {
        $pythonVersion = python --version 2>$null
        if ($pythonVersion) {
            Write-ColorText "✅ Python version: $pythonVersion" -Color Green
            
            $reqPath = "scripts\python\requirements.txt"
            if (Test-Path $reqPath) {
                Write-ColorText "🐍 Installing Python requirements..." -Color Yellow
                try {
                    $pipResult = pip install -r $reqPath 2>&1
                    if ($LASTEXITCODE -eq 0) {
                        Write-ColorText "✅ Python requirements installed successfully" -Color Green
                    } else {
                        Write-ColorText "⚠️ Some Python requirements failed to install" -Color Yellow
                    }
                } catch {
                    Write-ColorText "⚠️ Error installing Python requirements: $_" -Color Yellow
                }
            }
        } else {
            throw "Python not found"
        }
    } catch {
        Write-ColorText "⚠️ Python not found or not in PATH" -Color Yellow
        Write-ColorText "🐍 Python features will be disabled" -Color Yellow
        Write-ColorText "📥 Install Python from https://python.org/ for full functionality" -Color Cyan
    }
    
    # Step 4: Check Tesseract OCR
    Show-Step "Step 4/5: Checking Tesseract OCR"
    $tesseractStatus = Check-TesseractOCR
    
    # Step 5: Launch application
    Show-Step "Step 5/5: Starting $Script:AppName"
    Write-ColorText ""
    Write-ColorText "🚀 Launching application..." -Color Green
    Write-ColorText "📱 $Script:AppName is starting..." -Color Cyan
    Write-ColorText ""
    
    Write-ColorText "+" * 80 -Color Magenta
    Write-ColorText "+                           *** Ready to Go! ***                              +" -Color Magenta
    Write-ColorText "+                                                                            +" -Color Magenta
    Write-ColorText "+  * The application window should open shortly                             +" -Color Magenta
    Write-ColorText "+  * Make sure WhatsApp Web is logged in                                   +" -Color Magenta
    Write-ColorText "+  * Check the application logs for any issues                             +" -Color Magenta
    Write-ColorText "+                                                                            +" -Color Magenta
    Write-ColorText "+  >> To stop the application, close this window or press Ctrl+C          +" -Color Magenta
    Write-ColorText "+" * 80 -Color Magenta
    Write-ColorText ""
    
    # Start the main application
    Write-ColorText "🎯 Starting main application..." -Color Green
    try {
        npm start
        $exitCode = $LASTEXITCODE
    } catch {
        $exitCode = 1
        Write-ColorText "❌ Error starting application: $_" -Color Red
    }
    
    # Application ended
    Write-ColorText ""
    if ($exitCode -ne 0) {
        Write-ColorText "❌ Application exited with error code: $exitCode" -Color Red
    } else {
        Write-ColorText "✅ Application closed normally" -Color Green
    }
    
    # Post-run menu
    Show-PostRunMenu
}

function Check-TesseractOCR {
    Write-ColorText "👁️ Checking Tesseract OCR installation..." -Color Yellow
    
    $programFilesTesseract = "C:\Program Files\Tesseract-OCR"
    $programFilesx86Tesseract = "C:\Program Files (x86)\Tesseract-OCR"
    $localTesseract = "Tesseract-OCR"
    
    if (Test-Path $programFilesTesseract) {
        Write-ColorText "✅ Tesseract OCR found: Program Files" -Color Green
        return "System-wide (Program Files)"
    } elseif (Test-Path $programFilesx86Tesseract) {
        Write-ColorText "✅ Tesseract OCR found: Program Files (x86)" -Color Green
        return "System-wide (Program Files x86)"
    } elseif (Test-Path $localTesseract) {
        Write-ColorText "✅ Tesseract OCR found: Local project folder" -Color Green
        
        if (Test-Administrator) {
            Write-ColorText "🔧 Installing to Program Files for system-wide access..." -Color Blue
            try {
                Copy-Item $localTesseract $programFilesTesseract -Recurse -Force
                
                # Add to PATH
                $currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
                if ($currentPath -notlike "*$programFilesTesseract*") {
                    [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$programFilesTesseract", "Machine")
                }
                
                Write-ColorText "✅ Tesseract installed to Program Files" -Color Green
                Remove-Item $localTesseract -Recurse -Force
                return "System-wide (Program Files)"
            } catch {
                Write-ColorText "⚠️ Could not install to Program Files: $_" -Color Yellow
                return "Local project folder"
            }
        } else {
            Write-ColorText "ℹ️ Run as Administrator for system-wide installation" -Color Blue
            return "Local project folder"
        }
    } else {
        Write-ColorText "❌ Tesseract OCR not found" -Color Red
        Write-ColorText "⚠️ OCR features will not work" -Color Yellow
        return "Not found"
    }
}

function Show-PostRunMenu {
    Write-ColorText ""
    Write-ColorText "📊 Application Status: Stopped" -Color Yellow
    Write-ColorText "Thank you for using $Script:AppName!" -Color Cyan
    Write-ColorText ""
    
    do {
        Write-ColorText "=" * 80 -Color Blue
        Write-ColorText "                            What would you like to do?" -Color Blue
        Write-ColorText "=" * 80 -Color Blue
        Write-ColorText ""
        Write-ColorText "[1] " -Color Green -NoNewline
        Write-ColorText "Restart the application" -Color White
        Write-ColorText "[2] " -Color Yellow -NoNewline
        Write-ColorText "Exit" -Color White
        Write-ColorText ""
        
        $choice = Read-Host "Enter your choice (1 or 2)"
        
        switch ($choice) {
            "1" {
                Write-ColorText ""
                Write-ColorText "🔄 Restarting application..." -Color Green
                Start-Application
                break
            }
            "2" {
                Write-ColorText ""
                Write-ColorText "👋 Goodbye!" -Color Cyan
                exit 0
            }
            default {
                Write-ColorText "❌ Invalid choice. Please enter 1 or 2." -Color Red
                Write-ColorText ""
            }
        }
    } while ($true)
}

#endregion

#region Help and Main

function Show-Help {
    Show-Header "Help & Usage"
    
    Write-ColorText "USAGE:" -Color Yellow
    Write-ColorText "  .\WhatsApp-Automation-V2.ps1 [OPTIONS]" -Color White
    Write-ColorText ""
    Write-ColorText "OPTIONS:" -Color Yellow
    Write-ColorText "  -Install    : Download and install the application" -Color Green
    Write-ColorText "  -Run        : Run the application (default if no options)" -Color Green
    Write-ColorText "  -Help       : Show this help message" -Color Green
    Write-ColorText ""
    Write-ColorText "EXAMPLES:" -Color Yellow
    Write-ColorText "  .\WhatsApp-Automation-V2.ps1                    # Run application" -Color Cyan
    Write-ColorText "  .\WhatsApp-Automation-V2.ps1 -Install           # Install application" -Color Cyan
    Write-ColorText "  .\WhatsApp-Automation-V2.ps1 -Run               # Run application" -Color Cyan
    Write-ColorText ""
    Write-ColorText "ONE-LINER INSTALLATION:" -Color Yellow
    Write-ColorText "  PowerShell:" -Color Green
    Write-ColorText "    iwr -useb https://raw.githubusercontent.com/Thanush2412/WA-Auto/master/WhatsApp-Automation-V2.ps1 | iex" -Color Cyan
    Write-ColorText ""
    Write-ColorText "  CMD:" -Color Green
    Write-ColorText "    powershell -c `"iwr -useb https://raw.githubusercontent.com/Thanush2412/WA-Auto/master/WhatsApp-Automation-V2.ps1 | iex`"" -Color Cyan
    Write-ColorText ""
    Write-ColorText "SYSTEM REQUIREMENTS:" -Color Yellow
    Write-ColorText "  • Windows 7/8/10/11" -Color White
    Write-ColorText "  • PowerShell 2.0+" -Color White
    Write-ColorText "  • Node.js (latest LTS recommended)" -Color White
    Write-ColorText "  • Internet connection (for installation)" -Color White
    Write-ColorText "  • Python (optional, for enhanced features)" -Color White
    Write-ColorText ""
    Write-ColorText "FEATURES:" -Color Yellow
    Write-ColorText "  ✅ Universal Windows compatibility" -Color Green
    Write-ColorText "  ✅ Automatic dependency installation" -Color Green
    Write-ColorText "  ✅ Smart Tesseract OCR setup" -Color Green
    Write-ColorText "  ✅ Administrator privilege handling" -Color Green
    Write-ColorText "  ✅ One-command installation" -Color Green
    Write-ColorText "  ✅ Desktop shortcut creation" -Color Green
    Write-ColorText ""
}

function Main {
    # Handle no internet scenario (detect if running from one-liner)
    if (-not $MyInvocation.MyCommand.Path -or $MyInvocation.MyCommand.Path -like "*temp*") {
        # Running from one-liner installation
        $Install = $true
        Request-AdminPrivileges
    }
    
    Set-WindowTitle "$Script:AppName v$Script:Version"
    
    if ($Help) {
        Show-Help
        Read-Host "Press Enter to exit"
        return
    }
    
    if ($Install) {
        Request-AdminPrivileges
        Start-Installation
        return
    }
    
    if ($Run -or (-not $Install -and -not $Help)) {
        # Default action is to run the application
        $currentLocation = (Get-Location).Path
        Start-Application $currentLocation
        return
    }
}

#endregion

# Script Entry Point
Main
