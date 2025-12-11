// src/middleware/checkPaidMiddleware.js
const Transaction = require("../models/Transaction");
const Practitioner = require("../models/Practitioner");

/**
 * @desc Middleware to check if the authenticated Practitioner has a current, completed payment.
 * @route Used on Private/Practitioner routes requiring an active subscription.
 */
exports.checkPaid = async (req, res, next) => {
  // 1. Ensure the user is authenticated and is a Practitioner
  if (!req.user || req.user.role !== 'practitioner') {
    return res.status(403).json({ 
        success: false, 
        message: "Access denied. Only authenticated Practitioners can use this feature." 
    });
  }

  const practitionerId = req.user.profileId; 
  
  try {
    // Determine the required subscription duration (e.g., last 30 days for a monthly plan)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // 2. Query the Transaction model for a recent, successful subscription payment
    const requiredPayment = await Transaction.findOne({
      practitioner: practitionerId,
      transactionType: { $in: ["Subscription Fee", "Initial Fee"] }, // Look for payment types related to access
      status: "Completed",
      transactionDate: { $gte: thirtyDaysAgo } // Check if the payment occurred within the last 30 days
    })
    .sort({ transactionDate: -1 }) // Get the most recent one
    .lean();

    // 3. Check the result
    if (requiredPayment) {
      // Payment found and is recent. Access granted.
      req.user.hasActiveSubscription = true; // Optionally attach status to req.user
      next();
    } else {
      // No valid, recent payment found. Access denied.
      // You may want to check if the Practitioner is still within a grace period here.
      return res.status(402).json({ 
        success: false, 
        message: "Payment required. Your subscription is not active or has expired. Please update your payment information." 
      });
    }

  } catch (error) {
    console.error("checkPaidMiddleware error:", error);
    res.status(500).json({ success: false, message: "Server error during payment verification." });
  }
};