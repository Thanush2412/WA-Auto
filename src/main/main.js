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

// Configure logging

// Configure logging
log.transports.file.level = 'info';
log.info('Application starting...');

// Initialize data store (keeping for backward compatibility)
const store = new Store();

// Initialize MongoDB connection
async function initMongoDB() {
  try {
    await db.connect();
    log.info('MongoDB initialized successfully');
    return true;
  } catch (error) {
    log.error('Failed to initialize MongoDB:', error);
    return false;
  }
}

let appDataFile;

// Check if we're running in development or production
if (app.isPackaged) {
  // Production - first check if app_data.json exists in the extraResources folder
  const resourcePath = path.join(process.resourcesPath, 'app_data.json');
  if (fs.existsSync(resourcePath)) {
    appDataFile = resourcePath;
    log.info(`Using existing app_data.json from resources: ${appDataFile}`);
  } else {
    // If not, use the userData directory (persists between updates)
    appDataFile = path.join(app.getPath('userData'), 'app_data.json');
    log.info(`Using app_data.json in userData directory: ${appDataFile}`);
  }
} else {
  // Development - use the file in project directory
  appDataFile = path.join(__dirname, 'app_data.json');
  log.info(`Using app_data.json in development mode: ${appDataFile}`);
}

// App data CRUD operations
let appData = null;

// Initialize app data - DISABLED, now using MongoDB
function initAppData() {
  try {
    // Create empty app data structure - no default template
    appData = {
      settings: {},  // Will be loaded from MongoDB
      messageQueue: [],  // Will be loaded from MongoDB
      sentMessages: [],  // Will be loaded from MongoDB
      lastCheck: null,
      timestamp: new Date().toISOString()
    };
    
    log.info('App data initialized with empty structure - data will be loaded from MongoDB');
    return true;
  } catch (error) {
    log.error('Error initializing app data:', error);
    return false;
  }
}

// Sync store with app data - DISABLED, now using MongoDB
function syncStoreWithAppData() {
  // Function disabled - no longer syncing with local store
  log.info('Store sync disabled - using MongoDB for data storage');
  return true;
}

// Save all app data to JSON file - DISABLED
// This function has been disabled as we now use MongoDB for all data storage
function saveAppData() {
  // Function disabled - no longer saving to app_data.json
  return true;
}

// Update a specific message in the queue
function updateMessageInQueue(recordIndex, updatedMessage) {
  try {
    if (!appData) initAppData();
    
    // Find the message in the queue
    const index = appData.messageQueue.findIndex(msg => msg.recordIndex === recordIndex);
    
    if (index !== -1) {
      // Update the message
      appData.messageQueue[index] = { ...appData.messageQueue[index], ...updatedMessage };
      
      // Save to file
      fs.writeFileSync(appDataFile, JSON.stringify(appData, null, 2));
      
      // Update store
      store.set('messageQueue', appData.messageQueue);
      
      log.info(`Message ${recordIndex} updated in queue`);
      return true;
    } else {
      log.warn(`Message ${recordIndex} not found in queue`);
      return false;
    }
  } catch (error) {
    log.error(`Error updating message ${recordIndex}:`, error);
    return false;
  }
}

// Move a message from queue to sent messages
function moveMessageToSent(recordIndex) {
  try {
    if (!appData) initAppData();
    
    // Find the message in the queue
    const index = appData.messageQueue.findIndex(msg => msg.recordIndex === recordIndex);
    
    if (index !== -1) {
      // Mark as sent
      const message = { ...appData.messageQueue[index], isSent: true, sentTime: new Date().toISOString(), status: 'Sent' };
      
      // Remove from queue
      appData.messageQueue.splice(index, 1);
      
      // Add to sent messages - now handled by MongoDB
      // This function is kept for backward compatibility but file operations are disabled
      appData.sentMessages.push(message);
      
      log.info(`Message ${recordIndex} moved to sent messages`);
      return true;
    } else {
      log.warn(`Message ${recordIndex} not found in queue`);
      return false;
    }
  } catch (error) {
    log.error(`Error moving message ${recordIndex} to sent:`, error);
    return false;
  }
}

// Snooze a message in the queue
function snoozeMessage(recordIndex, minutes) {
  try {
    if (!appData) initAppData();
    
    // Find the message in the queue
    const index = appData.messageQueue.findIndex(msg => msg.recordIndex === recordIndex);
    
    if (index !== -1) {
      // Calculate snooze time
      const now = new Date();
      const snoozedUntil = new Date(now.getTime() + minutes * 60000);
      
      // Update message
      appData.messageQueue[index] = {
        ...appData.messageQueue[index],
        isSnoozed: true,
        snoozedUntil: snoozedUntil.toISOString(),
        status: 'Snoozed'
      };
      
      // Save to file
      fs.writeFileSync(appDataFile, JSON.stringify(appData, null, 2));
      
      // Update store
      store.set('messageQueue', appData.messageQueue);
      
      log.info(`Message ${recordIndex} snoozed for ${minutes} minutes until ${snoozedUntil.toISOString()}`);
      return true;
    } else {
      log.warn(`Message ${recordIndex} not found in queue`);
      return false;
    }
  } catch (error) {
    log.error(`Error snoozing message ${recordIndex}:`, error);
    return false;
  }
}

ipcMain.on('snooze-message', (event, data) => {
  try {
    const { recordIndex, minutes } = data;
    
    // Use the CRUD function to snooze the message
    const success = snoozeMessage(recordIndex, minutes);
    
    if (success) {
      log.info(`Message ${recordIndex} snoozed for ${minutes} minutes`);
      event.returnValue = { success: true };
    } else {
      log.warn(`Message not found in queue: ${recordIndex}`);
      event.returnValue = { success: false, error: 'Message not found' };
    }
  } catch (error) {
    log.error('Error snoozing message:', error);
    event.returnValue = { success: false, error: error.message };
  }
});

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;
let tray = null;
let isQuitting = false;
let backgroundCheckInterval = null;
let pasteButtonWindow = null; // Reference to the paste button overlay window

// Create the main application window
function createWindow() {
  try {
    // Initialize app data
    initAppData();
    
    mainWindow = new BrowserWindow({
      width: 1000,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true
      },
      icon: path.join(__dirname, '../../assets/logo.png')
    });

    // Load the index.html file
    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, '../renderer/index.html'),
      protocol: 'file:',
      slashes: true
    }));

    // Create system tray
    createTray();

    // Start background checking
    startBackgroundChecking();
    
    // Set up WhatsApp verification handlers
    // verificationHandler.setupVerificationHandlers(ipcMain, mainWindow); // Temporarily disabled

    // Handle window close event
    mainWindow.on('close', (event) => {
      // Save app data before closing
      saveAppData();
      
      if (!isQuitting) {
        event.preventDefault();
        mainWindow.hide();
        return false;
      }
      return true;
    });

    // Handle window closed event
    mainWindow.on('closed', () => {
      mainWindow = null;
    });
    
    log.info('Main window created');
  } catch (error) {
    log.error('Error creating window:', error);
  }
}

