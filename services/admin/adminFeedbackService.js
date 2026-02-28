const FeedbackModel = require('../../models/Feedback');

class adminFeedbackService {
    static async getAllFeedback() {
        return await FeedbackModel.find().sort({ createdAt: -1 });
    }

    static async getFeedbackById(id) {
        return await FeedbackModel.findById(id);
    }

    static async updateFeedbackStatus(id, status) {
        return await FeedbackModel.findByIdAndUpdate(id, { status }, { new: true });
    }

    static async createFeedback(data) {
        const { userId, userName, userType, type, subject, message } = data;
        
        if (!userId || !userType || !type || !subject || !message) {
            throw new Error('Missing required fields');
        }

        const newFeedback = new FeedbackModel({
            userId,
            userName,
            userType,
            type,
            subject,
            message
        });

        return await newFeedback.save();
    }

    static async deleteFeedback(id) {
        return await FeedbackModel.findByIdAndDelete(id);
    }
}

module.exports = adminFeedbackService;
