// /middlewares/verifyKycToken.js
const jwt = require("jsonwebtoken");
const Practitioner = require("../models/Practitioner");

module.exports = async (req, res, next) => {
  try {
    const token = req.query.token || req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const practitioner = await Practitioner.findById(decoded.practitionerId);
    if (!practitioner) {
      return res.status(404).json({ success: false, message: "Practitioner not found" });
    }

    req.practitioner = practitioner;
    next();
  } catch (error) {
    console.error("KYC token verification error:", error);
    return res.status(401).json({
      success: false,
      message:
        error.name === "TokenExpiredError"
          ? "KYC link expired"
          : "Invalid or malformed token",
    });
  }
};