const { connectDB, closeConnection } = require('../models/mongoDB');
const { Customer } = require('../config/CustomerMongo');
const bcrypt = require('bcrypt');

async function migrate() {
    try {
        await connectDB();
        console.log('Connected to DB');

        const customers = await Customer.find().select('+password');
        console.log(`Found ${customers.length} customers`);

        let updated = 0;
        for (const c of customers) {
            const pw = c.password || '';
            // Common bcrypt hashes start with $2a$, $2b$, or $2y$
            if (!pw.startsWith('$2')) {
                const hashed = await bcrypt.hash(pw, 10);
                c.password = hashed;
                await c.save();
                updated++;
                console.log(`Re-hashed password for ${c.email || c._id}`);
            }
        }

        console.log(`Migration complete. Updated ${updated} customers.`);
        await closeConnection();
        process.exit(0);
    } catch (err) {
        console.error('Migration error:', err);
        try { await closeConnection(); } catch (e) {}
        process.exit(1);
    }
}

migrate();
