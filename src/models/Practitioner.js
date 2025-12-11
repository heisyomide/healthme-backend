/**
 * @file Practitioner.js
 * @desc Mongoose schema for the Practitioner profile, containing professional
 * details for doctors, nurses, therapists, etc.
 */
const mongoose = require('mongoose');

const PractitionerSchema = new mongoose.Schema({
    // Link to the core User model
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Practitioner must be linked to a core User account.'],
        unique: true
    },

    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        maxlength: [100, 'Full name cannot be more than 100 characters']
    },

    specialty: {
        type: String,
        required: [true, 'Medical specialty is required'],
        trim: true
    },

    // License/Certification details
    licenseNumber: {
        type: String,
        required: [true, 'License number is required'],
        unique: true,
        trim: true
    },

    // Professional details
    bio: {
        type: String,
        maxlength: 500,
        default: 'Dedicated healthcare professional.'
    },
    
    // Array of locations this practitioner works at
    locations: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Location'
    }],

    // List of accepted insurances (can be a sub-document or external model later)
    insuranceNetworks: [String],

    // Working schedule or availability (can be complex, kept simple here)
    availability: {
        type: String,
        default: 'Mon-Fri, 9am-5pm'
    },

    // Calculated fields
    averageRating: {
        type: Number,
        default: 0,
        min: [0, 'Rating must be at least 0'],
        max: [5, 'Rating must be less than or equal to 5']
    },
    
    // Status fields
    isVerified: {
        type: Boolean,
        default: false // Requires admin approval
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index to search practitioners by specialty and location
PractitionerSchema.index({ specialty: 1, locations: 1 });

module.exports = mongoose.model('Practitioner', PractitionerSchema);