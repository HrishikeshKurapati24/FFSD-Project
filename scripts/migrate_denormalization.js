const { BrandInfo } = require('../models/BrandMongo');
const { InfluencerInfo } = require('../models/InfluencerMongo');
const { CampaignInfo, CampaignInfluencers } = require('../models/CampaignMongo');
const { mongoose } = require('../mongoDB');

async function migrate() {
    console.log('Starting Phase 3 Denormalization Migration...');

    try {
        // 1. Migrate Brand Names to CampaignInfo
        const campaigns = await CampaignInfo.find({ brandName: { $exists: false } });
        console.log(`Found ${campaigns.length} campaigns to update...`);

        for (const campaign of campaigns) {
            const brand = await BrandInfo.findById(campaign.brand_id).lean();
            if (brand) {
                await CampaignInfo.updateOne(
                    { _id: campaign._id },
                    { $set: { brandName: brand.brandName } }
                );
            }
        }
        console.log('CampaignInfo migration complete.');

        // 2. Migrate Influencer Metadata to CampaignInfluencers
        const links = await CampaignInfluencers.find({ influencerName: { $exists: false } });
        console.log(`Found ${links.length} influencer links to update...`);

        for (const link of links) {
            const influencer = await InfluencerInfo.findById(link.influencer_id).lean();
            if (influencer) {
                await CampaignInfluencers.updateOne(
                    { _id: link._id },
                    {
                        $set: {
                            influencerName: influencer.displayName || influencer.fullName || 'Unknown',
                            influencerAvatar: influencer.profilePicUrl
                        }
                    }
                );
            }
        }
        console.log('CampaignInfluencers migration complete.');

        console.log('Migration finished successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (require.main === module && mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
    }
}
module.exports = { runMigration: migrate };
