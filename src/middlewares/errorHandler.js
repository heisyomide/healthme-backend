/**
 * @file errorHandler.js
 * @desc Global Express error handling middleware.
 * It reads the status code from custom HttpError objects.
 */
const { HttpError } = require("../utils/HttpError"); // Path relative to src/middleware/

/**
 * Express error middleware must accept four arguments: (err, req, res, next).
 */
const errorHandler = (err, req, res, next) => {
    // 1. Determine Status Code
    // Check if the error is one of our custom HttpErrors
    const statusCode = err instanceof HttpError ? err.statusCode : 
                       res.statusCode === 200 ? 500 : res.statusCode || 500;

    // Set the status code on the response
    res.status(statusCode);

    // 2. Logging
    console.error(`[API ERROR] Status: ${statusCode} | Type: ${err.name} | Message: ${err.message}`);
    
    // 3. Send structured JSON Response
    res.json({
        success: false,
        status: statusCode,
        message: err.message || 'Internal Server Error',
        // Include stack trace only in development environment
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};

module.exports = errorHandler;