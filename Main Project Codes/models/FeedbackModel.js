const db = require("../config/database");

class FeedbackModel {
    static async getAllFeedback() {
        try {
            return db.feedback || [];
        } catch (error) {
            console.error('Error in getAllFeedback:', error);
            return [];
        }
    }

    static async getFeedbackById(id) {
        try {
            return db.feedback.find(feedback => feedback.id === parseInt(id));
        } catch (error) {
            console.error('Error in getFeedbackById:', error);
            return null;
        }
    }

    static async updateFeedbackStatus(id, status) {
        try {
            const feedbackIndex = db.feedback.findIndex(feedback => feedback.id === parseInt(id));
            if (feedbackIndex !== -1) {
                db.feedback[feedbackIndex].status = status;
                return { success: true, message: 'Feedback status updated successfully' };
            }
            return { success: false, message: 'Feedback not found' };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = FeedbackModel;