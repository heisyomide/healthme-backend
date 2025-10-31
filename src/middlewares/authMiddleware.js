const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ✅ Verify Token for all users
exports.verifyToken = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token ||
      req.headers["authorization"]?.replace("Bearer ", "");

    if (!token)
      return res.status(401).json({ success: false, message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("verifyToken error:", error);
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

// ✅ Protect Admin routes
exports.protectAdmin = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token ||
      req.headers["authorization"]?.replace("Bearer ", "");
    if (!token)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.role !== "admin")
      return res.status(403).json({ success: false, message: "Forbidden" });

    req.user = decoded;
    next();
  } catch (error) {
    console.error("protectAdmin error:", error);
    res.status(401).json({ success: false, message: "Unauthorized" });
  }
};