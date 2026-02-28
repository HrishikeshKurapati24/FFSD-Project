const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('./authRoutes');
const { asyncErrorWrapper } = require('../middleware/asyncErrorWrapper');
const subscriptionController = require('../controllers/subscriptionController');

// Public routes (no authentication required)
// Subscription plan selection page (after signup)
router.get('/select-plan', asyncErrorWrapper(subscriptionController.selectPlan));

// Subscribe after signup (redirect to payment for paid plans)
router.post('/subscribe-after-signup', asyncErrorWrapper(subscriptionController.subscribeAfterSignup));

// Payment page
router.get('/payment', asyncErrorWrapper(subscriptionController.getPaymentPage));

// Process payment
router.post('/process-payment', asyncErrorWrapper(subscriptionController.processPayment));

// Payment success page
router.get('/payment-success', asyncErrorWrapper(subscriptionController.getPaymentSuccessPage));

// Apply authentication middleware for protected routes
router.use(isAuthenticated);

// Get subscription plans for a user type
router.get('/plans/:userType', asyncErrorWrapper(subscriptionController.getPlans));

// Get user's current subscription
router.get('/current', asyncErrorWrapper(subscriptionController.getCurrentSubscription));

// Create new subscription or upgrade existing
router.post('/subscribe', asyncErrorWrapper(subscriptionController.subscribe));

// Check subscription limits
router.post('/check-limit', asyncErrorWrapper(subscriptionController.checkLimit));

// Update subscription usage
router.post('/update-usage', asyncErrorWrapper(subscriptionController.updateUsage));

// Subscription management page
router.get('/manage', asyncErrorWrapper(subscriptionController.manageSubscription));

// Route to recalculate usage from existing data
router.post('/recalculate-usage', asyncErrorWrapper(subscriptionController.recalculateUsage));

// Test route to check subscription status (for development/testing)
router.get('/test-status', asyncErrorWrapper(subscriptionController.testStatus));

// Manual trigger to check and expire subscriptions (for testing/admin)
router.post('/check-expired', asyncErrorWrapper(subscriptionController.checkExpired));

module.exports = router;