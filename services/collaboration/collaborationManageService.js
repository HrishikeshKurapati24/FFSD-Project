const { CampaignInfluencers, CampaignInfo } = require('../../models/CampaignMongo');
const { InfluencerInfo } = require('../../models/InfluencerMongo');
const { BrandInfo } = require('../../models/BrandMongo');
const mongoose = require('mongoose');
const collaborationMetricsService = require('./collaborationMetricsService');

class collaborationManageService {
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

            const filteredCollaborations = collaborations.filter(collab =>
                collab.campaign_id && collab.campaign_id.status !== 'request'
            );

            console.log('Found collaborations:', collaborations.length);
            console.log('Filtered collaborations (excluding request status):', filteredCollaborations.length);

            const campaignIds = filteredCollaborations.map(collab => collab.campaign_id._id);

            const CampaignMetrics = mongoose.model('CampaignMetrics');
            const metrics = await CampaignMetrics.find({
                campaign_id: { $in: campaignIds }
            }).lean();

            console.log('Found metrics for campaigns:', metrics.length);

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
                    revenue: collab.revenue || 0,
                    commission_earned: collab.commission_earned || 0,
                    roi: campaignMetrics.roi || 0,
                    referralCode: collab.influencer_id?.referralCode || '',
                    deliverables: (collab.deliverables || []).map(d => ({
                        _id: d._id,
                        title: d.title,
                        description: d.description,
                        status: d.status,
                        deliverable_type: d.deliverable_type,
                        due_date: d.due_date,
                        content_url: d.content_url,
                        submitted_at: d.submitted_at,
                        reviewed_at: d.reviewed_at,
                        review_feedback: d.review_feedback
                    }))
                };
            });

            console.log('Formatted collaborations:', formattedCollaborations.length);
            return formattedCollaborations;
        } catch (error) {
            console.error('Error in getActiveCollaborations:', error);
            return [];
        }
    }

    static async getCollaborationDetails(collabId) {
        try {
            const campaign = await CampaignInfo.findById(collabId)
                .populate('brand_id', 'brandName logoUrl')
                .lean();

            if (!campaign) {
                return null;
            }

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
            const collab = await CampaignInfluencers.findById(collabId);
            if (!collab) throw new Error('Collaboration not found');

            collab.progress = progress;
            await collab.save();

            // Delegate to metrics service for campaign metadata
            await collaborationMetricsService.updateCampaignMetrics(collab.campaign_id);

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
            const { CampaignInfo } = require('../../models/CampaignMongo');

            // Get all campaigns with status 'influencer-invite'
            const requestCampaigns = await CampaignInfo.find({ status: 'influencer-invite' }).select('_id').lean();
            const requestCampaignIds = requestCampaigns.map(c => c._id);

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
}

module.exports = collaborationManageService;
