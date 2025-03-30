const db = require("../config/database");

class PaymentModel {
    static async getAllPayments() {
        try {
            return db.payments || [];
        } catch (error) {
            console.error('Error in getAllPayments:', error);
            return [];
        }
    }

    static async getPaymentById(id) {
        try {
            return db.payments.find(payment => payment.transactionId === id);
        } catch (error) {
            console.error('Error in getPaymentById:', error);
            return null;
        }
    }

    static async updatePaymentStatus(id, status) {
        try {
            const paymentIndex = db.payments.findIndex(payment => payment.transactionId === id);
            if (paymentIndex !== -1) {
                db.payments[paymentIndex].status = status;
                return { success: true, message: 'Payment status updated successfully' };
            }
            return { success: false, message: 'Payment not found' };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = PaymentModel;