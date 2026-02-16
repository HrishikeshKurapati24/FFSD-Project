const express = require('express');
const router = express.Router();
const CustomerPurchaseController = require('../controllers/customerPurchaseController');
const { CampaignInfo, CampaignInfluencers } = require('../config/CampaignMongo');
const { InfluencerInfo } = require('../config/InfluencerMongo');
const { isAuthenticated, isCustomer } = require('./authRoutes');
const { brandModel } = require('../models/brandModel');
const influencerModel = require('../models/influencerModel');
const brandController = require('../controllers/brandController');

// Ensure cart exists in session
router.use((req, res, next) => {
    if (req.session && !req.session.cart) {
        req.session.cart = [];
    }
    next();
});

// All campaigns listing page
router.get('/', async (req, res) => {
    try {
        // Show all active campaigns regardless of start_date
        // Start date no longer restricts visibility - campaigns show up immediately when activated
        // Only filter by end_date to hide campaigns that have ended
        const campaigns = await CampaignInfo.find({
            status: 'active',
            $or: [
                { end_date: { $gte: new Date() } },
                { end_date: { $exists: false } },
                { end_date: null }
            ]
        }).populate('brand_id', 'brandName logoUrl').sort({ createdAt: -1 }).lean();

        // Fetch participating influencers per campaign (active/completed)
        const campaignIds = campaigns.map(c => c._id);
        const participation = await CampaignInfluencers.find({
            campaign_id: { $in: campaignIds },
            status: { $in: ['active', 'completed'] }
        }).populate('influencer_id', 'fullName displayName profilePicUrl').lean();

        const map = new Map();
        participation.forEach(p => {
            const key = p.campaign_id.toString();
            if (!map.has(key)) map.set(key, []);
            if (p.influencer_id) {
                map.get(key).push({
                    id: p.influencer_id._id,
                    name: p.influencer_id.displayName || p.influencer_id.fullName,
                    profilePicUrl: p.influencer_id.profilePicUrl || '/images/default-avatar.jpg'
                });
            }
        });

        const campaignsWithInfluencers = campaigns.map(c => ({
            ...c,
            influencers: map.get(c._id.toString()) || []
        }));

        res.json({
            campaigns: campaignsWithInfluencers,
            title: 'All Active Campaigns'
        });
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        res.status(500).json({
            message: 'Error loading campaigns',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// Campaign shopping routes (customer-visible pages)
router.get('/campaign/:campaignId/shop', CustomerPurchaseController.getCampaignShoppingPage);
router.get('/product/:productId', CustomerPurchaseController.getProductDetails);

// Cart routes - work with session-based cart (no authentication required)
router.get('/cart', CustomerPurchaseController.getCartPage);
router.post('/cart/add', CustomerPurchaseController.addToCart);
router.post('/cart/remove', CustomerPurchaseController.removeFromCart);
router.post('/checkout', CustomerPurchaseController.checkoutCart);

// Rankings page
router.get('/rankings', CustomerPurchaseController.getRankingsPage);

// Customer Order History
router.get('/orders', CustomerPurchaseController.getOrderHistory);

// Public API for customer to fetch brand profile by ID
router.get('/brand/:brandId/profile', async (req, res) => {
    const brandId = req.params.brandId;
    try {
        const brand = await brandModel.getBrandById(brandId);
        if (!brand) {
            return res.status(404).json({ success: false, message: 'Brand profile not found' });
        }

        const socialStats = await brandModel.getSocialStats(brandId);
        const topCampaigns = await brandModel.getTopCampaigns(brandId);
        const transformed = brandController.transformBrandProfileForClient
            ? brandController.transformBrandProfileForClient(brand, socialStats, topCampaigns)
            : brand; // fallback

        // Normalize currentCampaigns field for frontend expectations
        // First get campaigns from topCampaigns (metrics-based)
        const metricsBasedCampaigns = Array.isArray(topCampaigns)
            ? topCampaigns.map(c => ({ id: c.id || c._id, title: c.title, status: c.status || c.state || 'active' }))
            : [];

        // Also fetch active campaigns directly from CampaignInfo to catch campaigns without metrics
        const activeCampaigns = await CampaignInfo.find({
            brand_id: brandId,
            status: 'active'
        }).select('_id title status').lean();

        // Merge: add any active campaigns not already in the metrics-based list
        const existingIds = new Set(metricsBasedCampaigns.map(c => String(c.id)));
        const additionalCampaigns = (activeCampaigns || [])
            .filter(c => !existingIds.has(String(c._id)))
            .map(c => ({ id: c._id, title: c.title, status: c.status }));

        transformed.currentCampaigns = [...metricsBasedCampaigns, ...additionalCampaigns];

        return res.json({ success: true, brand: transformed });
    } catch (error) {
        console.error('Error in customer brand profile API:', error);
        return res.status(500).json({ success: false, message: 'Error loading brand profile', error: error.message });
    }
});

// Public API for customer to fetch influencer profile by ID
router.get('/influencer/:influencerId/profile', async (req, res) => {
    const influencerId = req.params.influencerId;
    try {
        const influencer = await influencerModel.getInfluencerProfileDetails(influencerId);
        if (!influencer) {
            return res.status(404).json({ success: false, message: 'Influencer profile not found' });
        }

        // Also fetch current campaigns (active/completed) where this influencer is participating
        const currentCampaignsDocs = await CampaignInfluencers.find({ influencer_id: influencerId, status: { $in: ['active', 'completed'] } })
            .populate({ path: 'campaign_id', select: 'title status' })
            .lean();

        const current = (currentCampaignsDocs || []).map(ci => ({ id: ci.campaign_id?._id || ci.campaign_id, title: ci.campaign_id?.title, status: ci.campaign_id?.status }));
        influencer.currentCampaigns = current;

        // Fetch promoted products for those campaigns
        const { Product } = require('../config/ProductMongo');
        const campaignIds = current.map(c => c.id).filter(Boolean);
        let promotedProducts = [];
        if (campaignIds.length > 0) {
            const products = await Product.find({ campaign_id: { $in: campaignIds }, status: 'active' }).lean();
            promotedProducts = products.map(p => ({ id: p._id, title: p.name, price: p.campaign_price || p.original_price || 0 }));
        }

        influencer.promotedProducts = promotedProducts;

        return res.json({ success: true, influencer });
    } catch (error) {
        console.error('Error in customer influencer profile API:', error);
        return res.status(500).json({ success: false, message: 'Error loading influencer profile', error: error.message });
    }
});



module.exports = router;