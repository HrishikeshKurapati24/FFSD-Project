const { Product, CampaignContent, ContentTracking, Customer } = require('../models/ProductMongo');
const { CampaignInfo, CampaignInfluencers } = require('../models/CampaignMongo');
const { BrandInfo } = require('../models/BrandMongo');
const { InfluencerInfo } = require('../models/InfluencerMongo');
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

            // Link to deliverable if specified (Stage 2-3 integration)
            const deliverableId = req.body.deliverable_id;
            const deliverableTitle = req.body.deliverable_title;

            let deliverableData = {};
            if (deliverableId) {
                console.log(`DEBUG: Linking content to deliverable ${deliverableId} for influencer ${influencerId}`);
                // Verify deliverable exists and belongs to this influencer
                const collab = await CampaignInfluencers.findOne({
                    campaign_id: campaignId,
                    influencer_id: influencerId,
                    'deliverables._id': deliverableId
                });

                if (collab) {
                    console.log(`DEBUG: Found matching collaboration for deliverable linkage.`);
                    deliverableData = {
                        deliverable_id: deliverableId,
                        deliverable_title: deliverableTitle || 'Deliverable'
                    };
                } else {
                    console.log(`DEBUG: WARNING - No matching collaboration found for deliverable ${deliverableId}. Linkage will fail.`);
                }
            }

            // Create content
            const content = new CampaignContent({
                campaign_id: campaignId,
                influencer_id: influencerId,
                ...deliverableData,  // Add deliverable link if exists
                caption: description,
                media_urls: media_urls,
                attached_products: [{
                    product_id: campaign_product
                }],
                special_instructions,
                scheduled_at: publish_date ? new Date(publish_date) : null,
                status: 'submitted', // Always submit for review
                created_at: new Date(),
                updated_at: new Date()
            });

            await content.save();

            // Update linked deliverable status to 'submitted' if exists
            if (deliverableId) {
                try {
                    const collab = await CampaignInfluencers.findOne({
                        campaign_id: campaignId,
                        influencer_id: influencerId,
                        'deliverables._id': deliverableId
                    });

                    if (collab) {
                        const deliverable = collab.deliverables.id(deliverableId);
                        if (deliverable && deliverable.status === 'pending') {
                            deliverable.status = 'submitted';
                            deliverable.submitted_at = new Date();
                            // Use the first media URL if available, otherwise fallback to content ID
                            const contentUrl = (media_urls && media_urls.length > 0) ? media_urls[0].url : `Content ID: ${content._id}`;
                            deliverable.content_url = contentUrl;
                            deliverable.deliverable_type = content_type || 'Other';
                            await collab.save();
                            console.log(`Updated deliverable ${deliverableId} status to submitted`);
                        }
                    }
                } catch (deliverableErr) {
                    console.error('Error updating deliverable status:', deliverableErr);
                    // Critical error: Rollback content creation to prevent data inconsistency
                    await CampaignContent.findByIdAndDelete(content._id);
                    return res.status(400).json({
                        success: false,
                        message: 'Failed to update deliverable status. Content submission cancelled.',
                        error: deliverableErr.message
                    });
                }
            }

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

            // Update linked deliverable if exists (Stage 2-3 integration)
            if (content.deliverable_id) {
                try {
                    const collab = await CampaignInfluencers.findOne({
                        campaign_id: content.campaign_id._id,
                        'deliverables._id': content.deliverable_id
                    });

                    if (collab) {
                        const deliverable = collab.deliverables.id(content.deliverable_id);
                        if (deliverable) {
                            deliverable.status = action === 'approve' ? 'approved' : 'rejected';
                            deliverable.review_feedback = feedback;
                            deliverable.reviewed_at = new Date();

                            // Recalculate progress locally
                            const approved = collab.deliverables.filter(d => d.status === 'approved').length;
                            const total = collab.deliverables.length;
                            collab.progress = Math.round((approved / total) * 100);

                            // Save once
                            await collab.save();
                            console.log(`Updated deliverable status to ${deliverable.status}, progress now ${collab.progress}%`);

                            // Update campaign-level progress asynchronously (fire and forget)
                            const CollaborationModel = require('../models/CollaborationModel');
                            CollaborationModel.updateCampaignMetrics(content.campaign_id._id)
                                .then(() => console.log(`Updated campaign metrics for ${content.campaign_id._id}`))
                                .catch(err => console.error('Error updating campaign metrics:', err));

                        }
                    }
                } catch (deliverableErr) {
                    console.error('Error updating linked deliverable:', deliverableErr);
                    // Continue even if deliverable update fails
                }
            }

            // Send notification to influencer
            const notificationController = require('./notificationController');
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
            } catch (notifErr) {
                console.error('Error sending notification:', notifErr);
            }

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
     * Returns both submitted (pending review) and approved (pending publication) content
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

            // Get content awaiting review (submitted but not yet approved/rejected)
            const submittedContent = await CampaignContent.find({
                campaign_id: campaignId,
                status: 'submitted'
            })
                .populate('influencer_id', 'fullName profilePicUrl')
                .populate('attached_products.product_id', 'name campaign_price images')
                .sort({ createdAt: -1 });

            // Get approved content awaiting publication
            const approvedContent = await CampaignContent.find({
                campaign_id: campaignId,
                status: 'approved'
            })
                .populate('influencer_id', 'fullName profilePicUrl')
                .populate('attached_products.product_id', 'name campaign_price images')
                .sort({ createdAt: -1 });

            res.json({
                success: true,
                submittedContent,      // Pending brand review
                approvedContent,       // Approved but not yet published
                totalPending: submittedContent.length + approvedContent.length
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
                status: { $in: ['approved', 'submitted'] } // Fallback: include submitted content in case deliverable was approved but content status wasn't synced
            })
                .populate({
                    path: 'campaign_id',
                    select: 'title brand_id',
                    populate: {
                        path: 'brand_id',
                        select: 'brandName'
                    }
                })
                // Removed .select() to ensure all fields like deliverable_id are returned
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

            console.log(`DEBUG: Found ${contentWithBrandInfo.length} approved content items for influencer ${influencerId}`);
            contentWithBrandInfo.forEach(c => {
                console.log(` - Content ${c._id}: status=${c.status}, deliverable_id=${c.deliverable_id}`);
            });

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
            const { status, externalPostUrl } = req.body;

            // Verify content belongs to the influencer
            const content = await CampaignContent.findOne({
                _id: contentId,
                influencer_id: influencerId
            }).populate('campaign_id', 'title brand_id');

            if (!content) {
                return res.status(404).json({
                    success: false,
                    message: 'Content not found or access denied'
                });
            }

            // Validate that content is approved before publishing
            if (status === 'published' && content.status !== 'approved') {
                // FALLBACK: If content is not approved, check if the deliverable record itself is approved
                // because brands might approve deliverables from other sections of the dashboard.
                if (content.deliverable_id) {
                    const collab = await CampaignInfluencers.findOne({
                        campaign_id: content.campaign_id._id,
                        'deliverables._id': content.deliverable_id
                    });

                    const deliverable = collab ? collab.deliverables.id(content.deliverable_id) : null;
                    if (deliverable && (deliverable.status === 'approved' || deliverable.status === 'published')) {
                        console.log(`DEBUG: Allowing publication for content ${contentId} because deliverable ${content.deliverable_id} is ${deliverable.status}`);
                    } else {
                        return res.status(400).json({
                            success: false,
                            message: 'Only approved content can be published'
                        });
                    }
                } else {
                    return res.status(400).json({
                        success: false,
                        message: 'Only approved content can be published'
                    });
                }
            }

            // Require external post URL when publishing
            if (status === 'published' && !externalPostUrl) {
                return res.status(400).json({
                    success: false,
                    message: 'External post URL is required when publishing content'
                });
            }

            // Update content status
            content.status = status;
            content.published_at = new Date();
            if (externalPostUrl) {
                content.external_post_url = externalPostUrl;
            }
            await content.save();

            // Update linked deliverable with actual URL if published
            if (status === 'published' && content.deliverable_id && externalPostUrl) {
                try {
                    const collab = await CampaignInfluencers.findOne({
                        campaign_id: content.campaign_id._id,
                        'deliverables._id': content.deliverable_id
                    });

                    if (collab) {
                        const deliverable = collab.deliverables.id(content.deliverable_id);
                        if (deliverable) {
                            deliverable.content_url = externalPostUrl; // Update with actual social media URL
                            deliverable.status = 'published'; // New: Update status to published
                            await collab.save();
                            console.log(`Updated deliverable ${content.deliverable_id} with published URL: ${externalPostUrl} and status: published`);
                        }
                    }
                } catch (deliverableErr) {
                    console.error('Error updating deliverable URL:', deliverableErr);
                    // Continue even if deliverable update fails
                }

                // Notify brand that content has been published
                const notificationController = require('./notificationController');
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
                    console.log('Brand notified of content publication');
                } catch (notifErr) {
                    console.error('Error sending publication notification:', notifErr);
                }
            }

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

    // Removed redundant functions (integrated deliverables workflow):
    // - createContent(): Replaced by createContentFromForm with deliverable_id support
    // - submitContent(): Not needed - createContentFromForm submits directly with status 'submitted'

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