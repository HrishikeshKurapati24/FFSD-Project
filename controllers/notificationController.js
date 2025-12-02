const { Notification } = require('../config/NotificationMongo');
const mongoose = require('mongoose');

// Fetch notifications for the authenticated user (brand or influencer)
exports.getNotifications = async (req, res) => {
    try {
        const user = req.session?.user || req.user;
        if (!user || !user.id) return res.status(401).json({ success: false, message: 'Not authenticated' });

        const recipientId = user.id;
        const recipientType = user.userType || (user.type) || 'brand';

        // Convert to ObjectId if needed
        // Normalize recipientId: if it's already an ObjectId instance keep it, otherwise convert if valid
        let recipientObjId = recipientId;
        if (!(recipientId instanceof mongoose.Types.ObjectId) && mongoose.Types.ObjectId.isValid(recipientId)) {
            recipientObjId = new mongoose.Types.ObjectId(recipientId);
        }

        const notifications = await Notification.find({ recipientId: recipientObjId, recipientType })
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();

        res.json({ success: true, notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
};

// Mark notifications as read (accepts { ids: [] } or { id: '...' })
exports.markRead = async (req, res) => {
    try {
        const user = req.session?.user || req.user;
        if (!user || !user.id) return res.status(401).json({ success: false, message: 'Not authenticated' });

        const recipientId = user.id;
        const ids = req.body.ids || (req.body.id ? [req.body.id] : []);
        if (!ids || ids.length === 0) return res.status(400).json({ success: false, message: 'No ids provided' });

        // Convert to ObjectId if needed
        // Normalize recipientId similar to getNotifications
        let recipientObjId = recipientId;
        if (!(recipientId instanceof mongoose.Types.ObjectId) && mongoose.Types.ObjectId.isValid(recipientId)) {
            recipientObjId = new mongoose.Types.ObjectId(recipientId);
        }

        const objectIds = ids.map(id => (id instanceof mongoose.Types.ObjectId) ? id : new mongoose.Types.ObjectId(id));
        await Notification.updateMany({ _id: { $in: objectIds }, recipientId: recipientObjId }, { $set: { read: true } });
        res.json({ success: true, message: 'Marked as read' });
    } catch (error) {
        console.error('Error marking notifications read:', error);
        res.status(500).json({ success: false, message: 'Failed to mark read' });
    }
};

// Utility: create a notification (can be required and called from other modules)
exports.createNotification = async ({ recipientId, recipientType, senderId, senderType = 'system', type, title, body, relatedId, data }) => {
    try {
        if (!recipientId || !recipientType || !type) {
            throw new Error('recipientId, recipientType and type are required to create notification');
        }

        // Normalize ids: if already ObjectId instances, keep them; otherwise convert valid ids to ObjectId
        const norm = (id) => {
            if (!id) return null;
            if (id instanceof mongoose.Types.ObjectId) return id;
            if (mongoose.Types.ObjectId.isValid(id)) return new mongoose.Types.ObjectId(id);
            return id;
        };

        const n = new Notification({
            recipientId: norm(recipientId),
            recipientType,
            senderId: norm(senderId),
            senderType,
            type,
            title,
            body,
            relatedId: norm(relatedId),
            data
        });

        await n.save();
        return n;
    } catch (error) {
        console.error('Failed to create notification:', error);
        throw error;
    }
};
