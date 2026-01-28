const mongoose = require('mongoose');
const { BrandInfo } = require('./config/BrandMongo');
const { InfluencerInfo } = require('./config/InfluencerMongo');
const { CampaignInfo, CampaignPayments } = require('./config/CampaignMongo');
const { connectDB, closeConnection } = require('./models/mongoDB');

const seedPayments = async () => {
    try {
        await connectDB();
        console.log('Connected to MongoDB');

        // 1. Find the Onion Shampoo Campaign
        const campaign = await CampaignInfo.findOne({ title: "Onion Shampoo Hair Fall Control" });
        if (!campaign) {
            console.error('Campaign not found. Please run seed_active_mamaearth_campaign.js first.');
            process.exit(1);
        }
        console.log(`Found Campaign: ${campaign.title}`);

        // 2. Find Influencers
        const targetEmails = ['dolly@example.com', 'prajakta@example.com'];
        const emailRegexes = targetEmails.map(email => new RegExp(`^${email}$`, 'i'));
        const influencers = await InfluencerInfo.find({ email: { $in: emailRegexes } });

        console.log(`Found ${influencers.length} influencers for payments.`);
        console.log(`Campaign Budget: ${campaign.budget}`);

        // Calculate safe payment amount (e.g., 5% of budget per influencer)
        // This ensures total for 2 influencers (10%) is well below budget (100%)
        const paymentPerInfluencer = Math.floor(campaign.budget * 0.05);

        // 3. Create Payments
        let totalPaid = 0;
        for (const influencer of influencers) {
            // Check if payment already exists
            let payment = await CampaignPayments.findOne({
                campaign_id: campaign._id,
                influencer_id: influencer._id
            });

            if (!payment) {
                payment = await CampaignPayments.create({
                    campaign_id: campaign._id,
                    brand_id: campaign.brand_id,
                    influencer_id: influencer._id,
                    amount: paymentPerInfluencer,
                    status: 'completed',
                    payment_date: new Date(),
                    payment_method: 'bank_transfer'
                });
                console.log(`Created payment for ${influencer.fullName}: ${payment.amount}`);
            } else {
                console.log(`Payment already exists for ${influencer.fullName}: ${payment.amount}`);
            }
            totalPaid += payment.amount;
        }

        console.log('------------------------------------------------');
        console.log(`Total Paid: ${totalPaid}`);
        console.log(`Campaign Budget: ${campaign.budget}`);
        if (totalPaid < campaign.budget) {
            console.log('SUCCESS: Total paid is within budget.');
        } else {
            console.error('WARNING: Total paid exceeds budget!');
        }
        console.log('------------------------------------------------');

        console.log('Payment seeding completed!');

    } catch (error) {
        console.error('Error in seed payments:', error);
    } finally {
        await closeConnection();
    }
};

seedPayments();
