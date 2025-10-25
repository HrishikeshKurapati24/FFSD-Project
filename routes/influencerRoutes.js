const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const brandController = require('../controllers/brandController');
const influencerController = require('../controllers/influencerController');
const CampaignContentController = require('../controllers/campaignContentController');
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
const collaborationModel = require('../models/CollaborationModel');
const { isAuthenticated, isInfluencer } = require('./authRoutes');
const { CampaignInfo, CampaignInfluencers } = require('../config/CampaignMongo');
const { Product } = require('../config/ProductMongo');
const mongoose = require('mongoose');
const { uploadInfluencerProfilePic, uploadInfluencerBanner, deleteOldImage, handleUploadError } = require('../utils/imageUpload');
const path = require('path');
const fs = require('fs/promises');
const { InfluencerInfo, InfluencerAnalytics, InfluencerSocials } = require('../config/InfluencerMongo');
const { CampaignMetrics } = require('../config/CampaignMongo');
const { brandModel } = require('../models/brandModel');
const { Message } = require('../config/MessageMongo');

// Apply authentication middleware to all routes
router.use((req, res, next) => {
    console.log('=== AUTH CHECK ===');
    console.log('User:', req.session.user);
    next();
});

router.use(isAuthenticated);
router.use(isInfluencer);

// Middleware to verify user is an influencer
const verifyInfluencer = (req, res, next) => {
    if (req.session.user && req.session.user.userType === 'influencer') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied: User is not an influencer' });
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

// router.use(influencerAuthMiddleware);

// Dashboard routes
router.get('/home', influencerController.getInfluencerDashboard);

// New route for brand explore page for influencer
router.get('/explore', influencerController.getBrandExplorePage);

// New route for brand profile page for influencer
router.get('/I_brand_profile/:id', influencerController.getBrandProfilePage);

// Route for the influencer profile page
router.get('/profile', influencerController.getInfluencerProfile);

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
router.post('/profile/update/data', validateProfileUpdate, async (req, res) => {
    try {
        const influencerId = req.session.user.id;
        if (!influencerId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        console.log('Received update data:', req.body); // Debug log

        // Get current profile to compare changes
        const currentProfile = await InfluencerInfo.findById(influencerId);
        if (!currentProfile) {
            return res.status(404).json({
                success: false,
                message: 'Influencer profile not found'
            });
        }

        // Prepare update data for InfluencerInfo
        const updateData = {
            displayName: req.body.displayName?.trim(),
            username: req.body.username?.trim(),
            bio: req.body.bio?.trim(),
            location: req.body.location?.trim(),
            audienceGender: req.body.audienceGender?.trim(),
            audienceAgeRange: req.body.audienceAgeRange?.trim(),
            categories: Array.isArray(req.body.categories) ? req.body.categories :
                (req.body.categories ? [req.body.categories].filter(Boolean) : []),
            languages: Array.isArray(req.body.languages) ? req.body.languages :
                (req.body.languages ? [req.body.languages].filter(Boolean) : [])
        };

        console.log('Prepared update data:', updateData); // Debug log

        // Handle social links update
        if (req.body.socials && Array.isArray(req.body.socials)) {
            console.log('Processing social links:', req.body.socials); // Debug log

            // Get current socials
            const currentSocials = await InfluencerSocials.findOne({ influencerId });

            // Prepare platforms array with proper validation
            const platforms = req.body.socials
                .filter(social => social.platform && social.followers) // Only include valid entries
                .map(social => ({
                    platform: social.platform.toLowerCase(),
                    handle: social.url ? social.url.split('/').pop() : social.platform.toLowerCase(),
                    followers: parseInt(social.followers) || 0,
                    engagementRate: 0,
                    avgLikes: 0,
                    avgComments: 0,
                    avgViews: 0,
                    category: 'general'
                }));

            console.log('Processed platforms:', platforms); // Debug log

            if (currentSocials) {
                // Update existing socials
                const updatedSocials = await InfluencerSocials.findByIdAndUpdate(
                    currentSocials._id,
                    {
                        platforms: platforms,
                        socialHandle: req.body.username
                    },
                    { new: true }
                );
                console.log('Updated socials:', updatedSocials); // Debug log
            } else {
                // Create new socials document
                const newSocials = await new InfluencerSocials({
                    influencerId,
                    socialHandle: req.body.username,
                    platforms: platforms
                }).save();
                console.log('Created new socials:', newSocials); // Debug log
            }
        }

        // Only update if there are changes
        const hasChanges = Object.keys(updateData).some(key =>
            JSON.stringify(updateData[key]) !== JSON.stringify(currentProfile[key])
        );

        if (hasChanges) {
            const updatedInfluencer = await InfluencerInfo.findByIdAndUpdate(
                influencerId,
                { $set: updateData },
                { new: true, runValidators: true }
            );

            if (!updatedInfluencer) {
                return res.status(404).json({
                    success: false,
                    message: 'Failed to update influencer profile'
                });
            }
            console.log('Updated influencer:', updatedInfluencer); // Debug log
        }

        // Get updated data to return
        const updatedProfile = await InfluencerInfo.findById(influencerId);
        const updatedSocials = await InfluencerSocials.findOne({ influencerId });

        console.log('Final updated profile:', updatedProfile); // Debug log
        console.log('Final updated socials:', updatedSocials); // Debug log

        return res.json({
            success: true,
            message: hasChanges ? 'Profile updated successfully' : 'No changes to update',
            profile: {
                ...updateData,
                socials: updatedSocials?.platforms || []
            }
        });

    } catch (error) {
        console.error('Error updating influencer profile:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        return res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
});

// Legacy route for backward compatibility
router.post('/profile/update', upload.fields([
    { name: 'profilePic', maxCount: 1 },
    { name: 'bannerImage', maxCount: 1 }
]), influencerController.updateInfluencerProfile);

// Route for the collab details page
router.get('/collab', async (req, res) => {
    try {
        const influencerId = req.session.user.id;

        // Get campaigns with status 'request' from CampaignInfo (brand posted campaigns)
        const allRequests = await CampaignInfo.find({ status: 'request' })
            .populate('brand_id', 'brandName logoUrl')
            .sort({ createdAt: -1 })
            .lean();

        // Get campaigns where this influencer already has entries with 'brand-invite' or 'influencer-invite' status
        const existingInvites = await CampaignInfluencers.find({
            influencer_id: new mongoose.Types.ObjectId(influencerId),
            status: { $in: ['brand-invite', 'influencer-invite'] }
        }).select('campaign_id').lean();

        // Extract campaign IDs that this influencer is already invited to or has invited
        const excludedCampaignIds = existingInvites.map(invite => invite.campaign_id.toString());

        // Filter out campaigns where influencer already has invites
        const requests = allRequests.filter(request =>
            !excludedCampaignIds.includes(request._id.toString())
        );

        // Get products for each campaign
        const campaignIds = requests.map(request => request._id);
        const products = await Product.find({
            campaign_id: { $in: campaignIds }
        }).select('campaign_id name category').lean();

        // Group products by campaign_id
        const productsByCampaign = {};
        products.forEach(product => {
            if (!productsByCampaign[product.campaign_id.toString()]) {
                productsByCampaign[product.campaign_id.toString()] = [];
            }
            productsByCampaign[product.campaign_id.toString()].push(product);
        });

        // Transform the data to match the view's requirements
        const collabs = requests.map(request => {
            const campaignProducts = productsByCampaign[request._id.toString()] || [];
            const productCategories = [...new Set(campaignProducts.map(p => p.category).filter(Boolean))];

            return {
                id: request._id,
                title: request.title,
                brand_name: request.brand_id?.brandName || 'Unknown Brand',
                influence_regions: request.target_audience,
                budget: parseFloat(request.budget) || 0,
                offer_sentence: request.description,
                channels: Array.isArray(request.required_channels) ? request.required_channels.join(', ') : '',
                min_followers: request.min_followers?.toLocaleString() || '0',
                age_group: request.target_audience?.split(',')[0] || 'All Ages',
                genders: request.target_audience?.split(',')[1] || 'All Genders',
                duration: request.duration || 0,
                required_channels: Array.isArray(request.required_channels) ? request.required_channels : [],
                created_at: request.createdAt || new Date(),
                // Product information
                products: campaignProducts,
                product_names: campaignProducts.map(p => p.name).join(', '),
                product_categories: productCategories,
                primary_category: productCategories[0] || null
            };
        });

        res.render('influencer/collaborations', {
            collabs: collabs,
            influencer: influencerId
        });
    } catch (error) {
        console.error('Error fetching campaign requests:', error);
        res.status(500).render('error', {
            message: 'Error loading campaign requests',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});


router.get('/collab/:id', async (req, res) => {
    try {
        const collabId = req.params.id;
        const influencerId = req.session.user.id;
        const collab = await collaborationModel.getCollaborationDetails(collabId);
        if (!collab) {
            return res.status(404).render('error', {
                message: 'Collaboration not found',
                error: { status: 404 }
            });
        }

        // Check if influencer has already applied to this campaign
        const existingApplication = await CampaignInfluencers.findOne({
            campaign_id: new mongoose.Types.ObjectId(collabId),
            influencer_id: new mongoose.Types.ObjectId(influencerId)
        });

        const applicationStatus = existingApplication ? existingApplication.status : null;

        // Compute eligibility based on requirements
        // Fetch influencer socials to determine channels and followers
        const socials = await InfluencerSocials.findOne({ influencerId: new mongoose.Types.ObjectId(influencerId) }).lean();
        const influencerChannels = (socials?.platforms || []).map(p => (p.platform || '').toLowerCase());
        const influencerFollowersTotal = (socials?.platforms || []).reduce((sum, p) => sum + (p.followers || 0), 0);

        // Fetch influencer categories from InfluencerInfo
        const influencerInfo = await InfluencerInfo.findById(influencerId).select('categories').lean();
        const influencerCategories = (influencerInfo?.categories || []).map(cat => (cat || '').toLowerCase().trim());

        const requiredChannels = Array.isArray(collab.required_channels) ? collab.required_channels.map(c => (c || '').toLowerCase()) : [];
        const missingChannels = requiredChannels.filter(rc => !influencerChannels.includes(rc));
        const minFollowers = typeof collab.min_followers === 'number' ? collab.min_followers : 0;
        const meetsFollowers = influencerFollowersTotal >= minFollowers;

        const unmetRequirements = [];
        if (missingChannels.length > 0) {
            unmetRequirements.push(`Missing required channels: ${missingChannels.join(', ')}`);
        }
        if (!meetsFollowers) {
            unmetRequirements.push(`Minimum followers required: ${minFollowers.toLocaleString()}`);
        }

        // Fetch products for this campaign
        const products = await Product.find({
            campaign_id: new mongoose.Types.ObjectId(collabId),
            status: 'active'
        }).lean();

        // Add products to the collab object
        collab.products = products;

        // Check category matching between influencer and products
        if (products && products.length > 0) {
            const productCategories = products.map(product => (product.category || '').toLowerCase().trim()).filter(Boolean);
            const hasCategoryMatch = productCategories.some(productCategory =>
                influencerCategories.some(influencerCategory =>
                    influencerCategory === productCategory ||
                    influencerCategory.includes(productCategory) ||
                    productCategory.includes(influencerCategory)
                )
            );

            if (!hasCategoryMatch && productCategories.length > 0) {
                unmetRequirements.push(`Category mismatch: Your categories (${influencerCategories.join(', ') || 'None'}) don't match the product categories (${productCategories.join(', ')})`);
            }
        }

        const isEligible = unmetRequirements.length === 0;

        res.render('influencer/collaboration_details', { collab, applicationStatus, isEligible, unmetRequirements });
    } catch (error) {
        console.error('Error fetching collaboration details:', error);
        res.status(500).render('error', {
            message: 'Error loading collaboration details',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// Get campaign history page
router.get('/campaign-history', isAuthenticated, influencerController.getCampaignHistory);

// Route for applying to a campaign
router.post('/apply/:campaignId', async (req, res) => {
    try {
        const campaignId = req.params.campaignId;
        const influencerId = req.session.user.id;
        const specialMessage = typeof req.body?.message === 'string' ? req.body.message.trim() : '';

        //Check if the influencer is verified, if not, return an error
        const influencer = await InfluencerInfo.findById(influencerId);
        if (!influencer.verified) {
            return res.status(400).json({
                success: false,
                message: 'Your account is not verified. Please wait for verification.'
            });
        }

        // Check subscription limits for brand connections
        const { SubscriptionService } = require('../models/brandModel');
        try {
            const limitCheck = await SubscriptionService.checkSubscriptionLimit(influencerId, 'influencer', 'connect_brand');
            if (!limitCheck.allowed) {
                // Check if subscription is expired
                if (limitCheck.redirectToPayment) {
                    return res.status(403).json({
                        success: false,
                        message: limitCheck.reason,
                        expired: true,
                        redirectUrl: '/subscription/manage'
                    });
                }

                return res.status(400).json({
                    success: false,
                    message: `${limitCheck.reason}. Please upgrade your plan to connect with more brands.`,
                    showUpgradeLink: true
                });
            }
        } catch (subscriptionError) {
            console.error('Subscription check error:', subscriptionError);
            return res.status(500).json({
                success: false,
                message: 'Unable to verify subscription. Please try again later.'
            });
        }

        // Check if campaign exists
        const campaign = await CampaignInfo.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        // Check if influencer has already applied or been invited
        const existingApplication = await CampaignInfluencers.findOne({
            campaign_id: new mongoose.Types.ObjectId(campaignId),
            influencer_id: new mongoose.Types.ObjectId(influencerId)
        });

        if (existingApplication) {
            if (existingApplication.status === 'request') {
                // If invited, accept the invitation
                existingApplication.status = 'active';
                existingApplication.applied_at = new Date();
                await existingApplication.save();

                // Update influencer subscription usage
                try {
                    const { SubscriptionService } = require('../models/brandModel');
                    await SubscriptionService.updateUsage(influencerId, 'influencer', { campaignsUsed: 1 });
                } catch (usageError) {
                    console.error('Error updating influencer subscription usage:', usageError);
                    // Continue even if usage update fails
                }

                // Store special message if provided
                if (specialMessage) {
                    const campaignDoc = await CampaignInfo.findById(campaignId).select('brand_id').lean();
                    if (campaignDoc?.brand_id) {
                        await new Message({
                            brand_id: campaignDoc.brand_id,
                            influencer_id: new mongoose.Types.ObjectId(influencerId),
                            campaign_id: new mongoose.Types.ObjectId(campaignId),
                            message: specialMessage
                        }).save();
                    }
                }

                return res.json({
                    success: true,
                    message: 'Invitation accepted successfully',
                    applicationId: existingApplication._id
                });
            } else if (existingApplication.status === 'active') {
                return res.status(400).json({
                    success: false,
                    message: 'You are already active in this campaign'
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'You have already applied to this campaign'
                });
            }
        }

        // Create new campaign influencer entry
        const newApplication = new CampaignInfluencers({
            campaign_id: campaignId,
            influencer_id: influencerId,
            status: 'request',
            progress: 0,
            engagement_rate: 0,
            reach: 0,
            clicks: 0,
            conversions: 0,
            timeliness_score: 0,
            applied_at: new Date()
        });

        await newApplication.save();

        // Update subscription usage for brand connection
        try {
            await SubscriptionService.updateUsage(influencerId, 'influencer', { brandsConnected: 1 });
        } catch (usageError) {
            console.error('Error updating subscription usage:', usageError);
            // Continue even if usage update fails
        }

        // Store special message if provided
        if (specialMessage) {
            const campaignDoc = await CampaignInfo.findById(campaignId).select('brand_id').lean();
            if (campaignDoc?.brand_id) {
                await new Message({
                    brand_id: campaignDoc.brand_id,
                    influencer_id: new mongoose.Types.ObjectId(influencerId),
                    campaign_id: new mongoose.Types.ObjectId(campaignId),
                    message: specialMessage
                }).save();
            }
        }

        res.json({
            success: true,
            message: 'Application submitted successfully',
            applicationId: newApplication._id
        });

    } catch (error) {
        console.error('Error applying to campaign:', error);
        res.status(500).json({
            success: false,
            message: 'Error applying to campaign',
            error: error.message
        });
    }
});

// Delete account
router.post('/profile/delete', isAuthenticated, isInfluencer, async (req, res) => {
    try {
        const influencerId = req.session.user.id;
        if (!influencerId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        // Delete all associated data
        await Promise.all([
            // Delete influencer info
            InfluencerInfo.findByIdAndDelete(influencerId),
            // Delete influencer analytics
            InfluencerAnalytics.deleteMany({ influencerId }),
            // Delete influencer socials
            InfluencerSocials.deleteMany({ influencerId }),
            // Delete influencer campaigns
            CampaignInfluencers.updateMany(
                { 'influencer_id': influencerId },
                { $pull: { influencers: { influencerId } } }
            )
        ]);

        // Clear session
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                return res.status(500).json({ success: false, message: 'Error destroying session' });
            }
            res.json({ success: true, message: 'Account deleted successfully' });
        });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ success: false, message: 'Failed to delete account' });
    }
});

router.use('/signout', (req, res) => {
    res.clearCookie('token', { httpOnly: true, path: '/' });
    res.set('Cache-Control', 'no-store');
    res.redirect('/');
});

router.post('/collab/:collabId/update-progress', influencerController.updateProgress);

router.get('/collab/:collabId', influencerController.getCollabDetails);

router.get('/collab/:collabId/details', influencerController.getCollaborationDetails);
// Accept brand invite
router.post('/brand-invites/:inviteId/accept', async (req, res) => {
    try {
        const inviteId = req.params.inviteId;
        const influencerId = req.session.user.id;

        // Find the invite
        const invite = await CampaignInfluencers.findOne({
            _id: new mongoose.Types.ObjectId(inviteId),
            influencer_id: new mongoose.Types.ObjectId(influencerId),
            status: 'brand-invite'
        });

        if (!invite) {
            return res.status(404).json({
                success: false,
                message: 'Invitation not found or already processed'
            });
        }

        // Update status to request
        invite.status = 'request';
        await invite.save();

        res.json({
            success: true,
            message: 'Invitation accepted successfully'
        });
    } catch (error) {
        console.error('Error accepting brand invite:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to accept invitation',
            error: error.message
        });
    }
});

// Decline brand invite
router.post('/brand-invites/:inviteId/decline', async (req, res) => {
    try {
        const inviteId = req.params.inviteId;
        const influencerId = req.session.user.id;

        // Find the invite
        const invite = await CampaignInfluencers.findOne({
            _id: new mongoose.Types.ObjectId(inviteId),
            influencer_id: new mongoose.Types.ObjectId(influencerId),
            status: 'brand-invite'
        });

        if (!invite) {
            return res.status(404).json({
                success: false,
                message: 'Invitation not found or already processed'
            });
        }

        // Update status to cancelled
        invite.status = 'cancelled';
        await invite.save();

        res.json({
            success: true,
            message: 'Invitation declined'
        });
    } catch (error) {
        console.error('Error declining brand invite:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to decline invitation',
            error: error.message
        });
    }
});

// Cancel sent request
router.post('/sent-requests/:requestId/cancel', async (req, res) => {
    try {
        const requestId = req.params.requestId;
        const influencerId = req.session.user.id;

        // Find the sent request
        const request = await CampaignInfluencers.findOne({
            _id: new mongoose.Types.ObjectId(requestId),
            influencer_id: new mongoose.Types.ObjectId(influencerId),
            status: 'influencer-invite'
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found or already processed'
            });
        }

        // Verify the campaign is still in 'request' status
        const campaign = await CampaignInfo.findById(request.campaign_id);
        if (!campaign || campaign.status !== 'request') {
            return res.status(400).json({
                success: false,
                message: 'Campaign is no longer accepting requests'
            });
        }

        // Update status to cancelled
        request.status = 'cancelled';
        await request.save();

        campaign.status = 'cancelled';
        await campaign.save();

        res.json({
            success: true,
            message: 'Request cancelled successfully'
        });
    } catch (error) {
        console.error('Error cancelling sent request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel request',
            error: error.message
        });
    }
});

// Invite brand to collaborate
router.post('/invite-brand', async (req, res) => {
    try {
        const influencerId = req.session.user.id;
        let {
            brandId,
            title,
            description,
            budget,
            product_name,
            required_channels
        } = req.body;

        //Check if the influencer is verified, if not, return an error
        const influencer = await InfluencerInfo.findById(influencerId);
        if (!influencer.verified) {
            return res.status(400).json({
                success: false,
                message: 'Your account is not verified. Please wait for verification.'
            });
        }

        // Check subscription limits for brand connections
        const { SubscriptionService } = require('../models/brandModel');
        try {
            const limitCheck = await SubscriptionService.checkSubscriptionLimit(influencerId, 'influencer', 'connect_brand');
            if (!limitCheck.allowed) {
                return res.status(400).json({
                    success: false,
                    message: `Brand connection limit reached: ${limitCheck.reason}. Please upgrade your plan to connect with more brands.`,
                    showUpgradeLink: true
                });
            }
        } catch (subscriptionError) {
            console.error('Subscription check error:', subscriptionError);
            // Continue with invitation if subscription check fails (fallback)
        }

        // Validate input - only require the fields that influencer fills
        if (!brandId || !title || !description || !budget || !product_name || !required_channels || required_channels.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be provided'
            });
        }

        // Validate MongoDB ObjectId format
        if (!mongoose.Types.ObjectId.isValid(brandId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid brand ID format'
            });
        }

        // Check if brand exists
        const { BrandInfo } = require('../config/BrandMongo');
        const brand = await BrandInfo.findById(brandId);
        if (!brand) {
            return res.status(404).json({
                success: false,
                message: 'Brand not found'
            });
        }

        // Get influencer's total follower count
        let influencerFollowers = 0;
        try {
            const influencerAnalytics = await InfluencerAnalytics.findOne({
                influencer_id: new mongoose.Types.ObjectId(influencerId)
            });
            if (influencerAnalytics) {
                influencerFollowers = influencerAnalytics.totalFollowers || 0;
            }
        } catch (error) {
            console.error('Error fetching influencer analytics:', error);
            // Continue with 0 if analytics not found
        }

        // Create campaign in CampaignInfo with minimal required fields
        // The brand will fill the rest (objectives, start_date, end_date, target_audience, etc.)
        const newCampaign = new CampaignInfo({
            brand_id: new mongoose.Types.ObjectId(brandId),
            title: title.trim(),
            description: description.trim(),
            budget: parseFloat(budget),
            product_name: product_name.trim(),
            required_channels: required_channels,
            min_followers: Math.floor(influencerFollowers * 0.5), // 50% of influencer's total followers
            status: 'influencer-invite', // Campaign starts in influencer-invite status
            // These fields will be filled by the brand later:
            objectives: '', // Empty - brand will fill
            start_date: null, // Empty - brand will fill
            end_date: null, // Empty - brand will fill
            duration: 0, // Empty - brand will fill
            target_audience: '', // Empty - brand will fill
            required_influencers: 1 // Default to 1 since influencer is inviting themselves
        });

        await newCampaign.save();

        const newProduct = new Product({
            campaign_id: newCampaign._id,
            brand_id: new mongoose.Types.ObjectId(brandId),
            name: product_name.trim(),
            description: '',
            original_price: 0,
            campaign_price: 0,
            category: '',
            target_quantity: 0,
            images: [],
            tags: [],
            is_digital: false,
            delivery_info: {
                estimated_days: 0,
                shipping_cost: 0,
                free_shipping_threshold: 0
            },
            specifications: new Map(),
            status: 'active',
            created_by: new mongoose.Types.ObjectId(brandId)
        });
        await newProduct.save();

        // Create entry in CampaignInfluencers with influencer-invite status
        const campaignInfluencer = new CampaignInfluencers({
            campaign_id: newCampaign._id,
            influencer_id: new mongoose.Types.ObjectId(influencerId),
            status: 'influencer-invite',
            progress: 0
        });

        await campaignInfluencer.save();

        // Update subscription usage for brand connection
        try {
            await SubscriptionService.updateUsage(influencerId, 'influencer', { brandsConnected: 1 });
        } catch (usageError) {
            console.error('Error updating subscription usage:', usageError);
            // Continue even if usage update fails
        }

        res.json({
            success: true,
            message: 'Invitation sent to brand successfully. The brand will complete the campaign details.',
            campaignId: newCampaign._id
        });
    } catch (error) {
        console.error('Error inviting brand:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send invitation',
            error: error.message
        });
    }
});

