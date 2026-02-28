const { CampaignInfo, CampaignMetrics, CampaignInfluencers } = require('../../models/CampaignMongo');
const mongoose = require('mongoose');

class brandCampaignService {
    // Get recent completed campaigns for a brand (limited)
    static async getRecentCompletedCampaigns(brandId, limit = 3) {
        try {
            const brandObjectId = new mongoose.Types.ObjectId(brandId);

            const campaigns = await CampaignInfo.find({
                brand_id: brandObjectId,
                status: 'completed'
            })
                .sort({ end_date: -1 })
                .limit(limit)
                .lean();

            if (!campaigns.length) return [];

            const campaignIds = campaigns.map(c => c._id);

            // Fetch metrics, influencer counts, and products in parallel
            const [metrics, influencerCounts, allProducts] = await Promise.all([
                CampaignMetrics.find({ campaign_id: { $in: campaignIds } }).lean(),
                CampaignInfluencers.aggregate([
                    { $match: { campaign_id: { $in: campaignIds } } },
                    { $group: { _id: '$campaign_id', count: { $sum: 1 } } }
                ]),
                // Fetch products associated with these campaigns
                mongoose.model('Product').find({ campaign_id: { $in: campaignIds } })
                    .select('campaign_id name images campaign_price')
                    .lean()
            ]);

            const metricsMap = new Map();
            metrics.forEach(m => metricsMap.set(m.campaign_id.toString(), m));

            const influencerCountMap = new Map();
            influencerCounts.forEach(c => influencerCountMap.set(c._id.toString(), c.count));

            // Group products by campaign
            const productsMap = new Map();
            allProducts.forEach(p => {
                const cId = p.campaign_id.toString();
                if (!productsMap.has(cId)) productsMap.set(cId, []);
                productsMap.get(cId).push(p);
            });

            return campaigns.map(campaign => {
                const m = metricsMap.get(campaign._id.toString()) || {};
                return {
                    _id: campaign._id,
                    name: campaign.title,
                    description: campaign.description,
                    end_date: campaign.end_date,
                    budget: campaign.budget || 0,
                    status: campaign.status,
                    duration: campaign.duration || 0,
                    target_audience: campaign.target_audience || '',
                    required_channels: campaign.required_channels || [],
                    min_followers: campaign.min_followers || 0,
                    engagement_rate: m.engagement_rate || 0,
                    reach: m.reach || 0,
                    conversion_rate: m.conversion_rate || 0,
                    performance_score: m.performance_score || 0,
                    influencersCount: influencerCountMap.get(campaign._id.toString()) || 0,
                    products: productsMap.get(campaign._id.toString()) || []
                };
            });
        } catch (err) {
            console.error('Error fetching recent completed campaigns:', err);
            return [];
        }
    }

    // Get previous collaborations (completed campaigns) sorted by ROI
    static async getPreviousCollaborations(brandId) {
        try {
            const brandObjectId = new mongoose.Types.ObjectId(brandId);

            // Find completed campaigns
            const campaigns = await CampaignInfo.find({
                brand_id: brandObjectId,
                status: 'completed'
            }).lean();

            if (!campaigns.length) return [];

            const campaignIds = campaigns.map(c => c._id);

            // Fetch metrics for ROI and influencer details
            const [metrics, influencerCounts, campaignInfluencers] = await Promise.all([
                CampaignMetrics.find({ campaign_id: { $in: campaignIds } }).lean(),
                CampaignInfluencers.aggregate([
                    { $match: { campaign_id: { $in: campaignIds } } },
                    { $group: { _id: '$campaign_id', count: { $sum: 1 } } }
                ]),
                CampaignInfluencers.find({
                    campaign_id: { $in: campaignIds }
                }).populate('influencer_id', 'displayName name username profilePicUrl verified').lean()
            ]);

            const metricsMap = new Map();
            metrics.forEach(m => metricsMap.set(m.campaign_id.toString(), m));

            const influencerCountMap = new Map();
            influencerCounts.forEach(c => influencerCountMap.set(c._id.toString(), c.count));

            // Group influencers by campaign_id
            const influencersByCampaign = {};
            campaignInfluencers.forEach(ci => {
                const campaignId = ci.campaign_id.toString();
                if (!influencersByCampaign[campaignId]) {
                    influencersByCampaign[campaignId] = [];
                }
                if (ci.influencer_id) {
                    influencersByCampaign[campaignId].push({
                        id: ci.influencer_id._id,
                        name: ci.influencer_id.displayName || ci.influencer_id.name || 'Unknown Influencer',
                        username: ci.influencer_id.username || '',
                        profilePicUrl: ci.influencer_id.profilePicUrl || '/images/default-avatar.jpg',
                        verified: ci.influencer_id.verified || false,
                        progress: ci.progress || 0,
                        performance_score: ci.performance_score || 0,
                        engagement_rate: ci.engagement_rate || 0,
                        reach: ci.reach || 0,
                        status: ci.status || 'completed'
                    });
                }
            });

            // Map and sort by ROI
            const mappedCampaigns = campaigns.map(campaign => {
                const m = metricsMap.get(campaign._id.toString()) || {};
                return {
                    _id: campaign._id,
                    title: campaign.title,
                    end_date: campaign.end_date,
                    budget: campaign.budget || 0,
                    roi: m.roi || 0,
                    influencersCount: influencerCountMap.get(campaign._id.toString()) || 0,
                    influencers: influencersByCampaign[campaign._id.toString()] || []
                };
            });

            // Sort by ROI descending
            return mappedCampaigns.sort((a, b) => b.roi - a.roi);

        } catch (err) {
            console.error('Error fetching previous collaborations:', err);
            return [];
        }
    }

