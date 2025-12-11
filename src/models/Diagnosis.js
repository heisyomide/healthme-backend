/**
 * @file Diagnosis.js
 * @desc Mongoose schema for a clinical diagnosis made by a Practitioner for a Patient.
 */
const mongoose = require('mongoose');

const DiagnosisSchema = new mongoose.Schema({
    // Link to the Patient who received the diagnosis
    patient: {
        type: mongoose.Schema.ObjectId,
        ref: 'Patient',
        required: [true, 'Diagnosis must be linked to a patient.']
    },

    // Link to the Practitioner who made the diagnosis
    practitioner: {
        type: mongoose.Schema.ObjectId,
        ref: 'Practitioner',
        required: [true, 'Diagnosis must be linked to a practitioner.']
    },

    // Optional: Link to a specific Appointment during which the diagnosis was made
    appointment: {
        type: mongoose.Schema.ObjectId,
        ref: 'Appointment',
        required: false,
        default: null
    },

    // The official code for the diagnosis (e.g., ICD-10 code)
    code: {
        type: String,
        required: [true, 'Diagnosis code (e.g., ICD-10) is required.'],
        trim: true,
        maxlength: [50, 'Code cannot be more than 50 characters.']
    },

    // The full descriptive name of the diagnosis
    name: {
        type: String,
        required: [true, 'Diagnosis name is required.'],
        trim: true
    },

    // Detailed notes provided by the practitioner
    notes: {
        type: String,
        required: false
    },

    // Status of the diagnosis (e.g., 'Provisional', 'Confirmed', 'Resolved')
    status: {
        type: String,
        enum: ['Provisional', 'Confirmed', 'Chronic', 'Resolved'],
        default: 'Provisional'
    },

    // Date the diagnosis was documented
    diagnosisDate: {
        type: Date,
        default: Date.now
    },

    // Date the diagnosis was resolved (if applicable)
    resolvedDate: {
        type: Date,
        required: false
    },

    createdAt: {
        type: Date,
        default: Date.now,
        select: false
    }
});

// Index to quickly query diagnoses by patient or practitioner
DiagnosisSchema.index({ patient: 1, practitioner: 1, diagnosisDate: -1 });


module.exports = mongoose.model('Diagnosis', DiagnosisSchema);