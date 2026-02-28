const AdminDashboardService = require("../../services/admin/adminDashboardService");
const AdminNotificationService = require("../../services/admin/adminNotificationService");
const { isAPIRequest } = require("../../utils/requestUtils");
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

const DashboardController = {
    async verifyUser(req, res) {
        try {
            const { username, password, rememberMe } = req.body;
            const remember = !!rememberMe;

            let user;
            try {
                user = await AdminDashboardService.verifyAdminUser(username, password);
            } catch (err) {
                return res.status(401).json({
                    success: false,
                    message: err.message || 'Invalid credentials'
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    userId: user.userId,
                    userType: 'admin',
                    role: user.role
                },
                JWT_SECRET,
                {
                    expiresIn: remember ? '7d' : '1h'
                }
            );

            // Set session (for EJS pages compatibility)
            req.session.userId = user.userId;
            req.session.role = user.role;

            // Set cookie options
            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                maxAge: remember ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000,
                path: '/'
            };

            // Set JWT cookie
            res.cookie('adminToken', token, cookieOptions);

            res.json({
                success: true,
                message: 'Login successful',
                redirect: '/admin/dashboard',
                user: {
                    userId: user.userId,
                    username: user.username,
                    role: user.role,
                    userType: 'admin'
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    async getDashboard(req, res) {
        try {
            const metrics = await AdminDashboardService.getDashboardMetrics();
            const notifications = await AdminDashboardService.generateNotifications();

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).json({
                success: true,
                ...metrics,
                notifications,
                user: res.locals.user || req.session.user
            });
        } catch (error) {
            console.error("Error loading admin dashboard:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to load dashboard",
                error: error.message
            });
        }
    }
};

module.exports = DashboardController;
