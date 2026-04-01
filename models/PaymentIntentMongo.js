const { mongoose } = require('../mongoDB');

const paymentIntentSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['subscription', 'campaign', 'order'],
        required: true,
        index: true
    },
    payerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        index: true
    },
    payerType: {
        type: String,
        enum: ['BrandInfo', 'InfluencerInfo', 'Customer', 'Guest', 'System'],
        default: 'System'
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'INR',
        uppercase: true,
        trim: true
    },
    receipt: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'order_created', 'authorized', 'captured', 'failed', 'cancelled'],
        default: 'pending',
        index: true
    },
    razorpay: {
        orderId: { type: String, trim: true, index: true },
        paymentId: { type: String, trim: true, index: true },
        signature: { type: String, trim: true },
        signatureVerified: { type: Boolean, default: false },
        paymentStatus: { type: String, trim: true },
        webhookVerified: { type: Boolean, default: false },
        lastWebhookEventId: { type: String, trim: true },
        notes: { type: mongoose.Schema.Types.Mixed, default: {} }
    },
    context: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    businessApplied: {
        type: Boolean,
        default: false,
        index: true
    },
    businessAppliedAt: {
        type: Date
    },
    failureReason: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

paymentIntentSchema.index({ type: 1, createdAt: -1 });
paymentIntentSchema.index({ 'razorpay.orderId': 1, status: 1 });

const PaymentIntent = mongoose.models.PaymentIntent || mongoose.model('PaymentIntent', paymentIntentSchema);

module.exports = {
    PaymentIntent
};
