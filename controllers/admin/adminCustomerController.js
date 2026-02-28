const AdminCustomerService = require('../../services/admin/adminCustomerService');
const { isAPIRequest } = require("../../utils/requestUtils");

const CustomerController = {
    async getCustomerManagement(req, res) {
        try {
            const data = await AdminCustomerService.getCustomerManagementData();

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).json({
                success: true,
                ...data
            });
        } catch (error) {
            console.error('Error in getCustomerManagement:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch customer management data',
                message: error.message
            });
        }
    },

    async getCustomerDetails(req, res) {
        try {
            const customer = await AdminCustomerService.getCustomerDetails(req.params.id);

            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer not found'
                });
            }

            return res.status(200).json({
                success: true,
                customer
            });
        } catch (error) {
            console.error('Error in getCustomerDetails:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch customer details',
                message: error.message
            });
        }
    },

    async updateCustomerStatus(req, res) {
        try {
            const { status, notes } = req.body;
            const customer = await AdminCustomerService.updateCustomerStatus(req.params.id, status, notes);

            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer not found'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Customer updated successfully',
                customer
            });
        } catch (error) {
            console.error('Error in updateCustomerStatus:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to update customer',
                message: error.message
            });
        }
    },

    async getCustomerAnalytics(req, res) {
        try {
            const analytics = await AdminCustomerService.getCustomerAnalytics();

            return res.status(200).json({
                success: true,
                analytics
            });
        } catch (error) {
            console.error('Error in getCustomerAnalytics:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch customer analytics',
                message: error.message
            });
        }
    },

    async getAllCustomers(req, res) {
        try {
            const customers = await AdminCustomerService.getAllCustomers();

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).json({
                success: true,
                customers
            });
        } catch (error) {
            console.error('Error in getAllCustomers:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch customers',
                message: error.message
            });
        }
    },

    async getCompletedOrders(req, res) {
        try {
            const data = await AdminCustomerService.getCompletedOrders();

            return res.status(200).json({
                success: true,
                ...data
            });
        } catch (error) {
            console.error('Error in getCompletedOrders:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch completed orders',
                message: error.message
            });
        }
    },

    async getProductAnalytics(req, res) {
        try {
            const analytics = await AdminCustomerService.getProductAnalytics();

            res.status(200).json({
                success: true,
                analytics
            });
        } catch (error) {
            console.error('Error fetching product analytics:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
};

module.exports = CustomerController;
