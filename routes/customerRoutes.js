const express = require('express');
const router = express.Router();
const CustomerPurchaseController = require('../controllers/customerPurchaseController');
const { CampaignInfo, CampaignInfluencers } = require('../config/CampaignMongo');
const { InfluencerInfo } = require('../config/InfluencerMongo');

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
        const campaigns = await CampaignInfo.find({
            status: 'active',
            start_date: { $lte: new Date() },
            end_date: { $gte: new Date() }
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

// Cart routes
router.get('/cart', CustomerPurchaseController.getCartPage);
router.post('/cart/add', CustomerPurchaseController.addToCart);
router.post('/cart/remove', CustomerPurchaseController.removeFromCart);
router.post('/checkout', CustomerPurchaseController.checkoutCart);

// Rankings page
router.get('/rankings', CustomerPurchaseController.getRankingsPage);



module.exports = router;