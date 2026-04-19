const { CampaignInfluencers, CampaignInfo } = require('../models/CampaignMongo');
const { InfluencerInfo } = require('../models/InfluencerMongo');
const { BrandInfo } = require('../models/BrandMongo');
const mongoose = require('mongoose');
const CampaignMetrics = mongoose.model('CampaignMetrics');

class CollaborationModel {
    static async getActiveCollaborations(influencerId) {
        try {
            if (!influencerId) {
                console.error('No influencer ID provided');
                return [];
            }

            // ── OPTIMISATION: single aggregation pipeline replaces 3 round-trips ────
            // Before: CampaignInfluencers.find → CampaignMetrics.find → InfluencerAnalytics.find
            // After:  one pipeline with $lookup stages (hits {influencer_id,status} index)
            const results = await CampaignInfluencers.aggregate([
                // Stage 1 – filter by influencer + status using the new compound index
                { $match: { influencer_id: new mongoose.Types.ObjectId(influencerId), status: 'active' } },

                // Stage 2 – join campaign (only fields we actually use on the card)
                { $lookup: {
                    from: 'campaigninfos',
                    localField: 'campaign_id',
                    foreignField: '_id',
                    pipeline: [
                        { $match: { status: { $ne: 'request' } } },
                        { $project: { title: 1, budget: 1, duration: 1, required_channels: 1, status: 1, brand_id: 1, metrics: 1 } }
                    ],
                    as: 'campaign'
                }},
                { $unwind: { path: '$campaign', preserveNullAndEmptyArrays: false } },

                // Stage 3 – join brand (name + logo only)
                { $lookup: {
                    from: 'brandinfos',
                    localField: 'campaign.brand_id',
                    foreignField: '_id',
                    pipeline: [{ $project: { brandName: 1, logoUrl: 1 } }],
                    as: 'brand'
                }},
                { $unwind: { path: '$brand', preserveNullAndEmptyArrays: true } },

                // Stage 4 – (DEPRECATED) Campaign metrics lookup removed. 
                // We now use campaign.metrics embedded field.

                // Stage 5 – join influencer just for referralCode
                { $lookup: {
                    from: 'influencerinfos',
                    localField: 'influencer_id',
                    foreignField: '_id',
                    pipeline: [{ $project: { referralCode: 1 } }],
                    as: 'influencerDoc'
                }},

                // Stage 6 – shape output (only fields consumed by the frontend)
                { $project: {
                    _id: 1,
                    campaign_id:       '$campaign._id',
                    campaign_name:     '$campaign.title',
                    brand_name:        '$brand.brandName',
                    brand_logo:        '$brand.logoUrl',
                    progress:          { $ifNull: ['$progress', 0] },
                    duration:          { $ifNull: ['$campaign.duration', 0] },
                    budget:            { $ifNull: ['$campaign.budget', 0] },
                    timeliness_score:  { $ifNull: ['$timeliness_score', 0] },
                    revenue:           { $ifNull: ['$revenue', 0] },
                    commission_earned: { $ifNull: ['$commission_earned', 0] },
                    referralCode:      { $ifNull: [{ $arrayElemAt: ['$influencerDoc.referralCode', 0] }, ''] },
                    engagement_rate:   { $ifNull: ['$campaign.metrics.engagement_rate', 0] },
                    reach:             { $ifNull: ['$campaign.metrics.reach', 0] },
                    clicks:            { $ifNull: ['$campaign.metrics.clicks', 0] },
                    conversions:       { $ifNull: ['$campaign.metrics.conversions', 0] },
                    performance_score: { $ifNull: ['$campaign.metrics.performance_score', 0] },
                    impressions:       { $ifNull: ['$campaign.metrics.impressions', 0] },
                    roi:               { $ifNull: ['$campaign.metrics.roi', 0] },
                    // Deliverables: only fields rendered in the UI (avoid pulling full content_url blobs when listing)
                    deliverables: {
                        $map: {
                            input: { $ifNull: ['$deliverables', []] },
                            as: 'd',
                            in: {
                                _id:             '$$d._id',
                                title:           '$$d.title',
                                description:     '$$d.description',
                                status:          '$$d.status',
                                deliverable_type:'$$d.deliverable_type',
                                due_date:        '$$d.due_date',
                                content_url:     '$$d.content_url',
                                submitted_at:    '$$d.submitted_at',
                                reviewed_at:     '$$d.reviewed_at',
                                review_feedback: '$d.review_feedback'
                            }
                        }
                    }
                }
        }]);

            // Rename _id → id to match existing contract
            return results.map(r => ({ id: r._id, ...r }));
        } catch (error) {
            console.error('Error in getActiveCollaborations:', error);
            return [];
        }
    }

