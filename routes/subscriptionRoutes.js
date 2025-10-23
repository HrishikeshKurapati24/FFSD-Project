const express = require('express');
const router = express.Router();
const { SubscriptionService } = require('../models/brandModel');
const { isAuthenticated } = require('./authRoutes');

// Public routes (no authentication required)
// Subscription plan selection page (after signup)
router.get('/select-plan', async (req, res) => {
    try {
        const { userId, userType } = req.query;
        
        if (!userId || !userType) {
            return res.redirect('/signin');
        }
        
        const availablePlans = await SubscriptionService.getPlansForUserType(userType);
        
        res.render('subscription/select-plan', {
            availablePlans,
            userType,
            userId
        });
    } catch (error) {
        console.error('Error loading subscription plan selection:', error);
        res.status(500).render('error', {
            message: 'Failed to load subscription plans',
            error: { status: 500 }
        });
    }
});

// Subscribe after signup (redirect to payment for paid plans)
router.post('/subscribe-after-signup', async (req, res) => {
    try {
        const { userId, userType, planId, billingCycle } = req.body;
        
        if (!userId || !userType || !planId || !billingCycle) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters'
            });
        }
        
        // Get the plan details
        const plans = await SubscriptionService.getPlansForUserType(userType);
        const selectedPlan = plans.find(p => p._id.toString() === planId);
        
        if (!selectedPlan) {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan selected'
            });
        }
        
        // Check if it's a free plan
        if (selectedPlan.name === 'Free') {
            // Create free subscription directly
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
            // Redirect to payment page for paid plans
            res.json({
                success: true,
                message: 'Redirecting to payment',
                redirectTo: `/subscription/payment?userId=${userId}&userType=${userType}&planId=${planId}&billingCycle=${billingCycle}`
            });
        }
    } catch (error) {
        console.error('Error processing subscription:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process subscription'
        });
    }
});

// Payment page
router.get('/payment', async (req, res) => {
    try {
        const { userId, userType, planId, billingCycle } = req.query;
        
        if (!userId || !userType || !planId || !billingCycle) {
            return res.redirect('/subscription/select-plan');
        }
        
        // Get the plan details
        const plans = await SubscriptionService.getPlansForUserType(userType);
        const selectedPlan = plans.find(p => p._id.toString() === planId);
        
        if (!selectedPlan) {
            return res.redirect('/subscription/select-plan');
        }
        
        res.render('subscription/payment', {
            userId,
            userType,
            selectedPlan,
            billingCycle
        });
    } catch (error) {
        console.error('Error loading payment page:', error);
        res.status(500).render('error', {
            message: 'Failed to load payment page',
            error: { status: 500 }
        });
    }
});

// Process payment
router.post('/process-payment', async (req, res) => {
    try {
        const { userId, userType, planId, billingCycle, amount, cardData } = req.body;
        
        if (!userId || !userType || !planId || !billingCycle || !amount || !cardData) {
            return res.status(400).json({
                success: false,
                message: 'Missing required payment information'
            });
        }
        
        // Validate card data
        if (!cardData.cardNumber || !cardData.cardName || !cardData.expiryDate || !cardData.cvv) {
            return res.status(400).json({
                success: false,
                message: 'Invalid card information'
            });
        }
        
        // Get the plan details
        const plans = await SubscriptionService.getPlansForUserType(userType);
        const selectedPlan = plans.find(p => p._id.toString() === planId);
        
        if (!selectedPlan) {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan selected'
            });
        }
        
        // Generate transaction ID
        const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Simulate payment processing (in real app, integrate with Stripe, PayPal, etc.)
        const paymentResult = await simulatePaymentProcessing(cardData, amount);
        
        if (!paymentResult.success) {
            return res.status(400).json({
                success: false,
                message: paymentResult.message || 'Payment failed'
            });
        }
        
        // Create subscription
        const subscriptionData = {
            userId,
            userType: userType === 'brand' ? 'BrandInfo' : 'InfluencerInfo',
            planId,
            billingCycle,
            status: 'active',
            startDate: new Date(),
            endDate: new Date(Date.now() + (billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000),
            amount,
            usage: {
                campaignsUsed: 0,
                influencersConnected: 0,
                brandsConnected: 0,
                storageUsedGB: 0,
                uploadsThisMonth: 0
            }
        };
        
        const subscription = await SubscriptionService.createSubscription(subscriptionData);
        
        // Create transaction record
        const { Transaction } = require('../models/brandModel');
        const transaction = new Transaction({
            userId,
            userType: userType === 'brand' ? 'BrandInfo' : 'InfluencerInfo',
            subscriptionId: subscription._id,
            planId,
            amount,
            billingCycle,
            status: 'completed',
            transactionId,
            cardDetails: {
                last4: cardData.cardNumber.slice(-4),
                brand: detectCardBrand(cardData.cardNumber),
                expiryMonth: parseInt(cardData.expiryDate.split('/')[0]),
                expiryYear: parseInt('20' + cardData.expiryDate.split('/')[1])
            },
            billingAddress: cardData.billingAddress,
            processedAt: new Date()
        });
        
        await transaction.save();
        
        res.json({
            success: true,
            message: 'Payment processed successfully',
            transactionId,
            subscription,
            redirectTo: `/subscription/payment-success?transactionId=${transactionId}`
        });
        
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({
            success: false,
            message: 'Payment processing failed'
        });
    }
});

