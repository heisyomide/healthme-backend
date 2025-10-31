const KYC = require("../models/KYC");
const User = require("../models/User");

// middleware expects req.user to be set by verifyToken
module.exports = async function ensurePaid(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    const kyc = await KYC.findOne({ userId });
    // If no KYC object yet, check subscription/payment flag on user or KYC status
    // We'll use either a user.isPaid flag or kyc.status === 'payment_confirmed'
    const user = await User.findById(userId);
    const hasPaid = user?.isPractitionerPaid || (kyc && kyc.status === "payment_confirmed");

    if (!hasPaid) {
      return res.status(403).json({
        success: false,
        message: "Payment required before completing KYC. Please complete subscription/payment first."
      });
    }
    next();
  } catch (err) {
    console.error("ensurePaid error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};