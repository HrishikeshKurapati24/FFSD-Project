const { BrandInfo } = require('./models/BrandMongo');
const { InfluencerInfo } = require('./models/InfluencerMongo');
const { SubscriptionService, UserSubscription, SubscriptionPlan } = require('./services/brandModel');

const initializeSubscriptionData = async () => {
    try {
        console.log('💳 Initializing subscription data...');

        // 1. Initialize Plans
        console.log('   • Creating default subscription plans...');
        await SubscriptionService.initializeDefaultPlans();

        // 2. Get Plans for lookup
        const brandPlans = await SubscriptionPlan.find({ userType: 'brand' });
        const influencerPlans = await SubscriptionPlan.find({ userType: 'influencer' });

        const getPlan = (type, name) => {
            const plans = type === 'brand' ? brandPlans : influencerPlans;
            return plans.find(p => p.name === name);
        };

        // 3. Assign Subscriptions to Brands
        console.log('   • Assigning subscriptions to brands...');
        const brands = await BrandInfo.find();

        for (const brand of brands) {
            // Check if already has active subscription
            const existingSub = await UserSubscription.findOne({
                userId: brand._id,
                status: 'active'
            });

            if (!existingSub) {
                // Determine plan based on Brand Name (for consistent demo data)
                let planIds;
                if (brand.brandName === 'Mamaearth' || brand.brandName === 'Nykaa') {
                    planIds = getPlan('brand', 'Premium')._id;
                } else if (brand.brandName === 'Boat' || brand.brandName === 'Lenskart') {
                    planIds = getPlan('brand', 'Basic')._id;
                } else {
                    planIds = getPlan('brand', 'Free')._id;
                }

                const startDate = new Date();
                const endDate = new Date();
                endDate.setDate(startDate.getDate() + 365); // 1 year validity

                await UserSubscription.create({
                    userId: brand._id,
                    userType: 'BrandInfo',
                    planId: planIds,
                    status: 'active',
                    billingCycle: 'yearly',
                    startDate: startDate,
                    endDate: endDate,
                    amount: 0, // Seed data
                    usage: {
                        campaignsUsed: Math.floor(Math.random() * 2),
                        influencersConnected: Math.floor(Math.random() * 5),
                        brandsConnected: 0,
                        storageUsedGB: 0.5,
                        uploadsThisMonth: 2
                    }
                });
                console.log(`     - Assigned plan to ${brand.brandName}`);
            }
        }

        // 4. Assign Subscriptions to Influencers
        console.log('   • Assigning subscriptions to influencers...');
        const influencers = await InfluencerInfo.find();

        for (const influencer of influencers) {
            // Check if already has active subscription
            const existingSub = await UserSubscription.findOne({
                userId: influencer._id,
                status: 'active'
            });

            if (!existingSub) {
                // Determine plan based on Name (for consistent demo data)
                let planIds;
                if (influencer.fullName.includes('Kusha') || influencer.fullName.includes('Masoom')) {
                    planIds = getPlan('influencer', 'Premium')._id;
                } else if (influencer.fullName.includes('Dolly') || influencer.fullName.includes('Ranveer')) {
                    planIds = getPlan('influencer', 'Basic')._id;
                } else {
                    planIds = getPlan('influencer', 'Free')._id;
                }

                const startDate = new Date();
                const endDate = new Date();
                endDate.setDate(startDate.getDate() + 365);

                await UserSubscription.create({
                    userId: influencer._id,
                    userType: 'InfluencerInfo',
                    planId: planIds,
                    status: 'active',
                    billingCycle: 'yearly',
                    startDate: startDate,
                    endDate: endDate,
                    amount: 0,
                    usage: {
                        campaignsUsed: 0,
                        influencersConnected: 0,
                        brandsConnected: Math.floor(Math.random() * 3),
                        storageUsedGB: 0.2,
                        uploadsThisMonth: 5
                    }
                });
                console.log(`     - Assigned plan to ${influencer.fullName}`);
            }
        }

        console.log('✅ Subscription data initialized successfully!');

    } catch (error) {
        console.error('❌ Error initializing subscription data:', error);
        throw error;
    }
};

module.exports = { initializeSubscriptionData };

if (require.main === module) {
    const { connectDB, closeConnection } = require('./mongoDB');

    (async () => {
        try {
            await connectDB();
            await initializeSubscriptionData();
            console.log('Script completed successfully');
            process.exit(0);
        } catch (error) {
            console.error('Script failed:', error);
            process.exit(1);
        }
    })();
}
