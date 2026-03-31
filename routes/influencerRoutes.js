/**
 * @swagger
 * tags:
 *   name: Influencer
 *   description: Influencer-side endpoints. All routes require authentication as an Influencer user via JWT (token cookie).
 */

/**
 * @swagger
 * /influencer/home:
 *   get:
 *     summary: Get influencer dashboard data
 *     tags: [Influencer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Influencer dashboard statistics and recent activity
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /influencer/explore:
 *   get:
 *     summary: Get the brand explore page for influencers
 *     tags: [Influencer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of brands available for discovery
 */

/**
 * @swagger
 * /influencer/I_brand_profile/{id}:
 *   get:
 *     summary: View a brand's profile (from influencer perspective)
 *     tags: [Influencer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the brand
 *     responses:
 *       200:
 *         description: Brand profile data
 *       404:
 *         description: Brand not found
 */

/**
 * @swagger
 * /influencer/brand_profile/{id}:
 *   get:
 *     summary: View a brand profile (legacy route alias)
 *     tags: [Influencer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Brand profile data
 */

/**
 * @swagger
 * /influencer/profile:
 *   get:
 *     summary: Get the influencer's own profile
 *     tags: [Influencer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Influencer profile data
 */

/**
 * @swagger
 * /influencer/profile/update-images:
 *   post:
 *     summary: Update influencer profile picture and/or banner image
 *     tags: [Influencer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePic:
 *                 type: string
 *                 format: binary
 *                 description: Profile picture (max 50 MB)
 *               bannerImage:
 *                 type: string
 *                 format: binary
 *                 description: Banner image (max 50 MB)
 *     responses:
 *       200:
 *         description: Images updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 influencer:
 *                   type: object
 *       400:
 *         description: No images were uploaded
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Influencer not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /influencer/profile/update/data:
 *   post:
 *     summary: Update influencer profile text/data fields (validated)
 *     tags: [Influencer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - displayName
 *               - username
 *               - bio
 *             properties:
 *               displayName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 description: Only letters, numbers, and underscores allowed
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *               location:
 *                 type: string
 *                 maxLength: 100
 *               audienceGender:
 *                 type: string
 *                 enum: [Male, Female, All, Other]
 *               audienceAgeRange:
 *                 type: string
 *                 example: "18-35"
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *               languages:
 *                 type: array
 *                 items:
 *                   type: string
 *               socials:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     platform:
 *                       type: string
 *                       enum: [instagram, youtube, tiktok, facebook, twitter, linkedin]
 *                     followers:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /influencer/profile/update:
 *   post:
 *     summary: Update influencer profile (legacy — supports both data and image upload)
 *     tags: [Influencer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePic:
 *                 type: string
 *                 format: binary
 *               bannerImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated
 */

/**
 * @swagger
 * /influencer/profile/delete:
 *   post:
 *     summary: Permanently delete the influencer account
 *     tags: [Influencer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted
 */

/**
 * @swagger
 * /influencer/collab:
 *   get:
 *     summary: Get all available campaigns/collabs for an influencer to browse
 *     tags: [Influencer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of open collaboration opportunities
 */

/**
 * @swagger
 * /influencer/collab/{id}:
 *   get:
 *     summary: Get detail view of a specific collaboration/campaign
 *     tags: [Influencer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign or collaboration ID
 *     responses:
 *       200:
 *         description: Collaboration detail data
 *       404:
 *         description: Collaboration not found
 */

/**
 * @swagger
 * /influencer/collab/{collabId}/details:
 *   get:
 *     summary: Get detailed view of an active collaboration (with deliverables, progress, etc.)
 *     tags: [Influencer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collabId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Full collaboration details
 */

/**
 * @swagger
 * /influencer/collab/{collabId}/update-progress:
 *   post:
 *     summary: Update progress on an active collaboration
 *     tags: [Influencer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collabId
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
 *               progress:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Progress updated
 */

/**
 * @swagger
 * /influencer/campaign-history:
 *   get:
 *     summary: Get completed campaign history for the influencer
 *     tags: [Influencer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of past campaigns
 */