    // Get current partnerships (active campaigns)
    static async getCurrentPartnerships(brandId) {
        try {
            const brandObjectId = new mongoose.Types.ObjectId(brandId);

            const campaigns = await CampaignInfo.find({
                brand_id: brandObjectId,
                status: 'active'
            })
                .select('title start_date budget required_channels')
                .sort({ start_date: -1 })
                .lean();

            if (!campaigns.length) return [];

            // Get products for each campaign
            const campaignIds = campaigns.map(c => c._id);
            const { Product } = require('../../models/ProductMongo');

            const [products, campaignInfluencers] = await Promise.all([
                Product.find({
                    campaign_id: { $in: campaignIds },
                    status: 'active'
                }).select('campaign_id name description original_price campaign_price category images target_quantity sold_quantity is_digital delivery_info tags').lean(),
                CampaignInfluencers.find({
                    campaign_id: { $in: campaignIds },
                    status: 'active'
                }).populate('influencer_id', 'displayName name username profilePicUrl verified').lean()
            ]);

            // Group products by campaign_id
            const productsByCampaign = {};
            products.forEach(product => {
                const campaignId = product.campaign_id.toString();
                if (!productsByCampaign[campaignId]) {
                    productsByCampaign[campaignId] = [];
                }
                productsByCampaign[campaignId].push({
                    name: product.name,
                    description: product.description,
                    originalPrice: product.original_price,
                    campaignPrice: product.campaign_price,
                    category: product.category,
                    images: product.images,
                    targetQuantity: product.target_quantity,
                    soldQuantity: product.sold_quantity,
                    isDigital: product.is_digital,
                    deliveryInfo: product.delivery_info,
                    tags: product.tags
                });
            });

            // Group influencers by campaign_id
            const influencersByCampaign = {};
            campaignInfluencers.forEach(ci => {
                const campaignId = ci.campaign_id.toString();
                if (!influencersByCampaign[campaignId]) {
                    influencersByCampaign[campaignId] = [];
                }
                if (ci.influencer_id) {
                    influencersByCampaign[campaignId].push({
                        id: ci.influencer_id._id,
                        name: ci.influencer_id.displayName || ci.influencer_id.name || 'Unknown Influencer',
                        username: ci.influencer_id.username || '',
                        profilePicUrl: ci.influencer_id.profilePicUrl || '/images/default-avatar.jpg',
                        verified: ci.influencer_id.verified || false,
                        progress: ci.progress || 0,
                        status: ci.status || 'active'
                    });
                }
            });

            // Add products and influencers to each campaign
            return campaigns.map(campaign => ({
                ...campaign,
                products: productsByCampaign[campaign._id.toString()] || [],
                influencers: influencersByCampaign[campaign._id.toString()] || []
            }));
        } catch (err) {
            console.error('Error fetching current partnerships:', err);
            return [];
        }
    }

    // Get top campaigns for a brand
    static async getTopCampaigns(brandId) {
        try {
            // First, get campaign IDs that are 'active' or 'completed'
            const validCampaigns = await CampaignInfo.find({
                brand_id: brandId,
                status: { $in: ['active', 'completed'] }
            }).select('_id').lean();

            const validCampaignIds = validCampaigns.map(c => c._id);

            if (validCampaignIds.length === 0) {
                return [];
            }

            // Get metrics for those campaigns and populate campaign info
            const topCampaigns = await CampaignMetrics.find({
                brand_id: brandId,
                campaign_id: { $in: validCampaignIds }
            })
                .sort({ performance_score: -1 })
                .limit(5)
                .populate('campaign_id', 'title status')
                .lean();

            // Map results to include title and status at top level
            return topCampaigns.map(metric => ({
                _id: metric._id,
                id: metric.campaign_id?._id || metric.campaign_id,
                title: metric.campaign_id?.title || 'Untitled Campaign',
                status: metric.campaign_id?.status || 'active',
                performance_score: metric.performance_score || 0,
                reach: metric.reach || 0,
                engagement_rate: metric.engagement_rate || 0
            }));
        } catch (err) {
            console.error('Error fetching top campaigns:', err);
            return [];
        }
    }

