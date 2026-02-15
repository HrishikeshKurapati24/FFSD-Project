const { brandModel, SubscriptionService } = require('../models/brandModel');
const { getAllInfluencers } = require('../models/influencerModel');
const { CampaignInfo, CampaignInfluencers, CampaignPayments } = require('../config/CampaignMongo');
const { Order } = require('../config/OrderMongo');
const { uploadProfilePic, uploadBanner, deleteOldImage, getImageUrl, handleUploadError } = require('../utils/imageUpload');
const { validationResult } = require('express-validator');

const platformIconMap = {
  instagram: 'instagram',
  youtube: 'youtube',
  tiktok: 'tiktok',
  facebook: 'facebook',
  twitter: 'twitter',
  linkedin: 'linkedin'
};

const toArrayField = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean);
      }
    } catch (error) {
      // Fall through to comma separated fallback
    }
    return value.split(',').map(item => item.trim()).filter(Boolean);
  }
  return [];
};

const buildSocialSummaries = (socialStats = []) => socialStats.map(stat => {
  const platform = (stat.platform || 'link').toLowerCase();
  const followers = Number(stat.followers || 0);
  const avgLikes = stat.avgLikes !== undefined ? Number(stat.avgLikes) : Math.round(followers * 0.05);
  const avgComments = stat.avgComments !== undefined ? Number(stat.avgComments) : Math.round(followers * 0.01);
  const avgViews = stat.avgViews !== undefined
    ? Number(stat.avgViews)
    : (platform === 'youtube' ? Math.round(followers * 2) : Math.round(followers * 0.1));

  return {
    platform,
    name: stat.platform ? stat.platform.charAt(0).toUpperCase() + stat.platform.slice(1) : 'Platform',
    icon: platformIconMap[platform] || 'link',
    followers,
    avgLikes,
    avgComments,
    avgViews
  };
});

const buildBestPosts = (topCampaigns = []) => topCampaigns.slice(0, 6).map(campaign => {
  const reach = Number(campaign.reach || 0);
  return {
    id: campaign._id || campaign.id,
    title: campaign.title || 'Campaign',
    thumbnail: campaign.thumbnail || '/images/default-campaign.jpg',
    platform: (campaign.platform || 'link').toLowerCase(),
    likes: campaign.likes || Math.round(reach * 0.05),
    comments: campaign.comments || Math.round(reach * 0.01),
    views: campaign.views || reach,
    url: campaign.url || '#'
  };
});

const calculatePerformanceOverview = (brandData = {}, socialStats = []) => {
  const totalFollowers = socialStats.reduce((sum, stat) => sum + Number(stat.followers || 0), 0);
  const fallbackEngagement = socialStats.length
    ? socialStats.reduce((sum, stat) => sum + Number(stat.engagementRate || 3), 0) / socialStats.length
    : 3.5;
  const avgEngagementRateValue = Number(brandData.avgEngagementRate ?? fallbackEngagement);
  const avgEngagementRate = Number(avgEngagementRateValue.toFixed(1));

  const reach = brandData.performanceMetrics?.reach || Math.floor(totalFollowers * (avgEngagementRate / 100) * 10);
  const impressions = brandData.performanceMetrics?.impressions || Math.floor(reach * 3);
  const engagement = brandData.performanceMetrics?.engagement || Math.floor(impressions * (avgEngagementRate / 100));
  const conversionSeed = brandData.performanceMetrics?.conversionRate ?? brandData.conversionRate ?? 2.5;
  const conversionRate = Number(Number(conversionSeed || 0).toFixed(1));

  return {
    totalFollowers,
    avgEngagementRate,
    performanceMetrics: {
      reach,
      impressions,
      engagement,
      conversionRate
    }
  };
};

