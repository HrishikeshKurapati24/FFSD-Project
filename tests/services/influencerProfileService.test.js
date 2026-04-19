const mongoose = require('mongoose');
const influencerProfileService = require('../../services/influencer/influencerProfileService');
const { InfluencerInfo, InfluencerSocials } = require('../../models/InfluencerMongo');
const { CampaignInfluencers, CampaignPayments } = require('../../models/CampaignMongo');
const { createTestInfluencer, createTestBrand, createTestCampaign } = require('../setup/testHelpers');

describe('InfluencerProfileService', () => {
    let influencerId;

    beforeEach(async () => {
        await InfluencerInfo.deleteMany({});
        await InfluencerSocials.deleteMany({});
        await CampaignInfluencers.deleteMany({});
        await CampaignPayments.deleteMany({});

        const influencer = await createTestInfluencer({
            fullName: 'Influencer Test',
            displayName: 'Influencer Test',
            username: 'influencertest',
            analytics_snapshot: {
                totalFollowers: 10000,
                avgEngagementRate: 5.2,
                monthlyEarnings: 2000
            },
            socialProfiles: [{ platform: 'instagram', followers: 10000, handle: 'influencertest' }]
        });

        influencerId = influencer._id;
    });

    describe('getInfluencerById', () => {
        it('should return influencer with processed metrics', async () => {
            const result = await influencerProfileService.getInfluencerById(influencerId);
            expect(result).not.toBeNull();
            expect(result.total_followers).toBe(10000);
            expect(result.avgEngagementRate).toBe("5.20");
            expect(result.monthlyEarnings).toBe(2000);
        });
    });

    describe('getInfluencerProfileDetails', () => {
        it('should return detailed profile information', async () => {
            const details = await influencerProfileService.getInfluencerProfileDetails(influencerId);
            expect(details).not.toBeNull();
            expect(details.displayName).toBe('Influencer Test');
            expect(details.socials.length).toBe(1);
            expect(details.socials[0].platform).toBe('instagram');
        });
    });

    describe('updateInfluencerProfile', () => {
        it('should update profile and sync social links', async () => {
            const updateData = {
                fullName: 'Updated Name',
                socials: [
                    { platform: 'youtube', url: 'https://youtube.com/updated', followers: 5000 }
                ]
            };

            const updated = await influencerProfileService.updateInfluencerProfile(influencerId, updateData);
            expect(updated.fullName).toBe('Updated Name');

            // Verify social link sync in InfluencerInfo
            const influencer = await InfluencerInfo.findById(influencerId);
            expect(influencer.socialProfiles.length).toBe(1);
            expect(influencer.socialProfiles[0].platform).toBe('youtube');

            // Verify social link sync in InfluencerSocials
            const socials = await InfluencerSocials.findOne({ influencerId });
            expect(socials).not.toBeNull();
            expect(socials.platforms[0].platform).toBe('youtube');
        });
    });

    describe('getInfluencerDashboardData', () => {
        it('should return comprehensive dashboard metrics', async () => {
            // Seed a completed payment to verify earnings calculation
            await CampaignPayments.create({
                campaign_id: new mongoose.Types.ObjectId(),
                brand_id: new mongoose.Types.ObjectId(),
                influencer_id: influencerId,
                amount: 500,
                status: 'completed',
                payment_date: new Date(),
                payment_method: 'razorpay'
            });

            const data = await influencerProfileService.getInfluencerDashboardData(influencerId);
            expect(data).not.toBeNull();
            expect(data.stats.totalFollowers).toBe(10000);
            expect(data.stats.totalCommissionsEarned).toBe(500);
        });
    });
});
