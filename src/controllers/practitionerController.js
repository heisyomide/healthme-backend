const Practitioner = require("../models/Practitioner");
const Appointment = require("../models/Appointment");
const User = require("../models/User");

// === Get Practitioner Overview ===
exports.getOverview = async (req, res) => {
  try {
    // 🩺 Find practitioner linked to this user
    const practitioner = await Practitioner.findOne({ user: req.user._id })
      .populate("patients", "fullName email")
      .populate("appointments");

    if (!practitioner) {
      return res.status(404).json({
        success: false,
        message: "Practitioner profile not found for this user.",
      });
    }

    const totalPatients = practitioner.patients?.length || 0;
    const upcomingAppointments = practitioner.appointments?.filter(
      (a) => a.status === "scheduled"
    ).length || 0;

    const completedAppointments = practitioner.appointments?.filter(
      (a) => a.status === "completed"
    ).length || 0;

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
    console.error("Overview error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// Helper to calculate profile completeness %
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

// === Get All Appointments ===
exports.getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      practitioner: req.user.id,
    })
      .populate("patient", "fullName email")
      .sort({ date: 1 });

    res.json({ success: true, data: appointments });
  } catch (err) {
    console.error("Appointments error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// === Get Patients ===
exports.getPatients = async (req, res) => {
  try {
    const practitioner = await Practitioner.findOne({ user: req.user._id })
      .populate("patients", "fullName email");

    if (!practitioner) {
      return res.status(404).json({ success: false, message: "Practitioner not found" });
    }

    res.json({ success: true, data: practitioner.patients });
  } catch (err) {
    console.error("Patients error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// === Get Profile Info ===
exports.getProfile = async (req, res) => {
  try {
    const practitioner = await Practitioner.findById(req.user.id).select(
      "-password"
    );
    res.json({ success: true, data: practitioner });
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// === Update Profile ===
exports.updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    const practitioner = await Practitioner.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true }
    ).select("-password");

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: practitioner,
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all active practitioners (for public listing)
exports.getAllPractitioners = async (req, res) => {
  try {
    const practitioners = await Practitioner.find({ isActive: true })
      .select("fullName specialization focus bio experienceYears location ratings profilePicture availability");

    res.status(200).json({
      success: true,
      count: practitioners.length,
      data: practitioners,
    });
  } catch (err) {
    console.error("Error fetching practitioners:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get single practitioner public profile
exports.getPractitionerById = async (req, res) => {
  try {
    const practitioner = await Practitioner.findById(req.params.id)
      .select("fullName specialization focus bio experienceYears location ratings profilePicture availability");

    if (!practitioner) {
      return res.status(404).json({ success: false, message: "Practitioner not found" });
    }

    res.status(200).json({ success: true, data: practitioner });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};