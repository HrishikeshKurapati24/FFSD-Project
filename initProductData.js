const { CampaignInfo } = require('./config/CampaignMongo');
const { Product } = require('./config/ProductMongo');
const { BrandInfo } = require('./config/BrandMongo');
const { uploadSeedImage } = require('./utils/seedHelpers');

const initializeProductData = async () => {
    try {
        console.log('📦 Initializing product data for all campaigns...');

        // 1. Find all active or completed campaigns
        const campaigns = await CampaignInfo.find({
            status: { $in: ['active', 'completed', 'influencer-invite', 'brand-invite'] }
        });

        console.log(`   Found ${campaigns.length} relevant campaigns.`);

        let createdCount = 0;

        for (const campaign of campaigns) {
            // 2. Check if product already exists for this campaign
            const existingProduct = await Product.findOne({ campaign_id: campaign._id });

            if (!existingProduct) {
                // 3. Create a dummy product matched to the campaign
                const brand = await BrandInfo.findById(campaign.brand_id);
                const brandName = brand ? brand.brandName : 'Brand';

                // Determine category based on Brand/Campaign
                let category = 'General';
                let price = 999;
                let image = '/images/default-product-image.png';

                if (brandName.toLowerCase().includes('mamaearth') || brandName.toLowerCase().includes('nykaa')) {
                    category = 'Beauty & Personal Care';
                    price = 599;
                } else if (brandName.toLowerCase().includes('boat')) {
                    category = 'Electronics';
                    price = 1999;
                } else if (brandName.toLowerCase().includes('zomato') || brandName.toLowerCase().includes('swiggy')) {
                    category = 'Food & Beverage';
                    price = 250;
                } else if (brandName.toLowerCase().includes('lenskart')) {
                    category = 'Eyewear';
                    price = 1500;
                }

                // Upload default image to Cloudinary
                image = await uploadSeedImage(image, 'products');

                await Product.create({
                    name: `${brandName} Exclusive Product - ${campaign.title.split(' ').slice(0, 2).join(' ')}`,
                    category: category,
                    description: `Exclusive product for the ${campaign.title} campaign.`,
                    original_price: price,
                    campaign_price: 0, // Free for influencers
                    discount_percentage: 100,
                    images: [{ url: image, is_primary: true }],
                    special_instructions: "Please review the product within 7 days of receipt.",
                    brand_id: campaign.brand_id,
                    campaign_id: campaign._id,
                    created_by: campaign.brand_id, // Assuming Brand created it
                    status: 'active',
                    target_quantity: 100
                });

                createdCount++;
                console.log(`     + Created product for campaign: ${campaign.title}`);
            }
        }

        console.log(`✅ Product data check complete. Created ${createdCount} new products.`);

    } catch (error) {
        console.error('❌ Error initializing product data:', error);
        throw error;
    }
};

module.exports = { initializeProductData };

if (require.main === module) {
    const { connectDB, closeConnection } = require('./mongoDB');
    (async () => {
        try {
            await connectDB();
            await initializeProductData();
            process.exit(0);
        } catch (error) {
            console.error('Initialization failed:', error);
            process.exit(1);
        }
    })();
}
