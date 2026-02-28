/**
 * Centralized Error Handling Middleware
 * Provides comprehensive error handling compatible with existing Express.js application
 */

const errorHandler = (err, req, res, next) => {
    // Get user info if available (from session or JWT)
    const userInfo = req.session?.user || req.user || null;

    // Log error with metadata
    const errorLog = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        user: userInfo ? {
            id: userInfo.id,
            userType: userInfo.userType,
            email: userInfo.email
        } : null,
        error: {
            name: err.name,
            message: err.message,
            stack: err.stack,
            statusCode: err.statusCode || err.status || 500
        }
    };

    // Categorize error type
    let errorCategory = 'unknown';
    if (err.name === 'ValidationError') errorCategory = 'validation';
    else if (err.name === 'CastError') errorCategory = 'database_cast';
    else if (err.name === 'MongoError' || err.name === 'MongoServerError') errorCategory = 'database';
    else if (err.name === 'JsonWebTokenError') errorCategory = 'authentication';
    else if (err.name === 'TokenExpiredError') errorCategory = 'authentication_expired';
    else if (err.code === 'EBADCSRFTOKEN') errorCategory = 'csrf';
    else if (err.statusCode >= 400 && err.statusCode < 500) errorCategory = 'client_error';
    else if (err.statusCode >= 500) errorCategory = 'server_error';

    errorLog.error.category = errorCategory;

    // Log error (use different levels based on severity)
    if (err.statusCode >= 500) {
        console.error('🚨 CRITICAL ERROR:', JSON.stringify(errorLog, null, 2));
    } else if (err.statusCode >= 400) {
        console.warn('⚠️ CLIENT ERROR:', JSON.stringify(errorLog, null, 2));
    } else {
        console.log('ℹ️ INFO ERROR:', JSON.stringify(errorLog, null, 2));
    }

    // Set status code
    const statusCode = err.statusCode || err.status || 500;

    // Prepare error response
    const errorResponse = {
        success: false,
        error: {
            code: errorCategory.toUpperCase().replace('_', ' '),
            message: err.message || 'An unexpected error occurred',
            timestamp: new Date().toISOString()
        }
    };

    // Add additional details in development
    if (process.env.NODE_ENV === 'development') {
        errorResponse.error.details = err.stack;
        errorResponse.error.originalError = err.name;
    }

    // Always return JSON — app is a pure REST API, no EJS views
    return res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;
