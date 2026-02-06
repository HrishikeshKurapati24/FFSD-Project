const express = require('express');
const router = express.Router();
const { DashboardController, AnalyticsController, FeedbackController, PaymentController, UserManagementController, CollaborationController, CustomerController, NotificationController } = require('../controllers/AdminController');
const { Admin } = require('../models/mongoDB');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

// Helper function to detect API requests
const isAPIRequest = (req) => {
    // Check explicit headers first
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return true;
    }
    if (req.xhr) {
        return true;
    }

    // Get the full path (originalUrl includes the full path with query string)
    const fullPath = req.originalUrl || req.url || req.path || '';
    const pathOnly = fullPath.split('?')[0]; // Remove query string

    if (pathOnly.startsWith('/api/')) {
        return true;
    }
    if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
        return true;
    }

    // Check origin/referer for React app
    const origin = req.headers.origin || '';
    const referer = req.headers.referer || '';
    if (origin.includes('localhost:5173') || origin.includes('localhost:3000') ||
        referer.includes('localhost:5173') || referer.includes('localhost:3000')) {
        return true;
    }

    // For admin routes that are commonly called from React via fetch(), assume API request
    // unless it's a direct browser navigation (has text/html in accept)
    // Note: req.path is relative to the router mount point, so '/admin/dashboard' becomes '/dashboard'
    const adminAPIRoutes = [
        '/admin/verify', '/verify',
        '/admin/dashboard', '/dashboard',
        '/admin/user_management', '/user_management',
        '/admin/customer-management', '/customer-management',
        '/admin/collaboration_monitoring', '/collaboration_monitoring',
        '/admin/payment_verification', '/payment_verification',
        '/admin/feedback_and_moderation', '/feedback_and_moderation',
        '/admin/brand-analytics', '/brand-analytics',
        '/admin/influencer-analytics', '/influencer-analytics',
        '/admin/campaign-analytics', '/campaign-analytics',
        '/admin/notifications', '/notifications'
    ];

    const isAdminAPIRoute = adminAPIRoutes.some(route =>
        pathOnly === route || pathOnly.startsWith(route + '/')
    );

    if (isAdminAPIRoute) {
        // If explicitly requesting HTML (browser navigation), it's a page request
        const acceptHeader = req.headers.accept || '';
        if (acceptHeader.includes('text/html') && !acceptHeader.includes('application/json')) {
            return false;
        }
        // For fetch() calls from React, there's usually no Accept header or it doesn't include text/html
        // So if it's one of these routes and not explicitly requesting HTML, treat as API request
        return true;
    }

    return false;
};

// Helper function to verify JWT token from cookie for admin
const verifyAdminJWTFromCookie = (req) => {
    try {
        const token = req.cookies?.adminToken;

        if (!token) {
            return null;
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Return admin info from token
        return {
            userId: decoded.userId,
            userType: decoded.userType,
            role: decoded.role
        };
    } catch (error) {
        // Handle token expiration and other JWT errors
        if (error.name === 'TokenExpiredError') {
            console.log('Admin JWT token expired');
            return null;
        } else if (error.name === 'JsonWebTokenError') {
            console.log('Invalid admin JWT token');
            return null;
        }
        console.error('Admin JWT verification error:', error);
        return null;
    }
};

// Admin Auth Middleware (supports both session and JWT)
const adminAuth = async (req, res, next) => {
    try {
        let adminUser = null;
        let userId = null;
        let userRole = null;

        // First check for session (for EJS pages)
        if (req.session && req.session.userId) {
            userId = req.session.userId;
            userRole = req.session.role;
        } else {
            // If no session, check for JWT token in cookie (for React API)
            const jwtAdmin = verifyAdminJWTFromCookie(req);
            if (jwtAdmin) {
                userId = jwtAdmin.userId;
                userRole = jwtAdmin.role;
            }
        }

        // If no authentication found
        if (!userId) {
            // Check if this is an API request (JSON expected)
            if (isAPIRequest(req)) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized',
                    error: 'Authentication required. Please sign in again.'
                });
            }
            return res.redirect('/admin/login');
        }

        // Verify admin user exists and has admin role
        adminUser = await Admin.findOne({ userId });
        if (!adminUser || adminUser.role !== 'admin') {
            // Check if this is an API request (JSON expected)
            if (isAPIRequest(req)) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden',
                    error: 'Access denied: Admin only'
                });
            }
            return res.redirect('/admin/login');
        }

        // Cache role in session if not already set
        if (!req.session.role) {
            req.session.role = adminUser.role;
            req.session.userId = adminUser.userId;
        }

        // Add user data to all admin routes
        req.user = {
            userId: adminUser.userId,
            username: adminUser.username,
            role: adminUser.role,
            userType: 'admin'
        };

        res.locals.user = {
            name: adminUser.username || 'Admin',
            role: adminUser.role,
            userId: adminUser.userId
        };

        next();
    } catch (error) {
        console.error('Admin auth middleware error:', error);
        // Check if this is an API request (JSON expected)
        if (isAPIRequest(req)) {
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
        res.redirect('/admin/login');
    }
};

// Public routes
router.get('/login', (req, res) => {
    // Check if user is already authenticated via session or JWT
    if (req.session && req.session.userId) {
        return res.redirect('/admin/dashboard');
    }

    // Check JWT token
    const jwtAdmin = verifyAdminJWTFromCookie(req);
    if (jwtAdmin) {
        return res.redirect('/admin/dashboard');
    }

    res.render('admin/login');
});

router.post('/login/verify', DashboardController.verifyUser);

