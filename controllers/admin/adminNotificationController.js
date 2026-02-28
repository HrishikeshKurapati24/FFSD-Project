const AdminNotificationService = require("../../services/admin/adminNotificationService");

const NotificationController = {
    // Get all notifications for the admin
    async getNotifications(req, res) {
        try {
            // Generate notifications using the service
            const notifications = await AdminNotificationService.generateNotifications();

            // This endpoint should always return JSON (it's an API endpoint)
            res.setHeader('Content-Type', 'application/json');
            return res.status(200).json({
                success: true,
                notifications: notifications || []
            });
        } catch (error) {
            console.error('Error fetching notifications:', error);
            res.setHeader('Content-Type', 'application/json');
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch notifications',
                message: error.message
            });
        }
    },

    // Mark all notifications as read
    async markAllAsRead(req, res) {
        try {
            const result = await AdminNotificationService.markAllAsRead();
            res.setHeader('Content-Type', 'application/json');
            return res.status(200).json(result);
        } catch (error) {
            console.error('Error marking notifications as read:', error);
            res.setHeader('Content-Type', 'application/json');
            return res.status(500).json({
                success: false,
                error: 'Failed to mark notifications as read',
                message: error.message
            });
        }
    }
};

module.exports = NotificationController;
