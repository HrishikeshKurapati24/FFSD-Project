const PaymentModel = require("../models/PaymentModel");

const PaymentController = {
    async getAllPayments(req, res) {
        try {
            const payments = await PaymentModel.getAllPayments();
            res.render("payment_verification", {
                payments: payments || [],
                user: {
                    name: 'Admin User'
                }
            });
        } catch (error) {
            console.error("Error fetching payments:", error);
            res.render("payment_verification", {
                payments: [],
                user: {
                    name: 'Admin User'
                },
                error: "Failed to load payments"
            });
        }
    },

    async getPaymentDetails(req, res) {
        try {
            const paymentId = req.params.id;
            const payment = await PaymentModel.getPaymentById(paymentId);
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
            const { id, status } = req.body;
            const result = await PaymentModel.updatePaymentStatus(id, status);
            res.json(result);
        } catch (error) {
            console.error("Error updating payment status:", error);
            res.status(500).send("Internal Server Error");
        }
    }
};

module.exports = PaymentController;