// Simulate payment processing (replace with real payment gateway)
async function simulatePaymentProcessing(cardData, amount) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate some payment failures for testing
    const cardNumber = cardData.cardNumber.replace(/\s/g, '');
    
    // Test card numbers that will fail
    if (cardNumber === '4000000000000002') {
        return { success: false, message: 'Card declined' };
    }
    if (cardNumber === '4000000000000069') {
        return { success: false, message: 'Expired card' };
    }
    if (cardNumber === '4000000000000127') {
        return { success: false, message: 'Incorrect CVC' };
    }
    
    // All other cards succeed
    return { 
        success: true, 
        message: 'Payment successful',
        paymentId: `pay_${Date.now()}`
    };
}

// Detect card brand from card number
function detectCardBrand(cardNumber) {
    const number = cardNumber.replace(/\s/g, '');
    
    if (/^4/.test(number)) return 'Visa';
    if (/^5[1-5]/.test(number)) return 'Mastercard';
    if (/^3[47]/.test(number)) return 'American Express';
    if (/^6(?:011|5)/.test(number)) return 'Discover';
    
    return 'Unknown';
}

// Payment success page
router.get('/payment-success', async (req, res) => {
    try {
        const { transactionId } = req.query;
        
        if (!transactionId) {
            return res.redirect('/signin');
        }
        
        // Get transaction details
        const { Transaction } = require('../models/brandModel');
        const transaction = await Transaction.findOne({ transactionId })
            .populate('planId')
            .lean();
        
        if (!transaction) {
            return res.redirect('/signin');
        }
        
        // Generate feature list based on plan
        const features = [];
        const plan = transaction.planId;
        
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
        
        res.render('subscription/payment-success', {
            planName: plan.name,
            billingCycle: transaction.billingCycle,
            amount: transaction.amount,
            transactionId: transaction.transactionId,
            features
        });
        
    } catch (error) {
        console.error('Error loading payment success page:', error);
        res.redirect('/signin');
    }
});

// Apply authentication middleware for protected routes
router.use(isAuthenticated);

// Get subscription plans for a user type
router.get('/plans/:userType', async (req, res) => {
    try {
        const { userType } = req.params;
        const plans = await SubscriptionService.getPlansForUserType(userType);
        
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
});

// Get user's current subscription
router.get('/current', async (req, res) => {
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
});

// Create new subscription
router.post('/subscribe', async (req, res) => {
    try {
        const userId = req.session.user.id;
        const userType = req.session.user.role;
        const { planId, billingCycle } = req.body;
        
        // Check if user already has an active subscription
        const existingSubscription = await SubscriptionService.getUserSubscription(userId, userType);
        if (existingSubscription && existingSubscription.status === 'active') {
            return res.status(400).json({
                success: false,
                message: 'You already have an active subscription'
            });
        }
        
        const subscriptionData = {
            userId,
            userType,
            planId,
            billingCycle,
            status: 'active',
            startDate: new Date(),
            endDate: new Date(Date.now() + (billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000),
            usage: {
                campaigns: 0,
                collaborations: 0,
                analytics: 0,
                support: 0
            }
        };
        
        const subscription = await SubscriptionService.createSubscription(subscriptionData);
        
        res.json({
            success: true,
            message: 'Subscription created successfully',
            subscription
        });
    } catch (error) {
        console.error('Error creating subscription:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create subscription'
        });
    }
});

// Check subscription limits
router.post('/check-limit', async (req, res) => {
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
});

// Update subscription usage
router.post('/update-usage', async (req, res) => {
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
});

// Subscription management page
router.get('/manage', async (req, res) => {
    try {
        console.log('=== SUBSCRIPTION MANAGE PAGE ===');
        console.log('Session user:', req.session.user);
        
        const userId = req.session.user.id;
        let userType = req.session.user.role || req.session.user.userType;
        
        // Determine userType if not in session
        if (!userType || userType === 'undefined') {
            console.log('UserType not in session, determining from database...');
            const { BrandInfo } = require('../config/BrandMongo');
            const { InfluencerInfo } = require('../config/InfluencerMongo');
            
            const brand = await BrandInfo.findById(userId);
            const influencer = await InfluencerInfo.findById(userId);
            
            if (brand) {
                userType = 'brand';
            } else if (influencer) {
                userType = 'influencer';
            } else {
                throw new Error('Could not determine user type');
            }
            console.log('Determined userType:', userType);
        }
        
        console.log(`Fetching subscription for userId: ${userId}, userType: ${userType}`);
        
        const [currentSubscription, availablePlans] = await Promise.all([
            SubscriptionService.getUserSubscription(userId, userType),
            SubscriptionService.getPlansForUserType(userType)
        ]);
        
        console.log('Current subscription:', currentSubscription ? {
            id: currentSubscription._id,
            planName: currentSubscription.planId?.name,
            status: currentSubscription.status
        } : 'NULL');
        console.log('Available plans:', availablePlans.length);
        
        res.render('subscription/manage', {
            currentSubscription,
            availablePlans,
            userType,
            user: req.session.user
        });
    } catch (error) {
        console.error('=== ERROR in /subscription/manage ===');
        console.error('Error details:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).render('error', {
            message: 'Failed to load subscription management',
            error: { status: 500, details: error.message }
        });
    }
});

// Test route to check subscription status (for development/testing)
router.get('/test-status', isAuthenticated, async (req, res) => {
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
});

module.exports = router;
