const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// MongoDB connection URL
const MONGODB_URL = 'mongodb://localhost:27017/Collab_Sync_DB';

// Connection state tracking
let isConnected = false;

// Function to connect to MongoDB
async function connectDB() {
    if (isConnected) {
        console.log('Using existing MongoDB connection');
        return;
    }

    try {
        await mongoose.connect(MONGODB_URL);
        isConnected = true;
        console.log('✅ MongoDB connected successfully');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err);
        throw err;
    }
}

// Function to close MongoDB connection
async function closeConnection() {
    if (!isConnected) {
        return;
    }

    try {
        await mongoose.connection.close();
        isConnected = false;
        console.log('MongoDB connection closed');
    } catch (err) {
        console.error('Error closing MongoDB connection:', err);
        throw err;
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    await closeConnection();
    process.exit(0);
});

// Define Admin Schema with improved validation
const adminSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        trim: true,
        minlength: 3
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        default: 'admin',
        enum: ['admin', 'moderator', 'staff']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    collection: 'adminUser',
    timestamps: true
});

const Admin = mongoose.model('Admin', adminSchema);

// Function to initialize admin users
async function initializeAdminUsers() {
    try {
        // Check if admin users already exist
        const existingAdmins = await Admin.countDocuments();
        console.log(`Found ${existingAdmins} existing admin users`);

        if (existingAdmins === 0) {
            // Hash passwords
            const saltRounds = 10;
            const adminPassword = await bcrypt.hash('admin123', saltRounds);
            const modPassword = await bcrypt.hash('modpass', saltRounds);
            const staffPassword = await bcrypt.hash('staffpass', saltRounds);

            // Create admin users
            const adminUsers = [
                {
                    userId: "admin001",
                    username: "admin",
                    password: adminPassword,
                    role: "admin"
                },
                {
                    userId: "mod001",
                    username: "moderator",
                    password: modPassword,
                    role: "moderator"
                },
                {
                    userId: "staff001",
                    username: "staffuser",
                    password: staffPassword,
                    role: "staff"
                }
            ];

            // Insert admin users one by one to handle potential duplicates
            for (const user of adminUsers) {
                try {
                    const existingUser = await Admin.findOne({ userId: user.userId });
                    if (!existingUser) {
                        await Admin.create(user);
                        console.log(`✅ Created admin user: ${user.username}`);
                    } else {
                        console.log(`ℹ️ Admin user ${user.username} already exists, skipping`);
                    }
                } catch (err) {
                    console.error(`❌ Error creating admin user ${user.username}:`, err.message);
                }
            }

            console.log('✅ Admin users initialization completed');
            console.log('Default credentials:');
            console.log('- Admin: username: admin, password: admin123');
            console.log('- Moderator: username: moderator, password: modpass');
            console.log('- Staff: username: staffuser, password: staffpass');
        } else {
            console.log('ℹ️ Admin users already exist, skipping initialization');
        }
    } catch (error) {
        console.error('❌ Error initializing admin users:', error);
        // Don't throw the error, just log it and continue
        console.log('⚠️ Continuing with application startup despite admin initialization error');
    }
}

module.exports = {
    Admin,
    mongoose,
    connectDB,
    closeConnection,
    initializeAdminUsers
};