/**
 * teardown_indexes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Standalone script to remove the 21 optimized indexes created in Phase 2/3.
 * This restores the database to its pristine "unoptimized" state so that 
 * benchmark_before.js can be run authentically to measure COLLSCAN performance.
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function teardown() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('❌ MONGO_URI not set.');
    process.exit(1);
  }

  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected.\n');

  const { CampaignInfo, CampaignInfluencers, CampaignPayments } = require('../models/CampaignMongo');
  const { InfluencerInfo } = require('../models/InfluencerMongo');
  const { BrandInfo } = require('../models/BrandMongo');
  const { Product } = require('../models/ProductMongo');
  const { Notification } = require('../models/NotificationMongo');
  const { UserSubscription, PaymentHistory } = require('../models/SubscriptionMongo');
  const { Order } = require('../models/OrderMongo');

  // The exact indexes we created
  const targetIndexes = [
    { Model: CampaignInfluencers, spec: { influencer_id: 1, status: 1 } },
    { Model: CampaignInfluencers, spec: { campaign_id: 1, status: 1 } },
    { Model: CampaignInfo,        spec: { status: 1, createdAt: -1 } },
    { Model: CampaignInfo,        spec: { brand_id: 1, status: 1 } },
    { Model: CampaignPayments,    spec: { influencer_id: 1, payment_date: -1 } },
    { Model: CampaignPayments,    spec: { brand_id: 1, payment_date: -1 } },
    { Model: Product,             spec: { campaign_id: 1, status: 1 } },
    { Model: Product,             spec: { attributed_influencer_id: 1 } },
    { Model: InfluencerInfo,      spec: { verified: 1, niche: 1 } },
    { Model: InfluencerInfo,      spec: { categories: 1 } },
    { Model: InfluencerInfo,      spec: { referralCode: 1 } },
    { Model: BrandInfo,           spec: { industry: 1 } },
    { Model: BrandInfo,           spec: { verified: 1, industry: 1 } },
    { Model: Order,               spec: { customer_id: 1, status: 1 } },
    { Model: Order,               spec: { influencer_id: 1, createdAt: -1 } },
    { Model: Order,               spec: { attribution_status: 1 } },
    { Model: UserSubscription,    spec: { userId: 1, userType: 1 } },
    { Model: UserSubscription,    spec: { status: 1, endDate: 1 } },
    { Model: PaymentHistory,      spec: { userId: 1, userType: 1, createdAt: -1 } },
    { Model: Notification,        spec: { recipientId: 1, read: 1, createdAt: -1 } },
    { Model: Notification,        spec: { expiresAt: 1 } }, // TTL
  ];

  let droppedCount = 0;
  let skippedCount = 0;

  console.log('🧹 Beginning Index Removal...\n');

  for (const { Model, spec } of targetIndexes) {
    try {
      // Name generation matches Mongoose internal name generation
      const indexName = Object.entries(spec)
        .map(([key, val]) => `${key}_${val}`)
        .join('_');

      try {
        await Model.collection.dropIndex(indexName);
        console.log(`  ✅ Dropped index [${indexName}] on ${Model.modelName}`);
        droppedCount++;
      } catch (err) {
        // Fallback: try passing the spec object directly
        try {
          await Model.collection.dropIndex(spec);
          console.log(`  ✅ Dropped index on ${Model.modelName} by spec`);
          droppedCount++;
        } catch (innerErr) {
            if (err.message.includes('index not found')) {
              console.log(`  ⏳ Skipped (Already missing) [${indexName}] on ${Model.modelName}`);
              skippedCount++;
            } else {
              console.warn(`  ⚠️ Failed to drop index on ${Model.modelName}:`, err.message);
            }
        }
      }
    } catch (e) {
      console.warn(`  ⚠️ Error on ${Model.modelName}:`, e.message);
    }
  }

  // Also remove TTL data that might trigger background deletions
  console.log('\n🧹 Removing expiresAt field from Notifications to halt TTL sweeps...');
  const notifResult = await Notification.updateMany(
    { expiresAt: { $ne: null } },
    { $unset: { expiresAt: "" } }
  );
  console.log(`  ✅ Cleared expiresAt from ${notifResult.modifiedCount} notifications.`);

  console.log(`\n🎉 Teardown complete. (${droppedCount} dropped, ${skippedCount} skipped)`);
  await mongoose.disconnect();
}

teardown().catch(err => {
  console.error("Critical error:", err);
  process.exit(1);
});
