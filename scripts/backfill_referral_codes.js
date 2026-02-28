const { mongoose } = require('../mongoDB');
const { InfluencerInfo } = require('../config/InfluencerMongo');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const backfillReferralCodes = async () => {
    try {
        // Connect to MongoDB
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI);
            console.log('✅ Connected to MongoDB');
        }

        // Find influencers without referral codes
        const influencers = await InfluencerInfo.find({
            $or: [
                { referralCode: { $exists: false } },
                { referralCode: null },
                { referralCode: "" }
            ]
        });

        console.log(`Found ${influencers.length} influencers needing referral codes.`);

        let updatedCount = 0;

        for (const influencer of influencers) {
            // Generate referral code: First 4 letters of name + 3 random digits
            const namePart = (influencer.fullName || influencer.name || "INFL").split(' ')[0].substring(0, 4).toUpperCase();
            const randomPart = Math.floor(100 + Math.random() * 900); // 3 digit number
            let code = `${namePart}${randomPart}`;

            // Ensure uniqueness (basic check, though collision low for backfill)
            let isUnique = false;
            while (!isUnique) {
                const existing = await InfluencerInfo.findOne({ referralCode: code });
                if (!existing) {
                    isUnique = true;
                } else {
                    const newRandom = Math.floor(100 + Math.random() * 900);
                    code = `${namePart}${newRandom}`;
                }
            }

            influencer.referralCode = code;
            await influencer.save();
            console.log(`Updated ${influencer.fullName} with code: ${code}`);
            updatedCount++;
        }

        console.log(`\n🎉 Successfully backfilled ${updatedCount} referral codes.`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Error backfilling referral codes:', error);
        process.exit(1);
    }
};

backfillReferralCodes();
