/**
 * @file errorResponse.js
 * @desc Custom Error Classes for HTTP Status Codes.
 * Used to throw errors in controllers that the errorHandler can correctly interpret.
 */

/**
 * Base custom error class for HTTP responses.
 */
class HttpError extends Error {
    /**
     * @param {string} message - The error message.
     * @param {number} statusCode - The HTTP status code.
     */
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name; 
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * 404 Not Found Error (Used in app.js for unhandled routes)
 */
class NotFoundError extends HttpError {
    constructor(message = 'Resource not found.') {
        super(message, 404);
    }
}

/**
 * 400 Bad Request Error 
 */
class BadRequestError extends HttpError {
    constructor(message = 'Invalid data provided.') {
        super(message, 400);
    }
}

/**
 * 401 Unauthorized Error 
 */
class UnauthorizedError extends HttpError {
    constructor(message = 'Authentication required.') {
        super(message, 401);
    }
}

/**
 * 403 Forbidden Error
 */
class ForbiddenError extends HttpError {
    constructor(message = 'Access forbidden.') {
        super(message, 403);
    }
}

/**
 * 409 Conflict Error
 */
class ConflictError extends HttpError {
    constructor(message = 'The resource already exists or conflicts with current state.') {
        super(message, 409);
    }
}

module.exports = {
    HttpError,
    NotFoundError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
};