    // Get active campaigns for a brand
    static async getActiveCampaigns(brandId) {
        try {
            const activeCampaigns = await CampaignInfo.find({
                brand_id: brandId,
                status: 'active',
                end_date: { $gt: new Date() }
            })
                .sort({ start_date: -1 })
                .lean();

            // Get metrics for all campaigns
            const campaignIds = activeCampaigns.map(campaign => campaign._id);
            const [metrics, influencerCounts] = await Promise.all([
                CampaignMetrics.find({
                    campaign_id: { $in: campaignIds }
                }).lean(),
                CampaignInfluencers.aggregate([
                    {
                        $match: {
                            campaign_id: { $in: campaignIds },
                            status: 'active'
                        }
                    },
                    {
                        $group: {
                            _id: '$campaign_id',
                            count: { $sum: 1 }
                        }
                    }
                ])
            ]);

            // Create maps for quick lookup
            const metricsMap = new Map();
            metrics.forEach(metric => {
                metricsMap.set(metric.campaign_id.toString(), metric);
            });

            const influencerCountMap = new Map();
            influencerCounts.forEach(count => {
                influencerCountMap.set(count._id.toString(), count.count);
            });

            return activeCampaigns.map(campaign => {
                const campaignMetrics = metricsMap.get(campaign._id.toString()) || {};
                // Prefer influencer-driven overall_progress from CampaignMetrics; fallback to time-based progress
                const overallProgress = campaignMetrics.overall_progress;
                return {
                    ...campaign,
                    progress: (overallProgress !== undefined && overallProgress !== null) ? overallProgress : this.calculateCampaignProgress(campaign),
                    engagement_rate: campaignMetrics.engagement_rate || 0,
                    reach: campaignMetrics.reach || 0,
                    conversion_rate: campaignMetrics.conversion_rate || 0,
                    revenue: campaignMetrics.revenue || 0,
                    roi: campaignMetrics.roi || 0,
                    influencers_count: influencerCountMap.get(campaign._id.toString()) || 0
                };
            });
        } catch (err) {
            console.error('Error fetching active campaigns:', err);
            return [];
        }
    }

    // Helper function to calculate campaign progress
    static calculateCampaignProgress(campaign) {
        if (!campaign.start_date || !campaign.end_date) return 0;

        const now = new Date();
        const start = new Date(campaign.start_date);
        const end = new Date(campaign.end_date);

        if (now < start) return 0;
        if (now > end) return 100;

        const total = end - start;
        const elapsed = now - start;
        return Math.round((elapsed / total) * 100);
    }

    // Get campaign history for a brand
    static async getCampaignHistory(brandId) {
        try {
            console.log('Fetching campaign history for brand:', brandId);

            // Convert brandId to ObjectId
            const brandObjectId = new mongoose.Types.ObjectId(brandId);

            // Find completed and cancelled campaigns
            const campaigns = await CampaignInfo.find({
                brand_id: brandObjectId,
                status: { $in: ['completed', 'cancelled'] }
            })
                .sort({ end_date: -1 })
                .lean();

            console.log('Found campaigns:', campaigns.length);

            if (campaigns.length === 0) {
                return [];
            }

            // Get metrics for all campaigns
            const campaignIds = campaigns.map(campaign => campaign._id);
            const metrics = await CampaignMetrics.find({
                campaign_id: { $in: campaignIds }
            }).lean();

            console.log('Found metrics for campaigns:', metrics.length);

            // Create a map of campaign metrics
            const metricsMap = new Map();
            metrics.forEach(metric => {
                metricsMap.set(metric.campaign_id.toString(), metric);
            });

            // Get influencer details for each campaign
            const influencerDetails = await CampaignInfluencers.find({
                campaign_id: { $in: campaignIds }
            })
                .populate('influencer_id', 'name profilePicUrl')
                .lean();

            console.log('Found influencer details for campaigns:', influencerDetails.length);

            // Create a map of campaign influencers
            const influencerMap = new Map();
            influencerDetails.forEach(detail => {
                const campaignId = detail.campaign_id.toString();
                if (!influencerMap.has(campaignId)) {
                    influencerMap.set(campaignId, []);
                }
                if (detail.influencer_id) {
                    influencerMap.get(campaignId).push({
                        id: detail.influencer_id._id,
                        name: detail.influencer_id.name,
                        profilePicUrl: detail.influencer_id.profilePicUrl
                    });
                }
            });

            // Map campaigns with their metrics and influencers
            const result = campaigns.map(campaign => {
                const campaignMetrics = metricsMap.get(campaign._id.toString()) || {};
                return {
                    ...campaign,
                    performance_score: campaignMetrics.performance_score || 0,
                    engagement_rate: campaignMetrics.engagement_rate || 0,
                    reach: campaignMetrics.reach || 0,
                    conversion_rate: campaignMetrics.conversion_rate || 0,
                    influencers: influencerMap.get(campaign._id.toString()) || []
                };
            });

            console.log('Returning processed campaigns:', result.length);
            return result;
        } catch (err) {
            console.error('Error fetching campaign history:', err);
            return [];
        }
    }
    // Get detailed campaign history data for dashboard/history page
    static async getCampaignHistoryData(brandId) {
        try {
            const campaigns = await this.getCampaignHistory(brandId);

            const { Product } = require('../../models/ProductMongo');
            const transformedCampaigns = await Promise.all(campaigns.map(async (campaign) => {
                const products = await Product.find({ campaign_id: campaign._id }).lean();
                return {
                    ...campaign,
                    products: products.map(p => ({
                        _id: p._id,
                        name: p.name,
                        campaign_price: p.campaign_price,
                        images: p.images
                    }))
                };
            }));

            return {
                campaigns: transformedCampaigns,
                summary: {
                    totalCampaigns: transformedCampaigns.length
                }
            };
        } catch (error) {
            console.error('Error in getCampaignHistoryData:', error);
            throw error;
        }
    }

