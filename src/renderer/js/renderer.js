// Renderer process for WhatsApp Automation Electron app
const { ipcRenderer, remote } = require('electron');
const { execFile } = require('child_process');

// Global variables for DOM elements
let tabButtons, tabPanes, messageList, messageCount, historyList, historyCount;
let refreshBtn, settingsBtn, exportDataBtn, importDataBtn, clearQueueBtn, queueMessageBtn;
let importExcelBtn, importCsvBtn, saveTemplateBtn, clearHistoryBtn, exportHistoryBtn;
let messageTemplate, notificationMinutes, notificationSeconds;
let saveSettingsBtn, cancelSettingsBtn, sendMessageBtn, snoozeMessageBtn, closeMessageBtn;
let snoozeOptions, closeButtons;
let settingsModal, messageModal, messageDetails, messagePreview;

// Verification elements
let verifyAllBtn, clearVerifiedBtn, exportVerifiedBtn, phoneNumberInput, addNumberBtn;
let bulkNumbersInput, addBulkNumbersBtn, verificationList, totalNumbers;
let verifiedNumbers, notVerifiedNumbers, pendingNumbers;

// Function to initialize DOM elements
function initializeDOMElements() {
    tabButtons = document.querySelectorAll('.tab-btn');
    tabPanes = document.querySelectorAll('.tab-pane');
    messageList = document.getElementById('messageList');
    messageCount = document.getElementById('messageCount');
    historyList = document.getElementById('historyList');
    historyCount = document.getElementById('historyCount');
    refreshBtn = document.getElementById('refreshBtn');
    settingsBtn = document.getElementById('settingsBtn');
    exportDataBtn = document.getElementById('exportDataBtn');
    importDataBtn = document.getElementById('importDataBtn');
    clearQueueBtn = document.getElementById('clearQueueBtn');
    queueMessageBtn = document.getElementById('queueMessageBtn');
    importExcelBtn = document.getElementById('importExcelBtn');
    importCsvBtn = document.getElementById('importCsvBtn');
    saveTemplateBtn = document.getElementById('saveTemplateBtn');
    clearHistoryBtn = document.getElementById('clearHistoryBtn');
    exportHistoryBtn = document.getElementById('exportHistoryBtn');
    messageTemplate = document.getElementById('messageTemplate');
    notificationMinutes = document.getElementById('notificationMinutes');
    notificationSeconds = document.getElementById('notificationSeconds');
    saveSettingsBtn = document.getElementById('saveSettingsBtn');
    cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
    sendMessageBtn = document.getElementById('sendMessageBtn');
    snoozeMessageBtn = document.getElementById('snoozeMessageBtn');
    closeMessageBtn = document.getElementById('closeMessageBtn');
    snoozeOptions = document.querySelectorAll('.snooze-option');
    closeButtons = document.querySelectorAll('.close-btn');

    // Modal elements
    settingsModal = document.getElementById('settingsModal');
    messageModal = document.getElementById('messageModal');
    messageDetails = document.getElementById('messageDetails');
    messagePreview = document.getElementById('messagePreview');

    // Verification elements
    verifyAllBtn = document.getElementById('verifyAllBtn');
    clearVerifiedBtn = document.getElementById('clearVerifiedBtn');
    exportVerifiedBtn = document.getElementById('exportVerifiedBtn');
    phoneNumberInput = document.getElementById('phoneNumberInput');
    addNumberBtn = document.getElementById('addNumberBtn');
    bulkNumbersInput = document.getElementById('bulkNumbersInput');
    addBulkNumbersBtn = document.getElementById('addBulkNumbersBtn');
    verificationList = document.getElementById('verificationList');
    totalNumbers = document.getElementById('totalNumbers');
    verifiedNumbers = document.getElementById('verifiedNumbers');
    notVerifiedNumbers = document.getElementById('notVerifiedNumbers');
    pendingNumbers = document.getElementById('pendingNumbers');

    // Debug DOM elements
    console.log('DOM elements found:', {
        messageList: !!messageList,
        messageCount: !!messageCount,
        historyList: !!historyList,
        historyCount: !!historyCount,
        refreshBtn: !!refreshBtn,
        settingsBtn: !!settingsBtn,
        exportDataBtn: !!exportDataBtn,
        importDataBtn: !!importDataBtn,
        clearQueueBtn: !!clearQueueBtn,
        queueMessageBtn: !!queueMessageBtn,
        clearHistoryBtn: !!clearHistoryBtn,
        verifyAllBtn: !!verifyAllBtn,
        verificationList: !!verificationList,
        settingsModal: !!settingsModal,
        messageModal: !!messageModal,
        messageDetails: !!messageDetails,
        messagePreview: !!messagePreview
    });
}

// Global variables
let messages = [];
let sentMessages = [];
let settings = {};
let currentMessage = null;
let importedData = [];
let columnHeaders = [];
let placeholders = [];
let columnMapping = {};

// Verification variables
let verificationQueue = [];
let isVerifying = false;

// Removed primary key field functionality as requested

// Update normalization to always return last 10 digits
function normalizePhoneNumber(number) {
    const clean = number.toString().replace(/\D/g, '');
    return clean.slice(-10);
}

// Load status updates from localStorage
function loadStatusUpdatesFromLocalStorage() {
    try {
        // Get saved status updates
        const statusUpdates = JSON.parse(localStorage.getItem('messageStatusUpdates') || '{}');
        console.log(`Loaded ${Object.keys(statusUpdates).length} status updates from localStorage`);
        
        // Apply saved status updates to messages
        if (Object.keys(statusUpdates).length > 0) {
            console.log('Applying saved status updates to messages...');
            
            // First load messages from localStorage if available
            try {
                const savedQueueMessages = JSON.parse(localStorage.getItem('queueMessages') || '[]');
                if (savedQueueMessages.length > 0) {
                    console.log(`Loaded ${savedQueueMessages.length} queue messages from localStorage`);
                    messages = savedQueueMessages;
                    messageQueue = [...messages];
                }
                
                const savedSentMessages = JSON.parse(localStorage.getItem('sentMessages') || '[]');
                if (savedSentMessages.length > 0) {
                    console.log(`Loaded ${savedSentMessages.length} sent messages from localStorage`);
                    sentMessages = savedSentMessages;
                }
            } catch (error) {
                console.error('Error loading messages from localStorage:', error);
            }
        }
        
        return statusUpdates;
    } catch (error) {
        console.error('Error loading status updates from localStorage:', error);
        return {};
    }
}

// Auto-refresh functionality removed as requested

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    // Initialize DOM elements first
    initializeDOMElements();
    
    // Check if DOM elements are available after DOM is loaded
    const messageListAfterLoad = document.getElementById('messageList');
    console.log('messageList after DOM load:', !!messageListAfterLoad);
    
    // Set up event listeners
    setupEventListeners();
    
    // Load status updates from localStorage first
    const savedStatusUpdates = loadStatusUpdatesFromLocalStorage();
    
    // Load messages and settings
    loadMessages();
    loadSentMessages();
    loadSettings();
    loadVerificationQueue();
    
    // Apply any saved status updates after loading messages
    if (Object.keys(savedStatusUpdates).length > 0) {
        console.log('Applying saved status updates after loading messages...');
        Object.entries(savedStatusUpdates).forEach(([recordIndex, data]) => {
            // Apply status update locally only (don't send to main process)
            updateMessageStatus(recordIndex, data.status, true);
        });
    }
    
    // Start with messages tab active
    switchTab('messages');
    
    console.log('App initialized');
    
    // Don't show any popups on startup
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    
    // Primary key functionality has been removed as requested
});

// Load settings from main process
function loadSettings() {
    try {
        console.log('Loading settings from MongoDB...');
        
        // Get settings from main process using sendSync for consistency
        settings = ipcRenderer.sendSync('get-settings') || {};
        
        console.log('Settings loaded:', {
            hasMessageTemplate: !!settings.messageTemplate,
            templateLength: settings.messageTemplate ? settings.messageTemplate.length : 0,
            settingsKeys: Object.keys(settings)
        });
        
        // Update UI with settings - handle 0 values correctly
        document.getElementById('notificationMinutes').value = 
            settings.notificationMinutes !== undefined ? settings.notificationMinutes : 0;
        document.getElementById('notificationSeconds').value = 
            settings.notificationSeconds !== undefined ? settings.notificationSeconds : 5;
            
        // Set notifications enabled checkbox
        const notificationsEnabledCheckbox = document.getElementById('notificationsEnabled');
        if (notificationsEnabledCheckbox) {
            notificationsEnabledCheckbox.checked = 
                settings.notificationsEnabled !== undefined ? settings.notificationsEnabled : true;
        }
        
        // Log the actual values being set
        console.log('Setting UI values:', {
            minutes: document.getElementById('notificationMinutes').value,
            seconds: document.getElementById('notificationSeconds').value,
            notificationsEnabled: notificationsEnabledCheckbox ? notificationsEnabledCheckbox.checked : true
        });
        
        // Load message template from database only, no predefined template
        console.log('Checking for template in MongoDB settings');
        if (settings.messageTemplate) {
            console.log('Using existing template from MongoDB');
            // Update the template input if it exists
            if (messageTemplate) {
                messageTemplate.value = settings.messageTemplate;
                console.log('Template input updated with value from MongoDB');
            } else {
                console.warn('Message template input element not found');
            }
        } else {
            console.log('No template found in MongoDB, leaving input empty');
            // Do not set a default template, leave it empty
            if (messageTemplate) {
                messageTemplate.value = '';
                console.log('Template input left empty');
            } else {
                console.warn('Message template input element not found');
            }
        }
        
        // Update all template previews with the loaded template
        if (typeof updateAllTemplatePreviews === 'function') {
            updateAllTemplatePreviews();
        } else {
            console.log('updateAllTemplatePreviews function not available yet');
            // Re-render message list to update previews
            if (typeof renderMessageList === 'function') {
                renderMessageList();
            }
        }
        
        console.log('Settings loaded:', settings);
        return true;
    } catch (error) {
        console.error('Error loading settings:', error);
        return false;
    }
}

// Load messages from main process with improved error handling
function refreshMessages() {
    console.log('Refreshing messages from main process...');
    try {
        // Get messages from main process
        messages = ipcRenderer.sendSync('get-messages');
        // Keep a local copy for queue processing
        messageQueue = [...messages]; 
        renderMessageList();
        console.log(`Messages refreshed: ${messages.length} messages in queue`);
        return true;
    } catch (error) {
        console.error('Error refreshing messages:', error);
        return false;
    }
}

// Original load messages function for backward compatibility
function loadMessages() {
    messages = ipcRenderer.sendSync('get-messages');
    messageQueue = [...messages];
    renderMessageList();
    return true;
}

// Load sent messages from main process
function loadSentMessages() {
    sentMessages = ipcRenderer.sendSync('get-sent-messages');
    renderHistoryList();
}

// Save messages to MongoDB via main process
function saveMessages() {
    try {
        const result = ipcRenderer.sendSync('save-messages', messages);
        if (result && result.success) {
            console.log('Messages saved to MongoDB successfully');
            return Promise.resolve(true);
        } else {
            console.error('Failed to save messages to MongoDB:', result ? result.error : 'Unknown error');
            return Promise.reject(new Error(result ? result.error : 'Failed to save messages'));
        }
    } catch (error) {
        console.error('Error saving messages:', error);
        return Promise.reject(error);
    }
}

// Save sent messages to MongoDB via main process
function saveSentMessages() {
    try {
        const result = ipcRenderer.sendSync('save-sent-messages', sentMessages);
        if (result && result.success) {
            console.log('Sent messages saved to MongoDB successfully');
            return Promise.resolve(true);
        } else {
            console.error('Failed to save sent messages to MongoDB:', result ? result.error : 'Unknown error');
            return Promise.reject(new Error(result ? result.error : 'Failed to save sent messages'));
        }
    } catch (error) {
        console.error('Error saving sent messages:', error);
        return Promise.reject(error);
    }
}

