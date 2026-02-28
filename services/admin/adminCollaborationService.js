const { CampaignInfo, CampaignInfluencers, CampaignPayments } = require('../../models/CampaignMongo');

class adminCollaborationService {
    static async getAllCollaborations() {
        try {
            const campaigns = await CampaignInfo.find()
                .select('brand_id title status start_date end_date')
                .populate('brand_id', 'brandName')
                .lean();

            const collaborations = await Promise.all(campaigns.map(async campaign => {
                const influencers = await CampaignInfluencers.find({ campaign_id: campaign._id })
                    .select('influencer_id engagement_rate progress')
                    .populate('influencer_id', 'fullName displayName')
                    .lean();

                // Calculate revenue
                const revenueAgg = await CampaignPayments.aggregate([
                    { $match: { campaign_id: campaign._id, status: 'completed' } },
                    { $group: { _id: null, total: { $sum: "$amount" } } }
                ]);
                const revenue = revenueAgg[0]?.total || 0;

                return {
                    id: campaign._id,
                    title: campaign.title,
                    brand: campaign.brand_id ? campaign.brand_id.brandName : '',
                    status: campaign.status,
                    startDate: campaign.start_date,
                    endDate: campaign.end_date,
                    revenue: revenue,
                    influencers: influencers.map(inf => ({
                        influencer: inf.influencer_id ? (inf.influencer_id.displayName || inf.influencer_id.fullName || '') : '',
                        engagementRate: inf.engagement_rate,
                        reach: inf.progress
                    }))
                };
            }));

            return collaborations;
        } catch (error) {
            console.error('Error fetching collaborations:', error);
            return [];
        }
    }

    static async getCollaborationById(id) {
        try {
            const campaign = await CampaignInfo.findById(id)
                .select('brand_id status')
                .populate('brand_id', 'brandName')
                .lean();

            if (!campaign) return null;

            const influencers = await CampaignInfluencers.find({ campaign_id: id })
                .select('influencer_id engagement_rate progress deliverables')
                .populate('influencer_id', 'fullName displayName')
                .lean();

            return {
                id: campaign._id,
                brand: campaign.brand_id ? campaign.brand_id.brandName : '',
                status: campaign.status,
                influencers: influencers.map(inf => ({
                    influencer: inf.influencer_id ? (inf.influencer_id.displayName || inf.influencer_id.fullName || '') : '',
                    engagementRate: inf.engagement_rate,
                    reach: inf.progress,
                    deliverables: inf.deliverables || []
                }))
            };
        } catch (error) {
            console.error('Error fetching collaboration details:', error);
            return null;
        }
    }
}

module.exports = adminCollaborationService;
