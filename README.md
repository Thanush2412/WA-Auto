# 🚀 WhatsApp Automation V2

[![PowerShell](https://img.shields.io/badge/PowerShell-5391FE?style=for-the-badge&logo=powershell&logoColor=white)](https://docs.microsoft.com/en-us/powershell/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Electron](https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white)](https://www.electronjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Professional WhatsApp Automation Tool with Background Scanning & Message Management**

> **⚡ One-command installation** • **🎨 Beautiful terminal UI** • **🔄 Auto-restart functionality** • **📱 WhatsApp Web integration**

---

## 🌟 Features

- ✅ **Automated message sending** with CSV support
- ✅ **Background window scanning** with OCR technology
- ✅ **Clipboard monitoring** for real-time automation
- ✅ **MongoDB integration** for message tracking
- ✅ **Screenshot capabilities** with Tesseract OCR
- ✅ **Electron-based GUI** with modern interface
- ✅ **VBScript automation** for system integration
- ✅ **Portable & installable** deployment options

---

## 🚀 Quick Start

### ⚡ One-Line Installation (Recommended)

**Copy and paste this command in PowerShell (Run as Administrator):**

```powershell
iex (iwr -useb 'https://raw.githubusercontent.com/Thanush2412/WA-Auto/main/install.ps1').Content
```

**Alternative installation methods:**

<details>
<summary>📋 More Installation Options</summary>

#### Method 2: Direct PowerShell
```powershell
iex ((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/Thanush2412/WA-Auto/main/install.ps1'))
```

#### Method 3: Manual Download
```powershell
# Download and run installer
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/Thanush2412/WA-Auto/main/install.ps1" -OutFile "install.ps1"
.\install.ps1
```

#### Method 4: Git Clone
```bash
git clone https://github.com/Thanush2412/WA-Auto.git
cd WA-Auto
.\start-app.ps1
```

</details>

### 🎯 Usage

1. **First Run:** Automatically installs dependencies (Node.js packages, Python requirements)
2. **Launch:** Double-click `Start WhatsApp Automation.bat` or run `.\start-app.ps1`
3. **Setup:** Ensure WhatsApp Web is logged in on your browser
4. **Automation:** Use the GUI to configure your automation tasks

---

## 🛠️ System Requirements

| Component | Requirement | Download Link |
|-----------|-------------|---------------|
| **Operating System** | Windows 10/11 | - |
| **Node.js** | v16+ (Required) | [Download](https://nodejs.org/) |
| **Python** | v3.8+ (Optional) | [Download](https://python.org/) |
| **PowerShell** | v5.1+ (Built-in) | - |
| **Memory** | 4GB RAM minimum | - |
| **Storage** | 500MB free space | - |

---

## 📁 Project Structure

```
WA-Auto/
├── 📄 README.md                          # This file
├── 🚀 install.ps1                        # PowerShell installer
├── 🖥️ start-app.ps1                      # Main launcher script
├── 📦 package.json                       # Node.js dependencies
├── ⚡ Start WhatsApp Automation.bat      # Windows launcher
├── 📋 quick-install.ps1                  # Quick installer
├── 🐧 install.sh                         # Bash installer
├── 📖 README-INSTALL.md                  # Installation guide
├── 🔧 build-portable.js                  # Portable build script
├── 📦 package-portable.json              # Portable package config
├── 🛠️ setup-complete-standalone.bat     # Standalone setup
│
├── 📂 src/                               # Source code
│   ├── 📂 main/                          # Main process files
│   │   ├── 🖥️ main.js                   # Electron main process
│   │   ├── 🖥️ main-portable.js          # Portable main process
│   │   ├── 🔗 preload.js                # Preload scripts
│   │   ├── 📂 handlers/                  # Event handlers
│   │   ├── 📂 services/                  # Core services
│   │   └── 📂 utils/                     # Utility functions
│   ├── 📂 renderer/                      # Frontend files
│   │   ├── 🌐 index.html                # Main UI
│   │   ├── 📂 css/                       # Stylesheets
│   │   └── 📂 js/                        # Client-side scripts
│   └── 📂 shared/                        # Shared utilities
│
├── 📂 scripts/                           # Automation scripts
│   ├── 📄 paste.vbs                     # Clipboard automation
│   ├── 📄 send.vbs                      # Send key automation
│   └── 📂 python/                       # Python utilities
│       ├── 📋 requirements.txt          # Python dependencies
│       ├── 🔍 verify.py                 # Verification script
│       └── 🔍 verify_portable.py        # Portable verification
│
├── 📂 database/                          # Database files
│   ├── 🗄️ mongodb.js                    # MongoDB connection
│   ├── 📂 migrations/                   # Database migrations
│   └── 📂 schemas/                      # Data schemas
│
├── 📂 assets/                            # Static assets
│   ├── 🖼️ app_icon.png                  # Application icon
│   ├── 🖼️ logo.png                      # Logo image
│   └── 🖼️ not in whatsapp.png          # Fallback image
│
├── 📂 config/                            # Configuration files
├── 📂 temp/                              # Temporary files
│   └── 📄 messages.json                 # Message cache
│
└── 📂 Tesseract-OCR/                    # OCR engine
    ├── 🔧 tesseract.exe                 # OCR executable
    ├── 📂 tessdata/                     # Language data
    └── 📚 [DLL files...]                # Required libraries
```

---

## 🎨 Screenshot & Demo

<div align="center">

### 💻 Beautiful Terminal Interface
![Terminal Interface](assets/terminal-preview.png)

### 🖥️ Electron Application
![Application GUI](assets/app-preview.png)

</div>

---

## 🔧 Configuration

### 📋 Environment Setup

The installer automatically handles:
- ✅ Node.js dependency installation (`npm install`)
- ✅ Python requirements (`pip install -r requirements.txt`)
- ✅ Directory structure creation
- ✅ Tesseract OCR setup
- ✅ Database configuration

### ⚙️ Manual Configuration

<details>
<summary>📖 Advanced Settings</summary>

#### Database Configuration
Edit `database/mongodb.js` for custom database settings:
```javascript
const dbConfig = {
    url: 'mongodb://localhost:27017/whatsapp_automation',
    options: { useUnifiedTopology: true }
};
```

#### Python Dependencies
Install additional Python packages:
```bash
pip install pillow pyautogui pytesseract requests pytz
```

#### OCR Languages
Add more Tesseract languages in `Tesseract-OCR/tessdata/`:
```bash
# Download additional language packs
wget https://github.com/tesseract-ocr/tessdata/raw/main/fra.traineddata
```

</details>

---

## 🚨 Troubleshooting

### Common Issues & Solutions

<details>
<summary>🔍 PowerShell Execution Policy Error</summary>

**Error:** `cannot be loaded because running scripts is disabled`

**Solution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

</details>

<details>
<summary>🔍 Node.js Not Found</summary>

**Error:** `'node' is not recognized as an internal or external command`

**Solution:**
1. Download from [nodejs.org](https://nodejs.org/)
2. Install with "Add to PATH" option checked
3. Restart PowerShell/Command Prompt

</details>

<details>
<summary>🔍 Python Not Found (Optional)</summary>

**Error:** `'python' is not recognized as an internal or external command`

**Solution:**
1. Download from [python.org](https://python.org/)
2. Install with "Add Python to PATH" option checked
3. Restart PowerShell/Command Prompt

</details>

<details>
<summary>🔍 WhatsApp Web Issues</summary>

**Issue:** Automation not working

**Solution:**
1. Open WhatsApp Web in Chrome/Edge
2. Ensure you're logged in
3. Keep the browser tab active
4. Check network connection

</details>

<details>
<summary>🔍 Permission Denied</summary>

**Issue:** Installation fails with permission errors

**Solution:**
1. Run PowerShell as Administrator
2. Use portable installation: `.\install.ps1 -Portable`
3. Install to user directory instead of system

</details>

---

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `.\start-app.ps1` | Launch the application |
| `.\install.ps1` | Full installation |
| `.\install.ps1 -Portable` | Portable installation |
| `npm start` | Start Electron app directly |
| `npm run build` | Build for distribution |
| `npm run build-exe` | Create executable |

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **🍴 Fork** the repository
2. **🌿 Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **💾 Commit** your changes: `git commit -m 'Add amazing feature'`
4. **📤 Push** to the branch: `git push origin feature/amazing-feature`
5. **🔀 Open** a Pull Request

### Development Setup
```bash
# Clone the repository
git clone https://github.com/Thanush2412/WA-Auto.git
cd WA-Auto

# Install dependencies
npm install
pip install -r scripts/python/requirements.txt

# Start development
npm start
```

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Electron** - Cross-platform desktop app framework
- **Tesseract** - OCR engine for image text recognition
- **Node.js** - JavaScript runtime
- **MongoDB** - Database for message storage
- **Community** - For feedback and contributions

---

## 📞 Support

- 🐛 **Issues:** [GitHub Issues](https://github.com/Thanush2412/WA-Auto/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/Thanush2412/WA-Auto/discussions)
- 📧 **Email:** [Support Email](mailto:support@example.com)

---

<div align="center">

### ⭐ If this project helped you, please give it a star!

**Made with ❤️ by [Thanush2412](https://github.com/Thanush2412)**

[![GitHub stars](https://img.shields.io/github/stars/Thanush2412/WA-Auto?style=social)](https://github.com/Thanush2412/WA-Auto/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/Thanush2412/WA-Auto?style=social)](https://github.com/Thanush2412/WA-Auto/network)

</div>
