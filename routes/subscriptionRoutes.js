const express = require('express');
const router = express.Router();
const { SubscriptionService } = require('../models/brandModel');
const { isAuthenticated } = require('./authRoutes');
const { asyncErrorWrapper } = require('../middleware/asyncErrorWrapper');

// Public routes (no authentication required)
// Subscription plan selection page (after signup)
router.get('/select-plan', asyncErrorWrapper(async (req, res) => {
    const { userId, userType } = req.query;

    if (!userId || !userType) {
        const error = new Error('Missing userId or userType parameters');
        error.statusCode = 500;
        throw error;
    }

    // Validate userId format (should be MongoDB ObjectId)
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
        const error = new Error('Invalid userId format - must be a valid MongoDB ObjectId');
        error.statusCode = 500;
        throw error;
    }

    // Validate userType
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

    // Filter to only show Free, Basic, and Premium plans (exclude Pro and Enterprise)
    const availablePlans = allPlans.filter(plan =>
        ['Free', 'Basic', 'Premium'].includes(plan.name)
    );

    // Return JSON for API requests (React frontend)
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({
            success: true,
            availablePlans,
            userType,
            userId
        });
    }

    res.render('subscription/select-plan', {
        availablePlans,
        userType,
        userId
    });
}));

// Subscribe after signup (redirect to payment for paid plans)
router.post('/subscribe-after-signup', asyncErrorWrapper(async (req, res) => {
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
}));

// Payment page
router.get('/payment', async (req, res) => {
    let { userId, userType, planId, billingCycle } = req.query;

    // Get userId and userType from session if not in query params or if userType is undefined
    if (!userId && req.session?.user?.id) {
        userId = req.session.user.id;
    }
    if (!userType || userType === 'undefined' || userType === 'null') {
        userType = req.session?.user?.userType || req.session?.user?.role;
    }

    // If still no userType, try to determine from database
    if (!userType || userType === 'undefined' || userType === 'null') {
        const { BrandInfo } = require('../config/BrandMongo');
        const { InfluencerInfo } = require('../config/InfluencerMongo');

        if (userId) {
            const brand = await BrandInfo.findById(userId);
            const influencer = await InfluencerInfo.findById(userId);

            if (brand) {
                userType = 'brand';
            } else if (influencer) {
                userType = 'influencer';
            }
        }
    }

    if (!userId || !userType || !planId || !billingCycle) {
        const error = new Error('Missing required parameters for payment page');
        error.statusCode = 400;
        throw error;
    }

    // Validate userId format
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
        const error = new Error('Invalid userId format');
        error.statusCode = 400;
        throw error;
    }

    // Validate userType
    if (!['brand', 'influencer'].includes(userType)) {
        const error = new Error('Invalid userType. Must be "brand" or "influencer"');
        error.statusCode = 400;
        throw error;
    }

    // Validate billingCycle
    if (!['monthly', 'yearly'].includes(billingCycle)) {
        const error = new Error('Invalid billingCycle. Must be "monthly" or "yearly"');
        error.statusCode = 400;
        throw error;
    }

    // Get the plan details
    const plans = await SubscriptionService.getPlansForUserType(userType);
    if (!plans || plans.length === 0) {
        const error = new Error(`No subscription plans found for userType: ${userType}`);
        error.statusCode = 500;
        throw error;
    }

    const selectedPlan = plans.find(p => p._id.toString() === planId);

    if (!selectedPlan) {
        const error = new Error(`Invalid plan selected: ${planId}`);
        error.statusCode = 400;
        throw error;
    }

        // Fetch user's last payment details to pre-fill the form
        const mappedUserType = userType === 'brand' ? 'BrandInfo' : 'InfluencerInfo';
        let lastPaymentDetails = null;

        try {
            const { PaymentHistory } = require('../config/SubscriptionMongo');
            const { Transaction } = require('../models/brandModel');

            // Try to get the last payment from PaymentHistory
            let lastPayment = await PaymentHistory.findOne({
                userId: userId,
                userType: mappedUserType,
                status: 'success'
            })
                .sort({ createdAt: -1 })
                .lean();

            // If not found in PaymentHistory, try Transaction
            if (!lastPayment) {
                lastPayment = await Transaction.findOne({
                    userId: userId,
                    userType: mappedUserType,
                    status: 'completed'
                })
                    .sort({ createdAt: -1 })
                    .lean();
            }

            // Extract relevant details if payment found
            if (lastPayment) {
                const { decrypt } = require('../utils/encryption');

                // Decrypt card number if available
                let decryptedCardNumber = null;
                if (lastPayment.cardDetails?.encryptedCardNumber) {
                    decryptedCardNumber = decrypt(lastPayment.cardDetails.encryptedCardNumber);
                }

                // Format expiry date if available
                let expiryDate = null;
                if (lastPayment.cardDetails?.expiryMonth && lastPayment.cardDetails?.expiryYear) {
                    const month = String(lastPayment.cardDetails.expiryMonth).padStart(2, '0');
                    const year = String(lastPayment.cardDetails.expiryYear).padStart(2, '0');
                    expiryDate = `${month}/${year}`;
                }

                lastPaymentDetails = {
                    cardName: lastPayment.cardDetails?.cardName || null,
                    cardNumber: decryptedCardNumber,
                    expiryDate: expiryDate,
                    last4: lastPayment.cardDetails?.last4 || null,
                    billingAddress: lastPayment.billingAddress || null
                };
                console.log('Found previous payment details for user:', userId);
            }
        } catch (fetchError) {
            console.error('Error fetching last payment details:', fetchError);
            // Continue without pre-filled data
        }

        // Return JSON for API requests (React frontend)
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.json({
                success: true,
                userId,
                userType,
                selectedPlan,
                billingCycle,
                lastPaymentDetails
            });
        }

        res.render('subscription/payment', {
            userId,
            userType,
            selectedPlan,
            billingCycle,
            lastPaymentDetails
        });
    });

