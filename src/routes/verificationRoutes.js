/**
 * @file verificationRoutes.js
 * @desc API routes for handling practitioner verification and KYC (Know Your Customer) documents.
 * These routes manage document uploads, viewing, and verification status updates by administrators.
 */
const express = require('express');

// Middleware & Configuration Imports
const { protect, authorize } = require('../middlewares/authMiddleware');
// Multer configuration for file uploads (must be created as 'src/config/multer.js')
const upload = require('../config/multer'); 

// Controller Imports
// We need to import the functions needed by THIS router. 
// Note: Admin routes for verification are in adminRoutes.js
const { 
    uploadKycDocument, 
    getKycStatus, 
    deleteKycDocument,
    // Admin functions needed for the admin routes linked in the previous step:
    adminListSubmissions,
    adminReviewVerification,
    getKycDocument // Admin file view
} = require('../controllers/verificationController');

const router = express.Router();

// ======================================================
// Practitioner (Private) Routes (KYC Submission)
// ======================================================

// @route   POST /api/v1/verification/kyc/upload
// @desc    Upload a single KYC document (e.g., medical license, photo ID)
// @access  Private/Practitioner
router.post( // <-- This is line 33, now fixed by ensuring uploadKycDocument is exported as a function
    '/kyc/upload',
    protect,
    authorize(['practitioner']),
    // Multer middleware: handle single file upload with field name 'document'
    upload.single('document'), 
    uploadKycDocument
);

// @route   GET /api/v1/verification/kyc/status
// @desc    Get the practitioner's current verification status
// @access  Private/Practitioner
router.get(
    '/kyc/status', 
    protect, 
    authorize(['practitioner']), 
    getKycStatus
);

// @route   DELETE /api/v1/verification/kyc/:documentId
// @desc    Practitioner deletes a previously uploaded document
// @access  Private/Practitioner
router.delete(
    '/kyc/:documentId', 
    protect, 
    authorize(['practitioner']), 
    deleteKycDocument
);

// ======================================================
// Admin (Private) Routes - Shared with adminRoutes.js
// NOTE: These routes are usually defined in adminRoutes.js, but included here 
// for completeness based on previous context. If they are in adminRoutes.js, 
// they should be removed from here to prevent duplicate route definitions.
// ======================================================

/*
// @route   GET /api/v1/verification/admin/list (Matches adminRoutes.js)
// @desc    Admin: Get list of all practitioners with pending verification
// @access  Private/Admin
router.get(
    '/admin/list', 
    protect, 
    authorize(['admin']), 
    adminListSubmissions
);

// @route   PUT /api/v1/verification/admin/:id/review (Matches adminRoutes.js)
// @desc    Admin: Update the verification status for a specific practitioner
// @access  Private/Admin
router.put(
    '/admin/:id/review', 
    protect, 
    authorize(['admin']), 
    adminReviewVerification
);

// @route   GET /api/v1/verification/admin/document/:documentPath
// @desc    Admin: Retrieve a specific uploaded document (serving the file securely)
// @access  Private/Admin
router.get(
    '/admin/document/:documentPath', 
    protect, 
    authorize(['admin']), 
    getKycDocument
);
*/


module.exports = router;