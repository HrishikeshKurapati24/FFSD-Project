const mongoose = require('mongoose');
const { Product, CampaignContent, ContentTracking } = require('../../models/ProductMongo');
const { CampaignInfo, CampaignInfluencers } = require('../../models/CampaignMongo');
const { BrandInfo } = require('../../models/BrandMongo');
const { InfluencerInfo } = require('../../models/InfluencerMongo');
const { uploadToCloudinary } = require('../../utils/cloudinary');
const notificationController = require('../../monolithic_files/notificationController');
const CollaborationModel = require('../CollaborationModel');

class CampaignContentService {

    // ========== INFLUENCER FUNCTIONS ==========
    static async createContentFromFormData(influencerId, bodyData, mediaFiles) {
        const { campaignId, content_type, platforms, description, campaign_product, special_instructions, publish_date, deliverable_id, deliverable_title } = bodyData;

        if (!campaignId || !content_type || !platforms || !description || !campaign_product) {
            throw new Error('Missing required fields');
        }

        if (!mediaFiles || mediaFiles.length === 0) {
            throw new Error('Media files are required');
        }

        const campaign = await CampaignInfo.findOne({ _id: campaignId, status: { $in: ['active'] } });
        if (!campaign) throw new Error('Campaign not found or not active');

        const product = await Product.findOne({ _id: campaign_product, campaign_id: campaignId, status: 'active' });
        if (!product) throw new Error('Product not found or not available for this campaign');

        const media_urls = [];
        for (const file of mediaFiles) {
            const mediaUrl = await uploadToCloudinary(file, `content/${campaignId}`);
            const mediaType = file.mimetype.startsWith('video/') ? 'video' : 'image';
            media_urls.push({ url: mediaUrl, type: mediaType, original_name: file.originalname });
        }

        let deliverableData = {};
        if (deliverable_id) {
            const collab = await CampaignInfluencers.findOne({ campaign_id: campaignId, influencer_id: influencerId, 'deliverables._id': deliverable_id });
            if (collab) deliverableData = { deliverable_id, deliverable_title: deliverable_title || 'Deliverable' };
        }

        const content = new CampaignContent({
            campaign_id: campaignId,
            influencer_id: influencerId,
            ...deliverableData,
            caption: description,
            media_urls: media_urls,
            attached_products: [{ product_id: campaign_product }],
            special_instructions: special_instructions || '',
            scheduled_at: publish_date ? new Date(publish_date) : null,
            status: 'submitted',
            created_at: new Date(),
            updated_at: new Date()
        });

        await content.save();

        if (deliverable_id) {
            try {
                const collab = await CampaignInfluencers.findOne({ campaign_id: campaignId, influencer_id: influencerId, 'deliverables._id': deliverable_id });
                if (collab) {
                    const deliverable = collab.deliverables.id(deliverable_id);
                    if (deliverable && deliverable.status === 'pending') {
                        deliverable.status = 'submitted';
                        deliverable.submitted_at = new Date();
                        deliverable.content_url = (media_urls.length > 0) ? media_urls[0].url : `Content ID: ${content._id}`;
                        deliverable.deliverable_type = content_type || 'Other';
                        await collab.save();
                    }
                }
            } catch (deliverableErr) {
                await CampaignContent.findByIdAndDelete(content._id);
                throw new Error('Failed to update deliverable status. Content submission cancelled.');
            }
        }
        return content;
    }

    // ========== BRAND FUNCTIONS ==========
    static async createCampaignProductsData(campaignId, brandId, productsData) {
        const campaign = await CampaignInfo.findOne({ _id: campaignId, brand_id: brandId });
        if (!campaign) throw new Error('Campaign not found or access denied');

        const createdProducts = [];
        for (const productData of productsData) {
            const discountPercentage = productData.original_price > 0
                ? Math.round(((productData.original_price - productData.campaign_price) / productData.original_price) * 100)
                : 0;

            const product = new Product({
                ...productData,
                brand_id: brandId,
                campaign_id: campaignId,
                discount_percentage: discountPercentage,
                created_by: brandId
            });

            await product.save();
            createdProducts.push(product);
        }
        return createdProducts;
    }

