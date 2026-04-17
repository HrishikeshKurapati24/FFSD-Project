const AdminSearchService = require('../../services/admin/adminSearchService');

class AdminSearchController {
    static async globalSearch(req, res) {
        try {
            const { q } = req.query;
            if (!q) {
                return res.status(400).json({ success: false, message: 'Query parameter "q" is required' });
            }

            const results = await AdminSearchService.globalSearch(q);
            
            return res.status(200).json({
                success: true,
                results
            });
        } catch (error) {
            console.error('Global search error:', error);
            return res.status(500).json({
                success: false,
                message: 'Search failed',
                error: error.message
            });
        }
    }
}

module.exports = AdminSearchController;