    static async getActiveCollaborationsCount(influencerId) {
        try {
            const count = await CampaignInfluencers.countDocuments({
                influencer_id: new mongoose.Types.ObjectId(influencerId),
                status: 'active'
            });
            return count;
        } catch (error) {
            console.error('Error in getActiveCollaborationsCount:', error);
            throw error;
        }
    }

    static async getCompletionPercentage(influencerId) {
        try {
            const result = await CampaignInfluencers.aggregate([
                { $match: { influencer_id: new mongoose.Types.ObjectId(influencerId), status: 'active' } },
                { $group: { _id: null, avg_progress: { $avg: '$progress' } } }
            ]);
            return result[0]?.avg_progress || 0;
        } catch (error) {
            console.error('Error in getCompletionPercentage:', error);
            throw error;
        }
    }

    static async getNearingCompletionCount(influencerId) {
        try {
            const count = await CampaignInfluencers.countDocuments({
                influencer_id: new mongoose.Types.ObjectId(influencerId),
                status: 'active',
                progress: { $gte: 75 }
            });
            return count;
        } catch (error) {
            console.error('Error in getNearingCompletionCount:', error);
            throw error;
        }
    }

    static async getPendingRequestsCount(influencerId) {
        try {
            const count = await CampaignInfluencers.countDocuments({
                influencer_id: new mongoose.Types.ObjectId(influencerId),
                status: 'request'
            });
            return count;
        } catch (error) {
            console.error('Error in getPendingRequestsCount:', error);
            throw error;
        }
    }

    static async getMonthlyEarnings(influencerId) {
        try {
            const CampaignPayments = mongoose.model('CampaignPayments');
            const now = new Date();
            // FIXED: use proper Date constructor instead of string concatenation
            // Old code used yearMonth + '-31' which is wrong for months with <31 days
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

            const result = await CampaignPayments.aggregate([
                {
                    $match: {
                        influencer_id: new mongoose.Types.ObjectId(influencerId),
                        status: 'completed',
                        payment_date: { $gte: monthStart, $lte: monthEnd }  // uses {influencer_id, payment_date} index
                    }
                },
                {
                    $group: {
                        _id: null,
                        total_earnings: { $sum: '$amount' }
                    }
                }
            ]);
            return result[0]?.total_earnings || 0;
        } catch (error) {
            console.error('Error in getMonthlyEarnings:', error);
            throw error;
        }
    }

    static async getEarningsChange(influencerId) {
        try {
            const CampaignPayments = mongoose.model('CampaignPayments');
            const now = new Date();
            // FIXED: use proper Date constructors for precise month boundaries
            const currentMonthStart  = new Date(now.getFullYear(), now.getMonth(), 1);
            const currentMonthEnd    = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const previousMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

            const [currentResult, previousResult] = await Promise.all([
                CampaignPayments.aggregate([
                    { $match: { influencer_id: new mongoose.Types.ObjectId(influencerId), status: 'completed', payment_date: { $gte: currentMonthStart, $lte: currentMonthEnd } } },
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ]),
                CampaignPayments.aggregate([
                    { $match: { influencer_id: new mongoose.Types.ObjectId(influencerId), status: 'completed', payment_date: { $gte: previousMonthStart, $lte: previousMonthEnd } } },
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ])
            ]);

            const currentMonthTotal  = currentResult[0]?.total || 0;
            const previousMonthTotal = previousResult[0]?.total || 0;

            if (previousMonthTotal === 0) return 100;
            return ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100;
        } catch (error) {
            console.error('Error in getEarningsChange:', error);
            throw error;
        }
    }