// Process payment
router.post('/process-payment', async (req, res) => {
    try {
        let { userId, userType, planId, billingCycle, amount, cardData } = req.body;

        // Get userId and userType from session if not in request body or if userType is undefined
        if (!userId && req.session?.user?.id) {
            userId = req.session.user.id;
        }
        if (!userType || userType === 'undefined' || userType === 'null') {
            userType = req.session?.user?.userType || req.session?.user?.role;
        }

        // If still no userType, try to determine from database
        if (!userType || userType === 'undefined' || userType === 'null') {
            const { BrandInfo } = require('../config/BrandMongo');
            const { InfluencerInfo } = require('../config/InfluencerMongo');
            
            if (userId) {
                const brand = await BrandInfo.findById(userId);
                const influencer = await InfluencerInfo.findById(userId);
                
                if (brand) {
                    userType = 'brand';
                } else if (influencer) {
                    userType = 'influencer';
                }
            }
        }

        if (!userId || !userType || !planId || !billingCycle || !amount || !cardData) {
            return res.status(400).json({
                success: false,
                message: 'Missing required payment information',
                details: {
                    userId: !!userId,
                    userType: !!userType,
                    planId: !!planId,
                    billingCycle: !!billingCycle,
                    amount: !!amount,
                    cardData: !!cardData
                }
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
        if (!plans || plans.length === 0) {
            return res.status(400).json({
                success: false,
                message: `No plans found for userType: ${userType}`
            });
        }

        const selectedPlan = plans.find(p => {
            const planIdStr = p._id ? p._id.toString() : p.id ? p.id.toString() : String(p._id || p.id);
            const requestPlanIdStr = String(planId);
            return planIdStr === requestPlanIdStr;
        });

        if (!selectedPlan) {
            console.error('Plan not found:', {
                planId,
                userType,
                availablePlanIds: plans.map(p => (p._id || p.id)?.toString())
            });
            return res.status(400).json({
                success: false,
                message: 'Invalid plan selected',
                details: {
                    planId,
                    userType,
                    availablePlans: plans.length
                }
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

        // Extract card details for storage
        const { encrypt } = require('../utils/encryption');
        const last4 = cardData.cardNumber.slice(-4);
        const [expiryMonth, expiryYear] = cardData.expiryDate.split('/').map(v => parseInt(v, 10));

        // Encrypt the full card number for secure storage
        const encryptedCardNumber = encrypt(cardData.cardNumber);

        // Create payment history record
        const { PaymentHistory } = require('../config/SubscriptionMongo');
        const paymentRecord = new PaymentHistory({
            subscriptionId: subscription._id,
            userId,
            userType: userType === 'brand' ? 'BrandInfo' : 'InfluencerInfo',
            amount,
            currency: 'USD',
            status: 'success',
            paymentMethod: 'credit_card',
            transactionId,
            paymentGateway: 'simulated',
            description: `${selectedPlan.name} Plan - ${billingCycle} subscription`,
            paidAt: new Date(),
            cardDetails: {
                cardName: cardData.cardName,
                last4: last4,
                brand: detectCardBrand(cardData.cardNumber),
                expiryMonth: expiryMonth,
                expiryYear: expiryYear,
                encryptedCardNumber: encryptedCardNumber
            },
            billingAddress: cardData.billingAddress
        });

        await paymentRecord.save();

        console.log('✅ Payment history record created:', {
            id: paymentRecord._id,
            amount,
            status: 'success',
            transactionId
        });

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

// Detect card brand from card number
function detectCardBrand(cardNumber) {
    const number = cardNumber.replace(/\s/g, '');

    if (/^4/.test(number)) return 'Visa';
    if (/^5[1-5]/.test(number)) return 'Mastercard';
    if (/^3[47]/.test(number)) return 'American Express';
    if (/^6(?:011|5)/.test(number)) return 'Discover';
    if (/^35/.test(number)) return 'JCB';

    return 'Unknown';
}

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
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing transactionId'
                });
            }
            return res.redirect('/signin');
        }

        // Get payment details from PaymentHistory
        const { PaymentHistory } = require('../config/SubscriptionMongo');
        const payment = await PaymentHistory.findOne({ transactionId })
            .populate({
                path: 'subscriptionId',
                populate: { path: 'planId' }
            })
            .lean();

        if (!payment || !payment.subscriptionId || !payment.subscriptionId.planId) {
            console.error('Payment or plan not found for transactionId:', transactionId);
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(404).json({
                    success: false,
                    message: 'Payment not found'
                });
            }
            return res.redirect('/signin');
        }

        // Generate feature list based on plan
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
            transactionId: payment.transactionId,
            features
        };

        // Return JSON for API requests (React frontend)
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.json({
                success: true,
                ...responseData
            });
        }

        res.render('subscription/payment-success', responseData);

    } catch (error) {
        console.error('Error loading payment success page:', error);
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(500).json({
                success: false,
                message: 'Failed to load payment success page'
            });
        }
        res.redirect('/signin');
    }
});

