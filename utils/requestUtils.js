/**
 * Detects if the current request is an API request (expects JSON)
 * or a page request (expects HTML/navigation)
 * 
 * @param {Object} req - Express request object
 * @param {Array} additionalApiRoutes - Optional array of additional routes to treat as API
 * @returns {Boolean} - True if it's an API request, false otherwise
 */
const isAPIRequest = (req, additionalApiRoutes = []) => {
    // Check explicit headers first
    const acceptHeader = (req.headers.accept || req.headers['accept'] || '').toLowerCase();

    // Explicitly requesting HTML (like browser navigation)
    // and NOT also requesting JSON (like some fetch calls)
    if (acceptHeader.includes('text/html') && !acceptHeader.includes('application/json')) {
        return false;
    }

    // Check if explicitly requesting JSON
    if (acceptHeader.includes('application/json')) return true;

    // Check XHR header (standard for many frontend libraries)
    if (req.xhr) return true;

    const fullPath = req.originalUrl || req.url || req.path || '';
    const pathOnly = fullPath.split('?')[0].toLowerCase();

    // Check specific API path prefixes
    if (pathOnly.startsWith('/api/')) return true;

    // Check additional routes provided
    if (additionalApiRoutes.some(route =>
        pathOnly === route.toLowerCase() || pathOnly.startsWith(route.toLowerCase() + '/')
    )) {
        return true;
    }

    // Check Content-Type header
    const contentType = (req.headers['content-type'] || '').toLowerCase();
    if (contentType.includes('application/json')) return true;

    // Check origin/referer (convenient for local development with React/Vite)
    const origin = (req.headers.origin || '').toLowerCase();
    const referer = (req.headers.referer || '').toLowerCase();
    if (origin.includes('localhost:5173') || origin.includes('localhost:3000') ||
        referer.includes('localhost:5173') || referer.includes('localhost:3000')) {
        return true;
    }

    // Default to false for everything else
    return false;
};

module.exports = {
    isAPIRequest
};
