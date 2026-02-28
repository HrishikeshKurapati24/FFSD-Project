const fs = require('fs');
const svcPath = './services/influencer/influencerProfileService.js';
let svcC = fs.readFileSync(svcPath, 'utf8');

const additionalServiceMethods = `
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
        const brandRankings = await Promise.all( brandPaymentPipeline.map(async (payment) => {
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
`;

svcC = svcC.replace(/module\.exports = \{/, additionalServiceMethods + '\nmodule.exports = {\n    getInfluencerDashboardData,\n    updateInfluencerImagesData,\n    updateInfluencerProfileDataOnly,');
fs.writeFileSync(svcPath, svcC);
