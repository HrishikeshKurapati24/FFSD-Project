const influencerProfileService = require('../../services/influencer/influencerProfileService');

// Get influencer dashboard data
const getInfluencerDashboard = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const influencerId = req.session.user.id;
    const responseData = await influencerProfileService.getInfluencerDashboardData(influencerId);

    if (!responseData) {
      return res.status(404).json({ success: false, message: 'Influencer not found' });
    }

    responseData.baseUrl = `${req.protocol}://${req.get('host')}`;
    return res.json({ success: true, ...responseData });
  } catch (error) {
    console.error('Error in getInfluencerDashboard:', error);
    return res.status(500).json({ success: false, message: 'Error loading dashboard' });
  }
};

// Get influencer profile page
const getInfluencerProfile = async (req, res) => {
  try {
    const influencerId = req.session.user.id;
    const influencerData = await influencerProfileService.getInfluencerProfileDetails(influencerId);

    if (!influencerData) {
      return res.status(404).json({ success: false, message: 'Influencer profile not found' });
    }

    return res.json({ success: true, influencer: influencerData });
  } catch (error) {
    console.error('Error in getInfluencerProfile:', error);
    return res.status(500).json({ success: false, message: 'Error loading profile' });
  }
};

// Update influencer profile images
const updateInfluencerImages = async (req, res) => {
  try {
    const influencerId = req.session.user.id;
    if (!influencerId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const { profilePic, bannerImage } = req.files || {};
    const result = await influencerProfileService.updateInfluencerImagesData(
      influencerId,
      profilePic?.[0],
      bannerImage?.[0]
    );

    return res.json({
      success: true,
      message: 'Images updated successfully',
      profile: result
    });
  } catch (error) {
    console.error('Error in updateInfluencerImages:', error);
    return res.status(error.message === 'No images provided for update' ? 400 : 500).json({
      success: false,
      message: error.message || 'Error updating images'
    });
  }
};

// Update influencer profile data
const updateProfileData = async (req, res) => {
  try {
    const influencerId = req.session.user.id;
    if (!influencerId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const updateData = {
      displayName: req.body.displayName?.trim(),
      username: req.body.username?.trim(),
      bio: req.body.bio?.trim(),
      location: req.body.location?.trim(),
      audienceGender: req.body.audienceGender?.trim(),
      audienceAgeRange: req.body.audienceAgeRange?.trim(),
      categories: Array.isArray(req.body.categories) ? req.body.categories :
        (req.body.categories ? [req.body.categories].filter(Boolean) : []),
      languages: Array.isArray(req.body.languages) ? req.body.languages :
        (req.body.languages ? [req.body.languages].filter(Boolean) : []),
      socials: req.body.socials
    };

    const result = await influencerProfileService.updateInfluencerDataLegacy(influencerId, updateData);

    return res.json({
      success: true,
      message: result.hasChanges ? 'Profile updated successfully' : 'No changes to update',
      profile: result.profile
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

// Delete account
const deleteAccount = async (req, res) => {
  try {
    const influencerId = req.session.user.id;
    if (!influencerId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    await influencerProfileService.deleteInfluencerAccount(influencerId);

    // Clear session after deletion
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).json({ success: false, message: 'Error destroying session' });
      }
      res.json({ success: true, message: 'Account deleted successfully' });
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ success: false, message: 'Failed to delete account' });
  }
};

// Legacy function for backward compatibility
const updateInfluencerProfile = async (req, res) => {
  try {
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
    return res.status(500).json({ success: false, message: 'Error updating profile', error: error.message });
  }
};

module.exports = {
  getInfluencerDashboard,
  getInfluencerProfile,
  updateInfluencerProfile,
  updateProfileData,
  updateInfluencerImages,
  deleteAccount
};