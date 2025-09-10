const express = require('express');
const router = express.Router();
const { DashboardController, AnalyticsController, PaymentController, UserManagementController, CollaborationController } = require('../controllers/AdminController');
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
router.get('/customer-analytics', AnalyticsController.getCustomerAnalytics);

// User Management routes
router.get('/user_management', UserManagementController.getUserManagementPage);
router.post('/user_management/approve/:id', UserManagementController.approveUser);

// Collaboration routes
router.get('/collaboration_monitoring', CollaborationController.getAllCollaborations);
router.get('/collaboration_monitoring/:id', CollaborationController.getCollaborationDetails);

// Payment routes
router.get('/payment_verification', PaymentController.getAllPayments);
router.get('/payment_verification/:id', PaymentController.getPaymentDetails);
router.post('/payment_verification/update/:id', PaymentController.updatePaymentStatus);

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
router.post('/logout', (req, res) => {
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

module.exports = router;