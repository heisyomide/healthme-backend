/**
 * @file paymentRoutes.js
 * @desc API routes for handling payment transactions.
 * Includes routes for initiating payment, verifying success, and processing webhooks.
 */
const express = require('express');
const { 
    initiatePayment, 
    verifyPayment, 
    paymentWebhook,
    getPaymentHistory,
} = require('../controllers/paymentController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// ======================================================
// Public Routes
// ======================================================

// Endpoint for payment gateways (e.g., Stripe, PayPal) to send status updates.
// This route is typically publicly accessible but secured via a secret signature/key.
router.post('/webhook', paymentWebhook); // Line 54 in the original error context.

// ======================================================
// Protected Routes
// ======================================================

// Initiate a payment session (e.g., for practitioner subscription)
router.post('/initiate', protect, initiatePayment);

// Manually verify a payment transaction status
router.get('/verify/:transactionId', protect, verifyPayment);

// Get a user's payment history
router.get('/history', protect, authorize(['patient', 'practitioner', 'admin']), getPaymentHistory);


module.exports = router;