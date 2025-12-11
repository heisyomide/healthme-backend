/**
 * @file authRoutes.js
 * @desc API routes for user authentication and identity management.
 * Standardizes endpoints for login, registration, and user session management.
 */
const express = require('express');
const {
    register,
    login,
    logout,
    getMe,
    forgotPassword,
    resetPassword,
    updatePassword,
} = require('../controllers/authController'); // Import controller functions
const { protect } = require('../middlewares/authMiddleware'); // Middleware for token protection

const router = express.Router();

// Public Routes (No authentication required)
router.post('/register', register);
router.post('/login', login);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resetToken', resetPassword);

// Protected Routes (Authentication required via the 'protect' middleware)
router.post('/logout', logout); // Logouts typically use POST/GET but require token to clear session
router.get('/me', protect, getMe);
router.put('/updatepassword', protect, updatePassword);


module.exports = router;