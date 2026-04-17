
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { InfluencerInfo, InfluencerSocials, InfluencerAnalytics } = require('../models/InfluencerMongo');
const { BrandInfo, BrandSocials, BrandAnalytics } = require('../models/BrandMongo');
const { CampaignInfo, CampaignMetrics } = require('../models/CampaignMongo');
const { Product } = require('../models/ProductMongo');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/collabsync';

async function migrate() {
    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB for high-performance migration.');

        // 1. Migrate Influencers
        console.log('--- Migrating Influencers ---');
        const influencers = await InfluencerInfo.find({});
        for (const influencer of influencers) {
            const [socials, analytics] = await Promise.all([
                InfluencerSocials.findOne({ influencerId: influencer._id }).lean(),
                InfluencerAnalytics.findOne({ influencerId: influencer._id }).lean()
            ]);

            const update = {};
            if (socials && socials.platforms) {
                update.socialProfiles = socials.platforms.map(p => ({
                    platform: p.platform,
                    handle: p.handle || socials.socialHandle || '',
                    followers: p.followers || 0,
                    avgLikes: p.avgLikes || 0,
                    avgComments: p.avgComments || 0,
                    avgViews: p.avgViews || 0,
                    category: p.category || 'general',
                    lastUpdated: new Date()
                }));
            }

            if (analytics) {
                update.analytics_snapshot = {
                    totalFollowers: analytics.totalFollowers || 0,
                    avgEngagementRate: analytics.avgEngagementRate || 0,
                    monthlyEarnings: analytics.monthlyEarnings || 0,
                    avgRating: analytics.rating || 0,
                    audienceDemographics: analytics.audienceDemographics || {},
                    performanceMetrics: analytics.performanceMetrics || {}
                };
            }

            if (Object.keys(update).length > 0) {
                await InfluencerInfo.updateOne({ _id: influencer._id }, { $set: update });
                console.log(`Updated Influencer: ${influencer.username}`);
            }
        }

        // 2. Migrate Brands
        console.log('\n--- Migrating Brands ---');
        const brands = await BrandInfo.find({});
        for (const brand of brands) {
            const [socials, analytics] = await Promise.all([
                BrandSocials.findOne({ brandId: brand._id }).lean(),
                BrandAnalytics.findOne({ brandId: brand._id }).lean()
            ]);

            const update = {};
            if (socials && socials.platforms) {
                update.socialProfiles = socials.platforms.map(p => ({
                    platform: p.platform,
                    handle: p.handle || '',
                    followers: p.followers || 0,
                    lastUpdated: new Date()
                }));
            }

            if (analytics) {
                update.performance_metrics = {
                    totalCampaigns: analytics.campaignMetrics?.totalCampaigns || 0,
                    activeCampaigns: analytics.campaignMetrics?.activeCampaigns || 0,
                    totalSpend: analytics.campaignMetrics?.totalSpend || 0,
                    totalRevenue: analytics.campaignMetrics?.totalRevenue || 0,
                    totalReach: analytics.campaignMetrics?.totalReach || 0,
                    totalImpressions: analytics.campaignMetrics?.totalImpressions || 0,
                    avgROI: analytics.campaignMetrics?.avgROI || 0
                };
            }

            if (Object.keys(update).length > 0) {
                await BrandInfo.updateOne({ _id: brand._id }, { $set: update });
                console.log(`Updated Brand: ${brand.brandName}`);
            }
        }

        // 3. Migrate Campaigns (Metrics + Product Snapshots)
        console.log('\n--- Migrating Campaigns ---');
        const campaigns = await CampaignInfo.find({});
        for (const campaign of campaigns) {
            const [metrics, products] = await Promise.all([
                CampaignMetrics.findOne({ campaign_id: campaign._id }).lean(),
                Product.find({ campaign_id: campaign._id }).lean()
            ]);

            const update = {};
            if (metrics) {
                update.metrics = {
                    engagement_rate: metrics.engagement_rate || 0,
                    reach: metrics.reach || 0,
                    clicks: metrics.clicks || 0,
                    conversions: metrics.conversion_rate || 0,
                    revenue: metrics.revenue || 0,
                    roi: metrics.roi || 0,
                    performance_score: metrics.performance_score || 0,
                    overall_progress: metrics.overall_progress || 0,
                    sales_count: metrics.sales_count || 0,
                    impressions: metrics.impressions || 0
                };
            }

            if (products && products.length > 0) {
                update.featured_products = products.map(p => ({
                    product_id: p._id,
                    name: p.name,
                    price: p.campaign_price || 0,
                    thumbnail: p.images && p.images.length > 0 ? p.images[0].url : ''
                }));
            }

            if (Object.keys(update).length > 0) {
                await CampaignInfo.updateOne({ _id: campaign._id }, { $set: update });
                console.log(`Updated Campaign: ${campaign.title}`);
            }
        }

        console.log('\n--- Migration Successful! ---');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
