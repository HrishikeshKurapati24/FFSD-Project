const express = require('express');
const router = express.Router();
const brandProfileController = require('../controllers/brand/brandProfileController');
const brandDiscoveryController = require('../controllers/brand/brandDiscoveryController');
const brandCampaignController = require('../controllers/brand/brandCampaignController');
const brandEcommerceController = require('../controllers/brand/brandEcommerceController');
const brandController = brandProfileController; // Keep for backward compatibility if any other parts use it
const CampaignContentController = require('../controllers/campaign/campaignContentController');
const { upload } = require('../utils/imageUpload');
const multer = require('multer');
const { uploadToCloudinary, uploadBufferToCloudinary } = require('../utils/cloudinary');
const { isAuthenticated, isBrand } = require('./authRoutes');
const { CampaignPayments, CampaignInfluencers, CampaignInfo, CampaignMetrics } = require('../models/CampaignMongo');
const { InfluencerInfo, InfluencerSocials, InfluencerAnalytics } = require('../models/InfluencerMongo');
const mongoose = require('mongoose');
const { BrandInfo, BrandAnalytics, BrandSocials } = require('../models/BrandMongo');
const { Message } = require('../models/MessageMongo');
const { Product } = require('../models/ProductMongo');
const notificationController = require('../monolithic_files/notificationController');

// Brand sign out route (must be before authentication middleware)
router.get('/signout', (req, res) => {
    // Clear session
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session during signout:', err);
            const isAPIRequest = req.xhr || req.headers.accept?.includes('application/json');
            if (isAPIRequest) {
                return res.status(500).json({
                    success: false,
                    message: 'Error logging out'
                });
            }
            return res.redirect('/signin');
        }

        // Clear JWT cookie
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            path: '/'
        });

        // Set cache control
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');

        // Check if this is an API request (JSON) or page request (HTML)
        const isAPIRequest = req.xhr || req.headers.accept?.includes('application/json');

        if (isAPIRequest) {
            return res.status(200).json({
                success: true,
                message: 'Signed out successfully'
            });
        } else {
            return res.redirect('/signin');
        }
    });
});

router.post('/signout', (req, res) => {
    // Clear session
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session during signout:', err);
            const isAPIRequest = req.xhr || req.headers.accept?.includes('application/json');
            if (isAPIRequest) {
                return res.status(500).json({
                    success: false,
                    message: 'Error logging out'
                });
            }
            return res.redirect('/signin');
        }

        // Clear JWT cookie
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            path: '/'
        });

        // Set cache control
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');

        // Check if this is an API request (JSON) or page request (HTML)
        const isAPIRequest = req.xhr || req.headers.accept?.includes('application/json');

        if (isAPIRequest) {
            return res.status(200).json({
                success: true,
                message: 'Signed out successfully'
            });
        } else {
            return res.redirect('/signin');
        }
    });
});

// Apply authentication middleware to all routes
router.use(isAuthenticated);
router.use(isBrand);

// Middleware to verify brand ID matches session or JWT
const verifyBrandId = (req, res, next) => {
    // Check session first, then req.user (from JWT)
    const userId = req.session?.user?.id || req.user?.id;

    if (userId) {
        // Add brand ID to request for use in routes
        req.brandId = userId;
        // Also ensure session has user for compatibility
        if (!req.session.user && req.user) {
            req.session.user = req.user;
        }
        next();
    } else {
        const isAPIRequest = req.headers.accept && req.headers.accept.includes('application/json');
        if (isAPIRequest) {
            return res.status(403).json({ message: 'Access denied: Invalid brand ID' });
        } else {
            return res.redirect('/SignIn');
        }
    }
};

// Apply brand ID verification to all routes
router.use('/', verifyBrandId);

router.get('/home', brandController.getBrandDashboard);

// Route for the influencer explore page
router.get('/explore', brandController.getExplorePage);


