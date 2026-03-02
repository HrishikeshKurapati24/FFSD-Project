require('dotenv').config();
const { connectDB, closeConnection } = require('./mongoDB');
const { Admin } = require('./mongoDB');
const bcrypt = require('bcrypt');

async function resetAdminUsers() {
    await connectDB();

    // Delete ALL existing admin users so we can re-seed with correct roles
    const deleted = await Admin.deleteMany({});
    console.log(`🗑️  Deleted ${deleted.deletedCount} old admin user(s)`);

    // Re-seed with 4 correct roles
    const admins = [
        { userId: 'superadmin-001', username: 'superadmin', password: 'Admin@123', role: 'superadmin' },
        { userId: 'community-001', username: 'community01', password: 'Community@123', role: 'community' },
        { userId: 'finance-001', username: 'finance01', password: 'Finance@123', role: 'finance' },
        { userId: 'analyst-001', username: 'analyst01', password: 'Analyst@123', role: 'analyst' },
    ];

    for (const a of admins) {
        const hash = await bcrypt.hash(a.password, 10);
        await Admin.create({ userId: a.userId, username: a.username, password: hash, role: a.role });
        console.log(`✅ Created: ${a.username} (${a.role})`);
    }

    console.log('\n🔐 Final Admin Credentials:');
    console.log('   superadmin  / Admin@123        (full access)');
    console.log('   community01 / Community@123    (Dashboard, UserManagement, FeedbackAndModeration)');
    console.log('   finance01   / Finance@123      (Dashboard, CustomerManagement, PaymentVerification)');
    console.log('   analyst01   / Analyst@123      (Dashboard, AdvancedAnalytics, CollaborationMonitoring)');

    await closeConnection();
    console.log('\n✅ Done!');
}

resetAdminUsers().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
