// controller/brandController.js
const brandModel = require('../models/brandModel');
const { uploadProfilePic, uploadBanner, deleteOldImage, getImageUrl, handleUploadError } = require('../utils/imageUpload');
const { validationResult } = require('express-validator');

const brandController = {
  async getExplorePage(req, res) {
    brandModel.getAllBrands((err, brands) => {
      if (err) {
        res.status(500).send('Error fetching brands');
      } else {
        res.render('influencer/I_explore', { brands });
      }
    });
  },

  // Get brand profile
  async getBrandProfile(req, res) {
    try {
      const brandId = 1; // Get from params or authenticated user
      const brand = await brandModel.getBrandById(brandId);

      if (!brand) {
        return res.status(404).render('error', {
          status: 404,
          message: 'Brand not found'
        });
      }

      // Get additional data needed for the profile
      const socialStats = await brandModel.getSocialStats(brandId);
      const topCampaigns = await brandModel.getTopCampaigns(brandId);
      const verificationStatus = await brandModel.getVerificationStatus(brandId);

      // Transform brand data for the template
      const transformedBrand = {
        ...brand,
        name: brand.displayName || brand.name,
        username: brand.username,
        description: brand.bio,
        logoUrl: brand.profilePicUrl || brand.logo_url,
        bannerUrl: brand.bannerUrl,
        verified: brand.verified,
        primaryMarket: brand.location,
        values: JSON.parse(brand.categories || '[]'),
        categories: JSON.parse(brand.categories || '[]'),
        mission: brand.bio,
        currentCampaign: 'Increase brand awareness and engagement',
        socialLinks: socialStats.map(stat => ({
          platform: stat.platform,
          url: `https://${stat.platform}.com/${brand.username}`,
          followers: stat.followers
        })),
        totalAudience: socialStats.reduce((sum, stat) => sum + stat.followers, 0),
        website: `https://${brand.username}.com`,
        targetAgeRange: brand.audienceAgeRange,
        targetGender: brand.audienceGender,
        targetInterests: JSON.parse(brand.categories || '[]'),
        completedCampaigns: topCampaigns.length,
        influencerPartnerships: Math.round(topCampaigns.length * 2.5),
        avgCampaignRating: brand.rating || 4.5,
        topCampaigns: topCampaigns.map(campaign => ({
          id: campaign.id,
          title: campaign.title,
          status: campaign.status || 'Active',
          performance_score: campaign.performance_score || 0,
          reach: campaign.reach || 0
        }))
      };

      res.render('brand/B2_profile2', {
        brand: transformedBrand
      });
    } catch (error) {
      console.error('Error fetching brand profile:', error);
      res.status(500).render('error', {
        status: 500,
        message: 'Error loading brand profile'
      });
    }
  },

  // Update brand profile
  async updateBrandProfile(req, res) {
    try {
      // Get the data directly from req.body since it's already parsed by express.json()
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

      const brandId = req.session.brandId || 1; // Get from session or fallback to 1 for testing

      // Prepare update data from request body
      const updateData = {
        name: data.name.trim(),
        username: data.username.trim(),
        bio: (data.description || '').trim(),
        location: (data.primaryMarket || '').trim(),
        website: (data.website || '').trim(),
        audienceGender: (data.targetGender || '').trim(),
        audienceAgeRange: (data.targetAgeRange || '').trim(),
        categories: JSON.stringify(Array.isArray(data.categories) ? data.categories : []),
        mission: (data.mission || '').trim(),
        currentCampaign: (data.currentCampaign || '').trim(),
        "values": JSON.stringify(Array.isArray(data.values) ? data.values : []),
        targetInterests: JSON.stringify(Array.isArray(data.targetInterests) ? data.targetInterests : [])
      };

      console.log('Update data:', updateData);

      // Update social links if provided
      if (data.socialLinks && Array.isArray(data.socialLinks)) {
        try {
          const socialLinks = data.socialLinks.reduce((acc, link) => {
            if (link.platform && link.url) {
              acc[link.platform] = {
                url: link.url.trim(),
                followers: parseInt(link.followers) || 0
              };
            }
            return acc;
          }, {});

          await brandModel.updateSocialLinks(brandId, socialLinks);
        } catch (error) {
          console.error('Error updating social links:', error);
        }
      }

      // Update the brand profile
      const updatedBrand = await brandModel.updateBrandProfile(brandId, updateData);

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
  },

  // Request verification
  async requestVerification(req, res) {
    try {
      const brandId = 1;
      const verificationRequest = await brandModel.requestVerification(brandId, req.body);

      res.json({
        success: true,
        message: 'Verification request submitted',
        request: verificationRequest
      });
    } catch (error) {
      console.error('Error submitting verification request:', error);
      res.status(500).json({
        success: false,
        message: 'Error submitting verification request'
      });
    }
  },

  // Get verification status
  async getVerificationStatus(req, res) {
    try {
      const brandId = 1;
      const status = await brandModel.getVerificationStatus(brandId);

      res.json({
        success: true,
        status
      });
    } catch (error) {
      console.error('Error getting verification status:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting verification status'
      });
    }
  },

  // Update social media links
  async updateSocialLinks(req, res) {
    try {
      const brandId = 1;
      const { socials } = req.body;

      const updatedBrand = await brandModel.updateSocialLinks(brandId, socials);

      res.json({
        success: true,
        message: 'Social links updated successfully',
        brand: updatedBrand
      });
    } catch (error) {
      console.error('Error updating social links:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating social links'
      });
    }
  },

  // Get brand statistics
  async getBrandStats(req, res) {
    try {
      const brandId = 1;
      const stats = await brandModel.getBrandStats(brandId);

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Error getting brand statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting brand statistics'
      });
    }
  },

  // Get top performing campaigns
  async getTopCampaigns(req, res) {
    try {
      const brandId = 1;
      const campaigns = await brandModel.getTopCampaigns(brandId);

      res.json({
        success: true,
        campaigns
      });
    } catch (error) {
      console.error('Error getting top campaigns:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting top campaigns'
      });
    }
  },

  // Get brand analytics
  async getBrandAnalytics(req, res) {
    try {
      const brandId = 1;
      const analytics = await brandModel.getBrandAnalytics(brandId);

      res.json({
        success: true,
        analytics
      });
    } catch (error) {
      console.error('Error getting brand analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting brand analytics'
      });
    }
  },

  // Get brand dashboard
  async getBrandDashboard(req, res) {
    try {
      // Get brand ID from session or params
      const brandId = req.session.brandId || 1; // Fallback to 1 for testing

      // Fetch all required data concurrently
      const [brand, stats, activeCampaigns, topInfluencers, analytics, notifications] = await Promise.all([
        brandModel.getBrandById(brandId),
        brandModel.getBrandStats(brandId),
        brandModel.getActiveCampaigns(brandId),
        brandModel.getTopInfluencers(brandId),
        brandModel.getBrandAnalytics(brandId),
        brandModel.getNotifications(brandId)
      ]);

      if (!brand) {
        return res.status(404).render('error', {
          status: 404,
          message: 'Brand not found'
        });
      }

      // Transform data for the template
      const transformedData = {
        brand: {
          ...brand,
          name: brand.displayName || brand.name,
          username: brand.username,
          description: brand.bio,
          logoUrl: brand.profilePicUrl || brand.logo_url,
          bannerUrl: brand.bannerUrl,
          verified: brand.verified,
          primaryMarket: brand.location,
          values: JSON.parse(brand.categories || '[]'),
          categories: JSON.parse(brand.categories || '[]'),
          mission: brand.bio
        },
        stats: {
          activeCampaigns: stats?.total_campaigns || 0,
          campaignGrowth: stats?.campaign_growth || 0,
          avgEngagement: stats?.avg_engagement || 0,
          engagementTrend: stats?.engagement_trend || 0,
          totalReach: stats?.total_reach || 0,
          reachGrowth: stats?.reach_growth || 0,
          roi: stats?.roi || 0,
          roiTrend: stats?.roi_trend || 0,
          totalClicks: stats?.total_clicks || 0,
          totalRevenue: stats?.total_revenue || 0,
          totalSpend: stats?.total_spend || 0
        },
        activeCampaigns: activeCampaigns.map(campaign => ({
          ...campaign,
          progress: Math.min(100, Math.max(0, campaign.progress || 0)),
          engagement_rate: campaign.engagement_rate || 0,
          reach: campaign.reach || 0,
          conversion_rate: campaign.conversion_rate || 0,
          daysRemaining: Math.max(0, Math.ceil((new Date(campaign.end_date) - new Date()) / (1000 * 60 * 60 * 24))),
          influencersCount: campaign.influencers_count || 0
        })),
        topInfluencers: topInfluencers.map(influencer => ({
          ...influencer,
          profilePicUrl: influencer.profile_pic_url || '/images/default-avatar.jpg',
          avgEngagement: influencer.avgEngagement || 0,
          followers: influencer.followers || 0
        })),
        analytics: {
          months: analytics?.map(a => a.month) || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          engagementRates: analytics?.map(a => a.avg_engagement || 0) || [5, 6, 7, 8, 9, 10],
          clickThroughRates: analytics?.map(a => {
            const clicks = a.total_clicks || 0;
            const impressions = a.total_impressions || 1;
            return (clicks / impressions) * 100;
          }) || [2, 3, 4, 5, 6, 7],
          productsSold: analytics?.map(a => a.total_conversions || 0) || [100, 150, 200, 250, 300, 350],
          conversionRates: analytics?.map(a => a.avg_conversion_rate || 0) || [1, 2, 3, 4, 5, 6],
          demographics: {
            labels: ['18-24', '25-34', '35-44', '45-54', '55+'],
            data: [25, 35, 20, 15, 5]
          }
        },
        notifications: notifications || []
      };

      res.render('brand/B2_index', transformedData);
    } catch (error) {
      console.error('Error in getBrandDashboard:', error);
      res.status(500).render('error', {
        status: 500,
        message: 'Error loading brand dashboard'
      });
    }
  }
};

module.exports = brandController;