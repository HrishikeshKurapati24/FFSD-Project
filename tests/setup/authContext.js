const request = require('supertest');
const app = require('../../testApp');
const { createTestBrand, createTestInfluencer, createTestCustomer, createTestAdmin } = require('./testHelpers');
const { Admin } = require('../../mongoDB');

/**
 * Creates a supertest agent with a session cookie attached for a specified user type.
 * @param {string} userType - 'brand', 'influencer', or 'customer'
 * @param {Object} overrides - Any property overrides for the test user
 * @returns {Promise<{agent: Object, user: Object}>}
 */
const getAuthenticatedAgent = async (userType, overrides = {}) => {
    const agent = request.agent(app);
    let user;
    const password = 'password123';
    let loginEndpoint = '/auth/signin';
    let loginPayload = null;

    if (userType === 'brand') {
        user = await createTestBrand({ password, ...overrides });
    } else if (userType === 'influencer') {
        user = await createTestInfluencer({ password, ...overrides });
    } else if (userType === 'customer') {
        user = await createTestCustomer({ password, ...overrides });
    } else if (userType === 'admin') {
        user = await createTestAdmin({ password, ...overrides });
        loginEndpoint = '/admin/login/verify';
        loginPayload = { username: user.username, password };
    } else {
        throw new Error(`Unsupported user type for auth context: ${userType}`);
    }

    const response = await agent
        .post(loginEndpoint)
        .send(loginPayload || { email: user.email, password });

    if (response.status !== 200) {
        throw new Error(`Failed to sign in test user: ${response.body.message}`);
    }

    return { agent, user };
};

module.exports = { getAuthenticatedAgent };
