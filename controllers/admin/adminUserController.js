const AdminUserService = require("../../services/admin/adminUserService");
const { isAPIRequest } = require("../../utils/requestUtils");

const UserManagementController = {
    async getUserManagementPage(req, res) {
        try {
            const data = await AdminUserService.getUserManagementData();

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).json({
                success: true,
                ...data
            });
        } catch (error) {
            console.error("Error in getUserManagementPage:", error);
            return res.status(500).json({
                success: false,
                error: 'Failed to load user management data',
                message: error.message
            });
        }
    },

    async approveUser(req, res) {
        try {
            const { id } = req.params;
            const { userType } = req.body;
            const result = await AdminUserService.approveUser(id, userType);
            res.json(result);
        } catch (error) {
            console.error("Error in approveUser:", error);
            res.status(500).json({ success: false, message: "Failed to approve user" });
        }
    },

    async getBrandDetails(req, res) {
        try {
            const { id } = req.params;
            const brand = await AdminUserService.getBrandById(id);
            if (!brand) {
                return res.status(404).json({ success: false, message: "Brand not found" });
            }
            res.json(brand);
        } catch (error) {
            console.error("Error in getBrandDetails:", error);
            res.status(500).json({ success: false, message: "Failed to fetch brand details" });
        }
    },

    async getInfluencerDetails(req, res) {
        try {
            const { id } = req.params;
            const influencer = await AdminUserService.getInfluencerById(id);
            if (!influencer) {
                return res.status(404).json({ success: false, message: "Influencer not found" });
            }
            res.json(influencer);
        } catch (error) {
            console.error("Error in getInfluencerDetails:", error);
            res.status(500).json({ success: false, message: "Failed to fetch influencer details" });
        }
    },

    async getVerifiedBrands(req, res) {
        try {
            const brands = await AdminUserService.getVerifiedBrands();
            res.json({ success: true, brands });
        } catch (error) {
            console.error("Error in getVerifiedBrands:", error);
            res.status(500).json({ success: false, message: "Failed to fetch verified brands" });
        }
    },

    async getVerifiedInfluencers(req, res) {
        try {
            const influencers = await AdminUserService.getVerifiedInfluencers();
            res.json({ success: true, influencers });
        } catch (error) {
            console.error("Error in getVerifiedInfluencers:", error);
            res.status(500).json({ success: false, message: "Failed to fetch verified influencers" });
        }
    }
};

module.exports = UserManagementController;