/**
 * @swagger
 * /influencer/apply/{campaignId}:
 *   post:
 *     summary: Apply to join a campaign as an influencer
 *     tags: [Influencer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: Optional cover message to the brand
 *     responses:
 *       200:
 *         description: Application submitted
 *       400:
 *         description: Already applied or campaign not open
 *       404:
 *         description: Campaign not found
 */

/**
 * @swagger
 * /influencer/brand-invites/{inviteId}/accept:
 *   post:
 *     summary: Accept a brand's collaboration invite
 *     tags: [Influencer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inviteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invite accepted
 *       404:
 *         description: Invite not found
 */

/**
 * @swagger
 * /influencer/brand-invites/{inviteId}/decline:
 *   post:
 *     summary: Decline a brand's collaboration invite
 *     tags: [Influencer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inviteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invite declined
 *       404:
 *         description: Invite not found
 */

/**
 * @swagger
 * /influencer/sent-requests/{requestId}/cancel:
 *   post:
 *     summary: Cancel a previously sent collaboration request to a brand
 *     tags: [Influencer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Request cancelled
 *       404:
 *         description: Request not found
 */

/**
 * @swagger
 * /influencer/invite-brand:
 *   post:
 *     summary: Invite a brand to collaborate
 *     tags: [Influencer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               brandId:
 *                 type: string
 *               campaignId:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Brand invite sent
 */

/**
 * @swagger
 * /influencer/content/create:
 *   post:
 *     summary: Submit content for a campaign deliverable (up to 10 media files)
 *     tags: [Influencer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               media_files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Up to 10 media files (max 50 MB each)
 *               deliverable_id:
 *                 type: string
 *               caption:
 *                 type: string
 *               platform:
 *                 type: string
 *     responses:
 *       201:
 *         description: Content submitted for review
 *       400:
 *         description: Validation or upload error
 */

/**
 * @swagger
 * /influencer/content/approved:
 *   get:
 *     summary: Get all content approved by the brand for the influencer
 *     tags: [Influencer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of approved content submissions
 */

/**
 * @swagger
 * /influencer/content/{contentId}/publish:
 *   post:
 *     summary: Mark approved content as published (live on social media)
 *     tags: [Influencer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content status updated to published
 *       404:
 *         description: Content not found
 */

/**
 * @swagger
 * /influencer/campaigns/{campaignId}/products:
 *   get:
 *     summary: Get products associated with a campaign (for content creation)
 *     tags: [Influencer]
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
 *       404:
 *         description: Campaign not found
 */

/**
 * @swagger
 * /influencer/signout:
 *   use:
 *     summary: Sign out the influencer (clears token cookie)
 *     tags: [Influencer]
 *     responses:
 *       302:
 *         description: Redirects to home page after clearing the token cookie
 */

const express = require('express');

const router = express.Router();
const { body, validationResult } = require('express-validator');
const brandController = require('../controllers/brand/brandProfileController');
const influencerProfileController = require('../controllers/influencer/influencerProfileController');
const influencerCampaignController = require('../controllers/influencer/influencerCampaignController');
const influencerDiscoveryController = require('../controllers/influencer/influencerDiscoveryController');
const influencerController = influencerProfileController; // Keep for backward compatibility
const CampaignContentController = require('../controllers/campaign/campaignContentController');
const multer = require('multer');
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
        files: 10 // Maximum 10 files
    },
    fileFilter: (req, file, cb) => {
        console.log('File filter called:', file);
        cb(null, true);
    }
});
const { uploadToCloudinary } = require('../utils/cloudinary');
const collaborationModel = require('../services/CollaborationModel');
const { isAuthenticated, isInfluencer } = require('./authRoutes');
const { CampaignInfo, CampaignInfluencers } = require('../models/CampaignMongo');
const { Product } = require('../models/ProductMongo');
const mongoose = require('mongoose');
const { uploadInfluencerProfilePic, uploadInfluencerBanner, deleteOldImage, handleUploadError } = require('../utils/imageUpload');
const path = require('path');
const fs = require('fs/promises');
const { InfluencerInfo, InfluencerAnalytics, InfluencerSocials } = require('../models/InfluencerMongo');
const { CampaignMetrics } = require('../models/CampaignMongo');