    static async getUpcomingDeadlines(influencerId) {
        try {
            const now = new Date();
            const collaborations = await CampaignInfluencers.find({
                influencer_id: new mongoose.Types.ObjectId(influencerId),
                status: 'active',
                deadline: { $gt: now }
            })
                .populate('campaign_id', 'title')
                .populate({
                    path: 'campaign_id',
                    populate: {
                        path: 'brand_id',
                        model: 'BrandInfo',
                        select: 'brandName logoUrl'
                    }
                })
                .sort({ deadline: 1 })
                .limit(5)
                .lean();

            return collaborations.map(c => ({
                id: c._id,
                title: c.campaign_id?.title || '',
                deadline: c.deadline,
                brand_name: c.campaign_id?.brand_id?.brandName || '',
                brand_logo: c.campaign_id?.brand_id?.logoUrl || ''
            }));
        } catch (error) {
            console.error('Error in getUpcomingDeadlines:', error);
            return [];
        }
    }

    static async getPerformanceMetrics(influencerId) {
        try {
            const CampaignInfluencers = mongoose.model('CampaignInfluencers');
            const CampaignMetrics = mongoose.model('CampaignMetrics');
            const result = await CampaignInfluencers.aggregate([
                {
                    $match: {
                        influencer_id: new mongoose.Types.ObjectId(influencerId),
                        status: 'active'
                    }
                },
                {
                    $lookup: {
                        from: CampaignMetrics.collection.name,
                        localField: 'campaign_id',
                        foreignField: 'campaign_id',
                        as: 'metrics'
                    }
                },
                { $unwind: '$metrics' },
                {
                    $group: {
                        _id: null,
                        avg_engagement_rate: { $avg: '$metrics.engagement_rate' },
                        avg_reach: { $avg: '$metrics.reach' },
                        avg_conversion_rate: { $avg: '$metrics.conversion_rate' },
                        avg_timeliness: { $avg: '$metrics.timeliness_score' }
                    }
                }
            ]);



            if (!result[0]) {
                return {
                    engagementRate: 0,
                    reach: 0,
                    conversionRate: 0,
                    contentQuality: 0,
                    timeliness: 0
                };
            }

            return {
                engagementRate: result[0].avg_engagement_rate || 0,
                reach: result[0].avg_reach || 0,
                conversionRate: result[0].avg_conversion_rate || 0,
                contentQuality: result[0].avg_content_quality || 0,
                timeliness: result[0].avg_timeliness || 0
            };

        } catch (error) {
            console.error('Error in getPerformanceMetrics:', error);
            throw error;
        }
    }

    static async getEarningsBySource(influencerId) {
        try {
            const CampaignPayments = mongoose.model('CampaignPayments');
            const result = await CampaignPayments.aggregate([
                {
                    $match: {
                        influencer_id: new mongoose.Types.ObjectId(influencerId),
                        status: 'completed'
                    }
                },
                {
                    $lookup: {
                        from: 'campaigninfos',
                        localField: 'campaign_id',
                        foreignField: '_id',
                        as: 'campaign'
                    }
                },
                { $unwind: '$campaign' },
                {
                    $lookup: {
                        from: 'brandinfos',
                        localField: 'campaign.brand_id',
                        foreignField: '_id',
                        as: 'brand'
                    }
                },
                { $unwind: '$brand' },
                {
                    $group: {
                        _id: '$brand.brandName',
                        total_earnings: { $sum: '$amount' }
                    }
                },
                {
                    $sort: { total_earnings: -1 }
                }
            ]);

            return result.map(r => ({
                brand_name: r._id,
                total_earnings: r.total_earnings
            }));
        } catch (error) {
            console.error('Error in getEarningsBySource:', error);
            throw error;
        }
    }

