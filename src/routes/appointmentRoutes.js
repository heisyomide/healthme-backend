/**
 * @file appointmentRoutes.js
 * @desc API routes for handling appointment scheduling, viewing, and status updates.
 */
const express = require('express');
const router = express.Router();

// Middleware Imports
const { protect, authorize } = require('../middlewares/authMiddleware');

// Controller Imports
const {
    createAppointment,
    getMyAppointments,
    updateAppointmentStatus,
} = require('../controllers/appointmentController');


/* =====================================================
   1. BOOKING (Patient Action)
===================================================== */

// @route   POST /api/v1/appointments
// @desc    Book a new appointment with a practitioner
// @access  Private/Patient
router.post(
    '/',
    protect,
    authorize(['patient']), // Only patients can initiate a booking
    createAppointment
);

/* =====================================================
   2. VIEWING (Patient/Practitioner Dashboard)
===================================================== */

// @route   GET /api/v1/appointments/my
// @desc    Get all appointments for the authenticated user (Patient or Practitioner)
// @access  Private/Authenticated User
router.get(
    '/my',
    protect,
    getMyAppointments
);

/* =====================================================
   3. STATUS UPDATE (Practitioner/Admin Action)
===================================================== */

// @route   PUT /api/v1/appointments/:id/status
// @desc    Confirm, Cancel, or Reschedule an appointment
// @access  Private/Practitioner or Admin
router.put(
    '/:id/status',
    protect,
    authorize(['practitioner', 'admin']), // Only practitioners or admins can change status
    updateAppointmentStatus
);


module.exports = router;