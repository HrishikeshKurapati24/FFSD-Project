/**
 * migrate_p3_embeds.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 3 Denormalization & Migration Script
 *
 * This script runs the P3 Embedding operations to optimize dashboard queries:
 *  1. InfluencerSocials + InfluencerAnalytics ➔ InfluencerInfo (Embed)
 *  2. BrandSocials + BrandAnalytics ➔ BrandInfo (Embed)
 *  3. CampaignMetrics ➔ CampaignInfo (Embed)
 *  4. Notification TTL Backfill (adds expiresAt = createdAt + 30d)
 *  5. Order History Capping (limits status_history array to 20 entries)
 *
 * Uses MongoDB cursors and bulkWrite for safe, low-memory execution.
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

require('dotenv').config();
const mongoose = require('mongoose');

async function runMigration() {
  console.log('\n🚀 Starting Phase 3 Data Migration (Denormalization & Fixes)...');

  const { InfluencerInfo, InfluencerAnalytics, InfluencerSocials } = require('../models/InfluencerMongo');
  const { BrandInfo, BrandAnalytics, BrandSocials }                = require('../models/BrandMongo');
  const { CampaignInfo, CampaignMetrics }                          = require('../models/CampaignMongo');
  const { Notification }                                           = require('../models/NotificationMongo');
  const { Order }                                                  = require('../models/OrderMongo');

  const BULK_BATCH_SIZE = 500;

  // ── 1. Update Notifications TTL ─────────────────────────────────────────────
  console.log('  ➜ 1/5: Running Notification TTL Backfill...');
  // updateMany using an aggregation pipeline wrapper (requires MongoDB 4.2+)
  const notifResult = await Notification.updateMany(
    { expiresAt: null },
    [{ $set: { expiresAt: { $add: ["$createdAt", 30 * 24 * 60 * 60 * 1000] } } }]
  );
  console.log(`     ✅ Backfilled TTL expiresAt for ${notifResult.modifiedCount} legacy notifications.`);

  // ── 2. Order History Capping ────────────────────────────────────────────────
  console.log('  ➜ 2/5: Applying Order History $slice bounds...');
  // Ensure array never grows past 20 items (keeping the newest elements at the end)
  const orderResult = await Order.updateMany(
    {},
    [{ $set: { status_history: { $slice: ["$status_history", -20] } } }]
  );
  console.log(`     ✅ Enforced bounds on ${orderResult.modifiedCount} orders.`);

  // ── 3. Influencer Consolidation ──────────────────────────────────────────────
  console.log('  ➜ 3/5: Migrating Influencer Analytics & Socials -> InfluencerInfo...');
  let iCursor = InfluencerInfo.find().lean().cursor();
  let iCount = 0, iUpdated = 0;
  let iBulkOps = [];

  for await (const influencer of iCursor) {
    const socials = await InfluencerSocials.findOne({ influencerId: influencer._id }).lean();
    const analytics = await InfluencerAnalytics.findOne({ influencerId: influencer._id }).lean();

    iBulkOps.push({
      updateOne: {
        filter: { _id: influencer._id },
        update: {
          $set: {
            socialProfiles: socials ? socials.platforms : [],
            stats: {
              totalFollowers: analytics?.totalFollowers || 0,
              avgEngagementRate: analytics?.engagementRate || 0,
              monthlyEarnings: analytics?.earnings || 0,
              rating: analytics?.rating || 0
            }
          }
        }
      }
    });

    iCount++;
    if (iBulkOps.length >= BULK_BATCH_SIZE) {
      const res = await InfluencerInfo.bulkWrite(iBulkOps);
      iUpdated += res.modifiedCount;
      iBulkOps = [];
      console.log(`     ... processed ${iCount} influencers`);
    }
  }
  if (iBulkOps.length > 0) {
    const res = await InfluencerInfo.bulkWrite(iBulkOps);
    iUpdated += res.modifiedCount;
  }
  console.log(`     ✅ Fully migrated ${iUpdated}/${iCount} Influencer documents.`);

  // ── 4. Brand Consolidation ───────────────────────────────────────────────────
  console.log('  ➜ 4/5: Migrating Brand Analytics & Socials -> BrandInfo...');
  let bCursor = BrandInfo.find().lean().cursor();
  let bCount = 0, bUpdated = 0;
  let bBulkOps = [];

  for await (const brand of bCursor) {
    const socials = await BrandSocials.findOne({ brandId: brand._id }).lean();
    const analytics = await BrandAnalytics.findOne({ brandId: brand._id }).lean();

    bBulkOps.push({
      updateOne: {
        filter: { _id: brand._id },
        update: {
          $set: {
            socialProfiles: socials ? socials.platforms : [],
            campaignStats: {
              totalCampaigns: analytics?.totalCampaigns || 0,
              activeCampaigns: analytics?.activeCampaigns || 0,
              totalSpend: analytics?.totalSpend || 0
            }
          }
        }
      }
    });

    bCount++;
    if (bBulkOps.length >= BULK_BATCH_SIZE) {
      const res = await BrandInfo.bulkWrite(bBulkOps);
      bUpdated += res.modifiedCount;
      bBulkOps = [];
      console.log(`     ... processed ${bCount} brands`);
    }
  }
  if (bBulkOps.length > 0) {
    const res = await BrandInfo.bulkWrite(bBulkOps);
    bUpdated += res.modifiedCount;
  }
  console.log(`     ✅ Fully migrated ${bUpdated}/${bCount} Brand documents.`);

  // ── 5. Campaign Metrics Consolidation ───────────────────────────────────────
  console.log('  ➜ 5/5: Migrating Campaign Progress -> CampaignInfo...');
  let cCursor = CampaignInfo.find().lean().cursor();
  let cCount = 0, cUpdated = 0;
  let cBulkOps = [];

  for await (const campaign of cCursor) {
    const metrics = await CampaignMetrics.findOne({ campaign_id: campaign._id }).lean();

    cBulkOps.push({
      updateOne: {
        filter: { _id: campaign._id },
        update: {
          $set: {
            performanceDetails: {
              overall_progress: metrics?.overall_progress || 0,
              performance_score: metrics?.performance_score || 0
            }
          }
        }
      }
    });

    cCount++;
    if (cBulkOps.length >= BULK_BATCH_SIZE) {
      const res = await CampaignInfo.bulkWrite(cBulkOps);
      cUpdated += res.modifiedCount;
      cBulkOps = [];
      console.log(`     ... processed ${cCount} campaigns`);
    }
  }
  if (cBulkOps.length > 0) {
    const res = await CampaignInfo.bulkWrite(cBulkOps);
    cUpdated += res.modifiedCount;
  }
  console.log(`     ✅ Fully migrated ${cUpdated}/${cCount} Campaign documents.`);

  console.log('🎉 Phase 3 Migration Complete!\n');
}

// Allow direct execution (node migrate_p3_embeds.js) or module import
if (require.main === module) {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('❌ MONGO_URI not set.');
    process.exit(1);
  }
  mongoose.connect(MONGO_URI)
    .then(() => runMigration())
    .then(() => mongoose.disconnect())
    .catch(err => { console.error('Migration failed:', err); process.exit(1); });
}

module.exports = { runMigration };
