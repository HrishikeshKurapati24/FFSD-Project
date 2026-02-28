const { mongoose } = require('../mongoDB');
const { InfluencerInfo } = require('../config/InfluencerMongo');
const { CampaignInfo } = require('../config/CampaignMongo');
const { Order } = require('../config/OrderMongo');
const { Product } = require('../config/ProductMongo');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

/**
 * Seed Script for Advanced Analytics - Creates Sample Order Data
 * 
 * This script populates the Orders table with realistic test data
 * to enable the ROI Leaderboard feature in Advanced Analytics.
 * 
 * Run: node scripts/seed_analytics_orders.js
 */

const seedOrdersForAnalytics = async () => {
    try {
        console.log('🌱 Starting Advanced Analytics Order Seed Script...\n');

        // Get active campaigns with allocated budgets
        const campaigns = await CampaignInfo.find({
            status: { $in: ['active', 'completed'] }
        }).populate('brand_id');

        if (campaigns.length === 0) {
            console.log('⚠️  No active/completed campaigns found. Please create campaigns first.');
            process.exit(0);
        }

        console.log(`📊 Found ${campaigns.length} campaigns to generate orders for`);

        // Get all influencers with referral codes
        const influencers = await InfluencerInfo.find({
            referralCode: { $exists: true, $ne: null }
        });

        if (influencers.length === 0) {
            console.log('⚠️  No influencers with referral codes found. Run backfill script first.');
            process.exit(0);
        }

        console.log(`👥 Found ${influencers.length} influencers with referral codes\n`);

        // Get all products (for order items)
        const products = await Product.find({ stock: { $gt: 0 } }).limit(20);

        if (products.length === 0) {
            console.log('⚠️  No products found. Please add products first.');
            process.exit(0);
        }

        console.log(`📦 Found ${products.length} products to include in orders\n`);

        const ordersToCreate = [];
        let totalOrders = 0;

        // Create 5-15 orders per influencer
        for (const influencer of influencers) {
            const numOrders = Math.floor(Math.random() * 11) + 5; // 5-15 orders

            for (let i = 0; i < numOrders; i++) {
                // Random number of items per order (1-4)
                const numItems = Math.floor(Math.random() * 4) + 1;
                const items = [];
                let orderTotal = 0;

                for (let j = 0; j < numItems; j++) {
                    const product = products[Math.floor(Math.random() * products.length)];
                    const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 units
                    const price = product.price;
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
                    commission_amount: commissionAmount,
                    attribution_status: status === 'delivered' ? 'paid' : 'pending',
                    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
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

        // Calculate and display summary statistics
        const stats = await Order.aggregate([
            {
                $match: {
                    status: { $in: ['paid', 'shipped', 'delivered'] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$total_amount' },
                    totalCommission: { $sum: '$commission_amount' },
                    orderCount: { $sum: 1 }
                }
            }
        ]);

        if (stats.length > 0) {
            console.log('\n📈 Order Statistics:');
            console.log(`   Total Confirmed Orders: ${stats[0].orderCount}`);
            console.log(`   Total Revenue Generated: ₹${stats[0].totalRevenue.toFixed(2)}`);
            console.log(`   Total Commission Paid: ₹${stats[0].totalCommission.toFixed(2)}`);
            console.log(`   Average Order Value: ₹${(stats[0].totalRevenue / stats[0].orderCount).toFixed(2)}`);
        }

        console.log('\n🎉 Seed script completed! The ROI Leaderboard should now display data.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding orders:', error);
        process.exit(1);
    }
};

// Connect to MongoDB and run seed
const { connectDB, closeConnection } = require('../mongoDB');

(async () => {
    await connectDB();
    await seedOrdersForAnalytics();
    await closeConnection();
})();
