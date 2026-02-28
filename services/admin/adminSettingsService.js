const { Admin } = require('../../mongoDB');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class AdminSettingsService {
    /**
     * Verifies the Admin JWT token from the given cookies
     * @param {Object} cookies Request cookies 
     * @returns {Object|null} admin user info or null if invalid
     */
    static async verifyAdminToken(cookies) {
        try {
            const token = cookies?.adminToken;
            if (!token) return null;

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Verify admin user exists and has admin role
            const adminUser = await Admin.findOne({ userId: decoded.userId });
            if (!adminUser || adminUser.role !== 'admin') {
                return null;
            }

            return {
                userId: adminUser.userId,
                username: adminUser.username,
                role: adminUser.role,
                userType: 'admin'
            };
        } catch (error) {
            console.error('Admin token verification error:', error.message);
            return null;
        }
    }

    /**
     * Resets the admin password
     * @param {string} username 
     * @param {string} newPassword 
     * @returns {Object} { success, message }
     */
    static async resetAdminPassword(username, newPassword) {
        try {
            const user = await Admin.findOne({ username });
            if (!user) {
                return { success: false, message: 'User not found', status: 404 };
            }

            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

            user.password = hashedPassword;
            await user.save();

            return { success: true, message: 'Password reset successful', status: 200 };
        } catch (error) {
            console.error('Password reset error:', error);
            return { success: false, message: 'Error resetting password', status: 500 };
        }
    }
}

module.exports = AdminSettingsService;
