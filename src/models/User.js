/**
 * @file User.js
 * @desc Mongoose schema for the core user account, handling authentication
 * and linking to specific profile types (Patient, Practitioner, Admin).
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
        select: false // Do not return password by default
    },
    role: {
        type: String,
        enum: ['patient', 'practitioner', 'admin'],
        default: 'patient'
    },
    // Reference to the specific profile model (Patient, Practitioner, or null for Admin)
    profileId: {
        type: mongoose.Schema.ObjectId,
        required: false, // Required upon successful registration
        default: null,
        refPath: 'role' // Dynamically reference Patient or Practitioner model
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// ------------------------------------
// Pre-save Middleware: Encrypt password
// ------------------------------------
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// ------------------------------------
// Instance Method: Sign JWT and return
// ------------------------------------
UserSchema.methods.getSignedJwtToken = function() {
    return jwt.sign({ id: this._id, role: this.role, profileId: this.profileId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// ------------------------------------
// Instance Method: Match user entered password to hashed password in database
// ------------------------------------
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);