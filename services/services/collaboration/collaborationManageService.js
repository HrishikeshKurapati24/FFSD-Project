const { CampaignInfluencers, CampaignInfo } = require('../../models/CampaignMongo');
const { InfluencerInfo } = require('../../models/InfluencerMongo');
const { BrandInfo } = require('../../models/BrandMongo');
const mongoose = require('mongoose');
const collaborationMetricsService = require('./collaborationMetricsService');

// Delegate to the canonical optimised CollaborationModel — avoids duplicate hot-path logic
const CollaborationModel = require('../CollaborationModel');

class collaborationManageService {
    /**
     * Returns active collaborations for the influencer as a flat array.
     * Internally uses the single-aggregation pipeline from CollaborationModel (fixes B9).
     */
    static async getActiveCollaborations(influencerId) {
        try {
            if (!influencerId) return [];
            return await CollaborationModel.getActiveCollaborations(influencerId);
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
            // PROJECTION: .select() avoids pulling deliverables[] and other heavy fields
            const requests = await CampaignInfluencers.find({
                influencer_id: new mongoose.Types.ObjectId(influencerId),
                status: 'request'
            })
                .select('campaign_id status createdAt')
                .populate('campaign_id', 'title brand_id')
                .populate({
                    path: 'campaign_id',
                    populate: { path: 'brand_id', model: 'BrandInfo', select: 'brandName logoUrl' }
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

    /**
     * Returns brand invites as a flat array for dashboard use.
     * Delegates to CollaborationModel (uses {influencer_id,status} index + projection).
     * Large limit avoids pagination for the dashboard card.
     */
    static async getBrandInvites(influencerId) {
        try {
            const result = await CollaborationModel.getBrandInvites(influencerId, { page: 1, limit: 200 });
            return result.docs;
        } catch (error) {
            console.error('Error in getBrandInvites:', error);
            throw error;
        }
    }

    /**
     * Returns sent requests as a flat array for dashboard use.
     * Delegates to CollaborationModel which eliminates the wasteful CampaignInfo
     * pre-scan (full collection scan) that the old implementation used.
     */
    static async getSentRequests(influencerId) {
        try {
            const result = await CollaborationModel.getSentRequests(influencerId, { page: 1, limit: 200 });
            return result.docs;
        } catch (error) {
            console.error('Error in getSentRequests:', error);
            throw error;
        }
    }
}

module.exports = collaborationManageService;