// Set up event listeners
function setupEventListeners() {
    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Button click handlers - with null checks and debug logging
    console.log('Setting up button event listeners...');
    console.log('clearQueueBtn found:', !!clearQueueBtn);
    console.log('clearHistoryBtn found:', !!clearHistoryBtn);
    
    if (refreshBtn) refreshBtn.addEventListener('click', loadMessages);
    if (settingsBtn) settingsBtn.addEventListener('click', openSettingsModal);
    if (exportDataBtn) exportDataBtn.addEventListener('click', exportAllData);
    if (importDataBtn) importDataBtn.addEventListener('click', importAllData);
    if (queueMessageBtn) queueMessageBtn.addEventListener('click', processQueueMessages);
    if (clearQueueBtn) {
        clearQueueBtn.addEventListener('click', clearQueue);
        console.log('✅ Clear Queue button event listener attached');
    } else {
        console.error('❌ Clear Queue button not found!');
    }
    
    // Add verify numbers button handler
    const verifyNumbersBtn = document.getElementById('verifyNumbersBtn');
    if (verifyNumbersBtn) {
        verifyNumbersBtn.addEventListener('click', function() {
            console.log('Verify Numbers button clicked');
            // Direct implementation of verification functionality
            const messagesToVerify = ipcRenderer.sendSync('get-messages') || [];
            
            if (messagesToVerify.length === 0) {
                showDialog('No messages in queue', 'There are no messages in the queue to verify.', 'info');
                return;
            }
            
            // Show the verification modal
            const verifyNumbersModal = document.getElementById('verifyNumbersModal');
            if (verifyNumbersModal) {
                verifyNumbersModal.style.display = 'block';
                
                // Set up the verification process
                const verificationProgress = document.getElementById('verificationProgress');
                const progressText = document.getElementById('progressText');
                const totalNumbers = document.getElementById('totalNumbers');
                const verifiedNumbers = document.getElementById('verifiedNumbers');
                const invalidNumbers = document.getElementById('invalidNumbers');
                const verificationResultsList = document.getElementById('verificationResultsList');
                
                // Reset UI
                verificationResultsList.innerHTML = '';
                totalNumbers.textContent = messagesToVerify.length;
                verifiedNumbers.textContent = '0';
                invalidNumbers.textContent = '0';
                progressText.textContent = `0/${messagesToVerify.length}`;
                verificationProgress.value = 0;
                verificationProgress.max = messagesToVerify.length;
                
                // Start verification process
                let currentIndex = 0;
                let totalValid = 0;
                let totalInvalid = 0;
                
                function verifyNextNumber() {
                    if (currentIndex >= messagesToVerify.length) {
                        // Verification complete
                        document.getElementById('cancelVerificationBtn').style.display = 'none';
                        document.getElementById('exportVerificationResultsBtn').disabled = false;
                        return;
                    }
                    
                    const message = messagesToVerify[currentIndex];
                    let phoneNumber = '';
                    
                    // Extract phone number directly from the display field as used in the message list
                    phoneNumber = message.phoneNumber || '';
                    
                    // Clean the phone number
                    phoneNumber = phoneNumber.toString().replace(/\D/g, '');
                    
                    // If no phone number found, try alternative fields
                    if (!phoneNumber && message.phone) {
                        phoneNumber = message.phone.toString().replace(/\D/g, '');
                    }
                    
                    // If still no phone number, try mobile field
                    if (!phoneNumber && message.mobile) {
                        phoneNumber = message.mobile.toString().replace(/\D/g, '');
                    }
                    
                    // Last resort - try to extract from whatsappLink
                    if (!phoneNumber && message.whatsappLink) {
                        const match = message.whatsappLink.match(/phone=([0-9]+)/);
                        if (match && match[1]) phoneNumber = match[1];
                    }
                    
                    if (!phoneNumber) {
                        // Skip invalid phone numbers
                        currentIndex++;
                        progressText.textContent = `${currentIndex}/${messagesToVerify.length}`;
                        verificationProgress.value = currentIndex;
                        setTimeout(verifyNextNumber, 500);
                        return;
                    }
                    
                    phoneNumber = normalizePhoneNumber(phoneNumber);
                    console.log(`Verifying phone number: ${phoneNumber} (index: ${currentIndex})`);
                    console.log(`Trying to open WhatsApp directly for: ${phoneNumber}`);
                    const whatsappUrl = `whatsapp://send?phone=${phoneNumber}`;
                    const result = ipcRenderer.sendSync('open-whatsapp', whatsappUrl, true);
                    console.log('Direct WhatsApp open result:', result);
                    setTimeout(() => {
                        ipcRenderer.send('verify-whatsapp-number', {
                            index: currentIndex,
                            phoneNumber: phoneNumber,
                            recordIndex: message.recordIndex
                        });
                    }, 1000);
                }
                
                // Remove any existing verification result listeners to avoid duplicates
                ipcRenderer.removeAllListeners('verification-result');
                
                // Listen for verification results
                ipcRenderer.on('verification-result', (event, result) => {
                    const { index, phoneNumber, isValid, message } = result;
                    
                    // Create result item
                    const resultItem = document.createElement('div');
                    resultItem.className = `verification-result ${isValid ? 'valid' : 'invalid'}`;
                    
                    // Get the original message data
                    const originalMessage = messagesToVerify[index];
                    const name = originalMessage.name || originalMessage.studentName || originalMessage.student_name || '';
                    
                    resultItem.innerHTML = `
                        <div class="result-icon">${isValid ? '✅' : '❌'}</div>
                        <div class="result-details">
                            <div class="result-name">${name}</div>
                            <div class="result-phone">${phoneNumber}</div>
                            <div class="result-status">${isValid ? 'On WhatsApp' : 'Not on WhatsApp'}</div>
                        </div>
                    `;
                    
                    // Add to list
                    verificationResultsList.appendChild(resultItem);
                    
                    // Update counters
                    if (isValid) {
                        totalValid++;
                    } else {
                        totalInvalid++;
                    }
                    
                    verifiedNumbers.textContent = totalValid;
                    invalidNumbers.textContent = totalInvalid;
                    
                    // Update progress
                    currentIndex++;
                    progressText.textContent = `${currentIndex}/${messagesToVerify.length}`;
                    verificationProgress.value = currentIndex;
                    
                    // Update message status in the queue
                    const status = isValid ? 'On WhatsApp ✅' : 'Not on WhatsApp ❌';
                    ipcRenderer.send('update-message-status', {
                        recordIndex: originalMessage.recordIndex,
                        status: status,
                        timestamp: new Date().toISOString()
                    });
                    
                    // Verify next number after a short delay
                    setTimeout(verifyNextNumber, 500);
                });
                
                // Set up button handlers
                document.getElementById('closeVerificationBtn').addEventListener('click', function() {
                    verifyNumbersModal.style.display = 'none';
                    // Refresh the message list
                    refreshMessages();
                });
                
                document.getElementById('cancelVerificationBtn').addEventListener('click', function() {
                    ipcRenderer.send('cancel-verification');
                    document.getElementById('cancelVerificationBtn').style.display = 'none';
                });
                
                document.getElementById('exportVerificationResultsBtn').addEventListener('click', function() {
                    // Collect verification results
                    const results = [];
                    for (let i = 0; i < messagesToVerify.length; i++) {
                        const message = messagesToVerify[i];
                        const name = message.name || message.studentName || message.student_name || '';
                        let phoneNumber = '';
                        
                        // Extract phone number
                        if (message.whatsappLink) {
                            const match = message.whatsappLink.match(/phone=([0-9]+)/);
                            if (match && match[1]) phoneNumber = match[1];
                        } else if (message.phone) {
                            phoneNumber = message.phone.replace(/\D/g, '');
                        } else if (message.phoneNumber) {
                            phoneNumber = message.phoneNumber.replace(/\D/g, '');
                        } else if (message.mobile) {
                            phoneNumber = message.mobile.replace(/\D/g, '');
                        }
                        
                        results.push({
                            recordIndex: message.recordIndex,
                            name: name,
                            phoneNumber: phoneNumber,
                            isValid: message.status && message.status.includes('✅'),
                            message: message.status || ''
                        });
                    }
                    
                    ipcRenderer.send('export-verification-results', results);
                });
                
                // Start the verification process
                console.log('Starting verification process for', messagesToVerify.length, 'messages');
                // Start with a slight delay to ensure all event listeners are set up
                setTimeout(verifyNextNumber, 500);
            }
        });
    }
    
    // Verification tab event listeners
    if (verifyAllBtn) {
        verifyAllBtn.addEventListener('click', startVerification);
    }
    
    if (clearVerifiedBtn) {
        clearVerifiedBtn.addEventListener('click', clearVerificationQueue);
    }
    
    if (exportVerifiedBtn) {
        exportVerifiedBtn.addEventListener('click', exportVerificationResults);
    }
    
    if (addNumberBtn) {
        addNumberBtn.addEventListener('click', addVerificationNumber);
    }
    
    if (addBulkNumbersBtn) {
        addBulkNumbersBtn.addEventListener('click', addBulkVerificationNumbers);
    }
    
    // Enter key handlers for verification inputs
    if (phoneNumberInput) {
        phoneNumberInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addVerificationNumber();
            }
        });
    }
    
    if (bulkNumbersInput) {
        bulkNumbersInput.addEventListener('keypress', function(e) {
            if (e.ctrlKey && e.key === 'Enter') {
                addBulkVerificationNumbers();
            }
        });
    }
    
    
    // More button handlers with null checks
    if (document.getElementById('importDataFileBtn')) {
        document.getElementById('importDataFileBtn').addEventListener('click', importDataFile);
    }
    if (saveTemplateBtn) saveTemplateBtn.addEventListener('click', saveTemplate);
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', clearHistory);
        console.log('✅ Clear History button event listener attached');
    } else {
        console.error('❌ Clear History button not found!');
    }
    if (exportHistoryBtn) exportHistoryBtn.addEventListener('click', exportHistory);
    
    // Modal handlers with null checks
    if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', () => saveSettings(true));
    if (cancelSettingsBtn) cancelSettingsBtn.addEventListener('click', closeSettingsModal);
    if (sendMessageBtn) sendMessageBtn.addEventListener('click', sendMessage);
    if (snoozeMessageBtn) snoozeMessageBtn.addEventListener('click', openSnoozeModal);
    if (closeMessageBtn) closeMessageBtn.addEventListener('click', closeMessageModal);
    
    // Column mapping modal handlers
    const applyMappingBtn = document.getElementById('applyMappingBtn');
    const cancelMappingBtn = document.getElementById('cancelMappingBtn');
    
    applyMappingBtn.addEventListener('click', () => {
        // Primary key functionality has been removed as requested
        
        // Check if phone_number mapping is selected
        const phoneNumberMapping = columnMapping['phone_number'];
        if (!phoneNumberMapping) {
            showToast('Error: You must map a column to the phone_number field as it is mandatory.', 'error');
            return;
        }
        
        // Check if all placeholders in the current template are mapped
        const placeholderCheck = checkRequiredPlaceholders();
        if (!placeholderCheck.allMapped) {
            const missingList = placeholderCheck.missingPlaceholders.join(', ');
            showConfirm(
                `Warning: The following placeholders in your message template are not mapped: ${missingList}\n\nThese will appear as-is in your messages. Do you want to continue anyway?`,
                'Unmapped Placeholders',
                () => {
                    // Continue with processing after placeholder confirmation
                    processAndImportData();
                }
            );
            return;
        }
        
        // If all placeholders are mapped, proceed directly
        processAndImportData();
        
        function processAndImportData() {
            console.log('Processing data with mapping...');
            const processedMessages = processImportedDataWithMapping();
            console.log('Processed messages:', processedMessages);
            
            if (processedMessages.length === 0) {
                showToast('No valid messages were processed. Please check your data and mapping.', 'error');
                return;
            }
            
            // Add new messages to queue if they don't already exist
            let addedCount = 0;
            processedMessages.forEach(message => {
                const exists = messages.some(m => m.recordIndex === message.recordIndex);
                const sentExists = sentMessages.some(m => m.recordIndex === message.recordIndex);
                
                if (!exists && !sentExists) {
                    messages.push(message);
                    addedCount++;
                }
            });
            
            // Save and refresh
            saveMessages();
            // Do NOT render message list yet
            // renderMessageList(); // Ensure this is not called here

            // Close the mapping modal
            document.getElementById('mappingModal').style.display = 'none';

            // Count how many numbers were added to verification queue
            const verificationCount = processedMessages.length;

            showToast(`Imported ${processedMessages.length} messages! (${addedCount} new messages added to queue). ${verificationCount} phone numbers automatically added to verification queue.`, 'success');
            console.log('Import completed successfully.');

            // Automatically switch to the verify tab (enforce correct flow)
            switchTab('verify');
        }
    });
    
    cancelMappingBtn.addEventListener('click', () => {
        document.getElementById('mappingModal').style.display = 'none';
    });
    
    // Snooze options
    snoozeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const minutes = parseInt(option.getAttribute('data-minutes'));
            snoozeMessage(minutes);
        });
    });
    
    // Close buttons for modals - fix for close button not working
    document.querySelectorAll('.close-btn').forEach(button => {
        console.log('Adding event listener to close button:', button);
        button.addEventListener('click', (e) => {
            console.log('Close button clicked');
            const modal = button.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                console.log('Modal closed');
            }
        });
    });
    
    // Listen for refresh-messages event from main process
    ipcRenderer.on('refresh-messages', () => {
        refreshMessages();
    });
    
    // Listen for show-message event from main process (notification click)
    ipcRenderer.on('show-message', (event, messageId) => {
        console.log('Show message request received for ID:', messageId);
        const message = messages.find(m => m.recordIndex === messageId);
        if (message) {
            openMessageDetails(message);
        }
    });
    

}

// Extract name from message with improved detection
function extractNameFromMessage(message) {
    let name = 'No Name';
    
    if (message.customFields) {
        // Priority order for name fields
        const nameFields = [
            'Student_Name', 'student_name', 'name', 'Name', 'NAME',
            'studentname', 'StudentName', 'STUDENTNAME',
            'full_name', 'Full_Name', 'FULL_NAME',
            'first_name', 'First_Name', 'FIRST_NAME',
            'last_name', 'Last_Name', 'LAST_NAME'
        ];
        
        // Try exact matches first
        for (const field of nameFields) {
            if (message.customFields[field] && message.customFields[field].trim()) {
                name = message.customFields[field].trim();
                break;
            }
        }
        
        // If no exact match, try partial matches
        if (name === 'No Name') {
            for (const [key, value] of Object.entries(message.customFields)) {
                const lowerKey = key.toLowerCase();
                if ((lowerKey.includes('name') || lowerKey.includes('student')) && 
                    value && value.trim() && 
                    !lowerKey.includes('phone') && 
                    !lowerKey.includes('number') &&
                    !lowerKey.includes('receipt') &&
                    !lowerKey.includes('amount')) {
                    name = value.trim();
                    break;
                }
            }
        }
    }
    
    return name;
}

// Get verification status for a phone number
function getVerificationStatus(phoneNumber) {
    if (!phoneNumber) return 'not-started';
    
    // Clean the phone number (remove all non-digits) - same as main process
    const cleanNumber = phoneNumber.toString().replace(/\D/g, '');
    
    console.log(`Checking verification status for: ${phoneNumber} -> cleaned: ${cleanNumber}`);
    console.log('Current verification queue items:', verificationQueue.map(item => `${item.number} (${item.status})`));
    
    // Try exact match first
    let verificationItem = verificationQueue.find(item => item.number === cleanNumber);
    
    if (verificationItem) {
        console.log(`Found exact match: ${verificationItem.number} -> ${verificationItem.status}`);
        return verificationItem.status;
    }
    
    // If no exact match and number starts with country code (91), try without country code
    if (cleanNumber.startsWith('91') && cleanNumber.length === 12) {
        const numberWithoutCountryCode = cleanNumber.substring(2); // Remove '91' prefix
        verificationItem = verificationQueue.find(item => item.number === numberWithoutCountryCode);
        
        if (verificationItem) {
            console.log(`Found match without country code: ${verificationItem.number} -> ${verificationItem.status}`);
            return verificationItem.status;
        }
    }
    
    // If no match found with shorter number, try adding country code to verification queue numbers
    if (cleanNumber.length === 10) {
        const numberWithCountryCode = '91' + cleanNumber;
        verificationItem = verificationQueue.find(item => item.number === numberWithCountryCode);
        
        if (verificationItem) {
            console.log(`Found match with country code added: ${verificationItem.number} -> ${verificationItem.status}`);
            return verificationItem.status;
        }
    }
    
    console.log(`No verification item found for ${cleanNumber}, returning 'not-started'`);
    return 'not-started'; // Not in verification queue
}

// Check if a phone number is verified (for backward compatibility)
function isPhoneNumberVerified(phoneNumber) {
    return getVerificationStatus(phoneNumber) === 'verified';
}

// Switch between tabs
function switchTab(tabId) {
    // Hide all tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.classList.remove('active');
    });
    
    // Show the selected tab content
    document.getElementById(tabId).classList.add('active');
    
    // Add active class to the clicked button
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    
    // If switching to messages tab, refresh the message list to ensure templates are up to date
    if (tabId === 'messages') {
        // Reload verification queue to get latest status
        loadVerificationQueue();
        renderMessageList();
    } else if (tabId === 'history') {
        renderHistoryList();
    } else if (tabId === 'verify') {
        loadVerificationQueue();
    } else if (tabId === 'settings') {
        // Make sure template preview is updated if we're switching to settings
        if (typeof updateAllTemplatePreviews === 'function') {
            updateAllTemplatePreviews();
        }
    }
    
    // Log the tab switch for debugging
    console.log(`Switched to tab: ${tabId}`);
}

// Render the message list
function renderMessageList() {
    if (!messageList) {
        console.error('messageList element not found');
        return;
    }
    
    messageList.innerHTML = '';
    
    // Filter to show only verified, unsent messages in the queue
    const filteredMessages = messages.filter(message => {
        // Don't show messages that have been sent
        if (message.status && (message.status.includes('Sent') || message.status.includes('sent'))) {
            return false;
        }
        
        // Get phone number from message
        const phoneNumber = message.phoneNumber || (message.customFields && message.customFields.phone_number);
        
        if (phoneNumber) {
            // Check if this exact message (by recordIndex) exists in sentMessages array
            // Only filter out if it's the exact same message that was sent, not just similar content
            const messageInSentHistory = sentMessages.some(sentMsg => 
                sentMsg.recordIndex === message.recordIndex
            );
            if (messageInSentHistory) {
                return false;
            }
            
            // Only show messages with verified phone numbers
            const verificationStatus = getVerificationStatus(phoneNumber);
            return verificationStatus === 'verified'; // Only show verified messages
        }
        
        return false; // Hide messages without phone numbers
    });
    
    // Check if there are no filtered messages to display
    if (filteredMessages.length === 0) {
        messageList.innerHTML = `
            <div class="empty-state">
                <p>No messages in queue</p>
            </div>
        `;
        messageCount.textContent = 0;
        return;
    }
    
    console.log('Filtered messages count:', filteredMessages.length, 'from', messages.length, 'total messages');
    messageCount.textContent = filteredMessages.length;
    
    // Preserve the original upload order while keeping snoozed messages at the end
    const sortedMessages = [...filteredMessages].sort((a, b) => {
        // First sort by snoozed status
        if (a.isSnoozed && !b.isSnoozed) return 1;
        if (!a.isSnoozed && b.isSnoozed) return -1;
        
        // If both have the same snoozed status, sort by recordIndex to maintain upload order
        if (a.recordIndex !== undefined && b.recordIndex !== undefined) {
            return a.recordIndex - b.recordIndex;
        }
        
        return 0;
    });
    
    console.log('Processing', sortedMessages.length, 'messages');
    
    sortedMessages.forEach((message, index) => {
        console.log(`Processing message ${index}:`, message);
        const messageItem = document.createElement('div');
        messageItem.className = `message-item ${message.isSnoozed ? 'snoozed' : ''}`;
        messageItem.style.position = 'relative'; // For absolute positioning of actions
        
        // Collect all fields from the message into a single object for display
        const displayFields = {};
        
        // Only add phone number as a standard field
        displayFields['Phone Number'] = message.phoneNumber || 'No Phone';
        
        // Create a set to track which fields we've already added (case-insensitive)
        const addedFields = new Set(['phone number']);
        
        // Add all custom fields with proper formatting, avoiding duplicates
        if (message.customFields) {
            // Sort keys to ensure consistent display order
            const sortedKeys = Object.keys(message.customFields).sort();
            
            sortedKeys.forEach(key => {
                // Skip empty values
                if (!message.customFields[key]) return;
                
                // Format the key name for display
                const displayKey = key.replace(/_/g, ' ')
                    .replace(/\b\w/g, c => c.toUpperCase());
                
                // Check if we've already added this field (case-insensitive)
                const normalizedKey = displayKey.toLowerCase();
                if (!addedFields.has(normalizedKey)) {
                    displayFields[displayKey] = message.customFields[key] || 'N/A';
                    addedFields.add(normalizedKey);
                }
            });
        }
        
        // Generate HTML for all fields
        const fieldsHTML = Object.entries(displayFields)
            .map(([key, value]) => `<div><strong>${key}:</strong> ${value}</div>`)
            .join('');
        
        // Get the name directly from the Student Name field in mapping
        let studentName = 'No Name';
        // Check top-level fields first
        if (message.Name) {
            studentName = message.Name;
        } else if (message.name) {
            studentName = message.name;
        } else if (message.full_name) {
            studentName = message.full_name;
        }
        // Check customFields if still not found
        if (studentName === 'No Name' && message.customFields) {
            if (message.customFields.Student_Name) {
            studentName = message.customFields.Student_Name;
            } else if (message.customFields.student_name) {
            studentName = message.customFields.student_name;
            } else if (message.customFields.Name) {
                studentName = message.customFields.Name;
            } else if (message.customFields.name) {
                studentName = message.customFields.name;
            } else if (message.customFields.full_name) {
                studentName = message.customFields.full_name;
            } else {
                // Try to find any field that contains 'name'
            for (const [key, value] of Object.entries(message.customFields)) {
                    if (key.toLowerCase().includes('name')) {
                    studentName = value;
                    break;
                    }
                }
            }
        }
            
        // Get the phone number to display prominently
        let phoneNumber = 'No Phone';
        if (message.phoneNumber) {
            phoneNumber = message.phoneNumber;
        } else if (message.customFields && message.customFields.phone_number) {
            phoneNumber = message.customFields.phone_number;
        }
        
        // Format the phone number for display
        const formattedPhone = phoneNumber.replace(/^91/, ''); // Remove leading 91 if present
        
        // Check verification status - use the cleaned phone number for consistency
        const cleanPhoneForVerification = phoneNumber.toString().replace(/\D/g, '');
        const verificationStatus = getVerificationStatus(cleanPhoneForVerification);
        let statusIndicator = '';
        let statusBadge = '';
        let sendButtonHtml = '';
        
        // Primary key functionality has been removed as requested
        
        // Show actual verification status
        switch (verificationStatus) {
            case 'verified':
                statusIndicator = '<span class="verification-dot verified" title="Verified in WhatsApp">●</span>';
                statusBadge = '<span class="status-badge verified">✓ Verified</span>';
                sendButtonHtml = '<button class="message-item-send" title="Send message">Send</button>';
                break;
            case 'not-verified':
                statusIndicator = '<span class="verification-dot not-verified" title="Not verified in WhatsApp">●</span>';
                statusBadge = '<span class="status-badge not-verified">✗ Not Verified</span>';
                sendButtonHtml = '<button class="message-item-send" title="Cannot send - number not verified" disabled>Send</button>';
                break;
            case 'verifying':
                statusIndicator = '<span class="verification-dot verifying" title="Verification in progress">●</span>';
                statusBadge = '<span class="status-badge verifying">⟳ Verifying</span>';
                sendButtonHtml = '<button class="message-item-send" title="Cannot send - verification in progress" disabled>Send</button>';
                break;
            case 'pending':
            default:
                statusIndicator = '<span class="verification-dot pending" title="Verification pending">●</span>';
                statusBadge = '<span class="status-badge pending">⏳ Pending</span>';
                sendButtonHtml = '<button class="message-item-send" title="Cannot send - verification pending" disabled>Send</button>';
                break;
        }
        
        messageItem.innerHTML = `
            <div class="message-item-header">
                <div class="message-item-name">${studentName} ${statusIndicator}</div>
                <div class="message-item-status ${message.isSnoozed ? 'snoozed' : ''}">
                    ${message.isSnoozed ? 'Snoozed' : ''}
                    ${statusBadge}
                </div>
            </div>
            <div class="message-item-phone">
                <strong>Phone:</strong> ${formattedPhone}
            </div>
            <div class="message-item-details">
                ${fieldsHTML}
            </div>
            <div class="message-item-actions">
                ${sendButtonHtml}
                <button class="message-item-copy-link" title="Copy text">Copy Text</button>
                <button class="message-item-delete" title="Delete message">×</button>
            </div>
        `;

        // Always allow click
        messageItem.addEventListener('click', () => {
            openMessageDetails(message);
        });
        
        // Add event listeners for action buttons
        // Send button (primary key requirement removed)
        const sendBtn = messageItem.querySelector('.message-item-send');
        if (sendBtn) {
            sendBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('[DEBUG] Card send button clicked for message:', message);
                processSingleMessage(message);
            });
        }
        // Copy Text button
        const copyBtn = messageItem.querySelector('.message-item-copy-link');
        if (copyBtn) {
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                copyMessageText(message);
            });
        }
        // Delete button
        const deleteBtn = messageItem.querySelector('.message-item-delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click event
                deleteMessage(message.recordIndex);
            });
        }
        
        messageList.appendChild(messageItem);
        console.log(`Added message item ${index} to DOM`);
    });
    
    console.log('Finished rendering message list');
}