// Create system tray
function createTray() {
  try {
    log.info('Creating system tray');
    
    // Use the existing logo.png file in the project directory
    const iconPath = path.join(__dirname, '../../assets/logo.png');
    
    // Create the tray icon
    tray = new Tray(iconPath);
    tray.setToolTip('WhatsApp Automation');
    
    // Create context menu
    const contextMenu = Menu.buildFromTemplate([
      { 
        label: 'Open', 
        click: () => {
          if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
          }
        } 
      },
      { type: 'separator' },
      { 
        label: 'Check Messages', 
        click: () => {
          checkQueuedMessages();
        } 
      },
      { type: 'separator' },
      { 
        label: 'Exit', 
        click: () => {
          app.quit();
        } 
      }
    ]);
    
    tray.setContextMenu(contextMenu);
    
    // Add click handler
    tray.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
      }
    });
    
    log.info('System tray created successfully');
  } catch (error) {
    log.error('Error creating system tray:', error);
  }
}

// Start background checking for messages
async function startBackgroundChecking() {
  // Clear any existing interval
  if (backgroundCheckInterval) {
    clearInterval(backgroundCheckInterval);
  }

  // Background checking disabled as requested by user
  // backgroundCheckInterval = setInterval(() => {
  //   checkQueuedMessages();
  // }, 900000);

  log.info('Background checking is disabled');
}

// Get messages directly from JSON file
function getMessages() {
  try {
    // Initialize app data if not already done
    if (!appData) initAppData();
    
    // Return messages from app data
    return appData.messageQueue || [];
  } catch (error) {
    log.error('Error getting messages from JSON file:', error);
    // Fallback to store if there's an error
    return store.get('messageQueue', []);
  }
}

// Get messages directly from MongoDB
async function getMessages() {
try {
// Initialize app data if not already done
if (!appData) initAppData();

// Get from MongoDB
const messages = await db.getMessages();
log.info('Retrieved messages from MongoDB in getMessages function');
return messages;
} catch (error) {
log.error('Error getting messages from MongoDB:', error);
// Fallback to store if there's an error
return store.get('messageQueue', []);
}
}

// Get sent messages directly from MongoDB
async function getSentMessages() {
try {
// Initialize app data if not already done
if (!appData) initAppData();

// Get from MongoDB
const sentMessages = await db.getSentMessages();
log.info('Retrieved sent messages from MongoDB in getSentMessages function');
return sentMessages;
} catch (error) {
log.error('Error getting sent messages from MongoDB:', error);
// Fallback to store if there's an error
return store.get('sentMessages', []);
}
}

// Get settings from MongoDB
async function getSettings() {
try {
// Get from MongoDB
const settings = await db.getSettings();
log.info('Retrieved settings from MongoDB in getSettings function');
return settings;
} catch (error) {
log.error('Error getting settings from MongoDB:', error);
// Fallback to store if there's an error
return store.get('settings', {});
}
}

// Global notification click handler
let currentNotificationMessage = null;

// Set up global notification click handlers
notifier.on('click', function() {
  log.info('Notification clicked');
  if (currentNotificationMessage) {
    showAppWithMessage(currentNotificationMessage.recordIndex);
  }
});

// Handle the 'Open' action button
notifier.on('activate', function() {
  log.info('Notification activated');
  if (currentNotificationMessage) {
    showAppWithMessage(currentNotificationMessage.recordIndex);
  }
});

// Function to show app and display message
function showAppWithMessage(recordIndex) {
  log.info(`Showing app with message: ${recordIndex}`);
  
  // Create window if it doesn't exist or is destroyed
  if (!mainWindow || mainWindow.isDestroyed()) {
    log.info('Creating new window');
    createWindow();
    
    // Wait for the window to be ready
    setTimeout(() => {
      if (mainWindow) {
        mainWindow.webContents.send('show-message', recordIndex);
        log.info('Sent show-message event after window creation');
      }
    }, 1500);
    return;
  }
  
  // Restore, show and focus the window
  if (mainWindow.isMinimized()) {
    log.info('Restoring minimized window');
    mainWindow.restore();
  }
  
  mainWindow.show();
  mainWindow.focus();
  
  // Send message to renderer to show the message details
  log.info('Sending show-message event');
  mainWindow.webContents.send('show-message', recordIndex);
}

// Check for queued messages that need notifications
async function checkQueuedMessages() {
  try {
    log.info('Checking queued messages');
    
    // Check the global notification toggle setting
    if (global.notificationsEnabled === false) {
      log.info('Notifications are disabled in settings, skipping notification check');
      return;
    }
    
    // Get messages and sent messages with proper await since they're async functions
    const messages = await getMessages() || [];
    const sentMessages = await getSentMessages() || [];
    
    // If we have message text, copy it to clipboard for pasting
    if (messageText && messageText.trim() !== '') {
      clipboard.writeText(messageText);
      log.info(`Copied message to clipboard: ${messageText}`);
      shouldPaste = true;
    } else {
      // If no message text provided, check if there's text in the URL
      if (url.includes('text=')) {
        try {
          const textParam = decodeURIComponent(url.split('text=')[1]);
          clipboard.writeText(textParam);
          log.info(`Copied URL text parameter to clipboard: ${textParam}`);
          shouldPaste = true;
        } catch (error) {
          log.error('Error extracting text from URL:', error);
        }
      }
    }
    
    // Filter out sent messages and snoozed messages
    const activeMessages = messages.filter(message => {
      // Check if message is already sent
      const isSent = sentMessages.some(sent => sent.recordIndex === message.recordIndex);
      
      // Check if message is snoozed
      const isSnoozed = message.isSnoozed && message.snoozedUntil && new Date(message.snoozedUntil) > new Date();
      
      return !isSent && !isSnoozed;
    });

    if (activeMessages.length > 0) {
      // Get the first active message
      const message = activeMessages[0];
      currentNotificationMessage = message;
      
      // Use the existing logo.png file for the notification icon
      const iconPath = path.join(__dirname, '../../assets/logo.png');
      
      // Show notification
      notifier.notify({
        title: 'Message Ready to Send',
        message: `Send message to ${message.studentName || 'Contact'}`,
        icon: iconPath,
        sound: true,
        wait: true,
        timeout: 30,
        appID: 'WhatsApp Automation'
      });

      // Update UI if window exists
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('refresh-messages');
      }
      
      log.info(`Notification shown for message to ${message.studentName}`);
    } else {
      log.info('No active messages to notify');
    }
  } catch (error) {
    log.error('Error checking queued messages:', error);
  }
}

// Start background checking with notification interval
let checkInterval = null;

async function startBackgroundChecking() {
  try {
    // Stop any existing interval
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
      log.info('Cleared existing check interval');
    }

    // Get settings directly from MongoDB to ensure latest values
    const settings = await db.getSettings();
    log.info('Current settings from MongoDB:', settings);
    
    // Check if notifications are enabled
    const notificationsEnabled = settings.notificationsEnabled !== false; // Default to true if not set
    log.info(`Notifications are ${notificationsEnabled ? 'enabled' : 'disabled'}`);
    
    // Store this setting globally for reference by other functions
    global.notificationsEnabled = notificationsEnabled;
    
    // Get notification interval settings, allowing 0 minutes
    // Use explicit check for undefined to allow 0 values
    let minutes = settings.notificationMinutes;
    if (minutes === undefined || minutes === null || isNaN(minutes)) {
      minutes = 0;
    }
    
    let seconds = settings.notificationSeconds;
    if (seconds === undefined || seconds === null || isNaN(seconds)) {
      seconds = 5;
    }
    
    // Convert to numbers to ensure proper calculation
    minutes = Number(minutes);
    seconds = Number(seconds);
    
    // Ensure we have at least 1 second interval to prevent excessive CPU usage
    if (minutes === 0 && seconds === 0) {
      seconds = 5; // Default to 5 seconds minimum if both are 0
    }
    
    // Calculate interval in milliseconds
    const interval = (minutes * 60 + seconds) * 1000;
    
    log.info(`Background checking will run with interval: ${minutes} minutes ${seconds} seconds (${interval}ms)`);
    
    // Store the current settings in a global variable for reference
    global.currentNotificationSettings = { minutes, seconds, interval };
    
    // Initial check
    await checkQueuedMessages();
    log.info('Initial check completed');
    
    // Background checking disabled as requested by user
    // checkInterval = setInterval(() => {
    //   try {
    //     checkQueuedMessages().catch(err => {
    //       log.error('Error in checkQueuedMessages interval:', err);
    //     });
    //   } catch (error) {
    //     log.error('Error starting checkQueuedMessages in interval:', error);
    //   }
    // }, interval);
    
    log.info('Background checking is disabled');
    // log.info(`Interval set up with ID: ${checkInterval}`);
    
    // Return the interval for confirmation
    return { minutes, seconds, interval };
  } catch (error) {
    log.error('Error starting background checking:', error);
    return null;
  }
}

