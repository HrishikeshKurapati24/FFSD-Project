const InfluencerDiscoveryService = require('../../services/influencer/influencerDiscoveryService');
const AdminAnalyticsService = require('../../services/admin/adminAnalyticsService');

const controller = {
  // Get influencer explore page (Brands viewing influencers)
  async getInfluencerExplorePage(req, res) {
    try {
      const influencers = await InfluencerDiscoveryService.getInfluencersForExploreData();
      res.json({ success: true, influencers: influencers || [] });
    } catch (err) {
      console.error('Controller error in getInfluencerExplorePage:', err);
      res.status(500).json({ success: false, message: 'Error fetching influencers' });
    }
  },

  // Get brand explore page for influencer
  async getBrandExplorePage(req, res) {
    try {
      const { category, search } = req.query;
      const responseData = await InfluencerDiscoveryService.getBrandExploreData(category, search);

      return res.json({
        success: true,
        ...responseData,
        selectedCategory: category || 'all',
        searchQuery: search || ''
      });
    } catch (err) {
      console.error('Controller error in getBrandExplorePage:', err);
      return res.status(500).json({ success: false, message: 'Error fetching brands' });
    }
  },

  // Get brand profile page for influencer
  async getBrandProfilePage(req, res) {
    try {
      const brandId = req.params.id;
      if (!brandId) {
        return res.status(400).json({ success: false, message: 'Brand ID is required' });
      }

      const transformedBrand = await InfluencerDiscoveryService.getBrandProfileData(brandId);

      return res.json({
        success: true,
        brand: transformedBrand,
        influencer: req.session.user || {}
      });
    } catch (error) {
      console.error('Error in getBrandProfilePage:', error);
      return res.status(error.message === 'Brand not found' ? 404 : 500).json({
        success: false,
        message: error.message || 'Error loading brand profile'
      });
    }
  },

  async getMatchmakingRecommendations(req, res) {
    try {
      const influencerId = req.session.user.id;
      const recommendations = await AdminAnalyticsService.getBrandMatchmakingRecommendations(influencerId);
      res.json({ success: true, recommendations });
    } catch (error) {
      console.error('Error fetching matchmaking recommendations for influencer:', error);
      res.status(500).json({ success: false, message: 'Failed to load recommendations' });
    }
  }
};

module.exports = controller;