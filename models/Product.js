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

const productSchema = new mongoose.Schema({
    brand_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
    campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
    name_product: { type: String, required: true },
    description: String,
    images: [String],
    original_price: Number,
    campaign_price: Number,
    category: { type: String, enum: CATEGORIES_ENUM },
    target_quantity: Number,
    sold_quantity: { type: Number, default: 0 },
    delivery_info: {
        estimated_days: Number,
        shipping_cost: Number
    },
    status: { type: String, enum: ["active", "inactive", "out_of_stock", "discontinued"] },
    attributed_influencer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Influencer' }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

module.exports = { Product };
