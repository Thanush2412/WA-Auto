# 🚀 WhatsApp Automation V2 - Installation Guide

## ⚡ One-Command Installation (Choose Your Method)

### 🎯 Method 1: PowerShell (Minimal - Recommended)
**Copy and paste in PowerShell:**
```powershell
iex (iwr -useb 'https://raw.githubusercontent.com/Thanush2412/WA-Auto/main/simple-install.ps1').Content
```

### 💻 Method 2: CMD/Command Prompt
**Copy and paste in CMD:**
```cmd
curl -L https://raw.githubusercontent.com/Thanush2412/WA-Auto/main/cmd-install.bat -o install.bat && install.bat
```

### 🔧 Method 3: PowerShell (Full Installation)
**For complete project setup:**
```powershell
iex (iwr -useb 'https://raw.githubusercontent.com/Thanush2412/WA-Auto/main/install.ps1').Content
```

### 🔄 Method 4: Alternative PowerShell
**If Method 1 fails:**
```powershell
iex ((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/Thanush2412/WA-Auto/main/simple-install.ps1'))
```k Installation Guide

## One-Command Installation

**Copy and paste this single command in PowerShell (Run as Administrator):**

```powershell
iex (iwr -useb 'https://raw.githubusercontent.com/Thanush2412/WA-Auto/master/install.ps1').Content
```

## 🔧 Installation Methods Explained

| Method | Platform | Files Downloaded | Best For |
|--------|----------|------------------|----------|
| **PowerShell Minimal** | Windows PowerShell | 3 essential files | Quick setup, most users |
| **CMD** | Command Prompt | 3 essential files | Users who prefer CMD |
| **PowerShell Full** | Windows PowerShell | 5+ files | Complete documentation |
| **Alternative** | PowerShell | 3 essential files | Execution policy issues |

## ✅ What Gets Installed

All methods install these essential files:
- ✅ `start-app.ps1` - Main application launcher
- ✅ `Start WhatsApp Automation.bat` - Double-click launcher  
- ✅ `package.json` - Node.js dependencies
- ✅ Auto-installs npm packages
- ✅ Auto-installs Python requirements (if available)

## What Users Need to Know

### Prerequisites (Auto-checked by installer)
- **Node.js** - If not installed, installer provides download link
- **Python** - Optional, installer provides download link if missing
- **Windows 10/11** with PowerShell

### After Installation
- **Desktop shortcut:** Double-click `Start WhatsApp Automation.bat`
- **PowerShell:** Run `.\start-app.ps1`
- **Make sure WhatsApp Web is logged in** in your browser

## Troubleshooting

**PowerShell Execution Policy Error:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**For portable installation:**
```powershell
iex (iwr -useb 'https://raw.githubusercontent.com/Thanush2412/WA-Auto/main/install.ps1').Content -Portable
```

---

**Repository:** https://github.com/Thanush2412/WA-Auto  
**Issues:** https://github.com/Thanush2412/WA-Auto/issues
