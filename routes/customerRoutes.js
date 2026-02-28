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