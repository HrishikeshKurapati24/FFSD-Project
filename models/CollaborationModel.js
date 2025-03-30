const db = require("../config/database");

class CollaborationModel {
    static async getAllCollaborations() {
        try {
            return db.collaborations || [];
        } catch (error) {
            console.error('Error in getAllCollaborations:', error);
            return [];
        }
    }

    static async getCollaborationById(id) {
        try {
            return db.collaborations.find(collab => collab.id === parseInt(id));
        } catch (error) {
            console.error('Error in getCollaborationById:', error);
            return null;
        }
    }
}

module.exports = CollaborationModel;