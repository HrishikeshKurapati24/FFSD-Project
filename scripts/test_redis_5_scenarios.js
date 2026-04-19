'use strict';

require('dotenv').config();
const { connectDB, closeConnection } = require('../mongoDB');
const { getJSON, setJSON, getClient } = require('../services/cache/redisCacheService');
const { CampaignInfo, CampaignInfluencers, CampaignPayments } = require('../models/CampaignMongo');
const { BrandInfo } = require('../models/BrandMongo');
const { InfluencerInfo } = require('../models/InfluencerMongo');

async function measureScenario(scenarioName, key, dbCallFn) {
    console.log(`\n▶ Running Scenario: ${scenarioName}`);
    
    // 1. MISS (Real DB Call)
    const startDb = performance.now();
    const data = await dbCallFn();
    const endDb = performance.now();
    const dbTime = endDb - startDb;
    console.log(`   [MISS] MongoDB execution: ${dbTime.toFixed(2)}ms`);

    // 2. SET (Write to Cache)
    await setJSON(key, data, 60);

    // 3. HIT (Read from Cache - average of 5 runs)
    const hitTimes = [];
    for (let i = 0; i < 5; i++) {
        const startHit = performance.now();
        await getJSON(key);
        const endHit = performance.now();
        hitTimes.push(endHit - startHit);
    }
    const hitTime = hitTimes.reduce((a, b) => a + b, 0) / hitTimes.length;
    console.log(`   [HIT]  Redis retrieval: ${hitTime.toFixed(2)}ms`);

    const improvement = ((dbTime - hitTime) / dbTime) * 100;
    console.log(`   🚀 Improvement: ${improvement.toFixed(1)}%`);

    return {
        scenario: scenarioName,
        missTime: dbTime,
        hitTime: hitTime,
        improvement: improvement
    };
}

async function runStartupBenchmark() {
    const client = getClient();
    if (!client) {
        console.log('ℹ️ Redis client not available. Skipping startup benchmark.');
        return;
    }

    console.log('\n🚀 Starting Startup Redis Performance Benchmark...');
    const results = [];

    // Scenario 1: System-Wide Financial Audit (Massive Aggregation)
    results.push(await measureScenario('1. System-Wide Financial Audit', 'cache:perf:scenario1', async () => {
        return CampaignPayments.aggregate([
            { $lookup: { from: 'campaigninfos', localField: 'campaign_id', foreignField: '_id', as: 'campaign' } },
            { $unwind: '$campaign' },
            { $lookup: { from: 'brandinfos', localField: 'brand_id', foreignField: '_id', as: 'brand' } },
            { $unwind: '$brand' },
            { $group: {
                _id: { brandId: '$brand._id', status: '$status' },
                totalAmount: { $sum: '$amount' },
                paymentCount: { $sum: 1 },
                avgPayment: { $avg: '$amount' }
            }},
            { $sort: { totalAmount: -1 } },
            { $limit: 100 }
        ]);
    }));

    // Scenario 2: Influencer Deep Analytics Pipeline
    results.push(await measureScenario('2. Global Influencer Performance', 'cache:perf:scenario2', async () => {
        return InfluencerInfo.aggregate([
            { $match: { 'analytics_snapshot.totalFollowers': { $gt: 10000 } } },
            { $lookup: { from: 'campaigninfluencers', localField: '_id', foreignField: 'influencer_id', as: 'collabs' } },
            { $unwind: '$collabs' },
            { $match: { 'collabs.status': 'completed' } },
            { $group: {
                _id: '$_id',
                name: { $first: '$user.fullName' },
                totalEarnings: { $sum: '$collabs.payment_details.amount' },
                avgEngagement: { $avg: '$collabs.metrics.engagement_rate' },
                completedCollabs: { $sum: 1 }
            }},
            { $match: { completedCollabs: { $gt: 2 } } },
            { $sort: { totalEarnings: -1 } },
            { $limit: 50 }
        ]);
    }));

    // Scenario 3: Brand ROI & Campaign Health
    results.push(await measureScenario('3. Brand ROI & Campaign Health', 'cache:perf:scenario3', async () => {
        return CampaignInfo.aggregate([
            { $lookup: { from: 'campaigninfluencers', localField: '_id', foreignField: 'campaign_id', as: 'participants' } },
            { $unwind: '$participants' },
            { $group: {
                _id: '$brand_id',
                totalBudget: { $sum: '$budget' },
                totalSpent: { $sum: '$participants.payment_details.amount' },
                totalReach: { $sum: '$participants.metrics.impressions' },
                activeCampaigns: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }
            }},
            { $addFields: { roiScore: { $divide: ['$totalReach', { $max: ['$totalSpent', 1] }] } } },
            { $sort: { roiScore: -1 } },
            { $limit: 50 }
        ]);
    }));

    // Scenario 4: Complex Multi-Faceted Demographics Search
    results.push(await measureScenario('4. Multi-Faceted Demographics Search', 'cache:perf:scenario4', async () => {
        return InfluencerInfo.aggregate([
            { $match: { 'platforms.platformName': 'instagram', status: 'active' } },
            { $lookup: { from: 'campaigninfluencers', localField: '_id', foreignField: 'influencer_id', as: 'active_deals' } },
            { $addFields: { activeDealCount: { $size: { $filter: { input: '$active_deals', as: 'deal', cond: { $eq: ['$$deal.status', 'active'] } } } } } },
            { $match: { activeDealCount: { $lt: 3 } } }, // Find influencers who aren't too busy
            { $project: { user: 1, 'analytics_snapshot': 1, activeDealCount: 1 } },
            { $sort: { 'analytics_snapshot.totalFollowers': -1 } },
            { $limit: 100 }
        ]);
    }));

    // Scenario 5: Platform-wide Campaign Metrics Grouping
    results.push(await measureScenario('5. Platform-wide Campaign Metrics Grouping', 'cache:perf:scenario5', async () => {
        return CampaignInfo.aggregate([
            { $unwind: '$platforms' },
            { $lookup: { from: 'campaigninfluencers', localField: '_id', foreignField: 'campaign_id', as: 'performances' } },
            { $unwind: { path: '$performances', preserveNullAndEmptyArrays: true } },
            { $group: {
                _id: '$platforms',
                totalCampaigns: { $addToSet: '$_id' },
                avgBudget: { $avg: '$budget' },
                totalImpressions: { $sum: '$performances.metrics.impressions' },
                totalClicks: { $sum: '$performances.metrics.clicks' }
            }},
            { $project: { platform: '$_id', campaignCount: { $size: '$totalCampaigns' }, avgBudget: 1, totalImpressions: 1, totalClicks: 1, _id: 0 } },
            { $sort: { totalImpressions: -1 } }
        ]);
    }));

    console.log('\n=============================================');
    console.log('         STARTUP REDIS BENCHMARK RESULTS     ');
    console.log('=============================================');
    console.log(`| Scenario | DB Miss (ms) | Redis Hit (ms) | Speedup (%) |`);
    console.log(`| :--- | :---: | :---: | :---: |`);
    results.forEach(r => {
        console.log(`| ${r.scenario} | ${r.missTime.toFixed(1)} | ${r.hitTime.toFixed(2)} | **${r.improvement.toFixed(1)}%** |`);
    });
    console.log('=============================================\n');
}

// Allow running independently
if (require.main === module) {
    const { connectDB, closeConnection } = require('../mongoDB');
    (async () => {
        await connectDB();
        await runStartupBenchmark();
        await closeConnection();
        process.exit(0);
    })();
}

module.exports = { runStartupBenchmark };
