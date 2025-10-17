const express = require('express');
const router = express.Router();
const { DashboardController, AnalyticsController, FeedbackController, PaymentController, UserManagementController, CollaborationController } = require('../controllers/AdminController');
const { Admin } = require('../models/mongoDB');
const bcrypt = require('bcrypt');

// Admin Auth Middleware
const adminAuth = async (req, res, next) => {
    try {
        // Check if user is logged in
        if (!req.session.userId) {
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
            }
            return res.redirect('/admin/login');
        }

        // Verify admin role
        const user = await Admin.findOne({ userId: req.session.userId });
        if (!user || user.role !== 'admin') {
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden'
                });
            }
            return res.redirect('/admin/login');
        }

        // Cache role in session
        req.session.role = user.role;

        // Add user data to all admin routes
        res.locals.user = {
            name: user.username || 'Admin',
            role: user.role,
            userId: user.userId
        };
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        if (req.xhr || req.headers.accept.includes('application/json')) {
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
    if (req.session.userId) {
        return res.redirect('/admin/dashboard');
    }
    res.render('admin/login');
});

router.post('/login/verify', DashboardController.verifyUser);

// Protected routes - require authentication
router.use(adminAuth);

// Dashboard route
router.get('/dashboard', DashboardController.getDashboard);

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
router.get('/payment_verification/:id', PaymentController.getPaymentDetails);
router.post('/payment_verification/update/:id', PaymentController.updatePaymentStatus);

// Feedback routes
router.get('/feedback_and_moderation', FeedbackController.getAllFeedback);
router.get('/feedback_and_moderation/:id', FeedbackController.getFeedbackDetails);
router.post('/feedback_and_moderation/update/:id', FeedbackController.updateFeedbackStatus);

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
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            res.status(500).json({
                success: false,
                message: 'Error logging out'
            });
        } else {
            res.clearCookie('session-id');
            res.redirect('/admin/login');
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