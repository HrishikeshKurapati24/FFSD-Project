const FeedbackModel = require("../models/FeedbackModel");

const FeedbackController = {
    async getAllFeedback(req, res) {
        try {
            const feedbacks = await FeedbackModel.getAllFeedback();
            res.render("feedback_and_moderation", {
                feedbacks: feedbacks || [],
                user: {
                    name: 'Admin User'
                }
            });
        } catch (error) {
            console.error("Error fetching feedback:", error);
            res.render("feedback_and_moderation", {
                feedbacks: [],
                user: {
                    name: 'Admin User'
                },
                error: "Failed to load feedback"
            });
        }
    },

    async getFeedbackDetails(req, res) {
        try {
            const feedbackId = req.params.id;
            const feedback = await FeedbackModel.getFeedbackById(feedbackId);
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
            const { id, status } = req.body;
            const result = await FeedbackModel.updateFeedbackStatus(id, status);
            res.json(result);
        } catch (error) {
            console.error("Error updating feedback status:", error);
            res.status(500).send("Internal Server Error");
        }
    }
};

module.exports = FeedbackController;