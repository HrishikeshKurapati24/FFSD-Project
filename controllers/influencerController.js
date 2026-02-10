// controllers/influencerController.js
const influencerModel = require('../models/influencerModel');
const collaborationModel = require('../models/CollaborationModel');
const { brandModel, SubscriptionService } = require('../models/brandModel');
const path = require('path');
const fs = require('fs');
const { CampaignInfluencers } = require('../config/CampaignMongo');
const notificationController = require('./notificationController');
const { mongoose } = require('mongoose');
const { uploadToCloudinary } = require('../utils/cloudinary');
const { InfluencerInfo } = require('../config/InfluencerMongo');

// Get influencer dashboard data
const getInfluencerDashboard = async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user || !req.session.user.id) {
      console.error('No user session found');
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      return res.status(401).redirect('/login');
    }

    const influencerId = req.session.user.id;
    const userType = 'influencer';
    console.log('\n========== INFLUENCER DASHBOARD CONTROLLER ==========');
    console.log('Getting dashboard for influencer:', influencerId);
    console.log('UserType:', userType);

    // Check subscription expiry and get limits
    console.log('\n--- Fetching subscription data ---');
    const [subscriptionStatus, subscriptionLimits] = await Promise.all([
      SubscriptionService.checkSubscriptionExpiry(influencerId, userType),
      SubscriptionService.getSubscriptionLimitsWithUsage(influencerId, userType)
    ]);

    console.log('\n--- Subscription data received ---');
    console.log('subscriptionStatus:', JSON.stringify(subscriptionStatus, null, 2));
    console.log('subscriptionLimits:', JSON.stringify(subscriptionLimits, null, 2));

    // Get influencer profile data
    const influencer = await influencerModel.getInfluencerById(influencerId);
    if (!influencer) {
      console.error('Influencer not found for ID:', influencerId);
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(404).json({
          success: false,
          message: 'Influencer not found'
        });
      }
      return res.status(404).render('error', {
        message: 'Influencer not found',
        error: { status: 404 }
      });
    }

    console.log('Found influencer:', influencer);

    // Get active collaborations
    const activeCollaborations = await collaborationModel.getActiveCollaborations(influencerId);
    console.log('Active collaborations:', activeCollaborations);

    // Get pending requests
    const pendingRequests = await collaborationModel.getPendingRequests(influencerId);
    console.log('Pending requests:', pendingRequests);

    // Get brand invites
    const brandInvites = await collaborationModel.getBrandInvites(influencerId);
    console.log('Brand invites:', brandInvites);

    // Get sent requests
    const sentRequests = await collaborationModel.getSentRequests(influencerId);
    console.log('Sent requests:', sentRequests);

    // Calculate completion percentage and nearing completion count
    const completionPercentage = activeCollaborations.length > 0
      ? activeCollaborations.reduce((acc, collab) => acc + (collab.progress || 0), 0) / activeCollaborations.length
      : 0;

    const nearingCompletion = activeCollaborations.filter(collab => (collab.progress || 0) >= 75).length;

    // Get dashboard stats
    const stats = {
      activeCollaborations: activeCollaborations.length,
      completionPercentage: Math.round(completionPercentage),
      nearingCompletion: nearingCompletion,
      pendingRequests: pendingRequests.length,
      brandInvites: brandInvites.length,
      sentRequests: sentRequests.length,
      monthlyEarnings: influencer.monthlyEarnings || 0,
      earningsChange: 0, // We'll need to implement this later
      totalFollowers: influencer.metrics?.totalFollowers || 0,
      avgEngagementRate: influencer.metrics?.avgEngagementRate || 0,
      avgRating: influencer.metrics?.avgRating || 0,
      completedCollabs: influencer.metrics?.completedCollabs || 0,
      totalEarnings: influencer.monthlyEarnings * 12 || 0, // Simple calculation for now
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

    console.log('Dashboard stats:', stats);

    // Transform the influencer data with fallback values
    const transformedInfluencer = {
      name: influencer.name || influencer.displayName || 'Influencer',
      totalAudience: influencer.metrics?.totalFollowers || 0,
      avgEngagementRate: influencer.metrics?.avgEngagementRate || 0,
      monthlyEarnings: influencer.monthlyEarnings || 0,
      socials: influencer.socials || [],
      metrics: influencer.metrics || {},
      referralCode: influencer.referralCode // Added referralCode
    };

    console.log('Transformed influencer data:', transformedInfluencer);

    // Get recent completed campaigns (limit 3) for dashboard
    const fullHistory = await influencerModel.getCampaignHistory(influencerId);
    const recentCampaignHistory = (fullHistory || [])
      .sort((a, b) => new Date(b.end_date) - new Date(a.end_date))
      .slice(0, 3)
      .map(c => ({
        // Map from influencerModel.getCampaignHistory structure
        title: c.campaign_name || 'Untitled Campaign',
        description: c.description || c.objectives || c.target_audience || '',
        status: 'completed',
        end_date: c.end_date,
        performance_score: c.performance_score || 0,
        engagement_rate: c.engagement_rate || 0,
        reach: c.reach || 0,
        conversion_rate: c.conversion_rate || c.influencer_conversions || 0,
        budget: c.budget || 0,
        // additional fields if needed later
        brand_name: c.brand_name || '',
        brand_logo: c.brand_logo || '/images/default-brand.png',
        start_date: c.start_date || null,
        duration: c.duration || 0
      }));

    // Prepare response data
    const responseData = {
      influencer: transformedInfluencer,
      stats,
      activeCollaborations: activeCollaborations || [],
      pendingRequests: pendingRequests || [],
      brandInvites: brandInvites || [],
      sentRequests: sentRequests || [],
      recentCampaignHistory,
      subscriptionStatus, // Subscription expiry and renewal info
      subscriptionLimits, // Campaign and collaboration limits
      baseUrl: `${req.protocol}://${req.get('host')}`
    };

    // Return JSON for API requests (React frontend)
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        ...responseData
      });
    }

    // Render the dashboard with all data
    console.log('\n--- Rendering dashboard with data ---');
    console.log('Passing to EJS:');
    console.log('  - subscriptionStatus.subscription.planId.name:', subscriptionStatus?.subscription?.planId?.name);
    console.log('  - subscriptionLimits:', subscriptionLimits);

    res.render('influencer/dashboard', responseData);

    console.log('========== INFLUENCER DASHBOARD CONTROLLER END ==========\n');
  } catch (error) {
    console.error('Error in getInfluencerDashboard:', error);
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(500).json({
        success: false,
        message: 'Error loading dashboard'
      });
    }
    res.status(500).render('error', {
      message: 'Error loading dashboard',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Get influencer explore page
const getInfluencerExplorePage = async (req, res) => {
  try {
    const influencers = await influencerModel.getAllInfluencers();
    console.log('Controller sending influencers to view:', influencers);
    res.render('brand/B2_explore', { influencers: influencers || [] });
  } catch (err) {
    console.error('Controller error:', err);
    res.status(500).render('error', {
      message: 'Error fetching influencers',
      error: { status: 500 }
    });
  }
};

// Get brand explore page for influencer
const getBrandExplorePage = async (req, res) => {
  try {
    const { category, search } = req.query;
    const { BrandInfo } = require('../config/BrandMongo');

    // Build filter query
    let filter = { status: 'active' };

    if (category && category !== 'all') {
      filter.industry = { $regex: category, $options: 'i' };
    }

    if (search) {
      filter.$or = [
        { brandName: { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const brands = await BrandInfo.find(filter)
      .select('brandName username logoUrl bannerUrl industry location website mission tagline verified completedCampaigns influencerPartnerships avgCampaignRating primaryMarket influenceRegions')
      .sort({ verified: -1, avgCampaignRating: -1, completedCampaigns: -1 })
      .limit(50)
      .lean();

    // Get all unique industries for filter dropdown (from brand signup)
    const allIndustries = await BrandInfo.distinct('industry', { status: 'active' });
    const categories = allIndustries.filter(Boolean);
    const uniqueCategories = [...new Set(categories)].sort();

    console.log('Controller sending brands to view:', brands);
    const responseData = {
      brands: brands || [],
      categories: uniqueCategories,
      selectedCategory: category || 'all',
      searchQuery: search || ''
    };

    // Return JSON for API requests (React frontend)
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        ...responseData
      });
    }

    res.render('influencer/explore', responseData);
  } catch (err) {
    console.error('Controller error:', err);
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching brands'
      });
    }
    res.status(500).render('error', {
      message: 'Error fetching brands',
      error: { status: 500 }
    });
  }
};

