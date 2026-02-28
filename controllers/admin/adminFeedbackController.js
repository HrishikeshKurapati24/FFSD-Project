const AdminFeedbackService = require("../../services/admin/adminFeedbackService");
const { isAPIRequest } = require("../../utils/requestUtils");

const FeedbackController = {
    async getAllFeedback(req, res) {
        try {
            const feedbacks = await AdminFeedbackService.getAllFeedback();
            const data = { feedbacks: feedbacks || [] };

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).json({
                success: true,
                ...data
            });
        } catch (error) {
            console.error("Error fetching feedback:", error);
            return res.status(500).json({
                success: false,
                error: 'Failed to load feedback',
                message: error.message
            });
        }
    },

    async getFeedbackDetails(req, res) {
        try {
            const feedbackId = req.params.id;
            const feedback = await AdminFeedbackService.getFeedbackById(feedbackId);
            if (!feedback) {
                return res.status(404).send("Feedback Not Found");
            }
            res.json(feedback);
        } catch (error) {
            console.error("Error fetching feedback details:", error);
            res.status(500).send("Internal Server Error");
        }
    },

    async updateFeedbackStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const result = await AdminFeedbackService.updateFeedbackStatus(id, status);
            if (result) {
                res.json({ success: true, message: 'Feedback status updated successfully', feedback: result });
            } else {
                res.status(404).json({ success: false, message: 'Feedback not found' });
            }
        } catch (error) {
            console.error("Error updating feedback status:", error);
            res.status(500).send("Internal Server Error");
        }
    },

    async submitFeedback(req, res) {
        try {
            const newFeedback = await AdminFeedbackService.createFeedback(req.body);

            res.status(201).json({
                success: true,
                message: 'Feedback submitted successfully',
                feedback: newFeedback
            });
        } catch (error) {
            console.error("Error submitting feedback:", error);
            if (error.message === 'Missing required fields') {
                return res.status(400).json({ success: false, message: 'Missing required field' });
            }
            res.status(500).json({
                success: false,
                message: 'Failed to submit feedback',
                error: error.message
            });
        }
    },

    async deleteFeedback(req, res) {
        try {
            const { id } = req.params;
            const result = await AdminFeedbackService.deleteFeedback(id);
            if (result) {
                res.json({ success: true, message: 'Feedback deleted successfully' });
            } else {
                res.status(404).json({ success: false, message: 'Feedback not found' });
            }
        } catch (error) {
            console.error("Error deleting feedback:", error);
            res.status(500).json({ success: false, message: 'Failed to delete feedback' });
        }
    }
};

module.exports = FeedbackController;
