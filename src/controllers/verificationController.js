/**
 * @file verificationController.js
 * @desc Controller functions for Admin management of KYC/KYP verification submissions.
 * Includes practitioner-facing document upload and status check functions.
 */
const mongoose = require("mongoose");
const asyncHandler = require('../middlewares/async');
const path = require('path');
const fs = require('fs');

const { 
    NotFoundError, 
    BadRequestError, 
    InternalServerError 
} = require('../utils/HttpError');

// Model Imports (Uncomment when created)
const Practitioner = require("../models/Practitioner");
const Verification = require("../models/Verification_temp");

/* =====================================================
   A. PRACTITIONER-FACING ROUTES (KYC Submission)
===================================================== */

/**
 * @desc Upload a single KYC document.
 * @route POST /api/v1/verification/kyc/upload
 * @access Private/Practitioner
 * NOTE: 'document' is the field name for multer.
 */
exports.uploadKycDocument = asyncHandler(async (req, res, next) => {
    // Multer attaches file info to req.file
    if (!req.file) {
        // This usually means Multer couldn't process the file (e.g., size or type limit reached)
        // If Multer throws an error, it needs to be caught by a separate Express error handler.
        return next(new BadRequestError("No file uploaded or file processing failed."));
    }

    const { filename, size, mimetype } = req.file;
    const practitionerId = req.user.profileId; 

    // 1. Create a new Verification document record in the database
    //    We need to check if a record for this practitioner already exists, 
    //    or create a new document submission entry linked to the Practitioner ID.
    
    // Placeholder response
    // const newSubmission = await Verification.create({ ... }); // Once model is ready
    
    res.status(201).json({
        success: true,
        message: "Document uploaded successfully. Awaiting admin review.",
        data: {
            fileName: filename,
            type: mimetype,
            size: size,
            practitioner: practitionerId
        }
    });
});

/**
 * @desc Get the practitioner's current verification status.
 * @route GET /api/v1/verification/kyc/status
 * @access Private/Practitioner
 */
exports.getKycStatus = asyncHandler(async (req, res, next) => {
    const practitionerId = req.user.profileId;

    // 1. Query the Verification model for all documents and the Practitioner model 
    //    for the main verification status (e.g., 'pending', 'verified', 'rejected')
    
    // Placeholder data
    const status = 'pending'; 
    const documents = [
        { name: "Medical License", status: "pending", file: "license-123.pdf" },
        { name: "Photo ID", status: "approved", file: "id-456.png" }
    ];

    res.status(200).json({
        success: true,
        status: status,
        documents: documents
    });
});

/**
 * @desc Practitioner deletes a previously uploaded document.
 * @route DELETE /api/v1/verification/kyc/:documentId
 * @access Private/Practitioner
 */
exports.deleteKycDocument = asyncHandler(async (req, res, next) => {
    const { documentId } = req.params;
    const practitionerId = req.user.profileId;

    // 1. Find the document in the database and verify ownership (practitionerId)
    // 2. If found, delete the record from the database.
    // 3. Crucially: Delete the file from the disk (fs.unlinkSync or fs.unlink)
    
    // Placeholder response
    res.status(200).json({
        success: true,
        message: `Document ID ${documentId} deleted successfully. (Requires file deletion logic)`
    });
});


/* =====================================================
   B. ADMIN-FACING ROUTES (KYC Review)
===================================================== */

/**
 * @desc Get all pending verification records for review (matching adminRoutes import)
 * @route GET /api/v1/admin/verification/list
 * @access Private/Admin
 */
exports.adminListSubmissions = asyncHandler(async (req, res, next) => {
    // Logic defined in previous step (adminReviewVerification)
    const pendingRecords = await Verification.find({ kycStatus: "Pending" })
      .select("entityId entityType documents kycStatus createdAt")
      .lean(); 

    res.status(200).json({
        success: true,
        count: pendingRecords.length,
        data: pendingRecords,
    });
});

/**
 * @desc Approve or reject a verification record (matching adminRoutes import)
 * @route PUT /api/v1/admin/verification/:id/review
 * @access Private/Admin
 */
exports.adminReviewVerification = asyncHandler(async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { status, rejectionReason } = req.body; 
        const verificationId = req.params.id;
        const adminProfileId = req.user.profileId; 

        if (!["Verified", "Rejected"].includes(status)) {
            await session.abortTransaction();
            return next(new BadRequestError("Invalid verification status. Must be 'Verified' or 'Rejected'."));
        }

        const verificationRecord = await Verification.findById(verificationId).session(session);

        if (!verificationRecord) {
            await session.abortTransaction();
            return next(new NotFoundError("Verification record not found."));
        }
        
        verificationRecord.kycStatus = status;
        verificationRecord.verifiedBy = adminProfileId; 
        verificationRecord.verificationDate = Date.now();
        verificationRecord.rejectionReason = status === "Rejected" ? rejectionReason : undefined;
        
        await verificationRecord.save({ session });

        if (status === "Verified" && verificationRecord.entityType === "Practitioner") {
            await Practitioner.updateOne(
                { _id: verificationRecord.entityId },
                { $set: { isVerified: true, isActive: true } },
                { session }
            );
        }
        
        await session.commitTransaction();

        res.status(200).json({ 
            success: true, 
            message: `${verificationRecord.entityType} verification updated to ${status}.` 
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("adminReviewVerification error:", error);
        return next(new InternalServerError("Server error updating verification status."));
    } finally {
        session.endSession();
    }
});


/**
 * @desc Admin: Retrieve a specific uploaded document (serves the file securely).
 * @route GET /api/v1/verification/admin/document/:documentPath
 * @access Private/Admin
 */
exports.getKycDocument = asyncHandler(async (req, res, next) => {
    const { documentPath } = req.params;
    
    // 1. Sanitize the documentPath to prevent directory traversal attacks.
    const sanitizedPath = path.normalize(documentPath).replace(/^(\.\.(\/|\\|$))+/, '');
    
    // 2. Construct the full file path.
    const fullPath = path.join(__dirname, '..', 'uploads', 'kyc', sanitizedPath);

    // 3. Ensure the file exists before attempting to send it.
    if (!fs.existsSync(fullPath)) {
        return next(new NotFoundError("Document not found."));
    }

    // 4. Securely send the file to the admin client.
    res.sendFile(fullPath, (err) => {
        if (err) {
            console.error('Error serving file:', err);
            return next(new InternalServerError("Failed to serve the document file."));
        }
    });
});