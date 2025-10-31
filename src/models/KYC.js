const mongoose = require("mongoose");

const KYCSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    /* =====================================================
       👤 Personal Information
    ===================================================== */
    firstName: { type: String, required: true },
    middleName: { type: String },
    lastName: { type: String, required: true },
    gender: { type: String, enum: ["male", "female", "other"] },
    dateOfBirth: { type: Date },
    phoneNumber: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String, default: "Nigeria" },

    /* =====================================================
       🩺 Professional Information
    ===================================================== */
    specialization: { type: String },
    licenseNumber: { type: String },
    yearsOfExperience: { type: Number },
    bio: { type: String },
    clinicName: { type: String },
    clinicAddress: { type: String },

    /* =====================================================
       📄 Uploaded Documents
    ===================================================== */
    idDocument: { type: String }, // e.g. National ID or Passport
    licenseDocument: { type: String }, // Professional license
    certificateDocuments: [{ type: String }], // Multiple uploads

    /* =====================================================
       💳 Payment / Subscription Information
    ===================================================== */
    selectedPlan: {
      type: String,
      enum: ["basic", "pro", "premium"],
      required: false,
    },
    paymentAmount: { type: Number },
    paymentMethod: { type: String, default: "bank_transfer" },
    paymentProof: { type: String },
    paymentReference: { type: String },
    paymentDate: { type: Date },

    /* =====================================================
       🔍 Verification & Status Tracking
    ===================================================== */
    status: {
      type: String,
      enum: [
        "pending_payment",
        "payment_confirmed",
        "kyc_pending",
        "approved",
        "rejected",
      ],
      default: "pending_payment",
    },
    adminNote: { type: String },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },

    /* =====================================================
       📧 Notification / Meta
    ===================================================== */
    email: { type: String },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

module.exports = mongoose.model("KYC", KYCSchema);