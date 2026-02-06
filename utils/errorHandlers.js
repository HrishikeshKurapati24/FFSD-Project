/**
 * Custom Error Classes and Role-Based Error Handlers
 * Provides structured error handling with user-type specific formatting
 */

// ==================== Custom Error Classes ====================

/**
 * Base Application Error
 */
class AppError extends Error {
    constructor(message, statusCode = 500, details = {}) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Validation Error - For input validation failures
 */
class ValidationError extends AppError {
    constructor(message, details = {}) {
        super(message, 400, details);
    }
}

/**
 * Authentication Error - For auth-related issues
 */
class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed', details = {}) {
        super(message, 401, details);
    }
}

/**
 * Authorization Error - For permission/access issues
 */
class AuthorizationError extends AppError {
    constructor(message = 'Access denied', details = {}) {
        super(message, 403, details);
    }
}

/**
 * Database Error - For MongoDB/connection issues
 */
class DatabaseError extends AppError {
    constructor(message = 'Database operation failed', details = {}) {
        super(message, 500, details);
    }
}

/**
 * Network Error - For external API failures
 */
class NetworkError extends AppError {
    constructor(message = 'Network request failed', details = {}) {
        super(message, 503, details);
    }
}

/**
 * Rate Limit Error - For rate limiting
 */
class RateLimitError extends AppError {
    constructor(message = 'Rate limit exceeded', details = {}) {
        super(message, 429, details);
    }
}

/**
 * Not Found Error - For resource not found
 */
class NotFoundError extends AppError {
    constructor(message = 'Resource not found', details = {}) {
        super(message, 404, details);
    }
}

// ==================== Base Error Handler ====================

/**
 * Base Error Handler - Common functionality for all handlers
 */
class BaseErrorHandler {
    constructor(userType = 'guest') {
        this.userType = userType;
    }

    /**
     * Format error for JSON API response
     */
    formatJSONError(error, context = {}) {
        const isProduction = process.env.NODE_ENV === 'production';

        return {
            success: false,
            message: error.message || 'An error occurred',
            errorCode: error.name || 'UNKNOWN_ERROR',
            statusCode: error.statusCode || 500,
            ...(error.details?.errors && { errors: error.details.errors }),
            ...(context.timestamp && { timestamp: context.timestamp }),
            ...(context.route && { path: context.route }),
            ...(!isProduction && error.stack && { stack: error.stack }),
            ...(!isProduction && error.details && { details: error.details })
        };
    }

    /**
     * Format error for HTML page rendering
     */
    formatHTMLError(error, context = {}) {
        return {
            error: {
                status: error.statusCode || 500,
                message: error.message || 'An error occurred',
                code: error.name || 'ERROR'
            },
            userType: this.userType,
            context: context,
            helpText: this.getHelpText(error),
            actionButtons: this.getActionButtons(error)
        };
    }

    /**
     * Get user-friendly help text based on error type
     */
    getHelpText(error) {
        const helpTexts = {
            ValidationError: 'Please check your input and try again.',
            AuthenticationError: 'Please sign in to continue.',
            AuthorizationError: 'You do not have permission to access this resource.',
            DatabaseError: 'We are experiencing technical difficulties. Please try again later.',
            NetworkError: 'Connection failed. Please check your internet connection.',
            RateLimitError: 'You have made too many requests. Please wait and try again.',
            NotFoundError: 'The requested resource could not be found.'
        };

        return helpTexts[error.name] || 'An unexpected error occurred. Please try again.';
    }

    /**
     * Get action buttons based on error type
     */
    getActionButtons(error) {
        const defaultButtons = [
            { text: 'Go Back', action: 'history.back()' },
            { text: 'Home', link: '/' }
        ];

        if (error.name === 'AuthenticationError') {
            return [
                { text: 'Sign In', link: '/SignIn' },
                { text: 'Home', link: '/' }
            ];
        }

        if (error.name === 'RateLimitError' && error.details?.redirectUrl) {
            return [
                { text: 'Upgrade Plan', link: error.details.redirectUrl },
                { text: 'Go Back', action: 'history.back()' }
            ];
        }

        return defaultButtons;
    }
}

// ==================== Role-Specific Error Handlers ====================

/**
 * Admin Error Handler
 */
class AdminErrorHandler extends BaseErrorHandler {
    constructor() {
        super('admin');
    }

    formatHTMLError(error, context = {}) {
        const baseError = super.formatHTMLError(error, context);
        return {
            ...baseError,
            showTechnicalDetails: true, // Admins see full technical details
            error: {
                ...baseError.error,
                stack: error.stack,
                details: error.details
            }
        };
    }

    getActionButtons(error) {
        return [
            { text: 'Admin Dashboard', link: '/admin/dashboard' },
            { text: 'View Logs', link: '/admin/logs' },
            { text: 'Go Back', action: 'history.back()' }
        ];
    }
}

/**
 * Brand Error Handler
 */
class BrandErrorHandler extends BaseErrorHandler {
    constructor() {
        super('brand');
    }

