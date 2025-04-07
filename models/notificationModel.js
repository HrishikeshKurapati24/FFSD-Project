// model/notificationModel.js
const dbPromise = require('./db');

// Get notifications by user ID
const getNotificationsByUserId = async (userId) => {
    try {
        const db = await dbPromise;
        const notifications = await db.all(
            `SELECT * FROM notifications 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT 50`,
            [userId]
        );
        return notifications || [];
    } catch (error) {
        console.error('Error getting notifications:', error);
        throw error;
    }
};

// Mark all notifications as read for a user
const markAllAsRead = async (userId) => {
    try {
        const db = await dbPromise;
        await db.run(
            `UPDATE notifications 
             SET is_read = 1 
             WHERE user_id = ? AND is_read = 0`,
            [userId]
        );
        return true;
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        throw error;
    }
};

// Create a new notification
const createNotification = async (userId, title, message, type) => {
    try {
        const db = await dbPromise;
        const result = await db.run(
            `INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
             VALUES (?, ?, ?, ?, 0, datetime('now'))`,
            [userId, title, message, type]
        );
        return result.lastID;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

module.exports = {
    getNotificationsByUserId,
    markAllAsRead,
    createNotification
}; 