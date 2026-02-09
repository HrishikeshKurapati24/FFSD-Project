/**
 * Test script to verify error handling middleware without database connection
 * Run with: node test-error-middleware.js
 */

const express = require('express');
const errorHandler = require('./middleware/errorHandler');
const { asyncErrorWrapper } = require('./middleware/asyncErrorWrapper');

const app = express();

// Basic middleware setup (minimal, no database required)
app.use(express.json());

// Test routes that simulate different error scenarios
app.get('/test-validation-error', (req, res) => {
    const error = new Error('Invalid input data');
    error.name = 'ValidationError';
    error.statusCode = 400;
    throw error;
});

app.get('/test-database-error', (req, res) => {
    const error = new Error('Database connection failed');
    error.name = 'MongoError';
    error.statusCode = 500;
    throw error;
});

app.get('/test-auth-error', (req, res) => {
    const error = new Error('Authentication required');
    error.name = 'JsonWebTokenError';
    error.statusCode = 401;
    throw error;
});

app.get('/test-async-error', asyncErrorWrapper(async (req, res) => {
    // Simulate an async operation that fails
    throw new Error('Async operation failed');
}));

app.get('/test-custom-error', (req, res) => {
    const error = new Error('Custom application error');
    error.statusCode = 422;
    throw error;
});

// API request simulation (set headers to simulate API request)
app.get('/test-api-response', (req, res) => {
    // Simulate API request by setting headers
    req.headers.accept = 'application/json';
    req.xhr = true;

    const error = new Error('API endpoint error');
    error.statusCode = 400;
    throw error;
});

// Error handling middleware (must be last)
app.use(errorHandler);

console.log('🧪 Error Handler Test Server');
console.log('Test these endpoints:');
console.log('• http://localhost:3001/test-validation-error');
console.log('• http://localhost:3001/test-database-error');
console.log('• http://localhost:3001/test-auth-error');
console.log('• http://localhost:3001/test-async-error');
console.log('• http://localhost:3001/test-custom-error');
console.log('• http://localhost:3001/test-api-response');
console.log('');
console.log('Check console for structured error logs!');

// Start test server on different port
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`🚀 Test server running on http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop');
});
