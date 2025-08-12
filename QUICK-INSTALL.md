# 🚀 WhatsApp Automation V2 - Quick Install Guide

## ⚡ **FASTEST INSTALL (Recommended)**
**🌟 NEW! Chain Installer - Downloads everything + Installs dependencies + Runs app automatically!**

### 🎯 Method 1: PowerShell Chain Installer (Complete Setup)
**Copy and paste in PowerShell:**
```powershell
iex (iwr -useb 'https://raw.githubusercontent.com/Thanush2412/WA-Auto/master/installers/chain-install.ps1').Content
```

### 💻 Method 2: CMD Chain Installer (Complete Setup)
**Copy and paste in CMD:**
```cmd
powershell -ExecutionPolicy Bypass -Command "iex (iwr 'https://raw.githubusercontent.com/Thanush2412/WA-Auto/master/installers/chain-install.ps1').Content"
```

---

## 📋 **ALTERNATIVE INSTALLS**

### 🔹 Method 3: Minimal Install (Essential Files Only)
**For quick setup with just the essentials:**
```powershell
iex (iwr -useb 'https://raw.githubusercontent.com/Thanush2412/WA-Auto/master/installers/simple-install.ps1').Content
```

### � Method 4: Full Download (All Repository Files)
**Downloads complete repository without auto-install:**
```powershell
iex (iwr -useb 'https://raw.githubusercontent.com/Thanush2412/WA-Auto/master/installers/full-download.ps1').Content
```

### � Method 5: CMD Essential Install
**For CMD users who prefer essential files only:**
```cmd
curl -L https://raw.githubusercontent.com/Thanush2412/WA-Auto/master/installers/cmd-install.bat -o install.bat && install.bat
```

### 🔹 Method 6: Git Clone (For Developers)
**Complete repository with git version control:**
```bash
git clone https://github.com/Thanush2412/WA-Auto.git
cd WA-Auto
.\start-app.ps1
```

## 🔧 Installation Methods Comparison

| Method | Platform | Files Downloaded | Auto Install | Auto Launch | Best For |
|--------|----------|------------------|--------------|-------------|----------|
| **Chain Installer** | PowerShell | ALL repository files | ✅ Yes | ✅ Yes | Most users - complete setup |
| **Minimal Install** | PowerShell | 3 essential files | ✅ Yes | ❌ Manual | Quick setup |
| **Full Download** | PowerShell | ALL repository files | ❌ Manual | ❌ Manual | Users who want all files |
| **CMD Essential** | Command Prompt | 3 essential files | ✅ Yes | ❌ Manual | CMD users |
| **Git Clone** | Git + PowerShell | Complete repository | ❌ Manual | ❌ Manual | Developers |

## ✅ What Gets Installed

**Chain Installer includes:**
- ✅ Complete repository download
- ✅ Auto npm install (Node.js dependencies)
- ✅ Auto pip install (Python requirements)
- ✅ Desktop shortcut creation
- ✅ Auto-launch after installation
- ✅ Colorful progress indicators
- ✅ Automatic prerequisite checking

**Essential Installers include:**
- ✅ `start-app.ps1` - Main application launcher
- ✅ `Start WhatsApp Automation.bat` - Double-click launcher  
- ✅ `package.json` - Node.js dependencies
- ✅ Auto-installs npm packages
- ✅ Auto-installs Python requirements (if available)

## Prerequisites (Auto-checked by installers)
- **Node.js** - Required (installer provides download link if missing)
- **Python** - Optional (installer works without it)
- **Windows 10/11** with PowerShell

## After Installation
- **Desktop shortcut:** Double-click the created shortcut
- **Manual launch:** Run `.\start-app.ps1`
- **Make sure WhatsApp Web is logged in** in your browser

## Troubleshooting

**PowerShell Execution Policy Error:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**If download fails, try alternative URL:**
```powershell
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/Thanush2412/WA-Auto/master/installers/chain-install.ps1" -OutFile "install.ps1"; .\install.ps1
```

---

**Repository:** https://github.com/Thanush2412/WA-Auto  
**Issues:** https://github.com/Thanush2412/WA-Auto/issues
