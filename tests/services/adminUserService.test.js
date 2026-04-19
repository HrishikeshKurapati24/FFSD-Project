const mongoose = require('mongoose');
const adminUserService = require('../../services/admin/adminUserService');
const { BrandInfo } = require('../../models/BrandMongo');
const { InfluencerInfo, InfluencerSocials, InfluencerAnalytics } = require('../../models/InfluencerMongo');
const { createTestBrand, createTestInfluencer } = require('../setup/testHelpers');

describe('AdminUserService', () => {
    let brandId, influencerId;

    beforeEach(async () => {
        await BrandInfo.deleteMany({});
        await InfluencerInfo.deleteMany({});
        await InfluencerSocials.deleteMany({});
        await InfluencerAnalytics.deleteMany({});

        const brand = await createTestBrand({
            brandName: 'Admin Test Brand',
            email: 'admin_brand@test.com'
        });
        brandId = brand._id;

        const influencer = await createTestInfluencer({
            fullName: 'Admin Test Influencer',
            email: 'admin_influencer@test.com'
        });
        influencerId = influencer._id;

        // Create associated data for influencer
        await InfluencerSocials.create({
            influencerId: influencerId,
            socialHandle: '@admin_test',
            platforms: [{
                platform: 'instagram',
                handle: 'admin_test',
                followers: 5000
            }]
        });

        await InfluencerAnalytics.create({
            influencerId: influencerId,
            totalFollowers: 5000,
            avgEngagementRate: 3.5
        });
    });

    describe('getInfluencers', () => {
        it('should return influencers with socials and analytics', async () => {
            const { influencers, totalDocs } = await adminUserService.getInfluencers('Admin', 1, 10);
            expect(totalDocs).toBe(1);
            expect(influencers[0].fullName).toBe('Admin Test Influencer');
            expect(influencers[0].social_handles).toContain('@admin_test');
            expect(influencers[0].audienceSize).toBe(5000);
        });
    });

    describe('getBrands', () => {
        it('should return brands', async () => {
            const { brands, totalDocs } = await adminUserService.getBrands('Admin', 1, 10);
            expect(totalDocs).toBe(1);
            expect(brands[0].brandName).toBe('Admin Test Brand');
        });
    });

    describe('approveUser', () => {
        it('should approve an influencer', async () => {
            const result = await adminUserService.approveUser(influencerId, 'influencer');
            expect(result.success).toBe(true);
            const updated = await InfluencerInfo.findById(influencerId);
            expect(updated.verified).toBe(true);
        });

        it('should approve a brand', async () => {
            const result = await adminUserService.approveUser(brandId, 'brand');
            expect(result.success).toBe(true);
            const updated = await BrandInfo.findById(brandId);
            expect(updated.verified).toBe(true);
        });
    });

    describe('getUserManagementData', () => {
        it('should return combined user management data', async () => {
            const data = await adminUserService.getUserManagementData({ search: 'Admin' });
            expect(data.influencers.length).toBe(1);
            expect(data.brands.length).toBe(1);
            expect(data.meta.totalInfluencers).toBe(1);
            expect(data.meta.totalBrands).toBe(1);
        });
    });
});
