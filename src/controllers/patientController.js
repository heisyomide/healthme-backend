// src/controllers/patientController.js
const Patient = require("../models/Patient");
const User = require("../models/User"); // To potentially update core user status
const Appointment = require("../models/Appointment");
const ClinicalNote = require("../models/ClinicalNote");
const Prescription = require("../models/Prescription");
const mongoose = require("mongoose");
const { validationResult } = require("express-validator");

/* =====================================================
   1. GET AUTHENTICATED PATIENT PROFILE
===================================================== */

/**
 * @desc Get the profile of the authenticated patient
 * @route GET /api/v1/patients/me
 * @access Private/Patient
 */
exports.getPatientProfile = async (req, res) => {
  try {
    // profileId is the ID of the Patient document, assigned during login
    const patientId = req.user.profileId; 

    const patient = await Patient.findById(patientId)
      // Optional: Populate the core User and Verification record for status checks
      // .populate('verification') 
      .lean();

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient profile not found." });
    }

    res.status(200).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error("getPatientProfile error:", error);
    res.status(500).json({ success: false, message: "Server error fetching profile." });
  }
};

/* =====================================================
   2. UPDATE PATIENT PROFILE
===================================================== */

/**
 * @desc Update the profile of the authenticated patient (demographics, contact info)
 * @route PUT /api/v1/patients/me
 * @access Private/Patient
 */
exports.updatePatientProfile = async (req, res) => {
  try {
    const patientId = req.user.profileId;
    const updates = req.body;
    
    // Disallow updates to protected fields (like MRN or verification status)
    delete updates.medicalRecordNumber; 
    delete updates.isVerified;

    const patient = await Patient.findByIdAndUpdate(
      patientId,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient profile not found." });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: patient,
    });
  } catch (error) {
    console.error("updatePatientProfile error:", error);
    res.status(500).json({ success: false, message: "Server error updating profile." });
  }
};

/* =====================================================
   3. GET MEDICAL HISTORY (Comprehensive Record)
===================================================== */

/**
 * @desc Get all medical records (notes, prescriptions) for the authenticated patient
 * @route GET /api/v1/patients/me/history
 * @access Private/Patient
 */
exports.getMedicalHistory = async (req, res) => {
  try {
    const patientId = req.user.profileId;

    // 1. Fetch Appointments
    const appointments = await Appointment.find({ patient: patientId })
      .populate('practitioner', 'fullName specialty')
      .sort({ date: -1 });

    // 2. Fetch Clinical Notes
    const clinicalNotes = await ClinicalNote.find({ patient: patientId })
      .populate('practitioner', 'fullName specialty')
      .sort({ noteDate: -1 });

    // 3. Fetch Prescriptions
    const prescriptions = await Prescription.find({ patient: patientId })
      .populate('practitioner', 'fullName specialty')
      .sort({ prescriptionDate: -1 });

    res.status(200).json({
      success: true,
      data: {
        appointments,
        clinicalNotes,
        prescriptions,
      },
    });
  } catch (error) {
    console.error("getMedicalHistory error:", error);
    res.status(500).json({ success: false, message: "Server error fetching history." });
  }
};

/* =====================================================
   4. ADMIN/PRACTITIONER ACCESS (By Patient ID)
===================================================== */

/**
 * @desc Get a specific patient's profile by ID
 * @route GET /api/v1/patients/:id
 * @access Private/Practitioner, Admin
 */
exports.getPatientProfileById = async (req, res) => {
  try {
    const patientId = req.params.id;
    const requestingUserRole = req.user.role;

    // Security Check: Only Practitioner or Admin can access by ID
    if (requestingUserRole !== 'practitioner' && requestingUserRole !== 'admin') {
      return res.status(403).json({ success: false, message: "Unauthorized access." });
    }

    const patient = await Patient.findById(patientId)
      .select('-password') // Ensure no sensitive credentials are leaked
      .lean();

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient profile not found." });
    }

    // Optional Security: If req.user.role === 'practitioner', you might only allow access
    // if the practitioner has a current or past appointment with this patient.
    
    res.status(200).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error("getPatientProfileById error:", error);
    res.status(500).json({ success: false, message: "Server error fetching patient profile." });
  }
};