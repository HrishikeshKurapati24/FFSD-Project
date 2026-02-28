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

            const responseData = { influencer: influencerData };
            return res.json({ success: true, ...responseData });

        } catch (error) {
            console.error('Error getting influencer profile details:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to load influencer details',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};

module.exports = controller;
