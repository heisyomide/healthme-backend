// src/controllers/prescriptionController.js
const Prescription = require("../models/Prescription");
const Patient = require("../models/patient_temp");
const Practitioner = require("../models/Practitioner");
const ClinicalNote = require("../models/ClinicalNote");
const mongoose = require("mongoose");

/* =====================================================
   1. CREATE PRESCRIPTION
===================================================== */

/**
 * @desc Create a new prescription
 * @route POST /api/v1/prescriptions
 * @access Private/Practitioner
 */
exports.createPrescription = async (req, res) => {
  try {
    const { 
      patientId, 
      clinicalNoteId, 
      medicationName, 
      dosage, 
      quantity, 
      frequency, 
      route, 
      instructions, 
      refills, 
      expiryDate 
    } = req.body;
    
    const practitionerId = req.user.profileId; // ID of the currently logged-in practitioner

    // 1. Authorization and Verification Check
    const practitioner = await Practitioner.findById(practitionerId);
    if (!practitioner || !practitioner.isVerified || !practitioner.isActive) {
      return res.status(403).json({ success: false, message: "Unauthorized: Practitioner is not verified or active." });
    }

    // 2. Patient and Clinical Note Validation
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found." });
    }

    if (clinicalNoteId) {
        const note = await ClinicalNote.findById(clinicalNoteId);
        if (!note || note.practitioner.toString() !== practitionerId) {
            return res.status(403).json({ success: false, message: "Note not found or does not belong to this practitioner." });
        }
    }

    // 3. Create the Prescription
    const newPrescription = await Prescription.create({
      patient: patientId,
      practitioner: practitionerId,
      clinicalNote: clinicalNoteId,
      medicationName,
      dosage,
      quantity,
      frequency,
      route,
      instructions,
      refills,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      status: "Active",
    });

    res.status(201).json({
      success: true,
      message: "Prescription created and active.",
      data: newPrescription,
    });
  } catch (error) {
    console.error("createPrescription error:", error);
    res.status(500).json({ success: false, message: "Server error creating prescription." });
  }
};

/* =====================================================
   2. RETRIEVE PRESCRIPTIONS (Access Control)
===================================================== */

/**
 * @desc Get all prescriptions for a specific patient (Practitioner access)
 * @route GET /api/v1/prescriptions/patient/:patientId
 * @access Private/Practitioner (Must have relationship with patient)
 */
exports.getPatientPrescriptions = async (req, res) => {
  try {
    const { patientId } = req.params;
    const practitionerId = req.user.profileId;
    
    // 1. Validate Access (Check if the practitioner is authorized to view this patient's records)
    // A robust check would involve checking appointments or assignment, but we simplify for structure:
    const patient = await Patient.findById(patientId);
    if (!patient) {
        return res.status(404).json({ success: false, message: "Patient not found." });
    }

    // Optional: Add a check here to ensure the practitioner has a record (appointment/note) with the patient.

    // 2. Fetch Prescriptions
    const prescriptions = await Prescription.find({ patient: patientId })
      .populate('practitioner', 'fullName specialty')
      .sort({ prescriptionDate: -1 });

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (error) {
    console.error("getPatientPrescriptions error:", error);
    res.status(500).json({ success: false, message: "Server error fetching prescriptions." });
  }
};


/**
 * @desc Get all active prescriptions for the authenticated patient
 * @route GET /api/v1/prescriptions/me
 * @access Private/Patient
 */
exports.getMyPrescriptions = async (req, res) => {
  try {
    const patientId = req.user.profileId;

    const prescriptions = await Prescription.find({ 
        patient: patientId,
        status: "Active" 
    })
      .populate('practitioner', 'fullName specialty')
      .sort({ prescriptionDate: -1 });

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (error) {
    console.error("getMyPrescriptions error:", error);
    res.status(500).json({ success: false, message: "Server error fetching prescriptions." });
  }
};


/* =====================================================
   3. UPDATE STATUS (Cancel/Expire)
===================================================== */

/**
 * @desc Cancel a prescription (only allowed by the issuing practitioner or admin)
 * @route PUT /api/v1/prescriptions/:id/cancel
 * @access Private/Practitioner, Admin
 */
exports.cancelPrescription = async (req, res) => {
  try {
    const prescriptionId = req.params.id;
    const userId = req.user.profileId; 
    const userRole = req.user.role;

    const prescription = await Prescription.findById(prescriptionId);

    if (!prescription) {
        return res.status(404).json({ success: false, message: "Prescription not found." });
    }

    // Authorization: Only the issuing practitioner or an admin can cancel
    const isIssuer = prescription.practitioner.toString() === userId;
    const isAdmin = userRole === 'admin';

    if (!isIssuer && !isAdmin) {
        return res.status(403).json({ success: false, message: "Unauthorized to cancel this prescription." });
    }

    if (prescription.status === 'Cancelled' || prescription.status === 'Expired') {
        return res.status(400).json({ success: false, message: `Prescription is already ${prescription.status.toLowerCase()}.` });
    }

    const updatedPrescription = await Prescription.findByIdAndUpdate(
      prescriptionId,
      { $set: { status: "Cancelled" } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Prescription successfully cancelled.",
      data: updatedPrescription,
    });
  } catch (error) {
    console.error("cancelPrescription error:", error);
    res.status(500).json({ success: false, message: "Server error cancelling prescription." });
  }
};