// Update the influencer profile route to handle both URL parameter and query parameter
router.get('/influencer_profile/:influencerId?', isAuthenticated, isBrand, brandDiscoveryController.getInfluencerProfile);



// Route for the brand collab page
router.get('/collab', brandCampaignController.getCollabs);


router.get('/profile', brandController.getBrandProfile);

// Get received requests page
router.get('/recievedRequests', isAuthenticated, isBrand, brandCampaignController.getReceivedRequests);

router.get('/create_collab', brandCampaignController.createCollab);


// Route for the B2_transaction with requestId
router.get('/:requestId1/:requestId2/transaction', brandCampaignController.getTransaction);


// POST route to handle payment submission
router.post('/:requestId1/:requestId2/transaction', upload.single('productImage'), brandCampaignController.submitTransaction);

// Brand profile routes
// Update brand profile
router.post('/profile/update', brandProfileController.updateBrandProfile);

// Update brand profile images
router.post('/profile/update-images', upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
]), brandProfileController.updateProfileImages);

// Create a custom multer configuration for campaign creation
const campaignUpload = multer({
    storage: multer.memoryStorage(), // Use memory storage for Cloudinary
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    }
});

// Route to handle campaign creation
router.post('/campaigns/create', campaignUpload.any(), brandCampaignController.createCampaign);

// Add this route after the campaigns/create route
router.post('/campaigns/:campaignId/activate', brandCampaignController.activateCampaign);

// New routes for Dashboard Influencer Drill-down
router.get('/campaigns/:campaignId/influencers', isAuthenticated, isBrand, brandCampaignController.getCampaignInfluencers);
router.get('/campaigns/:campaignId/influencers/:influencerId/contribution', isAuthenticated, isBrand, brandCampaignController.getInfluencerContribution);

// Deliverables routes
router.get('/campaigns/:campaignId/deliverables', isAuthenticated, isBrand, brandCampaignController.getCampaignDeliverables);
router.post('/campaigns/:campaignId/deliverables', isAuthenticated, isBrand, brandCampaignController.updateCampaignDeliverables);

// Add this route after the campaign activation route
router.get('/campaigns/:campaignId/details', brandCampaignController.getCampaignDetails);


// Route to end a campaign (mark as completed)
router.post('/campaigns/:campaignId/end', brandCampaignController.endCampaign);

// Route to get draft campaigns for inviting influencers
router.get('/campaigns/draft-list', brandCampaignController.getDraftCampaigns);

// Route to invite influencer to a campaign
router.post('/invite-influencer', brandDiscoveryController.inviteInfluencer);

// Route to decline a campaign request
router.post('/requests/:requestId1/:requestId2/decline', brandCampaignController.declineRequest);

// Delete brand account
router.post('/profile/delete', isAuthenticated, brandProfileController.deleteAccount);


// Get campaign history page
router.get('/campaigns/history', isAuthenticated, isBrand, brandProfileController.getCampaignHistory);
router.get('/influencer_details/:influencerId', isAuthenticated, isBrand, brandDiscoveryController.getInfluencerProfile);


// ========== CAMPAIGN CONTENT MANAGEMENT ROUTES ==========

// Product management routes
router.post('/campaigns/:campaignId/products', CampaignContentController.createCampaignProducts);
router.get('/campaigns/:campaignId/products', CampaignContentController.getCampaignProducts);

// Content review routes
router.get('/campaigns/:campaignId/pending-content', CampaignContentController.getCampaignPendingContentForBrand);
router.post('/content/:contentId/review', CampaignContentController.reviewContent);

// ========== ORDER MANAGEMENT ROUTES ==========

// Order tracking routes
router.get('/orders', isAuthenticated, isBrand, brandEcommerceController.getBrandOrders);
router.post('/orders/:orderId/status', isAuthenticated, isBrand, brandEcommerceController.updateOrderStatus);
router.get('/orders/analytics', isAuthenticated, isBrand, brandEcommerceController.getOrderAnalytics);

module.exports = router;