    static async getCampaignProductsData(campaignId, brandId) {
        return await Product.find({ campaign_id: campaignId, brand_id: brandId, status: { $ne: 'discontinued' } })
            .populate('campaign_id', 'title status');
    }

    static async reviewContentData(contentId, brandId, action, feedback) {
        const content = await CampaignContent.findById(contentId).populate('campaign_id', 'brand_id');
        if (!content) throw new Error('Content not found');
        if (content.campaign_id.brand_id.toString() !== brandId) throw new Error('Access denied');

        if (action === 'approve') {
            content.status = 'approved';
            content.review_notes = feedback || 'Content approved';
        } else if (action === 'reject') {
            content.status = 'rejected';
            content.review_notes = feedback || 'Content rejected';
        } else {
            throw new Error('Invalid action. Use "approve" or "reject"');
        }

        content.brand_feedback = feedback;
        await content.save();

        if (content.deliverable_id) {
            try {
                const collab = await CampaignInfluencers.findOne({ campaign_id: content.campaign_id._id, 'deliverables._id': content.deliverable_id });
                if (collab) {
                    const deliverable = collab.deliverables.id(content.deliverable_id);
                    if (deliverable) {
                        deliverable.status = action === 'approve' ? 'approved' : 'rejected';
                        deliverable.review_feedback = feedback;
                        deliverable.reviewed_at = new Date();

                        const approved = collab.deliverables.filter(d => d.status === 'approved').length;
                        collab.progress = Math.round((approved / collab.deliverables.length) * 100);
                        await collab.save();

                        CollaborationModel.updateCampaignMetrics(content.campaign_id._id).catch(() => { });
                    }
                }
            } catch (err) { }
        }

        try {
            await notificationController.createNotification({
                recipientId: content.influencer_id,
                recipientType: 'influencer',
                senderId: new mongoose.Types.ObjectId(brandId),
                senderType: 'brand',
                type: action === 'approve' ? 'content_approved' : 'content_rejected',
                title: `Content ${action === 'approve' ? 'Approved' : 'Rejected'}`,
                body: `Your content ${content.deliverable_title ? `for "${content.deliverable_title}"` : ''} has been ${action}d. ${feedback || ''}`,
                relatedId: content._id
            });
        } catch (notifErr) { }

        return content;
    }

    static async getCampaignPendingContentForBrandData(campaignId, brandId) {
        const campaign = await CampaignInfo.findOne({ _id: campaignId, brand_id: brandId });
        if (!campaign) throw new Error('Campaign not found or access denied');

        const submittedContent = await CampaignContent.find({ campaign_id: campaignId, status: 'submitted' })
            .populate('influencer_id', 'fullName profilePicUrl').populate('attached_products.product_id', 'name campaign_price images')
            .sort({ createdAt: -1 });

        const approvedContent = await CampaignContent.find({ campaign_id: campaignId, status: 'approved' })
            .populate('influencer_id', 'fullName profilePicUrl').populate('attached_products.product_id', 'name campaign_price images')
            .sort({ createdAt: -1 });

        return { submittedContent, approvedContent, totalPending: submittedContent.length + approvedContent.length };
    }

    static async getPendingContentData(brandId) {
        const campaigns = await CampaignInfo.find({ brand_id: brandId }).select('_id');
        return await CampaignContent.find({ status: 'submitted', campaign_id: { $in: campaigns } })
            .populate('campaign_id', 'title brand_id')
            .populate('influencer_id', 'fullName profilePicUrl')
            .sort({ createdAt: -1 });
    }

    static async getApprovedContentData(influencerId) {
        const approvedContent = await CampaignContent.find({
            influencer_id: influencerId,
            status: { $in: ['approved', 'submitted'] }
        }).populate({ path: 'campaign_id', select: 'title brand_id', populate: { path: 'brand_id', select: 'brandName' } })
            .sort({ createdAt: -1 });

        return approvedContent.map(item => ({
            ...item.toObject(),
            brandName: item.campaign_id?.brand_id?.brandName || null,
            campaignTitle: item.campaign_id?.title || null,
            caption: item.caption
        }));
    }

