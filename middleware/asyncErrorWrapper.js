/**
 * Async Error Wrapper Middleware
 * Wraps async route handlers to catch errors and pass them to the error handler
 * Eliminates the need for try-catch blocks in every async route
 */

/**
 * Wraps an async function to catch errors and pass them to next()
 * @param {Function} fn - The async route handler function
 * @returns {Function} Wrapped function that catches errors
 */
const asyncErrorWrapper = (fn) => {
    return (req, res, next) => {
        // Wrap the function call in a promise to catch both sync and async errors
        Promise.resolve().then(() => fn(req, res, next)).catch(next);
    };
};

/**
 * Alternative wrapper that preserves the original function's context
 * Useful for methods that need 'this' binding
 * @param {Function} fn - The async route handler function
 * @returns {Function} Wrapped function that catches errors
 */
const asyncErrorWrapperWithContext = (fn) => {
    return function(req, res, next) {
        // Execute the async function and catch any errors
        Promise.resolve(fn.call(this, req, res, next)).catch((error) => {
            // Pass the error to the error handling middleware
            next(error);
        });
    };
};

module.exports = {
    asyncErrorWrapper,
    asyncErrorWrapperWithContext
};
