const KYC = require("../models/KYC");
const User = require("../models/User");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/sendEmail");

/* =====================================================
   🩺 Create or Update Practitioner KYC
   (Frontend must include user info like email, name, etc.)
===================================================== */
exports.createOrUpdateKyc = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const updates = req.body;

    let kyc = userId
      ? await KYC.findOne({ userId })
      : await KYC.findOne({ email: updates.email });

    if (!kyc) {
      kyc = new KYC({ userId, ...updates });
    } else {
      Object.assign(kyc, updates);
    }

    // status logic
    if (req.body._complete) {
      kyc.status =
        kyc.status === "payment_confirmed"
          ? "kyc_pending"
          : "pending_payment";
    }

    await kyc.save();

    return res.status(200).json({ success: true, data: kyc });
  } catch (err) {
    console.error("createOrUpdateKyc error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error saving KYC" });
  }
};

/* =====================================================
   📤 Upload Practitioner Document
===================================================== */
exports.uploadDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const kyc = await KYC.findOne({ userId });
    if (!kyc)
      return res.status(404).json({ success: false, message: "KYC not found" });

    if (req.file) {
      const field = req.file.fieldname;
      const path = `/uploads/kyc/${req.file.filename};`

      if (field === "certificateDocuments") {
        kyc.certificateDocuments = kyc.certificateDocuments || [];
        kyc.certificateDocuments.push(path);
      } else {
        kyc[field] = path;
      }
    }

    await kyc.save();
    res.json({ success: true, kyc });
  } catch (err) {
    console.error("uploadDocument error:", err);
    res.status(500).json({ success: false, message: "Upload failed" });
  }
};

/* =====================================================
   🧑‍💼 Admin: View All KYC Submissions
===================================================== */
exports.adminListKycs = async (req, res) => {
  try {
    const items = await KYC.find()
      .populate("userId", "fullName email")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (err) {
    console.error("adminListKycs:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   ✅ Admin: Review KYC (approve / reject / confirm_payment)
===================================================== */
exports.adminReviewKyc = async (req, res) => {
  try {
    const { id } = req.params; // kyc id
    const { action, note } = req.body;
    const kyc = await KYC.findById(id);
    if (!kyc)
      return res.status(404).json({ success: false, message: "KYC not found" });

    if (action === "confirm_payment") {
      kyc.status = "payment_confirmed";
      await kyc.save();
      sendEmail(
        kyc.email,
        "Payment Confirmed",
        "We confirmed your subscription payment. Please proceed to KYC."
      );
      return res.json({ success: true, data: kyc });
    }

    if (action === "approve") {
      // 🟢 Create official Practitioner Account
      const existing = await User.findOne({ email: kyc.email });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Practitioner account already exists for this email.",
        });
      }

      const hashedPassword = await bcrypt.hash(kyc.password, 10);

      const newUser = await User.create({
        fullName: kyc.fullName,
        email: kyc.email,
        password: hashedPassword,
        phone: kyc.phone,
        age: kyc.age,
        gender: kyc.gender,
        country: kyc.country,
        role: "practitioner",
        isVerifiedPractitioner: true,
      });

      kyc.status = "approved";
      kyc.reviewedAt = new Date();
      kyc.reviewedBy = req.user.id;
      kyc.userId = newUser._id;
      await kyc.save();

      sendEmail(
        kyc.email,
        "KYC Approved",
        "Your KYC has been approved. Welcome to HealthMe as a verified practitioner!"
      );

      return res.json({ success: true, message: "KYC approved and practitioner account created.", data: kyc });
    }

    if (action === "reject") {
      kyc.status = "rejected";
      kyc.adminNote = note || "";
      kyc.reviewedAt = new Date();
      kyc.reviewedBy = req.user.id;
      await kyc.save();

      sendEmail(
        kyc.email,
        "KYC Rejected",
        `Your KYC was rejected. Reason: ${note || "See admin portal for more info."}`
      );

      return res.json({ success: true, message: "KYC rejected.", data: kyc });
    }

    return res.status(400).json({ success: false, message: "Invalid action" });
  } catch (err) {
    console.error("adminReviewKyc error:", err);
    res.status(500).json({ success: false, message: "Server error reviewing KYC" });
  }
};
// ✅ GET /api/kyc/me
exports.getMyKyc = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    // Try to find the user's KYC
    let kyc = await KYC.findOne({ userId });

    // If KYC doesn’t exist yet, create a placeholder (skip validation)
    if (!kyc) {
      kyc = new KYC({
        userId,
        status: "pending_payment",
      });

      // 🚨 This is the important line — skip validation for missing required fields
      await kyc.save({ validateBeforeSave: false });
    }

    // Also get basic user info
    const user = await User.findById(userId).select("fullName email role");

    return res.status(200).json({
      success: true,
      status: kyc.status || "pending_payment",
      data: { kyc, user },
    });
  } catch (err) {
    console.error("getMyKyc error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error while fetching KYC" });
  }
};