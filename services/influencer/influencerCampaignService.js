const { CampaignInfluencers, CampaignMetrics } = require('../../models/CampaignMongo');
const influencerProfileService = require('./influencerProfileService');
const collaborationManageService = require('../collaboration/collaborationManageService');
const notificationController = require('../../monolithic_files/notificationController');

class InfluencerCampaignService {
    static async getCampaignHistory(influencerId) {
        // Fetch completed campaigns with metrics and influencers
        const campaigns = await influencerProfileService.getCampaignHistory(influencerId);
        return campaigns.map(campaign => ({
            title: campaign.campaign_name,
            brand_id: campaign.brand_id,
            brand_name: campaign.brand_name,
            brand_logo: campaign.brand_logo,
            description: campaign.description,
            objectives: campaign.objectives,
            start_date: campaign.start_date,
            end_date: campaign.end_date,
            duration: campaign.duration || 0,
            budget: campaign.budget || 0,
            performance_score: campaign.performance_score || 0,
            engagement_rate: campaign.engagement_rate || 0,
            reach: campaign.reach || 0,
            clicks: campaign.clicks || 0,
            conversion_rate: campaign.conversion_rate || 0,
            impressions: campaign.impressions || 0,
            revenue: campaign.revenue || 0,
            roi: campaign.roi || 0,
            required_channels: campaign.required_channels || [],
            target_audience: campaign.target_audience || '',
            influencers: campaign.influencers || [],
            influencers_count: (campaign.influencers || []).length,
            status: campaign.status || 'completed'
        }));
    }

    static async updateCollaborationProgressAndMetrics(collabId, influencerId, updates) {
        const { progress, reach, clicks, performance_score, conversions, engagement_rate, conversion_rate, impressions, revenue, roi, deliverablesChecklist } = updates;

        // Compute progress
        let progressValue;
        if (deliverablesChecklist) {
            try {
                const checklist = Array.isArray(deliverablesChecklist) ? deliverablesChecklist : JSON.parse(deliverablesChecklist);
                const total = checklist.length;
                const completed = checklist.filter(d => d.completed).length;
                progressValue = total > 0 ? Math.round((completed / total) * 100) : 0;
            } catch (e) {
                // Ignore parse errors
            }
        }

        if (progressValue === undefined) {
            if (progress === undefined) {
                throw new Error('Progress is required');
            }
            progressValue = parseInt(progress);
        }

        if (isNaN(progressValue) || progressValue < 0 || progressValue > 100) {
            throw new Error('Invalid progress value');
        }

        const collab = await CampaignInfluencers.findById(collabId).populate({ path: 'campaign_id', select: 'brand_id' });
        if (!collab) throw new Error('Collaboration not found');

        // Update progress in CampaignInfluencers
        await collaborationManageService.updateCollaborationProgress(collabId, progressValue);

        // Update metrics in CampaignMetrics
        if (reach !== undefined || clicks !== undefined || performance_score !== undefined || conversions !== undefined || engagement_rate !== undefined || conversion_rate !== undefined || impressions !== undefined || revenue !== undefined || roi !== undefined) {
            let metrics = await CampaignMetrics.findOne({ campaign_id: collab.campaign_id?._id || collab.campaign_id });

            if (!metrics) {
                metrics = new CampaignMetrics({
                    campaign_id: collab.campaign_id?._id || collab.campaign_id,
                    brand_id: collab.campaign_id?.brand_id,
                    performance_score: performance_score || 0,
                    engagement_rate: engagement_rate || 0,
                    reach: reach || 0,
                    conversion_rate: conversion_rate || 0,
                    clicks: clicks || 0,
                    conversions: conversions || 0,
                    impressions: impressions || 0,
                    revenue: revenue || 0,
                    roi: roi || 0
                });
            } else {
                if (reach !== undefined) metrics.reach = parseInt(reach) || 0;
                if (clicks !== undefined) metrics.clicks = parseInt(clicks) || 0;
                if (performance_score !== undefined) metrics.performance_score = parseFloat(performance_score) || 0;
                if (conversions !== undefined) metrics.conversions = parseInt(conversions) || 0;
                if (engagement_rate !== undefined) metrics.engagement_rate = parseFloat(engagement_rate) || 0;
                if (conversion_rate !== undefined) metrics.conversion_rate = parseFloat(conversion_rate) || 0;
                if (impressions !== undefined) metrics.impressions = parseInt(impressions) || 0;
                if (revenue !== undefined) metrics.revenue = parseFloat(revenue) || 0;
                if (roi !== undefined) metrics.roi = parseFloat(roi) || 0;
            }
            await metrics.save();
        }

        // Notify Brand
        try {
            const brandId = collab.campaign_id?.brand_id || (collab.campaign_id?._id ? collab.campaign_id._id : null);
            if (brandId) {
                const influencerInfo = await influencerProfileService.getInfluencerById(influencerId);
                await notificationController.createNotification({
                    recipientId: brandId,
                    recipientType: 'brand',
                    senderId: influencerId,
                    senderType: 'influencer',
                    type: 'progress_updated',
                    title: 'Campaign Progress Updated',
                    body: `${influencerInfo?.displayName || influencerInfo?.name || 'An influencer'} updated progress to ${progressValue}% for a campaign.`,
                    relatedId: collabId,
                    data: { collabId, progress: progressValue }
                });
            }
        } catch (notifErr) {
            console.error('Error creating progress notification:', notifErr);
        }

        return progressValue;
    }

    static async getCollaborationDetailsData(collabId) {
        const collab = await CampaignInfluencers.findById(collabId)
            .populate({ path: 'campaign_id', select: 'title description budget duration brand_id', populate: { path: 'brand_id', select: 'brandName logoUrl' } })
            .populate('influencer_id', 'name');

        if (!collab) throw new Error('Collaboration not found');

        const metrics = await CampaignMetrics.findOne({ campaign_id: collab.campaign_id?._id || collab.campaign_id });

        const startDate = collab.start_date ? new Date(collab.start_date) : new Date();
        const endDate = collab.end_date ? new Date(collab.end_date) : new Date(startDate.getTime() + (collab.duration * 24 * 60 * 60 * 1000));
        const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

        return {
            id: collab._id,
            campaign_name: collab.campaign_id?.title || 'Untitled Campaign',
            brand_name: collab.campaign_id?.brand_id?.brandName || collab.brand_id?.brandName || 'Unknown Brand',
            brand_logo: collab.campaign_id?.brand_id?.logoUrl || collab.brand_id?.logoUrl || '/images/default-brand.png',
            progress: collab.progress || 0,
            duration: duration,
            budget: collab.campaign_id?.budget || 0,
            engagement_rate: metrics?.engagement_rate || collab.engagement_rate || 0,
            description: collab.campaign_id?.description || 'No description available',
            start_date: startDate,
            end_date: endDate,
            deliverables: collab.deliverables || [],
            performance_score: metrics?.performance_score || collab.performance_score || 0,
            reach: metrics?.reach || collab.reach || 0,
            clicks: metrics?.clicks || collab.clicks || 0,
            conversions: metrics?.conversions || collab.conversions || 0,
            conversion_rate: metrics?.conversion_rate || 0,
            impressions: metrics?.impressions || 0,
            revenue: metrics?.revenue || 0,
            roi: metrics?.roi || 0,
            status: collab.status || 'active'
        };
    }
}

module.exports = InfluencerCampaignService;
