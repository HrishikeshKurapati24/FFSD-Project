const mongoose = require('mongoose');
const { seedSubscriptionPlans } = require('./testHelpers');
require('./envSetup');

beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGO_URI);
    }
    
    // Clear all collections at the start of each test suite
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }

    // Seed mandatory data
    await seedSubscriptionPlans();
});

afterAll(async () => {
    await mongoose.connection.close();
});

// Remove the beforeEach that clears everything, as it breaks tests using beforeAll setup
// If individual tests need isolation, they should handle their own cleanup or setup.

// Global Mocks
jest.mock('ioredis', () => {
    const redisMock = jest.requireActual('../mocks/redis');
    return jest.fn().mockImplementation(() => redisMock);
});

jest.mock('razorpay', () => {
    const razorpayMock = jest.requireActual('../mocks/razorpay');
    return jest.fn().mockImplementation(() => razorpayMock);
});

jest.mock('cloudinary', () => {
    const cloudinaryMock = jest.requireActual('../mocks/cloudinary');
    return { v2: cloudinaryMock };
});

jest.mock('axios', () => {
    const elasticMock = jest.requireActual('../mocks/elasticsearch');
    return {
        create: jest.fn().mockReturnValue(elasticMock),
        get: elasticMock.get,
        post: elasticMock.post,
        put: elasticMock.put,
        delete: elasticMock.delete,
        head: elasticMock.head
    };
});

// Mock redis connection service
jest.mock('../../services/queues/redisConnection', () => {
    const redisMock = jest.requireActual('../mocks/redis');
    return {
        getRedisConnection: () => redisMock
    };
});


