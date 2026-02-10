const { CampaignInfluencers, CampaignInfo } = require('../config/CampaignMongo');
const { InfluencerInfo } = require('../config/InfluencerMongo');
const { BrandInfo } = require('../config/BrandMongo');
const mongoose = require('mongoose');
const CampaignMetrics = mongoose.model('CampaignMetrics');

class CollaborationModel {
    static async getActiveCollaborations(influencerId) {
        try {
            console.log('Getting active collaborations for influencer:', influencerId);

            if (!influencerId) {
                console.error('No influencer ID provided');
                return [];
            }

            const collaborations = await CampaignInfluencers.find({
                influencer_id: new mongoose.Types.ObjectId(influencerId),
                status: 'active'
            })
                .populate('campaign_id', 'title budget duration required_channels min_followers target_audience status')
                .populate('influencer_id', 'fullName profilePicUrl referralCode')
                .populate({
                    path: 'campaign_id',
                    populate: {
                        path: 'brand_id',
                        model: 'BrandInfo',
                        select: 'brandName logoUrl'
                    }
                })
                .lean();

            // Filter out collaborations where the campaign still has status 'request'
            const filteredCollaborations = collaborations.filter(collab =>
                collab.campaign_id && collab.campaign_id.status !== 'request'
            );

            console.log('Found collaborations:', collaborations.length);
            console.log('Filtered collaborations (excluding request status):', filteredCollaborations.length);

            // Get campaign IDs for metrics lookup
            const campaignIds = filteredCollaborations.map(collab => collab.campaign_id._id);

            // Get metrics for all campaigns
            const metrics = await CampaignMetrics.find({
                campaign_id: { $in: campaignIds }
            }).lean();

            console.log('Found metrics for campaigns:', metrics.length);

            // Create a map for quick lookup
            const metricsMap = new Map();
            metrics.forEach(metric => {
                metricsMap.set(metric.campaign_id.toString(), metric);
            });

            const formattedCollaborations = filteredCollaborations.map(collab => {
                const campaignMetrics = metricsMap.get(collab.campaign_id._id.toString()) || {};
                return {
                    id: collab._id,
                    campaign_id: collab.campaign_id._id,
                    campaign_name: collab.campaign_id?.title || '',
                    brand_name: collab.campaign_id?.brand_id?.brandName || '',
                    brand_logo: collab.campaign_id?.brand_id?.logoUrl || '',
                    progress: collab.progress || 0,
                    duration: collab.campaign_id?.duration || 0,
                    budget: collab.campaign_id?.budget || 0,
                    engagement_rate: campaignMetrics.engagement_rate || 0,
                    reach: campaignMetrics.reach || 0,
                    clicks: campaignMetrics.clicks || 0,
                    conversions: campaignMetrics.conversion_rate || 0,
                    timeliness_score: collab.timeliness_score || 0,
                    performance_score: campaignMetrics.performance_score || 0,
                    impressions: campaignMetrics.impressions || 0,
                    revenue: collab.revenue || 0, // specific to influencer
                    commission_earned: collab.commission_earned || 0, // specific to influencer
                    roi: campaignMetrics.roi || 0,
                    referralCode: collab.influencer_id?.referralCode || '' // Added for shop URL generation
                };
            });

            console.log('Formatted collaborations:', formattedCollaborations.length);
            return formattedCollaborations;
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
            const yearMonth = now.toISOString().slice(0, 7); // YYYY-MM

            const result = await CampaignPayments.aggregate([
                {
                    $match: {
                        influencer_id: new mongoose.Types.ObjectId(influencerId),
                        status: 'completed',
                        payment_date: {
                            $gte: new Date(yearMonth + '-01'),
                            $lt: new Date(yearMonth + '-31')
                        }
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
            const currentYearMonth = now.toISOString().slice(0, 7);
            const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const previousYearMonth = previousMonthDate.toISOString().slice(0, 7);

            const result = await CampaignPayments.aggregate([
                {
                    $match: {
                        influencer_id: new mongoose.Types.ObjectId(influencerId),
                        status: 'completed',
                        payment_date: {
                            $gte: new Date(previousYearMonth + '-01'),
                            $lt: new Date(currentYearMonth + '-01')
                        }
                    }
                },
                {
                    $group: {
                        _id: '$payment_date',
                        amount: { $sum: '$amount' }
                    }
                }
            ]);

            let currentMonthTotal = 0;
            let previousMonthTotal = 0;
            result.forEach(doc => {
                const month = doc._id.toISOString().slice(0, 7);
                if (month === currentYearMonth) currentMonthTotal += doc.amount;
                else if (month === previousYearMonth) previousMonthTotal += doc.amount;
            });

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
            const CampaignMetrics = mongoose.model('CampaignMetrics');
            const result = await CampaignMetrics.aggregate([
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
                    $match: {
                        'campaign.influencer_id': new mongoose.Types.ObjectId(influencerId)
                    }
                },
                {
                    $group: {
                        _id: null,
                        avg_engagement_rate: { $avg: '$engagement_rate' },
                        avg_reach: { $avg: '$reach' },
                        avg_conversion_rate: { $avg: '$conversion_rate' },
                        avg_timeliness: { $avg: '$timeliness_score' }
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

    static async getCollaborationRequests(influencerId) {
        try {
            const requests = await CampaignInfluencers.find({
                influencer_id: new mongoose.Types.ObjectId(influencerId),
                status: 'request'
            })
                .populate('campaign_id', 'title budget duration required_channels min_followers target_audience')
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

    static async updateCollaborationProgress(collabId, progress) {
        try {
            // 1) Update influencer's own progress on CampaignInfluencers
            const collab = await CampaignInfluencers.findById(collabId).populate('campaign_id').lean(false);
            if (!collab) throw new Error('Collaboration not found');

            collab.progress = progress;
            await collab.save();

            // 2) Recompute overall campaign progress (weighted by influencer followers)
            const campaignId = collab.campaign_id;

            // Get active influencers on this campaign with their progress and follower counts
            const activeInfluencers = await CampaignInfluencers.find({
                campaign_id: campaignId,
                status: 'active'
            })
                .populate({ path: 'influencer_id', select: 'totalFollowers', model: 'InfluencerAnalytics', options: { lean: true } })
                .lean();

            // Fallback if above populate path doesn't resolve, fetch followers via InfluencerAnalytics collection
            const influencerIds = activeInfluencers.map(ai => ai.influencer_id?._id || ai.influencer_id);
            const InfluencerAnalytics = mongoose.model('InfluencerAnalytics');
            const analytics = await InfluencerAnalytics.find({ influencerId: { $in: influencerIds } })
                .select('influencerId totalFollowers')
                .lean();
            const followersMap = new Map(analytics.map(a => [a.influencerId.toString(), a.totalFollowers || 0]));

            let weightedSum = 0;
            let totalFollowers = 0;
            activeInfluencers.forEach(ai => {
                const infId = (ai.influencer_id?._id || ai.influencer_id || '').toString();
                const followers = followersMap.get(infId) || 0;
                const prog = Math.max(0, Math.min(100, ai.progress || 0));
                weightedSum += prog * followers;
                totalFollowers += followers;
            });

            const overallProgress = totalFollowers > 0 ? Math.round((weightedSum / totalFollowers)) : Math.round((activeInfluencers.reduce((s, ai) => s + (ai.progress || 0), 0) / Math.max(1, activeInfluencers.length)));

            // 3) Upsert overall progress into CampaignMetrics
            await CampaignMetrics.findOneAndUpdate(
                { campaign_id: campaignId, brand_id: collab.campaign_id?.brand_id || collab.brand_id },
                { $set: { overall_progress: overallProgress } },
                { upsert: true, new: true }
            );

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

    static async getBrandInvites(influencerId) {
        try {
            const invites = await CampaignInfluencers.find({
                influencer_id: new mongoose.Types.ObjectId(influencerId),
                status: 'brand-invite'
            })
                .populate('campaign_id', 'title description budget duration required_channels min_followers target_audience start_date end_date brand_id')
                .populate({
                    path: 'campaign_id',
                    populate: {
                        path: 'brand_id',
                        model: 'BrandInfo',
                        select: 'brandName logoUrl industry location'
                    }
                })
                .sort({ createdAt: -1 })
                .lean();

            return invites.map(invite => ({
                ...invite,
                brand_name: invite.campaign_id?.brand_id?.brandName || '',
                brand_logo: invite.campaign_id?.brand_id?.logoUrl || '',
                brand_industry: invite.campaign_id?.brand_id?.industry || '',
                brand_location: invite.campaign_id?.brand_id?.location || '',
                campaign_title: invite.campaign_id?.title || '',
                campaign_description: invite.campaign_id?.description || '',
                campaign_budget: invite.campaign_id?.budget || 0,
                campaign_duration: invite.campaign_id?.duration || 0,
                campaign_start_date: invite.campaign_id?.start_date || null,
                campaign_end_date: invite.campaign_id?.end_date || null
            }));
        } catch (error) {
            console.error('Error in getBrandInvites:', error);
            throw error;
        }
    }

    static async getSentRequests(influencerId) {
        try {
            // First, get all campaigns with status 'influencer-invite'
            const requestCampaigns = await CampaignInfo.find({ status: 'influencer-invite' }).select('_id').lean();
            const requestCampaignIds = requestCampaigns.map(c => c._id);

            // Then, find influencer requests for these campaigns
            const sentRequests = await CampaignInfluencers.find({
                influencer_id: new mongoose.Types.ObjectId(influencerId),
                status: 'influencer-invite',
                campaign_id: { $in: requestCampaignIds }
            })
                .populate('campaign_id', 'title description budget duration required_channels min_followers target_audience start_date end_date status brand_id')
                .populate({
                    path: 'campaign_id',
                    populate: {
                        path: 'brand_id',
                        model: 'BrandInfo',
                        select: 'brandName logoUrl industry location'
                    }
                })
                .sort({ createdAt: -1 })
                .lean();

            // Filter out any requests where campaign is null
            return sentRequests
                .filter(req => req.campaign_id)
                .map(request => ({
                    ...request,
                    brand_name: request.campaign_id?.brand_id?.brandName || '',
                    brand_logo: request.campaign_id?.brand_id?.logoUrl || '',
                    brand_industry: request.campaign_id?.brand_id?.industry || '',
                    brand_location: request.campaign_id?.brand_id?.location || '',
                    campaign_title: request.campaign_id?.title || '',
                    campaign_description: request.campaign_id?.description || '',
                    campaign_budget: request.campaign_id?.budget || 0,
                    campaign_duration: request.campaign_id?.duration || 0,
                    campaign_start_date: request.campaign_id?.start_date || null,
                    campaign_end_date: request.campaign_id?.end_date || null,
                    required_channels: request.campaign_id?.required_channels || []
                }));
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