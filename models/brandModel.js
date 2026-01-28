// model/brandModel.js

const { BrandInfo, BrandAnalytics, BrandVerification, BrandSocialLink } = require('../config/BrandMongo');
const { CampaignInfo, CampaignMetrics, CampaignInfluencers } = require('../config/CampaignMongo');
const { InfluencerInfo, InfluencerAnalytics } = require('../config/InfluencerMongo');
const { BrandSocials } = require('../config/BrandMongo');
const { SubscriptionPlan, UserSubscription, PaymentHistory } = require('../config/SubscriptionMongo');
const mongoose = require('mongoose');

// Subscription schemas moved to config/SubscriptionMongo.js

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userType'
  },
  userType: {
    type: String,
    required: true,
    enum: ['BrandInfo', 'InfluencerInfo']
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserSubscription',
    required: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  paymentMethod: {
    type: String,
    default: 'credit_card'
  },
  cardDetails: {
    last4: String,
    brand: String,
    expiryMonth: Number,
    expiryYear: Number
  },
  billingAddress: String,
  processingFee: {
    type: Number,
    default: 0
  },
  notes: String,
  processedAt: Date,
  refundedAt: Date
}, {
  timestamps: true
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// Subscription Service Class
class SubscriptionService {
  // Get all active plans for a user type
  static async getPlansForUserType(userType) {
    return await SubscriptionPlan.find({ 
      userType: userType, 
      isActive: true 
    }).sort({ 'price.monthly': 1 });
  }

  // Get user's current subscription
  static async getUserSubscription(userId, userType) {
    try {
      console.log(`\n========== [getUserSubscription] START ==========`);
      console.log(`[SubscriptionService] Fetching subscription for userId: ${userId}, userType: ${userType}`);
      console.log(`[SubscriptionService] userId type:`, typeof userId);
      
      // Convert userId to string for consistent comparison
      const userIdString = userId.toString();
      
      // First, check ALL subscriptions for this user (for debugging)
      const allUserSubs = await UserSubscription.find({ userId: userIdString }).populate('planId');
      console.log(`[SubscriptionService] Total subscriptions found for user: ${allUserSubs.length}`);
      allUserSubs.forEach((sub, index) => {
        console.log(`  [${index + 1}] ID: ${sub._id}, Plan: ${sub.planId?.name}, Status: ${sub.status}, Created: ${sub.createdAt}`);
      });
      
      // Find the LATEST active subscription (sort by createdAt descending)
      let subscription = await UserSubscription.findOne({
        userId: userIdString,
        status: 'active'
      })
      .sort({ createdAt: -1 })  // Get the most recent one
      .populate('planId');
      
      console.log(`[SubscriptionService] Query result:`, subscription ? 'FOUND' : 'NOT FOUND');
      
      if (subscription) {
        console.log(`[SubscriptionService] Selected subscription:`, {
          id: subscription._id,
          userId: subscription.userId,
          planName: subscription.planId?.name,
          status: subscription.status,
          endDate: subscription.endDate,
          createdAt: subscription.createdAt
        });
        
        // Check if subscription has expired based on end date
        const now = new Date();
        if (subscription.endDate && new Date(subscription.endDate) < now) {
          console.log(`[SubscriptionService] Subscription has expired (endDate: ${subscription.endDate}), updating status...`);
          subscription.status = 'expired';
          await UserSubscription.findByIdAndUpdate(subscription._id, { status: 'expired' });
          console.log(`[SubscriptionService] Subscription status updated to 'expired'`);
        }
        
        // Expire all OTHER active subscriptions for this user (keep only the latest one)
        const otherActiveSubs = await UserSubscription.find({
          userId: userIdString,
          status: 'active',
          _id: { $ne: subscription._id }
        });
        
        if (otherActiveSubs.length > 0) {
          console.log(`[SubscriptionService] Found ${otherActiveSubs.length} old active subscriptions, expiring them...`);
          await UserSubscription.updateMany(
            {
              userId: userIdString,
              status: 'active',
              _id: { $ne: subscription._id }
            },
            { status: 'expired' }
          );
          console.log(`[SubscriptionService] Old subscriptions expired successfully`);
        }
      }
      
      // If no active subscription exists, check if user had an expired one
      if (!subscription) {
        console.log(`[SubscriptionService] No active subscription found`);
        
        // Check if user has any expired subscriptions
        const expiredSubscription = await UserSubscription.findOne({
          userId: userIdString,
          status: 'expired'
        })
        .sort({ createdAt: -1 })
        .populate('planId');
        
        if (expiredSubscription) {
          console.log(`[SubscriptionService] User has expired subscription. Cannot create free subscription.`);
          console.log(`[SubscriptionService] User must renew their subscription to continue.`);
          // Return the expired subscription so the system knows the user needs to renew
          return expiredSubscription;
        }
        
        // Only create free subscription for NEW users (no previous subscriptions)
        console.log(`[SubscriptionService] New user detected, creating free subscription...`);
        
        // Determine userType if not provided
        if (!userType || userType === 'undefined') {
          console.log(`[SubscriptionService] UserType not provided, determining from user data...`);
          // Try to determine from the user's collection
          const { BrandInfo } = require('../config/BrandMongo');
          const { InfluencerInfo } = require('../config/InfluencerMongo');
          
          const brand = await BrandInfo.findById(userId);
          const influencer = await InfluencerInfo.findById(userId);
          
          if (brand) {
            userType = 'brand';
            console.log(`[SubscriptionService] Determined userType: brand`);
          } else if (influencer) {
            userType = 'influencer';
            console.log(`[SubscriptionService] Determined userType: influencer`);
          } else {
            console.error(`[SubscriptionService] Could not determine userType for userId: ${userId}`);
            return null;
          }
        }
        
        subscription = await this.createDefaultFreeSubscription(userId, userType);
        console.log(`[SubscriptionService] Free subscription created:`, subscription ? 'YES' : 'NO');
      }
      
      return subscription;
    } catch (error) {
      console.error(`[SubscriptionService] Error in getUserSubscription:`, error);
      return null;
    }
  }

  // Create new subscription
  static async createSubscription(subscriptionData) {
    const subscription = new UserSubscription(subscriptionData);
    return await subscription.save();
  }

  // Check if user can perform action based on subscription limits
  static async checkSubscriptionLimit(userId, userType, action) {
    const subscription = await this.getUserSubscription(userId, userType);
    if (!subscription) return { allowed: false, reason: 'No subscription found. Please contact support.' };

    // Check if subscription status is expired
    if (subscription.status === 'expired') {
      return { 
        allowed: false, 
        reason: 'Your subscription has expired. Please renew your subscription to continue.',
        redirectToPayment: true
      };
    }

    // Check if subscription is expired by date
    const now = new Date();
    if (subscription.endDate && new Date(subscription.endDate) < now) {
      // Update subscription status to expired
      await UserSubscription.findByIdAndUpdate(subscription._id, { status: 'expired' });
      return { 
        allowed: false, 
        reason: 'Your subscription has expired. Please renew your subscription to continue.',
        redirectToPayment: true
      };
    }

    const plan = subscription.planId;
    const usage = subscription.usage;

    switch (action) {
      case 'create_campaign':
        if (plan.features.maxCampaigns === -1) return { allowed: true };
        return {
          allowed: usage.campaignsUsed < plan.features.maxCampaigns,
          reason: usage.campaignsUsed >= plan.features.maxCampaigns ? `You have reached your limit of ${plan.features.maxCampaigns} campaigns` : null
        };
      
      case 'connect_influencer':
        if (plan.features.maxInfluencers === -1) return { allowed: true };
        return {
          allowed: usage.influencersConnected < plan.features.maxInfluencers,
          reason: usage.influencersConnected >= plan.features.maxInfluencers ? `You have reached your limit of ${plan.features.maxInfluencers} influencer connections` : null
        };
      
      case 'connect_brand':
        if (plan.features.maxBrands === -1) return { allowed: true };
        return {
          allowed: usage.brandsConnected < plan.features.maxBrands,
          reason: usage.brandsConnected >= plan.features.maxBrands ? `You have reached your limit of ${plan.features.maxBrands} brand connections` : null
        };
      
      case 'upload_content':
        return {
          allowed: usage.uploadsThisMonth < plan.limits.monthlyUploads,
          reason: usage.uploadsThisMonth >= plan.limits.monthlyUploads ? 'Monthly upload limit reached' : null
        };
      
      default:
        return { allowed: true };
    }
  }

  // Update subscription usage
  static async updateUsage(userId, userType, usageUpdate) {
    console.log(`\n[updateUsage] Starting update for userId: ${userId}, userType: ${userType}`);
    console.log(`[updateUsage] Input usageUpdate:`, usageUpdate);
    
    // Map userType to schema format
    const mappedUserType = userType === 'brand' ? 'BrandInfo' : 'InfluencerInfo';
    console.log(`[updateUsage] Mapped userType: ${mappedUserType}`);
    
    // Transform usageUpdate to nested format: { campaignsUsed: 1 } -> { 'usage.campaignsUsed': 1 }
    const nestedUpdate = {};
    for (const [key, value] of Object.entries(usageUpdate)) {
      nestedUpdate[`usage.${key}`] = value;
    }
    console.log(`[updateUsage] Nested update object:`, nestedUpdate);
    
    const result = await UserSubscription.findOneAndUpdate(
      { userId: userId, userType: mappedUserType, status: 'active' },
      { $inc: nestedUpdate },
      { new: true }
    );
    
    console.log(`[updateUsage] Update result:`, result ? {
      id: result._id,
      usage: result.usage
    } : 'NULL');
    
    return result;
  }

  // Check and expire all subscriptions that have passed their end date
  static async checkAndExpireSubscriptions() {
    try {
      const now = new Date();
      console.log(`[SubscriptionService] Checking for expired subscriptions at ${now}`);
      
      // Find all active subscriptions where endDate has passed
      const expiredSubscriptions = await UserSubscription.find({
        status: 'active',
        endDate: { $lt: now }
      });
      
      if (expiredSubscriptions.length > 0) {
        console.log(`[SubscriptionService] Found ${expiredSubscriptions.length} expired subscriptions, updating...`);
        
        // Update all expired subscriptions to 'expired' status
        const result = await UserSubscription.updateMany(
          {
            status: 'active',
            endDate: { $lt: now }
          },
          {
            $set: { status: 'expired' }
          }
        );
        
        console.log(`[SubscriptionService] Updated ${result.modifiedCount} subscriptions to expired status`);
        return result.modifiedCount;
      } else {
        console.log(`[SubscriptionService] No expired subscriptions found`);
        return 0;
      }
    } catch (error) {
      console.error('[SubscriptionService] Error checking expired subscriptions:', error);
      return 0;
    }
  }

  // Get subscription analytics
  static async getSubscriptionAnalytics() {
    const totalActive = await UserSubscription.countDocuments({ status: 'active' });
    const totalRevenue = await PaymentHistory.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const planDistribution = await UserSubscription.aggregate([
      { $match: { status: 'active' } },
      { $lookup: { from: 'subscriptionplans', localField: 'planId', foreignField: '_id', as: 'plan' } },
      { $unwind: '$plan' },
      { $group: { _id: '$plan.name', count: { $sum: 1 } } }
    ]);

    return {
      totalActive,
      totalRevenue: totalRevenue[0]?.total || 0,
      planDistribution
    };
  }
  
  // Check subscription expiry and handle renewal
  static async checkSubscriptionExpiry(userId, userType) {
    try {
      console.log(`\n========== [checkSubscriptionExpiry] START ==========`);
      console.log(`[checkSubscriptionExpiry] userId: ${userId}, userType: ${userType}`);
      
      // Query by userId only to find the LATEST active subscription
      const subscription = await UserSubscription.findOne({
        userId: userId.toString(),
        status: 'active'
      })
      .sort({ createdAt: -1 })  // Get the most recent one
      .populate('planId');

      console.log(`[checkSubscriptionExpiry] Found subscription:`, subscription ? {
        id: subscription._id,
        planName: subscription.planId?.name,
        status: subscription.status,
        endDate: subscription.endDate
      } : 'NONE');

      if (!subscription) {
        return { expired: false, needsRenewal: false, subscription: null };
      }

      // Expire all OTHER active subscriptions for this user (keep only the latest one)
      const otherActiveSubs = await UserSubscription.find({
        userId: userId.toString(),
        status: 'active',
        _id: { $ne: subscription._id }  // Not equal to the current subscription
      });
      
      if (otherActiveSubs.length > 0) {
        console.log(`[checkSubscriptionExpiry] Found ${otherActiveSubs.length} old active subscriptions, expiring them...`);
        await UserSubscription.updateMany(
          {
            userId: userId.toString(),
            status: 'active',
            _id: { $ne: subscription._id }
          },
          { status: 'expired' }
        );
        console.log(`[checkSubscriptionExpiry] Old subscriptions expired successfully`);
      }

      const now = new Date();
      const endDate = new Date(subscription.endDate);
      const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

      // Check if subscription has expired
      if (now > endDate) {
        // Move to expired status and create free subscription
        await UserSubscription.findByIdAndUpdate(subscription._id, {
          status: 'expired'
        });

        // Create free subscription
        await this.createDefaultFreeSubscription(userId, userType);

        return {
          expired: true,
          needsRenewal: true,
          subscription: subscription,
          message: 'Your subscription has expired. You have been moved to the free plan. Please renew to continue enjoying premium benefits.'
        };
      }

      // Check if renewal notification is needed (7 days before expiry)
      const needsRenewal = daysUntilExpiry <= 7 && daysUntilExpiry > 0;

      return {
        expired: false,
        needsRenewal: needsRenewal,
        subscription: subscription,
        daysUntilExpiry: daysUntilExpiry,
        message: needsRenewal ? `Your subscription expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}. Please renew to continue enjoying premium benefits.` : null
      };
    } catch (error) {
      console.error('Error checking subscription expiry:', error);
      return { expired: false, needsRenewal: false, subscription: null };
    }
  }

  // Get subscription limits with current usage
  static async getSubscriptionLimitsWithUsage(userId, userType) {
    try {
      console.log(`[getSubscriptionLimitsWithUsage] Fetching for userId: ${userId}, userType: ${userType}`);
      
      const subscription = await this.getUserSubscription(userId, userType);
      
      if (!subscription || !subscription.planId) {
        console.log(`[getSubscriptionLimitsWithUsage] No subscription or planId, returning default free limits`);
        return {
          campaigns: { limit: 2, used: 0, remaining: 2 },
          collaborations: { limit: 2, used: 0, remaining: 2 }
        };
      }

      const plan = subscription.planId;
      const usage = subscription.usage || {};
      
      console.log(`[getSubscriptionLimitsWithUsage] Plan:`, plan.name);
      console.log(`[getSubscriptionLimitsWithUsage] Usage:`, usage);

      // Calculate campaign limits
      const campaignLimit = plan.features.maxCampaigns === -1 ? 'Unlimited' : plan.features.maxCampaigns;
      const campaignsUsed = usage.campaignsUsed || 0;
      const campaignsRemaining = campaignLimit === 'Unlimited' ? 'Unlimited' : Math.max(0, campaignLimit - campaignsUsed);

      // Calculate collaboration limits based on user type
      let collaborationLimit, collaborationsUsed;
      if (userType === 'brand') {
        collaborationLimit = plan.features.maxInfluencers === -1 ? 'Unlimited' : plan.features.maxInfluencers;
        collaborationsUsed = usage.influencersConnected || 0;
      } else {
        collaborationLimit = plan.features.maxBrands === -1 ? 'Unlimited' : plan.features.maxBrands;
        collaborationsUsed = usage.brandsConnected || 0;
      }
      const collaborationsRemaining = collaborationLimit === 'Unlimited' ? 'Unlimited' : Math.max(0, collaborationLimit - collaborationsUsed);

      const result = {
        campaigns: {
          limit: campaignLimit,
          used: campaignsUsed,
          remaining: campaignsRemaining
        },
        collaborations: {
          limit: collaborationLimit,
          used: collaborationsUsed,
          remaining: collaborationsRemaining
        }
      };
      
      console.log(`[getSubscriptionLimitsWithUsage] Returning:`, JSON.stringify(result, null, 2));
      return result;
      
    } catch (error) {
      console.error('[getSubscriptionLimitsWithUsage] Error:', error);
      return {
        campaigns: { limit: 2, used: 0, remaining: 2 },
        collaborations: { limit: 2, used: 0, remaining: 2 }
      };
    }
  }

  // Initialize default subscription plans
  static async initializeDefaultPlans() {
    const brandPlans = [
      {
        name: 'Free',
        userType: 'brand',
        price: { monthly: 0, yearly: 0 },
        features: {
          maxCampaigns: 2,
          maxInfluencers: 2,
          analytics: true,
          advancedAnalytics: false,
          prioritySupport: false,
          customBranding: false,
          apiAccess: false,
          collaborationTools: true
        },
        limits: {
          storageGB: 1,
          monthlyUploads: 10,
          teamMembers: 1
        },
        description: 'Perfect for trying out CollabSync with basic features',
        isDefault: true
      },
      {
        name: 'Basic',
        userType: 'brand',
        price: { monthly: 29, yearly: 290 },
        features: {
          maxCampaigns: 5,
          maxInfluencers: 10,
          analytics: true,
          advancedAnalytics: false,
          prioritySupport: false,
          customBranding: false,
          collaborationTools: true
        },
        description: 'Perfect for small businesses starting with influencer marketing',
        popularBadge: true
      },
      {
        name: 'Premium',
        userType: 'brand',
        price: { monthly: 99, yearly: 990 },
        features: {
          maxCampaigns: -1,
          maxInfluencers: -1,
          analytics: true,
          advancedAnalytics: true,
          prioritySupport: true,
          customBranding: true,
          collaborationTools: true
        },
        description: 'For established brands with extensive influencer networks'
      }
    ];

    const influencerPlans = [
      {
        name: 'Free',
        userType: 'influencer',
        price: { monthly: 0, yearly: 0 },
        features: {
          maxBrands: 2,
          analytics: true,
          advancedAnalytics: false,
          prioritySupport: false,
          collaborationTools: true
        },
        limits: {
          storageGB: 1,
          monthlyUploads: 10,
          teamMembers: 1
        },
        description: 'Perfect for new influencers getting started',
        isDefault: true
      },
      {
        name: 'Basic',
        userType: 'influencer',
        price: { monthly: 19, yearly: 190 },
        features: {
          maxBrands: 5,
          analytics: true,
          advancedAnalytics: false,
          prioritySupport: false,
          collaborationTools: true
        },
        description: 'Great for new influencers building their brand',
        popularBadge: true
      },
      {
        name: 'Premium',
        userType: 'influencer',
        price: { monthly: 49, yearly: 490 },
        features: {
          maxBrands: -1,
          analytics: true,
          advancedAnalytics: true,
          prioritySupport: true,
          customBranding: true,
          collaborationTools: true
        },
        description: 'For top-tier influencers and agencies'
      }
    ];

    try {
      // Check if plans already exist
      const existingPlans = await SubscriptionPlan.countDocuments();
      if (existingPlans === 0) {
        await SubscriptionPlan.insertMany([...brandPlans, ...influencerPlans]);
        console.log('Default subscription plans initialized');
      }
    } catch (error) {
      console.error('Error initializing subscription plans:', error);
    }
  }
}

class brandModel {
  // Get recommended brands for an influencer
  static async getRecommendedBrands(influencerId) {
    try {
      const influencer = await InfluencerInfo.findById(influencerId).select('categories');

      if (!influencer || !influencer.categories || influencer.categories.length === 0) {
        return [];
      }

      const categories = influencer.categories;

      const brands = await BrandInfo.find({
        categories: { $in: categories },
        status: 'active'
      })
        .sort({ avgCampaignRating: -1 })
        .limit(5)
        .select('_id brandName industry logoUrl');

      return brands;
    } catch (err) {
      console.error('Error fetching recommended brands:', err);
      return [];
    }
  }

  // Get recent completed campaigns for a brand (limited)
  static async getRecentCompletedCampaigns(brandId, limit = 3) {
    try {
      const brandObjectId = new mongoose.Types.ObjectId(brandId);

      const campaigns = await CampaignInfo.find({
        brand_id: brandObjectId,
        status: 'completed'
      })
        .sort({ end_date: -1 })
        .limit(limit)
        .lean();

      if (!campaigns.length) return [];

      const campaignIds = campaigns.map(c => c._id);
      console.log(campaignIds);

      const [metrics, influencerCounts] = await Promise.all([
        CampaignMetrics.find({ campaign_id: { $in: campaignIds } }).lean(),
        CampaignInfluencers.aggregate([
          { $match: { campaign_id: { $in: campaignIds } } },
          { $group: { _id: '$campaign_id', count: { $sum: 1 } } }
        ])
      ]);

      const metricsMap = new Map();
      metrics.forEach(m => metricsMap.set(m.campaign_id.toString(), m));

      const influencerCountMap = new Map();
      influencerCounts.forEach(c => influencerCountMap.set(c._id.toString(), c.count));

      return campaigns.map(campaign => {
        const m = metricsMap.get(campaign._id.toString()) || {};
        return {
          _id: campaign._id,
          name: campaign.title,
          description: campaign.description,
          end_date: campaign.end_date,
          budget: campaign.budget || 0,
          status: campaign.status,
          duration: campaign.duration || 0,
          target_audience: campaign.target_audience || '',
          required_channels: campaign.required_channels || [],
          min_followers: campaign.min_followers || 0,
          engagement_rate: m.engagement_rate || 0,
          reach: m.reach || 0,
          conversion_rate: m.conversion_rate || 0,
          performance_score: m.performance_score || 0,
          influencersCount: influencerCountMap.get(campaign._id.toString()) || 0
        };
      });
    } catch (err) {
      console.error('Error fetching recent completed campaigns:', err);
      return [];
    }
  }

  // Get all brands
  static async getAllBrands() {
    try {
      const brands = await BrandInfo.find({ status: 'active' })
        .select('brandName username logoUrl bannerUrl categories location website mission tagline verified completedCampaigns influencerPartnerships avgCampaignRating primaryMarket influenceRegions')
        .sort({ verified: -1, avgCampaignRating: -1, completedCampaigns: -1 })
        .limit(50)
        .lean();
      return brands;
    } catch (err) {
      console.error('Error fetching brands:', err);
      throw err;
    }
  }

  // Get brand by ID
  static async getBrandById(id) {
    try {
      const brand = await BrandInfo.findById(id);
      return brand;
    } catch (err) {
      throw err;
    }
  }

  // Update brand profile
  static async updateBrandProfile(brandId, updateData) {
    try {
      // Check if brand exists
      const brand = await BrandInfo.findById(brandId);
      if (!brand) {
        throw new Error('Brand not found');
      }

      // Define allowed fields and their validation rules
      const allowedFields = {
        brandName: { type: 'string', required: false },
        industry: { type: 'string', required: false },
        description: { type: 'string', required: false },
        logoUrl: { type: 'string', required: false },
        website: { type: 'string', required: false },
        categories: { type: 'array', required: false },
        contactEmail: { type: 'string', required: false },
        contactPhone: { type: 'string', required: false },
        status: { type: 'string', required: false, enum: ['active', 'inactive', 'suspended'] }
      };

      // Sanitize and validate update data
      const sanitizedData = {};
      for (const [field, value] of Object.entries(updateData)) {
        if (allowedFields[field]) {
          const fieldConfig = allowedFields[field];

          // Type validation
          if (fieldConfig.type === 'string' && typeof value !== 'string') {
            throw new Error(`Invalid type for ${field}. Expected string.`);
          }
          if (fieldConfig.type === 'array' && !Array.isArray(value)) {
            throw new Error(`Invalid type for ${field}. Expected array.`);
          }

          // Enum validation
          if (fieldConfig.enum && !fieldConfig.enum.includes(value)) {
            throw new Error(`Invalid value for ${field}. Allowed values: ${fieldConfig.enum.join(', ')}`);
          }

          sanitizedData[field] = value;
        }
      }

      // Update the brand profile
      const updated = await BrandInfo.findByIdAndUpdate(
        brandId,
        { $set: sanitizedData },
        {
          new: true,
          runValidators: true
        }
      );

      return updated;
    } catch (err) {
      console.error('Error updating brand profile:', err);
      throw err;
    }
  }

  // Get social stats for a brand
  static async getSocialStats(brandId) {
    try {
      const socials = await BrandSocials.findOne({ brandId });
      if (!socials) {
        return [];
      }
      return socials.platforms || [];
    } catch (err) {
      console.error('Error fetching social stats:', err);
      return [];
    }
  }

  // Get top campaigns for a brand
  static async getTopCampaigns(brandId) {
    try {
      // First, get campaign IDs that are 'active' or 'completed'
      const validCampaigns = await CampaignInfo.find({
        brand_id: brandId,
        status: { $in: ['active', 'completed'] }
      }).select('_id').lean();

      const validCampaignIds = validCampaigns.map(c => c._id);

      if (validCampaignIds.length === 0) {
        return [];
      }

      // Get metrics for those campaigns and populate campaign info
      const topCampaigns = await CampaignMetrics.find({
        brand_id: brandId,
        campaign_id: { $in: validCampaignIds }
      })
        .sort({ performance_score: -1 })
        .limit(5)
        .populate('campaign_id', 'title status')
        .lean();

      // Map results to include title and status at top level
      return topCampaigns.map(metric => ({
        _id: metric._id,
        id: metric.campaign_id?._id || metric.campaign_id,
        title: metric.campaign_id?.title || 'Untitled Campaign',
        status: metric.campaign_id?.status || 'active',
        performance_score: metric.performance_score || 0,
        reach: metric.reach || 0,
        engagement_rate: metric.engagement_rate || 0
      }));
    } catch (err) {
      console.error('Error fetching top campaigns:', err);
      return [];
    }
  }


  // Get verification status
  static async getVerificationStatus(brandId) {
    try {
      const brand = await BrandInfo.findById(brandId).select('verified');
      return { status: brand?.verified ? 'verified' : 'unverified' };
    } catch (err) {
      console.error('Error getting verification status:', err);
      return { status: 'unverified' };
    }
  }

  // Request verification
  static async requestVerification(brandId, verificationData) {
    try {
      const updated = await BrandInfo.findByIdAndUpdate(
        brandId,
        {
          $set: {
            verified: true,
            verificationData
          }
        },
        { new: true }
      );
      return updated;
    } catch (err) {
      console.error('Error requesting verification:', err);
      throw err;
    }
  }

  // Update social links
  static async updateSocialLinks(brandId, socials) {
    try {
      await BrandSocialLink.deleteMany({ brandId });

      const socialLinksArray = Array.isArray(socials)
        ? socials
        : Object.entries(socials).map(([platform, data]) => ({
          brandId,
          platform,
          url: data.url,
          followers: data.followers || 0
        }));

      await BrandSocialLink.insertMany(socialLinksArray);
      return true;
    } catch (err) {
      throw err;
    }

    /*
    db2.run('DELETE FROM brand_social_links WHERE brand_id = ?', [brandId], ...);
    */
  }

  // Get brand statistics
  static async getBrandStats(brandId) {
    try {
      const analytics = await BrandAnalytics.findOne({ brandId });
      const activeCampaigns = await CampaignInfo.countDocuments({
        brand_id: brandId,
        status: 'active',
        end_date: { $gt: new Date() }
      });

      const lastMonthAnalytics = await BrandAnalytics.findOne(
        { brandId },
        { monthlyStats: { $slice: [-2, 2] } }
      );

      const currentMonth = lastMonthAnalytics?.monthlyStats[1] || {};
      const previousMonth = lastMonthAnalytics?.monthlyStats[0] || {};

      return {
        total_campaigns: activeCampaigns || 0,
        campaign_growth: activeCampaigns - analytics?.campaignMetrics?.totalCampaigns || 0, // Example growth calculation
        avg_engagement: analytics?.avgEngagementRate || 0,
        engagement_trend: currentMonth.engagementRate - previousMonth.engagementRate || 0,
        total_reach: analytics?.performanceMetrics?.reach || 0,
        reach_growth: ((currentMonth.reach - previousMonth.reach) / (previousMonth.reach || 1)) * 100 || 0,
        roi: analytics?.campaignMetrics?.avgROI || 0,
        roi_trend: 5, // Example trend
        total_clicks: analytics?.performanceMetrics?.clicks || 0,
        total_revenue: analytics?.campaignMetrics?.totalRevenue || 0,
        total_spend: analytics?.campaignMetrics?.totalSpend || 0
      };
    } catch (err) {
      console.error('Error fetching brand stats:', err);
      return {
        total_campaigns: 0,
        campaign_growth: 0,
        avg_engagement: 0,
        engagement_trend: 0,
        total_reach: 0,
        reach_growth: 0,
        roi: 0,
        roi_trend: 0,
        total_clicks: 0,
        total_revenue: 0,
        total_spend: 0
      };
    }
  }

  // Get brand analytics
  static async getBrandAnalytics(brandId) {
    try {
      const analytics = await BrandAnalytics.findOne({ brandId });

      if (!analytics) {
        // Return default analytics if none exist
        return {
          months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          engagementRates: [5, 6, 7, 8, 9, 10],
          clickThroughRates: [2, 3, 4, 5, 6, 7],
          productsSold: [100, 150, 200, 250, 300, 350],
          conversionRates: [1, 2, 3, 4, 5, 6],
          demographics: {
            labels: ['18-24', '25-34', '35-44', '45-54', '55+'],
            data: [25, 35, 20, 15, 5]
          }
        };
      }

      // Transform the analytics data for the dashboard
      const monthlyStats = analytics.monthlyStats || [];
      const last6Months = monthlyStats.slice(-6);

      return {
        months: last6Months.map(stat => {
          const date = new Date(stat.month);
          return date.toLocaleString('default', { month: 'short' });
        }),
        engagementRates: last6Months.map(stat => stat.engagementRate || 0),
        clickThroughRates: last6Months.map(stat => {
          const clicks = stat.clicks || 0;
          const impressions = stat.impressions || 1;
          return (clicks / impressions) * 100;
        }),
        productsSold: last6Months.map(stat => stat.conversions || 0),
        conversionRates: last6Months.map(stat => stat.conversionRate || 0),
        demographics: {
          labels: ['18-24', '25-34', '35-44', '45-54', '55+'],
          data: [25, 35, 20, 15, 5] // Example demographic data
        }
      };
    } catch (err) {
      console.error('Error fetching brand analytics:', err);
      // Return default analytics in case of error
      return {
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        engagementRates: [5, 6, 7, 8, 9, 10],
        clickThroughRates: [2, 3, 4, 5, 6, 7],
        productsSold: [100, 150, 200, 250, 300, 350],
        conversionRates: [1, 2, 3, 4, 5, 6],
        demographics: {
          labels: ['18-24', '25-34', '35-44', '45-54', '55+'],
          data: [25, 35, 20, 15, 5]
        }
      };
    }
  }

  // Get active campaigns for a brand
  static async getActiveCampaigns(brandId) {
    try {
      const activeCampaigns = await CampaignInfo.find({
        brand_id: brandId,
        status: 'active',
        end_date: { $gt: new Date() }
      })
        .sort({ start_date: -1 })
        .lean();

      // Get metrics for all campaigns
      const campaignIds = activeCampaigns.map(campaign => campaign._id);
      const [metrics, influencerCounts] = await Promise.all([
        CampaignMetrics.find({
          campaign_id: { $in: campaignIds }
        }).lean(),
        CampaignInfluencers.aggregate([
          {
            $match: {
              campaign_id: { $in: campaignIds },
              status: 'active'
            }
          },
          {
            $group: {
              _id: '$campaign_id',
              count: { $sum: 1 }
            }
          }
        ])
      ]);

      // Create maps for quick lookup
      const metricsMap = new Map();
      metrics.forEach(metric => {
        metricsMap.set(metric.campaign_id.toString(), metric);
      });

      const influencerCountMap = new Map();
      influencerCounts.forEach(count => {
        influencerCountMap.set(count._id.toString(), count.count);
      });

      return activeCampaigns.map(campaign => {
        const campaignMetrics = metricsMap.get(campaign._id.toString()) || {};
        // Prefer influencer-driven overall_progress from CampaignMetrics; fallback to time-based progress
        const overallProgress = campaignMetrics.overall_progress;
        return {
          ...campaign,
          progress: (overallProgress !== undefined && overallProgress !== null) ? overallProgress : this.calculateCampaignProgress(campaign),
          engagement_rate: campaignMetrics.engagement_rate || 0,
          reach: campaignMetrics.reach || 0,
          conversion_rate: campaignMetrics.conversion_rate || 0,
          influencers_count: influencerCountMap.get(campaign._id.toString()) || 0
        };
      });
    } catch (err) {
      console.error('Error fetching active campaigns:', err);
      return [];
    }
  }

  // Helper function to calculate campaign progress
  static calculateCampaignProgress(campaign) {
    if (!campaign.start_date || !campaign.end_date) return 0;

    const now = new Date();
    const start = new Date(campaign.start_date);
    const end = new Date(campaign.end_date);

    if (now < start) return 0;
    if (now > end) return 100;

    const total = end - start;
    const elapsed = now - start;
    return Math.round((elapsed / total) * 100);
  }



  // Get campaign history for a brand
  static async getCampaignHistory(brandId) {
    try {
      console.log('Fetching campaign history for brand:', brandId);

      // Convert brandId to ObjectId
      const brandObjectId = new mongoose.Types.ObjectId(brandId);

      // Find completed and cancelled campaigns
      const campaigns = await CampaignInfo.find({
        brand_id: brandObjectId,
        status: { $in: ['completed', 'cancelled'] }
      })
        .sort({ end_date: -1 })
        .lean();

      console.log('Found campaigns:', campaigns.length);

      if (campaigns.length === 0) {
        return [];
      }

      // Get metrics for all campaigns
      const campaignIds = campaigns.map(campaign => campaign._id);
      const metrics = await CampaignMetrics.find({
        campaign_id: { $in: campaignIds }
      }).lean();

      console.log('Found metrics for campaigns:', metrics.length);

      // Create a map of campaign metrics
      const metricsMap = new Map();
      metrics.forEach(metric => {
        metricsMap.set(metric.campaign_id.toString(), metric);
      });

      // Get influencer details for each campaign
      const influencerDetails = await CampaignInfluencers.find({
        campaign_id: { $in: campaignIds }
      })
        .populate('influencer_id', 'name profilePicUrl')
        .lean();

      console.log('Found influencer details for campaigns:', influencerDetails.length);

      // Create a map of campaign influencers
      const influencerMap = new Map();
      influencerDetails.forEach(detail => {
        const campaignId = detail.campaign_id.toString();
        if (!influencerMap.has(campaignId)) {
          influencerMap.set(campaignId, []);
        }
        if (detail.influencer_id) {
          influencerMap.get(campaignId).push({
            id: detail.influencer_id._id,
            name: detail.influencer_id.name,
            profilePicUrl: detail.influencer_id.profilePicUrl
          });
        }
      });

      // Map campaigns with their metrics and influencers
      const result = campaigns.map(campaign => {
        const campaignMetrics = metricsMap.get(campaign._id.toString()) || {};
        return {
          ...campaign,
          performance_score: campaignMetrics.performance_score || 0,
          engagement_rate: campaignMetrics.engagement_rate || 0,
          reach: campaignMetrics.reach || 0,
          conversion_rate: campaignMetrics.conversion_rate || 0,
          influencers: influencerMap.get(campaign._id.toString()) || []
        };
      });

      console.log('Returning processed campaigns:', result.length);
      return result;
    } catch (err) {
      console.error('Error fetching campaign history:', err);
      return [];
    }
  }

  // Get campaign requests for a brand
  static async getCampaignRequests(brandId) {
    try {
      const requests = await CampaignInfo.find({
        brand_id: new mongoose.Types.ObjectId(brandId),
        status: 'request'
      }).sort({ created_at: -1 }).lean();

      // Get influencer counts for each campaign
      const campaignIds = requests.map(request => request._id);
      const influencerCounts = await CampaignInfluencers.aggregate([
        {
          $match: {
            campaign_id: { $in: campaignIds },
            status: 'active'
          }
        },
        {
          $group: {
            _id: '$campaign_id',
            count: { $sum: 1 }
          }
        }
      ]);

      // Create a map for quick lookup
      const influencerCountMap = new Map();
      influencerCounts.forEach(count => {
        influencerCountMap.set(count._id.toString(), count.count);
      });

      // Add influencer count to each request
      return requests.map(request => ({
        ...request,
        influencers_count: influencerCountMap.get(request._id.toString()) || 0
      }));
    } catch (error) {
      console.error('Error getting campaign requests:', error);
      return [];
    }
  }

  // Get campaigns that have reached 100% progress but are still active
  static async getCompletedProgressCampaigns(brandId) {
    try {
      const brandObjectId = new mongoose.Types.ObjectId(brandId);

      // Find active campaigns
      const activeCampaigns = await CampaignInfo.find({
        brand_id: brandObjectId,
        status: 'active'
      }).lean();

      if (activeCampaigns.length === 0) {
        return [];
      }

      const campaignIds = activeCampaigns.map(c => c._id);

      // Get metrics with 100% overall progress
      const metrics = await CampaignMetrics.find({
        campaign_id: { $in: campaignIds },
        overall_progress: { $gte: 100 }
      }).lean();

      const completedProgressCampaignIds = new Set(
        metrics.map(m => m.campaign_id.toString())
      );

      // Return campaigns that have reached 100% progress
      return activeCampaigns
        .filter(campaign => completedProgressCampaignIds.has(campaign._id.toString()))
        .map(campaign => ({
          _id: campaign._id,
          title: campaign.title,
          description: campaign.description,
          start_date: campaign.start_date,
          end_date: campaign.end_date,
          budget: campaign.budget
        }));
    } catch (error) {
      console.error('Error getting completed progress campaigns:', error);
      return [];
    }
  }
}

module.exports = {
  brandModel,
  SubscriptionService,
  SubscriptionPlan,
  UserSubscription,
  Transaction,
  PaymentHistory
};