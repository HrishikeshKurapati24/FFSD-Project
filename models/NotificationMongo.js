const { mongoose } = require('../mongoDB');

const notificationSchema = new mongoose.Schema({
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    recipientType: {
        type: String,
        enum: ['brand', 'influencer', 'admin', 'system'],
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId
    },
    senderType: {
        type: String,
        enum: ['brand', 'influencer', 'admin', 'system'],
        default: 'system'
    },
    type: {
        type: String,
        required: true
    },
    title: {
        type: String
    },
    body: {
        type: String
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId
    },
    data: {
        type: mongoose.Schema.Types.Mixed
    },
    read: {
        type: Boolean,
        default: false
    },
    // Optional expiry date — when set, MongoDB TTL index auto-deletes the document
    expiresAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Compound index covering the real query: find unread notifications for a user, newest first
notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });
// TTL index: auto-delete notifications after expiresAt (set to null = never expires)
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = { Notification };
