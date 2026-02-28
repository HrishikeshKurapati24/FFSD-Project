const fs = require('fs');

const ctrlPath = './controllers/admin/adminFeedbackController.js';
let ctrlC = fs.readFileSync(ctrlPath, 'utf8');

// The replacement logic was getting long, so node script is reliable.

const requireReplacement = `const FeedbackModel = require("../../models/Feedback");
const AdminFeedbackService = require("../../services/admin/adminFeedbackService");`;
ctrlC = ctrlC.replace('const FeedbackModel = require("../../models/Feedback");', requireReplacement);

const newMethods = `const FeedbackController = {
    async getAllFeedback(req, res) {
        try {
            // Helper function to detect API requests
            const isAPIRequest = (req) => {
                const acceptHeader = (req.headers.accept || req.headers['accept'] || '').toLowerCase();
                const fullPath = req.originalUrl || req.url || req.path || '';
                const pathOnly = fullPath.split('?')[0].toLowerCase();

                if (acceptHeader.includes('application/json')) return true;
                if (req.xhr) return true;
                if (pathOnly.startsWith('/api/')) return true;
                if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) return true;

                const origin = (req.headers.origin || req.headers['origin'] || '').toLowerCase();
                const referer = (req.headers.referer || req.headers['referer'] || '').toLowerCase();
                if (origin.includes('localhost:5173') || origin.includes('localhost:3000') ||
                    referer.includes('localhost:5173') || referer.includes('localhost:3000')) {
                    return true;
                }

                return pathOnly === '/admin/feedback_and_moderation' || pathOnly === '/feedback_and_moderation';
            };

            const feedbacks = await AdminFeedbackService.getAllFeedback();
            const data = { feedbacks: feedbacks || [] };

            // Check if this is an API request
            if (isAPIRequest(req)) {
                res.setHeader('Content-Type', 'application/json');
                return res.status(200).json({
                    success: true,
                    ...data
                });
            }

            // Render HTML for page requests
            res.render("admin/feedback_and_moderation", {
                ...data,
                user: {
                    name: 'Admin User'
                }
            });
        } catch (error) {
            console.error("Error fetching feedback:", error);
            const isAPIRequest = (req) => {
                return (req.headers.accept && req.headers.accept.includes('application/json')) ||
                    req.xhr ||
                    (req.originalUrl || req.url || '').includes('/feedback_and_moderation');
            };

            if (isAPIRequest(req)) {
                res.setHeader('Content-Type', 'application/json');
                return res.status(500).json({
                    success: false,
                    error: 'Failed to load feedback',
                    message: error.message
                });
            }

            res.render("admin/feedback_and_moderation", {
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
            if(error.message === 'Missing required fields') {
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
};`;

ctrlC = ctrlC.replace(/const FeedbackController = \{[\s\S]*?(?=module\.exports = FeedbackController;)/, newMethods + '\n\n');

fs.writeFileSync(ctrlPath, ctrlC);