    static async getCollaborationRequests(influencerId, { page = 1, limit = 20 } = {}) {
        try {
            const skip = (page - 1) * Math.min(limit, 100);
            const safeLimit = Math.min(limit, 100);

            const [requests, totalCount] = await Promise.all([
                CampaignInfluencers
                    .find({ influencer_id: new mongoose.Types.ObjectId(influencerId), status: 'request' })
                    // PROJECTION: only fields rendered on the requests card — avoids over-fetching deliverables[]
                    .select('campaign_id status createdAt')
                    .populate('campaign_id', 'title budget duration required_channels min_followers target_audience brand_id')
                    .populate({ path: 'campaign_id', populate: { path: 'brand_id', model: 'BrandInfo', select: 'brandName logoUrl' } })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(safeLimit)
                    .lean(),
                CampaignInfluencers.countDocuments({ influencer_id: new mongoose.Types.ObjectId(influencerId), status: 'request' })
            ]);

            const docs = requests.map(req => ({
                id: req._id,
                collab_title: req.campaign_id?.title || '',
                status: req.status,
                created_at: req.createdAt,
                brand_name: req.campaign_id?.brand_id?.brandName || '',
                brand_logo: req.campaign_id?.brand_id?.logoUrl || '',
                budget: req.campaign_id?.budget || 0,
                duration: req.campaign_id?.duration || 0,
                required_channels: req.campaign_id?.required_channels || [],
                min_followers: req.campaign_id?.min_followers || 0,
                target_audience: req.campaign_id?.target_audience || ''
            }));

            return { docs, totalCount, page, totalPages: Math.ceil(totalCount / safeLimit) };
        } catch (error) {
            console.error('Error in getCollaborationRequests:', error);
            throw error;
        }
    }

    async acceptRequest(requestId) {
        try {
            const request = await CampaignInfluencers.findById(requestId);
            if (!request) throw new Error('Request not found');

            request.status = 'active';
            await request.save();

            return { success: true, collaborationId: request._id };
        } catch (error) {
            console.error('Error in acceptRequest:', error);
            throw error;
        }
    }

    async declineRequest(requestId) {
        try {
            const request = await CampaignInfluencers.findById(requestId);
            if (!request) throw new Error('Request not found');

            request.status = 'declined';
            await request.save();

            return { success: true };
        } catch (error) {
            console.error('Error in declineRequest:', error);
            throw error;
        }
    }

    static async getCollaborationDetails(collabId) {
        try {
            // Find campaign directly from CampaignInfo
            const campaign = await CampaignInfo.findById(collabId)
                .populate('brand_id', 'brandName logoUrl')
                .lean();

            if (!campaign) {
                return null;
            }

            // Transform campaign data to match the expected format
            return {
                _id: campaign._id,
                title: campaign.title,
                description: campaign.description,
                status: campaign.status,
                start_date: campaign.start_date,
                end_date: campaign.end_date,
                duration: campaign.duration,
                budget: campaign.budget,
                target_audience: campaign.target_audience,
                required_channels: campaign.required_channels,
                min_followers: campaign.min_followers,
                objectives: campaign.objectives,
                brand_name: campaign.brand_id?.brandName || 'Unknown Brand',
                brand_logo: campaign.brand_id?.logoUrl || '/images/default-brand-logo.jpg',
                created_at: campaign.createdAt,
                updated_at: campaign.updatedAt
            };
        } catch (error) {
            console.error('Error in getCollaborationDetails:', error);
            throw error;
        }
    }

    /**
     * Update purely the campaign overall metrics based on all influencers
     * Does NOT update individual influencer/collab progress
     */
    static async updateCampaignMetrics(campaignId) {
        try {
            // High-Performance Embedding: Fetch influencers and their embedded totalFollowers snapshot
            const activeInfluencers = await CampaignInfluencers.find({
                campaign_id: campaignId,
                status: 'active'
            })
            .populate({ path: 'influencer_id', select: 'analytics_snapshot.totalFollowers', model: 'InfluencerInfo' })
            .lean();

            if (activeInfluencers.length === 0) return;

            let weightedSum = 0;
            let totalFollowers = 0;
            
            activeInfluencers.forEach(ai => {
                const followers = ai.influencer_id?.analytics_snapshot?.totalFollowers || 0;
                const prog = Math.max(0, Math.min(100, ai.progress || 0));
                weightedSum += prog * followers;
                totalFollowers += followers;
            });

            const overallProgress = totalFollowers > 0 
                ? Math.round((weightedSum / totalFollowers)) 
                : Math.round((activeInfluencers.reduce((s, ai) => s + (ai.progress || 0), 0) / Math.max(1, activeInfluencers.length)));

            // High-Performance Embedding: Sync progress directly into CampaignInfo
            await Promise.all([
                CampaignInfo.updateOne(
                    { _id: campaignId },
                    { $set: { 'metrics.overall_progress': overallProgress } }
                ),
                // Maintain legacy collection for backward compatibility
                CampaignMetrics.findOneAndUpdate(
                    { campaign_id: campaignId },
                    { $set: { overall_progress: overallProgress } },
                    { upsert: true }
                )
            ]);
        } catch (error) {
            console.error('Error in updateCampaignMetrics:', error);
        }
    }