    // Get campaign requests for a brand
    static async getCampaignRequests(brandId) {
        try {
            const requests = await CampaignInfo.find({
                brand_id: new mongoose.Types.ObjectId(brandId),
                status: 'request'
            }).sort({ created_at: -1 }).lean();

            // Get influencer counts for each campaign
            const campaignIds = requests.map(request => request._id);
            const influencerCounts = await CampaignInfluencers.aggregate([
                {
                    $match: {
                        campaign_id: { $in: campaignIds },
                        status: 'active'
                    }
                },
                {
                    $group: {
                        _id: '$campaign_id',
                        count: { $sum: 1 }
                    }
                }
            ]);

            // Create a map for quick lookup
            const influencerCountMap = new Map();
            influencerCounts.forEach(count => {
                influencerCountMap.set(count._id.toString(), count.count);
            });

            // Add influencer count to each request
            return requests.map(request => ({
                ...request,
                influencers_count: influencerCountMap.get(request._id.toString()) || 0
            }));
        } catch (error) {
            console.error('Error getting campaign requests:', error);
            return [];
        }
    }

    // Get campaigns that have reached 100% progress but are still active
    static async getCompletedProgressCampaigns(brandId) {
        try {
            const brandObjectId = new mongoose.Types.ObjectId(brandId);

            // Find active campaigns
            const activeCampaigns = await CampaignInfo.find({
                brand_id: brandObjectId,
                status: 'active'
            }).lean();

            if (activeCampaigns.length === 0) {
                return [];
            }

            const campaignIds = activeCampaigns.map(c => c._id);

            // Get metrics with 100% overall progress
            const metrics = await CampaignMetrics.find({
                campaign_id: { $in: campaignIds },
                overall_progress: { $gte: 100 }
            }).lean();

            const completedProgressCampaignIds = new Set(
                metrics.map(m => m.campaign_id.toString())
            );

            // Return campaigns that have reached 100% progress
            return activeCampaigns
                .filter(campaign => completedProgressCampaignIds.has(campaign._id.toString()))
                .map(campaign => ({
                    _id: campaign._id,
                    title: campaign.title,
                    description: campaign.description,
                    start_date: campaign.start_date,
                    end_date: campaign.end_date,
                    budget: campaign.budget
                }));
        } catch (error) {
            console.error('Error getting completed progress campaigns:', error);
            return [];
        }
    }

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

    // Get collaborations available for brand
    static async getCollabsData(brandId) {
        try {
            const { CampaignInfo, CampaignInfluencers, CampaignMetrics } = require('../../models/CampaignMongo');
            // Get campaigns with status 'request'
            const allRequests = await CampaignInfo.find({ status: 'request' })
                .populate('brand_id', 'brandName logoUrl')
                .sort({ createdAt: -1 })
                .lean();

            // Get campaigns where influencers have entries with 'influencer-invite' status
            const existingInvites = await CampaignInfluencers.find({
                status: { $in: ['influencer-invite'] }
            }).select('campaign_id').lean();

            const excludedCampaignIds = existingInvites.map(invite => invite.campaign_id.toString());
            const requests = allRequests.filter(request => !excludedCampaignIds.includes(request._id.toString()));

            const campaignIds = requests.map(campaign => campaign._id);
            const metrics = await CampaignMetrics.find({ campaign_id: { $in: campaignIds } }).lean();

            const metricsMap = metrics.reduce((acc, metric) => {
                acc[metric.campaign_id.toString()] = metric;
                return acc;
            }, {});

            return requests.map(campaign => ({
                id: campaign._id,
                title: campaign.title || 'Untitled Campaign',
                brand_name: campaign.brand_id?.brandName || 'Unknown Brand',
                influence_regions: campaign.target_audience,
                budget: parseFloat(campaign.budget) || 0,
                commission: '10%',
                offer_sentence: campaign.description,
                channels: Array.isArray(campaign.required_channels) ? campaign.required_channels.join(', ') : '',
                min_followers: campaign.min_followers?.toLocaleString() || '0',
                age_group: campaign.target_audience?.split(',')[0] || 'All Ages',
                genders: campaign.target_audience?.split(',')[1] || 'All Genders',
                duration: campaign.duration || 0,
                required_channels: Array.isArray(campaign.required_channels) ? campaign.required_channels : [],
                created_at: campaign.createdAt || new Date(),
                status: campaign.status || 'active',
                engagement_rate: metricsMap[campaign._id.toString()]?.engagement_rate || 0,
                reach: metricsMap[campaign._id.toString()]?.reach || 0,
                conversion_rate: metricsMap[campaign._id.toString()]?.conversion_rate || 0,
                objectives: campaign.objectives || 'Not specified'
            }));
        } catch (error) {
            throw error;
        }
    }

