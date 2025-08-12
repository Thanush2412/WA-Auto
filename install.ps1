# WhatsApp Automation V2 - Complete One-liner Installer
# Usage: Run this one command in PowerShell to install everything:
# iex (iwr -useb 'https://raw.githubusercontent.com/Thanush2412/WA-Auto/main/install.ps1').Content

param(
    [string]$InstallPath = "C:\WhatsApp-Automation-V2",
    [switch]$Portable = $false
)

# Set console properties
$Host.UI.RawUI.WindowTitle = "WhatsApp Automation V2 - Installer"
Clear-Host

# Color functions
function Write-ColorText {
    param([string]$Text, [string]$Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

function Show-Header {
    Write-ColorText "=" * 80 -Color Cyan
    Write-ColorText "    WhatsApp Automation V2 - Complete Setup Installer" -Color Yellow
    Write-ColorText "=" * 80 -Color Cyan
    Write-Host ""
}

function Show-Step {
    param([string]$StepText)
    Write-Host ""
    Write-ColorText ">> $StepText" -Color Cyan
    Write-ColorText "-" * 60 -Color Gray
}

# Check admin rights for system install
function Test-Admin {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Download function with progress and retry
function Download-FileWithProgress {
    param($Url, $OutputPath, $Description = "file")
    
    try {
        Write-ColorText "Downloading $Description..." -Color Yellow
        
        # Try multiple methods for better compatibility
        $success = $false
        $maxRetries = 3
        $retryCount = 0
        
        while (-not $success -and $retryCount -lt $maxRetries) {
            try {
                # Method 1: Use Invoke-WebRequest (more reliable)
                $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 30
                [System.IO.File]::WriteAllBytes($OutputPath, $response.Content)
                $success = $true
            } catch {
                $retryCount++
                if ($retryCount -lt $maxRetries) {
                    Write-ColorText "Retry $retryCount/$maxRetries..." -Color Yellow
                    Start-Sleep -Seconds 2
                } else {
                    # Method 2: Fallback to WebClient
                    try {
                        $webClient = New-Object System.Net.WebClient
                        $webClient.Headers.Add("User-Agent", "WhatsApp-Automation-Installer/1.0")
                        $webClient.DownloadFile($Url, $OutputPath)
                        $webClient.Dispose()
                        $success = $true
                    } catch {
                        throw "All download methods failed: $($_.Exception.Message)"
                    }
                }
            }
        }
        
        Write-ColorText "OK Downloaded $Description successfully!" -Color Green
        return $true
    } catch {
        Write-ColorText "X Failed to download $Description`: $_" -Color Red
        return $false
    }
}

# Create directory structure
function Create-ProjectStructure {
    param($BasePath)
    
    $directories = @(
        "scripts\python",
        "src\main\handlers",
        "src\main\services", 
        "src\main\utils",
        "src\renderer\css",
        "src\renderer\js",
        "src\shared",
        "assets",
        "config",
        "database\migrations",
        "database\schemas",
        "temp"
    )
    
    foreach ($dir in $directories) {
        $fullPath = Join-Path $BasePath $dir
        if (!(Test-Path $fullPath)) {
            New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
        }
    }
}

# Main installation process
Show-Header

# Determine install location
if ($Portable) {
    $InstallPath = Split-Path -Parent $MyInvocation.MyCommand.Path
    Write-ColorText "Installing in portable mode: $InstallPath" -Color Green
} else {
    Write-ColorText "Install location: $InstallPath" -Color Green
    Write-ColorText "Use -Portable switch for portable installation" -Color Gray
}

# Check if path exists
if (!(Test-Path $InstallPath)) {
    Show-Step "Creating installation directory"
    try {
        New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
        Write-ColorText "OK Created directory: $InstallPath" -Color Green
    } catch {
        Write-ColorText "X Failed to create directory: $_" -Color Red
        exit 1
    }
}

# Set working directory
Set-Location $InstallPath

Show-Step "Creating project structure"
Create-ProjectStructure $InstallPath
Write-ColorText "OK Project structure created" -Color Green

Show-Step "Downloading essential files"

# Essential files only - confirmed to exist and needed for basic functionality
$baseUrl = "https://raw.githubusercontent.com/Thanush2412/WA-Auto/main"
$files = @{
    "start-app.ps1" = "$baseUrl/start-app.ps1"
    "Start WhatsApp Automation.bat" = "$baseUrl/Start%20WhatsApp%20Automation.bat"
    "package.json" = "$baseUrl/package.json"
    "README.md" = "$baseUrl/README.md"
    "QUICK-INSTALL.md" = "$baseUrl/QUICK-INSTALL.md"
}

$downloadSuccess = $true
$downloadCount = 0
$totalFiles = $files.Count

foreach ($file in $files.GetEnumerator()) {
    $downloadCount++
    $localPath = $file.Key
    $url = $file.Value
    
    # Create directory if needed
    $fileDir = Split-Path $localPath -Parent
    if ($fileDir -and !(Test-Path $fileDir)) {
        New-Item -ItemType Directory -Path $fileDir -Force | Out-Null
    }
    
    Write-ColorText "[$downloadCount/$totalFiles] $localPath" -Color Cyan
    if (!(Download-FileWithProgress $url $localPath $localPath)) {
        $downloadSuccess = $false
    }
}

if (!$downloadSuccess) {
    Write-Host ""
    Write-ColorText "! Some files failed to download. You may need to download them manually." -Color Yellow
    Write-ColorText "  Or check your internet connection and try again." -Color Yellow
}

Show-Step "Setting up environment"

# Check prerequisites
Write-ColorText "Checking Node.js..." -Color Yellow
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-ColorText "OK Node.js $nodeVersion found" -Color Green
    } else {
        throw "Node.js not found"
    }
} catch {
    Write-ColorText "X Node.js not found" -Color Red
    Write-ColorText ">> Download from: https://nodejs.org/" -Color Yellow
    $installNode = Read-Host "Open Node.js download page? [Y/N]"
    if ($installNode.ToUpper() -eq "Y") {
        Start-Process "https://nodejs.org/"
    }
}

Write-ColorText "Checking Python..." -Color Yellow
try {
    $pythonVersion = python --version 2>$null
    if ($pythonVersion) {
        Write-ColorText "OK Python $pythonVersion found" -Color Green
    } else {
        throw "Python not found"
    }
} catch {
    Write-ColorText "X Python not found" -Color Red
    Write-ColorText ">> Download from: https://python.org/" -Color Yellow
    $installPython = Read-Host "Open Python download page? [Y/N]"
    if ($installPython.ToUpper() -eq "Y") {
        Start-Process "https://python.org/"
    }
}

Show-Step "Installation complete!"

Write-Host ""
Write-ColorText "+" * 60 -Color Green
Write-ColorText "+  WhatsApp Automation V2 has been installed successfully!  +" -Color Green  
Write-ColorText "+" * 60 -Color Green
Write-Host ""

Write-ColorText "Installation path: $InstallPath" -Color Cyan
Write-ColorText "To start the application:" -Color White
Write-ColorText "  1. Double-click: Start WhatsApp Automation.bat" -Color Yellow
Write-ColorText "  2. Or run: .\start-app.ps1" -Color Yellow
Write-Host ""

$startNow = Read-Host "Do you want to start the application now? [Y/N]"
if ($startNow.ToUpper() -eq "Y") {
    Write-Host ""
    Write-ColorText "Starting WhatsApp Automation V2..." -Color Green
    if (Test-Path "start-app.ps1") {
        & ".\start-app.ps1"
    } else {
        Write-ColorText "X start-app.ps1 not found. Please run the installation again." -Color Red
    }
} else {
    Write-Host ""
    Write-ColorText ">> You can start the application anytime by running:" -Color Cyan
    Write-ColorText "   .\start-app.ps1" -Color Yellow
    Write-ColorText ">> Or double-clicking: Start WhatsApp Automation.bat" -Color Yellow
}

Write-Host ""
Write-ColorText "Thank you for using WhatsApp Automation V2!" -Color Green
