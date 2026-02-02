const { InfluencerInfo, InfluencerSocials, InfluencerAnalytics } = require('../config/InfluencerMongo');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { CampaignInfo, CampaignInfluencers, CampaignMetrics } = require('../config/CampaignMongo');

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
      totalFollowers: totalFollowers,
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
    const update = { ...updateData };
    // Convert arrays or objects to proper format if needed
    if (update.categories && !Array.isArray(update.categories)) {
      update.categories = JSON.parse(update.categories);
    }
    if (update.languages && !Array.isArray(update.languages)) {
      update.languages = JSON.parse(update.languages);
    }
    const updated = await InfluencerInfo.findByIdAndUpdate(influencerId, update, { new: true }).lean();
    return updated;
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
  getInfluencerById,
  getInfluencerProfileDetails,
  updateInfluencerProfile,
  getAllInfluencers,
  getEngagementRates,
  getFollowerGrowth,
  getInfluencerMetrics,
  getBestPerformingPosts,
  getCampaignHistory
};