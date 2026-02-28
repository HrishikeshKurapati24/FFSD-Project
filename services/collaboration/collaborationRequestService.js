const { CampaignInfluencers, CampaignInfo } = require('../../models/CampaignMongo');
const { BrandInfo } = require('../../models/BrandMongo');
const mongoose = require('mongoose');

class collaborationRequestService {
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

    static async getRequestById(requestId) {
        try {
            const req = await CampaignInfluencers.findById(requestId)
                .populate('influencer_id', 'fullName channels followers engagement_rate')
                .populate('campaign_id', 'title required_channels min_followers target_audience age_group genders')
                .lean();

            if (!req) {
                return null;
            }

            return {
                collab_title: req.campaign_id?.title || '',
                influencer_name: req.influencer_id?.fullName || '',
                influencer_channels: req.influencer_id?.channels?.join(', ') || '',
                followers: req.influencer_id?.followers || 0,
                engagement_rate: req.influencer_id?.engagement_rate || 0,
                required_channels: req.campaign_id?.required_channels?.join(', ') || '',
                min_followers: req.campaign_id?.min_followers || 0,
                age_group: req.campaign_id?.age_group || '',
                genders: req.campaign_id?.genders || ''
            };
        } catch (error) {
            console.error('Error fetching collaboration request by id:', error);
            throw error;
        }
    }
}

module.exports = collaborationRequestService;
