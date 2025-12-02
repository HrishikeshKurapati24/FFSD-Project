/*
 Script: find_missing_passwords.js
 Usage: node scripts/find_missing_passwords.js
 Purpose: Lists Brand, Influencer, Customer documents missing a password field or with an empty password.
*/

const mongoose = require('mongoose');
require('dotenv').config();

const { BrandInfo } = require('../config/BrandMongo');
const { InfluencerInfo } = require('../config/InfluencerMongo');
const { Customer } = require('../config/CustomerMongo');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/ffsd';

async function run() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const brandMissing = await BrandInfo.find({ $or: [{ password: { $exists: false } }, { password: null }, { password: '' }] }).select('email brandName _id').lean();
    const inflMissing = await InfluencerInfo.find({ $or: [{ password: { $exists: false } }, { password: null }, { password: '' }] }).select('email fullName _id').lean();
    const custMissing = await Customer.find({ $or: [{ password: { $exists: false } }, { password: null }, { password: '' }] }).select('email name _id').lean();

    console.log('\nBrands missing password hashes:', brandMissing.length);
    brandMissing.forEach(b => console.log(` - ${b._id}  | ${b.email} | ${b.brandName || ''}`));

    console.log('\nInfluencers missing password hashes:', inflMissing.length);
    inflMissing.forEach(i => console.log(` - ${i._id}  | ${i.email} | ${i.fullName || ''}`));

    console.log('\nCustomers missing password hashes:', custMissing.length);
    custMissing.forEach(c => console.log(` - ${c._id}  | ${c.email} | ${c.name || ''}`));

    console.log('\nIf accounts are listed, consider resetting their passwords via your admin UI or use a migration to set temporary hashed passwords and force users to reset.');

    await mongoose.disconnect();
    console.log('Disconnected.');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
