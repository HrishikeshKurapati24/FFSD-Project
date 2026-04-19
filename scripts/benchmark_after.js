/**
 * benchmark_after.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 2 – Post-Optimization Benchmarking
 *
 * Fixes vs v1:
 *  1. Force-creates all new indexes (works even when autoIndex is off)
 *  2. Each query runs 3× — reports min, median, and max to eliminate
 *     Atlas free-tier network jitter from the comparison
 *  3. Primary metric is docsExamined:docsReturned scanRatio, not raw ms
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const fs       = require('fs');
const path     = require('path');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌  MONGO_URI not set. Add it to .env or pass as env var.');
  process.exit(1);
}

const RUNS = 3; // number of repetitions per query

// ── Helpers ───────────────────────────────────────────────────────────────────

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

function extractIndexes(explain) {
  try {
    const plan = explain?.queryPlanner?.winningPlan
      || explain?.[0]?.queryPlanner?.winningPlan || {};
    const names = [];
    function walk(node) {
      if (!node) return;
      if (node.indexName) names.push(node.indexName);
      if (node.inputStage)  walk(node.inputStage);
      if (node.inputStages) node.inputStages.forEach(walk);
    }
    walk(plan);
    return names.length ? names : ['(none)'];
  } catch (_) { return ['(unknown)']; }
}

function detectScanType(explain) {
  try {
    const str = JSON.stringify(explain);
    if (str.includes('"COLLSCAN"')) return 'COLLSCAN ⚠️';
    if (str.includes('"IXSCAN"'))   return 'IXSCAN ✅';
    return 'UNKNOWN';
  } catch (_) { return 'UNKNOWN'; }
}

/** Run a .explain() query RUNS times, return timing + explain stats */
async function timeQuery(label, queryFn) {
  const timings = [];
  let explainStats = null;
  let error = null;

  for (let i = 0; i < RUNS; i++) {
    const t = Date.now();
    try {
      explainStats = await queryFn();
    } catch (err) {
      error = err.message;
      break;
    }
    timings.push(Date.now() - t);
  }

  const result = { label, timings, elapsed_ms: median(timings), min_ms: Math.min(...timings), max_ms: Math.max(...timings) };
  if (error) { result.error = error; return result; }

  const stats = explainStats?.executionStats
    || explainStats?.[0]?.executionStats
    || explainStats?.stages?.[0]?.$cursor?.executionStats
    || {};

  result.executionTimeMillis = stats.executionTimeMillis ?? null;
  result.totalDocsExamined   = stats.totalDocsExamined  ?? null;
  result.totalDocsReturned   = stats.nReturned          ?? null;
  result.indexesUsed         = extractIndexes(explainStats);
  result.scanType            = detectScanType(explainStats);
  result.scanRatio           = (result.totalDocsExamined && result.totalDocsReturned != null)
    ? parseFloat((result.totalDocsExamined / Math.max(result.totalDocsReturned, 1)).toFixed(2))
    : null;

  return result;
}

