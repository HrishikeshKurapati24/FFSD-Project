const mongoose = require('mongoose');
const { brandModel, SubscriptionService } = require('../models/brandModel');
const { getAllInfluencers } = require('../models/influencerModel');
const { CampaignInfo, CampaignInfluencers, CampaignPayments } = require('../config/CampaignMongo');
const { Product, CampaignContent } = require('../config/ProductMongo');
const { Order } = require('../config/OrderMongo');
const { validationResult } = require('express-validator');
const notificationController = require('./notificationController');
const { sendOrderStatusEmail } = require('../utils/emailService');

// Helper: compute progress from deliverables (exists only once)
const computeProgressFromDeliverables = (deliverables = []) => {
  try {
    if (!Array.isArray(deliverables) || deliverables.length === 0) return 0;
    const total = deliverables.length;
    // Count only deliverables with status 'approved'
    const approved = deliverables.filter(d => {
      return d && typeof d.status === 'string' && d.status.toLowerCase() === 'approved';
    }).length;
    return Math.min(100, Math.max(0, Math.round((approved / total) * 100)));
  } catch {
    return 0;
  }
};



const platformIconMap = {
  instagram: 'instagram',
  youtube: 'youtube',
  tiktok: 'tiktok',
  facebook: 'facebook',
  twitter: 'twitter',
  linkedin: 'linkedin'
};

const toArrayField = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean);
      }
    } catch (error) {
      // Fall through to comma separated fallback
    }
    return value.split(',').map(item => item.trim()).filter(Boolean);
  }
  return [];
};

const buildSocialSummaries = (socialStats = []) => socialStats.map(stat => {
  const platform = (stat.platform || 'link').toLowerCase();
  const followers = Number(stat.followers || 0);
  const avgLikes = stat.avgLikes !== undefined ? Number(stat.avgLikes) : Math.round(followers * 0.05);
  const avgComments = stat.avgComments !== undefined ? Number(stat.avgComments) : Math.round(followers * 0.01);
  const avgViews = stat.avgViews !== undefined
    ? Number(stat.avgViews)
    : (platform === 'youtube' ? Math.round(followers * 2) : Math.round(followers * 0.1));

  return {
    platform,
    name: stat.platform ? stat.platform.charAt(0).toUpperCase() + stat.platform.slice(1) : 'Platform',
    icon: platformIconMap[platform] || 'link',
    followers,
    avgLikes,
    avgComments,
    avgViews
  };
});

const buildBestPosts = (topCampaigns = []) => topCampaigns.slice(0, 6).map(campaign => {
  const reach = Number(campaign.reach || 0);
  return {
    id: campaign._id || campaign.id,
    title: campaign.title || 'Campaign',
    thumbnail: campaign.thumbnail || '/images/default-campaign.jpg',
    platform: (campaign.platform || 'link').toLowerCase(),
    likes: campaign.likes || Math.round(reach * 0.05),
    comments: campaign.comments || Math.round(reach * 0.01),
    views: campaign.views || reach,
    url: campaign.url || '#'
  };
});

const calculatePerformanceOverview = (brandData = {}, socialStats = []) => {
  const totalFollowers = socialStats.reduce((sum, stat) => sum + Number(stat.followers || 0), 0);
  const fallbackEngagement = socialStats.length
    ? socialStats.reduce((sum, stat) => sum + Number(stat.engagementRate || 3), 0) / socialStats.length
    : 3.5;
  const avgEngagementRateValue = Number(brandData.avgEngagementRate ?? fallbackEngagement);
  const avgEngagementRate = Number(avgEngagementRateValue.toFixed(1));

  const reach = brandData.performanceMetrics?.reach || Math.floor(totalFollowers * (avgEngagementRate / 100) * 10);
  const impressions = brandData.performanceMetrics?.impressions || Math.floor(reach * 3);
  const engagement = brandData.performanceMetrics?.engagement || Math.floor(impressions * (avgEngagementRate / 100));
  const conversionSeed = brandData.performanceMetrics?.conversionRate ?? brandData.conversionRate ?? 2.5;
  const conversionRate = Number(Number(conversionSeed || 0).toFixed(1));

  return {
    totalFollowers,
    avgEngagementRate,
    performanceMetrics: {
      reach,
      impressions,
      engagement,
      conversionRate
    }
  };
};

const transformBrandProfile = (brandDoc, socialStats = [], topCampaigns = []) => {
  if (!brandDoc) {
    return null;
  }
  const brandData = brandDoc.toObject ? brandDoc.toObject() : brandDoc;
  const categories = toArrayField(brandData.categories);
  const languages = toArrayField(brandData.languages);
  const socials = buildSocialSummaries(socialStats);
  const bestPosts = buildBestPosts(topCampaigns);
  const { totalFollowers, avgEngagementRate, performanceMetrics } = calculatePerformanceOverview(brandData, socialStats);

  return {
    ...brandData,
    displayName: brandData.displayName || brandData.brandName || brandData.name || 'Unknown Brand',
    fullName: brandData.fullName || brandData.displayName || brandData.brandName || 'Unknown Brand',
    name: brandData.brandName || brandData.displayName || 'Unknown Brand',
    username: brandData.username || '',
    bio: brandData.bio || brandData.mission || 'No bio available',
    description: brandData.description || brandData.bio || '',
    profilePicUrl: brandData.logoUrl || brandData.profilePicUrl || '/images/default-brand.png',
    totalFollowers,
    avgEngagementRate,
    completedCollabs: topCampaigns.length,
    rating: brandData.rating || brandData.avgCampaignRating || 0,
    socials,
    bestPosts,
    performanceMetrics,
    audienceDemographics: {
      gender: brandData.targetGender || 'Mixed',
      ageRange: brandData.targetAgeRange || '18-45'
    },
    categories,
    languages,
    mission: brandData.mission || brandData.bio || '',
    website: brandData.website || `https://${brandData.username || 'brand'}.com`,
    location: brandData.location || '',
    values: categories,
    socialLinks: Array.isArray(brandData.socialLinks) && brandData.socialLinks.length > 0
      ? brandData.socialLinks
      : socials.map(social => ({
        platform: social.platform,
        url: social.url || `https://${social.platform}.com/${brandData.username || ''}`,
        followers: social.followers
      })),
    topCampaigns: topCampaigns.map(campaign => ({
      id: campaign.id || campaign._id,
      title: campaign.title,
      status: campaign.status || 'Active',
      performance_score: campaign.performance_score || 0,
      reach: campaign.reach || 0
    }))
  };
};

