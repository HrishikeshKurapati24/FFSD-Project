const SubscriptionService = require('../services/subscription/subscriptionService');
const { BrandInfo } = require('../models/BrandMongo');
const { InfluencerInfo } = require('../models/InfluencerMongo');
const { PaymentHistory } = require('../models/SubscriptionMongo');
const {
    createPaymentIntent,
    createRazorpayOrderForIntent,
    verifyClientPaymentAndCaptureIntent,
    markIntentBusinessApplied,
    getRazorpayConfig
} = require('../services/payment/paymentIntentService');

const selectPlan = async (req, res) => {
    const { userId, userType } = req.query;

    if (!userId || !userType) {
        const error = new Error('Missing userId or userType parameters');
        error.statusCode = 500;
        throw error;
    }

    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
        const error = new Error('Invalid userId format - must be a valid MongoDB ObjectId');
        error.statusCode = 500;
        throw error;
    }

    if (!['brand', 'influencer'].includes(userType)) {
        const error = new Error('Invalid userType. Must be "brand" or "influencer"');
        error.statusCode = 500;
        throw error;
    }

    const allPlans = await SubscriptionService.getPlansForUserType(userType);

    if (!allPlans || allPlans.length === 0) {
        const error = new Error(`No subscription plans found for userType: ${userType}`);
        error.statusCode = 500;
        throw error;
    }

    const availablePlans = allPlans.filter(plan =>
        ['Free', 'Basic', 'Premium'].includes(plan.name)
    );

    return res.json({
        success: true,
        availablePlans,
        userType,
        userId
    });
};