const transformBrandProfile = (brandDoc, socialStats = [], topCampaigns = []) => {
  if (!brandDoc) {
    return null;
  }
  const brandData = brandDoc.toObject ? brandDoc.toObject() : brandDoc;
  const categories = toArrayField(brandData.categories);
  const languages = toArrayField(brandData.languages);
  const socials = buildSocialSummaries(socialStats);
  const bestPosts = buildBestPosts(topCampaigns);
  const { totalFollowers, avgEngagementRate, performanceMetrics } = calculatePerformanceOverview(brandData, socialStats);

  return {
    ...brandData,
    displayName: brandData.displayName || brandData.brandName || brandData.name || 'Unknown Brand',
    fullName: brandData.fullName || brandData.displayName || brandData.brandName || 'Unknown Brand',
    name: brandData.brandName || brandData.displayName || 'Unknown Brand',
    username: brandData.username || '',
    bio: brandData.bio || brandData.mission || 'No bio available',
    description: brandData.description || brandData.bio || '',
    profilePicUrl: brandData.logoUrl || brandData.profilePicUrl || '/images/default-brand.png',
    totalFollowers,
    avgEngagementRate,
    completedCollabs: topCampaigns.length,
    rating: brandData.rating || brandData.avgCampaignRating || 0,
    socials,
    bestPosts,
    performanceMetrics,
    audienceDemographics: {
      gender: brandData.targetGender || 'Mixed',
      ageRange: brandData.targetAgeRange || '18-45'
    },
    categories,
    languages,
    mission: brandData.mission || brandData.bio || '',
    website: brandData.website || `https://${brandData.username || 'brand'}.com`,
    location: brandData.location || '',
    values: categories,
    socialLinks: Array.isArray(brandData.socialLinks) && brandData.socialLinks.length > 0
      ? brandData.socialLinks
      : socials.map(social => ({
        platform: social.platform,
        url: social.url || `https://${social.platform}.com/${brandData.username || ''}`,
        followers: social.followers
      })),
    topCampaigns: topCampaigns.map(campaign => ({
      id: campaign.id || campaign._id,
      title: campaign.title,
      status: campaign.status || 'Active',
      performance_score: campaign.performance_score || 0,
      reach: campaign.reach || 0
    }))
  };
};

const buildCampaignHistoryPayload = (campaigns = []) => ({
  campaigns,
  summary: {
    totalCampaigns: campaigns.length
  }
});

