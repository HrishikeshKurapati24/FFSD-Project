const brandDiscoveryService = require('../../services/brand/brandDiscoveryService');

const controller = {
    // Get influencer profile
    async getInfluencerProfile(req, res) {
        try {
            const influencerId = req.params.influencerId || req.query.id;
            if (!influencerId) {
                return res.status(400).json({ success: false, message: 'Influencer ID is required' });
            }

            const influencerData = await brandDiscoveryService.getInfluencerProfileData(influencerId);

            if (!influencerData) {
                return res.status(404).json({ success: false, message: 'Influencer not found' });
            }

            return res.json({ success: true, influencer: influencerData });

        } catch (error) {
            console.error('Error getting influencer profile details:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to load influencer details',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    async inviteInfluencer(req, res) {
        try {
            const brandId = req.session.user.id;
            const { influencerId, campaignId } = req.body;

            if (!influencerId || !campaignId) {
                return res.status(400).json({ success: false, message: 'Influencer ID and Campaign ID are required' });
            }

            const result = await brandDiscoveryService.inviteInfluencer(brandId, influencerId, campaignId);
            res.json(result);
        } catch (error) {
            console.error('Error inviting influencer:', error);
            res.status(error.message === 'Campaign not found' ? 404 : (error.message.includes('already exists') ? 400 : 500)).json({ success: false, message: error.message });
        }
    }
};

module.exports = controller;
