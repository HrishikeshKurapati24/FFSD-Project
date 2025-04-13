// model/notificationModel.js
const { db } = require('./db1');

// Get notifications for a specific user
const getNotificationsByUserId = async (userId) => {
    try {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM notifications 
                WHERE user_id = ? 
                ORDER BY created_at DESC 
                LIMIT 50`,
                [userId],
                (err, rows) => {
                    if (err) {
                        console.error('Error getting notifications:', err);
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                }
            );
        });
    } catch (error) {
        console.error('Error in getNotificationsByUserId:', error);
        throw error;
    }
};

// Mark all notifications as read for a user
const markAllAsRead = async (userId) => {
    try {
        return new Promise((resolve, reject) => {
            db.run(
                `UPDATE notifications 
                SET read = 1 
                WHERE user_id = ? AND read = 0`,
                [userId],
                function (err) {
                    if (err) {
                        console.error('Error marking notifications as read:', err);
                        reject(err);
                    } else {
                        resolve(this.changes);
                    }
                }
            );
        });
    } catch (error) {
        console.error('Error in markAllAsRead:', error);
        throw error;
    }
};

// Create a new notification
const createNotification = async (userId, title, message, type = 'system') => {
    try {
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO notifications (user_id, title, message, type) 
                VALUES (?, ?, ?, ?)`,
                [userId, title, message, type],
                function (err) {
                    if (err) {
                        console.error('Error creating notification:', err);
                        reject(err);
                    } else {
                        resolve(this.lastID);
                    }
                }
            );
        });
    } catch (error) {
        console.error('Error in createNotification:', error);
        throw error;
    }
};

module.exports = {
    getNotificationsByUserId,
    markAllAsRead,
    createNotification
};