const mongoose = require('mongoose');
const CollaborationModel = require('../../services/CollaborationModel');
const { CampaignInfo, CampaignInfluencers, CampaignPayments, CampaignMetrics } = require('../../models/CampaignMongo');
const { BrandInfo } = require('../../models/BrandMongo');
const { InfluencerInfo } = require('../../models/InfluencerMongo');
const { createTestBrand, createTestInfluencer, createTestCampaign, createTestPayment, createTestCampaignInfluencer } = require('../setup/testHelpers');

describe('CollaborationModel Aggregations', () => {
    let brandId, influencerId, campaignId;

    beforeEach(async () => {
        await BrandInfo.deleteMany({});
        await InfluencerInfo.deleteMany({});
        await CampaignInfo.deleteMany({});
        await CampaignInfluencers.deleteMany({});
        await CampaignPayments.deleteMany({});
        await CampaignMetrics.deleteMany({});

        const brand = await createTestBrand();
        brandId = brand._id;

        const influencer = await createTestInfluencer();
        influencerId = influencer._id;

        const campaign = await createTestCampaign(brandId, {
            title: 'Aggregation Campaign'
        });
        campaignId = campaign._id;

        await createTestCampaignInfluencer(campaignId, influencerId, {
            status: 'active',
            progress: 60
        });

        // Seed default metrics for the campaign
        await CampaignMetrics.create({
            campaign_id: campaignId,
            brand_id: brandId,
            engagement_rate: 6.0,
            reach: 12000,
            conversion_rate: 3.0,
            timeliness_score: 90
        });
    });

    describe('getActiveCollaborations', () => {
        it('should return collaborations with joined brand and campaign data', async () => {
            const results = await CollaborationModel.getActiveCollaborations(influencerId);
            expect(results.length).toBe(1);
            expect(results[0].campaign_name).toBe('Aggregation Campaign');
            expect(results[0].brand_name).toBe('Test Brand');
        });
    });

    describe('Monthly Earnings', () => {
        it('should calculate monthly earnings correctly', async () => {
            const startOfMonth = new Date();
            startOfMonth.setDate(2);

            await createTestPayment(influencerId, brandId, campaignId, {
                amount: 1000,
                payment_date: startOfMonth
            });

            const earnings = await CollaborationModel.getMonthlyEarnings(influencerId);
            expect(earnings).toBe(1000);
        });
    });

    describe('Performance Metrics', () => {
        it('should average performance metrics across influencer campaigns', async () => {
            const metrics = await CollaborationModel.getPerformanceMetrics(influencerId);
            
            // Note: timeliness_score in aggregation is $metrics.timeliness_score
            // which exists in the seeded CampaignMetrics above.
            expect(metrics.engagementRate).toBe(6.0);
            expect(metrics.reach).toBe(12000);
            expect(metrics.conversionRate).toBe(3.0);
        });
    });

    describe('Earnings by Source', () => {
        it('should group earnings by brand name', async () => {
            await createTestPayment(influencerId, brandId, campaignId, { amount: 1500 });
            
            const sources = await CollaborationModel.getEarningsBySource(influencerId);
            expect(sources.length).toBe(1);
            expect(sources[0].brand_name).toBe('Test Brand');
            expect(sources[0].total_earnings).toBe(1500);
        });
    });
});
