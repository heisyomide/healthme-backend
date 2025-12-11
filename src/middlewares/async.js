/**
 * @file async.js
 * @desc Wrapper function to handle asynchronous Express route handlers.
 * Catches errors and passes them to the global error handler (`next(err)`).
 */

const asyncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;