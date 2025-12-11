// src/routes/adminRoutes.js
const express = require("express");
const router = express.Router();

// --- Import Middleware ---
const { protect, authorize } = require("../middlewares/authMiddleware");

// --- Import Controllers ---
const adminController = require("../controllers/adminController");
const verificationController = require("../controllers/verificationController");
const transactionController = require("../controllers/transactionController");

// The middleware stack for all admin routes: 
// 1. protect: Checks for a valid JWT.
// 2. authorize(['admin']): Ensures the user has the 'admin' role.
const ADMIN_AUTH = [protect, authorize(['admin'])];


/* =====================================================
   1. DASHBOARD AND SYSTEM OVERVIEW
===================================================== */

// @route GET /api/v1/admin/dashboard-stats
// @desc Get key system metrics (user counts, pending tasks)
// @access Private/Admin
router.get(
  "/dashboard-stats", 
  ADMIN_AUTH, 
  adminController.getDashboardStats
);



/* =====================================================
   2. USER AND PROFILE MANAGEMENT
===================================================== */

// @route GET /api/v1/admin/users
// @desc Get list of all users (Practitioners/Patients) with filtering
// @access Private/Admin
router.get(
  "/users", 
  ADMIN_AUTH, 
  adminController.getAllUsers
);

// @route PUT /api/v1/admin/user/:id/suspend
// @desc Deactivate/Suspend a specific user profile
// @access Private/Admin
router.put(
  "/user/:id/suspend", 
  ADMIN_AUTH, 
  adminController.suspendUser
);



/* =====================================================
   3. VERIFICATION (KYC/KYP) MANAGEMENT
===================================================== */

// @route GET /api/v1/admin/verification/list
// @desc Get all pending verification submissions
// @access Private/Admin
router.get(
  "/verification/list", 
  ADMIN_AUTH, 
  verificationController.adminListSubmissions
);

// @route PUT /api/v1/admin/verification/:id/review
// @desc Approve or reject a specific verification record
// @access Private/Admin
router.put(
  "/verification/:id/review", 
  ADMIN_AUTH, 
  verificationController.adminReviewVerification
);


/* =====================================================
   4. FINANCIAL AND AUDIT LOGS
===================================================== */

// @route GET /api/v1/admin/transactions
// @desc Get all transactions with filtering options
// @access Private/Admin
router.get(
  "/transactions", 
  ADMIN_AUTH, 
  transactionController.getAllTransactions
);

// @route GET /api/v1/admin/transactions/revenue-report
// @desc Get aggregated financial report (monthly revenue)
// @access Private/Admin
router.get(
  "/transactions/revenue-report", 
  ADMIN_AUTH, 
  transactionController.getRevenueReport
);


module.exports = router;