const subscribeAfterSignup = async (req, res) => {
    const { userId, userType, planId, billingCycle } = req.body;

    if (!userId || !userType || !planId || !billingCycle) {
        return res.status(400).json({
            success: false,
            message: 'Missing required parameters'
        });
    }

    const plans = await SubscriptionService.getPlansForUserType(userType);
    const selectedPlan = plans.find(p => p._id.toString() === planId);

    if (!selectedPlan) {
        return res.status(400).json({
            success: false,
            message: 'Invalid plan selected'
        });
    }

    if (selectedPlan.name === 'Free') {
        const subscriptionData = {
            userId,
            userType: userType === 'brand' ? 'BrandInfo' : 'InfluencerInfo',
            planId,
            billingCycle,
            status: 'active',
            startDate: new Date(),
            endDate: new Date(Date.now() + (billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000),
            amount: 0,
            usage: {
                campaignsUsed: 0,
                influencersConnected: 0,
                brandsConnected: 0,
                storageUsedGB: 0,
                uploadsThisMonth: 0
            }
        };

        const subscription = await SubscriptionService.createSubscription(subscriptionData);

        res.json({
            success: true,
            message: 'Free subscription activated successfully',
            subscription,
            redirectTo: '/signin'
        });
    } else {
        res.json({
            success: true,
            message: 'Redirecting to payment',
            redirectTo: `/subscription/payment?userId=${userId}&userType=${userType}&planId=${planId}&billingCycle=${billingCycle}`
        });
    }
};

const resolveSubscriptionUserContext = async ({ userId, userType, sessionUser }) => {
    let resolvedUserId = userId;
    let resolvedUserType = userType;

    if (!resolvedUserId && sessionUser?.id) {
        resolvedUserId = sessionUser.id;
    }
    if (!resolvedUserType || resolvedUserType === 'undefined' || resolvedUserType === 'null') {
        resolvedUserType = sessionUser?.userType || sessionUser?.role;
    }

    if (!resolvedUserId) {
        throw new Error('Missing userId');
    }
    if (!/^[0-9a-fA-F]{24}$/.test(String(resolvedUserId))) {
        throw new Error('Invalid userId format');
    }

    if (!resolvedUserType || resolvedUserType === 'undefined' || resolvedUserType === 'null') {
        const [brand, influencer] = await Promise.all([
            BrandInfo.findById(resolvedUserId).select('_id'),
            InfluencerInfo.findById(resolvedUserId).select('_id')
        ]);
        if (brand) resolvedUserType = 'brand';
        if (influencer) resolvedUserType = 'influencer';
    }

    resolvedUserType = String(resolvedUserType || '').toLowerCase();
    if (!['brand', 'influencer'].includes(resolvedUserType)) {
        throw new Error('Invalid userType. Must be "brand" or "influencer"');
    }

    const model = resolvedUserType === 'brand' ? BrandInfo : InfluencerInfo;
    const userDoc = await model.findById(resolvedUserId).select('email phone brandName displayName fullName');
    if (!userDoc) {
        throw new Error('User not found');
    }

    return {
        userId: resolvedUserId,
        userType: resolvedUserType,
        userModel: resolvedUserType === 'brand' ? 'BrandInfo' : 'InfluencerInfo',
        userDoc
    };
};

const getSelectedPlanOrThrow = async ({ userType, planId }) => {
    if (!planId) {
        throw new Error('Missing planId');
    }

    const plans = await SubscriptionService.getPlansForUserType(userType);
    if (!plans?.length) {
        throw new Error(`No subscription plans found for userType: ${userType}`);
    }

    const selectedPlan = plans.find(p => String(p._id) === String(planId));
    if (!selectedPlan) {
        throw new Error('Invalid plan selected');
    }

    return selectedPlan;
};

const getPaymentPage = async (req, res) => {
    const { userId, userType, planId, billingCycle } = req.query;
    const context = await resolveSubscriptionUserContext({
        userId,
        userType,
        sessionUser: req.session?.user
    });

    if (!['monthly', 'yearly'].includes(String(billingCycle || ''))) {
        const error = new Error('Invalid billingCycle. Must be "monthly" or "yearly"');
        error.statusCode = 400;
        throw error;
    }

    const selectedPlan = await getSelectedPlanOrThrow({
        userType: context.userType,
        planId
    });

    const razorpayConfig = getRazorpayConfig();

    return res.json({
        success: true,
        userId: context.userId,
        userType: context.userType,
        selectedPlan,
        billingCycle,
        checkoutPrefill: {
            name: context.userDoc.displayName || context.userDoc.brandName || context.userDoc.fullName || '',
            email: context.userDoc.email || '',
            contact: context.userDoc.phone || ''
        },
        razorpay: {
            keyId: razorpayConfig.keyId,
            enabled: razorpayConfig.enabled,
            mode: razorpayConfig.mode
        }
    });
};

const initiatePayment = async (req, res) => {
    try {
        const { userId, userType, planId, billingCycle } = req.body;
        const context = await resolveSubscriptionUserContext({
            userId,
            userType,
            sessionUser: req.session?.user
        });

        if (!['monthly', 'yearly'].includes(String(billingCycle || ''))) {
            return res.status(400).json({
                success: false,
                message: 'Invalid billingCycle. Must be "monthly" or "yearly"'
            });
        }

        const selectedPlan = await getSelectedPlanOrThrow({
            userType: context.userType,
            planId
        });

        const amount = billingCycle === 'yearly'
            ? Number(selectedPlan.price.yearly || 0)
            : Number(selectedPlan.price.monthly || 0);

        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Selected plan does not require payment'
            });
        }

        const intent = await createPaymentIntent({
            type: 'subscription',
            payerId: context.userId,
            payerType: context.userModel,
            amount,
            currency: 'INR',
            context: {
                userId: context.userId,
                userType: context.userType,
                planId: selectedPlan._id.toString(),
                billingCycle,
                amount
            },
            metadata: {
                source: 'subscription_payment',
                planName: selectedPlan.name
            }
        });

        const { order } = await createRazorpayOrderForIntent(intent._id);
        const razorpayConfig = getRazorpayConfig();

        return res.json({
            success: true,
            stage: 'initiated',
            paymentIntentId: intent._id,
            razorpayOrderId: order.id,
            amountPaise: order.amount,
            currency: order.currency,
            razorpayKeyId: razorpayConfig.keyId,
            prefill: {
                name: context.userDoc.displayName || context.userDoc.brandName || context.userDoc.fullName || '',
                email: context.userDoc.email || '',
                contact: context.userDoc.phone || ''
            }
        });
    } catch (error) {
        console.error('Error initiating subscription payment:', error);
        const message = error.message || 'Payment initiation failed';
        const statusCode = message.includes('Invalid') || message.includes('Missing') || message.includes('required')
            ? 400
            : 500;
        return res.status(statusCode).json({ success: false, message });
    }
};

