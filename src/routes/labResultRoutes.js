/**
 * @file labResultRoutes.js
 * @desc API routes for lab result management and tracking.
 */
const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middlewares/authMiddleware');

const {
    createLabResult,
    getMyLabResults,
    getLabResultById,
} = require('../controllers/labResultController');

/* =====================================================
   CORE LAB RESULT ROUTES
===================================================== */

// @route   POST /api/v1/labresults
// @desc    Record a new lab result for a patient
// @access  Private/Practitioner
router.post(
    '/',
    protect,
    authorize(['practitioner']),
    createLabResult
);

// @route   GET /api/v1/labresults/my
// @desc    Get all lab results for the authenticated user (Patient or Practitioner)
// @access  Private/Authenticated User
router.get(
    '/my',
    protect,
    getMyLabResults
);

// @route   GET /api/v1/labresults/:id
// @desc    Get a single detailed lab result
// @access  Private/Authenticated User
router.get(
    '/:id',
    protect,
    getLabResultById
);

// (Future: PUT /api/v1/labresults/:id for Admin/Practitioner updates)

module.exports = router;