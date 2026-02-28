const brandProfileService = require('../../services/brand/brandProfileService');
const brandCampaignService = require('../../services/brand/brandCampaignService');
const SubscriptionService = require('../../services/subscription/subscriptionService');
const { Product } = require('../../models/ProductMongo');

const controller = {
  async getExplorePage(req, res) {
    try {
      const { category, search } = req.query;
      const brandId = req.session.user?.id;
      const exploreData = await brandProfileService.getExplorePageData(brandId, category, search);
      res.json({ success: true, ...exploreData });
    } catch (err) {
      console.error('Error fetching influencers:', err);
      res.status(500).json({ success: false, message: 'Error fetching influencers', error: err.message });
    }
  },

  // Get brand profile
  async getBrandProfile(req, res) {
    try {
      const brandId = req.session.user.id;
      const transformedBrand = await brandProfileService.getBrandProfileData(brandId);
      if (!transformedBrand) {
        return res.status(404).json({ success: false, error: { status: 404 }, message: 'Brand not found' });
      }
      return res.json({ success: true, brand: transformedBrand });
    } catch (error) {
      console.error('Error fetching brand profile:', error);
      return res.status(500).json({ success: false, message: 'Error loading brand profile' });
    }
  },

  // Update brand profile
  async updateBrandProfile(req, res) {
    try {
      const brandId = req.session.user.id;
      const updatedBrand = await brandProfileService.updateBrandProfileData(brandId, req.body);
      res.json({ success: true, message: 'Profile updated successfully', brand: updatedBrand });
    } catch (error) {
      console.error('Error updating brand profile:', error);
      res.status(error.message.includes('Missing') ? 400 : 500).json({ success: false, message: error.message });
    }
  },

  // Request verification
  async requestVerification(req, res) {
    try {
      const brandId = req.session.user.id;
      const verificationRequest = await brandProfileService.requestVerification(brandId, req.body);
      res.json({ success: true, message: 'Verification request submitted', request: verificationRequest });
    } catch (error) {
      console.error('Error submitting verification request:', error);
      res.status(500).json({ success: false, message: 'Error submitting verification request' });
    }
  },

  // Get verification status
  async getVerificationStatus(req, res) {
    try {
      const brandId = req.session.user.id;
      const status = await brandProfileService.getVerificationStatus(brandId);
      res.json({ success: true, status });
    } catch (error) {
      console.error('Error getting verification status:', error);
      res.status(500).json({ success: false, message: 'Error getting verification status' });
    }
  },

  // Update social media links
  async updateSocialLinks(req, res) {
    try {
      const brandId = req.session.user.id;
      const updatedBrand = await brandProfileService.updateSocialLinks(brandId, req.body.socials);
      res.json({ success: true, message: 'Social links updated successfully', brand: updatedBrand });
    } catch (error) {
      console.error('Error updating social links:', error);
      res.status(500).json({ success: false, message: 'Error updating social links' });
    }
  },

  // Get brand statistics
  async getBrandStats(req, res) {
    try {
      const brandId = req.session.user.id;
      const stats = await brandProfileService.getBrandStats(brandId);
      res.json({ success: true, stats });
    } catch (error) {
      console.error('Error getting brand statistics:', error);
      res.status(500).json({ success: false, message: 'Error getting brand statistics' });
    }
  },

  // Get top performing campaigns
  async getTopCampaigns(req, res) {
    try {
      const brandId = req.session.user.id;
      const campaigns = await brandCampaignService.getTopCampaigns(brandId);
      res.json({ success: true, campaigns });
    } catch (error) {
      console.error('Error getting top campaigns:', error);
      res.status(500).json({ success: false, message: 'Error getting top campaigns' });
    }
  },

  // Get brand analytics
  async getBrandAnalytics(req, res) {
    try {
      const brandId = req.session.user.id;
      const analytics = await brandProfileService.getBrandAnalytics(brandId);
      res.json({ success: true, analytics });
    } catch (error) {
      console.error('Error getting brand analytics:', error);
      res.status(500).json({ success: false, message: 'Error getting brand analytics' });
    }
  },

  // Get brand dashboard
  async getBrandDashboard(req, res) {
    try {
      const brandId = req.session.user.id;
      const dashboardData = await brandProfileService.getBrandDashboardData(
        brandId,
        req.session.successMessage,
        SubscriptionService,
        brandCampaignService,
        Product
      );
      delete req.session.successMessage;
      return res.json({ success: true, ...dashboardData });
    } catch (error) {
      console.error('Error in getBrandDashboard:', error);
      return res.status(500).json({ success: false, message: 'Error loading dashboard' });
    }
  },

  // Get campaign history
  async getCampaignHistory(req, res) {
    try {
      const brandId = req.session.user?.id;
      if (!brandId) return res.status(401).json({ success: false, message: 'Please log in' });
      const historyPayload = await brandCampaignService.getCampaignHistoryData(brandId);
      return res.json({ success: true, ...historyPayload });
    } catch (error) {
      console.error('Error in getCampaignHistory:', error);
      return res.status(500).json({ success: false, message: 'Error loading campaign history' });
    }
  },

  async updateProfileImages(req, res) {
    try {
      const brandId = req.session.user.id;
      const updatedBrand = await brandProfileService.updateProfileImages(brandId, req.files);
      res.json({ success: true, message: 'Images updated successfully', brand: updatedBrand });
    } catch (error) {
      console.error('Error updating profile images:', error);
      res.status(error.message === 'No images were uploaded' ? 400 : 500).json({ success: false, message: error.message });
    }
  },

  async deleteAccount(req, res) {
    try {
      const brandId = req.session.user.id;
      await brandProfileService.deleteAccount(brandId);
      req.session.destroy();
      res.json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
      console.error('Error deleting account:', error);
      res.status(500).json({ success: false, message: 'Error deleting account' });
    }
  }
};

module.exports = controller;
