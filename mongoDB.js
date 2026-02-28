const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// MongoDB connection URL
const MONGODB_URL = process.env.MONGO_URI;

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

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

module.exports = {
    Admin,
    mongoose,
    connectDB,
    closeConnection
};