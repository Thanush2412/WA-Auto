# 🚀 Quick Installation Guide

## One-Command Installation

### 🎯 Method 1: Full Installation (Recommended)
**Copy and paste this single command in PowerShell (Run as Administrator):**

```powershell
iex (iwr -useb 'https://raw.githubusercontent.com/Thanush2412/WA-Auto/main/install.ps1').Content
```

### ⚡ Method 2: Simple Installation (Fast)
**For just the essential files:**

```powershell
iex (iwr -useb 'https://raw.githubusercontent.com/Thanush2412/WA-Auto/main/simple-install.ps1').Content
```

### 🔄 Method 3: Alternative (if above fails)
**Using different PowerShell syntax:**

```powershell
iex ((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/Thanush2412/WA-Auto/main/install.ps1'))
```k Installation Guide

## One-Command Installation

**Copy and paste this single command in PowerShell (Run as Administrator):**

```powershell
iex (iwr -useb 'https://raw.githubusercontent.com/Thanush2412/WA-Auto/master/install.ps1').Content
```

That's it! The installer will:
- ✅ Download all files automatically
- ✅ Install Node.js dependencies  
- ✅ Install Python requirements
- ✅ Set up the complete environment
- ✅ Launch the application

## 🔧 Installation Methods Explained

| Method | Description | Use When |
|--------|-------------|----------|
| **Full Installation** | Downloads complete project structure | First-time installation, want all features |
| **Simple Installation** | Downloads only essential files | Quick setup, minimal installation |
| **Alternative** | Different PowerShell syntax | If Method 1 fails due to execution policy |

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
