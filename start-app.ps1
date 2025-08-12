# WhatsApp Automation V2 - PowerShell Startup Manager

# Function to check administrator privileges
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Check if running as administrator and restart if needed
if (-not (Test-Administrator)) {
    Write-Host "🔐 Administrator privileges required for full installation..." -ForegroundColor Yellow
    Write-Host "🔄 Restarting with administrator privileges..." -ForegroundColor Cyan
    
    try {
        $scriptPath = $MyInvocation.MyCommand.Path
        Start-Process PowerShell -Verb RunAs -ArgumentList "-ExecutionPolicy Bypass -File `"$scriptPath`""
        exit
    } catch {
        Write-Host "❌ Failed to restart with admin privileges. Please run as administrator manually." -ForegroundColor Red
        Write-Host "Press any key to continue with limited functionality..." -ForegroundColor Yellow
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
} else {
    Write-Host "✅ Running with administrator privileges" -ForegroundColor Green
}

# Enable colors and clear screen
$Host.UI.RawUI.WindowTitle = "WhatsApp Automation V2 - Startup Manager"
Clear-Host

# Set console size
try {
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
} catch {
    # Ignore errors if unable to resize
}

# Function to write colored text
function Write-ColorText {
    param(
        [string]$Text,
        [string]$Color = "White"
    )
    Write-Host $Text -ForegroundColor $Color
}

# Function to show step headers
function Show-Step {
    param([string]$StepText)
    Write-Host ""
    Write-ColorText "=" * 100 -Color Cyan
    Write-ColorText "  $StepText" -Color Yellow
    Write-ColorText "=" * 100 -Color Cyan
}

# Main header
Write-Host ""
Write-ColorText "#" * 100 -Color Cyan
Write-ColorText "#" + (" " * 98) + "#" -Color Cyan
Write-ColorText "#" + (" " * 25) + ">>> WhatsApp Automation V2 Startup Manager <<<" + (" " * 25) + "#" -Color Cyan
Write-ColorText "#" + (" " * 98) + "#" -Color Cyan
Write-ColorText "#" * 100 -Color Cyan
Write-Host ""

# Step 1: Check Node.js and npm
Show-Step "Step 1/5: Checking Node.js and npm installation..."
Write-Host ""
Write-ColorText ">> Checking Node.js version..." -Color Yellow

try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-ColorText "OK Node.js version: $nodeVersion" -Color Green
    } else {
        throw "Node.js not found"
    }
} catch {
    Write-ColorText "X Error: Node.js is not installed or not in PATH" -Color Red
    Write-ColorText ">> Please install Node.js from https://nodejs.org/" -Color Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-ColorText ">> Checking npm version..." -Color Yellow
try {
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-ColorText "OK npm version: $npmVersion" -Color Green
    }
} catch {
    Write-ColorText "X npm not found" -Color Red
}

# Step 2: Install npm dependencies
Show-Step "Step 2/5: Installing npm dependencies..."
Write-Host ""
Write-ColorText ">> Installing Node.js dependencies..." -Color Yellow

try {
    $npmResult = npm install 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-ColorText "OK npm dependencies installed successfully!" -Color Green
    } else {
        Write-ColorText "X Error: Failed to install npm dependencies" -Color Red
        Write-ColorText "Error details: $npmResult" -Color Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} catch {
    Write-ColorText "X Error running npm install: $_" -Color Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 3: Check Python and install requirements
Show-Step "Step 3/5: Setting up Python environment..."
Write-Host ""
Write-ColorText ">> Checking Python installation..." -Color Yellow

try {
    $pythonVersion = python --version 2>$null
    if ($pythonVersion) {
        Write-ColorText "OK Python version: $pythonVersion" -Color Green
        
        Write-ColorText ">> Installing Python requirements..." -Color Yellow
        if (Test-Path "scripts\python\requirements.txt") {
            try {
                $pipResult = pip install -r scripts\python\requirements.txt 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-ColorText "OK Python requirements installed successfully!" -Color Green
                } else {
                    Write-ColorText "! Warning: Failed to install some Python requirements" -Color Red
                    Write-ColorText ">> Some Python features may not work properly" -Color Yellow
                }
            } catch {
                Write-ColorText "! Warning: Error installing Python requirements: $_" -Color Red
            }
        } else {
            Write-ColorText "! requirements.txt not found in scripts\python\" -Color Yellow
        }
    } else {
        throw "Python not found"
    }
} catch {
    Write-ColorText "! Warning: Python is not installed or not in PATH" -Color Red
    Write-ColorText ">> Python scripts may not work properly" -Color Yellow
    Write-ColorText ">> Please install Python from https://python.org/" -Color Yellow
}

# Step 4: Check Tesseract OCR
Show-Step "Step 4/5: Checking Tesseract OCR..."
Write-Host ""
Write-ColorText ">> Checking Tesseract OCR installation..." -Color Yellow

$ProgramFilesTesseract = "C:\Program Files\Tesseract-OCR"
$ProgramFilesx86Tesseract = "C:\Program Files (x86)\Tesseract-OCR"
$LocalTesseractPath = "Tesseract-OCR"

$TesseractFound = $false
$TesseractLocation = ""
$TesseractStatus = ""

if (Test-Path $ProgramFilesTesseract) {
    $TesseractFound = $true
    $TesseractLocation = $ProgramFilesTesseract
    $TesseractStatus = "System-wide (Program Files)"
    Write-ColorText "OK Tesseract OCR found: Program Files" -Color Green
} elseif (Test-Path $ProgramFilesx86Tesseract) {
    $TesseractFound = $true
    $TesseractLocation = $ProgramFilesx86Tesseract
    $TesseractStatus = "System-wide (Program Files x86)"
    Write-ColorText "OK Tesseract OCR found: Program Files (x86)" -Color Green
} elseif (Test-Path $LocalTesseractPath) {
    Write-ColorText "OK Tesseract OCR found: Local project folder" -Color Green
    Write-ColorText ">> Installing to Program Files for system-wide access..." -Color Yellow
    
    try {
        # Check if running as administrator
        $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
        
        if ($isAdmin) {
            Write-ColorText "   📁 Copying Tesseract to Program Files..." -Color Blue
            Copy-Item $LocalTesseractPath $ProgramFilesTesseract -Recurse -Force
            
            Write-ColorText "   🔗 Adding to system PATH..." -Color Blue
            $currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
            if ($currentPath -notlike "*$ProgramFilesTesseract*") {
                [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$ProgramFilesTesseract", "Machine")
            }
            
            Write-ColorText "OK Tesseract installed to Program Files successfully!" -Color Green
            
            # Remove local copy to save space
            Write-ColorText "   🗑️ Removing local copy..." -Color Blue
            Remove-Item $LocalTesseractPath -Recurse -Force
            Write-ColorText "OK Local copy removed (now using system version)" -Color Green
            
            $TesseractFound = $true
            $TesseractLocation = $ProgramFilesTesseract
            $TesseractStatus = "System-wide (Program Files)"
        } else {
            Write-ColorText "! Note: Administrator rights required for system-wide installation" -Color Yellow
            Write-ColorText ">> Using local copy (run as Administrator to install system-wide)" -Color Yellow
            $TesseractFound = $true
            $TesseractLocation = $LocalTesseractPath
            $TesseractStatus = "Local project folder"
        }
    } catch {
        Write-ColorText "! Warning: Could not install to Program Files: $_" -Color Yellow
        Write-ColorText ">> Using local copy" -Color Yellow
        $TesseractFound = $true
        $TesseractLocation = $LocalTesseractPath
        $TesseractStatus = "Local project folder"
    }
} else {
    Write-ColorText "! Warning: Tesseract OCR not found" -Color Red
    Write-ColorText ">> OCR text recognition features will not work" -Color Yellow
    Write-ColorText ">> Download and install Tesseract manually or run install-tesseract.ps1" -Color Yellow
}

if ($TesseractFound) {
    Write-ColorText ">> Testing Tesseract availability..." -Color Yellow
    try {
        $tesseractPath = if ($TesseractLocation -like "*Program Files*") { 
            Join-Path $TesseractLocation "tesseract.exe" 
        } else { 
            Join-Path $TesseractLocation "tesseract.exe" 
        }
        
        if (Test-Path $tesseractPath) {
            try {
                $version = & $tesseractPath --version 2>&1 | Select-Object -First 1
                if ($version -and $version -like "*tesseract*") {
                    Write-ColorText "OK Tesseract version: $($version.Trim())" -Color Green
                    Write-ColorText "OK Status: $TesseractStatus" -Color Green
                } else {
                    Write-ColorText "OK Tesseract executable found at: $TesseractStatus" -Color Green
                }
            } catch {
                Write-ColorText "OK Tesseract executable available at: $TesseractStatus" -Color Green
            }
        } else {
            Write-ColorText "OK Tesseract folder available at: $TesseractStatus" -Color Green
        }
    } catch {
        Write-ColorText "OK Tesseract available at: $TesseractStatus" -Color Green
    }
}

# Step 5: Start the application
function Start-Application {
Show-Step "Step 5/5: Starting WhatsApp Automation V2..."
Write-Host ""
Write-ColorText ">>> Starting the application..." -Color Green
Write-ColorText ">>> WhatsApp Automation V2 is launching..." -Color Cyan
Write-Host ""

Write-ColorText "+" * 100 -Color Magenta
Write-ColorText "+                                   *** Ready to Go! ***                                        +" -Color Magenta
Write-ColorText "+                                                                                             +" -Color Magenta
Write-ColorText "+  * The application window should open shortly                                               +" -Color Magenta
Write-ColorText "+  * Make sure WhatsApp Web is logged in                                                     +" -Color Magenta
Write-ColorText "+  * Check the application logs for any issues                                               +" -Color Magenta
Write-ColorText "+                                                                                             +" -Color Magenta
Write-ColorText "+  >> To stop the application, close this window or press Ctrl+C                            +" -Color Magenta
Write-ColorText "+" * 100 -Color Magenta
Write-Host ""

# Start the main application
Write-ColorText ">>> Launching application..." -Color Green
try {
    npm start
    $exitCode = $LASTEXITCODE
} catch {
    $exitCode = 1
    Write-ColorText "X Error starting application: $_" -Color Red
}

# Check exit status
Write-Host ""
if ($exitCode -ne 0) {
    Write-ColorText "X Application exited with error code: $exitCode" -Color Red
    Write-ColorText ">> Check the logs above for error details" -Color Yellow
} else {
    Write-ColorText "OK Application closed normally" -Color Green
}

# Application ended menu
Write-Host ""
Write-ColorText ">> Application has stopped" -Color Yellow
Write-ColorText "Thank you for using WhatsApp Automation V2!" -Color Cyan
Write-Host ""

do {
    Write-ColorText "=" * 100 -Color Blue
    Write-ColorText "                                    What would you like to do?                               " -Color Blue
    Write-ColorText "=" * 100 -Color Blue
    Write-Host ""
    Write-ColorText "[1] " -Color Green -NoNewline
    Write-ColorText "Restart the application" -Color White
    Write-ColorText "[2] " -Color Yellow -NoNewline
    Write-ColorText "Exit" -Color White
    Write-Host ""
    
    $choice = Read-Host "Enter your choice (1 or 2)"
    
    switch ($choice) {
        "1" {
            Write-Host ""
            Write-ColorText ">> Restarting application..." -Color Green
            Write-Host ""
            Start-Application
        }
        "2" {
            Write-Host ""
            Write-ColorText ">> Goodbye!" -Color Cyan
            Write-ColorText "Press any key to exit..." -Color White
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            exit 0
        }
        default {
            Write-ColorText "X Invalid choice. Please enter 1 or 2." -Color Red
            Write-Host ""
        }
    }
} while ($true)
}

# Main execution
Start-Application
