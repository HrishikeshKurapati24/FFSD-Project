'use strict';

/**
 * Phase 4b: Cross-Service Data Synchronization Tests
 *
 * Verifies:
 * 1. Mongoose post-save hook fires ElasticsearchService.indexDocument
 * 2. Mongoose post-findOneAndDelete hook fires ElasticsearchService.deleteDocument
 * 3. After runSimulationCycle:
 *    - CampaignInfluencers.impressions > 0
 *    - CampaignInfo.metrics.impressions mirrors CampaignInfluencers aggregate
 *    - CampaignMetrics.impressions mirrors the same value
 *
 * Global setup (globalSetup.js) already:
 *   - Connects to remote MongoDB test DB
 *   - Clears all collections in beforeEach
 *   - Mocks axios (so ElasticsearchService HTTP calls are silenced)
 */

const mongoose = require('mongoose');
const { CampaignInfo, CampaignMetrics, CampaignInfluencers } = require('../../models/CampaignMongo');
const ElasticsearchService = require('../../services/search/elasticsearchService');
const AnalyticsSimulationService = require('../../services/analytics/analyticsSimulationService');
const {
    createTestInfluencer,
    createTestCampaign,
    createTestCampaignInfluencer,
    createTestInfluencerAnalytics,
} = require('../setup/testHelpers');

// ── Spy on ElasticsearchService static methods ─────────────────────────────
let indexSpy;
let deleteSpy;

beforeEach(() => {
    indexSpy  = jest.spyOn(ElasticsearchService, 'indexDocument').mockResolvedValue({});
    deleteSpy = jest.spyOn(ElasticsearchService, 'deleteDocument').mockResolvedValue({});
});

afterEach(() => {
    jest.restoreAllMocks();
});

// ── Helpers ─────────────────────────────────────────────────────────────────
const makeBrandId = () => new mongoose.Types.ObjectId();

// ── Test Suites ──────────────────────────────────────────────────────────────

