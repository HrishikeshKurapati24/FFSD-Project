
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

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/collabsync';

const updateRevenue = async () => {
    try {
        console.log(`Connecting to MongoDB at ${mongoUri.split('@').pop()}...`);
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

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
                    totalRevenue: { $sum: '$total_amount' },
                    totalCommission: { $sum: '$commission_amount' },
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
                        revenue: stat.totalRevenue,
                        commission_earned: stat.totalCommission,
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
                    totalRevenue: { $sum: '$total_amount' },
                    totalSales: { $sum: 1 }
                }
            }
        ]);

        console.log(`Found ${campaignStats.length} campaigns with revenue.`);

        for (const stat of campaignStats) {
            if (!stat._id) continue;

            // Get campaign budget for ROI calculation
            const campaign = await CampaignInfo.findById(stat._id);
            const budget = campaign ? campaign.budget : 0;
            const roi = budget > 0 ? ((stat.totalRevenue - budget) / budget) * 100 : 0;

            console.log(`Updating metrics for campaign ${stat._id}: Revenue $${stat.totalRevenue}, ROI ${roi.toFixed(2)}%`);

            await CampaignMetrics.updateOne(
                { campaign_id: stat._id },
                {
                    $set: {
                        revenue: stat.totalRevenue,
                        sales_count: stat.totalSales,
                        roi: roi
                    }
                },
                { upsert: true } // Create metrics if not exists (though it should)
            );
        }

        console.log('Update complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error updating revenue:', error);
        process.exit(1);
    }
}

updateRevenue();