// Handle app ready event
app.on('ready', async () => {
  // Initialize MongoDB
  await initMongoDB();
  
  createWindow();
  
  // Start background checking
  await startBackgroundChecking();
  
  // Register protocol handler for whatsapp://
  app.setAsDefaultProtocolClient('whatsapp');
});

// Prevent multiple instances of the app
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Handle activate event (macOS)
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle before-quit event
app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    // Close MongoDB connection before quitting
    await db.close();
    app.quit();
  }
  
  // Clear the background check interval
  if (backgroundCheckInterval) {
    clearInterval(backgroundCheckInterval);
  }
});

// IPC handlers for communication with renderer process
ipcMain.on('check-messages', () => {
  checkQueuedMessages();
});

ipcMain.on('save-settings', async (event, settings) => {
  try {
    // Save to MongoDB only
    await db.saveSettings(settings);
    log.info('Settings saved to MongoDB');
    
    // Return success
    event.returnValue = { success: true };
  } catch (error) {
    log.error('Error saving settings:', error);
    event.returnValue = { success: false, error: error.message };
  }
});

ipcMain.on('get-messages', async (event) => {
  try {
    // Get from MongoDB only
    const messages = await db.getMessages();
    log.info(`Retrieved ${messages.length} messages from MongoDB`);
    
    event.returnValue = messages;
  } catch (error) {
    log.error('Error getting messages from MongoDB:', error);
    // Return empty array if MongoDB fails
    event.returnValue = [];
  }
});

ipcMain.on('get-settings', async (event) => {
  try {
    // Get settings from MongoDB only
    const settings = await db.getSettings();
    log.info('Settings retrieved from MongoDB');
    
    event.returnValue = settings;
  } catch (error) {
    log.error('Error getting settings from MongoDB:', error);
    // Return empty object if MongoDB fails
    event.returnValue = {};
  }
});

ipcMain.on('get-sent-messages', async (event) => {
  try {
    // Get from MongoDB only
    const messages = await db.getSentMessages();
    log.info(`Retrieved ${messages.length} sent messages from MongoDB`);
    
    event.returnValue = messages;
  } catch (error) {
    log.error('Error getting sent messages from MongoDB:', error);
    // Return empty array if MongoDB fails
    event.returnValue = [];
  }
});

ipcMain.on('get-settings', async (event) => {
  try {
    // Get from MongoDB
    const settings = await db.getSettings();
    log.info('Retrieved settings from MongoDB');
    
    // Update local store for backward compatibility
    store.set('settings', settings);
    
    event.returnValue = settings;
  } catch (error) {
    log.error('Error getting settings from MongoDB:', error);
    // Fall back to local store if MongoDB fails
    const settings = store.get('settings', {});
    log.info('Fallback: Retrieved settings from local store');
    event.returnValue = settings;
  }
});

// Handle save settings (synchronous)
ipcMain.on('save-settings', async (event, settings) => {
  try {
    // Save to MongoDB
    await db.saveSettings(settings);
    log.info('Settings saved to MongoDB');
    
    // Also save to local store for backward compatibility
    store.set('settings', settings);
    
    // Update app data
    if (appData) {
      appData.settings = settings;
      saveAppData();
    }
    
    // Return success
    event.returnValue = { success: true };
  } catch (error) {
    log.error('Error saving settings:', error);
    event.returnValue = { success: false, error: error.message };
  }
});

// Handle opening WhatsApp links
// Handle open WhatsApp request (asynchronous)
ipcMain.on('open-whatsapp-async', (event, url) => {
  try {
    log.info(`Opening WhatsApp with URL (async): ${url}`);
    
    // Make sure we have a valid URL
    if (!url) {
      log.error('Invalid WhatsApp URL provided');
      event.sender.send('open-whatsapp-async-reply', { success: false, error: 'Invalid URL' });
      return;
    }
    
    // Open WhatsApp with the URL
    shell.openExternal(url)
      .then(() => {
        log.info('WhatsApp opened successfully');
        // Send success response with a short delay
        setTimeout(() => {
          event.sender.send('open-whatsapp-async-reply', { success: true });
        }, 1000); // Small delay to allow WhatsApp to open
      })
      .catch((error) => {
        log.error('Error opening WhatsApp:', error);
        event.sender.send('open-whatsapp-async-reply', { success: false, error: error.message });
      });
  } catch (error) {
    log.error('Error opening WhatsApp:', error);
    event.sender.send('open-whatsapp-async-reply', { success: false, error: error.message });
  }
});

ipcMain.on('open-whatsapp', async (event, url, shouldPaste = false) => {
  try {
    log.info(`Opening WhatsApp with URL: ${url}`);
    
    // Make sure we have a valid URL
    if (!url) {
      log.error('Missing WhatsApp URL');
      event.returnValue = { success: false, error: 'Missing WhatsApp URL' };
      return;
    }
    
    // Convert https://wa.me/ format to whatsapp:// format if needed
    let whatsappUrl = url;
    if (url.startsWith('https://wa.me/')) {
      // Extract the phone number
      const phoneNumber = url.substring('https://wa.me/'.length).split('?')[0];
      // Create the whatsapp:// URL
      whatsappUrl = `whatsapp://send?phone=${phoneNumber}`;
      
      // Add text parameter if present in the original URL
      if (url.includes('?text=')) {
        const textParam = url.split('?text=')[1];
        whatsappUrl += `&text=${textParam}`;
      }
      
      log.info(`Converted URL to: ${whatsappUrl}`);
    } else if (!url.startsWith('whatsapp://')) {
      log.error('Invalid WhatsApp URL format:', url);
      event.returnValue = { success: false, error: 'Invalid WhatsApp URL format' };
      return;
    }
    
    // Open WhatsApp with the contact's phone number
    log.info(`Opening WhatsApp with URL: ${whatsappUrl}`);
    const openResult = shell.openExternal(whatsappUrl);
    log.info('Open result:', openResult);
    
    // After opening WhatsApp, wait 3 seconds, then run paste.vbs, then wait 3 seconds, then run send.vbs
    if (shouldPaste) {
      setTimeout(() => {
        log.info('Running paste.vbs to simulate Ctrl+V...');
        let pasteScript;
        if (app.isPackaged) {
          // In production, use VBS from resources
          pasteScript = path.join(process.resourcesPath, 'scripts', 'paste.vbs');
        } else {
          // In development, use VBS from project directory
          pasteScript = path.join(__dirname, '../../scripts/paste.vbs');
        }
        exec(`cscript //nologo "${pasteScript}"`, (error, stdout, stderr) => {
          if (error) {
            log.error('Error executing paste.vbs:', error);
            mainWindow.webContents.send('paste-error', error.message);
            return;
          }
          log.info('Paste simulated via VBS. Waiting 3 seconds to send (Enter)...');
          setTimeout(() => {
            log.info('Running send.vbs to simulate Enter...');
            let sendScript;
            if (app.isPackaged) {
              // In production, use VBS from resources
              sendScript = path.join(process.resourcesPath, 'scripts', 'send.vbs');
            } else {
              // In development, use VBS from project directory
              sendScript = path.join(__dirname, '../../scripts/send.vbs');
            }
            exec(`cscript //nologo "${sendScript}"`, (error2, stdout2, stderr2) => {
              if (error2) {
                log.error('Error executing send.vbs:', error2);
                mainWindow.webContents.send('paste-error', error2.message);
                return;
              }
              log.info('Enter simulated via VBS. Message should be sent.');
              mainWindow.webContents.send('paste-success');
              mainWindow.webContents.send('continue-queue-processing');
              // Emit event to log primary key after Enter is sent
              mainWindow.webContents.send('message-sent-enter');
            });
          }, 3000);
        });
      }, 3000);
    }
    
    // Return success immediately
    event.returnValue = { success: true, url: whatsappUrl };
    
  } catch (error) {
    log.error('Error opening WhatsApp:', error);
    mainWindow.webContents.send('paste-error', error.message);
    event.returnValue = { success: false, error: error.message };
  }
});

