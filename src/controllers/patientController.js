const mongoose = require("mongoose");
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const TreatmentPlan = require("../models/TreatmentPlan");
const Medicine = require("../models/Medicine");
const Metrics = require("../models/Metrics");
const Report = require("../models/Report");
const HealthProgress = require("../models/HealthProgress");

function getUserId(req) {
  if (req.user && req.user.id) return req.user.id;
  if (req.query && req.query.userId) return req.query.userId;
  return null;
}

// Helper to validate ObjectId format
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * GET /api/patient/metrics
 */
exports.getMetrics = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId)
      return res.status(400).json({ success: false, message: "User ID missing" });
    if (!isValidObjectId(userId))
      return res.status(400).json({ success: false, message: "Invalid User ID format" });

    const metrics = await Metrics.findOne({ patient: userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: metrics || {} });
  } catch (err) {
    console.error("getMetrics error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET /api/patient/appointments
 */
exports.getAppointments = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId)
      return res.status(400).json({ success: false, message: "User ID missing" });
    if (!isValidObjectId(userId))
      return res.status(400).json({ success: false, message: "Invalid User ID format" });

    const appointments = await Appointment.find({
      patient: userId,
      date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    })
      .populate("practitioner", "fullName profilePicture specialization")
      .sort({ date: 1 })
      .lean();

    return res.json({ success: true, data: { appointments } });
  } catch (err) {
    console.error("getAppointments error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET /api/patient/summary
 */
exports.getSummary = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId)
      return res.status(400).json({ success: false, message: "User ID missing" });
    if (!isValidObjectId(userId))
      return res.status(400).json({ success: false, message: "Invalid User ID format" });

    const summary = await Metrics.findOne({ patient: userId })
      .sort({ createdAt: -1 })
      .select("heartRate systolic vrSessions")
      .lean();

    return res.json({ success: true, data: summary || {} });
  } catch (err) {
    console.error("getSummary error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET /api/patient/health-progress
 */
exports.getHealthProgress = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId)
      return res.status(400).json({ success: false, message: "User ID missing" });
    if (!isValidObjectId(userId))
      return res.status(400).json({ success: false, message: "Invalid User ID format" });

    const progress = await HealthProgress.findOne({ patient: userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: progress || {} });
  } catch (err) {
    console.error("getHealthProgress error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET /api/patient/report
 */
exports.getReport = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId)
      return res.status(400).json({ success: false, message: "User ID missing" });
    if (!isValidObjectId(userId))
      return res.status(400).json({ success: false, message: "Invalid User ID format" });

    const report = await Report.find({ patient: userId })
      .sort({ createdAt: 1 })
      .select("label value")
      .lean();

    return res.json({ success: true, data: { report } });
  } catch (err) {
    console.error("getReport error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET /api/patient/treatment
 */
exports.getTreatment = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId)
      return res.status(400).json({ success: false, message: "User ID missing" });
    if (!isValidObjectId(userId))
      return res.status(400).json({ success: false, message: "Invalid User ID format" });

    const plan = await TreatmentPlan.findOne({ patient: userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: plan || {} });
  } catch (err) {
    console.error("getTreatment error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET /api/patient/medicine
 */
exports.getMedicine = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId)
      return res.status(400).json({ success: false, message: "User ID missing" });
    if (!isValidObjectId(userId))
      return res.status(400).json({ success: false, message: "Invalid User ID format" });

    const med = await Medicine.find({ patient: userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: { medicine: med } });
  } catch (err) {
    console.error("getMedicine error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};