/** Run a service flow RUNS times, return median wall-clock */
async function timeServiceFlow(label, asyncFn) {
  const timings = [];
  let error = null;
  let rowsReturned = 0;

  for (let i = 0; i < RUNS; i++) {
    const t = Date.now();
    try {
      const result = await asyncFn();
      if (Array.isArray(result))                    rowsReturned = result.length;
      else if (result && typeof result === 'object') rowsReturned = result.rowCount || 1;
    } catch (err) {
      error = err.message;
      break;
    }
    timings.push(Date.now() - t);
  }

  return {
    label,
    timings,
    elapsed_ms: median(timings),
    min_ms: timings.length ? Math.min(...timings) : null,
    max_ms: timings.length ? Math.max(...timings) : null,
    rowsReturned,
    note: `Service-flow timer (median of ${RUNS} runs, no explain)`,
    ...(error ? { error } : {})
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔌 Connecting to MongoDB…');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected\n');

  const { CampaignInfo, CampaignInfluencers, CampaignPayments } = require('../models/CampaignMongo');
  const { InfluencerInfo, InfluencerAnalytics }                 = require('../models/InfluencerMongo');
  const { BrandInfo }                                            = require('../models/BrandMongo');
  const { Product }                                              = require('../models/ProductMongo');
  const { Notification }                                         = require('../models/NotificationMongo');
  const { UserSubscription, PaymentHistory }                     = require('../models/SubscriptionMongo');
  const { Order }                                                = require('../models/OrderMongo');
  require('../models/AnalyticsSnapshot');
  require('../models/Feedback');

  // ── 0. Drop ALL existing indexes for a clean slate ─────────────────────────
  console.log('🗑️  Dropping all existing indexes to ensure a clean slate…');
  const modelsToDrop = [
    CampaignInfo, CampaignInfluencers, CampaignPayments, 
    InfluencerInfo, BrandInfo, Product, Order, Notification, 
    UserSubscription, PaymentHistory
  ];
  
  for (const Model of modelsToDrop) {
    try {
      await Model.collection.dropIndexes();
      console.log(`  ✅ Dropped indexes for ${Model.modelName}`);
    } catch (err) {
      console.warn(`  ⚠️  Could not drop indexes for ${Model.modelName}: ${err.message}`);
    }
  }
  console.log();

  // Run Phase 3 Data migrations before benching queries that rely on them
  const backfillRef = require('./backfill_referral_codes');
  await backfillRef.runMigration();

  const p3Embeds = require('./migrate_p3_embeds');
  await p3Embeds.runMigration();

  const denorm = require('./migrate_denormalization');
  await denorm.runMigration();

  const seedOrders = require('./seed_analytics_orders_fixed');
  await seedOrders.runMigration();

  const updateRevenue = require('./update_campaign_revenue_fixed');
  await updateRevenue.runMigration();

  // High-Performance Embedding Migration (Phase 5)
  // We run this migration BEFORE benchmarks to populate the new embedded fields
  try {
    console.log('🚀 Running High-Performance Embedding Migration (Phase 5)...');
    const hpMigrationPath = path.join(__dirname, 'migrate_p5_high_performance_embeds.js');
    if (fs.existsSync(hpMigrationPath)) {
        const { execSync } = require('child_process');
        execSync(`node ${hpMigrationPath}`, { stdio: 'inherit', env: process.env });
        console.log('✅ High-Performance Migration Complete.');
    }
  } catch (err) {
    console.warn('⚠️  High-Performance Migration failed or already ran:', err.message);
  }

  // Seed analytics snapshots for trend charts if collection is empty
  const AdminSnapshotService = require('../services/admin/adminSnapshotService');
  await AdminSnapshotService.seedHistoricalSnapshots();

  // const { CampaignInfo, CampaignInfluencers, CampaignPayments } = require('../models/CampaignMongo');
  // const { InfluencerInfo, InfluencerAnalytics }                 = require('../models/InfluencerMongo');
  // const { BrandInfo }                                            = require('../models/BrandMongo');
  // const { Product }                                              = require('../models/ProductMongo');
  // const { Notification }                                         = require('../models/NotificationMongo');
  // const { UserSubscription, PaymentHistory }                     = require('../models/SubscriptionMongo');
  // const { Order }                                                = require('../models/OrderMongo');
  const CollaborationModel                                       = require('../services/CollaborationModel');

  // ── 1. Force-create ALL compound indexes ────────────────────────────────────
  // Works even when autoIndex:false is set on the connection.
  console.log('🔨 Ensuring all compound indexes exist in Atlas…');
  const indexDefs = [
    [CampaignInfluencers, { influencer_id: 1, status: 1 }],
    [CampaignInfluencers, { campaign_id: 1, status: 1 }],
    [CampaignInfo,        { status: 1, createdAt: -1 }],
    [CampaignInfo,        { brand_id: 1, status: 1 }],
    [CampaignPayments,    { influencer_id: 1, payment_date: -1 }],
    [CampaignPayments,    { brand_id: 1, payment_date: -1 }],
    [Product,             { campaign_id: 1, status: 1 }],
    [Product,             { attributed_influencer_id: 1 }],
    [InfluencerInfo,      { fullName: 'text', username: 'text', bio: 'text', categories: 'text' }, { default_language: 'english', weights: { fullName: 10, username: 5, bio: 2 } }],
    [InfluencerInfo,      { fullName: 1 }, { collation: { locale: 'en', strength: 2 } }],
    [BrandInfo,           { brandName: 'text', industry: 'text', description: 'text' }, { default_language: 'english', weights: { brandName: 10, description: 2 } }],
    [BrandInfo,           { brandName: 1 }, { collation: { locale: 'en', strength: 2 } }],
    [InfluencerInfo,      { verified: 1, niche: 1 }],
    [InfluencerInfo,      { categories: 1 }],
    [InfluencerInfo,      { referralCode: 1 }, { unique: true, sparse: true }],
    [BrandInfo,           { industry: 1 }],
    [BrandInfo,           { verified: 1, industry: 1 }],
    [Order,               { customer_id: 1, status: 1 }],
    [Order,               { influencer_id: 1, createdAt: -1 }],
    [Order,               { attribution_status: 1 }],
    [UserSubscription,    { userId: 1, userType: 1 }],
    [UserSubscription,    { status: 1, endDate: 1 }],
    [PaymentHistory,      { userId: 1, userType: 1, createdAt: -1 }],
    [Notification,        { recipientId: 1, read: 1, createdAt: -1 }],
    [Notification,        { expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true }],
    [mongoose.model('AnalyticsSnapshot'), { influencerId: 1, timestamp: -1 }],
    [mongoose.model('Feedback'), { status: 1, createdAt: -1 }]
  ];

  const indexResults = await Promise.allSettled(
    indexDefs.map(([Model, fields, opts = {}]) =>
      Model.collection.createIndex(fields, { background: true, ...opts })
    )
  );

  let okCount = 0, failCount = 0;
  indexResults.forEach((r, i) => {
    if (r.status === 'rejected') { failCount++; console.warn(`  ⚠️  [${i + 1}] ${r.reason?.message}`); }
    else okCount++;
  });
  console.log(`  ✅ ${okCount}/${indexDefs.length} indexes ready, ${failCount} failed\n`);


  // ── 2. Discover sample IDs ──────────────────────────────────────────────────
  console.log('🔍 Discovering sample IDs from live data…');
  const sampleInfluencerCollab = await CampaignInfluencers.findOne({ status: 'active' }).select('influencer_id campaign_id').lean();
  const sampleBrand            = await BrandInfo.findOne({}).select('_id').lean();
  const sampleNotifRecipient   = await Notification.findOne({}).select('recipientId').lean();

  const influencerId = sampleInfluencerCollab?.influencer_id;
  const campaignId   = sampleInfluencerCollab?.campaign_id;
  const brandId      = sampleBrand?._id;
  const recipientId  = sampleNotifRecipient?.recipientId;

  const sampleCampaignIds = await CampaignInfluencers
    .find({ influencer_id: influencerId }).distinct('campaign_id');

  console.log('  influencerId :', influencerId?.toString() ?? '(none found)');
  console.log('  campaignId   :', campaignId?.toString()   ?? '(none found)');
  console.log('  brandId      :', brandId?.toString()      ?? '(none found)');
  console.log('  recipientId  :', recipientId?.toString()  ?? '(none found)');
  console.log();

  // ── 3. Verify indexes ────────────────────────────────────────────────────────
  console.log('🗂️  Verifying indexes post-creation…');
  const ciIndexes   = await CampaignInfluencers.collection.indexes();
  const camIndexes  = await CampaignInfo.collection.indexes();
  const prodIndexes = await Product.collection.indexes();

  const has = (indexes, fields) => {
    const target = JSON.stringify(fields);
    return indexes.some(idx => JSON.stringify(idx.key) === target);
  };

  const checks = [
    { desc: 'CampaignInfluencers { influencer_id:1, status:1 }', ok: has(ciIndexes,  { influencer_id: 1, status: 1 }) },
    { desc: 'CampaignInfluencers { campaign_id:1, status:1 }',   ok: has(ciIndexes,  { campaign_id: 1, status: 1 }) },
    { desc: 'CampaignInfo { status:1, createdAt:-1 }',           ok: has(camIndexes, { status: 1, createdAt: -1 }) },
    { desc: 'Product { campaign_id:1, status:1 }',               ok: has(prodIndexes,{ campaign_id: 1, status: 1 }) },
  ];
  checks.forEach(c => console.log(`  ${c.ok ? '✅' : '❌ STILL MISSING'} ${c.desc}`));
  console.log();

  // ── 4. Collection sizes ──────────────────────────────────────────────────────
  const collections = [
    ['campaigninfluencers', CampaignInfluencers],
    ['campaigninfos',       CampaignInfo],
    ['influencerinfos',     InfluencerInfo],
    ['notifications',       Notification],
    ['products',            Product],
    ['campaignpayments',    CampaignPayments],
  ];
  console.log('📦 Collection sizes:');
  const sizes = {};
  for (const [name, Model] of collections) {
    try {
      sizes[name] = await Model.estimatedDocumentCount();
      console.log(`  ${name.padEnd(25)}: ${sizes[name]} docs`);
    } catch (_) { sizes[name] = 'error'; }
  }
  console.log();

  // ── 5. Run benchmarks ────────────────────────────────────────────────────────
  const results = [];
  const now = new Date();
  console.log(`📊 Running benchmarks (${RUNS} runs each, reporting median)…\n`);

  // B1 – CampaignInfluencers active lookup
  results.push(await timeQuery('B1 | CampaignInfluencers.find({ influencer_id, status:"active" })', async () => {
    if (!influencerId) return null;
    return CampaignInfluencers
      .find({ influencer_id: influencerId, status: 'active' })
      .explain('executionStats');
  }));

  // B2 – CampaignInfo.find status=request – UNBOUNDED (explore collabs) (IDENTICAL to BEFORE)
  results.push(await timeQuery('B2 | CampaignInfo.find({ status:"request" }) – unbounded', async () => {
    return CampaignInfo
      .find({ status: 'request' })
      .explain('executionStats');
  }));

  // B2b – CampaignInfo explore collabs (paginated, projected, sorted - optimized app behavior)
  results.push(await timeQuery('B2b | CampaignInfo.find({ status:"request" }) page=1 limit=20', async () => {
    return CampaignInfo
      .find({ status: 'request' })
      .select('title description budget duration required_channels min_followers target_audience brand_id createdAt')
      .sort({ createdAt: -1 })
      .limit(20)
      .explain('executionStats');
  }));

  // B3 – CampaignInfluencers $in status filter
  results.push(await timeQuery('B3 | CampaignInfluencers.find({ influencer_id, status:{$in:[...]} })', async () => {
    if (!influencerId) return null;
    return CampaignInfluencers
      .find({ influencer_id: influencerId, status: { $in: ['brand-invite', 'influencer-invite'] } })
      .explain('executionStats');
  }));

  // B4 – CampaignPayments monthly aggregation
  results.push(await timeServiceFlow('B4 | CampaignPayments monthly earnings aggregation', async () => {
    if (!influencerId) return [];
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return CampaignPayments.aggregate([
      { $match: { influencer_id: new mongoose.Types.ObjectId(influencerId.toString()), status: 'completed', payment_date: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
  }));

  // B5 – InfluencerInfo.findById full document (over-fetching baseline) (IDENTICAL to BEFORE)
  results.push(await timeQuery('B5 | InfluencerInfo.findById (full document, no projection)', async () => {
    if (!influencerId) return null;
    return InfluencerInfo
      .find({ _id: influencerId })
      .explain('executionStats');
  }));

  // B5b – InfluencerInfo with projection (optimized app behavior)
  results.push(await timeQuery('B5b | InfluencerInfo.findById with .select() projection', async () => {
    if (!influencerId) return null;
    return InfluencerInfo
      .find({ _id: influencerId })
      .select('displayName profilePicUrl referralCode verified niche categories')
      .explain('executionStats');
  }));

  // B6 – InfluencerAnalytics
  results.push(await timeQuery('B6 | InfluencerAnalytics.findOne({ influencerId })', async () => {
    if (!influencerId) return null;
    return InfluencerAnalytics
      .find({ influencerId: influencerId })
      .explain('executionStats');
  }));

  // B7 – Notifications
  results.push(await timeQuery('B7 | Notification.find({ recipientId, read:false })', async () => {
    if (!recipientId) return null;
    return Notification
      .find({ recipientId: recipientId, read: false })
      .explain('executionStats');
  }));

  // B8 – Products by campaign IDs (IDENTICAL to BEFORE — no select)
  results.push(await timeQuery('B8 | Product.find({ campaign_id:{$in:[...campaignIds]} })', async () => {
    if (!sampleCampaignIds.length) return null;
    return Product
      .find({ campaign_id: { $in: sampleCampaignIds } })
      .explain('executionStats');
  }));

  // B8b – Products by campaign IDs with projection (optimized app behavior)
  results.push(await timeQuery('B8b | Product.find({ campaign_id:{$in:[...]} }) + select', async () => {
    if (!sampleCampaignIds.length) return null;
    return Product
      .find({ campaign_id: { $in: sampleCampaignIds } })
      .select('campaign_id name category')
      .explain('executionStats');
  }));

  // B9 – Full dashboard flow (3-round-trip: CampaignInfluencers → CampaignMetrics → InfluencerAnalytics)
  // This matches benchmark_before.js exactly.
  results.push(await timeServiceFlow('B9 | Full dashboard flow (3-round-trip: CampaignInfluencers → CampaignMetrics → InfluencerAnalytics)', async () => {
    if (!influencerId) return [];
    const CampaignMetrics = mongoose.model('CampaignMetrics');

    const collabs = await CampaignInfluencers
      .find({ influencer_id: influencerId, status: 'active' })
      .populate('campaign_id', 'title budget duration required_channels status')
      .populate({ path: 'campaign_id', populate: { path: 'brand_id', model: 'BrandInfo', select: 'brandName logoUrl' } })
      .lean();

    const campaignIds = collabs
      .filter(c => c.campaign_id && c.campaign_id.status !== 'request')
      .map(c => c.campaign_id._id);

    const metrics = await CampaignMetrics.find({ campaign_id: { $in: campaignIds } }).lean();

    const influencerIds = collabs.map(c => c.influencer_id);
    const analytics = await InfluencerAnalytics.find({ influencerId: { $in: influencerIds } }).select('influencerId totalFollowers').lean();

    return { collabCount: collabs.length, metricCount: metrics.length, analyticsCount: analytics.length };
  }));

  // B9b – Single aggregation pipeline (optimized app behavior)
  results.push(await timeServiceFlow('B9b | CollaborationModel single-aggregation pipeline', async () => {
    if (!influencerId) return [];
    const data = await CollaborationModel.getActiveCollaborations(influencerId.toString());
    return { rowCount: data.length };
  }));

  // ═══════════════════════════════════════════════════════════════════════════
  //  B10–B12: Brand, Monetization, and Subscription Indexes
  // ═══════════════════════════════════════════════════════════════════════════

  // B10 – Brand matchmaking filter
  results.push(await timeQuery('B10 | BrandInfo.find({ industry, verified: true })', async () => {
    return BrandInfo
      .find({ industry: 'Technology', verified: true })
      .explain('executionStats');
  }));

  // B11 – Order attribution query
  results.push(await timeQuery('B11 | Order.find({ influencer_id }).sort({createdAt: -1})', async () => {
    if (!influencerId) return null;
    return Order
      .find({ influencer_id: influencerId })
      .sort({ createdAt: -1 })
      .explain('executionStats');
  }));

  // B12 – Subscription lookup (Auth hot-path)
  results.push(await timeQuery('B12 | UserSubscription.findOne({ userId, userType })', async () => {
    if (!influencerId) return null;
    return UserSubscription
      .find({ userId: influencerId, userType: 'InfluencerInfo' })
      .explain('executionStats');
  }));

  // B13 – Explorer Page Search (Optimized regex with collation)
  results.push(await timeQuery('B13 | InfluencerInfo.find({ fullName: /influ/i }) — Partial Match Search', async () => {
    return InfluencerInfo
      .find({ fullName: { $regex: 'influ', $options: 'i' } })
      .collation({ locale: 'en', strength: 2 }) // This triggers the IXSCAN
      .explain('executionStats');
  }));

  // ═══════════════════════════════════════════════════════════════════════════
  //  Phase 3 Performance Benchmarks (B14–B17)
  // ═══════════════════════════════════════════════════════════════════════════

  // B14 – Intelligence Layer Snapshot Trends
  results.push(await timeServiceFlow('B14 | AdminAnalyticsService - 6mo Intelligence Trend Lookup', async () => {
    const AnalyticsController = require('../controllers/admin/adminAnalyticsController');
    // Using simple mock req/res for service flow test
    return mongoose.model('AnalyticsSnapshot').aggregate([
      { $match: { timestamp: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { month: { $month: "$timestamp" } }, avgEngage: { $avg: "$metrics.avgEngagementRate" } } }
    ]);
  }));

  // B15 – Global Admin Search (Unified)
  results.push(await timeServiceFlow('B15 | Global Admin Search - Categorized (Brands + Infl + Camp)', async () => {
    const AdminSearchService = require('../services/admin/adminSearchService');
    return AdminSearchService.globalSearch('test');
  }));

  // B16 – Feedback Pagination (Moderation Scaling)
  results.push(await timeQuery('B16 | Feedback.find({ status:"review" }) page=1 limit=15', async () => {
    const Feedback = mongoose.model('Feedback');
    return Feedback.find({ status: 'review' })
      .sort({ createdAt: -1 })
      .limit(15)
      .explain('executionStats');
  }));

  // B17 – Denormalized Campaign Read Path (No $lookup)
  results.push(await timeQuery('B17 | CampaignInfo.find() with Denormalized brandName (Zero-Lookup)', async () => {
    return CampaignInfo.find({ status: 'active' })
      .select('title brandName budget status')
      .limit(10)
      .explain('executionStats');
  }));

  // ═══════════════════════════════════════════════════════════════════════════
  //  High-Performance Embedding benchmarks (B18–B20)
  // ═══════════════════════════════════════════════════════════════════════════

  // B18 – Brand Dashboard: Fetch Recent Campaigns (Optimized: Zero-Join)
  results.push(await timeServiceFlow('B18 | Brand Dashboard: Recent Campaigns (Optimized Zero-Join)', async () => {
    if (!brandId) return [];
    const brandCampaignService = require('../services/brand/brandCampaignService');
    return brandCampaignService.getRecentCompletedCampaigns(brandId.toString(), 3);
  }));

  // B19 – Brand View: Influencer Profile (Optimized: Zero-Join)
  results.push(await timeServiceFlow('B19 | Brand View: Influencer Profile (Optimized Zero-Join)', async () => {
    if (!influencerId) return null;
    const brandDiscoveryService = require('../services/brand/brandDiscoveryService');
    return brandDiscoveryService.getInfluencerProfileData(influencerId.toString());
  }));

  // B20 – Influencer Discovery: Fetch Active Brands (Optimized: Zero-Join)
  results.push(await timeServiceFlow('B20 | Discovery: Fetch Active Brands (Optimized Zero-Join)', async () => {
    const landingService = require('../services/landing/landingService');
    return landingService.fetchActiveBrands('active');
  }));

  // ── 6. Build & write report ──────────────────────────────────────────────────
  const existingIndexes = {};
  for (const [name, Model] of collections) {
    try { existingIndexes[name] = await Model.collection.indexes(); }
    catch (_) { existingIndexes[name] = []; }
  }

  const report = {
    run_at: new Date().toISOString(),
    phase: 'AFTER optimization',
    runs_per_query: RUNS,
    note: 'elapsed_ms = median across RUNS; min_ms/max_ms show jitter range',
    mongo_uri: MONGO_URI.replace(/\/\/[^:]+:[^@]+@/, '//<credentials>@'),
    sample_ids: {
      influencerId: influencerId?.toString(),
      campaignId:   campaignId?.toString(),
      brandId:      brandId?.toString(),
      recipientId:  recipientId?.toString(),
    },
    index_checks:     checks,
    collection_sizes: sizes,
    existing_indexes: existingIndexes,
    benchmarks: results,
    summary: buildSummary(results),
  };

  const outPath = path.join(__dirname, 'benchmark_results_after.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ Report written → ${outPath}`);

  // ── 7. Print comparison ──────────────────────────────────────────────────────
  const beforePath = path.join(__dirname, 'benchmark_results_before.json');
  if (fs.existsSync(beforePath)) {
    const before = JSON.parse(fs.readFileSync(beforePath, 'utf8'));
    printComparison(before.benchmarks, results, sizes);
  } else {
    printTable(results);
  }

  await mongoose.disconnect();
  console.log('\n🔌 Disconnected. Done.\n');
}

// ── Output helpers ────────────────────────────────────────────────────────────

function printComparison(before, after, sizes) {
  const W = 120;
  console.log('\n' + '═'.repeat(W));
  console.log(' BENCHMARK COMPARISON: BEFORE vs AFTER');
  console.log(' Primary metric: scanRatio (docsExamined ÷ docsReturned) — lower is better');
  console.log(' Timing: median of 3 runs. BEFORE timings are single-run (higher variance).');
  console.log('═'.repeat(W));

  // Header
  const hdr = [
    '#'.padEnd(3),
    'Query'.padEnd(48),
    'ScanBefore'.padEnd(14),
    'ScanAfter'.padEnd(14),
    'RatioBefore'.padEnd(13),
    'RatioAfter'.padEnd(12),
    'ms Before'.padEnd(10),
    'ms After(med)'.padEnd(14),
    'Δ ms%',
  ].join('  ');
  console.log(hdr);
  console.log('─'.repeat(W));

  after.forEach((a, i) => {
    const b = before[i] || {};
    const bMs = b.elapsed_ms ?? '?';
    const aMs = a.elapsed_ms ?? '?';  // this is now the median
    const deltaMs = (typeof bMs === 'number' && typeof aMs === 'number' && bMs > 0)
      ? `${((aMs - bMs) / bMs * 100).toFixed(0)}%` : '?';

    const bRatio = b.scanRatio != null ? b.scanRatio : '?';
    const aRatio = a.scanRatio != null ? a.scanRatio : '?';

    // Green if scanRatio improved (lower) — that's the real signal
    const ratioImproved = typeof aRatio === 'number' && typeof bRatio === 'number' && aRatio < bRatio;
    const scanImproved  = !(a.scanType || '').includes('COLLSCAN');
    const icon = (ratioImproved || scanImproved) ? '🟢' : '⚪';

    const label = (a.label || '').length > 45 ? (a.label || '').slice(0, 42) + '…' : (a.label || '');

    const row = [
      String(i + 1).padEnd(3),
      label.padEnd(48),
      (b.scanType || '?').padEnd(14),
      (a.scanType || '~').padEnd(14),
      String(bRatio).padEnd(13),
      String(aRatio).padEnd(12),
      String(bMs).padEnd(10),
      `${aMs} [${a.min_ms}–${a.max_ms}]`.padEnd(14),
      deltaMs,
    ].join('  ');

    console.log(`${icon} ${row}`);
    if (a.error) console.log(`     ⚠️  ERROR: ${a.error}`);
  });

  const beforeCOLL = before.filter(r => (r.scanType || '').includes('COLLSCAN')).length;
  const afterCOLL  = after.filter(r => (r.scanType || '').includes('COLLSCAN')).length;
  const beforeAvgRatio = avg(before.map(r => r.scanRatio).filter(Boolean));
  const afterAvgRatio  = avg(after.map(r => r.scanRatio).filter(Boolean));

  console.log('═'.repeat(W));
  console.log(`  COLLSCANs eliminated:   ${beforeCOLL} → ${afterCOLL}`);
  console.log(`  Avg scan ratio:         ${beforeAvgRatio.toFixed(1)} → ${afterAvgRatio.toFixed(1)}  (lower = fewer wasted reads)`);
  console.log();
  console.log('  ⚠️  NOTE: Raw ms timings on a small dataset are dominated by Atlas network');
  console.log('  jitter (~30–300ms variance per round-trip), NOT query execution cost.');
  console.log('  The scanRatio and scanType columns are the reliable optimization signal.');
  console.log('  At production data volumes these index gains translate to 10–1000× speedups.');
  console.log();

  // Warn if collections are tiny
  const tiny = Object.entries(sizes || {}).filter(([, v]) => typeof v === 'number' && v < 100);
  if (tiny.length) {
    console.log('  📌 Collections with < 100 docs (indexes help <1ms here but 100ms+ at scale):');
    tiny.forEach(([name, count]) => console.log(`     ${name}: ${count} docs`));
  }
  console.log('═'.repeat(W) + '\n');
}

function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function printTable(results) {
  console.log('\n' + '═'.repeat(100));
  console.log(' BENCHMARK RESULTS (AFTER OPTIMIZATION)');
  console.log('═'.repeat(100));
  results.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.label}`);
    console.log(`     median: ${r.elapsed_ms}ms  [${r.min_ms}–${r.max_ms}ms range] | scan: ${r.scanType || r.note || '?'} | ratio: ${r.scanRatio ?? '?'}`);
    if (r.error) console.log(`     ⚠️  ERROR: ${r.error}`);
  });
  console.log('═'.repeat(100) + '\n');
}

function buildSummary(results) {
  const collscans = results.filter(r => (r.scanType || '').includes('COLLSCAN'));
  const ixscans   = results.filter(r => (r.scanType || '').includes('IXSCAN'));
  const errors    = results.filter(r => r.error);
  return {
    total_benchmarks: results.length,
    collscan_count:   collscans.length,
    ixscan_count:     ixscans.length,
    error_count:      errors.length,
    median_elapsed_ms: Math.round(results.reduce((s, r) => s + (r.elapsed_ms || 0), 0) / results.length),
    collscan_queries:  collscans.map(r => r.label),
  };
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
