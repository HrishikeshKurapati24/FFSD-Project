const AdminOrderService = require('../../services/admin/adminOrderService');

const OrderAnalyticsController = {
    /**
     * Get platform-wide order analytics for admin dashboard
     */
    async getAdminOrderAnalytics(req, res) {
        try {
            const analytics = await AdminOrderService.getOrderAnalytics(req.query);
            res.json({
                success: true,
                analytics
            });
        } catch (error) {
            console.error('Error fetching admin order analytics:', error);
            res.status(500).json({ success: false, message: 'Error fetching analytics' });
        }
    },

    /**
     * Get all platform orders for Admin dashboard
     */
    async getAdminAllOrders(req, res) {
        try {
            const filteredOrders = await AdminOrderService.getAllOrders(req.query);
            res.json({ success: true, orders: filteredOrders });
        } catch (error) {
            console.error('Error fetching admin all orders:', error);
            res.status(500).json({ success: false, message: 'Error fetching platform orders' });
        }
    }
};

module.exports = OrderAnalyticsController;
