// cleanupSubscriptionPlans.js
// Run this script to remove Pro plans from the database and ensure only 3 plans exist

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/collabsync', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const { SubscriptionPlan } = require('./config/SubscriptionMongo');

async function cleanupPlans() {
  try {
    console.log('Starting subscription plan cleanup...\n');

    // 1. Remove all Pro plans
    const deleteResult = await SubscriptionPlan.deleteMany({ name: 'Pro' });
    console.log(`✓ Deleted ${deleteResult.deletedCount} Pro plan(s)`);

    // 2. Remove any Enterprise plans (if they exist)
    const deleteEnterpriseResult = await SubscriptionPlan.deleteMany({ name: 'Enterprise' });
    console.log(`✓ Deleted ${deleteEnterpriseResult.deletedCount} Enterprise plan(s)`);

    // 3. List remaining plans
    const remainingPlans = await SubscriptionPlan.find().sort({ userType: 1, name: 1 });
    console.log(`\n✓ Remaining plans: ${remainingPlans.length}`);
    
    console.log('\nPlan Summary:');
    console.log('─────────────────────────────────────────────────');
    
    const brandPlans = remainingPlans.filter(p => p.userType === 'brand');
    const influencerPlans = remainingPlans.filter(p => p.userType === 'influencer');
    
    console.log('\nBrand Plans:');
    brandPlans.forEach(plan => {
      console.log(`  - ${plan.name}: $${plan.price.monthly}/month, $${plan.price.yearly}/year`);
    });
    
    console.log('\nInfluencer Plans:');
    influencerPlans.forEach(plan => {
      console.log(`  - ${plan.name}: $${plan.price.monthly}/month, $${plan.price.yearly}/year`);
    });

    // 4. Verify we have exactly 3 plans per user type
    if (brandPlans.length !== 3) {
      console.log(`\n⚠ WARNING: Expected 3 brand plans, found ${brandPlans.length}`);
    }
    if (influencerPlans.length !== 3) {
      console.log(`\n⚠ WARNING: Expected 3 influencer plans, found ${influencerPlans.length}`);
    }

    if (brandPlans.length === 3 && influencerPlans.length === 3) {
      console.log('\n✓ SUCCESS: All plans are correctly configured!');
    }

    console.log('\n─────────────────────────────────────────────────');
    console.log('Cleanup completed successfully!');
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
}

// Run the cleanup
cleanupPlans();
