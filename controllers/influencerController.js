// controllers/influencerController.js
const influencerModel = require('../models/influencerModel');
const notificationModel = require('../models/notificationModel');
const collaborationModel = require('../models/collaborationModel');
const brandModel = require('../models/brandModel');
const path = require('path');
const fs = require('fs');

// Get influencer dashboard data
const getInfluencerDashboard = async (req, res) => {
  try {
    const influencerId = req.user._id; // Assuming user is authenticated and ID is available

    // Get influencer profile data
    const influencer = await influencerModel.getInfluencerById(influencerId);

    // Get notifications
    const notifications = await notificationModel.getNotificationsByUserId(influencerId);

    // Get dashboard stats
    const stats = {
      activeCollaborations: await collaborationModel.getActiveCollaborationsCount(influencerId),
      completionPercentage: await collaborationModel.getCompletionPercentage(influencerId),
      nearingCompletion: await collaborationModel.getNearingCompletionCount(influencerId),
      pendingRequests: await collaborationModel.getPendingRequestsCount(influencerId),
      monthlyEarnings: await collaborationModel.getMonthlyEarnings(influencerId),
      earningsChange: await collaborationModel.getEarningsChange(influencerId)
    };

    // Get upcoming deadlines
    const upcomingDeadlines = await collaborationModel.getUpcomingDeadlines(influencerId);

    // Get performance analytics
    const analytics = {
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      engagementRates: await influencerModel.getEngagementRates(influencerId),
      newFollowers: await influencerModel.getFollowerGrowth(influencerId),
      collabPerformance: await collaborationModel.getPerformanceMetrics(influencerId),
      earningsBySource: await collaborationModel.getEarningsBySource(influencerId)
    };

    // Get recommended brands
    const recommendedBrands = await brandModel.getRecommendedBrands(influencerId);

    // Render the dashboard with all data
    res.render('influencer/I_index', {
      influencer,
      notifications,
      stats,
      upcomingDeadlines,
      analytics,
      recommendedBrands
    });
  } catch (error) {
    console.error('Error in getInfluencerDashboard:', error);
    res.status(500).render('error', {
      message: 'Error loading dashboard',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Mark notifications as read
const markNotificationsAsRead = async (req, res) => {
  try {
    const influencerId = req.user._id;
    await notificationModel.markAllAsRead(influencerId);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get influencer explore page
const getInfluencerExplorePage = (req, res) => {
  influencerModel.getAllInfluencers((err, influencers) => {
    if (err) {
      console.error('Controller error:', err);
      res.status(500).send('Error fetching influencers');
    } else {
      console.log('Controller sending influencers to view:', influencers);
      res.render('brand/B2_explore', { influencers: influencers || [] });
    }
  });
};

// Get influencer profile page
const getInfluencerProfile = async (req, res) => {
  try {
    const influencerId = req.user._id; // Assuming user is authenticated and ID is available

    // Get influencer profile data
    const influencer = await influencerModel.getInfluencerProfileDetails(influencerId);

    if (!influencer) {
      return res.status(404).render('error', {
        message: 'Influencer profile not found',
        error: { status: 404 }
      });
    }

    // Format the data for the view
    // The view expects certain properties to be available
    const formattedInfluencer = {
      ...influencer,
      // Parse JSON strings if they're stored as strings in the database
      socials: Array.isArray(influencer.socials) ? influencer.socials :
        (influencer.social_media_links ? JSON.parse(influencer.social_media_links) : []),
      categories: Array.isArray(influencer.categories) ? influencer.categories :
        (influencer.categories ? JSON.parse(influencer.categories) : []),
      languages: Array.isArray(influencer.languages) ? influencer.languages :
        (influencer.languages ? JSON.parse(influencer.languages) : []),
      bestPosts: Array.isArray(influencer.bestPosts) ? influencer.bestPosts :
        (influencer.best_posts ? JSON.parse(influencer.best_posts) : []),
      // Ensure these properties exist even if they're not in the database
      displayName: influencer.displayName || influencer.name || '',
      username: influencer.username || '',
      bio: influencer.bio || '',
      location: influencer.location || '',
      audienceAgeRange: influencer.audienceAgeRange || influencer.audience_age_range || '',
      audienceGender: influencer.audienceGender || influencer.audience_gender || '',
      profilePicUrl: influencer.profilePicUrl || influencer.profile_pic_url || '',
      bannerUrl: influencer.bannerUrl || influencer.banner_url || '',
      verified: influencer.verified || false,
      createdAt: influencer.createdAt || influencer.created_at || new Date()
    };

    // Render the profile page with the influencer data
    res.render('influencer/I_profile2', { influencer: formattedInfluencer });
  } catch (error) {
    console.error('Error in getInfluencerProfile:', error);
    res.status(500).render('error', {
      message: 'Error loading profile',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Update influencer profile
const updateInfluencerProfile = async (req, res) => {
  try {
    const influencerId = req.user._id;

    // Extract profile data from request body
    const {
      displayName,
      username,
      bio,
      location,
      audienceGender,
      audienceAge,
      categories,
      languages,
      socials
    } = req.body;

    // Handle file uploads for profile picture and banner
    let profilePicUrl = null;
    let bannerUrl = null;

    if (req.files) {
      if (req.files.profilePic) {
        const profilePic = req.files.profilePic;
        const profilePicFileName = `${influencerId}_profile_${Date.now()}${path.extname(profilePic.name)}`;
        const profilePicPath = path.join(__dirname, '../public/i_index/uploads/influencers', profilePicFileName);

        // Create directory if it doesn't exist
        const dir = path.dirname(profilePicPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Save the file
        await profilePic.mv(profilePicPath);
        profilePicUrl = `/i_index/uploads/influencers/${profilePicFileName}`;
      }

      if (req.files.bannerImage) {
        const bannerImage = req.files.bannerImage;
        const bannerFileName = `${influencerId}_banner_${Date.now()}${path.extname(bannerImage.name)}`;
        const bannerPath = path.join(__dirname, '../public/i_index/uploads/influencers', bannerFileName);

        // Create directory if it doesn't exist
        const dir = path.dirname(bannerPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Save the file
        await bannerImage.mv(bannerPath);
        bannerUrl = `/i_index/images/influencers/${bannerFileName}`;
      }
    }

    // Prepare the profile data for update
    const profileData = {
      name: displayName,
      username,
      bio,
      location,
      audience_gender: audienceGender,
      audience_age_range: audienceAge,
      categories: Array.isArray(categories) ? categories : [categories].filter(Boolean),
      languages: Array.isArray(languages) ? languages : [languages].filter(Boolean),
      social_media_links: socials
    };

    // Add profile pic and banner URLs if they were uploaded
    if (profilePicUrl) {
      profileData.profile_pic_url = profilePicUrl;
    }

    if (bannerUrl) {
      profileData.banner_url = bannerUrl;
    }

    // Update the profile in the database
    await influencerModel.updateInfluencerProfile(influencerId, profileData);

    // Redirect back to the profile page
    res.redirect('/influencer/profile');
  } catch (error) {
    console.error('Error updating influencer profile:', error);
    res.status(500).render('error', {
      message: 'Error updating profile',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

module.exports = {
  getInfluencerDashboard,
  markNotificationsAsRead,
  getInfluencerExplorePage,
  getInfluencerProfile,
  updateInfluencerProfile
};