const confirmPayment = async (req, res) => {
    try {
        const {
            paymentIntentId,
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId,
            razorpay_signature: razorpaySignature
        } = req.body;

        if (!paymentIntentId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({
                success: false,
                message: 'Missing Razorpay payment verification fields'
            });
        }

        const { intent } = await verifyClientPaymentAndCaptureIntent({
            paymentIntentId,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature
        });

        if (intent.type !== 'subscription') {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment intent type'
            });
        }

        if (!intent.businessApplied) {
            await SubscriptionService.applySubscriptionFromPaymentIntent(intent);
            await markIntentBusinessApplied(intent._id);
        }

        return res.json({
            success: true,
            message: 'Subscription payment confirmed',
            paymentId: razorpayPaymentId,
            redirectTo: `/subscription/payment-success?paymentIntentId=${intent._id.toString()}`
        });
    } catch (error) {
        console.error('Error confirming subscription payment:', error);
        const message = error.message || 'Payment confirmation failed';
        const statusCode = message.includes('Invalid') || message.includes('Missing') || message.includes('verification')
            ? 400
            : 500;
        return res.status(statusCode).json({ success: false, message });
    }
};

const processPayment = async (req, res) => {
    const paymentStage = String(req.body?.paymentStage || 'initiate').trim().toLowerCase();
    if (paymentStage === 'confirm') {
        return confirmPayment(req, res);
    }
    return initiatePayment(req, res);
};

const getPaymentSuccessPage = async (req, res) => {
    try {
        const { transactionId, paymentIntentId } = req.query;

        if (!transactionId && !paymentIntentId) {
            return res.status(400).json({ success: false, message: 'Missing transactionId or paymentIntentId' });
        }

        const paymentQuery = paymentIntentId
            ? { paymentIntentId }
            : { transactionId };

        const payment = await PaymentHistory.findOne(paymentQuery)
            .populate({
                path: 'subscriptionId',
                populate: { path: 'planId' }
            })
            .lean();

        if (!payment || !payment.subscriptionId || !payment.subscriptionId.planId) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        const features = [];
        const plan = payment.subscriptionId.planId;
        const billingCycle = payment.subscriptionId.billingCycle;

        if (plan.features.maxCampaigns === -1) {
            features.push('Unlimited Campaigns');
        } else if (plan.features.maxCampaigns > 2) {
            features.push(`${plan.features.maxCampaigns} Campaigns`);
        }

        if (plan.features.maxInfluencers === -1) {
            features.push('Unlimited Influencer Connections');
        } else if (plan.features.maxInfluencers > 2) {
            features.push(`${plan.features.maxInfluencers} Influencer Connections`);
        }

        if (plan.features.maxBrands === -1) {
            features.push('Unlimited Brand Connections');
        } else if (plan.features.maxBrands > 2) {
            features.push(`${plan.features.maxBrands} Brand Connections`);
        }

        if (plan.features.advancedAnalytics) {
            features.push('Advanced Analytics');
        }

        if (plan.features.prioritySupport) {
            features.push('Priority Support');
        }

        if (plan.features.customBranding) {
            features.push('Custom Branding');
        }

        const responseData = {
            planName: plan.name,
            billingCycle: billingCycle,
            amount: payment.amount,
            transactionId: payment.razorpayPaymentId || payment.transactionId,
            userType: payment.userType === 'BrandInfo' ? 'brand' : 'influencer',
            features
        };

        return res.json({ success: true, ...responseData });

    } catch (error) {
        console.error('Error loading payment success page:', error);
        return res.status(500).json({ success: false, message: 'Failed to load payment success page' });
    }
};

const getPlans = async (req, res) => {
    try {
        const { userType } = req.params;
        const allPlans = await SubscriptionService.getPlansForUserType(userType);

        const plans = allPlans.filter(plan =>
            ['Free', 'Basic', 'Premium'].includes(plan.name)
        );

        res.json({
            success: true,
            plans
        });
    } catch (error) {
        console.error('Error fetching subscription plans:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch subscription plans'
        });
    }
};

const getCurrentSubscription = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const userType = req.session.user.role;

        const subscription = await SubscriptionService.getUserSubscription(userId, userType);

        res.json({
            success: true,
            subscription
        });
    } catch (error) {
        console.error('Error fetching current subscription:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch current subscription'
        });
    }
};

