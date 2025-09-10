// controllers/influencerController.js
const influencerModel = require('../models/influencerModel');
const collaborationModel = require('../models/CollaborationModel');
const brandModel = require('../models/brandModel');
const path = require('path');
const fs = require('fs');
const { CampaignInfluencers } = require('../config/CampaignMongo');
const { mongoose } = require('mongoose');

// Get influencer dashboard data
const getInfluencerDashboard = async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user || !req.session.user.id) {
      console.error('No user session found');
      return res.status(401).redirect('/login');
    }

    const influencerId = req.session.user.id;
    console.log('Getting dashboard for influencer:', influencerId);

    // Get influencer profile data
    const influencer = await influencerModel.getInfluencerById(influencerId);
    if (!influencer) {
      console.error('Influencer not found for ID:', influencerId);
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
      metrics: influencer.metrics || {}
    };

    console.log('Transformed influencer data:', transformedInfluencer);

    // Render the dashboard with all data
    res.render('influencer/dashboard', {
      influencer: transformedInfluencer,
      stats,
      activeCollaborations: activeCollaborations || [],
      pendingRequests: pendingRequests || []
    });
  } catch (error) {
    console.error('Error in getInfluencerDashboard:', error);
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
    const brands = await require('../models/brandModel').getAllBrands();
    console.log('Controller sending brands to view:', brands);
    res.render('influencer/explore', { brands: brands || [] });
  } catch (err) {
    console.error('Controller error:', err);
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
      }))
    }

    // Render the brand profile page
    res.render('influencer/brand_profile', {
      brand: transformedBrand,
      influencer: req.session.user || {}
    });
  } catch (error) {
    console.error('Error fetching brand profile:', error);
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

    // Get best performing posts
    const bestPosts = await influencerModel.getBestPerformingPosts(influencerId);

    // Format the data for the view
    const formattedInfluencer = {
      // Basic Profile Info
      displayName: influencer.displayName || influencer.name || '',
      username: influencer.username || '',
      bio: influencer.bio || '',
      location: influencer.location || '',
      profilePicUrl: influencer.profilePicUrl || influencer.profile_pic_url || '/images/default-avatar.jpg',
      bannerUrl: influencer.bannerUrl || influencer.banner_url || '/images/default-banner.jpg',
      verified: influencer.verified || false,
      createdAt: influencer.createdAt || influencer.created_at || new Date(),

      // Audience Info
      audienceAgeRange: influencer.audienceAgeRange || influencer.audience_age_range || '',
      audienceGender: influencer.audienceGender || influencer.audience_gender || '',

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

    // Render the profile page with the influencer data
    res.render('influencer/profile', { influencer: formattedInfluencer });
  } catch (error) {
    console.error('Error in getInfluencerProfile:', error);
    res.status(500).render('error', {
      message: 'Error loading profile',
      error: process.env.NODE_ENV === 'development' ? error : {}
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

    // Prepare update data
    const updateData = {
      name: req.body.displayName || currentProfile.name,
      username: req.body.username || currentProfile.username,
      bio: req.body.bio || currentProfile.bio,
      location: req.body.location || currentProfile.location,
      audience_gender: req.body.audienceGender || currentProfile.audience_gender,
      audience_age_range: req.body.audienceAge || currentProfile.audience_age_range,
      categories: Array.isArray(req.body.categories) ? req.body.categories :
        (req.body.categories ? [req.body.categories].filter(Boolean) : currentProfile.categories),
      languages: Array.isArray(req.body.languages) ? req.body.languages :
        (req.body.languages ? [req.body.languages].filter(Boolean) : currentProfile.languages),
      social_media_links: req.body.socials || currentProfile.social_media_links
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
      return res.status(401).render('error', {
        error: { status: 401 },
        message: 'Please log in to view campaign history'
      });
    }

    // Fetch all completed and cancelled campaigns
    const campaigns = await influencerModel.getCampaignHistory(influencerId);
    console.log('Retrieved campaigns:', campaigns.length);

    res.render('influencer/campaign_history', {
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
};

const updateProgress = async (req, res) => {
  try {
    const { collabId } = req.params;
    const { progress } = req.body;

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

    // Update progress in database
    const result = await collaborationModel.updateCollaborationProgress(collabId, progressValue);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Collaboration not found'
      });
    }

    res.json({
      success: true,
      progress: progressValue,
      message: 'Progress updated successfully'
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
  getBrandProfilePage
};