    // Get received requests data
    static async getReceivedRequestsData(brandId) {
        try {
            const { CampaignInfo, CampaignInfluencers } = require('../../models/CampaignMongo');
            const { InfluencerSocials, InfluencerAnalytics } = require('../../models/InfluencerMongo');
            const { Message } = require('../../models/MessageMongo');
            const { Product } = require('../../models/ProductMongo');
            const mongoose = require('mongoose');

            const campaigns = await CampaignInfo.find({ brand_id: brandId }).lean();
            const campaignIds = campaigns.map(campaign => campaign._id);

            const influencerInvites = await CampaignInfluencers.find({
                campaign_id: { $in: campaignIds },
                status: 'influencer-invite'
            })
                .populate('influencer_id', 'fullName displayName username profilePicUrl location categories')
                .populate('campaign_id', 'title description duration budget target_audience required_channels min_followers')
                .lean();

            const requestCampaignIds = campaigns.filter(c => c.status === 'request').map(c => c._id);
            const campaignRequests = await CampaignInfluencers.find({
                campaign_id: { $in: requestCampaignIds },
                status: 'request'
            })
                .populate('influencer_id', 'fullName displayName username profilePicUrl location categories')
                .populate('campaign_id', 'title description duration budget target_audience required_channels min_followers')
                .lean();

            const formatInvite = async (ci, tag) => {
                const campaign = ci.campaign_id || {};
                const influencer = ci.influencer_id || {};

                const [influencerSocials, influencerAnalytics] = await Promise.all([
                    InfluencerSocials.findOne({ influencerId: influencer._id }).lean(),
                    InfluencerAnalytics.findOne({ influencerId: influencer._id }).lean()
                ]);

                let formattedChannels = influencerSocials?.platforms?.map(p => p.platform) || [];
                let formattedRequiredChannels = [];
                if (Array.isArray(campaign.required_channels)) {
                    formattedRequiredChannels = campaign.required_channels;
                } else if (typeof campaign.required_channels === 'string') {
                    formattedRequiredChannels = campaign.required_channels.split(',').map(channel => channel.trim());
                }

                const totalFollowers = influencerSocials?.platforms?.reduce((sum, p) => sum + (p.followers || 0), 0) || 0;
                const avgEngagementRate = influencerSocials?.platforms?.reduce((sum, p) => sum + (p.engagementRate || 0), 0) / (influencerSocials?.platforms?.length || 1) || 0;

                let latestMessage = null;
                try {
                    const msgDoc = await Message.findOne({
                        brand_id: new mongoose.Types.ObjectId(brandId),
                        influencer_id: new mongoose.Types.ObjectId(influencer._id),
                        campaign_id: new mongoose.Types.ObjectId(campaign._id)
                    }).sort({ createdAt: -1 }).lean();
                    latestMessage = msgDoc?.message || null;
                } catch (e) { }

                let campaignProducts = [];
                try {
                    const products = await Product.find({ campaign_id: new mongoose.Types.ObjectId(campaign._id), status: 'active' }).lean();
                    campaignProducts = products.map(product => ({
                        id: product._id,
                        name: product.name,
                        category: product.category,
                        original_price: product.original_price,
                        campaign_price: product.campaign_price,
                        discount_percentage: product.discount_percentage,
                        description: product.description,
                        image_url: product.images && product.images.length > 0 ? (product.images.find(img => img.is_primary) || product.images[0]).url : null,
                        special_instructions: product.special_instructions
                    }));
                } catch (e) { }

                return {
                    tag,
                    _cid: ci._id,
                    _iid: influencer._id,
                    message: latestMessage,
                    collab: {
                        title: campaign.title,
                        description: campaign.description,
                        duration: campaign.duration,
                        budget: campaign.budget,
                        target_audience: campaign.target_audience,
                        required_channels: formattedRequiredChannels,
                        min_followers: campaign.min_followers,
                        products: campaignProducts
                    },
                    influencer: {
                        id: influencer._id,
                        name: influencer.displayName || influencer.fullName || 'Unknown',
                        username: influencer.username || 'unknown',
                        profile_pic: influencer.profilePicUrl || '/images/default-avatar.jpg',
                        location: influencer.location || 'Not specified',
                        categories: influencer.categories || [],
                        channels: formattedChannels,
                        followers: totalFollowers,
                        engagement_rate: avgEngagementRate,
                        socials: influencerSocials?.platforms?.map(p => ({
                            platform: p.platform, handle: p.handle, followers: p.followers, engagement_rate: p.engagementRate
                        })) || [],
                        analytics: {
                            total_followers: influencerAnalytics?.totalFollowers || 0,
                            avg_engagement_rate: influencerAnalytics?.avgEngagementRate || 0,
                            rating: influencerAnalytics?.rating || 0,
                            audience_demographics: influencerAnalytics?.audienceDemographics || {}
                        }
                    }
                };
            };

            const [formattedInfluencerInvites, formattedCampaignRequests] = await Promise.all([
                Promise.all(influencerInvites.map(ci => formatInvite(ci, 'influencer invite'))),
                Promise.all(campaignRequests.map(ci => formatInvite(ci, 'request')))
            ]);

            return [...formattedInfluencerInvites, ...formattedCampaignRequests];
        } catch (error) {
            throw error;
        }
    }

