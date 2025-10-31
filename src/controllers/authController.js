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

    if (role === "practitioner") {
      // Don’t create DB record yet — practitioner goes to subscription page
      return res.status(200).json({
        success: true,
        message: "Proceed to subscription before completing signup.",
        nextStep: "/practitioners/terms&sub",
        tempUser: {
          fullName,
          email,
          password,
          phone,
          age,
          gender,
          country,
          reasonForJoining,
          role,
        },
      });
    }

    // ✅ Normal patient registration:
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

    res.status(201).json({
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
   🧩 STEP 1 — START PRACTITIONER REGISTRATION
===================================================== */
exports.startRegistration = async (req, res) => {
  try {
    const { fullName, email, password, phone, country, gender, age } = req.body;

    if (!email || !password || !fullName)
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });

    // Ensure user doesn’t already exist
    const existing = await User.findOne({ email });
    if (existing)
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });

    // Step 1 doesn’t save to DB yet, frontend holds state until payment
    res.json({
      success: true,
      message: "Registration step 1 complete. Proceed to payment.",
      tempData: { fullName, email, password, phone, country, gender, age },
    });
  } catch (err) {
    console.error("startRegistration error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   💳 STEP 2 — CONFIRM PAYMENT & CREATE PRACTITIONER
===================================================== */
exports.confirmPayment = async (req, res) => {
  try {
    const { fullName, email, password, phone, age, gender, country } = req.body;

    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });

    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing)
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create practitioner user
    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      phone,
      age,
      gender,
      country,
      role: "practitioner",
      isPractitionerPaid: true,
    });

    const token = generateToken({ id: user._id, role: user.role });
    setCookie(res, token);

    res.status(201).json({
      success: true,
      message: "Payment confirmed. Practitioner account created successfully.",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      token,
      redirectUrl: "/kyc",
    });
  } catch (err) {
    console.error("confirmPayment error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   🔐 LOGIN
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

    res.status(200).json({
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