// Admin auth verification endpoint for React to check authentication status
// This route always returns JSON (never HTML) since it's an API endpoint
router.get('/verify', async (req, res) => {
    try {
        // ALWAYS return JSON for this endpoint - it's an API endpoint
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Accept', 'application/json');

        // First check for session (for EJS pages)
        if (req.session && req.session.userId) {
            const adminUser = await Admin.findOne({ userId: req.session.userId });
            if (adminUser && adminUser.role === 'admin') {
                return res.status(200).json({
                    authenticated: true,
                    user: {
                        userId: adminUser.userId,
                        username: adminUser.username,
                        role: adminUser.role,
                        userType: 'admin'
                    }
                });
            }
        }

        // If no session, check for JWT token in cookie (for React API)
        const jwtAdmin = verifyAdminJWTFromCookie(req);
        if (jwtAdmin) {
            const adminUser = await Admin.findOne({ userId: jwtAdmin.userId });
            if (adminUser && adminUser.role === 'admin') {
                // Optionally sync to session for compatibility
                req.session.userId = adminUser.userId;
                req.session.role = adminUser.role;

                return res.status(200).json({
                    authenticated: true,
                    user: {
                        userId: adminUser.userId,
                        username: adminUser.username,
                        role: adminUser.role,
                        userType: 'admin'
                    }
                });
            }
        }

        // Not authenticated
        return res.status(401).json({
            authenticated: false,
            message: 'Not authenticated'
        });
    } catch (error) {
        console.error('Admin auth verification error:', error);
        return res.status(500).json({
            authenticated: false,
            message: 'Server error'
        });
    }
});

// Protected routes - require authentication
router.use(adminAuth);

// Dashboard route
router.get('/dashboard', DashboardController.getDashboard);

// Notification routes - must be before other routes to avoid conflicts
router.get('/notifications', (req, res, next) => {
    console.log('[DEBUG] Notifications GET route hit:', {
        method: req.method,
        path: req.path,
        originalUrl: req.originalUrl,
        url: req.url,
        baseUrl: req.baseUrl
    });
    next();
}, NotificationController.getNotifications);
router.post('/notifications/mark-all-read', NotificationController.markAllAsRead);

// Analytics routes
router.get('/brand-analytics', AnalyticsController.getBrandAnalytics);
router.get('/influencer-analytics', AnalyticsController.getInfluencerAnalytics);
router.get('/campaign-analytics', AnalyticsController.getCampaignAnalytics);

// User Management routes
router.get('/user_management', UserManagementController.getUserManagementPage);
router.post('/user_management/approve/:id', UserManagementController.approveUser);
router.get('/user_management/brand/:id', UserManagementController.getBrandDetails);
router.get('/user_management/influencer/:id', UserManagementController.getInfluencerDetails);

// Collaboration routes
router.get('/collaboration_monitoring', CollaborationController.getAllCollaborations);
router.get('/collaboration_monitoring/:id', CollaborationController.getCollaborationDetails);

// Payment routes
router.get('/payment_verification', PaymentController.getAllPayments);
router.get('/payment_verification/categories', PaymentController.getInfluencerCategories);
router.get('/payment_verification/:id', PaymentController.getPaymentDetails);
router.post('/payment_verification/update/:id', PaymentController.updatePaymentStatus);

// Feedback routes
router.get('/feedback_and_moderation', FeedbackController.getAllFeedback);
router.get('/feedback_and_moderation/:id', FeedbackController.getFeedbackDetails);
router.post('/feedback_and_moderation/update/:id', FeedbackController.updateFeedbackStatus);

// Customer Management routes
router.get('/customer-management', CustomerController.getCustomerManagement);
router.get('/customer-details/:id', CustomerController.getCustomerDetails);
router.put('/customer-status/:id', CustomerController.updateCustomerStatus);
router.get('/customer-analytics', CustomerController.getCustomerAnalytics);

// Settings route
router.get('/settings', (req, res) => {
    res.render('admin/settings', { user: res.locals.user });
});

// Reset Password Route
router.post('/reset-password', async (req, res) => {
    try {
        const { username, newPassword } = req.body;

        // Find user by username
        const user = await Admin.findOne({ username });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Hash the new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update user's password
        user.password = hashedPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password reset successful'
        });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            success: false,
            message: 'Error resetting password'
        });
    }
});

// Logout route
router.get('/logout', (req, res) => {
    // Clear session
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            const isAPIRequest = req.headers.accept && req.headers.accept.includes('application/json');
            if (isAPIRequest) {
                return res.status(500).json({
                    success: false,
                    message: 'Error logging out'
                });
            }
            return res.redirect('/admin/login');
        }

        // Clear JWT cookie
        res.clearCookie('adminToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            path: '/'
        });

        // Clear session cookie
        res.clearCookie('session-id');

        // Check if this is an API request (JSON) or page request (HTML)
        const isAPIRequest = req.headers.accept && req.headers.accept.includes('application/json') || req.xhr;

        if (isAPIRequest) {
            return res.status(200).json({
                success: true,
                message: 'Logged out successfully'
            });
        } else {
            return res.redirect('/admin/login');
        }
    });
});

// Find and comment out or fix any route that uses an undefined controller function.
// This will resolve the "[object Undefined]" error on startup.

// Example (replace or comment out as needed):
// router.post('/feedback', AdminController.handleFeedback);
// router.post('/some-path', AdminController.someUndefinedFunction);

// If you want to keep the route, provide a stub handler:
router.post('/feedback', (req, res) => res.status(501).send('Not implemented'));

// Repeat this for any other problematic routes that reference undefined controller functions.
// If you want to be thorough, search for all routes and ensure every handler exists in AdminController.js.

module.exports = router;