    getHelpText(error) {
        if (error.name === 'RateLimitError') {
            return 'You have reached your plan limit. Upgrade to create more campaigns or connect with more influencers.';
        }
        if (error.name === 'ValidationError' && error.details?.field === 'campaign') {
            return 'Please check your campaign details and ensure all required fields are filled correctly.';
        }
        return super.getHelpText(error);
    }

    getActionButtons(error) {
        if (error.name === 'RateLimitError') {
            return [
                { text: 'Upgrade Plan', link: '/subscription/manage' },
                { text: 'My Campaigns', link: '/brand/campaigns' },
                { text: 'Dashboard', link: '/brand/home' }
            ];
        }
        return [
            { text: 'Dashboard', link: '/brand/home' },
            { text: 'My Campaigns', link: '/brand/campaigns' },
            { text: 'Go Back', action: 'history.back()' }
        ];
    }
}

/**
 * Influencer Error Handler
 */
class InfluencerErrorHandler extends BaseErrorHandler {
    constructor() {
        super('influencer');
    }

    getHelpText(error) {
        if (error.name === 'RateLimitError') {
            return 'You have reached your plan limit for brand connections. Upgrade to connect with more brands.';
        }
        if (error.name === 'AuthorizationError' && error.message.includes('not verified')) {
            return 'Your account is pending verification. You will be able to apply to campaigns once verified.';
        }
        if (error.name === 'ValidationError' && error.details?.field === 'profile') {
            return 'Please ensure your profile information is complete and valid.';
        }
        return super.getHelpText(error);
    }

    getActionButtons(error) {
        if (error.name === 'RateLimitError') {
            return [
                { text: 'Upgrade Plan', link: '/subscription/manage' },
                { text: 'My Collaborations', link: '/influencer/collab' },
                { text: 'Dashboard', link: '/influencer/home' }
            ];
        }
        if (error.name === 'AuthorizationError' && error.message.includes('not verified')) {
            return [
                { text: 'View Profile', link: '/influencer/profile' },
                { text: 'Dashboard', link: '/influencer/home' }
            ];
        }
        return [
            { text: 'Dashboard', link: '/influencer/home' },
            { text: 'Collaborations', link: '/influencer/collab' },
            { text: 'Go Back', action: 'history.back()' }
        ];
    }
}

/**
 * Customer Error Handler
 */
class CustomerErrorHandler extends BaseErrorHandler {
    constructor() {
        super('customer');
    }

    getHelpText(error) {
        if (error.name === 'ValidationError' && error.details?.field === 'payment') {
            return 'Please check your payment information and try again.';
        }
        if (error.name === 'NotFoundError' && error.details?.resource === 'product') {
            return 'The product you are looking for is no longer available.';
        }
        return super.getHelpText(error);
    }

    getActionButtons(error) {
        return [
            { text: 'Browse Products', link: '/customer/products' },
            { text: 'My Orders', link: '/customer/orders' },
            { text: 'Home', link: '/' }
        ];
    }
}

/**
 * Auth/Guest Error Handler - For unauthenticated users
 */
class AuthErrorHandler extends BaseErrorHandler {
    constructor() {
        super('guest');
    }

    getHelpText(error) {
        if (error.name === 'AuthenticationError') {
            return 'Please sign in to access this page.';
        }
        if (error.name === 'ValidationError') {
            return 'Please check your information and try again.';
        }
        return super.getHelpText(error);
    }

    getActionButtons(error) {
        if (error.name === 'AuthenticationError') {
            return [
                { text: 'Sign In', link: '/SignIn' },
                { text: 'Sign Up', link: '/Sup_role' },
                { text: 'Home', link: '/' }
            ];
        }
        return [
            { text: 'Home', link: '/' },
            { text: 'About', link: '/about' }
        ];
    }
}

/**
 * Subscription Error Handler - For subscription-related errors
 */
class SubscriptionErrorHandler extends BaseErrorHandler {
    constructor() {
        super('subscription');
    }

    getHelpText(error) {
        if (error.name === 'ValidationError' && error.message.includes('card')) {
            return 'Please check your payment card details and try again.';
        }
        if (error.name === 'NetworkError' && error.message.includes('payment')) {
            return 'Payment processing failed. Please try again or use a different payment method.';
        }
        if (error.details?.expired) {
            return 'Your subscription has expired. Please renew to continue using premium features.';
        }
        return super.getHelpText(error);
    }

    getActionButtons(error) {
        if (error.details?.expired) {
            return [
                { text: 'Renew Subscription', link: '/subscription/manage' },
                { text: 'View Plans', link: '/subscription/plans' }
            ];
        }
        return [
            { text: 'Manage Subscription', link: '/subscription/manage' },
            { text: 'Go Back', action: 'history.back()' }
        ];
    }
}

// ==================== Exports ====================

module.exports = {
    // Error Classes
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    DatabaseError,
    NetworkError,
    RateLimitError,
    NotFoundError,

    // Error Handlers
    BaseErrorHandler,
    AdminErrorHandler,
    BrandErrorHandler,
    InfluencerErrorHandler,
    CustomerErrorHandler,
    AuthErrorHandler,
    SubscriptionErrorHandler
};
