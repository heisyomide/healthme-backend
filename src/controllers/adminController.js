// src/controllers/adminController.js
const mongoose = require("mongoose");
const User = require("../models/User");
const KYC = require("../models/KYC");
const Appointment = require("../models/Appointment");
const Support = require("../models/SupportMessage");

// 🧠 Helper: Validate ObjectId
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/* =====================================================
   📊 ADMIN DASHBOARD OVERVIEW
===================================================== */
exports.overview = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPractitioners = await User.countDocuments({ role: "practitioner" });
    const activeSessions = await Appointment.countDocuments({ status: "ongoing" });
    const latestUser = await User.findOne().sort({ updatedAt: -1 }).lean();

    return res.json({
      success: true,
      data: {
        totalUsers,
        totalPractitioners,
        activeSessions,
        dbHealthy: !!latestUser,
      },
    });
  } catch (err) {
    console.error("Admin overview error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   👩‍⚕ GET PRACTITIONERS (paginated)
===================================================== */
exports.getPractitioners = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1"));
    const perPage = Math.min(50, parseInt(req.query.limit || "20"));
    const query = { role: "practitioner" };

    const total = await User.countDocuments(query);
    const items = await User.find(query)
      .select("-password")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean();

    return res.json({ success: true, data: { items, page, perPage, total } });
  } catch (err) {
    console.error("Get practitioners error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   👥 GET USERS (patients)
===================================================== */
exports.getUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1"));
    const perPage = Math.min(50, parseInt(req.query.limit || "20"));
    const query = { role: "user" };

    const total = await User.countDocuments(query);
    const items = await User.find(query)
      .select("-password")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean();

    return res.json({ success: true, data: { items, page, perPage, total } });
  } catch (err) {
    console.error("Get users error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   🪪 KYC QUEUE (pending requests)
===================================================== */
exports.getKycQueue = async (req, res) => {
  try {
    const queue = await KYC.find()
      .populate("userId", "fullName email role")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: queue });
  } catch (err) {
    console.error("Get KYC queue error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   📝 UPDATE KYC STATUS (approve / reject)
===================================================== */
exports.updateKycStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, adminNote } = req.body;

    if (!isValidObjectId(id))
      return res.status(400).json({ success: false, message: "Invalid KYC ID format" });

    const kyc = await KYC.findById(id);
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
    kyc.reviewedBy = req.user?.id || null;
    await kyc.save();

    return res.json({ success: true, message: KYC `${action}d, data: kyc `});
  } catch (err) {
    console.error("Update KYC error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   🧾 SECURITY LOGS (stub)
===================================================== */
exports.getSecurityLogs = async (req, res) => {
  try {
    const logs = [
      { id: 1, type: "login_attempt", user: "user@example.com", outcome: "success", at: new Date() },
      { id: 2, type: "kyc_submit", user: "dr.jane@example.com", outcome: "submitted", at: new Date() },
    ];
    return res.json({ success: true, data: logs });
  } catch (err) {
    console.error("Get logs error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   💬 SUPPORT MESSAGES
===================================================== */
exports.getSupportMessages = async (req, res) => {
  try {
    const messages = await Support.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data: messages });
  } catch (err) {
    console.error("Get support messages error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   📩 RESPOND TO SUPPORT
===================================================== */
exports.respondSupport = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!isValidObjectId(id))
      return res.status(400).json({ success: false, message: "Invalid Support ID format" });

    const support = await Support.findById(id);
    if (!support)
      return res.status(404).json({ success: false, message: "Support message not found" });

    support.responses = support.responses || [];
    support.responses.push({
      adminId: req.user?.id || null,
      message,
      at: new Date(),
    });
    support.status = "answered";
    await support.save();

    return res.json({ success: true, message: "Response sent", data: support });
  } catch (err) {
    console.error("Respond support error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};