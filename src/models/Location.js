/**
 * @file Location.js
 * @desc Mongoose schema for defining physical locations (clinics, hospitals, etc.)
 * Used for in-person appointments and administrative tracking.
 */
const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
    // Name of the facility or location
    name: {
        type: String,
        required: [true, 'Location name is required.'],
        trim: true,
        unique: true
    },

    // Type of location (e.g., 'Clinic', 'Hospital', 'Office', 'Pharmacy')
    type: {
        type: String,
        enum: ['Clinic', 'Hospital', 'Office', 'Pharmacy', 'Other'],
        default: 'Clinic'
    },

    // Physical Address details
    address: {
        street: { type: String, required: [true, 'Street address is required.'] },
        city: { type: String, required: [true, 'City is required.'] },
        state: { type: String, required: [true, 'State is required.'] },
        zipCode: { type: String, required: [true, 'Zip code is required.'] },
        country: { type: String, default: 'US' }
    },

    // GeoJSON for geospatial queries (necessary for finding nearby locations)
    coordinates: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // Array of [longitude, latitude]
            index: '2dsphere' // GeoJSON index for spatial queries
        }
    },

    // Contact information
    phoneNumber: {
        type: String,
        required: false
    },

    // Operating hours or schedule notes
    operatingHours: {
        type: String,
        required: false
    },

    // Optional: List of practitioners affiliated with this location
    affiliatedPractitioners: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Practitioner'
    }],

    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Geocode and create coordinates before save (requires a pre-save hook and a geocoder utility, not included here)

module.exports = mongoose.model('Location', LocationSchema);