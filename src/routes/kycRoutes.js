const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { verifyToken, protectAdmin } = require("../controllers/authController");
const kycController = require("../controllers/kycController");

/* =====================================================
   🗂 Multer Configuration — File Uploads
===================================================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/kyc");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${req.user.id}-${Date.now()}${ext};`
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max per file
  fileFilter: (req, file, cb) => {
    const allowed = [".png", ".jpg", ".jpeg", ".pdf"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error("Only PNG, JPG, JPEG, or PDF files are allowed"));
    }
    cb(null, true);
  },
});

/* =====================================================
   👤 Practitioner Routes (User Access)
===================================================== */

// ✅ Get current user’s KYC status
router.get("/me", verifyToken, kycController.getMyKyc);

// ✅ Submit or update KYC details
router.post("/save", verifyToken, kycController.createOrUpdateKyc);

// ✅ Upload KYC document (ID, license, or certificate)
router.post(
  "/upload",
  verifyToken,
  upload.single("file"),
  kycController.uploadDocument
);

/* =====================================================
   🧑‍💼 Admin Routes (Protected)
===================================================== */

// ✅ Get all KYCs (for admin dashboard)
router.get("/admin/all", protectAdmin, kycController.adminListKycs);

// ✅ Review KYC: approve, reject, or confirm payment
router.post("/admin/review/:id", protectAdmin, kycController.adminReviewKyc);

module.exports = router;