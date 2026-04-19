'use strict';

require('dotenv').config();
const { routeCache } = require('../middleware/routeCache');
const { getJSON, setJSON, getClient } = require('../services/cache/redisCacheService');

const { connectDB } = require('../mongoDB');
const adminDashboardService = require('../services/admin/adminDashboardService');

async function testRedisPerformance() {
    console.log('🚀 Starting Redis Performance Test...');
    
    // Connect to MongoDB for the real DB call
    await connectDB();

    const client = getClient();
    if (!client) {
        console.error('❌ Redis client not available. Check REDIS_URL.');
        process.exit(1);
    }

    const testKey = 'perf_test_key';
    
    // 1. Measure Cache MISS (Real Database Aggregation)
    console.log('\n--- Phase 1: MISS (Real Database Execution) ---');
    console.log('Executing complex Admin Dashboard MongoDB aggregations...');
    const startMiss = performance.now();
    const dbData = await adminDashboardService.getDashboardMetrics();
    const endMiss = performance.now();
    const dbTime = endMiss - startMiss;
    console.log(`✅ Real MongoDB aggregations took ${dbTime.toFixed(3)}ms`);

    // 2. Measure Cache SET
    console.log('\n--- Phase 2: SET (Caching the DB Result) ---');
    const startSet = performance.now();
    await setJSON(testKey, dbData, 60);
    const endSet = performance.now();
    console.log(`✅ setJSON took ${(endSet - startSet).toFixed(3)}ms`);

    // 3. Measure Cache HIT
    console.log('\n--- Phase 3: HIT (Memory/Redis) ---');
    const hitTimes = [];
    for (let i = 0; i < 5; i++) {
        const startHit = performance.now();
        await getJSON(testKey);
        const endHit = performance.now();
        hitTimes.push(endHit - startHit);
    }
    const avgHit = hitTimes.reduce((a, b) => a + b, 0) / hitTimes.length;
    console.log(`✅ getJSON (HIT) average: ${avgHit.toFixed(3)}ms`);

    const improvement = ((dbTime - avgHit) / dbTime) * 100;
    console.log(`\n🔥 Performance Improvement with Redis: ${improvement.toFixed(1)}%`);
    console.log(`🚀 Your app is now ${Math.round(dbTime / avgHit)}x faster for this route!`);

    process.exit(0);
}

testRedisPerformance().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
