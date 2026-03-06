const { mongoose } = require('../mongoDB');

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
        default: 'pending',
        index: true
    },
    payment_id: String,

    shipping_address: {
        name: String,
        address_line1: String,
        address_line2: String,
        city: String,
        state: String,
        zip_code: String,
        country: String
    },

    // Order Tracking
    tracking_number: {
        type: String,
        unique: true,
        sparse: true,
        index: true
    },
    status_history: [{
        status: {
            type: String,
            enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        notes: String
    }],
    estimated_delivery_date: Date,

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

// Add index on customer_id for faster queries
orderSchema.index({ customer_id: 1, status: 1 });

// Pre-save hook to generate tracking number if not present
orderSchema.pre('save', function (next) {
    if (!this.tracking_number && this.isNew) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.tracking_number = `TRK-${timestamp}-${random}`;
    }
    next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = { Order };
