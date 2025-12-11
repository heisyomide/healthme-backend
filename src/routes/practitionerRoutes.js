// src/routes/practitionerRoutes.js
const express = require("express");
const router = express.Router();

// --- Import Middleware ---
const { protect, authorize } = require("../middlewares/authMiddleware");
const { checkPaid } = require("../middlewares/checkPaid"); // To gate paid features
const upload = require("../config/multer"); // For profile picture/document upload

// --- Import Controllers ---
const practitionerController = require("../controllers/practitionerController");
const clinicalNoteController = require("../controllers/clinicalNoteController");

// The middleware stack for core self-service routes: 
// 1. protect: Checks for a valid JWT.
// 2. authorize(['practitioner']): Ensures the user has the 'practitioner' role.
const PRACTITIONER_AUTH = [protect, authorize(['practitioner'])];

// The middleware stack for paid features:
// 3. checkPaid: Ensures the practitioner has an active subscription.
const PAID_FEATURE_AUTH = [...PRACTITIONER_AUTH, checkPaid];


/* =====================================================
   1. PROFILE MANAGEMENT AND DASHBOARD
===================================================== */

// @route GET /api/v1/practitioners/me
// @desc Get the authenticated practitioner's profile details
// @access Private/Practitioner
router.get(
  "/me", 
  PRACTITIONER_AUTH, 
  practitionerController.getProfile
);

// @route PUT /api/v1/practitioners/me
// @desc Update the authenticated practitioner's profile details
// @access Private/Practitioner
router.put(
  "/me", 
  PRACTITIONER_AUTH, 
  practitionerController.updateProfile
);

// @route GET /api/v1/practitioners/me/overview
// @desc Get dashboard statistics (appointments, patients, completion)
// @access Private/Practitioner
router.get(
  "/me/overview", 
  PRACTITIONER_AUTH, 
  practitionerController.getOverview
);

// @route GET /api/v1/practitioners/me/payment-status
// @desc Get the practitioner's current subscription payment status
// @access Private/Practitioner
router.get(
  "/me/payment-status", 
  PRACTITIONER_AUTH, 
  practitionerController.getPaymentStatus
);



/* =====================================================
   2. CLINICAL/PATIENT MANAGEMENT (PAID FEATURES)
===================================================== */

// @route GET /api/v1/practitioners/me/appointments
// @desc Get all appointments assigned to the practitioner
// @access Private/Practitioner
router.get(
  "/me/appointments", 
  PAID_FEATURE_AUTH, 
  practitionerController.getAppointments
);

// @route GET /api/v1/practitioners/me/patients
// @desc Get the list of all unique patients seen by the practitioner
// @access Private/Practitioner
router.get(
  "/me/patients", 
  PAID_FEATURE_AUTH, 
  practitionerController.getPatients
);

// @route POST /api/v1/practitioners/notes
// @desc Create a clinical note after an appointment
// @access Private/Practitioner (Requires active subscription)
router.post(
  "/notes", 
  PAID_FEATURE_AUTH, 
  clinicalNoteController.createClinicalNote
);

// @route PUT /api/v1/practitioners/notes/:id/sign
// @desc Sign and finalize a clinical note
// @access Private/Practitioner (Requires active subscription)
router.put(
  "/notes/:id/sign", 
  PAID_FEATURE_AUTH, 
  clinicalNoteController.signClinicalNote
);



/* =====================================================
   3. PUBLIC DIRECTORY ACCESS
===================================================== */

// @route GET /api/v1/practitioners
// @desc Get list of all verified and active practitioners (Public Directory)
// @access Public
router.get(
  "/", 
  practitionerController.getAllPractitioners
);

// @route GET /api/v1/practitioners/:id
// @desc Get a specific practitioner's public profile details
// @access Public
router.get(
  "/:id", 
  practitionerController.getPractitionerById
);


module.exports = router;