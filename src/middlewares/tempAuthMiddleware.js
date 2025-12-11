// src/middleware/tempAuthMiddleware.js
const jwt = require("jsonwebtoken");
const TempPractitioner = require("../models/TempPractitioner"); // Use your temporary model

/**
 * @desc Protects routes requiring validation against a temporary ID (e.g., payment submission).
 * Assumes the JWT payload contains: { tempId: <temp_user_id> }
 */
exports.protectTemp = async (req, res, next) => {
  let token;

  // 1. Check for the token in the 'Authorization' header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // 2. Verify the temporary token using the standard JWT secret
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // 3. Find the temporary record based on the ID inside the JWT
      const tempUser = await TempPractitioner.findById(decoded.tempId);

      if (!tempUser) {
        return res.status(401).json({ success: false, message: "Not authorized, temporary record not found." });
      }

      // 4. Attach the temporary record to the request object
      // This allows subsequent controllers to access the temp user's details (email, etc.)
      req.tempUser = tempUser;
      
      // 5. Proceed to the next middleware or controller (e.g., confirmPayment)
      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success: false, message: "Not authorized, temporary token failed." });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized, no temporary token provided." });
  }
};