const axios = require('axios');
const brandProfileService = require('../../services/brand/brandProfileService');
const { InfluencerInfo } = require('../../models/InfluencerMongo');
const { createTestInfluencer, createTestBrand } = require('../setup/testHelpers');
const RedisMock = require('../mocks/redis');

// Mock axios globally
jest.mock('axios');

describe('Resiliency Tests (Fallback Mechanisms)', () => {
    let brandId;

    beforeEach(async () => {
        await InfluencerInfo.deleteMany({});
        const brand = await createTestBrand();
        brandId = brand._id;

        await createTestInfluencer({
            fullName: 'Elastic Influencer',
            categories: ['Tech']
        });

        // Reset all mocks
        jest.clearAllMocks();
    });

    describe('Elasticsearch Fallback', () => {
        it('should fallback to MongoDB when Elasticsearch is down', async () => {
            // Mock axios to fail for the ES endpoint
            axios.post.mockRejectedValueOnce(new Error('ES Down'));
            
            // Call service that uses ES - search for 'Elastic' which is in the fullName
            const result = await brandProfileService.getExplorePageData(brandId, null, 'Elastic');

            // Verify that we still got results (from MongoDB fallback)
            expect(result.influencers.length).toBeGreaterThan(0);
            expect(result.influencers.some(inf => inf.fullName === 'Elastic Influencer')).toBe(true);
        });
    });

    describe('Redis Fallback', () => {
        it('should handle Redis errors gracefully', async () => {
            // Mock Redis to throw error on get
            RedisMock.get.mockRejectedValueOnce(new Error('Redis Connection Error'));
            
            // Even if Redis fails, the service should still work
            const result = await brandProfileService.getExplorePageData(brandId);
            expect(result.influencers).toBeDefined();
            expect(result.influencers.length).toBeGreaterThan(0);
        });
    });

    describe('External Gateway Resiliency (Razorpay)', () => {
        it('should handle payment gateway timeouts gracefully', async () => {
            const razorpayGatewayService = require('../../services/payment/razorpayGatewayService');
            const RazorpayMock = require('../mocks/razorpay');
            
            // Mock Razorpay client to fail
            // getClient() returns a new Razorpay() instance, and our mock replaces the entire lib
            RazorpayMock.orders.create.mockRejectedValueOnce(new Error('Gateway Timeout'));

            await expect(razorpayGatewayService.createOrder({ amount: 500, receipt: 'test_rcpt' }))
                .rejects.toThrow('Gateway Timeout');
        });
    });
});
