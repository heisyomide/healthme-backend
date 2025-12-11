// src/controllers/verificationController.js
const User = require("../models/User");
const Practitioner = require("../models/Practitioner");
const Verification = require("../models/Verification_temp"); // Our new model for KYC/KYP
const Transaction = require("../models/Transaction"); // For payment tracking
const sendEmail = require("../utils/sendMagicLogicEmail");
const mongoose = require("mongoose");
const path = require("path"); // Used for consistent path creation

/* =====================================================
   1. USER VIEW: Fetch Verification Status
===================================================== */

/**
 * @desc Get the verification record for the authenticated user
 * @route GET /api/v1/verification/me
 * @access Private/Authenticated User (Patient/Practitioner)
 */
exports.getMyVerification = async (req, res) => {
  try {
    const profileId = req.user.profileId; // The ID of the Patient or Practitioner profile
    const entityType = req.user.role === 'patient' ? 'Patient' : 'Practitioner';
    
    // Find the dedicated Verification record
    let verification = await Verification.findOne({ entityId: profileId, entityType });

    // If verification record doesn't exist (e.g., brand new profile), create a placeholder
    if (!verification) {
      verification = await Verification.create({
        entityId: profileId,
        entityType,
        kycStatus: "Pending",
      });
    }

    res.status(200).json({
      success: true,
      status: verification.kycStatus,
      data: verification,
    });
  } catch (err) {
    console.error("getMyVerification error:", err);
    return res.status(500).json({ success: false, message: "Server error fetching verification status." });
  }
};


/* =====================================================
   2. USER ACTION: Submit KYC/KYP Documents
===================================================== */

/**
 * @desc Upload a document and update the verification record
 * @route PUT /api/v1/verification/documents
 * @access Private/Authenticated User
 * @middleware upload.single/array (Requires Multer/file upload middleware)
 */
exports.uploadDocument = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const profileId = req.user.profileId;
    const entityType = req.user.role === 'patient' ? 'Patient' : 'Practitioner';

    if (!req.file) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }

    // Assuming the document type is passed in the request body, e.g., 'Driver's License'
    const { documentType } = req.body;
    const documentPath = `/uploads/verification/${req.file.filename}`;

    const verification = await Verification.findOne({ entityId: profileId, entityType }).session(session);

    if (!verification) {
        await session.abortTransaction();
        return res.status(404).json({ success: false, message: "Verification record not found." });
    }
    
    // 1. Add the new document to the array
    verification.documents.push({
      documentType: documentType || req.file.fieldname,
      documentUrl: documentPath,
      uploadDate: new Date(),
      verificationStatus: "Pending",
    });

    // 2. Set overall KYC status to 'In Review'
    verification.kycStatus = "In Review"; 

    await verification.save({ session });
    await session.commitTransaction();

    res.json({ 
        success: true, 
        message: "Document uploaded. Verification is now In Review.",
        data: verification
    });

  } catch (err) {
    await session.abortTransaction();
    console.error("uploadDocument error:", err);
    res.status(500).json({ success: false, message: "Upload and verification update failed." });
  } finally {
    session.endSession();
  }
};


/* =====================================================
   3. ADMIN VIEW: List Submissions
===================================================== */

/**
 * @desc Admin: View all verification submissions that are not Verified or Rejected
 * @route GET /api/v1/admin/verification/list
 * @access Private/Admin (Requires 'perform_verification' permission)
 */
exports.adminListSubmissions = async (req, res) => {
  try {
    const items = await Verification.find({ kycStatus: { $in: ["In Review", "Pending"] } })
      .sort({ createdAt: -1 })
      .lean();
      
    // Since entityId is a generic ID, you might need a secondary query to fetch full profile name/email.
    // For simplicity here, we return the raw records.

    res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    console.error("adminListSubmissions error:", err);
    res.status(500).json({ success: false, message: "Server error fetching KYC submissions." });
  }
};


/* =====================================================
   4. ADMIN ACTION: Review and Approve/Reject
===================================================== */

/**
 * @desc Admin: Approve or reject a verification submission
 * @route PUT /api/v1/admin/verification/:id/review
 * @access Private/Admin (Requires 'perform_verification' permission)
 */
exports.adminReviewVerification = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params; 
    const { action, note } = req.body; // action is 'approve' or 'reject'
    const adminProfileId = req.user.profileId; // Admin's profile ID

    if (!["approve", "reject"].includes(action)) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid action." });
    }

    const verification = await Verification.findById(id).session(session);
    if (!verification) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Verification record not found." });
    }

    const newStatus = action === "approve" ? "Verified" : "Rejected";

    // 1. Update the Verification record
    verification.kycStatus = newStatus;
    verification.rejectionReason = action === "reject" ? note : undefined;
    verification.reviewedAt = new Date();
    verification.verifiedBy = adminProfileId;
    await verification.save({ session });
    
    // 2. If approved, update the profile model (Practitioner or Patient)
    if (action === "approve") {
      const ProfileModel = verification.entityType === "Practitioner" ? Practitioner : (verification.entityType === "Patient" ? Patient : null);
      
      if (ProfileModel) {
        await ProfileModel.updateOne(
          { _id: verification.entityId },
          { $set: { isVerified: true, isActive: true } }, // Mark the profile as verified
          { session }
        );
      }
    }
    
    await session.commitTransaction();

    // 3. Send notification (Async, after transaction commit)
    // You would fetch the user's email from the Practitioner/Patient model here to send the email
    // Example: const profile = await Practitioner.findById(verification.entityId).select('email');
    // sendEmail(profile.email, ...);

    res.status(200).json({
      success: true,
      message: `${verification.entityType} verification ${action}d successfully.`,
      data: verification,
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("adminReviewVerification error:", err);
    res.status(500).json({ success: false, message: "Server error reviewing verification." });
  } finally {
    session.endSession();
  }
};