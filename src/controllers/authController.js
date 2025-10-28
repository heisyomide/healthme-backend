const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

/* =====================================================
   🧠 Helper: Set Auth Cookie
===================================================== */
const setCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production", // HTTPS only in prod
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });
};

/* =====================================================
   👤 REGISTER USER / PRACTITIONER / ADMIN
===================================================== */
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const {
    fullName,
    email,
    password,
    phone,
    age,
    gender,
    country,
    reasonForJoining,
    role, // user | practitioner | admin
  } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ success: false, message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      phone,
      age,
      gender,
      country,
      reasonForJoining,
      role: role || "user",
    });

    const token = generateToken({ id: user._id, role: user.role });
    setCookie(res, token);

    let redirectUrl = "/";
    if (user.role === "admin") redirectUrl = "/admin/dashboard";
    else if (user.role === "practitioner") redirectUrl = "/practitioner/dashboard";

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      token,
      redirectUrl,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during registration",
    });
  }
};

/* =====================================================
   🔐 LOGIN USER / PRACTITIONER / ADMIN
===================================================== */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ success: false, message: "Invalid credentials" });

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ success: false, message: "Invalid credentials" });

    // Generate JWT token
    const token = generateToken({ id: user._id, role: user.role });
    setCookie(res, token);

    // Decide redirect based on role
    let redirectUrl = "/";
    if (user.role === "admin") redirectUrl = "/dashboard/admin";
    else if (user.role === "practitioner") redirectUrl = "/dashboard/practitioner";

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      token,
      redirectUrl,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during login",
    });
  }
};

/* =====================================================
   🚪 LOGOUT
===================================================== */
exports.logout = (req, res) => {
  try {
    res.cookie("token", "", {
      httpOnly: true,
      expires: new Date(0),
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    });
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ success: false, message: "Error logging out" });
  }
};