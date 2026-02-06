/**
 * Error Middleware
 * Provides async error handling wrapper and 404 handler
 */

/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors and pass to next()
 * 
 * Usage:
 * router.get('/route', asyncHandler(async (req, res) => {
 *   // Your async code here
 * }));
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * 404 Not Found Handler
 * Catches all unmatched routes and creates a 404 error
 */
const notFoundHandler = (req, res, next) => {
    const { NotFoundError } = require('../utils/errorHandlers');
    const error = new NotFoundError(`Page not found - ${req.originalUrl}`);
    next(error);
};

/**
 * Validation Error Handler
 * Handles express-validator validation errors
 */
const handleValidationError = (errors) => {
    const { ValidationError } = require('../utils/errorHandlers');

    // Format validation errors
    const formattedErrors = errors.array().map(err => ({
        field: err.param || err.path,
        message: err.msg,
        value: err.value
    }));

    throw new ValidationError('Validation failed', {
        errors: formattedErrors
    });
};

/**
 * Database Error Handler
 * Converts MongoDB errors to appropriate AppError types
 */
const handleDatabaseError = (error) => {
    const { DatabaseError, ValidationError, NotFoundError } = require('../utils/errorHandlers');

    // Duplicate key error
    if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new ValidationError(`${field} already exists`, {
            field,
            code: error.code
        });
    }

    // Cast error (invalid ObjectId)
    if (error.name === 'CastError') {
        throw new NotFoundError(`Invalid ${error.path}: ${error.value}`);
    }

    // Validation error
    if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => ({
            field: err.path,
            message: err.message
        }));
        throw new ValidationError('Database validation failed', { errors });
    }

    // Generic database error
    throw new DatabaseError('Database operation failed', {
        originalError: error.message
    });
};

/**
 * Multer Error Handler
 * Handles file upload errors from multer
 */
const handleMulterError = (error) => {
    const { ValidationError } = require('../utils/errorHandlers');

    if (error.code === 'LIMIT_FILE_SIZE') {
        throw new ValidationError('File size too large. Maximum size is 50MB.');
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
        throw new ValidationError('Too many files. Maximum is 10 files.');
    }

    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        throw new ValidationError('Unexpected file field.');
    }

    throw new ValidationError('File upload failed', {
        originalError: error.message
    });
};

module.exports = {
    asyncHandler,
    notFoundHandler,
    handleValidationError,
    handleDatabaseError,
    handleMulterError
};