// Handle paste message request (synchronous - kept for compatibility)
ipcMain.on('paste-message', (event) => {
  try {
    log.info('Paste message request received (sync)');
    
    // Use robot.js or similar to paste the message
    // For now, we'll just simulate success
    
    // Send success response
    event.returnValue = { success: true };
  } catch (error) {
    log.error('Error pasting message:', error);
    event.returnValue = { success: false, error: error.message };
  }
});

// Handle paste message request (asynchronous)
ipcMain.on('paste-message-async', (event) => {
  try {
    log.info('Paste message request received (async)');
    
    // Use robot.js or similar to paste the message
    // For now, we'll just simulate success with a short delay
    setTimeout(() => {
      // Send success response
      event.sender.send('paste-message-async-reply', { success: true });
    }, 500); // Small delay to simulate the paste operation
  } catch (error) {
    log.error('Error pasting message:', error);
    event.sender.send('paste-message-async-reply', { success: false, error: error.message });
  }
});

// Handle close paste button request (kept for compatibility)
ipcMain.on('close-paste-button', () => {
  // This is kept for compatibility but does nothing now
  log.info('close-paste-button event received, but paste button is no longer used');
});

// Handle show paste button request (kept for compatibility)
ipcMain.on('show-paste-button', (event) => {
  // This is kept for compatibility but does nothing now
  log.info('show-paste-button event received, but paste button is no longer used');
  event.returnValue = { success: true };
});

// Export all data to JSON file
ipcMain.on('export-all-data', async (event) => {
  try {
    // Get all data from store
    const allData = {
      settings: store.get('settings', {}),
      messageQueue: store.get('messageQueue', []),
      sentMessages: store.get('sentMessages', []),
      lastCheck: store.get('lastCheck', null),
      timestamp: new Date().toISOString()
    };
    
    // Show save dialog
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export All Data',
      defaultPath: path.join(app.getPath('documents'), 'whatsapp_automation_data.json'),
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });
    
    if (!result.canceled && result.filePath) {
      // Write data to file
      fs.writeFileSync(result.filePath, JSON.stringify(allData, null, 2));
      log.info(`All data exported to ${result.filePath}`);
      
      // Send success message to renderer
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('export-success', result.filePath);
      }
    }
    } catch (error) {
      log.error('Error exporting data:', error);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('export-error', error.message);
      }
    }
  });

// Handle WhatsApp number verification
ipcMain.on('verify-whatsapp-number', async (event, data) => {
  try {
    log.info(`Received request to verify WhatsApp number: ${data.phoneNumber} (index: ${data.index})`);
    
    // Use the verification handler to verify the number
    // const result = await verificationHandler.verifyWhatsAppNumber(data.phoneNumber, data.index, mainWindow); // Temporarily disabled
    
    // Simplified verification for now - just return success
    const result = { success: true, isValid: true };
    
    // The result will be sent to the renderer via the 'verification-result' event by the verification handler
    log.info(`WhatsApp verification completed for number: ${data.phoneNumber}`);
    
    // Return success status
    event.returnValue = { success: true };
  } catch (error) {
    log.error(`Error verifying WhatsApp number: ${error}`);
    
    // Send error result to renderer
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('verification-result', {
        index: data.index,
        phoneNumber: data.phoneNumber,
        isValid: false,
        message: `Error: ${error.message}`
      });
    }
    
    event.returnValue = { success: false, error: error.message };
  }
});

// Handle WhatsApp verification cancellation
ipcMain.on('cancel-verification', (event) => {
  try {
    log.info('Received request to cancel WhatsApp verification');
    
    // Use the verification handler to cancel the verification
    // verificationHandler.cancelVerification(); // Temporarily disabled
    
    log.info('Verification cancellation completed (simplified)');
    
    // Return success status
    event.returnValue = { success: true };
  } catch (error) {
    log.error(`Error cancelling WhatsApp verification: ${error}`);
    event.returnValue = { success: false, error: error.message };
  }
});

// Import all data from JSON file
ipcMain.on('import-all-data', async (event) => {
  try {
    // Show open dialog
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import All Data',
      defaultPath: app.getPath('documents'),
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
      properties: ['openFile']
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      // Read data from file
      const fileData = fs.readFileSync(result.filePaths[0], 'utf8');
      const importedData = JSON.parse(fileData);
      
      // Validate imported data
      if (!importedData.settings || !importedData.messageQueue) {
        throw new Error('Invalid data format');
      }
      
      // Store imported data
      store.set('settings', importedData.settings);
      store.set('messageQueue', importedData.messageQueue);
      store.set('sentMessages', importedData.sentMessages || []);
      if (importedData.lastCheck) {
        store.set('lastCheck', importedData.lastCheck);
      }
      
      log.info(`All data imported from ${result.filePaths[0]}`);
      
      // Send success message and data to renderer
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('import-success', importedData);
      }
    }
  } catch (error) {
    log.error('Error importing data:', error);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('import-error', error.message);
    }
  }
});

ipcMain.on('mark-message-sent', (event, message) => {
  try {
    // Log that we received the mark-message-sent event but won't move to history yet
    // This is to prevent premature movement to history before paste confirmation
    log.info(`Received mark-message-sent for message ${message.recordIndex} - waiting for paste confirmation`);
    
    // Don't move to sent yet - just acknowledge receipt
    event.returnValue = { success: true, info: 'Message marked for sending - will be moved to history after paste confirmation' };
  } catch (error) {
    log.error('Error handling mark-message-sent:', error);
    event.returnValue = { success: false, error: error.message };
  }
});

// Import Excel file handler
// Handle send message request (synchronous - kept for compatibility)
ipcMain.on('send-message', (event) => {
  try {
    log.info('Send message request received (sync)');
    
    // Use robot.js or similar to simulate pressing Enter
    // For now, we'll just simulate success
    
    // Send success response
    event.returnValue = { success: true };
  } catch (error) {
    log.error('Error sending message:', error);
    event.returnValue = { success: false, error: error.message };
  }
});

