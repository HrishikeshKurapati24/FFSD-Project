const AdminAnalyticsService = require("../../services/admin/adminAnalyticsService");
const { isAPIRequest } = require("../../utils/requestUtils");

const AnalyticsController = {
    getBrandAnalytics: async (req, res) => {
        try {
            const metrics = await AdminAnalyticsService.getBrandAnalytics();

            return res.status(200).json({
                success: true,
                ...metrics
            });
        } catch (error) {
            console.error('Error in getBrandAnalytics:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to load brand analytics',
                message: error.message
            });
        }
    },

    getInfluencerAnalytics: async (req, res) => {
        try {
            const metrics = await AdminAnalyticsService.getInfluencerAnalytics();

            return res.status(200).json({
                success: true,
                ...metrics
            });
        } catch (error) {
            console.error('Error in getInfluencerAnalytics:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to load influencer analytics',
                message: error.message
            });
        }
    },

    getCampaignAnalytics: async (req, res) => {
        try {
            const metrics = await AdminAnalyticsService.getCampaignAnalytics();

            return res.status(200).json({
                success: true,
                ...metrics
            });
        } catch (error) {
            console.error('Error in getCampaignAnalytics:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to load campaign analytics',
                message: error.message
            });
        }
    },

    getInfluencerROI: async (req, res) => {
        try {
            const roiData = await AdminAnalyticsService.getInfluencerROI();
            res.status(200).json({ success: true, data: roiData });
        } catch (error) {
            console.error('Error in getInfluencerROI:', error);
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    },

    getCampaignRevenueLeaderboard: async (req, res) => {
        try {
            const leaderboard = await AdminAnalyticsService.getCampaignRevenueLeaderboard();
            res.status(200).json({ success: true, data: leaderboard });
        } catch (error) {
            console.error('Error in getCampaignRevenueLeaderboard:', error);
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    },

    getMatchmakingRecommendations: async (req, res) => {
        try {
            const { brandId } = req.params;
            const recommendations = await AdminAnalyticsService.getMatchmakingRecommendations(brandId);
            res.status(200).json({ success: true, data: recommendations });
        } catch (error) {
            console.error('Error in getMatchmakingRecommendations:', error);
            if (error.message === 'Brand not found') {
                return res.status(404).json({ success: false, message: 'Brand not found' });
            }
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    },

    getEcosystemGraphData: async (req, res) => {
        try {
            const graphData = await AdminAnalyticsService.getEcosystemGraphData();
            res.status(200).json({ success: true, data: graphData });
        } catch (error) {
            console.error('Error in getEcosystemGraphData:', error);
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }
};

module.exports = AnalyticsController;
