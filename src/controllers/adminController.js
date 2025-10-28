// src/controllers/adminController.js
const User = require("../models/User");
const KYC = require("../models/KYC");
const Appointment = require("../models/Appointment");
const Support = require("../models/SupportMessage");

// Overview: counts and simple DB health check
exports.overview = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPractitioners = await User.countDocuments({ role: "practitioner" });
    const activeSessions = await Appointment.countDocuments({ status: "ongoing" }); // adapt to your schema
    // Simple DB health (last write timestamp or connectivity)
    const latestUser = await User.findOne().sort({ updatedAt: -1 }).lean();

    res.json({
      totalUsers,
      totalPractitioners,
      activeSessions,
      dbHealthy: !!latestUser,
    });
  } catch (err) {
    console.error("Admin overview error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get paginated list of practitioners
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

    res.json({ items, page, perPage, total });
  } catch (err) {
    console.error("Get practitioners:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get paginated list of users (patients)
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

    res.json({ items, page, perPage, total });
  } catch (err) {
    console.error("Get users:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// KYC queue
exports.getKycQueue = async (req, res) => {
  try {
    const queue = await KYC.find()
      .populate("userId", "fullName email role")
      .sort({ createdAt: -1 })
      .lean();
    res.json(queue);
  } catch (err) {
    console.error("Get KYC queue:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Approve or reject a KYC
exports.updateKycStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, adminNote } = req.body; // action: "approve" or "reject"
    const kyc = await KYC.findById(id);
    if (!kyc) return res.status(404).json({ message: "KYC not found" });

    if (action === "approve") {
      kyc.status = "approved";
    } else if (action === "reject") {
      kyc.status = "rejected";
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }

    kyc.adminNote = adminNote || "";
    kyc.reviewedAt = new Date();
    kyc.reviewedBy = req.admin ? req.admin._id : req.user?.id || null;

    await kyc.save();

    // (Optional) update user role to practitioner when approved
    if (action === "approve") {
      await User.findByIdAndUpdate(kyc.userId, { role: "practitioner" });
    }

    res.json({ message: `KYC ${action}d`, kyc });
  } catch (err) {
    console.error("Update KYC:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Simple security logs stub
exports.getSecurityLogs = async (req, res) => {
  try {
    // If you have a logs collection, query it. For now return stub data:
    const logs = [
      { id: 1, type: "login_attempt", user: "user@example.com", ip: "127.0.0.1", outcome: "success", at: new Date() },
      { id: 2, type: "kyc_submit", user: "dr.jane@example.com", ip: "127.0.0.1", outcome: "submitted", at: new Date() },
    ];
    res.json(logs);
  } catch (err) {
    console.error("Get logs:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Support messages list
exports.getSupportMessages = async (req, res) => {
  try {
    const messages = await Support.find().sort({ createdAt: -1 }).lean();
    res.json(messages);
  } catch (err) {
    console.error("Get support messages:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Respond to support (admin reply)
exports.respondSupport = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const support = await Support.findById(id);
    if (!support) return res.status(404).json({ message: "Support message not found" });

    support.responses = support.responses || [];
    support.responses.push({
      adminId: req.admin ? req.admin._id : req.user?.id || null,
      message,
      at: new Date(),
    });
    support.status = "answered";
    await support.save();

    res.json({ message: "Response sent", support });
  } catch (err) {
    console.error("Respond support:", err);
    res.status(500).json({ message: "Server error" });
  }
};