    // Get transaction details data
    static async getTransactionData(campaignId, influencerId) {
        try {
            const { CampaignInfo, CampaignInfluencers } = require('../../models/CampaignMongo');
            const { InfluencerInfo } = require('../../models/InfluencerMongo');
            const mongoose = require('mongoose');

            const cId = new mongoose.Types.ObjectId(campaignId);
            const iId = new mongoose.Types.ObjectId(influencerId);

            let request = await CampaignInfluencers.findOne({ _id: cId, influencer_id: iId })
                .populate({ path: 'campaign_id', select: 'title description budget duration target_audience required_channels min_followers objectives start_date end_date status' })
                .populate('influencer_id', 'fullName displayName username profilePicUrl')
                .lean();

            if (!request) {
                const allRequests = await CampaignInfluencers.find({ $or: [{ _id: cId }, { influencer_id: iId }] }).lean();
                if (allRequests.length > 0) {
                    const matchedRequest = allRequests.find(r => r._id.toString() === cId.toString() && r.influencer_id.toString() === iId.toString());
                    if (matchedRequest) {
                        request = await CampaignInfluencers.findById(matchedRequest._id)
                            .populate({ path: 'campaign_id', select: 'title description budget duration target_audience required_channels min_followers objectives start_date end_date status' })
                            .populate('influencer_id', 'fullName displayName username profilePicUrl')
                            .lean();
                    }
                }
            }

            if (!request) return null;

            return {
                requestId1: cId.toString(),
                requestId2: iId.toString(),
                campaign: request.campaign_id,
                influencer: request.influencer_id,
                status: request.status,
                progress: request.progress
            };
        } catch (error) {
            throw error;
        }
    }


