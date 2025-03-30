const UserManagementModel = require("../models/UserManagementModel");

const UserManagementController = {
    async getUserManagementPage(req, res) {
        try {
            // Get data from model
            const influencers = await UserManagementModel.getInfluencers();
            const brands = await UserManagementModel.getBrands();

            // Mock data for other sections
            const mockData = {
                flaggedContent: [
                    "Inappropriate content from user123",
                    "Spam detected in campaign XYZ"
                ],
                suspiciousUsers: [
                    "Unusual activity from user456",
                    "Multiple failed login attempts from user789"
                ],
                userTypeRequests: [
                    "Request to change from Brand to Influencer: user321",
                    "Request to change from Influencer to Brand: user654"
                ],
                profileSuggestions: [
                    "Profile completion needed for user987",
                    "Missing social media links for user234"
                ]
            };

            // Render the page with all data
            res.render("user_management", {
                influencers: influencers || [],
                brands: brands || [],
                flaggedContent: mockData.flaggedContent,
                suspiciousUsers: mockData.suspiciousUsers,
                userTypeRequests: mockData.userTypeRequests,
                profileSuggestions: mockData.profileSuggestions,
                user: {
                    name: 'Admin User'
                }
            });

        } catch (error) {
            console.error("Error in getUserManagementPage:", error);
            // Render with empty data in case of error
            res.render("user_management", {
                influencers: [],
                brands: [],
                flaggedContent: [],
                suspiciousUsers: [],
                userTypeRequests: [],
                profileSuggestions: [],
                user: {
                    name: 'Admin User'
                },
                error: "Failed to load user management data"
            });
        }
    },

    async approveUser(req, res) {
        try {
            const { id, userType } = req.body;
            const result = await UserManagementModel.approveUser(id, userType);
            res.json(result);
        } catch (error) {
            console.error("Error in approveUser:", error);
            res.status(500).json({
                success: false,
                message: "Failed to approve user"
            });
        }
    }
};

module.exports = UserManagementController;