/**
 * @swagger
 * tags:
 *   name: Subscription
 *   description: Subscription plan selection, payment, and management endpoints. Public routes handle post-signup flows; protected routes require JWT authentication.
 *
 * components:
 *   schemas:
 *     SubscriptionPlan:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *           example: Pro
 *         userType:
 *           type: string
 *           enum: [brand, influencer]
 *         price:
 *           type: number
 *           format: float
 *           example: 999.00
 *         billingCycle:
 *           type: string
 *           enum: [monthly, yearly]
 *         features:
 *           type: array
 *           items:
 *             type: string
 *         limits:
 *           type: object
 *           properties:
 *             campaigns:
 *               type: integer
 *             collaborations:
 *               type: integer
 *
 *     CurrentSubscription:
 *       type: object
 *       properties:
 *         planName:
 *           type: string
 *         userType:
 *           type: string
 *         status:
 *           type: string
 *           enum: [active, expired, cancelled]
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         usage:
 *           type: object
 *           properties:
 *             campaigns:
 *               type: integer
 *             collaborations:
 *               type: integer
 */

/**
 * @swagger
 * /subscription/select-plan:
 *   get:
 *     summary: Get the plan selection page (called after brand/influencer signup)
 *     tags: [Subscription]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the newly signed-up user
 *       - in: query
 *         name: userType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [brand, influencer]
 *     responses:
 *       200:
 *         description: Available subscription plans for the user type
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SubscriptionPlan'
 *       400:
 *         description: Missing or invalid userId / userType
 */

/**
 * @swagger
 * /subscription/subscribe-after-signup:
 *   post:
 *     summary: Subscribe to a plan immediately after signup (pre-authentication)
 *     tags: [Subscription]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - userType
 *               - planId
 *             properties:
 *               userId:
 *                 type: string
 *               userType:
 *                 type: string
 *                 enum: [brand, influencer]
 *               planId:
 *                 type: string
 *                 description: MongoDB ObjectId of the chosen plan
 *     responses:
 *       200:
 *         description: Subscription activated or redirect to payment initiated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 redirectTo:
 *                   type: string
 *                   description: URL to redirect to (payment page or dashboard)
 *       400:
 *         description: Validation error
 *       404:
 *         description: User or plan not found
 */

/**
 * @swagger
 * /subscription/payment:
 *   get:
 *     summary: Get the payment page for a subscription plan
 *     tags: [Subscription]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: userType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [brand, influencer]
 *     responses:
 *       200:
 *         description: Payment page data (plan summary, amount, user details)
 *       404:
 *         description: Plan or user not found
 */

/**
 * @swagger
 * /subscription/process-payment:
 *   post:
 *     summary: Process a subscription payment and activate the plan
 *     tags: [Subscription]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - userType
 *               - planId
 *               - paymentDetails
 *             properties:
 *               userId:
 *                 type: string
 *               userType:
 *                 type: string
 *                 enum: [brand, influencer]
 *               planId:
 *                 type: string
 *               paymentDetails:
 *                 type: object
 *                 description: Payment method and transaction details
 *                 properties:
 *                   method:
 *                     type: string
 *                     enum: [card, upi, netbanking]
 *                   transactionId:
 *                     type: string
 *     responses:
 *       200:
 *         description: Payment successful — subscription activated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 redirectTo:
 *                   type: string
 *       400:
 *         description: Payment validation error
 *       500:
 *         description: Payment processing failed
 */

/**
 * @swagger
 * /subscription/payment-success:
 *   get:
 *     summary: Payment success confirmation page
 *     tags: [Subscription]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: userType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success confirmation with subscription summary
 */

/**
 * @swagger
 * /subscription/plans/{userType}:
 *   get:
 *     summary: Get all available subscription plans for a user type
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [brand, influencer]
 *         description: The user type to fetch plans for
 *     responses:
 *       200:
 *         description: List of subscription plans
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SubscriptionPlan'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /subscription/current:
 *   get:
 *     summary: Get the current user's active subscription details
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current subscription data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CurrentSubscription'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No active subscription found
 */

/**
 * @swagger
 * /subscription/subscribe:
 *   post:
 *     summary: Create a new subscription or upgrade an existing one (authenticated users)
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *             properties:
 *               planId:
 *                 type: string
 *                 description: MongoDB ObjectId of the target plan
 *     responses:
 *       200:
 *         description: Subscription created or upgraded
 *       400:
 *         description: Invalid plan or already subscribed at same level
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /subscription/check-limit:
 *   post:
 *     summary: Check whether the user has reached a usage limit for their plan
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - feature
 *             properties:
 *               feature:
 *                 type: string
 *                 enum: [campaigns, collaborations]
 *                 description: The feature/resource to check the limit for
 *     responses:
 *       200:
 *         description: Limit check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 allowed:
 *                   type: boolean
 *                 current:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /subscription/update-usage:
 *   post:
 *     summary: Increment usage counter for a subscription feature
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - feature
 *             properties:
 *               feature:
 *                 type: string
 *                 enum: [campaigns, collaborations]
 *               increment:
 *                 type: integer
 *                 default: 1
 *     responses:
 *       200:
 *         description: Usage updated successfully
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /subscription/manage:
 *   get:
 *     summary: Get the subscription management page for the logged-in user
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription management data (current plan, usage, upgrade options)
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /subscription/recalculate-usage:
 *   post:
 *     summary: Recalculate subscription usage from existing database records
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usage recalculated and updated
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /subscription/test-status:
 *   get:
 *     summary: Check subscription status (development/testing utility)
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current subscription status details
 */

/**
 * @swagger
 * /subscription/check-expired:
 *   post:
 *     summary: Manually trigger expiry check for all subscriptions (admin/testing utility)
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expiry check completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 expiredCount:
 *                   type: integer
 *                   description: Number of subscriptions that were expired
 */

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