// Get influencer rankings based on revenue from their links
const getInfluencerRankings = async (brandId) => {
  try {
    // Get all campaigns for this brand
    const campaigns = await CampaignInfo.find({ brand_id: brandId }).select('_id title');

    if (campaigns.length === 0) {
      return [];
    }

    const campaignIds = campaigns.map(c => c._id);

    // Aggregate campaign influencers by revenue for these campaigns
    const rankings = await CampaignInfluencers.aggregate([
      {
        $match: {
          campaign_id: { $in: campaignIds },
          status: { $in: ['active', 'completed'] }
        }
      },
      {
        $lookup: {
          from: 'influencerinfos',
          localField: 'influencer_id',
          foreignField: '_id',
          as: 'influencer'
        }
      },
      {
        $unwind: '$influencer'
      },
      {
        $group: {
          _id: '$influencer_id',
          name: { $first: '$influencer.fullName' },
          totalRevenue: { $sum: '$revenue' },
          campaignCount: { $addToSet: '$campaign_id' }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          totalRevenue: 1,
          campaignCount: { $size: '$campaignCount' }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      },
      {
        $limit: 10
      }
    ]);

    return rankings;
  } catch (error) {
    console.error('Error getting influencer rankings:', error);
    return [];
  }
};

const brandController = {
  // Get explore page
  async getExplorePage(req, res) {
    try {
      const { category, search } = req.query;
      const searchQuery = search || '';
      const selectedCategory = category || 'all';

      // Get all influencers first to extract categories
      const allInfluencers = await brandModel.getAllInfluencers();
      // Extract unique categories (from influencer profiles)
      const categoriesSet = new Set();
      allInfluencers.forEach(influencer => {
        if (influencer.categories && Array.isArray(influencer.categories)) {
          influencer.categories.forEach(cat => categoriesSet.add(cat.trim()));
        }
      });
      const categories = Array.from(categoriesSet).sort();

      // Filter influencers based on search and category
      let filteredInfluencers = allInfluencers;
      if (selectedCategory && selectedCategory !== 'all') {
        filteredInfluencers = filteredInfluencers.filter(influencer =>
          influencer.categories && influencer.categories.some(cat =>
            cat.toLowerCase().includes(selectedCategory.toLowerCase())
          )
        );
      }

      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        filteredInfluencers = filteredInfluencers.filter(influencer =>
          (influencer.fullName && influencer.fullName.toLowerCase().includes(searchLower)) ||
          (influencer.username && influencer.username.toLowerCase().includes(searchLower)) ||
          (influencer.bio && influencer.bio.toLowerCase().includes(searchLower)) ||
          (influencer.categories && influencer.categories.some(cat =>
            cat.toLowerCase().includes(searchLower)
          ))
        );
      }

      // Get brand ID from session to check previous collaborations
      const brandId = req.session.user?.id;
      let influencersWithCollaboration = filteredInfluencers;

      if (brandId) {
        // Get previous collaborations for this brand
        const collaborations = await CampaignInfluencers.find({
          campaign_id: {
            $in: await CampaignInfo.find({ brand_id: brandId }).distinct('_id')
          },
          status: { $in: ['active', 'completed'] }
        })
        .populate('campaign_id', 'title')
        .populate('influencer_id', '_id')
        .lean();

        // Create a map of influencer_id to their collaboration details
        const collaborationMap = {};
        collaborations.forEach(collab => {
          const influencerId = collab.influencer_id._id.toString();
          if (!collaborationMap[influencerId]) {
            collaborationMap[influencerId] = [];
          }
          collaborationMap[influencerId].push({
            campaignTitle: collab.campaign_id.title,
            revenue: collab.revenue || 0
          });
        });

        // Add collaboration info to influencers
        influencersWithCollaboration = filteredInfluencers.map(influencer => ({
          ...influencer,
          previousCollaborations: collaborationMap[influencer._id.toString()] || []
        }));

        // Add Rohan Joshi as a demo influencer with previous collaborations
        const demoInfluencer = {
          _id: 'demo-rohan-joshi',
          fullName: 'Rohan Joshi',
          displayName: 'Rohan Joshi',
          profilePicUrl: '/images/default-profile.jpg',
          verified: true,
          categories: ['Comedy', 'Writing', 'Acting', 'Entertainment'],
          totalFollowers: 2200000,
          avgEngagementRate: 4.10,
          audienceDemographics: {
            gender: 'Mixed',
            ageRange: '20-40'
          },
          previousCollaborations: [
            { campaignTitle: 'Summer Fashion Campaign', revenue: 25000 },
            { campaignTitle: 'Tech Gadgets Review', revenue: 18000 }
          ]
        };

        influencersWithCollaboration = [demoInfluencer, ...influencersWithCollaboration];
      }

      res.render('brand/explore', {
        influencers: influencersWithCollaboration,
        searchQuery,
        selectedCategory,
        categories
      });
    } catch (err) {
      console.error('Error fetching influencers:', err);
      res.status(500).render('error', {
        message: 'Error fetching influencers',
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

      const socialStats = await brandModel.getSocialStats(brandId);
      const topCampaigns = await brandModel.getTopCampaigns(brandId);
      const transformedBrand = transformBrandProfile(brand, socialStats, topCampaigns);

      const responseData = {
        success: true,
        brand: transformedBrand
      };

      // Return JSON for API requests (React frontend)
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json(responseData);
      }

      // Render EJS for traditional requests (legacy support)
      res.render('brand/profile', {
        brand: transformedBrand
      });
    } catch (error) {
      console.error('Error fetching brand profile:', error);

      // Return JSON for API requests
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({
          success: false,
          message: 'Error loading brand profile'
        });
      }

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
        brandName: data.name ? data.name.trim() : undefined,
        displayName: data.name ? data.name.trim() : undefined,
        username: data.username ? data.username.trim() : undefined,
        description: data.description ? data.description.trim() : undefined,
        bio: data.mission ? data.mission.trim() : (data.description ? data.description.trim() : undefined),
        location: (data.location || '').trim(),
        primaryMarket: (data.primaryMarket || '').trim(),
        phone: (data.phone || '').trim(),
        industry: (data.industry || '').trim(),
        tagline: (data.tagline || '').trim(),
        website: (data.website || '').trim(),
        audienceGender: (data.targetGender || '').trim(),
        audienceAgeRange: (data.targetAgeRange || '').trim(),
        categories: Array.isArray(data.categories) ? data.categories : [],
        mission: (data.mission || '').trim(),
        currentCampaign: (data.currentCampaign || '').trim(),
        values: Array.isArray(data.values) ? data.values : [],
        targetInterests: Array.isArray(data.targetInterests) ? data.targetInterests : []
      };

      console.log('Update data:', updateData);

      // Update social links if provided
      if (data.socialLinks && Array.isArray(data.socialLinks)) {
        try {
          const socialLinksPayload = data.socialLinks.map(link => {
            const url = link.url ? link.url.trim() : '';
            let handle = link.handle;

            if (!handle && url) {
              try {
                const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
                const pathParts = urlObj.pathname.split('/').filter(p => p);
                handle = pathParts.length > 0 ? pathParts[pathParts.length - 1] : 'brand';
              } catch (e) {
                handle = 'brand';
              }
            }

            return {
              platform: link.platform || 'instagram',
              url: url,
              followers: parseInt(link.followers) || 0,
              handle: handle || 'brand'
            };
          });

          await brandModel.updateSocialLinks(brandId, socialLinksPayload);
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
      const userType = 'brand';

      // Get success message if exists
      const successMessage = req.session.successMessage;
      // Clear the message after getting it
      delete req.session.successMessage;

      // Check subscription expiry and get limits
      const [subscriptionStatus, subscriptionLimits] = await Promise.all([
        SubscriptionService.checkSubscriptionExpiry(brandId, userType),
        SubscriptionService.getSubscriptionLimitsWithUsage(brandId, userType)
      ]);

      // Fetch all required data concurrently
      const [brand, stats, activeCampaigns, analytics, campaignRequests, recentCompletedCampaigns, completedProgressCampaigns, influencerRankings, brandProducts] = await Promise.all([
        brandModel.getBrandById(brandId),
        brandModel.getBrandStats(brandId),
        brandModel.getActiveCampaigns(brandId),
        brandModel.getBrandAnalytics(brandId),
        brandModel.getCampaignRequests(brandId),
        brandModel.getRecentCompletedCampaigns(brandId, 3),
        brandModel.getCompletedProgressCampaigns(brandId),
        getInfluencerRankings(brandId),
        (async () => {
          try {
            const { Product } = require('../config/ProductMongo');
            const products = await Product.find({
              brand_id: brandId
            })
              .populate('campaign_id', 'title status')
              .sort({ createdAt: -1 })
              .lean();

            return products.map(product => ({
              _id: product._id,
              name: product.name,
              description: product.description,
              images: product.images,
              original_price: product.original_price,
              campaign_price: product.campaign_price,
              discount_percentage: product.discount_percentage,
              category: product.category,
              tags: product.tags,
              target_quantity: product.target_quantity,
              sold_quantity: product.sold_quantity,
              status: product.status,
              campaign: product.campaign_id ? {
                title: product.campaign_id.title,
                status: product.campaign_id.status
              } : null,
              createdAt: product.createdAt
            }));
          } catch (error) {
            console.error('Error fetching brand products:', error);
            return [];
          }
        })()
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
          name: brand.brandName || brand.displayName || brand.name,
          username: brand.username,
          description: brand.bio,
          logoUrl: brand.profilePicUrl || brand.logoUrl || brand.logo_url,
          bannerUrl: brand.bannerUrl,
          verified: brand.verified,
          location: brand.location,
          primaryMarket: brand.primaryMarket,
          phone: brand.phone,
          industry: brand.industry,
          tagline: brand.tagline,
          targetInterests: parseCategories(brand.targetInterests),
          currentCampaign: brand.currentCampaign,
          values: parseCategories(brand.values),
          categories: parseCategories(brand.categories),
          mission: brand.mission,
          website: brand.website,
          targetAgeRange: brand.targetAgeRange,
          targetGender: brand.targetGender,
          socialLinks: brand.socialLinks || [] // Assuming we fetch partial or it's implicitly included?
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
        successMessage, // Add success message to the template data
        completedProgressCampaigns, // Campaigns with 100% progress that need to be marked as completed
        subscriptionStatus, // Subscription expiry and renewal info
        subscriptionLimits // Campaign and collaboration limits
      };

      // Return JSON for API requests (React frontend)
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({
          success: true,
          ...transformedData,
          recentCompletedCampaigns,
          influencerRankings,
          brandProducts
        });
      }

      // Render EJS for traditional requests
      res.render('brand/dashboard', { ...transformedData, recentCompletedCampaigns });
    } catch (error) {
      console.error('Error in getBrandDashboard:', error);

      // Return JSON for API requests
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({
          success: false,
          message: 'Error loading dashboard'
        });
      }

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
        const errorMessage = 'Please log in to view campaign history';

        // Return JSON for API requests
        if (req.xhr || req.headers.accept?.includes('application/json')) {
          return res.status(401).json({
            success: false,
            message: errorMessage
          });
        }

        return res.status(401).render('error', {
          error: { status: 401 },
          message: errorMessage
        });
      }

      // Fetch all completed and cancelled campaigns
      const campaigns = await brandModel.getCampaignHistory(brandId);
      console.log('Retrieved campaigns:', campaigns.length);

      const transformedCampaigns = campaigns.map(campaign => ({
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
      }));
      const historyPayload = buildCampaignHistoryPayload(transformedCampaigns);

      // Return JSON for API requests (React frontend)
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({
          success: true,
          ...historyPayload
        });
      }

      // Render EJS for traditional requests
      res.render('brand/campaign_history', historyPayload);
    } catch (error) {
      console.error('Error in getCampaignHistory controller:', error);

      // Return JSON for API requests
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({
          success: false,
          message: 'Error loading campaign history'
        });
      }

      res.status(500).render('error', {
        error: { status: 500 },
        message: 'Error loading campaign history'
      });
    }
  },

  // Get list of influencers for a specific campaign (Level 1)
  async getCampaignInfluencers(req, res) {
    try {
      const { campaignId } = req.params;
      const brandId = req.session.user.id;

      if (!campaignId) {
        return res.status(400).json({ success: false, message: 'Campaign ID is required' });
      }

      // Verify campaign ownership
      const campaign = await CampaignInfo.findOne({
        _id: campaignId,
        brand_id: brandId
      });

      if (!campaign) {
        return res.status(404).json({ success: false, message: 'Campaign not found' });
      }

      // Fetch influencers
      const influencers = await CampaignInfluencers.find({
        campaign_id: campaignId,
        status: { $in: ['active', 'completed'] }
      })
        .populate('influencer_id', 'fullName username profilePicUrl')
        .lean();

      const formattedInfluencers = influencers.map(inf => ({
        influencer_id: inf.influencer_id._id,
        name: inf.influencer_id.fullName,
        username: inf.influencer_id.username,
        profilePicUrl: inf.influencer_id.profilePicUrl || '/images/default-profile.jpg',
        status: inf.status,
        progress: inf.progress || 0,
        joined_at: inf.createdAt
      }));

      res.json({
        success: true,
        influencers: formattedInfluencers
      });
    } catch (error) {
      console.error('Error fetching campaign influencers:', error);
      res.status(500).json({ success: false, message: 'Error fetching influencers' });
    }
  },

  // Get detailed contribution of an influencer for a campaign (Level 2)
  async getInfluencerContribution(req, res) {
    try {
      const { campaignId, influencerId } = req.params;
      const brandId = req.session.user.id;

      if (!campaignId || !influencerId) {
        return res.status(400).json({ success: false, message: 'Campaign ID and Influencer ID are required' });
      }

      // Verify campaign ownership
      const campaign = await CampaignInfo.findOne({
        _id: campaignId,
        brand_id: brandId
      }).select('title');

      if (!campaign) {
        return res.status(404).json({ success: false, message: 'Campaign not found' });
      }

      // Fetch active/completed participation
      const participation = await CampaignInfluencers.findOne({
        campaign_id: campaignId,
        influencer_id: influencerId,
        status: { $in: ['active', 'completed'] }
      })
        .populate('influencer_id', 'fullName profilePicUrl')
        .lean();

      if (!participation) {
        return res.status(404).json({ success: false, message: 'Influencer is not part of this campaign' });
      }

      // Fetch payment details (Single payment model)
      const payment = await CampaignPayments.findOne({
        campaign_id: campaignId,
        influencer_id: influencerId,
        status: 'completed'
      }).select('amount');

      const totalPaid = payment ? payment.amount : 0;

      res.json({
        success: true,
        influencer: {
          name: participation.influencer_id.fullName,
          profilePicUrl: participation.influencer_id.profilePicUrl || '/images/default-profile.jpg'
        },
        campaign: {
          title: campaign.title
        },
        contribution: {
          progress: participation.progress || 0,
          deliverables: participation.deliverables || [],
          metrics: {
            engagement_rate: participation.engagement_rate || 0,
            reach: participation.reach || 0,
            clicks: participation.clicks || 0,
            conversions: participation.conversions || 0
          },
          earnings: totalPaid
        }
      });
    } catch (error) {
      console.error('Error fetching influencer contribution:', error);
      res.status(500).json({ success: false, message: 'Error fetching contribution details' });
    }
  },

  // Get products for brand
  async getBrandProducts(req, res) {
    try {
      const brandId = req.session.user.id;
      const { Product } = require('../config/ProductMongo');

      const products = await Product.find({
        brand_id: brandId,
        status: { $in: ['active', 'inactive'] }
      })
        .populate('campaign_id', 'title status')
        .sort({ createdAt: -1 })
        .lean();

      const formattedProducts = products.map(product => ({
        _id: product._id,
        name: product.name,
        description: product.description,
        images: product.images,
        original_price: product.original_price,
        campaign_price: product.campaign_price,
        discount_percentage: product.discount_percentage,
        category: product.category,
        tags: product.tags,
        target_quantity: product.target_quantity,
        sold_quantity: product.sold_quantity,
        status: product.status,
        campaign: product.campaign_id ? {
          title: product.campaign_id.title,
          status: product.campaign_id.status
        } : null,
        createdAt: product.createdAt
      }));

      res.json({
        success: true,
        products: formattedProducts
      });
    } catch (error) {
      console.error('Error fetching brand products:', error);
      res.status(500).json({ success: false, message: 'Error fetching products' });
    }
  }
};

brandController.transformBrandProfileForClient = transformBrandProfile;

module.exports = brandController;