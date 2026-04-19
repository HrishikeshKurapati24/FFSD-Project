const mongoose = require('mongoose');
const CollaborationModel = require('../../services/CollaborationModel');
const { CampaignInfo, CampaignInfluencers, CampaignMetrics } = require('../../models/CampaignMongo');
const { BrandInfo } = require('../../models/BrandMongo');
const { InfluencerInfo } = require('../../models/InfluencerMongo');
const { createTestBrand, createTestInfluencer, createTestCampaign, createTestCampaignInfluencer } = require('../setup/testHelpers');

describe('Collaboration Concurrency Tests', () => {
    let brandId, campaignId, influencerIds = [];
    let collabIds = [];

    beforeEach(async () => {
        await BrandInfo.deleteMany({});
        await InfluencerInfo.deleteMany({});
        await CampaignInfo.deleteMany({});
        await CampaignInfluencers.deleteMany({});
        await CampaignMetrics.deleteMany({});

        const brand = await createTestBrand();
        brandId = brand._id;

        const campaign = await createTestCampaign(brandId, {
            title: 'Concurrency Test Campaign'
        });
        campaignId = campaign._id;

        // Create 5 influencers with different follower counts for weighted average
        const followerCounts = [1000, 2000, 3000, 4000, 5000];
        influencerIds = [];
        collabIds = [];

        for (let i = 0; i < 5; i++) {
            const influencer = await createTestInfluencer({
                analytics_snapshot: { totalFollowers: followerCounts[i] }
            });
            influencerIds.push(influencer._id);

            const collab = await createTestCampaignInfluencer(campaignId, influencer._id, {
                status: 'active',
                progress: 0
            });
            collabIds.push(collab._id);
        }
    });

    it('should handle simultaneous progress updates correctly', async () => {
        const targetProgress = [20, 40, 60, 80, 100];
        
        // Use the CollaborationModel instance to call acceptRequest if needed, 
        // but updateCollaborationProgress is static.
        
        // Execute all updates simultaneously
        await Promise.all(collabIds.map((id, index) => 
            CollaborationModel.updateCollaborationProgress(id, targetProgress[index])
        ));

        // Let's verify the final state in CampaignInfo
        const finalCampaign = await CampaignInfo.findById(campaignId);
        
        // Calculation: weighted average
        // (20*1000 + 40*2000 + 60*3000 + 80*4000 + 100*5000) / (1000+2000+3000+4000+5000)
        // (20k + 80k + 180k + 320k + 500k) / 15k
        // 1100k / 15k = 73.33... -> 73
        
        expect(finalCampaign.metrics.overall_progress).toBe(73);

        // Also check CampaignInfluencers individually
        for (let i = 0; i < collabIds.length; i++) {
            const ci = await CampaignInfluencers.findById(collabIds[i]);
            expect(ci.progress).toBe(targetProgress[i]);
        }
    });

    it('should maintain consistency with rapidly sequential updates', async () => {
        // Just hammering one collabId
        const collabId = collabIds[0];
        const updates = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
        
        for (const p of updates) {
            await CollaborationModel.updateCollaborationProgress(collabId, p);
        }

        const finalCampaign = await CampaignInfo.findById(campaignId);
        const finalCI = await CampaignInfluencers.findById(collabId);
        
        expect(finalCI.progress).toBe(100);
        // (100*1000 + 0*2000 + 0*3000 + 0*4000 + 0*5000) / 15k = 100/15 = 6.66 -> 7
        expect(finalCampaign.metrics.overall_progress).toBe(7);
    });
});
