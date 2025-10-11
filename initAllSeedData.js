const { initializeBrandData } = require('./initBrandData');
const { initializeInfluencerData } = require('./initInfluencerData');
const { initializeExtendedBrandData } = require('./initExtendedBrandData');
const { initializeExtendedInfluencerData } = require('./initExtendedInfluencerData');
const { initializeCampaignData } = require('./initCampaignData');
const { initializeCampaignMessageOfferData } = require('./initCampaignMessageOfferData');
const { initializeAdditionalCampaignData } = require('./initAdditionalCampaignData');

const initializeAllSeedData = async () => {
    try {
        console.log('🚀 Starting comprehensive seed data initialization...\n');

        // Initialize original brand data (5 brands)
        console.log('📊 Initializing original brand data...');
        await initializeBrandData();
        console.log('✅ Original brand data initialized successfully!\n');

        // Initialize original influencer data (5 influencers)
        console.log('👥 Initializing original influencer data...');
        await initializeInfluencerData();
        console.log('✅ Original influencer data initialized successfully!\n');

        // Initialize extended brand data (5 additional brands)
        console.log('📊 Initializing extended brand data...');
        await initializeExtendedBrandData();
        console.log('✅ Extended brand data initialized successfully!\n');

        // Initialize extended influencer data (5 additional influencers)
        console.log('👥 Initializing extended influencer data...');
        await initializeExtendedInfluencerData();
        console.log('✅ Extended influencer data initialized successfully!\n');

        // Initialize campaign data
        console.log('🎯 Initializing campaign data...');
        await initializeCampaignData();
        console.log('✅ Campaign data initialized successfully!\n');

        // Initialize campaign, message, and offer data
        console.log('📊 Initializing campaign, message, and offer data...');
        await initializeCampaignMessageOfferData();
        console.log('✅ Campaign, message, and offer data initialized successfully!\n');

        // Initialize additional campaign data
        console.log('🎯 Initializing additional campaign data...');
        await initializeAdditionalCampaignData();
        console.log('✅ Additional campaign data initialized successfully!\n');

        console.log('🎉 All seed data initialized successfully!');
        console.log('📋 Summary:');
        console.log('   • 10 Brand accounts created');
        console.log('   • 10 Influencer accounts created');
        console.log('   • 18 Campaigns with complete data (CampaignInfo, CampaignMetrics, CampaignPayments, CampaignInfluencers)');
        console.log('   • 8 Messages between brands and influencers');
        console.log('   • 6 Promotional offers from various brands');
        console.log('   • All related social and analytics data created\n');

        // Display credentials
        console.log('🔐 USER CREDENTIALS:');
        console.log('═══════════════════════════════════════════════════════════════');

        console.log('\n🏢 BRAND ACCOUNTS (Password: Brand@123)');
        console.log('───────────────────────────────────────────────────────────');
        const brandCredentials = [
            { name: 'Mamaearth', email: 'mamaearth@example.com', industry: 'Beauty & Personal Care' },
            { name: 'Boat', email: 'boat@example.com', industry: 'Electronics' },
            { name: 'Nykaa', email: 'nykaa@example.com', industry: 'E-commerce' },
            { name: 'Lenskart', email: 'lenskart@example.com', industry: 'Eyewear' },
            { name: 'Zomato', email: 'zomato@example.com', industry: 'Food Delivery' },
            { name: 'Swiggy', email: 'swiggy@example.com', industry: 'Food Delivery' },
            { name: 'Myntra', email: 'myntra@example.com', industry: 'E-commerce' },
            { name: 'Netflix India', email: 'netflix@example.com', industry: 'Entertainment' },
            { name: 'Urban Company', email: 'urbancompany@example.com', industry: 'Home Services' },
            { name: 'CRED', email: 'cred@example.com', industry: 'Fintech' }
        ];

        brandCredentials.forEach((brand, index) => {
            console.log(`${index + 1}. ${brand.name}`);
            console.log(`   📧 Email: ${brand.email}`);
            console.log(`   🔑 Password: Brand@123`);
            console.log(`   🏭 Industry: ${brand.industry}`);
            console.log('');
        });

        console.log('\n👤 INFLUENCER ACCOUNTS (Password: Influencer@123)');
        console.log('───────────────────────────────────────────────────────────');
        const influencerCredentials = [
            { name: 'Kusha Kapila', email: 'kusha@example.com', niche: 'Lifestyle & Comedy' },
            { name: 'Dolly Singh', email: 'dolly@example.com', niche: 'Comedy & Entertainment' },
            { name: 'Masoom Minawala', email: 'masoom@example.com', niche: 'Fashion & Lifestyle' },
            { name: 'Ranveer Allahbadia', email: 'ranveer@example.com', niche: 'Fitness & Motivation' },
            { name: 'Prajakta Koli', email: 'prajakta@example.com', niche: 'Comedy & Entertainment' },
            { name: 'Mithila Palkar', email: 'mithila@example.com', niche: 'Entertainment & Acting' },
            { name: 'Aashna Shroff', email: 'aashna@example.com', niche: 'Fashion & Lifestyle' },
            { name: 'Ashish Chanchlani', email: 'ashish@example.com', niche: 'Comedy & Entertainment' },
            { name: 'Diipa Khosla', email: 'diipa@example.com', niche: 'Fashion & Beauty' },
            { name: 'Rohan Joshi', email: 'rohan@example.com', niche: 'Comedy & Writing' }
        ];

        influencerCredentials.forEach((influencer, index) => {
            console.log(`${index + 1}. ${influencer.name}`);
            console.log(`   📧 Email: ${influencer.email}`);
            console.log(`   🔑 Password: Influencer@123`);
            console.log(`   🎯 Niche: ${influencer.niche}`);
            console.log('');
        });

        console.log('═══════════════════════════════════════════════════════════════');
        console.log('✨ All accounts are ready for testing!');
        console.log('💡 You can now login with any of these credentials to test the platform.');

        console.log('\n📊 DATABASE COLLECTIONS POPULATED:');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('🏢 Brand Collections:');
        console.log('   • BrandInfo: 10 records');
        console.log('   • BrandSocials: 10 records');
        console.log('   • BrandAnalytics: 10 records');
        console.log('\n👤 Influencer Collections:');
        console.log('   • InfluencerInfo: 10 records');
        console.log('   • InfluencerSocials: 10 records');
        console.log('   • InfluencerAnalytics: 10 records');
        console.log('\n🎯 Campaign Collections:');
        console.log('   • CampaignInfo: 18 records');
        console.log('   • CampaignMetrics: 18 records');
        console.log('   • CampaignPayments: 20 records');
        console.log('   • CampaignInfluencers: 24 records');
        console.log('\n💬 Message Collection:');
        console.log('   • Message: 8 records');
        console.log('\n🎁 Offer Collection:');
        console.log('   • Offer: 6 records');
        console.log('\n═══════════════════════════════════════════════════════════════');

    } catch (error) {
        console.error('❌ Error during seed data initialization:', error);
        process.exit(1);
    }
};

// Run the initialization
initializeAllSeedData();