    static async submitTransaction(brandId, requestId1, requestId2, data, file) {
        const {
            objectives,
            startDate,
            endDate,
            targetAudience,
            amount,
            paymentMethod,
            prodName,
            prodDescription,
            originalPrice,
            campaignPrice,
            category,
            targetQty,
            deliverables: rawDeliverables
        } = data;

        if (!amount || !paymentMethod) {
            throw new Error('Amount and payment method are required');
        }

        const campaignId = new mongoose.Types.ObjectId(requestId1);
        const influencerId = new mongoose.Types.ObjectId(requestId2);

        const request = await CampaignInfluencers.findOne({
            _id: campaignId,
            influencer_id: influencerId
        });

        if (!request) throw new Error('Request not found');

        const campaignDoc = await CampaignInfo.findById(request.campaign_id).select('status brand_id');
        if (!campaignDoc) throw new Error('Campaign not found');

        const isCompleting = (campaignDoc.status === 'influencer-invite');

        if (isCompleting) {
            if (!objectives || !startDate || !endDate || !targetAudience) {
                throw new Error('Campaign completion fields are required');
            }

            const start = new Date(startDate);
            const end = new Date(endDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (start < today) throw new Error('Start date cannot be in the past');
            if (end <= start) throw new Error('End date must be after start date');

            const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
            if (duration > 365) throw new Error('Campaign duration cannot exceed 365 days');

            await CampaignInfo.updateOne(
                { _id: request.campaign_id },
                {
                    $set: {
                        objectives: objectives.trim(),
                        start_date: start,
                        end_date: end,
                        duration: duration,
                        target_audience: targetAudience.trim(),
                        status: 'active'
                    }
                }
            );

            // Product creation
            if (!prodName || !prodDescription || !category || !file) {
                throw new Error('Product name, description, category, and image are required');
            }

            const op = Number(originalPrice);
            const cp = Number(campaignPrice);
            const tq = Number(targetQty);
            if (!Number.isFinite(op) || op < 0 || !Number.isFinite(cp) || cp < 0 || cp > op || !Number.isFinite(tq) || tq < 0) {
                throw new Error('Invalid product pricing or target quantity');
            }

            const { uploadToCloudinary } = require('../../utils/cloudinary');
            const imageUrl = await uploadToCloudinary(file, 'products');

            const { Product } = require('../../models/ProductMongo');
            await Product.create({
                brand_id: new mongoose.Types.ObjectId(brandId),
                campaign_id: request.campaign_id,
                name: prodName.trim(),
                description: prodDescription.trim(),
                images: [{ url: imageUrl, is_primary: true }],
                original_price: op,
                campaign_price: cp,
                category: category.trim(),
                target_quantity: tq,
                created_by: new mongoose.Types.ObjectId(brandId),
                status: 'active'
            });
        }

        const { CampaignPayments } = require('../../models/CampaignMongo');
        const payment = new CampaignPayments({
            campaign_id: request.campaign_id,
            brand_id: new mongoose.Types.ObjectId(brandId),
            influencer_id: influencerId,
            amount: parseFloat(amount),
            status: 'completed',
            payment_date: new Date(),
            payment_method: paymentMethod === 'creditCard' ? 'credit_card' : 'bank_transfer'
        });
        await payment.save();

        await CampaignInfluencers.updateOne(
            { _id: campaignId, influencer_id: influencerId },
            { $set: { status: 'active' } }
        );

        let deliverables = rawDeliverables;
        if (typeof deliverables === 'string') {
            try { deliverables = JSON.parse(deliverables); } catch (e) { deliverables = []; }
        }

        if (deliverables && Array.isArray(deliverables) && deliverables.length > 0) {
            const formattedDeliverables = deliverables.map(d => ({
                title: d.title || 'Untitled Deliverable',
                description: d.description || '',
                due_date: d.due_date ? new Date(d.due_date) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                deliverable_type: d.deliverable_type || 'Other',
                status: 'pending'
            }));

            await CampaignInfluencers.updateOne(
                { _id: campaignId, influencer_id: influencerId },
                { $set: { deliverables: formattedDeliverables } }
            );
        }

        const notificationController = require('../../controllers/notificationController');
        try {
            const campaignInfoForNotif = await CampaignInfo.findById(request.campaign_id).select('title').lean();
            await notificationController.createNotification({
                recipientId: new mongoose.Types.ObjectId(influencerId),
                recipientType: 'influencer',
                senderId: new mongoose.Types.ObjectId(brandId),
                senderType: 'brand',
                type: 'request_accepted',
                title: 'Request Accepted',
                body: `Your request has been accepted for "${campaignInfoForNotif?.title || 'your campaign'}".`,
                relatedId: request._id,
                data: { campaignId: request.campaign_id }
            });
        } catch (notifErr) { console.error('Notification error:', notifErr); }

        const SubscriptionService = require('../subscription/subscriptionService');
        try {
            await SubscriptionService.updateUsage(brandId, 'brand', { influencersConnected: 1 });
        } catch (usageError) { console.error('Usage update error:', usageError); }

        return { success: true, message: 'Campaign completed and payment processed successfully!' };
    }

    static async createCampaign(brandId, data, files) {
        const {
            title, description, start_date, end_date, budget,
            target_audience, required_channels, required_influencers,
            min_followers, objectives, products
        } = data;

        const SubscriptionService = require('../subscription/subscriptionService');
        const limitCheck = await SubscriptionService.checkSubscriptionLimits(brandId, 'brand', 'campaigns');
        if (!limitCheck.allowed) {
            return {
                allowed: false,
                reason: limitCheck.reason,
                redirectToPayment: limitCheck.redirectToPayment
            };
        }

        const startDateObj = new Date(start_date);
        const endDateObj = new Date(end_date);
        const duration = Math.ceil((endDateObj - startDateObj) / (1000 * 60 * 60 * 24) + 1);

        if (duration <= 0) throw new Error('End date must be after start date.');

        const campaignInfo = new CampaignInfo({
            brand_id: new mongoose.Types.ObjectId(brandId),
            title,
            description,
            status: 'request',
            start_date: startDateObj,
            end_date: endDateObj,
            duration: duration,
            budget: parseFloat(budget),
            target_audience,
            required_channels: Array.isArray(required_channels) ? required_channels : [required_channels],
            required_influencers: parseInt(required_influencers),
            min_followers: parseInt(min_followers),
            objectives
        });

        const savedCampaign = await campaignInfo.save();

        if (products && Array.isArray(products)) {
            const { Product } = require('../../models/ProductMongo');
            const { uploadBufferToCloudinary } = require('../../utils/cloudinary');

            for (let i = 0; i < products.length; i++) {
                const productData = products[i];
                const discountPercentage = productData.original_price > 0
                    ? Math.round(((productData.original_price - productData.campaign_price) / productData.original_price) * 100)
                    : 0;

                let imageUrl = '';
                if (files && files.length > 0) {
                    const productImageFile = files.find(file => file.fieldname === `products[${i}][image]`);
                    if (productImageFile) {
                        imageUrl = await uploadBufferToCloudinary(productImageFile, 'product-images');
                    }
                }

                await new Product({
                    name: productData.name,
                    category: productData.category,
                    description: productData.description,
                    original_price: parseFloat(productData.original_price),
                    campaign_price: parseFloat(productData.campaign_price),
                    discount_percentage: discountPercentage,
                    images: [{ url: imageUrl }],
                    special_instructions: productData.special_instructions || '',
                    brand_id: new mongoose.Types.ObjectId(brandId),
                    campaign_id: savedCampaign._id,
                    created_by: new mongoose.Types.ObjectId(brandId),
                    status: 'active',
                    target_quantity: parseInt(productData.target_quantity)
                }).save();
            }
        }

        const campaignMetrics = new CampaignMetrics({
            campaign_id: new mongoose.Types.ObjectId(savedCampaign._id),
            brand_id: new mongoose.Types.ObjectId(brandId),
        });
        await campaignMetrics.save();

        try {
            await SubscriptionService.updateUsage(brandId, 'brand', { campaignsUsed: 1 });
        } catch (e) { console.error('Usage update error:', e); }

        return { success: true, campaignId: savedCampaign._id };
    }

    static async activateCampaign(brandId, campaignId) {
        const campaign = await CampaignInfo.findOne({
            _id: new mongoose.Types.ObjectId(campaignId),
            brand_id: new mongoose.Types.ObjectId(brandId)
        });

        if (!campaign) throw new Error('Campaign not found');

        const acceptedCount = await CampaignInfluencers.countDocuments({
            campaign_id: new mongoose.Types.ObjectId(campaignId),
            status: 'active'
        });

        if (acceptedCount === 0) throw new Error('Cannot activate: no accepted influencers yet.');

        campaign.status = 'active';
        await campaign.save();

        return { success: true };
    }

    static async getCampaignDetails(brandId, campaignId) {
        const campaign = await CampaignInfo.findOne({
            _id: new mongoose.Types.ObjectId(campaignId),
            brand_id: new mongoose.Types.ObjectId(brandId)
        }).lean();

        if (!campaign) throw new Error('Campaign not found');

        const acceptedInfluencers = await CampaignInfluencers.find({
            campaign_id: new mongoose.Types.ObjectId(campaignId),
            status: 'active'
        }).populate('influencer_id', 'fullName profilePicUrl followers engagement_rate').lean();

        const { Product } = require('../../models/ProductMongo');
        const products = await Product.find({ campaign_id: new mongoose.Types.ObjectId(campaignId) }).lean();

        return {
            _id: campaign._id,
            title: campaign.title,
            description: campaign.description,
            status: campaign.status,
            startDate: campaign.start_date,
            endDate: campaign.end_date,
            duration: campaign.duration,
            budget: campaign.budget,
            target_audience: campaign.target_audience,
            required_channels: campaign.required_channels || [],
            min_followers: campaign.min_followers,
            objectives: campaign.objectives,
            accepted_influencers: acceptedInfluencers.length,
            influencers: acceptedInfluencers.map(ci => ({
                name: ci.influencer_id?.fullName || 'Unknown',
                profilePicUrl: ci.influencer_id?.profilePicUrl || '/images/default-avatar.jpg',
                followers: ci.influencer_id?.followers || 0,
                engagement_rate: ci.influencer_id?.engagement_rate || 0
            })),
            products: products.map(p => ({
                _id: p._id,
                name: p.name,
                category: p.category,
                description: p.description,
                original_price: p.original_price,
                campaign_price: p.campaign_price,
                discount_percentage: p.discount_percentage,
                images: p.images,
                special_instructions: p.special_instructions,
                target_quantity: p.target_quantity,
                sold_quantity: p.sold_quantity
            }))
        };
    }

    static async endCampaign(brandId, campaignId) {
        const campaign = await CampaignInfo.findOne({
            _id: new mongoose.Types.ObjectId(campaignId),
            brand_id: new mongoose.Types.ObjectId(brandId),
            status: 'active'
        });

        if (!campaign) throw new Error('Campaign not found or already completed');

        const { Product } = require('../../models/ProductMongo');
        const productsSold = await Product.countDocuments({ campaign_id: new mongoose.Types.ObjectId(campaignId) }) || 0;
        const revenue = (productsSold || 0) * (campaign.budget || 0);
        const roi = revenue / (campaign.budget || 1);

        await CampaignMetrics.findOneAndUpdate(
            { campaign_id: new mongoose.Types.ObjectId(campaignId) },
            { $set: { revenue, roi } }
        );

        campaign.status = 'completed';
        campaign.end_date = new Date();
        await campaign.save();

        const { BrandInfo } = require('../../models/BrandMongo');
        const { InfluencerInfo } = require('../../models/InfluencerMongo');

        await BrandInfo.findByIdAndUpdate(brandId, { $inc: { completedCampaigns: 1 } });

        const influencers = await CampaignInfluencers.find({ campaign_id: new mongoose.Types.ObjectId(campaignId) });
        for (const influencer of influencers) {
            await InfluencerInfo.findByIdAndUpdate(influencer.influencer_id, { $inc: { completedCampaigns: 1 } });
        }

        await CampaignInfluencers.updateMany(
            { campaign_id: new mongoose.Types.ObjectId(campaignId), status: 'active' },
            { $set: { status: 'completed' } }
        );

        await Product.updateMany(
            { campaign_id: new mongoose.Types.ObjectId(campaignId) },
            { $set: { status: 'inactive' } }
        );

        return { success: true };
    }

    static async getDraftCampaigns(brandId) {
        return await CampaignInfo.find({
            brand_id: new mongoose.Types.ObjectId(brandId),
            status: 'request'
        })
            .select('_id title budget description duration start_date end_date')
            .sort({ createdAt: -1 })
            .lean();
    }

    static async declineRequest(brandId, campaignId, influencerId) {
        const request = await CampaignInfluencers.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(campaignId), influencer_id: new mongoose.Types.ObjectId(influencerId) },
            { $set: { status: 'cancelled' } },
            { new: true }
        );

        if (!request) throw new Error('Request not found');

        const notificationController = require('../../controllers/notificationController');
        try {
            const campaign = await CampaignInfo.findById(request.campaign_id).select('title').lean();
            await notificationController.createNotification({
                recipientId: new mongoose.Types.ObjectId(influencerId),
                recipientType: 'influencer',
                senderId: new mongoose.Types.ObjectId(brandId),
                senderType: 'brand',
                type: 'request_declined',
                title: 'Request Declined',
                body: `Your request for "${campaign?.title || 'your campaign'}" was declined.`,
                relatedId: request._id,
                data: { campaignId: request.campaign_id }
            });
        } catch (e) { console.error('Notification error:', e); }

        return { success: true };
    }
}

module.exports = brandCampaignService;
