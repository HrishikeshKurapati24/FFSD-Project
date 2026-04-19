const mongoose = require('mongoose');
const collaborationManageService = require('../../services/collaboration/collaborationManageService');
const { CampaignInfo, CampaignInfluencers, CampaignMetrics } = require('../../models/CampaignMongo');
const { BrandInfo } = require('../../models/BrandMongo');
const { InfluencerInfo } = require('../../models/InfluencerMongo');
const { createTestBrand, createTestInfluencer, createTestCampaign } = require('../setup/testHelpers');

describe('CollaborationManageService', () => {
    let brandId, influencerId, campaignId;

    beforeEach(async () => {
        // Clean up
        await CampaignInfo.deleteMany({});
        await CampaignInfluencers.deleteMany({});
        await CampaignMetrics.deleteMany({});
        await BrandInfo.deleteMany({});
        await InfluencerInfo.deleteMany({});

        // Setup
        const brand = await createTestBrand();
        brandId = brand._id;

        const influencer = await createTestInfluencer();
        influencerId = influencer._id;

        const campaign = await createTestCampaign(brandId, {
            title: 'Manage Test Campaign',
            status: 'active'
        });
        campaignId = campaign._id;
    });

    describe('getActiveCollaborations', () => {
        it('should return active collaborations from CollaborationModel', async () => {
            await CampaignInfluencers.create({
                campaign_id: campaignId,
                influencer_id: influencerId,
                status: 'active',
                progress: 50
            });

            const results = await collaborationManageService.getActiveCollaborations(influencerId);
            expect(results.length).toBe(1);
            expect(results[0].campaign_name).toBe('Manage Test Campaign');
            expect(results[0].progress).toBe(50);
        });
    });

    describe('getCollaborationDetails', () => {
        it('should return detailed campaign info', async () => {
            const details = await collaborationManageService.getCollaborationDetails(campaignId);
            expect(details).not.toBeNull();
            expect(details.title).toBe('Manage Test Campaign');
            expect(details.brand_name).toBe('Test Brand');
        });

        it('should return null for non-existent campaign', async () => {
            const details = await collaborationManageService.getCollaborationDetails(new mongoose.Types.ObjectId());
            expect(details).toBeNull();
        });
    });

    describe('updateCollaborationProgress', () => {
        it('should update progress and return result', async () => {
            const collab = await CampaignInfluencers.create({
                campaign_id: campaignId,
                influencer_id: influencerId,
                status: 'active',
                progress: 0
            });

            const result = await collaborationManageService.updateCollaborationProgress(collab._id, 75);
            expect(result.progress).toBe(75);

            const updated = await CampaignInfluencers.findById(collab._id);
            expect(updated.progress).toBe(75);
            
            // Check if campaign metrics were updated (delegated call)
            const campaign = await CampaignInfo.findById(campaignId);
            expect(campaign.metrics.overall_progress).toBe(75);
        });
    });

    describe('getPendingRequests', () => {
        it('should return formatted pending requests', async () => {
            await CampaignInfluencers.create({
                campaign_id: campaignId,
                influencer_id: influencerId,
                status: 'request'
            });

            const requests = await collaborationManageService.getPendingRequests(influencerId);
            expect(requests.length).toBe(1);
            expect(requests[0].brand_name).toBe('Test Brand');
        });
    });

    describe('getBrandInvites', () => {
        it('should return brand invites from CollaborationModel', async () => {
            await CampaignInfluencers.create({
                campaign_id: campaignId,
                influencer_id: influencerId,
                status: 'brand-invite'
            });

            const invites = await collaborationManageService.getBrandInvites(influencerId);
            expect(invites.length).toBe(1);
            expect(invites[0].campaign_title).toBe('Manage Test Campaign');
        });
    });

    describe('getSentRequests', () => {
        it('should return sent requests from CollaborationModel', async () => {
            await CampaignInfluencers.create({
                campaign_id: campaignId,
                influencer_id: influencerId,
                status: 'influencer-invite'
            });

            const requests = await collaborationManageService.getSentRequests(influencerId);
            expect(requests.length).toBe(1);
            expect(requests[0].campaign_title).toBe('Manage Test Campaign');
        });
    });
});
