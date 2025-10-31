const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/authController");

const router = express.Router();

// 🧩 Step 1: Start registration
router.post("/register/start", authController.startRegistration);

// 🧩 Step 2: Confirm payment and create practitioner
router.post("/register/confirm-payment", authController.confirmPayment);

// 🔐 Login & Logout
router.post("/login", authController.login);
router.post("/logout", authController.logout);

module.exports = router;