// controller/brandController.js
const brandModel = require('../models/brandModel');
const { uploadProfilePic, uploadBanner, deleteOldImage, getImageUrl, handleUploadError } = require('../utils/imageUpload');
const { validationResult } = require('express-validator');

const brandController = {
  // Get explore page
  async getExplorePage(req, res) {
    try {
      const brands = await brandModel.getAllBrands();
      res.render('influencer/explore', { brands });
    } catch (err) {
      console.error('Error fetching brands:', err);
      res.status(500).render('error', {
        message: 'Error fetching brands',
        error: { status: 500 }
      });
    }
  },

  // Get brand profile
  async getBrandProfile(req, res) {
    try {
      const brandId = req.session.user.id;
      const brand = await brandModel.getBrandById(brandId);

      if (!brand) {
        return res.status(404).render('error', {
          error: { status: 404 },
          message: 'Brand not found'
        });
      }

      // Get additional data needed for the profile
      const socialStats = await brandModel.getSocialStats(brandId);
      const topCampaigns = await brandModel.getTopCampaigns(brandId);
      const verificationStatus = await brandModel.getVerificationStatus(brandId);

      // Helper function to safely parse categories
      const parseCategories = (categories) => {
        if (!categories) return [];
        if (Array.isArray(categories)) return categories;
        if (typeof categories === 'string') {
          try {
            return JSON.parse(categories);
          } catch (e) {
            // If JSON parsing fails, try splitting by comma
            return categories.split(',').map(cat => cat.trim()).filter(Boolean);
          }
        }
        return [];
      };

      // Transform brand data for the template
      const transformedBrand = {
        ...brand,
        name: brand.displayName || brand.name,
        username: brand.username,
        description: brand.bio,
        logoUrl: brand.logoUrl,
        bannerUrl: brand.bannerUrl,
        verified: brand.verified,
        primaryMarket: brand.location,
        values: parseCategories(brand.categories),
        mission: brand.bio,
        currentCampaign: 'Increase brand awareness and engagement',
        socialLinks: socialStats.map(stat => ({
          platform: stat.platform,
          url: `https://${stat.platform}.com/${brand.username}`,
          followers: stat.followers
        })),
        totalAudience: socialStats.reduce((sum, stat) => sum + stat.followers, 0),
        website: `https://${brand.username}.com`,
        targetAgeRange: brand.targetAgeRange,
        targetGender: brand.targetGender,
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

      res.render('brand/profile', {
        brand: transformedBrand
      });
    } catch (error) {
      console.error('Error fetching brand profile:', error);
      res.status(500).render('error', {
        error: { status: 500 },
        message: 'Error loading brand profile'
      });
    }
  },

  // Update brand profile
  async updateBrandProfile(req, res) {
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
      const brandId = req.session.user.id;
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
      const brandId = req.session.user.id;
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
      const brandId = req.session.user.id;
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
      const brandId = req.session.user.id;
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
      const brandId = req.session.user.id;
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
      const brandId = req.session.user.id;
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
      // Get brand ID from session
      const brandId = req.session.user.id;

      // Get success message if exists
      const successMessage = req.session.successMessage;
      // Clear the message after getting it
      delete req.session.successMessage;

      // Fetch all required data concurrently
      const [brand, stats, activeCampaigns, topInfluencers, analytics, campaignRequests, recentCompletedCampaigns] = await Promise.all([
        brandModel.getBrandById(brandId),
        brandModel.getBrandStats(brandId),
        brandModel.getActiveCampaigns(brandId),
        brandModel.getTopInfluencers(brandId),
        brandModel.getBrandAnalytics(brandId),
        brandModel.getCampaignRequests(brandId),
        brandModel.getRecentCompletedCampaigns(brandId, 3)
      ]);

      if (!brand) {
        return res.status(404).render('error', {
          status: 404,
          message: 'Brand not found'
        });
      }

      // Helper function to safely parse categories
      const parseCategories = (categories) => {
        if (!categories) return [];
        if (Array.isArray(categories)) return categories;
        if (typeof categories === 'string') {
          try {
            // First try parsing as JSON
            return JSON.parse(categories);
          } catch (e) {
            // If JSON parsing fails, try splitting by comma
            return categories.split(',').map(cat => cat.trim()).filter(Boolean);
          }
        }
        return [];
      };

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
          values: parseCategories(brand.categories),
          categories: parseCategories(brand.categories),
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
        campaignRequests: campaignRequests.map(request => ({
          _id: request._id,
          title: request.title,
          description: request.description,
          status: request.status,
          start_date: request.start_date,
          duration: request.duration,
          budget: request.budget,
          target_audience: request.target_audience,
          required_channels: request.required_channels,
          min_followers: request.min_followers,
          objectives: request.objectives,
          influencers_count: request.influencers_count || 0
        })),
        topInfluencers: topInfluencers.map(influencer => ({
          _id: influencer._id,
          name: influencer.fullName || 'Unknown',
          username: influencer.username || 'unknown',
          profilePicUrl: influencer.profilePicUrl || '/images/default-avatar.jpg',
          avgEngagement: influencer.avgEngagement || 0,
          followers: influencer.followers || 0,
          categories: influencer.categories || [],
          categoryMatchPercentage: influencer.categoryMatchPercentage || 0,
          matchingCategories: influencer.matchingCategories || 0,
          campaignCount: influencer.campaignCount || 0
        })),
        analytics: {
          months: analytics.months || [],
          engagementRates: analytics.engagementRates || [],
          clickThroughRates: analytics.clickThroughRates || [],
          productsSold: analytics.productsSold || [],
          conversionRates: analytics.conversionRates || [],
          demographics: analytics.demographics || {
            labels: ['18-24', '25-34', '35-44', '45-54', '55+'],
            data: [25, 35, 20, 15, 5]
          }
        },
        successMessage // Add success message to the template data
      };

      res.render('brand/dashboard', { ...transformedData, recentCompletedCampaigns });
    } catch (error) {
      console.error('Error in getBrandDashboard:', error);
      res.status(500).render('error', {
        status: 500,
        message: 'Error loading dashboard'
      });
    }
  },

  // Get campaign history
  async getCampaignHistory(req, res) {
    try {
      const brandId = req.session.user.id;
      console.log('Getting campaign history for brand:', brandId);

      if (!brandId) {
        console.error('No brand ID found in session');
        return res.status(401).render('error', {
          error: { status: 401 },
          message: 'Please log in to view campaign history'
        });
      }

      // Fetch all completed and cancelled campaigns
      const campaigns = await brandModel.getCampaignHistory(brandId);
      console.log('Retrieved campaigns:', campaigns.length);

      res.render('brand/campaign_history', {
        campaigns: campaigns.map(campaign => ({
          ...campaign,
          performance_score: campaign.performance_score || 0,
          engagement_rate: campaign.engagement_rate || 0,
          reach: campaign.reach || 0,
          conversion_rate: campaign.conversion_rate || 0,
          influencers_count: campaign.influencers?.length || 0,
          budget: campaign.budget || 0,
          end_date: campaign.end_date,
          status: campaign.status,
          title: campaign.title,
          description: campaign.description,
          influencers: campaign.influencers || []
        }))
      });
    } catch (error) {
      console.error('Error in getCampaignHistory controller:', error);
      res.status(500).render('error', {
        error: { status: 500 },
        message: 'Error loading campaign history'
      });
    }
  }
};

module.exports = brandController;