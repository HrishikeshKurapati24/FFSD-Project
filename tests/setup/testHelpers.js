const mongoose = require('mongoose');
const { BrandInfo } = require('../../models/BrandMongo');
const { InfluencerInfo } = require('../../models/InfluencerMongo');
const { Customer } = require('../../models/CustomerMongo');
const { CampaignInfo } = require('../../models/CampaignMongo');
const { SubscriptionPlan } = require('../../models/SubscriptionMongo');
const { Admin } = require('../../mongoDB');

const getObjectId = () => new mongoose.Types.ObjectId();

const createTestBrand = async (overrides = {}) => {
    const brand = new BrandInfo({
        brandName: 'Test Brand',
        email: `test_brand_${Date.now()}@example.com`,
        password: 'password123',
        industry: 'Tech',
        username: `brand_${Date.now()}`,
        displayName: 'Test Brand Display',
        phone: '+1234567890',
        performance_metrics: {
            reach: 10000,
            impressions: 30000,
            engagement: 1500,
            avgEngagementRate: 5.0,
            totalCampaigns: 1,
            totalRevenue: 5000
        },
        ...overrides
    });
    return await brand.save();
};

const createTestInfluencer = async (overrides = {}) => {
    const influencer = new InfluencerInfo({
        fullName: 'Test Influencer',
        email: `test_influencer_${Date.now()}@example.com`,
        password: 'password123',
        niche: 'Fashion',
        username: `infl_${Date.now()}`,
        displayName: 'Test Infl Display',
        phone: '+1234567890',
        analytics_snapshot: {
            total_followers: 50000,
            avg_engagement_rate: 4.5,
            reach_estimate: 20000,
            platform_distribution: {
                instagram: 40000,
                youtube: 10000
            }
        },
        ...overrides
    });
    return await influencer.save();
};


const createTestCustomer = async (overrides = {}) => {
    const customer = new Customer({
        name: 'Test Customer',
        email: `test_customer_${Date.now()}@example.com`,
        password: 'password123',
        ...overrides
    });
    return await customer.save();
};

const createTestAdmin = async (overrides = {}) => {
    const admin = new Admin({
        userId: `admin_${Date.now()}`,
        username: `admin_${Date.now()}`,
        password: 'password123',
        role: 'superadmin',
        ...overrides
    });
    return await admin.save();
};

const createTestCampaign = async (brandId, overrides = {}) => {
    const campaign = new CampaignInfo({
        brand_id: brandId,
        title: 'Test Campaign',
        description: 'Test Description',
        category: 'Fashion',
        budget: 1000,
        status: 'active',
        min_followers: 100,
        required_channels: ['Instagram'],
        ...overrides
    });
    return await campaign.save();
};


const createTestSubscriptionPlan = async (overrides = {}) => {
    const plan = new SubscriptionPlan({
        name: 'Free',
        userType: 'brand',
        price: { monthly: 0, yearly: 0 },
        features: { maxCampaigns: 5, maxInfluencers: 10 },
        isActive: true,
        ...overrides
    });
    return await plan.save();
};

const seedSubscriptionPlans = async () => {
    await SubscriptionPlan.deleteMany({});
    await createTestSubscriptionPlan({ name: 'Free', userType: 'brand', price: { monthly: 0, yearly: 0 } });
    await createTestSubscriptionPlan({ name: 'Free', userType: 'influencer', price: { monthly: 0, yearly: 0 } });
    await createTestSubscriptionPlan({ name: 'Basic', userType: 'brand', price: { monthly: 29, yearly: 290 } });
    await createTestSubscriptionPlan({ name: 'Premium', userType: 'brand', price: { monthly: 99, yearly: 990 } });
};

const createTestPayment = async (influencerId, brandId, campaignId, overrides = {}) => {
    const { CampaignPayments } = require('../../models/CampaignMongo');
    const payment = new CampaignPayments({
        influencer_id: influencerId,
        brand_id: brandId,
        campaign_id: campaignId,
        amount: 500,
        status: 'completed',
        payment_date: new Date(),
        payment_method: 'razorpay',
        ...overrides
    });
    return await payment.save();
};

const createTestCampaignInfluencer = async (campaignId, influencerId, overrides = {}) => {
    const { CampaignInfluencers } = require('../../models/CampaignMongo');
    const ci = new CampaignInfluencers({
        campaign_id: campaignId,
        influencer_id: influencerId,
        status: 'active',
        progress: 0,
        ...overrides
    });
    return await ci.save();
};

const createTestInfluencerAnalytics = async (influencerId, overrides = {}) => {
    const { InfluencerAnalytics } = require('../../models/InfluencerMongo');
    const analytics = new InfluencerAnalytics({
        influencerId: influencerId,
        totalFollowers: 1000,
        avgEngagementRate: 5,
        ...overrides
    });
    return await analytics.save();
};

module.exports = {
    getObjectId,
    createTestBrand,
    createTestInfluencer,
    createTestCustomer,
    createTestCampaign,
    createTestSubscriptionPlan,
    seedSubscriptionPlans,
    createTestPayment,
    createTestCampaignInfluencer,
    createTestInfluencerAnalytics,
    createTestAdmin
};

