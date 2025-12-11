/**
 * @file adminController.js
 * @desc Controller functions for Admin Dashboard and general User Management.
 * Verification and Transaction management are handled in separate controllers.
 */
const mongoose = require("mongoose");
const asyncHandler = require('../middlewares/async');
const { 
    NotFoundError, 
    BadRequestError, 
    InternalServerError 
} = require('../utils/HttpError');

// Model Imports
const User = require("../models/User");
const Patient = require("../models/patient_temp");
const Practitioner = require("../models/Practitioner");
const Verification = require("../models/Verification");
// const Admin = require("../models/Admin"); // Not currently used, often linked via User model

/* =====================================================
   1. DASHBOARD AND SYSTEM OVERVIEW
===================================================== */

/**
 * @desc Get aggregated count of all users, appointments, and pending verifications
 * @route GET /api/v1/admin/dashboard-stats
 * @access Private/Admin
 */
exports.getDashboardStats = asyncHandler(async (req, res, next) => {
    // Note: No checkPermission logic is needed here if it's handled by route middleware (authorize(['admin']))
    
    // Use Promise.all to fetch counts concurrently for speed
    const [
        patientCount, 
        practitionerCount, 
        totalUsers, 
        pendingVerificationCount, 
        activePractitioners
    ] = await Promise.all([
        Patient.countDocuments(),
        Practitioner.countDocuments(),
        User.countDocuments(),
        Verification.countDocuments({ kycStatus: "Pending" }),
        Practitioner.countDocuments({ isActive: true }),
    ]);

    res.status(200).json({
        success: true,
        data: {
            totalUsers,
            patientCount,
            practitionerCount,
            activePractitioners,
            pendingVerificationCount,
        },
    });
});

/* =====================================================
   2. USER MANAGEMENT
===================================================== */

/**
 * @desc Get a list of all users (Practitioners or Patients)
 * @route GET /api/v1/admin/users
 * @access Private/Admin
 */
exports.getAllUsers = asyncHandler(async (req, res, next) => {
    const { role } = req.query; // Filter by 'patient' or 'practitioner'

    let users;
    if (role === 'practitioner') {
        users = await Practitioner.find()
            .select("-password -__v") // Exclude fields
            .lean();
    } else if (role === 'patient') {
        users = await Patient.find()
            .select("-password -__v")
            .lean();
    } else {
        // Get all core User documents and populate their respective profiles
        users = await User.find()
            .select("-password -__v")
            .populate("patientProfile", "fullName phoneNumber gender dob -user")
            .populate("practitionerProfile", "fullName specialty practiceName -user")
            .lean();
    }

    res.status(200).json({
        success: true,
        count: users.length,
        data: users,
    });
});

/**
 * @desc Deactivate/Suspend a User (Patient or Practitioner)
 * @route PUT /api/v1/admin/user/:id/suspend
 * @access Private/Admin
 */
exports.suspendUser = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { reason, entityType } = req.body; // entityType is "Patient" or "Practitioner"

    if (!entityType) {
        return next(new BadRequestError("Entity type is required (Patient or Practitioner)."));
    }
    
    // Choose the correct Mongoose model based on the entityType
    const Model = entityType === "Practitioner" ? Practitioner : 
                  entityType === "Patient" ? Patient : 
                  null;

    if (!Model) {
        return next(new BadRequestError("Invalid entity type provided."));
    }

    // Use a transaction for atomicity (ensuring both profile and core user are updated)
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Update the profile (Patient/Practitioner)
        const updatedProfile = await Model.findByIdAndUpdate(
            id, 
            { $set: { isActive: false, suspensionReason: reason, suspensionDate: Date.now() } },
            { new: true, session }
        );
        
        if (!updatedProfile) {
            await session.abortTransaction();
            return next(new NotFoundError(`${entityType} not found with ID ${id}.`));
        }
        
        // 2. Deactivate the core User account (linked by the profile reference)
        const coreUser = await User.findOneAndUpdate(
            { [`${entityType.toLowerCase()}Profile`]: id },
            { $set: { isActive: false } },
            { session }
        );

        if (!coreUser) {
            // This is a data integrity issue, log it but proceed if profile updated successfully
            console.warn(`Core User not found for suspended ${entityType} profile ID ${id}`);
        }

        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message: `${entityType} ID ${id} has been suspended.`,
            data: { _id: updatedProfile._id, fullName: updatedProfile.fullName, isActive: updatedProfile.isActive },
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("suspendUser transaction error:", error);
        return next(new InternalServerError("Server error during suspension transaction."));
    } finally {
        session.endSession();
    }
});