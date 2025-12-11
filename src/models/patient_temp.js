/**
 * @file Patient.js
 * @desc Mongoose schema for the Patient profile, containing specific demographic
 * and health-related information for non-practitioner users.
 */
const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
    // Link to the core User model
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Patient must be linked to a core User account.'],
        unique: true
    },
    
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        maxlength: [100, 'Full name cannot be more than 100 characters']
    },
    
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
        default: 'Prefer not to say'
    },
    
    dob: {
        type: Date,
        required: [true, 'Date of birth is required']
    },

    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        maxlength: [20, 'Phone number cannot be longer than 20 characters']
    },

    address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        zipCode: { type: String, trim: true },
        country: { type: String, default: 'US', trim: true }
    },

    // Health-specific fields
    bloodType: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', null],
        default: null
    },

    // An array of references to appointments this patient has booked
    appointments: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Appointment'
    }],

    // Health records or medical history references (optional, can be its own model)
    medicalHistory: {
        allergies: [String],
        conditions: [String],
    },

    // Status fields
    isActive: {
        type: Boolean,
        default: true,
        select: false // Hide this field by default unless explicitly requested
    },
    
    // Suspension fields (used by adminController)
    suspensionReason: {
        type: String,
        required: false
    },
    suspensionDate: {
        type: Date,
        required: false
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    // Enable virtual fields to be returned in JSON response
    toJSON: { virtuals: true }, 
    toObject: { virtuals: true } 
});

// Virtual field: Calculate Age from DOB
PatientSchema.virtual('age').get(function() {
    const today = new Date();
    const dob = this.dob;
    if (!dob) return null;
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
});


module.exports = mongoose.model('Patient', PatientSchema);