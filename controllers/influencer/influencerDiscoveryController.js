const InfluencerDiscoveryService = require('../../services/influencer/influencerDiscoveryService');

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
  }
};

module.exports = controller;