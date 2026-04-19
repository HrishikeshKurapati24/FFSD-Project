const mongoose = require('mongoose');
const brandProfileService = require('../../services/brand/brandProfileService');
const { BrandInfo, BrandSocials } = require('../../models/BrandMongo');
const { CampaignInfo, CampaignMetrics } = require('../../models/CampaignMongo');
const { createTestBrand, createTestCampaign } = require('../setup/testHelpers');

describe('BrandProfileService', () => {
    let brandId;

    beforeEach(async () => {
        await BrandInfo.deleteMany({});
        await BrandSocials.deleteMany({});
        await CampaignInfo.deleteMany({});
        await CampaignMetrics.deleteMany({});

        const brand = await createTestBrand({
            brandName: 'Profile Test Brand',
            displayName: 'Profile Test Brand',
            username: 'profilebrand',
            industry: 'Retail',
            socialProfiles: [{ platform: 'instagram', followers: 1000, handle: 'profilebrand' }]
        });

        brandId = brand._id;
    });

    describe('getBrandProfileData', () => {
        it('should return transformed brand profile data', async () => {
            const profile = await brandProfileService.getBrandProfileData(brandId);
            expect(profile).not.toBeNull();
            expect(profile.displayName).toBe('Profile Test Brand');
            expect(profile.socials.length).toBe(1);
            expect(profile.socials[0].platform).toBe('instagram');
        });
    });

    describe('updateBrandProfileData', () => {
        it('should update profile and sync social links', async () => {
            const updateData = {
                name: 'Updated Brand',
                username: 'updatedbrand',
                industry: 'Fashion',
                socialLinks: [
                    { platform: 'twitter', url: 'https://twitter.com/updatedbrand', followers: 500 }
                ]
            };

            const updated = await brandProfileService.updateBrandProfileData(brandId, updateData);
            expect(updated.brandName).toBe('Updated Brand');
            expect(updated.industry).toBe('Fashion');

            // Verify social link sync in BrandInfo
            const brand = await BrandInfo.findById(brandId);
            expect(brand.socialProfiles.length).toBe(1);
            expect(brand.socialProfiles[0].platform).toBe('twitter');

            // Verify social link sync in BrandSocials
            const socials = await BrandSocials.findOne({ brandId });
            expect(socials).not.toBeNull();
            expect(socials.platforms[0].platform).toBe('twitter');
        });

        it('should throw error if required fields are missing', async () => {
            await expect(brandProfileService.updateBrandProfileData(brandId, { name: 'Only Name' }))
                .rejects.toThrow('Missing required fields: username');
        });
    });

    describe('getBrandPaymentProfile', () => {
        it('should return formatted payment profile', async () => {
            const profile = await brandProfileService.getBrandPaymentProfile(brandId);
            expect(profile).toHaveProperty('hasSavedPaymentMethod');
            expect(profile).toHaveProperty('paymentProfile');
        });
    });

    describe('saveBrandPaymentMethod', () => {
        it('should save payment method and update profile', async () => {
            const payload = {
                paymentMethodId: 'pm_123',
                cardDetails: { cardNumber: '4111111111114444', network: 'visa' },
                billingDetails: { name: 'Billing Name', email: 'billing@test.com' }
            };

            const profile = await brandProfileService.saveBrandPaymentMethod(brandId, payload);
            expect(profile.hasSavedPaymentMethod).toBe(true);
            expect(profile.paymentMethodSummary.cardLast4).toBe('4444');
            expect(profile.paymentProfile.billingName).toBe('Billing Name');
        });
    });

    describe('getBrandStats', () => {
        it('should return stats from performance_metrics', async () => {
            await BrandInfo.findByIdAndUpdate(brandId, {
                performance_metrics: {
                    totalCampaigns: 5,
                    totalRevenue: 50000
                }
            });

            const stats = await brandProfileService.getBrandStats(brandId);
            expect(stats.total_campaigns).toBe(5);
            expect(stats.total_revenue).toBe(50000);
        });
    });
});