const subscribe = async (req, res) => {
    try {
        const userId = req.session.user.id;
        let userType = (req.session.user.role || '').toLowerCase();
        const { planId, billingCycle } = req.body;

        if (!userType || (userType !== 'brand' && userType !== 'influencer')) {
            const { BrandInfo } = require('../models/BrandMongo');
            const { InfluencerInfo } = require('../models/InfluencerMongo');
            const brandUser = await BrandInfo.findById(userId);
            if (brandUser) {
                userType = 'brand';
            } else {
                const influencerUser = await InfluencerInfo.findById(userId);
                if (influencerUser) userType = 'influencer';
            }
        }

        const allPlans = await SubscriptionService.getPlansForUserType(userType);

        const selectedPlan = allPlans.find(p => String(p._id) === String(planId));

        if (!selectedPlan) {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan selected'
            });
        }

        const existingSubscription = await SubscriptionService.getUserSubscription(userId, userType);

        const isPaidPlan = billingCycle === 'monthly' ? selectedPlan.price.monthly > 0 : selectedPlan.price.yearly > 0;

        if (isPaidPlan) {
            return res.json({
                success: false,
                message: 'Redirecting to payment',
                redirectToPayment: true,
                paymentUrl: `/subscription/payment?userId=${userId}&userType=${userType}&planId=${planId}&billingCycle=${billingCycle}`
            });
        }

        if (existingSubscription &&
            existingSubscription.status === 'active' &&
            existingSubscription.planId?._id?.toString() === planId) {
            return res.status(400).json({
                success: false,
                message: 'You already have this plan active'
            });
        }

        if (existingSubscription && existingSubscription.status === 'active') {
            const { UserSubscription } = require('../models/SubscriptionMongo');
            await UserSubscription.findByIdAndUpdate(existingSubscription._id, { status: 'expired' });
        }

        const subscriptionData = {
            userId,
            userType: userType === 'brand' ? 'BrandInfo' : 'InfluencerInfo',
            planId,
            billingCycle,
            status: 'active',
            startDate: new Date(),
            endDate: new Date(Date.now() + (billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000),
            amount: 0,
            usage: {
                campaignsUsed: 0,
                influencersConnected: 0,
                brandsConnected: 0,
                storageUsedGB: 0,
                uploadsThisMonth: 0
            }
        };

        const subscription = await SubscriptionService.createSubscription(subscriptionData);

        res.json({
            success: true,
            message: 'Subscription created successfully',
            subscription
        });
    } catch (error) {
        console.error('Error creating/upgrading subscription:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create/upgrade subscription'
        });
    }
};

const checkLimit = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const userType = req.session.user.role;
        const { action } = req.body;

        const result = await SubscriptionService.checkSubscriptionLimit(userId, userType, action);

        res.json({
            success: true,
            result
        });
    } catch (error) {
        console.error('Error checking subscription limit:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check subscription limit'
        });
    }
};

const updateUsage = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const userType = req.session.user.role;
        const { usageUpdate } = req.body;

        const result = await SubscriptionService.updateUsage(userId, userType, usageUpdate);

        res.json({
            success: true,
            message: 'Usage updated successfully',
            result
        });
    } catch (error) {
        console.error('Error updating subscription usage:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update usage'
        });
    }
};

const manageSubscription = async (req, res) => {
    try {
        if (!req.session || !req.session.user || !req.session.user.id) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const userId = req.session.user.id;
        let userType = req.session.user.role || req.session.user.userType;

        if (!userType || userType === 'undefined') {
            const { BrandInfo } = require('../models/BrandMongo');
            const { InfluencerInfo } = require('../models/InfluencerMongo');

            const brand = await BrandInfo.findById(userId);
            const influencer = await InfluencerInfo.findById(userId);

            if (brand) {
                userType = 'brand';
            } else if (influencer) {
                userType = 'influencer';
            } else {
                throw new Error('Could not determine user type');
            }
        }

        const mappedUserType = userType === 'brand' ? 'BrandInfo' : 'InfluencerInfo';

        let paymentHistory = [];
        let transactionHistory = [];
        try {
            const { PaymentHistory } = require('../models/SubscriptionMongo');
            const { Transaction } = require('../models/SubscriptionMongo');

            const totalPayments = await PaymentHistory.countDocuments({
                userId: userId,
                userType: mappedUserType
            });

            paymentHistory = await PaymentHistory.find({
                userId: userId,
                userType: mappedUserType
            })
                .populate({
                    path: 'subscriptionId',
                    populate: { path: 'planId' }
                })
                .sort({ createdAt: -1 })
                .limit(10)
                .lean();

            const totalTransactions = await Transaction.countDocuments({
                userId: userId,
                userType: mappedUserType
            });

            transactionHistory = await Transaction.find({
                userId: userId,
                userType: mappedUserType
            })
                .populate('planId')
                .populate('subscriptionId')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean();

            const combinedHistory = [...paymentHistory, ...transactionHistory];

            combinedHistory.sort((a, b) => {
                const dateA = new Date(a.createdAt || a.processedAt || a.paidAt);
                const dateB = new Date(b.createdAt || b.processedAt || b.paidAt);
                return dateB - dateA;
            });

            paymentHistory = combinedHistory.slice(0, 10);
        } catch (paymentError) {
            console.error('❌ Error fetching payment/transaction history:', paymentError);
            paymentHistory = [];
        }

        const [currentSubscription, allPlans] = await Promise.all([
            SubscriptionService.getUserSubscription(userId, userType),
            SubscriptionService.getPlansForUserType(userType)
        ]);

        const availablePlans = allPlans.filter(plan =>
            ['Free', 'Basic', 'Premium'].includes(plan.name)
        );

        const responseData = {
            success: true,
            currentSubscription,
            availablePlans,
            paymentHistory,
            userType,
            user: req.session.user
        };

        return res.json(responseData);
    } catch (error) {
        console.error('=== ERROR in /subscription/manage ===', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to load subscription management',
            error: error.message
        });
    }
};

