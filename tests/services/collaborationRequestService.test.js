const mongoose = require('mongoose');
const collaborationRequestService = require('../../services/collaboration/collaborationRequestService');
const { CampaignInfo, CampaignInfluencers } = require('../../models/CampaignMongo');
const { BrandInfo } = require('../../models/BrandMongo');
const { InfluencerInfo } = require('../../models/InfluencerMongo');
const { createTestBrand, createTestInfluencer, createTestCampaign } = require('../setup/testHelpers');

describe('CollaborationRequestService', () => {
    let brandId, influencerId, campaignId;

    beforeEach(async () => {
        // Clean up
        await CampaignInfo.deleteMany({});
        await CampaignInfluencers.deleteMany({});
        await BrandInfo.deleteMany({});
        await InfluencerInfo.deleteMany({});

        // Setup using helpers
        const brand = await createTestBrand();
        brandId = brand._id;

        const influencer = await createTestInfluencer();
        influencerId = influencer._id;

        const campaign = await createTestCampaign(brandId, {
            required_channels: ['Instagram'],
            min_followers: 1000
        });
        campaignId = campaign._id;
    });

    describe('getPendingRequestsCount', () => {
        it('should return the correct count of pending requests', async () => {
            await CampaignInfluencers.create({
                campaign_id: campaignId,
                influencer_id: influencerId,
                status: 'request'
            });

            const count = await collaborationRequestService.getPendingRequestsCount(influencerId);
            expect(count).toBe(1);
        });
    });

    describe('getCollaborationRequests', () => {
        it('should return formatted collaboration requests', async () => {
            await CampaignInfluencers.create({
                campaign_id: campaignId,
                influencer_id: influencerId,
                status: 'request'
            });

            const requests = await collaborationRequestService.getCollaborationRequests(influencerId);
            expect(requests.length).toBe(1);
            expect(requests[0].brand_name).toBe('Test Brand');
            expect(requests[0].collab_title).toBe('Test Campaign');
        });
    });

    describe('acceptPendingRequest', () => {
        it('should change status to active', async () => {
            const req = await CampaignInfluencers.create({
                campaign_id: campaignId,
                influencer_id: influencerId,
                status: 'request'
            });

            const result = await collaborationRequestService.acceptPendingRequest(req._id);
            expect(result.success).toBe(true);

            const updatedReq = await CampaignInfluencers.findById(req._id);
            expect(updatedReq.status).toBe('active');
        });
    });

    describe('declinePendingRequest', () => {
        it('should change status to cancelled', async () => {
            const req = await CampaignInfluencers.create({
                campaign_id: campaignId,
                influencer_id: influencerId,
                status: 'request'
            });

            const result = await collaborationRequestService.declinePendingRequest(req._id);
            expect(result.success).toBe(true);

            const updatedReq = await CampaignInfluencers.findById(req._id);
            expect(updatedReq.status).toBe('cancelled');
        });
    });

    describe('getBrandInvites', () => {
        it('should return brand invites', async () => {
            await CampaignInfluencers.create({
                campaign_id: campaignId,
                influencer_id: influencerId,
                status: 'brand-invite'
            });

            const invites = await collaborationRequestService.getBrandInvites(influencerId);
            expect(invites.length).toBe(1);
            expect(invites[0].status).toBe('brand-invite');
        });
    });

    describe('getRequestById', () => {
        it('should return detailed request info', async () => {
            const req = await CampaignInfluencers.create({
                campaign_id: campaignId,
                influencer_id: influencerId,
                status: 'request'
            });

            const details = await collaborationRequestService.getRequestById(req._id);
            expect(details).not.toBeNull();
            expect(details.collab_title).toBe('Test Campaign');
            expect(details.influencer_name).toBe('Test Influencer');
        });
    });

    describe('Instance methods', () => {
        let serviceInstance;
        beforeEach(() => {
            serviceInstance = new collaborationRequestService();
        });

        it('should accept request via acceptRequest instance method', async () => {
            const req = await CampaignInfluencers.create({
                campaign_id: campaignId,
                influencer_id: influencerId,
                status: 'request'
            });

            const result = await serviceInstance.acceptRequest(req._id);
            expect(result.success).toBe(true);
            const updated = await CampaignInfluencers.findById(req._id);
            expect(updated.status).toBe('active');
        });

        it('should decline request via declineRequest instance method', async () => {
            const req = await CampaignInfluencers.create({
                campaign_id: campaignId,
                influencer_id: influencerId,
                status: 'request'
            });

            const result = await serviceInstance.declineRequest(req._id);
            expect(result.success).toBe(true);
            const updated = await CampaignInfluencers.findById(req._id);
            expect(updated.status).toBe('cancelled');
        });

    });
});
