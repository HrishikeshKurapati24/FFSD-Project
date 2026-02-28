const { Customer } = require('../../models/CustomerMongo');

// Get customer by ID
const getCustomerById = async (customerId) => {
    try {
        const customer = await Customer.findById(customerId).select('-password');
        return customer;
    } catch (error) {
        throw new Error(`Failed to get customer: ${error.message}`);
    }
};

// Get customer by email
const getCustomerByEmail = async (email, includePassword = false) => {
    try {
        const query = Customer.findOne({ email: email.toLowerCase() });
        if (includePassword) {
            query.select('+password');
        }
        const customer = await query;
        return customer;
    } catch (error) {
        throw new Error(`Failed to get customer by email: ${error.message}`);
    }
};

// Update customer profile
const updateCustomerProfile = async (customerId, updateData) => {
    try {
        const allowedFields = ['name', 'phone', 'preferences'];
        const filteredData = {};

        for (const key of allowedFields) {
            if (updateData[key] !== undefined) {
                filteredData[key] = updateData[key];
            }
        }

        const updatedCustomer = await Customer.findByIdAndUpdate(
            customerId,
            { $set: filteredData },
            { new: true }
        ).select('-password');

        return updatedCustomer;
    } catch (error) {
        throw new Error(`Failed to update customer profile: ${error.message}`);
    }
};

// Update purchase history
const updatePurchaseHistory = async (customerId, amount) => {
    try {
        const customer = await Customer.findByIdAndUpdate(
            customerId,
            {
                $inc: { total_purchases: 1, total_spent: amount },
                $set: { last_purchase_date: new Date() }
            },
            { new: true }
        ).select('-password');

        return customer;
    } catch (error) {
        throw new Error(`Failed to update purchase history: ${error.message}`);
    }
};

// Delete customer
const deleteCustomer = async (customerId) => {
    try {
        const customer = await Customer.findByIdAndDelete(customerId);
        return customer;
    } catch (error) {
        throw new Error(`Failed to delete customer: ${error.message}`);
    }
};

module.exports = {
    getCustomerById,
    getCustomerByEmail,
    updateCustomerProfile,
    updatePurchaseHistory,
    deleteCustomer
};
