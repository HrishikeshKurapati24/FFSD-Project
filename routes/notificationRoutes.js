/**
 * @swagger
 * tags:
 *   name: Notification
 *   description: User notification endpoints. All routes require authentication via JWT (token cookie).
 *
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *           description: Recipient user's MongoDB ObjectId
 *         userType:
 *           type: string
 *           enum: [brand, influencer, customer, admin]
 *         type:
 *           type: string
 *           example: campaign_invite
 *           description: Notification event type
 *         message:
 *           type: string
 *           example: You have a new campaign invite from Acme Corp.
 *         isRead:
 *           type: boolean
 *           default: false
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get all notifications for the logged-in user
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications for the authenticated user, sorted by most recent
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Unauthorized — valid JWT required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/notifications/mark-read:
 *   post:
 *     summary: Mark one or more notifications as read
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notificationIds
 *             properties:
 *               notificationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of notification MongoDB ObjectIds to mark as read
 *                 example: ["64f2a1...", "64f2b3..."]
 *     responses:
 *       200:
 *         description: Notifications marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 updatedCount:
 *                   type: integer
 *                   description: Number of notifications that were updated
 *       400:
 *         description: notificationIds must be a non-empty array
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

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
