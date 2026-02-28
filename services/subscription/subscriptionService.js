const { SubscriptionPlan, UserSubscription, PaymentHistory } = require('../../models/SubscriptionMongo');

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
                    const { BrandInfo } = require('../../models/BrandMongo');
                    const { InfluencerInfo } = require('../../models/InfluencerMongo');

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

    // Update subscription (for upgrades)
    static async updateSubscription(subscriptionId, updateData) {
        try {
            const updatedSubscription = await UserSubscription.findByIdAndUpdate(
                subscriptionId,
                { ...updateData, updatedAt: new Date() },
                { new: true, runValidators: true }
            ).populate('planId');

            if (!updatedSubscription) {
                throw new Error('Subscription not found');
            }

            return updatedSubscription;
        } catch (error) {
            console.error('Error updating subscription:', error);
            throw error;
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

module.exports = SubscriptionService;