// Handle send message request (asynchronous)
ipcMain.on('send-message-async', (event) => {
  try {
    log.info('Send message request received (async)');
    
    // Use robot.js or similar to simulate pressing Enter
    // For now, we'll just simulate success with a short delay
    setTimeout(() => {
      // Send success response
      event.sender.send('send-message-async-reply', { success: true });
    }, 500); // Small delay to simulate the send operation
  } catch (error) {
    log.error('Error sending message:', error);
    event.sender.send('send-message-async-reply', { success: false, error: error.message });
  }
});

// Handle mark message as sent (synchronous version for manual operations)
ipcMain.handle('mark-message-sent-sync', async (event, data) => {
  try {
    const { recordIndex, messageData } = data;
    log.info(`Marking message ${recordIndex} as sent (sync)`);
    
    if (messageData) {
      log.info('Using provided message data for marking as sent');
      
      if (!appData) initAppData();
      
      // First check if the message is already in history
      const historyIndex = appData.sentMessages.findIndex(msg => msg.recordIndex === recordIndex);
      
      if (historyIndex !== -1) {
        log.info(`Message ${recordIndex} already exists in history, continuing to next message`);
        
        // Force the renderer to continue queue processing
        log.info('Sending continue-queue-processing event to renderer');
        mainWindow.webContents.send('continue-queue-processing');
        
        // Add a small delay and send the event again to ensure it's received
        setTimeout(() => {
          log.info('Sending second continue-queue-processing event to ensure receipt');
          mainWindow.webContents.send('continue-queue-processing');
        }, 500);
        
        return { success: true, info: 'Message already in history, continuing to next message' };
      }
      
      // Then check if the message exists in the queue
      const index = appData.messageQueue.findIndex(msg => msg.recordIndex === recordIndex);
      
      if (index !== -1) {
        // Remove from queue
        appData.messageQueue.splice(index, 1);
        
        // Just move to history without marking as sent
        const message = {
          ...messageData,
          sentTime: new Date().toISOString(),
          status: 'Attempted'
        };
        
        appData.sentMessages.push(message);
        
        // Save to file
        fs.writeFileSync(appDataFile, JSON.stringify(appData, null, 2));
        
        // Update store
        store.set('messageQueue', appData.messageQueue);
        store.set('sentMessages', appData.sentMessages);
        
        log.info(`Message ${recordIndex} moved to sent messages using provided data`);
        
        // Notify renderer that messages have been updated
        mainWindow.webContents.send('refresh-messages');
        return { success: true };
      } else {
        // Try to find the message in the queue snapshot from localStorage
        // We'll get this from the renderer process
        log.info(`Message ${recordIndex} not found in main queue, checking renderer queue snapshot`);
        
        // Message not found in queue, but we have the data, so add it to history anyway
        const message = {
          ...messageData,
          sentTime: new Date().toISOString(),
          status: 'Attempted'
        };
        
        appData.sentMessages.push(message);
        
        // Save to file
        fs.writeFileSync(appDataFile, JSON.stringify(appData, null, 2));
        
        // Update store
        store.set('sentMessages', appData.sentMessages);
        
        log.info(`Message ${recordIndex} not found in queue, but added to sent messages using provided data`);
        
        // Notify renderer that messages have been updated
        mainWindow.webContents.send('refresh-messages');
        return { success: true };
      }
    } else {
      // Fall back to the old method if no message data is provided
      const result = moveMessageToSent(recordIndex);
      
      if (result) {
        // Notify renderer that messages have been updated
        mainWindow.webContents.send('refresh-messages');
        return { success: true };
      } else {
        log.warn(`Message ${recordIndex} not found in queue, attempting to recover from renderer process`);
        // We'll return success anyway to prevent errors in the renderer
        return { success: true, warning: `Message ${recordIndex} not found in queue, but marked as sent anyway` };
      }
    }
  } catch (error) {
    log.error('Error marking message as sent:', error);
    return { success: false, error: error.message };
  }
});

// Handle screenshot timestamp verification for queue messages
ipcMain.handle('verify-screenshot-timestamp', async (event) => {
  try {
    log.info('Starting screenshot timestamp verification for message queue');
    
    // Get Python script path - handle both development and production
    let pythonScript;
    if (app.isPackaged) {
      pythonScript = path.join(process.resourcesPath, 'scripts', 'python', 'verify.py');
    } else {
      pythonScript = path.join(__dirname, '../../scripts/python/verify.py');
    }
    const args = ['--screenshot-timestamp'];
    
    return new Promise(async (resolve, reject) => {
      try {
        // Use portable Python from the application directory
        let pythonExe;
        if (app.isPackaged) {
          // In production, use portable Python from resources
          pythonExe = path.join(process.resourcesPath, 'python-portable', 'python.exe');
        } else {
          // In development, use portable Python from project directory
          pythonExe = path.join(__dirname, '../../python-portable/python.exe');
        }
        
        const pythonProcess = spawn(pythonExe, [pythonScript, ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: __dirname
      });
      
      let stdout = '';
      let stderr = '';
      
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            // Parse JSON from stdout, handling any extra output
            const jsonStart = stdout.indexOf('{');
            const jsonEnd = stdout.lastIndexOf('}') + 1;
            
            if (jsonStart !== -1 && jsonEnd > jsonStart) {
              const jsonString = stdout.substring(jsonStart, jsonEnd);
              const result = JSON.parse(jsonString);
              
              log.info('Message verification result:', {
                success: result.success,
                time_matches: result.time_matches,
                first_chat_timestamp: result.first_chat_timestamp,
                current_time: result.current_time,
                time_difference: result.time_difference_minutes
              });
              resolve(result);
            } else {
              log.error('No valid JSON found in Python output:', stdout);
              reject(new Error('No valid JSON found in verification output'));
            }
          } catch (error) {
            log.error('Error parsing verification result:', error);
            reject(new Error(`JSON parse error: ${error.message}`));
          }
        } else {
          log.error('Python verification failed with code', code, ':', stderr);
          reject(new Error(`Verification failed: ${stderr}`));
        }
      });
      
      pythonProcess.on('error', (error) => {
        log.error('Error spawning Python verification process:', error);
        reject(error);
      });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        pythonProcess.kill('SIGTERM');
        reject(new Error('Verification timeout after 30 seconds'));
      }, 30000);
      
      } catch (error) {
        log.error('Error setting up Python verification:', error);
        reject(error);
      }
    });
  } catch (error) {
    log.error('Error in verify-screenshot-timestamp:', error);
    throw error;
  }
});

// Handle mark message as sent (asynchronous version for queue processing)
ipcMain.on('mark-message-sent', (event, data) => {
  try {
    const { recordIndex } = data;
    log.info(`Marking message ${recordIndex} as sent`);
    
    // Move message from queue to sent messages
    moveMessageToSent(recordIndex);
    
    // Notify renderer that messages have been updated
    mainWindow.webContents.send('refresh-messages');
  } catch (error) {
    log.error('Error marking message as sent:', error);
  }
});

