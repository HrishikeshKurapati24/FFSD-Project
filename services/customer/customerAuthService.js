const bcrypt = require('bcrypt');
const { Customer } = require('../../models/CustomerMongo');

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

// Compare password
const comparePassword = async (plainPassword, hashedPassword) => {
    try {
        return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
        throw new Error(`Failed to compare passwords: ${error.message}`);
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

module.exports = {
    createCustomer,
    comparePassword,
    updateCustomerPassword
};
