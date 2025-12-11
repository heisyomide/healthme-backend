/**
 * @file HttpError.js
 * @desc Defines custom HttpError classes for standardized API error responses.
 * These errors carry an HTTP status code that the global error handler reads.
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
        
        // This captures the stack trace correctly
        Error.captureStackTrace(this, this.constructor);
    }
}

/** 404 Not Found Error */
class NotFoundError extends HttpError {
    constructor(message = 'Resource not found.') {
        super(message, 404);
    }
}

/** 400 Bad Request Error (Client-side validation error) */
class BadRequestError extends HttpError {
    constructor(message = 'Invalid data provided.') {
        super(message, 400);
    }
}

/** 401 Unauthorized Error (Authentication failure) */
class UnauthorizedError extends HttpError {
    constructor(message = 'Authentication required.') {
        super(message, 401);
    }
}

/** 403 Forbidden Error (Authorization failure/Permissions missing) */
class ForbiddenError extends HttpError {
    constructor(message = 'Access forbidden.') {
        super(message, 403);
    }
}

/** 409 Conflict Error */
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