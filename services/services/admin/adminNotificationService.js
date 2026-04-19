const { BrandInfo } = require('../../models/BrandMongo');
const { InfluencerInfo } = require('../../models/InfluencerMongo');
const { CampaignInfluencers, CampaignPayments } = require('../../models/CampaignMongo');

class adminNotificationService {
    static async generateNotifications() {
        try {
            // Get pending collaborations count
            const pendingCollabs = await CampaignInfluencers.countDocuments({ status: 'pending' });

            // Get pending payments count
            const pendingPayments = await CampaignPayments.countDocuments({ status: 'pending' });

            // Get new users count (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const brandCount = await BrandInfo.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
            const influencerCount = await InfluencerInfo.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

            // Generate notifications based on current data
            const notifications = [];

            if (pendingCollabs > 0) {
                notifications.push({
                    id: 1,
                    type: 'collaboration',
                    title: 'New Collaboration Request',
                    message: `${pendingCollabs} collaboration request${pendingCollabs > 1 ? 's are' : ' is'} pending approval`,
                    timestamp: new Date(),
                    read: false,
                    priority: 'high'
                });
            }

            if (pendingPayments > 0) {
                notifications.push({
                    id: 2,
                    type: 'payment',
                    title: 'Payment Verification Needed',
                    message: `${pendingPayments} payment${pendingPayments > 1 ? 's require' : ' requires'} verification`,
                    timestamp: new Date(Date.now() - 3600000), // 1 hour ago
                    read: false,
                    priority: 'medium'
                });
            }

            if (brandCount + influencerCount > 0) {
                notifications.push({
                    id: 3,
                    type: 'user',
                    title: 'New User Registrations',
                    message: `${brandCount + influencerCount} new user${brandCount + influencerCount > 1 ? 's' : ''} registered this month`,
                    timestamp: new Date(Date.now() - 7200000), // 2 hours ago
                    read: false,
                    priority: 'low'
                });
            }

            // If no notifications, add a default one
            if (notifications.length === 0) {
                notifications.push({
                    id: 4,
                    type: 'info',
                    title: 'All caught up!',
                    message: 'No pending actions required',
                    timestamp: new Date(),
                    read: true,
                    priority: 'low'
                });
            }

            return notifications;
        } catch (error) {
            console.error('Error generating notifications in service:', error);
            return [];
        }
    }

    static async markAllAsRead() {
        // In a real application, you would update the database here
        // For now, we'll just return success matching the previous controller logic
        return { success: true, message: 'All notifications marked as read' };
    }
}

module.exports = adminNotificationService;