    static async updateContentStatusData(contentId, influencerId, status, externalPostUrl) {
        const content = await CampaignContent.findOne({ _id: contentId, influencer_id: influencerId }).populate('campaign_id', 'title brand_id');
        if (!content) throw new Error('Content not found or access denied');

        if (status === 'published' && content.status !== 'approved') {
            let allowable = false;
            if (content.deliverable_id) {
                const collab = await CampaignInfluencers.findOne({ campaign_id: content.campaign_id._id, 'deliverables._id': content.deliverable_id });
                const deliverable = collab ? collab.deliverables.id(content.deliverable_id) : null;
                if (deliverable && (deliverable.status === 'approved' || deliverable.status === 'published')) allowable = true;
            }
            if (!allowable) throw new Error('Only approved content can be published');
        }

        if (status === 'published' && !externalPostUrl) throw new Error('External post URL is required when publishing content');

        content.status = status;
        content.published_at = new Date();
        if (externalPostUrl) content.external_post_url = externalPostUrl;
        await content.save();

        if (status === 'published' && content.deliverable_id && externalPostUrl) {
            try {
                const collab = await CampaignInfluencers.findOne({ campaign_id: content.campaign_id._id, 'deliverables._id': content.deliverable_id });
                if (collab) {
                    const deliverable = collab.deliverables.id(content.deliverable_id);
                    if (deliverable) {
                        deliverable.content_url = externalPostUrl;
                        deliverable.status = 'published';
                        await collab.save();
                    }
                }
            } catch (err) { }

            try {
                await notificationController.createNotification({
                    recipientId: content.campaign_id.brand_id,
                    recipientType: 'brand',
                    senderId: new mongoose.Types.ObjectId(influencerId),
                    senderType: 'influencer',
                    type: 'content_published',
                    title: 'Content Published',
                    body: `Content ${content.deliverable_title ? `for "${content.deliverable_title}"` : ''} has been published to social media.`,
                    relatedId: content._id
                });
            } catch (err) { }
        }
        return content;
    }

    static async publishContentData(contentId, influencerId, externalPostUrl) {
        const content = await CampaignContent.findOne({ _id: contentId, influencer_id: influencerId });
        if (!content) throw new Error('Content not found or access denied');
        if (content.status !== 'approved') throw new Error('Only approved content can be published');

        content.status = 'published';
        content.published_at = new Date();
        content.external_post_url = externalPostUrl;
        await content.save();
        return content;
    }

    // ========== CUSTOMER FUNCTIONS ==========
    static async getPublishedContentData(campaignId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const content = await CampaignContent.find({ campaign_id: campaignId, status: 'published' })
            .populate('influencer_id', 'fullName profilePicUrl').populate('attached_products.product_id')
            .populate('campaign_id', 'title brand_id').sort({ published_at: -1 }).skip(skip).limit(parseInt(limit));

        const total = await CampaignContent.countDocuments({ campaign_id: campaignId, status: 'published' });
        return { content, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } };
    }

    static async getFeaturedContentData(limit = 10) {
        return await CampaignContent.find({ status: 'published', is_featured: true })
            .populate('influencer_id', 'fullName profilePicUrl').populate('attached_products.product_id')
            .populate('campaign_id', 'title brand_id').sort({ published_at: -1 }).limit(parseInt(limit));
    }

    static async trackInteractionData(contentId, actionType, productId, metadata, sessionInfo) {
        const content = await CampaignContent.findById(contentId);
        if (!content) throw new Error('Content not found');

        const tracking = new ContentTracking({
            content_id: contentId,
            user_session_id: sessionInfo.sessionId,
            action_type: actionType,
            product_id: productId,
            metadata: metadata || {},
            ip_address: sessionInfo.ip,
            user_agent: sessionInfo.userAgent,
            referrer: sessionInfo.referrer
        });

        await tracking.save();

        if (actionType === 'view') content.performance_metrics.views += 1;
        else if (actionType === 'click') content.performance_metrics.clicks += 1;

        await content.save();
        return true;
    }
}

module.exports = CampaignContentService;
