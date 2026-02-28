const customerHistoryService = require('../../services/customer/customerHistoryService');

class CustomerHistoryController {
    static async getOrderHistory(req, res) {
        try {
            const userId = (req.session?.user?.userType === 'customer' && req.session?.user?.id)
                ? req.session.user.id
                : (req.user?.userType === 'customer' && req.user?.id ? req.user.id : null);

            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            const data = await customerHistoryService.getOrderHistoryData(userId);
            data.user = req.session.user || req.user;

            return res.status(200).json({ success: true, ...data });
        } catch (error) {
            console.error('Error fetching order history:', error);
            if (error.message === 'Unauthorized') {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            return res.status(500).json({ success: false, message: 'Error loading orders' });
        }
    }

    static async getRankingsPage(req, res) {
        try {
            const { brandCategory = 'revenue', influencerCategory = 'totalFollowers' } = req.query;
            const rankingsData = await customerHistoryService.getRankingsPageData(brandCategory, influencerCategory);
            return res.json(rankingsData);
        } catch (error) {
            console.error('Error rendering rankings:', error);
            return res.status(500).json({ message: 'Error loading rankings', error: process.env.NODE_ENV === 'development' ? error : {} });
        }
    }
}

module.exports = CustomerHistoryController;