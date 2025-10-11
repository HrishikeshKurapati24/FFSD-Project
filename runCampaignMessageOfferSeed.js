#!/usr/bin/env node

/**
 * Campaign, Message, and Offer Seed Data Runner
 * 
 * This script initializes comprehensive seed data for:
 * - CampaignMongo collections (CampaignInfo, CampaignMetrics, CampaignPayments, CampaignInfluencers)
 * - MessageMongo collection (Message)
 * - OfferMongo collection (Offer)
 * 
 * Prerequisites: Brand and Influencer data must be initialized first
 */

const { initializeCampaignMessageOfferData } = require('./initCampaignMessageOfferData');

const main = async () => {
    try {
        console.log('🚀 Starting Campaign, Message, and Offer seed data initialization...\n');

        await initializeCampaignMessageOfferData();

        console.log('\n✅ All seed data initialized successfully!');
        console.log('\n📋 What was created:');
        console.log('   🎯 8 Campaigns with complete data (CampaignInfo, CampaignMetrics, CampaignPayments, CampaignInfluencers)');
        console.log('   💬 8 Messages between brands and influencers');
        console.log('   🎁 6 Promotional offers from various brands');
        console.log('\n💡 You can now test all campaign, messaging, and offer features!');

    } catch (error) {
        console.error('\n❌ Seed data initialization failed:');
        console.error(error.message);

        if (error.message.includes('Brands and influencers must be initialized first')) {
            console.log('\n🔧 To fix this issue:');
            console.log('   1. First run: node initBrandData.js');
            console.log('   2. Then run: node initInfluencerData.js');
            console.log('   3. Finally run: node initExtendedBrandData.js (optional)');
            console.log('   4. And run: node initExtendedInfluencerData.js (optional)');
            console.log('   5. Then run this script again');
        }

        process.exit(1);
    }
};

// Run the script
main();
