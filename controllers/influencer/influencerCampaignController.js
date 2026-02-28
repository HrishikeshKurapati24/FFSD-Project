const influencerCampaignService = require('../../services/influencer/influencerCampaignService');

const getCampaignHistory = async (req, res) => {
  try {
    const influencerId = req.session.user?.id;
    if (!influencerId) {
      return res.status(401).json({ success: false, message: 'Please log in to view campaign history' });
    }

    const campaigns = await influencerCampaignService.getCampaignHistory(influencerId);
    return res.json({ success: true, campaigns });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error loading campaign history' });
  }
};

const updateProgress = async (req, res) => {
  try {
    const { collabId } = req.params;
    if (!collabId) return res.status(400).json({ success: false, message: 'Missing required parameters' });

    const influencerId = req.session.user?.id;
    const progressValue = await influencerCampaignService.updateCollaborationProgressAndMetrics(collabId, influencerId, req.body);

    res.json({
      success: true,
      progress: progressValue,
      message: 'Progress and metrics updated successfully'
    });
  } catch (error) {
    return res.status(error.message.includes('required') || error.message.includes('Invalid') ? 400 : (error.message.includes('not found') ? 404 : 500)).json({
      success: false,
      message: error.message || 'Error updating progress'
    });
  }
};

const getCollabDetails = async (req, res) => {
  try {
    const { collabId } = req.params;
    if (!collabId) return res.status(400).json({ success: false, message: 'Collaboration ID is required' });

    const collab = await influencerCampaignService.getCollaborationDetailsData(collabId);
    res.json({ success: true, collab });
  } catch (error) {
    res.status(error.message === 'Collaboration not found' ? 404 : 500).json({
      success: false,
      message: error.message || 'Error fetching collaboration details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

const getCollaborationDetails = async (req, res) => {
  return getCollabDetails(req, res); // Aliased since functionality is identical after refactoring
};

const getExploreCollabs = async (req, res) => {
  try {
    const influencerId = req.session.user.id;
    const { CampaignInfo, CampaignInfluencers } = require('../../models/CampaignMongo');
    const { Product } = require('../../models/ProductMongo');
    const mongoose = require('mongoose');

    const allRequests = await CampaignInfo.find({ status: 'request' })
      .populate('brand_id', 'brandName logoUrl')
      .sort({ createdAt: -1 })
      .lean();

    const existingInvites = await CampaignInfluencers.find({
      influencer_id: new mongoose.Types.ObjectId(influencerId),
      status: { $in: ['brand-invite', 'influencer-invite'] }
    }).select('campaign_id').lean();

    const excludedCampaignIds = existingInvites.map(invite => invite.campaign_id.toString());
    const requests = allRequests.filter(request =>
      !excludedCampaignIds.includes(request._id.toString())
    );

    const campaignIds = requests.map(request => request._id);
    const products = await Product.find({
      campaign_id: { $in: campaignIds }
    }).select('campaign_id name category').lean();

    const productsByCampaign = {};
    products.forEach(product => {
      if (!productsByCampaign[product.campaign_id.toString()]) {
        productsByCampaign[product.campaign_id.toString()] = [];
      }
      productsByCampaign[product.campaign_id.toString()].push(product);
    });

    const collabs = requests.map(request => {
      const campaignProducts = productsByCampaign[request._id.toString()] || [];
      const productCategories = [...new Set(campaignProducts.map(p => p.category).filter(Boolean))];

      return {
        id: request._id,
        title: request.title,
        brand_name: request.brand_id?.brandName || 'Unknown Brand',
        influence_regions: request.target_audience,
        budget: parseFloat(request.budget) || 0,
        offer_sentence: request.description,
        channels: Array.isArray(request.required_channels) ? request.required_channels.join(', ') : '',
        min_followers: request.min_followers?.toLocaleString() || '0',
        age_group: request.target_audience?.split(',')[0] || 'All Ages',
        genders: request.target_audience?.split(',')[1] || 'All Genders',
        duration: request.duration || 0,
        required_channels: Array.isArray(request.required_channels) ? request.required_channels : [],
        created_at: request.createdAt || new Date(),
        products: campaignProducts,
        product_names: campaignProducts.map(p => p.name).join(', '),
        product_categories: productCategories,
        primary_category: productCategories[0] || null
      };
    });

    const responseData = { collabs, influencer: influencerId };
    return res.json({ success: true, ...responseData });
  } catch (error) {
    console.error('Error fetching campaign requests:', error);
    return res.status(500).json({ success: false, message: 'Error loading campaign requests' });
  }
};

const getExploreCollabDetails = async (req, res) => {
  try {
    const collabId = req.params.id;
    const influencerId = req.session.user.id;
    const collaborationModel = require('../../services/CollaborationModel');
    const { CampaignInfluencers } = require('../../models/CampaignMongo');
    const { Product } = require('../../models/ProductMongo');
    const { InfluencerInfo, InfluencerSocials } = require('../../models/InfluencerMongo');
    const mongoose = require('mongoose');

    const collab = await collaborationModel.getCollaborationDetails(collabId);
    if (!collab) {
      return res.status(404).json({ success: false, message: 'Collaboration not found' });
    }

    const existingApplication = await CampaignInfluencers.findOne({
      campaign_id: new mongoose.Types.ObjectId(collabId),
      influencer_id: new mongoose.Types.ObjectId(influencerId)
    });
    const applicationStatus = existingApplication ? existingApplication.status : null;

    const socials = await InfluencerSocials.findOne({ influencerId: new mongoose.Types.ObjectId(influencerId) }).lean();
    const influencerChannels = (socials?.platforms || []).map(p => (p.platform || '').toLowerCase());
    const influencerFollowersTotal = (socials?.platforms || []).reduce((sum, p) => sum + (p.followers || 0), 0);

    const influencerInfo = await InfluencerInfo.findById(influencerId).select('categories').lean();
    const influencerCategories = (influencerInfo?.categories || []).map(cat => (cat || '').toLowerCase().trim());

    const requiredChannels = Array.isArray(collab.required_channels) ? collab.required_channels.map(c => (c || '').toLowerCase()) : [];
    const missingChannels = requiredChannels.filter(rc => !influencerChannels.includes(rc));
    const minFollowers = typeof collab.min_followers === 'number' ? collab.min_followers : 0;
    const meetsFollowers = influencerFollowersTotal >= minFollowers;

    const unmetRequirements = [];
    if (missingChannels.length > 0) unmetRequirements.push(`Missing required channels: ${missingChannels.join(', ')}`);
    if (!meetsFollowers) unmetRequirements.push(`Minimum followers required: ${minFollowers.toLocaleString()}`);

    const products = await Product.find({ campaign_id: new mongoose.Types.ObjectId(collabId), status: 'active' }).lean();
    collab.products = products;

    if (products && products.length > 0) {
      const productCategories = products.map(product => (product.category || '').toLowerCase().trim()).filter(Boolean);
      const hasCategoryMatch = productCategories.some(productCategory =>
        influencerCategories.some(influencerCategory =>
          influencerCategory === productCategory ||
          influencerCategory.includes(productCategory) ||
          productCategory.includes(influencerCategory)
        )
      );
      if (!hasCategoryMatch && productCategories.length > 0) {
        unmetRequirements.push(`Category mismatch: Your categories (${influencerCategories.join(', ') || 'None'}) don't match the product categories (${productCategories.join(', ')})`);
      }
    }

    const isEligible = unmetRequirements.length === 0;
    const responseData = { collab, applicationStatus, isEligible, unmetRequirements };
    return res.json({ success: true, ...responseData });
  } catch (error) {
    console.error('Error fetching collaboration details:', error);
    return res.status(500).json({ success: false, message: 'Error loading collaboration details' });
  }
};

const applyToCampaign = async (req, res) => {
  try {
    const campaignId = req.params.campaignId;
    const influencerId = req.session.user.id;
    const specialMessage = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    const { CampaignInfo, CampaignInfluencers } = require('../../models/CampaignMongo');
    const { InfluencerInfo } = require('../../models/InfluencerMongo');
    const { Message } = require('../../models/MessageMongo');
    const mongoose = require('mongoose');
    const notificationController = require('../../monolithic_files/notificationController');

    const influencer = await InfluencerInfo.findById(influencerId);
    if (!influencer.verified) {
      return res.status(400).json({ success: false, message: 'Your account is not verified. Please wait for verification.' });
    }

    const { SubscriptionService } = require('../../services/brandModel');
    try {
      const limitCheck = await SubscriptionService.checkSubscriptionLimit(influencerId, 'influencer', 'connect_brand');
      if (!limitCheck.allowed) {
        if (limitCheck.redirectToPayment) {
          return res.status(403).json({ success: false, message: limitCheck.reason, expired: true, redirectUrl: '/subscription/manage' });
        }
        return res.status(400).json({ success: false, message: `${limitCheck.reason}. Please upgrade your plan to connect with more brands.`, showUpgradeLink: true });
      }
    } catch (subscriptionError) {
      console.error('Subscription check error:', subscriptionError);
      return res.status(500).json({ success: false, message: 'Unable to verify subscription. Please try again later.' });
    }

    const campaign = await CampaignInfo.findById(campaignId);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

    const existingApplication = await CampaignInfluencers.findOne({
      campaign_id: new mongoose.Types.ObjectId(campaignId),
      influencer_id: new mongoose.Types.ObjectId(influencerId)
    });

    if (existingApplication) {
      if (existingApplication.status === 'request') {
        existingApplication.status = 'active';
        existingApplication.applied_at = new Date();
        await existingApplication.save();
        try {
          await SubscriptionService.updateUsage(influencerId, 'influencer', { campaignsUsed: 1 });
        } catch (usageError) { }

        if (specialMessage) {
          const campaignDoc = await CampaignInfo.findById(campaignId).select('brand_id').lean();
          if (campaignDoc?.brand_id) {
            await new Message({
              brand_id: campaignDoc.brand_id,
              influencer_id: new mongoose.Types.ObjectId(influencerId),
              campaign_id: new mongoose.Types.ObjectId(campaignId),
              message: specialMessage
            }).save();
          }
        }
        return res.json({ success: true, message: 'Invitation accepted successfully', applicationId: existingApplication._id });
      } else if (existingApplication.status === 'active') {
        return res.status(400).json({ success: false, message: 'You are already active in this campaign' });
      } else {
        return res.status(400).json({ success: false, message: 'You have already applied to this campaign' });
      }
    }

    const newApplication = new CampaignInfluencers({
      campaign_id: campaignId,
      influencer_id: influencerId,
      status: 'request',
      progress: 0,
      engagement_rate: 0,
      reach: 0,
      clicks: 0,
      conversions: 0,
      timeliness_score: 0,
      applied_at: new Date()
    });
    await newApplication.save();

    try {
      await SubscriptionService.updateUsage(influencerId, 'influencer', { brandsConnected: 1 });
    } catch (usageError) { }

    if (specialMessage) {
      const campaignDoc = await CampaignInfo.findById(campaignId).select('brand_id').lean();
      if (campaignDoc?.brand_id) {
        await new Message({ brand_id: campaignDoc.brand_id, influencer_id: new mongoose.Types.ObjectId(influencerId), campaign_id: new mongoose.Types.ObjectId(campaignId), message: specialMessage }).save();
      }
    }

    try {
      const campaignDoc = await CampaignInfo.findById(campaignId).select('brand_id').lean();
      if (campaignDoc?.brand_id) {
        const influencerInfo = await InfluencerInfo.findById(influencerId).select('fullName displayName').lean();
        await notificationController.createNotification({
          recipientId: campaignDoc.brand_id,
          recipientType: 'brand',
          senderId: new mongoose.Types.ObjectId(influencerId),
          senderType: 'influencer',
          type: 'application_received',
          title: 'New Application',
          body: `${influencerInfo?.displayName || influencerInfo?.fullName || 'An influencer'} applied to your campaign.`,
          relatedId: newApplication._id,
          data: { campaignId, influencerId }
        });
      }
    } catch (notifErr) { console.error('Error creating notification:', notifErr); }

    res.json({ success: true, message: 'Application submitted successfully', applicationId: newApplication._id });
  } catch (error) {
    console.error('Error applying to campaign:', error);
    res.status(500).json({ success: false, message: 'Error applying to campaign', error: error.message });
  }
};

const acceptBrandInvite = async (req, res) => {
  try {
    const inviteId = req.params.inviteId;
    const influencerId = req.session.user.id;
    const { CampaignInfluencers, CampaignInfo } = require('../../models/CampaignMongo');
    const { InfluencerInfo } = require('../../models/InfluencerMongo');
    const mongoose = require('mongoose');
    const notificationController = require('../../monolithic_files/notificationController');

    const invite = await CampaignInfluencers.findOne({
      _id: new mongoose.Types.ObjectId(inviteId),
      influencer_id: new mongoose.Types.ObjectId(influencerId),
      status: 'brand-invite'
    });

    if (!invite) return res.status(404).json({ success: false, message: 'Invitation not found or already processed' });

    invite.status = 'request';
    await invite.save();

    try {
      const campaignDoc = await CampaignInfo.findById(invite.campaign_id).select('brand_id').lean();
      if (campaignDoc?.brand_id) {
        const influencerInfo = await InfluencerInfo.findById(influencerId).select('fullName displayName').lean();
        await notificationController.createNotification({
          recipientId: campaignDoc.brand_id,
          recipientType: 'brand',
          senderId: new mongoose.Types.ObjectId(influencerId),
          senderType: 'influencer',
          type: 'invite_accepted',
          title: 'Invite Accepted',
          body: `${influencerInfo?.displayName || influencerInfo?.fullName || 'An influencer'} accepted your campaign invite.`,
          relatedId: invite._id,
          data: { inviteId, influencerId }
        });
      }
    } catch (notifErr) { }

    res.json({ success: true, message: 'Invitation accepted successfully' });
  } catch (error) {
    console.error('Error accepting brand invite:', error);
    res.status(500).json({ success: false, message: 'Failed to accept invitation', error: error.message });
  }
};

const declineBrandInvite = async (req, res) => {
  try {
    const inviteId = req.params.inviteId;
    const influencerId = req.session.user.id;
    const { CampaignInfluencers, CampaignInfo } = require('../../models/CampaignMongo');
    const { InfluencerInfo } = require('../../models/InfluencerMongo');
    const mongoose = require('mongoose');
    const notificationController = require('../../monolithic_files/notificationController');

    const invite = await CampaignInfluencers.findOne({
      _id: new mongoose.Types.ObjectId(inviteId),
      influencer_id: new mongoose.Types.ObjectId(influencerId),
      status: 'brand-invite'
    });

    if (!invite) return res.status(404).json({ success: false, message: 'Invitation not found or already processed' });

    invite.status = 'cancelled';
    await invite.save();

    try {
      const campaignDoc = await CampaignInfo.findById(invite.campaign_id).select('brand_id').lean();
      if (campaignDoc?.brand_id) {
        const influencerInfo = await InfluencerInfo.findById(influencerId).select('fullName displayName').lean();
        await notificationController.createNotification({
          recipientId: campaignDoc.brand_id,
          recipientType: 'brand',
          senderId: new mongoose.Types.ObjectId(influencerId),
          senderType: 'influencer',
          type: 'invite_declined',
          title: 'Invite Declined',
          body: `${influencerInfo?.displayName || influencerInfo?.fullName || 'An influencer'} declined your campaign invite.`,
          relatedId: invite._id,
          data: { inviteId, influencerId }
        });
      }
    } catch (notifErr) { }

    res.json({ success: true, message: 'Invitation declined' });
  } catch (error) {
    console.error('Error declining brand invite:', error);
    res.status(500).json({ success: false, message: 'Failed to decline invitation', error: error.message });
  }
};

const cancelSentRequest = async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const influencerId = req.session.user.id;
    const { CampaignInfluencers, CampaignInfo } = require('../../models/CampaignMongo');
    const mongoose = require('mongoose');

    const request = await CampaignInfluencers.findOne({
      _id: new mongoose.Types.ObjectId(requestId),
      influencer_id: new mongoose.Types.ObjectId(influencerId),
      status: 'influencer-invite'
    });

    if (!request) return res.status(404).json({ success: false, message: 'Request not found or already processed' });

    const campaign = await CampaignInfo.findById(request.campaign_id);
    if (!campaign || campaign.status !== 'influencer-invite') return res.status(400).json({ success: false, message: 'Campaign is no longer accepting requests' });

    request.status = 'cancelled';
    await request.save();
    campaign.status = 'cancelled';
    await campaign.save();

    res.json({ success: true, message: 'Request cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling sent request:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel request', error: error.message });
  }
};

const inviteBrand = async (req, res) => {
  try {
    const influencerId = req.session.user.id;
    let { brandId, title, description, budget, product_name, required_channels } = req.body;
    const { InfluencerInfo, InfluencerAnalytics } = require('../../models/InfluencerMongo');
    const { CampaignInfo, CampaignInfluencers } = require('../../models/CampaignMongo');
    const { Product } = require('../../models/ProductMongo');
    const mongoose = require('mongoose');
    const notificationController = require('../../monolithic_files/notificationController');

    const influencer = await InfluencerInfo.findById(influencerId);
    if (!influencer.verified) return res.status(400).json({ success: false, message: 'Your account is not verified. Please wait for verification.' });

    const { SubscriptionService } = require('../../services/brandModel');
    try {
      const limitCheck = await SubscriptionService.checkSubscriptionLimit(influencerId, 'influencer', 'connect_brand');
      if (!limitCheck.allowed) return res.status(400).json({ success: false, message: `Brand connection limit reached: ${limitCheck.reason}. Please upgrade your plan to connect with more brands.`, showUpgradeLink: true });
    } catch (e) { }

    if (!brandId || !title || !description || !budget || !product_name || !required_channels || required_channels.length === 0) {
      return res.status(400).json({ success: false, message: 'All required fields must be provided' });
    }
    if (!mongoose.Types.ObjectId.isValid(brandId)) return res.status(400).json({ success: false, message: 'Invalid brand ID format' });

    const { BrandInfo } = require('../../models/BrandMongo');
    const brand = await BrandInfo.findById(brandId);
    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });

    let influencerFollowers = 0;
    try {
      const influencerAnalytics = await InfluencerAnalytics.findOne({ influencer_id: new mongoose.Types.ObjectId(influencerId) });
      if (influencerAnalytics) influencerFollowers = influencerAnalytics.totalFollowers || 0;
    } catch (e) { }

    const newCampaign = new CampaignInfo({
      brand_id: new mongoose.Types.ObjectId(brandId),
      title: title.trim(),
      description: description.trim(),
      budget: parseFloat(budget),
      product_name: product_name.trim(),
      required_channels: required_channels,
      min_followers: Math.floor(influencerFollowers * 0.5),
      status: 'influencer-invite',
      objectives: '', start_date: null, end_date: null, duration: 0, target_audience: '', required_influencers: 1
    });
    await newCampaign.save();

    const newProduct = new Product({
      campaign_id: newCampaign._id,
      brand_id: new mongoose.Types.ObjectId(brandId),
      name: product_name.trim(), description: '', original_price: 0, campaign_price: 0, category: '', target_quantity: 0,
      images: [], tags: [], is_digital: false, delivery_info: { estimated_days: 0, shipping_cost: 0, free_shipping_threshold: 0 },
      specifications: new Map(), status: 'active', created_by: new mongoose.Types.ObjectId(brandId)
    });
    await newProduct.save();

    const campaignInfluencer = new CampaignInfluencers({
      campaign_id: newCampaign._id, influencer_id: new mongoose.Types.ObjectId(influencerId), status: 'influencer-invite', progress: 0
    });
    await campaignInfluencer.save();

    try { await SubscriptionService.updateUsage(influencerId, 'influencer', { brandsConnected: 1 }); } catch (e) { }

    try {
      const influencerInfo = await InfluencerInfo.findById(influencerId).select('fullName displayName').lean();
      await notificationController.createNotification({
        recipientId: new mongoose.Types.ObjectId(brandId),
        recipientType: 'brand',
        senderId: new mongoose.Types.ObjectId(influencerId),
        senderType: 'influencer',
        type: 'invite_sent',
        title: 'Influencer Invite with Product',
        body: `${influencerInfo?.displayName || influencerInfo?.fullName || 'An influencer'} sent you an invite to collaborate with the product "${product_name}".`,
        relatedId: campaignInfluencer._id,
        data: { campaignId: newCampaign._id, influencerId }
      });
    } catch (e) { }

    res.json({ success: true, message: 'Invitation sent to brand successfully. The brand will complete the campaign details.', campaignId: newCampaign._id });
  } catch (error) {
    console.error('Error inviting brand:', error);
    res.status(500).json({ success: false, message: 'Failed to send invitation', error: error.message });
  }
};

const getCampaignProducts = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const influencerId = req.session.user.id;
    const { CampaignInfluencers } = require('../../models/CampaignMongo');
    const { Product } = require('../../models/ProductMongo');

    const collaboration = await CampaignInfluencers.findOne({
      campaign_id: campaignId,
      influencer_id: influencerId,
      status: 'active'
    });

    if (!collaboration) return res.status(403).json({ success: false, message: 'Access denied: You are not part of this campaign' });

    const products = await Product.find({ campaign_id: campaignId, status: 'active' }).select('name description campaign_price images category');
    res.json({ success: true, products });
  } catch (error) {
    console.error('Error fetching campaign products:', error);
    res.status(500).json({ success: false, message: 'Error fetching products', error: error.message });
  }
};

module.exports = {
  getCampaignHistory,
  updateProgress,
  getCollabDetails,
  getCollaborationDetails,
  getExploreCollabs,
  getExploreCollabDetails,
  applyToCampaign,
  acceptBrandInvite,
  declineBrandInvite,
  cancelSentRequest,
  inviteBrand,
  getCampaignProducts
};