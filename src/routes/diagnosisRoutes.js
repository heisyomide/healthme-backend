/**
 * @file diagnosisRoutes.js
 * @desc API routes for diagnosis management.
 */
const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middlewares/authMiddleware');

const {
    createDiagnosis,
    getMyDiagnoses,
    updateDiagnosis,
} = require('../controllers/diagnosisController');

/* =====================================================
   CORE DIAGNOSIS ROUTES
===================================================== */

// @route   POST /api/v1/diagnosis
// @desc    Record a new diagnosis for a patient
// @access  Private/Practitioner
router.post(
    '/',
    protect,
    authorize(['practitioner']),
    createDiagnosis
);

// @route   GET /api/v1/diagnosis/my
// @desc    Get diagnosis history for the authenticated user (Patient or Practitioner)
// @access  Private/Authenticated User
router.get(
    '/my',
    protect,
    getMyDiagnoses
);

// @route   PUT /api/v1/diagnosis/:id
// @desc    Update an existing diagnosis record
// @access  Private/Practitioner
router.put(
    '/:id',
    protect,
    authorize(['practitioner']),
    updateDiagnosis
);

// (Future: DELETE /api/v1/diagnosis/:id for Admin only)

module.exports = router;