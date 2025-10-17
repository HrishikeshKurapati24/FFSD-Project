const { Product, CampaignContent, ContentTracking, Customer } = require('../config/ProductMongo');
const { CampaignInfo, CampaignInfluencers } = require('../config/CampaignMongo');
const { BrandInfo } = require('../config/BrandMongo');
const { InfluencerInfo } = require('../config/InfluencerMongo');
const mongoose = require('mongoose');

class CampaignContentController {

    // ========== INFLUENCER FUNCTIONS ==========

    /**
     * Create content from form submission (from dashboard)
     */
    static async createContentFromForm(req, res) {
        console.log('=== CONTROLLER CALLED ===');
        console.log('Method:', req.method);
        console.log('URL:', req.url);
        console.log('Files received:', req.files);
        console.log('Body received:', req.body);

        try {
            const influencerId = req.session.user.id;
            const { action } = req.body;
            const campaignId = req.body.campaignId;
            const content_type = req.body.content_type;
            const platforms = Array.isArray(req.body.platforms) ? req.body.platforms : [req.body.platforms];
            const description = req.body.description;
            const campaign_product = req.body.campaign_product;
            const special_instructions = req.body.special_instructions || '';
            const publish_date = req.body.publish_date;

            // Validate required fields
            if (!campaignId || !content_type || !platforms || !description || !campaign_product) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields'
                });
            }

            // Debug: Log what we received
            console.log('Request files:', req.files);
            console.log('Request body:', req.body);
            console.log('Files keys:', Object.keys(req.files || {}));

            // Validate media files are uploaded
            // When using upload.array(), files are stored directly in req.files as an array
            const mediaFiles = req.files;
            if (!mediaFiles || mediaFiles.length === 0) {
                console.log('Media files validation failed:', {
                    hasFiles: !!req.files,
                    hasMediaFiles: !!mediaFiles,
                    filesLength: mediaFiles ? mediaFiles.length : 0,
                    filesType: typeof mediaFiles,
                    isArray: Array.isArray(mediaFiles)
                });
                return res.status(400).json({
                    success: false,
                    message: 'Media files are required'
                });
            }

            // Verify influencer has access to this campaign
            const campaign = await CampaignInfo.findOne({
                _id: campaignId,
                status: { $in: ['active'] }
            });

            if (!campaign) {
                return res.status(404).json({
                    success: false,
                    message: 'Campaign not found or not active'
                });
            }

            // Verify the product belongs to this campaign
            const product = await Product.findOne({
                _id: campaign_product,
                campaign_id: campaignId,
                status: 'active'
            });

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found or not available for this campaign'
                });
            }

            // Handle media uploads to Cloudinary
            const { uploadToCloudinary } = require('../utils/cloudinary');
            const media_urls = [];

            if (mediaFiles && mediaFiles.length > 0) {
                const files = mediaFiles; // mediaFiles is already an array

                for (const file of files) {
                    try {
                        // Use uploadToCloudinary for files stored on disk (multer with dest option)
                        const mediaUrl = await uploadToCloudinary(file, `content/${campaignId}`);
                        const mediaType = file.mimetype.startsWith('video/') ? 'video' : 'image';

                        media_urls.push({
                            url: mediaUrl,
                            type: mediaType,
                            original_name: file.originalname
                        });
                    } catch (uploadError) {
                        console.error('Error uploading file:', uploadError);
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to upload media files',
                            error: uploadError.message
                        });
                    }
                }
            }

            // Create content
            const content = new CampaignContent({
                campaign_id: campaignId,
                influencer_id: influencerId,
                caption: description,
                media_urls: media_urls,
                attached_products: [{
                    product_id: campaign_product
                }],
                special_instructions,
                scheduled_at: publish_date ? new Date(publish_date) : null,
                status: 'submitted', // Always submit for review, no draft option
                created_at: new Date(),
                updated_at: new Date()
            });

            await content.save();

            res.json({
                success: true,
                message: 'Content submitted for review successfully',
                content: content
            });

        } catch (error) {
            console.error('Error creating content:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create content',
                error: error.message
            });
        }
    }

    // ========== BRAND FUNCTIONS ==========

    /**
     * Create products for a campaign
     */
    static async createCampaignProducts(req, res) {
        try {
            const { campaignId } = req.params;
            const { products } = req.body;
            const brandId = req.session.user.id;

            // Verify brand owns the campaign
            const campaign = await CampaignInfo.findOne({
                _id: campaignId,
                brand_id: brandId
            });

            if (!campaign) {
                return res.status(404).json({
                    success: false,
                    message: 'Campaign not found or access denied'
                });
            }

            // Validate and create products
            const createdProducts = [];
            for (const productData of products) {
                // Calculate discount percentage
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

            res.status(201).json({
                success: true,
                message: 'Products created successfully',
                products: createdProducts
            });

        } catch (error) {
            console.error('Error creating campaign products:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating products',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    /**
     * Get products for a campaign
     */
    static async getCampaignProducts(req, res) {
        try {
            const { campaignId } = req.params;
            const brandId = req.session.user.id;

            const products = await Product.find({
                campaign_id: campaignId,
                brand_id: brandId,
                status: { $ne: 'discontinued' }
            }).populate('campaign_id', 'title status');

            res.json({
                success: true,
                products
            });

        } catch (error) {
            console.error('Error fetching campaign products:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching products',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    /**
     * Review and approve/reject influencer content
     */
    static async reviewContent(req, res) {
        try {
            const { contentId } = req.params;
            const { action, feedback } = req.body; // action: 'approve' or 'reject'
            const brandId = req.session.user.id;

            const content = await CampaignContent.findById(contentId)
                .populate('campaign_id', 'brand_id');

            if (!content) {
                return res.status(404).json({
                    success: false,
                    message: 'Content not found'
                });
            }

            // Verify brand owns the campaign
            if (content.campaign_id.brand_id.toString() !== brandId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // Update content status
            if (action === 'approve') {
                content.status = 'approved';
                content.review_notes = feedback || 'Content approved';
            } else if (action === 'reject') {
                content.status = 'rejected';
                content.review_notes = feedback || 'Content rejected';
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid action. Use "approve" or "reject"'
                });
            }

            content.brand_feedback = feedback;
            await content.save();

            res.json({
                success: true,
                message: `Content ${action}d successfully`,
                content
            });

        } catch (error) {
            console.error('Error reviewing content:', error);
            res.status(500).json({
                success: false,
                message: 'Error reviewing content',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    /**
     * Get campaign content for brand review
     */
    static async getCampaignPendingContentForBrand(req, res) {
        try {
            const { campaignId } = req.params;
            const brandId = req.session.user.id;

            // Verify brand owns the campaign
            const campaign = await CampaignInfo.findOne({
                _id: campaignId,
                brand_id: brandId
            });

            if (!campaign) {
                return res.status(404).json({
                    success: false,
                    message: 'Campaign not found or access denied'
                });
            }

            // Get all content for this campaign with status 'submitted'
            const content = await CampaignContent.find({
                campaign_id: campaignId,
                status: 'submitted'
            })
                .populate('influencer_id', 'fullName profilePicUrl')
                .populate('attached_products.product_id', 'name campaign_price images')
                .sort({ createdAt: -1 });

            res.json({
                success: true,
                content
            });

        } catch (error) {
            console.error('Error fetching campaign content:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching campaign content',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    /**
     * Get pending content for review
     */
    static async getPendingContent(req, res) {
        try {
            const brandId = req.session.user.id;

            const pendingContent = await CampaignContent.find({
                status: 'submitted',
                'campaign_id': { $in: await CampaignInfo.find({ brand_id: brandId }).select('_id') }
            })
                .populate('campaign_id', 'title brand_id')
                .populate('influencer_id', 'fullName profilePicUrl')
                .sort({ createdAt: -1 });

            res.json({
                success: true,
                content: pendingContent
            });

        } catch (error) {
            console.error('Error fetching pending content:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching pending content',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // ========== INFLUENCER FUNCTIONS ==========

    /**
     * Get approved content for influencer
     */
    static async getApprovedContent(req, res) {
        try {
            const influencerId = req.session.user.id;

            // Get content that is approved but not yet published, including brand name and caption
            const approvedContent = await CampaignContent.find({
                influencer_id: influencerId,
                status: 'approved'
            })
                .populate({
                    path: 'campaign_id',
                    select: 'title brand_id',
                    populate: {
                        path: 'brand_id',
                        select: 'brandName'
                    }
                })
                .select('caption campaign_id') // Ensure caption and campaign_id are returned
                .sort({ createdAt: -1 });

            // Format for brand name at top-level if needed
            const contentWithBrandInfo = approvedContent.map(item => ({
                ...item.toObject(),
                brandName: item.campaign_id && item.campaign_id.brand_id
                    ? item.campaign_id.brand_id.brandName
                    : null,
                campaignTitle: item.campaign_id ? item.campaign_id.title : null,
                caption: item.caption
            }));

            res.json({
                success: true,
                content: contentWithBrandInfo
            });

        } catch (error) {
            console.error('Error fetching approved content:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching approved content',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    /**
     * Update content status to published
     */
    static async updateContentStatus(req, res) {
        try {
            const { contentId } = req.params;
            const influencerId = req.session.user.id;
            const { status } = req.body;

            // Verify content belongs to the influencer
            const content = await CampaignContent.findOne({
                _id: contentId,
                influencer_id: influencerId
            });

            if (!content) {
                return res.status(404).json({
                    success: false,
                    message: 'Content not found or access denied'
                });
            }

            // Update content status
            content.status = status;
            content.published_at = new Date();
            await content.save();

            res.json({
                success: true,
                message: 'Content status updated successfully',
                content
            });

        } catch (error) {
            console.error('Error updating content status:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating content status',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    /**
     * Create content for a campaign
     */
    static async createContent(req, res) {
        try {
            const influencerId = req.session.user.id;
            const { campaignId } = req.params;
            const contentData = req.body;

            // Verify influencer is part of the campaign
            const collaboration = await CampaignInfluencers.findOne({
                campaign_id: campaignId,
                influencer_id: influencerId,
                status: 'active'
            });

            if (!collaboration) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not part of this campaign or collaboration is not active'
                });
            }

            // Create content
            const content = new CampaignContent({
                ...contentData,
                campaign_id: campaignId,
                influencer_id: influencerId,
                status: 'draft'
            });

            await content.save();

            // Populate the created content
            await content.populate([
                { path: 'campaign_id', select: 'title brand_id' },
                { path: 'influencer_id', select: 'fullName profilePicUrl' }
            ]);

            res.status(201).json({
                success: true,
                message: 'Content created successfully',
                content
            });

        } catch (error) {
            console.error('Error creating content:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating content',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    /**
     * Submit content for brand review
     */
    static async submitContent(req, res) {
        try {
            const { contentId } = req.params;
            const influencerId = req.session.user.id;

            const content = await CampaignContent.findOne({
                _id: contentId,
                influencer_id: influencerId
            });

            if (!content) {
                return res.status(404).json({
                    success: false,
                    message: 'Content not found or access denied'
                });
            }

            if (content.status !== 'draft') {
                return res.status(400).json({
                    success: false,
                    message: 'Only draft content can be submitted for review'
                });
            }

            // Validate content before submission
            if (!content.attached_products || content.attached_products.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Content must have at least one attached product'
                });
            }

            if (!content.disclosures || content.disclosures.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Content must include proper disclosures'
                });
            }

            content.status = 'submitted';
            await content.save();

            res.json({
                success: true,
                message: 'Content submitted for review',
                content
            });

        } catch (error) {
            console.error('Error submitting content:', error);
            res.status(500).json({
                success: false,
                message: 'Error submitting content',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    /**
     * Publish approved content
     */
    static async publishContent(req, res) {
        try {
            const { contentId } = req.params;
            const influencerId = req.session.user.id;
            const { externalPostUrl } = req.body;

            const content = await CampaignContent.findOne({
                _id: contentId,
                influencer_id: influencerId
            });

            if (!content) {
                return res.status(404).json({
                    success: false,
                    message: 'Content not found or access denied'
                });
            }

            if (content.status !== 'approved') {
                return res.status(400).json({
                    success: false,
                    message: 'Only approved content can be published'
                });
            }

            content.status = 'published';
            content.published_at = new Date();
            content.external_post_url = externalPostUrl;
            await content.save();

            res.json({
                success: true,
                message: 'Content published successfully',
                content
            });

        } catch (error) {
            console.error('Error publishing content:', error);
            res.status(500).json({
                success: false,
                message: 'Error publishing content',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // ========== CUSTOMER FUNCTIONS ==========

    /**
     * Get published content with products for customers
     */
    static async getPublishedContent(req, res) {
        try {
            const { campaignId } = req.params;
            const { page = 1, limit = 20 } = req.query;

            const skip = (page - 1) * limit;

            const content = await CampaignContent.find({
                campaign_id: campaignId,
                status: 'published'
            })
                .populate('influencer_id', 'fullName profilePicUrl')
                .populate('attached_products.product_id')
                .populate('campaign_id', 'title brand_id')
                .sort({ published_at: -1 })
                .skip(skip)
                .limit(parseInt(limit));

            const total = await CampaignContent.countDocuments({
                campaign_id: campaignId,
                status: 'published'
            });

            res.json({
                success: true,
                content,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });

        } catch (error) {
            console.error('Error fetching published content:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching content',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    /**
     * Get featured content (for homepage)
     */
    static async getFeaturedContent(req, res) {
        try {
            const { limit = 10 } = req.query;

            const content = await CampaignContent.find({
                status: 'published',
                is_featured: true
            })
                .populate('influencer_id', 'fullName profilePicUrl')
                .populate('attached_products.product_id')
                .populate('campaign_id', 'title brand_id')
                .sort({ published_at: -1 })
                .limit(parseInt(limit));

            res.json({
                success: true,
                content
            });

        } catch (error) {
            console.error('Error fetching featured content:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching featured content',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    /**
     * Track content interaction
     */
    static async trackInteraction(req, res) {
        try {
            const { contentId } = req.params;
            const { actionType, productId, metadata } = req.body;
            const sessionId = req.sessionID || req.headers['x-session-id'] || 'anonymous';

            // Verify content exists
            const content = await CampaignContent.findById(contentId);
            if (!content) {
                return res.status(404).json({
                    success: false,
                    message: 'Content not found'
                });
            }

            // Create tracking record
            const tracking = new ContentTracking({
                content_id: contentId,
                user_session_id: sessionId,
                action_type: actionType,
                product_id: productId,
                metadata: metadata || {},
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
                referrer: req.headers.referer
            });

            await tracking.save();

            // Update content performance metrics
            if (actionType === 'view') {
                content.performance_metrics.views += 1;
            } else if (actionType === 'click') {
                content.performance_metrics.clicks += 1;
            }

            await content.save();

            res.json({
                success: true,
                message: 'Interaction tracked successfully'
            });

        } catch (error) {
            console.error('Error tracking interaction:', error);
            res.status(500).json({
                success: false,
                message: 'Error tracking interaction',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
}

module.exports = CampaignContentController;