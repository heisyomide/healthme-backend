// src/controllers/kycController.js
const Kyc = require("../models/KYC");
const User = require("../models/User");

/**
 * 📤 Submit KYC (Practitioner sends form)
 */
exports.submitKyc = async (req, res) => {
  try {
    // If auth middleware sets req.user, use it; otherwise fallback to req.body.userId
    const userId = req.user?.id || req.body.userId;
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID missing" });
    }

    const { specialization, licenseNumber, yearsOfExperience, bio } = req.body;

    const existingKyc = await Kyc.findOne({ userId });
    if (existingKyc && existingKyc.status === "pending") {
      return res
        .status(400)
        .json({ success: false, message: "KYC already submitted and pending review" });
    }

    const kyc = new Kyc({
      userId,
      specialization,
      licenseNumber,
      yearsOfExperience,
      bio,
      certification: req.file ? req.file.filename : null,
      status: "pending",
    });

    await kyc.save();

    res.status(201).json({ success: true, message: "KYC submitted successfully", kyc });
  } catch (err) {
    console.error("Submit KYC error:", err);
    res.status(500).json({ success: false, message: "Failed to submit KYC" });
  }
};

/**
 * 📋 Get All KYCs (Admin view)
 */
exports.getAllKycs = async (req, res) => {
  try {
    const kycs = await Kyc.find()
      .populate("userId", "fullName email role")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: kycs });
  } catch (err) {
    console.error("Get all KYCs error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch KYCs" });
  }
};

/**
 * 🔍 Get Single KYC by ID
 */
exports.getKycById = async (req, res) => {
  try {
    const { id } = req.params;
    const kyc = await Kyc.findById(id).populate("userId", "fullName email role");
    if (!kyc) {
      return res.status(404).json({ success: false, message: "KYC not found" });
    }

    res.status(200).json({ success: true, data: kyc });
  } catch (err) {
    console.error("Get KYC by ID error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch KYC" });
  }
};

/**
 * 🧾 Approve or Reject KYC (Admin)
 */
exports.updateKycStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, adminNote } = req.body;

    const kyc = await Kyc.findById(id);
    if (!kyc) return res.status(404).json({ success: false, message: "KYC not found" });

    if (action === "approve") {
      kyc.status = "approved";
      await User.findByIdAndUpdate(kyc.userId, { role: "practitioner" });
    } else if (action === "reject") {
      kyc.status = "rejected";
    } else {
      return res.status(400).json({ success: false, message: "Invalid action" });
    }

    kyc.adminNote = adminNote || "";
    kyc.reviewedAt = new Date();
    await kyc.save();

    res.status(200).json({ success: true, message: KYC `${action}d successfully, data: kyc `});
  } catch (err) {
    console.error("Update KYC status error:", err);
    res.status(500).json({ success: false, message: "Failed to update KYC status" });
  }
};