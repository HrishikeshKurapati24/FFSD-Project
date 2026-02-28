const fs = require('fs');

const ctrlPath = './controllers/admin/adminCustomerController.js';
let ctrlC = fs.readFileSync(ctrlPath, 'utf8');

// I'll keep the required module replacements the same, but doing via regex to replace the whole CustomerController.
const methods = `const CustomerController = {
    async getCustomerManagement(req, res) {
        try {
            const isAPIRequest = (req) => {
                const acceptHeader = (req.headers.accept || '').toLowerCase();
                return acceptHeader.includes('application/json') || req.xhr;
            };

            const AdminCustomerService = require('../../services/admin/adminCustomerService');
            const data = await AdminCustomerService.getCustomerManagementData();

            if (isAPIRequest(req)) {
                res.setHeader('Content-Type', 'application/json');
                return res.status(200).json({
                    success: true,
                    ...data
                });
            }

            return res.render('admin/customer-management', {
                ...data,
                user: res.locals.user
            });
        } catch (error) {
            console.error('Error in getCustomerManagement:', error);
            const isAPIRequest = (req) => {
                return (req.headers.accept && req.headers.accept.includes('application/json')) || req.xhr;
            };

            if (isAPIRequest(req)) {
                res.setHeader('Content-Type', 'application/json');
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch customer management data',
                    message: error.message
                });
            }
            return res.status(500).send('Failed to load customer management page');
        }
    },

    async getCustomerDetails(req, res) {
        try {
            const AdminCustomerService = require('../../services/admin/adminCustomerService');
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
            const AdminCustomerService = require('../../services/admin/adminCustomerService');
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
            const AdminCustomerService = require('../../services/admin/adminCustomerService');
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
            const isAPIRequest = (req) => {
                const acceptHeader = (req.headers.accept || '').toLowerCase();
                return acceptHeader.includes('application/json') || req.xhr;
            };

            const AdminCustomerService = require('../../services/admin/adminCustomerService');
            const customers = await AdminCustomerService.getAllCustomers();

            if (isAPIRequest(req)) {
                res.setHeader('Content-Type', 'application/json');
                return res.status(200).json({
                    success: true,
                    customers
                });
            }

            return res.render('admin/all-customers', {
                customers,
                user: res.locals.user
            });
        } catch (error) {
            console.error('Error in getAllCustomers:', error);
            const isAPIRequest = (req) => {
                return (req.headers.accept && req.headers.accept.includes('application/json')) || req.xhr;
            };

            if (isAPIRequest(req)) {
                res.setHeader('Content-Type', 'application/json');
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch customers',
                    message: error.message
                });
            }
            return res.status(500).send('Failed to load customers page');
        }
    },

    async getCompletedOrders(req, res) {
        try {
            const AdminCustomerService = require('../../services/admin/adminCustomerService');
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
            const AdminCustomerService = require('../../services/admin/adminCustomerService');
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
};`;

ctrlC = ctrlC.replace(/const CustomerController = \{[\s\S]*?(?=module\.exports = CustomerController;)/, methods + '\n\n');

fs.writeFileSync(ctrlPath, ctrlC);

