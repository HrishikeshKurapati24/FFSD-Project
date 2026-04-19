
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import models directly - ALL of them to ensure schema registration
const { BrandInfo } = require('../models/BrandMongo');
const { InfluencerInfo } = require('../models/InfluencerMongo');
const { CampaignInfo } = require('../models/CampaignMongo');
const { Order } = require('../models/OrderMongo');
const { Product } = require('../models/ProductMongo');

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/collabsync';

const connectDB = async () => {
    try {
        console.log(`Connecting to MongoDB at ${mongoUri.split('@').pop()}...`); // Log masked URI
        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB connected successfully');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err);
        throw err;
    }
};

const closeConnection = async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
};


const runMigration = async () => {
    try {
        console.log('🌱 Starting Advanced Analytics Order Seed Script...\n');

        // Check if orders already exist
        const orderCount = await Order.countDocuments();
        if (orderCount > 0) {
            console.log(`📦 Orders collection already has ${orderCount} docs. Skipping seed.`);
            return;
        }

        // Get active campaigns with allocated budgets
        const campaigns = await CampaignInfo.find({
            status: { $in: ['active', 'completed'] }
        }).populate('brand_id');

        if (campaigns.length === 0) {
            console.log('⚠️  No active/completed campaigns found. Please create campaigns first.');
            return;
        }

        console.log(`📊 Found ${campaigns.length} campaigns to generate orders for`);

        // Get all influencers with referral codes
        const influencers = await InfluencerInfo.find({
            referralCode: { $exists: true, $ne: null }
        });

        if (influencers.length === 0) {
            console.log('⚠️  No influencers with referral codes found. Run backfill script first.');
            return;
        }

        console.log(`👥 Found ${influencers.length} influencers with referral codes\n`);

        // Get all products (for order items) - Ensure they have valid prices
        const products = await Product.find({ 
            stock: { $gt: 0 },
            original_price: { $gt: 0 }
        }).limit(20);

        if (products.length === 0) {
            console.log('⚠️  No products found. Please add products first.');
            return;
        }

        console.log(`📦 Found ${products.length} products to include in orders\n`);

        const ordersToCreate = [];
        let totalOrders = 0;

        // Create 5-15 orders per influencer
        for (const influencer of influencers) {
            const numOrders = Math.floor(Math.random() * 11) + 5; // 5-15 orders

            for (let i = 0; i < numOrders; i++) {
                // Pick a random campaign (ideally one the influencer is part of, but for seeding we can be loose or try to match)
                // For better realism, let's just pick a random active campaign
                const campaign = campaigns[Math.floor(Math.random() * campaigns.length)];

                // Random number of items per order (1-4)
                const numItems = Math.floor(Math.random() * 4) + 1;
                const items = [];
                let orderTotal = 0;

                for (let j = 0; j < numItems; j++) {
                    const product = products[Math.floor(Math.random() * products.length)];
                    const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 units
                    const price = product.campaign_price || product.original_price || 0;
                    const subtotal = price * quantity;

                    items.push({
                        product_id: product._id,
                        quantity,
                        price_at_purchase: price,
                        subtotal
                    });

                    orderTotal += subtotal;
                }

                // Commission rate (typically 5-15%)
                const commissionRate = (Math.random() * 0.10) + 0.05; // 5-15%
                const commissionAmount = orderTotal * commissionRate;

                // Create order with random status (mostly paid/delivered for ROI calculation)
                const statusOptions = ['paid', 'shipped', 'delivered', 'delivered', 'delivered']; // weighted towards delivered
                const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];

                ordersToCreate.push({
                    items,
                    total_amount: orderTotal,
                    shipping_cost: 50, // Flat shipping
                    status,
                    payment_id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    referral_code: influencer.referralCode,
                    influencer_id: influencer._id,
                    campaign_id: campaign._id, // Assign to campaign
                    buyer_id: new mongoose.Types.ObjectId(), // Fake buyer ID
                    commission_amount: commissionAmount,
                    attribution_status: status === 'delivered' ? 'paid' : 'pending',
                    createdAt: (() => {
                        const start = campaign.start_date ? new Date(campaign.start_date).getTime() : Date.now() - 30 * 24 * 60 * 60 * 1000;
                        const end = campaign.end_date ? Math.min(new Date(campaign.end_date).getTime(), Date.now()) : Date.now();
                        return new Date(start + Math.random() * (end - start));
                    })(),
                    guest_info: {
                        name: `Customer ${Math.floor(Math.random() * 1000)}`,
                        email: `customer${Math.floor(Math.random() * 1000)}@example.com`,
                        phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`
                    }
                });

                totalOrders++;
            }
        }

        console.log(`📝 Creating ${totalOrders} orders across ${influencers.length} influencers...`);

        // Insert orders in batches
        const batchSize = 100;
        for (let i = 0; i < ordersToCreate.length; i += batchSize) {
            const batch = ordersToCreate.slice(i, i + batchSize);
            await Order.insertMany(batch);
            console.log(`   ✓ Inserted batch ${Math.floor(i / batchSize) + 1} (${Math.min(i + batchSize, ordersToCreate.length)}/${ordersToCreate.length} orders)`);
        }

        console.log(`\n✅ Successfully created ${totalOrders} orders!`);
        if (require.main === module) process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding orders:', error);
        if (require.main === module) process.exit(1);
        throw error;
    }
};

if (require.main === module) {
    (async () => {
        await connectDB();
        await runMigration();
    })();
}

module.exports = { runMigration };
