const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const CampaignContentController = require('../controllers/campaignContentController');
const { upload } = require('../utils/imageUpload');
const multer = require('multer');
const { uploadToCloudinary, uploadBufferToCloudinary } = require('../utils/cloudinary');
const { isAuthenticated, isBrand } = require('./authRoutes');
const { CampaignPayments, CampaignInfluencers, CampaignInfo, CampaignMetrics } = require('../config/CampaignMongo');
const { InfluencerInfo, InfluencerSocials, InfluencerAnalytics } = require('../config/InfluencerMongo');
const mongoose = require('mongoose');
const { BrandInfo, BrandAnalytics, BrandSocials } = require('../config/BrandMongo');
const { Message } = require('../config/MessageMongo');
const { Product } = require('../config/ProductMongo');

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
router.get('/explore', async (req, res) => {
    try {
        // Get query parameters for filtering
        const { category, search } = req.query;
        const searchQuery = search || '';
        const selectedCategory = category || 'all';

        // Build filter query
        let filterQuery = {};
        if (selectedCategory && selectedCategory !== 'all') {
            filterQuery.categories = { $regex: selectedCategory, $options: 'i' };
        }
        if (searchQuery) {
            filterQuery.$or = [
                { fullName: { $regex: searchQuery, $options: 'i' } },
                { displayName: { $regex: searchQuery, $options: 'i' } },
                { categories: { $regex: searchQuery, $options: 'i' } }
            ];
        }

        // Get all influencers with their basic info
        const influencers = await InfluencerInfo.find(filterQuery)
            .select('fullName profilePicUrl verified categories displayName')
            .lean();

        // Get all unique categories for the filter dropdown
        const allInfluencers = await InfluencerInfo.find({}).select('categories').lean();
        const categoriesSet = new Set();
        allInfluencers.forEach(inf => {
            if (inf.categories) {
                // Handle both array and string formats
                if (Array.isArray(inf.categories)) {
                    // If it's an array, add each category
                    inf.categories.forEach(cat => {
                        if (cat && typeof cat === 'string') {
                            categoriesSet.add(cat.trim());
                        }
                    });
                } else if (typeof inf.categories === 'string') {
                    // If it's a comma-separated string, split and add each one
                    const cats = inf.categories.split(',').map(c => c.trim()).filter(Boolean);
                    cats.forEach(cat => categoriesSet.add(cat));
                }
            }
        });
        const categories = Array.from(categoriesSet).sort();
        
        console.log('=== CATEGORIES DEBUG ===');
        console.log('Total influencers found:', allInfluencers.length);
        console.log('Sample influencer categories:', allInfluencers.slice(0, 3).map(i => ({ id: i._id, categories: i.categories })));
        console.log('Extracted categories:', categories);
        console.log('========================');

        // Get analytics data for filtered influencers
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

        res.render('brand/explore', { 
            influencers: enrichedInfluencers,
            searchQuery,
            selectedCategory,
            categories
        });
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

        // Get campaigns with status 'request' from CampaignInfo (brand posted campaigns)
        const allRequests = await CampaignInfo.find({ status: 'request' })
            .populate('brand_id', 'brandName logoUrl')
            .sort({ createdAt: -1 })
            .lean();

        // Get campaigns where influencers have entries with 'influencer-invite' status
        const existingInvites = await CampaignInfluencers.find({
            status: { $in: ['influencer-invite'] }
        }).select('campaign_id').lean();

        // Extract campaign IDs that this influencer is already invited to or has invited
        const excludedCampaignIds = existingInvites.map(invite => invite.campaign_id.toString());

        // Filter out campaigns where influencer already has invites
        const requests = allRequests.filter(request =>
            !excludedCampaignIds.includes(request._id.toString())
        );

        // Get campaign metrics
        const campaignIds = requests.map(campaign => campaign._id);
        const metrics = await CampaignMetrics.find({ campaign_id: { $in: campaignIds } })
            .lean();

        // Create a map of metrics for quick lookup
        const metricsMap = metrics.reduce((acc, metric) => {
            acc[metric.campaign_id.toString()] = metric;
            return acc;
        }, {});

        // Transform the data to match the view's requirements
        const collabs = requests.map(campaign => ({
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
        console.log('Fetching received requests for brand:', brandId);

        // Find all campaigns posted by this brand (any status)
        const campaigns = await CampaignInfo.find({
            brand_id: brandId
        }).lean();
        console.log('Found campaigns:', campaigns.length);

        const campaignIds = campaigns.map(campaign => campaign._id);
        console.log('Campaign IDs:', campaignIds);

        // Fetch influencer-sent invites (new collab proposals to this brand)
        console.log('Fetching influencer invites...');
        const influencerInvites = await CampaignInfluencers.find({
            campaign_id: { $in: campaignIds },
            status: 'influencer-invite'
        })
            .populate('influencer_id', 'fullName displayName username profilePicUrl location categories')
            .populate('campaign_id', 'title description duration budget target_audience required_channels min_followers')
            .lean();
        console.log('Found influencer invites:', influencerInvites.length);

        // Fetch brand campaign requests (multi-influencer campaigns accepting applications)
        const requestCampaignIds = campaigns
            .filter(c => c.status === 'request')
            .map(c => c._id);
        console.log('Request campaign IDs:', requestCampaignIds.length);

        console.log('Fetching campaign requests...');
        const campaignRequests = await CampaignInfluencers.find({
            campaign_id: { $in: requestCampaignIds },
            status: 'request'
        })
            .populate('influencer_id', 'fullName displayName username profilePicUrl location categories')
            .populate('campaign_id', 'title description duration budget target_audience required_channels min_followers')
            .lean();
        console.log('Found campaign requests:', campaignRequests.length);

        // Helper to format one invite entry
        const formatInvite = async (ci, tag) => {
            const campaign = ci.campaign_id || {};
            const influencer = ci.influencer_id || {};

            const [influencerSocials, influencerAnalytics] = await Promise.all([
                InfluencerSocials.findOne({ influencerId: influencer._id }).lean(),
                InfluencerAnalytics.findOne({ influencerId: influencer._id }).lean()
            ]);

            // Format channels data (influencer platforms)
            let formattedChannels = [];
            if (influencerSocials?.platforms) {
                formattedChannels = influencerSocials.platforms.map(p => p.platform);
            }

            // Format required channels data (campaign requirements)
            let formattedRequiredChannels = [];
            if (campaign.required_channels) {
                if (Array.isArray(campaign.required_channels)) {
                    formattedRequiredChannels = campaign.required_channels;
                } else if (typeof campaign.required_channels === 'string') {
                    formattedRequiredChannels = campaign.required_channels.split(',').map(channel => channel.trim());
                }
            }

            const totalFollowers = influencerSocials?.platforms?.reduce((sum, p) => sum + (p.followers || 0), 0) || 0;
            const avgEngagementRate = influencerSocials?.platforms?.reduce((sum, p) => sum + (p.engagementRate || 0), 0) / (influencerSocials?.platforms?.length || 1) || 0;

            // Fetch latest message from this influencer regarding this campaign
            let latestMessage = null;
            try {
                const msgDoc = await Message.findOne({
                    brand_id: new mongoose.Types.ObjectId(brandId),
                    influencer_id: new mongoose.Types.ObjectId(influencer._id),
                    campaign_id: new mongoose.Types.ObjectId(campaign._id)
                }).sort({ createdAt: -1 }).lean();
                latestMessage = msgDoc?.message || null;
            } catch (e) {
                latestMessage = null;
            }

            // Fetch campaign products
            let campaignProducts = [];
            try {
                const products = await Product.find({
                    campaign_id: new mongoose.Types.ObjectId(campaign._id),
                    status: 'active'
                }).lean();

                campaignProducts = products.map(product => ({
                    id: product._id,
                    name: product.name,
                    category: product.category,
                    original_price: product.original_price,
                    campaign_price: product.campaign_price,
                    discount_percentage: product.discount_percentage,
                    description: product.description,
                    image_url: product.images && product.images.length > 0
                        ? (product.images.find(img => img.is_primary) || product.images[0]).url
                        : null,
                    special_instructions: product.special_instructions
                }));
            } catch (e) {
                console.error('Error fetching campaign products:', e);
                campaignProducts = [];
            }

            return {
                tag, // 'influencer invite' | 'request'
                _cid: ci._id,
                _iid: influencer._id,
                collab: {
                    title: campaign.title,
                    description: campaign.description,
                    duration: campaign.duration,
                    budget: campaign.budget,
                    target_audience: campaign.target_audience,
                    required_channels: formattedRequiredChannels,
                    min_followers: campaign.min_followers,
                    products: campaignProducts
                },
                influencer: {
                    id: influencer._id,
                    name: influencer.displayName || influencer.fullName || 'Unknown',
                    username: influencer.username || 'unknown',
                    profile_pic: influencer.profilePicUrl || '/images/default-avatar.jpg',
                    location: influencer.location || 'Not specified',
                    categories: influencer.categories || [],
                    channels: formattedChannels,
                    followers: totalFollowers,
                    engagement_rate: avgEngagementRate,
                    socials: influencerSocials?.platforms?.map(p => ({
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
                }
            };
        };

        // Build requests list with tags
        const [formattedInfluencerInvites, formattedCampaignRequests] = await Promise.all([
            Promise.all(influencerInvites.map(ci => formatInvite(ci, 'influencer invite'))),
            Promise.all(campaignRequests.map(ci => formatInvite(ci, 'request')))
        ]);

        const requests = [...formattedInfluencerInvites, ...formattedCampaignRequests];

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
            .populate('influencer_id', 'fullName displayName username profilePicUrl')
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

        // Calculate remaining budget: budget - sum(completed payments for this campaign)
        let remainingBudget = 0;
        const paymentsAgg = await CampaignPayments.aggregate([
                { $match: { campaign_id: request.campaign_id._id, status: 'completed' } },
                { $group: { _id: '$campaign_id', total: { $sum: '$amount' } } }
            ]);
            const totalPaid = paymentsAgg?.[0]?.total || 0;
            remainingBudget = request.campaign_id.budget - totalPaid;
            console.log(remainingBudget);

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

        // Fetch campaign products
        let campaignProducts = [];
        try {
            const products = await Product.find({
                campaign_id: new mongoose.Types.ObjectId(request.campaign_id._id),
                status: 'active'
            }).lean();

            campaignProducts = products.map(product => ({
                id: product._id,
                name: product.name,
                category: product.category,
                original_price: product.original_price,
                campaign_price: product.campaign_price,
                discount_percentage: product.discount_percentage,
                description: product.description,
                image_url: product.images && product.images.length > 0
                    ? (product.images.find(img => img.is_primary) || product.images[0]).url
                    : null,
                special_instructions: product.special_instructions
            }));
        } catch (e) {
            console.error('Error fetching campaign products:', e);
            campaignProducts = [];
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
            influencerImage: request.influencer_id.profilePicUrl || '/images/default-avatar.jpg',
            influencerName: request.influencer_id.displayName || request.influencer_id.fullName,
            influencerUsername: request.influencer_id.username,
            socialHandle: primarySocial.handle || 'Not available',
            socialPlatform: primarySocial.platform || 'Not specified',
            isVerified: influencerInfo?.verified || false,

            // Payment details
            requestId1: requestId1,
            requestId2: requestId2,
            paymentDue: `$${request.campaign_id.budget}`,
            paymentMax: remainingBudget,
            allowComplete: (request.campaign_id.status === 'influencer-invite'),

            // Additional campaign metrics if available
            metrics: request.campaign_metrics || {
                performance_score: 0,
                engagement_rate: 0,
                reach: 0,
                conversion_rate: 0
            },

            // Campaign products
            campaignProducts: campaignProducts
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
router.post('/:requestId1/:requestId2/transaction', upload.single('productImage'), async (req, res) => {
    try {
        const brandId = req.session.user.id;
        const { requestId1, requestId2 } = req.params;
        const {
            objectives,
            startDate,
            endDate,
            targetAudience,
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

        console.log('req.body', req.body);

        // Validate required fields (always required)
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

        // Ensure campaign is in influencer-invite status before allowing completion
        const campaignDoc = await CampaignInfo.findById(request.campaign_id).select('status brand_id');
        if (!campaignDoc) {
            return res.status(404).send('Campaign not found');
        }

        const isCompleting = (campaignDoc.status === 'influencer-invite');

        if (isCompleting) {
            // Validate campaign completion fields
            if (!objectives || !startDate || !endDate || !targetAudience) {
                return res.status(400).send('Campaign completion fields are required');
            }

            // Validate dates
            const start = new Date(startDate);
            const end = new Date(endDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (start < today) {
                return res.status(400).send('Start date cannot be in the past');
            }

            if (end <= start) {
                return res.status(400).send('End date must be after start date');
            }

            const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
            if (duration > 365) {
                return res.status(400).send('Campaign duration cannot exceed 365 days');
            }

            // Update the campaign with the completed details
            await CampaignInfo.updateOne(
                { _id: request.campaign_id },
                {
                    $set: {
                        objectives: objectives.trim(),
                        start_date: start,
                        end_date: end,
                        duration: duration,
                        target_audience: targetAudience.trim(),
                        status: 'active' // Change status from 'influencer-invite' to 'active'
                    }
                }
            );
        }

        // If completing (influencer-invite), require minimal product and create it
        if (isCompleting) {
            const {
                prodName,
                prodDescription,
                originalPrice,
                campaignPrice,
                category,
                targetQty
            } = req.body;

            // Basic validation for product
            if (!prodName || !prodDescription || !category) {
                return res.status(400).send('All product fields are required');
            }

            if (!req.file) {
                return res.status(400).send('Product image is required');
            }

            const op = Number(originalPrice);
            const cp = Number(campaignPrice);
            const tq = Number(targetQty);
            if (!Number.isFinite(op) || op < 0 || !Number.isFinite(cp) || cp < 0 || cp > op || !Number.isFinite(tq) || tq < 0) {
                return res.status(400).send('Invalid product pricing or target quantity');
            }

            try {
                // Upload image to Cloudinary
                console.log('Uploading product image to Cloudinary...');
                const imageUrl = await uploadToCloudinary(req.file, 'products');
                console.log('Image uploaded successfully:', imageUrl);

                // Create product
                await Product.create({
                    brand_id: new mongoose.Types.ObjectId(brandId),
                    campaign_id: request.campaign_id,
                    name: prodName.trim(),
                    description: prodDescription.trim(),
                    images: [{ url: imageUrl, is_primary: true }],
                    original_price: op,
                    campaign_price: cp,
                    category: category.trim(),
                    target_quantity: tq,
                    created_by: new mongoose.Types.ObjectId(brandId),
                    status: 'active'
                });

                console.log('Product created successfully');
            } catch (uploadError) {
                console.error('Error uploading image to Cloudinary:', uploadError);
                return res.status(500).send('Error uploading product image');
            }
        }

        // Save payment details
        const payment = new CampaignPayments({
            campaign_id: request.campaign_id,  // Use the actual campaign ID from the request
            brand_id: new mongoose.Types.ObjectId(brandId),
            influencer_id: influencerId,
            amount: parseFloat(amount),
            status: 'completed',
            payment_date: new Date(),
            payment_method: paymentMethod === 'creditCard' ? 'credit_card' : 'bank_transfer'
        });

        try {
            await payment.save();
        } catch (error) {
            console.error('Error saving payment:', error);
            return res.status(500).send('Internal Server Error');
        }

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

        // Update subscription usage for influencer connection
        const { SubscriptionService } = require('../models/brandModel');
        try {
            await SubscriptionService.updateUsage(brandId, 'brand', { influencersConnected: 1 });
        } catch (usageError) {
            console.error('Error updating subscription usage:', usageError);
            // Continue even if usage update fails
        }

        // Set success message in session
        req.session.successMessage = 'Campaign completed and payment processed successfully!';

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
router.post('/campaigns/create', campaignUpload.any(), async (req, res) => {
    try {
        // Handle multer errors
        if (req.fileValidationError) {
            return res.status(400).render('brand/Create_collab', {
                error: req.fileValidationError,
                formData: req.body
            });
        }
        const brandId = req.session.user.id;
        const {
            title,
            description,
            start_date,
            end_date,
            budget,
            target_audience,
            required_channels,
            required_influencers,
            min_followers,
            objectives,
            products
        } = req.body;

        //Check if the brand is verified, if not, return an error
        const brand = await BrandInfo.findById(brandId);
        if (!brand.verified) {
            return res.status(400).render('brand/Create_collab', {
                error: 'Your account is not verified. Please wait for verification.',
                formData: req.body
            });
        }

        // Check subscription limits for campaign creation
        const { SubscriptionService } = require('../models/brandModel');
        try {
            const limitCheck = await SubscriptionService.checkSubscriptionLimit(brandId, 'brand', 'create_campaign');
            if (!limitCheck.allowed) {
                // Check if subscription is expired
                if (limitCheck.redirectToPayment) {
                    return res.status(403).render('brand/Create_collab', {
                        error: limitCheck.reason,
                        formData: req.body,
                        showRenewLink: true,
                        renewUrl: '/subscription/manage'
                    });
                }
                
                return res.status(400).render('brand/Create_collab', {
                    error: `${limitCheck.reason}. Please upgrade your plan to create more campaigns.`,
                    formData: req.body,
                    showUpgradeLink: true
                });
            }
        } catch (subscriptionError) {
            console.error('Subscription check error:', subscriptionError);
            return res.status(500).render('brand/Create_collab', {
                error: 'Unable to verify subscription. Please try again later.',
                formData: req.body
            });
        }

        // Calculate duration from start and end dates
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24) + 1); // Calculate days

        // Validate duration
        if (duration <= 0) {
            return res.status(400).render('brand/Create_collab', {
                error: 'End date must be after start date.',
                formData: req.body
            });
        }

        // Create new campaign info
        const campaignInfo = new CampaignInfo({
            brand_id: new mongoose.Types.ObjectId(brandId),
            title,
            description,
            status: 'request',
            start_date: new Date(start_date),
            end_date: new Date(end_date),
            duration: duration,
            budget: parseFloat(budget),
            target_audience,
            required_channels: Array.isArray(required_channels) ? required_channels : [required_channels],
            required_influencers: parseInt(required_influencers),
            min_followers: parseInt(min_followers),
            objectives
        });

        // Validate products if provided (purchase_url will be generated later)
        if (products && Array.isArray(products) && products.length > 0) {
            for (const product of products) {
                if (!product.name || !product.category || !product.original_price || !product.campaign_price || !product.description || !product.target_quantity) {
                    return res.status(400).render('brand/Create_collab', {
                        error: 'All product fields (name, category, original_price, campaign_price, description) are required.',
                        formData: req.body
                    });
                }

                if (parseInt(product.target_quantity) < 0) {
                    return res.status(400).render('brand/Create_collab', {
                        error: 'Target quantity must be 0 or greater.',
                        formData: req.body
                    });
                }

                if (parseFloat(product.original_price) <= 0 || parseFloat(product.campaign_price) <= 0) {
                    return res.status(400).render('brand/Create_collab', {
                        error: 'Product prices must be greater than 0.',
                        formData: req.body
                    });
                }

                if (parseFloat(product.campaign_price) >= parseFloat(product.original_price)) {
                    return res.status(400).render('brand/Create_collab', {
                        error: 'Campaign price must be less than original price.',
                        formData: req.body
                    });
                }
            }
        } else {
            return res.status(400).render('brand/Create_collab', {
                error: 'At least one product is required.',
                formData: req.body
            });
        }

        // Save campaign info
        const savedCampaign = await campaignInfo.save();

        // Create products for the campaign
        if (products && Array.isArray(products)) {
            const { Product } = require('../config/ProductMongo');

            for (let i = 0; i < products.length; i++) {
                const productData = products[i];

                // Calculate discount percentage
                const discountPercentage = productData.original_price > 0
                    ? Math.round(((productData.original_price - productData.campaign_price) / productData.original_price) * 100)
                    : 0;

                // Handle image upload for this product
                let imageUrl = '';
                if (req.files && req.files.length > 0) {
                    // Find the corresponding image file for this product
                    const productImageFile = req.files.find(file =>
                        file.fieldname === `products[${i}][image]`
                    );

                    if (productImageFile) {
                        try {
                            imageUrl = await uploadBufferToCloudinary(productImageFile, 'product-images');
                        } catch (error) {
                            console.error('Error uploading product image:', error);
                            return res.status(500).render('brand/Create_collab', {
                                error: 'Error uploading product image: ' + error.message,
                                formData: req.body
                            });
                        }
                    }
                }

                const product = new Product({
                    name: productData.name,
                    category: productData.category,
                    description: productData.description,
                    original_price: parseFloat(productData.original_price),
                    campaign_price: parseFloat(productData.campaign_price),
                    discount_percentage: discountPercentage,
                    images: [{ url: imageUrl }],
                    special_instructions: productData.special_instructions || '',
                    brand_id: new mongoose.Types.ObjectId(brandId),
                    campaign_id: savedCampaign._id,
                    created_by: new mongoose.Types.ObjectId(brandId),
                    status: 'active',
                    target_quantity: parseInt(productData.target_quantity)
                });

                await product.save();
            }
        }

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

        // Update subscription usage for campaign creation
        try {
            await SubscriptionService.updateUsage(brandId, 'brand', { campaignsUsed: 1 });
        } catch (usageError) {
            console.error('Error updating subscription usage:', usageError);
            // Continue even if usage update fails
        }

        // Set success message in session
        req.session.successMessage = 'Campaign successfully created.';

        // Redirect to home page
        res.redirect('/brand/home');
    } catch (error) {
        console.error('Error creating campaign:', error);

        // Handle multer errors specifically
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).render('brand/Create_collab', {
                error: 'File size too large. Maximum size is 5MB.',
                formData: req.body
            });
        }

        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).render('brand/Create_collab', {
                error: 'Unexpected file field. Please check your form.',
                formData: req.body
            });
        }

        res.status(500).render('brand/Create_collab', {
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

        // Guard: must have at least one accepted/active influencer
        const acceptedCount = await CampaignInfluencers.countDocuments({
            campaign_id: new mongoose.Types.ObjectId(campaignId),
            status: 'active'
        });
        if (acceptedCount === 0) {
            return res.status(400).json({ error: 'Cannot activate: no accepted influencers yet.' });
        }

        // Guard: cannot activate before start date
        const now = new Date();
        if (campaign.start_date && now < new Date(campaign.start_date)) {
            return res.status(400).json({ error: 'Cannot activate before the campaign start date.' });
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
        const brandId = req.brandId || req.session?.user?.id || req.user?.id;

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

        console.log('Returning campaign details JSON');
        res.json(campaignDetails);
    } catch (error) {
        console.error('Error fetching campaign details:', error);
        res.status(500).json({
            error: 'Failed to fetch campaign details',
            message: error.message
        });
    }
});


// Route to end a campaign (mark as completed)
router.post('/campaigns/:campaignId/end', async (req, res) => {
    try {
        const { campaignId } = req.params;
        const brandId = req.session.user.id;

        console.log('Ending campaign:', { campaignId, brandId });

        // Find the campaign and verify ownership
        const campaign = await CampaignInfo.findOne({
            _id: new mongoose.Types.ObjectId(campaignId),
            brand_id: new mongoose.Types.ObjectId(brandId),
            status: 'active'
        });

        if (!campaign) {
            console.log('Campaign not found or not active');
            return res.status(404).json({
                success: false,
                message: 'Campaign not found or already completed'
            });
        }

        // Update campaign metrics revenue to total products sold * campaign price
        const productsSold = await Product.countDocuments({ campaign_id: new mongoose.Types.ObjectId(campaignId) }) || 0;
        const campaignPrice = campaign.budget || 0;
        const revenue = productsSold * campaignPrice || 0;
        await CampaignMetrics.findOneAndUpdate(
            { campaign_id: new mongoose.Types.ObjectId(campaignId) },
            { $set: { revenue: revenue } }
        );

        // Update campaign metrics roi to revenue / budget
        const roi = revenue / (campaign.budget || 0) || 0;
        await CampaignMetrics.findOneAndUpdate(
            { campaign_id: new mongoose.Types.ObjectId(campaignId) },
            { $set: { roi: roi } }
        );

        // Update campaign status to completed
        campaign.status = 'completed';
        campaign.end_date = new Date();
        await campaign.save();

        // Increment the completed campaigns count for the brand
        await BrandInfo.findByIdAndUpdate(brandId, { $inc: { completedCampaigns: 1 } });

        const influencers = await CampaignInfluencers.find({ campaign_id: new mongoose.Types.ObjectId(campaignId) });
        for (const influencer of influencers) {
            await InfluencerInfo.findByIdAndUpdate(influencer.influencer_id, { $inc: { completedCampaigns: 1 } });
        }

        // Also update all associated campaign influencer records to completed
        await CampaignInfluencers.updateMany(
            {
                campaign_id: new mongoose.Types.ObjectId(campaignId),
                status: 'active'
            },
            {
                $set: { status: 'completed' }
            }
        );

        console.log('Campaign ended successfully:', campaignId);
        res.json({
            success: true,
            message: 'Campaign ended successfully'
        });
    } catch (error) {
        console.error('Error ending campaign:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to end campaign',
            details: error.message
        });
    }
});

// Route to get draft campaigns for inviting influencers
router.get('/campaigns/draft-list', async (req, res) => {
    try {
        const brandId = req.session.user.id;

        // Find campaigns with status 'request' (draft campaigns ready for invites)
        const draftCampaigns = await CampaignInfo.find({
            brand_id: new mongoose.Types.ObjectId(brandId),
            status: 'request'
        })
            .select('_id title budget description duration start_date end_date')
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            campaigns: draftCampaigns
        });
    } catch (error) {
        console.error('Error fetching draft campaigns:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch campaigns',
            campaigns: []
        });
    }
});

// Route to invite influencer to a campaign
router.post('/invite-influencer', async (req, res) => {
    try {
        let { influencerId, campaignId } = req.body;
        const brandId = req.session.user.id;

        //Check if the brand is verified, if not, return an error
        const brand = await BrandInfo.findById(brandId);
        if (!brand.verified) {
            return res.status(400).json({
                success: false,
                message: 'Your account is not verified. Please wait for verification.'
            });
        }

        // Trim whitespace from IDs
        influencerId = influencerId?.trim();
        campaignId = campaignId?.trim();

        console.log('Inviting influencer:', { influencerId, campaignId, brandId });

        // Validate input
        if (!influencerId || !campaignId) {
            return res.status(400).json({
                success: false,
                message: 'Influencer ID and Campaign ID are required'
            });
        }

        // Validate MongoDB ObjectId format
        if (!mongoose.Types.ObjectId.isValid(influencerId) || !mongoose.Types.ObjectId.isValid(campaignId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID format provided'
            });
        }

        // Verify the campaign belongs to this brand and has status 'request'
        const campaign = await CampaignInfo.findOne({
            _id: new mongoose.Types.ObjectId(campaignId),
            brand_id: new mongoose.Types.ObjectId(brandId),
            status: 'request'
        });

        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found or not available for invites'
            });
        }

        // Check if this influencer is already invited or part of this campaign
        const existingInvite = await CampaignInfluencers.findOne({
            campaign_id: new mongoose.Types.ObjectId(campaignId),
            influencer_id: new mongoose.Types.ObjectId(influencerId)
        });

        if (existingInvite) {
            return res.status(400).json({
                success: false,
                message: 'Influencer already invited to this campaign'
            });
        }

        // Create new campaign influencer record with status 'brand-invite'
        const newInvite = new CampaignInfluencers({
            campaign_id: new mongoose.Types.ObjectId(campaignId),
            influencer_id: new mongoose.Types.ObjectId(influencerId),
            status: 'brand-invite',
            progress: 0
        });

        await newInvite.save();

        console.log('Invite created successfully:', newInvite._id);

        res.json({
            success: true,
            message: 'Influencer invited successfully',
            inviteId: newInvite._id
        });
    } catch (error) {
        console.error('Error inviting influencer:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send invite',
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

// ========== CAMPAIGN CONTENT MANAGEMENT ROUTES ==========

// Product management routes
router.post('/campaigns/:campaignId/products', CampaignContentController.createCampaignProducts);
router.get('/campaigns/:campaignId/products', CampaignContentController.getCampaignProducts);

// Content review routes
router.get('/campaigns/:campaignId/pending-content', CampaignContentController.getCampaignPendingContentForBrand);
router.post('/content/:contentId/review', CampaignContentController.reviewContent);

module.exports = router;