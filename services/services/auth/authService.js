const { BrandInfo } = require('../../models/BrandMongo');
const { InfluencerInfo } = require('../../models/InfluencerMongo');
const { Customer } = require('../../models/CustomerMongo');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class AuthService {
    /**
     * Authenticates a user based on email and password across all user types
     * @param {string} email 
     * @param {string} password 
     * @returns {Object} { user, userType, error }
     */
    static async authenticateUser(email, password) {
        // Try to find brand first (include password explicitly)
        let user = await BrandInfo.findOne({ email }).select('+password');
        let userType = 'brand';

        // If not found, try influencer
        if (!user) {
            user = await InfluencerInfo.findOne({ email }).select('+password');
            userType = 'influencer';
        }

        // If not found, try customer
        if (!user) {
            user = await Customer.findOne({ email }).select('+password');
            userType = 'customer';
        }

        // If no user found
        if (!user) {
            return { error: 'Invalid email or password', status: 400 };
        }

        // Check for suspension (Customer only)
        if (userType === 'customer' && user.status === 'suspended') {
            const errorMessage = user.admin_notes || 'Your account has been suspended by the admin.';
            return { error: errorMessage, status: 403, suspended: true };
        }

        // Defensive check: ensure we have a password hash to compare
        if (!user.password) {
            console.warn('Signin warning: missing password hash for user', { email, userType, id: user._id });
            return { error: 'Invalid email or password', status: 400 };
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return { error: 'Invalid email or password', status: 400 };
        }

        return { user, userType };
    }

    /**
     * Fetches complete user details from a decoded JWT token
     * @param {Object} jwtUser { id, userType } 
     * @returns {Object} full user details
     */
    static async verifyUserFromToken(jwtUser) {
        let user;
        if (jwtUser.userType === 'brand') {
            user = await BrandInfo.findById(jwtUser.id).select('email displayName brandName').lean();
        } else if (jwtUser.userType === 'influencer') {
            user = await InfluencerInfo.findById(jwtUser.id).select('email displayName fullName').lean();
        } else if (jwtUser.userType === 'customer') {
            user = await Customer.findById(jwtUser.id).select('email name').lean();
        }

        if (!user) return null;

        return {
            id: jwtUser.id,
            email: user.email,
            userType: jwtUser.userType,
            displayName: user.displayName || user.brandName || user.fullName || user.name
        };
    }

    /**
     * Registers a new customer
     * @param {Object} data { name, email, password, phone } 
     * @returns {Object} { customer, error }
     */
    static async registerCustomer(data) {
        const { name, email, password, phone } = data;

        // Validate required fields
        if (!name || !email || !password) {
            return { error: 'Name, email, and password are required', status: 400 };
        }

        // Check if customer already exists
        const existingCustomer = await Customer.findOne({ email: email.toLowerCase() });
        if (existingCustomer) {
            return { error: 'Email already registered', status: 400 };
        }

        // Create new customer and let schema hooks hash the password
        const newCustomer = new Customer({
            name,
            email: email.toLowerCase(),
            password: password,
            phone: phone || ''
        });

        const savedCustomer = await newCustomer.save();

        // Return without password
        const customerResponse = savedCustomer.toObject();
        delete customerResponse.password;

        return { customer: customerResponse };
    }
}

module.exports = AuthService;
