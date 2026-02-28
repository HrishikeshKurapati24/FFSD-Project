const { InfluencerInfo, InfluencerAnalytics } = require('../../models/InfluencerMongo');
const { CampaignInfluencers, CampaignMetrics } = require('../../models/CampaignMongo');
const mongoose = require('mongoose');

// Get engagement rates for the last 6 months
const getEngagementRates = async (influencerId) => {
    try {
        const analytics = await InfluencerAnalytics.findOne({ influencerId }).lean();
        if (!analytics) return [];
        // Assuming monthlyStats is sorted by month descending
        const sortedStats = analytics.monthlyStats.sort((a, b) => b.month.localeCompare(a.month));
        return sortedStats.slice(0, 6).map(stat => stat.engagementRate);
    } catch (error) {
        console.error('Error getting engagement rates:', error);
        throw error;
    }
};

// Get follower growth for the last 6 months
const getFollowerGrowth = async (influencerId) => {
    try {
        const analytics = await InfluencerAnalytics.findOne({ influencerId }).lean();
        if (!analytics) return [];
        const sortedStats = analytics.monthlyStats.sort((a, b) => b.month.localeCompare(a.month));
        return sortedStats.slice(0, 6).map(stat => stat.followers);
    } catch (error) {
        console.error('Error getting follower growth:', error);
        throw error;
    }
};

// Get influencer metrics
const getInfluencerMetrics = async (influencerId) => {
    try {
        const analytics = await InfluencerAnalytics.findOne({ influencerId }).lean();
        if (!analytics) {
            return {
                totalFollowers: 0,
                avgEngagementRate: 0,
                avgRating: 0,
                completedCollabs: 0
            };
        }
        // For avgRating and completedCollabs, we might need additional collections or calculations
        // Here, we return what is available in analytics
        return {
            totalFollowers: analytics.totalFollowers || 0,
            avgEngagementRate: analytics.avgEngagementRate || 0,
            avgRating: analytics.rating || 0,
            completedCollabs: analytics.completedCollabs || 0
        };
    } catch (error) {
        console.error('Error getting influencer metrics:', error);
        throw error;
    }
};

// Get best performing posts
const getBestPerformingPosts = async (influencerId) => {
    try {
        const influencer = await InfluencerInfo.findById(influencerId).lean();
        if (!influencer) return [];
        return influencer.bestPosts || [];
    } catch (error) {
        console.error('Error getting best performing posts:', error);
        throw error;
    }
};

// Get campaign history for a influencer
const getCampaignHistory = async (influencerId) => {
    try {
        const collaborations = await CampaignInfluencers.find({
            influencer_id: new mongoose.Types.ObjectId(influencerId),
            status: 'completed'
        })
            .populate('campaign_id', 'title description objectives budget duration required_channels min_followers target_audience start_date end_date')
            .populate('influencer_id', 'fullName profilePicUrl')
            .populate({
                path: 'campaign_id',
                populate: {
                    path: 'brand_id',
                    model: 'BrandInfo',
                    select: 'brandName logoUrl'
                }
            })
            .sort({ 'campaign_id.end_date': -1 })
            .lean();

        // Get campaign IDs for metrics and influencers lookup
        const campaignIds = collaborations.map(collab => collab.campaign_id._id);

        // Get metrics and influencers for all campaigns
        const [metrics, campaignInfluencers] = await Promise.all([
            CampaignMetrics.find({
                campaign_id: { $in: campaignIds }
            }).lean(),
            CampaignInfluencers.find({
                campaign_id: { $in: campaignIds },
                status: { $in: ['active', 'completed'] }
            })
                .populate('influencer_id', 'fullName profilePicUrl')
                .lean()
        ]);

        // Create maps for quick lookup
        const metricsMap = new Map();
        metrics.forEach(metric => {
            metricsMap.set(metric.campaign_id.toString(), metric);
        });

        const influencersMap = new Map();
        campaignInfluencers.forEach(ci => {
            const key = ci.campaign_id.toString();
            if (!influencersMap.has(key)) influencersMap.set(key, []);
            if (ci.influencer_id) {
                influencersMap.get(key).push({
                    id: ci.influencer_id._id,
                    name: ci.influencer_id.fullName,
                    profilePicUrl: ci.influencer_id.profilePicUrl
                });
            }
        });

        return collaborations.map(collab => {
            const campaignMetrics = metricsMap.get(collab.campaign_id._id.toString()) || {};
            return {
                id: collab._id,
                campaign_name: collab.campaign_id?.title || '',
                brand_id: collab.campaign_id?.brand_id?._id || null,
                description: collab.campaign_id?.description || '',
                objectives: collab.campaign_id?.objectives || '',
                brand_name: collab.campaign_id?.brand_id?.brandName || '',
                brand_logo: collab.campaign_id?.brand_id?.logoUrl || '',
                start_date: collab.campaign_id?.start_date || '',
                end_date: collab.campaign_id?.end_date || '',
                duration: collab.campaign_id?.duration || 0,
                budget: collab.campaign_id?.budget || 0,
                engagement_rate: campaignMetrics.engagement_rate || 0,
                reach: campaignMetrics.reach || 0,
                clicks: campaignMetrics.clicks || 0,
                conversion_rate: campaignMetrics.conversion_rate || 0,
                influencer_reach: collab.reach || 0,
                influencer_clicks: collab.clicks || 0,
                influencer_conversions: collab.conversions || 0,
                performance_score: campaignMetrics.performance_score || 0,
                impressions: campaignMetrics.impressions || 0,
                revenue: campaignMetrics.revenue || 0,
                roi: campaignMetrics.roi || 0,
                required_channels: collab.campaign_id?.required_channels || [],
                target_audience: collab.campaign_id?.target_audience || '',
                influencers: (influencersMap.get(collab.campaign_id._id.toString()) || []).filter(i => i.id?.toString() !== influencerId.toString()),
                status: 'completed'
            };
        });
    } catch (error) {
        console.error('Error in getCampaignHistory:', error);
        return [];
    }
}

module.exports = {
    getEngagementRates,
    getFollowerGrowth,
    getInfluencerMetrics,
    getBestPerformingPosts,
    getCampaignHistory
};
