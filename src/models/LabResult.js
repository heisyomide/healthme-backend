/**
 * @file LabResult.js
 * @desc Mongoose schema for tracking and storing lab results (e.g., blood work, imaging).
 */
const mongoose = require('mongoose');

const LabResultSchema = new mongoose.Schema({
    // Link to the Patient
    patient: {
        type: mongoose.Schema.ObjectId,
        ref: 'Patient',
        required: [true, 'Lab result must be linked to a patient.']
    },

    // Link to the Practitioner who ordered the test
    orderedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'Practitioner',
        required: [true, 'Lab result must specify the ordering practitioner.']
    },

    // Name of the test conducted (e.g., "Complete Blood Count", "X-Ray")
    testName: {
        type: String,
        required: [true, 'Test name is required.'],
        trim: true
    },

    // Date the sample was collected/test was performed
    resultDate: {
        type: Date,
        required: [true, 'The date the result was available is required.']
    },

    // The overall status of the result
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Abnormal', 'Normal'],
        default: 'Completed'
    },

    // Detailed results structure (Flexible for different types of tests)
    results: [{
        // e.g., "Hemoglobin", "Cholesterol"
        parameter: {
            type: String,
            required: [true, 'Parameter name is required.']
        },
        // e.g., 14.5, 200
        value: {
            type: mongoose.Schema.Types.Mixed, // Can be string (e.g., 'Positive'), number (e.g., 14.5), or object
            required: [true, 'Parameter value is required.']
        },
        // e.g., "g/dL", "mg/dL"
        unit: {
            type: String,
            required: [true, 'Unit of measurement is required.']
        },
        // e.g., "12.0 - 15.0"
        referenceRange: {
            type: String,
            required: false
        },
        // Indicator if the result is outside the normal range
        isAbnormal: {
            type: Boolean,
            default: false
        }
    }],

    // Link to the external report file (e.g., S3 URL or internal path)
    reportFileUrl: {
        type: String,
        required: false
    },

    // Practitioner's interpretation notes
    interpretation: {
        type: String,
        required: false
    },

    createdAt: {
        type: Date,
        default: Date.now,
        select: false
    }
});

// Index to quickly query results by patient
LabResultSchema.index({ patient: 1, resultDate: -1 });

module.exports = mongoose.model('LabResult', LabResultSchema);