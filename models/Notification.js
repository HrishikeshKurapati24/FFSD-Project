const { mongoose } = require('../mongoDB');

const notificationSchema = new mongoose.Schema({
    receipientId: { type: mongoose.Schema.Types.ObjectId, required: true },
    receipientType: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, required: true },
    link_to: String,
    action: {
        type: { type: String },
        url: String,
        modalType: String
    },
    expiresAt: Date,
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = { Notification };
