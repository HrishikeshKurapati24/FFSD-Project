
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import models directly
const OrderSchema = new mongoose.Schema({
    order_id: String,
    campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CampaignInfo' },
    influencer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'InfluencerInfo' },
    buyer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer' },
    items: [{
        product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: Number,
        price: Number
    }],
    total_amount: Number,
    commission_amount: Number,
    status: { type: String, enum: ['pending', 'completed', 'cancelled', 'returned', 'paid', 'shipped', 'delivered'] },
    order_date: { type: Date, default: Date.now }
});
// Check if model already exists to avoid overwriting error
const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

const CampaignInfluencersSchema = new mongoose.Schema({
    campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CampaignInfo' },
    influencer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'InfluencerInfo' },
    status: String,
    revenue: { type: Number, default: 0 },
    commission_earned: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    engagement_rate: Number,
    reach: Number
});
const CampaignInfluencers = mongoose.models.CampaignInfluencers || mongoose.model('CampaignInfluencers', CampaignInfluencersSchema);

const CampaignMetricsSchema = new mongoose.Schema({
    campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CampaignInfo' },
    revenue: { type: Number, default: 0 },
    roi: { type: Number, default: 0 },
    conversion_rate: Number,
    sales_count: { type: Number, default: 0 }
});
const CampaignMetrics = mongoose.models.CampaignMetrics || mongoose.model('CampaignMetrics', CampaignMetricsSchema);

const CampaignInfoSchema = new mongoose.Schema({
    budget: Number
});
const CampaignInfo = mongoose.models.CampaignInfo || mongoose.model('CampaignInfo', CampaignInfoSchema);

const AdminRealtimeEmitter = require('../services/admin/adminRealtimeEmitter');

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/collabsync';

const runMigration = async () => {
    try {
        if (mongoose.connection.readyState === 0) {
            console.log(`Connecting to MongoDB at ${mongoUri.split('@').pop()}...`);
            await mongoose.connect(mongoUri);
            console.log('Connected to MongoDB');
        }

        // 1. Reset all revenue/commission counters to 0 first to ensure accuracy
        console.log('Resetting counters...');
        await CampaignInfluencers.updateMany({}, {
            $set: { revenue: 0, commission_earned: 0, conversions: 0 }
        });
        // For metrics, we'll just overwrite later, but resetting sales_count is good
        await CampaignMetrics.updateMany({}, {
            $set: { revenue: 0, sales_count: 0 }
        });

        // 2. Aggregate Orders
        console.log('Aggregating orders...');
        // Match any 'completed' or revenue-generating status
        const revenueStatuses = ['completed', 'paid', 'shipped', 'delivered'];

        const orderStats = await Order.aggregate([
            { $match: { status: { $in: revenueStatuses } } },
            {
                $group: {
                    _id: { campaign_id: '$campaign_id', influencer_id: '$influencer_id' },
                    totalRevenue: { $sum: { $ifNull: ["$total_amount", 0] } },
                    totalCommission: { $sum: { $ifNull: ["$commission_amount", 0] } },
                    orderCount: { $sum: 1 }
                }
            }
        ]);

        console.log(`Found ${orderStats.length} influencer-campaign pairs with orders.`);

        // 3. Update CampaignInfluencers
        for (const stat of orderStats) {
            if (!stat._id.campaign_id || !stat._id.influencer_id) continue;

            console.log(`Updating influencer ${stat._id.influencer_id} for campaign ${stat._id.campaign_id}: Revenue $${stat.totalRevenue}, Commission $${stat.totalCommission}`);

            await CampaignInfluencers.updateOne(
                {
                    campaign_id: stat._id.campaign_id,
                    influencer_id: stat._id.influencer_id
                },
                {
                    $set: {
                        revenue: Math.round(stat.totalRevenue * 100) / 100,
                        commission_earned: Math.round(stat.totalCommission * 100) / 100,
                        conversions: stat.orderCount
                    }
                }
            );
        }

        // 4. Update CampaignMetrics (Aggregation by Campaign)
        const campaignStats = await Order.aggregate([
            { $match: { status: { $in: revenueStatuses } } },
            {
                $group: {
                    _id: '$campaign_id',
                    totalRevenue: { $sum: { $ifNull: ["$total_amount", 0] } },
                    totalSales: { $sum: 1 }
                }
            }
        ]);

        console.log(`Found ${campaignStats.length} campaigns with revenue.`);

        for (const stat of campaignStats) {
            if (!stat._id) continue;

            const campaign = await CampaignInfo.findById(stat._id);
            const budget = (campaign && campaign.budget) ? campaign.budget : 0;
            const revenue = stat.totalRevenue || 0;
            const roi = budget > 0 ? ((revenue - budget) / budget) * 100 : 0;
            const roundedRev = Math.round(revenue * 100) / 100;
            const roundedRoi = Math.round(roi * 100) / 100;

            console.log(`Updating metrics for campaign ${stat._id}: Revenue $${revenue.toFixed(2)}, ROI ${roi.toFixed(2)}%`);

            await Promise.all([
                CampaignMetrics.updateOne(
                    { campaign_id: stat._id },
                    { $set: { revenue: roundedRev, sales_count: stat.totalSales, roi: roundedRoi } },
                    { upsert: true }
                ),
                CampaignInfo.updateOne(
                    { _id: stat._id },
                    { 
                        $set: { 
                            'metrics.revenue': roundedRev, 
                            'metrics.sales_count': stat.totalSales, 
                            'metrics.roi': roundedRoi 
                        } 
                    }
                )
            ]);
        }

        console.log('Update complete!');

        // Emit real-time updates for admin
        try {
            AdminRealtimeEmitter.emitRevenueUpdate({ source: 'migration_script' });
            AdminRealtimeEmitter.emitMetricsUpdate({ source: 'migration_script' });
        } catch (emitterErr) {
            console.error('Failed to emit real-time updates:', emitterErr.message);
        }

        if (require.main === module) process.exit(0);
    } catch (error) {
        console.error('Error updating revenue:', error);
        if (require.main === module) process.exit(1);
        throw error;
    }
}

if (require.main === module) {
    runMigration();
}

module.exports = { runMigration };
