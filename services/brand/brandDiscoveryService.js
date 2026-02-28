const { BrandInfo } = require('../../models/BrandMongo');
const { InfluencerInfo, InfluencerSocials, InfluencerAnalytics } = require('../../models/InfluencerMongo');
const { CampaignInfluencers } = require('../../models/CampaignMongo');

class brandDiscoveryService {
    // Get recommended brands for an influencer
    static async getRecommendedBrands(influencerId) {
        try {
            const influencer = await InfluencerInfo.findById(influencerId).select('categories');

            if (!influencer || !influencer.categories || influencer.categories.length === 0) {
                return [];
            }

            const categories = influencer.categories;

            const brands = await BrandInfo.find({
                categories: { $in: categories },
                status: 'active'
            })
                .sort({ avgCampaignRating: -1 })
                .limit(5)
                .select('_id brandName industry logoUrl');

            return brands;
        } catch (err) {
            console.error('Error fetching recommended brands:', err);
            return [];
        }
    }

    // Get all brands
    static async getAllBrands() {
        try {
            const brands = await BrandInfo.find({ status: 'active' })
                .select('brandName username logoUrl bannerUrl categories location website mission tagline verified completedCampaigns influencerPartnerships avgCampaignRating primaryMarket influenceRegions')
                .sort({ verified: -1, avgCampaignRating: -1, completedCampaigns: -1 })
                .limit(50)
                .lean();
            return brands;
        } catch (err) {
            console.error('Error fetching brands:', err);
            throw err;
        }
    }

    // Get influencer profile data for brand view
    static async getInfluencerProfileData(influencerId) {
        try {
            const influencer = await InfluencerInfo.findById(influencerId).lean();
            if (!influencer) return null;

            const [socials, analytics, campaigns] = await Promise.all([
                InfluencerSocials.findOne({ influencerId }).lean(),
                InfluencerAnalytics.findOne({ influencerId }).lean(),
                CampaignInfluencers.find({
                    influencer_id: influencerId,
                    status: { $in: ['active', 'completed'] }
                }).populate({
                    path: 'campaign_id',
                    select: 'title start_date end_date required_channels brand_id status',
                    populate: { path: 'brand_id', select: 'brandName' }
                }).lean()
            ]);

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

            const totalFollowers = formattedSocials.reduce((sum, social) => sum + (social.followers || 0), 0);

            const bestPosts = influencer.bestPosts?.map(post => ({
                platform: post.platform,
                url: post.url || '',
                thumbnail: post.thumbnail || '/images/default-post.jpg',
                likes: post.likes || 0,
                comments: post.comments || 0,
                views: post.views || 0
            })) || [];

            const currentPartnerships = campaigns
                .filter(c => c.status === 'active' && c.campaign_id?.status === 'active')
                .map(c => ({
                    id: c.campaign_id._id,
                    title: c.campaign_id.title,
                    brandName: c.campaign_id.brand_id?.brandName || 'Unknown Brand',
                    startDate: c.campaign_id.start_date,
                    endDate: c.campaign_id.end_date,
                    progress: c.progress || 0,
                    channels: c.campaign_id.required_channels || []
                }));

            const pastCollaborations = campaigns
                .filter(c => c.status === 'completed' && c.campaign_id?.status === 'completed')
                .map(c => ({
                    id: c.campaign_id._id,
                    title: c.campaign_id.title,
                    brandName: c.campaign_id.brand_id?.brandName || 'Unknown Brand',
                    completionDate: c.campaign_id.end_date,
                    engagementRate: c.engagement_rate || 0,
                    reach: c.reach || 0,
                    clicks: c.clicks || 0,
                    conversions: c.conversions || 0
                }));

            return {
                _id: influencer._id,
                displayName: influencer.displayName || influencer.fullName,
                fullName: influencer.fullName,
                username: influencer.username,
                profilePicUrl: influencer.profilePicUrl || '/images/default-profile.jpg',
                bannerUrl: influencer.bannerUrl || '/images/default-banner.jpg',
                bio: influencer.bio || '',
                location: influencer.location || 'Not specified',
                influenceRegions: influencer.influenceRegions || 'Global',
                verified: influencer.verified || false,
                categories: influencer.categories || [],
                languages: influencer.languages || [],
                niche: influencer.niche || 'Not specified',
                socials: formattedSocials,
                totalFollowers,
                avgEngagementRate: analytics?.avgEngagementRate || 0,
                completedCollabs: influencer.completedCollabs || 0,
                bestPosts,
                currentPartnerships,
                pastCollaborations,
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
        } catch (error) {
            console.error('Error getting influencer profile data:', error);
            throw error;
        }
    }
}

module.exports = brandDiscoveryService;
