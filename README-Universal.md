# WhatsApp Automation V2 - Universal Solution

A single, comprehensive PowerShell script that works on **all Windows systems** (Windows 7/8/10/11) with PowerShell 2.0+.

## 🚀 One-Liner Installation

### PowerShell (Recommended)
```powershell
iwr -useb https://raw.githubusercontent.com/Thanush2412/WA-Auto/master/WhatsApp-Automation-V2.ps1 | iex
```

### Command Prompt
```cmd
powershell -c "iwr -useb https://raw.githubusercontent.com/Thanush2412/WA-Auto/master/WhatsApp-Automation-V2.ps1 | iex"
```

## 📋 Usage

### If you have the script file:
```powershell
# Install the application
.\WhatsApp-Automation-V2.ps1 -Install

# Run the application
.\WhatsApp-Automation-V2.ps1 -Run

# Show help
.\WhatsApp-Automation-V2.ps1 -Help
```

### Default behavior (no parameters):
```powershell
# Runs the application from current directory
.\WhatsApp-Automation-V2.ps1
```

## ✨ Features

### 🔧 **Universal Compatibility**
- **Windows 7, 8, 10, 11** support
- **PowerShell 2.0+** compatible
- **Both 32-bit and 64-bit** systems
- **Automatic fallbacks** for older systems

### 🚀 **Complete Automation**
- **One-command installation**: Download → Install → Run
- **Smart dependency management**: Node.js, Python, npm packages
- **Automatic admin privileges**: Requests elevation when needed
- **Tesseract OCR integration**: System-wide installation

### 🎨 **Professional Experience**
- **Colorful terminal UI**: Status indicators and progress bars
- **Detailed feedback**: Clear success/error messages
- **Graceful error handling**: Continues with limited functionality
- **Desktop shortcut**: Easy access after installation

### 🛡️ **Smart Installation**
- **Backup existing installations**: Never lose your data
- **PATH management**: Automatic system PATH updates
- **Dependency checking**: Verifies all prerequisites
- **Cleanup automation**: Removes temporary files

## 📁 What It Does

### Installation Mode (`-Install`)
1. **Downloads** latest version from GitHub
2. **Installs** to `%USERPROFILE%\WhatsApp-Automation-V2`
3. **Configures** all dependencies (Node.js, Python, Tesseract)
4. **Creates** desktop shortcut
5. **Launches** application automatically

### Run Mode (`-Run` or default)
1. **Checks** Node.js and npm
2. **Installs** npm dependencies
3. **Configures** Python environment
4. **Sets up** Tesseract OCR
5. **Launches** WhatsApp Automation V2

## 🔧 System Requirements

### Required
- **Windows 7/8/10/11**
- **PowerShell 2.0+** (included in all modern Windows)
- **Node.js** (latest LTS recommended)
- **Internet connection** (for installation)

### Optional
- **Python 3.x** (for enhanced features)
- **Administrator privileges** (for system-wide Tesseract installation)

## 🎯 Key Benefits

### For Users
- **No technical knowledge required**: One command does everything
- **Works on any Windows**: From Windows 7 to Windows 11
- **Automatic updates**: Always gets the latest version
- **Professional interface**: Clear status and beautiful terminal UI

### For Developers
- **Single file solution**: No more multiple installers
- **Cross-version compatibility**: PowerShell 2.0 to 7.x
- **Error resilience**: Graceful degradation on missing features
- **Easy maintenance**: One script to rule them all

## 🔄 Migration from Old System

If you previously used multiple `.ps1` and `.bat` files, this single script replaces:
- ✅ `start-app.ps1`
- ✅ `install.ps1`
- ✅ `install.bat`
- ✅ `install-tesseract.ps1`
- ✅ All files in `installers/` folder
- ✅ All `.bat` launcher files

## 🛠️ Troubleshooting

### Installation Issues
- **Download fails**: Check internet connection
- **Admin required**: Run PowerShell as Administrator
- **Node.js missing**: Install from https://nodejs.org/

### Runtime Issues
- **App won't start**: Run `.\WhatsApp-Automation-V2.ps1 -Install` to reinstall
- **OCR not working**: Ensure Tesseract was installed (check for admin privileges)
- **Python errors**: Python installation is optional but recommended

## 📞 Support

For issues or questions:
1. Check the terminal output for detailed error messages
2. Ensure you have the latest Node.js version
3. Try running as Administrator for full functionality
4. Use `-Help` parameter for usage information

---

**One script. All systems. Zero hassle.** 🚀