// Handle real-time message status updates
ipcMain.on('update-message-status', (event, data) => {
  try {
    const { recordIndex, status, timestamp } = data;
    log.info(`Updating message ${recordIndex} status to ${status}`);
    
    if (!appData) initAppData();
    
    // Find the message in the queue
    const index = appData.messageQueue.findIndex(msg => msg.recordIndex === recordIndex);
    
    if (index !== -1) {
      // Update the status
      appData.messageQueue[index].status = status;
      appData.messageQueue[index].lastUpdated = timestamp;
      
      // Save to file immediately for real-time persistence
      fs.writeFileSync(appDataFile, JSON.stringify(appData, null, 2));
      
      // Update store
      store.set('messageQueue', appData.messageQueue);
      
      log.info(`Message ${recordIndex} status updated to ${status}`);
    } else {
      log.warn(`Message ${recordIndex} not found in queue for status update`);
    }
  } catch (error) {
    log.error(`Error updating message status:`, error);
  }
});

// Handle mark message as attempted (but not sent)
ipcMain.on('mark-message-attempted', (event, data) => {
  try {
    const { recordIndex } = data;
    log.info(`Marking message ${recordIndex} as attempted`);
    
    // Find the message in the queue
    if (!appData) initAppData();
    
    const index = appData.messageQueue.findIndex(msg => msg.recordIndex === recordIndex);
    
    if (index !== -1) {
      // Mark as attempted but not sent
      const message = { 
        ...appData.messageQueue[index], 
        isAttempted: true, 
        attemptTime: new Date().toISOString(), 
        status: 'Attempted' 
      };
      
      // Remove from queue
      appData.messageQueue.splice(index, 1);
      
      // Add to sent messages with special status
      appData.sentMessages.push(message);
      
      // Save to file
      fs.writeFileSync(appDataFile, JSON.stringify(appData, null, 2));
      
      // Update store
      store.set('messageQueue', appData.messageQueue);
      store.set('sentMessages', appData.sentMessages);
      
      log.info(`Message ${recordIndex} marked as attempted`);
    } else {
      log.warn(`Message ${recordIndex} not found in queue`);
    }
    
    // Notify renderer that messages have been updated
    mainWindow.webContents.send('refresh-messages');
  } catch (error) {
    log.error('Error marking message as attempted:', error);
  }
});

// Handle show notification
ipcMain.on('show-notification', (event, data) => {
  try {
    const { title, message, type } = data;
    log.info(`Showing notification: ${title} - ${message}`);
    
    // Show system notification
    notifier.notify({
      title: title || 'WhatsApp Automation',
      message: message || '',
      icon: path.join(__dirname, 'logo.png'),
      sound: true,
      wait: false
    });
    
    // Also log to console based on type
    switch(type) {
      case 'error':
        log.error(message);
        break;
      case 'warning':
        log.warn(message);
        break;
      case 'success':
        log.info(`SUCCESS: ${message}`);
        break;
      default:
        log.info(message);
    }
  } catch (error) {
    log.error('Error showing notification:', error);
  }
});

// Enhanced import handler for both Excel and CSV files
ipcMain.on('import-data-file', async (event) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Data Files', extensions: ['xlsx', 'xls', 'csv'] },
        { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
        { name: 'CSV Files', extensions: ['csv'] }
      ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      const fileExtension = path.extname(filePath).toLowerCase();
      log.info(`Importing data file: ${filePath} (${fileExtension})`);
      
      let jsonData = [];
      let headers = [];
      
      if (fileExtension === '.csv') {
        // Handle CSV files
        const csvText = fs.readFileSync(filePath, 'utf8');
        const lines = csvText.split('\n');
        
        if (lines.length > 0) {
          // Parse headers
          headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          
          // Parse data rows
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
              const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
              const row = {};
              headers.forEach((header, index) => {
                row[header] = values[index] || '';
              });
              jsonData.push(row);
            }
          }
        }
      } else {
        // Handle Excel files
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        jsonData = xlsx.utils.sheet_to_json(worksheet);
        headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
      }
      
      // Send data to renderer for column mapping
      mainWindow.webContents.send('excel-imported', {
        headers: headers,
        rows: jsonData
      });
      
      log.info(`Sent ${fileExtension} data with ${headers.length} columns and ${jsonData.length} rows for mapping`);
      
      // Show success toast
      mainWindow.webContents.send('show-toast', {
        message: `Successfully imported ${jsonData.length} records from ${fileExtension} file`,
        type: 'success'
      });
    }
  } catch (error) {
    log.error('Error importing data file:', error);
    mainWindow.webContents.send('show-toast', {
      message: 'Error importing file: ' + error.message,
      type: 'error'
    });
  }
});

ipcMain.on('import-excel', async (event) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Excel Files', extensions: ['xlsx', 'xls'] }
      ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      log.info(`Importing Excel file: ${filePath}`);
      
      // Read Excel file
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = xlsx.utils.sheet_to_json(worksheet);
      
      // Get headers from the first row
      const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
      
      // Send data to renderer for column mapping
      mainWindow.webContents.send('excel-imported', {
        headers: headers,
        rows: jsonData
      });
      
      log.info(`Sent Excel data with ${headers.length} columns and ${jsonData.length} rows for mapping`);
      
      // Show success toast
      mainWindow.webContents.send('show-toast', {
        message: `Excel file imported successfully with ${jsonData.length} rows`,
        type: 'success',
        duration: 3000
      });
    }
  } catch (error) {
    log.error('Error importing Excel file:', error);
    mainWindow.webContents.send('excel-imported', null);
    
    // Show error toast
    mainWindow.webContents.send('show-toast', {
      message: `Error importing Excel file: ${error.message}`,
      type: 'error',
      duration: 5000
    });
  }
});

// Import CSV file handler
ipcMain.on('import-csv', async (event) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'CSV Files', extensions: ['csv'] }
      ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      log.info(`Importing CSV file: ${filePath}`);
      
      const jsonData = [];
      
      // Read CSV file
      fs.createReadStream(filePath)
        .on('error', (error) => {
          log.error('Error reading CSV file:', error);
          mainWindow.webContents.send('csv-imported', null);
          
          // Show error toast
          mainWindow.webContents.send('show-toast', {
            message: `Error reading CSV file: ${error.message}`,
            type: 'error',
            duration: 5000
          });
        })
        .pipe(csv())
        .on('data', (data) => jsonData.push(data))
        .on('end', () => {
          // Get headers from the first row
          const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
          
          // Send data to renderer for column mapping
          mainWindow.webContents.send('csv-imported', {
            headers: headers,
            rows: jsonData
          });
          
          log.info(`Sent CSV data with ${headers.length} columns and ${jsonData.length} rows for mapping`);
          
          // Show success toast
          mainWindow.webContents.send('show-toast', {
            message: `CSV file imported successfully with ${jsonData.length} rows`,
            type: 'success',
            duration: 3000
          });
        });
    }
  } catch (error) {
    log.error('Error importing CSV file:', error);
    mainWindow.webContents.send('csv-imported', null);
    
    // Show error toast
    mainWindow.webContents.send('show-toast', {
      message: `Error importing CSV file: ${error.message}`,
      type: 'error',
      duration: 5000
    });
  }
});



// Export history handler
ipcMain.on('export-history', async (event) => {
  try {
    const sentMessages = store.get('sentMessages', []);
    
    if (sentMessages.length === 0) {
      // Send toast notification instead of dialog
      mainWindow.webContents.send('show-toast', {
        message: 'No sent messages to export',
        type: 'warning',
        duration: 3000
      });
      return;
    }
    
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export History',
      defaultPath: path.join(app.getPath('documents'), 'whatsapp_history.xlsx'),
      filters: [
        { name: 'Excel Files', extensions: ['xlsx'] }
      ]
    });
    
    if (!result.canceled && result.filePath) {
      // Convert sent messages to worksheet
      const worksheet = xlsx.utils.json_to_sheet(sentMessages);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'History');
      
      // Write to file
      xlsx.writeFile(workbook, result.filePath);
      
      mainWindow.webContents.send('history-exported', result.filePath);
      log.info(`Exported ${sentMessages.length} messages to ${result.filePath}`);
    }
  } catch (error) {
    log.error('Error exporting history:', error);
  }
});

