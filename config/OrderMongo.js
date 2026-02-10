const { mongoose } = require('../models/mongoDB');

const orderSchema = new mongoose.Schema({
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductCustomer'
    },
    guest_info: {
        name: String,
        email: String,
        phone: String
    },
    items: [{
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price_at_purchase: {
            type: Number,
            required: true
        },
        subtotal: {
            type: Number,
            required: true
        }
    }],
    total_amount: {
        type: Number,
        required: true,
        min: 0
    },
    shipping_cost: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    payment_id: String,

    // Attribution logic
    referral_code: {
        type: String,
        index: true
    },
    influencer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InfluencerInfo'
    },
    commission_amount: {
        type: Number,
        default: 0
    },
    attribution_status: {
        type: String,
        enum: ['pending', 'paid', 'cancelled'],
        default: 'pending'
    }
}, {
    timestamps: true
});

const Order = mongoose.model('Order', orderSchema);

module.exports = { Order };
