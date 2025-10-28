const mongoose = require("mongoose");

const kycSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    specialization: String,
    licenseNumber: String,
    yearsOfExperience: Number,
    bio: String,
    certificate: String,
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("KYC", kycSchema);