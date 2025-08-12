// Preload script for WhatsApp Automation Electron app
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    send: (channel, data) => {
      // whitelist channels
      let validChannels = [
        'check-messages', 
        'save-messages', 
        'save-sent-messages', 
        'save-settings',
        'import-excel',
        'import-csv',
        'export-history',
        'open-whatsapp',
        'mark-message-sent',
        'save-verification-queue'
      ];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    receive: (channel, func) => {
      let validChannels = [
        'refresh-messages',
        'excel-imported',
        'csv-imported',
        'history-exported'
      ];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender` 
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    invoke: (channel, data) => {
      let validChannels = [
        'get-messages',
        'get-sent-messages',
        'get-settings'
      ];
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, data);
      }
    }
  }
);