    // Deprecated / Legacy wrapper to maintain backward compatibility if needed, 
    // but better to use specific methods.
    static async updateCollaborationProgress(collabId, progress) {
        try {
            // 1) Update influencer's own progress on CampaignInfluencers
            const collab = await CampaignInfluencers.findById(collabId);
            if (!collab) throw new Error('Collaboration not found');

            collab.progress = progress;
            await collab.save();

            // 2) Update campaign metrics
            await this.updateCampaignMetrics(collab.campaign_id);

            return { id: collabId, progress };
        } catch (error) {
            console.error('Error in updateCollaborationProgress:', error);
            throw error;
        }
    }

    static async getPendingRequests(influencerId) {
        try {
            const requests = await CampaignInfluencers.find({
                influencer_id: new mongoose.Types.ObjectId(influencerId),
                status: 'request'
            })
                .populate('campaign_id', 'title')
                .populate({
                    path: 'campaign_id',
                    populate: {
                        path: 'brand_id',
                        model: 'BrandInfo',
                        select: 'brandName logoUrl'
                    }
                })
                .sort({ createdAt: -1 })
                .lean();

            return requests.map(req => ({
                ...req,
                brand_name: req.campaign_id?.brand_id?.brandName || '',
                brand_logo: req.campaign_id?.brand_id?.logoUrl || ''
            }));
        } catch (error) {
            console.error('Error in getPendingRequests:', error);
            throw error;
        }
    }

    static async getBrandInvites(influencerId, { page = 1, limit = 20 } = {}) {
        try {
            const skip = (page - 1) * Math.min(limit, 100);
            const safeLimit = Math.min(limit, 100);

            const [invites, totalCount] = await Promise.all([
                CampaignInfluencers
                    .find({ influencer_id: new mongoose.Types.ObjectId(influencerId), status: 'brand-invite' })
                    // PROJECTION: only invite-card fields — avoids pulling deliverables[] array
                    .select('campaign_id status createdAt')
                    .populate('campaign_id', 'title description budget duration required_channels min_followers target_audience start_date end_date brand_id')
                    .populate({ path: 'campaign_id', populate: { path: 'brand_id', model: 'BrandInfo', select: 'brandName logoUrl industry location' } })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(safeLimit)
                    .lean(),
                CampaignInfluencers.countDocuments({ influencer_id: new mongoose.Types.ObjectId(influencerId), status: 'brand-invite' })
            ]);

            const docs = invites.map(invite => ({
                _id: invite._id,
                status: invite.status,
                createdAt: invite.createdAt,
                brand_name:          invite.campaign_id?.brand_id?.brandName || '',
                brand_logo:          invite.campaign_id?.brand_id?.logoUrl || '',
                brand_industry:      invite.campaign_id?.brand_id?.industry || '',
                brand_location:      invite.campaign_id?.brand_id?.location || '',
                campaign_title:      invite.campaign_id?.title || '',
                campaign_description:invite.campaign_id?.description || '',
                campaign_budget:     invite.campaign_id?.budget || 0,
                campaign_duration:   invite.campaign_id?.duration || 0,
                campaign_start_date: invite.campaign_id?.start_date || null,
                campaign_end_date:   invite.campaign_id?.end_date || null
            }));

            return { docs, totalCount, page, totalPages: Math.ceil(totalCount / safeLimit) };
        } catch (error) {
            console.error('Error in getBrandInvites:', error);
            throw error;
        }
    }

    static computeProgressFromDeliverables(deliverables) {
        if (!Array.isArray(deliverables) || deliverables.length === 0) return 0;

        const total = deliverables.length;
        // Count approved items as completed
        // Also count items with 'completed' status/flag if you use that
        const completed = deliverables.filter(d =>
            d.status === 'approved' || d.status === 'completed' || d.completed === true
        ).length;

        if (total === 0) return 0;
        return Math.round((completed / total) * 100);
    }

