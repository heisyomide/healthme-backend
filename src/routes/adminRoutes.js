// src/routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { protectAdmin } = require("../middlewares/authMiddleware");

// All admin routes should be protected with protectAdmin middleware
router.get("/overview", protectAdmin, adminController.overview);
router.get("/practitioners", protectAdmin, adminController.getPractitioners);
router.get("/users", protectAdmin, adminController.getUsers);
router.get("/kyc", protectAdmin, adminController.getKycQueue);
router.post("/kyc/:id", protectAdmin, adminController.updateKycStatus); // body: { action: "approve"|"reject", adminNote }
router.get("/logs", protectAdmin, adminController.getSecurityLogs);
router.get("/support", protectAdmin, adminController.getSupportMessages);
router.post("/support/:id/respond", protectAdmin, adminController.respondSupport);

module.exports = router;