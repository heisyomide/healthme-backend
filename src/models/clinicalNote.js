// src/models/ClinicalNote.js
const mongoose = require("mongoose");

const clinicalNoteSchema = new mongoose.Schema(
  {
    // --- Related Entities (The Core of the Clinical Record) ---
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
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true, // Typically, one official note per appointment
    },

    // --- Note Details (Using the SOAP Structure) ---
    noteType: {
      type: String,
      enum: ["SOAP", "H&P", "Progress Note", "Discharge Summary"], // History & Physical
      default: "SOAP",
      required: true,
    },

    // S: Subjective (Patient's perspective, chief complaint)
    subjective: {
      type: String,
      trim: true,
      required: true,
    },
    // O: Objective (Practitioner's findings, vital signs, physical exam)
    objective: {
      type: String,
      trim: true,
      required: true,
    },
    // A: Assessment (Diagnosis or differential diagnosis)
    assessment: {
      type: String,
      trim: true,
      required: true,
    },
    // P: Plan (Treatment, follow-up, medications, referrals)
    plan: {
      type: String,
      trim: true,
      required: true,
    },

    // --- Status and Audit ---
    noteDate: {
      type: Date,
      default: Date.now,
    },
    isSigned: {
      type: Boolean,
      default: false, // Indicates the practitioner has finalized the note
    },
    signedDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes for quick retrieval of all notes for a specific patient or practitioner
clinicalNoteSchema.index({ patient: 1, noteDate: -1 });
clinicalNoteSchema.index({ practitioner: 1, noteDate: -1 });

module.exports = mongoose.model("ClinicalNote", clinicalNoteSchema);