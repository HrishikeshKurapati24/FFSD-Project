const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const brandController = require('../controllers/brandController');
const influencerController = require('../controllers/influencerController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { uploadToCloudinary } = require('../utils/cloudinary');
const collaborationModel = require('../models/CollaborationModel');
const { isAuthenticated, isInfluencer } = require('./authRoutes');
const { CampaignInfo, CampaignInfluencers } = require('../config/CampaignMongo');
const mongoose = require('mongoose');
const { uploadInfluencerProfilePic, uploadInfluencerBanner, deleteOldImage, handleUploadError } = require('../utils/imageUpload');
const path = require('path');
const fs = require('fs/promises');
const { InfluencerInfo, InfluencerAnalytics, InfluencerSocials } = require('../config/InfluencerMongo');
const { CampaignMetrics } = require('../config/CampaignMongo');

// Apply authentication middleware to all routes
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
            return res.status(400).json({
                success: false,
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

        // Get campaigns with status 'request' from CampaignInfo
        const requests = await CampaignInfo.find({ status: 'request' })
            .populate('brand_id', 'brandName logoUrl')
            .sort({ createdAt: -1 })
            .lean();

        // Transform the data to match the view's requirements
        const collabs = requests.map(request => ({
            id: request._id,
            title: request.title,
            brand_name: request.brand_id?.brandName || 'Unknown Brand',
            influence_regions: request.target_audience,
            budget: parseFloat(request.budget) || 0,
            commission: '10%',
            offer_sentence: request.description,
            channels: Array.isArray(request.required_channels) ? request.required_channels.join(', ') : '',
            min_followers: request.min_followers?.toLocaleString() || '0',
            age_group: request.target_audience?.split(',')[0] || 'All Ages',
            genders: request.target_audience?.split(',')[1] || 'All Genders',
            duration: request.duration || 0,
            required_channels: Array.isArray(request.required_channels) ? request.required_channels : [],
            created_at: request.createdAt || new Date()
        }));

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
        const collab = await collaborationModel.getCollaborationDetails(collabId);
        if (!collab) {
            return res.status(404).render('error', {
                message: 'Collaboration not found',
                error: { status: 404 }
            });
        }
        res.render('influencer/collaboration_details', { collab });
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

        // Check if campaign exists
        const campaign = await CampaignInfo.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        // Check if influencer has already applied
        const existingApplication = await CampaignInfluencers.findOne({
            campaign_id: new mongoose.Types.ObjectId(campaignId),
            influencer_id: new mongoose.Types.ObjectId(influencerId)
        });

        if (existingApplication) {
            return res.status(400).json({
                success: false,
                message: 'You have already applied to this campaign'
            });
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
            timeliness_score: 0
        });

        await newApplication.save();

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

module.exports = router;