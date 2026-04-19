/**
 * @swagger
 * tags:
 *   name: Brand
 *   description: Brand-side endpoints. All routes (except /brand/signout) require authentication as a Brand user via JWT (token cookie).
 */

/**
 * @swagger
 * /brand/signout:
 *   get:
 *     summary: Sign out the current brand user (clears token cookie)
 *     tags: [Brand]
 *     responses:
 *       200:
 *         description: Signed out successfully
 *   post:
 *     summary: Sign out the current brand user (API version)
 *     tags: [Brand]
 *     responses:
 *       200:
 *         description: Signed out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 * /brand/home:
 *   get:
 *     summary: Get brand dashboard data
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Brand dashboard
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /brand/explore:
 *   get:
 *     summary: Get the influencer explore page for brands
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Influencer listings for discovery
 */

/**
 * @swagger
 * /brand/influencer_profile/{influencerId}:
 *   get:
 *     summary: View an influencer's profile (from brand perspective)
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: influencerId
 *         required: false
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the influencer (can also be passed as query param)
 *     responses:
 *       200:
 *         description: Influencer profile data
 *       404:
 *         description: Influencer not found
 */

/**
 * @swagger
 * /brand/collab:
 *   get:
 *     summary: Get all collaborations for the brand
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of brand collaborations
 */

/**
 * @swagger
 * /brand/profile:
 *   get:
 *     summary: Get the brand's own profile
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Brand profile data
 */

/**
 * @swagger
 * /brand/recievedRequests:
 *   get:
 *     summary: Get all collaboration requests received by the brand
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of received collaboration requests
 */

/**
 * @swagger
 * /brand/create_collab:
 *   get:
 *     summary: Get the create collaboration page data
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Form data / page data for creating a collaboration
 */

/**
 * @swagger
 * /brand/{requestId1}/{requestId2}/transaction:
 *   get:
 *     summary: Get transaction details for a collaboration request pair
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId1
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: requestId2
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction details
 *   post:
 *     summary: Submit a transaction / payment for a collaboration
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId1
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: requestId2
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               productImage:
 *                 type: string
 *                 format: binary
 *               amount:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transaction submitted successfully
 */

/**
 * @swagger
 * /brand/profile/update:
 *   post:
 *     summary: Update brand profile text/data fields
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               brandName:
 *                 type: string
 *               industry:
 *                 type: string
 *               website:
 *                 type: string
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */

/**
 * @swagger
 * /brand/profile/update-images:
 *   post:
 *     summary: Update brand logo and banner images
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *               banner:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Images updated
 */

/**
 * @swagger
 * /brand/campaigns/create:
 *   post:
 *     summary: Create a new campaign
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               budget:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               campaignImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Campaign created
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /brand/campaigns/{campaignId}/activate:
 *   post:
 *     summary: Activate a draft campaign
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign activated
 *       404:
 *         description: Campaign not found
 */

/**
 * @swagger
 * /brand/campaigns/{campaignId}/influencers:
 *   get:
 *     summary: Get all influencers in a campaign
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of influencers in campaign
 */

/**
 * @swagger
 * /brand/campaigns/{campaignId}/influencers/{influencerId}/contribution:
 *   get:
 *     summary: Get a specific influencer's contribution to a campaign
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: influencerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Influencer contribution data
 */

/**
 * @swagger
 * /brand/campaigns/{campaignId}/deliverables:
 *   get:
 *     summary: Get deliverables for a campaign
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign deliverables
 *   post:
 *     summary: Update deliverables for a campaign
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Deliverables updated
 */

/**
 * @swagger
 * /brand/campaigns/{campaignId}/details:
 *   get:
 *     summary: Get full details of a campaign
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign details
 */

/**
 * @swagger
 * /brand/campaigns/{campaignId}/end:
 *   post:
 *     summary: End/complete an active campaign
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign ended
 */

/**
 * @swagger
 * /brand/campaigns/draft-list:
 *   get:
 *     summary: Get all draft campaigns (for inviting influencers)
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of draft campaigns
 */

/**
 * @swagger
 * /brand/campaigns/history:
 *   get:
 *     summary: Get campaign history for the brand
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historical campaign list
 */

/**
 * @swagger
 * /brand/invite-influencer:
 *   post:
 *     summary: Invite an influencer to a campaign
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               influencerId:
 *                 type: string
 *               campaignId:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invitation sent
 */

/**
 * @swagger
 * /brand/requests/{requestId1}/{requestId2}/decline:
 *   post:
 *     summary: Decline a collaboration request
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId1
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: requestId2
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Request declined
 */

/**
 * @swagger
 * /brand/profile/delete:
 *   post:
 *     summary: Delete the brand account permanently
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted
 */

/**
 * @swagger
 * /brand/influencer_details/{influencerId}:
 *   get:
 *     summary: Get detailed influencer profile (brand view)
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: influencerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Influencer detail data
 */

/**
 * @swagger
 * /brand/campaigns/{campaignId}/products:
 *   post:
 *     summary: Add products to a campaign
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Products added
 *   get:
 *     summary: Get products for a campaign
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of campaign products
 */

/**
 * @swagger
 * /brand/campaigns/{campaignId}/pending-content:
 *   get:
 *     summary: Get all content pending review for a campaign
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of pending content submissions
 */

/**
 * @swagger
 * /brand/content/{contentId}/review:
 *   post:
 *     summary: Approve or reject influencer content
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *               feedback:
 *                 type: string
 *     responses:
 *       200:
 *         description: Content review submitted
 */

/**
 * @swagger
 * /brand/orders:
 *   get:
 *     summary: Get all orders under the brand's campaigns
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of brand orders
 */

/**
 * @swagger
 * /brand/orders/{orderId}/status:
 *   post:
 *     summary: Update the fulfilment status of an order
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [processing, shipped, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Order status updated
 */

/**
 * @swagger
 * /brand/orders/analytics:
 *   get:
 *     summary: Get order analytics for the brand
 *     tags: [Brand]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order analytics data
 */

const express = require('express');
const router = express.Router();
const { routeCache } = require('../middleware/routeCache');
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

router.get('/home', routeCache({ namespace: 'brand:dashboard', ttlSeconds: 300 }), brandController.getBrandDashboard);

// Route for the influencer explore page
router.get('/explore', routeCache({ namespace: 'brand:explore', ttlSeconds: 600 }), brandController.getExplorePage);


// Update the influencer profile route to handle both URL parameter and query parameter
router.get('/influencer_profile/:influencerId?', isAuthenticated, isBrand, brandDiscoveryController.getInfluencerProfile);



// Route for the brand collab page
router.get('/collab', brandCampaignController.getCollabs);


router.get('/profile', brandController.getBrandProfile);
router.get('/profile/payment', brandProfileController.getPaymentProfile);
router.post('/profile/payment/setup-order', brandProfileController.createPaymentSetupOrder);
router.post('/profile/payment/save-method', brandProfileController.savePaymentMethod);

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

// Route for matchmaking recommendations
router.get('/matchmaking', brandDiscoveryController.getMatchmakingRecommendations);

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
