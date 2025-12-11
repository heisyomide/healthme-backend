/**
 * @file multer.js
 * @desc Multer configuration for handling file uploads, particularly KYC documents.
 * Sets storage destination, file name, allowed mime types, and size limits.
 */
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // Used for generating unique file names

// ======================================================
// 1. Storage Configuration (Disk Storage)
// ======================================================

const storage = multer.diskStorage({
    // Define the destination where files will be saved
    destination: (req, file, cb) => {
        // Use path.join to create a reliable absolute path.
        // Assumes this file (multer.js) is in src/config, so we go up one (..) 
        // to src/, and then navigate to uploads/kyc.
        const uploadPath = path.join(__dirname, '..', 'uploads', 'kyc');

        // Note: The uploads/kyc directory should be created during server startup (in app.js)
        // to avoid runtime errors if it doesn't exist.
        cb(null, uploadPath);
    },
    
    // Define the filename structure
    filename: (req, file, cb) => {
        // Create a unique name: fieldName-timestamp-uuid.ext
        const uniqueSuffix = Date.now() + '-' + uuidv4();
        // Get the original file extension
        const ext = path.extname(file.originalname);
        
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    },
});

// ======================================================
// 2. File Filtering (MIME Type Validation)
// ======================================================

/**
 * @desc Filters uploaded files to ensure only specified document types are allowed.
 * @param {object} req - Express request object.
 * @param {object} file - File object from Multer.
 * @param {function} cb - Callback function (error, boolean).
 */
const fileFilter = (req, file, cb) => {
    // Allowed Mime Types: JPEG, PNG, PDF
    const allowedMimeTypes = [
        'image/jpeg', 
        'image/png', 
        'application/pdf'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        // Accept the file
        cb(null, true); 
    } else {
        // Reject the file and provide a specific error message
        cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'), false);
    }
};

// ======================================================
// 3. Multer Initialization
// ======================================================

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        // Set file size limit to 5MB (in bytes)
        fileSize: 5 * 1024 * 1024, 
    },
});

module.exports = upload;