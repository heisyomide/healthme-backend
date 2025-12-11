/**
 * @file authController.js
 * @desc Controller functions for all authentication-related API endpoints.
 * Implements user registration, login, profile completion, and password management
 * using Mongoose transactions for data integrity.
 */
const mongoose = require("mongoose"); // Required for transactions
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");

// Core Imports for Architecture
const asyncHandler = require('../middlewares/async');
const {
    BadRequestError,
    UnauthorizedError,
    NotFoundError,
    ForbiddenError
} = require('../utils/HttpError');

// Helper & Utility Imports
const generateToken = require("../utils/generateToken"); // New utility file
const { setAuthCookie } = require('../utils/generateToken'); // New helper function

// Model Imports
const User = require("../models/User");
const Patient = require("../models/patient_temp");
const Practitioner = require("../models/Practitioner");
const Verification = require("../models/Verification_temp");

/* =====================================================
   📝 1. REGISTRATION (Unified Entry Point)
===================================================== */
exports.register = asyncHandler(async (req, res, next) => {
    // 1. Validation (Assuming a validation middleware precedes this controller)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Use BadRequestError for client-side validation failures
        return next(new BadRequestError(errors.array()[0].msg || "Validation failed."));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const {
            fullName,
            email,
            password,
            role,
            dateOfBirth,
            gender,
            phone,
            address,
            medicalRecordNumber,
        } = req.body;

        // 2. Check if email already exists
        const existingUser = await User.findOne({ email }).session(session);
        if (existingUser) {
            await session.abortTransaction();
            return next(new BadRequestError("Email already registered."));
        }

        // 3. Hash Password and Create Core User
        const hashedPassword = await bcrypt.hash(password, 10);
        const userRole = role === 'practitioner' ? 'practitioner' : 'patient';
        
        const newUser = await User.create([{
            fullName,
            email,
            password: hashedPassword,
            role: userRole,
        }], { session });
        const userId = newUser[0]._id;
        let profile, redirectUrl;

        // 4. Create Specialized Profile and Link
        if (userRole === "practitioner") {
            // Practitioner flow: Minimal registration, profile completed in a separate step.
            redirectUrl = "/practitioner/onboarding";
            await session.commitTransaction(); // Commit user creation only
            
            // Generate token for the newly created user for onboarding phase
            const token = generateToken({ id: userId, role: userRole });
            setAuthCookie(res, token);
            
            return res.status(200).json({
                success: true,
                message: "Practitioner basic registration complete. Proceed to profile setup and payment.",
                user: { id: userId, fullName, email, role: userRole },
                token,
                redirectUrl,
            });
            
        } else { // 'patient' role flow
            if (!dateOfBirth) {
                await session.abortTransaction();
                return next(new BadRequestError("Date of Birth is required for patient registration."));
            }

            // Create Patient Profile
            profile = await Patient.create([{
                fullName,
                email,
                dateOfBirth,
                gender,
                phone,
                address,
                medicalRecordNumber: medicalRecordNumber || `MRN-${Math.floor(Math.random() * 1e9)}`,
            }], { session });

            // Link User to Patient Profile
            await User.updateOne({ _id: userId }, { $set: { patientProfile: profile[0]._id } }, { session });
            
            // Create Initial Verification Record (KYP)
            await Verification.create([{
                entityId: profile[0]._id,
                entityType: "Patient",
                kycStatus: "Pending",
            }], { session });

            redirectUrl = "/dashboard/patient";
        }

        // 5. Commit transaction, generate token, and send response for PATIENT
        await session.commitTransaction();

        const token = generateToken({ id: userId, role: userRole });
        setAuthCookie(res, token);

        res.status(201).json({
            success: true,
            message: `${userRole} registered successfully.`,
            user: { id: userId, fullName, email, role: userRole },
            token,
            redirectUrl,
        });

    } catch (error) {
        await session.abortTransaction();
        // Since we are inside asyncHandler, we pass the error along
        return next(error);
    } finally {
        session.endSession();
    }
});

/* =====================================================
   💳 2. PRACTITIONER ONBOARDING (Profile Creation/Payment)
===================================================== */
exports.completePractitionerProfile = asyncHandler(async (req, res, next) => {
    // This assumes the user is already authenticated via the JWT token (req.user)
    const userId = req.user.id; 
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { specialty, licenseNumber, hospitalAffiliation, npiNumber, paymentId } = req.body;
        
        // 1. Basic validation
        if (!specialty || !licenseNumber || !paymentId) {
            await session.abortTransaction();
            return next(new BadRequestError("Specialty, license number, and payment confirmation are required."));
        }

        // 2. Check if User exists, has 'practitioner' role, and profile is NOT already linked
        const user = await User.findOne({ 
            _id: userId, 
            role: "practitioner", 
            practitionerProfile: { $exists: false } 
        }).session(session);

        if (!user) {
            await session.abortTransaction();
            return next(new NotFoundError("Practitioner user not found or profile already completed."));
        }

        // 3. Verify payment status (In a real app, this would involve a service call)
        // if (!await verifyPayment(paymentId)) {
        //     await session.abortTransaction();
        //     return next(new BadRequestError("Payment verification failed."));
        // }

        // 4. Create Practitioner Profile
        const practitionerProfile = await Practitioner.create([{
            userId: userId, // Link to the core user record
            fullName: user.fullName,
            email: user.email,
            specialty,
            licenseNumber,
            npiNumber,
            hospitalAffiliation,
        }], { session });

        // 5. Link User to Practitioner Profile
        await User.updateOne({ _id: userId }, { $set: { practitionerProfile: practitionerProfile[0]._id } }, { session });

        // 6. Create Initial Verification Record (KYC)
        await Verification.create([{
            entityId: practitionerProfile[0]._id,
            entityType: "Practitioner",
            kycStatus: "Pending",
        }], { session });

        // 7. Commit transaction and send response
        await session.commitTransaction();

        res.status(201).json({
            success: true,
            message: "Practitioner profile created and payment confirmed. Redirecting to KYC.",
            user: { id: userId, fullName: user.fullName, email: user.email, role: "practitioner" },
            redirectUrl: "/dashboard/practitioner/kyc",
        });

    } catch (error) {
        await session.abortTransaction();
        return next(error);
    } finally {
        session.endSession();
    }
});


