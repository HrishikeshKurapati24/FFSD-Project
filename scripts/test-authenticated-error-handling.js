/**
 * Comprehensive Test Script for Authenticated Error Handling Middleware
 * Tests various error scenarios with authentication to verify middleware implementation
 *
 * Run with: node test-authenticated-error-handling.js
 */

const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const errorHandler = require('../middleware/errorHandler');
const { asyncErrorWrapper } = require('../middleware/asyncErrorWrapper');

// Mock authentication middleware
const mockAuth = (req, res, next) => {
    // Simulate authenticated user
    req.session = req.session || {};
    req.session.user = {
        id: '507f1f77bcf86cd799439011',
        userType: 'brand',
        email: 'test@example.com',
        displayName: 'Test User'
    };
    req.user = req.session.user;
    next();
};

const app = express();

// Basic middleware setup
app.use(express.json());
app.use(cookieParser());
app.use(session({
    secret: 'test-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true }
}));

// Test routes for different error scenarios

// 1. Authentication Error (401)
app.get('/test-auth-error', (req, res) => {
    const error = new Error('Authentication required');
    error.name = 'JsonWebTokenError';
    error.statusCode = 401;
    throw error;
});

// 2. Authorization Error (403)
app.get('/test-authz-error', mockAuth, (req, res) => {
    const error = new Error('Access denied: Insufficient permissions');
    error.statusCode = 403;
    throw error;
});

// 3. Validation Error (400)
app.post('/test-validation-error', mockAuth, (req, res) => {
    const error = new Error('Invalid input: email format incorrect');
    error.name = 'ValidationError';
    error.statusCode = 400;
    throw error;
});

// 4. Database Error (500)
app.get('/test-db-error', mockAuth, (req, res) => {
    const error = new Error('Database connection failed');
    error.name = 'MongoError';
    error.statusCode = 500;
    throw error;
});

// 5. Async Error with Wrapper
app.get('/test-async-error', mockAuth, asyncErrorWrapper(async (req, res) => {
    // Simulate async database operation failure
    await new Promise(resolve => setTimeout(resolve, 100));
    throw new Error('Async database operation failed');
}));

// 6. Custom Application Error (422)
app.post('/test-custom-error', mockAuth, (req, res) => {
    const error = new Error('Business logic violation: Campaign budget exceeded');
    error.statusCode = 422;
    throw error;
});

// 7. File Upload Error (413)
app.post('/test-upload-error', mockAuth, (req, res) => {
    const error = new Error('File too large: Maximum size is 10MB');
    error.statusCode = 413;
    throw error;
});

// 8. Rate Limiting Error (429)
app.get('/test-rate-limit', mockAuth, (req, res) => {
    const error = new Error('Too many requests: Rate limit exceeded');
    error.statusCode = 429;
    throw error;
});

// 9. Service Unavailable (503)
app.get('/test-service-unavailable', mockAuth, (req, res) => {
    const error = new Error('External service temporarily unavailable');
    error.statusCode = 503;
    throw error;
});

// 10. Internal Server Error (500) - Generic
app.get('/test-internal-error', mockAuth, (req, res) => {
    throw new Error('Unexpected internal server error');
});

// 11. Page Request Error (should render HTML)
app.get('/test-page-error', mockAuth, (req, res) => {
    // Simulate page request (no JSON accept header)
    req.headers.accept = 'text/html,application/xhtml+xml';
    const error = new Error('Page rendering failed');
    error.statusCode = 500;
    throw error;
});

// 12. API Request Error (should return JSON)
app.get('/test-api-error', mockAuth, (req, res) => {
    // Simulate API request
    req.headers.accept = 'application/json';
    req.xhr = true;
    const error = new Error('API operation failed');
    error.statusCode = 400;
    throw error;
});

// 13. Subscription-specific error
app.get('/test-subscription-error', mockAuth, (req, res) => {
    const error = new Error('Subscription limit reached: Maximum campaigns exceeded');
    error.statusCode = 402; // Payment required
    throw error;
});

// 14. CSRF Error
app.post('/test-csrf-error', mockAuth, (req, res) => {
    const error = new Error('CSRF token validation failed');
    error.code = 'EBADCSRFTOKEN';
    error.statusCode = 403;
    throw error;
});

// 15. Timeout Error
app.get('/test-timeout-error', mockAuth, async (req, res) => {
    // Simulate timeout
    await new Promise(resolve => setTimeout(resolve, 31000)); // 31 seconds
    res.json({ success: true });
});

// Error handling middleware (must be last)
app.use(errorHandler);

console.log('🧪 Authenticated Error Handler Test Server');
console.log('==========================================');
console.log('Test these endpoints (all require authentication):');
console.log('');

console.log('🔐 AUTHENTICATION ERRORS:');
console.log('• http://localhost:3002/test-auth-error (401)');
console.log('• http://localhost:3002/test-authz-error (403)');
console.log('');

console.log('📝 VALIDATION ERRORS:');
console.log('• POST http://localhost:3002/test-validation-error (400)');
console.log('• POST http://localhost:3002/test-csrf-error (403)');
console.log('');

console.log('🗄️ DATABASE ERRORS:');
console.log('• http://localhost:3002/test-db-error (500)');
console.log('• http://localhost:3002/test-async-error (500)');
console.log('');

console.log('⚙️ APPLICATION ERRORS:');
console.log('• POST http://localhost:3002/test-custom-error (422)');
console.log('• POST http://localhost:3002/test-upload-error (413)');
console.log('• http://localhost:3002/test-rate-limit (429)');
console.log('• http://localhost:3002/test-service-unavailable (503)');
console.log('• http://localhost:3002/test-internal-error (500)');
console.log('');

console.log('🌐 RESPONSE TYPE ERRORS:');
console.log('• http://localhost:3002/test-page-error (HTML response)');
console.log('• http://localhost:3002/test-api-error (JSON response)');
console.log('');

console.log('💰 BUSINESS LOGIC ERRORS:');
console.log('• http://localhost:3002/test-subscription-error (402)');
console.log('');

console.log('⏱️ TIMEOUT ERRORS:');
console.log('• http://localhost:3002/test-timeout-error (408 - simulated)');
console.log('');

console.log('📊 EXPECTED RESPONSES:');
console.log('• API requests (Accept: application/json) → JSON error response');
console.log('• Page requests → HTML error page render');
console.log('• All errors → Structured console logs with metadata');
console.log('');

console.log('🛠️ MANUAL TESTING COMMANDS:');
console.log('');
console.log('# Test API error response:');
console.log('curl -H "Accept: application/json" http://localhost:3002/test-db-error');
console.log('');
console.log('# Test page error response:');
console.log('curl http://localhost:3002/test-db-error');
console.log('');
console.log('# Test validation error:');
console.log('curl -X POST -H "Content-Type: application/json" -d "{}" http://localhost:3002/test-validation-error');
console.log('');
console.log('# Test async error wrapper:');
console.log('curl http://localhost:3002/test-async-error');
console.log('');

// Start test server on different port
const PORT = 3002;
app.listen(PORT, () => {
    console.log(`🚀 Test server running on http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop');
    console.log('==========================================');
});