const recalculateUsage = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const userType = req.session.user.role || req.session.user.userType;

        const mappedUserType = userType === 'brand' ? 'BrandInfo' : 'InfluencerInfo';
        const { CampaignInfo, CampaignInfluencers } = require('../models/CampaignMongo');
        const { UserSubscription } = require('../models/SubscriptionMongo');
        const mongoose = require('mongoose');

        if (userType === 'brand') {
            const campaignCount = await CampaignInfo.countDocuments({
                brand_id: new mongoose.Types.ObjectId(userId)
            });

            const influencerCount = await CampaignInfluencers.distinct('influencer_id', {
                campaign_id: { $in: await CampaignInfo.find({ brand_id: new mongoose.Types.ObjectId(userId) }).distinct('_id') }
            }).then(ids => ids.length);

            await UserSubscription.findOneAndUpdate(
                { userId: userId, userType: mappedUserType, status: 'active' },
                {
                    $set: {
                        'usage.campaignsUsed': campaignCount,
                        'usage.influencersConnected': influencerCount
                    }
                }
            );
        } else {
            const campaignIds = await CampaignInfluencers.distinct('campaign_id', {
                influencer_id: new mongoose.Types.ObjectId(userId)
            });

            const campaignCount = campaignIds.length;

            const campaigns = await CampaignInfo.find({
                _id: { $in: campaignIds }
            }).distinct('brand_id');

            const brandCount = campaigns.length;

            await UserSubscription.findOneAndUpdate(
                { userId: userId, userType: mappedUserType, status: 'active' },
                {
                    $set: {
                        'usage.campaignsUsed': campaignCount,
                        'usage.brandsConnected': brandCount
                    }
                }
            );
        }

        res.json({
            success: true,
            message: 'Usage recalculated successfully'
        });
    } catch (error) {
        console.error('Error recalculating usage:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to recalculate usage',
            error: error.message
        });
    }
};

const testStatus = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const userType = req.session.user.role;

        const [subscriptionStatus, subscriptionLimits] = await Promise.all([
            SubscriptionService.checkSubscriptionExpiry(userId, userType),
            SubscriptionService.getSubscriptionLimitsWithUsage(userId, userType)
        ]);

        res.json({
            success: true,
            subscriptionStatus,
            subscriptionLimits
        });
    } catch (error) {
        console.error('Error checking subscription status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check subscription status',
            error: error.message
        });
    }
};

const checkExpired = async (req, res) => {
    try {
        const expiredCount = await SubscriptionService.checkAndExpireSubscriptions();

        res.json({
            success: true,
            message: `Checked and updated ${expiredCount} expired subscription(s)`,
            expiredCount
        });
    } catch (error) {
        console.error('Error checking expired subscriptions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check expired subscriptions',
            error: error.message
        });
    }
};

module.exports = {
    selectPlan,
    subscribeAfterSignup,
    getPaymentPage,
    initiatePayment,
    confirmPayment,
    processPayment,
    getPaymentSuccessPage,
    getPlans,
    getCurrentSubscription,
    subscribe,
    checkLimit,
    updateUsage,
    manageSubscription,
    recalculateUsage,
    testStatus,
    checkExpired
};
