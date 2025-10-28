// routes/patientRoutes.js
const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");

// optional: import your auth middleware and use verifyToken to set req.user
// const { verifyToken } = require("../middlewares/authMiddleware");

router.get("/metrics", /* verifyToken, */ patientController.getMetrics);
router.get("/appointments", /* verifyToken, */ patientController.getAppointments);
router.get("/summary", /* verifyToken, */ patientController.getSummary);
router.get("/health-progress", /* verifyToken, */ patientController.getHealthProgress);
router.get("/report", /* verifyToken, */ patientController.getReport);
router.get("/treatment", /* verifyToken, */ patientController.getTreatment);
router.get("/medicine", /* verifyToken, */ patientController.getMedicine);


module.exports = router;