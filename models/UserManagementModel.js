const db = require("../config/database");

class UserManagementModel {
    static async getInfluencers() {
        try {
            return db.users.influencers || [];
        } catch (error) {
            console.error('Error in getInfluencers:', error);
            return [];
        }
    }

    static async getBrands() {
        try {
            return db.users.brands || [];
        } catch (error) {
            console.error('Error in getBrands:', error);
            return [];
        }
    }

    static async approveUser(id, userType) {
        try {
            const users = userType === 'influencer' ? db.users.influencers : db.users.brands;
            const userIndex = users.findIndex(user => user.id === parseInt(id));

            if (userIndex !== -1) {
                users[userIndex].status = 'approved';
                return { success: true, message: 'User approved successfully' };
            }
            return { success: false, message: 'User not found' };
        } catch (error) {
            console.error('Error in approveUser:', error);
            throw error;
        }
    }
}

module.exports = UserManagementModel;