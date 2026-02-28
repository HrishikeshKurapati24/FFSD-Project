const bcrypt = require('bcrypt');
const { Customer } = require('../models/CustomerMongo');

// Create a new customer
const createCustomer = async (customerData) => {
    try {
        // Create customer and rely on schema hooks to hash password
        const newCustomer = new Customer({
            name: customerData.name,
            email: customerData.email && customerData.email.toLowerCase(),
            password: customerData.password,
            phone: customerData.phone || '',
            preferences: customerData.preferences || {
                categories: [],
                brands: [],
                price_range: { min: 0, max: 10000 }
            }
        });

        const savedCustomer = await newCustomer.save();
        
        // Return without password
        const customerObj = savedCustomer.toObject();
        delete customerObj.password;
        return customerObj;
    } catch (error) {
        throw new Error(`Failed to create customer: ${error.message}`);
    }
};

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

// Compare password
const comparePassword = async (plainPassword, hashedPassword) => {
    try {
        return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
        throw new Error(`Failed to compare passwords: ${error.message}`);
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

// Update customer password
const updateCustomerPassword = async (customerId, oldPassword, newPassword) => {
    try {
        const customer = await Customer.findById(customerId);
        
        if (!customer) {
            throw new Error('Customer not found');
        }

        // Compare old password
        const isPasswordValid = await comparePassword(oldPassword, customer.password);
        if (!isPasswordValid) {
            throw new Error('Old password is incorrect');
        }

        // Assign new plain password and let schema pre-save hook hash it
        customer.password = newPassword;
        await customer.save();

        return { message: 'Password updated successfully' };
    } catch (error) {
        throw new Error(`Failed to update password: ${error.message}`);
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
    createCustomer,
    getCustomerById,
    getCustomerByEmail,
    comparePassword,
    updateCustomerProfile,
    updateCustomerPassword,
    updatePurchaseHistory,
    deleteCustomer
};
