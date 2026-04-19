const mongoose = require('mongoose');
const { createTestBrand } = require('./setup/testHelpers');

describe('Smoke Test - Infrastructure Verification', () => {
    it('should connect to the test database and perform a simple operation', async () => {
        // Verify we are using the test database
        expect(mongoose.connection.name).toBe('CollabSync_Test');

        // Verify factory and DB operation
        const brand = await createTestBrand({ brandName: 'Smoke Test Brand' });
        expect(brand._id).toBeDefined();
        expect(brand.brandName).toBe('Smoke Test Brand');

        // Verify cleanup will occur (beforeEach handled by globalSetup)
    });

    it('should verify that mocks are working', () => {
        const redis = require('./mocks/redis');
        const razorpay = require('./mocks/razorpay');
        const cloudinary = require('./mocks/cloudinary');
        const axios = require('axios');

        expect(jest.isMockFunction(axios.create)).toBe(true);
        expect(jest.isMockFunction(razorpay.orders.create)).toBe(true);
    });
});
