/**
 * @file generateToken.js
 * @desc Utility functions for JWT generation and secure cookie handling.
 * This file serves as the core authentication helper for the controllers.
 */
const jwt = require("jsonwebtoken");

// The duration of the JWT in milliseconds (7 days)
const JWT_LIFETIME = 7 * 24 * 60 * 60 * 1000;

/**
 * Generates a JWT token for authentication.
 * @param {object} payload - The data to encode in the token (e.g., { id: '...', role: '...' }).
 * @returns {string} The generated JWT token.
 */
const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d', // Default to 7 days
    });
};

/**
 * Helper to set the auth token cookie in the Express response.
 * @param {object} res - Express response object.
 * @param {string} token - The JWT token or 'none' for logging out.
 * @param {boolean} [isLogout=false] - If true, sets the token to expire immediately.
 */
const setAuthCookie = (res, token, isLogout = false) => {
    // 1. Determine expiration based on action
    const expiry = isLogout ? new Date(Date.now() + 10 * 1000) : new Date(Date.now() + JWT_LIFETIME);

    const options = {
        httpOnly: true, // Prevents client-side JS access (XSS defense)
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Better cross-site protection
        secure: process.env.NODE_ENV === "production", // Requires HTTPS in production
        expires: expiry, 
    };

    // 2. Clear cookie immediately if logging out
    if (isLogout) {
        // Set the token value to 'none' and expire it immediately
        res.cookie("token", "none", options);
    } else {
        // Set the token with the correct expiration
        res.cookie("token", token, options);
    }
};

// Export the primary token generator function as default
module.exports = generateToken;
// Export the cookie setter as a named helper function
module.exports.setAuthCookie = setAuthCookie;