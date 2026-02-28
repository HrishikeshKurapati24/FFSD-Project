const AdminSettingsService = require('../../services/admin/adminSettingsService');

// Helper function to detect API requests (shared from adminRoutes)
const isAPIRequest = (req) => {
    if (req.headers.accept && req.headers.accept.includes('application/json')) return true;
    if (req.xhr) return true;

    const fullPath = req.originalUrl || req.url || req.path || '';
    const pathOnly = fullPath.split('?')[0];

    if (pathOnly.startsWith('/api/')) return true;
    if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) return true;

    const origin = req.headers.origin || '';
    const referer = req.headers.referer || '';
    if (origin.includes('localhost:5173') || origin.includes('localhost:3000') ||
        referer.includes('localhost:5173') || referer.includes('localhost:3000')) {
        return true;
    }

    const adminAPIRoutes = [
        '/admin/verify', '/verify', '/admin/dashboard', '/dashboard',
        '/admin/user_management', '/user_management', '/admin/customer-management', '/customer-management',
        '/admin/collaboration_monitoring', '/collaboration_monitoring', '/admin/payment_verification', '/payment_verification',
        '/admin/feedback_and_moderation', '/feedback_and_moderation', '/admin/brand-analytics', '/brand-analytics',
        '/admin/influencer-analytics', '/influencer-analytics', '/admin/campaign-analytics', '/campaign-analytics',
        '/admin/notifications', '/notifications', '/admin/verified-brands', '/verified-brands',
        '/admin/verified-influencers', '/verified-influencers', '/admin/all-customers', '/all-customers',
        '/admin/orders/all', '/orders/all'
    ];

    const isAdminAPIRoute = adminAPIRoutes.some(route => pathOnly === route || pathOnly.startsWith(route + '/'));

    if (isAdminAPIRoute) {
        const acceptHeader = req.headers.accept || '';
        if (acceptHeader.includes('text/html') && !acceptHeader.includes('application/json')) return false;
        return true;
    }

    return false;
};

class AdminSettingsController {
    /**
     * Renders the login page (Endpoint GET /login)
     */
    static async getLoginPage(req, res) {
        if (req.session && req.session.userId) {
            return res.json({ success: true, redirectTo: '/admin/dashboard' });
        }

        const adminUser = await AdminSettingsService.verifyAdminToken(req.cookies);
        if (adminUser) {
            return res.json({ success: true, redirectTo: '/admin/dashboard' });
        }

        res.json({ success: true, message: 'Please login' });
    }

    /**
     * Verifies Admin Token (Endpoint GET /verify)
     */
    static async verifyToken(req, res) {
        const adminUser = await AdminSettingsService.verifyAdminToken(req.cookies);

        if (!adminUser) {
            return res.status(401).json({ authenticated: false, message: 'Not authenticated or Access Denied' });
        }

        return res.status(200).json({
            authenticated: true,
            user: adminUser
        });
    }

    /**
     * Renders the settings page (Endpoint GET /settings)
     */
    static getSettings(req, res) {
        res.json({ success: true, user: res.locals.user || (req.session && req.session.user) });
    }

    /**
     * Resets the admin password (Endpoint POST /reset-password)
     */
    static async resetPassword(req, res) {
        const { username, newPassword } = req.body;

        if (!username || !newPassword) {
            return res.status(400).json({ success: false, message: 'Username and new password are required' });
        }

        const result = await AdminSettingsService.resetAdminPassword(username, newPassword);
        return res.status(result.status).json(result);
    }

    /**
     * Logs out the admin (Endpoint GET /logout)
     */
    static logout(req, res) {
        req.session.destroy((err) => {
            if (err) {
                console.error('Logout error:', err);
                return res.status(500).json({ success: false, message: 'Error logging out' });
            }

            res.clearCookie('adminToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                path: '/'
            });

            res.clearCookie('session-id');

            return res.status(200).json({ success: true, message: 'Logged out successfully' });
        });
    }
}

module.exports = { AdminSettingsController, isAPIRequest };
