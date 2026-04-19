const FeedbackModel = require('../../models/Feedback');

class adminFeedbackService {
    static async getAllFeedback(queryParams = {}) {
        const { 
            page = 1, 
            limit = 15, 
            search = '', 
            status = 'all',
            type = 'all',
            userRole = 'all'
        } = queryParams;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const query = {};

        if (search) {
            query.$or = [
                { subject: { $regex: search, $options: 'i' } },
                { userName: { $regex: search, $options: 'i' } },
                { message: { $regex: search, $options: 'i' } }
            ];
        }

        if (status !== 'all') query.status = status;
        if (type !== 'all') query.type = type;
        if (userRole !== 'all') query.userType = userRole;

        const [feedbacks, total] = await Promise.all([
            FeedbackModel.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            FeedbackModel.countDocuments(query)
        ]);

        return {
            feedbacks,
            meta: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        };
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