// Route for brand profile page
router.get('/brand_profile/:id', async (req, res) => {
    try {
        const brandId = req.params.id;
        const brand = await brandModel.getBrandById(brandId);

        if (!brand) {
            return res.status(404).render('error', {
                error: { status: 404 },
                message: 'Brand not found'
            });
        }

        // Get additional data needed for the profile
        const socialStats = await brandModel.getSocialStats(brandId);
        const topCampaigns = await brandModel.getTopCampaigns(brandId);
        const verificationStatus = await brandModel.getVerificationStatus(brandId);

        // Helper function to safely parse categories
        const parseCategories = (categories) => {
            if (!categories) return [];
            if (Array.isArray(categories)) return categories;
            if (typeof categories === 'string') {
                try {
                    return JSON.parse(categories);
                } catch (e) {
                    // If JSON parsing fails, try splitting by comma
                    return categories.split(',').map(cat => cat.trim()).filter(Boolean);
                }
            }
            return [];
        };

        // Get social media platforms data
        const socials = socialStats.map(stat => {
            const platformIcons = {
                'instagram': 'instagram',
                'youtube': 'youtube',
                'tiktok': 'tiktok',
                'facebook': 'facebook',
                'twitter': 'twitter',
                'linkedin': 'linkedin'
            };

            return {
                platform: stat.platform,
                name: stat.platform.charAt(0).toUpperCase() + stat.platform.slice(1),
                icon: platformIcons[stat.platform] || 'link',
                followers: stat.followers || 0,
                avgLikes: Math.floor((stat.followers || 0) * 0.05), // Estimated likes based on followers
                avgComments: Math.floor((stat.followers || 0) * 0.01), // Estimated comments
                avgViews: stat.platform === 'youtube' ? Math.floor((stat.followers || 0) * 2) : Math.floor((stat.followers || 0) * 0.1)
            };
        });

        // Get best campaigns (top performing campaigns)
        const bestCampaigns = topCampaigns.slice(0, 6).map(campaign => ({
            id: campaign._id,
            title: campaign.title,
            thumbnail: campaign.thumbnail || '/images/default-campaign.jpg',
            platform: campaign.platform || 'general',
            likes: campaign.likes || Math.floor(Math.random() * 10000),
            comments: campaign.comments || Math.floor(Math.random() * 1000),
            views: campaign.views || Math.floor(Math.random() * 50000),
            url: campaign.url || '#',
            performance_score: campaign.performance_score || Math.random() * 10
        }));

        // Calculate performance metrics
        const totalFollowers = socialStats.reduce((sum, stat) => sum + (stat.followers || 0), 0);
        const avgEngagementRate = brand.avgEngagementRate || Math.random() * 5 + 2; // 2-7%
        const totalReach = Math.floor(totalFollowers * (avgEngagementRate / 100) * 10);
        const totalImpressions = Math.floor(totalReach * 3);
        const totalEngagement = Math.floor(totalImpressions * (avgEngagementRate / 100));
        const conversionRate = brand.conversionRate || Math.random() * 3 + 1; // 1-4%

        // Transform brand data for the template - matching influencer_details.ejs structure
        const transformedBrand = {
            // Basic info (matching influencer structure)
            displayName: brand.displayName || brand.name || 'Unknown Brand',
            fullName: brand.displayName || brand.name,
            username: brand.username || 'unknown',
            bio: brand.bio || brand.mission || 'No description available',
            profilePicUrl: brand.logoUrl || '/images/default-brand.png',
            verified: brand.verified || false,

            // Stats (matching influencer structure)
            totalFollowers: totalFollowers,
            avgEngagementRate: avgEngagementRate,
            completedCollabs: topCampaigns.length,
            rating: brand.rating || 4.5,

            // Social platforms (matching influencer structure)
            socials: socials,

            // Best posts/campaigns (matching influencer structure)
            bestPosts: bestCampaigns,

            // Audience demographics (matching influencer structure)
            audienceDemographics: {
                gender: brand.targetGender || 'Mixed',
                ageRange: brand.targetAgeRange || '18-45'
            },

            // Performance metrics (matching influencer structure)
            performanceMetrics: {
                reach: totalReach,
                impressions: totalImpressions,
                engagement: totalEngagement,
                conversionRate: conversionRate
            },

            // Categories (matching influencer structure)
            categories: parseCategories(brand.categories),

            // Languages (brand-specific)
            languages: brand.languages || ['English'],

            // Additional brand-specific data
            location: brand.location,
            website: brand.website || `https://${brand.username}.com`,
            mission: brand.mission || brand.bio,
            values: parseCategories(brand.categories),
            targetAgeRange: brand.targetAgeRange,
            targetGender: brand.targetGender,
            completedCampaigns: topCampaigns.length,
            influencerPartnerships: Math.round(topCampaigns.length * 2.5),
            avgCampaignRating: brand.rating || 4.5,
            topCampaigns: topCampaigns.map(campaign => ({
                id: campaign._id,
                title: campaign.title,
                status: campaign.status || 'Active',
                performance_score: campaign.performance_score || 0,
                reach: campaign.reach || 0
            }))
        };

        res.render('influencer/brand_profile', {
            brand: transformedBrand
        });
    } catch (error) {
        console.error('Error fetching brand profile:', error);
        res.status(500).render('error', {
            error: { status: 500 },
            message: 'Error loading brand profile'
        });
    }
});

// ========== CAMPAIGN CONTENT CREATION ROUTES ==========

// Test route to verify routes are working
router.get('/test', (req, res) => {
    res.json({ message: 'Influencer routes are working!' });
});

// Other content routes (must come after specific routes)
router.post('/campaigns/:campaignId/content', CampaignContentController.createContent);
router.post('/content/:contentId/submit', CampaignContentController.submitContent);

// Get products for a campaign (for content creation)
router.get('/campaigns/:campaignId/products', async (req, res) => {
    try {
        const { campaignId } = req.params;
        const influencerId = req.session.user.id;

        // Verify influencer has access to this campaign
        const collaboration = await CampaignInfluencers.findOne({
            campaign_id: campaignId,
            influencer_id: influencerId,
            status: 'active'
        });

        if (!collaboration) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: You are not part of this campaign'
            });
        }

        // Get products for this campaign
        const products = await Product.find({
            campaign_id: campaignId,
            status: 'active'
        }).select('name description campaign_price images category');

        res.json({
            success: true,
            products
        });

    } catch (error) {
        console.error('Error fetching campaign products:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: error.message
        });
    }
});

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