// Render the history list
function renderHistoryList() {
    historyCount.textContent = sentMessages.length;
    
    if (sentMessages.length === 0) {
        historyList.innerHTML = `
            <div class="empty-state">
                <p>No sent messages</p>
            </div>
        `;
        return;
    }
    
    historyList.innerHTML = '';
    
    // Sort sent messages by sent time (most recent first)
    const sortedMessages = [...sentMessages].sort((a, b) => {
        const timeA = a.sentTime ? new Date(a.sentTime) : new Date(0);
        const timeB = b.sentTime ? new Date(b.sentTime) : new Date(0);
        return timeB - timeA;
    });
    
    sortedMessages.forEach(message => {
        const messageItem = document.createElement('div');
        messageItem.className = 'message-item';
        
        const sentTime = message.sentTime ? new Date(message.sentTime).toLocaleString() : 'Unknown';
        
        // Get the name with improved detection
        let studentName = extractNameFromMessage(message);
        
        // Get receipt number from customFields with fallbacks
        let receiptNo = 'N/A';
        const receiptFields = ['receipt_no', 'receiptno', 'receipt', 'invoice', 'receipt_number'];
        for (const field of receiptFields) {
            if (message.customFields && message.customFields[field]) {
                receiptNo = message.customFields[field];
                break;
            }
        }
        
        // Get the phone number to display prominently
        let phoneNumber = 'No Phone';
        if (message.phoneNumber) {
            phoneNumber = message.phoneNumber;
        } else if (message.customFields && message.customFields.phone_number) {
            phoneNumber = message.customFields.phone_number;
        }
        
        // Format the phone number for display
        const formattedPhone = phoneNumber.replace(/^91/, ''); // Remove leading 91 if present
        
        // Collect all fields for display
        const displayFields = {};
        
        // Add sent time as a standard field
        displayFields['Sent'] = sentTime;
        
        // Create a set to track which fields we've already added (case-insensitive)
        const addedFields = new Set(['phone']);
        
        // Add all custom fields with proper formatting, avoiding duplicates
        if (message.customFields) {
            // Sort keys to ensure consistent display order
            const sortedKeys = Object.keys(message.customFields).sort();
            
            sortedKeys.forEach(key => {
                // Skip empty values
                if (!message.customFields[key]) return;
                
                // Format the key name for display
                const displayKey = key.replace(/_/g, ' ')
                    .replace(/\b\w/g, c => c.toUpperCase());
                
                // Check if we've already added this field (case-insensitive)
                const normalizedKey = displayKey.toLowerCase();
                if (!addedFields.has(normalizedKey)) {
                    displayFields[displayKey] = message.customFields[key] || 'N/A';
                    addedFields.add(normalizedKey);
                }
            });
        }
        
        // Generate HTML for all fields
        const fieldsHTML = Object.entries(displayFields)
            .map(([key, value]) => `<div><strong>${key}:</strong> ${value}</div>`)
            .join('');
        
        messageItem.innerHTML = `
            <div class="message-item-header">
                <div class="message-item-name">${studentName}</div>
                <div class="message-item-status">Sent</div>
            </div>
            <div class="message-item-phone">
                <strong>Phone:</strong> ${formattedPhone}
            </div>
            <div class="message-item-details">
                ${fieldsHTML}
            </div>
            <div class="message-item-actions">
                <button class="message-item-open-whatsapp" title="Open in WhatsApp">Open in WhatsApp</button>
            </div>
        `;
        
        // Main card click opens message details
        messageItem.addEventListener('click', (e) => {
            // Don't open details if clicking on a button
            if (e.target.tagName === 'BUTTON') return;
            openMessageDetails(message);
        });
        
        // Add event listener for the Open in WhatsApp button
        const openWhatsAppBtn = messageItem.querySelector('.message-item-open-whatsapp');
        if (openWhatsAppBtn) {
            openWhatsAppBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click event
                
                try {
                    // Create WhatsApp link from phone number
                    if (message.phoneNumber) {
                        // Create a direct whatsapp:// URL that will open the chat without sending a message
                        const phoneNumber = normalizePhoneNumber(message.phoneNumber);
                        const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=`;
                        
                        // Use the IPC to open WhatsApp with this URL and explicitly set shouldPaste to false
                        const result = ipcRenderer.sendSync('open-whatsapp', whatsappUrl, true);
                        
                        if (result && result.success) {
                            showToast('Opening WhatsApp chat...', 'success');
                        } else {
                            showToast('Failed to open WhatsApp. ' + (result ? result.error : ''), 'error');
                        }
                    } else if (message.whatsappLink) {
                        // Extract phone number from existing WhatsApp link
                        let phoneNumber = '';
                        if (message.whatsappLink.startsWith('https://wa.me/')) {
                            phoneNumber = message.whatsappLink.substring('https://wa.me/'.length).split('?')[0];
                        }
                        
                        if (phoneNumber) {
                            // Create direct whatsapp:// URL that will just open the chat without sending a message
                            const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=`;
                            const result = ipcRenderer.sendSync('open-whatsapp', whatsappUrl, true);
                            
                            if (result && result.success) {
                                showToast('Opening WhatsApp chat...', 'success');
                            } else {
                                showToast('Failed to open WhatsApp. ' + (result ? result.error : ''), 'error');
                            }
                        } else {
                            showToast('Could not extract phone number from link', 'error');
                        }
                    } else {
                        // Try to find phone number in custom fields
                        let phoneFound = false;
                        
                        if (message.customFields) {
                            for (const [key, value] of Object.entries(message.customFields)) {
                                if (key.toLowerCase().includes('phone') && value) {
                                    // Format the phone number
                                    let phoneNumber = normalizePhoneNumber(value);
                                    if (!phoneNumber.startsWith('91')) {
                                        phoneNumber = '91' + phoneNumber;
                                    }
                                    
                                    const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=`;
                                    const result = ipcRenderer.sendSync('open-whatsapp', whatsappUrl, true);
                                    
                                    if (result && result.success) {
                                        showToast('Opening WhatsApp chat...', 'success');
                                        phoneFound = true;
                                        break;
                                    }
                                }
                            }
                        }
                        
                        if (!phoneFound) {
                            showToast('No phone number available for this message', 'error');
                        }
                    }
                } catch (error) {
                    console.error('Error opening WhatsApp:', error);
                    showToast('Error opening WhatsApp: ' + error.message, 'error');
                }
            });
        }
        
        historyList.appendChild(messageItem);
    });
}

// Open message details modal
function openMessageDetails(message) {
    currentMessage = message;
    
    // Generate HTML for all fields from customFields only
    let detailsHTML = '';
    
    // Track which display keys we've already added (case-insensitive)
    const addedDisplayKeys = new Set();
    
    // Only show fields that were actually mapped from the imported data
    if (message.customFields) {
        // Sort the fields to ensure consistent order
        const sortedFields = Object.entries(message.customFields).sort((a, b) => {
            // Put phone_number first if it exists
            if (a[0] === 'phone_number') return -1;
            if (b[0] === 'phone_number') return 1;
            return a[0].localeCompare(b[0]);
        });
        
        // Generate HTML for each field, avoiding duplicates
        sortedFields.forEach(([key, value]) => {
            // Skip empty values
            if (!value) return;
            
            // Format the key name for display
            const displayKey = key.replace(/_/g, ' ')
                .replace(/\b\w/g, c => c.toUpperCase());
            
            // Check if we've already added this display key (case-insensitive)
            const normalizedKey = displayKey.toLowerCase();
            if (!addedDisplayKeys.has(normalizedKey)) {
                detailsHTML += `
                    <div class="detail-item">
                        <div class="detail-label">${displayKey}</div>
                        <div class="detail-value">${value || 'N/A'}</div>
                    </div>
                `;
                addedDisplayKeys.add(normalizedKey);
            }
        });
    }
    
    // If no custom fields, show a message
    if (!detailsHTML) {
        detailsHTML = `
            <div class="detail-item">
                <div class="detail-value">No data available</div>
            </div>
        `;
    }
    
    messageDetails.innerHTML = detailsHTML;
    
    // Store the message index for future updates
    const messageIndex = messages.findIndex(m => m.recordIndex === message.recordIndex);
    if (messageIndex !== -1) {
        messagePreview.setAttribute('data-message-index', messageIndex);
    }
    
    // Format message for preview using the current template from settings
    const formattedMessage = formatMessage(message);
    messagePreview.textContent = formattedMessage;
    
    // Log the preview for debugging
    console.log('Message preview updated with template:', {
        template: settings.messageTemplate,
        preview: formattedMessage
    });
    
    // Show/hide buttons based on message status
    if (message.isSent) {
        sendMessageBtn.style.display = 'none';
        snoozeMessageBtn.style.display = 'none';
    } else {
        sendMessageBtn.style.display = 'block';
        snoozeMessageBtn.style.display = 'block';
    }
    
    messageModal.style.display = 'block';

    // Add Enter key handler for OCR verification send
    messageModal.tabIndex = 0; // Make modal focusable
    messageModal.focus();
    messageModal.addEventListener('keydown', function handleEnterKey(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            processSingleMessage(currentMessage);
        }
    }, { once: true });
}

// Format message with template and data
function formatMessage(message) {
    // Get the template from settings - always use the latest template
    let template = settings.messageTemplate || '';
    
    // Log the template being used for debugging
    console.log('Using template for formatting:', template);
    
    // If no template is set, return a message indicating that
    if (!template) {
        console.warn('No message template set');
        return 'No message template set. Please set a template in Settings.';
    }
    
    // Extract all placeholders from the template
    const placeholders = extractPlaceholders(template);
    
    // If no template or no placeholders, return empty string
    if (!template || placeholders.length === 0) {
        return '';
    }
    
    // Replace placeholders with values from message
    if (message.customFields) {
        // For each placeholder in the template
        placeholders.forEach(placeholder => {
            // Look for an exact match in customFields first
            if (message.customFields[placeholder] !== undefined) {
                // Get the value from customFields
                let value = message.customFields[placeholder] || '';
                
                // Check if this is a date field and needs special handling
                if (placeholder.toLowerCase().includes('date') && !isNaN(value) && value.toString().match(/^\d{5,}$/)) {
                    // This looks like an Excel date serial number (like 45800)
                    try {
                        // Convert Excel date serial number to JavaScript date
                        // Excel dates start from December 30, 1899
                        const excelEpoch = new Date(1899, 11, 30);
                        const daysSinceEpoch = parseInt(value);
                        const millisecondsSinceEpoch = daysSinceEpoch * 24 * 60 * 60 * 1000;
                        const date = new Date(excelEpoch.getTime() + millisecondsSinceEpoch);
                        
                        // Format the date as DD/MM/YYYY
                        value = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
                    } catch (error) {
                        console.error('Error converting Excel date:', error);
                        // Keep the original value if conversion fails
                    }
                }
                
                // Replace the placeholder with the formatted value
                template = template.replace(new RegExp(`{${placeholder}}`, 'g'), value);
            }
            // Then try normalized versions
            else {
                const normalizedPlaceholder = normalizePlaceholderName(placeholder);
                if (message.customFields[normalizedPlaceholder] !== undefined) {
                    // Get the value from customFields
                    let value = message.customFields[normalizedPlaceholder] || '';
                    
                    // Check if this is a date field and needs special handling
                    if (normalizedPlaceholder.toLowerCase().includes('date') && !isNaN(value) && value.toString().match(/^\d{5,}$/)) {
                        // This looks like an Excel date serial number (like 45800)
                        try {
                            // Convert Excel date serial number to JavaScript date
                            // Excel dates start from December 30, 1899
                            const excelEpoch = new Date(1899, 11, 30);
                            const daysSinceEpoch = parseInt(value);
                            const millisecondsSinceEpoch = daysSinceEpoch * 24 * 60 * 60 * 1000;
                            const date = new Date(excelEpoch.getTime() + millisecondsSinceEpoch);
                            
                            // Format the date as DD/MM/YYYY
                            value = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
                        } catch (error) {
                            console.error('Error converting Excel date:', error);
                            // Keep the original value if conversion fails
                        }
                    }
                    
                    // Replace the placeholder with the formatted value
                    template = template.replace(new RegExp(`{${placeholder}}`, 'g'), value);
                }
            }
        });
    }
    
    // Handle common field mappings with various formats
    const commonFields = [
        // Format: [placeholder variations, field name in message object, field name in customFields]
        [['student name', 'studentname', 'student_name', 'Student Name'], 'studentName', 'student_name'],
        [['receipt no', 'receiptno', 'receipt_no', 'Receipt No'], 'receiptNo', 'receipt_no'],
        [['amount', 'Amount'], 'amount', 'amount'],
        [['file link', 'filelink', 'file_link', 'File Link'], 'fileLink', 'file_link'],
        [['whatsapp link', 'whatsapplink', 'whatsapp_link', 'WhatsApp Link'], 'whatsappLink', 'whatsapp_link'],
        [['phone number', 'phonenumber', 'phone_number', 'Phone Number'], 'phoneNumber', 'phone_number'],
        [['email', 'email id', 'emailid', 'email_id', 'Email ID'], 'email', 'email'],
        [['transaction id', 'transactionid', 'transaction_id', 'Transaction ID'], null, 'transaction_id'],
        [['date', 'Date'], null, 'date']
    ];
    
    // For each placeholder in the template, try to find a matching field
    placeholders.forEach(placeholder => {
        // Skip if already replaced
        if (!template.includes(`{${placeholder}}`)) return;
        
        // Try to find a matching common field
        for (const [variations, messageField, customField] of commonFields) {
            if (variations.includes(placeholder.toLowerCase())) {
                let value = '';
                
                // Try to get value from message object first
                if (messageField && message[messageField]) {
                    value = message[messageField];
                }
                // Then try customFields
                else if (customField && message.customFields && message.customFields[customField]) {
                    value = message.customFields[customField];
                }
                
                // Replace the placeholder with the value
                if (value) {
                    template = template.replace(new RegExp(`{${placeholder}}`, 'g'), value);
                    break; // Found a match, no need to check other variations
                }
            }
        }
    });
    
    return template;
}

// Normalize placeholder names to handle different formats
function normalizePlaceholderName(placeholder) {
    // Convert to lowercase and remove spaces
    let normalized = placeholder.toLowerCase();
    
    // Handle common variations
    if (normalized.includes(' ')) {
        // Convert 'Student Name' to 'student_name'
        normalized = normalized.replace(/ /g, '_');
    } else if (normalized.match(/[A-Z]/) && !normalized.includes('_')) {
        // Convert 'StudentName' to 'student_name'
        normalized = normalized.replace(/([A-Z])/g, '_$1').toLowerCase();
        if (normalized.startsWith('_')) {
            normalized = normalized.substring(1);
        }
    }
    
    return normalized;
}

// Create WhatsApp link with formatted message
function createWhatsAppLink(message) {
    const formattedMessage = formatMessage(message);
    const encodedMessage = encodeURIComponent(formattedMessage);
    
    // Extract phone number from WhatsApp link
    let phoneNumber = '';
    if (message.whatsappLink && message.whatsappLink.startsWith('https://wa.me/')) {
        phoneNumber = message.whatsappLink.substring('https://wa.me/'.length);
    }
    
    return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
}

// Refresh messages
function refreshMessages() {
    loadMessages();
    loadSentMessages();
}

// Open settings modal
function openSettingsModal() {
    notificationMinutes.value = settings.notificationMinutes || 15;
    notificationSeconds.value = settings.notificationSeconds || 0;
    
    // Check if we need to add a template preview section
    if (!document.getElementById('template-preview-settings')) {
        // Create a template preview container in the settings modal
        const previewContainer = document.createElement('div');
        previewContainer.className = 'template-preview-container';
        previewContainer.innerHTML = `
            <h4>Message Template Preview</h4>
            <div id="template-preview-settings" class="template-preview"></div>
        `;
        
        // Find the message template section to insert after
        const templateSection = document.querySelector('#settingsModal .modal-body .form-group:nth-child(2)');
        if (templateSection) {
            templateSection.parentNode.insertBefore(previewContainer, templateSection.nextSibling);
            
            // Add event listener to the template textarea for real-time preview
            const messageTemplateInput = document.getElementById('messageTemplate');
            if (messageTemplateInput) {
                messageTemplateInput.addEventListener('input', updateSettingsTemplatePreview);
            }
        }
    }
    
    // Show the modal
    settingsModal.style.display = 'block';
    
    // Update the preview
    updateSettingsTemplatePreview();
}

// Update template preview in settings modal
function updateSettingsTemplatePreview() {
    const previewElement = document.getElementById('template-preview-settings');
    if (!previewElement) return;
    
    const templateInput = document.getElementById('messageTemplate');
    if (!templateInput) return;
    
    let templateText = templateInput.value || '';
    
    // Extract all placeholders
    const placeholders = extractPlaceholders(templateText);
    
    // Highlight placeholders in the template
    placeholders.forEach(placeholder => {
        const displayValue = `<span class="template-placeholder">{${placeholder}}</span>`;
        templateText = templateText.replace(
            new RegExp(`{${placeholder}}`, 'g'), 
            displayValue
        );
    });
    
    // Add line breaks for better readability
    templateText = templateText.replace(/\n/g, '<br>');
    
    // Set the preview content
    previewElement.innerHTML = templateText || '<em>No template content</em>';
}

// Close settings modal
function closeSettingsModal() {
    settingsModal.style.display = 'none';
}

// Function to update all template previews in the application
function updateAllTemplatePreviews() {
    console.log('Updating all template previews');
    
    // Update any template previews in the mapping modal
    if (document.getElementById('template-preview')) {
        updateTemplatePreview();
    }
    
    // Update any message previews that are currently open
    const messagePreview = document.getElementById('messagePreview');
    if (messagePreview && messagePreview.parentElement.style.display !== 'none') {
        // Find the currently displayed message
        const currentMessageIndex = parseInt(messagePreview.getAttribute('data-message-index'));
        if (!isNaN(currentMessageIndex) && messages[currentMessageIndex]) {
            // Re-format the message with the new template
            const formattedMessage = formatMessage(messages[currentMessageIndex]);
            messagePreview.textContent = formattedMessage;
        }
    }
    
    // Update any other preview elements that might be using the template
    document.querySelectorAll('.message-preview').forEach(preview => {
        const messageIndex = parseInt(preview.getAttribute('data-message-index'));
        if (!isNaN(messageIndex) && messages[messageIndex]) {
            const formattedMessage = formatMessage(messages[messageIndex]);
            preview.textContent = formattedMessage;
        }
    });
}

// Save template to MongoDB database settings
function saveTemplate() {
    try {
        // Get the template value from the input
        const templateValue = messageTemplate ? messageTemplate.value : '';
        
        if (!templateValue) {
            showToast('Please enter a message template before saving.', 'error');
            return false;
        }
        
        console.log('Saving template to MongoDB:', templateValue);
        
        // Update the settings object with the new template
        const updatedSettings = { ...settings, messageTemplate: templateValue };
        
        // Save settings using synchronous IPC
        console.log('Sending save-settings request to main process...');
        const response = ipcRenderer.sendSync('save-settings', updatedSettings);
        console.log('Received response from save-settings:', response);
        
        if (response && response.success) {
            // Update local settings
            settings = updatedSettings;
            console.log('Local settings updated with new template');
            
            // Update all template previews with the new template
            if (typeof updateAllTemplatePreviews === 'function') {
                console.log('Updating all template previews...');
                updateAllTemplatePreviews();
            } else {
                console.warn('updateAllTemplatePreviews function not available');
                // Fallback: refresh the message list to update previews
                renderMessageList();
            }
            
            // Show success message
            showToast('Message template saved successfully to the database!', 'success');
            return true;
        } else {
            // Show error message
            const errorMsg = response && response.error ? response.error : 'Unknown error';
            console.error('Error response from save-settings:', errorMsg);
            showToast(`Error saving template: ${errorMsg}`, 'error');
            return false;
        }
    } catch (error) {
        console.error('Exception in saveTemplate:', error);
        console.error('Error stack:', error.stack);
        showToast(`Error saving template: ${error.message}`, 'error');
        return false;
    }
}

// Save settings to main process
function saveSettings(showModal = false) {
    try {
        // Get input values
        const minutesInput = document.getElementById('notificationMinutes');
        const secondsInput = document.getElementById('notificationSeconds');
        const templateInput = document.getElementById('messageTemplate');
        const notificationsEnabledInput = document.getElementById('notificationsEnabled');
        
        // Get raw values
        const minutesValue = minutesInput.value.trim();
        const secondsValue = secondsInput.value.trim();
        const templateValue = templateInput ? templateInput.value : '';
        const notificationsEnabled = notificationsEnabledInput ? notificationsEnabledInput.checked : true;
        
        console.log('Raw input values:', { minutesValue, secondsValue });
        
        // Parse values, allowing 0 as valid
        const minutes = minutesValue === '' ? 0 : parseInt(minutesValue);
        const seconds = secondsValue === '' ? 0 : parseInt(secondsValue);
        
        // Create settings object
        const newSettings = {
            notificationMinutes: isNaN(minutes) ? 0 : minutes,
            notificationSeconds: isNaN(seconds) ? 0 : seconds,
            notificationsEnabled: notificationsEnabled,
            messageTemplate: templateValue || settings.messageTemplate || ''
        };
        
        console.log('Sending settings to save:', newSettings);
        
        // Save settings using synchronous IPC
        const response = ipcRenderer.sendSync('save-settings', newSettings);
        
        console.log('Settings save response:', response);
        
        if (response && response.success) {
            // Update local settings
            settings = { ...settings, ...newSettings };
            
            // Update all template previews with the new template
            updateAllTemplatePreviews();
            
            // Show success message
            showToast(`Settings saved successfully: Check interval: ${newSettings.notificationMinutes} min ${newSettings.notificationSeconds} sec, Notifications: ${newSettings.notificationsEnabled ? 'Enabled' : 'Disabled'}`, 'success');
            
            // Close modal if requested
            if (showModal) {
                closeSettingsModal();
            }
            
            return true;
        } else {
            // Show error message
            const errorMsg = response && response.error ? response.error : 'Unknown error';
            showToast(`Error saving settings: ${errorMsg}`, 'error');
            return false;
        }
    } catch (error) {
        console.error('Exception in saveSettings:', error);
        showToast(`Error saving settings: ${error.message}`, 'error');
        return false;
    }
}

// Check messages now (kept for compatibility)
function checkMessages() {
    ipcRenderer.send('check-messages');
}

// Queue message processing variables
let processingQueue = false;
let currentQueueIndex = 0;
let messageQueue = [];

// Add at the top of queue logic (after queue variables)
function advanceQueue(reason) {
    currentQueueIndex++;
    console.log(`Advancing to next message in queue instantly. New index: ${currentQueueIndex}. Reason: ${reason}`);
    // Move to next message instantly - no delay between messages
    processNextQueueMessage();
}

// Process messages in queue with 1.5-second gaps
function processQueueMessages() {
    if (processingQueue) {
        console.log('Already processing the queue. Please wait for completion.');
        return;
    }
    
    // Show process overlay
    showProcessOverlay();
    
    // Start processing queue
    processingQueue = true;
    currentQueueIndex = 0;
    
    // Continuously check for messages and process them
    checkAndProcessQueue();
}

// Check for messages in the queue and process them
function checkAndProcessQueue() {
    // Refresh messages from main process to get the latest queue
    messages = ipcRenderer.sendSync('get-messages');
    
    // Also refresh sent messages to ensure proper filtering
    sentMessages = ipcRenderer.sendSync('get-sent-messages');
    
    // Filter messages to only include verified, unsent ones (same logic as renderMessageList)
    const currentMessages = messages.filter(message => {
        // Don't process messages that have been sent
        if (message.status && (message.status.includes('Sent') || message.status.includes('sent'))) {
            return false;
        }
        
        // Get phone number from message
        const phoneNumber = message.phoneNumber || (message.customFields && message.customFields.phone_number);
        
        if (phoneNumber) {
            // Check if this exact message (by recordIndex) exists in sentMessages array
            // Only filter out if it's the exact same message that was sent, not just similar content
            const messageInSentHistory = sentMessages.some(sentMsg => 
                sentMsg.recordIndex === message.recordIndex
            );
            if (messageInSentHistory) {
                return false;
            }
            
            // Only process messages with verified phone numbers
            const verificationStatus = getVerificationStatus(phoneNumber);
            return verificationStatus === 'verified';
        }
        
        return false;
    });
    
    console.log(`Total messages in database: ${messages.length}, Verified unsent messages: ${currentMessages.length}`);
    
    if (currentMessages.length === 0) {
        // No messages in queue, end processing
        console.log('No verified unsent messages in the queue. Queue processing complete.');
        processingQueue = false;
        hideProcessOverlay();
        
        // Force a final UI refresh to show empty state
        renderMessageList();
        
        // Kill WhatsApp after queue ends
        console.log('Queue complete - killing WhatsApp process...');
        try {
            ipcRenderer.sendSync('kill-whatsapp');
            showToast('Queue completed! WhatsApp closed automatically.', 'success');
        } catch (error) {
            console.error('Error killing WhatsApp:', error);
            showToast('Queue completed!', 'success');
        }
        
        return;
    }
    
    // Store the snapshot in messageQueue for processing
    messageQueue = currentMessages;
    
    // Log the queue for debugging
    console.log(`Queue processing with ${messageQueue.length} messages:`);
    messageQueue.forEach((msg, index) => {
        console.log(`Queue item ${index + 1}: RecordIndex=${msg.recordIndex}, Phone=${msg.phoneNumber || 'N/A'}`);
    });
    
    // Reset index for the new queue
    currentQueueIndex = 0;
    
    // Process first message
    processNextQueueMessage();
}

// Process next message in the queue with 1.5-second gaps
function processNextQueueMessage() {
    // Log current processing status
    console.log(`Processing queue: index ${currentQueueIndex} of ${messageQueue.length} messages`);
    
    if (!processingQueue || currentQueueIndex >= messageQueue.length) {
        // Current queue batch is complete, check for more messages
        console.log(`Current queue batch complete. Processed ${currentQueueIndex} messages.`);
        
        // Refresh messages to update UI
        refreshMessages();
        loadSentMessages();
        
        // Check for more messages after a 1.5-second delay
        setTimeout(() => {
            checkAndProcessQueue();
        }, 1500);
        return;
    }
    
    // Get the current message from the queue
    const currentMessage = messageQueue[currentQueueIndex];
    
    // Check if this message is already in history (by recordIndex)
    const alreadyInHistory = sentMessages.some(msg => msg.recordIndex === currentMessage.recordIndex);
    
    if (alreadyInHistory) {
        console.log(`Message ${currentMessage.recordIndex} already in history, skipping to next message`);
        // Move to the next message
        advanceQueue('already in history');
        return;
    }
    
    // Log the message we're about to process
    console.log(`Processing message ${currentQueueIndex + 1}/${messageQueue.length}:`, 
                `RecordIndex=${currentMessage.recordIndex}`, 
                `Phone=${currentMessage.phoneNumber || 'N/A'}`);
    
    // Reset process steps for the new message
    resetProcessSteps();
    
    // Process the current message with sequential steps
    processQueueMessage(currentMessage);
}

// Process a single message with sequential steps and 2-second gaps
function processQueueMessage(message) {
    try {
        // Get phone number directly from the message
        let phoneNumber = '';
        
        // If there's a WhatsApp link, extract the number from it
        if (message.whatsappLink && message.whatsappLink.includes('wa.me/')) {
            phoneNumber = extractPhoneNumber(message.whatsappLink);
        } 
        // Otherwise, check if there's a phone number field in the message
        else if (message.phoneNumber) {
            phoneNumber = message.phoneNumber.replace(/\D/g, '');
        }
        // Or check in custom fields
        else if (message.customFields && message.customFields.phone_number) {
            phoneNumber = message.customFields.phone_number.replace(/\D/g, '');
        }
        
        // Validate the phone number
        if (!phoneNumber) {
            // Invalid phone number, show notification and move to next
            ipcRenderer.send('show-notification', {
                title: 'Invalid Phone Number',
                message: `Message ${currentQueueIndex + 1} has no valid phone number. Skipping.`,
                type: 'error'
            });
            
            // Move to next message
            advanceQueue('no valid phone number');
            return;
        }
        
        phoneNumber = normalizePhoneNumber(phoneNumber);
        
        // Check if the number is verified before processing
        const verificationStatus = getVerificationStatus(phoneNumber);
        if (verificationStatus !== 'verified') {
            console.log(`Skipping message for ${phoneNumber} - verification status: ${verificationStatus}`);
            
            // Update message status
            updateMessageStatus(message.recordIndex, `Skipped - ${verificationStatus}`, true);
            
            // Move to next message
            advanceQueue(`number not verified (${verificationStatus})`);
            return;
        }
        
        // Format the message text first
        const formattedMessage = formatMessage(message);
        
        // Copy the message text to clipboard for pasting
        try {
            // Create a temporary textarea element (for multiline text)
            const tempTextarea = document.createElement('textarea');
            tempTextarea.value = formattedMessage;
            tempTextarea.style.position = 'fixed';
            tempTextarea.style.opacity = '0';
            document.body.appendChild(tempTextarea);
            tempTextarea.select();
            document.execCommand('copy');
            document.body.removeChild(tempTextarea);
            
            console.log('Message text copied to clipboard');
        } catch (err) {
            console.error('Error copying message text:', err);
        }
        
        // Create direct WhatsApp protocol URL with the phone number
        // Ensure the phone number has country code 91
        if (!phoneNumber.startsWith('91')) {
            phoneNumber = '91' + phoneNumber;
        }
        
        // Use only the phone number in the WhatsApp URL - more reliable
        const whatsappUrl = `whatsapp://send?phone=${phoneNumber}`;
        
        // Get the record index for status updates
        const recordIndex = message.recordIndex;
        
        // Sequential process with exactly 2-second gaps between each step
        console.log('Starting message process with consistent 2-second intervals');
        
        // Step 1: Opening WhatsApp - Start
        updateProcessStep('open', 'active');
        console.log('Step 1: Opening WhatsApp...');
        
        // Update message status in database
        updateMessageStatus(recordIndex, 'Opening WhatsApp...', true);
        
        // Save to database
        saveMessages();
        
        setTimeout(() => {
            // Just open WhatsApp with the contact's phone number
            const openResult = ipcRenderer.sendSync('open-whatsapp', whatsappUrl, true);
            console.log('Open WhatsApp result:', openResult);
            
            if (!openResult || !openResult.success) {
                console.error('Failed to open WhatsApp:', openResult ? openResult.error : 'Unknown error');
                
                // Mark message as attempted
                ipcRenderer.send('mark-message-attempted', { recordIndex });
                
                // Move to next message with 1.5-second delay
                advanceQueue('failed to open WhatsApp');
                currentQueueIndex++;
                setTimeout(() => {
                    processNextQueueMessage();
                }, 1500);
                return;
            }
            
            // Step 1: Opening WhatsApp - Complete
            updateProcessStep('open', 'completed');
            
            // Step 2: Searching Contact - Start (1.5-second gap)
            setTimeout(() => {
                updateProcessStep('search', 'active');
                console.log('Step 2: Searching contact...');
                
                // Update message status in database
                updateMessageStatus(recordIndex, 'Searching contact...', true);
                
                // Save to database
                saveMessages();
                
                // Step 2: Searching Contact - Complete (1.5-second gap)
                setTimeout(() => {
                    updateProcessStep('search', 'completed');
                    console.log('Contact search completed');
                    
                    // Step 3: Pasting Text - Start (1.5-second gap)
                    setTimeout(() => {
                        updateProcessStep('paste', 'active');
                        console.log('Step 3: Pasting text...');
                        
                        // Update message status in database
                        updateMessageStatus(recordIndex, 'Pasting text...', true);
                        
                        // Save to database
                        saveMessages();
                        
                        // Step 3: Pasting Text - Complete (1.5-second gap)
                        setTimeout(() => {
                            updateProcessStep('paste', 'completed');
                            console.log('Text pasted');
                            
                            // Step 4: Sending Message - Start (1.5-second gap)
                            setTimeout(() => {
                                updateProcessStep('send', 'active');
                                console.log('Step 4: Sending message...');
                                
                                // Update message status in database
                                updateMessageStatus(recordIndex, 'Sending message...', true);
                                
                                // Save to database
                                saveMessages();
                                
                                // Step 4: Sending Message - Complete (1.5-second gap)
                                setTimeout(() => {
                                    updateProcessStep('send', 'completed');
                                    console.log('Message sent');
                                    
                                    // NEW: After sending, wait 2 seconds then take screenshot and verify timestamp
                                    setTimeout(async () => {
                                        console.log('Step 5: Taking screenshot and verifying timestamp...');
                                        updateMessageStatus(recordIndex, 'Verifying message delivery...', true);
                                        
                                        try {
                                            // Call the new screenshot timestamp verification
                                            const timestampResult = await ipcRenderer.invoke('verify-screenshot-timestamp');
                                            
                                            console.log('Screenshot timestamp result:', timestampResult);
                                            
                                            if (timestampResult.success && timestampResult.time_matches) {
                                                console.log('✅ Message verified successfully - timestamps match!');
                                                console.log(`📊 First chat timestamp: ${timestampResult.first_chat_timestamp}`);
                                                console.log(`🌐 Current time: ${timestampResult.current_time}`);
                                                console.log(`⏱️ Time difference: ${timestampResult.time_difference_minutes || 0} minutes`);
                                                
                                                // Mark as sent and move to history
                                                message.isSent = true;
                                                message.sentTime = new Date().toISOString();
                                                message.status = 'Sent ✅ (Verified)';
                                                
                                                // Add verification details to message
                                                message.verificationDetails = {
                                                    firstChatTimestamp: timestampResult.first_chat_timestamp,
                                                    currentTime: timestampResult.current_time,
                                                    timeDifference: timestampResult.time_difference_minutes || 0,
                                                    verifiedAt: new Date().toISOString()
                                                };
                                                
                                                // Save to MongoDB via main process
                                                try {
                                                    const saveResult = ipcRenderer.sendSync('save-sent-message', message);
                                                    if (saveResult && saveResult.success) {
                                                        console.log('Message successfully saved to history');
                                                        
                                                        // Remove from current queue
                                                        const messageIndex = messages.findIndex(m => m.recordIndex === recordIndex);
                                                        if (messageIndex !== -1) {
                                                            messages.splice(messageIndex, 1);
                                                            saveMessages();
                                                        }
                                                        
                                                        // Update UI immediately
                                                        renderMessageList();
                                                        loadSentMessages();
                                                        renderHistoryList();
                                                        
                                                        updateMessageStatus(recordIndex, 'Sent ✅ (Verified)', false);
                                                        
                                                        // Force another UI refresh after a short delay to ensure state is updated
                                                        setTimeout(() => {
                                                            renderMessageList();
                                                        }, 100);
                                                    } else {
                                                        console.error('Failed to save sent message to database:', saveResult);
                                                        updateMessageStatus(recordIndex, 'Send Error - DB Save Failed', true);
                                                    }
                                                } catch (dbError) {
                                                    console.error('Database error while saving sent message:', dbError);
                                                    updateMessageStatus(recordIndex, 'Send Error - DB Error', true);
                                                }
                                            } else {
                                                console.log('❌ Message verification failed - timestamps do not match');
                                                console.log(`📊 First chat timestamp: ${timestampResult.first_chat_timestamp || 'Not found'}`);
                                                console.log(`🌐 Current time: ${timestampResult.current_time || 'N/A'}`);
                                                console.log(`⏱️ Time difference: ${timestampResult.time_difference_minutes || 0} minutes`);
                                                console.log(`❌ Error: ${timestampResult.error || 'Timestamp mismatch'}`);
                                                
                                                // Mark as attempted but not verified
                                                updateMessageStatus(recordIndex, 'Sent ⚠️ (Unverified - Time Mismatch)', true);
                                                
                                                // Optionally mark as attempted and move to history anyway
                                                message.isSent = false;
                                                message.attemptTime = new Date().toISOString();
                                                message.status = 'Attempted - Unverified';
                                                
                                                const saveResult = ipcRenderer.sendSync('save-sent-message', message);
                                                if (saveResult && saveResult.success) {
                                                    // Remove from current queue
                                                    const messageIndex = messages.findIndex(m => m.recordIndex === recordIndex);
                                                    if (messageIndex !== -1) {
                                                        messages.splice(messageIndex, 1);
                                                        saveMessages();
                                                    }
                                                    
                                                    // Update UI
                                                    renderMessageList();
                                                    loadSentMessages();
                                                    renderHistoryList();
                                                }
                                            }
                                        } catch (error) {
                                            console.error('Error during screenshot timestamp verification:', error);
                                            updateMessageStatus(recordIndex, 'Verification Error', true);
                                            
                                            // Mark as attempted due to verification error
                                            message.isSent = false;
                                            message.attemptTime = new Date().toISOString();
                                            message.status = 'Attempted - Verification Failed';
                                            
                                            const saveResult = ipcRenderer.sendSync('save-sent-message', message);
                                            if (saveResult && saveResult.success) {
                                                // Remove from current queue
                                                const messageIndex = messages.findIndex(m => m.recordIndex === recordIndex);
                                                if (messageIndex !== -1) {
                                                    messages.splice(messageIndex, 1);
                                                    saveMessages();
                                                }
                                                
                                                // Update UI
                                                renderMessageList();
                                                loadSentMessages();
                                                renderHistoryList();
                                            }
                                        }
                                        
                                        // Log the primary key value after sending and verification
                                        let pkValue = message.primaryKey;
                                        if (!pkValue && window.primaryKeyField) {
                                            if (message[window.primaryKeyField]) {
                                                pkValue = message[window.primaryKeyField];
                                            } else if (message.customFields && message.customFields[window.primaryKeyField]) {
                                                pkValue = message.customFields[window.primaryKeyField];
                                            }
                                        }
                                        console.log('Primary Key for processed message:', pkValue);
                                        ipcRenderer.send('log-primary-key', pkValue);
                                        
                                        // Force refresh before advancing to ensure UI is updated
                                        renderMessageList();
                                        
                                        // Move to next message instantly after verification is complete
                                        advanceQueue('message verification completed');
                                        
                                    }, 2000); // Wait 2 seconds after send for screenshot
                                }, 1500);
                            }, 1500);
                        }, 1500);
                    }, 1500);
                }, 1500);
            }, 1500);
        }, 500); // Small initial delay to show the overlay first
    } catch (error) {
        console.error('Error processing message:', error);
        
        // Move to next message
        currentQueueIndex++;
        setTimeout(() => {
            processNextQueueMessage();
        }, 1500);
    }
}

// Clear message queue
function clearQueue() {
    console.log('🧪 clearQueue function called!');
    
    // Use toast confirmation instead of popup
    showToast('Clearing message queue...', 'info');
    
    console.log('Clearing message queue...');
    
    // Clear messages array
    messages = [];
    messageQueue = [];
    
    // Save to main process synchronously
    try {
        const result = ipcRenderer.sendSync('save-messages', messages);
        if (result && result.success) {
            console.log('Queue cleared and saved to MongoDB successfully');
            
            // Update message count in UI
            const messageCount = document.getElementById('messageCount');
            if (messageCount) {
                messageCount.textContent = '0';
            }
            
            // Render empty message list
            renderMessageList();
            
            // Show success toast instead of alert
            showToast('Message queue has been cleared successfully.', 'success');
        } else {
            console.error('Failed to clear queue in database:', result);
            showToast('Failed to clear queue: ' + (result ? result.error : 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error clearing queue:', error);
        showToast('Error clearing queue: ' + error.message, 'error');
    }
}

// Import data file (Excel or CSV) - Enhanced to support both formats
function importDataFile() {
    showToast('Opening file picker...', 'info');
    
    // Use native file picker to let user select Excel or CSV files
    ipcRenderer.send('import-data-file');
}



// Export history
function exportHistory() {
    ipcRenderer.send('export-history');
}

// Export all data as JSON
function exportAllData() {
    console.log('Exporting all data as JSON');
    ipcRenderer.send('export-all-data');
}

// Import all data from JSON
function importAllData() {
    console.log('Importing all data from JSON');
    ipcRenderer.send('import-all-data');
}

// Extract placeholders from template
function extractPlaceholders(template) {
    // Improved regex to handle all placeholder formats
    const placeholderRegex = /{([^}]+)}/g;
    let match;
    const placeholders = [];
    
    // Use exec to find all matches
    while ((match = placeholderRegex.exec(template)) !== null) {
        // Get the content inside the curly braces
        const placeholder = match[1].trim();
        if (placeholder && !placeholders.includes(placeholder)) {
            placeholders.push(placeholder);
        }
    }
    
    return placeholders;
}

// Check if all required placeholders are mapped
function checkRequiredPlaceholders() {
    // Get current template
    const currentTemplate = messageTemplate.value || settings.messageTemplate || '';
    
    // Extract all placeholders from the current template
    const currentPlaceholders = extractPlaceholders(currentTemplate);
    
    // Check if all placeholders have mappings
    const missingPlaceholders = currentPlaceholders.filter(placeholder => 
        !columnMapping[placeholder] || columnMapping[placeholder] === '');
    
    return {
        allMapped: missingPlaceholders.length === 0,
        missingPlaceholders: missingPlaceholders
    };
}

// Open column mapping modal
function openColumnMappingModal(data, headers) {
    importedData = data;
    columnHeaders = headers;
    
    // Extract placeholders from template - only use what's in the template
    placeholders = extractPlaceholders(settings.messageTemplate || '');
    
    // Only ensure phone_number is included as it's mandatory
    if (!placeholders.includes('phone_number')) {
        placeholders.unshift('phone_number');
    }
    
    // Initialize column mapping
    columnMapping = {};
    placeholders.forEach(placeholder => {
        // Try to find a matching header
        const matchingHeader = findMatchingHeader(placeholder, columnHeaders);
        columnMapping[placeholder] = matchingHeader || '';
    });
    
    // Redesign the mapping UI with two columns side by side
    const mappingContainer = document.getElementById('columnMappingContainer');
    mappingContainer.innerHTML = '';
    
    // Create a header row
    const headerRow = document.createElement('div');
    headerRow.className = 'mapping-header-row';
    headerRow.innerHTML = `
        <div class="mapping-header-left"><strong>Message Template Fields</strong></div>
        <div class="mapping-header-center"></div>
        <div class="mapping-header-right"><strong>Excel/CSV Columns</strong></div>
    `;
    mappingContainer.appendChild(headerRow);
    
    // Add a divider
    const divider = document.createElement('div');
    divider.className = 'mapping-divider';
    mappingContainer.appendChild(divider);
    
    // Create a container for the template preview
    const previewContainer = document.createElement('div');
    previewContainer.className = 'template-preview-container';
    previewContainer.innerHTML = `
        <h4>Message Template Preview</h4>
        <div id="template-preview" class="template-preview"></div>
    `;
    
    // Create rows for each placeholder
    placeholders.forEach(placeholder => {
        const row = document.createElement('div');
        row.className = 'mapping-row';
        
        const placeholderDiv = document.createElement('div');
        placeholderDiv.className = 'mapping-placeholder';
        
        // Mark phone_number as mandatory
        if (placeholder === 'phone_number') {
            placeholderDiv.textContent = `{${placeholder}} *`;
            placeholderDiv.style.color = 'red'; // Highlight in red to indicate it's mandatory
        } else {
            placeholderDiv.textContent = `{${placeholder}}`;
        }
        
        const arrow = document.createElement('div');
        arrow.className = 'mapping-arrow';
        arrow.innerHTML = '&rarr;';
        
        const select = document.createElement('select');
        select.className = 'mapping-select';
        select.setAttribute('data-placeholder', placeholder);
        
        // Add empty option
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = '-- Select Column --';
        select.appendChild(emptyOption);
        
        // Add column headers as options
        columnHeaders.forEach(header => {
            const option = document.createElement('option');
            option.value = header;
            option.textContent = header;
            if (columnMapping[placeholder] === header) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        
        // Add event listener to update mapping when selection changes
        select.addEventListener('change', (e) => {
            const placeholder = e.target.getAttribute('data-placeholder');
            columnMapping[placeholder] = e.target.value;
            
            // Update the template preview when mapping changes
            updateTemplatePreview();
        });
        
        row.appendChild(placeholderDiv);
        row.appendChild(arrow);
        row.appendChild(select);
        
        mappingContainer.appendChild(row);
    });
    
    // Add the preview container after all mapping rows
    mappingContainer.appendChild(previewContainer);
    
    // Show the mapping modal
    document.getElementById('mappingModal').style.display = 'block';
    
    // Update the template preview initially
    updateTemplatePreview();
    
    // Primary key selection UI has been completely removed as requested
}

// Update the template preview based on current mappings
function updateTemplatePreview() {
    const previewElement = document.getElementById('template-preview');
    if (!previewElement) return;
    
    // Get the current template text - either from settings or from the template input if it exists
    const templateInput = document.getElementById('messageTemplate');
    let templateText = templateInput ? templateInput.value : (settings.messageTemplate || '');
    
    // Extract all placeholders from the current template
    const currentPlaceholders = extractPlaceholders(templateText);
    
    // Add phone_number if it's not in the template (it's mandatory)
    if (!currentPlaceholders.includes('phone_number')) {
        currentPlaceholders.unshift('phone_number');
    }
    
    // Remove any mapping rows that are no longer in the template
    const existingRows = document.querySelectorAll('.mapping-row');
    existingRows.forEach(row => {
        const select = row.querySelector('.mapping-select');
        if (select) {
            const placeholder = select.getAttribute('data-placeholder');
            // Keep phone_number regardless, remove others if not in current placeholders
            if (placeholder !== 'phone_number' && !currentPlaceholders.includes(placeholder)) {
                row.remove();
                delete columnMapping[placeholder];
            }
        }
    });
    
    // Add any new placeholders to the mapping if they don't exist
    currentPlaceholders.forEach(placeholder => {
        if (!columnMapping.hasOwnProperty(placeholder)) {
            // Try to find a matching header for the new placeholder
            const matchingHeader = findMatchingHeader(placeholder, columnHeaders);
            columnMapping[placeholder] = matchingHeader || '';
            
            // If we're in the mapping modal, add a new row for this placeholder
            addPlaceholderRowIfNeeded(placeholder);
        }
    });
    
    // Highlight placeholders in the template
    currentPlaceholders.forEach(placeholder => {
        const isMapped = columnMapping[placeholder] && columnMapping[placeholder] !== '';
        const replacementClass = isMapped ? 'mapped-placeholder' : 'unmapped-placeholder';
        const displayValue = `<span class="${replacementClass}">{${placeholder}}</span>`;
            
        templateText = templateText.replace(
            new RegExp(`{${placeholder}}`, 'g'), 
            displayValue
        );
    });
    
    // Add line breaks for better readability
    templateText = templateText.replace(/\n/g, '<br>');
    
    // Set the preview content
    previewElement.innerHTML = templateText || '<em>No template content</em>';
}

// Add a new placeholder row to the mapping UI if it doesn't exist
function addPlaceholderRowIfNeeded(placeholder) {
    const mappingContainer = document.getElementById('columnMappingContainer');
    if (!mappingContainer) return;
    
    // Check if a row for this placeholder already exists
    const existingRow = document.querySelector(`.mapping-row [data-placeholder="${placeholder}"]`);
    if (existingRow) return; // Row already exists
    
    // Create a new row for this placeholder
    const row = document.createElement('div');
    row.className = 'mapping-row';
    
    const placeholderDiv = document.createElement('div');
    placeholderDiv.className = 'mapping-placeholder';
    
    // Mark phone_number as mandatory
    if (placeholder === 'phone_number') {
        placeholderDiv.textContent = `{${placeholder}} *`;
        placeholderDiv.style.color = 'red';
    } else {
        // Display the placeholder exactly as it appears in the template
        // This preserves the original case and format
        placeholderDiv.textContent = `{${placeholder}}`;
    }
    
    const arrow = document.createElement('div');
    arrow.className = 'mapping-arrow';
    arrow.innerHTML = '&rarr;';
    
    const select = document.createElement('select');
    select.className = 'mapping-select';
    select.setAttribute('data-placeholder', placeholder);
    
    // Add empty option
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = '-- Select Column --';
    select.appendChild(emptyOption);
    
    // Add column headers as options
    columnHeaders.forEach(header => {
        const option = document.createElement('option');
        option.value = header;
        option.textContent = header;
        if (columnMapping[placeholder] === header) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    
    // Add event listener to update mapping when selection changes
    select.addEventListener('change', (e) => {
        const placeholder = e.target.getAttribute('data-placeholder');
        columnMapping[placeholder] = e.target.value;
        
        // Update the template preview when mapping changes
        updateTemplatePreview();
    });
    
    row.appendChild(placeholderDiv);
    row.appendChild(arrow);
    row.appendChild(select);
    
    // Insert the new row before the preview container
    const previewContainer = document.querySelector('.template-preview-container');
    if (previewContainer) {
        mappingContainer.insertBefore(row, previewContainer);
    } else {
        mappingContainer.appendChild(row);
    }
}

// Find a matching header for a placeholder
function findMatchingHeader(placeholder, headers) {
    // Normalize the placeholder for better matching
    const normalizedPlaceholder = placeholder.toLowerCase().trim();
    
    // Create variations of the placeholder for matching
    let variations = [
        normalizedPlaceholder,
        normalizedPlaceholder.replace(/_/g, ''),
        normalizedPlaceholder.replace(/_/g, ' '),
        normalizedPlaceholder.replace(/ /g, '_'),
        normalizedPlaceholder.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()),
        normalizedPlaceholder.replace(/ ([a-z])/g, (_, letter) => letter.toUpperCase()),
        normalizedPlaceholder.charAt(0).toUpperCase() + normalizedPlaceholder.slice(1),
        normalizedPlaceholder.toUpperCase()
    ];
    
    // Add additional common variations for specific fields
    if (placeholder === 'student_name') {
        variations = variations.concat([
            'name', 'Name', 'NAME',
            'student', 'Student', 'STUDENT',
            'studentname', 'StudentName', 'STUDENTNAME',
            'customer', 'Customer', 'CUSTOMER',
            'customername', 'CustomerName', 'CUSTOMERNAME',
            'client', 'Client', 'CLIENT',
            'clientname', 'ClientName', 'CLIENTNAME'
        ]);
    } else if (placeholder === 'receipt_no') {
        variations = variations.concat([
            'receipt', 'Receipt', 'RECEIPT',
            'receiptno', 'ReceiptNo', 'RECEIPTNO',
            'receipt_number', 'ReceiptNumber', 'RECEIPTNUMBER',
            'invoice', 'Invoice', 'INVOICE',
            'invoiceno', 'InvoiceNo', 'INVOICENO',
            'invoice_number', 'InvoiceNumber', 'INVOICENUMBER',
            'bill', 'Bill', 'BILL',
            'billno', 'BillNo', 'BILLNO',
            'bill_number', 'BillNumber', 'BILLNUMBER'
        ]);
    } else if (placeholder === 'amount') {
        variations = variations.concat([
            'amt', 'Amt', 'AMT',
            'price', 'Price', 'PRICE',
            'payment', 'Payment', 'PAYMENT',
            'fee', 'Fee', 'FEE',
            'total', 'Total', 'TOTAL',
            'value', 'Value', 'VALUE'
        ]);
    } else if (placeholder === 'phone_number') {
        variations = variations.concat([
            'phone', 'Phone', 'PHONE',
            'phonenumber', 'PhoneNumber', 'PHONENUMBER',
            'mobile', 'Mobile', 'MOBILE',
            'mobilenumber', 'MobileNumber', 'MOBILENUMBER',
            'contact', 'Contact', 'CONTACT',
            'contactnumber', 'ContactNumber', 'CONTACTNUMBER',
            'cell', 'Cell', 'CELL',
            'cellnumber', 'CellNumber', 'CELLNUMBER',
            'whatsapp', 'Whatsapp', 'WHATSAPP'
        ]);
    }
    
    // Check if any variation matches a header
    for (const variation of variations) {
        const matchingHeader = headers.find(header => 
            header.toLowerCase() === variation.toLowerCase());
        if (matchingHeader) {
            return matchingHeader;
        }
    }
    
    // Try partial matching for headers that contain the variation
    for (const variation of variations) {
        const partialMatch = headers.find(header => 
            header.toLowerCase().includes(variation.toLowerCase()));
        if (partialMatch) {
            return partialMatch;
        }
    }
    
    return null;
}

// Extract phone number from WhatsApp link
function extractPhoneNumber(whatsappLink) {
    if (!whatsappLink) return '';
    
    // Extract just the digits from the WhatsApp link
    const match = whatsappLink.match(/wa\.me\/(\d+)/);
    return match ? match[1] : whatsappLink.replace(/\D/g, '');
}

// Check if a phone number already exists in the queue or sent messages
function isPhoneNumberDuplicate(phoneNumber) {
    if (!phoneNumber) return false;
    
    // Check in message queue
    const queueDuplicate = messages.some(msg => {
        const msgPhone = extractPhoneNumber(msg.whatsappLink);
        return msgPhone === phoneNumber;
    });
    
    // Check in sent messages
    const sentDuplicate = sentMessages.some(msg => {
        const msgPhone = extractPhoneNumber(msg.whatsappLink);
        return msgPhone === phoneNumber;
    });
    
    return queueDuplicate || sentDuplicate;
}

// Process imported data with column mapping and duplicate detection
function processImportedDataWithMapping() {
    const processedMessages = [];
    const duplicates = [];
    
    // Track missing phone numbers
    const missingPhoneNumbers = [];
    
    importedData.forEach((row, index) => {
        const processedRow = {};
        
        // Map each placeholder to its corresponding column value
        Object.keys(columnMapping).forEach(placeholder => {
            const column = columnMapping[placeholder];
            if (column) {
                // Store the value with just the original placeholder name
                const value = row[column] || '';
                processedRow[placeholder] = value;
            } else {
                processedRow[placeholder] = '';
            }
        });
        
        // Debug logging to check what's happening with the mapping
        console.log('Processed row:', processedRow);
        console.log('Column mapping:', columnMapping);
        
        // Check for mandatory phone_number field
        if (!processedRow.phone_number || processedRow.phone_number.toString().trim() === '') {
            console.log('Missing phone number for row:', index + 1);
            missingPhoneNumbers.push(index + 1); // +1 for human-readable row number
            return; // Skip this row
        }
        
        // Get phone number from the dedicated phone_number field
        // Convert to string first to handle numeric values from Excel/CSV
        let phoneNumber = processedRow.phone_number.toString().replace(/\D/g, '');
        console.log('Extracted phone number:', phoneNumber);
        
        // Ensure it doesn't already start with 91
        if (!phoneNumber.startsWith('91')) {
            phoneNumber = '91' + phoneNumber;
            console.log('Added country code, new phone number:', phoneNumber);
        }
        
        // Format WhatsApp link from the phone number
        const whatsappLink = phoneNumber ? `https://wa.me/${phoneNumber}` : '';
        console.log('Created WhatsApp link:', whatsappLink);
        
        // Skip if this is a duplicate phone number
        if (phoneNumber && isPhoneNumberDuplicate(phoneNumber)) {
            duplicates.push({
                studentName: processedRow.student_name || '',
                phoneNumber: phoneNumber,
                receiptNo: processedRow.receipt_no || ''
            });
            return; // Skip this record
        }
        
        // Create the message object with minimal standard fields
        // Primary key functionality has been removed as requested
        const messageObj = {
            recordIndex: Date.now() + (index * 1000) + Math.floor(Math.random() * 1000), // More unique recordIndex
            phoneNumber: phoneNumber, // Store the phone number directly for functionality
            whatsappLink: whatsappLink, // Store WhatsApp link for functionality
            isSent: false,
            isSnoozed: false,
            snoozedUntil: null,
            sentTime: null,
            status: 'Pending',
            importedAt: new Date().toISOString(), // Track when this was imported
            // Primary key field removed as requested
            // Store ALL fields from the mapping in customFields
            customFields: Object.keys(processedRow)
                .reduce((obj, key) => {
                    // Format values appropriately
                    let value = processedRow[key];
                    // Format currency values
                    if (key.toLowerCase().includes('amount') || 
                        key.toLowerCase().includes('price') || 
                        key.toLowerCase().includes('fee')) {
                        // If it's a number, format it
                        if (!isNaN(value)) {
                            value = value.toString();
                        }
                    }
                    // Preserve original date format from the uploaded file
                    // Do not reformat date fields - use the exact format from the source file
                    if (key.toLowerCase().includes('date') || 
                        key.toLowerCase().includes('time') || 
                        key.toLowerCase().includes('day')) {
                        // Keep the value exactly as it is in the source file
                        // No date formatting or conversion
                    }
                    obj[key] = value || '';
                    return obj;
                }, {})
        };
        
        processedMessages.push(messageObj);
        
        // Automatically add phone number to verification queue
        const cleanNumber = phoneNumber.replace(/\D/g, '');
        if (cleanNumber.length >= 7 && cleanNumber.length <= 15) {
            addVerificationNumberToQueue(cleanNumber);
        }
    });
    
    // Show summary of duplicates if any were found
    if (duplicates.length > 0) {
        const duplicateList = duplicates.map(d => `${d.studentName} (${d.phoneNumber}) - Receipt: ${d.receiptNo}`).join(', ');
        showToast(`Skipped ${duplicates.length} duplicate entries: ${duplicateList}`, 'warning');
    }
    
    // Show warning for missing phone numbers
    if (missingPhoneNumbers.length > 0) {
        const rowList = missingPhoneNumbers.join(', ');
        showToast(`Skipped ${missingPhoneNumbers.length} entries with missing phone numbers (rows: ${rowList}). Phone number is mandatory for WhatsApp messaging.`, 'warning');
    }
    
    return processedMessages;
}

// Save message template
function saveTemplate() {
    settings.messageTemplate = messageTemplate.value;
    ipcRenderer.send('save-settings', settings);
    
    // Extract placeholders for future use
    const extractedPlaceholders = extractPlaceholders(settings.messageTemplate);
    console.log('Template placeholders:', extractedPlaceholders);
    
    showToast('Message template saved successfully!', 'success');
}

// Clear history
function clearHistory() {
    console.log('🧪 clearHistory function called!');
    
    // Use toast confirmation instead of popup
    showToast('Clearing message history...', 'info');
    
    console.log('Clearing message history...');
    
    // Clear sent messages array
    sentMessages = [];
    
    // Save to main process synchronously
    try {
        const result = ipcRenderer.sendSync('save-sent-messages', sentMessages);
        if (result && result.success) {
            console.log('History cleared and saved to MongoDB successfully');
            
            // Update history count in UI
            const historyCount = document.getElementById('historyCount');
            if (historyCount) {
                historyCount.textContent = '0';
            }
            
            // Render empty history list
            renderHistoryList();
            
            // Show success toast instead of alert
            showToast('Message history has been cleared successfully.', 'success');
        } else {
            console.error('Failed to clear history in database:', result);
            showToast('Failed to clear history: ' + (result ? result.error : 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error clearing history:', error);
        showToast('Error clearing history: ' + error.message, 'error');
    }
}

// Export history
function exportHistory() {
    if (sentMessages.length === 0) {
        showToast('No sent messages to export', 'info');
        return;
    }
    
    ipcRenderer.send('export-history');
}

// Process overlay functions
function showProcessOverlay() {
    const overlay = document.getElementById('processOverlay');
    if (overlay) {
        overlay.style.display = 'block';
        resetProcessSteps();
    }
}

function hideProcessOverlay() {
    const overlay = document.getElementById('processOverlay');
    if (overlay) {
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 2000); // Keep visible for 2 more seconds after completion
    }
}

function resetProcessSteps() {
    const steps = document.querySelectorAll('.process-step');
    const progressFill = document.getElementById('progressFill');
    
    steps.forEach(step => {
        step.classList.remove('active', 'completed');
        const icon = step.querySelector('.step-icon');
        if (icon) {
            icon.classList.remove('active', 'completed');
            icon.classList.add('pending');
        }
    });
    
    if (progressFill) {
        progressFill.style.width = '0%';
    }
}

// Update process step with real-time visual feedback
function updateProcessStep(stepId, status) {
    const step = document.getElementById(`step-${stepId}`);
    const progressFill = document.getElementById('progressFill');
    const totalSteps = document.querySelectorAll('.process-step').length;
    let completedSteps = 0;
    
    if (step) {
        // Remove all status classes first
        step.classList.remove('active', 'completed');
        const icon = step.querySelector('.step-icon');
        if (icon) {
            icon.classList.remove('active', 'completed', 'pending');
        }
        
        // Add appropriate class based on status
        if (status === 'active') {
            step.classList.add('active');
            if (icon) icon.classList.add('active');
        } else if (status === 'completed') {
            step.classList.add('completed');
            if (icon) icon.classList.add('completed');
            completedSteps++;
        }
        
        // Force browser to repaint immediately for real-time updates
        step.offsetHeight;
    }
    
    // Count completed steps for progress bar
    document.querySelectorAll('.process-step.completed').forEach(() => {
        completedSteps++;
    });
    
    // Update progress bar with animation for smooth transitions
    if (progressFill && totalSteps > 0) {
        // If a step is active, count it as half complete
        const activeStep = document.querySelector('.process-step.active') ? 0.5 : 0;
        const progress = ((completedSteps + activeStep) / totalSteps) * 100;
        
        // Use requestAnimationFrame for smoother updates
        requestAnimationFrame(() => {
            progressFill.style.width = `${progress}%`;
        });
    }
}

// Update message status in UI and data with real-time synchronization
function updateMessageStatus(recordIndex, status, isLocalOnly = false) {
    console.log(`Updating message ${recordIndex} status to ${status} (localOnly: ${isLocalOnly})`);
    
    // Find the message in all relevant arrays
    const messageIndex = messages.findIndex(msg => msg.recordIndex === recordIndex);
    const queueIndex = messageQueue.findIndex(msg => msg.recordIndex === recordIndex);
    const sentIndex = sentMessages.findIndex(msg => msg.recordIndex === recordIndex);
    
    // Create a timestamp for the status change
    const timestamp = new Date().toISOString();
    
    // Save status update to localStorage
    saveStatusToLocalStorage(recordIndex, status, timestamp);
    
    // Check if we need to move the message to history based on status
    if ((status.includes('Sent') || status.includes('sent') || status === 'Attempted') && messageIndex !== -1) {
        console.log(`Moving message ${recordIndex} to history with status: ${status}`);
        
        // Create a copy of the message
        const messageCopy = {...messages[messageIndex]};
        
        // Update status and timestamp
        messageCopy.status = status;
        messageCopy.lastUpdated = timestamp;
        messageCopy.sentTime = timestamp;
        
        // Get phone number to remove from verification queue
        const phoneNumber = messageCopy.phoneNumber || (messageCopy.customFields && messageCopy.customFields.phone_number);
        if (phoneNumber) {
            const cleanPhoneForVerification = phoneNumber.toString().replace(/\D/g, '');
            // Remove from verification queue after successful send
            const verificationIndex = verificationQueue.findIndex(item => item.number === cleanPhoneForVerification);
            if (verificationIndex !== -1) {
                verificationQueue.splice(verificationIndex, 1);
                // Save updated verification queue
                ipcRenderer.sendSync('save-verification-queue', verificationQueue);
                console.log(`Removed ${cleanPhoneForVerification} from verification queue after successful send`);
            }
        }
        
        // Remove from messages array
        messages.splice(messageIndex, 1);
        
        // Add to sent messages
        sentMessages.unshift(messageCopy);
        
        // Update UI immediately
        renderMessageList();
        renderHistoryList();
        
        // Update verification UI if active
        if (document.getElementById('verify').classList.contains('active')) {
            renderVerificationList();
            updateVerificationStatus();
        }
    } else {
        // Just update status without moving
        if (messageIndex !== -1) {
            // Update status in local array
            messages[messageIndex].status = status;
            messages[messageIndex].lastUpdated = timestamp;
            
            // Update UI immediately
            renderMessageList();
        }
        
        if (sentIndex !== -1) {
            // Update status in sent messages array
            sentMessages[sentIndex].status = status;
            sentMessages[sentIndex].lastUpdated = timestamp;
            
            // Update UI immediately
            renderHistoryList();
        }
        
        if (queueIndex !== -1) {
            // Update status in queue array
            messageQueue[queueIndex].status = status;
            messageQueue[queueIndex].lastUpdated = timestamp;
        }
    }
    
    // If this is not a local-only update, send to main process
    if (!isLocalOnly) {
        // Send status update to main process
        ipcRenderer.send('update-message-status', { recordIndex, status, timestamp });
    }
    
    // Save messages to local storage for persistence
    saveMessagesToLocalStorage();
}

// Save message status to localStorage
function saveStatusToLocalStorage(recordIndex, status, timestamp) {
    try {
        // Get existing status updates or initialize empty object
        let statusUpdates = JSON.parse(localStorage.getItem('messageStatusUpdates') || '{}');
        
        // Add or update this status
        statusUpdates[recordIndex] = {
            status,
            timestamp,
            updatedAt: new Date().toISOString()
        };
        
        // Save back to localStorage
        localStorage.setItem('messageStatusUpdates', JSON.stringify(statusUpdates));
        console.log(`Status for message ${recordIndex} saved to localStorage: ${status}`);
        return true;
    } catch (error) {
        console.error('Error saving status to localStorage:', error);
        return false;
    }
}

// Save all messages to localStorage
function saveMessagesToLocalStorage() {
    try {
        // Save queue messages
        localStorage.setItem('queueMessages', JSON.stringify(messages));
        
        // Save sent messages
        localStorage.setItem('sentMessages', JSON.stringify(sentMessages));
        
        console.log('All messages saved to localStorage');
        return true;
    } catch (error) {
        console.error('Error saving messages to localStorage:', error);
        return false;
    }
}

// Queue processing removed - individual message sending only

// Queue processing removed - individual message sending only

// Send message with sequential process (for individual message sending)
function sendMessage() {
    try {
        console.log('[DEBUG] sendMessage called. currentMessage:', currentMessage);
        if (!currentMessage) {
            console.error('[DEBUG] No current message to send');
            ipcRenderer.send('show-notification', {
                title: 'Error',
                message: 'No message selected to send',
                type: 'error'
            });
            return;
        }
        // Check if the number is verified
        const phoneNumber = normalizePhoneNumber(currentMessage.phoneNumber || (currentMessage.customFields && currentMessage.customFields.phone_number) || '');
        const verificationStatus = getVerificationStatus(phoneNumber);
        console.log('[DEBUG] Verification status:', verificationStatus);
        if (verificationStatus !== 'verified') {
            let errorMessage = '';
            switch (verificationStatus) {
                case 'not-verified':
                    errorMessage = 'Cannot send: Number is not on WhatsApp';
                    break;
                case 'verifying':
                    errorMessage = 'Cannot send: Verification in progress';
                    break;
                case 'pending':
                    errorMessage = 'Cannot send: Number not verified yet. Please verify the number first.';
                    break;
                default:
                    errorMessage = 'Cannot send: Verification status unknown';
            }
            console.error('[DEBUG] Early return:', errorMessage);
            showToast(errorMessage, 'error');
            return;
        }
        // Copy the message text to clipboard
        const formattedMessage = formatMessage(currentMessage);
        try {
            const tempTextarea = document.createElement('textarea');
            tempTextarea.value = formattedMessage;
            tempTextarea.style.position = 'fixed';
            tempTextarea.style.opacity = '0';
            document.body.appendChild(tempTextarea);
            tempTextarea.select();
            document.execCommand('copy');
            document.body.removeChild(tempTextarea);
            showToast('Message text copied to clipboard!', 'success');
        } catch (err) {
            console.error('[DEBUG] Error copying message text:', err);
            showToast('Failed to copy message text', 'error');
        }
        
        // Show process overlay for individual sends
        showProcessOverlay();
        
        // Process the single message using the same logic as queue processing
        processSingleMessageWithVerification(currentMessage, (success) => {
            hideProcessOverlay();
            
            if (success) {
                // Close the message modal if successful
                closeMessageModal();
                
                // Refresh the UI
                refreshMessages();
                loadSentMessages();
                renderHistoryList();
                
                showToast('Message sent and verified successfully!', 'success');
            } else {
                showToast('Message send/verification failed', 'error');
            }
        });
    } catch (error) {
        console.error('[DEBUG] Error in sendMessage function:', error);
        ipcRenderer.send('show-notification', {
            title: 'Error',
            message: `Error sending message: ${error.message}`,
            type: 'error'
        });
        hideProcessOverlay();
    }
}

// Close message modal without confirmation
// Open snooze modal
function openSnoozeModal() {
    document.getElementById('messageModal').style.display = 'none';
    document.getElementById('snoozeModal').style.display = 'block';
}

// Snooze message
function snoozeMessage(minutes) {
    if (!currentMessage) return;
    
    // Set snooze time
    currentMessage.isSnoozed = true;
    currentMessage.snoozedUntil = new Date(Date.now() + minutes * 60000).toISOString();
    
    // Update message in queue
    const index = messages.findIndex(m => m.recordIndex === currentMessage.recordIndex);
    if (index !== -1) {
        messages[index] = currentMessage;
        ipcRenderer.send('save-messages', messages);
    }
    
    // Close modals
    snoozeModal.style.display = 'none';
    
    // Refresh messages
    refreshMessages();
}

// Close message modal
function closeMessageModal() {
    messageModal.style.display = 'none';
    // Reset the current message to prevent errors
    currentMessage = null;
}

// Delete a message from the queue
function deleteMessage(recordIndex) {
    // Show confirmation dialog
    showConfirm(
        'Are you sure you want to delete this message?', 
        'Delete Message', 
        (confirmed) => {
            if (confirmed) {
                // User confirmed - delete the message
                const index = messages.findIndex(msg => msg.recordIndex === recordIndex);
                if (index !== -1) {
                    messages.splice(index, 1);
                    saveMessages();
                    renderMessageList();
                    showToast('Message deleted successfully.', 'success');
                }
            }
        }
    );
}

// Handle IPC events for file imports
ipcRenderer.on('excel-imported', (event, data) => {
    if (data && data.headers && data.rows && data.rows.length > 0) {
        openColumnMappingModal(data.rows, data.headers);
    } else {
        showToast('No data found in the Excel file or the file format is not supported.', 'error');
    }
});

ipcRenderer.on('csv-imported', (event, data) => {
    if (data && data.headers && data.rows && data.rows.length > 0) {
        openColumnMappingModal(data.rows, data.headers);
    } else {
        showToast('No data found in the CSV file or the file format is not supported.', 'error');
    }
});

ipcRenderer.on('refresh-messages', () => {
    refreshMessages();
});

ipcRenderer.on('all-data-imported', () => {
    refreshMessages();
});

// Handle notification click to show message details
ipcRenderer.on('show-message', (event, recordIndex) => {
// Switch to messages tab first
switchTab('messages');
        
// Find the message in the queue
const message = messages.find(msg => msg.recordIndex === recordIndex);
        
if (message) {
// Open the message details
openMessageDetails(message);
} else {
showToast('Message not found in queue', 'error');
}
});

// Handle export history response
ipcRenderer.on('history-exported', (event, filePath) => {
showToast(`History exported to: ${filePath}`, 'success');
});

// ===== VERIFICATION FUNCTIONS =====

// Load verification queue from main process
function loadVerificationQueue() {
    try {
        const result = ipcRenderer.sendSync('get-verification-queue');
        verificationQueue = result || [];
        
        // Always re-render message list to update verification status indicators after loading
        renderMessageList();
        
        // Update UI if verification tab is active
        if (document.getElementById('verify').classList.contains('active')) {
            renderVerificationList();
            updateVerificationStatus();
        }
    } catch (error) {
        console.error('Error loading verification queue:', error);
        verificationQueue = [];
    }
}

// Render verification list
function renderVerificationList() {
    if (!verificationList) {
        console.warn('Verification list element not found');
        return;
    }
    
    if (verificationQueue.length === 0) {
        verificationList.innerHTML = `
            <div class="empty-state">
                <p>No numbers to verify. Add some numbers to get started.</p>
            </div>
        `;
        return;
    }
    
    console.log('Rendering verification list with', verificationQueue.length, 'items');
    
    const html = verificationQueue.map((item, index) => {
        const statusClass = item.status;
        let statusText = item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('-', ' ');
        const timestamp = new Date(item.timestamp).toLocaleString();
        
        // Update status text for not-verified
        if (item.status === 'not-verified') {
            statusText = 'Not in WhatsApp';
        } else if (item.status === 'verifying') {
            statusText = 'Verifying...';
        }
        
        console.log(`Rendering item ${index}: ${item.number} (${item.status})`);
        
        return `
            <div class="verification-item ${statusClass}" data-index="${index}">
                <div class="verification-info">
                    <div class="verification-number">
                        ${(() => {
                            let displayNumber = item.number;
                            if (displayNumber.length === 12 && displayNumber.startsWith('91')) {
                                displayNumber = displayNumber.slice(2);
                            } else if (displayNumber.length === 13 && displayNumber.startsWith('9191')) {
                                displayNumber = displayNumber.slice(4);
                            } else if (displayNumber.length === 10) {
                                // already correct
                            } else if (displayNumber.length > 10 && displayNumber.endsWith(displayNumber.slice(-10))) {
                                displayNumber = displayNumber.slice(-10);
                            }
                            return '+91 ' + displayNumber;
                        })()}
                    </div>
                    <div class="verification-status ${statusClass}">${statusText}</div>
                    <div class="verification-timestamp">${timestamp}</div>
                    ${item.result && item.result.ocr_text ? `
                        <div class="verification-ocr" style="font-size: 0.8rem; color: #6c757d; margin-top: 0.25rem;">
                            OCR: ${item.result.ocr_text.substring(0, 100)}${item.result.ocr_text.length > 100 ? '...' : ''}
                        </div>
                    ` : ''}
                </div>
                <div class="verification-actions">
                    ${item.status === 'pending' ? `
                        <button class="btn btn-sm btn-primary" onclick="verifySingleNumber(${index})">Verify</button>
                        <button class="btn btn-sm btn-danger" onclick="removeVerificationItem(${index})">Remove</button>
                    ` : ''}
                    ${item.status === 'verified' ? `
                        <button class="btn btn-sm btn-success" disabled>✓ Verified</button>
                    ` : ''}
                    ${item.status === 'not-verified' ? `
                        <button class="btn btn-sm btn-danger not-in-whatsapp" disabled title="Will be skipped during verification">✗ Not in WhatsApp</button>
                    ` : ''}
                    ${item.status === 'verifying' ? `
                        <button class="btn btn-sm btn-secondary" disabled>Verifying...</button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    verificationList.innerHTML = html;
}

// Update verification status summary
function updateVerificationStatus() {
    if (!totalNumbers || !verifiedNumbers || !notVerifiedNumbers || !pendingNumbers) return;
    
    const total = verificationQueue.length;
    const verified = verificationQueue.filter(item => item.status === 'verified').length;
    const notVerified = verificationQueue.filter(item => item.status === 'not-verified').length;
    const pending = verificationQueue.filter(item => item.status === 'pending').length;
    const verifying = verificationQueue.filter(item => item.status === 'verifying').length;
    
    totalNumbers.textContent = total;
    verifiedNumbers.textContent = verified;
    notVerifiedNumbers.textContent = notVerified;
    pendingNumbers.textContent = pending + verifying;
    
    // Add a note about skipped numbers if any exist
    const skipNote = document.getElementById('skipNote');
    if (notVerified > 0) {
        if (!skipNote) {
            const note = document.createElement('div');
            note.id = 'skipNote';
            note.className = 'text-muted small mt-2';
            note.innerHTML = `<i class="fas fa-info-circle"></i> ${notVerified} number(s) marked as "Not in WhatsApp" will be skipped during verification`;
            const statusContainer = document.querySelector('.verification-status-container');
            if (statusContainer) {
                statusContainer.appendChild(note);
            }
        }
    } else if (skipNote) {
        skipNote.remove();
    }
}

// Add a number to the verification queue using IPC (shared logic)
function addNumberToVerificationQueue(phoneNumber) {
    const normalized = normalizePhoneNumber(phoneNumber);
    return ipcRenderer.sendSync('add-verification-number', normalized);
}

// Single add (used by 'Add to Verify' button)
function addVerificationNumber() {
    if (!phoneNumberInput) return;
    const phoneNumber = phoneNumberInput.value.trim();
    if (!phoneNumber) {
        showToast('Please enter a phone number', 'error');
        return;
    }
    const result = addNumberToVerificationQueue(phoneNumber);
    if (result.success) {
        phoneNumberInput.value = '';
        loadVerificationQueue();
        showToast('Number added to verification queue', 'success');
    } else {
        showToast(result.error || 'Failed to add number', 'error');
    }
}

// Force refresh verification queue and UI
function refreshVerificationQueue() {
    console.log('Force refreshing verification queue...');
    loadVerificationQueue();
    
    // Update verification tab UI
    if (document.getElementById('verify').classList.contains('active')) {
        renderVerificationList();
        updateVerificationStatus();
    }
    
    // Update message list to reflect new verification status
    renderMessageList();
}

// Add verification number to queue (for import functionality)
function addVerificationNumberToQueue(phoneNumber) {
    const normalizedNumber = normalizePhoneNumber(phoneNumber);
    console.log(`Adding verification number: ${normalizedNumber}`);
    if (normalizedNumber.length < 7 || normalizedNumber.length > 15) {
        console.log(`Invalid phone number length: ${normalizedNumber.length}`);
        return false;
    }
    const existingIndex = verificationQueue.findIndex(item => item.number === normalizedNumber);
    if (existingIndex !== -1) {
        console.log(`Number ${normalizedNumber} already exists in queue at index ${existingIndex}`);
        return false;
    }
    const verificationItem = {
        number: normalizedNumber,
        status: 'pending',
        timestamp: new Date().toISOString(),
        result: null
    };
    verificationQueue.push(verificationItem);
    const result = ipcRenderer.sendSync('save-verification-queue', verificationQueue);
    if (result && result.success) {
        refreshVerificationQueue();
        return true;
    } else {
        return false;
    }
}

// Add bulk numbers to verification queue
function addBulkVerificationNumbers() {
    if (!bulkNumbersInput) return;
    
    const numbersText = bulkNumbersInput.value.trim();
    if (!numbersText) {
        showToast('Please enter phone numbers', 'error');
        return;
    }
    
    const numbers = numbersText.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    
    if (numbers.length === 0) {
        showToast('No valid numbers found', 'error');
        return;
    }
    
    const result = ipcRenderer.sendSync('add-bulk-verification-numbers', numbers);
    if (result.results) {
        const added = result.results.filter(r => r.success).length;
        const failed = result.results.filter(r => !r.success).length;
        
        bulkNumbersInput.value = '';
        loadVerificationQueue();
        
        if (failed > 0) {
            showToast(`Added ${added} numbers, ${failed} failed`, 'warning');
        } else {
            showToast(`Added ${added} numbers to verification queue`, 'success');
        }
    } else {
        showToast(result.error || 'Failed to add numbers', 'error');
    }
}

// Start verification of all pending numbers
function startVerification() {
    if (isVerifying) {
        showToast('Verification already in progress', 'warning');
        return;
    }
    
    const pendingCount = verificationQueue.filter(item => item.status === 'pending').length;
    const notVerifiedCount = verificationQueue.filter(item => item.status === 'not-verified').length;
    
    if (pendingCount === 0) {
        if (notVerifiedCount > 0) {
            showToast(`No pending numbers to verify. ${notVerifiedCount} numbers are marked as "Not in WhatsApp" and will be skipped.`, 'warning');
        } else {
            showToast('No pending numbers to verify', 'warning');
        }
        return;
    }
    
    const message = notVerifiedCount > 0 
        ? `Start verification of ${pendingCount} numbers? ${notVerifiedCount} numbers marked as "Not in WhatsApp" will be skipped.`
        : `Start verification of ${pendingCount} numbers? This will open WhatsApp for each number.`;
    
    showConfirm(
        message,
        'Confirm Verification',
        () => {
            isVerifying = true;
            verifyAllBtn.disabled = true;
            verifyAllBtn.textContent = 'Verifying...';
            
            const result = ipcRenderer.sendSync('start-verification');
            if (!result.success) {
                showToast(result.error || 'Failed to start verification', 'error');
                isVerifying = false;
                verifyAllBtn.disabled = false;
                verifyAllBtn.textContent = 'Verify All';
            }
        }
    );
}

// Verify a single number
function verifySingleNumber(index) {
    if (isVerifying) {
        showToast('Verification already in progress', 'warning');
        return;
    }
    const item = verificationQueue[index];
    if (!item || item.status !== 'pending') {
        showToast('Invalid number or already verified', 'error');
        return;
    }
    isVerifying = true;
    item.status = 'verifying';
    item.timestamp = new Date().toISOString();
    renderVerificationList();
    updateVerificationStatus();
    // Send only this number to the main process for verification
    ipcRenderer.send('verify-whatsapp-number', {
        index,
        phoneNumber: item.number,
        recordIndex: null // or item.recordIndex if available
    });
}

// Remove verification item
function removeVerificationItem(index) {
    showConfirm(
        'Remove this number from verification queue?',
        'Confirm Removal',
        () => {
            verificationQueue.splice(index, 1);
            
            // Save the updated queue to persistent storage
            const result = ipcRenderer.sendSync('save-verification-queue', verificationQueue);
            if (result && result.success) {
                renderVerificationList();
                updateVerificationStatus();
                showToast('Number removed from queue', 'success');
            } else {
                showToast('Failed to save changes', 'error');
            }
        }
    );
}

// Clear verification results (remove all items from queue)
function clearVerificationQueue() {
    showToast('Clearing verification queue...', 'info');
    
    // Clear the entire verification queue instead of just resetting status
    verificationQueue = [];
    
    // Save the empty verification queue
    const result = ipcRenderer.sendSync('save-verification-queue', verificationQueue);
    if (result.success) {
        renderVerificationList();
        updateVerificationStatus();
        renderMessageList(); // Update message list as well since it depends on verification status
        showToast('Verification queue cleared successfully. All items removed.', 'success');
    } else {
        showToast(result.error || 'Failed to clear verification queue', 'error');
    }
}

// Export verification results
function exportVerificationResults() {
    const verifiedCount = verificationQueue.filter(item => item.status === 'verified').length;
    if (verifiedCount === 0) {
        showToast('No verified numbers to export', 'warning');
        return;
    }
    
    ipcRenderer.send('export-verification-results');
}

// Handle verification status updates
ipcRenderer.on('verification-status-update', (event, data) => {
    const { index, item } = data;
    if (verificationQueue[index]) {
        verificationQueue[index] = item;
        renderVerificationList();
        updateVerificationStatus();
    }
});

// Handle verification completion
ipcRenderer.on('verification-completed', (event, data) => {
    const { index, item } = data;
    if (verificationQueue[index]) {
        verificationQueue[index] = item;
        renderVerificationList();
        updateVerificationStatus();
        
        // Re-render message list to update verification status indicators
        renderMessageList();
        
        const status = item.status === 'verified' ? 'Verified' : 'Not Verified';
        showToast(`Number ${item.number} ${status.toLowerCase()}`, 'info');
    }
});

// Handle verification error
ipcRenderer.on('verification-error', (event, data) => {
    const { index, item } = data;
    if (verificationQueue[index]) {
        verificationQueue[index] = item;
        renderVerificationList();
        updateVerificationStatus();
        
        showToast(`Error verifying ${item.number}: ${item.result.error}`, 'error');
    }
});

// Handle verification queue completion
ipcRenderer.on('verification-queue-completed', (event) => {
    isVerifying = false;
    verifyAllBtn.disabled = false;
    verifyAllBtn.textContent = 'Verify All';

    const verifiedNumbers = verificationQueue.filter(item => item.status === 'verified').map(item => normalizePhoneNumber(item.number));
    // Filter messages to only keep those with verified numbers
    messages = messages.filter(msg => {
        let phone = msg.phoneNumber || (msg.customFields && msg.customFields.phone_number);
        phone = normalizePhoneNumber(phone || '');
        return verifiedNumbers.includes(phone);
    });
    // Save filtered messages as the new queue
    saveMessages();
    renderMessageList();

    const verifiedCount = verifiedNumbers.length;
    const totalCount = verificationQueue.length;
    showToast(`Verification completed! ${verifiedCount} out of ${totalCount} numbers verified. Only verified contacts are now in the queue.`, 'success');
});

// Handle verification export completion
ipcRenderer.on('verification-exported', (event, filePath) => {
    showToast(`Verification results exported to: ${filePath}`, 'success');
});

// Handle toast notifications from main process
ipcRenderer.on('show-toast', (event, data) => {
    showToast(data.message, data.type, data.duration);
});

// ===== TOAST NOTIFICATION SYSTEM =====

// Create toast container if it doesn't exist
function createToastContainer() {
    if (!document.getElementById('toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
}

// Show toast notification
function showToast(message, type = 'info', duration = 4000) {
    createToastContainer();
    
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const toastId = 'toast-' + Date.now();
    toast.id = toastId;
    
    toast.innerHTML = `
        <div class="toast-header">
            <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
            <button class="toast-close" onclick="closeToast('${toastId}')">&times;</button>
        </div>
        <div class="toast-message">${message}</div>
        <div class="toast-progress" style="width: 100%"></div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Animate progress bar
    const progressBar = toast.querySelector('.toast-progress');
    const startTime = Date.now();
    const animateProgress = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.max(0, 100 - (elapsed / duration) * 100);
        progressBar.style.width = progress + '%';
        
        if (progress > 0) {
            requestAnimationFrame(animateProgress);
        }
    };
    animateProgress();
    
    // Auto remove after duration
    setTimeout(() => {
        closeToast(toastId);
    }, duration);
    
    return toastId;
}

// Close specific toast
function closeToast(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

// Close all toasts
function closeAllToasts() {
    const toasts = document.querySelectorAll('.toast');
    toasts.forEach(toast => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    });
}

// Replace showAlert function with toast
function showAlert(message, type = 'info', duration = 4000) {
    showToast(message, type, duration);
}

// Replace confirm with custom confirmation toast
function showConfirm(message, title = 'Confirm', onConfirm, onCancel) {
    createToastContainer();
    
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast warning';
    
    const toastId = 'confirm-' + Date.now();
    toast.id = toastId;
    
    toast.innerHTML = `
        <div class="toast-header">
            <div class="toast-title">${title}</div>
            <button class="toast-close" onclick="closeToast('${toastId}')">&times;</button>
        </div>
        <div class="toast-message">${message}</div>
        <div style="display: flex; gap: 10px; margin-top: 15px;">
            <button class="btn btn-success" onclick="handleConfirm('${toastId}', true)">Yes</button>
            <button class="btn btn-danger" onclick="handleConfirm('${toastId}', false)">No</button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Store callbacks as function references
    toast._onConfirm = onConfirm;
    toast._onCancel = onCancel;
    
    // Animate in
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    return toastId;
}

// Helper function for dangerous confirmations (like clearing data)
function showDangerConfirm(message, title = 'Confirm', onConfirm, onCancel) {
    createToastContainer();
    
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast error';
    
    const toastId = 'danger-confirm-' + Date.now();
    toast.id = toastId;
    
    toast.innerHTML = `
        <div class="toast-header">
            <div class="toast-title">⚠️ ${title}</div>
            <button class="toast-close" onclick="closeToast('${toastId}')">&times;</button>
        </div>
        <div class="toast-message">${message}</div>
        <div style="display: flex; gap: 10px; margin-top: 15px;">
            <button class="btn btn-danger" onclick="handleConfirm('${toastId}', true)">Yes, Delete</button>
            <button class="btn btn-secondary" onclick="handleConfirm('${toastId}', false)">Cancel</button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Store callbacks as function references
    toast._onConfirm = onConfirm;
    toast._onCancel = onCancel;
    
    // Animate in
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    return toastId;
}

// Handle confirmation
function handleConfirm(toastId, confirmed) {
    const toast = document.getElementById(toastId);
    if (toast) {
        if (confirmed) {
            if (typeof toast._onConfirm === 'function') toast._onConfirm();
        } else {
            if (typeof toast._onCancel === 'function') toast._onCancel();
        }
        closeToast(toastId);
    }
}

// Helper to copy message text to clipboard
function copyMessageText(message) {
    const formattedMessage = formatMessage(message);
    try {
        const tempTextarea = document.createElement('textarea');
        tempTextarea.value = formattedMessage;
        tempTextarea.style.position = 'fixed';
        tempTextarea.style.opacity = '0';
        document.body.appendChild(tempTextarea);
        tempTextarea.select();
        document.execCommand('copy');
        document.body.removeChild(tempTextarea);
        showToast('Message text copied to clipboard!', 'success');
    } catch (err) {
        console.error('Error copying message text:', err);
        showToast('Failed to copy message text', 'error');
    }
}

// Helper functions for progress bar (if not already defined)
function showProgressBar(message) {
    // Create or show progress bar element
    let progressBar = document.getElementById('progress-bar-overlay');
    if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.id = 'progress-bar-overlay';
        progressBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            color: white;
            font-family: 'Roboto', sans-serif;
        `;
        progressBar.innerHTML = `
            <div style="text-align: center;">
                <div style="margin-bottom: 20px; font-size: 18px;">${message}</div>
                <div style="width: 300px; height: 6px; background: rgba(255,255,255,0.3); border-radius: 3px;">
                    <div style="width: 0%; height: 100%; background: #25D366; border-radius: 3px; animation: progress-animation 2s infinite;"></div>
                </div>
            </div>
        `;
        document.body.appendChild(progressBar);
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes progress-animation {
                0% { width: 0%; }
                50% { width: 70%; }
                100% { width: 100%; }
            }
        `;
        document.head.appendChild(style);
    } else {
        progressBar.style.display = 'flex';
        progressBar.querySelector('div > div').textContent = message;
    }
}

function hideProgressBar() {
    const progressBar = document.getElementById('progress-bar-overlay');
    if (progressBar) {
        progressBar.style.display = 'none';
    }
}

// Reusable function to process a single message (queue-style, but for one message only)
function processSingleMessage(message, onComplete) {
    try {
        // Get phone number
        let phoneNumber = '';
        if (message.whatsappLink && message.whatsappLink.includes('wa.me/')) {
            phoneNumber = extractPhoneNumber(message.whatsappLink);
        } else if (message.phoneNumber) {
            phoneNumber = message.phoneNumber.replace(/\D/g, '');
        } else if (message.customFields && message.customFields.phone_number) {
            phoneNumber = message.customFields.phone_number.replace(/\D/g, '');
        }
        if (!phoneNumber) {
            showToast('No valid phone number for this message.', 'error');
            if (onComplete) onComplete(false);
            return;
        }
        phoneNumber = normalizePhoneNumber(phoneNumber);
        const verificationStatus = getVerificationStatus(phoneNumber);
        if (verificationStatus !== 'verified') {
            showToast('Cannot send: Number is not verified.', 'error');
            if (onComplete) onComplete(false);
            return;
        }
        // Format and copy message
        const formattedMessage = formatMessage(message);
        try {
            const tempTextarea = document.createElement('textarea');
            tempTextarea.value = formattedMessage;
            tempTextarea.style.position = 'fixed';
            tempTextarea.style.opacity = '0';
            document.body.appendChild(tempTextarea);
            tempTextarea.select();
            document.execCommand('copy');
            document.body.removeChild(tempTextarea);
            showToast('Message text copied to clipboard!', 'success');
        } catch (err) {
            showToast('Failed to copy message text', 'error');
            if (onComplete) onComplete(false);
            return;
        }
        // Open WhatsApp
        const whatsappUrl = `whatsapp://send?phone=${phoneNumber.startsWith('91') ? phoneNumber : '91' + phoneNumber}`;
        showProcessOverlay();
        updateProcessStep('open', 'active');
        setTimeout(() => {
            const openResult = ipcRenderer.sendSync('open-whatsapp', whatsappUrl, true);
            updateProcessStep('open', 'completed');
            if (!openResult || !openResult.success) {
                showToast('Failed to open WhatsApp.', 'error');
                hideProcessOverlay();
                if (onComplete) onComplete(false);
                return;
            }
            // Simulate search, paste, send steps with delays
            setTimeout(() => {
                updateProcessStep('search', 'active');
                setTimeout(() => {
                    updateProcessStep('search', 'completed');
                    setTimeout(() => {
                        updateProcessStep('paste', 'active');
                        setTimeout(() => {
                            updateProcessStep('paste', 'completed');
                            setTimeout(() => {
                                updateProcessStep('send', 'active');
                                setTimeout(() => {
                                    updateProcessStep('send', 'completed');
                                    // Screenshot verification using primary key
                                    const { execFile } = require('child_process');
                                    const pythonPath = 'python';
                                    const scriptPath = './python/verify.py';
                                    let primaryKeyValue = '';
                                    if (window.primaryKeyField && message[window.primaryKeyField]) {
                                        primaryKeyValue = message[window.primaryKeyField];
                                    } else if (window.primaryKeyField && message.customFields && message.customFields[window.primaryKeyField]) {
                                        primaryKeyValue = message.customFields[window.primaryKeyField];
                                    }
                                    if (!primaryKeyValue) {
                                        showToast('Primary key value missing for verification', 'error');
                                        hideProcessOverlay();
                                        if (onComplete) onComplete(false);
                                        return;
                                    }
                                    showProgressBar('Verifying screenshot...');
                                    execFile(pythonPath, [scriptPath, '--verify-key', primaryKeyValue], (error, stdout, stderr) => {
                                        hideProgressBar();
                                        hideProcessOverlay();
                                        if (error) {
                                            showToast('Verification failed: ' + error.message, 'error');
                                            if (onComplete) onComplete(false);
                                            return;
                                        }
                                        let result;
                                        try { result = JSON.parse(stdout); } catch (e) { showToast('Invalid response from verification script', 'error'); if (onComplete) onComplete(false); return; }
                                        if (result.match) {
                                            // Mark as sent and save to MongoDB for real-time updates
                                            message.isSent = true;
                                            message.sentTime = new Date().toISOString();
                                            const saveResult = ipcRenderer.sendSync('save-sent-message', message);
                                            if (saveResult && saveResult.success) {
                                                renderHistoryList();
                                                showToast('Message sent successfully (screenshot verified)', 'success');
                                                if (onComplete) onComplete(true);
                                            } else {
                                                showToast('Failed to save sent message', 'error');
                                                if (onComplete) onComplete(false);
                                            }
                                        } else {
                                            showToast('Screenshot verification failed: primary key not found', 'error');
                                            if (onComplete) onComplete(false);
                                        }
                                    });
                                }, 1500);
                            }, 1500);
                        }, 1500);
                    }, 1500);
                }, 1500);
            }, 500);
        }, 500);
        // Screenshot verification using message text
        const { execFile } = require('child_process');
        const pythonPath = 'python';
        const scriptPath = './python/verify.py';
        if (!formattedMessage) {
            showToast('Message text missing for verification', 'error');
            hideProcessOverlay();
            if (onComplete) onComplete(false);
            return;
        }
        showProgressBar('Verifying message text in screenshot...');
        execFile(pythonPath, [scriptPath, '--verify-message-text', formattedMessage], (error, stdout, stderr) => {
            hideProgressBar();
            hideProcessOverlay();
            if (error) {
                showToast('Verification failed: ' + error.message, 'error');
                if (onComplete) onComplete(false);
                return;
            }
            let result;
            try { result = JSON.parse(stdout); } catch (e) { showToast('Invalid response from verification script', 'error'); if (onComplete) onComplete(false); return; }
            if (result.match) {
                // Mark as sent and save to MongoDB for real-time updates
                message.isSent = true;
                message.sentTime = new Date().toISOString();
                const saveResult = ipcRenderer.sendSync('save-sent-message', message);
                if (saveResult && saveResult.success) {
                    renderHistoryList();
                    showToast('Message sent and verified in screenshot!', 'success');
                    if (onComplete) onComplete(true);
                } else {
                    showToast('Failed to save sent message', 'error');
                    if (onComplete) onComplete(false);
                }
            } else {
                showToast('Screenshot verification failed: message text not found', 'error');
                if (onComplete) onComplete(false);
            }
        });
    } catch (error) {
        showToast('Error sending message: ' + error.message, 'error');
        hideProcessOverlay();
        if (onComplete) onComplete(false);
    }
}

// New function for processing single message with timestamp verification
function processSingleMessageWithVerification(message, onComplete) {
    try {
        // Get phone number
        let phoneNumber = '';
        if (message.whatsappLink && message.whatsappLink.includes('wa.me/')) {
            phoneNumber = extractPhoneNumber(message.whatsappLink);
        } else if (message.phoneNumber) {
            phoneNumber = message.phoneNumber.replace(/\D/g, '');
        } else if (message.customFields && message.customFields.phone_number) {
            phoneNumber = message.customFields.phone_number.replace(/\D/g, '');
        }
        
        if (!phoneNumber) {
            showToast('No valid phone number for this message.', 'error');
            if (onComplete) onComplete(false);
            return;
        }
        
        phoneNumber = normalizePhoneNumber(phoneNumber);
        const verificationStatus = getVerificationStatus(phoneNumber);
        if (verificationStatus !== 'verified') {
            showToast('Cannot send: Number is not verified.', 'error');
            if (onComplete) onComplete(false);
            return;
        }
        
        // Format and copy message
        const formattedMessage = formatMessage(message);
        
        // Ensure the phone number has country code 91
        if (!phoneNumber.startsWith('91')) {
            phoneNumber = '91' + phoneNumber;
        }
        
        // Open WhatsApp
        const whatsappUrl = `whatsapp://send?phone=${phoneNumber}`;
        
        console.log('Starting individual message send with timestamp verification');
        
        // Step 1: Opening WhatsApp
        updateProcessStep('open', 'active');
        
        setTimeout(() => {
            const openResult = ipcRenderer.sendSync('open-whatsapp', whatsappUrl, true);
            updateProcessStep('open', 'completed');
            
            if (!openResult || !openResult.success) {
                showToast('Failed to open WhatsApp.', 'error');
                if (onComplete) onComplete(false);
                return;
            }
            
            // Step 2: Searching Contact
            setTimeout(() => {
                updateProcessStep('search', 'active');
                setTimeout(() => {
                    updateProcessStep('search', 'completed');
                    
                    // Step 3: Pasting Text
                    setTimeout(() => {
                        updateProcessStep('paste', 'active');
                        setTimeout(() => {
                            updateProcessStep('paste', 'completed');
                            
                            // Step 4: Sending Message
                            setTimeout(() => {
                                updateProcessStep('send', 'active');
                                setTimeout(() => {
                                    updateProcessStep('send', 'completed');
                                    
                                    // NEW: Screenshot timestamp verification after send
                                    setTimeout(async () => {
                                        console.log('Taking screenshot and verifying timestamp for individual send...');
                                        
                                        try {
                                            const timestampResult = await ipcRenderer.invoke('verify-screenshot-timestamp');
                                            console.log('Individual send timestamp result:', timestampResult);
                                            
                                            if (timestampResult.success && timestampResult.time_matches) {
                                                console.log('✅ Individual message verified successfully - timestamps match!');
                                                console.log(`📊 First chat timestamp: ${timestampResult.first_chat_timestamp}`);
                                                console.log(`🌐 Current time: ${timestampResult.current_time}`);
                                                console.log(`⏱️ Time difference: ${timestampResult.time_difference_minutes || 0} minutes`);
                                                
                                                // Mark as sent and move to history
                                                message.isSent = true;
                                                message.sentTime = new Date().toISOString();
                                                message.status = 'Sent ✅ (Verified)';
                                                
                                                // Add verification details to message
                                                message.verificationDetails = {
                                                    firstChatTimestamp: timestampResult.first_chat_timestamp,
                                                    currentTime: timestampResult.current_time,
                                                    timeDifference: timestampResult.time_difference_minutes || 0,
                                                    verifiedAt: new Date().toISOString()
                                                };
                                                
                                                // Save to MongoDB
                                                const saveResult = ipcRenderer.sendSync('save-sent-message', message);
                                                if (saveResult && saveResult.success) {
                                                    console.log('Individual message successfully saved to history');
                                                    
                                                    // Remove from current queue if it exists
                                                    const messageIndex = messages.findIndex(m => m.recordIndex === message.recordIndex);
                                                    if (messageIndex !== -1) {
                                                        messages.splice(messageIndex, 1);
                                                        saveMessages();
                                                    }
                                                    
                                                    if (onComplete) onComplete(true);
                                                    
                                                    // Force UI refresh after successful send
                                                    setTimeout(() => {
                                                        renderMessageList();
                                                    }, 100);
                                                } else {
                                                    console.error('Failed to save individual sent message to database');
                                                    if (onComplete) onComplete(false);
                                                }
                                            } else {
                                                console.log('❌ Individual message verification failed - timestamps do not match');
                                                console.log(`📊 First chat timestamp: ${timestampResult.first_chat_timestamp || 'Not found'}`);
                                                console.log(`🌐 Current time: ${timestampResult.current_time || 'N/A'}`);
                                                console.log(`⏱️ Time difference: ${timestampResult.time_difference_minutes || 0} minutes`);
                                                console.log(`❌ Error: ${timestampResult.error || 'Timestamp mismatch'}`);
                                                
                                                // Mark as attempted but not verified  
                                                message.isSent = false;
                                                message.attemptTime = new Date().toISOString();
                                                message.status = 'Attempted - Unverified';
                                                
                                                const saveResult = ipcRenderer.sendSync('save-sent-message', message);
                                                if (saveResult && saveResult.success) {
                                                    // Remove from current queue if it exists
                                                    const messageIndex = messages.findIndex(m => m.recordIndex === message.recordIndex);
                                                    if (messageIndex !== -1) {
                                                        messages.splice(messageIndex, 1);
                                                        saveMessages();
                                                    }
                                                }
                                                
                                                if (onComplete) onComplete(false);
                                            }
                                        } catch (error) {
                                            console.error('Error during individual message timestamp verification:', error);
                                            
                                            // Mark as attempted due to verification error
                                            message.isSent = false;
                                            message.attemptTime = new Date().toISOString();
                                            message.status = 'Attempted - Verification Failed';
                                            
                                            const saveResult = ipcRenderer.sendSync('save-sent-message', message);
                                            if (saveResult && saveResult.success) {
                                                // Remove from current queue if it exists
                                                const messageIndex = messages.findIndex(m => m.recordIndex === message.recordIndex);
                                                if (messageIndex !== -1) {
                                                    messages.splice(messageIndex, 1);
                                                    saveMessages();
                                                }
                                            }
                                            
                                            if (onComplete) onComplete(false);
                                        }
                                    }, 2000); // Wait 2 seconds after send for screenshot
                                }, 1500);
                            }, 1500);
                        }, 1500);
                    }, 1500);
                }, 1500);
            }, 500);
        }, 500);
    } catch (error) {
        showToast('Error sending message: ' + error.message, 'error');
        if (onComplete) onComplete(false);
    }
}

ipcRenderer.on('message-sent-enter', () => {
    // Find the message that was just sent
    let msg = null;
    if (typeof currentQueueIndex !== 'undefined' && Array.isArray(messageQueue) && messageQueue[currentQueueIndex]) {
        msg = messageQueue[currentQueueIndex];
    } else if (typeof currentMessage !== 'undefined' && currentMessage) {
        msg = currentMessage;
    }
    if (msg) {
        let pkValue = msg.primaryKey;
        if (!pkValue && window.primaryKeyField) {
            if (msg[window.primaryKeyField]) {
                pkValue = msg[window.primaryKeyField];
            } else if (msg.customFields && msg.customFields[window.primaryKeyField]) {
                pkValue = msg.customFields[window.primaryKeyField];
            }
        }
        console.log('Primary Key (after Enter sent):', pkValue);
        ipcRenderer.send('log-primary-key', pkValue);
    } else {
        console.log('Primary Key (after Enter sent): [Message not found]');
        ipcRenderer.send('log-primary-key', '[Message not found]');
    }
});
