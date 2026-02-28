const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('./authRoutes');
const notificationController = require('../monolithic_files/notificationController');

// All notification routes require authentication
router.use(isAuthenticated);

// GET /notifications - fetch notifications for the logged in user
router.get('/', notificationController.getNotifications);

// POST /notifications/mark-read - mark given notification ids as read
router.post('/mark-read', notificationController.markRead);

module.exports = router;
