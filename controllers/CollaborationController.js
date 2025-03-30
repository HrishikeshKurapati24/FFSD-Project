const CollaborationModel = require("../models/CollaborationModel");

const CollaborationController = {
    async getAllCollaborations(req, res) {
        try {
            const collaborations = await CollaborationModel.getAllCollaborations();
            res.render("collaboration_monitoring", {
                collaborations: collaborations || [],
                user: {
                    name: 'Admin User'
                }
            });
        } catch (error) {
            console.error("Error fetching collaborations:", error);
            res.render("collaboration_monitoring", {
                collaborations: [],
                user: {
                    name: 'Admin User'
                },
                error: "Failed to load collaborations"
            });
        }
    },

    async getCollaborationDetails(req, res) {
        try {
            const collabId = req.params.id;
            const collaboration = await CollaborationModel.getCollaborationById(collabId);
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