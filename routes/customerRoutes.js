/**
 * @swagger
 * tags:
 *   name: Customer
 *   description: Customer-facing shopping and browsing endpoints. Most cart and browsing routes are public; order history requires authentication.
 *
 * components:
 *   schemas:
 *     CartItem:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *         quantity:
 *           type: integer
 *           minimum: 1
 *         campaignId:
 *           type: string
 *
 *     Order:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         customerId:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItem'
 *         totalAmount:
 *           type: number
 *           format: float
 *         status:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /customer:
 *   get:
 *     summary: Get all active shoppable campaigns
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: List of active campaigns available for shopping
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   brandName:
 *                     type: string
 *                   coverImageUrl:
 *                     type: string
 */

/**
 * @swagger
 * /customer/campaign/{campaignId}/shop:
 *   get:
 *     summary: Get the shopping page for a specific campaign
 *     tags: [Customer]
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the campaign
 *     responses:
 *       200:
 *         description: Campaign shopping page with products and influencer details
 *       404:
 *         description: Campaign not found
 */

/**
 * @swagger
 * /customer/product/{productId}:
 *   get:
 *     summary: Get details of a specific product
 *     tags: [Customer]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the product
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */

/**
 * @swagger
 * /customer/cart:
 *   get:
 *     summary: Get the current session cart
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: Cart contents from session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CartItem'
 *                 totalAmount:
 *                   type: number
 */

/**
 * @swagger
 * /customer/cart/add:
 *   post:
 *     summary: Add a product to the session cart
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - campaignId
 *             properties:
 *               productId:
 *                 type: string
 *               campaignId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 default: 1
 *     responses:
 *       200:
 *         description: Item added to cart
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 cart:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CartItem'
 *       400:
 *         description: Invalid product or campaign
 *       404:
 *         description: Product not found
 */

/**
 * @swagger
 * /customer/cart/remove:
 *   post:
 *     summary: Remove a product from the session cart
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item removed from cart
 *       404:
 *         description: Item not found in cart
 */

/**
 * @swagger
 * /customer/checkout:
 *   post:
 *     summary: Checkout the current session cart and place an order
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deliveryAddress:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [cod, card, upi]
 *     responses:
 *       201:
 *         description: Order placed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 orderId:
 *                   type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Cart is empty or validation error
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /customer/rankings:
 *   get:
 *     summary: Get influencer rankings / leaderboard page
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: Ranked list of influencers by campaign performance
 */

/**
 * @swagger
 * /customer/orders:
 *   get:
 *     summary: Get order history for the logged-in customer
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of past orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /customer/brand/{brandId}/profile:
 *   get:
 *     summary: Get a brand's public profile (customer-facing view)
 *     tags: [Customer]
 *     parameters:
 *       - in: path
 *         name: brandId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the brand
 *     responses:
 *       200:
 *         description: Brand public profile data
 *       404:
 *         description: Brand not found
 */

/**
 * @swagger
 * /customer/influencer/{influencerId}/profile:
 *   get:
 *     summary: Get an influencer's public profile (customer-facing view)
 *     tags: [Customer]
 *     parameters:
 *       - in: path
 *         name: influencerId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the influencer
 *     responses:
 *       200:
 *         description: Influencer public profile data
 *       404:
 *         description: Influencer not found
 */

const express = require('express');

const router = express.Router();
const CustomerPurchaseController = require('../controllers/customer/customerShoppingController');
const CustomerHistoryController = require('../controllers/customer/customerHistoryController');
const { CampaignInfo, CampaignInfluencers } = require('../models/CampaignMongo');
const { InfluencerInfo } = require('../models/InfluencerMongo');
const { isAuthenticated, isCustomer } = require('./authRoutes');


const brandController = require('../controllers/brand/brandProfileController');

// Ensure cart exists in session
router.use((req, res, next) => {
    if (req.session && !req.session.cart) {
        req.session.cart = [];
    }
    next();
});

// All campaigns listing page
router.get('/', CustomerPurchaseController.getAllCampaigns);

// Campaign shopping routes (customer-visible pages)
router.get('/campaign/:campaignId/shop', CustomerPurchaseController.getCampaignShoppingPage);
router.get('/product/:productId', CustomerPurchaseController.getProductDetails);

// Cart routes - work with session-based cart (no authentication required)
router.get('/cart', CustomerPurchaseController.getCartPage);
router.post('/cart/add', CustomerPurchaseController.addToCart);
router.post('/cart/remove', CustomerPurchaseController.removeFromCart);
router.post('/checkout', CustomerPurchaseController.checkoutCart);

// Rankings page
router.get('/rankings', CustomerHistoryController.getRankingsPage);

// Customer Order History
router.get('/orders', CustomerHistoryController.getOrderHistory);

// Public API for customer to fetch brand profile by ID
router.get('/brand/:brandId/profile', CustomerPurchaseController.getBrandProfileForCustomer);

// Public API for customer to fetch influencer profile by ID
router.get('/influencer/:influencerId/profile', CustomerPurchaseController.getInfluencerProfileForCustomer);

module.exports = router;