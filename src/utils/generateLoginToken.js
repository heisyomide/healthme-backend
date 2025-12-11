// src/utils/generateToken.js
const jwt = require("jsonwebtoken");

/**
 * Generates a JSON Web Token (JWT) for the given payload.
 * * @param {object} payload - The data to encode (e.g., { id, role, profileId }).
 * @param {string} expiresIn - The expiration time string (e.g., '30d', '1h').
 * @returns {string} The signed JWT.
 */
const generateToken = (payload, expiresIn = "30d") => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: expiresIn,
  });
};

module.exports = generateToken;