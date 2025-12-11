/**
 * @file authMiddleware.js
 * @desc Middleware for authentication (JWT verification) and authorization (Role-Based Access Control).
 * Uses custom HttpError classes for standardized error responses.
 */
const jwt = require("jsonwebtoken");
const asyncHandler = require('./async'); // Import the async error wrapper
const { 
    UnauthorizedError, 
    ForbiddenError 
} = require('../utils/HttpError'); // Import custom error classes

// NOTE: The User model must be available for the 'protect' function to work correctly.
// const User = require("../models/User"); 

/**
 * @desc Protects routes: Checks for a valid JWT in the Authorization header or cookie.
 * Attaches the authenticated user's details to req.user after validating against the database.
 */
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Check for the token in the 'Authorization' header (Preferred method)
  // Format expected: "Bearer <token>"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } 
  // Fallback: Check for token in cookies (Used for browser-based apps)
  else if (req.cookies.token) {
    token = req.cookies.token;
  }

  // 2. Check if token exists
  if (!token) {
    // Standardized 401 response via custom error
    return next(new UnauthorizedError("Not authorized, no token provided."));
  }

  try {
    // 3. Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. Find the user based on the ID inside the JWT
    // NOTE: Uncomment the User import when ready
    // const user = await User.findById(decoded.id).select("-password");

    // Placeholder for User lookup until models are created:
    const user = { 
        _id: decoded.id, 
        isActive: true, // Assume active for placeholder
        // Role and profileId should ideally be validated here too
    };

    if (!user) {
      return next(new UnauthorizedError("Not authorized, user not found."));
    }

    // 5. Attach essential user data to the request object
    req.user = {
      id: user._id, // Core User ID
      profileId: decoded.profileId, // The ID of the linked Patient/Practitioner profile
      role: decoded.role, // The role ('patient', 'practitioner', 'admin')
      isActive: user.isActive // Check if the core account is active
    };
    
    // 6. Proceed to the next middleware or controller
    next();
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    // Handles expired tokens, invalid signatures, etc.
    return next(new UnauthorizedError("Not authorized, token failed or expired."));
  }
});

// ---

/**
 * @desc Authorization middleware: Checks if the user has one of the required roles.
 * Must be used AFTER exports.protect.
 * @param {string[]} requiredRoles - Array of roles allowed to access the route (e.g., ['admin', 'practitioner'])
 */
exports.authorize = (requiredRoles) => {
  return (req, res, next) => {
    // req.user must be present from the 'protect' middleware
    if (!req.user) {
      // Should ideally be caught by 'protect', but serves as a safety net
      return next(new ForbiddenError("Access denied. Authentication required."));
    }

    // 1. Check Role Authorization
    if (!requiredRoles.includes(req.user.role)) {
      // Standardized 403 response for unauthorized role
      return next(new ForbiddenError(`Access denied. Role ${req.user.role} is not authorized for this route.`));
    }

    // 2. Check Account Status
    if (req.user.isActive === false) {
      // Standardized 403 response for inactive/suspended accounts
      return next(new ForbiddenError("Access denied. Your account is inactive or suspended."));
    }

    next();
  };
};