const { Message } = require('../models/MessageMongo');
const notificationController = require('../monolithic_files/notificationController');

// Apply authentication middleware to all routes
router.use((req, res, next) => {
    console.log('=== AUTH CHECK ===');
    console.log('User:', req.session.user);
    next();
});

router.use(isAuthenticated);
router.use(isInfluencer);

// Middleware to verify user is an influencer (supports both session and JWT)
const verifyInfluencer = (req, res, next) => {
    const userType = req.session?.user?.userType || req.user?.userType;

    if (userType === 'influencer') {
        // Ensure session has user for compatibility
        if (!req.session.user && req.user) {
            req.session.user = req.user;
        }
        next();
    } else {
        const isAPIRequest = req.headers.accept && req.headers.accept.includes('application/json');
        if (isAPIRequest) {
            return res.status(403).json({ message: 'Access denied: User is not an influencer' });
        } else {
            return res.redirect('/SignIn');
        }
    }
};

// Apply influencer verification to all routes
router.use(verifyInfluencer);

// Debug middleware to see all requests
router.use((req, res, next) => {
    next();
});

// Also keep the original route
router.post('/content/create', upload.array('media_files', 10), CampaignContentController.createContentFromForm);

// Route to get approved content for influencer
router.get('/content/approved', CampaignContentController.getApprovedContent);

// Route to update content status to published
router.post('/content/:contentId/publish', CampaignContentController.updateContentStatus);

// Validation middleware
const validateProfileUpdate = [
    body('displayName')
        .trim()
        .notEmpty().withMessage('Display name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Display name must be between 2 and 50 characters'),
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
    body('bio')
        .trim()
        .notEmpty().withMessage('Bio is required')
        .isLength({ max: 500 }).withMessage('Bio must be less than 500 characters'),
    body('location')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Location must be less than 100 characters'),
    body('audienceGender')
        .optional()
        .isIn(['Male', 'Female', 'All', 'Other']).withMessage('Invalid audience gender'),
    body('audienceAgeRange')
        .optional()
        .matches(/^\d+-\d+$/).withMessage('Age range must be in format "min-max"'),
    body('categories')
        .optional()
        .isArray().withMessage('Categories must be an array'),
    body('languages')
        .optional()
        .isArray().withMessage('Languages must be an array'),
    body('socials')
        .optional()
        .isArray().withMessage('Social links must be an array')
        .custom((socials) => {
            if (!Array.isArray(socials)) return true;
            return socials.every(social => {
                return (
                    social.platform &&
                    ['instagram', 'youtube', 'tiktok', 'facebook', 'twitter', 'linkedin'].includes(social.platform.toLowerCase()) &&
                    social.followers
                );
            });
        }).withMessage('Invalid social media data format'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            console.log('Request body:', req.body);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array().reduce((acc, error) => {
                    acc[error.param] = error.msg;
                    return acc;
                }, {})
            });
        }
        next();
    }
];

// Dashboard routes
router.get('/home', influencerProfileController.getInfluencerDashboard);

// New route for brand explore page for influencer
router.get('/explore', influencerDiscoveryController.getBrandExplorePage);

// New route for brand profile page for influencer
router.get('/I_brand_profile/:id', influencerDiscoveryController.getBrandProfilePage);

// Route for the influencer profile page
router.get('/profile', influencerProfileController.getInfluencerProfile);

