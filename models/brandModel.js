// model/brandModel.js

const { BrandInfo, BrandAnalytics, BrandVerification, BrandSocialLink } = require('../config/BrandMongo');
const { CampaignInfo, CampaignMetrics, CampaignInfluencers } = require('../config/CampaignMongo');
const { InfluencerInfo, InfluencerAnalytics } = require('../config/InfluencerMongo');
const { BrandSocials } = require('../config/BrandMongo');
const mongoose = require('mongoose');

class brandModel {
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

  // Get recent completed campaigns for a brand (limited)
  static async getRecentCompletedCampaigns(brandId, limit = 3) {
    try {
      const brandObjectId = new mongoose.Types.ObjectId(brandId);

      const campaigns = await CampaignInfo.find({
        brand_id: brandObjectId,
        status: 'completed'
      })
        .sort({ end_date: -1 })
        .limit(limit)
        .lean();

      if (!campaigns.length) return [];

      const campaignIds = campaigns.map(c => c._id);
      console.log(campaignIds);

      const [metrics, influencerCounts] = await Promise.all([
        CampaignMetrics.find({ campaign_id: { $in: campaignIds } }).lean(),
        CampaignInfluencers.aggregate([
          { $match: { campaign_id: { $in: campaignIds } } },
          { $group: { _id: '$campaign_id', count: { $sum: 1 } } }
        ])
      ]);

      const metricsMap = new Map();
      metrics.forEach(m => metricsMap.set(m.campaign_id.toString(), m));

      const influencerCountMap = new Map();
      influencerCounts.forEach(c => influencerCountMap.set(c._id.toString(), c.count));

      return campaigns.map(campaign => {
        const m = metricsMap.get(campaign._id.toString()) || {};
        return {
          _id: campaign._id,
          name: campaign.title,
          description: campaign.description,
          end_date: campaign.end_date,
          budget: campaign.budget || 0,
          status: campaign.status,
          duration: campaign.duration || 0,
          target_audience: campaign.target_audience || '',
          required_channels: campaign.required_channels || [],
          min_followers: campaign.min_followers || 0,
          engagement_rate: m.engagement_rate || 0,
          reach: m.reach || 0,
          conversion_rate: m.conversion_rate || 0,
          performance_score: m.performance_score || 0,
          influencersCount: influencerCountMap.get(campaign._id.toString()) || 0
        };
      });
    } catch (err) {
      console.error('Error fetching recent completed campaigns:', err);
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

  // Get brand by ID
  static async getBrandById(id) {
    try {
      const brand = await BrandInfo.findById(id);
      return brand;
    } catch (err) {
      throw err;
    }
  }

  // Update brand profile
  static async updateBrandProfile(brandId, updateData) {
    try {
      // Check if brand exists
      const brand = await BrandInfo.findById(brandId);
      if (!brand) {
        throw new Error('Brand not found');
      }

      // Define allowed fields and their validation rules
      const allowedFields = {
        brandName: { type: 'string', required: false },
        industry: { type: 'string', required: false },
        description: { type: 'string', required: false },
        logoUrl: { type: 'string', required: false },
        website: { type: 'string', required: false },
        categories: { type: 'array', required: false },
        contactEmail: { type: 'string', required: false },
        contactPhone: { type: 'string', required: false },
        status: { type: 'string', required: false, enum: ['active', 'inactive', 'suspended'] }
      };

      // Sanitize and validate update data
      const sanitizedData = {};
      for (const [field, value] of Object.entries(updateData)) {
        if (allowedFields[field]) {
          const fieldConfig = allowedFields[field];

          // Type validation
          if (fieldConfig.type === 'string' && typeof value !== 'string') {
            throw new Error(`Invalid type for ${field}. Expected string.`);
          }
          if (fieldConfig.type === 'array' && !Array.isArray(value)) {
            throw new Error(`Invalid type for ${field}. Expected array.`);
          }

          // Enum validation
          if (fieldConfig.enum && !fieldConfig.enum.includes(value)) {
            throw new Error(`Invalid value for ${field}. Allowed values: ${fieldConfig.enum.join(', ')}`);
          }

          sanitizedData[field] = value;
        }
      }

      // Update the brand profile
      const updated = await BrandInfo.findByIdAndUpdate(
        brandId,
        { $set: sanitizedData },
        {
          new: true,
          runValidators: true
        }
      );

      return updated;
    } catch (err) {
      console.error('Error updating brand profile:', err);
      throw err;
    }
  }

  // Get social stats for a brand
  static async getSocialStats(brandId) {
    try {
      const socials = await BrandSocials.findOne({ brandId });
      if (!socials) {
        return [];
      }
      return socials.platforms || [];
    } catch (err) {
      console.error('Error fetching social stats:', err);
      return [];
    }
  }

  // Get top campaigns for a brand
  static async getTopCampaigns(brandId) {
    try {
      const topCampaigns = await CampaignMetrics.find({ brand_id: brandId })
        .sort({ performance_score: -1 })
        .limit(5);
      return topCampaigns;
    } catch (err) {
      throw err;
    }

    /*
    db2.all('SELECT * FROM campaigns WHERE brand_id = ? ORDER BY performance_score DESC LIMIT 5', [brandId], ...);
    */
  }

  // Get verification status
  static async getVerificationStatus(brandId) {
    try {
      const brand = await BrandInfo.findById(brandId).select('verified');
      return { status: brand?.verified ? 'verified' : 'unverified' };
    } catch (err) {
      console.error('Error getting verification status:', err);
      return { status: 'unverified' };
    }
  }

  // Request verification
  static async requestVerification(brandId, verificationData) {
    try {
      const updated = await BrandInfo.findByIdAndUpdate(
        brandId,
        {
          $set: {
            verified: true,
            verificationData
          }
        },
        { new: true }
      );
      return updated;
    } catch (err) {
      console.error('Error requesting verification:', err);
      throw err;
    }
  }

  // Update social links
  static async updateSocialLinks(brandId, socials) {
    try {
      await BrandSocialLink.deleteMany({ brandId });

      const socialLinksArray = Array.isArray(socials)
        ? socials
        : Object.entries(socials).map(([platform, data]) => ({
          brandId,
          platform,
          url: data.url,
          followers: data.followers || 0
        }));

      await BrandSocialLink.insertMany(socialLinksArray);
      return true;
    } catch (err) {
      throw err;
    }

    /*
    db2.run('DELETE FROM brand_social_links WHERE brand_id = ?', [brandId], ...);
    */
  }

  // Get brand statistics
  static async getBrandStats(brandId) {
    try {
      const analytics = await BrandAnalytics.findOne({ brandId });
      const activeCampaigns = await CampaignInfo.countDocuments({
        brand_id: brandId,
        status: 'active',
        end_date: { $gt: new Date() }
      });

      const lastMonthAnalytics = await BrandAnalytics.findOne(
        { brandId },
        { monthlyStats: { $slice: [-2, 2] } }
      );

      const currentMonth = lastMonthAnalytics?.monthlyStats[1] || {};
      const previousMonth = lastMonthAnalytics?.monthlyStats[0] || {};

      return {
        total_campaigns: activeCampaigns || 0,
        campaign_growth: activeCampaigns - analytics?.campaignMetrics?.totalCampaigns || 0, // Example growth calculation
        avg_engagement: analytics?.avgEngagementRate || 0,
        engagement_trend: currentMonth.engagementRate - previousMonth.engagementRate || 0,
        total_reach: analytics?.performanceMetrics?.reach || 0,
        reach_growth: ((currentMonth.reach - previousMonth.reach) / (previousMonth.reach || 1)) * 100 || 0,
        roi: analytics?.campaignMetrics?.avgROI || 0,
        roi_trend: 5, // Example trend
        total_clicks: analytics?.performanceMetrics?.clicks || 0,
        total_revenue: analytics?.campaignMetrics?.totalRevenue || 0,
        total_spend: analytics?.campaignMetrics?.totalSpend || 0
      };
    } catch (err) {
      console.error('Error fetching brand stats:', err);
      return {
        total_campaigns: 0,
        campaign_growth: 0,
        avg_engagement: 0,
        engagement_trend: 0,
        total_reach: 0,
        reach_growth: 0,
        roi: 0,
        roi_trend: 0,
        total_clicks: 0,
        total_revenue: 0,
        total_spend: 0
      };
    }
  }

  // Get brand analytics
  static async getBrandAnalytics(brandId) {
    try {
      const analytics = await BrandAnalytics.findOne({ brandId });

      if (!analytics) {
        // Return default analytics if none exist
        return {
          months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          engagementRates: [5, 6, 7, 8, 9, 10],
          clickThroughRates: [2, 3, 4, 5, 6, 7],
          productsSold: [100, 150, 200, 250, 300, 350],
          conversionRates: [1, 2, 3, 4, 5, 6],
          demographics: {
            labels: ['18-24', '25-34', '35-44', '45-54', '55+'],
            data: [25, 35, 20, 15, 5]
          }
        };
      }

      // Transform the analytics data for the dashboard
      const monthlyStats = analytics.monthlyStats || [];
      const last6Months = monthlyStats.slice(-6);

      return {
        months: last6Months.map(stat => {
          const date = new Date(stat.month);
          return date.toLocaleString('default', { month: 'short' });
        }),
        engagementRates: last6Months.map(stat => stat.engagementRate || 0),
        clickThroughRates: last6Months.map(stat => {
          const clicks = stat.clicks || 0;
          const impressions = stat.impressions || 1;
          return (clicks / impressions) * 100;
        }),
        productsSold: last6Months.map(stat => stat.conversions || 0),
        conversionRates: last6Months.map(stat => stat.conversionRate || 0),
        demographics: {
          labels: ['18-24', '25-34', '35-44', '45-54', '55+'],
          data: [25, 35, 20, 15, 5] // Example demographic data
        }
      };
    } catch (err) {
      console.error('Error fetching brand analytics:', err);
      // Return default analytics in case of error
      return {
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        engagementRates: [5, 6, 7, 8, 9, 10],
        clickThroughRates: [2, 3, 4, 5, 6, 7],
        productsSold: [100, 150, 200, 250, 300, 350],
        conversionRates: [1, 2, 3, 4, 5, 6],
        demographics: {
          labels: ['18-24', '25-34', '35-44', '45-54', '55+'],
          data: [25, 35, 20, 15, 5]
        }
      };
    }
  }

  // Get active campaigns for a brand
  static async getActiveCampaigns(brandId) {
    try {
      const activeCampaigns = await CampaignInfo.find({
        brand_id: brandId,
        status: 'active',
        end_date: { $gt: new Date() }
      })
        .sort({ start_date: -1 })
        .lean();

      // Get metrics for all campaigns
      const campaignIds = activeCampaigns.map(campaign => campaign._id);
      const [metrics, influencerCounts] = await Promise.all([
        CampaignMetrics.find({
          campaign_id: { $in: campaignIds }
        }).lean(),
        CampaignInfluencers.aggregate([
          {
            $match: {
              campaign_id: { $in: campaignIds },
              status: 'active'
            }
          },
          {
            $group: {
              _id: '$campaign_id',
              count: { $sum: 1 }
            }
          }
        ])
      ]);

      // Create maps for quick lookup
      const metricsMap = new Map();
      metrics.forEach(metric => {
        metricsMap.set(metric.campaign_id.toString(), metric);
      });

      const influencerCountMap = new Map();
      influencerCounts.forEach(count => {
        influencerCountMap.set(count._id.toString(), count.count);
      });

      return activeCampaigns.map(campaign => {
        const campaignMetrics = metricsMap.get(campaign._id.toString()) || {};
        // Prefer influencer-driven overall_progress from CampaignMetrics; fallback to time-based progress
        const overallProgress = campaignMetrics.overall_progress;
        return {
          ...campaign,
          progress: (overallProgress !== undefined && overallProgress !== null) ? overallProgress : this.calculateCampaignProgress(campaign),
          engagement_rate: campaignMetrics.engagement_rate || 0,
          reach: campaignMetrics.reach || 0,
          conversion_rate: campaignMetrics.conversion_rate || 0,
          influencers_count: influencerCountMap.get(campaign._id.toString()) || 0
        };
      });
    } catch (err) {
      console.error('Error fetching active campaigns:', err);
      return [];
    }
  }

  // Helper function to calculate campaign progress
  static calculateCampaignProgress(campaign) {
    if (!campaign.start_date || !campaign.end_date) return 0;

    const now = new Date();
    const start = new Date(campaign.start_date);
    const end = new Date(campaign.end_date);

    if (now < start) return 0;
    if (now > end) return 100;

    const total = end - start;
    const elapsed = now - start;
    return Math.round((elapsed / total) * 100);
  }



  // Get campaign history for a brand
  static async getCampaignHistory(brandId) {
    try {
      console.log('Fetching campaign history for brand:', brandId);

      // Convert brandId to ObjectId
      const brandObjectId = new mongoose.Types.ObjectId(brandId);

      // Find completed and cancelled campaigns
      const campaigns = await CampaignInfo.find({
        brand_id: brandObjectId,
        status: { $in: ['completed', 'cancelled'] }
      })
        .sort({ end_date: -1 })
        .lean();

      console.log('Found campaigns:', campaigns.length);

      if (campaigns.length === 0) {
        return [];
      }

      // Get metrics for all campaigns
      const campaignIds = campaigns.map(campaign => campaign._id);
      const metrics = await CampaignMetrics.find({
        campaign_id: { $in: campaignIds }
      }).lean();

      console.log('Found metrics for campaigns:', metrics.length);

      // Create a map of campaign metrics
      const metricsMap = new Map();
      metrics.forEach(metric => {
        metricsMap.set(metric.campaign_id.toString(), metric);
      });

      // Get influencer details for each campaign
      const influencerDetails = await CampaignInfluencers.find({
        campaign_id: { $in: campaignIds }
      })
        .populate('influencer_id', 'name profilePicUrl')
        .lean();

      console.log('Found influencer details for campaigns:', influencerDetails.length);

      // Create a map of campaign influencers
      const influencerMap = new Map();
      influencerDetails.forEach(detail => {
        const campaignId = detail.campaign_id.toString();
        if (!influencerMap.has(campaignId)) {
          influencerMap.set(campaignId, []);
        }
        if (detail.influencer_id) {
          influencerMap.get(campaignId).push({
            id: detail.influencer_id._id,
            name: detail.influencer_id.name,
            profilePicUrl: detail.influencer_id.profilePicUrl
          });
        }
      });

      // Map campaigns with their metrics and influencers
      const result = campaigns.map(campaign => {
        const campaignMetrics = metricsMap.get(campaign._id.toString()) || {};
        return {
          ...campaign,
          performance_score: campaignMetrics.performance_score || 0,
          engagement_rate: campaignMetrics.engagement_rate || 0,
          reach: campaignMetrics.reach || 0,
          conversion_rate: campaignMetrics.conversion_rate || 0,
          influencers: influencerMap.get(campaign._id.toString()) || []
        };
      });

      console.log('Returning processed campaigns:', result.length);
      return result;
    } catch (err) {
      console.error('Error fetching campaign history:', err);
      return [];
    }
  }

  // Get campaign requests for a brand
  static async getCampaignRequests(brandId) {
    try {
      const requests = await CampaignInfo.find({
        brand_id: new mongoose.Types.ObjectId(brandId),
        status: 'request'
      }).sort({ created_at: -1 }).lean();

      // Get influencer counts for each campaign
      const campaignIds = requests.map(request => request._id);
      const influencerCounts = await CampaignInfluencers.aggregate([
        {
          $match: {
            campaign_id: { $in: campaignIds },
            status: 'active'
          }
        },
        {
          $group: {
            _id: '$campaign_id',
            count: { $sum: 1 }
          }
        }
      ]);

      // Create a map for quick lookup
      const influencerCountMap = new Map();
      influencerCounts.forEach(count => {
        influencerCountMap.set(count._id.toString(), count.count);
      });

      // Add influencer count to each request
      return requests.map(request => ({
        ...request,
        influencers_count: influencerCountMap.get(request._id.toString()) || 0
      }));
    } catch (error) {
      console.error('Error getting campaign requests:', error);
      return [];
    }
  }

  // Get campaigns that have reached 100% progress but are still active
  static async getCompletedProgressCampaigns(brandId) {
    try {
      const brandObjectId = new mongoose.Types.ObjectId(brandId);

      // Find active campaigns
      const activeCampaigns = await CampaignInfo.find({
        brand_id: brandObjectId,
        status: 'active'
      }).lean();

      if (activeCampaigns.length === 0) {
        return [];
      }

      const campaignIds = activeCampaigns.map(c => c._id);

      // Get metrics with 100% overall progress
      const metrics = await CampaignMetrics.find({
        campaign_id: { $in: campaignIds },
        overall_progress: { $gte: 100 }
      }).lean();

      const completedProgressCampaignIds = new Set(
        metrics.map(m => m.campaign_id.toString())
      );

      // Return campaigns that have reached 100% progress
      return activeCampaigns
        .filter(campaign => completedProgressCampaignIds.has(campaign._id.toString()))
        .map(campaign => ({
          _id: campaign._id,
          title: campaign.title,
          description: campaign.description,
          start_date: campaign.start_date,
          end_date: campaign.end_date,
          budget: campaign.budget
        }));
    } catch (error) {
      console.error('Error getting completed progress campaigns:', error);
      return [];
    }
  }
}

module.exports = brandModel;