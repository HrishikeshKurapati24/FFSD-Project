const customerProfileService = require('../../services/customer/customerProfileService');

class CustomerProfileController {
    static getAuthenticatedCustomerId(req) {
        return (req.session?.user?.userType === 'customer' && req.session?.user?.id)
            ? req.session.user.id
            : (req.user?.userType === 'customer' && req.user?.id ? req.user.id : null);
    }

    static async getProfile(req, res) {
        try {
            const customerId = CustomerProfileController.getAuthenticatedCustomerId(req);
            if (!customerId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            const data = await customerProfileService.getCustomerProfileWithPayment(customerId);
            return res.json({ success: true, ...data });
        } catch (error) {
            console.error('Error fetching customer profile:', error);
            return res.status(error.message === 'Customer not found' ? 404 : 500).json({
                success: false,
                message: error.message || 'Unable to fetch customer profile'
            });
        }
    }

    static async updateProfile(req, res) {
        try {
            const customerId = CustomerProfileController.getAuthenticatedCustomerId(req);
            if (!customerId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            const customer = await customerProfileService.updateCustomerProfile(customerId, req.body);
            return res.json({ success: true, customer });
        } catch (error) {
            console.error('Error updating customer profile:', error);
            return res.status(400).json({ success: false, message: error.message || 'Unable to update profile' });
        }
    }

    static async getPaymentProfile(req, res) {
        try {
            const customerId = CustomerProfileController.getAuthenticatedCustomerId(req);
            if (!customerId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            const { payment } = await customerProfileService.getCustomerProfileWithPayment(customerId);
            return res.json({ success: true, ...payment });
        } catch (error) {
            console.error('Error fetching customer payment profile:', error);
            return res.status(400).json({ success: false, message: error.message || 'Unable to fetch payment profile' });
        }
    }

    static async createPaymentSetupOrder(req, res) {
        try {
            const customerId = CustomerProfileController.getAuthenticatedCustomerId(req);
            if (!customerId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            const setupOrder = await customerProfileService.createCustomerPaymentSetupOrder(customerId);
            return res.json({ success: true, ...setupOrder });
        } catch (error) {
            console.error('Error creating customer setup order:', error);
            return res.status(400).json({ success: false, message: error.message || 'Unable to start payment setup' });
        }
    }

    static async savePaymentMethod(req, res) {
        try {
            const customerId = CustomerProfileController.getAuthenticatedCustomerId(req);
            if (!customerId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            const result = await customerProfileService.saveCustomerPaymentMethod(customerId, req.body);
            return res.json({
                success: true,
                message: 'Payment profile saved successfully',
                ...result
            });
        } catch (error) {
            console.error('Error saving customer payment method:', error);
            return res.status(400).json({ success: false, message: error.message || 'Unable to save payment method' });
        }
    }
}

module.exports = CustomerProfileController;
