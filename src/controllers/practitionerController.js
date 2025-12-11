// src/controllers/practitionerController.js
const mongoose = require("mongoose");
const Practitioner = require("../models/Practitioner");
const Appointment = require("../models/Appointment");
const Transaction = require("../models/Transaction"); // Using Transaction model for payments
const User = require("../models/User"); // To ensure the core User is present
const { validationResult } = require("express-validator");
const generateToken = require("../utils/generateToken"); // Helper to generate tokens

// --- Standardized Helper Functions ---

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// Ensure the profile is linked to the core User model in your authentication middleware.
// We should rely on 'req.user.profileId' which holds the Practitioner's _id.

function calcProfileCompletion(p) {
  // Use the fields available on the Practitioner Model
  const fields = [
    p.fullName,
    p.email,
    p.specialty, // Renamed from specialization to match the model
    p.bio,
    p.profilePicture,
    p.location,
    p.licenseNumber, // Add required compliance fields
  ];
  const filled = fields.filter(val => val && val.length > 0).length;
  return Math.round((filled / fields.length) * 100);
}

/* =====================================================
   🧭 1. Practitioner Dashboard Overview
===================================================== */

/**
 * @desc Get aggregated stats for the authenticated practitioner's dashboard
 * @route GET /api/v1/practitioners/me/overview
 * @access Private/Practitioner
 */
