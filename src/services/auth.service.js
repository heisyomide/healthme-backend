// src/services/authService.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Patient = require('../models/patient_temp');
const Practitioner = require('../models/Practitioner');
const generateToken = require('../utils/generateToken');
const crypto = require('crypto');

/**
 * Generates a standard JWT for authenticated users.
 * @param {object} user - The core User document.
 * @param {string} profileId - The linked Patient or Practitioner profile ID.
 * @param {string} role - The user's role ('patient' or 'practitioner').
 * @returns {string} JWT token.
 */
function generateAuthToken(user, profileId, role) {
    return generateToken({ 
        id: user._id, 
        profileId: profileId, 
        role: role 
    }, '30d');
}

/**
 * Creates a new User and a linked Patient profile.
 */
exports.registerPatient = async (userData) => {
    const { email, password, fullName, dateOfBirth } = userData;
    
    // 1. Check for existing user
    if (await User.findOne({ email })) {
        throw new Error("User with this email already exists.");
    }
    
    // 2. Create the core User record
    const newUser = await User.create({ email, password, role: 'patient' });
    
    // 3. Create the Patient profile
    const newPatient = await Patient.create({
        user: newUser._id,
        fullName,
        email,
        dateOfBirth,
        medicalRecordNumber: crypto.randomBytes(4).toString('hex').toUpperCase(), // Simple MRN generation
    });
    
    // 4. Update the core User to link the profile
    newUser.profile = newPatient._id;
    await newUser.save();
    
    // 5. Generate token for immediate login
    const token = generateAuthToken(newUser, newPatient._id, 'patient');
    
    return { user: newUser, profile: newPatient, token };
};

/**
 * Creates a new User and a linked Practitioner profile.
 */
exports.registerPractitioner = async (userData) => {
    const { email, password, fullName, specialization } = userData;
    
    if (await User.findOne({ email })) {
        throw new Error("User with this email already exists.");
    }

    const newUser = await User.create({ email, password, role: 'practitioner' });
    
    const newPractitioner = await Practitioner.create({
        user: newUser._id,
        fullName,
        email,
        specialty: specialization,
        // Practitioner profiles start inactive/unverified until payment/KYP is complete
        isActive: false, 
        isVerified: false,
    });
    
    newUser.profile = newPractitioner._id;
    await newUser.save();
    
    const token = generateAuthToken(newUser, newPractitioner._id, 'practitioner');
    
    return { user: newUser, profile: newPractitioner, token };
};

/**
 * Handles user login authentication.
 */
exports.authenticateUser = async (email, password) => {
    const user = await User.findOne({ email });
    
    if (!user || !(await user.matchPassword(password))) {
        throw new Error("Invalid credentials.");
    }
    
    if (!user.isActive) {
        throw new Error("Account is currently inactive or suspended.");
    }

    // Determine the profile type and get the ID
    const role = user.role;
    let profileModel, profileId;

    if (role === 'patient') {
        profileModel = Patient;
    } else if (role === 'practitioner' || role === 'admin') {
        profileModel = Practitioner; // Assuming admin uses the Practitioner model for profile
    }

    const profile = await profileModel.findOne({ user: user._id });
    profileId = profile ? profile._id : user._id; // Fallback for admin if no profile exists

    const token = generateAuthToken(user, profileId, role);

    return { user, profileId, role, token };
};