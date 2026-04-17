const AdminCollaborationService = require("../../services/admin/adminCollaborationService");
const { isAPIRequest } = require("../../utils/requestUtils");

const CollaborationController = {
    async getAllCollaborations(req, res) {
        try {
            const data = await AdminCollaborationService.getAllCollaborations(req.query);

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).json({
                success: true,
                ...data
            });
        } catch (error) {
            console.error("Error fetching collaborations:", error);
            return res.status(500).json({
                success: false,
                error: 'Failed to load collaborations',
                message: error.message
            });
        }
    },

    async getCollaborationDetails(req, res) {
        try {
            const collabId = req.params.id;
            const collaboration = await AdminCollaborationService.getCollaborationById(collabId);
            if (!collaboration) {
                return res.status(404).json({ error: "Collaboration Not Found" });
            }
            res.json(collaboration);
        } catch (error) {
            console.error("Error fetching collaboration details:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
};

module.exports = CollaborationController;
