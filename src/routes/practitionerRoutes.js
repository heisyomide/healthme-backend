const express = require("express");
const router = express.Router();
const {
  getOverview,
  getAppointments,
  getPatients,
  getProfile,
  updateProfile,
  getAllPractitioners,
  getPractitionerById,
} = require("../controllers/practitionerController");
const { verifyToken } = require("../middlewares/authMiddleware");

// All routes require practitioner auth
router.use(verifyToken);

// Dashboard overview
router.get("/overview", getOverview);

// Appointments
router.get("/appointments", getAppointments);

// Patients
router.get("/patients", getPatients);

// Profile (view + edit)
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

router.get("/public", getAllPractitioners);
router.get("/public/:id", getPractitionerById);
module.exports = router;