const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/authController");

const router = express.Router();

// === Register Route ===
router.post(
  "/register",
  [
    body("fullName").trim().notEmpty().withMessage("Full name is required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("age").optional().isNumeric().withMessage("Age must be a number"),
    body("gender").optional().isString(),
    body("country").optional().isString(),
    body("phone").optional().isString(),
    body("reasonForJoining").optional().isString(),
    body("role")
      .optional()
      .isIn(["user", "practitioner", "admin"])
      .withMessage("Invalid role"),
  ],
  authController.register
);

// === Login Route ===
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  authController.login
);

// === Logout Route ===
router.post("/logout", authController.logout);

module.exports = router;