// This function is no longer needed as column mapping is now handled in the renderer process
// The renderer will process the data after the user maps columns

// WhatsApp Verification Handler
const verificationHandler = {
  isVerifying: false,
  verificationQueue: store.get('verificationQueue', []),
  currentVerification: null,
  
  // Add number to verification queue
  addToQueue(phoneNumber) {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.length >= 7 && cleanNumber.length <= 15) {
      const verificationItem = {
        number: cleanNumber,
        status: 'pending',
        timestamp: new Date().toISOString(),
        result: null
      };
      
      // Check if number already exists
      const existingIndex = this.verificationQueue.findIndex(item => item.number === cleanNumber);
      if (existingIndex === -1) {
        this.verificationQueue.push(verificationItem);
        // Save to persistent storage
        store.set('verificationQueue', this.verificationQueue);
        log.info(`Added ${cleanNumber} to verification queue`);
        return true;
      } else {
        log.info(`Number ${cleanNumber} already in queue`);
        return false;
      }
    }
    return false;
  },
  
  // Get verification queue
  getQueue() {
    return this.verificationQueue;
  },
  
  // Clear verification queue
  clearQueue() {
    this.verificationQueue = [];
    // Save to persistent storage
    store.set('verificationQueue', this.verificationQueue);
    log.info('Verification queue cleared');
  },
  
  // Verify a single number using Python script
  async verifyNumber(phoneNumber) {
    return new Promise(async (resolve, reject) => {
      try {
        // Get Python script path - handle both development and production
        let pythonScript;
        if (app.isPackaged) {
          pythonScript = path.join(process.resourcesPath, 'scripts', 'python', 'verify.py');
        } else {
          pythonScript = path.join(__dirname, '../../scripts/python/verify.py');
        }
        const args = ['--number', phoneNumber];
        
        log.info(`Starting verification for ${phoneNumber}`);
        
        // Use portable Python from the application directory
        let pythonExe;
        if (app.isPackaged) {
          // In production, use portable Python from resources
          pythonExe = path.join(process.resourcesPath, 'python-portable', 'python.exe');
        } else {
          // In development, use portable Python from project directory
          pythonExe = path.join(__dirname, '../../python-portable/python.exe');
        }
        
        const pythonProcess = spawn(pythonExe, [pythonScript, ...args], {
          stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let stdout = '';
        let stderr = '';
        
        pythonProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
          if (code === 0) {
            try {
              const result = JSON.parse(stdout.trim());
              log.info(`Verification result for ${phoneNumber}:`, result);
              resolve(result);
            } catch (error) {
              log.error(`Error parsing verification result for ${phoneNumber}:`, error);
              reject(new Error('Invalid verification result format'));
            }
          } else {
            log.error(`Python verification failed for ${phoneNumber} with code ${code}:`, stderr);
            reject(new Error(`Verification failed: ${stderr}`));
          }
        });
        
        pythonProcess.on('error', (error) => {
          log.error(`Error spawning Python process for ${phoneNumber}:`, error);
          reject(error);
        });
        
      } catch (error) {
        log.error(`Error in verifyNumber for ${phoneNumber}:`, error);
        reject(error);
      }
    });
  },
  
  // Process verification queue
  async processQueue() {
    if (this.isVerifying) {
      log.info('Verification already in progress');
      return;
    }
    
    this.isVerifying = true;
    log.info(`Starting verification of ${this.verificationQueue.length} numbers`);
    
    for (let i = 0; i < this.verificationQueue.length; i++) {
      const item = this.verificationQueue[i];
      
      // Skip numbers that are already marked as "not-verified" (Not in WhatsApp)
      if (item.status === 'not-verified') {
        log.info(`Skipping ${item.number} - already marked as Not in WhatsApp`);
        continue;
      }
      
      if (item.status === 'pending') {
        try {
          // Update status to verifying
          item.status = 'verifying';
          item.timestamp = new Date().toISOString();
          
          // Save to persistent storage
          store.set('verificationQueue', this.verificationQueue);
          
          // Notify renderer of status update
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('verification-status-update', {
              index: i,
              item: item
            });
          }
          
          // Wait a bit before starting verification
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Perform verification
          const result = await this.verifyNumber(item.number);
          
          // Update item with result
          item.status = result.status === 'Verified' ? 'verified' : 'not-verified';
          item.result = result;
          item.timestamp = new Date().toISOString();
          
          // Save to persistent storage
          store.set('verificationQueue', this.verificationQueue);
          
          log.info(`Verification completed for ${item.number}: ${item.status}`);
          
          // Notify renderer of completion
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('verification-completed', {
              index: i,
              item: item
            });
          }
          
          // Wait between verifications to avoid overwhelming WhatsApp
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          log.error(`Error verifying ${item.number}:`, error);
          
          // Mark as failed
          item.status = 'error';
          item.result = { error: error.message };
          item.timestamp = new Date().toISOString();
          
          // Save to persistent storage
          store.set('verificationQueue', this.verificationQueue);
          
          // Notify renderer of error
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('verification-error', {
              index: i,
              item: item
            });
          }
        }
      }
    }
    
    this.isVerifying = false;
    log.info('Verification queue processing completed');
    
    // Notify renderer that all verifications are done
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('verification-queue-completed');
    }
  },
  
  // Cleanup verification resources
  async cleanupVerification() {
    try {
      // Close any open WhatsApp windows
      exec('taskkill /IM WhatsApp.exe /F', (error) => {
        if (error) {
          log.info('No WhatsApp processes to kill or already closed');
        } else {
          log.info('WhatsApp processes killed during cleanup');
        }
      });
      
      // Remove temporary files
      const tempFiles = ['wa_temp.png', 'wa_crop_debug.png', 'wa_ocr_debug.txt'];
      tempFiles.forEach(file => {
        const filePath = path.join(__dirname, 'python', file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          log.info(`Removed temporary file: ${file}`);
        }
      });
      
    } catch (error) {
      log.error('Error during verification cleanup:', error);
    }
  }
};

// IPC handlers for verification
ipcMain.on('add-verification-number', (event, phoneNumber) => {
  try {
    const success = verificationHandler.addToQueue(phoneNumber);
    event.returnValue = { success };
  } catch (error) {
    log.error('Error adding verification number:', error);
    event.returnValue = { success: false, error: error.message };
  }
});

ipcMain.on('add-bulk-verification-numbers', (event, phoneNumbers) => {
  try {
    const results = [];
    phoneNumbers.forEach(number => {
      const success = verificationHandler.addToQueue(number);
      results.push({ number, success });
    });
    event.returnValue = { results };
  } catch (error) {
    log.error('Error adding bulk verification numbers:', error);
    event.returnValue = { success: false, error: error.message };
  }
});

ipcMain.on('get-verification-queue', (event) => {
  try {
    const queue = verificationHandler.getQueue();
    log.info(`Sending verification queue to renderer: ${queue.length} items`, queue);
    event.returnValue = queue;
  } catch (error) {
    log.error('Error getting verification queue:', error);
    event.returnValue = [];
  }
});

