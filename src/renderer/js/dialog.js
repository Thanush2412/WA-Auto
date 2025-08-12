// Custom Dialog System
// Provides modern, styled alternatives to browser alert, confirm, and prompt dialogs

/**
 * Show a custom alert dialog
 * @param {string} message - The message to display
 * @param {string} title - Optional title for the dialog
 * @param {Function} callback - Optional callback function to execute after dialog is closed
 */
function showAlert(message, title = 'Alert', callback = null) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'custom-dialog-overlay';
    
    // Create dialog
    const dialog = document.createElement('div');
    dialog.className = 'custom-dialog';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'custom-dialog-header';
    
    const headerTitle = document.createElement('h3');
    headerTitle.textContent = title;
    header.appendChild(headerTitle);
    
    // Create body
    const body = document.createElement('div');
    body.className = 'custom-dialog-body';
    body.textContent = message;
    
    // Create footer
    const footer = document.createElement('div');
    footer.className = 'custom-dialog-footer';
    
    const okButton = document.createElement('button');
    okButton.className = 'custom-dialog-btn custom-dialog-btn-primary';
    okButton.textContent = 'OK';
    okButton.addEventListener('click', () => {
        document.body.removeChild(overlay);
        if (callback) callback(true);
    });
    
    footer.appendChild(okButton);
    
    // Assemble dialog
    dialog.appendChild(header);
    dialog.appendChild(body);
    dialog.appendChild(footer);
    overlay.appendChild(dialog);
    
    // Add to document
    document.body.appendChild(overlay);
    
    // Focus OK button
    setTimeout(() => okButton.focus(), 100);
}

/**
 * Show a custom confirmation dialog
 * @param {string} message - The message to display
 * @param {string} title - Optional title for the dialog
 * @param {Function} callback - Callback function that receives the result (true/false)
 */
function showConfirm(message, title = 'Confirm', callback) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'custom-dialog-overlay';
    
    // Create dialog
    const dialog = document.createElement('div');
    dialog.className = 'custom-dialog';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'custom-dialog-header';
    
    const headerTitle = document.createElement('h3');
    headerTitle.textContent = title;
    header.appendChild(headerTitle);
    
    // Create body
    const body = document.createElement('div');
    body.className = 'custom-dialog-body';
    body.textContent = message;
    
    // Create footer
    const footer = document.createElement('div');
    footer.className = 'custom-dialog-footer';
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'custom-dialog-btn custom-dialog-btn-secondary';
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', () => {
        document.body.removeChild(overlay);
        if (callback) callback(false);
    });
    
    const okButton = document.createElement('button');
    okButton.className = 'custom-dialog-btn custom-dialog-btn-primary';
    okButton.textContent = 'OK';
    okButton.addEventListener('click', () => {
        document.body.removeChild(overlay);
        if (callback) callback(true);
    });
    
    footer.appendChild(cancelButton);
    footer.appendChild(okButton);
    
    // Assemble dialog
    dialog.appendChild(header);
    dialog.appendChild(body);
    dialog.appendChild(footer);
    overlay.appendChild(dialog);
    
    // Add to document
    document.body.appendChild(overlay);
    
    // Focus OK button
    setTimeout(() => okButton.focus(), 100);
}

/**
 * Show a custom danger confirmation dialog (for destructive actions)
 * @param {string} message - The message to display
 * @param {string} title - Optional title for the dialog
 * @param {Function} callback - Callback function that receives the result (true/false)
 */
function showDangerConfirm(message, title = 'Warning', callback) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'custom-dialog-overlay';
    
    // Create dialog
    const dialog = document.createElement('div');
    dialog.className = 'custom-dialog';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'custom-dialog-header';
    
    const headerTitle = document.createElement('h3');
    headerTitle.textContent = title;
    header.appendChild(headerTitle);
    
    // Create body
    const body = document.createElement('div');
    body.className = 'custom-dialog-body';
    body.textContent = message;
    
    // Create footer
    const footer = document.createElement('div');
    footer.className = 'custom-dialog-footer';
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'custom-dialog-btn custom-dialog-btn-secondary';
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', () => {
        document.body.removeChild(overlay);
        if (callback) callback(false);
    });
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'custom-dialog-btn custom-dialog-btn-danger';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => {
        document.body.removeChild(overlay);
        if (callback) callback(true);
    });
    
    footer.appendChild(cancelButton);
    footer.appendChild(deleteButton);
    
    // Assemble dialog
    dialog.appendChild(header);
    dialog.appendChild(body);
    dialog.appendChild(footer);
    overlay.appendChild(dialog);
    
    // Add to document
    document.body.appendChild(overlay);
    
    // Focus cancel button for destructive actions
    setTimeout(() => cancelButton.focus(), 100);
}