// Route for updating the influencer profile images
router.post('/profile/update-images', upload.fields([
    { name: 'profilePic', maxCount: 1 },
    { name: 'bannerImage', maxCount: 1 }
]), async (req, res) => {
    try {
        const influencerId = req.session.user.id;
        if (!influencerId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const { profilePic, bannerImage } = req.files || {};
        const updateData = {};

        // Handle profile picture upload
        if (profilePic) {
            try {
                const profilePicUrl = await uploadToCloudinary(profilePic[0], 'influencer-profiles');
                if (profilePicUrl) {
                    updateData.profilePicUrl = profilePicUrl;
                }
            } catch (error) {
                console.error('Error uploading profile picture:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error uploading profile picture: ' + error.message
                });
            }
        }

        // Handle banner image upload
        if (bannerImage) {
            try {
                const bannerUrl = await uploadToCloudinary(bannerImage[0], 'influencer-banners');
                if (bannerUrl) {
                    updateData.bannerUrl = bannerUrl;
                }
            } catch (error) {
                console.error('Error uploading banner image:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error uploading banner image: ' + error.message
                });
            }
        }

        // Only update if we have new URLs
        if (Object.keys(updateData).length > 0) {
            try {
                // Update influencer in database
                const updatedInfluencer = await InfluencerInfo.findByIdAndUpdate(
                    influencerId,
                    { $set: updateData },
                    { new: true, runValidators: true }
                );

                if (!updatedInfluencer) {
                    return res.status(404).json({
                        success: false,
                        message: 'Influencer not found'
                    });
                }

                res.json({
                    success: true,
                    message: 'Images updated successfully',
                    influencer: updatedInfluencer
                });
            } catch (error) {
                console.error('Error updating influencer images:', error);
                res.status(500).json({
                    success: false,
                    message: 'Error updating images: ' + error.message
                });
            }
        } else {
            res.status(400).json({
                success: false,
                message: 'No images were uploaded'
            });
        }
    } catch (error) {
        console.error('Error in image update route:', error);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
});

// Route for updating the influencer profile data
router.post('/profile/update/data', validateProfileUpdate, influencerProfileController.updateProfileData);

// Legacy route for backward compatibility
router.post('/profile/update', upload.fields([
    { name: 'profilePic', maxCount: 1 },
    { name: 'bannerImage', maxCount: 1 }
]), influencerController.updateInfluencerProfile);

// Route for the collab details page
router.get('/collab', influencerCampaignController.getExploreCollabs);


router.get('/collab/:id', influencerCampaignController.getExploreCollabDetails);

// Get campaign history page
router.get('/campaign-history', isAuthenticated, influencerCampaignController.getCampaignHistory);

// Route for applying to a campaign
router.post('/apply/:campaignId', influencerCampaignController.applyToCampaign);

// Delete account
router.post('/profile/delete', isAuthenticated, isInfluencer, influencerProfileController.deleteAccount);

router.use('/signout', (req, res) => {
    res.clearCookie('token', { httpOnly: true, path: '/' });
    res.set('Cache-Control', 'no-store');
    res.redirect('/');
});

router.post('/collab/:collabId/update-progress', influencerCampaignController.updateProgress);

router.get('/collab/:collabId', influencerCampaignController.getCollabDetails);

router.get('/collab/:collabId/details', influencerCampaignController.getCollaborationDetails);
// Accept brand invite
router.post('/brand-invites/:inviteId/accept', influencerCampaignController.acceptBrandInvite);

// Decline brand invite
router.post('/brand-invites/:inviteId/decline', influencerCampaignController.declineBrandInvite);

// Cancel sent request
router.post('/sent-requests/:requestId/cancel', influencerCampaignController.cancelSentRequest);

// Invite brand to collaborate
router.post('/invite-brand', influencerCampaignController.inviteBrand);

// Route for brand profile page
router.get('/brand_profile/:id', influencerDiscoveryController.getBrandProfilePage);



// ========== CAMPAIGN CONTENT CREATION ROUTES ==========

// Removed redundant routes - using integrated deliverables workflow
// - POST /campaigns/:campaignId/content (replaced by /content/create with deliverable_id)
// - POST /content/:contentId/submit (createContentFromForm submits directly)


// Get products for a campaign (for content creation)
router.get('/campaigns/:campaignId/products', influencerCampaignController.getCampaignProducts);

// Error handling middleware for multer errors
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        console.error('Multer error:', error);
        return res.status(400).json({
            success: false,
            message: 'File upload error: ' + error.message
        });
    }
    next(error);
});

module.exports = router;