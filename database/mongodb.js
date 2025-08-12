// MongoDB Service for WhatsApp Automation
const { MongoClient } = require('mongodb');
const log = require('electron-log');

// MongoDB connection string
const uri = "mongodb+srv://thanushkrishna13:gvrU2W4e0cCOtzrp@cluster0.crjxlht.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

// Database and collection names
const DB_NAME = 'whatsapp_automation';
const COLLECTIONS = {
  MESSAGES: 'messages',
  SENT_MESSAGES: 'sent_messages',
  SETTINGS: 'settings'
};

// Connect to MongoDB
async function connect() {
  try {
    await client.connect();
    log.info('Connected to MongoDB');
    return client.db(DB_NAME);
  } catch (error) {
    log.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

// Get database instance
async function getDb() {
  try {
    return client.db(DB_NAME);
  } catch (error) {
    log.error('Error getting database:', error);
    return await connect();
  }
}

// Save messages to MongoDB
async function saveMessages(messages) {
  try {
    const db = await getDb();
    const collection = db.collection(COLLECTIONS.MESSAGES);
    
    // Insert or update messages to avoid duplicates
    if (messages && messages.length > 0) {
      const operations = messages.map(message => {
        // Create a clean copy without _id to avoid immutable field errors
        const cleanMessage = {};
        Object.keys(message).forEach(key => {
          if (key !== '_id') {
            cleanMessage[key] = message[key];
          }
        });
        
        return {
          replaceOne: {
            filter: { recordIndex: message.recordIndex }, // Use recordIndex as unique identifier
            replacement: cleanMessage,
            upsert: true
          }
        };
      });
      
      await collection.bulkWrite(operations);
      log.info(`Saved/updated ${messages.length} messages to MongoDB`);
    } else {
      // If no messages, clear the collection
      await collection.deleteMany({});
      log.info('Cleared all messages from MongoDB');
    }
    return true;
  } catch (error) {
    log.error('Error saving messages to MongoDB:', error);
    return false;
  }
}

// Get messages from MongoDB
async function getMessages() {
  try {
    const db = await getDb();
    const collection = db.collection(COLLECTIONS.MESSAGES);
    const messages = await collection.find({}).toArray();
    log.info(`Retrieved ${messages.length} messages from MongoDB`);
    return messages;
  } catch (error) {
    log.error('Error getting messages from MongoDB:', error);
    return [];
  }
}

// Save a single sent message to MongoDB
async function saveSentMessage(message) {
  try {
    const db = await getDb();
    const collection = db.collection(COLLECTIONS.SENT_MESSAGES);
    
    // Add timestamp if not present
    if (!message.sentTime) {
      message.sentTime = new Date().toISOString();
    }
    
    // Insert the single message (use upsert to avoid duplicates)
    const result = await collection.replaceOne(
      { recordIndex: message.recordIndex }, // Match by recordIndex
      message,
      { upsert: true } // Insert if not exists, update if exists
    );
    
    log.info(`Saved sent message with recordIndex: ${message.recordIndex}`);
    return result;
  } catch (error) {
    log.error('Error saving sent message:', error);
    throw error;
  }
}

// Save sent messages to MongoDB
async function saveSentMessages(messages) {
  try {
    const db = await getDb();
    const collection = db.collection(COLLECTIONS.SENT_MESSAGES);
    
    // Clear existing sent messages
    await collection.deleteMany({});
    
    // Insert new sent messages if there are any
    if (messages && messages.length > 0) {
      await collection.insertMany(messages);
    }
    
    log.info(`Saved ${messages ? messages.length : 0} sent messages to MongoDB`);
    return true;
  } catch (error) {
    log.error('Error saving sent messages to MongoDB:', error);
    return false;
  }
}

// Get sent messages from MongoDB
async function getSentMessages() {
  try {
    const db = await getDb();
    const collection = db.collection(COLLECTIONS.SENT_MESSAGES);
    const messages = await collection.find({}).toArray();
    log.info(`Retrieved ${messages.length} sent messages from MongoDB`);
    return messages;
  } catch (error) {
    log.error('Error getting sent messages from MongoDB:', error);
    return [];
  }
}

// Get settings from MongoDB
async function getSettings() {
  try {
    const db = await getDb();
    if (!db) {
      log.error('Database connection not available for getSettings');
      return {};
    }

    const collection = db.collection(COLLECTIONS.SETTINGS);
    const settings = await collection.findOne({ id: 'app_settings' });
    
    if (!settings) {
      log.info('No settings found in MongoDB, returning empty settings');
      return {};
    }
    
    log.info('Settings retrieved from MongoDB:', {
      messageTemplate: settings.messageTemplate ? 'Present' : 'Missing',
      settingsKeys: Object.keys(settings)
    });
    
    // Remove MongoDB _id field
    delete settings._id;
    return settings;
  } catch (error) {
    log.error('Error getting settings from MongoDB:', error);
    log.error('Error stack:', error.stack);
    return {};
  }
}

// Save settings to MongoDB
async function saveSettings(settings) {
  try {
    // Validate settings object
    if (!settings || typeof settings !== 'object') {
      log.error('Invalid settings object:', settings);
      return false;
    }

    // Log the settings being saved
    log.info('Saving settings to MongoDB:', {
      messageTemplate: settings.messageTemplate ? 'Present' : 'Missing',
      settingsKeys: Object.keys(settings)
    });

    const db = await getDb();
    if (!db) {
      log.error('Database connection not available');
      return false;
    }

    const collection = db.collection(COLLECTIONS.SETTINGS);
    
    // Create a clean copy of settings without _id to avoid MongoDB errors
    const settingsCopy = {};
    
    // Only copy the fields we need, explicitly excluding _id
    Object.keys(settings).forEach(key => {
      if (key !== '_id') {
        settingsCopy[key] = settings[key];
      }
    });
    
    log.info('Cleaned settings object for MongoDB:', {
      originalKeys: Object.keys(settings),
      cleanedKeys: Object.keys(settingsCopy),
      hasId: settingsCopy.hasOwnProperty('id')
    });
    
    // Use updateOne with upsert instead of delete + insert to avoid duplicate key errors
    const result = await collection.updateOne(
      { id: 'app_settings' },
      { $set: { ...settingsCopy, id: 'app_settings', updatedAt: new Date() } },
      { upsert: true }
    );
    
    log.info('Settings saved to MongoDB successfully:', {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount,
      upsertedId: result.upsertedId
    });
    return true;
  } catch (error) {
    log.error('Error saving settings to MongoDB:', error);
    log.error('Error stack:', error.stack);
    return false;
  }
}

// This is a duplicate function that has been replaced by the enhanced version above

// Update message status in MongoDB
async function updateMessageStatus(recordIndex, status, timestamp) {
  try {
    const db = await getDb();
    const collection = db.collection(COLLECTIONS.MESSAGES);
    
    const result = await collection.updateOne(
      { recordIndex: recordIndex },
      { 
        $set: { 
          status: status,
          lastUpdated: timestamp
        }
      }
    );
    
    log.info(`Updated message ${recordIndex} status to ${status} in MongoDB`);
    return result;
  } catch (error) {
    log.error('Error updating message status in MongoDB:', error);
    throw error;
  }
}

// Close MongoDB connection
async function close() {
  try {
    await client.close();
    log.info('MongoDB connection closed');
    return true;
  } catch (error) {
    log.error('Error closing MongoDB connection:', error);
    return false;
  }
}

module.exports = {
  connect,
  getDb,
  saveMessages,
  getMessages,
  saveSentMessage,
  saveSentMessages,
  getSentMessages,
  saveSettings,
  getSettings,
  updateMessageStatus,
  close
};
