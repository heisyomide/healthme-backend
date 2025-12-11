// src/models/Prescription.js
const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema(
  {
    // --- Related Entities ---
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    practitioner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Practitioner",
      required: true,
    },
    // Optional: Reference the specific note/encounter where the prescription was written
    clinicalNote: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClinicalNote",
      required: false,
    },

    // --- Medication Details ---
    medicationName: {
      type: String,
      required: true,
      trim: true,
    },
    dosage: {
      type: String, // e.g., "50 mg", "100 mL"
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true, // e.g., 30 tablets
    },
    frequency: {
      type: String,
      required: true, // e.g., "Once daily", "Twice a day", "Every 4 hours"
    },
    route: {
      type: String,
      enum: ["oral", "topical", "injection", "inhaled", "other"],
      default: "oral",
    },
    instructions: {
      type: String, // Free text instructions for the patient/pharmacist
      trim: true,
    },
    
    // --- Authorization and Expiry ---
    refills: {
      type: Number,
      default: 0,
      min: 0,
    },
    prescriptionDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true, // Legal requirement for prescription validity
    },
    
    // --- Status and Fulfillment ---
    status: {
      type: String,
      enum: ["Active", "Filled", "Refilled", "Cancelled", "Expired"],
      default: "Active",
    },
    externalPharmacyId: {
      type: String, // ID used to track prescription in an external pharmacy system
      trim: true,
      required: false,
    },
  },
  { timestamps: true }
);

// Index for efficient lookup of all active prescriptions for a patient
prescriptionSchema.index({ patient: 1, status: 1 });
prescriptionSchema.index({ practitioner: 1 });

module.exports = mongoose.model("Prescription", prescriptionSchema);