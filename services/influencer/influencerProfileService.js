const { InfluencerInfo, InfluencerSocials, InfluencerAnalytics } = require('../../models/InfluencerMongo');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { getInfluencerMetrics } = require('./influencerMetricsService');

// Get influencer by ID
const getInfluencerById = async (influencerId) => {
    try {
        console.log('Getting influencer by ID:', influencerId);

        // Get influencer data
        const influencer = await InfluencerInfo.findById(influencerId).lean();
        if (!influencer) {
            console.error('No influencer found with ID:', influencerId);
            return null;
        }

        console.log('Found influencer:', influencer);

        // Get social media data separately
        const socials = await InfluencerSocials.find({ influencerId }).lean();
        console.log('Found socials:', socials);

        // Calculate total followers from all platforms
        const totalFollowers = socials.reduce((acc, social) => {
            return acc + (social.followers || 0);
        }, 0);

        // Calculate average engagement rate
        const totalEngagement = socials.reduce((acc, social) => {
            const platformEngagement = (social.avgLikes || 0) + (social.avgComments || 0);
            return acc + platformEngagement;
        }, 0);
        const avgEngagementRate = socials.length > 0 ? (totalEngagement / socials.length) : 0;

        // Get analytics data for monthly earnings
        const analytics = await InfluencerAnalytics.findOne({ influencerId }).lean();
        const monthlyEarnings = analytics?.monthlyEarnings || 0;

        // Get performance metrics
        const metrics = await getInfluencerMetrics(influencerId);

        return {
            ...influencer,
            socials,
            total_followers: totalFollowers,
            avgEngagementRate: avgEngagementRate.toFixed(2),
            monthlyEarnings: monthlyEarnings,
            metrics: {
                totalFollowers: metrics.totalFollowers,
                avgEngagementRate: metrics.avgEngagementRate,
                avgRating: metrics.avgRating,
                completedCollabs: metrics.completedCollabs
            }
        };
    } catch (error) {
        console.error('Error in getInfluencerById:', error);
        throw error;
    }
};

