const mongoose = require("mongoose");
const Practitioner = require("../models/Practitioner");
const Appointment = require("../models/Appointment");
const User = require("../models/User");

/* =====================================================
   🧠 Helper Functions
===================================================== */
function getUserId(req) {
  if (req.user && req.user.id) return req.user.id;
  if (req.query && req.query.userId) return req.query.userId;
  return null;
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function calcProfileCompletion(p) {
  const fields = [
    p.fullName,
    p.email,
    p.specialization,
    p.bio,
    p.profilePicture,
    p.location,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

/* =====================================================
   📊 Practitioner Dashboard Overview
===================================================== */
exports.getOverview = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId)
      return res.status(400).json({ success: false, message: "User ID missing" });
    if (!isValidObjectId(userId))
      return res.status(400).json({ success: false, message: "Invalid User ID format" });

    const practitioner = await Practitioner.findOne({ user: userId })
      .populate("patients", "fullName email")
      .populate("appointments");

    if (!practitioner)
      return res
        .status(404)
        .json({ success: false, message: "Practitioner profile not found" });

    const totalPatients = practitioner.patients?.length || 0;
    const upcomingAppointments =
      practitioner.appointments?.filter((a) => a.status === "scheduled").length || 0;
    const completedAppointments =
      practitioner.appointments?.filter((a) => a.status === "completed").length || 0;

    res.json({
      success: true,
      data: {
        totalPatients,
        upcomingAppointments,
        completedAppointments,
        ratings: practitioner.ratings || [],
        profileCompletion: calcProfileCompletion(practitioner),
      },
    });
  } catch (err) {
    console.error("getOverview error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   📅 Get All Appointments (for Practitioner)
===================================================== */
exports.getAppointments = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId)
      return res.status(400).json({ success: false, message: "User ID missing" });
    if (!isValidObjectId(userId))
      return res.status(400).json({ success: false, message: "Invalid User ID format" });

    const appointments = await Appointment.find({ practitioner: userId })
      .populate("patient", "fullName email")
      .sort({ date: 1 })
      .lean();

    res.json({ success: true, data: appointments });
  } catch (err) {
    console.error("getAppointments error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   👥 Get All Patients Assigned to Practitioner
===================================================== */
exports.getPatients = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId)
      return res.status(400).json({ success: false, message: "User ID missing" });
    if (!isValidObjectId(userId))
      return res.status(400).json({ success: false, message: "Invalid User ID format" });

    const practitioner = await Practitioner.findOne({ user: userId })
      .populate("patients", "fullName email");

    if (!practitioner)
      return res.status(404).json({ success: false, message: "Practitioner not found" });

    res.json({ success: true, data: practitioner.patients });
  } catch (err) {
    console.error("getPatients error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   👤 Get Practitioner Profile
===================================================== */
exports.getProfile = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId)
      return res.status(400).json({ success: false, message: "User ID missing" });
    if (!isValidObjectId(userId))
      return res.status(400).json({ success: false, message: "Invalid User ID format" });

    const practitioner = await Practitioner.findOne({ user: userId })
      .select("-password")
      .lean();

    if (!practitioner)
      return res
        .status(404)
        .json({ success: false, message: "Practitioner profile not found" });

    res.json({ success: true, data: practitioner });
  } catch (err) {
    console.error("getProfile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   ✏ Update Practitioner Profile
===================================================== */
exports.updateProfile = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId)
      return res.status(400).json({ success: false, message: "User ID missing" });
    if (!isValidObjectId(userId))
      return res.status(400).json({ success: false, message: "Invalid User ID format" });

    const updates = req.body;
    const practitioner = await Practitioner.findOneAndUpdate({ user: userId }, updates, {
      new: true,
    }).select("-password");

    if (!practitioner)
      return res
        .status(404)
        .json({ success: false, message: "Practitioner not found" });

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: practitioner,
    });
  } catch (err) {
    console.error("updateProfile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   🌍 Get All Active Practitioners (Public)
===================================================== */
exports.getAllPractitioners = async (req, res) => {
  try {
    const practitioners = await Practitioner.find({ isActive: true })
      .select(
        "fullName specialization focus bio experienceYears location ratings profilePicture availability"
      )
      .lean();

    res.status(200).json({
      success: true,
      count: practitioners.length,
      data: practitioners,
    });
  } catch (err) {
    console.error("getAllPractitioners error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   🔎 Get Single Practitioner (Public)
===================================================== */
exports.getPractitionerById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id))
      return res.status(400).json({ success: false, message: "Invalid practitioner ID" });

    const practitioner = await Practitioner.findById(id)
      .select(
        "fullName specialization focus bio experienceYears location ratings profilePicture availability"
      )
      .lean();

    if (!practitioner)
      return res
        .status(404)
        .json({ success: false, message: "Practitioner not found" });

    res.status(200).json({ success: true, data: practitioner });
  } catch (err) {
    console.error("getPractitionerById error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};