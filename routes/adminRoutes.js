const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');
const AdminAnalyticsController = require('../controllers/AdminAnalyticsController');
const UserManagementController = require('../controllers/UserManagementController');
const CollaborationController = require('../controllers/CollaborationController');
const PaymentController = require('../controllers/PaymentController');
const FeedbackController = require('../controllers/FeedbackController');

// Admin Auth Middleware
const adminAuth = (req, res, next) => {
    // Add user data to all admin routes
    res.locals.user = {
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin'
    };
    next();
};

// Apply adminAuth middleware to all admin routes
router.use(adminAuth);

// Dashboard route
router.get('/dashboard', AdminController.getDashboard);

// Analytics routes
router.get('/brand-analytics', AdminAnalyticsController.getBrandAnalytics);
router.get('/influencer-analytics', AdminAnalyticsController.getInfluencerAnalytics);
router.get('/customer-analytics', AdminAnalyticsController.getCustomerAnalytics);

// User Management routes
router.get('/user_management', UserManagementController.getUserManagementPage);
router.post('/user_management/approve', UserManagementController.approveUser);

// Collaboration routes
router.get('/collaboration_monitoring', CollaborationController.getAllCollaborations);
router.get('/collaboration_monitoring/:id', CollaborationController.getCollaborationDetails);

// Payment routes
router.get('/payment_verification', PaymentController.getAllPayments);
router.get('/payment_verification/:id', PaymentController.getPaymentDetails);
router.post('/payment_verification/update', PaymentController.updatePaymentStatus);

// Feedback routes
router.get('/feedback_and_moderation', FeedbackController.getAllFeedback);
router.get('/feedback_and_moderation/:id', FeedbackController.getFeedbackDetails);
router.post('/feedback_and_moderation/update', FeedbackController.updateFeedbackStatus);

// Settings route
router.get('/settings', (req, res) => {
    res.render('admin_settings');
});

// Logout route
router.get('/logout', (req, res) => {
    res.redirect('/admin/login');
});

module.exports = router;