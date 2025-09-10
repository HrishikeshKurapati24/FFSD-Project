const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const { upload } = require('../utils/imageUpload');
const { uploadToCloudinary } = require('../utils/cloudinary');
const { isAuthenticated, isBrand } = require('./authRoutes');
const { CampaignPayments, CampaignInfluencers, CampaignInfo, CampaignMetrics } = require('../config/CampaignMongo');
const { InfluencerInfo, InfluencerSocials, InfluencerAnalytics } = require('../config/InfluencerMongo');
const mongoose = require('mongoose');
const { BrandInfo, BrandAnalytics, BrandSocials } = require('../config/BrandMongo');
const Offer = require('../config/OfferMongo');

// Apply authentication middleware to all routes
router.use(isAuthenticated);
router.use(isBrand);

// Middleware to verify brand ID matches session
const verifyBrandId = (req, res, next) => {
    if (req.session.user && req.session.user.id) {
        // Add brand ID to request for use in routes
        req.brandId = req.session.user.id;
        next();
    } else {
        res.status(403).json({ message: 'Access denied: Invalid brand ID' });
    }
};

// Apply brand ID verification to all routes
router.use('/', verifyBrandId);

router.get('/home', brandController.getBrandDashboard);

// Route for the influencer explore page
router.get('/explore', async (req, res) => {
    try {
        // Get all influencers with their basic info
        const influencers = await InfluencerInfo.find({})
            .select('fullName profilePicUrl verified categories niche displayName')
            .lean();

        // Get analytics data for all influencers
        const influencerIds = influencers.map(inf => inf._id);
        const analyticsData = await InfluencerAnalytics.find({
            influencerId: { $in: influencerIds }
        })
            .select('influencerId totalFollowers avgEngagementRate audienceDemographics performanceMetrics')
            .lean();

        // Create a map of analytics data for quick lookup
        const analyticsMap = new Map();
        analyticsData.forEach(analytics => {
            analyticsMap.set(analytics.influencerId.toString(), analytics);
        });

        // Combine influencer info with analytics data
        const enrichedInfluencers = influencers.map(influencer => {
            const analytics = analyticsMap.get(influencer._id.toString()) || {};
            return {
                _id: influencer._id,
                fullName: influencer.fullName,
                displayName: influencer.displayName || influencer.fullName,
                profilePicUrl: influencer.profilePicUrl,
                verified: influencer.verified,
                categories: influencer.categories || [],
                niche: influencer.niche,
                totalFollowers: analytics.totalFollowers || 0,
                avgEngagementRate: analytics.avgEngagementRate || 0,
                audienceDemographics: analytics.audienceDemographics || {
                    gender: 'Mixed',
                    ageRange: 'N/A'
                },
                performanceMetrics: analytics.performanceMetrics || {
                    reach: 0,
                    impressions: 0,
                    engagement: 0,
                    conversionRate: 0
                }
            };
        });

        res.render('brand/explore', { influencers: enrichedInfluencers });
    } catch (error) {
        console.error('Error fetching influencers:', error);
        res.status(500).render('error', {
            message: 'Failed to load influencers',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// Update the influencer profile route to handle both URL parameter and query parameter
router.get('/influencer_profile/:influencerId?', isAuthenticated, isBrand, async (req, res) => {
    try {
        // Get influencerId from either URL parameter or query parameter
        const influencerId = req.params.influencerId || req.query.id;

        if (!influencerId) {
            return res.status(400).render('error', {
                message: 'Influencer ID is required',
                error: { status: 400 }
            });
        }

        // Get influencer info from InfluencerInfo collection
        const influencer = await InfluencerInfo.findById(influencerId).lean();
        if (!influencer) {
            return res.status(404).render('error', {
                message: 'Influencer not found',
                error: { status: 404 }
            });
        }

        // Get social media data from InfluencerSocials collection
        const socials = await InfluencerSocials.findOne({ influencerId }).lean();

        // Get analytics data from InfluencerAnalytics collection
        const analytics = await InfluencerAnalytics.findOne({ influencerId }).lean();

        // Format socials data
        const formattedSocials = socials?.platforms?.map(platform => ({
            platform: platform.platform,
            name: platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1),
            icon: platform.platform.toLowerCase(),
            followers: platform.followers || 0,
            avgLikes: platform.avgLikes || 0,
            avgComments: platform.avgComments || 0,
            avgViews: platform.avgViews || 0,
            category: platform.category || 'general'
        })) || [];

        // Calculate total followers
        const totalFollowers = formattedSocials.reduce((sum, social) => sum + (social.followers || 0), 0);

        // Format best posts
        const bestPosts = influencer.bestPosts?.map(post => ({
            platform: post.platform,
            url: post.url || '',
            thumbnail: post.thumbnail || '/images/default-post.jpg',
            likes: post.likes || 0,
            comments: post.comments || 0,
            views: post.views || 0
        })) || [];

        // Combine all data
        const influencerData = {
            _id: influencer._id,
            displayName: influencer.displayName || influencer.fullName,
            fullName: influencer.fullName,
            username: influencer.username,
            profilePicUrl: influencer.profilePicUrl || '/images/default-profile.jpg',
            bannerUrl: influencer.bannerUrl || '/images/default-banner.jpg',
            bio: influencer.bio || '',
            verified: influencer.verified || false,
            categories: influencer.categories || [],
            languages: influencer.languages || [],
            niche: influencer.niche || 'Not specified',
            socials: formattedSocials,
            totalFollowers: totalFollowers,
            avgEngagementRate: analytics?.avgEngagementRate || 0,
            completedCollabs: influencer.completedCollabs || 0,
            bestPosts: bestPosts,
            rating: analytics?.rating || 0,
            audienceDemographics: analytics?.audienceDemographics || {
                gender: 'Mixed',
                ageRange: 'N/A',
                topLocations: []
            },
            performanceMetrics: analytics?.performanceMetrics || {
                reach: 0,
                impressions: 0,
                engagement: 0,
                conversionRate: 0
            }
        };

        res.render('brand/influencer_details', { influencer: influencerData });
    } catch (error) {
        console.error('Error getting influencer profile details:', error);
        res.status(500).render('error', {
            message: 'Failed to load influencer details',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// Route for the brand collab page
router.get('/collab', async (req, res) => {
    try {
        const brandId = req.session.user.id;
        console.log('brandId:' + brandId);
        // Get campaigns from CampaignInfo collection
        /*const campaigns = await CampaignInfo.find({ brand_id: brandId })
            .populate('brand_id', 'brandName logoUrl')
            .sort({ createdAt: -1 })
            .lean();*/
        const campaigns = await CampaignInfo.find({})
            .populate('brand_id', 'brandName logoUrl')
            .sort({ createdAt: -1 })
            .lean();


        // Get campaign metrics
        const campaignIds = campaigns.map(campaign => campaign._id);
        const metrics = await CampaignMetrics.find({ campaign_id: { $in: campaignIds } })
            .lean();

        // Create a map of metrics for quick lookup
        const metricsMap = metrics.reduce((acc, metric) => {
            acc[metric.campaign_id.toString()] = metric;
            return acc;
        }, {});

        // Transform the data to match the view's requirements
        const collabs = campaigns.map(campaign => ({
            id: campaign._id,
            title: campaign.title || 'Untitled Campaign',
            brand_name: campaign.brand_id?.brandName || 'Unknown Brand',
            influence_regions: campaign.target_audience,
            budget: parseFloat(campaign.budget) || 0,
            commission: '10%',
            offer_sentence: campaign.description,
            channels: Array.isArray(campaign.required_channels) ? campaign.required_channels.join(', ') : '',
            min_followers: campaign.min_followers?.toLocaleString() || '0',
            age_group: campaign.target_audience?.split(',')[0] || 'All Ages',
            genders: campaign.target_audience?.split(',')[1] || 'All Genders',
            duration: campaign.duration || 0,
            required_channels: Array.isArray(campaign.required_channels) ? campaign.required_channels : [],
            created_at: campaign.createdAt || new Date(),
            status: campaign.status || 'active',
            // Add performance metrics
            engagement_rate: metricsMap[campaign._id.toString()]?.engagement_rate || 0,
            reach: metricsMap[campaign._id.toString()]?.reach || 0,
            conversion_rate: metricsMap[campaign._id.toString()]?.conversion_rate || 0,
            objectives: campaign.objectives || 'Not specified'
        }));

        res.render('brand/collaborations', {
            collabs,
            influencers: [] // Placeholder for influencer cards
        });
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        res.status(500).render('error', {
            message: 'Error loading campaigns',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

router.get('/profile', brandController.getBrandProfile);

// Get received requests page
router.get('/recievedRequests', isAuthenticated, isBrand, async (req, res) => {
    try {
        // Get brand ID from session
        const brandId = req.session.user.id;

        // Find campaigns posted by this brand with status 'request'
        const campaigns = await CampaignInfo.find({
            brand_id: brandId,
            status: 'influencer-request'
        }).lean();

        // Get campaign IDs
        const campaignIds = campaigns.map(campaign => campaign._id);

        // Find corresponding entries in CampaignInfluencers
        const campaignInfluencers = await CampaignInfluencers.find({
            campaign_id: { $in: campaignIds },
            status: 'influencer-request'
        })
            .populate('influencer_id', 'name username profile_pic location categories')
            .lean();

        // Transform the data to match the view requirements
        const requests = await Promise.all(campaignInfluencers.map(async ci => {
            const campaign = campaigns.find(c => c._id.toString() === ci.campaign_id.toString());
            const influencer = ci.influencer_id || {};

            // Get additional influencer details
            const [influencerSocials, influencerAnalytics] = await Promise.all([
                InfluencerSocials.findOne({ influencerId: influencer._id }).lean(),
                InfluencerAnalytics.findOne({ influencerId: influencer._id }).lean()
            ]);

            // Format channels data
            let formattedChannels = [];
            if (influencerSocials?.platforms) {
                formattedChannels = influencerSocials.platforms.map(p => p.platform);
            }

            // Format required channels data
            let formattedRequiredChannels = [];
            if (campaign.required_channels) {
                if (Array.isArray(campaign.required_channels)) {
                    formattedRequiredChannels = campaign.required_channels;
                } else if (typeof campaign.required_channels === 'string') {
                    formattedRequiredChannels = campaign.required_channels.split(',').map(channel => channel.trim());
                }
            }

            // Calculate total followers and average engagement rate
            const totalFollowers = influencerSocials?.platforms?.reduce((sum, p) => sum + (p.followers || 0), 0) || 0;
            const avgEngagementRate = influencerSocials?.platforms?.reduce((sum, p) => sum + (p.engagementRate || 0), 0) /
                (influencerSocials?.platforms?.length || 1) || 0;

            return {
                _cid: ci._id,
                _iid: influencer._id,
                collab_title: campaign.title,
                collab_description: campaign.description,
                duration: campaign.duration,
                budget: campaign.budget,
                target_audience: campaign.target_audience,
                required_channels: formattedRequiredChannels,
                min_followers: campaign.min_followers,
                influencer_name: influencer.name || 'Unknown',
                influencer_username: influencer.username || 'unknown',
                influencer_profile_pic: influencer.profile_pic || '/images/default-avatar.jpg',
                influencer_location: influencer.location || 'Not specified',
                influencer_categories: influencer.categories || [],
                influencer_channels: formattedChannels,
                followers: totalFollowers,
                engagement_rate: avgEngagementRate,
                social_handles: influencerSocials?.platforms?.map(p => ({
                    platform: p.platform,
                    handle: p.handle,
                    followers: p.followers,
                    engagement_rate: p.engagementRate
                })) || [],
                analytics: {
                    total_followers: influencerAnalytics?.totalFollowers || 0,
                    avg_engagement_rate: influencerAnalytics?.avgEngagementRate || 0,
                    rating: influencerAnalytics?.rating || 0,
                    audience_demographics: influencerAnalytics?.audienceDemographics || {}
                }
            };
        }));

        res.render('brand/received_requests', { requests });
    } catch (error) {
        console.error('Error fetching received requests:', error);
        res.status(500).render('error', {
            message: 'Failed to fetch received requests',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

router.get('/create_collab', (req, res) => {
    // Render the existing Create_collab.ejs view as requested by the user
    res.render('brand/create_collab');
});

// Route to render the Create Offer page
router.get('/create_offer', (req, res) => {
    res.render('brand/create_offer');
});

// Route to handle form submission for creating an offer
router.post('/create_offer', async (req, res) => {
    try {
        const brandId = req.session.user.id;
        const {
            description,
            start_date,
            end_date,
            eligibility,
            offer_percentage,
            offer_details
        } = req.body;

        // Validate required fields
        const requiredFields = ['description', 'start_date', 'end_date', 'eligibility', 'offer_percentage', 'offer_details'];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                fields: missingFields
            });
        }

        // Create new offer
        const newOffer = new Offer({
            brand_id: new mongoose.Types.ObjectId(brandId),
            description: description.trim(),
            start_date: new Date(start_date),
            end_date: new Date(end_date),
            eligibility: eligibility.trim(),
            offer_percentage: parseFloat(offer_percentage),
            offer_details: offer_details.trim(),
            status: 'active',
            created_at: new Date(),
            updated_at: new Date()
        });

        await newOffer.save();

        // Set success message in session
        req.session.successMessage = 'Offer created successfully.';

        res.redirect('/brand/home');
    } catch (error) {
        console.error('Error creating offer:', error);
        res.status(500).render('brand/create_offer', {
            error: 'Failed to create offer. Please try again.',
            formData: req.body
        });
    }
});

// Route for the B2_transaction with requestId
router.get('/:requestId1/:requestId2/transaction', async (req, res) => {
    try {
        const brandId = req.session.user.id;
        const { requestId1, requestId2 } = req.params;

        // Convert string IDs to MongoDB ObjectIds
        const campaignId = new mongoose.Types.ObjectId(requestId1);
        const influencerId = new mongoose.Types.ObjectId(requestId2);

        console.log('Searching for request with:', {
            campaignId: campaignId.toString(),
            influencerId: influencerId.toString()
        });

        // Find the campaign influencer request with populated campaign and influencer details
        const request = await CampaignInfluencers.findOne({
            _id: campaignId,
            influencer_id: influencerId
        })
            .populate({
                path: 'campaign_id',
                select: 'title description budget duration target_audience required_channels min_followers objectives start_date end_date status'
            })
            .populate('influencer_id', 'name username profile_pic')
            .lean();

        // Log the query result
        console.log('Query result:', request ? 'Found' : 'Not found');
        if (!request) {
            // Check if campaign exists
            const campaign = await CampaignInfo.findById(campaignId);
            console.log('Campaign exists:', campaign ? 'Yes' : 'No');

            // Check if influencer exists
            const influencer = await InfluencerInfo.findById(influencerId);
            console.log('Influencer exists:', influencer ? 'Yes' : 'No');

            // Check for any CampaignInfluencers entries
            const allRequests = await CampaignInfluencers.find({
                $or: [
                    { _id: campaignId },
                    { influencer_id: influencerId }
                ]
            }).lean();
            console.log('Found related requests:', allRequests.length);
            if (allRequests.length > 0) {
                console.log('Sample request:', {
                    _id: allRequests[0]._id.toString(),
                    influencer_id: allRequests[0].influencer_id.toString(),
                    status: allRequests[0].status
                });
            }

            return res.status(404).send('Request not found');
        }

        // Get influencer social details
        const influencerSocials = await InfluencerSocials.findOne({
            influencerId: influencerId
        }).lean();

        // Get influencer info for verified status
        const influencerInfo = await InfluencerInfo.findById(influencerId)
            .select('verified')
            .lean();

        // Get primary social handle (first platform)
        const primarySocial = influencerSocials?.platforms?.[0] || {};

        // Format campaign dates
        const startDate = new Date(request.campaign_id.start_date).toLocaleDateString();
        const endDate = new Date(request.campaign_id.end_date).toLocaleDateString();

        // Format required channels
        let formattedRequiredChannels = [];
        if (request.campaign_id.required_channels) {
            if (Array.isArray(request.campaign_id.required_channels)) {
                formattedRequiredChannels = request.campaign_id.required_channels;
            } else if (typeof request.campaign_id.required_channels === 'string') {
                formattedRequiredChannels = request.campaign_id.required_channels.split(',').map(channel => channel.trim());
            }
        }

        // Prepare data for the view
        const viewData = {
            // Campaign details
            campaignTitle: request.campaign_id.title,
            campaignDescription: request.campaign_id.description,
            campaignDuration: `${request.campaign_id.duration} days`,
            campaignBudget: `$${request.campaign_id.budget}`,
            campaignTargetAudience: request.campaign_id.target_audience,
            campaignRequiredChannels: formattedRequiredChannels,
            campaignMinFollowers: request.campaign_id.min_followers,
            campaignObjectives: request.campaign_id.objectives,
            campaignStartDate: startDate,
            campaignEndDate: endDate,
            campaignStatus: request.campaign_id.status,

            // Influencer details
            influencerImage: request.influencer_id.profile_pic || '/images/default-avatar.jpg',
            influencerName: request.influencer_id.name,
            influencerUsername: request.influencer_id.username,
            socialHandle: primarySocial.handle || 'Not available',
            socialPlatform: primarySocial.platform || 'Not specified',
            isVerified: influencerInfo?.verified || false,

            // Payment details
            requestId1: requestId1,
            requestId2: requestId2,
            paymentDue: `$${request.campaign_id.budget}`,

            // Additional campaign metrics if available
            metrics: request.campaign_metrics || {
                performance_score: 0,
                engagement_rate: 0,
                reach: 0,
                conversion_rate: 0
            }
        };

        res.render('brand/transaction', viewData);
    } catch (error) {
        console.error('Error fetching transaction data:', error);
        res.status(500).render('error', {
            message: 'Failed to load transaction page',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// POST route to handle payment submission
router.post('/:requestId1/:requestId2/transaction', async (req, res) => {
    try {
        const brandId = req.session.user.id;
        const { requestId1, requestId2 } = req.params;
        const {
            amount,
            paymentMethod,
            cardNumber,
            expiryDate,
            cvv,
            cardHolder,
            accountNumber,
            routingNumber,
            bankName
        } = req.body;

        // Validate required fields
        if (!amount || !paymentMethod) {
            return res.status(400).send('Amount and payment method are required');
        }

        // Convert string IDs to MongoDB ObjectIds
        const campaignId = new mongoose.Types.ObjectId(requestId1);
        const influencerId = new mongoose.Types.ObjectId(requestId2);

        // Fetch the request to get campaign and influencer IDs
        const request = await CampaignInfluencers.findOne({
            _id: campaignId,
            influencer_id: influencerId
        });

        if (!request) {
            console.error('Request not found for:', { campaignId, influencerId });
            return res.status(404).send('Request not found');
        }

        // Save payment details
        const payment = new CampaignPayments({
            campaign_id: campaignId,
            brand_id: new mongoose.Types.ObjectId(brandId),
            influencer_id: influencerId,
            amount: parseFloat(amount),
            status: 'completed',
            payment_date: new Date(),
            payment_method: paymentMethod === 'creditCard' ? 'credit_card' : 'bank_transfer'
        });

        await payment.save();

        // Update CampaignInfluencers status to 'active'
        await CampaignInfluencers.updateOne(
            {
                _id: campaignId,
                influencer_id: influencerId
            },
            {
                $set: { status: 'active' }
            }
        );

        // Set success message in session
        req.session.successMessage = 'Payment completed successfully!';

        // Redirect to received requests page
        res.redirect(`/brand/home`);
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Brand profile routes
// Update brand profile
router.post('/profile/update', async (req, res) => {
    try {
        const brandId = req.session.user.id;
        const data = req.body;

        // Validate required fields
        const requiredFields = ['name', 'username'];
        const missingFields = requiredFields.filter(field => !data[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                fields: missingFields
            });
        }

        // Prepare update data
        const updateData = {
            name: data.name.trim(),
            username: data.username.trim(),
            bio: data.description?.trim() || '',
            location: data.primaryMarket?.trim() || '',
            website: data.website?.trim() || '',
            targetGender: data.targetGender?.trim() || '',
            targetAgeRange: data.targetAgeRange?.trim() || '',
            categories: data.values || [],
            mission: data.mission?.trim() || '',
            currentCampaign: data.currentCampaign?.trim() || ''
        };

        // Update social links if provided
        if (data.socialLinks && Array.isArray(data.socialLinks)) {
            try {
                // Update or create social links document
                await BrandSocials.findOneAndUpdate(
                    { brandId },
                    {
                        $set: {
                            brandId,
                            platforms: data.socialLinks.map(link => ({
                                platform: link.platform,
                                url: link.url.trim(),
                                followers: parseInt(link.followers) || 0
                            })),
                            updatedAt: new Date()
                        }
                    },
                    { upsert: true, new: true }
                );
            } catch (error) {
                console.error('Error updating social links:', error);
                // Continue with profile update even if social links update fails
            }
        }

        // Update the brand profile
        const updatedBrand = await BrandInfo.findByIdAndUpdate(
            brandId,
            { $set: updateData },
            { new: true }
        );

        if (!updatedBrand) {
            return res.status(404).json({
                success: false,
                message: 'Brand not found'
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            brand: updatedBrand
        });
    } catch (error) {
        console.error('Error updating brand profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
});

// Update brand profile images
router.post('/profile/update-images', upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
]), async (req, res) => {
    try {
        const brandId = req.session.user.id;
        const updateData = {};

        // Handle logo upload
        if (req.files && req.files['logo']) {
            const logoFile = req.files['logo'][0];
            try {
                const logoUrl = await uploadToCloudinary(logoFile, 'brand-logos');
                if (logoUrl) {
                    updateData.logoUrl = logoUrl;
                }
            } catch (error) {
                console.error('Error uploading logo:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error uploading logo: ' + error.message
                });
            }
        }

        // Handle banner upload
        if (req.files && req.files['banner']) {
            const bannerFile = req.files['banner'][0];
            try {
                const bannerUrl = await uploadToCloudinary(bannerFile, 'brand-banners');
                if (bannerUrl) {
                    updateData.bannerUrl = bannerUrl;
                }
            } catch (error) {
                console.error('Error uploading banner:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error uploading banner: ' + error.message
                });
            }
        }

        // Only update if we have new URLs
        if (Object.keys(updateData).length > 0) {
            try {
                // Update brand in database
                const updatedBrand = await BrandInfo.findByIdAndUpdate(
                    brandId,
                    { $set: updateData },
                    { new: true, runValidators: true }
                );

                if (!updatedBrand) {
                    return res.status(404).json({
                        success: false,
                        message: 'Brand not found'
                    });
                }

                res.json({
                    success: true,
                    message: 'Images updated successfully',
                    brand: updatedBrand
                });
            } catch (error) {
                console.error('Error updating brand images:', error);
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

// Route to handle campaign creation
router.post('/campaigns/create', async (req, res) => {
    try {
        const brandId = req.session.user.id;
        const {
            title,
            description,
            start_date,
            end_date,
            duration,
            budget,
            target_audience,
            required_channels,
            min_followers,
            objectives
        } = req.body;

        // Create new campaign info
        const campaignInfo = new CampaignInfo({
            brand_id: new mongoose.Types.ObjectId(brandId),
            title,
            description,
            status: 'request',
            start_date: new Date(start_date),
            end_date: new Date(end_date),
            duration: parseInt(duration),
            budget: parseFloat(budget),
            target_audience,
            required_channels: Array.isArray(required_channels) ? required_channels : [required_channels],
            min_followers: parseInt(min_followers),
            objectives
        });

        // Save campaign info
        const savedCampaign = await campaignInfo.save();

        // Create campaign metrics with default values
        const campaignMetrics = new CampaignMetrics({
            campaign_id: new mongoose.Types.ObjectId(savedCampaign._id),
            brand_id: new mongoose.Types.ObjectId(brandId),
            performance_score: 0,
            engagement_rate: 0,
            reach: 0,
            conversion_rate: 0,
            clicks: 0,
            impressions: 0,
            revenue: 0,
            roi: 0
        });

        // Save campaign metrics
        await campaignMetrics.save();

        // Set success message in session
        req.session.successMessage = 'Campaign successfully created.';

        // Redirect to home page
        res.redirect('/brand/home');
    } catch (error) {
        console.error('Error creating campaign:', error);
        res.status(500).render('brand/create_collab', {
            error: 'Failed to create campaign. Please try again.',
            formData: req.body
        });
    }
});

// Add this route after the campaigns/create route
router.post('/campaigns/:campaignId/activate', async (req, res) => {
    try {
        const { campaignId } = req.params;
        const brandId = req.session.user.id;

        // Find the campaign and verify ownership
        const campaign = await CampaignInfo.findOne({
            _id: new mongoose.Types.ObjectId(campaignId),
            brand_id: new mongoose.Types.ObjectId(brandId)
        });

        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        // Update campaign status to active
        campaign.status = 'active';
        await campaign.save();

        // Set success message in session
        req.session.successMessage = 'Campaign activated successfully.';

        res.json({ success: true });
    } catch (error) {
        console.error('Error activating campaign:', error);
        res.status(500).json({ error: 'Failed to activate campaign' });
    }
});

// Add this route after the campaign activation route
router.get('/campaigns/:campaignId/details', async (req, res) => {
    try {
        const { campaignId } = req.params;
        const brandId = req.session.user.id;

        console.log('Fetching campaign details for:', { campaignId, brandId });

        // Find the campaign and verify ownership
        const campaign = await CampaignInfo.findOne({
            _id: new mongoose.Types.ObjectId(campaignId),
            brand_id: new mongoose.Types.ObjectId(brandId)
        }).lean();

        if (!campaign) {
            console.log('Campaign not found');
            return res.status(404).json({ error: 'Campaign not found' });
        }

        console.log('Found campaign:', campaign);

        // Get accepted influencers for this campaign
        const acceptedInfluencers = await CampaignInfluencers.find({
            campaign_id: new mongoose.Types.ObjectId(campaignId),
            status: 'active'
        }).populate('influencer_id', 'fullName profilePicUrl followers engagement_rate').lean();

        console.log('Found accepted influencers:', acceptedInfluencers.length);

        // Transform the data for the response
        const campaignDetails = {
            _id: campaign._id,
            title: campaign.title,
            description: campaign.description,
            status: campaign.status,
            start_date: campaign.start_date,
            end_date: campaign.end_date,
            duration: campaign.duration,
            budget: campaign.budget,
            target_audience: campaign.target_audience,
            required_channels: campaign.required_channels || [],
            min_followers: campaign.min_followers,
            objectives: campaign.objectives,
            accepted_influencers: acceptedInfluencers.length,
            influencers: acceptedInfluencers.map(ci => ({
                name: ci.influencer_id?.fullName || 'Unknown',
                profilePicUrl: ci.influencer_id?.profilePicUrl || '/images/default-avatar.jpg',
                followers: ci.influencer_id?.followers || 0,
                engagement_rate: ci.influencer_id?.engagement_rate || 0
            }))
        };

        console.log('Sending campaign details:', campaignDetails);
        res.json(campaignDetails);
    } catch (error) {
        console.error('Error fetching campaign details:', error);
        res.status(500).json({
            error: 'Failed to fetch campaign details',
            details: error.message
        });
    }
});

// Route to decline a campaign request
router.post('/requests/:requestId1/:requestId2/decline', async (req, res) => {
    try {
        const { requestId1, requestId2 } = req.params;
        const brandId = req.session.user.id;

        // Convert string IDs to MongoDB ObjectIds
        const campaignId = new mongoose.Types.ObjectId(requestId1);
        const influencerId = new mongoose.Types.ObjectId(requestId2);

        // Find and update the campaign influencer request
        const request = await CampaignInfluencers.findOneAndUpdate(
            {
                _id: campaignId,
                influencer_id: influencerId
            },
            {
                $set: { status: 'cancelled' }
            },
            { new: true }
        );

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found or you do not have permission to decline it'
            });
        }

        // Set success message in session
        req.session.successMessage = 'Campaign request has been declined successfully.';

        // Return JSON response
        res.json({
            success: true,
            message: 'Request declined successfully'
        });
    } catch (error) {
        console.error('Error declining request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to decline request'
        });
    }
});

// Delete brand account
router.post('/profile/delete', isAuthenticated, async (req, res) => {
    try {
        const brandId = req.session.user.id;

        // Delete brand info
        await BrandInfo.findByIdAndDelete(brandId);

        // Delete brand analytics
        await BrandAnalytics.deleteMany({ brandId });

        // Delete brand socials
        await BrandSocials.deleteMany({ brandId });

        // Get all campaigns for this brand
        const campaigns = await CampaignInfo.find({ brand_id: brandId });

        // Delete campaign metrics and influencers for each campaign
        for (const campaign of campaigns) {
            await CampaignMetrics.deleteMany({ campaign_id: campaign._id });
            await CampaignInfluencers.deleteMany({ campaign_id: campaign._id });
        }

        // Delete all campaigns
        await CampaignInfo.deleteMany({ brand_id: brandId });

        // Clear the session
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
            }
            res.json({ success: true, message: 'Account deleted successfully' });
        });

    } catch (error) {
        console.error('Error deleting brand account:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while deleting your account'
        });
    }
});

router.use('/signout', (req, res) => {
    res.clearCookie('token', { httpOnly: true, path: '/' });
    res.set('Cache-Control', 'no-store');
    res.redirect('/');
});

// Get campaign history page
router.get('/campaigns/history', isAuthenticated, isBrand, brandController.getCampaignHistory);
router.get('/influencer_details/:influencerId', isAuthenticated, isBrand, async (req, res) => {
    try {
        const { influencerId } = req.params;
        const influencer = await InfluencerInfo.findById(influencerId).lean();

        if (!influencer) {
            return res.status(404).render('error', {
                message: 'Influencer not found',
                error: {}
            });
        }

        const socials = await InfluencerSocials.find({ influencerId }).lean();

        // Format socials data similar to previous structure
        const formattedSocials = socials.flatMap(social =>
            social.platforms.map(platform => ({
                platform: platform.platform,
                name: platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1),
                icon: platform.platform.toLowerCase(),
                followers: platform.followers,
                avgLikes: platform.avgLikes,
                avgComments: platform.avgComments,
                avgViews: platform.avgViews,
                category: platform.category
            }))
        );

        // Calculate total followers from all social platforms
        const totalFollowers = formattedSocials.reduce((sum, social) => sum + (social.followers || 0), 0);

        // Best posts are part of influencerInfo bestPosts field
        const bestPosts = influencer.bestPosts || [];

        const influencerData = {
            ...influencer,
            displayName: influencer.displayName || influencer.fullName,
            profilePicUrl: influencer.profilePicUrl,
            bannerUrl: influencer.bannerUrl,
            audienceGender: influencer.audienceGender,
            audienceAgeRange: influencer.audienceAgeRange,
            categories: influencer.categories || [],
            languages: influencer.languages || [],
            socials: formattedSocials,
            totalFollowers: totalFollowers,
            bestPosts: bestPosts.map(post => ({
                platform: post.platform,
                url: post.url || '',
                thumbnail: post.thumbnail,
                likes: post.likes,
                comments: post.comments,
                date: post.date
            })),
            createdAt: influencer.createdAt
        };

        res.render('brand/influencer_details', { influencer: influencerData });
    } catch (error) {
        console.error('Error getting influencer profile details:', error);
        res.status(500).render('error', {
            message: 'Failed to load influencer details',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

module.exports = router;