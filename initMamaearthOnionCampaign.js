const { BrandInfo } = require('./config/BrandMongo');
const { InfluencerInfo } = require('./config/InfluencerMongo');
const { CampaignInfo, CampaignInfluencers, CampaignMetrics } = require('./config/CampaignMongo');
const { Product } = require('./config/ProductMongo');
const { uploadSeedImage } = require('./utils/seedHelpers');

const initializeMamaearthOnionCampaign = async () => {
    try {
        console.log('🧅 Initializing Mamaearth Onion Shampoo campaign...');

        // 1. Find Mamaearth Brand
        const mamaearth = await BrandInfo.findOne({ email: { $regex: new RegExp('^mamaearth@example.com$', 'i') } });
        if (!mamaearth) {
            console.log('⚠️ Mamaearth brand not found. Skipping Onion Campaign initialization.');
            return;
        }

        // 2. Find Specific Influencers
        const targetEmails = ['dolly@example.com', 'komal@example.com', 'prajakta@example.com'];
        // Using regex for case-insensitive email matching
        const emailRegexes = targetEmails.map(email => new RegExp(`^${email}$`, 'i'));

        const influencers = await InfluencerInfo.find({ email: { $in: emailRegexes } });

        if (influencers.length === 0) {
            console.log('⚠️ Target influencers not found. Skipping Onion Campaign initialization.');
            return;
        }

        // 3. Create Active Campaign (Matching fields from /campaigns/create)
        const startDate = new Date();
        const endDate = new Date(new Date().setDate(new Date().getDate() + 45));
        const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24) + 1);

        // Check if campaign already exists
        let campaign = await CampaignInfo.findOne({ title: "Onion Shampoo Hair Fall Control" });

        if (!campaign) {
            campaign = await CampaignInfo.create({
                brand_id: mamaearth._id,
                title: "Onion Shampoo Hair Fall Control",
                description: "Mega launch campaign for our updated Onion Shampoo formula. Focus on reducing hair fall and promoting hair regrowth with natural ingredients.",
                start_date: startDate,
                end_date: endDate,
                duration: duration,
                budget: 1500000,
                status: 'active', // Manually setting to active for seed
                required_channels: ["Instagram", "YouTube"],
                required_influencers: 10,
                target_audience: "Females 18-35 interested in natural hair care",
                min_followers: 10000,
                objectives: "Drive brand awareness and product trials among young adults."
            });
            console.log(`   ✅ Created Campaign: ${campaign.title}`);
        } else {
            console.log(`   ℹ️ Campaign already exists: ${campaign.title}`);
        }

        // 4. Create Product
        let product = await Product.findOne({ name: "Mamaearth Onion Shampoo", campaign_id: campaign._id });
        if (!product) {
            let imageUrl = "/images/default-product-image.png";
            imageUrl = await uploadSeedImage(imageUrl, 'products');

            product = await Product.create({
                name: "Mamaearth Onion Shampoo",
                category: "Hair Care",
                description: "Natural onion oil shampoo for hair fall control.",
                original_price: 599,
                campaign_price: 0, // Free product for influencers
                discount_percentage: 100,
                images: [{ url: imageUrl, is_primary: true }],
                special_instructions: "Mention 'Sulphate Free' clearly.",
                brand_id: mamaearth._id,
                campaign_id: campaign._id,
                created_by: mamaearth._id,
                status: 'active',
                target_quantity: 50
            });
            console.log(`   ✅ Created Product: ${product.name}`);
        }

        // 5. Add Influencers to Campaign with Schema-Compliant Deliverables
        for (const influencer of influencers) {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 15);

            const existingLink = await CampaignInfluencers.findOne({
                campaign_id: campaign._id,
                influencer_id: influencer._id
            });

            if (!existingLink) {
                await CampaignInfluencers.create({
                    campaign_id: campaign._id,
                    influencer_id: influencer._id,
                    brand_id: mamaearth._id,
                    status: 'active',
                    progress: Math.floor(Math.random() * 80) + 10, // Random progress 10-90%
                    engagement_rate: 4.5,
                    reach: 50000,
                    clicks: 1200,
                    conversions: 50,
                    deliverables: [
                        {
                            title: 'Instagram Reel',
                            description: 'Create a 30-60s reel demonstrating how to use the Onion Shampoo.',
                            status: 'completed',
                            due_date: new Date() // Past due date, completed
                        },
                        {
                            title: 'YouTube Review',
                            description: 'A dedicated 5-minute review video focusing on the ingredients and 1-month results.',
                            status: 'active',
                            due_date: dueDate
                        }
                    ]
                });
                console.log(`   ✅ Added influencer ${influencer.fullName} to campaign`);
            }
        }

        // 6. Initialize Campaign Metrics
        const existingMetrics = await CampaignMetrics.findOne({ campaign_id: campaign._id });
        if (!existingMetrics) {
            await CampaignMetrics.create({
                campaign_id: campaign._id,
                brand_id: mamaearth._id,
                reach: 150000,
                impressions: 200000,
                engagement: 15000,
                clicks: 3500,
                conversions: 150,
                performance_score: 85,
                overall_progress: 35,
                engagement_rate: 7.5
            });
            console.log('   ✅ Initialized Campaign Metrics');
        }

        console.log('✅ Mamaearth Onion Shampoo campaign initialized successfully!');

    } catch (error) {
        console.error('❌ Error initializing Mamaearth Onion campaign:', error);
        throw error;
    }
};

module.exports = { initializeMamaearthOnionCampaign };

if (require.main === module) {
    const { connectDB, closeConnection } = require('./mongoDB');
    (async () => {
        try {
            await connectDB();
            await initializeMamaearthOnionCampaign();
            process.exit(0);
        } catch (error) {
            console.error('Initialization failed:', error);
            process.exit(1);
        }
    })();
}
