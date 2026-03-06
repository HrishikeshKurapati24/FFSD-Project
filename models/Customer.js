const { mongoose } = require('../mongoDB');

const CATEGORIES_ENUM = [
    'Fashion & Apparel', 'Beauty & Personal Care', 'Health & Wellness',
    'Fitness & Sports', 'Food & Beverage', 'Travel & Hospitality',
    'Technology & Gadgets', 'Gaming & Esports', 'Entertainment & Pop Culture',
    'Education & Career', 'Finance & Business', 'Home, Garden & Decor',
    'Parenting & Family', 'Pets & Animals', 'Automotive',
    'Art & Photography', 'Books & Literature', 'Music & Audio',
    'Real Estate', 'Other'
];

const customerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: String,
    is_verified: { type: Boolean, default: false },
    location: {
        city: String,
        state: String,
        country: String
    },
    preferences: {
        categories: [{ type: String, enum: CATEGORIES_ENUM }],
        brands: [String],
        price_range: {
            min: Number,
            max: Number
        }
    },
    total_purchases: { type: Number, default: 0 },
    total_spent: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive", "suspended", "banned"] },
    last_purchase_date: { type: Date, default: null },
    active_order_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    stripeCustomerId: String,
    defaultPaymentMethodId: String,
    billingAddress: String
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    items: [{
        product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: Number,
        price_at_purchase: Number,
        brand_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
        influencer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Influencer' }
    }],
    total_amount: Number,
    shipping_cost: Number,
    status_history: [{
        status: { type: String, enum: ["pending", "paid", "shipped", "delivered", "cancelled"] },
        timestamp: Date,
        tracking_number: String,
        shipping_address: {
            address_line1: String
        },
        shipping_cost: Number
    }]
}, { timestamps: true });

const Customer = mongoose.model('Customer', customerSchema);
const Order = mongoose.model('Order', orderSchema);

module.exports = { Customer, Order };
