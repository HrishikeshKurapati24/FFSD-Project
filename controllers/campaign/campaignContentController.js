const campaignContentService = require('../../services/campaign/campaignContentService');

class CampaignContentController {
    // ========== INFLUENCER FUNCTIONS ==========
    static async createContentFromForm(req, res) {
        try {
            const influencerId = req.session.user.id;
            const content = await campaignContentService.createContentFromFormData(influencerId, req.body, req.files);
            res.json({ success: true, message: 'Content submitted for review successfully', content });
        } catch (error) {
            console.error('Error creating content:', error);
            res.status(error.message.includes('required') ? 400 : (error.message.includes('not found') ? 404 : 500)).json({
                success: false, message: 'Failed to create content', error: error.message
            });
        }
    }

    // ========== BRAND FUNCTIONS ==========
    static async createCampaignProducts(req, res) {
        try {
            const brandId = req.session.user.id;
            const products = await campaignContentService.createCampaignProductsData(req.params.campaignId, brandId, req.body.products);
            res.status(201).json({ success: true, message: 'Products created successfully', products });
        } catch (error) {
            console.error('Error creating campaign products:', error);
            res.status(error.message.includes('not found') ? 404 : 500).json({
                success: false, message: 'Error creating products', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    static async getCampaignProducts(req, res) {
        try {
            const products = await campaignContentService.getCampaignProductsData(req.params.campaignId, req.session.user.id);
            res.json({ success: true, products });
        } catch (error) {
            console.error('Error fetching campaign products:', error);
            res.status(500).json({ success: false, message: 'Error fetching products', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
        }
    }

    static async reviewContent(req, res) {
        try {
            const { action, feedback } = req.body;
            const content = await campaignContentService.reviewContentData(req.params.contentId, req.session.user.id, action, feedback);
            res.json({ success: true, message: `Content ${action}d successfully`, content });
        } catch (error) {
            console.error('Error reviewing content:', error);
            if (error.message.includes('not found')) return res.status(404).json({ success: false, message: error.message });
            if (error.message.includes('denied') || error.message.includes('Invalid action')) return res.status(400).json({ success: false, message: error.message });
            res.status(500).json({ success: false, message: 'Error reviewing content', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
        }
    }

    static async getCampaignPendingContentForBrand(req, res) {
        try {
            const result = await campaignContentService.getCampaignPendingContentForBrandData(req.params.campaignId, req.session.user.id);
            res.json({ success: true, ...result });
        } catch (error) {
            console.error('Error fetching campaign content:', error);
            res.status(error.message.includes('not found') ? 404 : 500).json({
                success: false, message: 'Error fetching campaign content', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    static async getPendingContent(req, res) {
        try {
            const content = await campaignContentService.getPendingContentData(req.session.user.id);
            res.json({ success: true, content });
        } catch (error) {
            console.error('Error fetching pending content:', error);
            res.status(500).json({ success: false, message: 'Error fetching pending content', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
        }
    }

    // ========== INFLUENCER FUNCTIONS ==========
    static async getApprovedContent(req, res) {
        try {
            const content = await campaignContentService.getApprovedContentData(req.session.user.id);
            res.json({ success: true, content });
        } catch (error) {
            console.error('Error fetching approved content:', error);
            res.status(500).json({ success: false, message: 'Error fetching approved content', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
        }
    }

    static async updateContentStatus(req, res) {
        try {
            const { status, externalPostUrl } = req.body;
            const content = await campaignContentService.updateContentStatusData(req.params.contentId, req.session.user.id, status, externalPostUrl);
            res.json({ success: true, message: 'Content status updated successfully', content });
        } catch (error) {
            console.error('Error updating content status:', error);
            if (error.message.includes('not found')) return res.status(404).json({ success: false, message: error.message });
            if (error.message.includes('approved') || error.message.includes('required')) return res.status(400).json({ success: false, message: error.message });
            res.status(500).json({ success: false, message: 'Error updating content status', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
        }
    }

    static async publishContent(req, res) {
        try {
            const content = await campaignContentService.publishContentData(req.params.contentId, req.session.user.id, req.body.externalPostUrl);
            res.json({ success: true, message: 'Content published successfully', content });
        } catch (error) {
            console.error('Error publishing content:', error);
            if (error.message.includes('not found')) return res.status(404).json({ success: false, message: error.message });
            if (error.message.includes('approved')) return res.status(400).json({ success: false, message: error.message });
            res.status(500).json({ success: false, message: 'Error publishing content', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
        }
    }

    // ========== CUSTOMER FUNCTIONS ==========
    static async getPublishedContent(req, res) {
        try {
            const { page = 1, limit = 20 } = req.query;
            const result = await campaignContentService.getPublishedContentData(req.params.campaignId, page, limit);
            res.json({ success: true, ...result });
        } catch (error) {
            console.error('Error fetching published content:', error);
            res.status(500).json({ success: false, message: 'Error fetching content', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
        }
    }

    static async getFeaturedContent(req, res) {
        try {
            const content = await campaignContentService.getFeaturedContentData(req.query.limit || 10);
            res.json({ success: true, content });
        } catch (error) {
            console.error('Error fetching featured content:', error);
            res.status(500).json({ success: false, message: 'Error fetching featured content', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
        }
    }

    static async trackInteraction(req, res) {
        try {
            const sessionInfo = {
                sessionId: req.sessionID || req.headers['x-session-id'] || 'anonymous',
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                referrer: req.headers.referer
            };
            await campaignContentService.trackInteractionData(req.params.contentId, req.body.actionType, req.body.productId, req.body.metadata, sessionInfo);
            res.json({ success: true, message: 'Interaction tracked successfully' });
        } catch (error) {
            console.error('Error tracking interaction:', error);
            if (error.message === 'Content not found') return res.status(404).json({ success: false, message: error.message });
            res.status(500).json({ success: false, message: 'Error tracking interaction', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
        }
    }
}

module.exports = CampaignContentController;