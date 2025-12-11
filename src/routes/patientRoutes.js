// src/routes/patientRoutes.js
const express = require("express");
const router = express.Router();

// --- Import Middleware ---
const { protect, authorize } = require("../middlewares/authMiddleware");

// --- Import Controllers ---
const patientController = require("../controllers/patientController");
const prescriptionController = require("../controllers/prescriptionController");

// The middleware stack for all patient routes: 
// 1. protect: Checks for a valid JWT.
// 2. authorize(['patient']): Ensures the user has the 'patient' role.
const PATIENT_AUTH = [protect, authorize(['patient'])];


/* =====================================================
   1. PROFILE MANAGEMENT
===================================================== */

// @route GET /api/v1/patients/me
// @desc Get the authenticated patient's profile details
// @access Private/Patient
router.get(
  "/me", 
  PATIENT_AUTH, 
  patientController.getPatientProfile
);

// @route PUT /api/v1/patients/me
// @desc Update the authenticated patient's profile details
// @access Private/Patient
router.put(
  "/me", 
  PATIENT_AUTH, 
  patientController.updatePatientProfile
);



/* =====================================================
   2. MEDICAL HISTORY & RECORDS
===================================================== */

// @route GET /api/v1/patients/me/history
// @desc Get comprehensive medical history (appointments, notes, prescriptions)
// @access Private/Patient
router.get(
  "/me/history", 
  PATIENT_AUTH, 
  patientController.getMedicalHistory
);

// @route GET /api/v1/patients/me/prescriptions
// @desc Get active prescriptions specific to the patient
// @access Private/Patient
router.get(
  "/me/prescriptions", 
  PATIENT_AUTH, 
  prescriptionController.getMyPrescriptions
);


/* =====================================================
   3. ADMIN/PRACTITIONER ACCESS (By Patient ID)
   (Note: These are included here but use a different auth check)
===================================================== */

// @route GET /api/v1/patients/:id
// @desc Get a specific patient's profile by ID (for Practitioner/Admin only)
// @access Private/Practitioner, Admin
router.get(
  "/:id", 
  [protect, authorize(['practitioner', 'admin'])], 
  patientController.getPatientProfileById
);


module.exports = router;