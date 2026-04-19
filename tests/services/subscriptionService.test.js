const mongoose = require('mongoose');
const SubscriptionService = require('../../services/subscription/subscriptionService');
const { SubscriptionPlan, UserSubscription, PaymentHistory } = require('../../models/SubscriptionMongo');
const { createTestBrand } = require('../setup/testHelpers');

describe('SubscriptionService', () => {
    let freePlan, premiumPlan;

    beforeEach(async () => {
        // Seed default plans before each test because global setup wipes them
        await SubscriptionPlan.deleteMany({});
        [freePlan, premiumPlan] = await SubscriptionPlan.insertMany([
            {
                name: 'Free',
                userType: 'brand',
                price: { monthly: 0, yearly: 0 },
                features: { maxCampaigns: 2, maxInfluencers: 2 },
                isActive: true,
                isDefault: true
            },
            {
                name: 'Premium',
                userType: 'brand',
                price: { monthly: 99, yearly: 990 },
                features: { maxCampaigns: -1, maxInfluencers: -1 },
                isActive: true
            }
        ]);
    });

    describe('normalizeUserType', () => {
        it('should normalize user types correctly', () => {
            expect(SubscriptionService.normalizeUserType('BrandInfo')).toBe('brand');
            expect(SubscriptionService.normalizeUserType('brand')).toBe('brand');
            expect(SubscriptionService.normalizeUserType('InfluencerInfo')).toBe('influencer');
            expect(SubscriptionService.normalizeUserType('invalid')).toBe(null);
        });
    });

    describe('getPlansForUserType', () => {
        it('should return active plans for brand', async () => {
            const plans = await SubscriptionService.getPlansForUserType('brand');
            expect(plans.length).toBe(2);
            expect(plans[0].price.monthly).toBe(0); // Sorted by price
        });
    });

    describe('getUserSubscription', () => {
        let testBrand;

        beforeEach(async () => {
            testBrand = await createTestBrand();
        });

        it('should create a free subscription for a new user', async () => {
            const sub = await SubscriptionService.getUserSubscription(testBrand._id, 'brand');
            expect(sub).not.toBeNull();
            expect(sub.planId._id.toString()).toBe(freePlan._id.toString());
            expect(sub.status).toBe('active');
        });

        it('should return an existing active subscription', async () => {
            const existing = await UserSubscription.create({
                userId: testBrand._id,
                userType: 'BrandInfo',
                planId: premiumPlan._id,
                status: 'active',
                billingCycle: 'monthly',
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                amount: 99
            });

            const sub = await SubscriptionService.getUserSubscription(testBrand._id, 'brand');
            expect(sub._id.toString()).toBe(existing._id.toString());
            expect(sub.planId.name).toBe('Premium');
        });

        it('should expire subscription if endDate is passed', async () => {
            const expiredDate = new Date(Date.now() - 1000);
            const expired = await UserSubscription.create({
                userId: testBrand._id,
                userType: 'BrandInfo',
                planId: premiumPlan._id,
                status: 'active',
                billingCycle: 'monthly',
                startDate: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
                endDate: expiredDate,
                amount: 99
            });

            const sub = await SubscriptionService.getUserSubscription(testBrand._id, 'brand');
            expect(sub.status).toBe('expired');
            
            const inDb = await UserSubscription.findById(expired._id);
            expect(inDb.status).toBe('expired');
        });
    });

    describe('checkSubscriptionLimit', () => {
        let testBrand, activeSub;

        beforeEach(async () => {
            testBrand = await createTestBrand();
            activeSub = await UserSubscription.create({
                userId: testBrand._id,
                userType: 'BrandInfo',
                planId: freePlan._id,
                status: 'active',
                billingCycle: 'monthly',
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                amount: 0,
                usage: { campaignsUsed: 1, influencersConnected: 0 }
            });
        });

        it('should allow action if under limit', async () => {
            const result = await SubscriptionService.checkSubscriptionLimit(testBrand._id, 'brand', 'create_campaign');
            expect(result.allowed).toBe(true);
        });

        it('should block action if at limit', async () => {
            activeSub.usage.campaignsUsed = 2;
            await activeSub.save();

            const result = await SubscriptionService.checkSubscriptionLimit(testBrand._id, 'brand', 'create_campaign');
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('reached your limit');
        });

        it('should block action if subscription is expired', async () => {
            activeSub.status = 'expired';
            await activeSub.save();

            const result = await SubscriptionService.checkSubscriptionLimit(testBrand._id, 'brand', 'create_campaign');
            expect(result.allowed).toBe(false);
            expect(result.redirectToPayment).toBe(true);
        });
    });

    describe('updateUsage', () => {
        it('should increment usage correctly', async () => {
            const brand = await createTestBrand();
            await UserSubscription.create({
                userId: brand._id,
                userType: 'BrandInfo',
                planId: freePlan._id,
                status: 'active',
                billingCycle: 'monthly',
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                amount: 0,
                usage: { campaignsUsed: 0 }
            });

            const updated = await SubscriptionService.updateUsage(brand._id, 'brand', { campaignsUsed: 1 });
            expect(updated.usage.campaignsUsed).toBe(1);

            const reUpdated = await SubscriptionService.updateUsage(brand._id, 'brand', { campaignsUsed: 2 });
            expect(reUpdated.usage.campaignsUsed).toBe(3);
        });
    });

    describe('applySubscriptionFromPaymentIntent', () => {
        it('should apply subscription and create payment history', async () => {
            const brand = await createTestBrand();
            const intent = {
                _id: new mongoose.Types.ObjectId(),
                amount: 99,
                currency: 'USD',
                razorpay: { paymentId: 'pay_123', orderId: 'ord_123' },
                context: {
                    userId: brand._id.toString(),
                    userType: 'brand',
                    planId: premiumPlan._id.toString(),
                    billingCycle: 'monthly'
                }
            };

            const result = await SubscriptionService.applySubscriptionFromPaymentIntent(intent);

            expect(result.alreadyApplied).toBe(false);
            expect(result.subscription.status).toBe('active');
            expect(result.subscription.planId.toString()).toBe(premiumPlan._id.toString());
            
            const history = await PaymentHistory.findOne({ paymentIntentId: intent._id });
            expect(history).toBeDefined();
            expect(history.amount).toBe(99);
        });

        it('should be idempotent for same intent', async () => {
            const brand = await createTestBrand();
            const intent = {
                _id: new mongoose.Types.ObjectId(),
                context: {
                    userId: brand._id.toString(),
                    userType: 'brand',
                    planId: premiumPlan._id.toString(),
                    billingCycle: 'monthly'
                }
            };

            await SubscriptionService.applySubscriptionFromPaymentIntent(intent);
            const result = await SubscriptionService.applySubscriptionFromPaymentIntent(intent);

            expect(result.alreadyApplied).toBe(true);
        });
    });

    describe('checkAndExpireSubscriptions', () => {
        it('should expire all subscriptions past end date', async () => {
            const brand = await createTestBrand();
            await UserSubscription.create({
                userId: brand._id,
                userType: 'BrandInfo',
                planId: premiumPlan._id,
                status: 'active',
                billingCycle: 'monthly',
                startDate: new Date(),
                endDate: new Date(Date.now() - 1000),
                amount: 99
            });

            const count = await SubscriptionService.checkAndExpireSubscriptions();
            expect(count).toBe(1);

            const inDb = await UserSubscription.findOne({ userId: brand._id });
            expect(inDb.status).toBe('expired');
        });
    });
});
