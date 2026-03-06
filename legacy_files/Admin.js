const mongoose = require('mongoose');

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

module.exports = Admin;
