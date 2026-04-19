const mongoose = require('mongoose');
const AnalyticsSimulationService = require('../../services/analytics/analyticsSimulationService');
const SaturationSimulationEngine = require('../../services/analytics/saturationSimulationEngine');
const { CampaignInfo, CampaignInfluencers, CampaignMetrics } = require('../../models/CampaignMongo');
const { BrandInfo } = require('../../models/BrandMongo');
const { InfluencerInfo, InfluencerAnalytics } = require('../../models/InfluencerMongo');
const { createTestBrand, createTestInfluencer, createTestCampaign, createTestCampaignInfluencer, createTestInfluencerAnalytics } = require('../setup/testHelpers');

describe('AnalyticsSimulationService', () => {
    let brandId, influencerId, campaignId;

    beforeEach(async () => {
        await BrandInfo.deleteMany({});
        await InfluencerInfo.deleteMany({});
        await InfluencerAnalytics.deleteMany({});
        await CampaignInfo.deleteMany({});
        await CampaignInfluencers.deleteMany({});
        await CampaignMetrics.deleteMany({});

        const brand = await createTestBrand();
        brandId = brand._id;

        const influencer = await createTestInfluencer();
        influencerId = influencer._id;

        const campaign = await createTestCampaign(brandId, {
            status: 'active',
            start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 1 week ago
        });
        campaignId = campaign._id;

        await createTestCampaignInfluencer(campaignId, influencerId, {
            status: 'active',
            deliverables: [{
                title: 'Test Deliverable',
                description: 'Description',
                due_date: new Date(),
                deliverable_type: 'Post',
                platform: 'Instagram',
                status: 'published',
                completed_at: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
            }]
        });

        await createTestInfluencerAnalytics(influencerId, {
            totalFollowers: 10000,
            avgEngagementRate: 5
        });
    });

    it('should calculate and sync metrics for active campaigns', async () => {
        const result = await AnalyticsSimulationService.runSimulationCycle('test_trigger');

        expect(result.campaignsProcessed).toBe(1);
        expect(result.collabsProcessed).toBe(1);
        expect(result.postsProcessed).toBe(1);

        // Verify CampaignInfluencers update
        const ci = await CampaignInfluencers.findOne({ campaign_id: campaignId, influencer_id: influencerId });
        expect(ci.impressions).toBeGreaterThan(0);
        expect(ci.reach).toBeGreaterThan(0);
        expect(ci.likes).toBeGreaterThan(0);
        expect(ci.last_simulated_at).toBeDefined();

        // Verify CampaignMetrics sync
        const metrics = await CampaignMetrics.findOne({ campaign_id: campaignId });
        expect(metrics.impressions).toBe(ci.impressions);
        expect(metrics.performance_score).toBeGreaterThan(0);

        // Verify CampaignInfo denormalization
        const campaign = await CampaignInfo.findById(campaignId);
        expect(campaign.metrics.impressions).toBe(ci.impressions);
        expect(campaign.metrics.simulated_at).toBeDefined();
    });

    it('should reflect growth over time (Saturation Curve)', async () => {
        // Run with post 1 hour old
        await CampaignInfluencers.updateOne(
            { campaign_id: campaignId, influencer_id: influencerId },
            { $set: { 'deliverables.0.completed_at': new Date(Date.now() - 1 * 60 * 60 * 1000) } }
        );
        await AnalyticsSimulationService.runSimulationCycle();
        const ci1 = await CampaignInfluencers.findOne({ campaign_id: campaignId, influencer_id: influencerId });
        console.log('Impressions (1h):', ci1.impressions);

        // Run with post 48 hours old
        await CampaignInfluencers.updateOne(
            { campaign_id: campaignId, influencer_id: influencerId },
            { $set: { 'deliverables.0.completed_at': new Date(Date.now() - 48 * 60 * 60 * 1000) } }
        );
        await AnalyticsSimulationService.runSimulationCycle();
        const ci2 = await CampaignInfluencers.findOne({ campaign_id: campaignId, influencer_id: influencerId });
        console.log('Impressions (48h):', ci2.impressions);

        expect(ci2.impressions).toBeGreaterThan(ci1.impressions);
    });

    it('should apply weighted averages based on influencer audience size', async () => {
        // Add a second influencer with much larger audience
        const bigInfluencer = await createTestInfluencer({ fullName: 'Big Star' });
        await createTestInfluencerAnalytics(bigInfluencer._id, {
            totalFollowers: 1000000, // 1M instead of 10k
            avgEngagementRate: 2
        });
        await createTestCampaignInfluencer(campaignId, bigInfluencer._id, {
            status: 'active',
            progress: 100,
            deliverables: [{ 
                title: 'Big Deliverable',
                description: 'Big Description',
                due_date: new Date(),
                status: 'published', 
                platform: 'Instagram', 
                deliverable_type: 'Post',
                completed_at: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
            }]
        });

        await AnalyticsSimulationService.runSimulationCycle();

        const campaign = await CampaignInfo.findById(campaignId);
        
        // Average progress should be correctly calculated
        expect(campaign.metrics.overall_progress).toBeGreaterThan(0);
        
        // Impressions should be very high due to 1M followers
        expect(campaign.metrics.impressions).toBeGreaterThan(10000);
    });
});