exports.getOverview = async (req, res) => {
  try {
    // Use the profile ID established by the auth middleware
    const practitionerId = req.user.profileId; 
    
    // 1. Fetch the Practitioner profile, populating related data
    const practitioner = await Practitioner.findById(practitionerId)
      .select("+appointments +patients") // Ensure appointments and patients are selected if they are references
      .populate({ 
        path: 'appointments', 
        select: 'status' // Only pull status to save bandwidth
      })
      .lean(); // Use lean() for read-only operations

    if (!practitioner) {
      return res.status(404).json({ success: false, message: "Practitioner profile not found" });
    }

    // 2. Calculate Aggregates
    const totalPatients = practitioner.patients?.length || 0;
    const upcomingAppointments =
      practitioner.appointments?.filter(a => a.status === "confirmed").length || 0; // Use 'confirmed' status
    const completedAppointments =
      practitioner.appointments?.filter(a => a.status === "completed").length || 0;

    res.status(200).json({
      success: true,
      data: {
        totalPatients,
        upcomingAppointments,
        completedAppointments,
        profileCompletion: calcProfileCompletion(practitioner),
        ratings: practitioner.ratings || [],
        isVerified: practitioner.isVerified || false, // Check verification status
      },
    });
  } catch (err) {
    console.error("getOverview error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   📅 2. Appointments
===================================================== */

/**
 * @desc Get all appointments for the authenticated practitioner
 * @route GET /api/v1/practitioners/me/appointments
 * @access Private/Practitioner
 */
exports.getAppointments = async (req, res) => {
  try {
    const practitionerId = req.user.profileId;
    
    // Find appointments where this practitioner is the assigned practitioner
    const appointments = await Appointment.find({ practitioner: practitionerId })
      .populate("patient", "fullName email dateOfBirth medicalRecordNumber") // Populate more relevant patient info
      .sort({ date: 1, timeSlot: 1 });

    res.status(200).json({ success: true, data: appointments });
  } catch (err) {
    console.error("getAppointments error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   👥 3. Get Assigned Patients
===================================================== */

/**
 * @desc Get the list of all patients assigned to the practitioner (those with appointments/notes)
 * @route GET /api/v1/practitioners/me/patients
 * @access Private/Practitioner
 */
exports.getPatients = async (req, res) => {
  try {
    const practitionerId = req.user.profileId;
    
    // Find all unique patient IDs associated with this practitioner's appointments
    const patientIds = await Appointment.distinct("patient", { practitioner: practitionerId });
    
    // Fetch the Patient profiles
    const patients = await Patient.find({ _id: { $in: patientIds } })
      .select("fullName email dateOfBirth medicalRecordNumber")
      .lean();

    res.status(200).json({ success: true, count: patients.length, data: patients });
  } catch (err) {
    console.error("getPatients error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   👤 4. Profile Management (Authenticated User)
===================================================== */

/**
 * @desc Get the authenticated practitioner's profile
 * @route GET /api/v1/practitioners/me
 * @access Private/Practitioner
 */
exports.getProfile = async (req, res) => {
  try {
    const practitionerId = req.user.profileId;
    
    // Populate the core User details for non-profile info (if needed)
    const practitioner = await Practitioner.findById(practitionerId)
        .populate('user', 'email role isActive') // Assuming 'user' is the ref to the User model
        .select("-password") 
        .lean();

    if (!practitioner)
      return res.status(404).json({ success: false, message: "Profile not found" });

    res.status(200).json({ success: true, data: practitioner });
  } catch (err) {
    console.error("getProfile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Update the authenticated practitioner's profile
 * @route PUT /api/v1/practitioners/me
 * @access Private/Practitioner
 */
exports.updateProfile = async (req, res) => {
  try {
    const practitionerId = req.user.profileId;
    const updates = req.body;
    
    // Prevent updating protected fields
    delete updates.isVerified;
    delete updates.npiNumber; // NPI/license should be updated via Verification process

    const practitioner = await Practitioner.findByIdAndUpdate(
      practitionerId,
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    if (!practitioner)
      return res.status(404).json({ success: false, message: "Practitioner not found" });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: practitioner,
    });
  } catch (err) {
    console.error("updateProfile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   🌍 5. Public Practitioner Directory
===================================================== */

/**
 * @desc Get a list of all active practitioners for public view
 * @route GET /api/v1/practitioners
 * @access Public
 */
exports.getAllPractitioners = async (req, res) => {
  try {
    // Only show practitioners who are active AND verified
    const practitioners = await Practitioner.find({ isActive: true, isVerified: true })
      .select("fullName specialty focus bio experienceYears location ratings profilePicture availability")
      .lean();

    res.status(200).json({
      success: true,
      count: practitioners.length,
      data: practitioners,
    });
  } catch (err) {
    console.error("getAllPractitioners error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Get a specific practitioner's public profile by ID
 * @route GET /api/v1/practitioners/:id
 * @access Public
 */
exports.getPractitionerById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id))
      return res.status(400).json({ success: false, message: "Invalid practitioner ID" });

    // Only allow access if the practitioner is active and verified
    const practitioner = await Practitioner.findOne({ _id: id, isActive: true, isVerified: true })
      .select("fullName specialty focus bio experienceYears location ratings profilePicture availability")
      .lean();

    if (!practitioner)
      return res.status(404).json({ success: false, message: "Practitioner not found or not active" });

    res.status(200).json({ success: true, data: practitioner });
  } catch (err) {
    console.error("getPractitionerById error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   💰 6. Payment Status (using Transaction Model)
===================================================== */

/**
 * @desc Get the latest payment status for the authenticated practitioner
 * @route GET /api/v1/practitioners/me/payment-status
 * @access Private/Practitioner
 */
exports.getPaymentStatus = async (req, res) => {
  try {
    const practitionerId = req.user.profileId;
    
    // Find the latest subscription/fee transaction for the practitioner
    const payment = await Transaction.findOne({ 
        practitioner: practitionerId,
        transactionType: { $in: ["Subscription Fee", "Initial Fee"] }, // Assuming transaction types
        status: "Completed"
    }).sort({ transactionDate: -1 });

    if (!payment) {
      return res.status(200).json({
        success: true,
        data: { status: "unpaid" },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        status: payment.status,
        plan: payment.plan || 'N/A', // Assuming a 'plan' field on Transaction
        amount: payment.amount,
        lastPaymentDate: payment.transactionDate,
      },
    });
  } catch (error) {
    console.error("getPaymentStatus error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// --- REMOVED/REPLACED SECTIONS ---
// The original tempSignup and confirmPayment logic is now handled in the
// authController.js (for user creation) and a dedicated paymentController.js
// (for logging the transaction). They are removed here for a clean architecture.