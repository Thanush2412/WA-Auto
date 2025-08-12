# WhatsApp Automation V2 - Quick Start Guide

## 🚀 One-Line Installation

### Method 1: PowerShell (Windows)
Open PowerShell as Administrator and run:
```powershell
iex ((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/yourusername/whatsapp-automation/main/install.ps1'))
```

### Method 2: PowerShell (Alternative)
```powershell
iex (iwr -useb 'https://your-domain.com/install.ps1').Content
```

### Method 3: curl/bash (Windows with Git Bash, WSL, or Linux)
```bash
curl -sSL https://your-domain.com/install.sh | bash
```

### Method 4: wget (Alternative)
```bash
wget -qO- https://your-domain.com/install.sh | bash
```

## 📋 Manual Installation

1. **Download the files:**
   ```powershell
   # Download main script
   Invoke-WebRequest -Uri "https://raw.githubusercontent.com/yourusername/whatsapp-automation/main/start-app.ps1" -OutFile "start-app.ps1"
   
   # Download launcher
   Invoke-WebRequest -Uri "https://raw.githubusercontent.com/yourusername/whatsapp-automation/main/Start%20WhatsApp%20Automation.bat" -OutFile "Start WhatsApp Automation.bat"
   ```

2. **Run the application:**
   - Double-click `Start WhatsApp Automation.bat`
   - Or run `.\start-app.ps1` in PowerShell

## 🛠️ Requirements

- **Node.js** (Required) - Download from [nodejs.org](https://nodejs.org/)
- **Python** (Optional) - Download from [python.org](https://python.org/)
- **Windows 10/11** with PowerShell

## 🎯 Features

- ✅ **Automatic dependency installation** (npm install, pip install)
- ✅ **Colorful terminal interface**
- ✅ **Error handling and validation**
- ✅ **Auto-restart functionality**
- ✅ **Cross-platform compatible scripts**

## 📞 Usage

1. **First run:** The script will automatically install all dependencies
2. **Subsequent runs:** Just launches the application
3. **Restart:** Use the built-in restart menu when the app closes

## 🔧 Troubleshooting

### PowerShell Execution Policy Error
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Node.js Not Found
Download and install from [nodejs.org](https://nodejs.org/)

### Python Not Found (Optional)
Download and install from [python.org](https://python.org/)

## 📁 File Structure
```
WhatsApp Automation V2/
├── start-app.ps1              # Main PowerShell script
├── Start WhatsApp Automation.bat  # Double-click launcher
├── install.ps1                # PowerShell installer
├── install.sh                 # Bash installer
└── README.md                  # This file
```

## 🌐 Hosting Your Scripts

To make your scripts downloadable, you can:

1. **GitHub (Free):**
   - Upload files to a GitHub repository
   - Use raw.githubusercontent.com URLs
   - Example: `https://raw.githubusercontent.com/username/repo/main/start-app.ps1`

2. **GitHub Gist (Simple):**
   - Create a gist with your script
   - Use the raw URL from the gist

3. **Your own server:**
   - Upload files to your web server
   - Ensure proper MIME types for .ps1 files

4. **Cloud storage:**
   - Use services like Dropbox, Google Drive with direct links

## 📋 Commands Summary

| Method | Command |
|--------|---------|
| PowerShell One-liner | `iex ((New-Object System.Net.WebClient).DownloadString('YOUR_URL/install.ps1'))` |
| Curl | `curl -sSL YOUR_URL/install.sh \| bash` |
| Manual Download | `Invoke-WebRequest -Uri "YOUR_URL/start-app.ps1" -OutFile "start-app.ps1"` |
| Run Locally | `.\start-app.ps1` or double-click the .bat file |

---
**Replace `YOUR_URL` and `yourusername/repo` with your actual hosting URLs!**
