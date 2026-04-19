const { Admin } = require('../../mongoDB');
const bcrypt = require('bcrypt');

/**
 * Seeds default admin users into the database.
 *
 * Roles and access:
 * - superadmin  : full access to all admin pages
 * - community   : Dashboard, UserManagement, FeedbackAndModeration
 * - finance     : Dashboard, CustomerManagement, PaymentVerification
 * - analyst     : Dashboard, AdvancedAnalytics, CollaborationMonitoring
 */
const initializeAdminUsers = async () => {
    const defaultAdmins = [
        {
            userId: 'superadmin-001',
            username: 'superadmin',
            password: 'Admin@123',
            role: 'superadmin'
        },
        {
            userId: 'community-001',
            username: 'community01',
            password: 'Community@123',
            role: 'community'
        },
        {
            userId: 'finance-001',
            username: 'finance01',
            password: 'Finance@123',
            role: 'finance'
        },
        {
            userId: 'analyst-001',
            username: 'analyst01',
            password: 'Analyst@123',
            role: 'analyst'
        }
    ];

    let created = 0;
    let skipped = 0;

    for (const adminData of defaultAdmins) {
        try {
            const existing = await Admin.findOne({ userId: adminData.userId });
            if (existing) {
                // Update role if it changed (handles re-seeding after role enum change)
                if (existing.role !== adminData.role) {
                    await Admin.updateOne({ userId: adminData.userId }, { role: adminData.role });
                    console.log(`🔄 Updated role for "${adminData.username}" to "${adminData.role}"`);
                }
                skipped++;
                continue;
            }

            const hashedPassword = await bcrypt.hash(adminData.password, 10);
            await Admin.create({
                userId: adminData.userId,
                username: adminData.username,
                password: hashedPassword,
                role: adminData.role
            });
            created++;
        } catch (error) {
            if (error.code === 11000) {
                skipped++;
            } else {
                console.error(`Error creating admin user "${adminData.username}":`, error.message);
            }
        }
    }

    if (created > 0) {
        console.log(`✅ Admin users seeded: ${created} created, ${skipped} already exist`);
    } else {
        console.log(`✅ Admin users already exist (${skipped} found)`);
    }

    console.log('🔐 Admin Credentials:');
    console.log('   superadmin   / Admin@123        (role: superadmin  — full access)');
    console.log('   community01  / Community@123    (role: community   — Dashboard, UserMgmt, Feedback)');
    console.log('   finance01    / Finance@123      (role: finance     — Dashboard, CustomerMgmt, Payment)');
    console.log('   analyst01    / Analyst@123      (role: analyst     — Dashboard, AdvancedAnalytics, Collab)');
};

module.exports = { initializeAdminUsers };
