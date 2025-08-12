const { app, BrowserWindow, ipcMain, Menu, Tray, shell, dialog, clipboard } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const Store = require('electron-store');
const log = require('electron-log');
const notifier = require('node-notifier');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const { exec, spawn } = require('child_process');
const https = require('https');
const AdmZip = require('adm-zip');

// Import MongoDB service
const db = require('../../database/mongodb');

// Portable environment detection and setup
function getPortablePaths() {
  let basePath;
  
  if (app.isPackaged) {
    // When packaged as executable, use the resources directory
    basePath = process.resourcesPath;
  } else {
    // In development, use project root
    basePath = path.resolve(__dirname, '..', '..');
  }
  
  return {
    pythonExe: path.join(basePath, 'portable', 'python', 'python.exe'),
    tesseractExe: path.join(basePath, 'portable', 'tesseract', 'tesseract.exe'),
    scriptsDir: path.join(basePath, 'scripts'),
    assetsDir: path.join(basePath, 'assets'),
    databaseDir: path.join(basePath, 'database')
  };
}

// Check if portable environment is ready
function checkPortableEnvironment() {
  const paths = getPortablePaths();
  
  const checks = {
    python: fs.existsSync(paths.pythonExe),
    tesseract: fs.existsSync(paths.tesseractExe),
    scripts: fs.existsSync(paths.scriptsDir),
    assets: fs.existsSync(paths.assetsDir)
  };
  
  log.info('Portable environment check:', checks);
  log.info('Python path:', paths.pythonExe);
  log.info('Tesseract path:', paths.tesseractExe);
  
  return checks;
}

// Global variables
let mainWindow;
let tray;
let isQuitting = false;

// Store initialization
const store = new Store();

// Create directory for app data
const createAppDataDirectory = () => {
  const paths = getPortablePaths();
  const appDataPath = app.isPackaged 
    ? path.join(process.resourcesPath, 'app_data.json')
    : path.join(__dirname, 'app_data.json');
    
  log.info(`Using app_data.json in ${app.isPackaged ? 'production' : 'development'} mode: ${appDataPath}`);
  
  if (!fs.existsSync(appDataPath)) {
    log.info('Creating app_data.json...');
    fs.writeFileSync(appDataPath, JSON.stringify({
      messages: [],
      sent_messages: [],
      settings: {}
    }, null, 2));
  }
  
  return appDataPath;
};

// Initialize app data
const initializeAppData = () => {
  const appDataPath = createAppDataDirectory();
  
  try {
    const data = JSON.parse(fs.readFileSync(appDataPath, 'utf8'));
    log.info('App data initialized with empty structure - data will be loaded from MongoDB');
    return data;
  } catch (error) {
    log.error('Error reading app data:', error);
    const defaultData = {
      messages: [],
      sent_messages: [],
      settings: {}
    };
    fs.writeFileSync(appDataPath, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
};

// Create the main window
const createWindow = () => {
  const paths = getPortablePaths();
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    icon: path.join(paths.assetsDir, 'app_icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, '..', 'renderer', 'preload.js')
    },
    show: false,
    frame: true,
    resizable: true,
    minimizable: true,
    maximizable: true,
    closable: true
  });

  // Load the HTML file
  const htmlPath = path.join(__dirname, '..', 'renderer', 'index.html');
  mainWindow.loadFile(htmlPath);

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle close event (minimize to tray instead of closing)
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    log.info('Main window created');
    mainWindow.show();
  });

  return mainWindow;
};

// Create system tray
const createTray = () => {
  const paths = getPortablePaths();
  
  try {
    log.info('Creating system tray');
    
    const trayIconPath = path.join(paths.assetsDir, 'app_icon.png');
    
    if (!fs.existsSync(trayIconPath)) {
      log.error('Tray icon not found at:', trayIconPath);
      return null;
    }
    
    tray = new Tray(trayIconPath);
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show App',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      {
        label: 'Quit',
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ]);
    
    tray.setContextMenu(contextMenu);
    tray.setToolTip('WhatsApp Automation');
    
    // Show window on tray click
    tray.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.focus();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });
    
    log.info('System tray created successfully');
    return tray;
    
  } catch (error) {
    log.error('Error creating system tray:', error);
    return null;
  }
};

// App event handlers
app.whenReady().then(async () => {
  log.info('Application starting...');
  
  // Check portable environment
  const envCheck = checkPortableEnvironment();
  if (!envCheck.python || !envCheck.tesseract) {
    log.warn('Portable environment not complete. Some features may not work.');
    log.warn('Missing components:', {
      python: !envCheck.python,
      tesseract: !envCheck.tesseract
    });
  }
  
  // Initialize MongoDB
  try {
    await db.connect();
    log.info('MongoDB initialized successfully');
  } catch (error) {
    log.error('MongoDB initialization failed:', error);
  }
  
  // Initialize app data
  initializeAppData();
  
  // Create system tray first
  createTray();
  
  // Create main window
  createWindow();
  
  // Load settings and start background processes
  setTimeout(async () => {
    await loadSettings();
    startBackgroundProcesses();
  }, 1000);
});

app.on('window-all-closed', () => {
  // On macOS, don't quit when all windows are closed
  if (process.platform !== 'darwin') {
    // Don't quit, just hide to tray
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

// Global variables for app state
let appData = { messages: [], sent_messages: [], settings: {} };
let backgroundCheckEnabled = false;
let backgroundInterval;
let verificationQueue = [];
let messageQueue = [];
let isProcessingQueue = false;

// Settings management
let settings = {
  messageTemplate: '',
  notificationMinutes: 1,
  notificationSeconds: 0,
  notificationsEnabled: false,
  primaryKeyField: 'Reference Id'
};

// Load settings function
const loadSettings = async () => {
  try {
    const retrievedSettings = await db.getSettings();
    
    if (retrievedSettings && Object.keys(retrievedSettings).length > 0) {
      log.info('Settings retrieved from MongoDB:', {
        messageTemplate: retrievedSettings.messageTemplate ? 'Present' : 'Missing',
        settingsKeys: Object.keys(retrievedSettings)
      });
      
      log.info('Current settings from MongoDB:', retrievedSettings);
      
      // Update global settings
      settings = { ...settings, ...retrievedSettings };
      
      // Update background check settings
      if (settings.notificationsEnabled) {
        log.info('Notifications are enabled');
        enableBackgroundCheck();
      } else {
        log.info('Notifications are disabled');
        const intervalMs = (settings.notificationMinutes * 60 + settings.notificationSeconds) * 1000;
        log.info(`Background checking will run with interval: ${settings.notificationMinutes} minutes ${settings.notificationSeconds} seconds (${intervalMs}ms)`);
      }
      
    } else {
      log.info('No settings found in MongoDB, using defaults');
    }
    
    // Initial check for queued messages
    checkQueuedMessages();
    
  } catch (error) {
    log.error('Error loading settings:', error);
  }
};

// Rest of the functions remain the same as in the original main.js...
// [Continue with all the other functions from the original file]