    static async getSentRequests(influencerId, { page = 1, limit = 20 } = {}) {
        try {
            const skip = (page - 1) * Math.min(limit, 100);
            const safeLimit = Math.min(limit, 100);

            // OPTIMISATION: removed 2-step pre-query (was: find all influencer-invite campaign IDs, then filter)
            // CampaignInfluencers.status already stores 'influencer-invite' so the pre-fetch is redundant.
            // The new {influencer_id, status} index makes this a single IXSCAN.
            const [sentRequests, totalCount] = await Promise.all([
                CampaignInfluencers
                    .find({ influencer_id: new mongoose.Types.ObjectId(influencerId), status: 'influencer-invite' })
                    // PROJECTION: omit deliverables[] and the heavy fields not shown on a request card
                    .select('campaign_id status createdAt')
                    .populate('campaign_id', 'title description budget duration required_channels min_followers target_audience start_date end_date status brand_id')
                    .populate({ path: 'campaign_id', populate: { path: 'brand_id', model: 'BrandInfo', select: 'brandName logoUrl industry location' } })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(safeLimit)
                    .lean(),
                CampaignInfluencers.countDocuments({ influencer_id: new mongoose.Types.ObjectId(influencerId), status: 'influencer-invite' })
            ]);

            const docs = sentRequests
                .filter(req => req.campaign_id)
                .map(req => ({
                    _id: req._id,
                    status: req.status,
                    createdAt: req.createdAt,
                    brand_name:          req.campaign_id?.brand_id?.brandName || '',
                    brand_logo:          req.campaign_id?.brand_id?.logoUrl || '',
                    brand_industry:      req.campaign_id?.brand_id?.industry || '',
                    brand_location:      req.campaign_id?.brand_id?.location || '',
                    campaign_title:      req.campaign_id?.title || '',
                    campaign_description:req.campaign_id?.description || '',
                    campaign_budget:     req.campaign_id?.budget || 0,
                    campaign_duration:   req.campaign_id?.duration || 0,
                    campaign_start_date: req.campaign_id?.start_date || null,
                    campaign_end_date:   req.campaign_id?.end_date || null,
                    required_channels:   req.campaign_id?.required_channels || []
                }));

            return { docs, totalCount, page, totalPages: Math.ceil(totalCount / safeLimit) };
        } catch (error) {
            console.error('Error in getSentRequests:', error);
            throw error;
        }
    }

    static async acceptPendingRequest(requestId) {
        try {
            const request = await CampaignInfluencers.findById(requestId);
            if (!request) throw new Error('Request not found');

            request.status = 'active';
            await request.save();

            return { success: true, collaborationId: request._id };
        } catch (error) {
            console.error('Error in acceptPendingRequest:', error);
            throw error;
        }
    }

    static async declinePendingRequest(requestId) {
        try {
            const request = await CampaignInfluencers.findById(requestId);
            if (!request) throw new Error('Request not found');

            request.status = 'cancelled';
            await request.save();

            return { success: true };
        } catch (error) {
            console.error('Error in declinePendingRequest:', error);
            throw error;
        }
    }

    // static async getSentRequests(influencerId) {
    //     try {
    //         const requests = await CampaignInfluencers.find({
    //             influencer_id: new mongoose.Types.ObjectId(influencerId)
    //         })
    //             .populate('campaign_id', 'title')
    //             .populate({
    //                 path: 'campaign_id',
    //                 populate: {
    //                     path: 'brand_id',
    //                     model: 'BrandInfo',
    //                     select: 'brandName logoUrl'
    //                 }
    //             })
    //             .sort({ createdAt: -1 })
    //             .lean();

    //         return requests.map(req => ({
    //             ...req,
    //             brand_name: req.campaign_id?.brand_id?.brandName || '',
    //             brand_logo: req.campaign_id?.brand_id?.logoUrl || ''
    //         }));
    //     } catch (error) {
    //         console.error('Error in getSentRequests:', error);
    //         throw error;
    //     }
    // }

    async cancelRequest(requestId) {
        try {
            const request = await CampaignInfluencers.findById(requestId);
            if (!request) return { success: false, message: 'Request not found' };

            if (request.status !== 'request') {
                return { success: false, message: 'Request already processed' };
            }

            request.status = 'cancelled';
            await request.save();

            return { success: true };
        } catch (error) {
            console.error('Error in cancelRequest:', error);
            return { success: false, message: 'Failed to cancel request' };
        }
    }
}

module.exports = CollaborationModel;