// Apply authentication middleware for protected routes
router.use(isAuthenticated);

// Get subscription plans for a user type
router.get('/plans/:userType', async (req, res) => {
    try {
        const { userType } = req.params;
        const allPlans = await SubscriptionService.getPlansForUserType(userType);

        // Filter to only show Free, Basic, and Premium plans (exclude Pro and Enterprise)
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

// Create new subscription or upgrade existing
router.post('/subscribe', async (req, res) => {
    try {
        const userId = req.session.user.id;
        const userType = req.session.user.role;
        const { planId, billingCycle } = req.body;

        // Check if user already has an active subscription
        const existingSubscription = await SubscriptionService.getUserSubscription(userId, userType);

        if (existingSubscription && existingSubscription.status === 'active') {
            // Check if it's the same plan and billing cycle
            if (existingSubscription.planId.toString() === planId && existingSubscription.billingCycle === billingCycle) {
                return res.status(400).json({
                    success: false,
                    message: 'You already have this subscription plan with the same billing cycle active'
                });
            }

            // Allow upgrade by updating existing subscription
            const updatedSubscription = await SubscriptionService.updateSubscription(existingSubscription._id, {
                planId,
                billingCycle,
                updatedAt: new Date()
            });

            return res.json({
                success: true,
                message: 'Subscription upgraded successfully',
                subscription: updatedSubscription
            });
        }

        // Check if existing subscription is expired - redirect to payment
        if (existingSubscription && (existingSubscription.status === 'expired' || new Date(existingSubscription.endDate) < new Date())) {
            return res.status(400).json({
                success: false,
                message: 'Your subscription has expired. Please complete payment to renew.',
                redirectToPayment: true,
                paymentUrl: `/subscription/payment?userId=${userId}&userType=${userType}&planId=${planId}&billingCycle=${billingCycle}`
            });
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

        // Check if user is authenticated
        if (!req.session || !req.session.user || !req.session.user.id) {
            console.log('No session found, redirecting to signin');
            return res.redirect('/auth/signin');
        }

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

        // Map userType for database query
        const mappedUserType = userType === 'brand' ? 'BrandInfo' : 'InfluencerInfo';

        // Fetch payment history and transaction data with error handling
        let paymentHistory = [];
        let transactionHistory = [];
        try {
            console.log('\n========== FETCHING PAYMENT & TRANSACTION HISTORY ==========');
            const { PaymentHistory } = require('../config/SubscriptionMongo');
            const { Transaction } = require('../models/brandModel');

            console.log('Query params:', {
                userId: userId,
                userType: mappedUserType
            });

            // Fetch PaymentHistory records
            const totalPayments = await PaymentHistory.countDocuments({
                userId: userId,
                userType: mappedUserType
            });
            console.log('Total PaymentHistory records found:', totalPayments);

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

            console.log('PaymentHistory records fetched:', paymentHistory.length);

            // Fetch Transaction records
            const totalTransactions = await Transaction.countDocuments({
                userId: userId,
                userType: mappedUserType
            });
            console.log('Total Transaction records found:', totalTransactions);

            transactionHistory = await Transaction.find({
                userId: userId,
                userType: mappedUserType
            })
                .populate('planId')
                .populate('subscriptionId')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean();

            console.log('Transaction records fetched:', transactionHistory.length);

            // Combine and deduplicate both sources
            const combinedHistory = [...paymentHistory, ...transactionHistory];

            // Sort by date (newest first)
            combinedHistory.sort((a, b) => {
                const dateA = new Date(a.createdAt || a.processedAt || a.paidAt);
                const dateB = new Date(b.createdAt || b.processedAt || b.paidAt);
                return dateB - dateA;
            });

            // Limit to 10 most recent
            paymentHistory = combinedHistory.slice(0, 10);

            console.log('Combined history records:', paymentHistory.length);
            if (paymentHistory.length > 0) {
                console.log('Sample record:', {
                    id: paymentHistory[0]._id,
                    amount: paymentHistory[0].amount,
                    status: paymentHistory[0].status,
                    planName: paymentHistory[0].subscriptionId?.planId?.name || paymentHistory[0].planId?.name,
                    date: paymentHistory[0].createdAt || paymentHistory[0].processedAt
                });
            }
            console.log('=============================================\n');
        } catch (paymentError) {
            console.error('❌ Error fetching payment/transaction history:', paymentError);
            paymentHistory = []; // Ensure it's always an array
        }

        const [currentSubscription, allPlans] = await Promise.all([
            SubscriptionService.getUserSubscription(userId, userType),
            SubscriptionService.getPlansForUserType(userType)
        ]);

        // Filter to only show Free, Basic, and Premium plans (exclude Pro and Enterprise)
        const availablePlans = allPlans.filter(plan =>
            ['Free', 'Basic', 'Premium'].includes(plan.name)
        );

        console.log('Current subscription:', currentSubscription ? {
            id: currentSubscription._id,
            planName: currentSubscription.planId?.name,
            status: currentSubscription.status
        } : 'NULL');
        console.log('Available plans:', availablePlans.length);
        console.log('Payment history records:', paymentHistory.length);

        // Log usage details
        if (currentSubscription && currentSubscription.usage) {
            console.log('\n========== USAGE DETAILS ==========');
            console.log('Usage Object:', currentSubscription.usage);

            // Campaigns usage
            const maxCampaigns = currentSubscription.planId?.features?.maxCampaigns;
            const usedCampaigns = currentSubscription.usage.campaignsUsed || 0;
            console.log('Campaigns Usage:', {
                used: usedCampaigns,
                limit: maxCampaigns === -1 ? 'Unlimited' : maxCampaigns,
                percentage: maxCampaigns === -1 ? 0 : ((usedCampaigns / maxCampaigns) * 100).toFixed(1) + '%'
            });

            // Collaborations usage (influencers or brands)
            if (userType === 'brand') {
                const maxInfluencers = currentSubscription.planId?.features?.maxInfluencers;
                const usedInfluencers = currentSubscription.usage.influencersConnected || 0;
                console.log('Collaborations (Influencers) Usage:', {
                    used: usedInfluencers,
                    limit: maxInfluencers === -1 ? 'Unlimited' : maxInfluencers,
                    percentage: maxInfluencers === -1 ? 0 : ((usedInfluencers / maxInfluencers) * 100).toFixed(1) + '%'
                });
            } else {
                const maxBrands = currentSubscription.planId?.features?.maxBrands;
                const usedBrands = currentSubscription.usage.brandsConnected || 0;
                console.log('Collaborations (Brands) Usage:', {
                    used: usedBrands,
                    limit: maxBrands === -1 ? 'Unlimited' : maxBrands,
                    percentage: maxBrands === -1 ? 0 : ((usedBrands / maxBrands) * 100).toFixed(1) + '%'
                });
            }

            // Other usage metrics
            console.log('Storage Usage:', {
                used: currentSubscription.usage.storageUsedGB || 0,
                limit: currentSubscription.planId?.limits?.storageGB || 0,
                unit: 'GB'
            });
            console.log('Monthly Uploads:', {
                used: currentSubscription.usage.uploadsThisMonth || 0,
                limit: currentSubscription.planId?.limits?.monthlyUploads || 0
            });
            console.log('===================================\n');
        } else {
            console.log('\n⚠️ No usage data found in subscription');
        }

        const responseData = {
            success: true,
            currentSubscription,
            availablePlans,
            paymentHistory,
            userType,
            user: req.session.user
        };

        // Return JSON for API requests (React frontend)
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.json(responseData);
        }

        // Render EJS for traditional requests (legacy support)
        res.render('subscription/manage', {
            currentSubscription,
            availablePlans,
            paymentHistory,
            userType,
            user: req.session.user
        });
    } catch (error) {
        console.error('=== ERROR in /subscription/manage ===');
        console.error('Error details:', error);
        console.error('Stack trace:', error.stack);
        
        // Return JSON for API requests
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(500).json({
                success: false,
                message: 'Failed to load subscription management',
                error: error.message
            });
        }
        
        res.status(500).render('error', {
            message: 'Failed to load subscription management',
            error: { status: 500, details: error.message }
        });
    }
});

// Route to recalculate usage from existing data
router.post('/recalculate-usage', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const userType = req.session.user.role || req.session.user.userType;

        console.log(`[recalculate-usage] Starting for userId: ${userId}, userType: ${userType}`);

        const mappedUserType = userType === 'brand' ? 'BrandInfo' : 'InfluencerInfo';
        const { CampaignInfo, CampaignInfluencers } = require('../config/CampaignMongo');
        const { UserSubscription } = require('../config/SubscriptionMongo');
        const mongoose = require('mongoose');

        if (userType === 'brand') {
            // Count total campaigns for this brand
            const campaignCount = await CampaignInfo.countDocuments({
                brand_id: new mongoose.Types.ObjectId(userId)
            });

            // Count total influencer connections
            const influencerCount = await CampaignInfluencers.distinct('influencer_id', {
                campaign_id: { $in: await CampaignInfo.find({ brand_id: new mongoose.Types.ObjectId(userId) }).distinct('_id') }
            }).then(ids => ids.length);

            console.log(`[recalculate-usage] Found ${campaignCount} campaigns and ${influencerCount} influencers`);

            // Update the subscription usage
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
            // For influencers, count campaigns participated in and unique brands
            const campaignIds = await CampaignInfluencers.distinct('campaign_id', {
                influencer_id: new mongoose.Types.ObjectId(userId)
            });

            const campaignCount = campaignIds.length;

            // Get unique brand IDs from campaigns
            const campaigns = await CampaignInfo.find({
                _id: { $in: campaignIds }
            }).distinct('brand_id');

            const brandCount = campaigns.length;

            console.log(`[recalculate-usage] Found ${campaignCount} campaigns and ${brandCount} unique brands`);

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

// Manual trigger to check and expire subscriptions (for testing/admin)
router.post('/check-expired', isAuthenticated, async (req, res) => {
    try {
        console.log('[Manual Trigger] Checking for expired subscriptions...');
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
});

module.exports = router;