// Get brand profile page for influencer
const getBrandProfilePage = async (req, res) => {
  try {
    const brandId = new mongoose.Types.ObjectId(req.params.id);
    if (!brandId) {
      return res.status(400).render('error', {
        message: 'Brand ID is required',
        error: { status: 400 }
      });
    }

    const brand = await brandModel.getBrandById(brandId);
    if (!brand) {
      return res.status(404).render('error', {
        message: 'Brand not found',
        error: { status: 404 }
      });
    }

    // Transform brand data as needed for the view
    const socialStats = await brandModel.getSocialStats(brandId);
    const topCampaigns = await brandModel.getTopCampaigns(brandId);
    const previousCollaborations = await brandModel.getPreviousCollaborations(brandId);
    const currentPartnerships = await brandModel.getCurrentPartnerships(brandId);

    console.log('Previous Collaborations:', previousCollaborations);
    console.log('Current Partnerships:', currentPartnerships);

    const transformedBrand = {
      ...brand.toObject ? brand.toObject() : brand,
      name: brand.displayName || brand.name,
      username: brand.username,
      description: brand.bio,
      logoUrl: brand.logoUrl,
      bannerUrl: brand.bannerUrl,
      verified: brand.verified,
      primaryMarket: brand.location,
      values: brand.values || [],
      mission: brand.mission || brand.bio,
      currentCampaign: brand.currentCampaign || '',
      socialLinks: socialStats.map(stat => ({
        platform: stat.platform,
        url: `https://${stat.platform}.com/${brand.username}`,
        followers: stat.followers
      })),
      totalAudience: socialStats.reduce((sum, stat) => sum + stat.followers, 0),
      website: brand.website || `https://${brand.username}.com`,
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
      })),
      previousCollaborations,
      currentPartnerships
    }

    const responseData = {
      brand: transformedBrand,
      influencer: req.session.user || {}
    };

    // Return JSON for API requests (React frontend)
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        ...responseData
      });
    }

    // Render the brand profile page
    res.render('influencer/brand_profile', responseData);
  } catch (error) {
    console.error('Error fetching brand profile:', error);
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(500).json({
        success: false,
        message: 'Error loading brand profile'
      });
    }
    res.status(500).render('error', {
      message: 'Error loading brand profile',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Get influencer profile page
const getInfluencerProfile = async (req, res) => {
  try {
    const influencerId = req.session.user.id;

    // Get influencer profile data
    const influencer = await influencerModel.getInfluencerProfileDetails(influencerId);

    if (!influencer) {
      return res.status(404).render('error', {
        message: 'Influencer profile not found',
        error: { status: 404 }
      });
    }

    // Get performance metrics
    const metrics = await influencerModel.getInfluencerMetrics(influencerId);

    // Get analytics for earnings
    const { InfluencerAnalytics } = require('../config/InfluencerMongo');
    const analytics = await InfluencerAnalytics.findOne({ influencerId: influencer._id || influencerId });

    // Get best performing posts
    const bestPosts = await influencerModel.getBestPerformingPosts(influencerId);

    // Format the data for the view
    const formattedInfluencer = {
      // Basic Profile Info
      displayName: influencer.displayName || influencer.name || '',
      username: influencer.username || '',
      email: influencer.email || '',
      website: influencer.website || '',
      bio: influencer.bio || '',
      location: influencer.location || '',
      phone: influencer.phone || '',
      niche: influencer.niche || '',
      profilePicUrl: influencer.profilePicUrl || influencer.profile_pic_url || '/images/default-avatar.jpg',
      bannerUrl: influencer.bannerUrl || influencer.banner_url || '/images/default-banner.jpg',
      verified: influencer.verified || false,
      createdAt: influencer.createdAt || influencer.created_at || new Date(),

      // Audience Info
      audienceAgeRange: influencer.audienceAgeRange || influencer.audience_age_range || '',
      audienceGender: influencer.audienceGender || influencer.audience_gender || '',
      primaryMarket: influencer.primaryMarket || influencer.influenceRegions || '',

      // Content Info
      categories: Array.isArray(influencer.categories) ? influencer.categories :
        (influencer.categories ? JSON.parse(influencer.categories) : []),
      languages: Array.isArray(influencer.languages) ? influencer.languages :
        (influencer.languages ? JSON.parse(influencer.languages) : []),
      bestPosts: bestPosts || [],

      // Performance Metrics
      totalFollowers: metrics?.totalFollowers || 0,
      avgEngagementRate: metrics?.avgEngagementRate || 0,
      avgRating: metrics?.avgRating || 0,
      completedCollabs: metrics?.completedCollabs || 0,
      monthlyEarnings: analytics?.monthlyEarnings || 0,

      // Social Media
      socials: Array.isArray(influencer.socials) ? influencer.socials.map(social => ({
        platform: social.platform || '',
        url: social.url || '',
        followers: social.followers || 0,
        avgLikes: social.avgLikes || 0,
        avgComments: social.avgComments || 0,
        avgViews: social.avgViews || 0
      })) : []
    };

    // Return JSON for API requests (React frontend)
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        influencer: formattedInfluencer
      });
    }

    // Render the profile page with the influencer data
    res.render('influencer/profile', { influencer: formattedInfluencer });
  } catch (error) {
    console.error('Error in getInfluencerProfile:', error);
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(500).json({
        success: false,
        message: 'Error loading profile'
      });
    }
    res.status(500).render('error', {
      message: 'Error loading profile',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Update influencer profile images
const updateInfluencerImages = async (req, res) => {
  try {
    const influencerId = req.session.user.id;
    if (!influencerId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const { profilePic, bannerImage } = req.files || {};
    const updateData = {};

    // Handle profile picture upload
    if (profilePic && profilePic.length > 0) {
      try {
        const profilePicUrl = await uploadToCloudinary(profilePic[0], 'influencer-profiles');
        if (profilePicUrl) {
          updateData.profilePicUrl = profilePicUrl;
        }
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        return res.status(500).json({
          success: false,
          message: 'Error uploading profile picture: ' + error.message
        });
      }
    }

    // Handle banner image upload
    if (bannerImage && bannerImage.length > 0) {
      try {
        const bannerUrl = await uploadToCloudinary(bannerImage[0], 'influencer-banners');
        if (bannerUrl) {
          updateData.bannerUrl = bannerUrl;
        }
      } catch (error) {
        console.error('Error uploading banner image:', error);
        return res.status(500).json({
          success: false,
          message: 'Error uploading banner image: ' + error.message
        });
      }
    }

    // Only update if we have new URLs
    if (Object.keys(updateData).length > 0) {
      try {
        // Update influencer in database
        const updatedInfluencer = await InfluencerInfo.findByIdAndUpdate(
          influencerId,
          { $set: updateData },
          { new: true, runValidators: true }
        );

        if (!updatedInfluencer) {
          return res.status(404).json({
            success: false,
            message: 'Influencer not found'
          });
        }

        return res.json({
          success: true,
          message: 'Images updated successfully',
          profile: {
            profilePicUrl: updatedInfluencer.profilePicUrl || updatedInfluencer.profile_pic_url,
            bannerUrl: updatedInfluencer.bannerUrl || updatedInfluencer.banner_url
          }
        });
      } catch (error) {
        console.error('Error updating influencer images in database:', error);
        return res.status(500).json({
          success: false,
          message: 'Error updating images in database: ' + error.message
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'No images provided for update'
      });
    }
  } catch (error) {
    console.error('Error in updateInfluencerImages:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating images',
      error: error.message
    });
  }
};

// Update influencer profile data
const updateInfluencerData = async (req, res) => {
  try {
    const influencerId = req.session.user.id;
    // Get current profile to compare changes
    const currentProfile = await influencerModel.getInfluencerById(influencerId);
    if (!currentProfile) {
      return res.status(404).json({
        success: false,
        message: 'Influencer profile not found'
      });
    }

    console.log('Update Request Body:', req.body);
    console.log('Update Request Socials:', req.body.socials);

    // Prepare update data
    const updateData = {
      name: req.body.displayName || currentProfile.name,
      username: req.body.username || currentProfile.username,
      bio: req.body.bio || currentProfile.bio,
      location: req.body.location || currentProfile.location,
      phone: req.body.phone || currentProfile.phone,
      niche: req.body.niche || currentProfile.niche,
      displayName: req.body.displayName || currentProfile.displayName || currentProfile.name,
      audienceGender: req.body.audienceGender || currentProfile.audienceGender || currentProfile.audience_gender,
      audienceAgeRange: req.body.audienceAgeRange || req.body.audienceAge || currentProfile.audienceAgeRange || currentProfile.audience_age_range,
      categories: Array.isArray(req.body.categories) ? req.body.categories :
        (req.body.categories ? [req.body.categories].filter(Boolean) : currentProfile.categories),
      languages: Array.isArray(req.body.languages) ? req.body.languages :
        (req.body.languages ? [req.body.languages].filter(Boolean) : currentProfile.languages),
      socials: req.body.socials || currentProfile.socials || currentProfile.social_media_links
    };

    // Only update if there are changes
    const hasChanges = Object.keys(updateData).some(key =>
      JSON.stringify(updateData[key]) !== JSON.stringify(currentProfile[key])
    );

    if (hasChanges) {
      await influencerModel.updateInfluencerProfile(influencerId, updateData);
    }

    return res.json({
      success: true,
      message: hasChanges ? 'Profile updated successfully' : 'No changes to update',
      profile: updateData
    });

  } catch (error) {
    console.error('Error updating influencer profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// Legacy function for backward compatibility
const updateInfluencerProfile = async (req, res) => {
  try {
    // Check if this is an image-only update
    const isImageOnlyUpdate = req.body.isImageOnlyUpdate === 'true' ||
      (req.files && Object.keys(req.files).length > 0 &&
        (!req.body.displayName && !req.body.username && !req.body.bio));

    if (isImageOnlyUpdate) {
      return updateInfluencerImages(req, res);
    } else {
      return updateInfluencerData(req, res);
    }
  } catch (error) {
    console.error('Error in updateInfluencerProfile:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// Get campaign history
const getCampaignHistory = async (req, res) => {
  try {
    const influencerId = req.session.user.id;
    console.log('Getting campaign history for influencer:', influencerId);

    if (!influencerId) {
      console.error('No influencer ID found in session');
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(401).json({
          success: false,
          message: 'Please log in to view campaign history'
        });
      }
      return res.status(401).render('error', {
        error: { status: 401 },
        message: 'Please log in to view campaign history'
      });
    }

    // Fetch completed campaigns with metrics and influencers
    const campaigns = await influencerModel.getCampaignHistory(influencerId);
    console.log('Retrieved campaigns:', campaigns.length);

    const responseData = {
      campaigns: campaigns.map(campaign => ({
        // Pass-through and normalize for template
        title: campaign.campaign_name,
        brand_id: campaign.brand_id,
        brand_name: campaign.brand_name,
        brand_logo: campaign.brand_logo,
        description: campaign.description,
        objectives: campaign.objectives,
        start_date: campaign.start_date,
        end_date: campaign.end_date,
        duration: campaign.duration || 0,
        budget: campaign.budget || 0,
        performance_score: campaign.performance_score || 0,
        engagement_rate: campaign.engagement_rate || 0,
        reach: campaign.reach || 0,
        clicks: campaign.clicks || 0,
        conversion_rate: campaign.conversion_rate || 0,
        impressions: campaign.impressions || 0,
        revenue: campaign.revenue || 0,
        roi: campaign.roi || 0,
        required_channels: campaign.required_channels || [],
        target_audience: campaign.target_audience || '',
        influencers: campaign.influencers || [],
        influencers_count: (campaign.influencers || []).length,
        status: campaign.status || 'completed'
      }))
    };

    // Return JSON for API requests (React frontend)
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        ...responseData
      });
    }

    res.render('influencer/campaign_history', responseData);
  } catch (error) {
    console.error('Error in getCampaignHistory controller:', error);
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
};

const updateProgress = async (req, res) => {
  try {
    const { collabId } = req.params;
    const { progress, reach, clicks, performance_score, conversions, engagement_rate, conversion_rate, impressions, revenue, roi } = req.body;

    if (!collabId || progress === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    // Validate progress value
    const progressValue = parseInt(progress);
    if (isNaN(progressValue) || progressValue < 0 || progressValue > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid progress value'
      });
    }

    // Get the collaboration to find the campaign_id
    const collab = await CampaignInfluencers.findById(collabId).populate({ path: 'campaign_id', select: 'brand_id' });
    if (!collab) {
      return res.status(404).json({
        success: false,
        message: 'Collaboration not found'
      });
    }

    // Update progress in CampaignInfluencers
    const result = await collaborationModel.updateCollaborationProgress(collabId, progressValue);

    // Update metrics in CampaignMetrics if provided
    if (reach !== undefined || clicks !== undefined || performance_score !== undefined || conversions !== undefined || engagement_rate !== undefined || conversion_rate !== undefined || impressions !== undefined || revenue !== undefined || roi !== undefined) {
      const CampaignMetrics = require('../config/CampaignMongo').CampaignMetrics;

      // Find existing metrics or create new ones
      let metrics = await CampaignMetrics.findOne({ campaign_id: collab.campaign_id?._id || collab.campaign_id });

      if (!metrics) {
        // Create new metrics document
        metrics = new CampaignMetrics({
          campaign_id: collab.campaign_id?._id || collab.campaign_id,
          brand_id: collab.campaign_id?.brand_id,
          performance_score: performance_score || 0,
          engagement_rate: engagement_rate || 0,
          reach: reach || 0,
          conversion_rate: conversion_rate || 0,
          clicks: clicks || 0,
          conversions: conversions || 0,
          impressions: impressions || 0,
          revenue: revenue || 0,
          roi: roi || 0
        });
      } else {
        // Update existing metrics
        if (reach !== undefined) metrics.reach = parseInt(reach) || 0;
        if (clicks !== undefined) metrics.clicks = parseInt(clicks) || 0;
        if (performance_score !== undefined) metrics.performance_score = parseFloat(performance_score) || 0;
        if (conversions !== undefined) metrics.conversions = parseInt(conversions) || 0;
        if (engagement_rate !== undefined) metrics.engagement_rate = parseFloat(engagement_rate) || 0;
        if (conversion_rate !== undefined) metrics.conversion_rate = parseFloat(conversion_rate) || 0;
        if (impressions !== undefined) metrics.impressions = parseInt(impressions) || 0;
        if (revenue !== undefined) metrics.revenue = parseFloat(revenue) || 0;
        if (roi !== undefined) metrics.roi = parseFloat(roi) || 0;
      }

      await metrics.save();
    }

    // Notify the brand that influencer updated progress
    try {
      const brandId = collab.campaign_id?.brand_id || (collab.campaign_id?._id ? collab.campaign_id._id : null);
      const influencerId = req.session.user.id;
      if (brandId) {
        const influencerInfo = await influencerModel.getInfluencerById(influencerId);
        await notificationController.createNotification({
          recipientId: brandId,
          recipientType: 'brand',
          senderId: influencerId,
          senderType: 'influencer',
          type: 'progress_updated',
          title: 'Campaign Progress Updated',
          body: `${influencerInfo?.displayName || influencerInfo?.name || 'An influencer'} updated progress to ${progressValue}% for a campaign.`,
          relatedId: collabId,
          data: { collabId, progress: progressValue }
        });
      }
    } catch (notifErr) {
      console.error('Error creating progress notification:', notifErr);
    }

    res.json({
      success: true,
      progress: progressValue,
      message: 'Progress and metrics updated successfully'
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating progress'
    });
  }
};

const getCollabDetails = async (req, res) => {
  try {
    const { collabId } = req.params;

    if (!collabId) {
      return res.status(400).json({
        success: false,
        message: 'Collaboration ID is required'
      });
    }

    // Get collaboration details from CampaignInfluencers
    const collab = await CampaignInfluencers.findById(collabId)
      .populate('campaign_id', 'title description budget duration')
      .populate('influencer_id', 'name')
      .populate('brand_id', 'brandName logoUrl');

    if (!collab) {
      return res.status(404).json({
        success: false,
        message: 'Collaboration not found'
      });
    }

    // Format dates
    const startDate = collab.start_date ? new Date(collab.start_date) : new Date();
    const endDate = collab.end_date ? new Date(collab.end_date) : new Date(startDate.getTime() + (collab.duration * 24 * 60 * 60 * 1000));

    // Calculate duration in days
    const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    res.json({
      success: true,
      collab: {
        id: collab._id,
        campaign_name: collab.campaign_id?.title || 'Untitled Campaign',
        brand_name: collab.brand_id?.brandName || 'Unknown Brand',
        brand_logo: collab.brand_id?.logoUrl || '/images/default-brand.png',
        progress: collab.progress || 0,
        duration: duration,
        budget: collab.campaign_id?.budget || 0,
        engagement_rate: collab.engagement_rate || 0,
        description: collab.campaign_id?.description || 'No description available',
        start_date: startDate,
        end_date: endDate,
        deliverables: collab.deliverables || [],
        performance_score: collab.performance_score || 0,
        reach: collab.reach || 0,
        clicks: collab.clicks || 0,
        conversions: collab.conversions || 0,
        status: collab.status || 'active'
      }
    });
  } catch (error) {
    console.error('Error in getCollabDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching collaboration details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

const getCollaborationDetails = async (req, res) => {
  try {
    const { collabId } = req.params;

    if (!collabId) {
      return res.status(400).json({
        success: false,
        message: 'Collaboration ID is required'
      });
    }

    // Get collaboration details from CampaignInfluencers
    const collab = await CampaignInfluencers.findById(collabId)
      .populate({ path: 'campaign_id', select: 'title description budget duration brand_id', populate: { path: 'brand_id', select: 'brandName logoUrl' } })
      .populate('influencer_id', 'name');

    if (!collab) {
      return res.status(404).json({
        success: false,
        message: 'Collaboration not found'
      });
    }

    // Get metrics from CampaignMetrics
    const CampaignMetrics = require('../config/CampaignMongo').CampaignMetrics;
    const metrics = await CampaignMetrics.findOne({ campaign_id: collab.campaign_id?._id || collab.campaign_id });

    // Format dates
    const startDate = collab.start_date ? new Date(collab.start_date) : new Date();
    const endDate = collab.end_date ? new Date(collab.end_date) : new Date(startDate.getTime() + (collab.duration * 24 * 60 * 60 * 1000));

    // Calculate duration in days
    const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    res.json({
      success: true,
      collab: {
        id: collab._id,
        campaign_name: collab.campaign_id?.title || 'Untitled Campaign',
        brand_name: collab.campaign_id?.brand_id?.brandName || 'Unknown Brand',
        brand_logo: collab.campaign_id?.brand_id?.logoUrl || '/images/default-brand.png',
        progress: collab.progress || 0,
        duration: duration,
        budget: collab.campaign_id?.budget || 0,
        engagement_rate: metrics?.engagement_rate || collab.engagement_rate || 0,
        description: collab.campaign_id?.description || 'No description available',
        start_date: startDate,
        end_date: endDate,
        deliverables: collab.deliverables || [],
        performance_score: metrics?.performance_score || collab.performance_score || 0,
        reach: metrics?.reach || collab.reach || 0,
        clicks: metrics?.clicks || collab.clicks || 0,
        conversions: metrics?.conversions || collab.conversions || 0,
        conversion_rate: metrics?.conversion_rate || 0,
        impressions: metrics?.impressions || 0,
        revenue: metrics?.revenue || 0,
        roi: metrics?.roi || 0,
        status: collab.status || 'active'
      }
    });
  } catch (error) {
    console.error('Error in getCollabDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching collaboration details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getInfluencerDashboard,
  getInfluencerExplorePage,
  getInfluencerProfile,
  updateInfluencerProfile,
  updateInfluencerData,
  getCampaignHistory,
  updateProgress,
  getCollabDetails,
  getBrandExplorePage,
  getBrandProfilePage,
  getCollaborationDetails
};