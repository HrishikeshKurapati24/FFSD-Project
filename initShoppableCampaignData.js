const { Product, CampaignContent, ContentTracking, Customer } = require('./config/ProductMongo');
const { CampaignInfo, CampaignInfluencers } = require('./config/CampaignMongo');
const { BrandInfo } = require('./config/BrandMongo');
const { InfluencerInfo } = require('./config/InfluencerMongo');

const initializeShoppableCampaignData = async () => {
    try {
        console.log('🚀 Initializing shoppable campaign data...');

        // Get existing brands and influencers
        const brands = await BrandInfo.find({}, '_id brandName');
        const influencers = await InfluencerInfo.find({}, '_id fullName');
        const campaigns = await CampaignInfo.find({}, '_id title brand_id');

        if (brands.length === 0 || influencers.length === 0 || campaigns.length === 0) {
            console.log('⚠️  Please initialize brands, influencers, and campaigns first');
            return;
        }

        // Create sample products for campaigns
        const sampleProducts = [
            {
                name: "Mamaearth Vitamin C Face Serum",
                description: "Brightening vitamin C serum with natural ingredients for glowing skin",
                category: "Skincare",
                original_price: 599,
                campaign_price: 449,
                stock_quantity: 100,
                images: [
                    {
                        url: "/images/products/mamaearth-serum.jpg",
                        alt: "Mamaearth Vitamin C Serum",
                        is_primary: true
                    }
                ],
                tags: ["skincare", "vitamin-c", "natural", "brightening"],
                is_digital: false,
                delivery_info: {
                    estimated_days: 3,
                    shipping_cost: 50,
                    free_shipping_threshold: 500
                },
                specifications: new Map([
                    ["Volume", "30ml"],
                    ["Skin Type", "All Types"],
                    ["Key Ingredients", "Vitamin C, Aloe Vera, Orange Oil"]
                ])
            },
            {
                name: "Mamaearth Onion Hair Oil",
                description: "Nourishing hair oil with onion extract for stronger, healthier hair",
                category: "Hair Care",
                original_price: 299,
                campaign_price: 199,
                stock_quantity: 150,
                images: [
                    {
                        url: "/images/products/mamaearth-oil.jpg",
                        alt: "Mamaearth Onion Hair Oil",
                        is_primary: true
                    }
                ],
                tags: ["hair-care", "onion", "natural", "hair-growth"],
                is_digital: false,
                delivery_info: {
                    estimated_days: 3,
                    shipping_cost: 50,
                    free_shipping_threshold: 500
                },
                specifications: new Map([
                    ["Volume", "100ml"],
                    ["Hair Type", "All Types"],
                    ["Key Ingredients", "Onion Extract, Coconut Oil, Almond Oil"]
                ])
            }
        ];

        // Create products for the first campaign
        const campaign = campaigns[0];
        const brand = brands.find(b => b._id.toString() === campaign.brand_id.toString());

        console.log(`📦 Creating products for campaign: ${campaign.title}`);

        for (const productData of sampleProducts) {
            const discountPercentage = Math.round(((productData.original_price - productData.campaign_price) / productData.original_price) * 100);

            const product = new Product({
                ...productData,
                brand_id: campaign.brand_id,
                campaign_id: campaign._id,
                discount_percentage: discountPercentage,
                created_by: campaign.brand_id,
                status: 'active'
            });

            await product.save();
            console.log(`✅ Created product: ${product.name}`);
        }

        // Create sample influencer content
        const influencer = influencers[0];
        console.log(`📱 Creating content for influencer: ${influencer.fullName}`);

        const sampleContent = {
            campaign_id: campaign._id,
            influencer_id: influencer._id,
            content_type: 'post',
            title: `My Favorite ${brand.brandName} Products! 🌟`,
            caption: `I've been using these amazing products from ${brand.brandName} and I'm absolutely loving the results! The Vitamin C serum has given me such a natural glow, and the onion hair oil has made my hair so much stronger. 

#${brand.brandName.toLowerCase().replace(/\s+/g, '')} #NaturalBeauty #Skincare #HairCare #BeautyTips #HealthyLiving #GlowingSkin #StrongHair`,
            media_urls: [
                {
                    url: "/images/influencer-content/beauty-post.jpg",
                    type: "image",
                    alt: "Beauty products showcase"
                }
            ],
            attached_products: [
                {
                    product_id: null, // Will be set after products are created
                    highlight_text: "Try this amazing serum!",
                    call_to_action: "buy_now",
                    position: { x: 20, y: 30 }
                },
                {
                    product_id: null, // Will be set after products are created
                    highlight_text: "Perfect for hair growth!",
                    call_to_action: "buy_now",
                    position: { x: 60, y: 70 }
                }
            ],
            hashtags: [
                brand.brandName.toLowerCase().replace(/\s+/g, ''),
                "naturalbeauty",
                "skincare",
                "haircare",
                "beautytips",
                "healthyliving",
                "glowingskin",
                "stronghair"
            ],
            disclosures: [
                "Paid partnership with " + brand.brandName,
                "All opinions are my own"
            ],
            status: 'published',
            published_at: new Date(),
            is_featured: true
        };

        // Get the created products to attach them to content
        const createdProducts = await Product.find({ campaign_id: campaign._id });

        if (createdProducts.length >= 2) {
            sampleContent.attached_products[0].product_id = createdProducts[0]._id;
            sampleContent.attached_products[1].product_id = createdProducts[1]._id;

            const content = new CampaignContent(sampleContent);
            await content.save();
            console.log(`✅ Created content: ${content.title}`);

            // Create sample tracking data
            const trackingData = [
                {
                    content_id: content._id,
                    user_session_id: 'demo-session-1',
                    action_type: 'view',
                    metadata: { source: 'direct' }
                },
                {
                    content_id: content._id,
                    user_session_id: 'demo-session-1',
                    action_type: 'click',
                    product_id: createdProducts[0]._id,
                    metadata: { source: 'product_highlight' }
                },
                {
                    content_id: content._id,
                    user_session_id: 'demo-session-2',
                    action_type: 'view',
                    metadata: { source: 'social_media' }
                }
            ];

            for (const tracking of trackingData) {
                const track = new ContentTracking(tracking);
                await track.save();
            }

            console.log(`✅ Created ${trackingData.length} tracking records`);

            // Update content performance metrics
            content.performance_metrics = {
                views: 150,
                likes: 25,
                comments: 8,
                shares: 5,
                clicks: 12,
                conversions: 3,
                revenue: 1347 // 3 products sold
            };
            await content.save();

            console.log(`✅ Updated content performance metrics`);
        } else {
            console.log('⚠️  No products found to attach to content');
        }

        // Create sample customer data
        const sampleCustomer = new Customer({
            email: 'demo@customer.com',
            name: 'Demo Customer',
            phone: '+919876543210',
            preferences: {
                categories: ['skincare', 'haircare'],
                brands: [brand.brandName],
                price_range: { min: 100, max: 1000 }
            },
            total_purchases: 3,
            total_spent: 1347,
            last_purchase_date: new Date(),
            is_verified: true
        });

        await sampleCustomer.save();
        console.log(`✅ Created sample customer: ${sampleCustomer.email}`);

        console.log('🎉 Shoppable campaign data initialization completed!');
        console.log('\n📋 What was created:');
        console.log(`   • ${sampleProducts.length} products for campaign "${campaign.title}"`);
        console.log(`   • 1 influencer content post`);
        console.log(`   • 3 interaction tracking records`);
        console.log(`   • 1 sample customer`);
        console.log('\n🔗 Test the functionality:');
        console.log(`   • Customer shopping page: http://localhost:3000/campaign/${campaign._id}/shop`);
        console.log(`   • View campaign content and products`);
        console.log(`   • Test purchase flow (demo mode)`);

    } catch (error) {
        console.error('❌ Error initializing shoppable campaign data:', error);
        throw error;
    }
};

module.exports = initializeShoppableCampaignData;

// Run if called directly
if (require.main === module) {
    const { connectDB } = require('./mongoDB');

    const runInit = async () => {
        try {
            await connectDB();
            await initializeShoppableCampaignData();
            process.exit(0);
        } catch (error) {
            console.error('Initialization failed:', error);
            process.exit(1);
        }
    };

    runInit();
}
