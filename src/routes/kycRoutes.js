// src/routes/verificationRoutes.js
const express = require("express");
const router = express.Router();

// --- Import Middleware ---
const { protect, authorize } = require("../middlewares/authMiddleware");
const upload = require("../config/multer"); // Assuming you have a Multer configuration for file uploads

// --- Import Controllers ---
const verificationController = require("../controllers/verificationController");

// Middleware stack for all authenticated user routes
const AUTH_USER = [protect];


/* =====================================================
   1. USER SELF-SERVICE ENDPOINTS (Patient & Practitioner)
===================================================== */

// @route GET /api/v1/verification/me
// @desc Get the verification status and details for the authenticated user
// @access Private/Authenticated User
router.get(
  "/me", 
  AUTH_USER, 
  verificationController.getMyVerification
);

// @route PUT /api/v1/verification/documents
// @desc Upload a verification document (e.g., ID, license) and update the record status
// @access Private/Authenticated User
// The upload middleware handles the file saving and attaches details to req.file
router.put(
  "/documents", 
  AUTH_USER, 
  upload.single('document'), // Expecting one file with the field name 'document'
  verificationController.uploadDocument
);


/* =====================================================
   2. ADMIN REVIEW ENDPOINTS
   (These routes are typically included in adminRoutes.js, 
    but are listed here for clarity on the controller's use)
===================================================== */

// @route GET /api/v1/verification/admin/list
// @desc Admin: Get all pending verification submissions for review
// @access Private/Admin
router.get(
  "/admin/list", 
  [protect, authorize(['admin'])], 
  verificationController.adminListSubmissions
);

// @route PUT /api/v1/verification/admin/:id/review
// @desc Admin: Approve or reject a specific verification record
// @access Private/Admin
router.put(
  "/admin/:id/review", 
  [protect, authorize(['admin'])], 
  verificationController.adminReviewVerification
);


module.exports = router;