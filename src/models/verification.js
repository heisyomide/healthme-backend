// src/models/Verification.js
const mongoose = require("mongoose");

// --- 1. Sub-Schema for Verification Documents ---
const documentSchema = new mongoose.Schema(
  {
    documentType: { 
      type: String, 
      enum: ["Passport", "Driver's License", "National ID", "Professional License", "Utility Bill"], 
      required: true 
    },
    documentUrl: { 
      type: String, 
      required: true 
    }, // Link to the file storage (e.g., S3 URL)
    uploadDate: {
      type: Date,
      default: Date.now
    },
    verificationStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending"
    },
    reason: {
      type: String, // Reason for rejection, if applicable
      trim: true
    }
  },
  { _id: false } // We don't need unique IDs for sub-documents in this array
);


// --- 2. Main Verification Schema ---
const verificationSchema = new mongoose.Schema(
  {
    // --- Entity Reference (Polymorphic Association) ---
    // Links to Patient, Practitioner, or Admin model
    entityId: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true,
      unique: true,
      sparse: true 
    },
    entityType: {
      type: String,
      required: true,
      enum: ["Patient", "Practitioner", "Admin"],
    },

    // --- KYC Status and Audit Trail ---
    kycStatus: {
      type: String,
      enum: ["Pending", "Verified", "Rejected", "Needs Review", "Expired"],
      default: "Pending",
      required: true,
    },
    verifiedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Admin", 
      required: false // The Admin/User who performed the final verification
    },
    verificationDate: { 
      type: Date 
    },
    rejectionReason: {
      type: String,
      trim: true
    },
    nextReviewDate: { 
      type: Date // For ongoing compliance checks
    },
    
    // --- Document Records (Uses the Sub-Schema) ---
    documents: [documentSchema],
    
  },
  { timestamps: true }
);

// Compound index for efficient lookup of the profile being verified
verificationSchema.index({ entityType: 1, entityId: 1 });

module.exports = mongoose.model("Verification", verificationSchema);