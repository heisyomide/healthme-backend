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
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });
};

/* =====================================================
   👤 REGISTER USER (PATIENT ONLY)
   Practitioners are NOT created yet — they go to /terms&sub first.
===================================================== */
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const {
      fullName,
      email,
      password,
      phone,
      age,
      gender,
      country,
      reasonForJoining,
      role,
    } = req.body;

    // if practitioner → skip DB creation for now
    if (role === "practitioner") {
      return res.status(200).json({
        success: true,
        message: "Proceed to subscription before completing signup.",
        nextStep: "/practitioners/terms&sub",
        tempUser: {
          fullName,
          email,
          password, // frontend can re-hash later if you want
          phone,
          age,
          gender,
          country,
          reasonForJoining,
          role,
        },
      });
    }

    // ✅ For normal patient registration:
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });

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
      role: "patient",
    });

    const token = generateToken({ id: user._id, role: user.role });
    setCookie(res, token);

    return res.status(201).json({
      success: true,
      message: "Patient registered successfully.",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      token,
      redirectUrl: "/login",
    });
  } catch (error) {
    console.error("Register error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error during registration" });
  }
};

/* =====================================================
   🔐 LOGIN (All users)
===================================================== */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });

    const token = generateToken({ id: user._id, role: user.role });
    setCookie(res, token);

    let redirectUrl = "/";
    if (user.role === "admin") redirectUrl = "/dashboard/admin";
    else if (user.role === "practitioner")
      redirectUrl = "/dashboard/practitioner";

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
    res
      .status(500)
      .json({ success: false, message: "Server error during login" });
  }
};

/* =====================================================
   🚪 LOGOUT
===================================================== */
exports.logout = async (req, res) => {
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