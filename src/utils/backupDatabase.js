// src/utils/backupDatabase.js
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure you have MongoDB utilities (mongodump) installed and accessible in your PATH.

const BACKUP_DIR = path.join(__dirname, '..', '..', 'backups');
const DB_NAME = process.env.MONGO_DB_NAME; // Get the database name from environment
const DB_URI = process.env.MONGO_URI; // Your full connection string

/**
 * @desc Executes a mongodump command to backup the current database.
 */
const backupDatabase = () => {
    if (!DB_URI) {
        console.error("MONGO_URI not found. Cannot run backup.");
        return;
    }
    
    // Create the backup directory if it doesn't exist
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    // Use a timestamp for the folder name
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, timestamp);

    console.log(`Starting backup of database ${DB_NAME} to ${backupPath}...`);

    // The mongodump command using the full URI
    // For production, consider using authentication parameters instead of the full URI if required.
    const command = `mongodump --uri="${DB_URI}" --out="${backupPath}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Backup failed. Error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`mongodump stderr: ${stderr}`);
        }
        console.log(`Database backup successful at: ${backupPath}`);
        // Optional: Clean up older backups here
    });
};

module.exports = backupDatabase;

// NOTE: You would typically run this using a scheduler:
// const backupDatabase = require('./utils/backupDatabase');
// setInterval(backupDatabase, 1000 * 60 * 60 * 24); // Run every 24 hours