describe('Phase 4b — Cross-Service Data Synchronization', () => {

    // ── 1. Elasticsearch Sync via Mongoose Hooks ─────────────────────────────
    describe('Elasticsearch Synchronization (Mongoose hooks)', () => {

        it('should call indexDocument when a CampaignInfo document is saved', async () => {
            const brandId = makeBrandId();

            const campaign = new CampaignInfo({
                brand_id: brandId,
                title: 'ES Index Test',
                description: 'Verifies post-save hook fires indexDocument',
                status: 'active',
                budget: 5000,
                min_followers: 1000,
                required_channels: ['Instagram'],
            });
            await campaign.save();

            expect(indexSpy).toHaveBeenCalledTimes(1);
            expect(indexSpy).toHaveBeenCalledWith(
                'campaigns',
                campaign._id.toString(),
                expect.objectContaining({
                    title: 'ES Index Test',
                    budget: 5000,
                    status: 'active',
                })
            );
        });

        it('should call deleteDocument when a CampaignInfo is deleted via findOneAndDelete', async () => {
            const brandId = makeBrandId();
            const campaign = await createTestCampaign(brandId, { title: 'ES Delete Test' });
            const idStr = campaign._id.toString();

            // Reset spy so we only count the delete call
            indexSpy.mockClear();
            deleteSpy.mockClear();

            await CampaignInfo.findOneAndDelete({ _id: campaign._id });

            expect(deleteSpy).toHaveBeenCalledTimes(1);
            expect(deleteSpy).toHaveBeenCalledWith('campaigns', idStr);
        });
    });

    // ── 2. Denormalisation Integrity after Simulation Cycle ──────────────────
    describe('Simulation Denormalisation Integrity', () => {

        it('should propagate simulated impressions from CampaignInfluencers → CampaignMetrics → CampaignInfo', async () => {
            const brandId    = makeBrandId();
            const influencer = await createTestInfluencer();
            const campaign   = await createTestCampaign(brandId, {
                required_channels: ['Instagram'],
                min_followers: 100,
            });

            // Seed analytics so the saturation engine has follower / engagement data
            await createTestInfluencerAnalytics(influencer._id, {
                totalFollowers: 50000,
                avgEngagementRate: 6,
            });

            // Seed a published deliverable completed 48 h ago (well past initial ramp)
            await createTestCampaignInfluencer(campaign._id, influencer._id, {
                status: 'active',
                deliverables: [{
                    title:            'Sync Deliverable',
                    description:      'Cross-service sync test',
                    due_date:         new Date(),
                    deliverable_type: 'Post',
                    platform:         'Instagram',
                    status:           'published',
                    completed_at:     new Date(Date.now() - 48 * 60 * 60 * 1000),
                }],
            });

            // Run the simulation cycle
            await AnalyticsSimulationService.runSimulationCycle();

            // 1) CampaignInfluencers should have been updated with impressions
            const ci = await CampaignInfluencers.findOne({
                campaign_id:   campaign._id,
                influencer_id: influencer._id,
            }).lean();
            expect(ci.impressions).toBeGreaterThan(0);

            // 2) CampaignInfo.metrics should mirror the aggregate
            const updatedCampaign = await CampaignInfo.findById(campaign._id).lean();
            expect(updatedCampaign.metrics.impressions).toBe(ci.impressions);

            // 3) CampaignMetrics collection should mirror the same value
            const cm = await CampaignMetrics.findOne({ campaign_id: campaign._id }).lean();
            expect(cm).not.toBeNull();
            expect(cm.impressions).toBe(ci.impressions);
        });

        it('should aggregate impressions from multiple influencers correctly', async () => {
            const brandId  = makeBrandId();
            const inf1     = await createTestInfluencer();
            const inf2     = await createTestInfluencer();
            const campaign = await createTestCampaign(brandId, {
                required_channels: ['Instagram'],
                min_followers: 100,
            });

            await createTestInfluencerAnalytics(inf1._id, { totalFollowers: 20000, avgEngagementRate: 5 });
            await createTestInfluencerAnalytics(inf2._id, { totalFollowers: 30000, avgEngagementRate: 7 });

            const deliverable = {
                title:            'Multi Deliverable',
                description:      'Multi influencer test',
                due_date:         new Date(),
                deliverable_type: 'Post',
                platform:         'Instagram',
                status:           'published',
                completed_at:     new Date(Date.now() - 24 * 60 * 60 * 1000),
            };

            await createTestCampaignInfluencer(campaign._id, inf1._id, { status: 'active', deliverables: [deliverable] });
            await createTestCampaignInfluencer(campaign._id, inf2._id, { status: 'active', deliverables: [deliverable] });

            await AnalyticsSimulationService.runSimulationCycle();

            const allCI = await CampaignInfluencers.find({ campaign_id: campaign._id }).lean();
            const totalImpressions = allCI.reduce((sum, ci) => sum + (ci.impressions || 0), 0);

            expect(totalImpressions).toBeGreaterThan(0);

            const updatedCampaign = await CampaignInfo.findById(campaign._id).lean();
            // CampaignInfo stores rounded values; use toBeCloseTo for float safety
            expect(updatedCampaign.metrics.impressions).toBeCloseTo(totalImpressions, 1);

            const cm = await CampaignMetrics.findOne({ campaign_id: campaign._id }).lean();
            expect(cm.impressions).toBeCloseTo(totalImpressions, 1);
        });

        it('should not update metrics when no published deliverables exist', async () => {
            const brandId    = makeBrandId();
            const influencer = await createTestInfluencer();
            const campaign   = await createTestCampaign(brandId, {
                required_channels: ['Instagram'],
                min_followers: 100,
            });

            await createTestInfluencerAnalytics(influencer._id, { totalFollowers: 10000 });

            // Deliverable is still pending — not published
            await createTestCampaignInfluencer(campaign._id, influencer._id, {
                status: 'active',
                deliverables: [{
                    title:            'Pending Deliverable',
                    description:      'Not yet published',
                    due_date:         new Date(),
                    deliverable_type: 'Post',
                    platform:         'Instagram',
                    status:           'pending',
                }],
            });

            await AnalyticsSimulationService.runSimulationCycle();

            const ci = await CampaignInfluencers.findOne({ campaign_id: campaign._id }).lean();
            // impressions default is 0; pending deliverables should not grow them
            expect(ci.impressions).toBe(0);
        });
    });
});
