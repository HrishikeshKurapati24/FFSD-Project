const AdminPaymentService = require("../../services/admin/adminPaymentService");
const { isAPIRequest } = require("../../utils/requestUtils");

const PaymentController = {
    async getAllPayments(req, res) {
        try {
            let payments = await AdminPaymentService.getAllPayments();

            // Map payments to ensure brand and influencer names are correctly set
            payments = payments.map(payment => ({
                ...payment,
                brand: payment.brand || '',
                influencer: payment.influencer || ''
            }));

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).json({
                success: true,
                payments
            });
        } catch (error) {
            console.error("Error fetching payments:", error);
            return res.status(500).json({
                success: false,
                error: 'Failed to load payments',
                message: error.message
            });
        }
    },

    async getInfluencerCategories(req, res) {
        try {
            const categories = await AdminPaymentService.getInfluencerCategories();
            return res.status(200).json({
                success: true,
                categories
            });
        } catch (error) {
            console.error("Error fetching influencer categories:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch influencer categories"
            });
        }
    },

    async getPaymentDetails(req, res) {
        try {
            const paymentId = req.params.id;
            const payment = await AdminPaymentService.getPaymentById(paymentId);
            if (!payment) {
                return res.status(404).json({ error: "Payment Not Found" });
            }
            res.json(payment);
        } catch (error) {
            console.error("Error fetching payment details:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    },

    async updatePaymentStatus(req, res) {
        try {
            const id = req.params.id;
            const { status } = req.body;
            const result = await AdminPaymentService.updatePaymentStatus(id, status);
            res.json(result);
        } catch (error) {
            console.error("Error updating payment status:", error);
            res.status(500).send("Internal Server Error");
        }
    }
};

module.exports = PaymentController;
