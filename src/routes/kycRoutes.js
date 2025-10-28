const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const KYC = require("../models/KYC");
const { verifyToken } = require("../middlewares/authMiddleware");

const router = express.Router();

/* -------------------------------------------
   🗂 Ensure Upload Folder Exists
------------------------------------------- */
const uploadDir = path.join(__dirname, "../../uploads/kyc");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/* -------------------------------------------
   📸 Multer File Upload Setup
------------------------------------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB file
  fileFilter: (req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".pdf"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error("Only JPG, PNG, or PDF files are allowed"));
    }
    cb(null, true);
  },
});

/* -------------------------------------------
   🧾 Submit KYC Info (Practitioners Only)
------------------------------------------- */
router.post(
  "/submit",
  verifyToken,
  upload.single("certificate"),
  async (req, res) => {
    try {
      const { specialization, licenseNumber, yearsOfExperience, bio } = req.body;

      // ✅ Validate required fields
      if (!specialization || !licenseNumber || !yearsOfExperience || !bio) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // ✅ Prevent duplicate submission
      const existingKyc = await KYC.findOne({ userId: req.user.id });
      if (existingKyc) {
        return res.status(400).json({ message: "KYC already submitted" });
      }

      const kyc = new KYC({
        userId: req.user.id,
        specialization,
        licenseNumber,
        yearsOfExperience,
        bio,
        certification: req.file
          ? `/uploads/kyc/${req.file.filename}`
          : null,
        status: "pending",
      });

      await kyc.save();

      res.status(201).json({
        message: "✅ KYC submitted successfully, awaiting admin approval",
        kyc,
      });
    } catch (err) {
      console.error("KYC Submission Error:", err);
      res.status(500).json({ message: "Server error, please try again later" });
    }
  }
);

/* -------------------------------------------
   🧠 Get Current User’s KYC Status
------------------------------------------- */
router.get("/status", verifyToken, async (req, res) => {
  try {
    const kyc = await KYC.findOne({ userId: req.user.id });
    if (!kyc) {
      return res.status(404).json({ message: "No KYC record found" });
    }
    res.json(kyc);
  } catch (err) {
    console.error("KYC Fetch Error:", err);
    res.status(500).json({ message: "Failed to fetch KYC data" });
  }
});

module.exports = router;