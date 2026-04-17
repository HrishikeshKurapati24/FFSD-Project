/**
 * benchmark_before.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 1 – Pre-Optimization Benchmarking
 *
 * Connects to the LIVE cloud MongoDB (Collab_Sync_DB), runs 9 benchmark
 * queries using explain('executionStats'), measures wall-clock time, and
 * writes a JSON report to scripts/benchmark_results_before.json.
 *
 * Usage:
 *   node scripts/benchmark_before.js
 *
 * Prerequisites:
 *   MONGO_URI must be set in .env OR as an environment variable.
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// ── Connection ──────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌  MONGO_URI not set. Add it to .env or pass as env var.');
  process.exit(1);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Wrap a Mongoose query execution and return timing + explain stats */
async function timeQuery(label, queryFn) {
  const start = Date.now();
  let explainStats = null;
  let error = null;

  try {
    explainStats = await queryFn();
  } catch (err) {
    error = err.message;
  }

  const elapsed = Date.now() - start;

  const result = { label, elapsed_ms: elapsed };

  if (error) {
    result.error = error;
    return result;
  }

  // Normalize – explain() can return different shapes depending on Mongoose version
  const stats = explainStats?.executionStats
    || explainStats?.[0]?.executionStats
    || explainStats?.stages?.[0]?.$cursor?.executionStats
    || {};

  result.executionTimeMillis = stats.executionTimeMillis ?? null;
  result.totalDocsExamined  = stats.totalDocsExamined  ?? null;
  result.totalDocsReturned  = stats.nReturned          ?? null;
  result.indexesUsed        = extractIndexes(explainStats);
  result.scanType           = detectScanType(explainStats);
  result.scanRatio          = (result.totalDocsExamined && result.totalDocsReturned)
    ? parseFloat((result.totalDocsExamined / Math.max(result.totalDocsReturned, 1)).toFixed(2))
    : null;

  return result;
}

/** Pull index names from explain output */
function extractIndexes(explain) {
  try {
    const plan = explain?.queryPlanner?.winningPlan
      || explain?.[0]?.queryPlanner?.winningPlan
      || {};
    const names = [];
    function walk(node) {
      if (!node) return;
      if (node.indexName) names.push(node.indexName);
      if (node.inputStage) walk(node.inputStage);
      if (node.inputStages) node.inputStages.forEach(walk);
    }
    walk(plan);
    return names.length ? names : ['(none)'];
  } catch (_) {
    return ['(unknown)'];
  }
}

/** Detect COLLSCAN vs IXSCAN */
function detectScanType(explain) {
  try {
    const str = JSON.stringify(explain);
    if (str.includes('"COLLSCAN"')) return 'COLLSCAN ⚠️';
    if (str.includes('"IXSCAN"'))  return 'IXSCAN ✅';
    return 'UNKNOWN';
  } catch (_) {
    return 'UNKNOWN';
  }
}

