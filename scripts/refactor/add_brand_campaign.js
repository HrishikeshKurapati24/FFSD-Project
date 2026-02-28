const fs = require('fs');

const svcPath = './services/brand/brandCampaignService.js';
let svcC = fs.readFileSync(svcPath, 'utf8');

const additionalMethods = `
    static async getCampaignDeliverables(campaignId, brandId) {
        if (!campaignId) throw new Error('Campaign ID is required');

        const campaign = await CampaignInfo.findOne({
            _id: campaignId,
            brand_id: brandId
        }).select('_id title deliverables');

        if (!campaign) {
            throw new Error('Campaign not found or you do not have access');
        }

        const collabs = await CampaignInfluencers.find({
            campaign_id: campaignId,
            status: { $in: ['active', 'completed'] }
        }).populate('influencer_id', 'fullName username profilePicUrl').lean();

        if (collabs.length === 0) {
            return {
                campaign: { id: campaign._id, title: campaign.title },
                items: [],
                message: 'No active or completed influencers found for this campaign'
            };
        }

        if (campaign.deliverables && campaign.deliverables.length > 0) {
            for (const collab of collabs) {
                if (!collab.deliverables || collab.deliverables.length === 0) {
                    const seededDeliverables = campaign.deliverables.map(d => ({
                        task_description: d.task_description || '',
                        platform: d.platform || '',
                        num_posts: d.num_posts || 0,
                        num_reels: d.num_reels || 0,
                        num_videos: d.num_videos || 0,
                        status: 'pending',
                        completed: false
                    }));
                    await CampaignInfluencers.updateOne(
                        { _id: collab._id },
                        { $set: { deliverables: seededDeliverables } }
                    );
                    collab.deliverables = seededDeliverables;
                }
            }
        }

        const payload = collabs.map(c => {
            const deliverables = Array.isArray(c.deliverables) ? c.deliverables : [];
            return {
                collab_id: c._id,
                influencer: {
                    id: c.influencer_id?._id,
                    name: c.influencer_id?.fullName || 'Unknown',
                    username: c.influencer_id?.username || 'unknown',
                    profilePicUrl: c.influencer_id?.profilePicUrl || '/images/default-profile.jpg'
                },
                progress: c.progress || 0,
                deliverables: deliverables.map((d, idx) => ({
                    id: d._id || d.id || idx,
                    title: d.title || '',
                    description: d.description || '',
                    task_description: d.task_description || d.description || d.title || '',
                    platform: d.platform || '',
                    num_posts: parseInt(d.num_posts) || 0,
                    num_reels: parseInt(d.num_reels) || 0,
                    num_videos: parseInt(d.num_videos) || 0,
                    status: d.status || 'pending',
                    completed: d.completed || false,
                    deliverable_type: d.deliverable_type || '',
                    due_date: d.due_date || null,
                    completed_at: d.completed_at || null,
                    content_url: d.content_url || '',
                    submitted_at: d.submitted_at || null,
                    review_feedback: d.review_feedback || '',
                    reviewed_at: d.reviewed_at || null
                }))
            };
        });

        return {
            campaign: { id: campaign._id, title: campaign.title },
            items: payload
        };
    }

    static async updateCampaignDeliverables(campaignId, brandId, updates) {
        if (!campaignId) throw new Error('Campaign ID is required');
        if (!updates || !Array.isArray(updates) || updates.length === 0) {
            throw new Error('No deliverable updates provided');
        }

        const campaign = await CampaignInfo.findOne({ _id: campaignId, brand_id: brandId }).select('_id');
        if (!campaign) throw new Error('Campaign not found');

        const { CampaignContent } = require('../../models/ProductMongo');

        // Helper
        const computeProgressFromDeliverables = (deliverables = []) => {
            try {
                if (!Array.isArray(deliverables) || deliverables.length === 0) return 0;
                const total = deliverables.length;
                const approved = deliverables.filter(d => {
                    return d && typeof d.status === 'string' && d.status.toLowerCase() === 'approved';
                }).length;
                return Math.min(100, Math.max(0, Math.round((approved / total) * 100)));
            } catch {
                return 0;
            }
        };

        const results = [];
        for (const u of updates) {
            if (!u || !u.collab_id || !Array.isArray(u.deliverables)) continue;

            const collab = await CampaignInfluencers.findOne({ _id: u.collab_id, campaign_id: campaignId });
            if (!collab) continue;

            u.deliverables.forEach(incoming => {
                const deliverableId = incoming.id || incoming._id;
                if (!deliverableId) return;

                const existing = collab.deliverables.id(deliverableId);
                if (existing) {
                    if (incoming.status) {
                        existing.status = incoming.status;

                        if (incoming.status === 'approved' || incoming.status === 'rejected') {
                            const contentStatus = incoming.status === 'approved' ? 'approved' : 'rejected';
                            CampaignContent.updateOne(
                                { deliverable_id: deliverableId, status: { $ne: 'published' } },
                                { $set: { status: contentStatus } }
                            ).exec().catch(err => console.error('Error syncing CampaignContent status:', err));
                        }
                    }
                    if (incoming.review_feedback !== undefined) existing.review_feedback = incoming.review_feedback;
                    if (incoming.reviewed_at) existing.reviewed_at = incoming.reviewed_at;
                    if (incoming.content_url) existing.content_url = incoming.content_url;
                    if (incoming.submitted_at) existing.submitted_at = incoming.submitted_at;
                    if (incoming.completed_at) existing.completed_at = incoming.completed_at;

                    if (incoming.title) existing.title = incoming.title;
                    if (incoming.description) existing.description = incoming.description;
                    if (incoming.task_description) existing.task_description = incoming.task_description;
                    if (incoming.due_date) existing.due_date = incoming.due_date;
                    if (incoming.platform) {
                        const validPlatforms = ['Instagram', 'YouTube', 'TikTok', 'Facebook', 'Twitter', 'LinkedIn'];
                        if (validPlatforms.includes(incoming.platform)) {
                            existing.platform = incoming.platform;
                        }
                    }
                    if (incoming.num_posts !== undefined) existing.num_posts = incoming.num_posts;
                    if (incoming.num_reels !== undefined) existing.num_reels = incoming.num_reels;
                    if (incoming.num_videos !== undefined) existing.num_videos = incoming.num_videos;
                    if (incoming.deliverable_type) existing.deliverable_type = incoming.deliverable_type;
                }
            });

            const progress = computeProgressFromDeliverables(collab.deliverables);
            collab.progress = progress;

            await collab.save();
            results.push({ collab_id: collab._id, progress });
        }
        return results;
    }

    static async getCampaignInfluencers(campaignId, brandId) {
        if (!campaignId) throw new Error('Campaign ID is required');

        const campaign = await CampaignInfo.findOne({
            _id: campaignId,
            brand_id: brandId
        });

        if (!campaign) {
            throw new Error('Campaign not found');
        }

        const influencers = await CampaignInfluencers.find({
            campaign_id: campaignId,
            status: { $in: ['active', 'completed'] }
        })
            .populate('influencer_id', 'fullName username profilePicUrl')
            .lean();

        return influencers.map(inf => ({
            influencer_id: inf.influencer_id._id,
            name: inf.influencer_id.fullName,
            username: inf.influencer_id.username,
            profilePicUrl: inf.influencer_id.profilePicUrl || '/images/default-profile.jpg',
            status: inf.status,
            progress: inf.progress || 0,
            joined_at: inf.createdAt,
            deliverables: (inf.deliverables || []).map(d => ({
                _id: d._id,
                title: d.title,
                description: d.description,
                task_description: d.task_description || d.description || d.title || '',
                platform: d.platform || '',
                num_posts: d.num_posts,
                num_reels: d.num_reels,
                num_videos: d.num_videos,
                status: d.status,
                deliverable_type: d.deliverable_type,
                due_date: d.due_date,
                content_url: d.content_url,
                submitted_at: d.submitted_at,
                reviewed_at: d.reviewed_at,
                review_feedback: d.review_feedback,
                completed_at: d.completed_at
            }))
        }));
    }

    static async getInfluencerContribution(campaignId, influencerId, brandId) {
        if (!campaignId || !influencerId) throw new Error('Campaign ID and Influencer ID are required');

        const campaign = await CampaignInfo.findOne({
            _id: campaignId,
            brand_id: brandId
        }).select('title');

        if (!campaign) {
            throw new Error('Campaign not found');
        }

        const participation = await CampaignInfluencers.findOne({
            campaign_id: campaignId,
            influencer_id: influencerId,
            status: { $in: ['active', 'completed'] }
        })
            .populate('influencer_id', 'fullName profilePicUrl')
            .lean();

        if (!participation) {
            throw new Error('Influencer is not part of this campaign');
        }

        const { CampaignPayments } = require('../../models/CampaignMongo');
        const payment = await CampaignPayments.findOne({
            campaign_id: campaignId,
            influencer_id: influencerId,
            status: 'completed'
        }).select('amount');

        const totalPaid = payment ? payment.amount : 0;

        return {
            influencer: {
                name: participation.influencer_id.fullName,
                profilePicUrl: participation.influencer_id.profilePicUrl || '/images/default-profile.jpg'
            },
            campaign: {
                title: campaign.title
            },
            contribution: {
                progress: participation.progress || 0,
                deliverables: participation.deliverables || [],
                metrics: {
                    engagement_rate: participation.engagement_rate || 0,
                    reach: participation.reach || 0,
                    clicks: participation.clicks || 0,
                    conversions: participation.conversions || 0
                },
                earnings: totalPaid
            }
        };
    }
`;

svcC = svcC.replace(/}\s*module\.exports = brandCampaignService;/, additionalMethods + '\n}\n\nmodule.exports = brandCampaignService;');
fs.writeFileSync(svcPath, svcC);

