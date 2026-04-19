'use strict';

require('dotenv').config();
const { connectDB } = require('../mongoDB');
const { InfluencerInfo } = require('../models/InfluencerMongo');
const { BrandInfo } = require('../models/BrandMongo');
const { CampaignInfo } = require('../models/CampaignMongo');
const ElasticsearchService = require('../services/search/elasticsearchService');

async function syncAll() {
    try {
        console.log('Connecting to database...');
        await connectDB();
        
        console.log('Checking Elasticsearch connection...');
        const isConnected = await ElasticsearchService.checkConnection();
        if (!isConnected) {
            console.log('\n⚠️  Elasticsearch server is not reachable.');
            console.log('ℹ️  Since you are running locally without Elasticsearch installed on Windows, this sync script is safely aborting.');
            console.log('ℹ️  The main application will automatically fall back to native MongoDB text search. No further action is required!\n');
            process.exit(0);
        }

        console.log('Initializing indices...');
        await ElasticsearchService.initIndices();

        // 1. Sync Influencers
        console.log('Syncing influencers...');
        const influencers = await InfluencerInfo.find({});
        for (const doc of influencers) {
            await ElasticsearchService.indexDocument('influencers', doc._id.toString(), {
                fullName: doc.fullName,
                displayName: doc.displayName,
                username: doc.username,
                bio: doc.bio,
                categories: doc.categories,
                profilePicUrl: doc.profilePicUrl,
                verified: doc.verified,
                totalFollowers: doc.analytics_snapshot?.totalFollowers || 0,
                avgEngagementRate: doc.analytics_snapshot?.avgEngagementRate || 0
            });
        }
        console.log(`Synced ${influencers.length} influencers.`);

        // 2. Sync Brands
        console.log('Syncing brands...');
        const brands = await BrandInfo.find({});
        for (const doc of brands) {
            await ElasticsearchService.indexDocument('brands', doc._id.toString(), {
                brandName: doc.brandName,
                displayName: doc.displayName,
                username: doc.username,
                industry: doc.industry,
                description: doc.description,
                bio: doc.bio,
                logoUrl: doc.logoUrl,
                verified: doc.verified,
                completedCampaigns: doc.completedCampaigns || 0
            });
        }
        console.log(`Synced ${brands.length} brands.`);

        // 3. Sync Campaigns
        console.log('Syncing campaigns...');
        const campaigns = await CampaignInfo.find({});
        for (const doc of campaigns) {
            await ElasticsearchService.indexDocument('campaigns', doc._id.toString(), {
                title: doc.title,
                description: doc.description,
                status: doc.status,
                budget: doc.budget,
                min_followers: doc.min_followers,
                required_channels: doc.required_channels,
                brand_id: doc.brand_id.toString(),
                brandName: doc.brandName
            });
        }
        console.log(`Synced ${campaigns.length} campaigns.`);

        console.log('Sync completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Sync failed:', error);
        process.exit(1);
    }
}

syncAll();