/** Wall-clock timer for multi-step service flows (no explain) */
async function timeServiceFlow(label, asyncFn) {
  const start = Date.now();
  let error = null;
  let rowsReturned = 0;

  try {
    const result = await asyncFn();
    if (Array.isArray(result)) rowsReturned = result.length;
    else if (result && typeof result === 'object') rowsReturned = 1;
  } catch (err) {
    error = err.message;
  }

  return {
    label,
    elapsed_ms: Date.now() - start,
    rowsReturned,
    note: 'Service-flow timer (no explain – aggregation or multi-step)',
    ...(error ? { error } : {})
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔌 Connecting to MongoDB…');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected\n');

  // ── Load Models ────────────────────────────────────────────────────────────
  // We register models exactly as the app does so collection names match
  const { CampaignInfo, CampaignInfluencers, CampaignPayments } = require('../models/CampaignMongo');
  const { InfluencerInfo, InfluencerAnalytics }                 = require('../models/InfluencerMongo');
  const { BrandInfo }                                            = require('../models/BrandMongo');
  const { Product }                                              = require('../models/ProductMongo');
  const { Notification }                                         = require('../models/NotificationMongo');

  // ── 0. Drop ALL existing indexes for a clean slate (Pre-Optimization) ──────
  console.log('🗑️  Dropping all existing indexes for Pre-Optimization baseline…');
  const modelsToDrop = [
    CampaignInfo, CampaignInfluencers, CampaignPayments, 
    InfluencerInfo, BrandInfo, Product, Notification, 
    InfluencerAnalytics
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

  // ── Discover Sample IDs From Live Data ────────────────────────────────────
  // We fetch one real document of each type so the benchmarks hit real data.
  console.log('🔍 Discovering sample IDs from live data…');

  const sampleInfluencer = await InfluencerInfo.findOne({ verified: true }).select('_id').lean();
  const sampleBrand      = await BrandInfo.findOne({}).select('_id').lean();
  const sampleCampaign   = await CampaignInfo.findOne({ status: { $in: ['active', 'request'] } }).select('_id').lean();
  const sampleInfluencerCollab = await CampaignInfluencers.findOne({ status: 'active' }).select('influencer_id campaign_id').lean();
  const sampleNotifRecipient = await Notification.findOne({}).select('recipientId').lean();

  const influencerId  = sampleInfluencerCollab?.influencer_id || sampleInfluencer?._id;
  const campaignId    = sampleInfluencerCollab?.campaign_id   || sampleCampaign?._id;
  const brandId       = sampleBrand?._id;
  const recipientId   = sampleNotifRecipient?.recipientId;

  const sampleCampaignIds = await CampaignInfluencers
    .find({ influencer_id: influencerId })
    .distinct('campaign_id');

  console.log('  influencerId :', influencerId?.toString() ?? '(none found)');
  console.log('  campaignId   :', campaignId?.toString()   ?? '(none found)');
  console.log('  brandId      :', brandId?.toString()      ?? '(none found)');
  console.log('  recipientId  :', recipientId?.toString()  ?? '(none found)');
  console.log();

  if (!influencerId) {
    console.warn('⚠️  No influencer with active collab found – some B-series benchmarks will be skipped.');
  }

  // ── Run Individual Query Benchmarks ───────────────────────────────────────
  const results = [];
  const now = new Date();

  console.log('📊 Running benchmarks…\n');

  // B1 – CampaignInfluencers active lookup (hot path: influencer dashboard)
  results.push(await timeQuery('B1 | CampaignInfluencers.find({ influencer_id, status:"active" })', async () => {
    if (!influencerId) return null;
    return CampaignInfluencers
      .find({ influencer_id: influencerId, status: 'active' })
      .explain('executionStats');
  }));

  // B2 – CampaignInfo.find status=request – UNBOUNDED (explore collabs)
  results.push(await timeQuery('B2 | CampaignInfo.find({ status:"request" }) – unbounded', async () => {
    return CampaignInfo
      .find({ status: 'request' })
      .explain('executionStats');
  }));

  // B3 – CampaignInfluencers status $in (brand-invite / influencer-invite filter)
  results.push(await timeQuery('B3 | CampaignInfluencers.find({ influencer_id, status:{$in:[...]} })', async () => {
    if (!influencerId) return null;
    return CampaignInfluencers
      .find({ influencer_id: influencerId, status: { $in: ['brand-invite', 'influencer-invite'] } })
      .explain('executionStats');
  }));

  // B4 – CampaignPayments monthly earnings aggregation (no date index)
  results.push(await timeServiceFlow('B4 | CampaignPayments monthly earnings aggregation', async () => {
    if (!influencerId) return [];
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return CampaignPayments.aggregate([
      { $match: { influencer_id: new mongoose.Types.ObjectId(influencerId?.toString()), status: 'completed', payment_date: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
  }));

  // B5 – InfluencerInfo.findById full document (over-fetching baseline)
  results.push(await timeQuery('B5 | InfluencerInfo.findById (full document, no projection)', async () => {
    if (!influencerId) return null;
    return InfluencerInfo
      .find({ _id: influencerId })
      .explain('executionStats');
  }));

  // B6 – InfluencerAnalytics separate fetch (always paired with B5)
  results.push(await timeQuery('B6 | InfluencerAnalytics.findOne({ influencerId }) – separate round-trip', async () => {
    if (!influencerId) return null;
    return InfluencerAnalytics
      .find({ influencerId: influencerId })
      .explain('executionStats');
  }));

  // B7 – Notification fetch by recipientId
  results.push(await timeQuery('B7 | Notification.find({ recipientId, read:false })', async () => {
    if (!recipientId) return null;
    return Notification
      .find({ recipientId: recipientId, read: false })
      .explain('executionStats');
  }));

  // B8 – Product.find by campaign_id $in (unbounded)
  results.push(await timeQuery('B8 | Product.find({ campaign_id:{$in:[...campaignIds]} })', async () => {
    if (!sampleCampaignIds.length) return null;
    return (require('../models/ProductMongo').Product)
      .find({ campaign_id: { $in: sampleCampaignIds } })
      .explain('executionStats');
  }));

  // B9 – Full dashboard service-flow: getActiveCollaborations equivalent
  //      3 sequential round-trips as the current code does it.
  results.push(await timeServiceFlow('B9 | Full dashboard flow (3-round-trip: CampaignInfluencers → CampaignMetrics → InfluencerAnalytics)', async () => {
    if (!influencerId) return [];
    const CampaignMetrics = mongoose.model('CampaignMetrics');

    // Round-trip 1: fetch active collabs with nested populate (as current code)
    const collabs = await CampaignInfluencers
      .find({ influencer_id: influencerId, status: 'active' })
      .populate('campaign_id', 'title budget duration required_channels status')
      .populate({ path: 'campaign_id', populate: { path: 'brand_id', model: 'BrandInfo', select: 'brandName logoUrl' } })
      .lean();

    const campaignIds = collabs
      .filter(c => c.campaign_id && c.campaign_id.status !== 'request')
      .map(c => c.campaign_id._id);

    // Round-trip 2: fetch campaign metrics
    const metrics = await CampaignMetrics.find({ campaign_id: { $in: campaignIds } }).lean();

    // Round-trip 3: fetch follower counts from InfluencerAnalytics
    const influencerIds = collabs.map(c => c.influencer_id);
    const analytics = await InfluencerAnalytics.find({ influencerId: { $in: influencerIds } }).select('influencerId totalFollowers').lean();

    return { collabCount: collabs.length, metricCount: metrics.length, analyticsCount: analytics.length };
  }));

  // ═══════════════════════════════════════════════════════════════════════════
  //  B10–B12: Brand, Monetization, and Subscription Indexes
  // ═══════════════════════════════════════════════════════════════════════════

  // B10 – Brand matchmaking filter (Legacy: full scan without compound indexing)
  results.push(await timeQuery('B10 | BrandInfo.find({ industry, verified: true })', async () => {
    const { BrandInfo } = require('../models/BrandMongo');
    return BrandInfo
      .find({ industry: 'Technology', verified: true })
      .explain('executionStats');
  }));

  // B11 – Order attribution query (Legacy: scan every order)
  results.push(await timeQuery('B11 | Order.find({ influencer_id }).sort({createdAt: -1})', async () => {
    if (!influencerId) return null;
    const { Order } = require('../models/OrderMongo');
    return Order
      .find({ influencer_id: influencerId })
      .sort({ createdAt: -1 })
      .explain('executionStats');
  }));

  // B12 – Subscription lookup (Legacy: unindexed auth check)
  results.push(await timeQuery('B12 | UserSubscription.findOne({ userId, userType })', async () => {
    if (!influencerId) return null;
    return UserSubscription
      .find({ userId: influencerId, userType: 'influencer' })
      .explain('executionStats');
  }));

  // B13 – Explorer Page Search (Baseline regex on name/username)
  results.push(await timeQuery('B13 | InfluencerInfo.find({ fullName: /influ/i }) — Partial Match Search', async () => {
    return InfluencerInfo
      .find({ fullName: { $regex: 'influ', $options: 'i' } })
      .explain('executionStats');
  }));

  // ═══════════════════════════════════════════════════════════════════════════
  //  Phase 3 Legacy Baselines (B14–B17)
  // ═══════════════════════════════════════════════════════════════════════════

  // B14 – Legacy Analytics Trend (Raw aggregation without snapshots)
  results.push(await timeServiceFlow('B14 | Legacy Analytics - Raw Monthly Aggregation (No Snapshots)', async () => {
    // Simulating what it takes to calculate metrics on the fly from raw data
    return CampaignInfluencers.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { month: { $month: "$createdAt" } }, count: { $sum: 1 }, avgReach: { $avg: "$reach" } } }
    ]);
  }));

  // B15 – Legacy Global Search (Separate unindexed regex queries)
  results.push(await timeServiceFlow('B15 | Legacy Global Search - Brute Force Regex (3 queries)', async () => {
    const query = 'test';
    const [brands, influencers, campaigns] = await Promise.all([
      BrandInfo.find({ brandName: { $regex: query, $options: 'i' } }).limit(10).lean(),
      InfluencerInfo.find({ fullName: { $regex: query, $options: 'i' } }).limit(10).lean(),
      CampaignInfo.find({ title: { $regex: query, $options: 'i' } }).limit(10).lean()
    ]);
    return { brands: brands.length, influencers: influencers.length, campaigns: campaigns.length };
  }));

  // B16 – Legacy Feedback Retrieval (Full fetch, no pagination)
  results.push(await timeQuery('B16 | Feedback.find() - Legacy Full Fetch (No Pagination)', async () => {
    // Note: We use a model that likely has no index yet
    const Feedback = mongoose.model('Feedback', new mongoose.Schema({}, { strict: false }), 'feedbacks');
    return Feedback.find({ status: 'review' }).explain('executionStats');
  }));

  // B17 – Legacy Campaign Read Path (Expensive $lookup join)
  results.push(await timeQuery('B17 | CampaignInfo + $lookup BrandName (Legacy Join)', async () => {
    return CampaignInfo.aggregate([
      { $match: { status: 'active' } },
      { $limit: 10 },
      { $lookup: { from: 'brandinfos', localField: 'brand_id', foreignField: '_id', as: 'brand' } },
      { $unwind: '$brand' },
      { $project: { title: 1, brandName: '$brand.brandName', budget: 1, status: 1 } }
    ]).explain('executionStats');
  }));

  // ═══════════════════════════════════════════════════════════════════════════
  //  High-Performance Embedding Baselines (B18–B20)
  // ═══════════════════════════════════════════════════════════════════════════

  // B18 – Brand Dashboard: Fetch Recent Campaigns (Baseline: parallel Metrics + Product fetches)
  results.push(await timeServiceFlow('B18 | Brand Dashboard: Recent Campaigns (Legacy Parallel Fetch)', async () => {
    if (!brandId) return [];
    const campaignIds = (await CampaignInfo.find({ brand_id: brandId, status: 'completed' }).limit(3).select('_id').lean()).map(c => c._id);
    const [metrics, products] = await Promise.all([
      CampaignMetrics.find({ campaign_id: { $in: campaignIds } }).lean(),
      Product.find({ campaign_id: { $in: campaignIds } }).lean()
    ]);
    return { campaignCount: campaignIds.length, metricCount: metrics.length, productCount: products.length };
  }));

  // B19 – Brand View: Influencer Profile (Baseline: parallel Socials + Analytics + Campaigns fetches)
  results.push(await timeServiceFlow('B19 | Brand View: Influencer Profile (Legacy Parallel Fetch)', async () => {
    if (!influencerId) return null;
    const [socials, analytics, campaigns] = await Promise.all([
      InfluencerSocials.findOne({ influencerId }).lean(),
      InfluencerAnalytics.findOne({ influencerId }).lean(),
      CampaignInfluencers.find({ influencer_id: influencerId }).limit(5).lean()
    ]);
    return { hasSocials: !!socials, hasAnalytics: !!analytics, collabCount: campaigns.length };
  }));

  // B20 – Influencer Discovery: Fetch Active Brands (Baseline: manual random placeholder logic)
  results.push(await timeServiceFlow('B20 | Discovery: Fetch Active Brands (Legacy Generic Pull)', async () => {
    const brands = await BrandInfo.find({ status: 'active' }).limit(10).select('brandName industry logoUrl').lean();
    return brands;
  }));

  // ── Count documents in each collection (for scale context) ─────────────────
  console.log('\n📦 Collection sizes…');
  const sizes = {};
  const collections = [
    ['campaigninfluencers',  CampaignInfluencers],
    ['campaigninfos',        CampaignInfo],
    ['influencerinfos',      InfluencerInfo],
    ['notifications',        Notification],
    ['products',             require('../models/ProductMongo').Product],
    ['campaignpayments',     CampaignPayments],
  ];
  for (const [name, Model] of collections) {
    try {
      sizes[name] = await Model.estimatedDocumentCount();
      console.log(`  ${name.padEnd(25)} : ${sizes[name]} docs`);
    } catch (_) {
      sizes[name] = 'error';
    }
  }

  // ── Existing Indexes (snapshot BEFORE optimization) ───────────────────────
  console.log('\n🗂️  Existing indexes (before optimization)…');
  const existingIndexes = {};
  for (const [name, Model] of collections) {
    try {
      existingIndexes[name] = await Model.collection.indexes();
    } catch (_) {
      existingIndexes[name] = [];
    }
  }

  // ── Compose Report ─────────────────────────────────────────────────────────
  const report = {
    run_at:     new Date().toISOString(),
    phase:      'BEFORE optimization',
    mongo_uri:  MONGO_URI.replace(/\/\/[^:]+:[^@]+@/, '//<credentials>@'), // redact credentials
    sample_ids: {
      influencerId: influencerId?.toString(),
      campaignId:   campaignId?.toString(),
      brandId:      brandId?.toString(),
      recipientId:  recipientId?.toString(),
    },
    collection_sizes: sizes,
    existing_indexes: existingIndexes,
    benchmarks: results,
    summary: buildSummary(results),
  };

  // ── Write Report ────────────────────────────────────────────────────────────
  const outPath = path.join(__dirname, 'benchmark_results_before.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ Report written → ${outPath}`);

  // ── Print Table to Console ──────────────────────────────────────────────────
  printTable(results);

  await mongoose.disconnect();
  console.log('\n🔌 Disconnected. Done.\n');
}

// ── Summary helpers ──────────────────────────────────────────────────────────
function buildSummary(results) {
  const collscans  = results.filter(r => (r.scanType || '').includes('COLLSCAN'));
  const ixscans    = results.filter(r => (r.scanType || '').includes('IXSCAN'));
  const errors     = results.filter(r => r.error);
  const avgElapsed = results.reduce((s, r) => s + (r.elapsed_ms || 0), 0) / results.length;

  return {
    total_benchmarks: results.length,
    collscan_count:   collscans.length,
    ixscan_count:     ixscans.length,
    error_count:      errors.length,
    avg_elapsed_ms:   Math.round(avgElapsed),
    collscan_queries: collscans.map(r => r.label),
  };
}

function printTable(results) {
  console.log('\n══════════════════════════════════════════════════════════════════════════════');
  console.log(' BENCHMARK RESULTS (BEFORE OPTIMIZATION)');
  console.log('══════════════════════════════════════════════════════════════════════════════');
  const colW = [4, 60, 12, 14, 14, 12];
  const header = ['#', 'Query', 'Elapsed ms', 'DocsExamined', 'DocsReturned', 'ScanType'];
  console.log(header.map((h, i) => h.padEnd(colW[i])).join('  '));
  console.log('─'.repeat(120));

  results.forEach((r, i) => {
    const label = r.label.length > 57 ? r.label.slice(0, 54) + '…' : r.label;
    const row = [
      String(i + 1).padEnd(colW[0]),
      label.padEnd(colW[1]),
      String(r.elapsed_ms ?? '?').padEnd(colW[2]),
      String(r.totalDocsExamined ?? r.rowsReturned ?? '?').padEnd(colW[3]),
      String(r.totalDocsReturned ?? '?').padEnd(colW[4]),
      (r.scanType || r.note?.slice(0, 10) || '?').padEnd(colW[5]),
    ];
    console.log(row.join('  '));
    if (r.error) console.log(`   ⚠️  ERROR: ${r.error}`);
  });
  console.log('══════════════════════════════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
