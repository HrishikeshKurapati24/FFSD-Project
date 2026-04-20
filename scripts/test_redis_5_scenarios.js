'use strict';

require('dotenv').config();
const { connectDB, closeConnection } = require('../mongoDB');
const { getJSON, setJSON, getClient } = require('../services/cache/redisCacheService');
const { BrandInfo } = require('../models/BrandMongo');
const { InfluencerInfo } = require('../models/InfluencerMongo');

// Import services for real-world load simulation
const brandProfileService = require('../services/brand/brandProfileService');
const influencerProfileService = require('../services/influencer/influencerProfileService');
const InfluencerDiscoveryService = require('../services/influencer/influencerDiscoveryService');

async function measureScenario(scenarioName, key, dataFetchFn) {
    console.log(`\n▶ Running Scenario: ${scenarioName}`);
    
    // 1. MISS (Real DB Call / Service Logic)
    const startDb = performance.now();
    let data;
    try {
        data = await dataFetchFn();
    } catch (err) {
        console.error(`   ❌ Error fetching data for ${scenarioName}:`, err.message);
        return { scenario: scenarioName, missTime: 0, hitTime: 0, improvement: 0 };
    }
    const endDb = performance.now();
    const dbTime = endDb - startDb;
    console.log(`   [MISS] Data processing: ${dbTime.toFixed(2)}ms`);

    if (!data) {
        console.log(`   ⚠️  No data returned. Skipping cache tests.`);
        return { scenario: scenarioName, missTime: dbTime, hitTime: 0, improvement: 0 };
    }

    // 2. SET (Write to Cache)
    await setJSON(key, data, 120);

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

    const improvement = dbTime > 0 ? ((dbTime - hitTime) / dbTime) * 100 : 0;
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

    console.log('\n🚀 Starting Real-World Dashboard & Explore Benchmark...');
    
    // Fetch test IDs (Resilient fetching: Try active first, otherwise take any)
    const brand = await BrandInfo.findOne({ status: 'active' }).select('_id').lean() 
                 || await BrandInfo.findOne().select('_id').lean();
    
    const influencer = await InfluencerInfo.findOne({ status: 'active' }).select('_id').lean()
                      || await InfluencerInfo.findOne().select('_id').lean();

    if (!brand || !influencer) {
        console.error('❌ Could not find valid test brand or influencer in database. Please seed data first.');
        return;
    }

    const brandId = brand._id.toString();
    const influencerId = influencer._id.toString();

    const results = [];

    // Scenario 1: Brand Dashboard (Complex multi-service aggregation)
    results.push(await measureScenario('1. Brand Dashboard Load', `cache:dash:brand:${brandId}`, async () => {
        const SubscriptionService = require('../services/subscription/subscriptionService');
        const brandCampaignService = require('../services/brand/brandCampaignService');
        const { Product } = require('../models/ProductMongo');
        return brandProfileService.getBrandDashboardData(brandId, null, SubscriptionService, brandCampaignService, Product);
    }));

    // Scenario 2: Influencer Dashboard (Queue status & Earnings aggregation)
    results.push(await measureScenario('2. Influencer Dashboard Load', `cache:dash:influencer:${influencerId}`, async () => {
        return influencerProfileService.getInfluencerDashboardData(influencerId);
    }));

    // Scenario 3: Brand Explore (Discovering Influencers via ES/Mongo)
    results.push(await measureScenario('3. Brand Explore (Discovery)', `cache:explore:influencers:all`, async () => {
        return brandProfileService.getExplorePageData(brandId, 'all', '');
    }));

    // Scenario 4: Influencer Explore (Discovering Brands via ES/Mongo)
    results.push(await measureScenario('4. Influencer Explore (Brand Discovery)', `cache:explore:brands:all`, async () => {
        return InfluencerDiscoveryService.getBrandExploreData('all', '');
    }));

    console.log('\n=============================================');
    console.log('       DASHBOARD & EXPLORE CACHE METRICS     ');
    console.log('=============================================');
    console.log(`| Scenario | Cold Load (ms) | Redis Hit (ms) | Speedup (%) |`);
    console.log(`| :--- | :---: | :---: | :---: |`);
    results.forEach(r => {
        console.log(`| ${r.scenario.padEnd(25)} | ${r.missTime.toFixed(1).padStart(10)} | ${r.hitTime.toFixed(2).padStart(10)} | **${r.improvement.toFixed(1)}%** |`);
    });
    console.log('=============================================\n');
}

// Allow running independently
if (require.main === module) {
    (async () => {
        try {
            await connectDB();
            await runStartupBenchmark();
            await closeConnection();
            process.exit(0);
        } catch (err) {
            console.error('Benchmark failed:', err);
            process.exit(1);
        }
    })();
}

module.exports = { runStartupBenchmark };