const buildCampaignHistoryPayload = (campaigns = []) => ({
  campaigns,
  summary: {
    totalCampaigns: campaigns.length
  }
});

// Get influencer rankings based on revenue from their links
const getInfluencerRankings = async (brandId) => {
  try {
    // Get all campaigns for this brand
    const campaigns = await CampaignInfo.find({ brand_id: brandId }).select('_id title');

    if (campaigns.length === 0) {
      return [];
    }

    const campaignIds = campaigns.map(c => c._id);

    // Aggregate campaign influencers by revenue for these campaigns
    const rankings = await CampaignInfluencers.aggregate([
      {
        $match: {
          campaign_id: { $in: campaignIds },
          status: { $in: ['active', 'completed'] }
        }
      },
      {
        $lookup: {
          from: 'influencerinfos',
          localField: 'influencer_id',
          foreignField: '_id',
          as: 'influencer'
        }
      },
      {
        $unwind: '$influencer'
      },
      {
        $group: {
          _id: '$influencer_id',
          name: { $first: '$influencer.fullName' },
          totalRevenue: { $sum: '$revenue' },
          campaignCount: { $addToSet: '$campaign_id' }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          totalRevenue: 1,
          campaignCount: { $size: '$campaignCount' }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      },
      {
        $limit: 10
      }
    ]);

    return rankings;
  } catch (error) {
    console.error('Error getting influencer rankings:', error);
    return [];
  }
};



const brandController = {
  // Return campaign deliverables aggregated from CampaignInfluencers documents
  async getCampaignDeliverables(req, res) {
    try {
      const { campaignId } = req.params;
      const brandId = req.session.user.id;

      console.log('[getCampaignDeliverables] ========== START ==========');
      console.log('[getCampaignDeliverables] Campaign ID:', campaignId);
      console.log('[getCampaignDeliverables] Brand ID:', brandId);

      if (!campaignId) {
        return res.status(400).json({
          success: false,
          message: 'Campaign ID is required',
          debug: { campaignId, brandId }
        });
      }

      // Validate and convert campaignId to ObjectId
      if (!mongoose.Types.ObjectId.isValid(campaignId)) {
        console.log('[getCampaignDeliverables] INVALID campaign ID format');
        return res.status(400).json({
          success: false,
          message: 'Invalid campaign ID format',
          debug: { campaignId, isValid: false }
        });
      }
      const campaignObjectId = new mongoose.Types.ObjectId(campaignId);

      // Verify ownership
      console.log('[getCampaignDeliverables] Finding campaign...');
      const campaign = await CampaignInfo.findOne({
        _id: campaignObjectId,
        brand_id: brandId
      }).select('_id title deliverables');

      if (!campaign) {
        console.log('[getCampaignDeliverables] Campaign NOT FOUND or access denied');
        return res.status(404).json({
          success: false,
          message: 'Campaign not found or you do not have access',
          debug: { campaignId, brandId, found: false }
        });
      }

      console.log('[getCampaignDeliverables] Campaign FOUND:', campaign.title);
      console.log('[getCampaignDeliverables] Campaign has', campaign.deliverables?.length || 0, 'template deliverables');

      // Pull deliverables per influencer from CampaignInfluencers
      console.log('[getCampaignDeliverables] Finding collaborations...');
      const collabs = await CampaignInfluencers.find({
        campaign_id: campaignObjectId,
        status: { $in: ['active', 'completed'] }
      })
        .populate('influencer_id', 'fullName username profilePicUrl')
        .lean();

      console.log('[getCampaignDeliverables] Found', collabs.length, 'collaborations');

      if (collabs.length === 0) {
        console.log('[getCampaignDeliverables] NO COLLABORATIONS found');
        return res.json({
          success: true,
          campaign: { id: campaign._id, title: campaign.title },
          items: [],
          message: 'No active or completed influencers found for this campaign',
          debug: { collaborationsFound: 0 }
        });
      }

      // If campaign has global deliverables but collabs don't, seed them
      if (campaign.deliverables && campaign.deliverables.length > 0) {
        console.log('[getCampaignDeliverables] Seeding deliverables from campaign template...');
        for (const collab of collabs) {
          if (!collab.deliverables || collab.deliverables.length === 0) {
            console.log('[getCampaignDeliverables] Seeding for collab:', collab._id);
            const seededDeliverables = campaign.deliverables.map(d => ({
              task_description: d.task_description || '',
              platform: d.platform || '',
              num_posts: d.num_posts || 0,
              num_reels: d.num_reels || 0,
              num_videos: d.num_videos || 0,
              status: 'pending',
              completed: false
            }));

            await CampaignInfluencers.updateOne(
              { _id: collab._id },
              { $set: { deliverables: seededDeliverables } }
            );
            collab.deliverables = seededDeliverables;
          }
        }
      }

      const payload = collabs.map(c => {
        const deliverables = Array.isArray(c.deliverables) ? c.deliverables : [];
        console.log(`[getCampaignDeliverables] Collab ${c._id}:`, {
          influencer: c.influencer_id?.fullName || 'N/A',
          deliverables_count: deliverables.length,
          sample: deliverables[0] || 'none'
        });

        return {
          collab_id: c._id,
          influencer: {
            id: c.influencer_id?._id,
            name: c.influencer_id?.fullName || 'Unknown',
            username: c.influencer_id?.username || 'unknown',
            profilePicUrl: c.influencer_id?.profilePicUrl || '/images/default-profile.jpg'
          },
          progress: c.progress || 0,
          deliverables: deliverables.map((d, idx) => ({
            id: d._id || d.id || idx,
            title: d.title || '',
            description: d.description || '',
            task_description: d.task_description || d.description || d.title || '',
            platform: d.platform || '', // Removed fallback to deliverable_type to avoid enum validation error
            num_posts: parseInt(d.num_posts) || 0,
            num_reels: parseInt(d.num_reels) || 0,
            num_videos: parseInt(d.num_videos) || 0,
            status: d.status || 'pending',
            completed: d.completed || false,
            deliverable_type: d.deliverable_type || '',
            due_date: d.due_date || null,
            completed_at: d.completed_at || null,
            // Include submission details
            content_url: d.content_url || '',
            submitted_at: d.submitted_at || null,
            review_feedback: d.review_feedback || '',
            reviewed_at: d.reviewed_at || null
          }))
        };
      });

      console.log('[getCampaignDeliverables] Returning', payload.length, 'items');
      console.log('[getCampaignDeliverables] ========== END ==========');

      return res.json({
        success: true,
        campaign: { id: campaign._id, title: campaign.title },
        items: payload,
        debug: {
          campaignId,
          brandId,
          collaborationsCount: collabs.length,
          totalDeliverables: payload.reduce((sum, p) => sum + p.deliverables.length, 0)
        }
      });
    } catch (err) {
      console.error('[getCampaignDeliverables] ========== ERROR ==========');
      console.error('[getCampaignDeliverables] Error:', err);
      console.error('[getCampaignDeliverables] Stack:', err.stack);
      return res.status(500).json({
        success: false,
        message: 'Server error while fetching deliverables',
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  },

  // Update deliverables for one or more influencer collaborations and recompute progress
  async updateCampaignDeliverables(req, res) {
    try {
      const { campaignId } = req.params;
      const brandId = req.session.user.id;
      const { updates } = req.body; // [{ collab_id, deliverables: [...]}]

      if (!campaignId) {
        return res.status(400).json({ success: false, message: 'Campaign ID is required' });
      }
      if (!updates || !Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ success: false, message: 'No deliverable updates provided' });
      }

      // Verify ownership
      const campaign = await CampaignInfo.findOne({ _id: campaignId, brand_id: brandId }).select('_id');
      if (!campaign) {
        return res.status(404).json({ success: false, message: 'Campaign not found' });
      }

      const results = [];
      for (const u of updates) {
        if (!u || !u.collab_id || !Array.isArray(u.deliverables)) continue;

        const collab = await CampaignInfluencers.findOne({ _id: u.collab_id, campaign_id: campaignId });
        if (!collab) continue;

        // Update specific deliverables instead of overwriting the whole array
        u.deliverables.forEach(incoming => {
          const deliverableId = incoming.id || incoming._id;
          if (!deliverableId) return; // Skip if no ID provided in update

          const existing = collab.deliverables.id(deliverableId);
          if (existing) {
            // Update only fields that are provided
            if (incoming.status) {
              existing.status = incoming.status;

              // If status is being updated, find and update any linked CampaignContent as well
              if (incoming.status === 'approved' || incoming.status === 'rejected') {
                const contentStatus = incoming.status === 'approved' ? 'approved' : 'rejected';
                CampaignContent.updateOne(
                  { deliverable_id: deliverableId, status: { $ne: 'published' } },
                  { $set: { status: contentStatus } }
                ).exec().catch(err => console.error('Error syncing CampaignContent status:', err));
              }
            }
            if (incoming.review_feedback !== undefined) existing.review_feedback = incoming.review_feedback;
            if (incoming.reviewed_at) existing.reviewed_at = incoming.reviewed_at;
            if (incoming.content_url) existing.content_url = incoming.content_url;
            if (incoming.submitted_at) existing.submitted_at = incoming.submitted_at;
            if (incoming.completed_at) existing.completed_at = incoming.completed_at;

            // Also update metadata if provided (important for validation if these are required)
            if (incoming.title) existing.title = incoming.title;
            if (incoming.description) existing.description = incoming.description;
            if (incoming.task_description) existing.task_description = incoming.task_description;
            if (incoming.due_date) existing.due_date = incoming.due_date;
            if (incoming.platform) {
              const validPlatforms = ['Instagram', 'YouTube', 'TikTok', 'Facebook', 'Twitter', 'LinkedIn'];
              if (validPlatforms.includes(incoming.platform)) {
                existing.platform = incoming.platform;
              }
            }
            if (incoming.num_posts !== undefined) existing.num_posts = incoming.num_posts;
            if (incoming.num_reels !== undefined) existing.num_reels = incoming.num_reels;
            if (incoming.num_videos !== undefined) existing.num_videos = incoming.num_videos;
            if (incoming.deliverable_type) existing.deliverable_type = incoming.deliverable_type;
          }
        });

        // Recompute progress from the updated collaboration deliverables
        const progress = computeProgressFromDeliverables(collab.deliverables);
        collab.progress = progress;

        // Save the collaboration with subdocument updates
        await collab.save();

        results.push({ collab_id: collab._id, progress });
      }

      res.json({ success: true, results });
    } catch (err) {
      console.error('Error updating campaign deliverables:', err);
      res.status(500).json({ success: false, message: 'Error updating campaign deliverables' });
    }
  },  // Get explore page
  async getExplorePage(req, res) {
    try {
      const { category, search } = req.query;
      const searchQuery = search || '';
      const selectedCategory = category || 'all';

      // Get all influencers first to extract categories
      const allInfluencers = await brandModel.getAllInfluencers();
      // Extract unique categories (from influencer profiles)
      const categoriesSet = new Set();
      allInfluencers.forEach(influencer => {
        if (influencer.categories && Array.isArray(influencer.categories)) {
          influencer.categories.forEach(cat => categoriesSet.add(cat.trim()));
        }
      });
      const categories = Array.from(categoriesSet).sort();

      // Filter influencers based on search and category
      let filteredInfluencers = allInfluencers;
      if (selectedCategory && selectedCategory !== 'all') {
        filteredInfluencers = filteredInfluencers.filter(influencer =>
          influencer.categories && influencer.categories.some(cat =>
            cat.toLowerCase().includes(selectedCategory.toLowerCase())
          )
        );
      }

      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        filteredInfluencers = filteredInfluencers.filter(influencer =>
          (influencer.fullName && influencer.fullName.toLowerCase().includes(searchLower)) ||
          (influencer.username && influencer.username.toLowerCase().includes(searchLower)) ||
          (influencer.bio && influencer.bio.toLowerCase().includes(searchLower)) ||
          (influencer.categories && influencer.categories.some(cat =>
            cat.toLowerCase().includes(searchLower)
          ))
        );
      }

      // Get brand ID from session to check previous collaborations
      const brandId = req.session.user?.id;
      let influencersWithCollaboration = filteredInfluencers;

      if (brandId) {
        // Get previous collaborations for this brand
        const collaborations = await CampaignInfluencers.find({
          campaign_id: {
            $in: await CampaignInfo.find({ brand_id: brandId }).distinct('_id')
          },
          status: { $in: ['active', 'completed'] }
        })
          .populate('campaign_id', 'title')
          .populate('influencer_id', '_id')
          .lean();

        // Create a map of influencer_id to their collaboration details
        const collaborationMap = {};
        collaborations.forEach(collab => {
          const influencerId = collab.influencer_id._id.toString();
          if (!collaborationMap[influencerId]) {
            collaborationMap[influencerId] = [];
          }
          collaborationMap[influencerId].push({
            campaignTitle: collab.campaign_id.title,
            revenue: collab.revenue || 0
          });
        });

        // Add collaboration info to influencers
        influencersWithCollaboration = filteredInfluencers.map(influencer => ({
          ...influencer,
          previousCollaborations: collaborationMap[influencer._id.toString()] || []
        }));

        // Add Rohan Joshi as a demo influencer with previous collaborations
        const demoInfluencer = {
          _id: 'demo-rohan-joshi',
          fullName: 'Rohan Joshi',
          displayName: 'Rohan Joshi',
          profilePicUrl: '/images/default-profile.jpg',
          verified: true,
          categories: ['Comedy', 'Writing', 'Acting', 'Entertainment'],
          totalFollowers: 2200000,
          avgEngagementRate: 4.10,
          audienceDemographics: {
            gender: 'Mixed',
            ageRange: '20-40'
          },
          previousCollaborations: [
            { campaignTitle: 'Summer Fashion Campaign', revenue: 25000 },
            { campaignTitle: 'Tech Gadgets Review', revenue: 18000 }
          ]
        };

        influencersWithCollaboration = [demoInfluencer, ...influencersWithCollaboration];
      }

      res.render('brand/explore', {
        influencers: influencersWithCollaboration,
        searchQuery,
        selectedCategory,
        categories
      });
    } catch (err) {
      console.error('Error fetching influencers:', err);
      res.status(500).render('error', {
        message: 'Error fetching influencers',
        error: { status: 500 }
      });
    }
  },

  // Get brand profile
  async getBrandProfile(req, res) {
    try {
      const brandId = req.session.user.id;
      const brand = await brandModel.getBrandById(brandId);

      if (!brand) {
        return res.status(404).render('error', {
          error: { status: 404 },
          message: 'Brand not found'
        });
      }

      const socialStats = await brandModel.getSocialStats(brandId);
      const topCampaigns = await brandModel.getTopCampaigns(brandId);
      const transformedBrand = transformBrandProfile(brand, socialStats, topCampaigns);

      const responseData = {
        success: true,
        brand: transformedBrand
      };

      // Return JSON for API requests (React frontend)
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json(responseData);
      }

      // Render EJS for traditional requests (legacy support)
      res.render('brand/profile', {
        brand: transformedBrand
      });
    } catch (error) {
      console.error('Error fetching brand profile:', error);

      // Return JSON for API requests
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({
          success: false,
          message: 'Error loading brand profile'
        });
      }

      res.status(500).render('error', {
        error: { status: 500 },
        message: 'Error loading brand profile'
      });
    }
  },

  // Update brand profile
  async updateBrandProfile(req, res) {
    try {
      const brandId = req.session.user.id;
      const data = req.body;

      // Validate required fields
      const requiredFields = ['name', 'username'];
      const missingFields = requiredFields.filter(field => !data[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
          fields: missingFields
        });
      }

      // Prepare update data from request body
      const updateData = {
        brandName: data.name ? data.name.trim() : undefined,
        displayName: data.name ? data.name.trim() : undefined,
        username: data.username ? data.username.trim() : undefined,
        description: data.description ? data.description.trim() : undefined,
        bio: data.mission ? data.mission.trim() : (data.description ? data.description.trim() : undefined),
        location: (data.location || '').trim(),
        primaryMarket: (data.primaryMarket || '').trim(),
        phone: (data.phone || '').trim(),
        industry: (data.industry || '').trim(),
        tagline: (data.tagline || '').trim(),
        website: (data.website || '').trim(),
        audienceGender: (data.targetGender || '').trim(),
        audienceAgeRange: (data.targetAgeRange || '').trim(),
        categories: Array.isArray(data.categories) ? data.categories : [],
        mission: (data.mission || '').trim(),
        currentCampaign: (data.currentCampaign || '').trim(),
        values: Array.isArray(data.values) ? data.values : [],
        targetInterests: Array.isArray(data.targetInterests) ? data.targetInterests : []
      };

      console.log('Update data:', updateData);

      // Update social links if provided
      if (data.socialLinks && Array.isArray(data.socialLinks)) {
        try {
          const socialLinksPayload = data.socialLinks.map(link => {
            const url = link.url ? link.url.trim() : '';
            let handle = link.handle;

            if (!handle && url) {
              try {
                const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
                const pathParts = urlObj.pathname.split('/').filter(p => p);
                handle = pathParts.length > 0 ? pathParts[pathParts.length - 1] : 'brand';
              } catch (e) {
                handle = 'brand';
              }
            }

            return {
              platform: link.platform || 'instagram',
              url: url,
              followers: parseInt(link.followers) || 0,
              handle: handle || 'brand'
            };
          });

          await brandModel.updateSocialLinks(brandId, socialLinksPayload);
        } catch (error) {
          console.error('Error updating social links:', error);
        }
      }

      // Update the brand profile
      const updatedBrand = await brandModel.updateBrandProfile(brandId, updateData);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        brand: updatedBrand
      });
    } catch (error) {
      console.error('Error updating brand profile:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating profile',
        error: error.message
      });
    }
  },

  // Request verification
  async requestVerification(req, res) {
    try {
      const brandId = req.session.user.id;
      const verificationRequest = await brandModel.requestVerification(brandId, req.body);

      res.json({
        success: true,
        message: 'Verification request submitted',
        request: verificationRequest
      });
    } catch (error) {
      console.error('Error submitting verification request:', error);
      res.status(500).json({
        success: false,
        message: 'Error submitting verification request'
      });
    }
  },

  // Get verification status
  async getVerificationStatus(req, res) {
    try {
      const brandId = req.session.user.id;
      const status = await brandModel.getVerificationStatus(brandId);

      res.json({
        success: true,
        status
      });
    } catch (error) {
      console.error('Error getting verification status:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting verification status'
      });
    }
  },

  // Update social media links
  async updateSocialLinks(req, res) {
    try {
      const brandId = req.session.user.id;
      const { socials } = req.body;

      const updatedBrand = await brandModel.updateSocialLinks(brandId, socials);

      res.json({
        success: true,
        message: 'Social links updated successfully',
        brand: updatedBrand
      });
    } catch (error) {
      console.error('Error updating social links:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating social links'
      });
    }
  },

  // Get brand statistics
  async getBrandStats(req, res) {
    try {
      const brandId = req.session.user.id;
      const stats = await brandModel.getBrandStats(brandId);

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Error getting brand statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting brand statistics'
      });
    }
  },

  // Get top performing campaigns
  async getTopCampaigns(req, res) {
    try {
      const brandId = req.session.user.id;
      const campaigns = await brandModel.getTopCampaigns(brandId);

      res.json({
        success: true,
        campaigns
      });
    } catch (error) {
      console.error('Error getting top campaigns:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting top campaigns'
      });
    }
  },

  // Get brand analytics
  async getBrandAnalytics(req, res) {
    try {
      const brandId = req.session.user.id;
      const analytics = await brandModel.getBrandAnalytics(brandId);

      res.json({
        success: true,
        analytics
      });
    } catch (error) {
      console.error('Error getting brand analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting brand analytics'
      });
    }
  },

  // Get brand dashboard
  async getBrandDashboard(req, res) {
    try {
      // Get brand ID from session
      const brandId = req.session.user.id;
      const userType = 'brand';

      // Get success message if exists
      const successMessage = req.session.successMessage;
      // Clear the message after getting it
      delete req.session.successMessage;

      // Check subscription expiry and get limits
      const [subscriptionStatus, subscriptionLimits] = await Promise.all([
        SubscriptionService.checkSubscriptionExpiry(brandId, userType),
        SubscriptionService.getSubscriptionLimitsWithUsage(brandId, userType)
      ]);

      // Fetch all required data concurrently
      const [brand, stats, activeCampaigns, analytics, campaignRequests, recentCompletedCampaigns, completedProgressCampaigns, influencerRankings, brandProducts] = await Promise.all([
        brandModel.getBrandById(brandId),
        brandModel.getBrandStats(brandId),
        brandModel.getActiveCampaigns(brandId),
        brandModel.getBrandAnalytics(brandId),
        brandModel.getCampaignRequests(brandId),
        brandModel.getRecentCompletedCampaigns(brandId, 3),
        brandModel.getCompletedProgressCampaigns(brandId),
        getInfluencerRankings(brandId),
        (async () => {
          try {
            const products = await Product.find({ brand_id: brandId })
              .populate('campaign_id', 'title status')
              .sort({ createdAt: -1 })
              .lean();

            return products.map(product => ({
              _id: product._id,
              name: product.name,
              description: product.description,
              images: product.images,
              original_price: product.original_price,
              campaign_price: product.campaign_price,
              discount_percentage: product.discount_percentage,
              category: product.category,
              tags: product.tags,
              target_quantity: product.target_quantity,
              sold_quantity: product.sold_quantity,
              status: product.status,
              campaign: product.campaign_id ? {
                title: product.campaign_id.title,
                status: product.campaign_id.status
              } : null,
              createdAt: product.createdAt
            }));
          } catch (error) {
            console.error('Error fetching brand products:', error);
            return [];
          }
        })()
      ]);

      if (!brand) {
        return res.status(404).render('error', {
          status: 404,
          message: 'Brand not found'
        });
      }

      // Helper function to safely parse categories
      const parseCategories = (categories) => {
        if (!categories) return [];
        if (Array.isArray(categories)) return categories;
        if (typeof categories === 'string') {
          try {
            // First try parsing as JSON
            return JSON.parse(categories);
          } catch (e) {
            // If JSON parsing fails, try splitting by comma
            return categories.split(',').map(cat => cat.trim()).filter(Boolean);
          }
        }
        return [];
      };

      // Transform data for the template
      const transformedData = {
        brand: {
          ...brand,
          name: brand.brandName || brand.displayName || brand.name,
          username: brand.username,
          description: brand.bio,
          logoUrl: brand.profilePicUrl || brand.logoUrl || brand.logo_url,
          bannerUrl: brand.bannerUrl,
          verified: brand.verified,
          location: brand.location,
          primaryMarket: brand.primaryMarket,
          phone: brand.phone,
          industry: brand.industry,
          tagline: brand.tagline,
          targetInterests: parseCategories(brand.targetInterests),
          currentCampaign: brand.currentCampaign,
          values: parseCategories(brand.values),
          categories: parseCategories(brand.categories),
          mission: brand.mission,
          website: brand.website,
          targetAgeRange: brand.targetAgeRange,
          targetGender: brand.targetGender,
          socialLinks: brand.socialLinks || [] // Assuming we fetch partial or it's implicitly included?
        },
        stats: {
          activeCampaigns: stats?.total_campaigns || 0,
          campaignGrowth: stats?.campaign_growth || 0,
          avgEngagement: stats?.avg_engagement || 0,
          engagementTrend: stats?.engagement_trend || 0,
          totalReach: stats?.total_reach || 0,
          reachGrowth: stats?.reach_growth || 0,
          roi: stats?.roi || 0,
          roiTrend: stats?.roi_trend || 0,
          totalClicks: stats?.total_clicks || 0,
          totalRevenue: stats?.total_revenue || 0,
          totalSpend: stats?.total_spend || 0
        },
        activeCampaigns: activeCampaigns.map(campaign => ({
          ...campaign,
          // Progress remains as stored, checklist updates should have updated influencer/campaign progress server-side
          progress: Math.min(100, Math.max(0, campaign.progress || 0)),
          engagement_rate: campaign.engagement_rate || 0,
          reach: campaign.reach || 0,
          conversion_rate: campaign.conversion_rate || 0,
          daysRemaining: Math.max(0, Math.ceil((new Date(campaign.end_date) - new Date()) / (1000 * 60 * 60 * 24))),
          influencersCount: campaign.influencers_count || 0
        })),
        campaignRequests: await Promise.all(campaignRequests.map(async (request) => {
          const products = await Product.find({ campaign_id: request._id }).lean();
          return {
            _id: request._id,
            title: request.title,
            description: request.description,
            status: request.status,
            start_date: request.start_date, // Keep for legacy
            startDate: request.start_date, // Common frontend expectation
            duration: request.duration,
            budget: request.budget,
            target_audience: request.target_audience,
            required_channels: request.required_channels,
            min_followers: request.min_followers,
            objectives: request.objectives,
            influencers_count: request.influencers_count || 0,
            products: products.map(p => ({
              _id: p._id,
              name: p.name,
              campaign_price: p.campaign_price,
              images: p.images
            }))
          };
        })),
        analytics: {
          months: analytics.months || [],
          engagementRates: analytics.engagementRates || [],
          clickThroughRates: analytics.clickThroughRates || [],
          productsSold: analytics.productsSold || [],
          conversionRates: analytics.conversionRates || [],
          demographics: analytics.demographics || {
            labels: ['18-24', '25-34', '35-44', '45-54', '55+'],
            data: [25, 35, 20, 15, 5]
          }
        },
        successMessage, // Add success message to the template data
        completedProgressCampaigns, // Campaigns with 100% progress that need to be marked as completed
        subscriptionStatus, // Subscription expiry and renewal info
        subscriptionLimits // Campaign and collaboration limits
      };

      // Return JSON for API requests (React frontend)
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({
          success: true,
          ...transformedData,
          recentCompletedCampaigns,
          influencerRankings,
          brandProducts
        });
      }

      // Render EJS for traditional requests
      res.render('brand/dashboard', { ...transformedData, recentCompletedCampaigns });
    } catch (error) {
      console.error('Error in getBrandDashboard:', error);

      // Return JSON for API requests
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({
          success: false,
          message: 'Error loading dashboard'
        });
      }

      res.status(500).render('error', {
        status: 500,
        message: 'Error loading dashboard'
      });
    }
  },

  // Get campaign history
  async getCampaignHistory(req, res) {
    try {
      const brandId = req.session.user.id;
      console.log('Getting campaign history for brand:', brandId);

      if (!brandId) {
        console.error('No brand ID found in session');
        const errorMessage = 'Please log in to view campaign history';

        // Return JSON for API requests
        if (req.xhr || req.headers.accept?.includes('application/json')) {
          return res.status(401).json({
            success: false,
            message: errorMessage
          });
        }

        return res.status(401).render('error', {
          error: { status: 401 },
          message: errorMessage
        });
      }

      // Fetch all completed and cancelled campaigns
      const campaigns = await brandModel.getCampaignHistory(brandId);
      console.log('Retrieved campaigns:', campaigns.length);

      const transformedCampaigns = await Promise.all(campaigns.map(async (campaign) => {
        const products = await Product.find({ campaign_id: campaign._id }).lean();
        return {
          ...campaign,
          performance_score: campaign.performance_score || 0,
          engagement_rate: campaign.engagement_rate || 0,
          reach: campaign.reach || 0,
          conversion_rate: campaign.conversion_rate || 0,
          influencers_count: campaign.influencers?.length || 0,
          budget: campaign.budget || 0,
          end_date: campaign.end_date,
          status: campaign.status,
          title: campaign.title,
          description: campaign.description,
          influencers: campaign.influencers || [],
          products: products.map(p => ({
            _id: p._id,
            name: p.name,
            campaign_price: p.campaign_price,
            images: p.images
          }))
        };
      }));
      const historyPayload = buildCampaignHistoryPayload(transformedCampaigns);

      // Return JSON for API requests (React frontend)
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({
          success: true,
          ...historyPayload
        });
      }

      // Render EJS for traditional requests
      res.render('brand/campaign_history', historyPayload);
    } catch (error) {
      console.error('Error in getCampaignHistory controller:', error);

      // Return JSON for API requests
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({
          success: false,
          message: 'Error loading campaign history'
        });
      }

      res.status(500).render('error', {
        error: { status: 500 },
        message: 'Error loading campaign history'
      });
    }
  },

  // Get list of influencers for a specific campaign (Level 1)
  async getCampaignInfluencers(req, res) {
    try {
      const { campaignId } = req.params;
      const brandId = req.session.user.id;

      if (!campaignId) {
        return res.status(400).json({ success: false, message: 'Campaign ID is required' });
      }

      // Verify campaign ownership
      const campaign = await CampaignInfo.findOne({
        _id: campaignId,
        brand_id: brandId
      });

      if (!campaign) {
        return res.status(404).json({ success: false, message: 'Campaign not found' });
      }

      // Fetch influencers with deliverables
      const influencers = await CampaignInfluencers.find({
        campaign_id: campaignId,
        status: { $in: ['active', 'completed'] }
      })
        .populate('influencer_id', 'fullName username profilePicUrl')
        .lean();

      const formattedInfluencers = influencers.map(inf => ({
        influencer_id: inf.influencer_id._id,
        name: inf.influencer_id.fullName,
        username: inf.influencer_id.username,
        profilePicUrl: inf.influencer_id.profilePicUrl || '/images/default-profile.jpg',
        status: inf.status,
        progress: inf.progress || 0,
        joined_at: inf.createdAt,
        // Include deliverables data (Stage 2 addition)
        deliverables: (inf.deliverables || []).map(d => ({
          _id: d._id,
          title: d.title,
          description: d.description,
          task_description: d.task_description || d.description || d.title || '',
          platform: d.platform || '',
          num_posts: d.num_posts,
          num_reels: d.num_reels,
          num_videos: d.num_videos,
          status: d.status,
          deliverable_type: d.deliverable_type,
          due_date: d.due_date,
          content_url: d.content_url,
          submitted_at: d.submitted_at,
          reviewed_at: d.reviewed_at,
          review_feedback: d.review_feedback,
          completed_at: d.completed_at
        }))
      }));

      res.json({
        success: true,
        influencers: formattedInfluencers
      });
    } catch (error) {
      console.error('Error fetching campaign influencers:', error);
      res.status(500).json({ success: false, message: 'Error fetching influencers' });
    }
  },

  // Get detailed contribution of an influencer for a campaign (Level 2)
  async getInfluencerContribution(req, res) {
    try {
      const { campaignId, influencerId } = req.params;
      const brandId = req.session.user.id;

      if (!campaignId || !influencerId) {
        return res.status(400).json({ success: false, message: 'Campaign ID and Influencer ID are required' });
      }

      // Verify campaign ownership
      const campaign = await CampaignInfo.findOne({
        _id: campaignId,
        brand_id: brandId
      }).select('title');

      if (!campaign) {
        return res.status(404).json({ success: false, message: 'Campaign not found' });
      }

      // Fetch active/completed participation
      const participation = await CampaignInfluencers.findOne({
        campaign_id: campaignId,
        influencer_id: influencerId,
        status: { $in: ['active', 'completed'] }
      })
        .populate('influencer_id', 'fullName profilePicUrl')
        .lean();

      if (!participation) {
        return res.status(404).json({ success: false, message: 'Influencer is not part of this campaign' });
      }

      // Fetch payment details (Single payment model)
      const payment = await CampaignPayments.findOne({
        campaign_id: campaignId,
        influencer_id: influencerId,
        status: 'completed'
      }).select('amount');

      const totalPaid = payment ? payment.amount : 0;

      res.json({
        success: true,
        influencer: {
          name: participation.influencer_id.fullName,
          profilePicUrl: participation.influencer_id.profilePicUrl || '/images/default-profile.jpg'
        },
        campaign: {
          title: campaign.title
        },
        contribution: {
          progress: participation.progress || 0,
          deliverables: participation.deliverables || [],
          metrics: {
            engagement_rate: participation.engagement_rate || 0,
            reach: participation.reach || 0,
            clicks: participation.clicks || 0,
            conversions: participation.conversions || 0
          },
          earnings: totalPaid
        }
      });
    } catch (error) {
      console.error('Error fetching influencer contribution:', error);
      res.status(500).json({ success: false, message: 'Error fetching contribution details' });
    }
  },

  // Get products for brand
  async getBrandProducts(req, res) {
    try {
      const brandId = req.session.user.id;
      const { Product } = require('../config/ProductMongo');

      const products = await Product.find({
        brand_id: brandId,
        status: { $in: ['active', 'inactive'] }
      })
        .populate('campaign_id', 'title status')
        .sort({ createdAt: -1 })
        .lean();

      const formattedProducts = products.map(product => ({
        _id: product._id,
        name: product.name,
        description: product.description,
        images: product.images,
        original_price: product.original_price,
        campaign_price: product.campaign_price,
        discount_percentage: product.discount_percentage,
        category: product.category,
        tags: product.tags,
        target_quantity: product.target_quantity,
        sold_quantity: product.sold_quantity,
        status: product.status,
        campaign: product.campaign_id ? {
          title: product.campaign_id.title,
          status: product.campaign_id.status
        } : null,
        createdAt: product.createdAt
      }));

      res.json({
        success: true,
        products: formattedProducts
      });
    } catch (error) {
      console.error('Error fetching brand products:', error);
      res.status(500).json({ success: false, message: 'Error fetching products' });
    }
  },

  /**
   * Get brand orders - fetch all orders containing brand's products
   */
  async getBrandOrders(req, res) {
    try {
      const brandId = req.user?.id || req.session?.user?.id;
      if (!brandId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      // Find all products belonging to this brand
      const brandProducts = await Product.find({ brand_id: brandId })
        .select('_id')
        .lean();

      const brandProductIds = brandProducts.map(p => p._id.toString());

      if (brandProductIds.length === 0) {
        return res.json({
          success: true,
          activeOrders: [],
          completedOrders: []
        });
      }

      // Find orders that contain at least one of the brand's products
      const orders = await Order.find({
        'items.product_id': { $in: brandProductIds }
      })
        .sort({ createdAt: -1 })
        .populate('items.product_id', 'name images campaign_price campaign_id')
        .populate('customer_id', 'name email phone')
        .lean();

      // Filter orders to only include brand's products in items
      const filteredOrders = orders.map(order => {
        const brandItems = order.items.filter(item =>
          item.product_id && brandProductIds.includes(item.product_id._id.toString())
        );

        return {
          ...order,
          items: brandItems,
          // Recalculate total for brand's products only
          brand_total: brandItems.reduce((sum, item) => sum + (item.subtotal || 0), 0)
        };
      }).filter(order => order.items.length > 0);

      // Separate into active and completed
      const activeOrders = filteredOrders.filter(order =>
        ['paid', 'shipped'].includes(order.status)
      );
      const completedOrders = filteredOrders.filter(order =>
        ['delivered', 'cancelled'].includes(order.status)
      );

      res.json({
        success: true,
        activeOrders,
        completedOrders
      });
    } catch (error) {
      console.error('Error fetching brand orders:', error);
      res.status(500).json({ success: false, message: 'Error fetching orders' });
    }
  },

  /**
   * Update order status with validation
   */
  async updateOrderStatus(req, res) {
    try {
      const brandId = req.user?.id || req.session?.user?.id;
      if (!brandId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { orderId } = req.params;
      const { newStatus, notes } = req.body;

      // Validate status
      const validStatuses = ['paid', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(newStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      // Find order and verify brand owns at least one product in it
      const order = await Order.findById(orderId)
        .populate('items.product_id', 'brand_id')
        .populate('customer_id');

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // Check if brand owns any product in this order
      const ownsProduct = order.items.some(item =>
        item.product_id && item.product_id.brand_id &&
        item.product_id.brand_id.toString() === brandId.toString()
      );

      if (!ownsProduct) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this order'
        });
      }

      // Validate status transition
      const validTransitions = {
        'paid': ['shipped', 'cancelled'],
        'shipped': ['delivered', 'cancelled'],
        'delivered': [],
        'cancelled': []
      };

      if (!validTransitions[order.status]?.includes(newStatus)) {
        return res.status(400).json({
          success: false,
          message: `Cannot transition from ${order.status} to ${newStatus}`
        });
      }

      order.status = newStatus;
      order.status_history.push({
        status: newStatus,
        timestamp: new Date(),
        notes: notes || `Status updated to ${newStatus}`
      });

      await order.save();

      // Phase 9: Send Email Notification
      try {
        const customerData = {
          name: order.customer_id?.name || order.guest_info?.name || 'Customer',
          email: order.customer_id?.email || order.guest_info?.email
        };
        await sendOrderStatusEmail(order, customerData, newStatus);
      } catch (emailError) {
        console.error('[Phase 9] Failed to send status update email:', emailError);
      }

      // Phase 7: Auto-Campaign Completion check
      if (newStatus === 'delivered') {
        try {
          // Pass the order to check if any products reached their target
          await brandController._checkCampaignCompletion(order);
        } catch (completionError) {
          console.error('Error in _checkCampaignCompletion:', completionError);
          // Don't fail the response if completion check fails
        }
      }

      res.json({
        success: true,
        message: `Order status updated to ${newStatus}`,
        order: {
          _id: order._id,
          status: order.status,
          tracking_number: order.tracking_number,
          status_history: order.status_history
        }
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ success: false, message: 'Error updating order status' });
    }
  },

  /**
   * Get order analytics for brand dashboard
   */
  async getOrderAnalytics(req, res) {
    try {
      const brandId = req.user?.id || req.session?.user?.id;
      if (!brandId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      // Get all brand products to filter orders
      const brandProducts = await Product.find({ brand_id: brandId }).select('_id');
      const productIds = brandProducts.map(p => p._id);

      // Calculate date ranges
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Aggregate all-time revenue and order count
      const allTimeStats = await Order.aggregate([
        { $match: { 'items.product_id': { $in: productIds } } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total_amount' },
            orderCount: { $sum: 1 }
          }
        }
      ]);

      // Today's revenue
      const todayStats = await Order.aggregate([
        {
          $match: {
            'items.product_id': { $in: productIds },
            createdAt: { $gte: startOfToday }
          }
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$total_amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      // This month's revenue
      const monthStats = await Order.aggregate([
        {
          $match: {
            'items.product_id': { $in: productIds },
            createdAt: { $gte: startOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$total_amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      // Status breakdown
      const statusBreakdown = await Order.aggregate([
        { $match: { 'items.product_id': { $in: productIds } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Top-selling products
      const topProducts = await Order.aggregate([
        { $match: { 'items.product_id': { $in: productIds } } },
        { $unwind: '$items' },
        { $match: { 'items.product_id': { $in: productIds } } },
        {
          $group: {
            _id: '$items.product_id',
            totalQuantity: { $sum: '$items.quantity' },
            totalRevenue: { $sum: '$items.subtotal' }
          }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $project: {
            productId: '$_id',
            name: '$product.name',
            image: { $arrayElemAt: ['$product.images.url', 0] },
            totalQuantity: 1,
            totalRevenue: 1
          }
        }
      ]);

      // 30-day order trend
      const orderTrend = await Order.aggregate([
        {
          $match: {
            'items.product_id': { $in: productIds },
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 },
            revenue: { $sum: '$total_amount' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Calculate average order value
      const avgOrderValue = allTimeStats[0]?.totalRevenue && allTimeStats[0]?.orderCount
        ? allTimeStats[0].totalRevenue / allTimeStats[0].orderCount
        : 0;

      // Format status breakdown
      const statusBreakdownFormatted = {
        paid: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0
      };
      statusBreakdown.forEach(item => {
        statusBreakdownFormatted[item._id] = item.count;
      });

      res.json({
        success: true,
        analytics: {
          revenue: {
            allTime: allTimeStats[0]?.totalRevenue || 0,
            today: todayStats[0]?.revenue || 0,
            thisMonth: monthStats[0]?.revenue || 0
          },
          orders: {
            total: allTimeStats[0]?.orderCount || 0,
            today: todayStats[0]?.count || 0,
            thisMonth: monthStats[0]?.count || 0
          },
          avgOrderValue: avgOrderValue,
          statusBreakdown: statusBreakdownFormatted,
          topProducts: topProducts,
          orderTrend: orderTrend
        }
      });
    } catch (error) {
      console.error('Error fetching order analytics:', error);
      res.status(500).json({ success: false, message: 'Error fetching analytics' });
    }
  },

  /**
   * Helper to check if products reached their target quantity and if campaign should be completed
   * @private
   */
  async _checkCampaignCompletion(order) {
    if (!order || !order.items || order.items.length === 0) return;

    for (const item of order.items) {
      try {
        const productId = item.product_id._id || item.product_id;
        const product = await Product.findById(productId);

        if (!product || product.status === 'inactive' || product.target_quantity === 0) continue;

        // Aggregate total delivered quantity for this product
        const deliveryStats = await Order.aggregate([
          { $match: { status: 'delivered', 'items.product_id': product._id } },
          { $unwind: '$items' },
          { $match: { 'items.product_id': product._id } },
          { $group: { _id: null, totalDelivered: { $sum: '$items.quantity' } } }
        ]);

        const totalDelivered = deliveryStats[0]?.totalDelivered || 0;

        // If target reached, deactivate product
        if (totalDelivered >= product.target_quantity) {
          product.status = 'inactive';
          await product.save();
          console.log(`[Phase 7] Product ${product.name} (${product._id}) marked inactive (Target: ${product.target_quantity}, Delivered: ${totalDelivered})`);

          // Check if all products in this campaign are now inactive/sold out
          const campaignId = product.campaign_id;
          const campaignProducts = await Product.find({ campaign_id: campaignId });

          const allInactive = campaignProducts.every(p =>
            p.status === 'inactive' || p.status === 'out_of_stock' || p.status === 'discontinued'
          );

          if (allInactive) {
            const campaign = await CampaignInfo.findById(campaignId);
            if (campaign && campaign.status === 'active') {
              campaign.status = 'completed';
              await campaign.save();
              console.log(`[Phase 7] Campaign ${campaign.title} (${campaign._id}) marked completed as all products reached targets.`);

              // Create notification for the brand
              try {
                await notificationController.createNotification({
                  recipientId: campaign.brand_id,
                  recipientType: 'brand',
                  type: 'campaign_completed',
                  title: 'Campaign Completed',
                  body: `Your campaign "${campaign.title}" has been automatically completed as all products reached their sales targets.`,
                  relatedId: campaign._id
                });
              } catch (notifErr) {
                console.error('[Phase 7] Failed to create completion notification:', notifErr);
              }
            }
          }
        }
      } catch (err) {
        console.error(`[Phase 7] Error checking completion for item ${item.product_id}:`, err);
      }
    }
  }
};


brandController.transformBrandProfileForClient = transformBrandProfile;

module.exports = brandController;