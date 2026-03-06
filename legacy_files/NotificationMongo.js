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
    }
}, { timestamps: true });

notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = { Notification };