// Get influencer profile details with social media stats
const getInfluencerProfileDetails = async (influencerId) => {
    try {
        const influencer = await InfluencerInfo.findById(influencerId).lean();
        if (!influencer) {
            return null;
        }

        const socials = await InfluencerSocials.find({ influencerId }).lean();

        // Format socials data similar to previous structure
        const formattedSocials = socials.flatMap(social =>
            social.platforms.map(platform => ({
                platform: platform.platform,
                name: platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1),
                icon: platform.platform.toLowerCase(),
                followers: platform.followers,
                url: platform.url, // Added url
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

        // Get performance metrics
        const metrics = await getInfluencerMetrics(influencerId);

        // Get analytics for earnings
        const analytics = await InfluencerAnalytics.findOne({ influencerId: new mongoose.Types.ObjectId(influencerId) }).lean();

        return {
            ...influencer,
            displayName: influencer.displayName || influencer.fullName,
            profilePicUrl: influencer.profilePicUrl,
            bannerUrl: influencer.bannerUrl,
            audienceGender: influencer.audienceGender,
            audienceAgeRange: influencer.audienceAgeRange,
            categories: influencer.categories || [],
            languages: influencer.languages || [],
            socials: formattedSocials,
            totalFollowers: metrics?.totalFollowers || totalFollowers, // Use metrics if available, fallback to calculated
            avgEngagementRate: metrics?.avgEngagementRate || 0,
            avgRating: metrics?.avgRating || 0,
            completedCollabs: metrics?.completedCollabs || 0,
            monthlyEarnings: analytics?.monthlyEarnings || 0,
            bestPosts: bestPosts.map(post => ({
                platform: post.platform,
                url: post.url || '',
                thumbnail: post.thumbnail,
                title: post.title,
                likes: post.likes,
                comments: post.comments,
                date: post.date
            })),
            createdAt: influencer.createdAt
        };
    } catch (error) {
        console.error('Error getting influencer profile details:', error);
        throw error;
    }
};

// Update influencer profile
const updateInfluencerProfile = async (influencerId, updateData) => {
    try {
        const infoUpdate = { ...updateData };
        const socialsUpdate = updateData.socials;

        // Remove socials from info update to prevent schema errors or polluting Info doc
        delete infoUpdate.socials;

        // Convert arrays or objects to proper format if needed
        if (infoUpdate.categories && !Array.isArray(infoUpdate.categories)) {
            infoUpdate.categories = JSON.parse(infoUpdate.categories);
        }
        if (infoUpdate.languages && !Array.isArray(infoUpdate.languages)) {
            infoUpdate.languages = JSON.parse(infoUpdate.languages);
        }

        // 1. Update InfluencerInfo
        const updatedInfo = await InfluencerInfo.findByIdAndUpdate(influencerId, infoUpdate, { new: true }).lean();

        // 2. Update InfluencerSocials if provided
        if (socialsUpdate && Array.isArray(socialsUpdate)) {
            console.log('Updating socials with:', socialsUpdate);

            // Fetch basic info for fallback values if needed
            const influencer = await InfluencerInfo.findById(influencerId);
            const username = influencer ? influencer.username : 'unknown';

            // Map frontend data to schema requirements
            const platforms = socialsUpdate.map(s => {
                // Try to extract handle from URL if not provided
                let handle = s.handle;
                if (!handle && s.url) {
                    try {
                        const urlObj = new URL(s.url.startsWith('http') ? s.url : `https://${s.url}`);
                        const pathParts = urlObj.pathname.split('/').filter(p => p);
                        handle = pathParts.length > 0 ? pathParts[pathParts.length - 1] : username;
                    } catch (e) {
                        handle = username;
                    }
                }

                return {
                    platform: s.platform || 'instagram',
                    url: s.url || '',
                    followers: s.followers || 0,
                    handle: handle || username, // Required field
                    // Preserve or default metrics
                    avgLikes: s.avgLikes || 0,
                    avgComments: s.avgComments || 0,
                    avgViews: s.avgViews || 0
                };
            });

            console.log('Constructed platforms array:', platforms);

            const result = await InfluencerSocials.findOneAndUpdate(
                { influencerId: new mongoose.Types.ObjectId(influencerId) },
                {
                    $set: {
                        platforms: platforms,
                        socialHandle: username // Required field, syncing with username
                    }
                },
                { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: false }
            );
        }

        return updatedInfo;
    } catch (error) {
        console.error('Error updating influencer profile:', error);
        throw error;
    }
};

// Get all influencers
const getAllInfluencers = async () => {
    try {
        const influencers = await InfluencerInfo.find({}).lean()
            .limit(5);
        return influencers;
    } catch (error) {
        console.error('Error fetching influencers:', error);
        throw error;
    }
};


// New extracted methods for Dashboard and Updates
const getInfluencerDashboardData = async (influencerId) => {
    try {
        const collaborationManageService = require('../collaboration/collaborationManageService');
        const SubscriptionService = require('../subscription/subscriptionService');
        const { CampaignInfluencers, CampaignPayments } = require('../../models/CampaignMongo');
        const { getCampaignHistory: getInfCampaignHistory } = require('./influencerProfileService'); // though it's not exported above, wait... influencerProfileService does not export getCampaignHistory. Let me just rewrite getCampaignHistory for dashboard.

        // Actually the easiest way to avoid circular dependencies or undefined is to just put the logic here.
        const userType = 'influencer';

        const [subscriptionStatus, subscriptionLimits, influencer] = await Promise.all([
            SubscriptionService.checkSubscriptionExpiry(influencerId, userType),
            SubscriptionService.getSubscriptionLimitsWithUsage(influencerId, userType),
            getInfluencerById(influencerId)
        ]);

        if (!influencer) return null;

        const [activeCollaborations, pendingRequests, brandInvites, sentRequests] = await Promise.all([
            collaborationManageService.getActiveCollaborations(influencerId),
            collaborationManageService.getPendingRequests(influencerId),
            collaborationManageService.getBrandInvites(influencerId),
            collaborationManageService.getSentRequests(influencerId)
        ]);

        const completionPercentage = activeCollaborations.length > 0
            ? activeCollaborations.reduce((acc, collab) => acc + (collab.progress || 0), 0) / activeCollaborations.length
            : 0;

        const nearingCompletion = activeCollaborations.filter(collab => (collab.progress || 0) >= 75).length;

        const totalCommissionsPipeline = await CampaignPayments.aggregate([
            { $match: { influencer_id: new mongoose.Types.ObjectId(influencerId), status: 'completed' } },
            { $group: { _id: null, totalCommissions: { $sum: '$amount' } } }
        ]);
        const totalCommissionsEarned = totalCommissionsPipeline.length > 0 ? totalCommissionsPipeline[0].totalCommissions : 0;

        const stats = {
            activeCollaborations: activeCollaborations.length,
            completionPercentage: Math.round(completionPercentage),
            nearingCompletion: nearingCompletion,
            pendingRequests: pendingRequests.length,
            brandInvites: brandInvites.length,
            sentRequests: sentRequests.length,
            monthlyEarnings: influencer.monthlyEarnings || 0,
            earningsChange: 0,
            totalFollowers: influencer.metrics?.totalFollowers || 0,
            avgEngagementRate: influencer.metrics?.avgEngagementRate || 0,
            avgRating: influencer.metrics?.avgRating || 0,
            completedCollabs: influencer.metrics?.completedCollabs || 0,
            totalEarnings: (influencer.monthlyEarnings || 0) * 12,
            totalCommissionsEarned: totalCommissionsEarned,
            revenueGenerated: totalCommissionsEarned,
            upcomingDeadlines: activeCollaborations.filter(collab => {
                const endDate = new Date(collab.end_date);
                const today = new Date();
                const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
                return daysLeft <= 7 && daysLeft > 0;
            }).length,
            performanceScore: activeCollaborations.length > 0
                ? Math.round(activeCollaborations.reduce((acc, collab) => acc + (collab.performance_score || 0), 0) / activeCollaborations.length)
                : 0
        };

        const transformedInfluencer = {
            name: influencer.name || influencer.displayName || 'Influencer',
            totalAudience: influencer.metrics?.totalFollowers || 0,
            avgEngagementRate: influencer.metrics?.avgEngagementRate || 0,
            monthlyEarnings: influencer.monthlyEarnings || 0,
            socials: influencer.socials || [],
            metrics: influencer.metrics || {},
            referralCode: influencer.referralCode
        };

        const completedCollaborations = await CampaignInfluencers.find({
            influencer_id: influencerId,
            status: 'completed'
        }).populate('campaign_id', 'title brand_id description target_audience budget end_date duration start_date').lean();

        const recentCampaignHistory = completedCollaborations
            .sort((a, b) => new Date(b.end_date || 0) - new Date(a.end_date || 0))
            .slice(0, 3)
            .map(c => ({
                title: c.campaign_name || c.campaign_id?.title || 'Untitled Campaign',
                description: c.description || c.campaign_id?.description || '',
                status: 'completed',
                end_date: c.end_date,
                performance_score: c.performance_score || 0,
                engagement_rate: c.engagement_rate || 0,
                reach: c.reach || 0,
                conversion_rate: c.conversions || 0,
                budget: c.campaign_id?.budget || 0,
                brand_name: c.brand_name || '',
                brand_logo: c.brand_logo || '/images/default-brand.png'
            }));

        const brandPaymentPipeline = await CampaignPayments.aggregate([
            { $match: { influencer_id: new mongoose.Types.ObjectId(influencerId), status: 'completed' } },
            { $group: { _id: '$brand_id', totalPayment: { $sum: '$amount' }, campaignCount: { $addToSet: '$campaign_id' } } },
            { $project: { _id: 1, totalPayment: 1, campaignCount: { $size: '$campaignCount' } } },
            { $sort: { totalPayment: -1 } }
        ]);

        const { BrandInfo } = require('../../models/BrandMongo');
        const brandRankings = await Promise.all(brandPaymentPipeline.map(async (payment) => {
            const brand = await BrandInfo.findById(payment._id).select('brandName logoUrl').lean();
            return {
                _id: payment._id,
                brandName: brand?.brandName || 'Unknown Brand',
                logoUrl: brand?.logoUrl || '/images/default-brand.png',
                totalPayment: payment.totalPayment,
                campaignCount: payment.campaignCount
            };
        }));

        const { Product } = require('../../models/ProductMongo');
        const campaignIds = completedCollaborations.filter(c => c.campaign_id?._id).map(c => c.campaign_id._id);
        const promotedProducts = await Product.find({ campaign_id: { $in: campaignIds } })
            .populate({ path: 'campaign_id', select: 'title brand_id', populate: { path: 'brand_id', select: 'brandName logoUrl' } }).lean();

        const productsByRevenue = promotedProducts.map(product => ({
            _id: product._id,
            name: product.name,
            category: product.category,
            images: product.images,
            originalPrice: product.original_price,
            campaignPrice: product.campaign_price,
            discountPercentage: product.discount_percentage,
            targetQuantity: product.target_quantity,
            soldQuantity: product.sold_quantity || 0,
            revenue: (product.sold_quantity || 0) * (product.campaign_price || 0),
            campaignTitle: product.campaign_id?.title || 'Unknown Campaign',
            brandName: product.campaign_id?.brand_id?.brandName || 'Unknown Brand',
            brandLogo: product.campaign_id?.brand_id?.logoUrl || '/images/default-brand.png'
        })).sort((a, b) => b.revenue - a.revenue);

        return {
            influencer: transformedInfluencer,
            stats,
            activeCollaborations: activeCollaborations || [],
            pendingRequests: pendingRequests || [],
            brandInvites: brandInvites || [],
            sentRequests: sentRequests || [],
            recentCampaignHistory,
            subscriptionStatus,
            subscriptionLimits,
            brandRankings,
            productsByRevenue: {
                high: productsByRevenue.filter(p => p.revenue > 1000),
                medium: productsByRevenue.filter(p => p.revenue > 100 && p.revenue <= 1000),
                low: productsByRevenue.filter(p => p.revenue > 0 && p.revenue <= 100),
                noRevenue: productsByRevenue.filter(p => p.revenue === 0)
            }
        };
    } catch (error) {
        console.error('Error in getInfluencerDashboardData:', error);
        throw error;
    }
};

const updateInfluencerImagesData = async (influencerId, profilePicFile, bannerImageFile) => {
    const { uploadToCloudinary } = require('../../utils/cloudinary');
    const updateData = {};

    if (profilePicFile) {
        const profilePicUrl = await uploadToCloudinary(profilePicFile, 'influencer-profiles');
        if (profilePicUrl) updateData.profilePicUrl = profilePicUrl;
    }

    if (bannerImageFile) {
        const bannerUrl = await uploadToCloudinary(bannerImageFile, 'influencer-banners');
        if (bannerUrl) updateData.bannerUrl = bannerUrl;
    }

    if (Object.keys(updateData).length > 0) {
        const updatedInfluencer = await InfluencerInfo.findByIdAndUpdate(
            influencerId,
            { $set: updateData },
            { new: true, runValidators: true }
        );
        if (!updatedInfluencer) throw new Error('Influencer not found');
        return {
            profilePicUrl: updatedInfluencer.profilePicUrl || updatedInfluencer.profile_pic_url,
            bannerUrl: updatedInfluencer.bannerUrl || updatedInfluencer.banner_url
        };
    }
    throw new Error('No images provided for update');
};

const updateInfluencerProfileDataOnly = async (influencerId, reqBody) => {
    const currentProfile = await getInfluencerById(influencerId);
    if (!currentProfile) throw new Error('Influencer profile not found');

    const updateData = {
        name: reqBody.displayName || currentProfile.name,
        username: reqBody.username || currentProfile.username,
        bio: reqBody.bio || currentProfile.bio,
        location: reqBody.location || currentProfile.location,
        phone: reqBody.phone || currentProfile.phone,
        niche: reqBody.niche || currentProfile.niche,
        displayName: reqBody.displayName || currentProfile.displayName || currentProfile.name,
        audienceGender: reqBody.audienceGender || currentProfile.audienceGender || currentProfile.audience_gender,
        audienceAgeRange: reqBody.audienceAgeRange || reqBody.audienceAge || currentProfile.audienceAgeRange || currentProfile.audience_age_range,
        categories: Array.isArray(reqBody.categories) ? reqBody.categories :
            (reqBody.categories ? [reqBody.categories].filter(Boolean) : currentProfile.categories),
        languages: Array.isArray(reqBody.languages) ? reqBody.languages :
            (reqBody.languages ? [reqBody.languages].filter(Boolean) : currentProfile.languages),
        socials: reqBody.socials || currentProfile.socials || currentProfile.social_media_links
    };

    const hasChanges = Object.keys(updateData).some(key =>
        JSON.stringify(updateData[key]) !== JSON.stringify(currentProfile[key])
    );

    if (hasChanges) {
        await updateInfluencerProfile(influencerId, updateData);
    }
    return { hasChanges, profile: updateData };
};

const updateInfluencerDataLegacy = async (influencerId, updateData) => {
    // Get current profile
    const currentProfile = await InfluencerInfo.findById(influencerId);
    if (!currentProfile) throw new Error('Influencer profile not found');

    const profileData = {
        displayName: updateData.displayName,
        username: updateData.username,
        bio: updateData.bio,
        location: updateData.location,
        audienceGender: updateData.audienceGender,
        audienceAgeRange: updateData.audienceAgeRange,
        categories: updateData.categories,
        languages: updateData.languages
    };

    let updatedSocials = null;
    if (updateData.socials && Array.isArray(updateData.socials)) {
        const platforms = updateData.socials
            .filter(social => social.platform && social.followers)
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

        const currentSocials = await InfluencerSocials.findOne({ influencerId });
        if (currentSocials) {
            updatedSocials = await InfluencerSocials.findByIdAndUpdate(
                currentSocials._id,
                { platforms, socialHandle: updateData.username },
                { new: true }
            );
        } else {
            updatedSocials = await new InfluencerSocials({
                influencerId,
                socialHandle: updateData.username,
                platforms
            }).save();
        }
    }

    const hasChanges = Object.keys(profileData).some(key =>
        JSON.stringify(profileData[key]) !== JSON.stringify(currentProfile[key])
    );

    if (hasChanges) {
        await InfluencerInfo.findByIdAndUpdate(
            influencerId,
            { $set: profileData },
            { new: true, runValidators: true }
        );
    }

    return {
        hasChanges,
        profile: {
            ...profileData,
            socials: updatedSocials?.platforms || []
        }
    };
};

const deleteInfluencerAccount = async (influencerId) => {
    const { CampaignInfluencers } = require('../../models/CampaignMongo');
    const { InfluencerInfo, InfluencerAnalytics, InfluencerSocials } = require('../../models/InfluencerMongo');

    await Promise.all([
        InfluencerInfo.findByIdAndDelete(influencerId),
        InfluencerAnalytics.deleteMany({ influencerId }),
        InfluencerSocials.deleteMany({ influencerId }),
        CampaignInfluencers.deleteMany({ influencer_id: influencerId })
    ]);
};

module.exports = {
    getInfluencerDashboardData,
    updateInfluencerImagesData,
    updateInfluencerProfileDataOnly,
    getInfluencerById,
    getInfluencerProfileDetails,
    updateInfluencerProfile,
    getAllInfluencers,
    updateInfluencerDataLegacy,
    deleteInfluencerAccount
};
