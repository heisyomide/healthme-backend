// src/services/verificationService.js
const Verification = require('../models/Verification');
const Practitioner = require('../models/Practitioner');
const Patient = require('../models/patient_temp');
const mongoose = require('mongoose');

/**
 * Approves a verification submission and updates the linked profile status atomically.
 * @param {string} verificationId - ID of the Verification document.
 * @param {string} adminProfileId - ID of the admin performing the action.
 * @returns {object} The updated Verification record.
 */
exports.approveVerification = async (verificationId, adminProfileId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const verification = await Verification.findById(verificationId).session(session);
        if (!verification) {
            throw new Error("Verification record not found.");
        }

        // 1. Update the Verification record
        verification.kycStatus = "Verified";
        verification.reviewedAt = new Date();
        verification.verifiedBy = adminProfileId;
        await verification.save({ session });
        
        // 2. Update the linked profile (Patient or Practitioner)
        const ProfileModel = verification.entityType === "Practitioner" ? Practitioner : Patient;
        
        await ProfileModel.updateOne(
            { _id: verification.entityId },
            { $set: { isVerified: true, isActive: true } }, 
            { session }
        );
        
        await session.commitTransaction();
        return verification;

    } catch (error) {
        await session.abortTransaction();
        throw new Error(`Failed to approve verification: ${error.message}`);
    } finally {
        session.endSession();
    }
};

/**
 * Rejects a verification submission.
 * @param {string} verificationId - ID of the Verification document.
 * @param {string} adminProfileId - ID of the admin performing the action.
 * @param {string} reason - The reason for rejection.
 * @returns {object} The updated Verification record.
 */
exports.rejectVerification = async (verificationId, adminProfileId, reason) => {
    const verification = await Verification.findById(verificationId);
    if (!verification) {
        throw new Error("Verification record not found.");
    }
    
    verification.kycStatus = "Rejected";
    verification.rejectionReason = reason;
    verification.reviewedAt = new Date();
    verification.verifiedBy = adminProfileId;

    await verification.save();
    return verification;
};