ipcMain.on('save-verification-queue', (event, queue) => {
  try {
    verificationHandler.verificationQueue = queue;
    // Save to persistent storage
    store.set('verificationQueue', queue);
    event.returnValue = { success: true };
  } catch (error) {
    log.error('Error saving verification queue:', error);
    event.returnValue = { success: false, error: error.message };
  }
});

ipcMain.on('clear-verification-queue', (event) => {
  try {
    verificationHandler.clearQueue();
    event.returnValue = { success: true };
  } catch (error) {
    log.error('Error clearing verification queue:', error);
    event.returnValue = { success: false, error: error.message };
  }
});

ipcMain.on('start-verification', (event) => {
  try {
    verificationHandler.processQueue();
    event.returnValue = { success: true };
  } catch (error) {
    log.error('Error starting verification:', error);
    event.returnValue = { success: false, error: error.message };
  }
});

ipcMain.on('export-verification-results', async (event) => {
  try {
    const queue = verificationHandler.getQueue();
    const verifiedNumbers = queue.filter(item => item.status === 'verified');
    
    if (verifiedNumbers.length === 0) {
      // Send toast notification instead of dialog
      mainWindow.webContents.send('show-toast', {
        message: 'No verified numbers to export',
        type: 'warning',
        duration: 3000
      });
      return;
    }
    
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Verification Results',
      defaultPath: path.join(app.getPath('documents'), 'verified_numbers.xlsx'),
      filters: [
        { name: 'Excel Files', extensions: ['xlsx'] }
      ]
    });
    
    if (!result.canceled && result.filePath) {
      // Prepare data for export
      const exportData = verifiedNumbers.map(item => ({
        number: item.number,
        status: item.status,
        timestamp: item.timestamp,
        ocr_text: item.result ? item.result.ocr_text : ''
      }));
      
      // Convert to worksheet
      const worksheet = xlsx.utils.json_to_sheet(exportData);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Verified Numbers');
      
      // Write to file
      xlsx.writeFile(workbook, result.filePath);
      
      mainWindow.webContents.send('verification-exported', result.filePath);
      log.info(`Exported ${verifiedNumbers.length} verified numbers to ${result.filePath}`);
    }
  } catch (error) {
    log.error('Error exporting verification results:', error);
  }
});

// Clean up WhatsApp verification resources when app is about to quit
app.on('will-quit', async () => {
  log.info('App is about to quit, cleaning up verification resources...');
  await verificationHandler.cleanupVerification();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log.error('Uncaught exception:', error);
});

// MongoDB Real-time Update Handlers

// Handle save sent message to MongoDB
ipcMain.on('save-sent-message', async (event, message) => {
  try {
    log.info(`Saving sent message to MongoDB: ${message.recordIndex}`);
    
    // Save to MongoDB
    const result = await db.saveSentMessage(message);
    
    // Also save to local store for backward compatibility
    const sentMessages = store.get('sentMessages', []);
    sentMessages.push(message);
    store.set('sentMessages', sentMessages);
    
    event.returnValue = { success: true, result: result };
    log.info(`Sent message ${message.recordIndex} saved to MongoDB successfully`);
  } catch (error) {
    log.error('Error saving sent message to MongoDB:', error);
    event.returnValue = { success: false, error: error.message };
  }
});

// Handle save sent messages array to MongoDB
ipcMain.on('save-sent-messages', async (event, sentMessages) => {
  try {
    log.info(`Saving ${sentMessages.length} sent messages to MongoDB`);
    
    // Save to MongoDB
    await db.saveSentMessages(sentMessages);
    
    // Also save to local store for backward compatibility
    store.set('sentMessages', sentMessages);
    
    event.returnValue = { success: true };
    log.info('Sent messages saved to MongoDB successfully');
  } catch (error) {
    log.error('Error saving sent messages to MongoDB:', error);
    event.returnValue = { success: false, error: error.message };
  }
});

// Handle save messages to MongoDB
ipcMain.on('save-messages', async (event, messages) => {
  try {
    log.info(`Saving ${messages.length} messages to MongoDB`);
    
    // Save to MongoDB
    await db.saveMessages(messages);
    
    // Also save to local store for backward compatibility
    store.set('messageQueue', messages);
    
    event.returnValue = { success: true };
    log.info('Messages saved to MongoDB successfully');
  } catch (error) {
    log.error('Error saving messages to MongoDB:', error);
    event.returnValue = { success: false, error: error.message };
  }
});

// Handle update message status in MongoDB
ipcMain.on('update-message-status', async (event, data) => {
  try {
    const { recordIndex, status, timestamp } = data;
    log.info(`Updating message ${recordIndex} status to ${status} in MongoDB`);
    
    // Update in MongoDB
    await db.updateMessageStatus(recordIndex, status, timestamp);
    
    // Also update local store for backward compatibility
    const messages = store.get('messageQueue', []);
    const index = messages.findIndex(msg => msg.recordIndex === recordIndex);
    if (index !== -1) {
      messages[index].status = status;
      messages[index].lastUpdated = timestamp;
      store.set('messageQueue', messages);
    }
    
    event.returnValue = { success: true };
    log.info(`Message ${recordIndex} status updated in MongoDB successfully`);
  } catch (error) {
    log.error('Error updating message status in MongoDB:', error);
    event.returnValue = { success: false, error: error.message };
  }
});

// Handle kill WhatsApp process
ipcMain.on('kill-whatsapp', (event) => {
  try {
    const { execSync } = require('child_process');
    
    log.info('Attempting to kill WhatsApp process...');
    
    // Kill WhatsApp process on Windows synchronously
    try {
      execSync('taskkill /F /IM WhatsApp.exe', { timeout: 5000 });
      log.info('WhatsApp process killed successfully');
      event.returnValue = { success: true, message: 'WhatsApp process killed' };
    } catch (killError) {
      // If taskkill fails, it might mean WhatsApp wasn't running
      log.warn('WhatsApp process may not have been running:', killError.message);
      event.returnValue = { success: true, message: 'WhatsApp process not found or already closed' };
    }
    
  } catch (error) {
    log.error('Error in kill-whatsapp handler:', error);
    event.returnValue = { success: false, error: error.message };
  }
});

// Handle mark message as attempted in MongoDB
ipcMain.on('mark-message-attempted', async (event, data) => {
  try {
    const { recordIndex } = data;
    log.info(`Marking message ${recordIndex} as attempted in MongoDB`);
    
    // Get the message from queue
    const messages = await db.getMessages();
    const message = messages.find(msg => msg.recordIndex === recordIndex);
    
    if (message) {
      // Mark as attempted
      message.isAttempted = true;
      message.attemptTime = new Date().toISOString();
      message.status = 'Attempted';
      
      // Remove from queue and add to sent messages
      const updatedMessages = messages.filter(msg => msg.recordIndex !== recordIndex);
      await db.saveMessages(updatedMessages);
      await db.saveSentMessage(message);
      
      // Also update local store for backward compatibility
      store.set('messageQueue', updatedMessages);
      const sentMessages = store.get('sentMessages', []);
      sentMessages.push(message);
      store.set('sentMessages', sentMessages);
      
      event.returnValue = { success: true };
      log.info(`Message ${recordIndex} marked as attempted in MongoDB successfully`);
    } else {
      event.returnValue = { success: false, error: 'Message not found' };
    }
  } catch (error) {
    log.error('Error marking message as attempted in MongoDB:', error);
    event.returnValue = { success: false, error: error.message };
  }
});

ipcMain.on('log-primary-key', (event, pkValue) => {
  log.info(`Primary Key (after Enter sent): ${pkValue}`);
});