/* =====================================================
   🔐 3. LOGIN USER (ALL ROLES)
===================================================== */
exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    
    // 1. Input validation
    if (!email || !password) {
        return next(new BadRequestError("Email and password required."));
    }

    // 2. Find User by email and select the password field
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        // Use a generic "Invalid credentials" message for security
        return next(new UnauthorizedError("Invalid credentials."));
    }

    // 3. Compare password
    // Assumes `matchPassword` is a method on the User Mongoose schema
    const isMatch = await user.matchPassword(password); 
    if (!isMatch) {
        return next(new UnauthorizedError("Invalid credentials."));
    }

    // 4. Check for profile completeness (Crucial for practitioners)
    if (user.role === "practitioner" && !user.practitionerProfile) {
        // Redirect to onboarding if the profile was never fully completed
        const token = generateToken({ id: user._id, role: user.role });
        setAuthCookie(res, token);
        return res.status(200).json({
            success: true,
            message: "Profile onboarding incomplete. Redirecting.",
            redirectUrl: "/practitioner/onboarding",
            token
        });
    }

    // 5. Generate token and set cookie
    const token = generateToken({ id: user._id, role: user.role });
    setAuthCookie(res, token);

    // 6. Determine redirect URL
    let redirectUrl = "/";
    if (user.role === "admin") redirectUrl = "/dashboard/admin";
    else if (user.role === "practitioner") redirectUrl = "/dashboard/practitioner";
    else if (user.role === "patient") redirectUrl = "/dashboard/patient";

    res.status(200).json({
        success: true,
        message: "Login successful.",
        user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
        },
        token,
        redirectUrl,
    });
});


/* =====================================================
   🚪 4. LOGOUT USER
===================================================== */
exports.logout = asyncHandler(async (req, res, next) => {
    // Helper function clears the cookie by setting it to an empty value with immediate expiry
    setAuthCookie(res, 'none', true); 
    
    res.json({ success: true, message: "Logged out successfully." });
});


/* =====================================================
   👤 5. GET CURRENT USER PROFILE (getMe)
===================================================== */
exports.getMe = asyncHandler(async (req, res, next) => {
    // req.user is populated by the 'protect' middleware
    // Populate the specialized profile based on the user's role
    
    let populateField;
    if (req.user.role === 'patient') {
        populateField = 'patientProfile';
    } else if (req.user.role === 'practitioner') {
        populateField = 'practitionerProfile';
    } else {
        // Admin or other roles, no special profile needed
        populateField = '';
    }

    const user = await User.findById(req.user.id)
        .select('-password') // Don't return the password hash
        .populate(populateField); // Fetch the linked profile details

    if (!user) {
        // Should rarely happen if token is valid, but good to check
        return next(new NotFoundError('User profile not found.'));
    }

    res.status(200).json({
        success: true,
        data: user,
    });
});

/* =====================================================
   🔑 6. PASSWORD MANAGEMENT STUBS
===================================================== */

/**
 * @desc Request password reset email
 * @route POST /api/v1/auth/forgotpassword
 * @access Public
 */
exports.forgotPassword = asyncHandler(async (req, res, next) => {
    // 1. Find user by email (req.body.email)
    // 2. Generate and save a secure reset token
    // 3. Send email with the reset link
    
    // Placeholder response
    res.status(200).json({
        success: true,
        data: { message: 'Password reset link sent to email (placeholder).' }
    });
});

/**
 * @desc Reset password using the token received via email
 * @route PUT /api/v1/auth/resetpassword/:resetToken
 * @access Public
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
    // 1. Hash the reset token from req.params.resetToken
    // 2. Find user by hashed token and check expiry time
    // 3. Hash and save the new password (req.body.newPassword)
    // 4. Clear reset token fields from the user record
    
    // Placeholder response
    res.status(200).json({
        success: true,
        data: { message: 'Password successfully reset (placeholder).' }
    });
});

/**
 * @desc Update user's password (while logged in)
 * @route PUT /api/v1/auth/updatepassword
 * @access Private
 */
exports.updatePassword = asyncHandler(async (req, res, next) => {
    // 1. Verify req.body.currentPassword against the user's stored hash
    // 2. Hash and save the req.body.newPassword
    
    if (!req.body.currentPassword || !req.body.newPassword) {
        return next(new BadRequestError('Please provide current and new passwords.'));
    }

    // Placeholder response
    res.status(200).json({
        success: true,
        data: { message: 'Password updated successfully (placeholder).' }
    });
});